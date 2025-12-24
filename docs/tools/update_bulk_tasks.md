# Tool Documentation: `update_bulk_tasks`

**Category**: Task Management (Bulk Operations)

**Description**: Updates multiple tasks at once with configurable batch size and concurrency. Each task can update any combination of properties including name, status, priority, due date, assignees, and custom fields.

**Use Cases**:
- Update status for multiple tasks simultaneously (e.g., move sprint tasks to "In Progress")
- Bulk assign tasks to team members
- Update due dates for related tasks
- Apply priority changes across multiple tasks

---

### Input Parameters

```json
{
  "tasks": {
    "type": "array",
    "required": true,
    "description": "Array of tasks to update. Each task must have task identifier + at least one update field",
    "items": {
      "taskId": "string (preferred) - Detects regular or custom IDs",
      "taskName": "string - Requires listName",
      "listName": "string - REQUIRED with taskName",
      "customTaskId": "string - Explicit custom ID (optional)",
      "name": "string (optional)",
      "description": "string (optional)",
      "markdown_description": "string (optional)",
      "status": "string (optional)",
      "priority": "string (optional) - '1'-'4' or null",
      "dueDate": "string (optional) - Unix timestamp or natural language",
      "custom_fields": "array of {id, value} (optional)",
      "assignees": "array of user IDs/emails/usernames (optional)"
    }
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
| tasks | array | **Yes** | Array of task update objects | `[{taskId: "123", status: "Done"}]` |
| tasks[].taskId | string | No* | Task ID (preferred) | `"86fpd7vgc"` or `"DEV-1234"` |
| tasks[].taskName | string | No* | Task name (requires listName) | `"Deploy release"` |
| tasks[].listName | string | No | List name (REQUIRED with taskName) | `"Sprint Backlog"` |
| tasks[].customTaskId | string | No | Explicit custom ID | `"DEV-1234"` |
| tasks[].name | string | No | New task name | `"🚀 Deploy release v1.1"` |
| tasks[].description | string | No | New plain text description | `"Deploy to production"` |
| tasks[].markdown_description | string | No | New markdown description | `"**Deploy** to prod"` |
| tasks[].status | string | No | New status | `"In Progress"` |
| tasks[].priority | string | No | New priority (1-4 or null) | `"1"` |
| tasks[].dueDate | string | No | New due date | `"tomorrow"` or `"1705575000000"` |
| tasks[].custom_fields | array | No | Custom field values | `[{id: "field_123", value: "High"}]` |
| tasks[].assignees | array | No | User IDs, emails, or usernames | `[12345678, "user@email.com"]` |
| options.batchSize | number | No | Tasks per batch (default: 10) | `20` |
| options.concurrency | number | No | Parallel operations (default: 3) | `5` |
| options.continueOnError | boolean | No | Continue if some fail (default: false) | `true` |
| options.retryCount | number | No | Retry attempts (default: 0) | `3` |

*Note: Either `taskId` OR `taskName` is REQUIRED for each task (at least one must be provided). At least one update field is also REQUIRED per task.

---

### Returns

**Success Response** (when `ENABLE_DEBUG=false`):
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Bulk task update completed",
    "updated_tasks": [
      {
        "id": "task1_id",
        "name": "🚀 Deploy release v1.0",
        "status": {"status": "In Progress", "color": "#3679b3"},
        "priority": {"priority": "urgent", "color": "#f50000"},
        "url": "https://app.clickup.com/t/task1_id"
      },
      {
        "id": "task2_id",
        "name": "📝 Update documentation",
        "status": {"status": "In Progress"},
        "url": "https://app.clickup.com/t/task2_id"
      }
    ],
    "summary": {
      "total": 2,
      "updated": 2,
      "failed": 0
    }
  },
  "metadata": {
    "timestamp": "2025-01-18T10:30:00.000Z",
    "tool_name": "update_bulk_tasks",
    "execution_time_ms": 380,
    "rate_limit": {
      "remaining": 88,
      "limit": 100,
      "reset_at": 1705575000000
    }
  }
}
```

**Success Response with Partial Failures** (continueOnError=true):
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Bulk task update completed with some failures",
    "updated_tasks": [
      {
        "id": "task1_id",
        "name": "🚀 Deploy release v1.0",
        "status": {"status": "In Progress"}
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
      "updated": 1,
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
| data.updated_tasks | array | Successfully updated task objects |
| data.failed_tasks | array | Failed tasks with error messages (if any) |
| data.summary.total | number | Total tasks attempted |
| data.summary.updated | number | Tasks successfully updated |
| data.summary.failed | number | Tasks that failed to update |
| metadata.execution_time_ms | number | Total operation time |
| metadata.rate_limit | object | Rate limit status after operation |

---

### Error Types

**1. VALIDATION (Missing Tasks Array)**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "tasks array is required",
    "type": "VALIDATION",
    "suggested_action": "Provide an array of tasks to update."
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
    "suggested_action": "Provide either taskId or taskName for each task in the array."
  }
}
```

**3. VALIDATION (No Update Fields)**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "Task at index 0: At least one update field is required",
    "type": "VALIDATION",
    "details": {
      "task_index": 0
    },
    "suggested_action": "Provide at least one field to update (name, status, priority, etc.)."
  }
}
```

**4. NOT_FOUND**
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

**5. AUTH**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Insufficient permissions to update tasks",
    "type": "AUTH",
    "suggested_action": "Ensure your API key has permission to update tasks."
  }
}
```

**6. RATE_LIMIT**
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
| VALIDATION | 400 | No | Missing parameters or invalid task data |
| NOT_FOUND | 404 | No | Task does not exist |
| AUTH | 401, 403 | No | Authentication or authorization failed |
| RATE_LIMIT | 429 | Yes | Rate limit exceeded - reduce batch size/concurrency |
| API_ERROR | 500, 502, 503 | Yes | Server error - retry with backoff |

---

### Rate Limits

**ClickUp API Rate Limit**: 100 requests/minute (Free Forever plan)

**This Tool's Impact**:
- **API Calls**: N call(s) per execution (N = number of tasks)
- **Estimated Impact**: ~10-20% of rate limit for 10 tasks (depends on batch size and concurrency)

**Rate Limit Behavior**:
1. Automatic retry with exponential backoff
2. Configurable batch size and concurrency to control rate limit impact
3. Rate limit info included in response metadata

**Recommendations**:
- Use task IDs instead of task names to avoid lookup calls
- Start with default batch size (10) and concurrency (3)
- For large bulk operations (50+ tasks), reduce concurrency to 2
- Set `continueOnError: true` to get partial results
- Monitor rate limit remaining in response metadata

---

### API Dependencies

**ClickUp API Endpoints Called**:
| Method | Endpoint | Purpose |
|--------|----------|---------|
| PUT | `/task/{task_id}` | Update each task (N calls for N tasks) |

**Required Permissions**:
- **Task Update**: API key must have permission to update tasks

**API Documentation**:
- [ClickUp API Reference - Update Task](https://clickup.com/api/clickupreference/operation/UpdateTask)

---

### Examples

#### Example 1: Update Status for Multiple Tasks
```javascript
// Input
{
  "tasks": [
    {"taskId": "86fpd7vgc", "status": "In Progress"},
    {"taskId": "abc123xyz", "status": "In Progress"},
    {"taskId": "def456uvw", "status": "In Progress"}
  ]
}

// Output
{
  "success": true,
  "data": {
    "success": true,
    "message": "Bulk task update completed",
    "updated_tasks": [
      {"id": "86fpd7vgc", "status": {"status": "In Progress"}},
      {"id": "abc123xyz", "status": {"status": "In Progress"}},
      {"id": "def456uvw", "status": {"status": "In Progress"}}
    ],
    "summary": {"total": 3, "updated": 3, "failed": 0}
  }
}
```

#### Example 2: Bulk Assign and Set Priority
```javascript
// Input
{
  "tasks": [
    {
      "taskId": "DEV-1234",
      "assignees": [12345678, "user@example.com"],
      "priority": "1"
    },
    {
      "taskId": "DEV-1235",
      "assignees": [12345678],
      "priority": "2"
    }
  ],
  "options": {
    "batchSize": 10,
    "concurrency": 3,
    "continueOnError": true
  }
}

// Output
{
  "success": true,
  "data": {
    "updated_tasks": [
      {
        "id": "task1_id",
        "priority": {"priority": "urgent"},
        "assignees": [...]
      },
      {
        "id": "task2_id",
        "priority": {"priority": "high"},
        "assignees": [...]
      }
    ],
    "summary": {"total": 2, "updated": 2, "failed": 0}
  }
}
```

#### Example 3: Update Due Dates with Natural Language
```javascript
// Input
{
  "tasks": [
    {"taskName": "Task 1", "listName": "Sprint 10", "dueDate": "tomorrow"},
    {"taskName": "Task 2", "listName": "Sprint 10", "dueDate": "next week"},
    {"taskName": "Task 3", "listName": "Sprint 10", "dueDate": "1 hour from now"}
  ]
}
```

#### Example 4: With Partial Failures (continueOnError=true)
```javascript
// Input
{
  "tasks": [
    {"taskId": "86fpd7vgc", "status": "Done"},
    {"taskId": "invalid_id", "status": "Done"},
    {"taskId": "abc123xyz", "status": "Done"}
  ],
  "options": {
    "continueOnError": true
  }
}

// Output
{
  "success": true,
  "data": {
    "message": "Bulk task update completed with some failures",
    "updated_tasks": [
      {"id": "86fpd7vgc", "status": {"status": "Done"}},
      {"id": "abc123xyz", "status": {"status": "Done"}}
    ],
    "failed_tasks": [
      {
        "task": {"taskId": "invalid_id"},
        "error": "Task not found: invalid_id"
      }
    ],
    "summary": {"total": 3, "updated": 2, "failed": 1}
  }
}
```

---

### Integration Examples

#### Python
```python
from mcp import Client

client = Client()

# Update status for multiple tasks
tasks = [
    {"taskId": "86fpd7vgc", "status": "In Progress"},
    {"taskId": "abc123xyz", "status": "In Progress"},
    {"taskId": "def456uvw", "status": "In Progress"}
]

response = client.call_tool(
    "update_bulk_tasks",
    {"tasks": tasks}
)

if response["success"]:
    summary = response["data"]["summary"]
    print(f"Updated {summary['updated']} out of {summary['total']} tasks")

    for task in response["data"]["updated_tasks"]:
        print(f"✓ {task['id']}: {task['status']['status']}")
else:
    print(f"Error: {response['error']['message']}")

# Bulk assign with priority
tasks_detailed = [
    {
        "taskId": "DEV-1234",
        "assignees": [12345678, "user@example.com"],
        "priority": "1",
        "dueDate": "tomorrow at 5pm"
    },
    {
        "taskId": "DEV-1235",
        "assignees": ["tech-lead"],
        "priority": "2",
        "status": "In Progress"
    }
]

response = client.call_tool(
    "update_bulk_tasks",
    {
        "tasks": tasks_detailed,
        "options": {
            "batchSize": 10,
            "concurrency": 3,
            "continueOnError": True
        }
    }
)

# Handle partial failures
if response["success"] and response["data"].get("failed_tasks"):
    print(f"\nFailed tasks:")
    for failure in response["data"]["failed_tasks"]:
        print(f"✗ {failure['task']}: {failure['error']}")
```

#### TypeScript
```typescript
import { Client } from '@modelcontextprotocol/sdk/client';

const client = new Client();

// Update multiple tasks
interface TaskUpdate {
  taskId?: string;
  taskName?: string;
  listName?: string;
  status?: string;
  priority?: string;
  assignees?: (number | string)[];
  dueDate?: string;
}

const bulkUpdate = async (
  tasks: TaskUpdate[],
  options?: {
    batchSize?: number;
    concurrency?: number;
    continueOnError?: boolean;
  }
) => {
  const response = await client.callTool('update_bulk_tasks', {
    tasks,
    options
  });

  if (response.success) {
    const { updated, failed, total } = response.data.summary;
    console.log(`✓ Updated: ${updated}/${total}, Failed: ${failed}`);

    // Handle failures if any
    if (response.data.failed_tasks?.length > 0) {
      console.log('\nFailed tasks:');
      response.data.failed_tasks.forEach(f => {
        console.log(`  ✗ ${JSON.stringify(f.task)}: ${f.error}`);
      });
    }

    return response.data.updated_tasks;
  }

  throw new Error(response.error.message);
};

// Move sprint tasks to "In Progress"
const startSprint = async (taskIds: string[]) => {
  const tasks = taskIds.map(taskId => ({
    taskId,
    status: 'In Progress',
    dueDate: 'end of sprint'
  }));

  return await bulkUpdate(tasks, {
    batchSize: 20,
    concurrency: 5,
    continueOnError: true
  });
};

// Bulk reassign tasks
const reassignTasks = async (taskIds: string[], assignee: string) => {
  const tasks = taskIds.map(taskId => ({
    taskId,
    assignees: [assignee]
  }));

  return await bulkUpdate(tasks);
};

await bulkUpdate([
  {taskId: '86fpd7vgc', status: 'Done'},
  {taskId: 'abc123xyz', status: 'Done'}
]);
await startSprint(['task1', 'task2', 'task3']);
await reassignTasks(['task1', 'task2'], 'user@example.com');
```

---

### Related Tools

- **update_task**: Update a single task
- **create_bulk_tasks**: Create multiple tasks at once
- **move_bulk_tasks**: Move multiple tasks to different list
- **get_tasks**: Retrieve tasks to verify updates

---

### Best Practices

**DO:**
- ✅ Use task IDs for fastest performance
- ✅ Set `continueOnError: true` for large bulk operations
- ✅ Group similar updates into batches
- ✅ Monitor rate limit in response metadata
- ✅ Validate task data before bulk update

**DON'T:**
- ❌ Update 100+ tasks with high concurrency (will hit rate limit)
- ❌ Use bulk operations for < 3 tasks (use update_task instead)
- ❌ Set concurrency > 5 (will likely hit rate limit)
- ❌ Ignore `failed_tasks` array in response
- ❌ Update tasks by name without list scoping

---

### Performance Tips

**Optimization Strategies**:
1. **Batch Size**: 10-20 tasks per batch for optimal throughput
2. **Concurrency**: 3-5 parallel operations (default: 3)
3. **Rate Limit Awareness**: Monitor remaining requests in metadata
4. **Error Handling**: Use `continueOnError: true` for large operations
5. **Task IDs**: Always use task IDs when possible

**Typical Response Times**:
- 5 tasks: ~250-400ms
- 10 tasks: ~400-600ms
- 20 tasks: ~800-1200ms
- 50+ tasks: ~2000-4000ms (with proper batch/concurrency config)

---

### Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.1.0 | 2025-01-18 | Added debug metadata support (Phase 5) |
| 1.0.0 | 2025-01-15 | Added automatic retry with telemetry (Phase 4) |
| 0.9.0 | 2025-01-10 | Added batch processing and natural language dates |
| 0.8.0 | 2025-01-05 | Initial tool implementation |

---

**Last Updated**: 2025-01-18
**Status**: Production-ready - Part of 72-tool comprehensive suite
**⚡ Performance Note**: Designed for efficient bulk operations with configurable batch size and concurrency.
