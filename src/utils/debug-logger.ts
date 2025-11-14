/**
 * SPDX-FileCopyrightText: © 2025 John Freier
 * SPDX-License-Identifier: MIT
 *
 * Debug Logger Utility
 *
 * Provides opt-in debug logging for development and troubleshooting.
 * Tracks request IDs, timing, and API call patterns without exposing sensitive data.
 */

export interface DebugContext {
  requestId: string;
  toolName: string;
  userId?: string;
  startTime: number;
}

export interface ApiCallLog {
  method: string;
  path: string;
  duration: number;
  status?: number;
  error?: string;
}

export interface DebugInfo {
  request_id: string;
  tool_name: string;
  timing: {
    total_ms: number;
    api_calls: ApiCallLog[];
  };
  api_summary: {
    total_calls: number;
    total_api_time_ms: number;
    success_count: number;
    error_count: number;
  };
}

export class DebugLogger {
  private enabled: boolean;
  private contexts: Map<string, DebugContext>;
  private apiCalls: Map<string, ApiCallLog[]>;

  constructor(enabled: boolean = false) {
    this.enabled = enabled;
    this.contexts = new Map();
    this.apiCalls = new Map();
  }

  /**
   * Start tracking a new request
   * @param toolName Name of the MCP tool being executed
   * @param userId Optional user ID for multi-tenant tracking
   * @returns Request ID for subsequent logging
   */
  startRequest(toolName: string, userId?: string): string {
    if (!this.enabled) return '';

    const requestId = this.generateRequestId();
    const context: DebugContext = {
      requestId,
      toolName,
      userId,
      startTime: Date.now()
    };

    this.contexts.set(requestId, context);
    this.apiCalls.set(requestId, []);

    console.log(`[DEBUG] Request ${requestId} started: ${toolName}${userId ? ` (user: ${userId})` : ''}`);
    return requestId;
  }

  /**
   * Log an API call made during request execution
   * @param requestId Request ID from startRequest()
   * @param method HTTP method (GET, POST, etc.)
   * @param path API endpoint path (sanitized, no IDs)
   * @param duration Call duration in milliseconds
   * @param status HTTP status code
   * @param error Error message if call failed
   */
  logApiCall(
    requestId: string,
    method: string,
    path: string,
    duration: number,
    status?: number,
    error?: string
  ): void {
    if (!this.enabled || !requestId) return;

    const calls = this.apiCalls.get(requestId) || [];
    calls.push({ method, path, duration, status, error });
    this.apiCalls.set(requestId, calls);

    const statusStr = status ? `${status}` : error ? 'ERROR' : 'N/A';
    console.log(
      `[DEBUG] ${requestId} API: ${method} ${this.sanitizePath(path)} - ${duration}ms (${statusStr})`
    );
  }

  /**
   * End request tracking and return debug info
   * @param requestId Request ID from startRequest()
   * @returns Debug information or null if debug disabled
   */
  endRequest(requestId: string): DebugInfo | null {
    if (!this.enabled || !requestId) return null;

    const context = this.contexts.get(requestId);
    const apiCalls = this.apiCalls.get(requestId) || [];

    if (!context) return null;

    const totalMs = Date.now() - context.startTime;
    const totalApiTime = apiCalls.reduce((sum, call) => sum + call.duration, 0);
    const successCount = apiCalls.filter(c => !c.error).length;
    const errorCount = apiCalls.filter(c => c.error).length;

    const debugInfo: DebugInfo = {
      request_id: requestId,
      tool_name: context.toolName,
      timing: {
        total_ms: totalMs,
        api_calls: apiCalls.map(call => ({
          ...call,
          path: this.sanitizePath(call.path)
        }))
      },
      api_summary: {
        total_calls: apiCalls.length,
        total_api_time_ms: totalApiTime,
        success_count: successCount,
        error_count: errorCount
      }
    };

    console.log(
      `[DEBUG] Request ${requestId} completed: ${totalMs}ms total, ` +
      `${apiCalls.length} API calls (${successCount} success, ${errorCount} errors)`
    );

    // Clean up
    this.contexts.delete(requestId);
    this.apiCalls.delete(requestId);

    return debugInfo;
  }

  /**
   * Check if debug logging is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Generate a short request ID (8 characters)
   */
  private generateRequestId(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < 8; i++) {
      id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id;
  }

  /**
   * Sanitize API path to remove sensitive IDs
   * Examples:
   *   /team/123456/task/abc123 -> /team/{id}/task/{id}
   *   /list/901234 -> /list/{id}
   */
  private sanitizePath(path: string): string {
    // Replace numeric IDs (6+ digits) and alphanumeric IDs with {id}
    return path
      .replace(/\/\d{6,}/g, '/{id}')           // Numeric IDs (6+ digits)
      .replace(/\/[a-z0-9]{8,}/gi, '/{id}');   // Alphanumeric IDs (8+ chars)
  }
}

// Singleton instance
let debugLoggerInstance: DebugLogger | null = null;

/**
 * Get the global debug logger instance
 * Reads ENABLE_DEBUG from configuration on first call
 */
export function getDebugLogger(enabled?: boolean): DebugLogger {
  if (!debugLoggerInstance) {
    // Allow explicit override, otherwise read from config
    if (enabled === undefined) {
      try {
        const config = require('../config').default;
        enabled = config.enableDebug;
      } catch (e) {
        // Fallback if config not available
        enabled = process.env.ENABLE_DEBUG === 'true';
      }
    }

    debugLoggerInstance = new DebugLogger(enabled);

    if (enabled) {
      console.log('[DEBUG] Debug logging ENABLED');
    }
  }
  return debugLoggerInstance;
}
