# Tool Documentation: `delete_bulk_tasks`

**Category**: Task Management (Bulk Operations)

**Description**: **PERMANENTLY** deletes multiple tasks at once with configurable batch size and concurrency. **THIS OPERATION CANNOT BE UNDONE.** Use with extreme caution.

**Use Cases**:
- Clean up test or duplicate tasks
- Remove obsolete tasks from archived projects
- Delete multiple spam or invalid tasks
- Bulk cleanup during project restructuring

---

### Input Parameters

```json
{
  "tasks": {
    "type": "array",
    "required": true,
    "description": "Array of tasks to delete. Each task needs identifier (taskId strongly preferred for safety)",
    "items": {
      "taskId": "string (STRONGLY PREFERRED) - Detects regular or custom IDs",
      "taskName": "string - Requires listName (RISKY)",
      "listName": "string - REQUIRED with taskName",
      "customTaskId": "string - Explicit custom ID (optional)"
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
| tasks | array | **Yes** | Array of task identifiers to delete | `[{taskId: "123"}, {taskId: "456"}]` |
| tasks[].taskId | string | No* | Task ID (STRONGLY PREFERRED) | `"86fpd7vgc"` or `"DEV-1234"` |
| tasks[].taskName | string | No* | Task name (RISKY - requires listName) | `"Old task"` |
| tasks[].listName | string | No | List name (REQUIRED with taskName) | `"Sprint Backlog"` |
| tasks[].customTaskId | string | No | Explicit custom ID | `"DEV-1234"` |
| options.batchSize | number | No | Tasks per batch (default: 10) | `20` |
| options.concurrency | number | No | Parallel operations (default: 3) | `5` |
| options.continueOnError | boolean | No | Continue if some fail (default: false) | `true` |
| options.retryCount | number | No | Retry attempts (default: 0) | `3` |

*Note: Either `taskId` OR `taskName` is REQUIRED for each task. **taskId is STRONGLY PREFERRED for safety.**

---

### Returns

**Success Response** (when `ENABLE_DEBUG=false`):
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Bulk task deletion completed",
    "deleted_tasks": [
      {
        "id": "task1_id",
        "name": "Old test task 1"
      },
      {
        "id": "task2_id",
        "name": "Old test task 2"
      }
    ],
    "summary": {
      "total": 2,
      "deleted": 2,
      "failed": 0
    }
  },
  "metadata": {
    "timestamp": "2025-01-18T10:30:00.000Z",
    "tool_name": "delete_bulk_tasks",
    "execution_time_ms": 280,
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
    "message": "Bulk task deletion completed with some failures",
    "deleted_tasks": [
      {
        "id": "task1_id",
        "name": "Old test task 1"
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
      "deleted": 1,
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
| data.deleted_tasks | array | Successfully deleted task identifiers |
| data.failed_tasks | array | Failed deletions with error messages (if any) |
| data.summary.total | number | Total tasks attempted |
| data.summary.deleted | number | Tasks successfully deleted |
| data.summary.failed | number | Tasks that failed to delete |
| metadata.execution_time_ms | number | Total operation time |

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
    "suggested_action": "Provide an array of tasks to delete."
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

**3. VALIDATION (taskName Without listName)**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "Task at index 0: listName is required when using taskName",
    "type": "VALIDATION",
    "details": {
      "task_index": 0
    },
    "suggested_action": "SAFETY WARNING: Provide listName when using taskName, or use taskId instead."
  }
}
```

**4. NOT_FOUND**
```json
{
  "success": false,
  "error": {
    "code": "TASK_NOT_FOUND",
    "message": "Task 'Old task' not found in workspace",
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
    "message": "Insufficient permissions to delete tasks",
    "type": "AUTH",
    "suggested_action": "Ensure your API key has permission to delete tasks."
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
| VALIDATION | 400 | No | Missing parameters or dangerous operation |
| NOT_FOUND | 404 | No | Task does not exist |
| AUTH | 401, 403 | No | Authentication or authorization failed |
| RATE_LIMIT | 429 | Yes | Rate limit exceeded - reduce batch size/concurrency |
| API_ERROR | 500, 502, 503 | Yes | Server error - retry with backoff |

---

### Rate Limits

**ClickUp API Rate Limit**: 100 requests/minute (Free Forever plan)

**This Tool's Impact**:
- **API Calls**: N call(s) per execution (N = number of tasks)
- **Estimated Impact**: ~10-20% of rate limit for 10 tasks

**Rate Limit Behavior**:
1. Automatic retry with exponential backoff
2. Configurable batch size and concurrency
3. Rate limit info included in response metadata

**Recommendations**:
- Use task IDs exclusively for safest operation
- Start with small batch size (5-10) for destructive operations
- Reduce concurrency to 2-3 for large deletions
- Set `continueOnError: true` to see which deletions succeeded
- Monitor rate limit remaining in response metadata

---

### API Dependencies

**ClickUp API Endpoints Called**:
| Method | Endpoint | Purpose |
|--------|----------|---------|
| DELETE | `/task/{task_id}` | Delete each task (N calls for N tasks) |

**Required Permissions**:
- **Task Delete**: API key must have permission to delete tasks

**API Documentation**:
- [ClickUp API Reference - Delete Task](https://clickup.com/api/clickupreference/operation/DeleteTask)

---

### Examples

#### Example 1: Delete Test Tasks (Safest Method)
```javascript
// Input
{
  "tasks": [
    {"taskId": "test_task_1_id"},
    {"taskId": "test_task_2_id"},
    {"taskId": "test_task_3_id"}
  ]
}

// Output
{
  "success": true,
  "data": {
    "success": true,
    "message": "Bulk task deletion completed",
    "deleted_tasks": [
      {"id": "test_task_1_id", "name": "Test task 1"},
      {"id": "test_task_2_id", "name": "Test task 2"},
      {"id": "test_task_3_id", "name": "Test task 3"}
    ],
    "summary": {"total": 3, "deleted": 3, "failed": 0}
  }
}
```

#### Example 2: Delete Custom ID Tasks
```javascript
// Input
{
  "tasks": [
    {"taskId": "TEST-001"},
    {"taskId": "TEST-002"},
    {"taskId": "TEST-003"}
  ],
  "options": {
    "batchSize": 10,
    "concurrency": 3,
    "continueOnError": true
  }
}
```

#### Example 3: Delete by Names (RISKY - Use with Caution)
```javascript
// Input
{
  "tasks": [
    {"taskName": "Duplicate task 1", "listName": "Test List"},
    {"taskName": "Duplicate task 2", "listName": "Test List"},
    {"taskName": "Duplicate task 3", "listName": "Test List"}
  ]
}

// WARNING: Ensure task names are unique in the list!
```

#### Example 4: With Partial Failures
```javascript
// Input
{
  "tasks": [
    {"taskId": "valid_task_id"},
    {"taskId": "invalid_id"},
    {"taskId": "another_valid_id"}
  ],
  "options": {
    "continueOnError": true
  }
}

// Output
{
  "success": true,
  "data": {
    "message": "Bulk task deletion completed with some failures",
    "deleted_tasks": [
      {"id": "valid_task_id", "name": "Task 1"},
      {"id": "another_valid_id", "name": "Task 2"}
    ],
    "failed_tasks": [
      {
        "task": {"taskId": "invalid_id"},
        "error": "Task not found: invalid_id"
      }
    ],
    "summary": {"total": 3, "deleted": 2, "failed": 1}
  }
}
```

---

### Integration Examples

#### Python
```python
from mcp import Client

client = Client()

# SAFEST: Delete by task IDs
tasks = [
    {"taskId": "test_task_1_id"},
    {"taskId": "test_task_2_id"},
    {"taskId": "test_task_3_id"}
]

response = client.call_tool(
    "delete_bulk_tasks",
    {"tasks": tasks}
)

if response["success"]:
    summary = response["data"]["summary"]
    print(f"Deleted {summary['deleted']} out of {summary['total']} tasks")

    for task in response["data"]["deleted_tasks"]:
        print(f"✓ Deleted: {task['name']} (ID: {task['id']})")
else:
    print(f"Error: {response['error']['message']}")

# With error handling
response = client.call_tool(
    "delete_bulk_tasks",
    {
        "tasks": [
            {"taskId": "TEST-001"},
            {"taskId": "TEST-002"}
        ],
        "options": {
            "batchSize": 10,
            "concurrency": 3,
            "continueOnError": True
        }
    }
)

# Handle partial failures
if response["success"] and response["data"].get("failed_tasks"):
    print(f"\nFailed to delete:")
    for failure in response["data"]["failed_tasks"]:
        print(f"✗ {failure['task']}: {failure['error']}")

# SAFETY: Verify before deleting
def safe_bulk_delete(task_ids):
    """Verify tasks exist before deleting"""
    # First, verify all tasks exist
    verified_tasks = []
    for task_id in task_ids:
        verify_response = client.call_tool("get_task", {"taskId": task_id})
        if verify_response["success"]:
            task = verify_response["data"]["task"]
            print(f"Found: {task['name']} (ID: {task_id})")
            verified_tasks.append({"taskId": task_id})
        else:
            print(f"WARNING: Task {task_id} not found - skipping")

    # Confirm deletion
    if verified_tasks:
        print(f"\nAbout to DELETE {len(verified_tasks)} tasks. Continue? (yes/no)")
        # In real implementation, get user confirmation
        # confirm = input().lower()
        # if confirm == 'yes':
        return client.call_tool("delete_bulk_tasks", {"tasks": verified_tasks})
```

#### TypeScript
```typescript
import { Client } from '@modelcontextprotocol/sdk/client';

const client = new Client();

// SAFEST: Delete by task IDs with verification
const safeBulkDelete = async (taskIds: string[]) => {
  // Step 1: Verify all tasks exist
  console.log('Verifying tasks...');
  const verifiedTasks: Array<{taskId: string, name: string}> = [];

  for (const taskId of taskIds) {
    const verifyResponse = await client.callTool('get_task', { taskId });
    if (verifyResponse.success) {
      const task = verifyResponse.data.task;
      console.log(`✓ Found: ${task.name} (${taskId})`);
      verifiedTasks.push({ taskId, name: task.name });
    } else {
      console.log(`✗ WARNING: Task ${taskId} not found - skipping`);
    }
  }

  if (verifiedTasks.length === 0) {
    throw new Error('No valid tasks to delete');
  }

  // Step 2: Show what will be deleted
  console.log(`\n⚠️  About to PERMANENTLY DELETE ${verifiedTasks.length} tasks:`);
  verifiedTasks.forEach(t => console.log(`  - ${t.name} (${t.taskId})`));

  // Step 3: In real implementation, require explicit confirmation
  // const confirmed = await confirmDeletion();
  // if (!confirmed) return null;

  // Step 4: Delete
  const tasks = verifiedTasks.map(t => ({ taskId: t.taskId }));
  const response = await client.callTool('delete_bulk_tasks', {
    tasks,
    options: {
      batchSize: 10,
      concurrency: 3,
      continueOnError: true
    }
  });

  if (response.success) {
    const { deleted, failed, total } = response.data.summary;
    console.log(`\n✓ Deleted: ${deleted}/${total}, Failed: ${failed}`);

    // Handle failures
    if (response.data.failed_tasks?.length > 0) {
      console.log('\nFailed to delete:');
      response.data.failed_tasks.forEach(f => {
        console.log(`  ✗ ${JSON.stringify(f.task)}: ${f.error}`);
      });
    }

    return response.data.deleted_tasks;
  }

  throw new Error(response.error.message);
};

// Delete test tasks
const deleteTestTasks = async (testTaskIds: string[]) => {
  console.log('🧹 Cleaning up test tasks...');
  return await safeBulkDelete(testTaskIds);
};

// Delete by pattern (e.g., all tasks starting with "TEST-")
const deleteByPattern = async (pattern: RegExp) => {
  // First, get all tasks
  const allTasksResponse = await client.callTool('get_workspace_tasks', {});

  if (!allTasksResponse.success) {
    throw new Error('Failed to fetch tasks');
  }

  // Filter by pattern
  const matchingTaskIds = allTasksResponse.data.tasks
    .filter(task => pattern.test(task.custom_id || task.name))
    .map(task => task.id);

  if (matchingTaskIds.length === 0) {
    console.log('No tasks match the pattern');
    return [];
  }

  return await safeBulkDelete(matchingTaskIds);
};

// Usage
await deleteTestTasks(['TEST-001', 'TEST-002', 'TEST-003']);
await deleteByPattern(/^TEST-/);  // Delete all tasks with custom IDs starting with "TEST-"
```

---

### Related Tools

- **delete_task**: Delete a single task (with safety checks)
- **get_task**: Verify task before deletion
- **get_workspace_tasks**: Find tasks to delete
- **update_bulk_tasks**: Alternative: archive tasks instead of deleting

---

### Safety Best Practices

**🚨 CRITICAL SAFETY GUIDELINES:**

**DO:**
- ✅ **ALWAYS use task IDs** (never use task names if possible)
- ✅ **Verify tasks exist before deleting** (use get_task first)
- ✅ **Start with small batches** (5-10 tasks) for testing
- ✅ **Set continueOnError: true** to see which deletions succeeded
- ✅ **Consider archiving instead** (move to archive list rather than delete)
- ✅ **Log deletions** for audit trail
- ✅ **Require explicit confirmation** in your application

**DON'T:**
- ❌ **NEVER delete by task name without list scoping**
- ❌ **NEVER delete without user confirmation**
- ❌ **NEVER use high concurrency** (3 max recommended)
- ❌ **NEVER delete production tasks** without verification
- ❌ **NEVER batch delete 100+ tasks at once** (do in smaller groups)
- ❌ **NEVER assume deletion succeeded** (check failed_tasks array)

---

### Alternative: Archive Instead of Delete

**Consider using update_bulk_tasks or move_bulk_tasks to archive tasks instead:**

```javascript
// Instead of deleting:
delete_bulk_tasks({ tasks: [...] })

// Consider archiving:
move_bulk_tasks({
  tasks: [...],
  targetListName: "Archive"
})

// Or mark as archived:
update_bulk_tasks({
  tasks: tasks.map(t => ({
    ...t,
    status: "Archived",
    tags: ["archived"]
  }))
})
```

---

### Performance Tips

**Optimization Strategies**:
1. **Use Task IDs**: Fastest and safest
2. **Small Batches**: 5-10 tasks per batch for destructive operations
3. **Low Concurrency**: 2-3 parallel operations maximum
4. **Error Handling**: Always use `continueOnError: true`
5. **Verification**: Verify tasks exist before deleting

**Typical Response Times**:
- 5 tasks: ~200-350ms
- 10 tasks: ~350-500ms
- 20 tasks: ~700-1000ms

---

### Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.1.0 | 2025-01-18 | Added debug metadata support (Phase 5) |
| 1.0.0 | 2025-01-15 | Added automatic retry with telemetry (Phase 4) |
| 0.9.0 | 2025-01-10 | Added batch processing and safety warnings |
| 0.8.0 | 2025-01-05 | Initial tool implementation |

---

**Last Updated**: 2025-01-18
**Status**: Production-ready - Part of 72-tool comprehensive suite
**⚠️ DANGER**: This operation is PERMANENT and CANNOT BE UNDONE. Use with extreme caution and always verify before deleting.
