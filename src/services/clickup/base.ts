/**
 * SPDX-FileCopyrightText: © 2025 John Freier
 * SPDX-License-Identifier: MIT
 *
 * Base ClickUp Service Class
 * 
 * This class provides core functionality for all ClickUp service modules:
 * - Axios client configuration
 * - Rate limiting and request throttling
 * - Error handling
 * - Common request methods
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { Logger, LogLevel } from '../../logger.js';
import { ErrorType, ToolErrorResponse, createErrorResponse } from '../../types/responses.js';
import { getDebugLogger, DebugLogger, DebugInfo } from '../../utils/debug-logger.js';

/**
 * Basic service response interface
 */
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  }
}

/**
 * Error types for better error handling
 */
export enum ErrorCode {
  RATE_LIMIT = 'rate_limit_exceeded',
  NOT_FOUND = 'resource_not_found',
  UNAUTHORIZED = 'unauthorized',
  VALIDATION = 'validation_error',
  SERVER_ERROR = 'server_error',
  NETWORK_ERROR = 'network_error',
  WORKSPACE_ERROR = 'workspace_error',
  INVALID_PARAMETER = 'invalid_parameter',
  UNKNOWN = 'unknown_error'
}

/**
 * Custom error class for ClickUp API errors
 */
export class ClickUpServiceError extends Error {
  readonly code: ErrorCode;
  readonly data?: any;
  readonly status?: number;
  readonly retryAfter?: number;  // Seconds to wait before retrying
  context?: Record<string, any>;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.UNKNOWN,
    data?: any,
    status?: number,
    context?: Record<string, any>,
    retryAfter?: number
  ) {
    super(message);
    this.name = 'ClickUpServiceError';
    this.code = code;
    this.data = data;
    this.status = status;
    this.context = context;
    this.retryAfter = retryAfter;
  }

  /**
   * Map ErrorCode to standardized ErrorType
   */
  static toErrorType(code: ErrorCode): ErrorType {
    switch (code) {
      case ErrorCode.RATE_LIMIT:
        return 'RATE_LIMIT';
      case ErrorCode.NOT_FOUND:
        return 'NOT_FOUND';
      case ErrorCode.UNAUTHORIZED:
        return 'AUTH';
      case ErrorCode.VALIDATION:
      case ErrorCode.INVALID_PARAMETER:
        return 'VALIDATION';
      case ErrorCode.SERVER_ERROR:
      case ErrorCode.NETWORK_ERROR:
      case ErrorCode.WORKSPACE_ERROR:
      case ErrorCode.UNKNOWN:
      default:
        return 'API_ERROR';
    }
  }

  /**
   * Generate suggested action based on error code
   */
  static getSuggestedAction(code: ErrorCode): string {
    switch (code) {
      case ErrorCode.RATE_LIMIT:
        return 'Wait for rate limit to reset or upgrade to Premium tier for higher limits (500 req/min)';
      case ErrorCode.UNAUTHORIZED:
        return 'Check API key validity or refresh OAuth token via /auth/refresh endpoint';
      case ErrorCode.NOT_FOUND:
        return 'Verify resource ID or use search/list tools to find the correct ID';
      case ErrorCode.VALIDATION:
      case ErrorCode.INVALID_PARAMETER:
        return 'Check input parameters against API documentation and ensure all required fields are provided';
      case ErrorCode.WORKSPACE_ERROR:
        return 'Verify workspace hierarchy and ensure you have access to the requested resource';
      case ErrorCode.NETWORK_ERROR:
        return 'Check network connectivity and try again. If the problem persists, contact support';
      case ErrorCode.SERVER_ERROR:
        return 'ClickUp API is experiencing issues. Try again later or check ClickUp status page';
      default:
        return 'Review error details and try again. If the problem persists, create a GitHub issue';
    }
  }

  /**
   * Convert to standardized ToolErrorResponse format
   */
  toToolErrorResponse(): ToolErrorResponse {
    return createErrorResponse({
      code: this.code,
      message: this.message,
      type: ClickUpServiceError.toErrorType(this.code),
      retry_after: this.retryAfter,
      suggested_action: ClickUpServiceError.getSuggestedAction(this.code),
      details: {
        status: this.status,
        context: this.context,
        data: this.data
      }
    });
  }
}

/**
 * Rate limit response headers from ClickUp API
 */
interface RateLimitHeaders {
  'x-ratelimit-limit': number;
  'x-ratelimit-remaining': number;
  'x-ratelimit-reset': number;
}

/**
 * Retry configuration for automatic retries
 */
interface RetryConfig {
  maxRetries: number;
  baseDelay: number;       // Base delay in milliseconds
  maxDelay: number;        // Maximum delay in milliseconds
  retryableErrors: ErrorCode[];
}

/**
 * Retry telemetry for tracking retry attempts
 */
interface RetryTelemetry {
  attempted: number;       // Number of retries attempted
  total_delay_ms: number; // Total time spent waiting for retries
  last_error?: string;    // Last error message before success
}

/**
 * Helper function to safely parse JSON
 * @param data Data to parse
 * @param fallback Optional fallback value if parsing fails
 * @returns Parsed JSON or fallback value
 */
function safeJsonParse(data: any, fallback: any = undefined): any {
  if (typeof data !== 'string') {
    return data;
  }
  
  try {
    return JSON.parse(data);
  } catch (error) {
    return fallback;
  }
}

/**
 * Base ClickUp service class that handles common functionality
 */
export class BaseClickUpService {
  protected readonly apiKey: string;
  protected readonly teamId: string;
  protected readonly client: AxiosInstance;
  protected readonly logger: Logger;
  protected readonly debugLogger: DebugLogger;

  protected readonly defaultRequestSpacing = 600; // Default milliseconds between requests
  protected readonly rateLimit = 100; // Maximum requests per minute (Free Forever plan)
  protected requestSpacing: number; // Current request spacing, can be adjusted
  protected readonly timeout = 65000; // 65 seconds (safely under the 1-minute window)
  protected requestQueue: (() => Promise<any>)[] = [];
  protected processingQueue = false;
  protected lastRateLimitReset: number = 0;

  // Track current rate limit state for metadata
  protected currentRateLimit?: {
    limit: number;
    remaining: number;
    reset_at: number;
  };

  // Retry configuration
  protected readonly retryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 100,     // Start with 100ms
    maxDelay: 5000,     // Cap at 5 seconds
    retryableErrors: [
      ErrorCode.RATE_LIMIT,
      ErrorCode.NETWORK_ERROR,
      ErrorCode.SERVER_ERROR  // 5xx errors
    ]
  };

  // Track retry telemetry for current request
  protected currentRetryTelemetry?: RetryTelemetry;

  // Track debug request ID for current tool execution
  protected currentDebugRequestId?: string;
  protected currentDebugInfo?: DebugInfo;

  /**
   * Creates an instance of BaseClickUpService.
   * @param apiKey - ClickUp API key for authentication
   * @param teamId - ClickUp team ID for targeting the correct workspace
   * @param baseUrl - Optional custom base URL for the ClickUp API
   */
  constructor(apiKey: string, teamId: string, baseUrl: string = 'https://api.clickup.com/api/v2') {
    this.apiKey = apiKey;
    this.teamId = teamId;
    this.requestSpacing = this.defaultRequestSpacing;
    
    // Create a logger with the actual class name for better context
    const className = this.constructor.name;
    this.logger = new Logger(`ClickUp:${className}`);
    this.debugLogger = getDebugLogger();

    // Configure the Axios client with default settings
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json'
      },
      timeout: this.timeout,
      transformResponse: [
        // Add custom response transformer to handle both JSON and text responses
        (data: any) => {
          if (!data) return data;
          
          // If it's already an object, return as is
          if (typeof data !== 'string') return data;
          
          // Try to parse as JSON, fall back to raw text if parsing fails
          const parsed = safeJsonParse(data, null);
          return parsed !== null ? parsed : data;
        }
      ]
    });

    this.logger.debug(`Initialized ${className}`, { teamId, baseUrl });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      error => this.handleAxiosError(error)
    );
  }

  /**
   * Handle errors from Axios requests
   * @private
   * @param error Error from Axios
   * @returns Never - always throws an error
   */
  private handleAxiosError(error: any): never {
    // Determine error details
    const status = error.response?.status;
    const responseData = error.response?.data;
    const errorMsg = responseData?.err || responseData?.error || error.message || 'Unknown API error';
    const path = error.config?.url || 'unknown path';
    
    // Context object for providing more detailed log information
    const errorContext: {
      path: string;
      status: number | undefined;
      method: string;
      requestData: any;
      retryAfter?: number;
      rateLimitInfo?: {
        limit: number;
        remaining: number;
        reset: number;
        timeToReset: number;
      };
    } = {
      path,
      status,
      method: error.config?.method?.toUpperCase() || 'UNKNOWN',
      requestData: error.config?.data ? safeJsonParse(error.config.data, error.config.data) : undefined
    };

    // Pick the appropriate error code based on status
    let code: ErrorCode;
    let logMessage: string;
    let errorMessage: string;
    let retryAfterSeconds: number | undefined;

    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      code = ErrorCode.NETWORK_ERROR;
      logMessage = `Request timeout for ${path}`;
      errorMessage = 'Request timed out. Please try again.';
    } else if (!error.response) {
      code = ErrorCode.NETWORK_ERROR;
      logMessage = `Network error accessing ${path}: ${error.message}`;
      errorMessage = 'Network error. Please check your connection and try again.';
    } else if (status === 429) {
      code = ErrorCode.RATE_LIMIT;
      this.handleRateLimitHeaders(error.response.headers);

      // Extract Retry-After header (standard HTTP header)
      // Can be either seconds (integer) or HTTP-date (string)
      const retryAfter = error.response.headers['retry-after'];
      if (retryAfter) {
        const retryAfterInt = parseInt(retryAfter, 10);
        if (!isNaN(retryAfterInt)) {
          // Retry-After is in seconds
          retryAfterSeconds = retryAfterInt;
        } else {
          // Retry-After is HTTP-date format - calculate seconds until that time
          const retryAfterDate = new Date(retryAfter);
          if (!isNaN(retryAfterDate.getTime())) {
            retryAfterSeconds = Math.max(0, Math.ceil((retryAfterDate.getTime() - Date.now()) / 1000));
          }
        }
      }

      // Calculate time until reset from ClickUp's custom headers
      const reset = error.response.headers['x-ratelimit-reset'];
      const now = Date.now() / 1000; // Convert to seconds
      const timeToReset = Math.max(0, reset - now);
      const resetMinutes = Math.ceil(timeToReset / 60);

      // Use Retry-After if available, otherwise use time to reset
      const waitSeconds = retryAfterSeconds || timeToReset;
      errorContext.retryAfter = waitSeconds;

      logMessage = `Rate limit exceeded for ${path}`;
      errorMessage = `Rate limit exceeded. Please wait ${resetMinutes} minute${resetMinutes === 1 ? '' : 's'} before trying again.`;

      // Add more context to the error
      errorContext.rateLimitInfo = {
        limit: error.response.headers['x-ratelimit-limit'],
        remaining: error.response.headers['x-ratelimit-remaining'],
        reset: reset,
        timeToReset: timeToReset
      };
    } else if (status === 401 || status === 403) {
      code = ErrorCode.UNAUTHORIZED;
      logMessage = `Authorization failed for ${path}`;
      errorMessage = 'Authorization failed. Please check your API key.';
    } else if (status === 404) {
      code = ErrorCode.NOT_FOUND;
      logMessage = `Resource not found: ${path}`;
      errorMessage = 'Resource not found.';
    } else if (status >= 400 && status < 500) {
      code = ErrorCode.VALIDATION;
      logMessage = `Validation error for ${path}: ${errorMsg}`;
      errorMessage = errorMsg;
    } else if (status >= 500) {
      code = ErrorCode.SERVER_ERROR;
      logMessage = `ClickUp server error: ${errorMsg}`;
      errorMessage = 'ClickUp server error. Please try again later.';
    } else {
      code = ErrorCode.UNKNOWN;
      logMessage = `Unknown API error: ${errorMsg}`;
      errorMessage = 'An unexpected error occurred. Please try again.';
    }

    // Log the error with context
    this.logger.error(logMessage, errorContext);

    // Throw a formatted error with user-friendly message
    throw new ClickUpServiceError(errorMessage, code, error, status, errorContext, retryAfterSeconds);
  }

  /**
   * Handle rate limit headers from ClickUp API
   * @private
   * @param headers Response headers from ClickUp
   */
  private handleRateLimitHeaders(headers: any): void {
    try {
      // Parse the rate limit headers
      const limit = headers['x-ratelimit-limit'];
      const remaining = headers['x-ratelimit-remaining'];
      const reset = headers['x-ratelimit-reset'];

      // Store current rate limit state for metadata
      if (limit && remaining !== undefined && reset) {
        this.currentRateLimit = {
          limit: parseInt(limit, 10),
          remaining: parseInt(remaining, 10),
          reset_at: parseInt(reset, 10) * 1000 // Convert to milliseconds
        };
      }

      // Only log if we're getting close to the limit
      if (remaining < limit * 0.2) {
        this.logger.warn('Approaching rate limit', { remaining, limit, reset });
      } else {
        this.logger.debug('Rate limit status', { remaining, limit, reset });
      }

      if (reset) {
        this.lastRateLimitReset = reset;
        
        // If reset is in the future, calculate a safe request spacing
        const now = Date.now();
        const resetTime = reset * 1000; // convert to milliseconds
        const timeToReset = Math.max(0, resetTime - now);
        
        // Proactively adjust spacing when remaining requests get low
        // This helps avoid hitting rate limits in the first place
        if (remaining < limit * 0.3) {
          // More aggressive spacing when close to limit
          let safeSpacing;
          
          if (remaining <= 5) {
            // Very aggressive spacing for last few requests
            safeSpacing = Math.ceil((timeToReset / remaining) * 2);
            // Start processing in queue mode preemptively
            if (!this.processingQueue) {
              this.logger.info('Preemptively switching to queue mode (low remaining requests)', { 
                remaining, 
                limit 
              });
              this.processingQueue = true;
              this.processQueue().catch(err => {
                this.logger.error('Error processing request queue', err);
              });
            }
          } else if (remaining <= 20) {
            // More aggressive spacing
            safeSpacing = Math.ceil((timeToReset / remaining) * 1.5);
          } else {
            // Standard safe spacing with buffer
            safeSpacing = Math.ceil((timeToReset / remaining) * 1.1);
          }
          
          // Apply updated spacing, but with a reasonable maximum
          const maxSpacing = 5000; // 5 seconds max spacing
          const adjustedSpacing = Math.min(safeSpacing, maxSpacing);
          
          // Only adjust if it's greater than our current spacing
          if (adjustedSpacing > this.requestSpacing) {
            this.logger.debug(`Adjusting request spacing: ${this.requestSpacing}ms → ${adjustedSpacing}ms`, { 
              remaining, 
              timeToReset 
            });
            this.requestSpacing = adjustedSpacing;
          }
        }
      }
    } catch (error) {
      this.logger.warn('Failed to parse rate limit headers', error);
    }
  }

  /**
   * Process the request queue, respecting rate limits by spacing out requests
   * @private
   */
  private async processQueue(): Promise<void> {
    if (this.requestQueue.length === 0) {
      this.logger.debug('Queue empty, exiting queue processing mode');
      this.processingQueue = false;
      return;
    }

    const queueLength = this.requestQueue.length;
    this.logger.debug(`Processing request queue (${queueLength} items)`);

    const startTime = Date.now();
    try {
      // Take the first request from the queue
      const request = this.requestQueue.shift();
      if (request) {
        // Adjust delay based on queue size
        // Longer delays for bigger queues to prevent overwhelming the API
        let delay = this.requestSpacing;
        if (queueLength > 20) {
          delay = this.requestSpacing * 2;
        } else if (queueLength > 10) {
          delay = this.requestSpacing * 1.5;
        }
        
        // Wait for the calculated delay
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Run the request
        await request();
      }
    } catch (error) {
      if (error instanceof ClickUpServiceError && error.code === ErrorCode.RATE_LIMIT) {
        // If we still hit rate limits, increase the spacing
        this.requestSpacing = Math.min(this.requestSpacing * 1.5, 10000); // Max 10s
        this.logger.warn(`Rate limit hit during queue processing, increasing delay to ${this.requestSpacing}ms`);
      } else {
        this.logger.error('Error executing queued request', error);
      }
    } finally {
      const duration = Date.now() - startTime;
      this.logger.trace(`Queue item processed in ${duration}ms, ${this.requestQueue.length} items remaining`);
      
      // Continue processing the queue after the calculated delay
      setTimeout(() => this.processQueue(), this.requestSpacing);
    }
  }

  /**
   * Makes an API request with rate limiting.
   * @protected
   * @param fn - Function that executes the API request
   * @returns Promise that resolves with the result of the API request
   */
  protected async makeRequest<T>(fn: () => Promise<T>): Promise<T> {
    // If we're being rate limited, queue the request rather than executing immediately
    if (this.processingQueue) {
      const queuePosition = this.requestQueue.length + 1;
      const estimatedWaitTime = Math.ceil((queuePosition * this.requestSpacing) / 1000);
      
      this.logger.info('Request queued due to rate limiting', {
        queuePosition,
        estimatedWaitSeconds: estimatedWaitTime,
        currentSpacing: this.requestSpacing
      });

      return new Promise<T>((resolve, reject) => {
        this.requestQueue.push(async () => {
          try {
            const result = await fn();
            resolve(result);
          } catch (error) {
            // Enhance error message with queue context if it's a rate limit error
            if (error instanceof ClickUpServiceError && error.code === ErrorCode.RATE_LIMIT) {
              const enhancedError = new ClickUpServiceError(
                `${error.message} (Request was queued at position ${queuePosition})`,
                error.code,
                error.data
              );
              reject(enhancedError);
            } else {
              reject(error);
            }
          }
        });
      });
    }

    // Track request metadata
    let requestMethod = 'unknown';
    let requestPath = 'unknown';
    let requestData: any = undefined;

    // Set up interceptor to capture request details
    const requestInterceptorId = this.client.interceptors.request.use(
      (config) => {
        // Capture request metadata
        requestMethod = config.method?.toUpperCase() || 'unknown';
        requestPath = config.url || 'unknown';
        requestData = config.data;
        return config;
      }
    );

    const startTime = Date.now();
    try {
      // Execute the request function with automatic retry
      const result = await this.executeWithRetry(
        fn,
        `${requestMethod} ${requestPath}`
      );

      // Debug log for successful requests with timing information
      const duration = Date.now() - startTime;
      this.logger.debug(`Request completed successfully in ${duration}ms`, {
        method: requestMethod,
        path: requestPath,
        duration,
        responseType: result ? typeof result : 'undefined'
      });

      // Log API call for debug mode
      if (this.currentDebugRequestId) {
        this.debugLogger.logApiCall(
          this.currentDebugRequestId,
          requestMethod,
          requestPath,
          duration,
          200 // Success status
        );
      }

      return result;
    } catch (error) {
      // If we hit a rate limit, start processing the queue
      if (error instanceof ClickUpServiceError && error.code === ErrorCode.RATE_LIMIT) {
        this.logger.warn('Rate limit reached, switching to queue mode', {
          reset: this.lastRateLimitReset,
          queueLength: this.requestQueue.length
        });
        
        if (!this.processingQueue) {
          this.processingQueue = true;
          this.processQueue().catch(err => {
            this.logger.error('Error processing request queue', err);
          });
        }

        // Queue this failed request and return a promise that will resolve when it's retried
        return new Promise<T>((resolve, reject) => {
          this.requestQueue.push(async () => {
            try {
              const result = await fn();
              resolve(result);
            } catch (retryError) {
              reject(retryError);
            }
          });
        });
      }

      // Log error for debug mode
      if (this.currentDebugRequestId && error instanceof ClickUpServiceError) {
        const duration = Date.now() - startTime;
        this.debugLogger.logApiCall(
          this.currentDebugRequestId,
          requestMethod,
          requestPath,
          duration,
          error.status,
          error.message
        );
      }

      // For other errors, just throw
      throw error;
    } finally {
      // Always remove the interceptor
      this.client.interceptors.request.eject(requestInterceptorId);

      // End debug request and capture debug info
      if (this.currentDebugRequestId) {
        this.currentDebugInfo = this.debugLogger.endRequest(this.currentDebugRequestId);
        this.currentDebugRequestId = undefined; // Clear for next request
      }
    }
  }

  /**
   * Gets the ClickUp team ID associated with this service instance
   * @returns The team ID
   */
  getTeamId(): string {
    return this.teamId;
  }

  /**
   * Get current rate limit metadata in standardized format
   * @returns Rate limit info or undefined if not yet available
   */
  getRateLimitMetadata(): { remaining: number; limit: number; reset_at: number } | undefined {
    return this.currentRateLimit;
  }

  /**
   * Get current retry telemetry metadata
   * @returns Retry telemetry or undefined if no retries occurred
   */
  getRetryTelemetry(): RetryTelemetry | undefined {
    return this.currentRetryTelemetry;
  }

  /**
   * Start debug request tracking (should be called by tool handlers)
   * @param toolName Name of the MCP tool being executed
   * @param userId Optional user ID for multi-tenant tracking
   */
  startDebugRequest(toolName: string, userId?: string): void {
    if (this.debugLogger.isEnabled()) {
      this.currentDebugRequestId = this.debugLogger.startRequest(toolName, userId);
    }
  }

  /**
   * Get debug information for current request
   * @returns Debug info or undefined if debug mode disabled
   */
  getDebugInfo(): DebugInfo | undefined {
    return this.currentDebugInfo;
  }

  /**
   * Calculate exponential backoff delay for retry attempts
   * @param attemptNumber Current retry attempt (0-based)
   * @param baseDelay Base delay in milliseconds
   * @param maxDelay Maximum delay in milliseconds
   * @param retryAfter Optional Retry-After value in seconds to respect
   * @returns Delay in milliseconds
   */
  protected calculateBackoffDelay(
    attemptNumber: number,
    baseDelay: number = this.retryConfig.baseDelay,
    maxDelay: number = this.retryConfig.maxDelay,
    retryAfter?: number
  ): number {
    // If Retry-After header is present, respect it
    if (retryAfter !== undefined && retryAfter > 0) {
      const retryAfterMs = retryAfter * 1000;
      // Add small jitter (0-10%) to prevent thundering herd
      const jitter = Math.random() * 0.1 * retryAfterMs;
      return Math.min(retryAfterMs + jitter, maxDelay);
    }

    // Exponential backoff: baseDelay * 2^attemptNumber
    // attempt 0: 100ms, 1: 200ms, 2: 400ms, 3: 800ms, etc.
    const exponentialDelay = baseDelay * Math.pow(2, attemptNumber);

    // Add jitter (0-10%) to prevent synchronized retries
    const jitter = Math.random() * 0.1 * exponentialDelay;

    // Cap at maxDelay
    return Math.min(exponentialDelay + jitter, maxDelay);
  }

  /**
   * Check if an error is retryable based on configuration
   * @param error ClickUpServiceError to check
   * @returns True if error should be retried
   */
  protected isRetryableError(error: ClickUpServiceError): boolean {
    return this.retryConfig.retryableErrors.includes(error.code);
  }

  /**
   * Sleep utility for retry delays
   * @param ms Milliseconds to sleep
   */
  protected async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Execute an operation with automatic retry logic
   * @param operation Async operation to execute
   * @param operationName Name for logging
   * @returns Result of the operation
   */
  protected async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string = 'request'
  ): Promise<T> {
    // Initialize retry telemetry
    this.currentRetryTelemetry = undefined;
    let lastError: ClickUpServiceError | undefined;
    let totalDelayMs = 0;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        // Execute the operation
        const result = await operation();

        // Log success if retries occurred
        if (attempt > 0) {
          this.logger.info(`${operationName} succeeded after ${attempt} retries`, {
            attempts: attempt,
            total_delay_ms: totalDelayMs
          });
        }

        return result;
      } catch (error: any) {
        // Convert to ClickUpServiceError if it isn't already
        const clickupError = error instanceof ClickUpServiceError
          ? error
          : new ClickUpServiceError(
              error.message || 'Unknown error',
              ErrorCode.UNKNOWN,
              error
            );

        lastError = clickupError;

        // Check if we should retry
        const shouldRetry = attempt < this.retryConfig.maxRetries && this.isRetryableError(clickupError);

        if (!shouldRetry) {
          // Not retryable or max retries reached
          if (attempt > 0) {
            // Store telemetry for failed retries
            this.currentRetryTelemetry = {
              attempted: attempt,
              total_delay_ms: totalDelayMs,
              last_error: clickupError.message
            };
          }
          throw clickupError;
        }

        // Calculate backoff delay
        const delay = this.calculateBackoffDelay(
          attempt,
          this.retryConfig.baseDelay,
          this.retryConfig.maxDelay,
          clickupError.retryAfter
        );

        totalDelayMs += delay;

        // Log retry attempt
        this.logger.warn(`${operationName} failed, retrying in ${delay}ms (attempt ${attempt + 1}/${this.retryConfig.maxRetries})`, {
          error: clickupError.code,
          message: clickupError.message,
          retry_after: clickupError.retryAfter,
          delay_ms: delay
        });

        // Wait before retrying
        await this.sleep(delay);
      }
    }

    // This should never be reached, but TypeScript requires it
    throw lastError || new ClickUpServiceError('Max retries exceeded', ErrorCode.UNKNOWN);
  }

  /**
   * Helper method to log API operations
   * @protected
   * @param operation - Name of the operation being performed
   * @param details - Details about the operation
   */
  protected logOperation(operation: string, details: any): void {
    this.logger.info(`Operation: ${operation}`, details);
  }

  /**
   * Log detailed information about a request (path and payload)
   * For trace level logging only
   */
  protected traceRequest(method: string, url: string, data?: any): void {
    if (this.logger.isLevelEnabled(LogLevel.TRACE)) {
      this.logger.trace(`${method} ${url}`, {
        payload: data,
        teamId: this.teamId
      });
    }
  }
} 