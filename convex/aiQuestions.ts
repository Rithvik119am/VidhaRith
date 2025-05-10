// convex/aiQuestions.ts
import { v,ConvexError } from "convex/values";
import { action, internalMutation, internalQuery } from "./_generated/server"; // Added internalQuery
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// --- Vercel AI SDK v3 Imports ---
import { generateText } from 'ai';
import { google } from '@ai-sdk/google'; // Use the newer @ai-sdk/google provider
import { rateLimiter } from "./rate_limit";
//-------Google gemini sdk imports----
import {GoogleGenAI} from '@google/genai';
// Define the expected structure (Keep as is)
interface GeneratedQuestion {
    question: string;
    selectOptions: string[];
    answer: string;
}

// --- Internal Mutation: Adds generated questions to the DB (Keep as is) ---
export const internal_addGeneratedQuestions = internalMutation({
    args: {
        formId: v.id("forms"),
        generatedQuestions: v.array(
            v.object({
                question: v.string(),
                selectOptions: v.array(v.string()),
                answer: v.string(),
            })
        ),
        userId: v.string(), // Pass userId for validation
    },
    handler: async (ctx, args) => {
        const form = await ctx.db.get(args.formId);
        if (!form) {
            throw new ConvexError("Target form not found.");
        }
        if (form.createdBy !== args.userId) {
             throw new ConvexError("User mismatch - cannot add questions to this form.");
        }

        const existingQuestions = await ctx.db
            .query("form_questions")
            .withIndex("by_formId", q => q.eq("formId", args.formId))
            .order("desc")
            .first();

        let currentMaxOrder = existingQuestions ? existingQuestions.order : BigInt(0);

        const validQuestions = args.generatedQuestions.filter(q =>
            q && typeof q.question === 'string' && q.question.trim() !== '' &&
            Array.isArray(q.selectOptions) && q.selectOptions.length >= 2 && // Ensure at least 2 options
            typeof q.answer === 'string' && q.answer.trim() !== '' &&
            q.selectOptions.map(opt => typeof opt === 'string' ? opt.trim() : '').includes(q.answer.trim()) && // Check answer exists in options
            q.selectOptions.every(opt => typeof opt === 'string' && opt.trim() !== '') // Ensure all options are non-empty strings
        );

        if (validQuestions.length !== args.generatedQuestions.length) {
             console.warn(`Filtered out ${args.generatedQuestions.length - validQuestions.length} invalid questions from LLM response before saving.`);
        }

        if (validQuestions.length === 0 && args.generatedQuestions.length > 0) {
             console.error("All questions received from LLM were invalid.", args.generatedQuestions);
             throw new ConvexError("LLM response parsed, but contained no valid questions meeting the criteria.");
         }

        for (const q of validQuestions) {
            currentMaxOrder = currentMaxOrder + BigInt(1);
            await ctx.db.insert("form_questions", {
                formId: args.formId,
                question: q.question.trim(),
                order: currentMaxOrder,
                type: "mcq",
                selectOptions: q.selectOptions.map(opt => opt.trim()),
                answer: q.answer.trim(),
            });
        }
        console.log(`Added ${validQuestions.length} questions to form ${args.formId}`);
    },
});

// --- Internal Mutation: Set the generation status of a form ---
export const internal_setGenerationStatus = internalMutation({
    args: {
        formId: v.id("forms"),
        status: v.union(v.literal("not generating"), v.literal("generating")),
        userId: v.string(), // Pass userId for validation
    },
    handler: async (ctx, args) => {
        const form = await ctx.db.get(args.formId);
        if (!form) {
            console.error(`Attempted to set status for non-existent form: ${args.formId}`);
            return; // Silently fail or log, as this might be called in a cleanup
        }
        // Basic ownership check
        if (form.createdBy !== args.userId) {
             console.error(`User ${args.userId} attempted to change generationStatus for form ${args.formId} owned by ${form.createdBy}`);
             // Depending on desired strictness, you might throw here, but in cleanup maybe just log and exit.
             return;
        }
        await ctx.db.patch(args.formId, { generationStatus: args.status });
        console.log(`Set generationStatus for form ${args.formId} to "${args.status}"`);
    },
});


// --- Action: Fetches file, calls LLM via Vercel AI SDK v3, schedules mutation ---
export const generateQuestions = action({
    args: {
        formId: v.id("forms"),
        fileStorageId: v.id("_storage"),
        numberOfQuestions: v.number(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new ConvexError("User must be logged in to generate questions.");
        }
        await rateLimiter.check(ctx, "generateQuestions", { key: identity.subject ,throws: true});

        const form = await ctx.runQuery(internal.forms.getFormForOwner, { formId: args.formId });
         if (!form || form.createdBy !== identity.subject) {
             throw new ConvexError("Form not found or you don't have permission to generate questions for it.");
         }

        // Check if generation is already in progress
        if (form.generationStatus === "generating") {
             throw new ConvexError("Question generation is already in progress for this form.");
        }

        // 1. Validate number of questions
        if (args.numberOfQuestions <= 0 || !Number.isInteger(args.numberOfQuestions)) {
             throw new ConvexError("Number of questions must be a positive integer.");
        }
        const MAX_QUESTIONS = 50;
        if (args.numberOfQuestions > MAX_QUESTIONS) {
            throw new ConvexError(`Cannot generate more than ${MAX_QUESTIONS} questions at a time.`);
        }

        // --- Set status to 'generating' ---
        // We don't await this immediately, it runs in parallel.
        // The finally block will ensure it's reset.
        await ctx.runMutation(internal.aiQuestions.internal_setGenerationStatus, {
            formId: args.formId,
            status: "generating",
            userId: identity.subject,
        });

        try {
            // 2. Authorize access & Get File Record
            const fileRecord = await ctx.runQuery(internal.files.getFileRecordByStorageId, { storageId: args.fileStorageId });
            if (!fileRecord) {
                 throw new ConvexError("File not found.");
            }
            if (fileRecord.userId !== identity.subject) {
                 throw new ConvexError("User is not authorized to use this file.");
            }

            // --- Check file MIME type (Important for Gemini) ---
            // Note: This list is for broad compatibility. Check Gemini docs for exact supported types and sizes.
            const supportedMimeTypes = [
                'application/pdf', 'text/plain', 'text/markdown', 'text/csv',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
                'application/msword', 'image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif',
                'video/mov', 'video/mpeg', 'video/mp4', 'video/mpg', 'video/avi', 'video/wmv', 'video/mpegps', 'video/flv',
                'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/aac', 'audio/amr', 'audio/mid'
            ];
             if (!fileRecord.type || !supportedMimeTypes.includes(fileRecord.type)) {
                 console.warn(`File type "${fileRecord.type}" might not be directly processable by the AI or optimally supported. Results may vary.`);
                 // Consider throwing an error for definitely incompatible types if needed.
                 // throw new ConvexError(`Unsupported file type: ${fileRecord.type}.`);
             }

            // 3. Get the file content from storage as ArrayBuffer
            const fileBlob = await ctx.storage.get(args.fileStorageId);
            if (!fileBlob) {
                throw new ConvexError("Could not retrieve file content from storage.");
            }
            const fileArrayBuffer = await fileBlob.arrayBuffer(); // Get the ArrayBuffer
            // --- Google API Key Check (Using the standard env var for @ai-sdk/google) ---
            const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
            if (!apiKey) {
                console.error("Missing GOOGLE_GENERATIVE_AI_API_KEY environment variable in Convex deployment.");
                throw new ConvexError("AI Service configuration error. Please contact support."); // User-friendly error
            }
            // NOTE: The key is not passed directly to google() but used implicitly by the provider.

            // 4. --- LLM API Call using Vercel AI SDK v3 ---
            console.log(`Generating ${args.numberOfQuestions} questions from file: ${fileRecord.name} (Type: ${fileRecord.type}, Size: ${fileArrayBuffer.byteLength} bytes)`); // Use byteLength for ArrayBuffer size

            // Define the text part of the prompt
            const textPrompt = `

You are an expert question designer tasked with creating challenging, high-quality multiple-choice questions for an advanced quiz system. Your goal is to generate questions that assess a deep understanding of a given source.

Based *solely* on the content of the provided file **${fileRecord.name}**, generate exactly **${args.numberOfQuestions}** multiple-choice questions (MCQs).

**Guidelines:**

* Do **not** copy text directly from the file.
* Do **not** include any references to the file, document, or its origin in the questions.
* Do **not** include any introductory text, explanations, or markdown.
* Ensure questions are moderately complex and require a thoughtful understanding of the material.
* Cover a diverse range of concepts within the file.
* Try to randomize the location of the correct answer among the options.

Each question must be a JSON object with the following structure:

1. \`"question"\` - A clear, standalone question string.
2. \`"selectOptions"\` - An array of **exactly 4 distinct** answer choices (strings).
3. \`"answer"\` - A string that **exactly matches** one of the entries in \`"selectOptions"\`.

**Output format:** A single JSON array containing only the question objects.

**Example:**

\`\`\`json
[
 {
  "question": "What is the main purpose of dependency injection in software architecture?",
  "selectOptions": ["Improve testability", "Speed up execution", "Reduce memory usage", "Handle UI updates"],
  "answer": "Improve testability"
 }
]
\`\`\` ` // Added array brackets to the example to match expected output format

                // Use generateText following the example structure
                const result = await generateText({
                    //model: google('gemma-3-27b-it'), // Select model via provider
                    model: google('gemini-2.0-flash'),
                    messages: [
                        {
                            role: 'user',
                            content: [ // Array for multimodal input
                                { type: 'text', text: textPrompt },
                                {
                                    type: 'file',
                                    data: fileArrayBuffer,      // <<< PASS ArrayBuffer DIRECTLY
                                    mimeType: fileRecord.type   // Pass the correct MIME type
                                }
                            ]
                        }
                    ],
                     // Optional: Configure model parameters if needed
                     // temperature: 0.5,
                     // maxTokens: 2048,
                     // responseFormat: { type: 'json_object' } // Requires compatible model & SDK handling
                });

                const responseText = result.text;
                console.log("LLM Raw Response Text:", responseText);
                console.log("LLM Finish Reason:", result.finishReason);
                console.log("LLM Token Usage:", result.usage);

                // --- Robust JSON Parsing (Keep similar logic) ---
                let cleanedText = responseText.trim();
                const jsonMatch = cleanedText.match(/```json\s*([\s\S]*?)\s*```/);
                 if (jsonMatch && jsonMatch[1]) {
                    cleanedText = jsonMatch[1].trim();
                 } else {
                     const firstBracket = cleanedText.indexOf('[');
                     const lastBracket = cleanedText.lastIndexOf(']');
                     if (firstBracket !== -1 && lastBracket !== -1 && firstBracket < lastBracket) {
                         cleanedText = cleanedText.substring(firstBracket, lastBracket + 1);
                     } else {
                         // If no code block or array found, assume the whole response might be the JSON (less robust)
                         console.warn("Could not find JSON code block or array in LLM response.");
                     }
                 }

                let generatedQuestions: GeneratedQuestion[];
                try {
                    generatedQuestions = JSON.parse(cleanedText);
                } catch (error) {
                    console.error("Failed to parse LLM response as JSON:", error);
                    console.error("Cleaned LLM Response Text for parsing:", cleanedText);
                    // Throw a user-friendly error indicating parsing failed
                    throw new ConvexError(`Failed to process AI response. Could not understand the generated questions (Finish Reason: ${result.finishReason}). Please try again or adjust parameters. Response snippet: ${cleanedText.substring(0, 200)}...`);
                }

                console.log("Parsed LLM Response (initial):", generatedQuestions);

                // 5. Validate array structure (basic check)
                if (!Array.isArray(generatedQuestions)) {
                     console.error("Parsed LLM response is not an array:", generatedQuestions);
                     throw new ConvexError("AI did not return a valid list of questions.");
                }
                if (generatedQuestions.length === 0 && args.numberOfQuestions > 0) {
                     console.warn("LLM returned an empty array of questions.");
                     throw new ConvexError("AI returned an empty list. No questions were generated from the file.");
                }

                // 6. Schedule internal mutation
                await ctx.runMutation(internal.aiQuestions.internal_addGeneratedQuestions, {
                    formId: args.formId,
                    generatedQuestions: generatedQuestions, // Pass parsed questions for validation in mutation
                    userId: identity.subject,
                });

                console.log(`Successfully scheduled adding questions for form ${args.formId}. Validation will occur before saving.`);
                // Return the number of *valid* questions after internal_addGeneratedQuestions filters
                // This requires a change to internal_addGeneratedQuestions to return the count
                // For now, let's return the count of *parsed* questions as an estimate
                return { success: true, count: generatedQuestions.length,error:"" };

            } catch (error: any) {
                 console.error("Vercel AI SDK v3 / LLM API call failed:", error);
                 // Add more specific error handling if needed (e.g., check error.cause or specific error types from the SDK)
                 if (error.message?.includes("API key") || error.message?.includes("PERMISSION_DENIED") || error.message?.includes("INVALID_API_KEY")) {
                    throw new ConvexError("Invalid or missing GOOGLE_GENERATIVE_AI_API_KEY, or it lacks permissions for the Gemini API. Check your environment variable.");
                 }
                  // Check the error structure provided by the SDK/underlying fetch call
                  if (error.cause && typeof error.cause === 'object' && 'status' in error.cause && error.cause.status === 429) {
                      throw new ConvexError("Rate limit exceeded when calling the AI model. Please try again later.");
                  } else if (error.cause && typeof error.cause === 'object' && 'status' in error.cause && error.cause.status >= 400 && error.cause.status < 500) {
                       console.error(`Client-side error (${error.cause.status}) from LLM:`, error.cause);
                       throw new ConvexError(`AI model received a bad request (Status ${error.cause.status}). Check file format or prompt complexity. Error detail: ${error.cause.message || 'No detail provided'}`);
                  } else if (error.cause && typeof error.cause === 'object' && 'status' in error.cause && error.cause.status >= 500) {
                       console.error(`Server-side error (${error.cause.status}) from LLM:`, error.cause);
                       throw new ConvexError(`AI model service is currently experiencing issues (Status ${error.cause.status}). Please try again later. Error detail: ${error.cause.message || 'No detail provided'}`);
                  }
                 // Catch-all for other errors
                 throw new ConvexError(`Failed to generate questions via AI: ${error.message || String(error)}`);
            } finally {
                 // --- Reset status to 'not generating' ---
                 // This runs whether the try block succeeded or failed
                 await ctx.runMutation(internal.aiQuestions.internal_setGenerationStatus, {
                     formId: args.formId,
                     status: "not generating",
                     userId: identity.subject,
                 });
            }
        }
    });

export const generateQuestionsURL = action({
    args: {
        formId: v.id("forms"),
        url:v.string(),
        numberOfQuestions: v.number(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new ConvexError("User must be logged in to generate questions.");
        }
        await rateLimiter.check(ctx, "generateQuestionsURL", { key: identity.subject ,throws: true});
        

        const form = await ctx.runQuery(internal.forms.getFormForOwner, { formId: args.formId });
         if (!form || form.createdBy !== identity.subject) {
             throw new ConvexError("Form not found or you don't have permission to generate questions for it.");
         }

        // Check if generation is already in progress
        if (form.generationStatus === "generating") {
             throw new ConvexError("Question generation is already in progress for this form.");
        }

        // 1. Validate number of questions
        if (args.numberOfQuestions <= 0 || !Number.isInteger(args.numberOfQuestions)) {
             throw new ConvexError("Number of questions must be a positive integer.");
        }
        const MAX_QUESTIONS = 50;
        if (args.numberOfQuestions > MAX_QUESTIONS) {
            throw new ConvexError(`Cannot generate more than ${MAX_QUESTIONS} questions at a time.`);
        }

        // --- Set status to 'generating' ---
        // We don't await this immediately, it runs in parallel.
        // The finally block will ensure it's reset.
        await ctx.runMutation(internal.aiQuestions.internal_setGenerationStatus, {
            formId: args.formId,
            status: "generating",
            userId: identity.subject,
        });

        try {
            // --- Google API Key Check (Using the standard env var for @ai-sdk/google) ---
            const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
            if (!apiKey) {
                console.error("Missing GOOGLE_GENERATIVE_AI_API_KEY environment variable in Convex deployment.");
                throw new ConvexError("AI Service configuration error. Please contact support."); // User-friendly error
            }
            // NOTE: The key is not passed directly to google() but used implicitly by the provider.

            // 4. --- LLM API Call using Vercel AI SDK v3 ---
            console.log(`Generating ${args.numberOfQuestions} questions from link and its sub-links${args.url}`); // Use byteLength for ArrayBuffer size

            // Define the text part of the prompt
            const textPrompt = `

You are an expert question designer tasked with creating challenging, high-quality multiple-choice questions for an advanced quiz system. Your goal is to generate questions that assess a deep understanding of a given source.

Based *solely* on the content of the provided link and its sub-links **${args.url}**, generate exactly **${args.numberOfQuestions}** multiple-choice questions (MCQs).

**Guidelines:**

* Do **not** copy text directly from the file.
* Do **not** include any references to the file, document, or its origin in the questions.
* Do **not** include any introductory text, explanations, or markdown.
* Ensure questions are moderately complex and require a thoughtful understanding of the material.
* Cover a diverse range of concepts within the file.
* Try to randomize the location of the correct answer among the options.

Each question must be a JSON object with the following structure:

1. \`"question"\` - A clear, standalone question string.
2. \`"selectOptions"\` - An array of **exactly 4 distinct** answer choices (strings).
3. \`"answer"\` - A string that **exactly matches** one of the entries in \`"selectOptions"\`.

**Output format:** A single JSON array containing only the question objects.

**Example:**

\`\`\`json
[
 {
  "question": "What is the main purpose of dependency injection in software architecture?",
  "selectOptions": ["Improve testability", "Speed up execution", "Reduce memory usage", "Handle UI updates"],
  "answer": "Improve testability"
 }
]
\`\`\` ` // Added array brackets to the example to match expected output format
            const ai = new GoogleGenAI({
                apiKey: apiKey,
            });
            const tools = [
                { googleSearch: {} },
            ];
            const config = {
                tools,
                responseMimeType: 'text/plain',
            };
            const model = 'gemini-2.0-flash';
            const contents = [
                {
                role: 'user',
                parts: [
                    {
                    text: textPrompt,
                    },
                ],
                },
            ];
            const result = await ai.models.generateContent({
                model,
                config,
                contents,
            });
            console.log("LLM Finish Reason:", result);

                const responseText = result.text;
                console.log("LLM Raw Response Text:", responseText);
                if (!responseText){
                    throw new ConvexError("AI model returned an empty response.");
                }

                // --- Robust JSON Parsing (Keep similar logic) ---
                let cleanedText = responseText.trim();
                const jsonMatch = cleanedText.match(/```json\s*([\s\S]*?)\s*```/);
                 if (jsonMatch && jsonMatch[1]) {
                    cleanedText = jsonMatch[1].trim();
                 } else {
                     const firstBracket = cleanedText.indexOf('[');
                     const lastBracket = cleanedText.lastIndexOf(']');
                     if (firstBracket !== -1 && lastBracket !== -1 && firstBracket < lastBracket) {
                         cleanedText = cleanedText.substring(firstBracket, lastBracket + 1);
                     } else {
                         // If no code block or array found, assume the whole response might be the JSON (less robust)
                         console.warn("Could not find JSON code block or array in LLM response.");
                     }
                 }

                let generatedQuestions: GeneratedQuestion[];
                try {
                    generatedQuestions = JSON.parse(cleanedText);
                } catch (error) {
                    console.error("Failed to parse LLM response as JSON:", error);
                    console.error("Cleaned LLM Response Text for parsing:", cleanedText);
                    // Throw a user-friendly error indicating parsing failed
                    throw new ConvexError(`Failed to process AI response. Could not understand the generated questions (Finish Reason: ${result}). Please try again or adjust parameters. Response snippet: ${cleanedText.substring(0, 200)}...`);
                }

                console.log("Parsed LLM Response (initial):", generatedQuestions);

                // 5. Validate array structure (basic check)
                if (!Array.isArray(generatedQuestions)) {
                     console.error("Parsed LLM response is not an array:", generatedQuestions);
                     throw new ConvexError("AI did not return a valid list of questions.");
                }
                if (generatedQuestions.length === 0 && args.numberOfQuestions > 0) {
                     console.warn("LLM returned an empty array of questions.");
                     throw new ConvexError("AI returned an empty list. No questions were generated from the file.");
                }

                // 6. Schedule internal mutation
                await ctx.runMutation(internal.aiQuestions.internal_addGeneratedQuestions, {
                    formId: args.formId,
                    generatedQuestions: generatedQuestions, // Pass parsed questions for validation in mutation
                    userId: identity.subject,
                });

                console.log(`Successfully scheduled adding questions for form ${args.formId}. Validation will occur before saving.`);
                // Return the number of *valid* questions after internal_addGeneratedQuestions filters
                // This requires a change to internal_addGeneratedQuestions to return the count
                // For now, let's return the count of *parsed* questions as an estimate
                return { success: true, count: generatedQuestions.length ,error:""};

            } catch (error: any) {
                 console.error("Vercel AI SDK v3 / LLM API call failed:", error);
                 if(error.message?.includes("rate limit") || error.message?.includes("Rate limit exceeded")){
                    return { success: false, error: "Rate limit exceeded. Please try again later.",count:0  };
                 }
                 // Add more specific error handling if needed (e.g., check error.cause or specific error types from the SDK)
                 if (error.message?.includes("API key") || error.message?.includes("PERMISSION_DENIED") || error.message?.includes("INVALID_API_KEY")) {
                    throw new ConvexError("Invalid or missing GOOGLE_GENERATIVE_AI_API_KEY, or it lacks permissions for the Gemini API. Check your environment variable.");
                 }
                  // Check the error structure provided by the SDK/underlying fetch call
                  if (error.cause && typeof error.cause === 'object' && 'status' in error.cause && error.cause.status === 429) {
                      throw new ConvexError("Rate limit exceeded when calling the AI model. Please try again later.");
                  } else if (error.cause && typeof error.cause === 'object' && 'status' in error.cause && error.cause.status >= 400 && error.cause.status < 500) {
                       console.error(`Client-side error (${error.cause.status}) from LLM:`, error.cause);
                       throw new ConvexError(`AI model received a bad request (Status ${error.cause.status}). Check file format or prompt complexity. Error detail: ${error.cause.message || 'No detail provided'}`);
                  } else if (error.cause && typeof error.cause === 'object' && 'status' in error.cause && error.cause.status >= 500) {
                       console.error(`Server-side error (${error.cause.status}) from LLM:`, error.cause);
                       throw new ConvexError(`AI model service is currently experiencing issues (Status ${error.cause.status}). Please try again later. Error detail: ${error.cause.message || 'No detail provided'}`);
                  }
                 // Catch-all for other errors
                 throw new ConvexError(`Failed to generate questions via AI: ${error.message || String(error)}`);
                 return { success: false, error: "An unexpected error occurred.",count:0 };
            } finally {
                 // --- Reset status to 'not generating' ---
                 // This runs whether the try block succeeded or failed
                 await ctx.runMutation(internal.aiQuestions.internal_setGenerationStatus, {
                     formId: args.formId,
                     status: "not generating",
                     userId: identity.subject,
                 });
            }
            return { success: true,count:0,error:"" }; // Placeholder return, adjust as needed
        }
    });