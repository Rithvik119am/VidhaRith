// convex/forms.ts
import { ConvexError, v } from 'convex/values';
import { mutation, query, internalQuery } from './_generated/server';
import { AnyDataModel, GenericMutationCtx } from 'convex/server';

// generateUniqueSlug function remains the same...
const generateUniqueSlug = async (ctx: GenericMutationCtx<AnyDataModel>) => {
    // ... (keep existing implementation)
    let tries = 0;
    while (tries < 5) {
        const randomString = [...Array(5)]
        .map(() => Math.random().toString(36)[2])
        .join("");
        const existingForm = await ctx.db
            .query("forms")
            .filter((q) => q.eq(q.field("slug"), randomString))
            .first();
        if (!existingForm) {
            return randomString;
        }
        tries++;
    }
    throw new ConvexError("Failed to generate a unique slug");
};


export const create = mutation({
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (identity === null) {
            throw new Error("Not authenticated");
        }
        console.log("Creating form ID", identity);
        const newFormId = await ctx.db.insert("forms", {
            createdBy: identity.subject,
            slug: await generateUniqueSlug(ctx),
            // --- NEW DEFAULTS ---
            acceptingResponses: true, // Default to accepting responses
            startTime: undefined,       // No specific start time initially
            endTime: undefined,         // No specific end time initially
            timeLimitMinutes: undefined, // No time limit initially
            // --- END NEW DEFAULTS ---
        });
        return newFormId;
    },
});

export const update = mutation({
    args: {
        formId: v.id("forms"),
        name: v.string(),
        description: v.string(),
        slug: v.string(),
        // --- NEW ARGS ---
        startTime: v.optional(v.int64()),
        endTime: v.optional(v.int64()),
        timeLimitMinutes: v.optional(v.int64()),
        // Note: acceptingResponses is handled by toggleStatus mutation
        // --- END NEW ARGS ---
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

        // Slug uniqueness check (keep existing)
        const formBySlug = await ctx.db
            .query("forms")
            .filter((q) => q.eq(q.field("slug"), args.slug))
            .first();
        if (formBySlug && formBySlug._id !== args.formId) {
            throw new ConvexError("Form with this slug already exists");
        }

         // Name uniqueness check (keep existing)
        const formsOfThisUser = await ctx.db
        .query("forms")
        .filter((q) => q.eq(q.field("createdBy"), identity.subject))
        .collect();
        const sameNameForms = formsOfThisUser.filter((f) => f.name === args.name.trim());

        if (sameNameForms.length > 0 && sameNameForms[0]._id !== args.formId) {
            throw new ConvexError("Form with this name already exists");
        }

        // --- NEW VALIDATION ---
        if (args.startTime && args.endTime && args.endTime <= args.startTime) {
            throw new ConvexError("End time must be after start time.");
        }
        if (args.timeLimitMinutes !== undefined && args.timeLimitMinutes !== null && args.timeLimitMinutes <= 0) {
             throw new ConvexError("Time limit must be a positive number of minutes.");
        }
         // --- END NEW VALIDATION ---


        await ctx.db
            .patch(args.formId, {
                name: args.name,
                description: args.description,
                slug: args.slug,
                // --- PATCH NEW FIELDS ---
                startTime: args.startTime,
                endTime: args.endTime,
                timeLimitMinutes: args.timeLimitMinutes,
                // --- END PATCH NEW FIELDS ---
            });
        // Maybe: Re-evaluate `acceptingResponses` based on new times?
        // It's simpler to let the check happen during submission or have a separate toggle.
        // Let's stick with the manual toggle for now.
    },
});

// --- NEW MUTATION for Manual Start/Stop ---
export const toggleStatus = mutation({
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
            throw new Error("Form not found or you don't have permission");
        }

        // Toggle the status
        const newStatus = !form.acceptingResponses;
        await ctx.db.patch(args.formId, { acceptingResponses: newStatus });

        return { newStatus }; // Return the new status for UI update
    }
});
// --- END NEW MUTATION ---


// deleteForm, get, getBySlug, getUserForms, getFormForOwner mutations/queries remain largely the same
// ... existing code for deleteForm, get, getBySlug, getUserForms, getFormForOwner ...
export const deleteForm = mutation({
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
        const formResponses = await ctx.db
            .query("form_responses")
            .filter((q) => q.eq(q.field("formId"), args.formId))
            .collect();
        if (formResponses?.length > 0) {
            throw new ConvexError("Form has responses - cannot delete");
        }


        await ctx.db.delete(args.formId);
    },
});
export const get = query({
    args: {
        formId: v.id("forms"),
    },
    handler: async (ctx, args) => {
        const form = await ctx.db
            .query("forms")
            .filter((q) => q.eq(q.field("_id"), args.formId))
            .unique();
        if (!form) {
            throw new Error("Form not found");
        }
        return form;
    },
});
export const getBySlug = query({
    args: {
        slug: v.string(),
    },
    handler: async (ctx, args) => {
        const form = await ctx.db
            .query("forms")
            .filter((q) => q.eq(q.field("slug"), args.slug))
            .unique();
        if (!form) {
            throw new Error("Form not found");
        }
        return form;
    },
});
export const getUserForms = query({
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (identity === null) {
            throw new Error("Not authenticated");
        }
        return ctx.db
            .query("forms")
            .filter((q) => q.eq(q.field("createdBy"), identity.subject))
            .collect();
    },
});
export const getFormForOwner = internalQuery({
    args: { formId: v.id("forms") },
    handler: async (ctx, args) => {
        // No auth check here, the action performs it after getting the result
        return await ctx.db.get(args.formId);
    },
});