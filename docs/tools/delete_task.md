# Tool Documentation: `delete_task`

**Category**: Task Management

**Description**: PERMANENTLY deletes a task from ClickUp. This operation cannot be undone. Supports identification by task ID (preferred for safety) or task name.

**Use Cases**:
- Remove accidentally created duplicate tasks
- Delete test tasks from development/staging environments
- Clean up cancelled or obsolete tasks
- Remove spam or incorrect task entries

---

### Input Parameters

```json
{
  "taskId": {
    "type": "string",
    "required": false,
    "description": "ID of task to delete (preferred/safest). Automatically detects and handles both regular task IDs (9 characters) and custom IDs (like 'DEV-1234', 'PROJ-456')",
    "example": "86fpd7vgc" or "DEV-1234"
  },
  "taskName": {
    "type": "string",
    "required": false,
    "description": "Name of task to delete. The tool will search for tasks with this name across all lists unless listName is specified. WARNING: May match multiple tasks",
    "example": "Old test task"
  },
  "listName": {
    "type": "string",
    "required": false,
    "description": "Optional: Name of list containing the task. Providing this narrows the search to a specific list, improving performance and reducing ambiguity",
    "example": "Sprint Backlog"
  }
}
```

**Parameter Details**:
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| taskId | string | No* | Task ID (preferred/safest) | `"86fpd7vgc"` or `"DEV-1234"` |
| taskName | string | No* | Task name for search (use with caution) | `"Old test task"` |
| listName | string | No | List name (strongly recommended with taskName) | `"Test Tasks"` |

*Note: Either `taskId` OR `taskName` is REQUIRED (at least one must be provided)

---

### Returns

**Success Response**:
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Task deleted successfully"
  },
  "metadata": {
    "timestamp": "2025-01-18T10:30:00.000Z",
    "tool_name": "delete_task",
    "execution_time_ms": 150,
    "rate_limit": {
      "remaining": 99,
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
    "message": "Task deleted successfully"
  },
  "metadata": {
    "timestamp": "2025-01-18T10:30:00.000Z",
    "tool_name": "delete_task",
    "execution_time_ms": 150,
    "rate_limit": {
      "remaining": 99,
      "limit": 100,
      "reset_at": 1705575000000
    },
    "debug": {
      "request_id": "c9d5e6f2",
      "tool_name": "delete_task",
      "timing": {
        "total_ms": 150,
        "api_calls": [
          {
            "method": "DELETE",
            "path": "/task/{id}",
            "duration": 150,
            "status": 200
          }
        ]
      },
      "api_summary": {
        "total_calls": 1,
        "total_api_time_ms": 150,
        "success_count": 1,
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
| data.success | boolean | Confirms deletion was successful |
| data.message | string | Human-readable confirmation message |
| metadata.execution_time_ms | number | Deletion operation time |
| metadata.rate_limit | object | Current rate limit status |

---

### Error Types

This tool may return the following errors:

**1. VALIDATION (Missing Identifier)**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "Either taskId or taskName must be provided",
    "type": "VALIDATION",
    "suggested_action": "Provide either a taskId or taskName to identify the task you want to delete."
  }
}
```

**2. NOT_FOUND**
```json
{
  "success": false,
  "error": {
    "code": "TASK_NOT_FOUND",
    "message": "Task '86fpd7vgc' not found",
    "type": "NOT_FOUND",
    "suggested_action": "Verify the task ID is correct. The task may have already been deleted or archived."
  }
}
```

**3. VALIDATION (Multiple Matches)**
```json
{
  "success": false,
  "error": {
    "code": "MULTIPLE_TASKS_FOUND",
    "message": "Multiple tasks found with name 'Test task'. Found in lists: Sprint Backlog, Bug Fixes, Testing",
    "type": "VALIDATION",
    "details": {
      "matches": 3,
      "lists": ["Sprint Backlog", "Bug Fixes", "Testing"]
    },
    "suggested_action": "Specify listName parameter to narrow down the search, or use the task ID for safety. WARNING: Deleting the wrong task cannot be undone."
  }
}
```

**4. AUTH**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Insufficient permissions to delete this task",
    "type": "AUTH",
    "suggested_action": "Ensure your API key has permission to delete tasks in this list."
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
    "suggested_action": "Wait 30 seconds before retrying. Consider using delete_bulk_tasks for deleting multiple tasks."
  }
}
```

**Error Type Summary**:
| Error Type | HTTP Status | Retryable | Description |
|------------|-------------|-----------|-------------|
| VALIDATION | 400 | No | Missing parameters or multiple matches found |
| NOT_FOUND | 404 | No | Task does not exist |
| AUTH | 401, 403 | No | Authentication or authorization failed |
| RATE_LIMIT | 429 | Yes | Rate limit exceeded - wait and retry |
| API_ERROR | 500, 502, 503 | Yes | Server error - retry with backoff |

---

### Rate Limits

**ClickUp API Rate Limit**: 100 requests/minute (Free Forever plan)

**This Tool's Impact**:
- **API Calls**: 1-2 call(s) per execution (1 if taskId provided, 2 if taskName requires search)
- **Estimated Impact**: ~1-2% of rate limit per execution

**Rate Limit Behavior**:
1. Automatic retry with exponential backoff (100ms → 200ms → 400ms → 800ms)
2. Rate limit info included in response metadata
3. Requests queued when rate limit hit

**Recommendations**:
- Use `delete_bulk_tasks` when deleting 3 or more tasks at once
- Always use `taskId` when possible for safety and performance
- Use `listName` with `taskName` to avoid accidental deletion of wrong task
- Consider archiving tasks instead of deleting for better audit trails

---

### API Dependencies

**ClickUp API Endpoints Called**:
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/list/{list_id}/task` | Search for task by name (if taskName provided) |
| DELETE | `/task/{task_id}` | Delete the task permanently |

**Required Permissions**:
- **Task Delete**: API key must have permission to delete tasks in the target list
- **List Access**: Read access to search for tasks by name

**API Documentation**:
- [ClickUp API Reference - Delete Task](https://clickup.com/api/clickupreference/operation/DeleteTask)

---

### Examples

#### Example 1: Delete by Task ID (Safest Method)
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
    "message": "Task deleted successfully"
  },
  "metadata": {
    "tool_name": "delete_task",
    "execution_time_ms": 120
  }
}
```

#### Example 2: Delete by Custom Task ID
```javascript
// Input
{
  "taskId": "DEV-1234"
}

// Output
{
  "success": true,
  "data": {
    "success": true,
    "message": "Task deleted successfully"
  }
}
```

#### Example 3: Delete by Task Name with List Scoping
```javascript
// Input
{
  "taskName": "Old test task",
  "listName": "Test Tasks"
}

// Output
{
  "success": true,
  "data": {
    "success": true,
    "message": "Task deleted successfully"
  }
}
```

#### Example 4: Error - Multiple Matches
```javascript
// Input
{
  "taskName": "Test task"
}

// Output (Error)
{
  "success": false,
  "error": {
    "code": "MULTIPLE_TASKS_FOUND",
    "message": "Multiple tasks found with name 'Test task'. Found in lists: Sprint Backlog, Testing",
    "type": "VALIDATION",
    "details": {
      "matches": 2,
      "lists": ["Sprint Backlog", "Testing"]
    },
    "suggested_action": "Specify listName parameter to narrow down the search, or use the task ID for safety."
  }
}
```

---

### Integration Examples

#### Python
```python
from mcp import Client

client = Client()

# SAFE: Delete by task ID
response = client.call_tool(
    "delete_task",
    {"taskId": "86fpd7vgc"}
)

if response["success"]:
    print("Task deleted successfully")

    # Check rate limit
    rate_limit = response["metadata"]["rate_limit"]
    print(f"Requests remaining: {rate_limit['remaining']}")
else:
    error = response["error"]
    print(f"Error: {error['message']}")

    if error["type"] == "VALIDATION" and "lists" in error.get("details", {}):
        print("Multiple tasks found in lists:", error["details"]["lists"])
        print("Please specify listName or use task ID")

# CAREFUL: Delete by name (with list scoping for safety)
response = client.call_tool(
    "delete_task",
    {
        "taskName": "Old test task",
        "listName": "Test Tasks"
    }
)
```

#### TypeScript
```typescript
import { Client } from '@modelcontextprotocol/sdk/client';

const client = new Client();

// Safely delete task by ID
const deleteById = async (taskId: string) => {
  const response = await client.callTool('delete_task', { taskId });

  if (response.success) {
    console.log('Task deleted successfully');
    return true;
  } else {
    console.error(`Deletion failed: ${response.error.message}`);
    return false;
  }
};

// Delete with confirmation for name-based deletion
const deleteByName = async (taskName: string, listName?: string) => {
  // First, get task details to confirm
  const getResponse = await client.callTool('get_task', {
    taskName,
    listName
  });

  if (!getResponse.success) {
    console.error('Task not found or multiple matches');
    return false;
  }

  const task = getResponse.data;
  console.log(`Found task: ${task.name} (ID: ${task.id})`);
  console.log('Confirm deletion? [This cannot be undone]');

  // After user confirmation...
  const deleteResponse = await client.callTool('delete_task', {
    taskId: task.id  // Use ID for safety
  });

  return deleteResponse.success;
};

await deleteById('86fpd7vgc');
await deleteByName('Old test task', 'Test Tasks');
```

---

### Related Tools

- **update_task**: Update task properties instead of deleting
- **get_task**: Retrieve task details before deleting (for confirmation)
- **delete_bulk_tasks**: Delete multiple tasks at once
- **move_task**: Move task to a different list instead of deleting
- **archive_task**: Archive instead of delete (preserves for audit trail - if available)

---

### Safety Best Practices

**DO:**
- ✅ Use `taskId` whenever possible for safety
- ✅ Retrieve task details with `get_task` before deleting
- ✅ Always specify `listName` when using `taskName`
- ✅ Consider archiving instead of deleting
- ✅ Implement confirmation prompts in your application

**DON'T:**
- ❌ Delete tasks by name without list scoping
- ❌ Delete in production without confirmation
- ❌ Batch delete without validation
- ❌ Use deletion for status changes (use update_task instead)

---

### Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.1.0 | 2025-01-18 | Added debug metadata support (Phase 5) |
| 1.0.0 | 2025-01-15 | Added automatic retry with telemetry (Phase 4) |
| 0.9.0 | 2025-01-10 | Added safety warnings and multiple match detection |
| 0.8.0 | 2025-01-05 | Initial tool implementation |

---

**Last Updated**: 2025-01-18
**Status**: Production-ready - Part of 72-tool comprehensive suite
**⚠️ WARNING**: This operation is PERMANENT and CANNOT BE UNDONE. Always use task IDs when possible and implement confirmation flows in production applications.
