import { action, internalMutation, mutation, query } from './_generated/server';
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { ConvexError } from 'convex/values';
import { rateLimiter } from './rate_limit';
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

const analysisDataSchema = z.object({
  individualAnalysis: z.array(
    z.object({
      responseId: z.custom<Id<"form_responses">>((val) => typeof val === 'string' && val.startsWith('')),
      performanceByTopic: z.object({
        correct: z.number(),
        total: z.number(),
        percentage: z.number(),
      }),
      weakTopics: z.array(z.string()),
      strongTopics: z.array(z.string()),
      individualFocusAreas: z.array(z.string()),
    })
  ),
  collectiveAnalysis: z.object({
    topicPerformanceSummary: z.object({
        correct: z.number(),
        total: z.number(),
        percentage: z.number(),
      }),
    collectiveWeaknesses: z.array(z.string()),
    collectiveFocusAreas: z.array(z.string()),
  }),
});
type AnalysisData = z.infer<typeof analysisDataSchema>;

export const internal_saveAnalysis = internalMutation({
    args: {
        formId: v.id("forms"),
        analysis: v.any(), 
    },
    handler: async (ctx, args) => {
        const validatedAnalysis = args.analysis as AnalysisData;

        const existingAnalysis = await ctx.db
            .query("form_responses_analysis")
            .withIndex("by_formId", (q) => q.eq("formId", args.formId))
            .first();

        if (existingAnalysis) {
            await ctx.db.patch(existingAnalysis._id, {
                analysis: validatedAnalysis,
            });
            console.log(`Updated analysis for form: ${args.formId}`);
            return existingAnalysis._id;
        } else {
            const newAnalysisId = await ctx.db.insert("form_responses_analysis", {
                formId: args.formId,
                analysis: validatedAnalysis,
            });
            console.log(`Added new analysis for form: ${args.formId}`);
            return newAnalysisId;
        }
    },
});

export const generateAnalysis = action({
    args: {
        formId: v.id("forms"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
         if (!identity) {
             throw new ConvexError("User must be logged in to generate analysis.");
         }
         await rateLimiter.check(ctx, "responceAnalysis", {key: identity.subject,throws: true});

        const form = await ctx.runQuery(internal.forms.getFormForOwner, { formId: args.formId });
         if (!form) {
             throw new ConvexError("Form not found or user does not have permission.");
         }
         if (form.createdBy !== identity.subject) {
              throw new ConvexError("User does not have permission to generate analysis for this form.");
         }


        const questions = await ctx.runQuery(internal.form_questions.getFormQuestionsInternal, { formId: args.formId });
        if (!questions || questions.length === 0) {
            throw new ConvexError("No questions found for this form. Cannot generate analysis.");
        }
        const responses = await ctx.runQuery(internal.form_responses.getFormResponsesInternal, { formId: args.formId });
         if (!responses || responses.length === 0) {
             console.log(`No responses found for form ${args.formId}. Skipping analysis generation.`);
              const emptyAnalysis: AnalysisData = {
                   individualAnalysis: [],
                   collectiveAnalysis: {
                       topicPerformanceSummary: { correct: 0, total: 0, percentage: 0 },
                       collectiveWeaknesses: [],
                       collectiveFocusAreas: []
                   }
               };
               await ctx.runMutation(internal.form_responses_analysis.internal_saveAnalysis, {
                  formId: args.formId,
                  analysis: emptyAnalysis,
              });
             return { message: "No responses found, analysis record initialized or updated as empty." };
         }


        const questionMap = new Map(questions.map(q => [q._id, q]));
        const formattedResponses = responses.map(response => {
            const responseDetails = response.values.map(value => {
                const question = questionMap.get(value.questionId);
                return {
                    questionId: value.questionId,
                    questionText: value.question,
                    options: question?.selectOptions ?? [],
                    correctAnswer: question?.answer ?? "N/A", 
                    userSelectedOption: value.userSelectedOption,
                };
            });
            return {
                responseId: response._id,
                submittedAnswers: responseDetails,
            };
        });

         const formattedQuestions = questions.map(q => ({
             questionId: q._id,
             questionText: q.question,
             options: q.selectOptions ?? [],
             correctAnswer: q.answer,
             order: Number(q.order), 
             type: q.type,
         }));
         console.log("Formatted Responses for LLM:", formattedResponses);


        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            throw new ConvexError("GOOGLE_API_KEY environment variable is not set.");
        }
        const prompt = `
          You are an expert educational analyst. Analyze the following form responses based on the provided questions.

          **Input Data:**

          1.  **Questions:** An array of question objects. Each object contains:
              *   \`questionId\`: The unique ID of the question.
              *   \`questionText\`: The text of the question.
              *   \`options\`: An array of possible answer choices (for MCQ).
              *   \`correctAnswer\`: The correct answer string.
              *   \`order\`: The order of the question in the form.
              *   \`type\`: The type of question (currently 'mcq').

          2.  **Responses:** An array of response objects submitted by users. Each object contains:
              *   \`responseId\`: The unique ID of the response submission.
              *   \`submittedAnswers\`: An array detailing the answers given in that submission. Each item includes:
                  *   \`questionId\`: The ID of the question being answered.
                  *   \`questionText\`: The text of the question.
                  *   \`options\`: The available options for this question.
                  *   \`correctAnswer\`: The correct answer for this question.
                  *   \`userSelectedOption\`: The option selected by the user.

          **Task:**

          Analyze each response to determine individual accuracy and topic-level strengths/weaknesses. Also, aggregate the data to evaluate overall performance.
Use the match between \`userSelectedOption\` and \`correctAnswer\` to compute correctness.

**Your analysis should:**

* Calculate individual correctness (correct count, total, and percentage).
* Identify weak and strong topics per individual.
* Suggest focus areas for each user.
* Summarize collective performance (total correct, percentage).
* Highlight common weak areas and overall suggestions for improvement.

---
          **Output Format:**

          Return **only** a JSON object matching this exact structure:

          \`\`\`json
          {
            "individualAnalysis": [
              {
                "responseId": "string (use the provided responseId)",
                "performanceByTopic": {
                  "correct": "number (count of correctly answered questions)",
                  "total": "number (total questions answered in this response)",
                  "percentage": "number (correct / total * 100, rounded to 1 decimal)"
                },
                "weakTopics": ["string (list of topics answered incorrectly or found to be weak in the response)"],
                "strongTopics": ["string (list of topics answered correctly or found to be strong in the response)"],
                "individualFocusAreas": ["string (suggestions based on weak topics for this individual)"]
              }
              // ... more individual analysis objects
            ],
            "collectiveAnalysis": {
              "topicPerformanceSummary": {
                  "correct": "number (total correct answers across all responses)",
                  "total": "number (total questions answered across all responses)",
                  "percentage": "number (overall correct percentage, rounded to 1 decimal)"
                },
              "collectiveWeaknesses": ["string (list of common questionText or inferred topics answered incorrectly by many)"],
              "collectiveFocusAreas": ["string (overall suggestions based on collective weaknesses)"]
            }
          }
          \`\`\`

          **Data for Analysis:**

          Questions:
          ${JSON.stringify(formattedQuestions, null, 2)}

          Responses:
          ${JSON.stringify(formattedResponses, null, 2)}

          Now, generate the JSON analysis.
        `;
        console.log("Constructed prompt for LLM:", prompt);

        let llmResponseText: string;
        try {
             console.log("Sending request to Google AI...");
             const { text } = await generateText({
                 model: google('gemini-2.0-flash'),
                 prompt: prompt,
             });
            llmResponseText = text;
            console.log("Received response from Google AI.");

        } catch (error: any) {
            console.error("Error calling Google AI:", error);
            throw new ConvexError(`Failed to get analysis from AI service: ${error.message}`);
        }

        let parsedAnalysis: any;
        try {
            const cleanedJson = llmResponseText.replace(/^```json\s*|\s*```$/g, '').trim();
            parsedAnalysis = JSON.parse(cleanedJson);
        } catch (error: any) {
            console.error("Failed to parse LLM response as JSON:", error);
            console.error("LLM Response Text that failed parsing:", llmResponseText);
            throw new ConvexError(`Failed to parse analysis JSON from AI service: ${error.message}`);
        }

         const validationResult = analysisDataSchema.safeParse(parsedAnalysis);
         if (!validationResult.success) {
            console.error("LLM response failed validation:", validationResult.error.errors);
             console.error("Parsed Analysis Object that failed validation:", parsedAnalysis);
            throw new ConvexError(`AI service returned data in an unexpected format: ${validationResult.error.message}`);
         }

        await ctx.runMutation(internal.form_responses_analysis.internal_saveAnalysis, {
            formId: args.formId,
            analysis: validationResult.data,
        });

        console.log(`Successfully generated and saved analysis for form ${args.formId}`);
        return { success: true, message: "Analysis generated successfully." };
    },
});


export const getAnalysis = query({
    args: {
        formId: v.id("forms"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (identity === null) {
            return null;
        }

        const form = await ctx.db.get(args.formId);
        if (!form) {
            throw new ConvexError("Associated form not found");
        }
         if (form.createdBy !== identity.subject) {
             console.warn(`User ${identity.subject} attempted to access analysis for form ${args.formId} owned by ${form.createdBy}`);
             return null;
         }

        const analysisRecord = await ctx.db
            .query("form_responses_analysis")
            .withIndex("by_formId", (q) => q.eq("formId", args.formId))
            .first();

        return analysisRecord;
    },
});

export const deleteAnalysis = mutation({
    args: {
        id: v.union(v.id("form_responses_analysis"), v.id("forms")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (identity === null) {
            throw new ConvexError("Not authenticated");
        }

        let analysisRecord;
        let formId: Id<"forms">;

        const maybeAnalysis = await ctx.db.get(args.id as Id<"form_responses_analysis">);
        if (maybeAnalysis && maybeAnalysis.formId) {
             analysisRecord = maybeAnalysis;
             formId = analysisRecord.formId;
        } else {
            formId = args.id as Id<"forms">;
            analysisRecord = await ctx.db
                .query("form_responses_analysis")
                .withIndex("by_formId", q => q.eq("formId", formId))
                .first();
        }


        if (!analysisRecord) {
            console.warn(`Analysis record not found for id/formId ${args.id}. Nothing to delete.`);
            return { success: false, message: "Analysis not found." };
        }

        const form = await ctx.db.get(formId);
         if (!form) {
            console.warn(`Associated form ${formId} not found for analysis record ${analysisRecord._id}. Allowing deletion.`);
         } else if (form.createdBy !== identity.subject) {
             throw new ConvexError("User does not have permission to delete this analysis.");
         }

        await ctx.db.delete(analysisRecord._id);
        console.log(`Deleted analysis record: ${analysisRecord._id} for form ${formId}`);

        return { success: true };
    },
});






