# stop_time_tracking

**Category**: Task Management - Time Tracking

Stops the currently running time tracker and creates a completed time entry with calculated duration. Automatically determines which timer to stop (no task ID needed) and allows updating description and tags when stopping. Returns the completed time entry with both human-readable duration and millisecond precision.

---

## Use Cases

### 1. **Complete Work Session**
Stop the timer when finished with a task to finalize the time entry with accurate start/end times and calculated duration for project tracking.

### 2. **Add Context When Stopping**
Update or add a description when stopping to provide detailed context about what was accomplished during the tracked time period.

### 3. **Categorize Completed Work**
Add or update tags when stopping to categorize the work performed (e.g., "development", "testing", "review") for detailed time analysis and reporting.

### 4. **Automatic Duration Calculation**
Let the system automatically calculate the exact time spent from start to stop, eliminating manual duration calculations and ensuring accuracy.

---

## Input Parameters

```json
{
  "description": "Completed authentication implementation and unit tests",
  "tags": ["development", "backend", "completed"]
}
```

### Parameter Reference

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `description` | string | Optional | Description to add or update for the time entry. If not provided, keeps existing description from when timer was started. |
| `tags` | array[string] | Optional | Array of tag names to assign to the completed time entry. Overwrites tags set when timer started. |

**Note**: No task ID needed - this tool automatically stops the currently running timer.

---

## Success Response

```json
{
  "success": true,
  "message": "Time tracking stopped successfully",
  "time_entry": {
    "id": "time_123456789",
    "description": "Completed authentication implementation and unit tests",
    "start": "2025-01-05T10:30:00.000Z",
    "end": "2025-01-05T12:45:00.000Z",
    "duration": "2h 15m",
    "duration_ms": 8100000,
    "task": {
      "id": "86fpd7vgc",
      "name": "Implement user authentication"
    },
    "billable": true,
    "tags": ["development", "backend", "completed"]
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Always `true` for successful stops |
| `message` | string | Confirmation message |
| `time_entry` | object | Completed time entry details |
| `time_entry.id` | string | Unique ID for the time entry |
| `time_entry.description` | string | Description (updated if provided in params) |
| `time_entry.start` | string | ISO 8601 timestamp when timer started |
| `time_entry.end` | string | ISO 8601 timestamp when timer stopped |
| `time_entry.duration` | string | Human-readable duration (e.g., "2h 15m", "45m") |
| `time_entry.duration_ms` | number | Duration in milliseconds for precise calculations |
| `time_entry.task` | object | Task details |
| `time_entry.task.id` | string | Task ID |
| `time_entry.task.name` | string | Task name |
| `time_entry.billable` | boolean | Whether time is billable (set when started) |
| `time_entry.tags` | array[string] | Assigned tags (updated if provided in params) |

---

## Error Responses

### 1. VALIDATION - No Timer Running

```json
{
  "success": false,
  "error": {
    "type": "VALIDATION",
    "message": "No timer is currently running. Start a timer before trying to stop it.",
    "timestamp": "2025-01-05T12:45:00.123Z"
  }
}
```

**Why This Happens**: Attempting to stop a timer when no timer is currently running.

**How to Resolve**: Check if a timer is running first using `get_current_time_entry`, then start one with `start_time_tracking` before stopping.

### 2. AUTH - No Permission

```json
{
  "success": false,
  "error": {
    "type": "AUTH",
    "message": "You do not have permission to stop this timer",
    "timestamp": "2025-01-05T12:45:00.123Z"
  }
}
```

### 3. RATE_LIMIT

```json
{
  "success": false,
  "error": {
    "type": "RATE_LIMIT",
    "message": "Rate limit exceeded. Please wait before making more requests.",
    "retry_after": 3000,
    "timestamp": "2025-01-05T12:45:00.123Z"
  }
}
```

---

## Rate Limit Information

**Rate Limit Impact**: ~1% per execution

- **Free Forever Plan**: 100 requests/minute
- **Single query**: 1 request (stop timer) = 1% of rate limit

---

## API Dependencies

### ClickUp API Endpoints

1. **Stop Time Tracking**:
   - `POST /team/{teamId}/time_entries/stop` (no task ID needed, operates on current timer)

### Required Permissions

- **Time Tracking**: Required to stop timers

---

## Integration Examples

### Python Example - Stop Timer with Updated Description

```python
from mcp_client import MCPClient

async def stop_timer(description: str = None, tags: list[str] = None):
    """Stop currently running timer"""
    client = MCPClient()

    response = await client.call_tool('stop_time_tracking', {
        'description': description,
        'tags': tags or []
    })

    if response['success']:
        entry = response['time_entry']
        print(f"✅ Timer stopped")
        print(f"   Task: {entry['task']['name']}")
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
await stop_timer('Completed authentication implementation', tags=['development', 'backend', 'completed'])
await stop_timer()  # Minimal - just stop timer without updates
```

### Python Example - Stop Timer with Validation

```python
async def stop_timer_safe(description: str = None, tags: list[str] = None):
    """Stop timer with validation that one is running"""
    client = MCPClient()

    # First check if timer is running
    current = await client.call_tool('get_current_time_entry')

    if not current['success'] or not current.get('time_entry'):
        print("❌ No timer is currently running")
        return None

    running = current['time_entry']
    print(f"⏱️  Stopping timer on: {running['task']['name']}")
    print(f"   Started: {running['start']}")

    # Stop timer
    response = await client.call_tool('stop_time_tracking', {
        'description': description,
        'tags': tags
    })

    if response['success']:
        entry = response['time_entry']
        print(f"✅ Timer stopped successfully")
        print(f"   Duration: {entry['duration']}")
        return entry
    else:
        print(f"❌ Failed to stop timer: {response['error']['message']}")
        return None

# Usage
await stop_timer_safe('Implemented OAuth flow and added tests', tags=['development', 'security'])
```

### TypeScript Example - Stop Timer with Duration Display

```typescript
import { MCPClient } from 'mcp-client';

async function stopTimer(description?: string, tags?: string[]) {
  const client = new MCPClient();

  try {
    const response = await client.callTool('stop_time_tracking', {
      description,
      tags
    });

    if (!response.success) {
      console.error(`❌ Error: ${response.error.message}`);
      return null;
    }

    const entry = response.time_entry;
    console.log(`✅ Timer stopped`);
    console.log(`   Task: ${entry.task.name}`);
    console.log(`   Started: ${entry.start}`);
    console.log(`   Ended: ${entry.end}`);
    console.log(`   Duration: ${entry.duration} (${entry.duration_ms}ms)`);
    console.log(`   Description: ${entry.description || 'No description'}`);
    console.log(`   Billable: ${entry.billable ? 'Yes' : 'No'}`);

    if (entry.tags && entry.tags.length > 0) {
      console.log(`   Tags: ${entry.tags.join(', ')}`);
    }

    // Calculate hourly rate if billable
    if (entry.billable) {
      const hours = entry.duration_ms / (1000 * 60 * 60);
      console.log(`   Billable Hours: ${hours.toFixed(2)}h`);
    }

    return entry;
  } catch (error) {
    console.error('Failed to stop timer:', error);
    return null;
  }
}

// Usage examples
await stopTimer('Completed code review and testing', ['review', 'testing']);
await stopTimer();  // Minimal
```

### TypeScript Example - Work Session with Summary

```typescript
class WorkSession {
  private client: MCPClient;
  private startTime: Date | null = null;

  constructor() {
    this.client = new MCPClient();
  }

  async start(taskId: string, description: string) {
    const response = await this.client.callTool('start_time_tracking', {
      taskId,
      description,
      billable: true,
      tags: ['work-session']
    });

    if (response.success) {
      this.startTime = new Date(response.time_entry.start);
      console.log(`✅ Work session started: ${description}`);
      return true;
    } else {
      console.error(`❌ Failed to start: ${response.error.message}`);
      return false;
    }
  }

  async stop(summary: string) {
    if (!this.startTime) {
      console.log('No work session active');
      return null;
    }

    const response = await this.client.callTool('stop_time_tracking', {
      description: summary,
      tags: ['work-session', 'completed']
    });

    if (response.success) {
      const entry = response.time_entry;

      // Display session summary
      console.log('\n📊 Work Session Summary');
      console.log('━'.repeat(50));
      console.log(`Task: ${entry.task.name}`);
      console.log(`Duration: ${entry.duration}`);
      console.log(`Summary: ${entry.description}`);
      console.log(`Billable: ${entry.billable ? 'Yes' : 'No'}`);

      if (entry.billable) {
        const hours = entry.duration_ms / (1000 * 60 * 60);
        console.log(`Billable Hours: ${hours.toFixed(2)}h`);
      }

      console.log('━'.repeat(50));

      this.startTime = null;
      return entry;
    } else {
      console.error(`❌ Failed to stop: ${response.error.message}`);
      return null;
    }
  }

  getElapsedTime(): string {
    if (!this.startTime) return 'No session active';

    const elapsed = Date.now() - this.startTime.getTime();
    const hours = Math.floor(elapsed / 3600000);
    const minutes = Math.floor((elapsed % 3600000) / 60000);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }
}

// Usage
const session = new WorkSession();
await session.start('86fpd7vgc', 'Implementing authentication');

// ... work happens ...

console.log(`Elapsed: ${session.getElapsedTime()}`);
await session.stop('Completed OAuth integration with tests and documentation');
```

### Python Example - Batch Stop Multiple Timers (Error Handling)

```python
async def ensure_no_running_timers():
    """Make sure all timers are stopped (cleanup utility)"""
    client = MCPClient()

    # Check for running timer
    current = await client.call_tool('get_current_time_entry')

    if current['success'] and current.get('time_entry'):
        timer = current['time_entry']
        print(f"⚠️  Found running timer on: {timer['task']['name']}")

        # Stop it
        stop_result = await client.call_tool('stop_time_tracking', {
            'description': 'Automatic cleanup stop',
            'tags': ['auto-stopped']
        })

        if stop_result['success']:
            entry = stop_result['time_entry']
            print(f"✅ Stopped timer: {entry['duration']}")
            return True
        else:
            print(f"❌ Failed to stop: {stop_result['error']['message']}")
            return False
    else:
        print("✅ No timers running")
        return True

# Usage (e.g., at end of day or shutdown)
await ensure_no_running_timers()
```

---

## Related Tools

- **`start_time_tracking`** - Start timer on task before stopping one
- **`get_current_time_entry`** - Check what timer is currently running
- **`add_time_entry`** - Add manual time entry (for past work without timer)
- **`delete_time_entry`** - Delete time entry by ID if stopped by mistake
- **`get_task_time_entries`** - Get all time entries for a task
- **`get_task`** - Get task details to verify time tracking enabled

---

## Best Practices

### DO:
- ✅ **Stop timers promptly** - Avoid leaving timers running overnight or during breaks
- ✅ **Add summary when stopping** - Update description with what was accomplished
- ✅ **Use tags for categorization** - Add tags like "completed", "blocked", "review-ready"
- ✅ **Check for running timer** - Use `get_current_time_entry` before stopping
- ✅ **Review duration** - Verify duration makes sense before accepting the stop
- ✅ **Stop before switching tasks** - Always stop current timer before starting new one
- ✅ **Validate session length** - Check elapsed time before stopping (warn if > 8 hours)
- ✅ **Use duration for estimates** - Compare actual vs estimated time for future planning

### DON'T:
- ❌ **Don't leave timers running** - Long-running timers inflate time tracking
- ❌ **Don't stop without checking** - Verify a timer is running first
- ❌ **Don't ignore duration** - Review the calculated duration for accuracy
- ❌ **Don't stop wrong timer** - Check which task timer is running on before stopping
- ❌ **Don't forget to update description** - Add context about work completed
- ❌ **Don't assume timer exists** - Always check for running timer before stopping
- ❌ **Don't stop timers manually** - Use this tool instead of UI for automation

---

## Performance Tips

1. **Check before stopping to avoid errors**:
```python
# ✅ GOOD: Check first, then stop
current = await client.call_tool('get_current_time_entry')
if current['success'] and current.get('time_entry'):
    await client.call_tool('stop_time_tracking', {'description': 'Work completed'})

# ❌ BAD: Blind stop, may error if no timer
await client.call_tool('stop_time_tracking')
```

2. **Batch timer operations efficiently**:
```typescript
// ✅ GOOD: Stop and immediately start next
async function switchTask(newTaskId: string, summary: string, newDescription: string) {
  // Stop current
  const stopped = await client.callTool('stop_time_tracking', {
    description: summary
  });

  if (stopped.success) {
    // Immediately start new
    await client.callTool('start_time_tracking', {
      taskId: newTaskId,
      description: newDescription
    });
  }
}
```

3. **Cache timer state to reduce API calls**:
```python
# ✅ GOOD: Cache current timer state
class TimerCache:
    def __init__(self):
        self.current_timer = None
        self.last_check = 0
        self.cache_ttl = 30000  # 30 seconds

    async def get_current_timer(self):
        now = time.time() * 1000
        if self.current_timer and (now - self.last_check) < self.cache_ttl:
            return self.current_timer

        result = await client.call_tool('get_current_time_entry')
        if result['success']:
            self.current_timer = result.get('time_entry')
            self.last_check = now
        return self.current_timer

    async def stop_timer(self, description: str):
        timer = await self.get_current_timer()
        if not timer:
            print("No timer running")
            return None

        result = await client.call_tool('stop_time_tracking', {'description': description})
        if result['success']:
            self.current_timer = None  # Clear cache
        return result
```

---

## Common Patterns

### 1. Automatic Timer Stop on Task Completion
```python
async def complete_task_and_stop_timer(task_id: str, summary: str):
    """Complete task and stop timer in one operation"""
    # Stop timer first
    stop_result = await client.call_tool('stop_time_tracking', {
        'description': summary,
        'tags': ['completed']
    })

    if stop_result['success']:
        print(f"✅ Timer stopped: {stop_result['time_entry']['duration']}")

        # Update task status to completed
        update_result = await client.call_tool('update_task', {
            'taskId': task_id,
            'status': 'Completed'
        })

        if update_result['success']:
            print(f"✅ Task marked complete")
        return True
    else:
        print(f"❌ Failed to stop timer: {stop_result['error']['message']}")
        return False

# Usage
await complete_task_and_stop_timer('86fpd7vgc', 'Implemented and tested authentication')
```

### 2. Timer with Break Detection
```typescript
async function stopTimerWithBreakCheck() {
  // Get current timer info
  const current = await client.callTool('get_current_time_entry');

  if (current.success && current.time_entry) {
    const timer = current.time_entry;
    const startTime = new Date(timer.start).getTime();
    const elapsed = Date.now() - startTime;

    // Warn if timer has been running too long
    if (elapsed > 8 * 60 * 60 * 1000) {  // 8 hours
      const hours = (elapsed / 3600000).toFixed(1);
      console.log(`⚠️  Timer has been running for ${hours} hours!`);
      console.log(`   Did you forget to stop it earlier?`);
    }

    // Stop timer
    return await client.callTool('stop_time_tracking', {
      description: 'Work session completed'
    });
  } else {
    console.log('No timer running');
    return null;
  }
}
```

### 3. Daily Cleanup: Stop All Timers
```python
import asyncio
from datetime import datetime

async def end_of_day_cleanup():
    """Stop any running timers at end of day"""
    client = MCPClient()

    print(f"🌙 Running end-of-day cleanup at {datetime.now()}")

    # Check for running timer
    current = await client.call_tool('get_current_time_entry')

    if current['success'] and current.get('time_entry'):
        timer = current['time_entry']
        print(f"⚠️  Found running timer: {timer['task']['name']}")

        # Stop with automatic description
        stop_result = await client.call_tool('stop_time_tracking', {
            'description': 'Automatic end-of-day stop',
            'tags': ['auto-stopped', 'eod']
        })

        if stop_result['success']:
            entry = stop_result['time_entry']
            print(f"✅ Stopped timer: {entry['duration']}")
            print(f"   Task: {entry['task']['name']}")
        else:
            print(f"❌ Failed to stop: {stop_result['error']['message']}")
    else:
        print("✅ No timers running - all clean!")

# Schedule this to run daily
await end_of_day_cleanup()
```

---

## Troubleshooting

### Issue: "No timer is currently running"

**Problem**: Trying to stop a timer when none is active.

**Solution**:
```python
# Check first
current = await client.call_tool('get_current_time_entry')

if current['success'] and current.get('time_entry'):
    # Timer is running, safe to stop
    await client.call_tool('stop_time_tracking')
else:
    print("No timer running - nothing to stop")
```

### Issue: Timer shows unexpected duration

**Problem**: Stopped timer shows duration much longer than expected.

**Solution**:
- Timer may have been left running from previous session
- Check start time in the response
- If duration is incorrect, delete the entry and add manual entry:
```python
# Delete incorrect entry
await client.call_tool('delete_time_entry', {
    'time_entry_id': entry['id']
})

# Add correct manual entry
await client.call_tool('add_time_entry', {
    'taskId': task_id,
    'start': 'yesterday 9am',
    'duration': '2h 30m',
    'description': 'Actual work performed'
})
```

### Issue: Description not updating when stopping

**Problem**: Setting description parameter but it doesn't appear in the stopped entry.

**Solution**:
- Verify description parameter is a string, not null/undefined
- Check that description doesn't exceed ClickUp's character limit
- Ensure you have permission to update time entries
```python
# ✅ CORRECT: Explicit string
await client.call_tool('stop_time_tracking', {
    'description': 'Completed authentication implementation'
})

# ❌ WRONG: None/null/undefined
await client.call_tool('stop_time_tracking', {
    'description': None  # Won't update!
})
```

### Issue: Tags not saving when stopping

**Problem**: Setting tags parameter but tags don't appear in entry.

**Solution**:
- Ensure tags is an array of strings
- Check that tags exist in workspace (ClickUp may auto-create or reject)
- Verify you have permission to manage tags
```typescript
// ✅ CORRECT: Array of strings
await client.callTool('stop_time_tracking', {
  tags: ['development', 'backend']
});

// ❌ WRONG: Single string instead of array
await client.callTool('stop_time_tracking', {
  tags: 'development'  // Should be ['development']!
});
```

---

## Changelog

### Version 1.1.0
- ✨ **New**: Automatic retry with exponential backoff
- ✨ **New**: Debug logging with request tracking
- ✨ **New**: Duration formatting (milliseconds → human-readable)
- 🔧 **Changed**: Improved error messages with actionable guidance
- 🔧 **Changed**: Enhanced validation for no running timer

### Version 1.0.0
- ✨ **New**: Initial implementation
- ✨ **New**: Automatic duration calculation from start to stop
- ✨ **New**: Optional description and tags update when stopping
- ✨ **New**: Validation to ensure timer is running before stopping
