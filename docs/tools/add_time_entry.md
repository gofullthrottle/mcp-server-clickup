# add_time_entry

**Category**: Task Management - Time Tracking

Adds a manual time entry to a task for work that was completed in the past without using a timer. Requires start time and duration, with optional description, billable status, and tags. Supports natural language date expressions and flexible duration formats for easy entry of historical time tracking data.

---

## Use Cases

### 1. **Retroactive Time Tracking**
Log time for work that was completed in the past but wasn't tracked with a timer, ensuring accurate historical records for project management and billing.

### 2. **Bulk Time Entry**
Add multiple time entries at once for different tasks or time periods when catching up on time tracking at the end of the day or week.

### 3. **Import Time from External Sources**
Import time tracking data from other systems (calendar events, commit logs, meeting schedules) into ClickUp for centralized time management.

### 4. **Estimated Time Entry**
Record time based on estimates when exact tracking wasn't possible, useful for contractors billing by the hour or project managers tracking effort estimates.

---

## Input Parameters

```json
{
  "taskId": "86fpd7vgc",
  "start": "yesterday 9am",
  "duration": "2h 30m",
  "description": "Implemented authentication logic",
  "billable": true,
  "tags": ["development", "backend"]
}
```

### Parameter Reference

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `taskId` | string | Conditional* | ID of the task (9 chars or custom like "DEV-1234"). **Preferred method**. |
| `taskName` | string | Conditional* | Name of task to add time entry to. Searches across lists unless `listName` provided. |
| `listName` | string | Optional | Name of list containing the task. Improves accuracy when using `taskName`. |
| `start` | string | **Required** | Start time for the entry. Supports Unix timestamps (milliseconds) or natural language ("2 hours ago", "yesterday 9am", "2025-01-05T10:00:00Z"). |
| `duration` | string | **Required** | Duration of time entry. Format as "Xh Ym" (e.g., "1h 30m"), just minutes ("90m"), or just hours ("2h"). |
| `description` | string | Optional | Description for the time entry (e.g., "Implemented authentication logic"). |
| `billable` | boolean | Optional | Whether this time is billable. Defaults to workspace setting if not specified. |
| `tags` | array[string] | Optional | Array of tag names to assign to the time entry (e.g., ["development", "backend"]). |

\* **Task Identification**: Must provide either `taskId` (preferred) OR `taskName` (optionally with `listName`).

### Natural Language Date Support

The `start` parameter supports 47+ natural language patterns:

**Relative Times**:
- "2 hours ago", "30 minutes ago", "1 day ago"
- "tomorrow", "yesterday", "today"

**Specific Times**:
- "yesterday 9am", "today 5pm", "tomorrow 10:30am"
- "2025-01-05T10:00:00Z" (ISO 8601)
- Unix timestamps in milliseconds (e.g., `1736074800000`)

**Date Expressions**:
- "last Monday", "next Friday"
- "beginning of this week", "end of last month"

### Duration Format Options

The `duration` parameter accepts multiple formats:

- **Combined**: "1h 30m", "2h 15m", "3h"
- **Minutes only**: "90m", "135m", "45m"
- **Hours only**: "2h", "3h", "0.5h" (treated as "30m")
- **Plain numbers**: "90" (interpreted as minutes)

---

## Success Response

```json
{
  "success": true,
  "message": "Time entry added successfully",
  "time_entry": {
    "id": "time_123456789",
    "description": "Implemented authentication logic",
    "start": "2025-01-04T09:00:00.000Z",
    "end": "2025-01-04T11:30:00.000Z",
    "duration": "2h 30m",
    "duration_ms": 9000000,
    "task": {
      "id": "86fpd7vgc",
      "name": "Implement user authentication"
    },
    "billable": true,
    "tags": ["development", "backend"]
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Always `true` for successful additions |
| `message` | string | Confirmation message |
| `time_entry` | object | Created time entry details |
| `time_entry.id` | string | Unique ID for the time entry |
| `time_entry.description` | string | Description provided (or empty string) |
| `time_entry.start` | string | ISO 8601 timestamp when work started (from input) |
| `time_entry.end` | string | ISO 8601 timestamp when work ended (calculated from start + duration) |
| `time_entry.duration` | string | Human-readable duration (e.g., "2h 30m") |
| `time_entry.duration_ms` | number | Duration in milliseconds for precise calculations |
| `time_entry.task` | object | Task details |
| `time_entry.task.id` | string | Task ID |
| `time_entry.task.name` | string | Task name |
| `time_entry.billable` | boolean | Whether time is billable |
| `time_entry.tags` | array[string] | Assigned tags |

---

## Error Responses

### 1. VALIDATION - Task Identification Missing

```json
{
  "success": false,
  "error": {
    "type": "VALIDATION",
    "message": "Task not found. Please provide a valid taskId or taskName + listName combination.",
    "timestamp": "2025-01-05T10:00:00.123Z"
  }
}
```

### 2. VALIDATION - Invalid Start Time

```json
{
  "success": false,
  "error": {
    "type": "VALIDATION",
    "message": "Invalid start time format. Use a Unix timestamp (in milliseconds) or a natural language date string.",
    "timestamp": "2025-01-05T10:00:00.123Z"
  }
}
```

**Why This Happens**: The start time couldn't be parsed. Common causes:
- Invalid date format
- Ambiguous natural language expression
- Typo in date string

**How to Resolve**: Use a clear format like "yesterday 9am", ISO 8601 timestamp, or Unix timestamp in milliseconds.

### 3. VALIDATION - Invalid Duration

```json
{
  "success": false,
  "error": {
    "type": "VALIDATION",
    "message": "Invalid duration format. Use 'Xh Ym' format (e.g., '1h 30m') or just minutes (e.g., '90m').",
    "timestamp": "2025-01-05T10:00:00.123Z"
  }
}
```

**Why This Happens**: The duration couldn't be parsed. Common causes:
- Invalid format (e.g., "1 hour 30 minutes" instead of "1h 30m")
- Missing units (e.g., "90" without "m")
- Typo in duration string

**How to Resolve**: Use formats like "2h 30m", "90m", or "2h".

### 4. NOT_FOUND - Task Not Found

```json
{
  "success": false,
  "error": {
    "type": "NOT_FOUND",
    "message": "Task with ID '86fpd7vgc' not found",
    "timestamp": "2025-01-05T10:00:00.123Z"
  }
}
```

### 5. AUTH - No Permission

```json
{
  "success": false,
  "error": {
    "type": "AUTH",
    "message": "You do not have permission to add time entries to this task",
    "timestamp": "2025-01-05T10:00:00.123Z"
  }
}
```

### 6. RATE_LIMIT

```json
{
  "success": false,
  "error": {
    "type": "RATE_LIMIT",
    "message": "Rate limit exceeded. Please wait before making more requests.",
    "retry_after": 3000,
    "timestamp": "2025-01-05T10:00:00.123Z"
  }
}
```

---

## Rate Limit Information

**Rate Limit Impact**: ~1-2% per execution

- **Free Forever Plan**: 100 requests/minute
- **Single query**: 1 request (task lookup if using taskName) + 1 request (add entry) = 1-2% of rate limit

---

## API Dependencies

### ClickUp API Endpoints

1. **Add Time Entry**:
   - `POST /task/{taskId}/time` (with start time and duration in body)

### Required Permissions

- **Read Tasks**: Required to identify task
- **Time Tracking**: Required to add time entries

---

## Integration Examples

### Python Example - Add Single Time Entry

```python
from mcp_client import MCPClient

async def add_time_entry(
    task_id: str,
    start: str,
    duration: str,
    description: str = None,
    billable: bool = False,
    tags: list[str] = None
):
    """Add a manual time entry to a task"""
    client = MCPClient()

    response = await client.call_tool('add_time_entry', {
        'taskId': task_id,
        'start': start,
        'duration': duration,
        'description': description,
        'billable': billable,
        'tags': tags or []
    })

    if response['success']:
        entry = response['time_entry']
        print(f"✅ Time entry added")
        print(f"   Task: {entry['task']['name']}")
        print(f"   Started: {entry['start']}")
        print(f"   Duration: {entry['duration']} ({entry['duration_ms']}ms)")
        print(f"   Description: {entry['description'] or 'No description'}")
        print(f"   Billable: {'Yes' if entry['billable'] else 'No'}")
        if entry['tags']:
            print(f"   Tags: {', '.join(entry['tags'])}")

        return entry
    else:
        print(f"❌ Error: {response['error']['message']}")
        return None

# Usage examples
await add_time_entry(
    '86fpd7vgc',
    start='yesterday 9am',
    duration='2h 30m',
    description='Implemented authentication logic',
    billable=True,
    tags=['development', 'backend']
)

await add_time_entry(
    '86fpd7vgc',
    start='2 hours ago',
    duration='45m',
    description='Code review'
)
```

### Python Example - Import Time from Calendar

```python
from datetime import datetime, timedelta
from mcp_client import MCPClient

async def import_calendar_events_to_clickup(task_id: str, calendar_events: list):
    """Import time entries from calendar events"""
    client = MCPClient()
    imported = []
    failed = []

    for event in calendar_events:
        # Extract event details
        title = event['title']
        start_time = event['start']  # ISO 8601 timestamp
        end_time = event['end']

        # Calculate duration
        start_dt = datetime.fromisoformat(start_time)
        end_dt = datetime.fromisoformat(end_time)
        duration_minutes = int((end_dt - start_dt).total_seconds() / 60)
        duration = f"{duration_minutes}m"

        # Add time entry
        result = await client.call_tool('add_time_entry', {
            'taskId': task_id,
            'start': start_time,
            'duration': duration,
            'description': f"{title} (imported from calendar)",
            'billable': True,
            'tags': ['imported', 'calendar']
        })

        if result['success']:
            imported.append(result['time_entry'])
            print(f"✅ Imported: {title} ({duration})")
        else:
            failed.append({'event': title, 'error': result['error']['message']})
            print(f"❌ Failed: {title} - {result['error']['message']}")

    print(f"\n📊 Import Summary:")
    print(f"   Imported: {len(imported)}")
    print(f"   Failed: {len(failed)}")

    return {'imported': imported, 'failed': failed}

# Usage
calendar_events = [
    {
        'title': 'Development Sprint Meeting',
        'start': '2025-01-04T09:00:00Z',
        'end': '2025-01-04T10:00:00Z'
    },
    {
        'title': 'Code Review Session',
        'start': '2025-01-04T14:00:00Z',
        'end': '2025-01-04T15:30:00Z'
    }
]

await import_calendar_events_to_clickup('86fpd7vgc', calendar_events)
```

### TypeScript Example - Bulk Time Entry from Commit Log

```typescript
import { MCPClient } from 'mcp-client';

interface CommitEntry {
  taskId: string;
  timestamp: string;
  message: string;
  estimatedDuration: string;
}

async function addTimeEntriesFromCommits(commits: CommitEntry[]) {
  const client = new MCPClient();
  const results = {
    success: [] as any[],
    failed: [] as any[]
  };

  for (const commit of commits) {
    try {
      const response = await client.callTool('add_time_entry', {
        taskId: commit.taskId,
        start: commit.timestamp,
        duration: commit.estimatedDuration,
        description: `Code commit: ${commit.message}`,
        billable: true,
        tags: ['development', 'commit']
      });

      if (response.success) {
        results.success.push(response.time_entry);
        console.log(`✅ Added time for: ${commit.message.substring(0, 50)}...`);
      } else {
        results.failed.push({
          commit: commit.message,
          error: response.error.message
        });
        console.error(`❌ Failed for: ${commit.message} - ${response.error.message}`);
      }
    } catch (error) {
      results.failed.push({
        commit: commit.message,
        error: (error as Error).message
      });
      console.error(`❌ Exception for: ${commit.message} - ${(error as Error).message}`);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Success: ${results.success.length}`);
  console.log(`   Failed: ${results.failed.length}`);

  return results;
}

// Usage
const commits: CommitEntry[] = [
  {
    taskId: '86fpd7vgc',
    timestamp: '2025-01-04T09:30:00Z',
    message: 'feat: implement OAuth authentication',
    estimatedDuration: '2h'
  },
  {
    taskId: '86fpd7vgc',
    timestamp: '2025-01-04T14:00:00Z',
    message: 'test: add unit tests for auth flow',
    estimatedDuration: '1h 30m'
  }
];

await addTimeEntriesFromCommits(commits);
```

### TypeScript Example - Daily Time Entry Summary

```typescript
async function logDailyTimeEntries(entries: Array<{
  taskId: string;
  taskName: string;
  duration: string;
  description: string;
  billable: boolean;
}>) {
  const client = new MCPClient();
  const today = new Date();
  today.setHours(9, 0, 0, 0);  // Start at 9am

  let currentTime = today.getTime();
  const results = [];

  for (const entry of entries) {
    const response = await client.callTool('add_time_entry', {
      taskId: entry.taskId,
      start: currentTime.toString(),
      duration: entry.duration,
      description: entry.description,
      billable: entry.billable,
      tags: ['daily-log']
    });

    if (response.success) {
      const timeEntry = response.time_entry;
      results.push(timeEntry);

      console.log(`✅ ${entry.taskName}: ${timeEntry.duration}`);

      // Move current time forward by duration
      currentTime += timeEntry.duration_ms;
    } else {
      console.error(`❌ Failed for ${entry.taskName}: ${response.error.message}`);
    }
  }

  // Calculate totals
  const totalMs = results.reduce((sum, entry) => sum + entry.duration_ms, 0);
  const totalHours = (totalMs / 3600000).toFixed(2);
  const billableMs = results
    .filter(e => e.billable)
    .reduce((sum, entry) => sum + entry.duration_ms, 0);
  const billableHours = (billableMs / 3600000).toFixed(2);

  console.log(`\n📊 Daily Summary:`);
  console.log(`   Total Time: ${totalHours}h`);
  console.log(`   Billable: ${billableHours}h`);
  console.log(`   Non-Billable: ${(parseFloat(totalHours) - parseFloat(billableHours)).toFixed(2)}h`);

  return results;
}

// Usage
await logDailyTimeEntries([
  {
    taskId: '86fpd7vgc',
    taskName: 'Authentication Implementation',
    duration: '2h 30m',
    description: 'Implemented OAuth flow',
    billable: true
  },
  {
    taskId: 'xyz123abc',
    taskName: 'Code Review',
    duration: '1h',
    description: 'Reviewed PRs',
    billable: false
  },
  {
    taskId: '86fpd7vgc',
    taskName: 'Testing',
    duration: '1h 30m',
    description: 'Unit tests for auth',
    billable: true
  }
]);
```

---

## Related Tools

- **`start_time_tracking`** - Start real-time timer on task
- **`stop_time_tracking`** - Stop running timer and create entry
- **`delete_time_entry`** - Delete time entry by ID if added by mistake
- **`get_task_time_entries`** - Get all time entries for a task
- **`get_current_time_entry`** - Check if timer is currently running
- **`get_task`** - Get task details to verify time tracking enabled

---

## Best Practices

### DO:
- ✅ **Use natural language dates** - "yesterday 9am" is easier than Unix timestamps
- ✅ **Be consistent with duration format** - Pick one format ("2h 30m" or "150m") and stick to it
- ✅ **Add descriptions** - Provide context about the work performed
- ✅ **Set billable correctly** - Distinguish billable from non-billable work
- ✅ **Use tags for categorization** - Tag by work type for better analysis
- ✅ **Validate before bulk import** - Test with single entry before importing many
- ✅ **Log retroactive time promptly** - Add entries as soon as possible while details are fresh
- ✅ **Round to reasonable increments** - Use 15-minute increments for professional billing

### DON'T:
- ❌ **Don't use this for real-time tracking** - Use start/stop_time_tracking for active work
- ❌ **Don't add overlapping entries** - Check existing entries to avoid time conflicts
- ❌ **Don't use vague descriptions** - "Working" is not helpful; be specific
- ❌ **Don't forget timezone** - Natural language dates use local timezone
- ❌ **Don't over-estimate** - Be honest with time spent for accurate billing
- ❌ **Don't add future time** - Only add time for work already completed
- ❌ **Don't ignore validation errors** - Fix format issues rather than retrying

---

## Performance Tips

1. **Batch time entries efficiently**:
```python
# ✅ GOOD: Process multiple entries with error handling
async def batch_add_entries(entries: list):
    results = []
    for entry in entries:
        try:
            result = await client.call_tool('add_time_entry', entry)
            if result['success']:
                results.append(result['time_entry'])
        except Exception as e:
            print(f"Failed: {entry['description']} - {e}")
    return results

# ❌ BAD: Fail entire batch on single error
async def batch_add_entries_bad(entries: list):
    results = []
    for entry in entries:
        result = await client.call_tool('add_time_entry', entry)  # Crashes on error!
        results.append(result['time_entry'])
    return results
```

2. **Cache task IDs to avoid lookups**:
```typescript
// ✅ GOOD: Cache task IDs when adding multiple entries
class TimeEntryManager {
  private taskCache = new Map<string, string>();

  async addEntry(taskName: string, listName: string, start: string, duration: string) {
    // Check cache first
    const cacheKey = `${listName}:${taskName}`;
    let taskId = this.taskCache.get(cacheKey);

    if (!taskId) {
      // Lookup task ID and cache it
      const task = await client.callTool('get_task', { taskName, listName });
      if (task.success) {
        taskId = task.task.id;
        this.taskCache.set(cacheKey, taskId);
      }
    }

    // Use cached task ID
    return await client.callTool('add_time_entry', {
      taskId,
      start,
      duration
    });
  }
}
```

3. **Pre-validate dates and durations**:
```python
# ✅ GOOD: Validate before calling API
def validate_time_entry(start: str, duration: str):
    # Check duration format
    if not re.match(r'^\d+h\s*\d*m?$|^\d+m$|^\d+h$', duration):
        return False, "Invalid duration format"

    # Check start time is not in future
    # (implementation depends on date parsing library)

    return True, None

# Use before API call
valid, error = validate_time_entry(start, duration)
if not valid:
    print(f"Validation error: {error}")
else:
    await client.call_tool('add_time_entry', {...})
```

---

## Troubleshooting

### Issue: "Invalid start time format"

**Problem**: Start time couldn't be parsed.

**Solution**:
```python
# ❌ BAD: Ambiguous format
start = "yesterday morning"  # Too vague!

# ✅ GOOD: Specific time
start = "yesterday 9am"
start = "2025-01-04T09:00:00Z"
start = "1736074800000"  # Unix timestamp in milliseconds
```

### Issue: "Invalid duration format"

**Problem**: Duration couldn't be parsed.

**Solution**:
```python
# ❌ BAD: Wrong format
duration = "2 hours 30 minutes"
duration = "2.5 hours"

# ✅ GOOD: Correct formats
duration = "2h 30m"
duration = "150m"
duration = "2h"
```

### Issue: Duplicate time entries created

**Problem**: Accidentally added same time entry multiple times.

**Solution**:
```python
# Check existing entries first
existing = await client.call_tool('get_task_time_entries', {
    'taskId': task_id,
    'startDate': start_date,
    'endDate': end_date
})

if existing['success']:
    # Check if entry already exists
    for entry in existing['time_entries']:
        if (entry['start'] == new_entry_start and
            entry['duration_ms'] == new_entry_duration_ms):
            print("Entry already exists!")
            return

# Safe to add
await client.call_tool('add_time_entry', {...})
```

### Issue: Time entry shows wrong timezone

**Problem**: Time entry appears at different time than expected.

**Solution**:
- Natural language dates use your local timezone
- ISO 8601 timestamps should include timezone (Z for UTC or +HH:MM offset)
- Unix timestamps are always UTC
```python
# ✅ Explicitly specify timezone
start = "2025-01-04T09:00:00-05:00"  # EST
start = "2025-01-04T14:00:00Z"        # UTC
```

---

## Changelog

### Version 1.1.0
- ✨ **New**: Automatic retry with exponential backoff
- ✨ **New**: Natural language date parsing (47+ patterns)
- ✨ **New**: Flexible duration parsing (combined, minutes-only, hours-only)
- ✨ **New**: Debug logging with request tracking
- 🔧 **Changed**: Improved error messages with format examples
- 🔧 **Changed**: Enhanced validation for dates and durations

### Version 1.0.0
- ✨ **New**: Initial implementation
- ✨ **New**: Manual time entry creation
- ✨ **New**: Task identification via taskId or taskName + listName
- ✨ **New**: Automatic end time calculation from start + duration
