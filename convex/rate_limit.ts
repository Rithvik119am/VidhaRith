import {
    HOUR,
    isRateLimitError,
    MINUTE,
    RateLimitConfig,
    RateLimiter,
    SECOND,
  } from "@convex-dev/rate-limiter";
  
import { components } from "./_generated/api";
export const rateLimiter = new RateLimiter(components.rateLimiter, {
    formsCreation: { kind: "token bucket", rate: 60, period: HOUR , capacity: 20},
    generateQuestions: { kind: "token bucket", rate: 2, period: MINUTE, capacity: 3 },
    responceAnalysis: { kind: "token bucket", rate: 2, period: MINUTE, capacity: 3 },
  });