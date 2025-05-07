// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    forms: defineTable({
        createdBy: v.string(),
        description: v.optional(v.string()),
        name: v.optional(v.string()),
        slug: v.string(),
        // --- NEW FIELDS ---
        startTime: v.optional(v.int64()), // Optional start time (Unix timestamp ms)
        endTime: v.optional(v.int64()),   // Optional end time (Unix timestamp ms)
        acceptingResponses: v.boolean(), // Explicitly track if accepting responses (manual override)
        timeLimitMinutes: v.optional(v.int64()), // Optional time limit in minutes
        // --- END NEW FIELDS ---
        generationStatus: v.union(v.literal("not generating"), v.literal("generating")),
      }).index("by_slug", ["slug"]),
    form_responses: defineTable({
      formId: v.id("forms"),
      slug: v.optional(v.string()),
      score: v.optional(v.float64()),
      values: v.array(
        v.object({ questionId:v.id("form_questions") , question: v.string(), userSelectedOption: v.string() })
      ),
       // --- NEW FIELD (For Time Limit Tracking) ---
       submittedAt: v.int64(), // Timestamp when the response was submitted
       sessionStartTime: v.optional(v.int64()) // Timestamp when the user started this attempt (needed for time limit)
      // --- END NEW FIELD ---
    }).index("by_formId", ["formId"]),

    form_questions: defineTable({
      formId: v.id("forms"),
      question: v.string(),
      order: v.int64(),
      type: v.string(),
      selectOptions: v.optional(v.array(v.string())),
      answer:v.string(),
    }).index("by_formId", ["formId"]),
    
    files: defineTable({
      name: v.string(),               // Original filename
      type: v.string(),               // MIME type (e.g., 'image/png')
      storageId: v.id("_storage"),    // ID linking to the file in Convex Storage
      userId: v.string(),             // ID of the user who uploaded the file
  }).index("by_userId", ["userId"])    // Index to quickly query files by user
    .index("by_storageId", ["storageId"]), // Index might be useful for cleanup tasks
    form_responses_analysis: defineTable({
      formId: v.id("forms"),
      analysis:v.object({
        individualAnalysis: v.array(
          v.object({
            responseId: v.id("form_responses"),
            performanceByTopic:v.object({
                correct: v.number(),
                total: v.number(),
                percentage: v.number(),
              }),
            weakTopics: v.array(v.string()),
            strongTopics: v.array(v.string()),
            individualFocusAreas: v.array(v.string()),
          })
        ),
        collectiveAnalysis: v.object({
          topicPerformanceSummary: v.object({
              correct: v.number(),
              total: v.number(),
              percentage: v.number(),
            }),
          collectiveWeaknesses: v.array(v.string()),
          collectiveFocusAreas: v.array(v.string()),
        }),
      })
    }).index("by_formId", ["formId"]),
});