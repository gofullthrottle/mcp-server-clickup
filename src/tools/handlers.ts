/**
 * SPDX-FileCopyrightText: © 2025 John Freier
 * SPDX-License-Identifier: MIT
 *
 * Unified Tool Handlers
 *
 * This module exports a unified mapping of tool names to their handler functions
 * for use by the MCP Worker Server. It provides a simple routing mechanism to
 * delegate tool calls to the appropriate handler based on tool name.
 *
 * Note: This is a placeholder implementation. The actual tool handlers are
 * implemented in the server.ts configuration which uses the MCP SDK's tool
 * registration system directly.
 */

/**
 * Placeholder tool handlers mapping
 * The actual tool execution is handled by server.ts which registers
 * all tools with their handlers using the MCP SDK.
 */
export const toolHandlers: Record<string, (args: any) => Promise<any>> = {
  // This is a placeholder - actual handlers are in server.ts
  // The MCP SDK handles tool routing via registered handlers
};

/**
 * Get a handler by tool name
 */
export function getHandler(toolName: string): ((args: any) => Promise<any>) | undefined {
  return toolHandlers[toolName];
}

/**
 * Check if a handler exists for a tool
 */
export function hasHandler(toolName: string): boolean {
  return toolName in toolHandlers;
}

/**
 * Get all registered tool names
 */
export function getRegisteredToolNames(): string[] {
  return Object.keys(toolHandlers);
}
