# Tool Documentation: `update_task`

**Category**: Task Management

**Description**: Updates properties of an existing task including name, description, status, priority, dates, assignees, and custom fields. Supports identification by task ID (regular or custom) or task name.

**Use Cases**:
- Update task status as work progresses (e.g., "To Do" → "In Progress" → "Complete")
- Change task priority, due dates, or assignees
- Modify task description with new information or markdown formatting
- Update custom field values for project tracking

---

### Input Parameters

```json
{
  "taskId": {
    "type": "string",
    "required": false,
    "description": "ID of task to update (preferred). Automatically detects and handles both regular task IDs (9 characters) and custom IDs (like 'DEV-1234', 'PROJ-456')",
    "example": "86fpd7vgc" or "DEV-1234"
  },
  "taskName": {
    "type": "string",
    "required": false,
    "description": "Name of task to update. The tool will search for tasks with this name across all lists unless listName is specified",
    "example": "Deploy production release"
  },
  "listName": {
    "type": "string",
    "required": false,
    "description": "Optional: Name of list containing the task. Providing this narrows the search to a specific list, improving performance and reducing ambiguity",
    "example": "Sprint Backlog"
  },
  "name": {
    "type": "string",
    "required": false,
    "description": "New name for the task. Include emoji prefix if appropriate",
    "example": "🚀 Deploy production release v2.0"
  },
  "description": {
    "type": "string",
    "required": false,
    "description": "New plain text description. Will be ignored if markdown_description is provided",
    "example": "Deploy updated authentication feature"
  },
  "markdown_description": {
    "type": "string",
    "required": false,
    "description": "New markdown description. Takes precedence over plain text description",
    "example": "## Deployment\n- Update config\n- Run migrations\n- Deploy code"
  },
  "status": {
    "type": "string",
    "required": false,
    "description": "New status. Must be valid for the task's current list",
    "example": "In Progress"
  },
  "priority": {
    "type": "string",
    "required": false,
    "description": "New priority: 1 (urgent) to 4 (low). Set null to clear priority",
    "example": "1" or null
  },
  "dueDate": {
    "type": "string",
    "required": false,
    "description": "New due date. Supports Unix timestamps (ms) or natural language like 'tomorrow', 'next week'",
    "example": "tomorrow at 5pm"
  },
  "startDate": {
    "type": "string",
    "required": false,
    "description": "New start date. Supports Unix timestamps (ms) or natural language",
    "example": "now"
  },
  "time_estimate": {
    "type": "string",
    "required": false,
    "description": "Time estimate for the task. For best compatibility with the ClickUp API, use a numeric value in minutes (e.g., '150' for 2h 30m)",
    "example": "150"
  },
  "custom_fields": {
    "type": "array",
    "required": false,
    "description": "Array of custom field values to set. Each object must have an 'id' and 'value' property",
    "example": [{"id": "field_123", "value": "Updated"}]
  },
  "assignees": {
    "type": "array",
    "required": false,
    "description": "Array of assignee user IDs (numbers), emails, or usernames to assign to the task",
    "example": [12345678, "john@example.com"]
  }
}
```

**Parameter Details**:
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| taskId | string | No* | Task ID (regular or custom, preferred) | `"86fpd7vgc"` or `"DEV-1234"` |
| taskName | string | No* | Task name for search | `"Deploy production"` |
| listName | string | No | List name (improves taskName search) | `"Sprint Backlog"` |
| name | string | No** | New task name | `"🚀 Deploy v2.0"` |
| description | string | No** | New plain text description | `"Updated deployment"` |
| markdown_description | string | No** | New markdown description | `"## Steps\n- Test\n- Deploy"` |
| status | string | No** | New status | `"In Progress"` |
| priority | string/null | No** | New priority (1-4 or null) | `"1"` or `null` |
| dueDate | string | No** | New due date (timestamp or natural) | `"next Friday"` |
| startDate | string | No** | New start date | `"tomorrow"` |
| time_estimate | string | No** | Time estimate in minutes | `"150"` |
| custom_fields | array | No** | Custom field values | `[{"id": "f1", "value": "Val"}]` |
| assignees | array | No** | User IDs, emails, or usernames | `[123, "user@email.com"]` |

*Note: Either `taskId` OR `taskName` is REQUIRED (at least one must be provided)
**Note: At least ONE update field must be provided (name, description, status, priority, etc.)

---

### Returns

**Success Response** (when `ENABLE_DEBUG=false`):
```json
{
  "success": true,
  "data": {
    "id": "86fpd7vgc",
    "custom_id": "DEV-1234",
    "name": "🚀 Deploy production release v2.0",
    "text_content": "## Deployment Steps\n- Update configuration\n- Run migrations\n- Deploy code",
    "status": {
      "id": "p90110026556_abc123",
      "status": "In Progress",
      "color": "#4194f6",
      "orderindex": 1,
      "type": "custom"
    },
    "priority": {
      "id": "1",
      "priority": "urgent",
      "color": "#f50000",
      "orderindex": "1"
    },
    "due_date": "1705660800000",
    "start_date": "1705575000000",
    "time_estimate": 9000000,
    "assignees": [
      {
        "id": 12345678,
        "username": "John Doe",
        "email": "john@example.com"
      }
    ],
    "custom_fields": [
      {
        "id": "field_123",
        "name": "Environment",
        "value": "Production"
      }
    ],
    "date_updated": "1705580000000",
    "url": "https://app.clickup.com/t/86fpd7vgc"
  },
  "metadata": {
    "timestamp": "2025-01-18T10:30:00.000Z",
    "tool_name": "update_task",
    "execution_time_ms": 180,
    "rate_limit": {
      "remaining": 98,
      "limit": 100,
      "reset_at": 1705575000000
    }
  }
}
```

**Success Response** (when `ENABLE_DEBUG=true`):
```json
{
  "success": true,
  "data": {
    "id": "86fpd7vgc",
    "name": "🚀 Deploy production release v2.0",
    "status": {"status": "In Progress"},
    "priority": {"priority": "urgent"},
    "url": "https://app.clickup.com/t/86fpd7vgc"
  },
  "metadata": {
    "timestamp": "2025-01-18T10:30:00.000Z",
    "tool_name": "update_task",
    "execution_time_ms": 180,
    "rate_limit": {
      "remaining": 98,
      "limit": 100,
      "reset_at": 1705575000000
    },
    "debug": {
      "request_id": "b8c4d5e1",
      "tool_name": "update_task",
      "timing": {
        "total_ms": 180,
        "api_calls": [
          {
            "method": "GET",
            "path": "/list/{id}/task",
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
| data.id | string | Unique task ID (unchanged) |
| data.name | string | Updated task name |
| data.status | object | Updated status with color |
| data.priority | object | Updated priority level |
| data.due_date | string | Updated due date timestamp |
| data.assignees | array | Updated assignee list |
| data.custom_fields | array | Updated custom field values |
| data.date_updated | string | Timestamp of this update |
| metadata.execution_time_ms | number | Update operation time |
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
    "suggested_action": "Provide either a taskId or taskName to identify the task you want to update."
  }
}
```

**2. VALIDATION (No Update Fields)**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "At least one update field must be provided",
    "type": "VALIDATION",
    "details": {
      "allowed_fields": ["name", "description", "status", "priority", "dueDate", "assignees", "custom_fields"]
    },
    "suggested_action": "Provide at least one field to update (e.g., status, priority, due date)."
  }
}
```

**3. VALIDATION (Invalid Status)**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_STATUS",
    "message": "Status 'Deployed' is not valid for this list. Valid statuses: To Do, In Progress, Complete",
    "type": "VALIDATION",
    "details": {
      "attempted_status": "Deployed",
      "valid_statuses": ["To Do", "In Progress", "Complete"]
    },
    "suggested_action": "Use one of the valid status values for this list. Use get_task to see available statuses."
  }
}
```

**4. NOT_FOUND**
```json
{
  "success": false,
  "error": {
    "code": "TASK_NOT_FOUND",
    "message": "Task 'Deploy production' not found",
    "type": "NOT_FOUND",
    "suggested_action": "Verify the task name is correct. Provide listName parameter to narrow the search."
  }
}
```

**5. AUTH**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Insufficient permissions to update this task",
    "type": "AUTH",
    "suggested_action": "Ensure your API key has permission to edit tasks in this list."
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
    "suggested_action": "Wait 30 seconds before retrying. Consider using update_bulk_tasks for updating multiple tasks."
  }
}
```

**Error Type Summary**:
| Error Type | HTTP Status | Retryable | Description |
|------------|-------------|-----------|-------------|
| VALIDATION | 400 | No | Invalid parameters or invalid status value |
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
- Use `update_bulk_tasks` when updating 3 or more tasks at once
- Provide `taskId` instead of `taskName` to reduce API calls
- Batch multiple property updates in a single call rather than multiple calls
- Monitor `rate_limit.remaining` in response metadata

---

### API Dependencies

**ClickUp API Endpoints Called**:
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/list/{list_id}/task` | Search for task by name (if taskName provided) |
| PUT | `/task/{task_id}` | Update the task properties |

**Required Permissions**:
- **Task Update**: API key must have permission to edit tasks in the target list
- **Status Change**: Permission to change task statuses
- **Custom Fields**: Write permissions for custom fields (if updating)
- **Assignees**: Permission to manage task assignees

**API Documentation**:
- [ClickUp API Reference - Update Task](https://clickup.com/api/clickupreference/operation/UpdateTask)

---

### Examples

#### Example 1: Update Task Status
```javascript
// Input
{
  "taskId": "86fpd7vgc",
  "status": "In Progress"
}

// Output
{
  "success": true,
  "data": {
    "id": "86fpd7vgc",
    "name": "🚀 Deploy production release",
    "status": {
      "status": "In Progress",
      "color": "#4194f6"
    },
    "date_updated": "1705580000000"
  }
}
```

#### Example 2: Update Multiple Properties
```javascript
// Input
{
  "taskId": "DEV-1234",
  "priority": "1",
  "dueDate": "tomorrow at 5pm",
  "assignees": ["john@example.com", "jane@example.com"],
  "status": "In Progress"
}

// Output
{
  "success": true,
  "data": {
    "id": "86fpd7vgc",
    "custom_id": "DEV-1234",
    "name": "🐛 Fix authentication bug",
    "status": {"status": "In Progress"},
    "priority": {"priority": "urgent", "color": "#f50000"},
    "due_date": "1705660800000",
    "assignees": [
      {"username": "John Doe", "email": "john@example.com"},
      {"username": "Jane Smith", "email": "jane@example.com"}
    ]
  }
}
```

#### Example 3: Update Custom Fields
```javascript
// Input
{
  "taskName": "Deploy production release",
  "listName": "Sprint Backlog",
  "custom_fields": [
    {"id": "field_environment", "value": "Production"},
    {"id": "field_version", "value": "v2.1.0"}
  ]
}

// Output
{
  "success": true,
  "data": {
    "id": "86fpd7vgc",
    "name": "🚀 Deploy production release",
    "custom_fields": [
      {"name": "Environment", "value": "Production"},
      {"name": "Version", "value": "v2.1.0"}
    ]
  }
}
```

#### Example 4: Update Description with Markdown
```javascript
// Input
{
  "taskId": "86fpd7vgc",
  "markdown_description": "## Deployment Checklist\n\n- [x] Run tests\n- [x] Build assets\n- [ ] Deploy to staging\n- [ ] Deploy to production"
}

// Output
{
  "success": true,
  "data": {
    "id": "86fpd7vgc",
    "name": "🚀 Deploy production release",
    "text_content": "## Deployment Checklist\n\n- [x] Run tests\n- [x] Build assets\n- [ ] Deploy to staging\n- [ ] Deploy to production"
  }
}
```

---

### Integration Examples

#### Python
```python
from mcp import Client

client = Client()

# Update task status and priority
response = client.call_tool(
    "update_task",
    {
        "taskId": "86fpd7vgc",
        "status": "Complete",
        "priority": None,  # Clear priority
        "dueDate": None    # Clear due date
    }
)

if response["success"]:
    task = response["data"]
    print(f"Task updated: {task['name']}")
    print(f"New status: {task['status']['status']}")
    print(f"Updated at: {task['date_updated']}")

    # Monitor rate limit
    rate_limit = response["metadata"]["rate_limit"]
    if rate_limit["remaining"] < 20:
        print(f"Warning: Only {rate_limit['remaining']} requests remaining")
else:
    error = response["error"]
    print(f"Error ({error['type']}): {error['message']}")

    if error["type"] == "VALIDATION" and "valid_statuses" in error.get("details", {}):
        print("Valid statuses:", error["details"]["valid_statuses"])
```

#### TypeScript
```typescript
import { Client } from '@modelcontextprotocol/sdk/client';

const client = new Client();

// Update task with custom fields and assignees
const response = await client.callTool('update_task', {
  taskId: 'DEV-1234',
  status: 'In Progress',
  assignees: ['john@example.com', 87654321],
  custom_fields: [
    { id: 'field_priority_score', value: 95 },
    { id: 'field_sprint', value: 'Sprint 24' }
  ],
  time_estimate: '240'  // 4 hours in minutes
});

if (response.success) {
  const task = response.data;
  console.log(`Updated: ${task.name}`);
  console.log(`Status: ${task.status.status}`);
  console.log(`Assignees: ${task.assignees.map(a => a.username).join(', ')}`);

  // Log execution time for performance monitoring
  const execTime = response.metadata.execution_time_ms;
  console.log(`Operation completed in ${execTime}ms`);
} else {
  const error = response.error;
  console.error(`Error: ${error.message}`);
  console.error(`Suggested action: ${error.suggested_action}`);
}
```

---

### Related Tools

- **get_task**: Retrieve current task details before updating
- **create_task**: Create a new task instead of updating
- **update_bulk_tasks**: Update multiple tasks at once (more efficient for batch operations)
- **move_task**: Move task to a different list
- **delete_task**: Permanently remove the task

---

### Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.1.0 | 2025-01-18 | Added debug metadata support (Phase 5) |
| 1.0.0 | 2025-01-15 | Added automatic retry with telemetry (Phase 4) |
| 0.9.0 | 2025-01-10 | Added support for clearing fields with null values |
| 0.8.0 | 2025-01-05 | Initial tool implementation |

---

**Last Updated**: 2025-01-18
**Status**: Production-ready - Part of 72-tool comprehensive suite
