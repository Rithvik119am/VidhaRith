import { mutation, query, internalQuery } from './_generated/server';
import { v,ConvexError } from "convex/values";

export const addResponse = mutation({
    args: {
        slug: v.string(),
        values: v.array(v.object({
            questionId:v.id("form_questions"),
            question: v.string(),
            userSelectedOption: v.string(),
        })),
        sessionStartTime: v.optional(v.int64()),
    },
    handler: async (ctx, args) => {
        const form = await ctx.db
            .query("forms")
            .filter((q) => q.eq(q.field("slug"), args.slug))
            .unique();

        if (!form) {
            throw new ConvexError("Form not found");
        }

        const now = Date.now();

        if (!form.acceptingResponses) {
             throw new ConvexError("This form is currently not accepting responses.");
        }

        if (form.startTime && now < form.startTime) {
             throw new ConvexError(`This form is not open yet. It opens on ${new Date(Number(form.startTime)).toLocaleString()}.`);
        }
        if (form.endTime && now > form.endTime) {
             throw new ConvexError(`This form closed on ${new Date(Number(form.endTime)).toLocaleString()}.`);
        }

        if (form.timeLimitMinutes) {
             if (!args.sessionStartTime) {
                 throw new ConvexError("Submission error: Could not verify start time for time limit.");
             }
             const allowedDurationMs = Number(form.timeLimitMinutes) * 60 * 1000;
             const actualDurationMs = now - Number(args.sessionStartTime);

             // Add a small grace period (e.g., 5 seconds) to account for network latency?
             const gracePeriodMs = 5000;
             if (actualDurationMs > allowedDurationMs + gracePeriodMs) {
                 throw new ConvexError(`Time limit of ${form.timeLimitMinutes} minutes exceeded.`);
             }
        }

   const questions = await ctx.db
   .query("form_questions")
   .withIndex("by_formId", q => q.eq("formId", form._id))
   .collect();

        const questionMap = new Map(questions.map(q => [q._id.toString(), q]));

        let correctCount = 0;
        for (const userAnswer of args.values) {
        const question = questionMap.get(userAnswer.questionId.toString());

        if (question) {
            const trimmedUserAnswer = userAnswer.userSelectedOption.trim().toLowerCase();
            const trimmedCorrectAnswer = question.answer.trim().toLowerCase();

            if (trimmedUserAnswer === trimmedCorrectAnswer) {
                correctCount++;
            }
        } else {
            console.warn(`Submitted response includes unknown questionId: ${userAnswer.questionId}`);
        }
        }

        const totalPossibleQuestions = questions.length;
        // for percentage const calculatedScore = (totalPossibleQuestions === 0) ? 0 : correctCount / totalPossibleQuestions;
        const calculatedScore = (totalPossibleQuestions === 0) ? 0 : correctCount;


        const response = {
        formId: form._id,
        slug: args.slug,
        values: args.values,
        score: calculatedScore,
        submittedAt: BigInt(now),
        sessionStartTime: args.sessionStartTime,
        };
        const responseId = await ctx.db.insert("form_responses", response);
        return responseId;
        },
});

export const getFormResponses = query({
    args: {
        formId: v.id("forms"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (identity === null) {
            throw new ConvexError("Not authenticated");
        }
        const form = await ctx.db
            .query("forms")
            .filter((q) => q.and(
                q.eq(q.field("_id"), args.formId),
                q.eq(q.field("createdBy"), identity.subject)
            ))
            .unique();
        if (!form) {
            throw new ConvexError("Form not found");
        }
        return ctx.db
            .query("form_responses")
            .withIndex("by_formId", q => q.eq("formId", args.formId))
            .collect();
    },
})
 export const getFormResponsesInternal = internalQuery({
     args: { formId: v.id("forms") },
     handler: async (ctx, args) => {
         return ctx.db
             .query("form_responses")
             .withIndex("by_formId", q => q.eq("formId", args.formId))
             .collect();
     },
 });