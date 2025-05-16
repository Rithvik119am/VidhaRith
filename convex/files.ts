import { v,ConvexError } from "convex/values";
import {
  query,
  mutation,
  internalAction,
  internalMutation,
  action,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { internalQuery } from "./_generated/server";
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const internal_createFileRecord = internalMutation({
    args: {
        storageId: v.id("_storage"),
        name: v.string(),
        type: v.string(),
        userId: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("files", {
            storageId: args.storageId,
            name: args.name,
            type: args.type,
            userId: args.userId,
        });
    },
});
export const saveFileMetadata = internalAction({
  args: {
    storageId: v.id("_storage"),
    name: v.string(),
    type: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.files.internal_createFileRecord, {
        storageId: args.storageId,
        name: args.name,
        type: args.type,
        userId: args.userId,
    });
    console.log(`Metadata saved for file: ${args.name}, StorageID: ${args.storageId}`);
  },
});
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {error:"User must be logged in to upload files."};
    }
  const userFiles = await ctx.db
    .query("files")
    .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
    .collect();
  const fileCount = userFiles.length;
  const MAX_NO_OF_FILES = 4;
  if (fileCount >= MAX_NO_OF_FILES) {
    return  { error: `You have reached the maximum number of ${MAX_NO_OF_FILES} files.` };
  }
    return await ctx.storage.generateUploadUrl();
  },
});
export const sendFile = mutation({
  args: {
    storageId: v.id("_storage"),
    name: v.string(),
    type: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return  { error:"User must be logged in to save files."};
    }
    const fileMetadata = await ctx.storage.getMetadata(args.storageId);
     if (!fileMetadata) {
        return  { error:"File metadata not found for the provided storage ID."};
     }
    if (fileMetadata.size > MAX_FILE_SIZE_BYTES) {
        await ctx.storage.delete(args.storageId);
        return  { error:`File size exceeds the limit of ${MAX_FILE_SIZE_MB} MB.`};
    }
    await ctx.scheduler.runAfter(0, internal.files.saveFileMetadata, {
      storageId: args.storageId,
      name: args.name,
      type: args.type,
      userId: identity.subject,
    });
    console.log(
      `File upload processing initiated for user ${identity.subject}, file: ${args.name}`
    );
    return { message: "File processing started." };
  },
});
export const getUserFiles = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    const files = await ctx.db
      .query("files")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect();
    return files;
  },
});
export const getDownloadUrl = mutation({
    args: { fileId: v.id("files") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new ConvexError("User must be logged in to download files.");
        }
        const fileRecord = await ctx.db.get(args.fileId);
        if (!fileRecord) {
            throw new ConvexError("File not found.");
        }
        if (fileRecord.userId !== identity.subject) {
             throw new ConvexError("Not authorized to download this file.");
        }
        const url = await ctx.storage.getUrl(fileRecord.storageId);
        if (!url) {
            throw new ConvexError("Could not retrieve file URL from storage.");
        }
        return url;
    },
});
export const deleteFile = mutation({
    args: { fileId: v.id("files") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new ConvexError("User must be logged in to delete files.");
        }
        const fileRecord = await ctx.db.get(args.fileId);
        if (!fileRecord) {
            throw new ConvexError("File not found.");
        }
        if (fileRecord.userId !== identity.subject) {
            throw new ConvexError("User is not authorized to delete this file.");
        }
        await ctx.storage.delete(fileRecord.storageId);
        await ctx.db.delete(args.fileId);
        return { success: true };
    }
});
export const getFileRecordByStorageId = internalQuery({
     args: { storageId: v.id("_storage") },
     handler: async (ctx, args) => {
         const fileRecord = await ctx.db
            .query("files")
            .withIndex("by_storageId", q => q.eq("storageId", args.storageId))
            .first();
        return fileRecord;
     },
});