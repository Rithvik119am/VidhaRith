/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as aiQuestions from "../aiQuestions.js";
import type * as files from "../files.js";
import type * as form_fields from "../form_fields.js";
import type * as form_questions from "../form_questions.js";
import type * as form_responses from "../form_responses.js";
import type * as form_responses_analysis from "../form_responses_analysis.js";
import type * as forms from "../forms.js";
import type * as http from "../http.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  aiQuestions: typeof aiQuestions;
  files: typeof files;
  form_fields: typeof form_fields;
  form_questions: typeof form_questions;
  form_responses: typeof form_responses;
  form_responses_analysis: typeof form_responses_analysis;
  forms: typeof forms;
  http: typeof http;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
