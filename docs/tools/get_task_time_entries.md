# get_task_time_entries

**Category**: Task Management - Time Tracking

Retrieves all time entries for a specific task with optional date range filtering. Returns comprehensive tracking data including user information, descriptions, tags, start/end times, and calculated durations. Supports natural language date expressions.

---

## Use Cases

### 1. **Time Analysis and Reporting**
Review all time entries for a task to analyze time spent, identify patterns, and generate accurate time reports for billing or project management.

### 2. **Date Range Filtering**
Query time entries within specific date ranges using natural language expressions like "last week", "yesterday", or Unix timestamps for precise filtering.

### 3. **User Activity Tracking**
Track which team members have logged time on tasks, with detailed user information including usernames and IDs for accountability.

### 4. **Billable Hours Calculation**
Identify billable time entries and calculate total billable hours for client invoicing and budget tracking.

---

## Input Parameters

```json
{
  "taskId": "86fpd7vgc",
  "startDate": "last week",
  "endDate": "1736035199000"
}
```

### Parameter Reference

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `taskId` | string | Conditional* | ID of the task (9 chars or custom like "DEV-1234"). **Preferred method**. |
| `taskName` | string | Conditional* | Name of task to get time entries for. Searches across lists unless `listName` provided. |
| `listName` | string | Optional | Name of list containing the task. Improves performance when using `taskName`. |
| `startDate` | string | Optional | Start date filter. Supports Unix timestamps (milliseconds) or natural language ("yesterday", "last week", "2 weeks ago"). |
| `endDate` | string | Optional | End date filter. Supports Unix timestamps (milliseconds) or natural language expressions. |

\* **Task Identification**: Must provide either `taskId` (preferred) OR `taskName` (optionally with `listName`).

---

## Success Response

```json
{
  "success": true,
  "count": 3,
  "time_entries": [
    {
      "id": "time_123456789",
      "description": "Implemented authentication logic",
      "start": "2025-01-02T09:00:00.000Z",
      "end": "2025-01-02T11:30:00.000Z",
      "duration": "2h 30m",
      "duration_ms": 9000000,
      "billable": true,
      "tags": ["development", "backend"],
      "user": {
        "id": 12345678,
        "username": "john.smith"
      },
      "task": {
        "id": "86fpd7vgc",
        "name": "Implement user authentication",
        "status": "In Progress"
      }
    },
    {
      "id": "time_987654321",
      "description": "Code review and testing",
      "start": "2025-01-03T14:00:00.000Z",
      "end": "2025-01-03T15:45:00.000Z",
      "duration": "1h 45m",
      "duration_ms": 6300000,
      "billable": true,
      "tags": ["review"],
      "user": {
        "id": 87654321,
        "username": "jane.doe"
      },
      "task": {
        "id": "86fpd7vgc",
        "name": "Implement user authentication",
        "status": "In Progress"
      }
    },
    {
      "id": "time_555555555",
      "description": "",
      "start": "2025-01-04T10:15:00.000Z",
      "end": "2025-01-04T10:45:00.000Z",
      "duration": "30m",
      "duration_ms": 1800000,
      "billable": false,
      "tags": [],
      "user": {
        "id": 12345678,
        "username": "john.smith"
      },
      "task": {
        "id": "86fpd7vgc",
        "name": "Implement user authentication",
        "status": "In Progress"
      }
    }
  ]
}
```

### Empty Results

```json
{
  "success": true,
  "count": 0,
  "time_entries": []
}
```

---

## Error Responses

### 1. VALIDATION - Task Identification Missing

```json
{
  "success": false,
  "error": {
    "type": "VALIDATION",
    "message": "Task not found. Please provide a valid taskId or taskName + listName combination.",
    "timestamp": "2025-01-03T18:00:00.123Z"
  }
}
```

### 2. VALIDATION - Invalid Date Format

```json
{
  "success": false,
  "error": {
    "type": "VALIDATION",
    "message": "Invalid startDate format. Use Unix timestamp (milliseconds) or natural language date string.",
    "timestamp": "2025-01-03T18:00:00.123Z"
  }
}
```

### 3. NOT_FOUND - Task Not Found

```json
{
  "success": false,
  "error": {
    "type": "NOT_FOUND",
    "message": "Task with ID '86fpd7vgc' not found",
    "timestamp": "2025-01-03T18:00:00.123Z"
  }
}
```

### 4. AUTH - No Permission

```json
{
  "success": false,
  "error": {
    "type": "AUTH",
    "message": "You do not have permission to view time entries for this task",
    "timestamp": "2025-01-03T18:00:00.123Z"
  }
}
```

### 5. RATE_LIMIT

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

---

## Rate Limit Information

**Rate Limit Impact**: ~1% per execution

- **Free Forever Plan**: 100 requests/minute
- **Single query**: 1 request (task lookup if using taskName) + 1 request (time entries fetch) = 1-2% of rate limit

---

## API Dependencies

### ClickUp API Endpoints

1. **Time Entries Query**:
   - `GET /task/{taskId}/time` (with optional query parameters for date range)

### Required Permissions

- **Read Tasks**: Required to access task
- **View Time Tracking**: Required to view time entries

---

## Integration Examples

### Python Example - Get All Time Entries

```python
from mcp_client import MCPClient

async def get_task_time_entries(task_id: str):
    """Get all time entries for a task"""
    client = MCPClient()

    response = await client.call_tool('get_task_time_entries', {
        'taskId': task_id
    })

    if response['success']:
        entries = response['time_entries']
        count = response['count']

        print(f"Found {count} time entries:\n")
        for entry in entries:
            print(f"  - {entry['description'] or 'No description'}")
            print(f"    Duration: {entry['duration']} ({entry['duration_ms']}ms)")
            print(f"    User: {entry['user']['username']}")
            print(f"    Billable: {'Yes' if entry['billable'] else 'No'}")
            print()

        return entries
    else:
        print(f"Error: {response['error']['message']}")
        return []

# Usage
await get_task_time_entries('86fpd7vgc')
```

### Python Example - Calculate Total Billable Time

```python
async def calculate_billable_hours(task_id: str, start_date: str, end_date: str):
    """Calculate total billable hours for a task within date range"""
    client = MCPClient()

    response = await client.call_tool('get_task_time_entries', {
        'taskId': task_id,
        'startDate': start_date,
        'endDate': end_date
    })

    if response['success']:
        entries = response['time_entries']

        # Calculate totals
        total_time_ms = sum(entry['duration_ms'] for entry in entries)
        billable_time_ms = sum(
            entry['duration_ms'] for entry in entries if entry['billable']
        )

        total_hours = total_time_ms / 3600000  # Convert ms to hours
        billable_hours = billable_time_ms / 3600000

        print(f"Time Summary for Task {task_id}:")
        print(f"  Total Time: {total_hours:.2f}h")
        print(f"  Billable Time: {billable_hours:.2f}h")
        print(f"  Non-Billable Time: {(total_hours - billable_hours):.2f}h")
        print(f"  Entries: {len(entries)}")

        return {
            'total_hours': total_hours,
            'billable_hours': billable_hours,
            'entry_count': len(entries)
        }
    else:
        raise Exception(response['error']['message'])

# Usage
await calculate_billable_hours('86fpd7vgc', 'last week', '1736035199000')
```

### TypeScript Example - Time Entries by User

```typescript
import { MCPClient } from 'mcp-client';

async function getTimeEntriesByUser(taskId: string) {
  const client = new MCPClient();

  const response = await client.callTool('get_task_time_entries', {
    taskId
  });

  if (!response.success) {
    throw new Error(response.error.message);
  }

  const entries = response.time_entries;

  // Group by user
  const byUser = entries.reduce((acc: any, entry: any) => {
    const userId = entry.user.id;
    if (!acc[userId]) {
      acc[userId] = {
        username: entry.user.username,
        entries: [],
        total_ms: 0
      };
    }
    acc[userId].entries.push(entry);
    acc[userId].total_ms += entry.duration_ms;
    return acc;
  }, {});

  // Print summary
  console.log(`Time entries by user:\n`);
  for (const userId in byUser) {
    const userData = byUser[userId];
    const hours = (userData.total_ms / 3600000).toFixed(2);
    console.log(`  ${userData.username}:`);
    console.log(`    Total: ${hours}h (${userData.entries.length} entries)`);
  }

  return byUser;
}

// Usage
await getTimeEntriesByUser('86fpd7vgc');
```

---

## Related Tools

- **`start_time_tracking`** - Start timer on task before logging time
- **`stop_time_tracking`** - Stop running timer, creating time entry
- **`add_time_entry`** - Add manual time entry to task
- **`delete_time_entry`** - Delete time entry by ID
- **`get_current_time_entry`** - Check if timer currently running
- **`get_task`** - Get task details to verify time tracking enabled

---

## Best Practices

### DO:
- ✅ **Use taskId when possible** - Faster and more reliable than task name lookup
- ✅ **Filter by date range** - Narrow results for better performance and relevance
- ✅ **Check billable status** - Distinguish billable from non-billable time for invoicing
- ✅ **Use natural language dates** - "last week", "yesterday" for convenience
- ✅ **Calculate totals client-side** - Sum duration_ms for accurate time calculations
- ✅ **Handle empty results** - Not all tasks have time entries
- ✅ **Group by user** - Analyze time spent per team member
- ✅ **Export data for reports** - Use time_entries array for external reporting tools

### DON'T:
- ❌ **Don't assume entries exist** - Always check count before processing
- ❌ **Don't ignore timezone** - Timestamps are UTC, convert for local display
- ❌ **Don't modify returned data** - duration and duration_ms are calculated fields
- ❌ **Don't use for real-time tracking** - Use get_current_time_entry for active timers
- ❌ **Don't forget date filters** - Querying all entries on large tasks can be slow

---

## Performance Tips

1. **Use date range filtering to reduce API load**:
```python
# ✅ GOOD: Filter by date range
response = await client.call_tool('get_task_time_entries', {
    'taskId': task_id,
    'startDate': 'last month',
    'endDate': 'now'
})
```

2. **Cache results for reporting**:
```typescript
// ✅ GOOD: Cache time entries for repeated analysis
const cache = new Map();
async function getCachedTimeEntries(taskId: string) {
  if (cache.has(taskId)) return cache.get(taskId);

  const response = await client.callTool('get_task_time_entries', { taskId });
  if (response.success) {
    cache.set(taskId, response.time_entries);
  }
  return response.time_entries;
}
```

---

## Changelog

### Version 1.1.0
- ✨ **New**: Automatic retry with exponential backoff
- ✨ **New**: Natural language date parsing for startDate and endDate
- ✨ **New**: Debug logging with request tracking
- 🔧 **Changed**: Improved error messages with actionable guidance

### Version 1.0.0
- ✨ **New**: Initial implementation
- ✨ **New**: Date range filtering support
- ✨ **New**: Task identification via taskId or taskName + listName
- ✨ **New**: Complete time entry details with user and task info
