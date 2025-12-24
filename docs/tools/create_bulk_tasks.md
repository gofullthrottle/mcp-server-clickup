# Tool Documentation: `create_bulk_tasks`

**Category**: Task Management (Bulk Operations)

**Description**: Creates multiple tasks at once in a single list with configurable batch size and concurrency. Efficient for bulk imports, sprint planning, and template instantiation.

**Use Cases**:
- Import tasks from external systems or spreadsheets
- Create sprint backlog from template
- Bulk task creation for recurring workflows
- Initialize project with predefined task structure

---

### Input Parameters

```json
{
  "tasks": {
    "type": "array",
    "required": true,
    "description": "Array of tasks to create. Each task must have at least a name",
    "items": {
      "name": "string (required)",
      "description": "string (optional)",
      "markdown_description": "string (optional)",
      "status": "string (optional)",
      "priority": "number 1-4 (optional)",
      "dueDate": "string (optional) - Unix timestamp or natural language",
      "tags": "array of strings (optional)",
      "custom_fields": "array of {id, value} (optional)",
      "assignees": "array of user IDs/emails/usernames (optional)"
    }
  },
  "listId": {
    "type": "string",
    "required": false,
    "description": "ID of list for new tasks (preferred). Use this instead of listName if you have it",
    "example": "901234567"
  },
  "listName": {
    "type": "string",
    "required": false,
    "description": "Name of list for new tasks. Only use if you don't have listId",
    "example": "Sprint Backlog"
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
| tasks | array | **Yes** | Array of task objects to create | `[{name: "Task 1"}, {name: "Task 2"}]` |
| tasks[].name | string | **Yes** | Task name (can include emoji) | `"🚀 Deploy release"` |
| tasks[].description | string | No | Plain text description | `"Deploy to production"` |
| tasks[].markdown_description | string | No | Markdown description (overrides description) | `"**Deploy** to production"` |
| tasks[].status | string | No | Task status (uses list default if omitted) | `"In Progress"` |
| tasks[].priority | number | No | Priority 1-4 (1=urgent, 4=low) | `1` |
| tasks[].dueDate | string | No | Unix timestamp (ms) or natural language | `"tomorrow"` or `"1705575000000"` |
| tasks[].tags | array | No | Tag names (must exist in space) | `["deployment", "urgent"]` |
| tasks[].custom_fields | array | No | Custom field values as {id, value} | `[{id: "field_123", value: "High"}]` |
| tasks[].assignees | array | No | User IDs, emails, or usernames | `[12345678, "user@email.com", "username"]` |
| listId | string | No* | List ID (preferred) | `"901234567"` |
| listName | string | No* | List name | `"Sprint Backlog"` |
| options.batchSize | number | No | Tasks per batch (default: 10) | `20` |
| options.concurrency | number | No | Parallel operations (default: 3) | `5` |
| options.continueOnError | boolean | No | Continue if some fail (default: false) | `true` |
| options.retryCount | number | No | Retry attempts (default: 0) | `3` |

*Note: Either `listId` OR `listName` is REQUIRED (at least one must be provided)

---

### Returns

**Success Response** (when `ENABLE_DEBUG=false`):
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Bulk task creation completed",
    "created_tasks": [
      {
        "id": "task1_id",
        "name": "🚀 Deploy release v1.0",
        "status": {"status": "To Do"},
        "url": "https://app.clickup.com/t/task1_id"
      },
      {
        "id": "task2_id",
        "name": "📝 Update documentation",
        "status": {"status": "To Do"},
        "url": "https://app.clickup.com/t/task2_id"
      }
    ],
    "summary": {
      "total": 2,
      "created": 2,
      "failed": 0
    }
  },
  "metadata": {
    "timestamp": "2025-01-18T10:30:00.000Z",
    "tool_name": "create_bulk_tasks",
    "execution_time_ms": 450,
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
    "message": "Bulk task creation completed with some failures",
    "created_tasks": [
      {
        "id": "task1_id",
        "name": "🚀 Deploy release v1.0",
        "url": "https://app.clickup.com/t/task1_id"
      }
    ],
    "failed_tasks": [
      {
        "task": {"name": "❌ Invalid task"},
        "error": "Invalid status 'NonExistent' for this list"
      }
    ],
    "summary": {
      "total": 2,
      "created": 1,
      "failed": 1
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
    "message": "Bulk task creation completed",
    "created_tasks": [...],
    "summary": {"total": 2, "created": 2, "failed": 0}
  },
  "metadata": {
    "timestamp": "2025-01-18T10:30:00.000Z",
    "tool_name": "create_bulk_tasks",
    "execution_time_ms": 450,
    "rate_limit": {
      "remaining": 88,
      "limit": 100,
      "reset_at": 1705575000000
    },
    "debug": {
      "request_id": "q7r8s9t0",
      "tool_name": "create_bulk_tasks",
      "timing": {
        "total_ms": 450,
        "api_calls": [
          {
            "method": "POST",
            "path": "/list/{id}/task",
            "duration": 200,
            "status": 200
          },
          {
            "method": "POST",
            "path": "/list/{id}/task",
            "duration": 250,
            "status": 200
          }
        ]
      },
      "api_summary": {
        "total_calls": 2,
        "total_api_time_ms": 450,
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
| data.success | boolean | Overall operation success |
| data.message | string | Human-readable summary |
| data.created_tasks | array | Successfully created task objects |
| data.failed_tasks | array | Failed tasks with error messages (if any) |
| data.summary.total | number | Total tasks attempted |
| data.summary.created | number | Tasks successfully created |
| data.summary.failed | number | Tasks that failed to create |
| metadata.execution_time_ms | number | Total operation time |
| metadata.rate_limit | object | Rate limit status after operation |

---

### Error Types

This tool may return the following errors:

**1. VALIDATION (Missing Tasks Array)**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "tasks array is required",
    "type": "VALIDATION",
    "suggested_action": "Provide an array of tasks to create."
  }
}
```

**2. VALIDATION (Empty Tasks Array)**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "tasks array cannot be empty",
    "type": "VALIDATION",
    "suggested_action": "Provide at least one task in the tasks array."
  }
}
```

**3. VALIDATION (Missing List Identifier)**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "Either listId or listName must be provided",
    "type": "VALIDATION",
    "suggested_action": "Provide either a listId or listName to identify where to create tasks."
  }
}
```

**4. VALIDATION (Task Missing Name)**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "Task at index 2 is missing required field: name",
    "type": "VALIDATION",
    "details": {
      "task_index": 2
    },
    "suggested_action": "Ensure all tasks in the array have a name field."
  }
}
```

**5. NOT_FOUND**
```json
{
  "success": false,
  "error": {
    "code": "LIST_NOT_FOUND",
    "message": "List 'Sprint Backlog' not found in workspace",
    "type": "NOT_FOUND",
    "suggested_action": "Verify the list name is correct. Use get_workspace_hierarchy to see all available lists."
  }
}
```

**6. AUTH**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Insufficient permissions to create tasks in this list",
    "type": "AUTH",
    "suggested_action": "Ensure your API key has permission to create tasks in this list."
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
| VALIDATION | 400 | No | Missing parameters or invalid task data |
| NOT_FOUND | 404 | No | List does not exist |
| AUTH | 401, 403 | No | Authentication or authorization failed |
| RATE_LIMIT | 429 | Yes | Rate limit exceeded - reduce batch size/concurrency |
| API_ERROR | 500, 502, 503 | Yes | Server error - retry with backoff |

---

### Rate Limits

**ClickUp API Rate Limit**: 100 requests/minute (Free Forever plan)

**This Tool's Impact**:
- **API Calls**: N+1 call(s) per execution (1 for list lookup if listName used, N for creating N tasks)
- **Estimated Impact**: ~10-20% of rate limit for 10 tasks (depends on batch size and concurrency)

**Rate Limit Behavior**:
1. Automatic retry with exponential backoff (100ms → 200ms → 400ms → 800ms)
2. Configurable batch size and concurrency to control rate limit impact
3. Rate limit info included in response metadata
4. Requests queued when rate limit hit

**Recommendations**:
- Use `listId` instead of `listName` to reduce initial API call
- Start with default batch size (10) and concurrency (3)
- For large bulk operations (50+ tasks), reduce concurrency to 2
- Set `continueOnError: true` to get partial results even if some tasks fail
- Monitor rate limit remaining in response metadata

---

### API Dependencies

**ClickUp API Endpoints Called**:
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/team/{team_id}/space` | Look up list by name (only if listName provided) |
| POST | `/list/{list_id}/task` | Create each task (N calls for N tasks) |

**Required Permissions**:
- **Task Create**: API key must have permission to create tasks in the target list
- **List Access**: Read access to the target list

**API Documentation**:
- [ClickUp API Reference - Create Task](https://clickup.com/api/clickupreference/operation/CreateTask)

---

### Examples

#### Example 1: Simple Bulk Create (Minimal)
```javascript
// Input
{
  "tasks": [
    {"name": "🚀 Deploy release v1.0"},
    {"name": "📝 Update documentation"},
    {"name": "🧪 Run integration tests"}
  ],
  "listId": "901234567"
}

// Output
{
  "success": true,
  "data": {
    "success": true,
    "message": "Bulk task creation completed",
    "created_tasks": [
      {"id": "task1", "name": "🚀 Deploy release v1.0"},
      {"id": "task2", "name": "📝 Update documentation"},
      {"id": "task3", "name": "🧪 Run integration tests"}
    ],
    "summary": {"total": 3, "created": 3, "failed": 0}
  }
}
```

#### Example 2: Full Featured Tasks
```javascript
// Input
{
  "tasks": [
    {
      "name": "🚀 Deploy release v1.0",
      "description": "Deploy to production environment",
      "status": "In Progress",
      "priority": 1,
      "dueDate": "tomorrow at 5pm",
      "assignees": [12345678, "user@example.com"],
      "tags": ["deployment", "urgent"]
    },
    {
      "name": "📝 Update API docs",
      "markdown_description": "**Update** the REST API documentation with new endpoints",
      "status": "To Do",
      "priority": 2,
      "dueDate": "next week",
      "assignees": ["tech-writer"],
      "custom_fields": [
        {"id": "field_123", "value": "Documentation"}
      ]
    }
  ],
  "listName": "Sprint 10",
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
    "success": true,
    "created_tasks": [
      {
        "id": "task1_id",
        "name": "🚀 Deploy release v1.0",
        "status": {"status": "In Progress"},
        "priority": {"priority": "urgent"},
        "assignees": [...]
      },
      {
        "id": "task2_id",
        "name": "📝 Update API docs",
        "status": {"status": "To Do"}
      }
    ],
    "summary": {"total": 2, "created": 2, "failed": 0}
  }
}
```

#### Example 3: Sprint Backlog Import
```javascript
// Input
{
  "tasks": [
    {
      "name": "USER-001: As a user, I want to login",
      "description": "Implement OAuth 2.0 authentication",
      "priority": 1,
      "dueDate": "1705575000000",
      "tags": ["user-story", "authentication"]
    },
    {
      "name": "TASK-001: Setup database schema",
      "description": "Create user tables and indexes",
      "priority": 2,
      "tags": ["database", "setup"]
    },
    {
      "name": "BUG-001: Fix login redirect",
      "description": "Login redirects to wrong page",
      "priority": 1,
      "tags": ["bug", "urgent"]
    }
  ],
  "listId": "901234567",
  "options": {
    "batchSize": 20,
    "concurrency": 5
  }
}
```

#### Example 4: With Partial Failures (continueOnError=true)
```javascript
// Input
{
  "tasks": [
    {"name": "✅ Valid task 1", "status": "To Do"},
    {"name": "❌ Invalid task", "status": "NonExistent"},  // Invalid status
    {"name": "✅ Valid task 2", "status": "In Progress"}
  ],
  "listId": "901234567",
  "options": {
    "continueOnError": true
  }
}

// Output
{
  "success": true,
  "data": {
    "success": true,
    "message": "Bulk task creation completed with some failures",
    "created_tasks": [
      {"id": "task1", "name": "✅ Valid task 1"},
      {"id": "task3", "name": "✅ Valid task 2"}
    ],
    "failed_tasks": [
      {
        "task": {"name": "❌ Invalid task", "status": "NonExistent"},
        "error": "Invalid status 'NonExistent' for this list"
      }
    ],
    "summary": {"total": 3, "created": 2, "failed": 1}
  }
}
```

---

### Integration Examples

#### Python
```python
from mcp import Client

client = Client()

# Simple bulk create
tasks = [
    {"name": "🚀 Deploy release v1.0"},
    {"name": "📝 Update documentation"},
    {"name": "🧪 Run integration tests"}
]

response = client.call_tool(
    "create_bulk_tasks",
    {
        "tasks": tasks,
        "listId": "901234567"
    }
)

if response["success"]:
    summary = response["data"]["summary"]
    print(f"Created {summary['created']} out of {summary['total']} tasks")

    for task in response["data"]["created_tasks"]:
        print(f"✓ {task['name']} - {task['url']}")

    # Check execution time
    exec_time = response["metadata"]["execution_time_ms"]
    print(f"Bulk operation took {exec_time}ms")
else:
    print(f"Error: {response['error']['message']}")

# Full featured bulk create
tasks_detailed = [
    {
        "name": "🚀 Deploy release v1.0",
        "description": "Deploy to production",
        "status": "In Progress",
        "priority": 1,
        "dueDate": "tomorrow at 5pm",
        "assignees": [12345678, "user@example.com"],
        "tags": ["deployment", "urgent"]
    },
    {
        "name": "📝 Update API docs",
        "status": "To Do",
        "priority": 2,
        "assignees": ["tech-writer"]
    }
]

response = client.call_tool(
    "create_bulk_tasks",
    {
        "tasks": tasks_detailed,
        "listName": "Sprint 10",
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
        print(f"✗ {failure['task']['name']}: {failure['error']}")
```

#### TypeScript
```typescript
import { Client } from '@modelcontextprotocol/sdk/client';

const client = new Client();

// Bulk create from array
const bulkCreate = async (listId: string, taskNames: string[]) => {
  const tasks = taskNames.map(name => ({ name }));

  const response = await client.callTool('create_bulk_tasks', {
    tasks,
    listId
  });

  if (response.success) {
    const { created, total } = response.data.summary;
    console.log(`✓ Created ${created}/${total} tasks`);
    return response.data.created_tasks;
  } else {
    console.error(`✗ Failed: ${response.error.message}`);
    throw new Error(response.error.message);
  }
};

// Bulk create with full options
interface TaskInput {
  name: string;
  description?: string;
  status?: string;
  priority?: number;
  dueDate?: string;
  assignees?: (number | string)[];
  tags?: string[];
}

const bulkCreateFull = async (
  listId: string,
  tasks: TaskInput[],
  options?: {
    batchSize?: number;
    concurrency?: number;
    continueOnError?: boolean;
  }
) => {
  const response = await client.callTool('create_bulk_tasks', {
    tasks,
    listId,
    options
  });

  if (response.success) {
    const summary = response.data.summary;
    console.log(`Created: ${summary.created}, Failed: ${summary.failed}`);

    // Handle failures if any
    if (response.data.failed_tasks?.length > 0) {
      console.log('\nFailed tasks:');
      response.data.failed_tasks.forEach(f => {
        console.log(`  ✗ ${f.task.name}: ${f.error}`);
      });
    }

    return response.data.created_tasks;
  }

  throw new Error(response.error.message);
};

// Sprint backlog from CSV
const importSprintBacklog = async (csvData: string, listId: string) => {
  const tasks = csvData.split('\n').slice(1).map(line => {
    const [name, priority, assignee] = line.split(',');
    return {
      name,
      priority: parseInt(priority),
      assignees: [assignee.trim()]
    };
  });

  return await bulkCreateFull(listId, tasks, {
    batchSize: 20,
    concurrency: 5,
    continueOnError: true
  });
};

await bulkCreate('901234567', ['Task 1', 'Task 2', 'Task 3']);
await importSprintBacklog(csvData, '901234567');
```

---

### Related Tools

- **create_task**: Create a single task
- **update_bulk_tasks**: Update multiple tasks at once
- **get_tasks**: Retrieve created tasks for verification
- **get_workspace_hierarchy**: Get list IDs for bulk operations

---

### Best Practices

**DO:**
- ✅ Use `listId` for fastest performance
- ✅ Set `continueOnError: true` for large bulk operations
- ✅ Start with default batch size and concurrency
- ✅ Monitor rate limit in response metadata
- ✅ Validate task data before bulk creation

**DON'T:**
- ❌ Create 100+ tasks with high concurrency (will hit rate limit)
- ❌ Use bulk operations for < 3 tasks (use create_task instead)
- ❌ Set concurrency > 5 (will likely hit rate limit)
- ❌ Ignore `failed_tasks` array in response

---

### Performance Tips

**Optimization Strategies**:
1. **Batch Size**: 10-20 tasks per batch for optimal throughput
2. **Concurrency**: 3-5 parallel operations (default: 3)
3. **Rate Limit Awareness**: Monitor remaining requests in metadata
4. **Error Handling**: Use `continueOnError: true` for large operations
5. **List ID**: Always use listId when possible

**Typical Response Times**:
- 5 tasks: ~300-500ms
- 10 tasks: ~500-800ms
- 20 tasks: ~1000-1500ms
- 50+ tasks: ~2500-5000ms (with proper batch/concurrency config)

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
