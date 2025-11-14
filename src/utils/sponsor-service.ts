/**
 * SPDX-FileCopyrightText: © 2025 John Freier
 * SPDX-License-Identifier: MIT
 *
 * Sponsor Service Module
 *
 * Provides configuration and utilities for user feedback messages
 */

import { Logger } from '../logger.js';
import config from '../config.js';
import { createSuccessResponse, ToolSuccessResponse } from '../types/responses.js';

// Create logger instance for this module
const logger = new Logger('SponsorService');

/**
 * SponsorService - Provides feedback message configuration and handling
 */
export class SponsorService {
  private isEnabled: boolean;
  private readonly feedbackUrl: string = 'https://github.com/initiativeengine/clickup-mcp-server/issues';
  
  constructor() {
    this.isEnabled = config.enableSponsorMessage;
    logger.info('SponsorService initialized', { enabled: this.isEnabled });
  }
  
  /**
   * Get feedback information (for documentation/reference purposes)
   */
  public getFeedbackInfo(): { isEnabled: boolean; url: string } {
    return {
      isEnabled: this.isEnabled,
      url: this.feedbackUrl
    };
  }

  /**
   * Creates a response with optional feedback message and standardized metadata
   * @param data - The response data
   * @param includeSponsorMessage - Whether to include feedback message
   * @param options - Optional metadata (tool_name, execution_time_ms, rate_limit, retry, debug)
   */
  public createResponse(
    data: any,
    includeSponsorMessage: boolean = false,
    options?: {
      tool_name?: string;
      execution_time_ms?: number;
      rate_limit?: { remaining: number; limit: number; reset_at: number };
      retry?: { attempted: number; total_delay_ms: number; last_error?: string };
      debug?: {
        request_id: string;
        tool_name: string;
        timing: {
          total_ms: number;
          api_calls: Array<{
            method: string;
            path: string;
            duration: number;
            status?: number;
            error?: string;
          }>;
        };
        api_summary: {
          total_calls: number;
          total_api_time_ms: number;
          success_count: number;
          error_count: number;
        };
      };
    }
  ): { content: { type: string; text: string }[] } {
    const content: { type: string; text: string }[] = [];

    // Create standardized response if metadata is provided
    let responseData: any;
    if (options) {
      const standardizedResponse = createSuccessResponse(data, {
        tool_name: options.tool_name || 'unknown',
        execution_time_ms: options.execution_time_ms,
        rate_limit: options.rate_limit,
        retry: options.retry,
        debug: options.debug
      });
      responseData = standardizedResponse;
    } else {
      responseData = data;
    }

    // Special handling for workspace hierarchy which contains a preformatted tree
    if (responseData && typeof responseData === 'object' && 'data' in responseData && typeof responseData.data === 'object' && 'hierarchy' in responseData.data && typeof responseData.data.hierarchy === 'string') {
      // Handle workspace hierarchy specially - it contains a preformatted tree
      content.push({
        type: "text",
        text: responseData.data.hierarchy
      });
    } else if (data && typeof data === 'object' && 'hierarchy' in data && typeof data.hierarchy === 'string') {
      // Legacy handling for direct hierarchy data
      content.push({
        type: "text",
        text: data.hierarchy
      });
    } else if (typeof responseData === 'string') {
      // If it's already a string, use it directly
      content.push({
        type: "text",
        text: responseData
      });
    } else {
      // Otherwise, stringify the JSON object
      content.push({
        type: "text",
        text: JSON.stringify(responseData, null, 2)
      });
    }

    // Then add feedback message if enabled
    if (this.isEnabled && includeSponsorMessage) {
      content.push({
        type: "text",
        text: `\n♥ Thank you for using the ClickUp MCP Server! We'd love to hear your feedback and feature requests at ${this.feedbackUrl}`
      });
    }


    return { content };
  }

  /**
   * Creates an error response
   */
  public createErrorResponse(error: Error | string, context?: any): { content: { type: string; text: string }[] } {
    return this.createResponse({
      error: typeof error === 'string' ? error : error.message,
      ...context
    });
  }

  /**
   * Creates a bulk operation response with feedback message
   */
  public createBulkResponse(result: any): { content: { type: string; text: string }[] } {
    return this.createResponse({
      success: true,
      total: result.totals.total,
      successful: result.totals.success,
      failed: result.totals.failure,
      failures: result.failed.map((failure: any) => ({
        id: failure.item?.id || failure.item,
        error: failure.error.message
      }))
    }, true); // Always include feedback message for bulk operations
  }
}

// Export a singleton instance
export const sponsorService = new SponsorService(); 