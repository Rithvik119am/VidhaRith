// convex/files.ts
import { v } from "convex/values";
import {
  query,
  mutation, // Make sure mutation is imported
  internalAction,
  internalMutation,
  action, // Make sure action is imported if you use it
} from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// --- Internal Mutation (Optional but good practice for DB writes from actions) ---
export const internal_createFileRecord = internalMutation({
    args: {
        storageId: v.id("_storage"),
        name: v.string(),
        type: v.string(),
        userId: v.string(),
        // Optional: Add size if you want to store it - you can get it from ctx.storage.getMetadata
        // size: v.number() needs to be added to schema first
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("files", {
            storageId: args.storageId,
            name: args.name,
            type: args.type,
            userId: args.userId,
            // Optional: Pass size if you added it to args
            // size: args.size,
        });
    },
});


// --- Internal Action: Saves metadata AFTER successful upload ---
export const saveFileMetadata = internalAction({
  args: {
    storageId: v.id("_storage"),
    name: v.string(),
    type: v.string(),
    userId: v.string(),
    // Optional: Pass size from sendFile if you add it there
    // size: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.files.internal_createFileRecord, {
        storageId: args.storageId,
        name: args.name,
        type: args.type,
        userId: args.userId,
        // Optional: Pass size
        // size: args.size,
    });

    console.log(`Metadata saved for file: ${args.name}, StorageID: ${args.storageId}`);
  },
});

// --- Mutation: Client calls this to get an upload URL ---
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User must be logged in to upload files.");
    }
    return await ctx.storage.generateUploadUrl();
  },
});

// --- Mutation: Client calls this AFTER uploading the file to the URL ---
export const sendFile = mutation({
  args: {
    storageId: v.id("_storage"),
    name: v.string(),
    type: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("User must be logged in to save files.");
    }

    const fileMetadata = await ctx.storage.getMetadata(args.storageId);
     if (!fileMetadata) {
        throw new Error("File metadata not found for the provided storage ID.");
     }
    if (fileMetadata.size > MAX_FILE_SIZE_BYTES) {
        await ctx.storage.delete(args.storageId); // Clean up the large file
        throw new Error(`File size exceeds the limit of ${MAX_FILE_SIZE_MB} MB.`);
    }

    await ctx.scheduler.runAfter(0, internal.files.saveFileMetadata, {
      storageId: args.storageId,
      name: args.name,
      type: args.type,
      userId: identity.subject,
      // Optional: Pass size if you added it to internal_createFileRecord args/schema
      // size: fileMetadata.size,
    });

    console.log(
      `File upload processing initiated for user ${identity.subject}, file: ${args.name}`
    );
    return { message: "File processing started." };
  },
});

// --- Query: Get files uploaded by the currently logged-in user ---
export const getUserFiles = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return []; // Return empty for logged-out users
    }

    const files = await ctx.db
      .query("files")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect();

    return files;
  },
});


// --- OLD Query: getFileUrl (Commented out or removed) ---
// export const getFileUrl = query({
//     args: { storageId: v.id("_storage") },
//     handler: async (ctx, args) => {
//         const identity = await ctx.auth.getUserIdentity();
//         if (!identity) {
//             throw new Error("User must be logged in to download files.");
//         }
//         // Optional: Add authorization check here if needed.
//         // const fileRecord = await ctx.db.query("files").withIndex("by_storageId", q => q.eq("storageId", args.storageId)).first();
//         // if (!fileRecord || fileRecord.userId !== identity.subject) {
//         //      throw new Error("Not authorized to access this file.");
//         // }
//         const url = await ctx.storage.getUrl(args.storageId);
//         if (!url) {
//             throw new Error("Could not retrieve file URL.");
//         }
//         return url;
//     },
// });


// --- NEW Mutation: Get download URL for a file Imperatively ---
export const getDownloadUrl = mutation({ // Define as mutation
    args: { fileId: v.id("files") }, // Takes the DB file ID
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("User must be logged in to download files.");
        }

        // 1. Get the file record from the database to get storageId and verify ownership
        const fileRecord = await ctx.db.get(args.fileId);

        if (!fileRecord) {
            throw new Error("File not found.");
        }

        // 2. Check if the logged-in user owns this file (Authorization)
        if (fileRecord.userId !== identity.subject) {
             throw new Error("Not authorized to download this file.");
        }

        // 3. Get the temporary download URL using the storageId
        const url = await ctx.storage.getUrl(fileRecord.storageId);

        if (!url) {
            // This could happen if the storageId is invalid or the file was somehow deleted from storage
            throw new Error("Could not retrieve file URL from storage.");
        }

        // Return the URL
        return url;
    },
});


// --- Mutation: Delete a file (metadata and storage) ---
export const deleteFile = mutation({
    args: { fileId: v.id("files") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("User must be logged in to delete files.");
        }

        const fileRecord = await ctx.db.get(args.fileId);

        if (!fileRecord) {
            throw new Error("File not found.");
        }

        if (fileRecord.userId !== identity.subject) {
            throw new Error("User is not authorized to delete this file.");
        }

        await ctx.storage.delete(fileRecord.storageId);
        await ctx.db.delete(args.fileId);

        return { success: true };
    }
});