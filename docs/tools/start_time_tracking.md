# start_time_tracking

**Category**: Task Management - Time Tracking

Starts a timer on a specific task to track time spent working. Automatically checks for existing running timers and prevents multiple simultaneous timers. Returns the started time entry with task details and optional metadata like description, billable status, and tags.

---

## Use Cases

### 1. **Track Work Time**
Start a timer when beginning work on a task to accurately track time spent on development, design, or other activities for project management and billing.

### 2. **Billable Hours Tracking**
Start timers with billable status enabled to distinguish billable client work from internal overhead for accurate invoicing and budget management.

### 3. **Categorized Time Tracking**
Use tags when starting timers to categorize work by type (development, review, testing, meetings) for detailed time analysis and reporting.

### 4. **Descriptive Time Entries**
Add descriptions when starting timers to provide context about the specific work being performed, making time logs more useful for reviews and retrospectives.

---

## Input Parameters

```json
{
  "taskId": "86fpd7vgc",
  "description": "Implementing authentication logic",
  "billable": true,
  "tags": ["development", "backend"]
}
```

### Parameter Reference

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `taskId` | string | Conditional* | ID of the task (9 chars or custom like "DEV-1234"). **Preferred method**. |
| `taskName` | string | Conditional* | Name of task to start tracking time on. Searches across lists unless `listName` provided. |
| `listName` | string | Optional | Name of list containing the task. Improves accuracy when using `taskName`. |
| `description` | string | Optional | Description for the time entry (e.g., "Implementing authentication logic"). |
| `billable` | boolean | Optional | Whether this time is billable. Defaults to workspace setting if not specified. |
| `tags` | array[string] | Optional | Array of tag names to assign to the time entry (e.g., ["development", "backend"]). |

\* **Task Identification**: Must provide either `taskId` (preferred) OR `taskName` (optionally with `listName`).

---

## Success Response

```json
{
  "success": true,
  "message": "Time tracking started successfully",
  "time_entry": {
    "id": "time_123456789",
    "description": "Implementing authentication logic",
    "start": "2025-01-05T10:30:00.000Z",
    "end": null,
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
| `success` | boolean | Always `true` for successful starts |
| `message` | string | Confirmation message |
| `time_entry` | object | Started time entry details |
| `time_entry.id` | string | Unique ID for the time entry |
| `time_entry.description` | string | Description provided (or empty string) |
| `time_entry.start` | string | ISO 8601 timestamp when timer started |
| `time_entry.end` | null | Always null for running timers |
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
    "timestamp": "2025-01-05T10:30:00.123Z"
  }
}
```

### 2. CONFLICT - Timer Already Running

```json
{
  "success": false,
  "error": {
    "type": "CONFLICT",
    "message": "A timer is already running. Please stop the current timer before starting a new one.",
    "timestamp": "2025-01-05T10:30:00.123Z"
  },
  "timer": {
    "id": "time_987654321",
    "task": {
      "id": "abc123xyz",
      "name": "Debug API endpoint"
    },
    "start": "2025-01-05T09:15:00.000Z",
    "description": "Investigating 500 errors"
  }
}
```

**Why This Happens**: ClickUp enforces a single-timer constraint - only one timer can run at a time per user. This prevents accidentally tracking time on multiple tasks simultaneously.

**How to Resolve**: Stop the currently running timer using `stop_time_tracking` before starting a new one.

### 3. NOT_FOUND - Task Not Found

```json
{
  "success": false,
  "error": {
    "type": "NOT_FOUND",
    "message": "Task with ID '86fpd7vgc' not found",
    "timestamp": "2025-01-05T10:30:00.123Z"
  }
}
```

### 4. AUTH - No Permission

```json
{
  "success": false,
  "error": {
    "type": "AUTH",
    "message": "You do not have permission to track time on this task",
    "timestamp": "2025-01-05T10:30:00.123Z"
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
    "timestamp": "2025-01-05T10:30:00.123Z"
  }
}
```

---

## Rate Limit Information

**Rate Limit Impact**: ~1% per execution

- **Free Forever Plan**: 100 requests/minute
- **Single query**: 1 request (task lookup if using taskName) + 1 request (start timer) = 1-2% of rate limit

---

## API Dependencies

### ClickUp API Endpoints

1. **Start Time Tracking**:
   - `POST /team/{teamId}/time_entries/start` (with task ID in body)

### Required Permissions

- **Read Tasks**: Required to identify task
- **Time Tracking**: Required to start timers

---

## Integration Examples

### Python Example - Start Timer on Task

```python
from mcp_client import MCPClient

async def start_timer(task_id: str, description: str = None, billable: bool = False, tags: list[str] = None):
    """Start time tracking on a task"""
    client = MCPClient()

    response = await client.call_tool('start_time_tracking', {
        'taskId': task_id,
        'description': description,
        'billable': billable,
        'tags': tags or []
    })

    if response['success']:
        entry = response['time_entry']
        print(f"✅ Timer started on task: {entry['task']['name']}")
        print(f"   Started at: {entry['start']}")
        print(f"   Description: {entry['description'] or 'No description'}")
        print(f"   Billable: {'Yes' if entry['billable'] else 'No'}")
        if entry['tags']:
            print(f"   Tags: {', '.join(entry['tags'])}")

        return entry
    else:
        print(f"❌ Error: {response['error']['message']}")

        # If there's a running timer, show details
        if 'timer' in response:
            timer = response['timer']
            print(f"\n⚠️  Currently running timer:")
            print(f"   Task: {timer['task']['name']}")
            print(f"   Started: {timer['start']}")
            print(f"   Description: {timer['description'] or 'No description'}")

        return None

# Usage examples
await start_timer('86fpd7vgc', 'Implementing authentication', billable=True, tags=['development', 'backend'])
await start_timer('86fpd7vgc')  # Minimal - just start timer
```

### Python Example - Safe Start with Existing Timer Check

```python
async def safe_start_timer(task_id: str, description: str = None, billable: bool = False, tags: list[str] = None):
    """Safely start timer, handling existing timers gracefully"""
    client = MCPClient()

    # First check if timer is already running
    current_timer = await client.call_tool('get_current_time_entry')

    if current_timer['success'] and current_timer.get('time_entry'):
        running = current_timer['time_entry']
        print(f"⚠️  Timer already running on: {running['task']['name']}")
        print(f"   Started: {running['start']}")

        # Ask user if they want to stop current and start new
        response = input("Stop current timer and start new one? (y/n): ")
        if response.lower() == 'y':
            # Stop current timer
            stop_result = await client.call_tool('stop_time_tracking')
            if stop_result['success']:
                print(f"✅ Stopped timer on: {running['task']['name']}")
            else:
                print(f"❌ Failed to stop timer: {stop_result['error']['message']}")
                return None
        else:
            print("Keeping current timer running")
            return None

    # Start new timer
    return await start_timer(task_id, description, billable, tags)

# Usage
await safe_start_timer('86fpd7vgc', 'Code review', billable=True, tags=['review'])
```

### TypeScript Example - Start Timer with Task Name

```typescript
import { MCPClient } from 'mcp-client';

async function startTimerByName(
  taskName: string,
  listName?: string,
  description?: string,
  billable?: boolean,
  tags?: string[]
) {
  const client = new MCPClient();

  try {
    const response = await client.callTool('start_time_tracking', {
      taskName,
      listName,
      description,
      billable,
      tags
    });

    if (!response.success) {
      console.error(`❌ Error: ${response.error.message}`);

      // Handle timer already running
      if (response.timer) {
        console.error(`\n⚠️  Currently running timer:`);
        console.error(`   Task: ${response.timer.task.name}`);
        console.error(`   Started: ${response.timer.start}`);
      }

      return null;
    }

    const entry = response.time_entry;
    console.log(`✅ Timer started on: ${entry.task.name}`);
    console.log(`   ID: ${entry.id}`);
    console.log(`   Started: ${entry.start}`);
    console.log(`   Description: ${entry.description || 'No description'}`);
    console.log(`   Billable: ${entry.billable ? 'Yes' : 'No'}`);
    if (entry.tags && entry.tags.length > 0) {
      console.log(`   Tags: ${entry.tags.join(', ')}`);
    }

    return entry;
  } catch (error) {
    console.error('Failed to start timer:', error);
    return null;
  }
}

// Usage examples
await startTimerByName('Implement user authentication', 'Backend Tasks', 'Working on OAuth flow', true, ['development', 'backend']);
await startTimerByName('Fix bug', 'Bug Tracker');  // Minimal
```

### TypeScript Example - Work Session Manager

```typescript
class WorkSessionManager {
  private client: MCPClient;
  private currentTimer: any = null;

  constructor() {
    this.client = new MCPClient();
  }

  async startSession(taskId: string, description: string, billable: boolean = false, tags: string[] = []) {
    // Check for existing timer
    const current = await this.getCurrentTimer();
    if (current) {
      console.log(`⚠️  Timer already running on: ${current.task.name}`);
      console.log(`   Consider stopping it first`);
      return false;
    }

    // Start new timer
    const response = await this.client.callTool('start_time_tracking', {
      taskId,
      description,
      billable,
      tags
    });

    if (response.success) {
      this.currentTimer = response.time_entry;
      console.log(`✅ Session started: ${description}`);
      return true;
    } else {
      console.error(`❌ Failed to start session: ${response.error.message}`);
      return false;
    }
  }

  async getCurrentTimer() {
    const response = await this.client.callTool('get_current_time_entry');
    if (response.success && response.time_entry) {
      return response.time_entry;
    }
    return null;
  }

  async stopSession(description?: string, tags?: string[]) {
    if (!this.currentTimer) {
      console.log('No active session to stop');
      return false;
    }

    const response = await this.client.callTool('stop_time_tracking', {
      description,
      tags
    });

    if (response.success) {
      const entry = response.time_entry;
      console.log(`✅ Session stopped`);
      console.log(`   Duration: ${entry.duration}`);
      console.log(`   Task: ${entry.task.name}`);
      this.currentTimer = null;
      return true;
    } else {
      console.error(`❌ Failed to stop session: ${response.error.message}`);
      return false;
    }
  }

  async switchTask(newTaskId: string, description: string) {
    // Stop current timer if running
    if (this.currentTimer) {
      await this.stopSession();
    }

    // Start new timer
    return await this.startSession(newTaskId, description);
  }
}

// Usage
const manager = new WorkSessionManager();

// Start work session
await manager.startSession('86fpd7vgc', 'Implementing authentication', true, ['development']);

// Later, switch to different task
await manager.switchTask('xyz123abc', 'Code review');

// Stop work session
await manager.stopSession('Completed review');
```

---

## Related Tools

- **`stop_time_tracking`** - Stop currently running timer and create time entry
- **`get_current_time_entry`** - Check if timer is currently running
- **`add_time_entry`** - Add manual time entry (for past work without using timer)
- **`delete_time_entry`** - Delete time entry by ID
- **`get_task_time_entries`** - Get all time entries for a task
- **`get_task`** - Get task details to verify time tracking enabled

---

## Best Practices

### DO:
- ✅ **Check for existing timers** - Use `get_current_time_entry` before starting to avoid conflicts
- ✅ **Use taskId when possible** - Faster and more reliable than task name lookup
- ✅ **Add descriptions** - Provide context about the work being performed
- ✅ **Set billable status** - Distinguish billable client work from overhead
- ✅ **Use tags consistently** - Categorize work for better time analysis
- ✅ **Stop timers promptly** - Avoid leaving timers running overnight or during breaks
- ✅ **Handle timer conflicts** - Implement graceful handling when timer already running
- ✅ **Track immediately** - Start timers when work begins for accurate time capture

### DON'T:
- ❌ **Don't forget to stop** - Long-running timers inflate time tracking and waste resources
- ❌ **Don't start without checking** - Always check for existing timers first
- ❌ **Don't use vague descriptions** - "Working" is not helpful; be specific
- ❌ **Don't ignore billable status** - Set correctly for accurate invoicing
- ❌ **Don't start timers for future work** - Timers track current active work only
- ❌ **Don't leave timers running during meetings** - Stop timer if switching contexts
- ❌ **Don't rely on memory** - Start timer immediately when work begins

---

## Performance Tips

1. **Use taskId to avoid extra lookups**:
```python
# ✅ GOOD: Direct task ID, single API call
response = await client.call_tool('start_time_tracking', {
    'taskId': '86fpd7vgc',
    'description': 'Development work'
})

# ❌ SLOWER: Task name requires lookup, 2 API calls
response = await client.call_tool('start_time_tracking', {
    'taskName': 'Implement authentication',
    'listName': 'Backend Tasks',
    'description': 'Development work'
})
```

2. **Cache current timer state**:
```typescript
// ✅ GOOD: Check once, cache result
class TimerManager {
  private cachedTimer: any = null;
  private lastCheck: number = 0;
  private CACHE_TTL = 60000; // 1 minute

  async getCurrentTimer() {
    const now = Date.now();
    if (this.cachedTimer && (now - this.lastCheck) < this.CACHE_TTL) {
      return this.cachedTimer;
    }

    const response = await client.callTool('get_current_time_entry');
    if (response.success) {
      this.cachedTimer = response.time_entry;
      this.lastCheck = now;
    }
    return this.cachedTimer;
  }
}
```

3. **Batch timer operations**:
```python
# ✅ GOOD: Stop current and start new in one operation
async def switch_task_timer(old_task_id: str, new_task_id: str, description: str):
    # Stop current
    await client.call_tool('stop_time_tracking')
    # Immediately start new
    await client.call_tool('start_time_tracking', {
        'taskId': new_task_id,
        'description': description
    })
```

---

## Common Patterns

### 1. Automatic Timer Start on Task Assignment
```python
async def assign_and_start_timer(task_id: str, assignee_id: str):
    """Assign task and automatically start timer"""
    # Assign task
    assign_result = await client.call_tool('update_task', {
        'taskId': task_id,
        'assignees': {'add': [assignee_id]}
    })

    if assign_result['success']:
        # Start timer
        timer_result = await client.call_tool('start_time_tracking', {
            'taskId': task_id,
            'description': 'Starting work',
            'billable': True
        })
        return timer_result['success']
    return False
```

### 2. Smart Timer with Break Detection
```typescript
async function startSmartTimer(taskId: string, description: string) {
  // Check if there's a running timer
  const current = await client.callTool('get_current_time_entry');

  if (current.success && current.time_entry) {
    const timer = current.time_entry;
    const startTime = new Date(timer.start).getTime();
    const elapsed = Date.now() - startTime;

    // If timer has been running > 2 hours, prompt user
    if (elapsed > 2 * 60 * 60 * 1000) {
      console.log(`⚠️  Timer has been running for ${Math.floor(elapsed / 3600000)}h`);
      console.log(`   Consider stopping it first`);
      return null;
    }
  }

  // Start new timer
  return await client.callTool('start_time_tracking', {
    taskId,
    description
  });
}
```

### 3. Pomodoro Timer Integration
```python
import asyncio

async def pomodoro_work_session(task_id: str, work_minutes: int = 25, break_minutes: int = 5):
    """Run a Pomodoro work session with automatic timer management"""
    # Start timer
    start_result = await client.call_tool('start_time_tracking', {
        'taskId': task_id,
        'description': f'Pomodoro session ({work_minutes}m)',
        'tags': ['pomodoro']
    })

    if not start_result['success']:
        print(f"Failed to start: {start_result['error']['message']}")
        return

    print(f"🍅 Pomodoro started! Work for {work_minutes} minutes...")

    # Wait for work period
    await asyncio.sleep(work_minutes * 60)

    # Stop timer
    stop_result = await client.call_tool('stop_time_tracking', {
        'description': f'Completed {work_minutes}m Pomodoro'
    })

    if stop_result['success']:
        entry = stop_result['time_entry']
        print(f"✅ Pomodoro completed! Duration: {entry['duration']}")
        print(f"   Take a {break_minutes} minute break!")
    else:
        print(f"Failed to stop: {stop_result['error']['message']}")

# Usage
await pomodoro_work_session('86fpd7vgc', work_minutes=25, break_minutes=5)
```

---

## Troubleshooting

### Issue: "A timer is already running"

**Problem**: Trying to start a new timer when one is already active.

**Solution**:
```python
# Check for running timer first
current = await client.call_tool('get_current_time_entry')
if current['success'] and current.get('time_entry'):
    print(f"Timer running on: {current['time_entry']['task']['name']}")

    # Stop current timer
    await client.call_tool('stop_time_tracking')
    print("Stopped current timer")

# Now start new timer
await client.call_tool('start_time_tracking', {'taskId': new_task_id})
```

### Issue: Task not found with taskName

**Problem**: Using taskName without listName matches multiple tasks or no tasks.

**Solution**:
```python
# ❌ BAD: Vague task name, no list context
await client.call_tool('start_time_tracking', {
    'taskName': 'Bug fix'  # Too common!
})

# ✅ GOOD: Specific task name + list context
await client.call_tool('start_time_tracking', {
    'taskName': 'Fix authentication bug',
    'listName': 'Backend Development'
})

# ✅ BEST: Use task ID directly
await client.call_tool('start_time_tracking', {
    'taskId': '86fpd7vgc'
})
```

### Issue: Timer not showing in ClickUp UI

**Problem**: Started timer but it doesn't appear in ClickUp immediately.

**Solution**:
- Timers appear in real-time in ClickUp UI
- Refresh the page if not immediately visible
- Check that time tracking is enabled for the workspace
- Verify you have permission to track time on the task

### Issue: Billable status not saving

**Problem**: Setting `billable: true` but time entry shows as non-billable.

**Solution**:
- Check workspace time tracking settings
- Verify billable status is enabled for your role
- Check task/list doesn't override billable settings
- Some ClickUp plans have restricted billable tracking

---

## Changelog

### Version 1.1.0
- ✨ **New**: Automatic retry with exponential backoff
- ✨ **New**: Debug logging with request tracking
- 🔧 **Changed**: Improved error messages with actionable guidance
- 🔧 **Changed**: Enhanced timer conflict detection

### Version 1.0.0
- ✨ **New**: Initial implementation
- ✨ **New**: Single timer constraint enforcement
- ✨ **New**: Task identification via taskId or taskName + listName
- ✨ **New**: Optional description, billable status, and tags support
