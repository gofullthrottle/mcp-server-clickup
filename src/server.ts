/**
 * SPDX-FileCopyrightText: © 2025 John Freier
 * SPDX-License-Identifier: MIT
 *
 * MCP Server for ClickUp integration
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { createClickUpServices } from "./services/clickup/index.js";
import config from "./config.js";
import { getAnalyticsService } from "./services/analytics-service.js";
import { workspaceHierarchyTool, handleGetWorkspaceHierarchy } from "./tools/workspace.js";
import {
  createTaskTool,
  updateTaskTool,
  moveTaskTool,
  duplicateTaskTool,
  getTaskTool,
  deleteTaskTool,
  getTaskCommentsTool,
  createTaskCommentTool,
  createBulkTasksTool,
  updateBulkTasksTool,
  moveBulkTasksTool,
  deleteBulkTasksTool,
  attachTaskFileTool,
  getWorkspaceTasksTool,
  getTaskTimeEntriesTool,
  startTimeTrackingTool,
  stopTimeTrackingTool,
  addTimeEntryTool,
  deleteTimeEntryTool,
  getCurrentTimeEntryTool,
  handleCreateTask,
  handleUpdateTask,
  handleMoveTask,
  handleDuplicateTask,
  handleGetTasks,
  handleDeleteTask,
  handleGetTaskComments,
  handleCreateTaskComment,
  handleCreateBulkTasks,
  handleUpdateBulkTasks,
  handleMoveBulkTasks,
  handleDeleteBulkTasks,
  handleGetTask,
  handleAttachTaskFile,
  handleGetWorkspaceTasks,
  handleGetTaskTimeEntries,
  handleStartTimeTracking,
  handleStopTimeTracking,
  handleAddTimeEntry,
  handleDeleteTimeEntry,
  handleGetCurrentTimeEntry,
  dependencyTools,
  handleDependencyTool,
  advancedTaskTools,
  handleAdvancedTaskTool
} from "./tools/task/index.js";
import {
  createListTool, handleCreateList,
  createListInFolderTool, handleCreateListInFolder,
  getListTool, handleGetList,
  updateListTool, handleUpdateList,
  deleteListTool, handleDeleteList
} from "./tools/list.js";
import {
  createFolderTool, handleCreateFolder,
  getFolderTool, handleGetFolder,
  updateFolderTool, handleUpdateFolder,
  deleteFolderTool, handleDeleteFolder
} from "./tools/folder.js";
import {
  getSpaceTagsTool, handleGetSpaceTags,
  addTagToTaskTool, handleAddTagToTask,
  removeTagFromTaskTool, handleRemoveTagFromTask
} from "./tools/tag.js";
import {
  createDocumentTool, handleCreateDocument,
  getDocumentTool, handleGetDocument,
  listDocumentsTool, handleListDocuments,
  listDocumentPagesTool, handleListDocumentPages,
  getDocumentPagesTool, handleGetDocumentPages,
  createDocumentPageTool, handleCreateDocumentPage,
  updateDocumentPageTool, handleUpdateDocumentPage
} from "./tools/documents.js";

import {
  getWorkspaceMembersTool, handleGetWorkspaceMembers,
  findMemberByNameTool, handleFindMemberByName,
  resolveAssigneesTool, handleResolveAssignees
} from "./tools/member.js";

import { spaceTools, handleSpaceTool } from "./tools/space.js";
import { customFieldTools, handleCustomFieldTool } from "./tools/custom-fields.js";
import { projectTools, handleProjectTool } from "./tools/project.js";

import { Logger } from "./logger.js";
import { clickUpServices } from "./services/shared.js";

// Create a logger instance for server
const logger = new Logger('Server');

// Use existing services from shared module instead of creating new ones
const { workspace, space: spaceService, project: projectService } = clickUpServices;

/**
 * Determines if a tool should be enabled based on ENABLED_TOOLS and DISABLED_TOOLS configuration.
 *
 * Logic:
 * 1. If ENABLED_TOOLS is specified, only tools in that list are enabled (ENABLED_TOOLS takes precedence)
 * 2. If ENABLED_TOOLS is not specified but DISABLED_TOOLS is, all tools except those in DISABLED_TOOLS are enabled
 * 3. If neither is specified, all tools are enabled
 *
 * @param toolName - The name of the tool to check
 * @returns true if the tool should be enabled, false otherwise
 */
const isToolEnabled = (toolName: string): boolean => {
  // If ENABLED_TOOLS is specified, it takes precedence
  if (config.enabledTools.length > 0) {
    return config.enabledTools.includes(toolName);
  }

  // If only DISABLED_TOOLS is specified, enable all tools except those disabled
  if (config.disabledTools.length > 0) {
    return !config.disabledTools.includes(toolName);
  }

  // If neither is specified, enable all tools
  return true;
};

export const server = new Server(
  {
    name: "clickup-mcp-server",
    version: "0.8.5",
  },
  {
    capabilities: {
      tools: {},
      prompts: {},
      resources: {},
    },
  }
);

const documentModule = () => {
  if (config.documentSupport === 'true') {
    return [
      createDocumentTool,
      getDocumentTool,
      listDocumentsTool,
      listDocumentPagesTool,
      getDocumentPagesTool,
      createDocumentPageTool,
      updateDocumentPageTool,
    ]
  } else {
    return []
  }
}

/**
 * Configure the server routes and handlers
 */
export function configureServer() {
  logger.info("Registering server request handlers");

  // Register ListTools handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    logger.debug("Received ListTools request");
    return {
      tools: [
        workspaceHierarchyTool,
        createTaskTool,
        getTaskTool,
        updateTaskTool,
        moveTaskTool,
        duplicateTaskTool,
        deleteTaskTool,
        getTaskCommentsTool,
        createTaskCommentTool,
        attachTaskFileTool,
        createBulkTasksTool,
        updateBulkTasksTool,
        moveBulkTasksTool,
        deleteBulkTasksTool,
        getWorkspaceTasksTool,
        getTaskTimeEntriesTool,
        startTimeTrackingTool,
        stopTimeTrackingTool,
        addTimeEntryTool,
        deleteTimeEntryTool,
        getCurrentTimeEntryTool,
        createListTool,
        createListInFolderTool,
        getListTool,
        updateListTool,
        deleteListTool,
        createFolderTool,
        getFolderTool,
        updateFolderTool,
        deleteFolderTool,
        getSpaceTagsTool,
        addTagToTaskTool,
        removeTagFromTaskTool,
        getWorkspaceMembersTool,
        findMemberByNameTool,
        resolveAssigneesTool,
        ...spaceTools,
        ...dependencyTools,
        ...customFieldTools,
        ...projectTools,
        ...advancedTaskTools,
        ...documentModule()
      ].filter(tool => isToolEnabled(tool.name))
    };
  });

  // Add handler for resources/list
  server.setRequestHandler(ListResourcesRequestSchema, async (req) => {
    logger.debug("Received ListResources request");
    return {
      resources: [
        {
          uri: "analytics://tool-usage",
          name: "Tool Usage Statistics",
          description: "Analytics dashboard for tool usage patterns and performance metrics",
          mimeType: "application/json"
        },
        {
          uri: "analytics://sequences",
          name: "Common Tool Sequences",
          description: "Most frequently used tool sequence patterns",
          mimeType: "application/json"
        },
        {
          uri: "analytics://summary",
          name: "Analytics Summary",
          description: "High-level summary of tool usage analytics",
          mimeType: "application/json"
        }
      ]
    };
  });

  // Add handler for resources/read
  server.setRequestHandler(ReadResourceRequestSchema, async (req) => {
    const uri = req.params.uri;
    logger.debug(`Received ReadResource request for: ${uri}`);

    const analytics = getAnalyticsService();

    if (uri === "analytics://tool-usage") {
      const stats = analytics.getAllToolStatistics();
      return {
        contents: [{
          uri,
          mimeType: "application/json",
          text: JSON.stringify(stats, null, 2)
        }]
      };
    }

    if (uri === "analytics://sequences") {
      const sequences = analytics.getMostCommonSequences(20);
      return {
        contents: [{
          uri,
          mimeType: "application/json",
          text: JSON.stringify(sequences, null, 2)
        }]
      };
    }

    if (uri === "analytics://summary") {
      const summary = analytics.getSummary();
      return {
        contents: [{
          uri,
          mimeType: "application/json",
          text: JSON.stringify(summary, null, 2)
        }]
      };
    }

    throw new Error(`Unknown resource: ${uri}`);
  });

  // Register CallTool handler with proper logging
  logger.info("Registering tool handlers", {
    toolCount: 65,
    categories: ["workspace", "task", "time-tracking", "list", "folder", "tag", "member", "space", "dependencies", "custom-fields", "project", "advanced-task", "document"]
  });

  // Session tracking for analytics
  const sessionToolCalls = new Map<string, Array<{ tool: string; timestamp: number }>>();
  const analytics = getAnalyticsService();

  // Helper: Extract tool category from tool name
  const getToolCategory = (toolName: string): string => {
    const parts = toolName.split('_');
    if (parts.length >= 2 && parts[0] === 'clickup') {
      return parts[1]; // e.g., "task", "list", "project"
    }
    return 'other';
  };

  // Helper: Generate or extract session ID
  const getSessionId = (): string => {
    // For Phase 1, use a simple UUID. Phase 2 will extract from JWT or use request context
    return `session-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  };

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const { name, arguments: params } = req.params;
    const startTime = Date.now();

    // Get or create session ID
    const sessionId = getSessionId();
    const sessionHistory = sessionToolCalls.get(sessionId) || [];
    const previousTool = sessionHistory.length > 0 ? sessionHistory[sessionHistory.length - 1].tool : undefined;

    // Improved logging with more context
    logger.info(`Received CallTool request for tool: ${name}`, {
      params,
      sessionId,
      sequencePosition: sessionHistory.length
    });

    // Check if the tool is enabled
    if (!isToolEnabled(name)) {
      const reason = config.enabledTools.length > 0
        ? `Tool '${name}' is not in the enabled tools list.`
        : `Tool '${name}' is disabled.`;
      logger.warn(`Tool execution blocked: ${reason}`);
      throw {
        code: -32601,
        message: reason
      };
    }

    try {
      // Execute tool and capture result for analytics
      const result = await (async () => {
        switch (name) {
          case "get_workspace_hierarchy":
            return handleGetWorkspaceHierarchy();
          case "create_task":
            return handleCreateTask(params);
          case "update_task":
            return handleUpdateTask(params);
        case "move_task":
          return handleMoveTask(params);
        case "duplicate_task":
          return handleDuplicateTask(params);
        case "get_task":
          return handleGetTask(params);
        case "delete_task":
          return handleDeleteTask(params);
        case "get_task_comments":
          return handleGetTaskComments(params);
        case "create_task_comment":
          return handleCreateTaskComment(params);
        case "attach_task_file":
          return handleAttachTaskFile(params);
        case "create_bulk_tasks":
          return handleCreateBulkTasks(params);
        case "update_bulk_tasks":
          return handleUpdateBulkTasks(params);
        case "move_bulk_tasks":
          return handleMoveBulkTasks(params);
        case "delete_bulk_tasks":
          return handleDeleteBulkTasks(params);
        case "get_workspace_tasks":
          return handleGetWorkspaceTasks(params);
        case "create_list":
          return handleCreateList(params);
        case "create_list_in_folder":
          return handleCreateListInFolder(params);
        case "get_list":
          return handleGetList(params);
        case "update_list":
          return handleUpdateList(params);
        case "delete_list":
          return handleDeleteList(params);
        case "create_folder":
          return handleCreateFolder(params);
        case "get_folder":
          return handleGetFolder(params);
        case "update_folder":
          return handleUpdateFolder(params);
        case "delete_folder":
          return handleDeleteFolder(params);
        case "get_space_tags":
          return handleGetSpaceTags(params);
        case "add_tag_to_task":
          return handleAddTagToTask(params);
        case "remove_tag_from_task":
          return handleRemoveTagFromTask(params);
        case "get_task_time_entries":
          return handleGetTaskTimeEntries(params);
        case "start_time_tracking":
          return handleStartTimeTracking(params);
        case "stop_time_tracking":
          return handleStopTimeTracking(params);
        case "add_time_entry":
          return handleAddTimeEntry(params);
        case "delete_time_entry":
          return handleDeleteTimeEntry(params);
        case "get_current_time_entry":
          return handleGetCurrentTimeEntry(params);
        case "create_document":
          return handleCreateDocument(params);
        case "get_document":
          return handleGetDocument(params);
        case "list_documents":
          return handleListDocuments(params);
        case "list_document_pages":
          return handleListDocumentPages(params);
        case "get_document_pages":
          return handleGetDocumentPages(params);
        case "create_document_page":
          return handleCreateDocumentPage(params);
        case "update_document_page":
          return handleUpdateDocumentPage(params);
        case "get_workspace_members":
          return handleGetWorkspaceMembers();
        case "find_member_by_name":
          return handleFindMemberByName(params);
        case "resolve_assignees":
          return handleResolveAssignees(params);
        // Space tools
        case "clickup_space_list":
        case "clickup_space_get":
        case "clickup_space_create":
        case "clickup_space_update":
        case "clickup_space_delete":
        case "clickup_space_archive":
        case "clickup_space_toggle_feature":
          return handleSpaceTool(name, params, spaceService);
        // Dependency tools
        case "clickup_task_add_dependency":
        case "clickup_task_remove_dependency":
        case "clickup_task_get_dependencies":
        case "clickup_task_add_link":
        case "clickup_task_remove_link":
          return handleDependencyTool(name, params);
        // Custom field tools
        case "clickup_custom_field_get_definitions":
        case "clickup_custom_field_set_value":
        case "clickup_custom_field_remove_value":
        case "clickup_custom_field_get_values":
        case "clickup_custom_field_find_by_name":
        case "clickup_custom_field_set_by_name":
          return handleCustomFieldTool(name, params);
        // Project tools
        case "clickup_project_initialize":
        case "clickup_task_create_with_duration":
        case "clickup_project_apply_template":
        case "clickup_project_create_milestones":
        case "clickup_project_get_templates":
          return handleProjectTool(name, params);
        // Advanced task tools
        case "clickup_task_create_from_plan":
        case "clickup_task_create_with_scheduling":
        case "clickup_task_bulk_create_with_dependencies":
        case "clickup_task_calculate_timeline":
        case "clickup_task_generate_gantt_data":
        case "clickup_task_identify_parallel_groups":
          return handleAdvancedTaskTool(name, params);
          default:
            logger.error(`Unknown tool requested: ${name}`);
            const error = new Error(`Unknown tool: ${name}`);
            error.name = "UnknownToolError";
            throw error;
        }
      })(); // End of immediately-invoked async function

      // Record successful tool execution
      const executionTime = Date.now() - startTime;
      await analytics.recordToolUsage({
        session_id: sessionId,
        timestamp: Date.now(),
        tool_name: name,
        tool_category: getToolCategory(name),
        execution_time_ms: executionTime,
        success: true,
        previous_tool: previousTool,
        sequence_position: sessionHistory.length
      });

      // Update session history
      sessionHistory.push({ tool: name, timestamp: Date.now() });
      sessionToolCalls.set(sessionId, sessionHistory);

      return result;
    } catch (err) {
      logger.error(`Error executing tool: ${name}`, err);

      // Record failed tool execution
      const executionTime = Date.now() - startTime;
      await analytics.recordToolUsage({
        session_id: sessionId,
        timestamp: Date.now(),
        tool_name: name,
        tool_category: getToolCategory(name),
        execution_time_ms: executionTime,
        success: false,
        error_code: err.code?.toString() || err.name || 'UnknownError',
        error_message: err.message || 'Unknown error occurred',
        previous_tool: previousTool,
        sequence_position: sessionHistory.length
      });

      // Transform error to a more descriptive JSON-RPC error
      if (err.name === "UnknownToolError") {
        throw {
          code: -32601,
          message: `Method not found: ${name}`
        };
      } else if (err.name === "ValidationError") {
        throw {
          code: -32602,
          message: `Invalid params for tool ${name}: ${err.message}`
        };
      } else {
        // Generic server error
        throw {
          code: -32000,
          message: `Error executing tool ${name}: ${err.message}`
        };
      }
    }
  });

  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    logger.info("Received ListPrompts request");
    return { prompts: [] };
  });

  server.setRequestHandler(GetPromptRequestSchema, async () => {
    logger.error("Received GetPrompt request, but prompts are not supported");
    throw new Error("Prompt not found");
  });

  return server;
}

/**
 * Export the clickup service for use in tool handlers
 */
export { workspace };
