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
import type * as analytics from "../analytics.js";
import type * as exercises from "../exercises.js";
import type * as lib_pr_detection from "../lib/pr_detection.js";
import type * as lib_streak_calculator from "../lib/streak_calculator.js";
import type * as lib_validate from "../lib/validate.js";
import type * as sets from "../sets.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  exercises: typeof exercises;
  "lib/pr_detection": typeof lib_pr_detection;
  "lib/streak_calculator": typeof lib_streak_calculator;
  "lib/validate": typeof lib_validate;
  sets: typeof sets;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
