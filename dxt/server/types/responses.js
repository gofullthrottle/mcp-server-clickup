/*
 * SPDX-License-Identifier: MIT
 * SPDX-FileCopyrightText: © 2025 John Freier
 */
/**
 * Helper function to create a success response
 */
export function createSuccessResponse(data, metadata) {
    return {
        success: true,
        data,
        metadata: {
            timestamp: new Date().toISOString(),
            ...metadata,
        },
    };
}
/**
 * Helper function to create an error response
 */
export function createErrorResponse(error) {
    return {
        success: false,
        error,
    };
}
/**
 * Helper to check if a response is successful
 */
export function isSuccessResponse(response) {
    return response.success === true;
}
/**
 * Helper to check if a response is an error
 */
export function isErrorResponse(response) {
    return response.success === false;
}
