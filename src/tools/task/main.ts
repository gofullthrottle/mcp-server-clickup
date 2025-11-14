/**
 * SPDX-FileCopyrightText: © 2025 John Freier
 * SPDX-License-Identifier: MIT
 *
 * ClickUp MCP Task Tools
 * 
 * This is the main task module that connects tool definitions to their handlers.
 * The actual implementations are organized in sub-modules for better maintainability.
 */

import { sponsorService } from '../../utils/sponsor-service.js';

// Import tool definitions
import {
  createTaskTool,
  getTaskTool,
  getTasksTool,
  updateTaskTool,
  moveTaskTool,
  duplicateTaskTool,
  deleteTaskTool,
  getTaskCommentsTool,
  createTaskCommentTool
} from './single-operations.js';

import {
  createBulkTasksTool,
  updateBulkTasksTool,
  moveBulkTasksTool,
  deleteBulkTasksTool
} from './bulk-operations.js';

import {
  getWorkspaceTasksTool
} from './workspace-operations.js';

// Add this to your import statements at the top of the file
import {
  getWorkspaceMembersTool,
  findMemberByNameTool,
  resolveAssigneesTool,
  handleGetWorkspaceMembers,
  handleFindMemberByName,
  handleResolveAssignees
} from '../member.js';  // Adjust the path as needed - it should point to where member.ts is located

// Import handlers
import {
  createTaskHandler,
  getTaskHandler,
  getTasksHandler,
  updateTaskHandler,
  moveTaskHandler,
  duplicateTaskHandler,
  deleteTaskHandler,
  getTaskCommentsHandler,
  createTaskCommentHandler,
  createBulkTasksHandler,
  updateBulkTasksHandler,
  moveBulkTasksHandler,
  deleteBulkTasksHandler,
  getWorkspaceTasksHandler,
  formatTaskData
} from './index.js';

// Import shared services
import { clickUpServices } from '../../services/shared.js';
const { task: taskService } = clickUpServices;

import { BatchResult } from '../../utils/concurrency-utils.js';
import { ClickUpTask } from '../../services/clickup/types.js';

//=============================================================================
// HANDLER WRAPPER UTILITY
//=============================================================================

/**
 * Creates a wrapped handler function with standard error handling and response formatting
 */
function createHandlerWrapper<T>(
  handler: (params: any) => Promise<T>,
  formatResponse: (result: T) => any = (result) => result,
  toolName?: string
) {
  return async (parameters: any) => {
    const startTime = Date.now();
    try {
      const result = await handler(parameters);
      const executionTime = Date.now() - startTime;
      const rateLimitInfo = taskService.getRateLimitMetadata();
      const retryInfo = taskService.getRetryTelemetry();

      return sponsorService.createResponse(formatResponse(result), true, {
        tool_name: toolName || 'unknown_task_tool',
        execution_time_ms: executionTime,
        rate_limit: rateLimitInfo,
        retry: retryInfo
      });
    } catch (error) {
      return sponsorService.createErrorResponse(error, parameters);
    }
  };
}

//=============================================================================
// SINGLE TASK OPERATIONS - HANDLER IMPLEMENTATIONS
//=============================================================================

export const handleCreateTask = createHandlerWrapper(createTaskHandler, undefined, 'create_task');
export const handleGetTask = createHandlerWrapper(getTaskHandler, undefined, 'get_task');
export const handleGetTasks = createHandlerWrapper(getTasksHandler, (tasks) => ({
  tasks,
  count: tasks.length
}), 'get_tasks');

/**
 * Handle task update operation
 */
export async function handleUpdateTask(parameters: any) {
  const startTime = Date.now();
  try {
    const result = await updateTaskHandler(taskService, parameters);
    const executionTime = Date.now() - startTime;
    const rateLimitInfo = taskService.getRateLimitMetadata();

    return sponsorService.createResponse(formatTaskData(result), true, {
      tool_name: 'update_task',
      execution_time_ms: executionTime,
      rate_limit: rateLimitInfo
    });
  } catch (error) {
    return sponsorService.createErrorResponse(error instanceof Error ? error.message : String(error));
  }
}

export const handleMoveTask = createHandlerWrapper(moveTaskHandler, undefined, 'move_task');
export const handleDuplicateTask = createHandlerWrapper(duplicateTaskHandler, undefined, 'duplicate_task');
export const handleDeleteTask = createHandlerWrapper(deleteTaskHandler, () => ({
  success: true,
  message: "Task deleted successfully"
}), 'delete_task');
export const handleGetTaskComments = createHandlerWrapper(getTaskCommentsHandler, (comments) => ({
  comments,
  count: comments.length
}), 'get_task_comments');
export const handleCreateTaskComment = createHandlerWrapper(createTaskCommentHandler, (comment) => ({
  success: true,
  message: "Comment added successfully",
  comment: comment && typeof comment === 'object' ? comment : {
    id: `generated-${Date.now()}`,
    comment_text: typeof comment === 'string' ? comment : "Comment text unavailable"
  }
}), 'create_task_comment');

//=============================================================================
// BULK TASK OPERATIONS - HANDLER IMPLEMENTATIONS
//=============================================================================

export const handleCreateBulkTasks = createHandlerWrapper(createBulkTasksHandler, (result: BatchResult<ClickUpTask>) => ({
  successful: result.successful,
  failed: result.failed,
  count: result.totals.total,
  success_count: result.totals.success,
  failure_count: result.totals.failure,
  errors: result.failed.map(f => f.error)
}), 'create_bulk_tasks');

export const handleUpdateBulkTasks = createHandlerWrapper(updateBulkTasksHandler, (result: BatchResult<ClickUpTask>) => ({
  successful: result.successful,
  failed: result.failed,
  count: result.totals.total,
  success_count: result.totals.success,
  failure_count: result.totals.failure,
  errors: result.failed.map(f => f.error)
}), 'update_bulk_tasks');

export const handleMoveBulkTasks = createHandlerWrapper(moveBulkTasksHandler, (result: BatchResult<ClickUpTask>) => ({
  successful: result.successful,
  failed: result.failed,
  count: result.totals.total,
  success_count: result.totals.success,
  failure_count: result.totals.failure,
  errors: result.failed.map(f => f.error)
}), 'move_bulk_tasks');

export const handleDeleteBulkTasks = createHandlerWrapper(deleteBulkTasksHandler, (result: BatchResult<void>) => ({
  successful: result.successful,
  failed: result.failed,
  count: result.totals.total,
  success_count: result.totals.success,
  failure_count: result.totals.failure,
  errors: result.failed.map(f => f.error)
}), 'delete_bulk_tasks');

//=============================================================================
// WORKSPACE TASK OPERATIONS - HANDLER IMPLEMENTATIONS
//=============================================================================

export const handleGetWorkspaceTasks = createHandlerWrapper(
  // This adapts the new handler signature to match what createHandlerWrapper expects
  (params) => getWorkspaceTasksHandler(taskService, params),
  (response) => response, // Pass through the response as is
  'get_workspace_tasks'
);

//=============================================================================
// TOOL DEFINITIONS AND HANDLERS EXPORT
//=============================================================================

// Tool definitions with their handler mappings
export const tools = [
  { 
    definition: createTaskTool, 
    handler: createTaskHandler
  },
  { 
    definition: updateTaskTool, 
    handler: updateTaskHandler
  },
  { 
    definition: moveTaskTool, 
    handler: moveTaskHandler
  },
  { 
    definition: duplicateTaskTool, 
    handler: duplicateTaskHandler
  },
  { 
    definition: getTaskTool, 
    handler: getTaskHandler
  },
  { 
    definition: getTasksTool, 
    handler: getTasksHandler
  },
  { 
    definition: getTaskCommentsTool, 
    handler: getTaskCommentsHandler
  },
  { 
    definition: createTaskCommentTool, 
    handler: createTaskCommentHandler
  },
  { 
    definition: deleteTaskTool, 
    handler: deleteTaskHandler
  },
  { 
    definition: getWorkspaceTasksTool, 
    handler: getWorkspaceTasksHandler
  },
  { 
    definition: createBulkTasksTool, 
    handler: async (params: any) => {
      const result = await createBulkTasksHandler(params) as BatchResult<ClickUpTask>;
      return {
        successful: result.successful,
        failed: result.failed,
        count: result.totals.total,
        success_count: result.totals.success,
        failure_count: result.totals.failure,
        errors: result.failed.map(f => f.error)
      };
    }
  },
  { 
    definition: updateBulkTasksTool, 
    handler: async (params: any) => {
      const result = await updateBulkTasksHandler(params) as BatchResult<ClickUpTask>;
      return {
        successful: result.successful,
        failed: result.failed,
        count: result.totals.total,
        success_count: result.totals.success,
        failure_count: result.totals.failure,
        errors: result.failed.map(f => f.error)
      };
    }
  },
  { 
    definition: moveBulkTasksTool, 
    handler: async (params: any) => {
      const result = await moveBulkTasksHandler(params) as BatchResult<ClickUpTask>;
      return {
        successful: result.successful,
        failed: result.failed,
        count: result.totals.total,
        success_count: result.totals.success,
        failure_count: result.totals.failure,
        errors: result.failed.map(f => f.error)
      };
    }
  },
  { 
    definition: deleteBulkTasksTool, 
    handler: async (params: any) => {
      const result = await deleteBulkTasksHandler(params) as BatchResult<void>;
      return {
        successful: result.successful,
        failed: result.failed,
        count: result.totals.total,
        success_count: result.totals.success,
        failure_count: result.totals.failure,
        errors: result.failed.map(f => f.error)
      };
    }
  },
   {
    definition: getWorkspaceMembersTool,
    handler: handleGetWorkspaceMembers
  },
  {
    definition: findMemberByNameTool,
    handler: handleFindMemberByName
  },
  {
    definition: resolveAssigneesTool,
    handler: handleResolveAssignees
  }
];