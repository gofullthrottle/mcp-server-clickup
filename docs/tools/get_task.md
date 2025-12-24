# Tool Documentation: `get_task`

**Category**: Task Management

**Description**: Retrieves complete details of a specific task by ID or name. Automatically handles both regular ClickUp IDs and custom task IDs (e.g., "DEV-1234"). Optionally includes full subtask details.

**Use Cases**:
- Get task details by ClickUp ID for quick lookups
- Retrieve task information using custom task IDs (e.g., "PROJ-456")
- Search for a task by name across workspace or within a specific list
- Fetch a task with all subtask details included

---

### Input Parameters

```json
{
  "taskId": {
    "type": "string",
    "required": false,
    "description": "ID of task to retrieve (preferred). Automatically detects and handles both regular task IDs (9 characters) and custom IDs (like 'DEV-1234', 'PROJ-456')",
    "example": "86fpd7vgc" or "DEV-1234"
  },
  "taskName": {
    "type": "string",
    "required": false,
    "description": "Name of task to retrieve. Can be used alone for a global search, or with listName for faster lookup",
    "example": "Deploy production release"
  },
  "listName": {
    "type": "string",
    "required": false,
    "description": "Name of list containing the task. Optional but recommended when using taskName for faster and more accurate results",
    "example": "Sprint Backlog"
  },
  "customTaskId": {
    "type": "string",
    "required": false,
    "description": "Custom task ID (e.g., 'DEV-1234'). Optional since taskId automatically handles custom IDs. Use only for explicit custom ID lookup or backward compatibility",
    "example": "DEV-1234"
  },
  "subtasks": {
    "type": "boolean",
    "required": false,
    "description": "Whether to include subtasks in the response. Set to true to retrieve full details of all subtasks",
    "example": true
  }
}
```

**Parameter Details**:
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| taskId | string | No* | Task ID (regular or custom) | `"86fpd7vgc"` or `"DEV-1234"` |
| taskName | string | No* | Task name for search | `"Deploy production"` |
| listName | string | No | List name (improves taskName search) | `"Sprint Backlog"` |
| customTaskId | string | No | Explicit custom ID (legacy) | `"PROJ-456"` |
| subtasks | boolean | No | Include subtask details | `true` |

*Note: Either `taskId` OR `taskName` is REQUIRED (at least one must be provided)

---

### Returns

**Success Response** (when `ENABLE_DEBUG=false`):
```json
{
  "success": true,
  "data": {
    "id": "86fpd7vgc",
    "custom_id": "DEV-1234",
    "name": "🚀 Deploy production release",
    "text_content": "Deploy the new authentication feature to production environment",
    "description": "Deploy the new authentication feature to production environment",
    "status": {
      "id": "p90110026556_VlN8IJtk",
      "status": "In Progress",
      "color": "#4194f6",
      "orderindex": 1,
      "type": "custom"
    },
    "orderindex": "1.00000000000000000000000000000000",
    "date_created": "1705575000000",
    "date_updated": "1705580000000",
    "date_closed": null,
    "date_done": null,
    "archived": false,
    "creator": {
      "id": 12345678,
      "username": "John Doe",
      "email": "john@example.com",
      "color": "#7b68ee",
      "profilePicture": "https://attachments.clickup.com/profilePictures/..."
    },
    "assignees": [
      {
        "id": 87654321,
        "username": "Jane Smith",
        "email": "jane@example.com",
        "color": "#ff6900"
      }
    ],
    "watchers": [
      {
        "id": 11223344,
        "username": "Bob Manager",
        "email": "bob@example.com"
      }
    ],
    "checklists": [],
    "tags": [
      {
        "name": "deployment",
        "tag_fg": "#ffffff",
        "tag_bg": "#ff0000"
      },
      {
        "name": "production",
        "tag_fg": "#000000",
        "tag_bg": "#ffcc00"
      }
    ],
    "parent": null,
    "priority": {
      "id": "1",
      "priority": "urgent",
      "color": "#f50000",
      "orderindex": "1"
    },
    "due_date": "1705660800000",
    "start_date": "1705575000000",
    "points": 5,
    "time_estimate": 7200000,
    "time_spent": 3600000,
    "custom_fields": [
      {
        "id": "field_123",
        "name": "Environment",
        "type": "drop_down",
        "type_config": {},
        "value": {
          "name": "Production",
          "color": "#ff0000"
        }
      }
    ],
    "dependencies": [],
    "linked_tasks": [],
    "list": {
      "id": "901234567",
      "name": "Sprint Backlog",
      "access": true
    },
    "folder": {
      "id": "90110026556",
      "name": "Development",
      "hidden": false,
      "access": true
    },
    "space": {
      "id": "90110061923",
      "name": "Engineering"
    },
    "url": "https://app.clickup.com/t/86fpd7vgc"
  },
  "metadata": {
    "timestamp": "2025-01-18T10:30:00.000Z",
    "tool_name": "get_task",
    "execution_time_ms": 120,
    "rate_limit": {
      "remaining": 99,
      "limit": 100,
      "reset_at": 1705575000000
    }
  }
}
```

**Success Response with Subtasks**:
```json
{
  "success": true,
  "data": {
    "id": "86fpd7vgc",
    "name": "🚀 Deploy production release",
    "status": {"status": "In Progress"},
    "subtasks": [
      {
        "id": "subtask_001",
        "name": "🔧 Update configuration files",
        "status": {"status": "Complete"},
        "assignees": [{"username": "Jane Smith"}]
      },
      {
        "id": "subtask_002",
        "name": "🧪 Run production tests",
        "status": {"status": "To Do"},
        "assignees": []
      }
    ],
    "url": "https://app.clickup.com/t/86fpd7vgc"
  }
}
```

**Response Fields**:
| Field | Type | Description |
|-------|------|-------------|
| success | boolean | Always `true` for successful responses |
| data.id | string | Unique task ID (9 characters) |
| data.custom_id | string | Custom task ID if set (e.g., "DEV-1234") |
| data.name | string | Task name |
| data.status | object | Current status with color and type |
| data.priority | object | Priority level with color |
| data.due_date | string | Due date timestamp (milliseconds) |
| data.assignees | array | Array of assigned users with details |
| data.tags | array | Array of tags with colors |
| data.custom_fields | array | Array of custom field values with types |
| data.time_estimate | number | Estimated time in milliseconds |
| data.time_spent | number | Time tracked in milliseconds |
| data.subtasks | array | Array of subtask details (if subtasks=true) |
| data.url | string | Direct link to task in ClickUp |
| metadata.execution_time_ms | number | Query execution time |
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
    "details": {
      "parameters": ["taskId", "taskName"],
      "issue": "missing_required_field"
    },
    "suggested_action": "Provide either a taskId or taskName to identify the task you want to retrieve."
  }
}
```

**2. NOT_FOUND (Task Not Found)**
```json
{
  "success": false,
  "error": {
    "code": "TASK_NOT_FOUND",
    "message": "Task '86fpd7vgc' not found",
    "type": "NOT_FOUND",
    "suggested_action": "Verify the task ID is correct and the task exists in your workspace. The task may have been deleted or archived."
  }
}
```

**3. NOT_FOUND (Custom ID Not Found)**
```json
{
  "success": false,
  "error": {
    "code": "CUSTOM_TASK_ID_NOT_FOUND",
    "message": "No task found with custom ID 'DEV-1234'",
    "type": "NOT_FOUND",
    "suggested_action": "Verify the custom task ID is correct. Use get_workspace_tasks to search for tasks with this custom ID."
  }
}
```

**4. NOT_FOUND (Task Name Ambiguous)**
```json
{
  "success": false,
  "error": {
    "code": "MULTIPLE_TASKS_FOUND",
    "message": "Multiple tasks found with name 'Deploy production'. Found in lists: Sprint Backlog, Deployment Queue",
    "type": "NOT_FOUND",
    "details": {
      "matches": 2,
      "lists": ["Sprint Backlog", "Deployment Queue"]
    },
    "suggested_action": "Specify listName parameter to narrow down the search, or use the task ID instead."
  }
}
```

**5. AUTH**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid API key or insufficient permissions",
    "type": "AUTH",
    "suggested_action": "Check your CLICKUP_API_KEY environment variable and ensure you have permission to view this task."
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
    "suggested_action": "Wait 30 seconds before retrying. Consider batching task retrieval operations."
  }
}
```

**Error Type Summary**:
| Error Type | HTTP Status | Retryable | Description |
|------------|-------------|-----------|-------------|
| VALIDATION | 400 | No | Missing or invalid parameters |
| NOT_FOUND | 404 | No | Task does not exist or multiple matches found |
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
- Use `taskId` (regular or custom) for fastest lookups (single API call)
- Provide `listName` with `taskName` to reduce search scope
- Cache frequently accessed task details in your application
- Use `get_tasks` to batch-retrieve multiple tasks from a list

---

### API Dependencies

**ClickUp API Endpoints Called**:
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/task/{task_id}` | Retrieve task by regular ID |
| GET | `/task/{custom_task_id}?custom_task_ids=true` | Retrieve task by custom ID |
| GET | `/list/{list_id}/task` | Search tasks by name (if listName provided) |
| GET | `/team/{team_id}/task` | Search tasks globally by name |

**Required Permissions**:
- **Task Read**: API key must have permission to view tasks in the workspace
- **List Access**: Read access to lists when searching by taskName
- **Custom Fields**: Read access to custom fields if they exist on the task

**API Documentation**:
- [ClickUp API Reference - Get Task](https://clickup.com/api/clickupreference/operation/GetTask)
- [ClickUp API Reference - Get Task by Custom ID](https://clickup.com/api/clickupreference/operation/GetTaskByCustomTaskId)

---

### Examples

#### Example 1: Get Task by Regular ID
```javascript
// Input
{
  "taskId": "86fpd7vgc"
}

// Output
{
  "success": true,
  "data": {
    "id": "86fpd7vgc",
    "name": "🚀 Deploy production release",
    "status": {"status": "In Progress"},
    "priority": {"priority": "urgent"},
    "assignees": [{"username": "Jane Smith"}],
    "url": "https://app.clickup.com/t/86fpd7vgc"
  },
  "metadata": {
    "execution_time_ms": 85
  }
}
```

#### Example 2: Get Task by Custom ID
```javascript
// Input
{
  "taskId": "DEV-1234"
}

// Output
{
  "success": true,
  "data": {
    "id": "86fpd7vgc",
    "custom_id": "DEV-1234",
    "name": "🐛 Fix authentication bug",
    "status": {"status": "To Do"},
    "url": "https://app.clickup.com/t/86fpd7vgc"
  }
}
```

#### Example 3: Get Task by Name with List Scoping
```javascript
// Input
{
  "taskName": "Deploy production release",
  "listName": "Sprint Backlog"
}

// Output
{
  "success": true,
  "data": {
    "id": "86fpd7vgc",
    "name": "🚀 Deploy production release",
    "list": {
      "id": "901234567",
      "name": "Sprint Backlog"
    },
    "url": "https://app.clickup.com/t/86fpd7vgc"
  }
}
```

#### Example 4: Get Task with Subtasks
```javascript
// Input
{
  "taskId": "86fpd7vgc",
  "subtasks": true
}

// Output
{
  "success": true,
  "data": {
    "id": "86fpd7vgc",
    "name": "🚀 Deploy production release",
    "subtasks": [
      {
        "id": "sub_001",
        "name": "🔧 Update config",
        "status": {"status": "Complete"}
      },
      {
        "id": "sub_002",
        "name": "🧪 Run tests",
        "status": {"status": "To Do"}
      },
      {
        "id": "sub_003",
        "name": "📦 Build assets",
        "status": {"status": "In Progress"}
      }
    ]
  }
}
```

---

### Integration Examples

#### Python
```python
from mcp import Client

client = Client()

# Get task by ID
response = client.call_tool(
    "get_task",
    {"taskId": "86fpd7vgc", "subtasks": True}
)

if response["success"]:
    task = response["data"]
    print(f"Task: {task['name']}")
    print(f"Status: {task['status']['status']}")
    print(f"Assignees: {[a['username'] for a in task['assignees']]}")

    if "subtasks" in task:
        print(f"Subtasks: {len(task['subtasks'])}")
        for subtask in task["subtasks"]:
            print(f"  - {subtask['name']}: {subtask['status']['status']}")

    # Check execution time
    exec_time = response["metadata"]["execution_time_ms"]
    print(f"Query took {exec_time}ms")
else:
    error = response["error"]
    print(f"Error: {error['message']}")

    if error["type"] == "NOT_FOUND" and "matches" in error.get("details", {}):
        print("Multiple tasks found. Please specify listName.")
```

#### TypeScript
```typescript
import { Client } from '@modelcontextprotocol/sdk/client';

const client = new Client();

// Get task by custom ID
const response = await client.callTool('get_task', {
  taskId: 'DEV-1234'
});

if (response.success) {
  const task = response.data;
  console.log(`Task: ${task.name} (${task.custom_id})`);
  console.log(`Status: ${task.status.status}`);
  console.log(`URL: ${task.url}`);

  // Display custom fields
  if (task.custom_fields) {
    console.log('Custom fields:');
    task.custom_fields.forEach(field => {
      console.log(`  ${field.name}: ${JSON.stringify(field.value)}`);
    });
  }
} else {
  const error = response.error;
  console.error(`Error (${error.type}): ${error.message}`);

  if (error.suggested_action) {
    console.log(`Suggestion: ${error.suggested_action}`);
  }
}
```

---

### Related Tools

- **update_task**: Modify properties of the retrieved task
- **delete_task**: Permanently remove the task
- **get_tasks**: Retrieve multiple tasks from a list at once
- **get_task_comments**: Get comments for this task
- **create_task_comment**: Add a comment to this task

---

### Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.1.0 | 2025-01-18 | Added debug metadata support (Phase 5) |
| 1.0.0 | 2025-01-15 | Added automatic retry with telemetry (Phase 4) |
| 0.9.0 | 2025-01-10 | Added automatic custom ID detection in taskId parameter |
| 0.8.0 | 2025-01-05 | Initial tool implementation |

---

**Last Updated**: 2025-01-18
**Status**: Production-ready - Part of 72-tool comprehensive suite
