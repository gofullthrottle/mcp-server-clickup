/**
 * SPDX-FileCopyrightText: © 2025 Talib Kareem <taazkareem@icloud.com>
 * SPDX-License-Identifier: MIT
 *
 * Sponsor Service Module
 *
 * Provides configuration and utilities for user feedback messages
 */
import { Logger } from '../logger.js';
import config from '../config.js';
// Create logger instance for this module
const logger = new Logger('SponsorService');
/**
 * SponsorService - Provides feedback message configuration and handling
 */
export class SponsorService {
    constructor() {
        this.feedbackUrl = 'https://github.com/initiativeengine/clickup-mcp-server/issues';
        this.isEnabled = config.enableSponsorMessage;
        logger.info('SponsorService initialized', { enabled: this.isEnabled });
    }
    /**
     * Get feedback information (for documentation/reference purposes)
     */
    getFeedbackInfo() {
        return {
            isEnabled: this.isEnabled,
            url: this.feedbackUrl
        };
    }
    /**
     * Creates a response with optional feedback message
     */
    createResponse(data, includeSponsorMessage = false) {
        const content = [];
        // Special handling for workspace hierarchy which contains a preformatted tree
        if (data && typeof data === 'object' && 'hierarchy' in data && typeof data.hierarchy === 'string') {
            // Handle workspace hierarchy specially - it contains a preformatted tree
            content.push({
                type: "text",
                text: data.hierarchy
            });
        }
        else if (typeof data === 'string') {
            // If it's already a string, use it directly
            content.push({
                type: "text",
                text: data
            });
        }
        else {
            // Otherwise, stringify the JSON object
            content.push({
                type: "text",
                text: JSON.stringify(data, null, 2)
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
    createErrorResponse(error, context) {
        return this.createResponse({
            error: typeof error === 'string' ? error : error.message,
            ...context
        });
    }
    /**
     * Creates a bulk operation response with feedback message
     */
    createBulkResponse(result) {
        return this.createResponse({
            success: true,
            total: result.totals.total,
            successful: result.totals.success,
            failed: result.totals.failure,
            failures: result.failed.map((failure) => ({
                id: failure.item?.id || failure.item,
                error: failure.error.message
            }))
        }, true); // Always include feedback message for bulk operations
    }
}
// Export a singleton instance
export const sponsorService = new SponsorService();
