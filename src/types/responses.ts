/*
 * SPDX-License-Identifier: MIT
 * SPDX-FileCopyrightText: © 2025 John Freier
 */

/**
 * Error types for standardized error handling
 */
export type ErrorType =
  | 'RATE_LIMIT'    // Rate limit exceeded
  | 'AUTH'          // Authentication/authorization failed
  | 'NOT_FOUND'     // Resource not found
  | 'VALIDATION'    // Input validation failed
  | 'API_ERROR';    // ClickUp API error

/**
 * Standardized success response for all MCP tools
 * @template T - The type of data being returned
 */
export interface ToolSuccessResponse<T> {
  /** Indicates successful operation */
  success: true;

  /** The actual response data */
  data: T;

  /** Optional metadata about the operation */
  metadata?: {
    /** ISO 8601 timestamp of when the operation completed */
    timestamp: string;

    /** Name of the tool that generated this response */
    tool_name: string;

    /** Execution time in milliseconds */
    execution_time_ms?: number;

    /** Rate limit information */
    rate_limit?: {
      /** Remaining requests in current window */
      remaining: number;
      /** Total requests allowed per window */
      limit: number;
      /** When the rate limit resets (Unix timestamp in ms) */
      reset_at: number;
    };

    /** Retry telemetry (only present if retries occurred) */
    retry?: {
      /** Number of retry attempts made */
      attempted: number;
      /** Total delay from retries in milliseconds */
      total_delay_ms: number;
      /** Last error message before success */
      last_error?: string;
    };

    /** Debug information (only present when ENABLE_DEBUG=true) */
    debug?: {
      /** Unique request ID for tracing */
      request_id: string;
      /** Tool name */
      tool_name: string;
      /** Timing breakdown */
      timing: {
        /** Total execution time in milliseconds */
        total_ms: number;
        /** Individual API call timings */
        api_calls: Array<{
          method: string;
          path: string;
          duration: number;
          status?: number;
          error?: string;
        }>;
      };
      /** API call summary statistics */
      api_summary: {
        /** Total number of API calls made */
        total_calls: number;
        /** Total time spent in API calls */
        total_api_time_ms: number;
        /** Number of successful API calls */
        success_count: number;
        /** Number of failed API calls */
        error_count: number;
      };
    };
  };
}

/**
 * Standardized error response for all MCP tools
 */
export interface ToolErrorResponse {
  /** Indicates failed operation */
  success: false;

  /** Error details */
  error: {
    /** Machine-readable error code (e.g., 'TASK_NOT_FOUND', 'INVALID_API_KEY') */
    code: string;

    /** Human-readable error message */
    message: string;

    /** Error category for programmatic handling */
    type: ErrorType;

    /** For rate limit errors: seconds to wait before retrying */
    retry_after?: number;

    /** Actionable guidance for resolving the error */
    suggested_action?: string;

    /** Additional error context */
    details?: Record<string, any>;
  };
}

/**
 * Union type for all tool responses
 */
export type ToolResponse<T> = ToolSuccessResponse<T> | ToolErrorResponse;

/**
 * Helper function to create a success response
 */
export function createSuccessResponse<T>(
  data: T,
  metadata?: Omit<ToolSuccessResponse<T>['metadata'], 'timestamp'>
): ToolSuccessResponse<T> {
  return {
    success: true,
    data,
    metadata: {
      timestamp: new Date().toISOString(),
      ...metadata,
    } as ToolSuccessResponse<T>['metadata'],
  };
}

/**
 * Helper function to create an error response
 */
export function createErrorResponse(
  error: ToolErrorResponse['error']
): ToolErrorResponse {
  return {
    success: false,
    error,
  };
}

/**
 * Helper to check if a response is successful
 */
export function isSuccessResponse<T>(
  response: ToolResponse<T>
): response is ToolSuccessResponse<T> {
  return response.success === true;
}

/**
 * Helper to check if a response is an error
 */
export function isErrorResponse<T>(
  response: ToolResponse<T>
): response is ToolErrorResponse {
  return response.success === false;
}
