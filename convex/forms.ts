import { ConvexError, v } from 'convex/values';
import { mutation, query, internalQuery } from './_generated/server';
import { AnyDataModel, GenericMutationCtx } from 'convex/server';
import {rateLimiter} from "./rate_limit";
const generateUniqueSlug = async (ctx: GenericMutationCtx<AnyDataModel>) => {
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
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (identity === null) {
            throw new ConvexError("Not authenticated");
        }
        await rateLimiter.limit(ctx, "formsCreation",{
            key: identity.subject,
            throws: true,
        });
        console.log("Creating form for user ID", identity.subject);
        const newFormId = await ctx.db.insert("forms", {
            createdBy: identity.subject,
            slug: await generateUniqueSlug(ctx),
            acceptingResponses: true,
            startTime: undefined,
            endTime: undefined,
            timeLimitMinutes: undefined,
            generationStatus: "not generating",
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
        startTime: v.optional(v.int64()),
        endTime: v.optional(v.int64()),
        timeLimitMinutes: v.optional(v.int64()),
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
            throw new ConvexError("Form not found or you don't have permission");
        }

        const formBySlug = await ctx.db
            .query("forms")
            .filter((q) => q.eq(q.field("slug"), args.slug))
            .first();
        if (formBySlug && formBySlug._id !== args.formId) {
            throw new ConvexError("Form with this slug already exists");
        }

        const formsOfThisUser = await ctx.db
        .query("forms")
        .filter((q) => q.eq(q.field("createdBy"), identity.subject))
        .collect();
        const sameNameForms = formsOfThisUser.filter((f) => f.name === args.name.trim());

        if (sameNameForms.length > 0 && sameNameForms[0]._id !== args.formId) {
            throw new ConvexError("Form with this name already exists for this user");
        }

        if (args.startTime && args.endTime && args.endTime <= args.startTime) {
            throw new ConvexError("End time must be after start time.");
        }
        if (args.timeLimitMinutes !== undefined && args.timeLimitMinutes !== null && args.timeLimitMinutes <= 0) {
             throw new ConvexError("Time limit must be a positive number of minutes.");
        }


        await ctx.db
            .patch(args.formId, {
                name: args.name,
                description: args.description,
                slug: args.slug,
                startTime: args.startTime,
                endTime: args.endTime,
                timeLimitMinutes: args.timeLimitMinutes,
            });
    },
});

export const toggleStatus = mutation({
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
            throw new ConvexError("Form not found or you don't have permission");
        }

        const newStatus = !form.acceptingResponses;
        await ctx.db.patch(args.formId, { acceptingResponses: newStatus });

        return { newStatus }; 
    }
});


export const deleteForm = mutation({
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
            throw new ConvexError("Form not found or you don't have permission");
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
            return form; 
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
            throw new ConvexError("Form not found");
        }
        return form;
    },
});
export const getUserForms = query({
    handler: async (ctx) => { 
        const identity = await ctx.auth.getUserIdentity();
        if (identity === null) {
            return [];
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
        return await ctx.db.get(args.formId);
    },
});