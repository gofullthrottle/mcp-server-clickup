---
title: Complete Tool Reference - ClickUp MCP Server
description: Comprehensive reference documentation for all 72 tools across 12 categories in the Remote MCP Server
keywords: [mcp-tools, clickup-api, task-management, workspace-tools, remote-mcp-server, tool-reference]
category: tool-reference
ai_tags: [mcp-tools, clickup-integration, api-reference, tool-documentation]
last_updated: 2025-01-28
---

# Complete Tool Reference

<!-- AI-OPTIMIZATION: Structured tool documentation for embeddings and code generation -->

## Overview

The ClickUp MCP Server provides **72 tools across 12 categories** for comprehensive ClickUp workspace management. This document serves as the complete reference for all available tools, their parameters, usage examples, and tier requirements.

**Quick Navigation:**
- [Tool Summary Table](#tool-summary-table)
- [Tool Categories](#tool-categories)
- [Usage Examples](#usage-examples)
- [Parameter Reference](#parameter-reference)
- [Tier Comparison](#tier-comparison)
- [Error Handling](#error-handling)

### Tool Count by Category

| Category | Tool Count | Tier | Description |
|----------|------------|------|-------------|
| [Task Management](#task-management-tools) | 27 | Mixed | Create, update, search, and manage tasks |
| [List Management](#list-management-tools) | 12 | Free | Organize tasks into lists |
| [Workspace Operations](#workspace-operations-tools) | 8 | Free | Navigate workspace hierarchy |
| [Time Tracking](#time-tracking-tools) | 6 | 💎 Premium | Track time and manage entries |
| [Custom Fields](#custom-fields-tools) | 5 | Mixed | Manage custom fields (read free, write premium) |
| [Space Management](#space-management-tools) | 4 | Free | Organize spaces |
| [Goal Tracking](#goal-tracking-tools) | 3 | Free | Create and monitor goals |
| [User Management](#user-management-tools) | 2 | Free | Manage user accounts |
| [Team Management](#team-management-tools) | 2 | Free | Handle team configuration |
| [Comment Management](#comment-management-tools) | 2 | Free | Task comments |
| [View Management](#view-management-tools) | 1 | Free | Custom views |
| [Other](#other-tools) | 1 | Free | Utility tools |

**💎 Premium Badge** indicates tools requiring Premium tier subscription ($4.99/month).

---

## Tool Summary Table

| Tool Name | Category | Description | Tier |
|-----------|----------|-------------|------|
| `get_workspace_hierarchy` | Workspace | Get complete workspace structure | Free |
| `get_workspace_views` | Workspace | List workspace views | Free |
| `get_workspace_tags` | Workspace | List workspace tags | Free |
| `create_task` | Task | Create new task | Free |
| `update_task` | Task | Update existing task | Free |
| `get_task` | Task | Retrieve task details | Free |
| `delete_task` | Task | Delete task | Free |
| `search_tasks` | Task | Search tasks with filters | Free |
| `move_task` | Task | Move task to different list | Free |
| `duplicate_task` | Task | Duplicate existing task | Free |
| `get_task_comments` | Task | Get task comments | Free |
| `create_task_comment` | Task | Add comment to task | Free |
| `add_task_tags` | Task | Add tags to task | Free |
| `remove_task_tags` | Task | Remove tags from task | Free |
| `get_task_time_entries` | Task | Get time entries for task | Free |
| `attach_task_file` | Task | Attach file to task | Free |
| `get_task_attachments` | Task | List task attachments | Free |
| `update_custom_field_value` | Task | Update task custom field | 💎 Premium |
| `remove_custom_field_value` | Task | Remove custom field value | 💎 Premium |
| `bulk_create_tasks` | Task | Create multiple tasks | 💎 Premium |
| `bulk_update_tasks` | Task | Update multiple tasks | 💎 Premium |
| `bulk_delete_tasks` | Task | Delete multiple tasks | 💎 Premium |
| `bulk_move_tasks` | Task | Move multiple tasks | 💎 Premium |
| `add_task_dependency` | Task | Add task dependency | 💎 Premium |
| `remove_task_dependency` | Task | Remove task dependency | 💎 Premium |
| `set_task_priority` | Task | Set task priority | Free |
| `assign_task` | Task | Assign task to user | Free |
| `get_lists` | List | Get lists in folder/space | Free |
| `create_list` | List | Create new list | Free |
| `update_list` | List | Update list properties | Free |
| `delete_list` | List | Delete list | Free |
| `get_list_tasks` | List | Get tasks in list | Free |
| `get_list_views` | List | Get list views | Free |
| `get_list_members` | List | Get list members | Free |
| `add_list_member` | List | Add member to list | Free |
| `remove_list_member` | List | Remove member from list | Free |
| `bulk_create_lists` | List | Create multiple lists | 💎 Premium |
| `update_list_custom_fields` | List | Update list custom fields | 💎 Premium |
| `archive_list` | List | Archive list | Free |
| `get_folders` | Folder | Get folders in space | Free |
| `create_folder` | Folder | Create new folder | Free |
| `update_folder` | Folder | Update folder properties | Free |
| `delete_folder` | Folder | Delete folder | Free |
| `get_spaces` | Space | Get spaces in workspace | Free |
| `create_space` | Space | Create new space | Free |
| `update_space` | Space | Update space properties | Free |
| `delete_space` | Space | Delete space | Free |
| `get_space_tags` | Space | Get space tags | Free |
| `get_space_members` | Space | Get space members | Free |
| `create_tag` | Tag | Create workspace tag | Free |
| `get_team_members` | Team | Get team members | Free |
| `get_current_user` | User | Get current user info | Free |
| `get_user` | User | Get user by ID | Free |
| `get_custom_fields` | Custom Fields | List custom fields | Free |
| `create_custom_field` | Custom Fields | Create custom field | 💎 Premium |
| `update_custom_field` | Custom Fields | Update custom field | 💎 Premium |
| `delete_custom_field` | Custom Fields | Delete custom field | 💎 Premium |
| `set_custom_field_value` | Custom Fields | Set field value on task | 💎 Premium |
| `create_document` | Document | Create ClickUp document | 💎 Premium |
| `get_document` | Document | Get document content | 💎 Premium |
| `update_document` | Document | Update document content | 💎 Premium |
| `delete_document` | Document | Delete document | 💎 Premium |
| `list_documents` | Document | List workspace documents | 💎 Premium |
| `start_time_tracking` | Time Tracking | Start time tracking on task | 💎 Premium |
| `stop_time_tracking` | Time Tracking | Stop time tracking | 💎 Premium |
| `get_running_time_entry` | Time Tracking | Get current running timer | 💎 Premium |
| `create_time_entry` | Time Tracking | Create time entry manually | 💎 Premium |
| `update_time_entry` | Time Tracking | Update time entry | 💎 Premium |
| `delete_time_entry` | Time Tracking | Delete time entry | 💎 Premium |
| `create_goal` | Goal | Create workspace goal | Free |
| `update_goal` | Goal | Update goal details | Free |
| `get_goals` | Goal | List workspace goals | Free |
| `create_project` | Project | Create project/gantt | 💎 Premium |
| `update_project` | Project | Update project details | 💎 Premium |
| `get_project` | Project | Get project information | 💎 Premium |
| `delete_project` | Project | Delete project | 💎 Premium |
| `get_project_tasks` | Project | List tasks in project | 💎 Premium |
| `create_view` | View | Create custom view | Free |

---

## Tool Categories

### Task Management Tools

**27 tools** for comprehensive task operations including CRUD, search, comments, tags, attachments, custom fields, and bulk operations.

#### Core Task Operations

##### `create_task`

**Description:** Create a new task in a ClickUp list.

**Tier:** Free

**Parameters:**

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `list_id` | string | Yes | List ID where task will be created | `"90144360426"` |
| `name` | string | Yes | Task name/title | `"Implement user authentication"` |
| `description` | string | No | Task description (supports Markdown) | `"Add OAuth 2.0 login flow"` |
| `status` | string | No | Task status | `"in progress"` |
| `priority` | number | No | Priority (1=urgent, 2=high, 3=normal, 4=low) | `1` |
| `due_date` | string | No | Due date (ISO 8601 or natural language) | `"2025-02-01"` or `"next Friday"` |
| `assignees` | array | No | Array of user IDs | `["183"]` |
| `tags` | array | No | Array of tag names | `["backend", "security"]` |

**Example Request:**

```json
{
  "method": "tools/call",
  "params": {
    "name": "create_task",
    "arguments": {
      "list_id": "90144360426",
      "name": "Implement OAuth 2.0 authentication",
      "description": "Add secure user authentication using OAuth 2.0 + PKCE flow",
      "priority": 1,
      "due_date": "2025-02-15",
      "assignees": ["183"],
      "tags": ["security", "backend"]
    }
  }
}
```

**Example Response:**

```json
{
  "content": [
    {
      "type": "text",
      "text": "✅ Task created successfully\n\nID: abc123xyz\nName: Implement OAuth 2.0 authentication\nStatus: to do\nPriority: urgent\nDue: 2025-02-15\nAssignees: John Doe\nTags: security, backend\nURL: https://app.clickup.com/t/abc123xyz"
    }
  ],
  "isError": false
}
```

**Error Responses:**

| Error Code | Message | Cause | Solution |
|------------|---------|-------|----------|
| `invalid_list_id` | List not found | List ID doesn't exist or no access | Verify list ID with `get_workspace_hierarchy` |
| `missing_name` | Task name required | `name` parameter missing | Provide task name |
| `invalid_due_date` | Invalid date format | Unparseable date string | Use ISO 8601 format or natural language |
| `rate_limited` | Rate limit exceeded | Too many requests | Wait 60 seconds or upgrade to Premium |

**Best Practices:**
- Use `get_workspace_hierarchy` first to find the correct `list_id`
- Natural language dates supported: "tomorrow", "next Monday", "in 2 weeks"
- Keep task names under 1000 characters
- Use Markdown for rich descriptions

**Related Tools:**
- [`get_workspace_hierarchy`](#get_workspace_hierarchy) - Find list IDs
- [`update_task`](#update_task) - Modify task after creation
- [`bulk_create_tasks`](#bulk_create_tasks) - Create multiple tasks (Premium)

---

##### `update_task`

**Description:** Update properties of an existing task.

**Tier:** Free

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `task_id` | string | Yes | Task ID or custom task ID |
| `name` | string | No | New task name |
| `description` | string | No | New description |
| `status` | string | No | New status |
| `priority` | number | No | New priority (1-4) |
| `due_date` | string | No | New due date |
| `add_assignees` | array | No | User IDs to add |
| `remove_assignees` | array | No | User IDs to remove |

**Example Request:**

```json
{
  "method": "tools/call",
  "params": {
    "name": "update_task",
    "arguments": {
      "task_id": "abc123xyz",
      "status": "in progress",
      "priority": 2,
      "add_assignees": ["184"]
    }
  }
}
```

**Error Responses:**

| Error Code | Message | Solution |
|------------|---------|----------|
| `task_not_found` | Task not found | Verify task ID |
| `invalid_status` | Invalid status | Check available statuses with `get_list_tasks` |
| `unauthorized` | No permission | Ensure user has edit access |

**Best Practices:**
- Supports both ClickUp task IDs and custom task IDs (e.g., `"TASK-123"`)
- Use `add_assignees`/`remove_assignees` to manage assignments incrementally
- Only provide fields you want to change (partial updates supported)

**Related Tools:**
- [`get_task`](#get_task) - View current task state before updating
- [`bulk_update_tasks`](#bulk_update_tasks) - Update multiple tasks (Premium)

---

##### `get_task`

**Description:** Retrieve detailed information about a task.

**Tier:** Free

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `task_id` | string | Yes | Task ID or custom task ID |
| `include_subtasks` | boolean | No | Include subtasks (default: false) |
| `include_markdown` | boolean | No | Include description as Markdown (default: false) |

**Example Request:**

```json
{
  "method": "tools/call",
  "params": {
    "name": "get_task",
    "arguments": {
      "task_id": "abc123xyz",
      "include_subtasks": true
    }
  }
}
```

**Example Response:**

```json
{
  "content": [
    {
      "type": "text",
      "text": "Task: Implement OAuth 2.0 authentication\nID: abc123xyz\nStatus: in progress\nPriority: high\nDue: 2025-02-15\nAssignees: John Doe, Jane Smith\nTags: security, backend\nDescription: Add secure user authentication using OAuth 2.0 + PKCE flow\nSubtasks: 2\n- Research OAuth 2.0 libraries\n- Implement login endpoint"
    }
  ],
  "isError": false
}
```

**Best Practices:**
- Use `include_subtasks: true` to get complete task hierarchy
- Task ID format: ClickUp ID (alphanumeric) or custom ID (`"PROJ-123"`)

**Related Tools:**
- [`get_task_comments`](#get_task_comments) - View task discussion
- [`get_task_attachments`](#get_task_attachments) - View attached files

---

##### `delete_task`

**Description:** Delete a task permanently.

**Tier:** Free

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `task_id` | string | Yes | Task ID to delete |

**Example Request:**

```json
{
  "method": "tools/call",
  "params": {
    "name": "delete_task",
    "arguments": {
      "task_id": "abc123xyz"
    }
  }
}
```

**⚠️ Warning:** Task deletion is permanent and cannot be undone. Consider archiving instead by updating status to a "Done" or "Archived" status.

**Best Practices:**
- Confirm deletion with user before executing
- Consider using status changes instead of deletion for audit trails
- Subtasks are also deleted when parent task is deleted

---

#### Task Search and Filtering

##### `search_tasks`

**Description:** Search tasks with advanced filtering across lists, folders, and spaces.

**Tier:** Free

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `team_id` | string | Yes | Workspace team ID |
| `query` | string | No | Search query text |
| `statuses` | array | No | Filter by status names |
| `assignees` | array | No | Filter by user IDs |
| `tags` | array | No | Filter by tag names |
| `due_date_gt` | number | No | Due date greater than (Unix timestamp) |
| `due_date_lt` | number | No | Due date less than (Unix timestamp) |
| `date_created_gt` | number | No | Created after (Unix timestamp) |
| `date_created_lt` | number | No | Created before (Unix timestamp) |
| `list_ids` | array | No | Filter by list IDs |
| `folder_ids` | array | No | Filter by folder IDs |
| `space_ids` | array | No | Filter by space IDs |
| `archived` | boolean | No | Include archived tasks |

**Example Request:**

```json
{
  "method": "tools/call",
  "params": {
    "name": "search_tasks",
    "arguments": {
      "team_id": "12345",
      "query": "authentication",
      "statuses": ["in progress", "review"],
      "tags": ["security"],
      "assignees": ["183"]
    }
  }
}
```

**Example Response:**

```json
{
  "content": [
    {
      "type": "text",
      "text": "Found 3 tasks matching criteria:\n\n1. Implement OAuth 2.0 authentication\n   ID: abc123xyz\n   Status: in progress\n   Assignee: John Doe\n   Tags: security, backend\n\n2. Add two-factor authentication\n   ID: def456uvw\n   Status: review\n   Assignee: John Doe\n   Tags: security\n\n3. Update authentication documentation\n   ID: ghi789rst\n   Status: in progress\n   Assignee: John Doe\n   Tags: security, docs"
    }
  ],
  "isError": false
}
```

**Best Practices:**
- Combine multiple filters for precise results
- Use Unix timestamps for date filtering (e.g., `Date.now() / 1000`)
- Limit results with `space_ids` or `list_ids` for better performance
- Search query searches task names, descriptions, and comments

**Related Tools:**
- [`get_list_tasks`](#get_list_tasks) - Get all tasks in specific list
- [`get_workspace_hierarchy`](#get_workspace_hierarchy) - Find IDs for filtering

---

#### Task Movement and Duplication

##### `move_task`

**Description:** Move a task to a different list.

**Tier:** Free

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `task_id` | string | Yes | Task ID to move |
| `list_id` | string | Yes | Destination list ID |

**Example Request:**

```json
{
  "method": "tools/call",
  "params": {
    "name": "move_task",
    "arguments": {
      "task_id": "abc123xyz",
      "list_id": "90144360999"
    }
  }
}
```

**Best Practices:**
- Task retains its properties (status, assignees, tags)
- Custom fields may be lost if destination list has different fields
- Subtasks move with parent task

**Related Tools:**
- [`bulk_move_tasks`](#bulk_move_tasks) - Move multiple tasks (Premium)

---

##### `duplicate_task`

**Description:** Create a copy of an existing task.

**Tier:** Free

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `task_id` | string | Yes | Task ID to duplicate |
| `include_subtasks` | boolean | No | Duplicate subtasks (default: false) |
| `include_attachments` | boolean | No | Duplicate attachments (default: false) |
| `include_dependencies` | boolean | No | Duplicate dependencies (default: false) |

**Example Request:**

```json
{
  "method": "tools/call",
  "params": {
    "name": "duplicate_task",
    "arguments": {
      "task_id": "abc123xyz",
      "include_subtasks": true,
      "include_attachments": true
    }
  }
}
```

**Best Practices:**
- Duplicated task is created in same list as original
- Assignees and watchers are not copied (must be reassigned)
- Use for task templates or recurring tasks

---

#### Task Comments

##### `get_task_comments`

**Description:** Retrieve all comments on a task.

**Tier:** Free

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `task_id` | string | Yes | Task ID |

**Example Request:**

```json
{
  "method": "tools/call",
  "params": {
    "name": "get_task_comments",
    "arguments": {
      "task_id": "abc123xyz"
    }
  }
}
```

---

##### `create_task_comment`

**Description:** Add a comment to a task.

**Tier:** Free

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `task_id` | string | Yes | Task ID |
| `comment_text` | string | Yes | Comment content (supports Markdown) |
| `notify_all` | boolean | No | Notify all task watchers (default: true) |

**Example Request:**

```json
{
  "method": "tools/call",
  "params": {
    "name": "create_task_comment",
    "arguments": {
      "task_id": "abc123xyz",
      "comment_text": "OAuth implementation complete. Ready for review.",
      "notify_all": true
    }
  }
}
```

**Best Practices:**
- Use Markdown for rich formatting (links, code blocks, lists)
- Mention users with `@username` to notify them
- Comments support attachments via ClickUp web UI

---

#### Task Tags

##### `add_task_tags`

**Description:** Add tags to a task.

**Tier:** Free

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `task_id` | string | Yes | Task ID |
| `tags` | array | Yes | Array of tag names |

**Example Request:**

```json
{
  "method": "tools/call",
  "params": {
    "name": "add_task_tags",
    "arguments": {
      "task_id": "abc123xyz",
      "tags": ["urgent", "needs-review"]
    }
  }
}
```

**Best Practices:**
- Tags are created automatically if they don't exist
- Tags are workspace-level (visible across all spaces)
- Use consistent tag naming conventions

---

##### `remove_task_tags`

**Description:** Remove tags from a task.

**Tier:** Free

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `task_id` | string | Yes | Task ID |
| `tags` | array | Yes | Array of tag names to remove |

---

#### Task Attachments

##### `attach_task_file`

**Description:** Attach a file to a task.

**Tier:** Free

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `task_id` | string | Yes | Task ID |
| `file_url` | string | Yes | URL of file to attach |
| `file_name` | string | No | Display name for attachment |

**Example Request:**

```json
{
  "method": "tools/call",
  "params": {
    "name": "attach_task_file",
    "arguments": {
      "task_id": "abc123xyz",
      "file_url": "https://example.com/documents/spec.pdf",
      "file_name": "OAuth Specification.pdf"
    }
  }
}
```

**Best Practices:**
- File must be publicly accessible URL
- Maximum file size: 100MB
- Supported formats: PDF, images, documents, code files

---

##### `get_task_attachments`

**Description:** List all attachments on a task.

**Tier:** Free

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `task_id` | string | Yes | Task ID |

---

#### Task Custom Fields

##### `update_custom_field_value`

**Description:** Update a custom field value on a task.

**Tier:** 💎 **Premium**

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `task_id` | string | Yes | Task ID |
| `field_id` | string | Yes | Custom field ID |
| `value` | any | Yes | New value (type depends on field) |

**Example Request:**

```json
{
  "method": "tools/call",
  "params": {
    "name": "update_custom_field_value",
    "arguments": {
      "task_id": "abc123xyz",
      "field_id": "cf_12345",
      "value": "In Progress"
    }
  }
}
```

**Upgrade Required:** This tool requires [Premium tier](PREMIUM_FEATURES.md) subscription.

**Best Practices:**
- Get field IDs with [`get_custom_fields`](#get_custom_fields)
- Value type must match field type (string, number, date, dropdown)

---

##### `remove_custom_field_value`

**Description:** Remove a custom field value from a task.

**Tier:** 💎 **Premium**

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `task_id` | string | Yes | Task ID |
| `field_id` | string | Yes | Custom field ID |

---

#### Task Assignments

##### `assign_task`

**Description:** Assign task to users.

**Tier:** Free

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `task_id` | string | Yes | Task ID |
| `assignees` | array | Yes | User IDs to assign |
| `mode` | string | No | `"add"` or `"set"` (default: `"add"`) |

**Example Request:**

```json
{
  "method": "tools/call",
  "params": {
    "name": "assign_task",
    "arguments": {
      "task_id": "abc123xyz",
      "assignees": ["183", "184"],
      "mode": "add"
    }
  }
}
```

**Best Practices:**
- `mode: "add"` adds to existing assignees
- `mode: "set"` replaces all assignees
- Get user IDs with [`get_team_members`](#get_team_members)

---

##### `set_task_priority`

**Description:** Set task priority level.

**Tier:** Free

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `task_id` | string | Yes | Task ID |
| `priority` | number | Yes | Priority: 1=urgent, 2=high, 3=normal, 4=low |

---

#### Bulk Task Operations (Premium)

##### `bulk_create_tasks` 💎

**Description:** Create multiple tasks in a single operation.

**Tier:** 💎 **Premium**

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `list_id` | string | Yes | List ID where tasks will be created |
| `tasks` | array | Yes | Array of task objects (max 50) |

**Example Request:**

```json
{
  "method": "tools/call",
  "params": {
    "name": "bulk_create_tasks",
    "arguments": {
      "list_id": "90144360426",
      "tasks": [
        {
          "name": "Setup development environment",
          "priority": 2,
          "tags": ["setup"]
        },
        {
          "name": "Implement OAuth endpoints",
          "priority": 1,
          "assignees": ["183"],
          "tags": ["backend", "security"]
        },
        {
          "name": "Write unit tests",
          "priority": 3,
          "tags": ["testing"]
        }
      ]
    }
  }
}
```

**Upgrade Required:** This tool requires [Premium tier](PREMIUM_FEATURES.md) ($4.99/month) subscription.

**Benefits:**
- **10x faster** than individual `create_task` calls
- Single API request for up to 50 tasks
- Atomic operation (all succeed or all fail)
- Reduces rate limit consumption

**Best Practices:**
- Batch size limit: 50 tasks per request
- Use for sprint planning, project initialization, recurring tasks
- All tasks created in same list (use multiple calls for different lists)

**Related Tools:**
- [`create_task`](#create_task) - Single task creation (Free)
- [`bulk_update_tasks`](#bulk_update_tasks) - Update multiple tasks

---

##### `bulk_update_tasks` 💎

**Description:** Update multiple tasks simultaneously.

**Tier:** 💎 **Premium**

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `task_ids` | array | Yes | Array of task IDs (max 50) |
| `updates` | object | Yes | Properties to update on all tasks |

**Example Request:**

```json
{
  "method": "tools/call",
  "params": {
    "name": "bulk_update_tasks",
    "arguments": {
      "task_ids": ["abc123", "def456", "ghi789"],
      "updates": {
        "status": "in progress",
        "add_tags": ["sprint-2"]
      }
    }
  }
}
```

---

##### `bulk_move_tasks` 💎

**Description:** Move multiple tasks to a different list.

**Tier:** 💎 **Premium**

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `task_ids` | array | Yes | Task IDs to move (max 50) |
| `list_id` | string | Yes | Destination list ID |

---

##### `bulk_delete_tasks` 💎

**Description:** Delete multiple tasks at once.

**Tier:** 💎 **Premium**

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `task_ids` | array | Yes | Task IDs to delete (max 50) |

**⚠️ Warning:** Bulk deletion is permanent. Consider archiving instead.

---

#### Task Dependencies (Premium)

##### `add_task_dependency` 💎

**Description:** Create a dependency relationship between tasks.

**Tier:** 💎 **Premium**

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `task_id` | string | Yes | Task ID |
| `depends_on` | string | Yes | Task ID this task depends on |
| `dependency_type` | string | No | `"waiting_on"` or `"blocking"` (default: `"waiting_on"`) |

**Example Request:**

```json
{
  "method": "tools/call",
  "params": {
    "name": "add_task_dependency",
    "arguments": {
      "task_id": "abc123xyz",
      "depends_on": "def456uvw",
      "dependency_type": "waiting_on"
    }
  }
}
```

---

##### `remove_task_dependency` 💎

**Description:** Remove a dependency relationship.

**Tier:** 💎 **Premium**

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `task_id` | string | Yes | Task ID |
| `depends_on` | string | Yes | Dependency to remove |

---

#### Task Time Tracking

##### `get_task_time_entries`

**Description:** Get all time entries for a task.

**Tier:** Free

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `task_id` | string | Yes | Task ID |

**Example Response:**

```json
{
  "content": [
    {
      "type": "text",
      "text": "Time entries for task:\n\n1. 2h 30m - John Doe (2025-01-28)\n   Description: OAuth implementation\n\n2. 1h 15m - Jane Smith (2025-01-27)\n   Description: Code review\n\nTotal: 3h 45m"
    }
  ]
}
```

---

### Workspace Operations Tools

**8 tools** for navigating workspace structure and accessing workspace-level information.

#### `get_workspace_hierarchy`

**Description:** Get complete workspace structure including spaces, folders, and lists. This is typically the first tool to call when starting work in a new workspace.

**Tier:** Free

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `team_id` | string | Yes | Workspace team ID |

**Example Request:**

```json
{
  "method": "tools/call",
  "params": {
    "name": "get_workspace_hierarchy",
    "arguments": {
      "team_id": "12345"
    }
  }
}
```

**Example Response:**

```json
{
  "content": [
    {
      "type": "text",
      "text": "Workspace Structure:\n\nSpace: Engineering (ID: space_789)\n├─ Folder: Backend (ID: folder_456)\n│  ├─ List: API Development (ID: list_123)\n│  └─ List: Database (ID: list_124)\n└─ Folder: Frontend (ID: folder_457)\n   ├─ List: React Components (ID: list_125)\n   └─ List: UI/UX (ID: list_126)\n\nSpace: Marketing (ID: space_790)\n└─ List: Campaign Planning (ID: list_127)"
    }
  ]
}
```

**Best Practices:**
- **Always call this first** when working with a new workspace
- Cache the hierarchy to avoid repeated calls
- Use IDs from hierarchy for all other tool calls
- Helps users navigate workspace and disambiguate items with same name

**Related Tools:**
- All other tools use IDs discovered here

---

#### `get_workspace_views`

**Description:** List all custom views in workspace.

**Tier:** Free

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `team_id` | string | Yes | Workspace team ID |

---

#### `get_workspace_tags`

**Description:** List all tags defined in workspace.

**Tier:** Free

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `team_id` | string | Yes | Workspace team ID |

---

### List Management Tools

**12 tools** for organizing tasks into lists and managing list properties.

#### `get_lists`

**Description:** Get lists in a folder or space.

**Tier:** Free

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `folder_id` | string | No | Folder ID (mutually exclusive with `space_id`) |
| `space_id` | string | No | Space ID (mutually exclusive with `folder_id`) |
| `archived` | boolean | No | Include archived lists (default: false) |

**Example Request:**

```json
{
  "method": "tools/call",
  "params": {
    "name": "get_lists",
    "arguments": {
      "folder_id": "folder_456"
    }
  }
}
```

---

#### `create_list`

**Description:** Create a new list in a folder or space.

**Tier:** Free

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `folder_id` | string | No | Folder ID |
| `space_id` | string | No | Space ID (if not in folder) |
| `name` | string | Yes | List name |
| `content` | string | No | List description |
| `status` | string | No | List status |
| `priority` | number | No | List priority |

---

#### `update_list`

**Description:** Update list properties.

**Tier:** Free

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `list_id` | string | Yes | List ID |
| `name` | string | No | New name |
| `content` | string | No | New description |

---

#### `delete_list`

**Description:** Delete a list.

**Tier:** Free

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `list_id` | string | Yes | List ID to delete |

---

#### `get_list_tasks`

**Description:** Get all tasks in a list.

**Tier:** Free

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `list_id` | string | Yes | List ID |
| `archived` | boolean | No | Include archived (default: false) |
| `subtasks` | boolean | No | Include subtasks (default: false) |

---

#### `get_list_views`

**Description:** Get custom views for a list.

**Tier:** Free

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `list_id` | string | Yes | List ID |

---

#### `get_list_members`

**Description:** Get members with access to list.

**Tier:** Free

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `list_id` | string | Yes | List ID |

---

#### `add_list_member`

**Description:** Add a user to list.

**Tier:** Free

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `list_id` | string | Yes | List ID |
| `user_id` | string | Yes | User ID to add |

---

#### `remove_list_member`

**Description:** Remove user from list.

**Tier:** Free

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `list_id` | string | Yes | List ID |
| `user_id` | string | Yes | User ID to remove |

---

#### `archive_list`

**Description:** Archive a list (soft delete).

**Tier:** Free

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `list_id` | string | Yes | List ID |

---

#### `bulk_create_lists` 💎

**Description:** Create multiple lists at once.

**Tier:** 💎 **Premium**

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `folder_id` | string | No | Folder ID |
| `space_id` | string | No | Space ID (if not in folder) |
| `lists` | array | Yes | Array of list objects (max 20) |

---

#### `update_list_custom_fields` 💎

**Description:** Update custom fields configuration for a list.

**Tier:** 💎 **Premium**

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `list_id` | string | Yes | List ID |
| `custom_fields` | array | Yes | Array of custom field configurations |

---

### Space Management Tools

**4 tools** for managing spaces (top-level workspace containers).

#### `get_spaces`

**Description:** Get all spaces in workspace.

**Tier:** Free

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `team_id` | string | Yes | Workspace team ID |
| `archived` | boolean | No | Include archived (default: false) |

---

#### `create_space`

**Description:** Create new space.

**Tier:** Free

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `team_id` | string | Yes | Workspace team ID |
| `name` | string | Yes | Space name |
| `multiple_assignees` | boolean | No | Allow multiple assignees (default: true) |
| `features` | object | No | Space features configuration |

---

#### `update_space`

**Description:** Update space properties.

**Tier:** Free

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `space_id` | string | Yes | Space ID |
| `name` | string | No | New name |
| `color` | string | No | Space color (hex) |

---

#### `delete_space`

**Description:** Delete a space.

**Tier:** Free

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `space_id` | string | Yes | Space ID |

---

#### `get_space_tags`

**Description:** Get tags specific to space.

**Tier:** Free

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `space_id` | string | Yes | Space ID |

---

#### `get_space_members`

**Description:** Get members with access to space.

**Tier:** Free

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `space_id` | string | Yes | Space ID |

---

### Folder Management Tools

**4 tools** for managing folders (containers within spaces).

#### `get_folders`

**Description:** Get folders in a space.

**Tier:** Free

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `space_id` | string | Yes | Space ID |
| `archived` | boolean | No | Include archived (default: false) |

---

#### `create_folder`

**Description:** Create new folder in space.

**Tier:** Free

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `space_id` | string | Yes | Space ID |
| `name` | string | Yes | Folder name |

---

#### `update_folder`

**Description:** Update folder properties.

**Tier:** Free

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `folder_id` | string | Yes | Folder ID |
| `name` | string | No | New name |

---

#### `delete_folder`

**Description:** Delete a folder.

**Tier:** Free

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `folder_id` | string | Yes | Folder ID |

---

### Time Tracking Tools (Premium)

**6 tools** for time tracking and time entry management. All require Premium tier.

#### `start_time_tracking` 💎

**Description:** Start tracking time on a task.

**Tier:** 💎 **Premium**

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `task_id` | string | Yes | Task ID to track time for |
| `description` | string | No | Optional description of work |

**Example Request:**

```json
{
  "method": "tools/call",
  "params": {
    "name": "start_time_tracking",
    "arguments": {
      "task_id": "abc123xyz",
      "description": "Implementing OAuth endpoints"
    }
  }
}
```

**Example Response:**

```json
{
  "content": [
    {
      "type": "text",
      "text": "⏱️ Time tracking started\n\nTask: Implement OAuth 2.0 authentication\nStarted: 2025-01-28 10:30:00\nDescription: Implementing OAuth endpoints"
    }
  ]
}
```

**Upgrade Required:** This tool requires [Premium tier](PREMIUM_FEATURES.md) ($4.99/month).

---

#### `stop_time_tracking` 💎

**Description:** Stop currently running time tracker.

**Tier:** 💎 **Premium**

**Parameters:** None

**Example Request:**

```json
{
  "method": "tools/call",
  "params": {
    "name": "stop_time_tracking",
    "arguments": {}
  }
}
```

**Example Response:**

```json
{
  "content": [
    {
      "type": "text",
      "text": "⏹️ Time tracking stopped\n\nDuration: 2h 15m\nTask: Implement OAuth 2.0 authentication\nTime entry created successfully"
    }
  ]
}
```

---

#### `get_running_time_entry` 💎

**Description:** Get currently running time tracker.

**Tier:** 💎 **Premium**

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `team_id` | string | Yes | Workspace team ID |

---

#### `create_time_entry` 💎

**Description:** Manually create a time entry.

**Tier:** 💎 **Premium**

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `task_id` | string | Yes | Task ID |
| `duration` | number | Yes | Duration in milliseconds |
| `start_date` | number | No | Start time (Unix timestamp) |
| `description` | string | No | Description |

**Example Request:**

```json
{
  "method": "tools/call",
  "params": {
    "name": "create_time_entry",
    "arguments": {
      "task_id": "abc123xyz",
      "duration": 7200000,
      "description": "OAuth implementation - 2 hours"
    }
  }
}
```

---

#### `update_time_entry` 💎

**Description:** Update an existing time entry.

**Tier:** 💎 **Premium**

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `team_id` | string | Yes | Workspace team ID |
| `timer_id` | string | Yes | Time entry ID |
| `duration` | number | No | New duration |
| `description` | string | No | New description |

---

#### `delete_time_entry` 💎

**Description:** Delete a time entry.

**Tier:** 💎 **Premium**

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `team_id` | string | Yes | Workspace team ID |
| `timer_id` | string | Yes | Time entry ID to delete |

---

### Custom Fields Tools

**5 tools** for managing custom fields. Read operations are free, write operations require Premium.

#### `get_custom_fields`

**Description:** List all custom fields in a list.

**Tier:** Free

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `list_id` | string | Yes | List ID |

**Example Response:**

```json
{
  "content": [
    {
      "type": "text",
      "text": "Custom Fields:\n\n1. Status (ID: cf_12345)\n   Type: dropdown\n   Options: Not Started, In Progress, Complete\n\n2. Priority Score (ID: cf_67890)\n   Type: number\n   Range: 1-10\n\n3. Due Date (ID: cf_11111)\n   Type: date"
    }
  ]
}
```

---

#### `create_custom_field` 💎

**Description:** Create a new custom field.

**Tier:** 💎 **Premium**

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `list_id` | string | Yes | List ID |
| `name` | string | Yes | Field name |
| `type` | string | Yes | Field type: `"text"`, `"number"`, `"date"`, `"dropdown"`, `"checkbox"` |
| `type_config` | object | No | Type-specific configuration |

---

#### `update_custom_field` 💎

**Description:** Update custom field configuration.

**Tier:** 💎 **Premium**

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `field_id` | string | Yes | Custom field ID |
| `name` | string | No | New name |
| `type_config` | object | No | New configuration |

---

#### `delete_custom_field` 💎

**Description:** Delete a custom field.

**Tier:** 💎 **Premium**

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `field_id` | string | Yes | Custom field ID |

---

#### `set_custom_field_value` 💎

**Description:** Set custom field value on task.

**Tier:** 💎 **Premium**

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `task_id` | string | Yes | Task ID |
| `field_id` | string | Yes | Custom field ID |
| `value` | any | Yes | Value (type depends on field) |

---

### Document Management Tools (Premium)

**5 tools** for managing ClickUp documents. All require Premium tier.

#### `create_document` 💎

**Description:** Create a new ClickUp document.

**Tier:** 💎 **Premium**

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `workspace_id` | string | Yes | Workspace ID |
| `name` | string | Yes | Document name |
| `content` | string | No | Document content (Markdown) |
| `parent` | object | No | Parent location (space/folder/list) |

---

#### `get_document` 💎

**Description:** Get document content.

**Tier:** 💎 **Premium**

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `doc_id` | string | Yes | Document ID |

---

#### `update_document` 💎

**Description:** Update document content.

**Tier:** 💎 **Premium**

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `doc_id` | string | Yes | Document ID |
| `name` | string | No | New name |
| `content` | string | No | New content |

---

#### `delete_document` 💎

**Description:** Delete a document.

**Tier:** 💎 **Premium**

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `doc_id` | string | Yes | Document ID |

---

#### `list_documents` 💎

**Description:** List all documents in workspace.

**Tier:** 💎 **Premium**

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `workspace_id` | string | Yes | Workspace ID |

---

### Project Management Tools (Premium)

**5 tools** for Gantt charts and project management. All require Premium tier.

#### `create_project` 💎

**Description:** Create a new project/Gantt chart.

**Tier:** 💎 **Premium**

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `team_id` | string | Yes | Workspace team ID |
| `name` | string | Yes | Project name |
| `start_date` | string | No | Project start date |
| `end_date` | string | No | Project end date |

---

#### `update_project` 💎

**Description:** Update project details.

**Tier:** 💎 **Premium**

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `project_id` | string | Yes | Project ID |
| `name` | string | No | New name |
| `start_date` | string | No | New start date |
| `end_date` | string | No | New end date |

---

#### `get_project` 💎

**Description:** Get project information.

**Tier:** 💎 **Premium**

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `project_id` | string | Yes | Project ID |

---

#### `delete_project` 💎

**Description:** Delete a project.

**Tier:** 💎 **Premium**

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `project_id` | string | Yes | Project ID |

---

#### `get_project_tasks` 💎

**Description:** List all tasks in project.

**Tier:** 💎 **Premium**

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `project_id` | string | Yes | Project ID |

---

### Goal Tracking Tools

**3 tools** for creating and tracking OKRs and goals.

#### `create_goal`

**Description:** Create a workspace goal.

**Tier:** Free

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `team_id` | string | Yes | Workspace team ID |
| `name` | string | Yes | Goal name |
| `due_date` | string | No | Goal due date |
| `description` | string | No | Goal description |
| `multiple_owners` | boolean | No | Allow multiple owners |
| `owners` | array | No | User IDs |

---

#### `update_goal`

**Description:** Update goal details.

**Tier:** Free

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `goal_id` | string | Yes | Goal ID |
| `name` | string | No | New name |
| `due_date` | string | No | New due date |
| `description` | string | No | New description |
| `percent_completed` | number | No | Progress percentage (0-100) |

---

#### `get_goals`

**Description:** List workspace goals.

**Tier:** Free

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `team_id` | string | Yes | Workspace team ID |

---

### Tag Management Tools

**1 tool** for workspace tag operations.

#### `create_tag`

**Description:** Create a workspace-level tag.

**Tier:** Free

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `space_id` | string | Yes | Space ID |
| `name` | string | Yes | Tag name |
| `tag_fg` | string | No | Foreground color (hex) |
| `tag_bg` | string | No | Background color (hex) |

---

### User Management Tools

**2 tools** for user account operations.

#### `get_current_user`

**Description:** Get authenticated user information.

**Tier:** Free

**Parameters:** None

**Example Response:**

```json
{
  "content": [
    {
      "type": "text",
      "text": "Current User:\n\nID: 183\nUsername: john.doe\nEmail: john@example.com\nRole: admin\nTimezone: America/New_York"
    }
  ]
}
```

---

#### `get_user`

**Description:** Get user details by ID.

**Tier:** Free

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `user_id` | string | Yes | User ID |

---

### Team Management Tools

**2 tools** for team configuration.

#### `get_team_members`

**Description:** Get all team members in workspace.

**Tier:** Free

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `team_id` | string | Yes | Workspace team ID |

**Example Response:**

```json
{
  "content": [
    {
      "type": "text",
      "text": "Team Members:\n\n1. John Doe (ID: 183)\n   Email: john@example.com\n   Role: Admin\n\n2. Jane Smith (ID: 184)\n   Email: jane@example.com\n   Role: Member\n\n3. Bob Johnson (ID: 185)\n   Email: bob@example.com\n   Role: Guest"
    }
  ]
}
```

---

### View Management Tools

**1 tool** for custom view operations.

#### `create_view`

**Description:** Create a custom view in a list or folder.

**Tier:** Free

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `list_id` | string | No | List ID (mutually exclusive with folder_id/space_id) |
| `folder_id` | string | No | Folder ID |
| `space_id` | string | No | Space ID |
| `name` | string | Yes | View name |
| `type` | string | Yes | View type: `"list"`, `"board"`, `"calendar"`, `"gantt"`, `"table"` |

---

### Other Tools

**1 utility tool** for workspace operations.

#### `get_workspace_seats`

**Description:** Get workspace seat/license information.

**Tier:** Free

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `team_id` | string | Yes | Workspace team ID |

---

## Usage Examples

### Example 1: Creating and Organizing Tasks

**Scenario:** Create tasks for a new sprint and organize them with tags and assignments.

```typescript
// Step 1: Get workspace structure
const hierarchy = await mcpClient.call({
  method: 'tools/call',
  params: {
    name: 'get_workspace_hierarchy',
    arguments: { team_id: '12345' }
  }
});

// Step 2: Create task in Sprint list
const task = await mcpClient.call({
  method: 'tools/call',
  params: {
    name: 'create_task',
    arguments: {
      list_id: '90144360426',
      name: 'Implement OAuth authentication',
      description: 'Add secure user login with OAuth 2.0',
      priority: 1,
      due_date: '2025-02-15',
      assignees: ['183'],
      tags: ['backend', 'security', 'sprint-2']
    }
  }
});

// Step 3: Add detailed comment
await mcpClient.call({
  method: 'tools/call',
  params: {
    name: 'create_task_comment',
    arguments: {
      task_id: task.data.id,
      comment_text: 'Requirements:\n- OAuth 2.0 + PKCE flow\n- JWT session management\n- Secure token storage'
    }
  }
});
```

---

### Example 2: Time Tracking Workflow (Premium)

**Scenario:** Track time spent on development work.

```typescript
// Step 1: Start timer when beginning work
await mcpClient.call({
  method: 'tools/call',
  params: {
    name: 'start_time_tracking',
    arguments: {
      task_id: 'abc123xyz',
      description: 'OAuth implementation'
    }
  }
});

// ... do work ...

// Step 2: Stop timer when finished
const timeEntry = await mcpClient.call({
  method: 'tools/call',
  params: {
    name: 'stop_time_tracking',
    arguments: {}
  }
});

// Step 3: View all time entries for task
const entries = await mcpClient.call({
  method: 'tools/call',
  params: {
    name: 'get_task_time_entries',
    arguments: { task_id: 'abc123xyz' }
  }
});
```

---

### Example 3: Bulk Operations for Sprint Planning (Premium)

**Scenario:** Create multiple tasks for new sprint efficiently.

```typescript
// Create 20 tasks in one operation
await mcpClient.call({
  method: 'tools/call',
  params: {
    name: 'bulk_create_tasks',
    arguments: {
      list_id: '90144360426',
      tasks: [
        {
          name: 'Setup development environment',
          priority: 2,
          tags: ['setup']
        },
        {
          name: 'Implement OAuth endpoints',
          priority: 1,
          assignees: ['183'],
          tags: ['backend', 'security']
        },
        {
          name: 'Create database schema',
          priority: 1,
          assignees: ['184'],
          tags: ['database']
        },
        // ... 17 more tasks
      ]
    }
  }
});

// Later: Update all tasks in sprint
await mcpClient.call({
  method: 'tools/call',
  params: {
    name: 'bulk_update_tasks',
    arguments: {
      task_ids: ['task1', 'task2', 'task3'],
      updates: {
        add_tags: ['sprint-2'],
        status: 'in progress'
      }
    }
  }
});
```

---

### Example 4: Searching and Filtering Tasks

**Scenario:** Find all high-priority tasks assigned to user that are overdue.

```typescript
const overdueTasks = await mcpClient.call({
  method: 'tools/call',
  params: {
    name: 'search_tasks',
    arguments: {
      team_id: '12345',
      statuses: ['to do', 'in progress'],
      assignees: ['183'],
      priority: 1,
      due_date_lt: Math.floor(Date.now() / 1000), // Unix timestamp for now
      list_ids: ['90144360426', '90144360427']
    }
  }
});
```

---

### Example 5: Managing Task Dependencies (Premium)

**Scenario:** Set up task dependencies for project plan.

```typescript
// Task B depends on Task A
await mcpClient.call({
  method: 'tools/call',
  params: {
    name: 'add_task_dependency',
    arguments: {
      task_id: 'taskB_id',
      depends_on: 'taskA_id',
      dependency_type: 'waiting_on'
    }
  }
});

// Task C depends on both Task A and Task B
await mcpClient.call({
  method: 'tools/call',
  params: {
    name: 'add_task_dependency',
    arguments: {
      task_id: 'taskC_id',
      depends_on: 'taskA_id'
    }
  }
});

await mcpClient.call({
  method: 'tools/call',
  params: {
    name: 'add_task_dependency',
    arguments: {
      task_id: 'taskC_id',
      depends_on: 'taskB_id'
    }
  }
});
```

---

## Parameter Reference

### Common Parameters

#### `team_id` / `workspace_id`
- **Type:** string
- **Description:** ClickUp workspace/team identifier
- **Example:** `"12345"`
- **How to get:** Contact ClickUp support or check workspace settings URL

#### `list_id`
- **Type:** string
- **Description:** ClickUp list identifier
- **Example:** `"90144360426"`
- **How to get:** Use [`get_workspace_hierarchy`](#get_workspace_hierarchy)

#### `task_id`
- **Type:** string
- **Description:** Task identifier (ClickUp ID or custom ID)
- **Example:** `"abc123xyz"` or `"TASK-123"`
- **How to get:** From task creation response or [`search_tasks`](#search_tasks)

#### `space_id`
- **Type:** string
- **Description:** Space identifier
- **Example:** `"space_789"`
- **How to get:** Use [`get_workspace_hierarchy`](#get_workspace_hierarchy)

#### `folder_id`
- **Type:** string
- **Description:** Folder identifier
- **Example:** `"folder_456"`
- **How to get:** Use [`get_workspace_hierarchy`](#get_workspace_hierarchy)

#### `custom_field_id`
- **Type:** string
- **Description:** Custom field identifier
- **Example:** `"cf_12345"`
- **How to get:** Use [`get_custom_fields`](#get_custom_fields)

### Parameter Validation

**ID Formats:**
- Workspace ID: Numeric string (e.g., `"12345"`)
- List ID: Numeric string (e.g., `"90144360426"`)
- Task ID: Alphanumeric (e.g., `"abc123xyz"`) or custom (e.g., `"TASK-123"`)
- Custom Field ID: Prefixed format (e.g., `"cf_abc123"`)

**String Limits:**
- Task names: 1-1000 characters
- Descriptions: Up to 100,000 characters
- Tag names: 1-100 characters
- Comment text: Up to 50,000 characters

**Numeric Ranges:**
- Priorities: 1-4 (1=urgent, 2=high, 3=normal, 4=low)
- Time estimates: 0-999999999 milliseconds
- Positions: 0-999999 (ordering)
- Custom field values: Type-dependent

**Date Formats:**
- ISO 8601: `"2025-02-15T10:30:00Z"`
- Date only: `"2025-02-15"`
- Natural language: `"tomorrow"`, `"next Monday"`, `"in 2 weeks"`
- Unix timestamps: Number of seconds since epoch

---

## Tier Comparison

### Free Tier Tools (45 tools)

**Core Task Operations:**
- Task CRUD: create, read, update, delete
- Task search and filtering
- Task comments (get/create)
- Task tags (add/remove)
- Task attachments (attach/get)
- Task assignments

**Workspace Navigation:**
- Workspace hierarchy
- Workspace views
- Workspace tags

**Organization:**
- Lists (CRUD, tasks, views, members)
- Folders (CRUD)
- Spaces (CRUD, tags, members)
- Tags (create)

**Other:**
- Users (get current, get by ID)
- Team members (list)
- Goals (CRUD)
- Views (create)

**Rate Limit:** 100 requests/minute

---

### Premium Tier Tools (27 tools) 💎

**Bulk Operations (6 tools):**
- `bulk_create_tasks` - Create up to 50 tasks at once
- `bulk_update_tasks` - Update multiple tasks simultaneously
- `bulk_move_tasks` - Move multiple tasks to different list
- `bulk_delete_tasks` - Delete multiple tasks
- `bulk_create_lists` - Create multiple lists
- `update_list_custom_fields` - Configure list custom fields

**Time Tracking (6 tools):**
- `start_time_tracking` - Start timer on task
- `stop_time_tracking` - Stop running timer
- `get_running_time_entry` - View current timer
- `create_time_entry` - Manually log time
- `update_time_entry` - Modify time entries
- `delete_time_entry` - Remove time entries

**Custom Fields Management (4 tools):**
- `create_custom_field` - Create new custom fields
- `update_custom_field` - Modify custom fields
- `delete_custom_field` - Remove custom fields
- `set_custom_field_value` - Set values on tasks

**Task Advanced (2 tools):**
- `update_custom_field_value` - Update task custom field values
- `remove_custom_field_value` - Remove custom field values

**Task Dependencies (2 tools):**
- `add_task_dependency` - Create task dependencies
- `remove_task_dependency` - Remove dependencies

**Document Management (5 tools):**
- `create_document` - Create ClickUp documents
- `get_document` - View document content
- `update_document` - Edit documents
- `delete_document` - Remove documents
- `list_documents` - List workspace documents

**Project Management (5 tools):**
- `create_project` - Create Gantt projects
- `update_project` - Modify projects
- `get_project` - View project details
- `delete_project` - Remove projects
- `get_project_tasks` - List project tasks

**Rate Limit:** 500 requests/minute (5x increase)

**Upgrade Now:** [$4.99/month - See Premium Features](PREMIUM_FEATURES.md)

---

## Error Handling

### Common Errors Across All Tools

#### Authentication Errors

```json
{
  "error": {
    "code": "unauthorized",
    "message": "Invalid or expired JWT token"
  }
}
```
**Solution:** Refresh JWT token or re-authenticate via OAuth. See [AUTHENTICATION.md](AUTHENTICATION.md#token-refresh).

---

#### Rate Limit Errors

```json
{
  "error": {
    "code": "rate_limited",
    "message": "Rate limit exceeded",
    "details": {
      "limit": 100,
      "reset_in_seconds": 45
    }
  }
}
```
**Solution:** Wait for rate limit reset or [upgrade to Premium tier](PREMIUM_FEATURES.md) for 500 requests/minute.

---

#### ClickUp API Errors

```json
{
  "error": {
    "code": "clickup_api_error",
    "message": "ClickUp API returned error",
    "details": {
      "status": 404,
      "clickup_error": "Resource not found"
    }
  }
}
```
**Solution:** Verify resource exists and user has permissions.

---

#### Invalid Parameters

```json
{
  "error": {
    "code": "invalid_parameters",
    "message": "Missing required parameter: list_id",
    "details": {
      "parameter": "list_id",
      "required": true
    }
  }
}
```
**Solution:** Check tool documentation for required parameters.

---

#### Premium Tool Access

```json
{
  "error": {
    "code": "premium_required",
    "message": "This tool requires Premium tier subscription",
    "details": {
      "tool": "bulk_create_tasks",
      "tier_required": "premium",
      "current_tier": "free",
      "upgrade_url": "https://clickup-mcp.workers.dev/stripe/create-checkout"
    }
  }
}
```
**Solution:** [Upgrade to Premium tier](PREMIUM_FEATURES.md) ($4.99/month) to access this tool.

---

### Tool-Specific Error Handling

```typescript
// Example: Robust error handling with retry logic
async function callToolWithRetry(toolName: string, args: any, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await mcpClient.call({
        method: 'tools/call',
        params: { name: toolName, arguments: args }
      });
      return result;
    } catch (error) {
      if (error.code === 'rate_limited') {
        const waitTime = error.details?.reset_in_seconds || 60;
        console.log(`Rate limited, waiting ${waitTime}s...`);
        await sleep(waitTime * 1000);
        continue; // Retry
      } else if (error.code === 'unauthorized') {
        console.log('Token expired, refreshing...');
        await refreshToken();
        continue; // Retry with new token
      } else if (error.code === 'task_not_found' && toolName === 'get_task') {
        // Specific handling for task not found
        console.log('Task not found, may have been deleted');
        return null;
      } else {
        // Unhandled error
        console.error('Tool call failed:', error);
        throw error;
      }
    }
  }
  throw new Error(`Max retries (${maxRetries}) exceeded for ${toolName}`);
}
```

---

## Related Documentation

- [Authentication Guide](AUTHENTICATION.md) - OAuth 2.0 flow and JWT session tokens
- [Premium Features](PREMIUM_FEATURES.md) - Tier comparison and upgrade details
- [Security Documentation](SECURITY.md) - Encryption, rate limiting, audit logging
- [API Reference](API_REFERENCE.md) - MCP protocol details
- [Troubleshooting](TROUBLESHOOTING.md) - Common issues and solutions

---

*Last Updated: 2025-01-28*
*For questions or issues, see [Troubleshooting Guide](TROUBLESHOOTING.md)*
