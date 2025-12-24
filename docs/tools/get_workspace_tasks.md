# get_workspace_tasks

**Category**: Task Management - Workspace Querying

Retrieve tasks from across the entire workspace with powerful filtering options including tags, lists, folders, spaces, statuses, assignees, dates, and custom fields. Unlike `get_tasks` which searches within a single list, this tool provides workspace-wide access with sophisticated filtering and pagination.

---

## Use Cases

### 1. **Cross-List Tag-Based Organization**
Find all tasks with specific tags across your entire workspace, regardless of which list they're in. Perfect for tracking projects, priorities, or blockers that span multiple lists.

### 2. **Advanced Multi-Criteria Filtering**
Combine multiple filters (tags + statuses + assignees + date ranges) to create precise queries. For example: "All high-priority tasks assigned to John that are in progress and due this week."

### 3. **Workspace-Wide Task Discovery**
Search across all spaces, folders, and lists to find tasks matching your criteria. Includes support for archived and closed lists when needed.

### 4. **Comprehensive Task Analysis with Subtasks**
Retrieve detailed task information including subtasks, custom fields, time entries, and all metadata for reporting and analysis purposes.

---

## Input Parameters

```json
{
  "tags": ["project-x", "blocker"],
  "statuses": ["In Progress", "To Do"],
  "assignees": ["12345678"],
  "due_date_lt": 1736035199000,
  "order_by": "due_date",
  "detail_level": "summary",
  "page": 0
}
```

### Parameter Reference

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tags` | array[string] | Conditional* | Filter tasks by tag names. Only tasks with ALL specified tags will be returned. |
| `list_ids` | array[string] | Conditional* | Filter tasks by list IDs. Uses ClickUp Views API to include tasks associated with specified lists (not just created in them). |
| `folder_ids` | array[string] | Conditional* | Filter tasks by folder IDs. Narrows search to specific folders. |
| `space_ids` | array[string] | Conditional* | Filter tasks by space IDs. Narrows search to specific spaces. |
| `statuses` | array[string] | Conditional* | Filter tasks by status names (e.g., ["To Do", "In Progress"]). |
| `assignees` | array[string] | Conditional* | Filter tasks by assignee user IDs. |
| `date_created_gt` | number | Optional | Filter for tasks created after this Unix timestamp (milliseconds). |
| `date_created_lt` | number | Optional | Filter for tasks created before this Unix timestamp (milliseconds). |
| `date_updated_gt` | number | Optional | Filter for tasks updated after this Unix timestamp (milliseconds). |
| `date_updated_lt` | number | Optional | Filter for tasks updated before this Unix timestamp (milliseconds). |
| `due_date_gt` | number | Optional | Filter for tasks with due date greater than this timestamp (milliseconds). |
| `due_date_lt` | number | Optional | Filter for tasks with due date less than this timestamp (milliseconds). |
| `include_closed` | boolean | Optional | Include closed tasks in results. Default: false. |
| `include_archived_lists` | boolean | Optional | Include tasks from archived lists. Default: false. |
| `include_closed_lists` | boolean | Optional | Include tasks from closed lists. Default: false. |
| `archived` | boolean | Optional | Include archived tasks. Default: false. |
| `order_by` | string | Optional | Sort field: "id", "created", "updated", or "due_date". |
| `reverse` | boolean | Optional | Reverse sort order (descending). Default: false (ascending). |
| `page` | number | Optional | Page number for pagination (0-based). Default: 0. |
| `detail_level` | string | Optional | Level of detail: "summary" (lightweight) or "detailed" (full task data). Default: "detailed". |
| `subtasks` | boolean | Optional | Include subtasks matching filters in response. Default: false. |
| `include_subtasks` | boolean | Optional | Alternative parameter for including subtasks (legacy support). |
| `include_compact_time_entries` | boolean | Optional | Include compact time entry data. Default: false. |
| `custom_fields` | object | Optional | Filter by custom field values. Key-value pairs where keys are custom field IDs. |

\* **Filter Requirement**: At least one filter parameter is REQUIRED (tags, list_ids, folder_ids, space_ids, statuses, assignees, or date filters). Pagination parameters alone (page, order_by, reverse) are not considered filters.

**⚠️ Important Notes**:
- **Responses exceeding 50,000 tokens** automatically switch to summary format to avoid LLM token limits
- **Subtasks filtering**: When `subtasks=true`, subtasks must still match your other filter criteria to appear in results. To see all subtasks of a specific task regardless of filters, use `get_task` with `subtasks=true` instead.
- **Enhanced list filtering**: When list_ids provided, tool leverages ClickUp's Views API to include tasks associated with specified lists (not just originally created in them)

---

## Success Response

### Summary Format

```json
{
  "success": true,
  "tasks": [
    {
      "id": "86fpd7vgc",
      "custom_id": "DEV-1234",
      "name": "Implement user authentication",
      "status": {
        "status": "In Progress",
        "color": "#d3d3d3",
        "type": "open"
      },
      "list": {
        "id": "901234567",
        "name": "Backend Tasks"
      },
      "tags": [
        {
          "name": "project-x",
          "tag_fg": "#ffffff",
          "tag_bg": "#ff0000"
        },
        {
          "name": "blocker",
          "tag_fg": "#ffffff",
          "tag_bg": "#ffa500"
        }
      ]
    },
    {
      "id": "abc123xyz",
      "custom_id": null,
      "name": "Fix login bug",
      "status": {
        "status": "To Do",
        "color": "#f9d900",
        "type": "open"
      },
      "list": {
        "id": "901234568",
        "name": "Bug Fixes"
      },
      "tags": [
        {
          "name": "project-x",
          "tag_fg": "#ffffff",
          "tag_bg": "#ff0000"
        }
      ]
    }
  ],
  "count": 2,
  "detail_level": "summary"
}
```

### Detailed Format

```json
{
  "success": true,
  "tasks": [
    {
      "id": "86fpd7vgc",
      "custom_id": "DEV-1234",
      "name": "Implement user authentication",
      "description": "Add JWT-based authentication to the API",
      "markdown_description": "Add **JWT-based** authentication to the API",
      "status": {
        "status": "In Progress",
        "color": "#d3d3d3",
        "orderindex": 1,
        "type": "open"
      },
      "orderindex": "1.00000000000000000000000000000000",
      "date_created": "1704067200000",
      "date_updated": "1704153600000",
      "date_closed": null,
      "date_done": null,
      "archived": false,
      "creator": {
        "id": 12345678,
        "username": "john.smith",
        "color": "#7b68ee",
        "email": "john@example.com",
        "profilePicture": null
      },
      "assignees": [
        {
          "id": 12345678,
          "username": "john.smith",
          "color": "#7b68ee",
          "initials": "JS",
          "email": "john@example.com",
          "profilePicture": null
        }
      ],
      "watchers": [],
      "checklists": [],
      "tags": [
        {
          "name": "project-x",
          "tag_fg": "#ffffff",
          "tag_bg": "#ff0000",
          "creator": 12345678
        },
        {
          "name": "blocker",
          "tag_fg": "#ffffff",
          "tag_bg": "#ffa500",
          "creator": 12345678
        }
      ],
      "parent": null,
      "priority": {
        "id": "1",
        "priority": "urgent",
        "color": "#f50000",
        "orderindex": "1"
      },
      "due_date": "1736035199000",
      "start_date": null,
      "points": 5,
      "time_estimate": 14400000,
      "time_spent": 7200000,
      "custom_fields": [
        {
          "id": "field_123",
          "name": "Priority",
          "type": "drop_down",
          "type_config": {},
          "date_created": "1704067200000",
          "hide_from_guests": false,
          "value": "High",
          "required": false
        }
      ],
      "dependencies": [],
      "linked_tasks": [],
      "list": {
        "id": "901234567",
        "name": "Backend Tasks",
        "access": true
      },
      "folder": {
        "id": "90123456",
        "name": "Development",
        "hidden": false,
        "access": true
      },
      "space": {
        "id": "90123455"
      },
      "url": "https://app.clickup.com/t/86fpd7vgc"
    }
  ],
  "count": 1,
  "detail_level": "detailed"
}
```

### With Subtasks

```json
{
  "success": true,
  "tasks": [
    {
      "id": "86fpd7vgc",
      "name": "Implement user authentication",
      "status": {
        "status": "In Progress"
      },
      "subtasks": [
        {
          "id": "sub123abc",
          "name": "Set up JWT library",
          "status": {
            "status": "Complete"
          },
          "parent": "86fpd7vgc"
        },
        {
          "id": "sub456def",
          "name": "Create login endpoint",
          "status": {
            "status": "In Progress"
          },
          "parent": "86fpd7vgc"
        }
      ]
    }
  ],
  "count": 1
}
```

### Auto-Switch to Summary (Large Response)

```json
{
  "success": true,
  "tasks": [...],
  "count": 150,
  "detail_level": "summary",
  "note": "Response automatically switched to summary format due to large dataset (exceeds 50,000 tokens). To retrieve full details, narrow your filters or fetch tasks individually using get_task."
}
```

### With Debug Logging Enabled

```json
{
  "success": true,
  "tasks": [...],
  "count": 25,
  "debug": {
    "request_id": "req_1735948800123_abc123",
    "timestamp": "2025-01-03T18:00:00.123Z",
    "execution_time_ms": 1250,
    "filters_applied": {
      "tags": ["project-x", "blocker"],
      "statuses": ["In Progress"],
      "list_ids": ["901234567"]
    },
    "api_calls": [
      {
        "endpoint": "GET /team/90123455/task",
        "duration_ms": 980,
        "status": 200,
        "results_count": 25
      }
    ],
    "pagination": {
      "current_page": 0,
      "has_more": false
    }
  }
}
```

---

## Error Responses

### 1. VALIDATION - Missing Filters

**Scenario**: No filter parameters provided

```json
{
  "success": false,
  "error": {
    "type": "VALIDATION",
    "message": "At least one filter parameter is required. Provide tags, list_ids, folder_ids, space_ids, statuses, assignees, or date filters. Pagination parameters alone are not sufficient.",
    "timestamp": "2025-01-03T18:00:00.123Z"
  }
}
```

**Scenario**: Only pagination parameters provided

```json
{
  "success": false,
  "error": {
    "type": "VALIDATION",
    "message": "At least one filter parameter is required. Received only pagination parameters (page, order_by, reverse). Please add filtering criteria like tags, lists, or statuses.",
    "timestamp": "2025-01-03T18:00:00.123Z"
  }
}
```

### 2. VALIDATION - Invalid Parameter Values

**Scenario**: Invalid order_by value

```json
{
  "success": false,
  "error": {
    "type": "VALIDATION",
    "message": "Invalid order_by value: 'priority'. Must be one of: id, created, updated, due_date",
    "timestamp": "2025-01-03T18:00:00.123Z"
  }
}
```

**Scenario**: Invalid detail_level value

```json
{
  "success": false,
  "error": {
    "type": "VALIDATION",
    "message": "Invalid detail_level value: 'full'. Must be either 'summary' or 'detailed'",
    "timestamp": "2025-01-03T18:00:00.123Z"
  }
}
```

### 3. NOT_FOUND - Invalid Filter IDs

**Scenario**: Invalid list_ids

```json
{
  "success": false,
  "error": {
    "type": "NOT_FOUND",
    "message": "List not found: 999999999. Verify the list ID exists in your workspace.",
    "timestamp": "2025-01-03T18:00:00.123Z"
  }
}
```

**Scenario**: Invalid space_ids

```json
{
  "success": false,
  "error": {
    "type": "NOT_FOUND",
    "message": "Space not found: 888888888. Verify the space ID exists in your workspace.",
    "timestamp": "2025-01-03T18:00:00.123Z"
  }
}
```

### 4. AUTH - Permission Issues

**Scenario**: No access to specified workspace

```json
{
  "success": false,
  "error": {
    "type": "AUTH",
    "message": "You do not have permission to access workspace tasks. Verify your API key has the required scopes.",
    "timestamp": "2025-01-03T18:00:00.123Z"
  }
}
```

**Scenario**: No access to private lists

```json
{
  "success": false,
  "error": {
    "type": "AUTH",
    "message": "You do not have permission to access list 901234567. Request access from the list owner.",
    "timestamp": "2025-01-03T18:00:00.123Z"
  }
}
```

### 5. RATE_LIMIT - Too Many Requests

```json
{
  "success": false,
  "error": {
    "type": "RATE_LIMIT",
    "message": "Rate limit exceeded. Please wait before making more requests.",
    "retry_after": 3000,
    "timestamp": "2025-01-03T18:00:00.123Z"
  }
}
```

### 6. API_ERROR - ClickUp API Issues

```json
{
  "success": false,
  "error": {
    "type": "API_ERROR",
    "message": "ClickUp API error: Service temporarily unavailable. Please try again.",
    "timestamp": "2025-01-03T18:00:00.123Z"
  }
}
```

---

## Rate Limit Information

**Rate Limit Impact**: ~1-3% per execution depending on filters and result size

- **Free Forever Plan**: 100 requests/minute
- **Simple query** (few filters, small results): 1-2 requests (~1-2%)
- **Complex query** (multiple filters, pagination): 2-3 requests (~2-3%)

**Best Practices**:
- Use specific filters to reduce result size and API load
- Implement pagination for large datasets rather than fetching all at once
- Use `detail_level: "summary"` when full task data not needed
- Cache results when appropriate to avoid redundant queries
- Monitor rate limit headers and implement exponential backoff

---

## API Dependencies

### ClickUp API Endpoints Used

1. **Workspace Tasks Query**:
   - `GET /team/{teamId}/task` (with query parameters)
   - Required for: All workspace-wide task searches

2. **Views API** (when list_ids provided):
   - `GET /list/{listId}/view` (to include associated tasks)
   - Required for: Enhanced list filtering

### Required Permissions

- **Read Tasks**: Required to query workspace tasks
- **View Lists**: Required to access task details across lists
- **View Spaces**: Required when using space_ids filter
- **View Folders**: Required when using folder_ids filter

---

## Integration Examples

### Python Example - Tag-Based Search

```python
from mcp_client import MCPClient
from datetime import datetime, timedelta

async def find_blocked_tasks():
    """Find all tasks tagged as 'blocker' that are in progress"""
    client = MCPClient()

    response = await client.call_tool('get_workspace_tasks', {
        'tags': ['blocker'],
        'statuses': ['In Progress'],
        'detail_level': 'summary',  # Lightweight response
        'order_by': 'due_date',
        'reverse': False  # Ascending (earliest due dates first)
    })

    if response['success']:
        tasks = response['tasks']
        count = response['count']

        print(f"Found {count} blocked tasks in progress:\n")
        for task in tasks:
            due_date = datetime.fromtimestamp(int(task.get('due_date', 0)) / 1000)
            print(f"  - {task['name']}")
            print(f"    ID: {task.get('custom_id') or task['id']}")
            print(f"    List: {task['list']['name']}")
            print(f"    Due: {due_date.strftime('%Y-%m-%d')}")
            print()

        return tasks
    else:
        print(f"Error: {response['error']['message']}")
        return []

# Usage
await find_blocked_tasks()
```

### Python Example - Date Range Query

```python
from datetime import datetime, timedelta

async def get_overdue_tasks():
    """Get all overdue tasks across the workspace"""
    client = MCPClient()

    # Current time in milliseconds
    now_ms = int(datetime.now().timestamp() * 1000)

    response = await client.call_tool('get_workspace_tasks', {
        'due_date_lt': now_ms,  # Due date before now
        'statuses': ['To Do', 'In Progress'],  # Not completed
        'include_closed': False,  # Exclude closed tasks
        'order_by': 'due_date',
        'detail_level': 'summary'
    })

    if response['success']:
        tasks = response['tasks']
        count = response['count']

        print(f"⚠️  {count} overdue tasks found:\n")
        for task in tasks:
            due_date = datetime.fromtimestamp(int(task['due_date']) / 1000)
            days_overdue = (datetime.now() - due_date).days

            print(f"  - {task['name']}")
            print(f"    Due: {due_date.strftime('%Y-%m-%d')} ({days_overdue} days overdue)")
            print(f"    Status: {task['status']['status']}")
            print(f"    List: {task['list']['name']}")
            print()

        return tasks
    else:
        print(f"Error: {response['error']['message']}")
        return []

# Usage
await get_overdue_tasks()
```

### Python Example - Multi-Filter Query

```python
async def get_team_sprint_tasks(assignee_ids: list[str], sprint_tags: list[str]):
    """Get all tasks for a team's current sprint"""
    client = MCPClient()

    # One week from now
    week_from_now = int((datetime.now() + timedelta(weeks=1)).timestamp() * 1000)

    response = await client.call_tool('get_workspace_tasks', {
        'tags': sprint_tags,  # e.g., ['sprint-42', 'Q1-2025']
        'assignees': assignee_ids,  # Team member user IDs
        'due_date_lt': week_from_now,  # Due within next week
        'statuses': ['To Do', 'In Progress'],
        'detail_level': 'detailed',  # Full task details
        'subtasks': True,  # Include subtask progress
        'include_compact_time_entries': True  # Include time tracking
    })

    if response['success']:
        tasks = response['tasks']
        print(f"Sprint tasks for team ({len(tasks)} tasks):\n")

        for task in tasks:
            # Calculate progress
            total_subtasks = len(task.get('subtasks', []))
            completed_subtasks = len([
                st for st in task.get('subtasks', [])
                if st['status']['type'] == 'closed'
            ])

            progress = (completed_subtasks / total_subtasks * 100) if total_subtasks > 0 else 0

            print(f"  {task['name']}")
            print(f"    Progress: {progress:.0f}% ({completed_subtasks}/{total_subtasks} subtasks)")
            print(f"    Assignees: {', '.join([a['username'] for a in task['assignees']])}")
            print(f"    Time: {task.get('time_spent', 0) / 3600000:.1f}h / {task.get('time_estimate', 0) / 3600000:.1f}h")
            print()

        return tasks
    else:
        print(f"Error: {response['error']['message']}")
        return []

# Usage
await get_team_sprint_tasks(
    assignee_ids=['12345678', '87654321'],
    sprint_tags=['sprint-42', 'backend']
)
```

### TypeScript Example - Paginated Query

```typescript
import { MCPClient } from 'mcp-client';

interface WorkspaceTask {
  id: string;
  name: string;
  status: { status: string };
  list: { id: string; name: string };
  tags: Array<{ name: string }>;
}

async function getAllTasksWithTag(tagName: string): Promise<WorkspaceTask[]> {
  const client = new MCPClient();
  const allTasks: WorkspaceTask[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const response = await client.callTool('get_workspace_tasks', {
      tags: [tagName],
      detail_level: 'summary',
      page: page,
      order_by: 'created',
      reverse: true  // Newest first
    });

    if (!response.success) {
      throw new Error(response.error.message);
    }

    const tasks = response.tasks;
    allTasks.push(...tasks);

    // Check if there are more pages
    // If we got fewer than expected per page, we're done
    hasMore = tasks.length >= 100;  // ClickUp default page size
    page++;

    console.log(`Fetched page ${page}: ${tasks.length} tasks (total: ${allTasks.length})`);
  }

  return allTasks;
}

// Usage
const projectTasks = await getAllTasksWithTag('project-x');
console.log(`Total tasks with 'project-x' tag: ${projectTasks.length}`);
```

### TypeScript Example - Custom Field Filtering

```typescript
async function getTasksByCustomField(
  fieldId: string,
  fieldValue: string
) {
  const client = new MCPClient();

  const response = await client.callTool('get_workspace_tasks', {
    custom_fields: {
      [fieldId]: fieldValue
    },
    detail_level: 'detailed',
    order_by: 'updated',
    reverse: true
  });

  if (response.success) {
    const tasks = response.tasks;

    console.log(`Found ${tasks.length} tasks with ${fieldId} = ${fieldValue}:\n`);
    tasks.forEach((task: any) => {
      const customField = task.custom_fields.find((cf: any) => cf.id === fieldId);
      console.log(`  - ${task.name}`);
      console.log(`    Custom Field: ${customField?.name} = ${customField?.value}`);
      console.log(`    Status: ${task.status.status}`);
      console.log();
    });

    return tasks;
  } else {
    throw new Error(response.error.message);
  }
}

// Usage - Find all tasks with Priority = "High"
await getTasksByCustomField('field_123', 'High');
```

---

## Related Tools

- **`get_tasks`** - Get tasks from a specific list (simpler, list-scoped alternative)
- **`get_task`** - Get single task with full details including all subtasks regardless of filters
- **`create_task`** - Create task after discovering workspace structure
- **`update_task`** - Update tasks found via workspace query
- **`add_tag_to_task`** - Add tags to tasks for better organization and filtering
- **`get_workspace_members`** - Get assignee IDs for assignees filter
- **`get_workspace_hierarchy`** - Get list_ids, folder_ids, and space_ids for filtering

---

## Best Practices

### DO:
- ✅ **Always include at least one filter** - Pagination alone is not sufficient
- ✅ **Use specific filters to narrow results** - Reduces API load and improves performance
- ✅ **Use summary format for large queries** - Saves tokens and improves response time
- ✅ **Implement pagination for large datasets** - Don't try to fetch 1000+ tasks at once
- ✅ **Combine filters for precise queries** - tags + statuses + assignees = exact results
- ✅ **Use tag-based organization** - Tags enable cross-list searches and organization
- ✅ **Cache results when appropriate** - Avoid redundant queries for same filters
- ✅ **Use order_by and reverse for sorted results** - Client-side sorting is more efficient
- ✅ **Check count before processing** - Handle empty results gracefully
- ✅ **Use detail_level wisely** - summary for counts/listings, detailed for full data

### DON'T:
- ❌ **Don't query without filters** - Will fail validation
- ❌ **Don't fetch all tasks at once** - Use pagination for large datasets
- ❌ **Don't use detailed format unnecessarily** - summary is faster and uses fewer tokens
- ❌ **Don't ignore token limits** - Large detailed responses may exceed LLM limits
- ❌ **Don't poll too frequently** - Respect rate limits and cache results
- ❌ **Don't ignore pagination** - ClickUp may limit results per page
- ❌ **Don't forget to handle empty results** - Not all filters will match tasks
- ❌ **Don't use subtasks=true for all subtasks** - Use get_task instead for complete subtask trees
- ❌ **Don't assume list_ids are exhaustive** - Enhanced filtering may include associated tasks
- ❌ **Don't ignore detail_level auto-switching** - Large responses switch to summary automatically

---

## Performance Tips

### 1. Start with Specific Filters

```python
# ❌ BAD: Broad query returning thousands of tasks
response = await client.call_tool('get_workspace_tasks', {
    'space_ids': ['90123455'],  # Entire space
    'detail_level': 'detailed'  # Heavy response
})

# ✅ GOOD: Narrow query with specific criteria
response = await client.call_tool('get_workspace_tasks', {
    'space_ids': ['90123455'],
    'list_ids': ['901234567', '901234568'],  # Specific lists
    'statuses': ['In Progress'],  # Active work only
    'detail_level': 'summary',  # Lightweight
    'page': 0
})
```

### 2. Use Summary Format for Large Queries

```typescript
// ✅ GOOD: Summary for counting and listing
const response = await client.callTool('get_workspace_tasks', {
  tags: ['project-x'],
  detail_level: 'summary'  // Fast, lightweight
});

console.log(`Found ${response.count} tasks`);

// Then fetch detailed data only for tasks you need
for (const task of response.tasks.slice(0, 10)) {  // Top 10 only
  const detailsResponse = await client.callTool('get_task', {
    taskId: task.id
  });
  // Process detailed task...
}
```

### 3. Implement Smart Pagination

```python
# ✅ GOOD: Paginate with progress tracking
async def fetch_all_tasks_efficiently(filters: dict):
    page = 0
    all_tasks = []

    while True:
        response = await client.call_tool('get_workspace_tasks', {
            **filters,
            'detail_level': 'summary',
            'page': page
        })

        if not response['success']:
            break

        tasks = response['tasks']
        if len(tasks) == 0:
            break  # No more tasks

        all_tasks.extend(tasks)
        print(f"Fetched page {page + 1}: {len(tasks)} tasks (total: {len(all_tasks)})")

        page += 1

        # Safety limit to prevent infinite loops
        if page > 100:
            print("⚠️  Reached page limit, stopping")
            break

    return all_tasks
```

### 4. Use Caching for Repeated Queries

```typescript
// ✅ GOOD: Cache workspace task queries
class TaskCache {
  private cache = new Map<string, { tasks: any[], timestamp: number }>();
  private CACHE_TTL = 5 * 60 * 1000;  // 5 minutes

  async getWorkspaceTasks(filters: any): Promise<any[]> {
    const cacheKey = JSON.stringify(filters);
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log('✓ Using cached results');
      return cached.tasks;
    }

    const response = await client.callTool('get_workspace_tasks', filters);
    if (response.success) {
      this.cache.set(cacheKey, {
        tasks: response.tasks,
        timestamp: Date.now()
      });
      return response.tasks;
    }

    throw new Error(response.error.message);
  }
}

// Usage
const taskCache = new TaskCache();
const tasks = await taskCache.getWorkspaceTasks({ tags: ['sprint-42'] });
```

---

## Changelog

### Version 1.1.0
- ✨ **New**: Automatic response format switching to summary when exceeding 50,000 tokens
- ✨ **New**: Enhanced list filtering using ClickUp Views API for associated tasks
- ✨ **New**: Support for `detail_level` parameter (summary/detailed)
- ✨ **New**: Automatic retry with exponential backoff (100ms → 200ms → 400ms → 800ms)
- ✨ **New**: Debug logging with request IDs and execution time tracking
- 🔧 **Changed**: Improved subtasks filtering documentation and behavior clarification
- 🔧 **Changed**: Better validation error messages for missing filters
- 🔧 **Changed**: Performance optimizations for large result sets

### Version 1.0.0
- ✨ **New**: Initial implementation with comprehensive filtering
- ✨ **New**: Tag-based cross-list task organization
- ✨ **New**: Multi-criteria filtering (tags, lists, folders, spaces, statuses, assignees, dates)
- ✨ **New**: Pagination support with order_by and reverse
- ✨ **New**: Include options for closed/archived lists and tasks
- ✨ **New**: Custom field filtering support
- ✨ **New**: Subtasks inclusion with filtering
- ✨ **New**: Compact time entries support

### Version 0.9.0
- ✨ **New**: Beta release with basic workspace-wide task filtering
- ✨ **New**: Support for tag, list, and status filters
- ✨ **New**: Basic pagination implementation

### Version 0.8.0
- 🎉 **Initial**: Alpha release with minimal workspace task retrieval
- 🎉 **Initial**: Basic ClickUp API integration for workspace queries
