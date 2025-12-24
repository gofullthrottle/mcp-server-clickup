# Tool Documentation: `move_bulk_tasks`

**Category**: Task Management (Bulk Operations)

**Description**: Moves multiple tasks to a single destination list at once with configurable batch size and concurrency. Efficient for reorganizing tasks across workflow stages or project lists.

**Use Cases**:
- Move completed sprint tasks to archive list
- Transfer tasks between project phases
- Reorganize tasks across team lists
- Move multiple tasks to different workflow stage

---

### Input Parameters

```json
{
  "tasks": {
    "type": "array",
    "required": true,
    "description": "Array of tasks to move. Each task needs identifier (taskId or taskName+listName)",
    "items": {
      "taskId": "string (preferred) - Detects regular or custom IDs",
      "taskName": "string - Requires listName",
      "listName": "string - REQUIRED with taskName",
      "customTaskId": "string - Explicit custom ID (optional)"
    }
  },
  "targetListId": {
    "type": "string",
    "required": false,
    "description": "ID of destination list (preferred). Use instead of targetListName if available",
    "example": "901234567"
  },
  "targetListName": {
    "type": "string",
    "required": false,
    "description": "Name of destination list. Only use if you don't have targetListId",
    "example": "Archive"
  },
  "options": {
    "type": "object",
    "required": false,
    "description": "Processing options for bulk operation",
    "properties": {
      "batchSize": "number (default: 10) - Tasks per batch",
      "concurrency": "number (default: 3) - Parallel operations",
      "continueOnError": "boolean (default: false) - Continue if some fail",
      "retryCount": "number (default: 0) - Retry attempts for failures"
    }
  }
}
```

**Parameter Details**:
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| tasks | array | **Yes** | Array of task identifiers to move | `[{taskId: "123"}, {taskId: "456"}]` |
| tasks[].taskId | string | No* | Task ID (preferred) | `"86fpd7vgc"` or `"DEV-1234"` |
| tasks[].taskName | string | No* | Task name (requires listName) | `"Deploy release"` |
| tasks[].listName | string | No | List name (REQUIRED with taskName) | `"Sprint Backlog"` |
| tasks[].customTaskId | string | No | Explicit custom ID | `"DEV-1234"` |
| targetListId | string | No** | Destination list ID (preferred) | `"901234567"` |
| targetListName | string | No** | Destination list name | `"Archive"` |
| options.batchSize | number | No | Tasks per batch (default: 10) | `20` |
| options.concurrency | number | No | Parallel operations (default: 3) | `5` |
| options.continueOnError | boolean | No | Continue if some fail (default: false) | `true` |
| options.retryCount | number | No | Retry attempts (default: 0) | `3` |

*Note: Either `taskId` OR `taskName` is REQUIRED for each task (at least one must be provided)
**Note: Either `targetListId` OR `targetListName` is REQUIRED (at least one must be provided)

---

### Returns

**Success Response** (when `ENABLE_DEBUG=false`):
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Bulk task move completed",
    "moved_tasks": [
      {
        "id": "task1_id",
        "name": "🚀 Deploy release v1.0",
        "status": {"status": "To Do"},
        "list": {
          "id": "901234567",
          "name": "Archive"
        },
        "url": "https://app.clickup.com/t/task1_id"
      },
      {
        "id": "task2_id",
        "name": "📝 Update documentation",
        "status": {"status": "To Do"},
        "list": {
          "id": "901234567",
          "name": "Archive"
        },
        "url": "https://app.clickup.com/t/task2_id"
      }
    ],
    "summary": {
      "total": 2,
      "moved": 2,
      "failed": 0
    }
  },
  "metadata": {
    "timestamp": "2025-01-18T10:30:00.000Z",
    "tool_name": "move_bulk_tasks",
    "execution_time_ms": 350,
    "rate_limit": {
      "remaining": 88,
      "limit": 100,
      "reset_at": 1705575000000
    }
  }
}
```

**Success Response with Partial Failures**:
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Bulk task move completed with some failures",
    "moved_tasks": [
      {
        "id": "task1_id",
        "name": "🚀 Deploy release v1.0",
        "list": {"id": "901234567", "name": "Archive"}
      }
    ],
    "failed_tasks": [
      {
        "task": {"taskId": "invalid_id"},
        "error": "Task not found: invalid_id"
      }
    ],
    "summary": {
      "total": 2,
      "moved": 1,
      "failed": 1
    }
  }
}
```

**Response Fields**:
| Field | Type | Description |
|-------|------|-------------|
| success | boolean | Always `true` for successful responses |
| data.success | boolean | Overall operation success |
| data.message | string | Human-readable summary |
| data.moved_tasks | array | Successfully moved task objects |
| data.failed_tasks | array | Failed tasks with error messages (if any) |
| data.summary.total | number | Total tasks attempted |
| data.summary.moved | number | Tasks successfully moved |
| data.summary.failed | number | Tasks that failed to move |
| metadata.execution_time_ms | number | Total operation time |

---

### Error Types

**1. VALIDATION (Missing Target List)**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "Either targetListId or targetListName must be provided",
    "type": "VALIDATION",
    "suggested_action": "Provide either a targetListId or targetListName for the destination list."
  }
}
```

**2. VALIDATION (Task Missing Identifier)**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "Task at index 1: Either taskId or taskName must be provided",
    "type": "VALIDATION",
    "details": {
      "task_index": 1
    },
    "suggested_action": "Provide either taskId or taskName for each task."
  }
}
```

**3. NOT_FOUND (Target List Not Found)**
```json
{
  "success": false,
  "error": {
    "code": "LIST_NOT_FOUND",
    "message": "List 'Archive' not found in workspace",
    "type": "NOT_FOUND",
    "suggested_action": "Verify the list name is correct. Use get_workspace_hierarchy to see all available lists."
  }
}
```

**4. NOT_FOUND (Task Not Found)**
```json
{
  "success": false,
  "error": {
    "code": "TASK_NOT_FOUND",
    "message": "Task 'Deploy release' not found in workspace",
    "type": "NOT_FOUND",
    "suggested_action": "Verify the task exists. Use get_workspace_tasks to search for tasks."
  }
}
```

**5. VALIDATION (Task Already in Target List)**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_OPERATION",
    "message": "Task 'Deploy release' is already in list 'Archive'",
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
    "message": "Insufficient permissions to move tasks to this list",
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
    "suggested_action": "Wait 30 seconds before retrying. Consider reducing batch size or concurrency."
  }
}
```

**Error Type Summary**:
| Error Type | HTTP Status | Retryable | Description |
|------------|-------------|-----------|-------------|
| VALIDATION | 400 | No | Missing parameters or invalid operation |
| NOT_FOUND | 404 | No | Task or list does not exist |
| AUTH | 401, 403 | No | Authentication or authorization failed |
| RATE_LIMIT | 429 | Yes | Rate limit exceeded - reduce batch size/concurrency |
| API_ERROR | 500, 502, 503 | Yes | Server error - retry with backoff |

---

### Rate Limits

**ClickUp API Rate Limit**: 100 requests/minute (Free Forever plan)

**This Tool's Impact**:
- **API Calls**: N+1 call(s) (1 for target list lookup if targetListName used, N for moving N tasks)
- **Estimated Impact**: ~10-20% of rate limit for 10 tasks

**Rate Limit Behavior**:
1. Automatic retry with exponential backoff
2. Configurable batch size and concurrency
3. Rate limit info included in response metadata

**Recommendations**:
- Use `targetListId` instead of `targetListName` to reduce API calls
- Start with default batch size (10) and concurrency (3)
- For large bulk operations (50+ tasks), reduce concurrency to 2
- Set `continueOnError: true` to get partial results
- Monitor rate limit remaining in response metadata

---

### API Dependencies

**ClickUp API Endpoints Called**:
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/team/{team_id}/space` | Look up target list by name (only if targetListName provided) |
| PUT | `/task/{task_id}` | Move each task (N calls for N tasks) |

**Required Permissions**:
- **Task Update**: Permission to move tasks
- **List Access**: Read access to both source and target lists

**API Documentation**:
- [ClickUp API Reference - Update Task](https://clickup.com/api/clickupreference/operation/UpdateTask)

---

### Examples

#### Example 1: Move Tasks to Archive
```javascript
// Input
{
  "tasks": [
    {"taskId": "86fpd7vgc"},
    {"taskId": "abc123xyz"},
    {"taskId": "def456uvw"}
  ],
  "targetListId": "901234567"
}

// Output
{
  "success": true,
  "data": {
    "success": true,
    "message": "Bulk task move completed",
    "moved_tasks": [
      {"id": "86fpd7vgc", "list": {"name": "Archive"}},
      {"id": "abc123xyz", "list": {"name": "Archive"}},
      {"id": "def456uvw", "list": {"name": "Archive"}}
    ],
    "summary": {"total": 3, "moved": 3, "failed": 0}
  }
}
```

#### Example 2: Move Custom ID Tasks
```javascript
// Input
{
  "tasks": [
    {"taskId": "DEV-1234"},
    {"taskId": "DEV-1235"},
    {"taskId": "DEV-1236"}
  ],
  "targetListName": "Done",
  "options": {
    "batchSize": 20,
    "concurrency": 5,
    "continueOnError": true
  }
}
```

#### Example 3: Move by Task Names
```javascript
// Input
{
  "tasks": [
    {"taskName": "Task 1", "listName": "Sprint 10"},
    {"taskName": "Task 2", "listName": "Sprint 10"},
    {"taskName": "Task 3", "listName": "Sprint 10"}
  ],
  "targetListName": "Sprint 11"
}
```

#### Example 4: With Partial Failures
```javascript
// Input
{
  "tasks": [
    {"taskId": "86fpd7vgc"},
    {"taskId": "invalid_id"},
    {"taskId": "abc123xyz"}
  ],
  "targetListId": "901234567",
  "options": {
    "continueOnError": true
  }
}

// Output
{
  "success": true,
  "data": {
    "message": "Bulk task move completed with some failures",
    "moved_tasks": [
      {"id": "86fpd7vgc", "list": {"name": "Archive"}},
      {"id": "abc123xyz", "list": {"name": "Archive"}}
    ],
    "failed_tasks": [
      {
        "task": {"taskId": "invalid_id"},
        "error": "Task not found: invalid_id"
      }
    ],
    "summary": {"total": 3, "moved": 2, "failed": 1}
  }
}
```

---

### Integration Examples

#### Python
```python
from mcp import Client

client = Client()

# Move completed tasks to archive
tasks = [
    {"taskId": "86fpd7vgc"},
    {"taskId": "abc123xyz"},
    {"taskId": "def456uvw"}
]

response = client.call_tool(
    "move_bulk_tasks",
    {
        "tasks": tasks,
        "targetListId": "901234567"
    }
)

if response["success"]:
    summary = response["data"]["summary"]
    print(f"Moved {summary['moved']} out of {summary['total']} tasks")

    for task in response["data"]["moved_tasks"]:
        print(f"✓ {task['name']} → {task['list']['name']}")
else:
    print(f"Error: {response['error']['message']}")

# Move with error handling
response = client.call_tool(
    "move_bulk_tasks",
    {
        "tasks": [
            {"taskId": "DEV-1234"},
            {"taskId": "DEV-1235"}
        ],
        "targetListName": "Done",
        "options": {
            "batchSize": 20,
            "concurrency": 5,
            "continueOnError": True
        }
    }
)

# Handle partial failures
if response["success"] and response["data"].get("failed_tasks"):
    print(f"\nFailed to move:")
    for failure in response["data"]["failed_tasks"]:
        print(f"✗ {failure['task']}: {failure['error']}")
```

#### TypeScript
```typescript
import { Client } from '@modelcontextprotocol/sdk/client';

const client = new Client();

// Move multiple tasks
const bulkMove = async (
  taskIds: string[],
  targetListId: string,
  options?: {
    batchSize?: number;
    concurrency?: number;
    continueOnError?: boolean;
  }
) => {
  const tasks = taskIds.map(taskId => ({ taskId }));

  const response = await client.callTool('move_bulk_tasks', {
    tasks,
    targetListId,
    options
  });

  if (response.success) {
    const { moved, failed, total } = response.data.summary;
    console.log(`✓ Moved: ${moved}/${total}, Failed: ${failed}`);

    // Handle failures if any
    if (response.data.failed_tasks?.length > 0) {
      console.log('\nFailed to move:');
      response.data.failed_tasks.forEach(f => {
        console.log(`  ✗ ${JSON.stringify(f.task)}: ${f.error}`);
      });
    }

    return response.data.moved_tasks;
  }

  throw new Error(response.error.message);
};

// Archive completed sprint tasks
const archiveSprintTasks = async (taskIds: string[]) => {
  return await bulkMove(taskIds, 'archive-list-id', {
    batchSize: 20,
    concurrency: 5,
    continueOnError: true
  });
};

// Move tasks to next sprint
const moveToNextSprint = async (taskIds: string[], nextSprintListId: string) => {
  return await bulkMove(taskIds, nextSprintListId);
};

await bulkMove(['task1', 'task2', 'task3'], '901234567');
await archiveSprintTasks(['done1', 'done2', 'done3']);
await moveToNextSprint(['carry-over-1', 'carry-over-2'], 'sprint-11-id');
```

---

### Related Tools

- **move_task**: Move a single task
- **update_bulk_tasks**: Update multiple tasks properties
- **create_bulk_tasks**: Create multiple tasks
- **get_tasks**: Retrieve tasks from list

---

### Best Practices

**DO:**
- ✅ Use task IDs and target list ID for fastest performance
- ✅ Set `continueOnError: true` for large operations
- ✅ Monitor rate limit in response metadata
- ✅ Verify target list exists before moving
- ✅ Group moves by destination list

**DON'T:**
- ❌ Move 100+ tasks with high concurrency (will hit rate limit)
- ❌ Use bulk operations for < 3 tasks (use move_task instead)
- ❌ Set concurrency > 5 (will likely hit rate limit)
- ❌ Ignore `failed_tasks` array in response
- ❌ Move tasks by name without list scoping

---

### Performance Tips

**Optimization Strategies**:
1. **Use IDs**: Both task IDs and target list ID to minimize API calls
2. **Batch Size**: 10-20 tasks per batch for optimal throughput
3. **Concurrency**: 3-5 parallel operations (default: 3)
4. **Error Handling**: Use `continueOnError: true` for large operations

**Typical Response Times**:
- 5 tasks: ~250-400ms
- 10 tasks: ~400-600ms
- 20 tasks: ~800-1200ms
- 50+ tasks: ~2000-4000ms

---

### Important Notes

**⚠️ Status Reset Warning**:
- Moving tasks between lists may reset their status to the target list's default status
- If you need to preserve status, use `update_bulk_tasks` after moving

---

### Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.1.0 | 2025-01-18 | Added debug metadata support (Phase 5) |
| 1.0.0 | 2025-01-15 | Added automatic retry with telemetry (Phase 4) |
| 0.9.0 | 2025-01-10 | Added batch processing and custom ID support |
| 0.8.0 | 2025-01-05 | Initial tool implementation |

---

**Last Updated**: 2025-01-18
**Status**: Production-ready - Part of 72-tool comprehensive suite
**⚡ Performance Note**: Designed for efficient bulk operations with configurable batch size and concurrency.
