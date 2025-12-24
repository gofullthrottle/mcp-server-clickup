# Tool Documentation: `move_task`

**Category**: Task Management

**Description**: Moves a task from one list to another within the same workspace. Preserves task properties, custom fields, and relationships while changing the parent list.

**Use Cases**:
- Move task to different project stage (e.g., from "Backlog" to "In Progress")
- Reorganize tasks across team lists
- Transfer work items to different workflow lists
- Move completed tasks to archive list

---

### Input Parameters

```json
{
  "taskId": {
    "type": "string",
    "required": false,
    "description": "ID of task to move (preferred). Automatically detects and handles both regular task IDs (9 characters) and custom IDs (like 'DEV-1234', 'PROJ-456')",
    "example": "86fpd7vgc" or "DEV-1234"
  },
  "taskName": {
    "type": "string",
    "required": false,
    "description": "Name of task to move. WARNING: May match multiple tasks if not scoped",
    "example": "Implement user authentication"
  },
  "listName": {
    "type": "string",
    "required": false,
    "description": "Name of current list containing the task (used with taskName for disambiguation)",
    "example": "Sprint Backlog"
  },
  "targetListId": {
    "type": "string",
    "required": false,
    "description": "ID of destination list (preferred)",
    "example": "901234567"
  },
  "targetListName": {
    "type": "string",
    "required": false,
    "description": "Name of destination list",
    "example": "In Progress"
  }
}
```

**Parameter Details**:
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|------------|
| taskId | string | No* | Task ID (preferred) | `"86fpd7vgc"` or `"DEV-1234"` |
| taskName | string | No* | Task name | `"Implement authentication"` |
| listName | string | No | Current list name (for disambiguation) | `"Sprint Backlog"` |
| targetListId | string | No** | Destination list ID (preferred) | `"901234567"` |
| targetListName | string | No** | Destination list name | `"In Progress"` |

*Note: Either `taskId` OR `taskName` is REQUIRED (at least one must be provided)
**Note: Either `targetListId` OR `targetListName` is REQUIRED (at least one must be provided)

---

### Returns

**Success Response** (when `ENABLE_DEBUG=false`):
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Task moved successfully",
    "task": {
      "id": "86fpd7vgc",
      "name": "🚀 Implement user authentication",
      "status": {
        "status": "To Do",
        "color": "#d3d3d3"
      },
      "list": {
        "id": "901234567",
        "name": "In Progress"
      },
      "url": "https://app.clickup.com/t/86fpd7vgc"
    }
  },
  "metadata": {
    "timestamp": "2025-01-18T10:30:00.000Z",
    "tool_name": "move_task",
    "execution_time_ms": 180,
    "rate_limit": {
      "remaining": 98,
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
    "message": "Task moved successfully",
    "task": {
      "id": "86fpd7vgc",
      "name": "🚀 Implement user authentication",
      "status": {
        "status": "To Do",
        "color": "#d3d3d3"
      },
      "list": {
        "id": "901234567",
        "name": "In Progress"
      },
      "url": "https://app.clickup.com/t/86fpd7vgc"
    }
  },
  "metadata": {
    "timestamp": "2025-01-18T10:30:00.000Z",
    "tool_name": "move_task",
    "execution_time_ms": 180,
    "rate_limit": {
      "remaining": 98,
      "limit": 100,
      "reset_at": 1705575000000
    },
    "debug": {
      "request_id": "a1b2c3d4",
      "tool_name": "move_task",
      "timing": {
        "total_ms": 180,
        "api_calls": [
          {
            "method": "GET",
            "path": "/list/{id}",
            "duration": 80,
            "status": 200
          },
          {
            "method": "PUT",
            "path": "/task/{id}",
            "duration": 100,
            "status": 200
          }
        ]
      },
      "api_summary": {
        "total_calls": 2,
        "total_api_time_ms": 180,
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
| data.success | boolean | Confirms move was successful |
| data.message | string | Human-readable confirmation message |
| data.task.id | string | Task ID |
| data.task.name | string | Task name |
| data.task.status | object | Task status in new list |
| data.task.list | object | New list details |
| data.task.url | string | Direct link to task |
| metadata.execution_time_ms | number | Move operation time |
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
    "suggested_action": "Provide either a taskId or taskName to identify the task to move."
  }
}
```

**2. VALIDATION (Missing Target List)**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "Either targetListId or targetListName must be provided",
    "type": "VALIDATION",
    "suggested_action": "Provide either a targetListId or targetListName to specify the destination list."
  }
}
```

**3. NOT_FOUND (Task Not Found)**
```json
{
  "success": false,
  "error": {
    "code": "TASK_NOT_FOUND",
    "message": "Task 'Implement authentication' not found in workspace",
    "type": "NOT_FOUND",
    "suggested_action": "Verify the task name is correct. Use get_workspace_tasks to search for the task."
  }
}
```

**4. NOT_FOUND (Target List Not Found)**
```json
{
  "success": false,
  "error": {
    "code": "LIST_NOT_FOUND",
    "message": "List 'In Progress' not found in workspace",
    "type": "NOT_FOUND",
    "suggested_action": "Verify the list name is correct. Use get_workspace_hierarchy to see all available lists."
  }
}
```

**5. VALIDATION (Same List)**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_OPERATION",
    "message": "Task is already in list 'In Progress'",
    "type": "VALIDATION",
    "suggested_action": "Task is already in the target list. No move operation needed."
  }
}
```

**6. AUTH**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Insufficient permissions to move task to this list",
    "type": "AUTH",
    "suggested_action": "Ensure your API key has permission to move tasks to the target list."
  }
}
```

**7. RATE_LIMIT**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit of 100 requests per minute exceeded",
    "type": "RATE_LIMIT",
    "retry_after": 30,
    "suggested_action": "Wait 30 seconds before retrying. Consider using move_bulk_tasks for multiple moves."
  }
}
```

**Error Type Summary**:
| Error Type | HTTP Status | Retryable | Description |
|------------|-------------|-----------|-------------|
| VALIDATION | 400 | No | Missing parameters or invalid operation |
| NOT_FOUND | 404 | No | Task or list does not exist |
| AUTH | 401, 403 | No | Authentication or authorization failed |
| RATE_LIMIT | 429 | Yes | Rate limit exceeded - wait and retry |
| API_ERROR | 500, 502, 503 | Yes | Server error - retry with backoff |

---

### Rate Limits

**ClickUp API Rate Limit**: 100 requests/minute (Free Forever plan)

**This Tool's Impact**:
- **API Calls**: 2 call(s) per execution (1 for list lookup if targetListName used, 1 for move)
- **Estimated Impact**: ~2% of rate limit per execution

**Rate Limit Behavior**:
1. Automatic retry with exponential backoff (100ms → 200ms → 400ms → 800ms)
2. Rate limit info included in response metadata
3. Requests queued when rate limit hit

**Recommendations**:
- Use `targetListId` instead of `targetListName` to reduce API calls
- Use `move_bulk_tasks` when moving 3 or more tasks to same list
- Cache list IDs when performing multiple moves
- Consider batching moves during off-peak hours

---

### API Dependencies

**ClickUp API Endpoints Called**:
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/team/{team_id}/space` | Look up target list by name (only if targetListName provided) |
| PUT | `/task/{task_id}` | Move task to new list |

**Required Permissions**:
- **Task Read**: Permission to read the source task
- **Task Update**: Permission to update task list assignment
- **List Access**: Read access to both source and target lists

**API Documentation**:
- [ClickUp API Reference - Update Task](https://clickup.com/api/clickupreference/operation/UpdateTask)

---

### Examples

#### Example 1: Move by Task ID and Target List ID (Safest/Fastest)
```javascript
// Input
{
  "taskId": "86fpd7vgc",
  "targetListId": "901234567"
}

// Output
{
  "success": true,
  "data": {
    "success": true,
    "message": "Task moved successfully",
    "task": {
      "id": "86fpd7vgc",
      "name": "🚀 Implement authentication",
      "list": {"id": "901234567", "name": "In Progress"}
    }
  }
}
```

#### Example 2: Move by Custom Task ID
```javascript
// Input
{
  "taskId": "DEV-1234",
  "targetListName": "In Progress"
}

// Output
{
  "success": true,
  "data": {
    "success": true,
    "message": "Task moved successfully",
    "task": {
      "id": "86fpd7vgc",
      "name": "🚀 Implement authentication",
      "list": {"id": "901234567", "name": "In Progress"}
    }
  }
}
```

#### Example 3: Move by Task Name with Disambiguation
```javascript
// Input
{
  "taskName": "Implement authentication",
  "listName": "Sprint Backlog",
  "targetListName": "In Progress"
}

// Output
{
  "success": true,
  "data": {
    "success": true,
    "message": "Task moved successfully"
  }
}
```

#### Example 4: Error - Task Already in Target List
```javascript
// Input
{
  "taskId": "86fpd7vgc",
  "targetListName": "In Progress"
}

// Output (Error)
{
  "success": false,
  "error": {
    "code": "INVALID_OPERATION",
    "message": "Task is already in list 'In Progress'",
    "type": "VALIDATION",
    "suggested_action": "Task is already in the target list. No move operation needed."
  }
}
```

---

### Integration Examples

#### Python
```python
from mcp import Client

client = Client()

# Move task by ID (fastest method)
response = client.call_tool(
    "move_task",
    {
        "taskId": "86fpd7vgc",
        "targetListId": "901234567"
    }
)

if response["success"]:
    task = response["data"]["task"]
    print(f"Task moved: {task['name']}")
    print(f"New list: {task['list']['name']}")
    print(f"URL: {task['url']}")

    # Check execution time
    exec_time = response["metadata"]["execution_time_ms"]
    print(f"Move took {exec_time}ms")
else:
    error = response["error"]
    print(f"Error: {error['message']}")

    if error["type"] == "VALIDATION" and "already in list" in error["message"]:
        print("Task is already in the target list")

# Move by name with disambiguation
response = client.call_tool(
    "move_task",
    {
        "taskName": "Implement authentication",
        "listName": "Sprint Backlog",
        "targetListName": "In Progress"
    }
)
```

#### TypeScript
```typescript
import { Client } from '@modelcontextprotocol/sdk/client';

const client = new Client();

// Move task between workflow stages
const moveTask = async (taskId: string, targetListId: string) => {
  const response = await client.callTool('move_task', {
    taskId,
    targetListId
  });

  if (response.success) {
    const task = response.data.task;
    console.log(`✓ Moved: ${task.name}`);
    console.log(`  From list → To list: ${task.list.name}`);
    return task;
  } else {
    console.error(`✗ Failed: ${response.error.message}`);
    throw new Error(response.error.message);
  }
};

// Move custom ID task
const moveCustomTask = async (customId: string, targetListName: string) => {
  const response = await client.callTool('move_task', {
    taskId: customId,  // Automatically detects custom ID format
    targetListName
  });

  return response.success ? response.data.task : null;
};

// Workflow: Move task through stages
const moveToNextStage = async (taskId: string, currentStage: string) => {
  const stages = {
    'Backlog': 'To Do',
    'To Do': 'In Progress',
    'In Progress': 'Review',
    'Review': 'Done'
  };

  const nextStage = stages[currentStage];
  if (!nextStage) {
    console.log('Task is already in final stage');
    return;
  }

  return await moveTask(taskId, nextStage);
};

await moveTask('86fpd7vgc', '901234567');
await moveCustomTask('DEV-1234', 'In Progress');
await moveToNextStage('86fpd7vgc', 'To Do');
```

---

### Related Tools

- **get_task**: Retrieve task details including current list
- **update_task**: Update task properties (use this for status changes within same list)
- **move_bulk_tasks**: Move multiple tasks to same list at once
- **get_workspace_hierarchy**: View all lists to find target list IDs
- **duplicate_task**: Create copy of task in different list

---

### Best Practices

**DO:**
- ✅ Use `taskId` and `targetListId` for fastest performance
- ✅ Verify task exists before moving
- ✅ Check if task is already in target list
- ✅ Use `move_bulk_tasks` for 3+ tasks to same list
- ✅ Cache list IDs when performing multiple moves

**DON'T:**
- ❌ Move task to same list it's already in
- ❌ Move tasks by name without list scoping
- ❌ Perform rapid sequential moves (use bulk operation)
- ❌ Move tasks between different workspaces (not supported)

---

### Performance Tips

**Optimization Strategies**:
1. **Use IDs**: Both taskId and targetListId to minimize API calls
2. **Bulk Operations**: Use `move_bulk_tasks` for multiple tasks
3. **Cache List IDs**: Store frequently used list IDs in your application
4. **Status vs List**: Use `update_task` for status changes within same list

**Typical Response Times**:
- With IDs: ~80-120ms
- With names: ~150-250ms (includes lookup)

---

### Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.1.0 | 2025-01-18 | Added debug metadata support (Phase 5) |
| 1.0.0 | 2025-01-15 | Added automatic retry with telemetry (Phase 4) |
| 0.9.0 | 2025-01-10 | Added custom ID detection and validation |
| 0.8.0 | 2025-01-05 | Initial tool implementation |

---

**Last Updated**: 2025-01-18
**Status**: Production-ready - Part of 72-tool comprehensive suite
