/**
 * Centralized error utilities.
 *
 * Normalizes unknown thrown values into a consistent shape so UI
 * components (and route handlers) can display errors without
 * pattern-matching on every possible error type.
 */

import { ZodError } from "zod";
import { ApiError } from "@/lib/api/client";

export type NormalizedError = {
  status: number;
  message: string;
  details?: string;
};

/**
 * Type guard for ApiError.
 */
export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}

/**
 * Returns true when the error signals that the user is not authenticated.
 */
export function isAuthError(err: unknown): boolean {
  return isApiError(err) && err.status === 401;
}

/**
 * Returns true when the error signals a permission denial.
 */
export function isForbiddenError(err: unknown): boolean {
  return isApiError(err) && err.status === 403;
}

/**
 * Returns true when the requested resource was not found.
 */
export function isNotFoundError(err: unknown): boolean {
  return isApiError(err) && err.status === 404;
}

/**
 * Normalize any thrown value into a `NormalizedError`.
 */
export function normalizeError(err: unknown): NormalizedError {
  if (err instanceof ApiError) {
    return {
      status: err.status,
      message: err.message,
      details: err.details ?? undefined,
    };
  }

  if (err instanceof ZodError) {
    const issues = err.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    return {
      status: 422,
      message: "Invalid data from server",
      details: issues,
    };
  }

  if (err instanceof Error) {
    return {
      status: 500,
      message: err.message,
    };
  }

  return {
    status: 500,
    message: "An unexpected error occurred",
  };
}

/**
 * Extract just the human-readable message from any error.
 * Safe to call anywhere — never throws.
 */
export function getErrorMessage(err: unknown): string {
  return normalizeError(err).message;
}
