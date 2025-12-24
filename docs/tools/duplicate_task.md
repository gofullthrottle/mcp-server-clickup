# Tool Documentation: `duplicate_task`

**Category**: Task Management

**Description**: Creates an exact copy of a task in the same list or a different list. Preserves task properties, custom fields, subtasks, and attachments based on configuration options.

**Use Cases**:
- Create task template copies for recurring work
- Duplicate sprint tasks for new iteration
- Clone task structure to different project
- Create task variations for A/B testing

---

### Input Parameters

```json
{
  "taskId": {
    "type": "string",
    "required": false,
    "description": "ID of task to duplicate (preferred). Automatically detects and handles both regular task IDs (9 characters) and custom IDs (like 'DEV-1234', 'PROJ-456')",
    "example": "86fpd7vgc" or "DEV-1234"
  },
  "taskName": {
    "type": "string",
    "required": false,
    "description": "Name of task to duplicate. WARNING: May match multiple tasks if not scoped",
    "example": "Sprint task template"
  },
  "listName": {
    "type": "string",
    "required": false,
    "description": "Name of list containing the task (used with taskName for disambiguation)",
    "example": "Sprint Backlog"
  },
  "targetListId": {
    "type": "string",
    "required": false,
    "description": "ID of destination list. If not provided, duplicates in same list as original",
    "example": "901234567"
  },
  "targetListName": {
    "type": "string",
    "required": false,
    "description": "Name of destination list",
    "example": "Sprint 2"
  },
  "includeSubtasks": {
    "type": "boolean",
    "required": false,
    "description": "Copy subtasks to duplicated task (default: false)",
    "example": true
  },
  "includeAttachments": {
    "type": "boolean",
    "required": false,
    "description": "Copy attachments to duplicated task (default: false)",
    "example": true
  },
  "includeAssignees": {
    "type": "boolean",
    "required": false,
    "description": "Copy assignees to duplicated task (default: false)",
    "example": true
  },
  "includeChecklists": {
    "type": "boolean",
    "required": false,
    "description": "Copy checklists to duplicated task (default: false)",
    "example": true
  }
}
```

**Parameter Details**:
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|------------|
| taskId | string | No* | Task ID (preferred) | `"86fpd7vgc"` or `"DEV-1234"` |
| taskName | string | No* | Task name | `"Sprint task template"` |
| listName | string | No | Current list name (for disambiguation) | `"Sprint Backlog"` |
| targetListId | string | No | Destination list ID | `"901234567"` |
| targetListName | string | No | Destination list name | `"Sprint 2"` |
| includeSubtasks | boolean | No | Copy subtasks (default: false) | `true` |
| includeAttachments | boolean | No | Copy attachments (default: false) | `true` |
| includeAssignees | boolean | No | Copy assignees (default: false) | `true` |
| includeChecklists | boolean | No | Copy checklists (default: false) | `true` |

*Note: Either `taskId` OR `taskName` is REQUIRED (at least one must be provided)

---

### Returns

**Success Response** (when `ENABLE_DEBUG=false`):
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Task duplicated successfully",
    "original_task": {
      "id": "86fpd7vgc",
      "name": "🚀 Sprint task template",
      "list": {"id": "123456", "name": "Templates"}
    },
    "duplicated_task": {
      "id": "xyz789abc",
      "name": "🚀 Sprint task template (Copy)",
      "status": {
        "status": "To Do",
        "color": "#d3d3d3"
      },
      "list": {
        "id": "901234567",
        "name": "Sprint 2"
      },
      "assignees": [
        {
          "id": 12345678,
          "username": "John Doe"
        }
      ],
      "url": "https://app.clickup.com/t/xyz789abc"
    }
  },
  "metadata": {
    "timestamp": "2025-01-18T10:30:00.000Z",
    "tool_name": "duplicate_task",
    "execution_time_ms": 250,
    "rate_limit": {
      "remaining": 97,
      "limit": 100,
      "reset_at": 1705575000000
    }
  }
}
```

**Success Response with Debug**:
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Task duplicated successfully",
    "original_task": {
      "id": "86fpd7vgc",
      "name": "🚀 Sprint task template"
    },
    "duplicated_task": {
      "id": "xyz789abc",
      "name": "🚀 Sprint task template (Copy)",
      "status": {"status": "To Do"},
      "list": {"id": "901234567", "name": "Sprint 2"},
      "url": "https://app.clickup.com/t/xyz789abc"
    }
  },
  "metadata": {
    "timestamp": "2025-01-18T10:30:00.000Z",
    "tool_name": "duplicate_task",
    "execution_time_ms": 250,
    "rate_limit": {
      "remaining": 97,
      "limit": 100,
      "reset_at": 1705575000000
    },
    "debug": {
      "request_id": "e5f6g7h8",
      "tool_name": "duplicate_task",
      "timing": {
        "total_ms": 250,
        "api_calls": [
          {
            "method": "GET",
            "path": "/task/{id}",
            "duration": 100,
            "status": 200
          },
          {
            "method": "POST",
            "path": "/list/{id}/task",
            "duration": 150,
            "status": 200
          }
        ]
      },
      "api_summary": {
        "total_calls": 2,
        "total_api_time_ms": 250,
        "success_count": 2,
        "error_count": 0
      }
    }
  }
}
```

**Response Fields**:
| Field | Type | Description |
|-------|------|-------------|
| success | boolean | Always `true` for successful responses |
| data.success | boolean | Confirms duplication was successful |
| data.message | string | Human-readable confirmation message |
| data.original_task | object | Original task reference |
| data.duplicated_task | object | Newly created duplicate task |
| data.duplicated_task.id | string | New task ID |
| data.duplicated_task.name | string | Task name (with " (Copy)" suffix) |
| data.duplicated_task.url | string | Direct link to duplicated task |
| metadata.execution_time_ms | number | Duplication operation time |
| metadata.rate_limit | object | Current rate limit status |

---

### Error Types

This tool may return the following errors:

**1. VALIDATION (Missing Task Identifier)**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "Either taskId or taskName must be provided",
    "type": "VALIDATION",
    "suggested_action": "Provide either a taskId or taskName to identify the task to duplicate."
  }
}
```

**2. NOT_FOUND (Task Not Found)**
```json
{
  "success": false,
  "error": {
    "code": "TASK_NOT_FOUND",
    "message": "Task 'Sprint task template' not found in workspace",
    "type": "NOT_FOUND",
    "suggested_action": "Verify the task name is correct. Use get_workspace_tasks to search for the task."
  }
}
```

**3. NOT_FOUND (Target List Not Found)**
```json
{
  "success": false,
  "error": {
    "code": "LIST_NOT_FOUND",
    "message": "List 'Sprint 2' not found in workspace",
    "type": "NOT_FOUND",
    "suggested_action": "Verify the list name is correct. Use get_workspace_hierarchy to see all available lists."
  }
}
```

**4. AUTH**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Insufficient permissions to duplicate task to this list",
    "type": "AUTH",
    "suggested_action": "Ensure your API key has permission to create tasks in the target list."
  }
}
```

**5. RATE_LIMIT**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit of 100 requests per minute exceeded",
    "type": "RATE_LIMIT",
    "retry_after": 30,
    "suggested_action": "Wait 30 seconds before retrying. Consider using create_bulk_tasks for multiple duplications."
  }
}
```

**Error Type Summary**:
| Error Type | HTTP Status | Retryable | Description |
|------------|-------------|-----------|-------------|
| VALIDATION | 400 | No | Missing parameters |
| NOT_FOUND | 404 | No | Task or list does not exist |
| AUTH | 401, 403 | No | Authentication or authorization failed |
| RATE_LIMIT | 429 | Yes | Rate limit exceeded - wait and retry |
| API_ERROR | 500, 502, 503 | Yes | Server error - retry with backoff |

---

### Rate Limits

**ClickUp API Rate Limit**: 100 requests/minute (Free Forever plan)

**This Tool's Impact**:
- **API Calls**: 2-3 call(s) per execution (1 GET original, 1 POST duplicate, +1 if targetListName used)
- **Estimated Impact**: ~2-3% of rate limit per execution

**Rate Limit Behavior**:
1. Automatic retry with exponential backoff (100ms → 200ms → 400ms → 800ms)
2. Rate limit info included in response metadata
3. Requests queued when rate limit hit

**Recommendations**:
- Use `targetListId` instead of `targetListName` to reduce API calls
- For multiple duplications, space them out or use create_bulk_tasks
- Cache list IDs when performing multiple duplications
- Consider duplication during off-peak hours for large tasks with attachments

---

### API Dependencies

**ClickUp API Endpoints Called**:
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/task/{task_id}` | Retrieve original task details |
| GET | `/team/{team_id}/space` | Look up target list by name (only if targetListName provided) |
| POST | `/list/{list_id}/task` | Create duplicate task |

**Required Permissions**:
- **Task Read**: Permission to read the source task
- **Task Create**: Permission to create tasks in target list
- **List Access**: Read access to both source and target lists

**API Documentation**:
- [ClickUp API Reference - Get Task](https://clickup.com/api/clickupreference/operation/GetTask)
- [ClickUp API Reference - Create Task](https://clickup.com/api/clickupreference/operation/CreateTask)

---

### Examples

#### Example 1: Duplicate in Same List (Simple Copy)
```javascript
// Input
{
  "taskId": "86fpd7vgc"
}

// Output
{
  "success": true,
  "data": {
    "success": true,
    "message": "Task duplicated successfully",
    "duplicated_task": {
      "id": "xyz789abc",
      "name": "🚀 Sprint task template (Copy)",
      "list": {"id": "123456", "name": "Templates"},
      "url": "https://app.clickup.com/t/xyz789abc"
    }
  }
}
```

#### Example 2: Duplicate to Different List with All Properties
```javascript
// Input
{
  "taskId": "DEV-1234",
  "targetListName": "Sprint 2",
  "includeSubtasks": true,
  "includeAttachments": true,
  "includeAssignees": true,
  "includeChecklists": true
}

// Output
{
  "success": true,
  "data": {
    "success": true,
    "message": "Task duplicated successfully",
    "original_task": {
      "id": "86fpd7vgc",
      "name": "🚀 Sprint task template"
    },
    "duplicated_task": {
      "id": "xyz789abc",
      "name": "🚀 Sprint task template (Copy)",
      "list": {"id": "901234567", "name": "Sprint 2"},
      "assignees": [{"id": 12345678, "username": "John Doe"}],
      "subtasks": 5,
      "attachments": 3,
      "checklists": 2,
      "url": "https://app.clickup.com/t/xyz789abc"
    }
  }
}
```

#### Example 3: Duplicate by Name with Disambiguation
```javascript
// Input
{
  "taskName": "Sprint task template",
  "listName": "Templates",
  "targetListId": "901234567",
  "includeSubtasks": true
}

// Output
{
  "success": true,
  "data": {
    "success": true,
    "message": "Task duplicated successfully",
    "duplicated_task": {
      "id": "xyz789abc",
      "name": "🚀 Sprint task template (Copy)",
      "url": "https://app.clickup.com/t/xyz789abc"
    }
  }
}
```

#### Example 4: Template Copy (No Assignees, Fresh Start)
```javascript
// Input
{
  "taskId": "86fpd7vgc",
  "targetListName": "Sprint 3",
  "includeSubtasks": true,
  "includeChecklists": true,
  "includeAssignees": false,  // Start fresh
  "includeAttachments": false
}

// Output
{
  "success": true,
  "data": {
    "success": true,
    "message": "Task duplicated successfully",
    "duplicated_task": {
      "id": "xyz789abc",
      "name": "🚀 Sprint task template (Copy)",
      "assignees": [],  // Empty - ready for new assignment
      "subtasks": 5,    // Preserved
      "checklists": 2,  // Preserved
      "attachments": 0  // Not copied
    }
  }
}
```

---

### Integration Examples

#### Python
```python
from mcp import Client

client = Client()

# Simple duplication (same list, no extras)
response = client.call_tool(
    "duplicate_task",
    {"taskId": "86fpd7vgc"}
)

if response["success"]:
    dup = response["data"]["duplicated_task"]
    print(f"Task duplicated: {dup['name']}")
    print(f"New ID: {dup['id']}")
    print(f"URL: {dup['url']}")
else:
    print(f"Error: {response['error']['message']}")

# Full duplication to different list
response = client.call_tool(
    "duplicate_task",
    {
        "taskId": "DEV-1234",
        "targetListName": "Sprint 2",
        "includeSubtasks": True,
        "includeAttachments": True,
        "includeAssignees": True,
        "includeChecklists": True
    }
)

# Template duplication (no assignees for fresh start)
response = client.call_tool(
    "duplicate_task",
    {
        "taskName": "Sprint template",
        "listName": "Templates",
        "targetListId": "901234567",
        "includeSubtasks": True,
        "includeChecklists": True,
        "includeAssignees": False  # Start fresh
    }
)
```

#### TypeScript
```typescript
import { Client } from '@modelcontextprotocol/sdk/client';

const client = new Client();

// Duplicate task with full properties
const duplicateTask = async (
  taskId: string,
  targetListId: string,
  includeAll: boolean = false
) => {
  const response = await client.callTool('duplicate_task', {
    taskId,
    targetListId,
    includeSubtasks: includeAll,
    includeAttachments: includeAll,
    includeAssignees: includeAll,
    includeChecklists: includeAll
  });

  if (response.success) {
    const dup = response.data.duplicated_task;
    console.log(`✓ Duplicated: ${dup.name}`);
    console.log(`  New ID: ${dup.id}`);
    console.log(`  List: ${dup.list.name}`);
    return dup;
  } else {
    console.error(`✗ Failed: ${response.error.message}`);
    throw new Error(response.error.message);
  }
};

// Create task template for recurring work
const createFromTemplate = async (templateId: string, sprintListId: string) => {
  return await duplicateTask(templateId, sprintListId, true);
};

// Duplicate without assignees (fresh start)
const duplicateForNewSprint = async (taskId: string, newSprintListId: string) => {
  const response = await client.callTool('duplicate_task', {
    taskId,
    targetListId: newSprintListId,
    includeSubtasks: true,
    includeChecklists: true,
    includeAssignees: false,  // Fresh assignment
    includeAttachments: false
  });

  return response.success ? response.data.duplicated_task : null;
};

await duplicateTask('86fpd7vgc', '901234567', true);
await createFromTemplate('template-123', 'sprint-2-list');
await duplicateForNewSprint('DEV-1234', 'sprint-3-list');
```

---

### Related Tools

- **create_task**: Create new task from scratch
- **move_task**: Move existing task to different list
- **get_task**: Retrieve task details before duplicating
- **update_task**: Modify duplicated task properties
- **create_bulk_tasks**: Create multiple tasks at once (alternative to multiple duplications)

---

### Best Practices

**DO:**
- ✅ Use `taskId` for fastest and safest duplication
- ✅ Specify exactly which properties to copy (explicit include* flags)
- ✅ Use templates for recurring work (store in "Templates" list)
- ✅ Consider not copying assignees for fresh start
- ✅ Verify target list exists before duplicating

**DON'T:**
- ❌ Duplicate tasks with large attachments without considering rate limits
- ❌ Copy assignees when task is for different team
- ❌ Duplicate by name without list scoping (may duplicate wrong task)
- ❌ Use duplication for bulk operations (use create_bulk_tasks instead)

---

### Use Case Patterns

**Sprint Template Pattern**:
```typescript
// Create sprint tasks from templates
const templates = ['planning', 'retro', 'demo'];
for (const template of templates) {
  await duplicateTask(
    template + '-template-id',
    newSprintListId,
    { includeSubtasks: true, includeAssignees: false }
  );
}
```

**Task Variation Pattern**:
```typescript
// Create A/B test variations
const original = await getTask('feature-task-id');
const variantA = await duplicateTask(original.id, 'variant-a-list');
const variantB = await duplicateTask(original.id, 'variant-b-list');
```

---

### Performance Tips

**Optimization Strategies**:
1. **Use IDs**: Both taskId and targetListId for fastest performance
2. **Selective Copying**: Only include properties you need
3. **Batch Spacing**: Space out multiple duplications to avoid rate limits
4. **Cache List IDs**: Store frequently used list IDs

**Typical Response Times**:
- Simple copy (no extras): ~150-200ms
- Full copy (all properties): ~250-400ms
- With large attachments: ~500-1000ms+

---

### Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.1.0 | 2025-01-18 | Added debug metadata support (Phase 5) |
| 1.0.0 | 2025-01-15 | Added automatic retry with telemetry (Phase 4) |
| 0.9.0 | 2025-01-10 | Added custom ID detection and selective property copying |
| 0.8.0 | 2025-01-05 | Initial tool implementation |

---

**Last Updated**: 2025-01-18
**Status**: Production-ready - Part of 72-tool comprehensive suite
