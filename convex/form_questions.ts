// convex/form_questions.ts
import { mutation, query } from './_generated/server';
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// --- Add Question Mutation ---
export const addQuestion = mutation({
    args: {
        formId: v.id("forms"), // Use Id<"forms"> based on your schema
        question: v.string(),
        order: v.int64(), // Convex handles int64 mapping from number
        type: v.literal("mcq"), // Enforce MCQ type for this logic
        selectOptions: v.array(v.string()), // Ensure it's an array
        answer: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (identity === null) {
            throw new Error("Not authenticated");
        }

        // 1. Authorize: Check if user owns the form
        const form = await ctx.db.get(args.formId); // Use get for ID lookup

        if (!form) {
            throw new Error("Form not found");
        }
        if (form.createdBy !== identity.tokenIdentifier) {
            // You might want to allow collaborators later, but for now, check ownership
             throw new Error("User does not have permission to add questions to this form");
        }

        // 2. Validate: Check if answer is one of the options
        if (!args.selectOptions.includes(args.answer)) {
            throw new Error("The provided answer must be one of the select options.");
        }
         if (args.selectOptions.length < 2) {
            throw new Error("MCQ questions must have at least two options.");
         }

        // 3. Insert the new question
        const newQuestionInternalId = await ctx.db.insert("form_questions", {
            formId: args.formId,
            question: args.question,
            order: args.order,
            type: args.type, // Should always be 'mcq' here
            selectOptions: args.selectOptions,
            answer: args.answer,
        });

        return newQuestionInternalId; // Return the Convex internal _id
    },
});

// --- Delete Question Mutation ---
export const deleteQuestion = mutation({
    args: {
        // We use the internal Convex _id for deletion for simplicity and safety
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
            // Don't throw an error if it's already deleted, just return
            console.warn(`Question with id ${args.questionInternalId} not found for deletion.`);
            return;
            // throw new Error("Question not found");
        }

        // 2. Authorize: Check if user owns the associated form
        const form = await ctx.db.get(question.formId);
        if (!form) {
             // Should not happen if question exists, but good practice
            throw new Error("Associated form not found");
        }
        if (form.createdBy !== identity.tokenIdentifier) {
            throw new Error("User does not have permission to delete questions from this form");
        }

        // 3. Delete the question
        await ctx.db.delete(args.questionInternalId);

        // 4. Maintain order: Decrement order for subsequent questions
        const subsequentQuestions = await ctx.db
            .query("form_questions")
            .withIndex("by_formId", (q) => q.eq("formId", question.formId))
            .filter((q) => q.gt(q.field("order"), question.order)) // Only get questions with higher order
            .collect();

        // Update order in parallel for efficiency
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
        formId: v.id("forms"), // Use Id<"forms">
    },
    handler: async (ctx, args) => {
        // Fetch questions associated with the formId and order them
        return ctx.db
            .query("form_questions")
            .withIndex("by_formId", (q) => q.eq("formId", args.formId))
            .order("asc") // Order by the 'order' field ascending
            .collect();
    },
});

// Note: getBySlug equivalent for questions might not be needed
// unless you query questions directly via a form slug without knowing the formId first.
// If needed, it would look similar to the one in form_fields.ts, first finding
// the form by slug, then querying questions by the found form._id.