// convex/form_responses.ts
import { mutation, query, internalQuery } from './_generated/server';
import { v } from "convex/values";
import { ConvexError } from 'convex/values';

export const addResponse = mutation({
    args: {
        slug: v.string(),
        values: v.array(v.object({
            questionId:v.id("form_questions"),
            question: v.string(),
            userSelectedOption: v.string(),
        })),
        // --- NEW ARG ---
        sessionStartTime: v.optional(v.int64()), // Provided by client if time limit exists
        // --- END NEW ARG ---
    },
    handler: async (ctx, args) => {
        const form = await ctx.db
            .query("forms")
            .filter((q) => q.eq(q.field("slug"), args.slug))
            .unique();

        if (!form) {
            throw new Error("Form not found");
        }

        const now = Date.now(); // Get current time once

        // --- NEW CHECKS ---
        // 1. Check manual/overall status first
        if (!form.acceptingResponses) {
             throw new ConvexError("This form is currently not accepting responses.");
        }

        // 2. Check Start Time
        if (form.startTime && now < form.startTime) {
             throw new ConvexError(`This form is not open yet. It opens on ${new Date(Number(form.startTime)).toLocaleString()}.`); // Provide user-friendly date
        }

        // 3. Check End Time
        if (form.endTime && now > form.endTime) {
             // Optionally, also set acceptingResponses to false automatically here?
             // await ctx.db.patch(form._id, { acceptingResponses: false }); // Consider implications
             throw new ConvexError(`This form closed on ${new Date(Number(form.endTime)).toLocaleString()}.`); // Provide user-friendly date
        }

        // 4. Check Time Limit
        if (form.timeLimitMinutes) {
             if (!args.sessionStartTime) {
                 // Decide how to handle missing session start time: reject or allow?
                 // Rejecting is safer to enforce the limit.
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
        // --- END NEW CHECKS ---

        // If all checks pass, insert the response
        const response = {
            formId: form._id,
            slug: args.slug, // Keep slug if needed, though formId is primary link
            values: args.values,
            // --- ADD TIMESTAMPS ---
            submittedAt: BigInt(now),
            sessionStartTime: args.sessionStartTime, // Store the start time for reference/analysis
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
            throw new Error("Not authenticated");
        }
        const form = await ctx.db
            .query("forms")
            .filter((q) => q.and(
                q.eq(q.field("_id"), args.formId),
                q.eq(q.field("createdBy"), identity.subject)
            ))
            .unique();
        if (!form) {
            throw new Error("Form not found");
        }
        return ctx.db
            .query("form_responses")
            .withIndex("by_formId", q => q.eq("formId", args.formId))
            .collect();
    },
})
// In convex/form_responses.ts:
 export const getFormResponsesInternal = internalQuery({
     args: { formId: v.id("forms") },
     handler: async (ctx, args) => {
         // No auth check here, action can handle it or assumes internal calls are trusted
         return ctx.db
             .query("form_responses")
             .withIndex("by_formId", q => q.eq("formId", args.formId))
             .collect();
     },
 });