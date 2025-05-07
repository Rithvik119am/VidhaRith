// convex/form_questions.ts
import { mutation, query, internalQuery } from './_generated/server';
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// --- Add Question Mutation (exists) ---
export const addQuestion = mutation({
    args: {
        formId: v.id("forms"),
        question: v.string(),
        order: v.int64(),
        type: v.literal("mcq"),
        selectOptions: v.array(v.string()),
        answer: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (identity === null) {
            throw new Error("Not authenticated");
        }

        // 1. Authorize: Check if user owns the form
        const form = await ctx.db.get(args.formId);

        if (!form) {
            throw new Error("Form not found");
        }
        if (form.createdBy !== identity.subject) {
             throw new Error("User does not have permission to add questions to this form");
        }

        // 2. Validate: Check if answer is one of the options
        if (!args.selectOptions.includes(args.answer.trim())) { // Add trim here too for consistency
            throw new Error("The provided answer must be one of the select options.");
        }
         if (args.selectOptions.map(opt => opt.trim()).filter(opt => opt !== "").length < 2) { // Validate trimmed options length
            throw new Error("MCQ questions must have at least two non-empty options.");
         }
         // Validate unique options (case-insensitive, trimmed)
         const trimmedOptions = args.selectOptions.map(opt => opt.trim().toLowerCase()).filter(opt => opt !== "");
         if (new Set(trimmedOptions).size !== trimmedOptions.length) {
             throw new Error("Options must be unique and not empty.");
         }


        // 3. Insert the new question
        const newQuestionInternalId = await ctx.db.insert("form_questions", {
            formId: args.formId,
            question: args.question.trim(), // Trim question text
            order: args.order,
            type: args.type,
            selectOptions: args.selectOptions.map(opt => opt.trim()), // Store trimmed options
            answer: args.answer.trim(), // Store trimmed answer
        });

        return newQuestionInternalId;
    },
});


// --- NEW: Update Question Mutation ---
export const updateQuestion = mutation({
    args: {
        questionInternalId: v.id("form_questions"), // ID of the question to update
        question: v.string(),
        selectOptions: v.array(v.string()),
        answer: v.string(),
        // Note: formId, order, type are not updated here
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (identity === null) {
            throw new Error("Not authenticated");
        }

        // 1. Fetch the question to be updated
        const question = await ctx.db.get(args.questionInternalId);
        if (!question) {
            throw new Error("Question not found");
        }

        // 2. Authorize: Check if user owns the associated form
        const form = await ctx.db.get(question.formId);
        if (!form) {
             // Should not happen if question exists, but good practice
            throw new Error("Associated form not found");
        }
        if (form.createdBy !== identity.subject) {
            throw new Error("User does not have permission to update this question");
        }

        // 3. Validate: Check if answer is one of the NEW options
        const trimmedNewOptions = args.selectOptions.map(opt => opt.trim());
        const trimmedNewAnswer = args.answer.trim();

        if (!trimmedNewOptions.includes(trimmedNewAnswer)) {
            throw new Error("The provided answer must exactly match one of the new select options (case-insensitive and trimmed).");
        }
        if (trimmedNewOptions.filter(opt => opt !== "").length < 2) { // Validate trimmed options length
           throw new Error("MCQ questions must have at least two non-empty options.");
        }
        // Validate unique options (case-insensitive, trimmed)
        const lowerTrimmedOptions = trimmedNewOptions.map(opt => opt.toLowerCase()).filter(opt => opt !== "");
        if (new Set(lowerTrimmedOptions).size !== lowerTrimmedOptions.length) {
            throw new Error("Options must be unique and not empty.");
        }


        // 4. Patch the question document
        await ctx.db.patch(args.questionInternalId, {
            question: args.question.trim(), // Store trimmed question text
            selectOptions: trimmedNewOptions, // Store trimmed options
            answer: trimmedNewAnswer, // Store trimmed answer
        });

        return { success: true };
    },
});


// --- Delete Question Mutation (exists) ---
export const deleteQuestion = mutation({
    args: {
        questionInternalId: v.id("form_questions"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (identity === null) {
            throw new Error("Not authenticated");
        }

        // 1. Fetch the question to be deleted
        const question = await ctx.db.get(args.questionInternalId);
        if (!question) {
            console.warn(`Question with id ${args.questionInternalId} not found for deletion.`);
            return; // Don't throw, just return if not found
        }

        // 2. Authorize: Check if user owns the associated form
        const form = await ctx.db.get(question.formId);
        if (!form) {
            throw new Error("Associated form not found");
        }
        if (form.createdBy !== identity.subject) {
            throw new Error("User does not have permission to delete questions from this form");
        }

        // 3. Delete the question
        await ctx.db.delete(args.questionInternalId);

        // 4. Maintain order: Decrement order for subsequent questions
        const subsequentQuestions = await ctx.db
            .query("form_questions")
            .withIndex("by_formId", (q) => q.eq("formId", question.formId))
            .filter((q) => q.gt(q.field("order"), question.order))
            .collect();

        await Promise.all(
            subsequentQuestions.map((q) =>
                ctx.db.patch(q._id, {
                    order: q.order - BigInt(1),
                })
            )
        );
    },
});

// --- Get Questions Query ---
export const getFormQuestions = query({
    args: {
        formId: v.id("forms"),
    },
    handler: async (ctx, args) => {
        return ctx.db
            .query("form_questions")
            .withIndex("by_formId", (q) => q.eq("formId", args.formId))
            .order("asc")
            .collect();
    },
});
export const getFormQuestionsForQuiz = query({
    args: {
        formId: v.id("forms"),
    },
    handler: async (ctx, args) => {
        const questions = await ctx.db
           .query("form_questions")
           .withIndex("by_formId", (q) => q.eq("formId", args.formId))
           .order("asc")
           .collect();
        
        // Remove answer field from each question before returning
        return questions.map(({ answer, ...rest }) => rest);
    },
})

export const getFormQuestionsInternal = internalQuery({
    args: { formId: v.id("forms") },
    handler: async (ctx, args) => {
        return ctx.db
            .query("form_questions")
            .withIndex("by_formId", (q) => q.eq("formId", args.formId))
            .order("asc")
            .collect();
    },
});