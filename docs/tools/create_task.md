# Tool Documentation: `create_task`

**Category**: Task Management

**Description**: Creates a single task in a ClickUp list with comprehensive options for name, description, status, priority, dates, assignees, tags, and custom fields. Supports both regular tasks and subtasks.

**Use Cases**:
- Create a new task with basic information (name, description, due date)
- Create a task with custom fields for project-specific data tracking
- Create a subtask by specifying a parent task ID
- Create a task with assignees, priorities, and tags for team collaboration

---

### Input Parameters

```json
{
  "name": {
    "type": "string",
    "required": true,
    "description": "Name of the task. Put a relevant emoji followed by a blank space before the name",
    "example": "🚀 Deploy production release"
  },
  "listId": {
    "type": "string | number",
    "required": false,
    "description": "ID of the list to create the task in (preferred if available)",
    "example": "901234567"
  },
  "listName": {
    "type": "string",
    "required": false,
    "description": "Name of the list to create the task in - will automatically find the list by name",
    "example": "Sprint Backlog"
  },
  "description": {
    "type": "string",
    "required": false,
    "description": "Optional plain text description for the task",
    "example": "Deploy the new authentication feature to production environment"
  },
  "markdown_description": {
    "type": "string",
    "required": false,
    "description": "Optional markdown formatted description (takes precedence over plain description)",
    "example": "## Deployment Steps\n1. Run tests\n2. Build assets\n3. Deploy to production"
  },
  "status": {
    "type": "string",
    "required": false,
    "description": "Override the default ClickUp status (use ClickUp defaults unless explicitly requested)",
    "example": "In Progress"
  },
  "priority": {
    "type": "number",
    "required": false,
    "description": "Priority of the task (1-4), where 1 is urgent/highest priority and 4 is lowest priority",
    "example": 1
  },
  "dueDate": {
    "type": "string",
    "required": false,
    "description": "Due date. Supports Unix timestamps (ms) or natural language like 'tomorrow', 'next week', '1 hour from now'",
    "example": "tomorrow at 5pm"
  },
  "startDate": {
    "type": "string",
    "required": false,
    "description": "Start date. Supports Unix timestamps (ms) or natural language expressions",
    "example": "now"
  },
  "parent": {
    "type": "string",
    "required": false,
    "description": "ID of the parent task. When specified, this task will be created as a subtask",
    "example": "86fpd7vgc"
  },
  "tags": {
    "type": "array",
    "required": false,
    "description": "Array of tag names to assign (tags must already exist in the space)",
    "example": ["frontend", "high-priority"]
  },
  "custom_fields": {
    "type": "array",
    "required": false,
    "description": "Array of custom field values. Each object must have an 'id' and 'value' property",
    "example": [{"id": "field_123", "value": "Production"}]
  },
  "assignees": {
    "type": "array",
    "required": false,
    "description": "Array of assignee user IDs (numbers), emails, or usernames",
    "example": [12345678, "john@example.com", "jane_dev"]
  }
}
```

**Parameter Details**:
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| name | string | Yes | Task name with emoji prefix | `"🚀 Deploy production release"` |
| listId | string/number | No* | List ID (preferred if available) | `"901234567"` |
| listName | string | No* | List name (alternative to listId) | `"Sprint Backlog"` |
| description | string | No | Plain text description | `"Deploy new feature"` |
| markdown_description | string | No | Markdown description (takes precedence) | `"## Steps\n1. Test\n2. Deploy"` |
| status | string | No | Task status (uses list default if omitted) | `"In Progress"` |
| priority | number | No | Priority 1-4 (1=urgent, 4=low) | `1` |
| dueDate | string | No | Due date (timestamp or natural language) | `"tomorrow at 5pm"` |
| startDate | string | No | Start date (timestamp or natural language) | `"now"` |
| parent | string | No | Parent task ID (creates subtask) | `"86fpd7vgc"` |
| tags | array | No | Tag names (must exist in space) | `["frontend", "urgent"]` |
| custom_fields | array | No | Custom field values | `[{"id": "field_123", "value": "Value"}]` |
| assignees | array | No | User IDs, emails, or usernames | `[12345678, "user@email.com"]` |

*Note: Either `listId` OR `listName` is REQUIRED (at least one must be provided)

---

### Returns

**Success Response** (when `ENABLE_DEBUG=false`):
```json
{
  "success": true,
  "data": {
    "id": "86fpd7vgc",
    "custom_id": null,
    "name": "🚀 Deploy production release",
    "text_content": "Deploy the new authentication feature to production environment",
    "description": "Deploy the new authentication feature to production environment",
    "status": {
      "id": "p90110026556_VlN8IJtk",
      "status": "To Do",
      "color": "#d3d3d3",
      "orderindex": 0,
      "type": "open"
    },
    "orderindex": "1.00000000000000000000000000000000",
    "date_created": "1705575000000",
    "date_updated": "1705575000000",
    "date_closed": null,
    "date_done": null,
    "archived": false,
    "creator": {
      "id": 12345678,
      "username": "John Doe",
      "email": "john@example.com"
    },
    "assignees": [
      {
        "id": 12345678,
        "username": "John Doe",
        "email": "john@example.com"
      }
    ],
    "watchers": [],
    "checklists": [],
    "tags": ["frontend", "high-priority"],
    "parent": null,
    "priority": {
      "id": "1",
      "priority": "urgent",
      "color": "#f50000",
      "orderindex": "1"
    },
    "due_date": "1705660800000",
    "start_date": "1705575000000",
    "points": null,
    "time_estimate": null,
    "time_spent": 0,
    "custom_fields": [
      {
        "id": "field_123",
        "name": "Environment",
        "type": "drop_down",
        "value": "Production"
      }
    ],
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
    "tool_name": "create_task",
    "execution_time_ms": 245,
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
    "name": "🚀 Deploy production release",
    "status": {
      "status": "To Do",
      "color": "#d3d3d3"
    },
    "priority": {
      "priority": "urgent",
      "color": "#f50000"
    },
    "due_date": "1705660800000",
    "url": "https://app.clickup.com/t/86fpd7vgc"
  },
  "metadata": {
    "timestamp": "2025-01-18T10:30:00.000Z",
    "tool_name": "create_task",
    "execution_time_ms": 245,
    "rate_limit": {
      "remaining": 98,
      "limit": 100,
      "reset_at": 1705575000000
    },
    "debug": {
      "request_id": "a7b3c9d2",
      "tool_name": "create_task",
      "timing": {
        "total_ms": 245,
        "api_calls": [
          {
            "method": "GET",
            "path": "/team/{id}/space/{id}/folder/{id}/list",
            "duration": 95,
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
        "total_api_time_ms": 245,
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
| data.id | string | Unique task ID (9 characters) |
| data.name | string | Task name |
| data.status | object | Current status with color |
| data.priority | object | Priority level with color |
| data.due_date | string | Due date timestamp (milliseconds) |
| data.assignees | array | Array of assigned users |
| data.tags | array | Array of tag names |
| data.custom_fields | array | Array of custom field values |
| data.url | string | Direct link to task in ClickUp |
| metadata.timestamp | string | ISO 8601 timestamp of operation completion |
| metadata.tool_name | string | Name of the tool that generated the response |
| metadata.execution_time_ms | number | Total execution time in milliseconds |
| metadata.rate_limit | object | Current rate limit status |
| metadata.debug | object | Debug information (only when ENABLE_DEBUG=true) |

---

### Error Types

This tool may return the following errors:

**1. VALIDATION**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "A task name is required",
    "type": "VALIDATION",
    "details": {
      "parameter": "name",
      "issue": "missing_required_field"
    },
    "suggested_action": "Provide a task name. Task name cannot be empty or only whitespace."
  }
}
```

**2. VALIDATION (Missing List)**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "Either listId or listName must be provided",
    "type": "VALIDATION",
    "details": {
      "parameters": ["listId", "listName"],
      "issue": "missing_required_field"
    },
    "suggested_action": "Provide either a listId or listName to identify where the task should be created."
  }
}
```

**3. NOT_FOUND**
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

**4. AUTH**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid API key or insufficient permissions",
    "type": "AUTH",
    "suggested_action": "Check your CLICKUP_API_KEY environment variable and ensure the API key has permission to create tasks in this list."
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
    "suggested_action": "Wait 30 seconds before retrying. Consider using create_bulk_tasks for creating multiple tasks."
  }
}
```

**6. API_ERROR**
```json
{
  "success": false,
  "error": {
    "code": "SERVER_ERROR",
    "message": "ClickUp API returned 500: Internal Server Error",
    "type": "API_ERROR",
    "suggested_action": "This is a temporary ClickUp API issue. Retry the request after a short delay."
  }
}
```

**Error Type Summary**:
| Error Type | HTTP Status | Retryable | Description |
|------------|-------------|-----------|-------------|
| VALIDATION | 400 | No | Invalid input parameters or missing required fields |
| NOT_FOUND | 404 | No | List, parent task, or custom field not found |
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
4. Automatic throttling to prevent hitting rate limit

**Recommendations**:
- Use `create_bulk_tasks` when creating 3 or more tasks at once
- Provide `listId` instead of `listName` to reduce API calls
- Monitor `rate_limit.remaining` in response metadata
- Batch task creation operations during off-peak hours

---

### API Dependencies

**ClickUp API Endpoints Called**:
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/team/{team_id}/space` | Look up list by name (only if listName provided) |
| POST | `/list/{list_id}/task` | Create the task |

**Required Permissions**:
- **Task Create**: API key must have permission to create tasks in the target list
- **List Access**: Read access to the workspace hierarchy for list lookup by name
- **Custom Fields**: If setting custom fields, API key needs field write permissions

**API Documentation**:
- [ClickUp API Reference - Create Task](https://clickup.com/api/clickupreference/operation/CreateTask)

---

### Examples

#### Example 1: Basic Task Creation
```javascript
// Input
{
  "name": "🐛 Fix login button styling",
  "listName": "Bug Fixes",
  "description": "The login button on mobile has incorrect padding",
  "priority": 2,
  "dueDate": "tomorrow"
}

// Output
{
  "success": true,
  "data": {
    "id": "86fpd7vgc",
    "name": "🐛 Fix login button styling",
    "status": {
      "status": "To Do"
    },
    "priority": {
      "priority": "high"
    },
    "due_date": "1705660800000",
    "url": "https://app.clickup.com/t/86fpd7vgc"
  },
  "metadata": {
    "tool_name": "create_task",
    "execution_time_ms": 180,
    "rate_limit": {
      "remaining": 98,
      "limit": 100,
      "reset_at": 1705575000000
    }
  }
}
```

#### Example 2: Task with Custom Fields and Assignees
```javascript
// Input
{
  "name": "📊 Create quarterly sales report",
  "listId": "901234567",
  "description": "Compile Q1 sales data and create presentation",
  "priority": 1,
  "dueDate": "next Friday at 5pm",
  "assignees": ["john@example.com", 87654321],
  "tags": ["reporting", "quarterly"],
  "custom_fields": [
    {"id": "field_department", "value": "Sales"},
    {"id": "field_quarter", "value": "Q1 2025"}
  ]
}

// Output
{
  "success": true,
  "data": {
    "id": "abc123xyz",
    "name": "📊 Create quarterly sales report",
    "assignees": [
      {"id": 12345678, "username": "John Doe", "email": "john@example.com"},
      {"id": 87654321, "username": "Jane Smith"}
    ],
    "tags": ["reporting", "quarterly"],
    "custom_fields": [
      {"name": "Department", "value": "Sales"},
      {"name": "Quarter", "value": "Q1 2025"}
    ],
    "url": "https://app.clickup.com/t/abc123xyz"
  }
}
```

#### Example 3: Creating a Subtask
```javascript
// Input
{
  "name": "🔧 Update database schema",
  "listId": "901234567",
  "parent": "parent_task_id",
  "description": "Add new columns for user preferences"
}

// Output
{
  "success": true,
  "data": {
    "id": "subtask123",
    "name": "🔧 Update database schema",
    "parent": "parent_task_id",
    "url": "https://app.clickup.com/t/subtask123"
  }
}
```

#### Example 4: Natural Language Date Parsing
```javascript
// Input
{
  "name": "⏰ Schedule team meeting",
  "listName": "Meetings",
  "dueDate": "next Monday at 2pm",
  "startDate": "next Monday at 1:45pm"
}

// Output
{
  "success": true,
  "data": {
    "id": "meeting789",
    "name": "⏰ Schedule team meeting",
    "due_date": "1705936800000",
    "start_date": "1705935900000"
  }
}
```

---

### Integration Examples

#### Python
```python
from mcp import Client

client = Client()

# Create a task with natural language due date
response = client.call_tool(
    "create_task",
    {
        "name": "🚀 Deploy production release",
        "listName": "Sprint Backlog",
        "description": "Deploy authentication feature to production",
        "priority": 1,
        "dueDate": "tomorrow at 5pm",
        "assignees": ["john@example.com"],
        "tags": ["deployment", "production"]
    }
)

if response["success"]:
    task = response["data"]
    print(f"Task created: {task['name']}")
    print(f"Task ID: {task['id']}")
    print(f"URL: {task['url']}")

    # Check rate limit
    rate_limit = response["metadata"]["rate_limit"]
    print(f"Rate limit remaining: {rate_limit['remaining']}/{rate_limit['limit']}")
else:
    error = response["error"]
    print(f"Error: {error['message']}")
    print(f"Suggested action: {error['suggested_action']}")
```

#### TypeScript
```typescript
import { Client } from '@modelcontextprotocol/sdk/client';

const client = new Client();

// Create a task with custom fields
const response = await client.callTool('create_task', {
  name: '📊 Analyze user metrics',
  listId: '901234567',
  markdown_description: '## Analysis Tasks\n1. Collect data\n2. Generate report\n3. Present findings',
  priority: 2,
  dueDate: 'next week',
  custom_fields: [
    { id: 'field_department', value: 'Analytics' },
    { id: 'field_complexity', value: 'Medium' }
  ],
  assignees: [12345678, 'analyst@company.com']
});

if (response.success) {
  const task = response.data;
  console.log(`Task created: ${task.name}`);
  console.log(`Custom fields:`, task.custom_fields);

  // Monitor rate limit
  const rateLimit = response.metadata.rate_limit;
  if (rateLimit.remaining < 10) {
    console.warn('Rate limit running low:', rateLimit.remaining);
  }
} else {
  const error = response.error;
  console.error(`Error: ${error.message}`);

  if (error.type === 'RATE_LIMIT') {
    console.log(`Retry after ${error.retry_after} seconds`);
  }
}
```

---

### Related Tools

- **update_task**: Modify properties of an existing task
- **get_task**: Retrieve full details of a task by ID or name
- **create_bulk_tasks**: Create multiple tasks at once (more efficient for batch operations)
- **delete_task**: Permanently remove a task
- **get_workspace_hierarchy**: View all lists available for task creation

---

### Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.1.0 | 2025-01-18 | Added debug metadata support (Phase 5) |
| 1.0.0 | 2025-01-15 | Added automatic retry with telemetry (Phase 4) |
| 0.9.0 | 2025-01-10 | Initial tool implementation with natural language date parsing |

---

**Last Updated**: 2025-01-18
**Status**: Production-ready - Part of 72-tool comprehensive suite
