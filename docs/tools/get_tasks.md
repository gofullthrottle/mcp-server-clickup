# Tool Documentation: `get_tasks`

**Category**: Task Management

**Description**: Retrieves multiple tasks from a specific list with optional filtering, sorting, and pagination. Efficient for batch operations and list analysis.

**Use Cases**:
- Get all tasks in a list for reporting or analysis
- Filter tasks by status (e.g., "In Progress", "To Do")
- Retrieve archived tasks for audit purposes
- Paginate through large task lists efficiently

---

### Input Parameters

```json
{
  "listId": {
    "type": "string",
    "required": false,
    "description": "ID of list to get tasks from (preferred). Use this instead of listName if you have it",
    "example": "901234567"
  },
  "listName": {
    "type": "string",
    "required": false,
    "description": "Name of list to get tasks from. Only use if you don't have listId",
    "example": "Sprint Backlog"
  },
  "subtasks": {
    "type": "boolean",
    "required": false,
    "description": "Include subtasks in results",
    "example": true
  },
  "statuses": {
    "type": "array",
    "required": false,
    "description": "Filter by status names (e.g. ['To Do', 'In Progress']). Case-sensitive",
    "example": ["To Do", "In Progress"]
  },
  "archived": {
    "type": "boolean",
    "required": false,
    "description": "Include archived tasks",
    "example": false
  },
  "page": {
    "type": "number",
    "required": false,
    "description": "Page number for pagination (starts at 0)",
    "example": 0
  },
  "order_by": {
    "type": "string",
    "required": false,
    "description": "Sort field: due_date, created, updated",
    "example": "due_date"
  },
  "reverse": {
    "type": "boolean",
    "required": false,
    "description": "Reverse sort order (descending)",
    "example": true
  }
}
```

**Parameter Details**:
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| listId | string | No* | List ID (preferred) | `"901234567"` |
| listName | string | No* | List name | `"Sprint Backlog"` |
| subtasks | boolean | No | Include subtasks | `true` |
| statuses | array | No | Filter by status names | `["To Do", "In Progress"]` |
| archived | boolean | No | Include archived tasks | `false` |
| page | number | No | Page number (0-indexed) | `0` |
| order_by | string | No | Sort field | `"due_date"` or `"created"` or `"updated"` |
| reverse | boolean | No | Reverse sort order | `true` |

*Note: Either `listId` OR `listName` is REQUIRED (at least one must be provided)

---

### Returns

**Success Response** (when `ENABLE_DEBUG=false`):
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "86fpd7vgc",
        "custom_id": "DEV-1234",
        "name": "🚀 Deploy production release",
        "status": {
          "status": "In Progress",
          "color": "#4194f6"
        },
        "priority": {
          "priority": "urgent",
          "color": "#f50000"
        },
        "due_date": "1705660800000",
        "assignees": [
          {
            "id": 12345678,
            "username": "John Doe",
            "email": "john@example.com"
          }
        ],
        "tags": ["deployment", "production"],
        "url": "https://app.clickup.com/t/86fpd7vgc"
      },
      {
        "id": "abc123xyz",
        "name": "🐛 Fix login bug",
        "status": {
          "status": "To Do",
          "color": "#d3d3d3"
        },
        "priority": {
          "priority": "high",
          "color": "#ffaa00"
        },
        "due_date": "1705747200000",
        "assignees": [],
        "tags": ["bug", "frontend"],
        "url": "https://app.clickup.com/t/abc123xyz"
      }
    ],
    "count": 2
  },
  "metadata": {
    "timestamp": "2025-01-18T10:30:00.000Z",
    "tool_name": "get_tasks",
    "execution_time_ms": 180,
    "rate_limit": {
      "remaining": 99,
      "limit": 100,
      "reset_at": 1705575000000
    }
  }
}
```

**Response Fields**:
| Field | Type | Description |
|-------|------|-------------|
| success | boolean | Always `true` for successful responses |
| data.tasks | array | Array of task objects |
| data.count | number | Number of tasks returned |
| data.tasks[].id | string | Task ID |
| data.tasks[].name | string | Task name |
| data.tasks[].status | object | Task status with color |
| data.tasks[].priority | object | Task priority with color |
| data.tasks[].assignees | array | Assigned users |
| data.tasks[].tags | array | Tag names |
| data.tasks[].url | string | Direct link to task |
| metadata.execution_time_ms | number | Query execution time |
| metadata.rate_limit | object | Current rate limit status |

---

### Error Types

This tool may return the following errors:

**1. VALIDATION (Missing List Identifier)**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "Either listId or listName must be provided",
    "type": "VALIDATION",
    "suggested_action": "Provide either a listId or listName to identify which list's tasks to retrieve."
  }
}
```

**2. NOT_FOUND**
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

**3. VALIDATION (Invalid Status Filter)**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_STATUS_FILTER",
    "message": "Status 'Complete' not valid for this list. Valid statuses: To Do, In Progress, Done",
    "type": "VALIDATION",
    "details": {
      "invalid_status": "Complete",
      "valid_statuses": ["To Do", "In Progress", "Done"]
    },
    "suggested_action": "Use one of the valid status values for this list."
  }
}
```

**4. AUTH**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Insufficient permissions to view tasks in this list",
    "type": "AUTH",
    "suggested_action": "Ensure your API key has permission to view tasks in this list."
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
    "suggested_action": "Wait 30 seconds before retrying. Consider reducing pagination page size."
  }
}
```

**Error Type Summary**:
| Error Type | HTTP Status | Retryable | Description |
|------------|-------------|-----------|-------------|
| VALIDATION | 400 | No | Missing parameters or invalid filter values |
| NOT_FOUND | 404 | No | List does not exist |
| AUTH | 401, 403 | No | Authentication or authorization failed |
| RATE_LIMIT | 429 | Yes | Rate limit exceeded - wait and retry |
| API_ERROR | 500, 502, 503 | Yes | Server error - retry with backoff |

---

### Rate Limits

**ClickUp API Rate Limit**: 100 requests/minute (Free Forever plan)

**This Tool's Impact**:
- **API Calls**: 1-2 call(s) per execution (1 if listId provided, 2 if listName requires lookup)
- **Estimated Impact**: ~1-2% of rate limit per execution

**Rate Limit Behavior**:
1. Automatic retry with exponential backoff (100ms → 200ms → 400ms → 800ms)
2. Rate limit info included in response metadata
3. Requests queued when rate limit hit

**Recommendations**:
- Use `listId` instead of `listName` to reduce API calls
- Use pagination for large lists to avoid timeouts
- Cache results when appropriate
- Use status filters to reduce response size

---

### API Dependencies

**ClickUp API Endpoints Called**:
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/team/{team_id}/space` | Look up list by name (only if listName provided) |
| GET | `/list/{list_id}/task` | Retrieve tasks from the list |

**Required Permissions**:
- **List Access**: API key must have read access to the list
- **Task Read**: Permission to view tasks in the list

**API Documentation**:
- [ClickUp API Reference - Get Tasks](https://clickup.com/api/clickupreference/operation/GetTasks)

---

### Examples

#### Example 1: Get All Tasks in a List
```javascript
// Input
{
  "listId": "901234567"
}

// Output
{
  "success": true,
  "data": {
    "tasks": [
      {"id": "86fpd7vgc", "name": "🚀 Deploy release", "status": {"status": "In Progress"}},
      {"id": "abc123xyz", "name": "🐛 Fix bug", "status": {"status": "To Do"}},
      {"id": "def456uvw", "name": "📊 Create report", "status": {"status": "Done"}}
    ],
    "count": 3
  }
}
```

#### Example 2: Filter by Status
```javascript
// Input
{
  "listName": "Sprint Backlog",
  "statuses": ["In Progress", "To Do"]
}

// Output
{
  "success": true,
  "data": {
    "tasks": [
      {"id": "86fpd7vgc", "name": "🚀 Deploy release", "status": {"status": "In Progress"}},
      {"id": "abc123xyz", "name": "🐛 Fix bug", "status": {"status": "To Do"}}
    ],
    "count": 2
  }
}
```

#### Example 3: Sorted by Due Date
```javascript
// Input
{
  "listId": "901234567",
  "order_by": "due_date",
  "reverse": false,
  "statuses": ["To Do", "In Progress"]
}

// Output
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "urgent_task",
        "name": "⚠️ Urgent fix",
        "due_date": "1705575000000",
        "status": {"status": "To Do"}
      },
      {
        "id": "normal_task",
        "name": "🔧 Regular task",
        "due_date": "1705660800000",
        "status": {"status": "In Progress"}
      }
    ],
    "count": 2
  }
}
```

#### Example 4: Pagination
```javascript
// Input (First page)
{
  "listId": "901234567",
  "page": 0,
  "order_by": "created",
  "reverse": true
}

// Output
{
  "success": true,
  "data": {
    "tasks": [
      /* First 100 tasks (default page size) */
    ],
    "count": 100
  }
}

// Input (Second page)
{
  "listId": "901234567",
  "page": 1,
  "order_by": "created",
  "reverse": true
}
```

#### Example 5: Include Subtasks
```javascript
// Input
{
  "listId": "901234567",
  "subtasks": true
}

// Output
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "parent_task",
        "name": "🚀 Deploy release",
        "subtasks": [
          {"id": "sub1", "name": "🔧 Update config"},
          {"id": "sub2", "name": "🧪 Run tests"}
        ]
      }
    ],
    "count": 1
  }
}
```

---

### Integration Examples

#### Python
```python
from mcp import Client

client = Client()

# Get all in-progress tasks sorted by due date
response = client.call_tool(
    "get_tasks",
    {
        "listId": "901234567",
        "statuses": ["In Progress"],
        "order_by": "due_date",
        "reverse": False  # Ascending (earliest first)
    }
)

if response["success"]:
    tasks = response["data"]["tasks"]
    count = response["data"]["count"]

    print(f"Found {count} in-progress tasks:")
    for task in tasks:
        status = task["status"]["status"]
        due = task.get("due_date", "No due date")
        assignees = ", ".join([a["username"] for a in task.get("assignees", [])])

        print(f"- {task['name']}")
        print(f"  Status: {status}")
        print(f"  Due: {due}")
        print(f"  Assignees: {assignees or 'Unassigned'}")
        print(f"  URL: {task['url']}\n")

    # Check execution time
    exec_time = response["metadata"]["execution_time_ms"]
    print(f"Query took {exec_time}ms")
else:
    print(f"Error: {response['error']['message']}")
```

#### TypeScript
```typescript
import { Client } from '@modelcontextprotocol/sdk/client';

const client = new Client();

// Get tasks with pagination
const getAllTasks = async (listId: string): Promise<any[]> => {
  let allTasks: any[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const response = await client.callTool('get_tasks', {
      listId,
      page,
      order_by: 'created',
      reverse: true
    });

    if (!response.success) {
      throw new Error(response.error.message);
    }

    const tasks = response.data.tasks;
    allTasks = allTasks.concat(tasks);

    // ClickUp returns 100 tasks per page by default
    hasMore = tasks.length === 100;
    page++;

    console.log(`Fetched page ${page}: ${tasks.length} tasks`);
  }

  return allTasks;
};

// Get overdue tasks
const getOverdueTasks = async (listName: string) => {
  const response = await client.callTool('get_tasks', {
    listName,
    statuses: ['To Do', 'In Progress'],
    order_by: 'due_date'
  });

  if (response.success) {
    const now = Date.now();
    const overdue = response.data.tasks.filter(task => {
      return task.due_date && parseInt(task.due_date) < now;
    });

    console.log(`Found ${overdue.length} overdue tasks:`);
    overdue.forEach(task => {
      console.log(`- ${task.name} (Due: ${new Date(parseInt(task.due_date))})`);
    });

    return overdue;
  }
};

await getAllTasks('901234567');
await getOverdueTasks('Sprint Backlog');
```

---

### Related Tools

- **get_task**: Get detailed information for a single task
- **create_task**: Create a new task in the list
- **update_bulk_tasks**: Update multiple tasks at once
- **get_workspace_tasks**: Search tasks across entire workspace
- **get_workspace_hierarchy**: View all lists available in workspace

---

### Performance Tips

**Optimization Strategies**:
1. **Use Status Filters**: Reduce response size by filtering to relevant statuses
2. **Pagination**: Use `page` parameter for large lists to avoid timeouts
3. **Cache Results**: Cache frequently accessed task lists in your application
4. **Use listId**: Avoid extra API call for list lookup
5. **Sort Once**: Sort on server-side using `order_by` instead of client-side

**Typical Response Times**:
- Small lists (< 50 tasks): ~100-150ms
- Medium lists (50-200 tasks): ~150-250ms
- Large lists (200+ tasks): ~250-400ms per page

---

### Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.1.0 | 2025-01-18 | Added debug metadata support (Phase 5) |
| 1.0.0 | 2025-01-15 | Added automatic retry with telemetry (Phase 4) |
| 0.9.0 | 2025-01-10 | Added pagination and sorting support |
| 0.8.0 | 2025-01-05 | Initial tool implementation |

---

**Last Updated**: 2025-01-18
**Status**: Production-ready - Part of 72-tool comprehensive suite
