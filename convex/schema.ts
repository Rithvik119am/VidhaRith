import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    forms: defineTable({
        createdBy: v.string(),
        description: v.optional(v.string()),
        name: v.optional(v.string()),
        slug: v.string(),
        startTime: v.optional(v.int64()),
        endTime: v.optional(v.int64()),
        acceptingResponses: v.boolean(),
        timeLimitMinutes: v.optional(v.int64()),
        generationStatus: v.union(v.literal("not generating"), v.literal("generating")),
      }).index("by_slug", ["slug"]),
    form_responses: defineTable({
      formId: v.id("forms"),
      slug: v.optional(v.string()),
      score: v.optional(v.float64()),
      values: v.array(
        v.object({ questionId:v.id("form_questions") , question: v.string(), userSelectedOption: v.string() })
      ),
       submittedAt: v.int64(),
       sessionStartTime: v.optional(v.int64()) 
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
      name: v.string(),               
      type: v.string(),               
      storageId: v.id("_storage"),    
      userId: v.string(),             
  }).index("by_userId", ["userId"])    
    .index("by_storageId", ["storageId"]), 
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