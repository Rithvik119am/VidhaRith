import { mutation, query, internalQuery } from './_generated/server';
import { v,ConvexError } from "convex/values";
import { Id } from "./_generated/dataModel";

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
            throw new ConvexError("Not authenticated");
        }
        const form = await ctx.db.get(args.formId);

        if (!form) {
            throw new ConvexError("Form not found");
        }
        if (form.createdBy !== identity.subject) {
             throw new ConvexError("User does not have permission to add questions to this form");
        }

        if (!args.selectOptions.includes(args.answer.trim())) {
            throw new ConvexError("The provided answer must be one of the select options.");
        }
         if (args.selectOptions.map(opt => opt.trim()).filter(opt => opt !== "").length < 2) {
            throw new ConvexError("MCQ questions must have at least two non-empty options.");
         }
         const trimmedOptions = args.selectOptions.map(opt => opt.trim().toLowerCase()).filter(opt => opt !== "");
         if (new Set(trimmedOptions).size !== trimmedOptions.length) {
             throw new ConvexError("Options must be unique and not empty.");
         }

        const newQuestionInternalId = await ctx.db.insert("form_questions", {
            formId: args.formId,
            question: args.question.trim(),
            order: args.order,
            type: args.type,
            selectOptions: args.selectOptions.map(opt => opt.trim()),
            answer: args.answer.trim(),
        });

        return newQuestionInternalId;
    },
});


export const updateQuestion = mutation({
    args: {
        questionInternalId: v.id("form_questions"),
        question: v.string(),
        selectOptions: v.array(v.string()),
        answer: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (identity === null) {
            throw new ConvexError("Not authenticated");
        }

        const question = await ctx.db.get(args.questionInternalId);
        if (!question) {
            throw new ConvexError("Question not found");
        }
        const form = await ctx.db.get(question.formId);
        if (!form) {
            throw new ConvexError("Associated form not found");
        }
        if (form.createdBy !== identity.subject) {
            throw new ConvexError("User does not have permission to update this question");
        }

        const trimmedNewOptions = args.selectOptions.map(opt => opt.trim());
        const trimmedNewAnswer = args.answer.trim();

        if (!trimmedNewOptions.includes(trimmedNewAnswer)) {
            throw new ConvexError("The provided answer must exactly match one of the new select options (case-insensitive and trimmed).");
        }
        if (trimmedNewOptions.filter(opt => opt !== "").length < 2) {
           throw new ConvexError("MCQ questions must have at least two non-empty options.");
        }
        const lowerTrimmedOptions = trimmedNewOptions.map(opt => opt.toLowerCase()).filter(opt => opt !== "");
        if (new Set(lowerTrimmedOptions).size !== lowerTrimmedOptions.length) {
            throw new ConvexError("Options must be unique and not empty.");
        }

        await ctx.db.patch(args.questionInternalId, {
            question: args.question.trim(),
            selectOptions: trimmedNewOptions,
            answer: trimmedNewAnswer,
        });

        return { success: true };
    },
});


export const deleteQuestion = mutation({
    args: {
        questionInternalId: v.id("form_questions"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (identity === null) {
            throw new ConvexError("Not authenticated");
        }

        const question = await ctx.db.get(args.questionInternalId);
        if (!question) {
            console.warn(`Question with id ${args.questionInternalId} not found for deletion.`);
            return;
        }

        const form = await ctx.db.get(question.formId);
        if (!form) {
            throw new ConvexError("Associated form not found");
        }
        if (form.createdBy !== identity.subject) {
            throw new ConvexError("User does not have permission to delete questions from this form");
        }

        await ctx.db.delete(args.questionInternalId);

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