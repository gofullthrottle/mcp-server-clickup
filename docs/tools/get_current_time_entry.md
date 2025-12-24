# get_current_time_entry

**Category**: Task Management - Time Tracking

Checks if a timer is currently running and returns the active time entry details with real-time elapsed duration. Requires no parameters and provides instant status of active time tracking, useful for timer management, status displays, and preventing timer conflicts.

---

## Use Cases

### 1. **Timer Status Check**
Check if a timer is currently running before starting a new one to prevent timer conflicts and maintain single-timer constraint.

### 2. **Real-time Duration Display**
Display the current elapsed time for a running timer in status bars, dashboards, or time tracking widgets with automatically calculated duration.

### 3. **Timer Management**
Determine which task currently has an active timer for context switching, timer cleanup, or end-of-day timer validation.

### 4. **Automated Timer Validation**
Verify timer state before automated operations (task switching, shutdown scripts, cron jobs) to ensure proper time tracking hygiene.

---

## Input Parameters

```json
{}
```

**No parameters required** - this tool checks the global timer state for the authenticated user.

---

## Success Response - Timer Running

```json
{
  "success": true,
  "timer_running": true,
  "time_entry": {
    "id": "time_123456789",
    "description": "Implementing authentication logic",
    "start": "2025-01-05T10:30:00.000Z",
    "elapsed": "2h 15m",
    "elapsed_ms": 8100000,
    "task": {
      "id": "86fpd7vgc",
      "name": "Implement user authentication"
    },
    "billable": true,
    "tags": ["development", "backend"]
  }
}
```

### Response Fields (Timer Running)

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Always `true` for successful checks |
| `timer_running` | boolean | `true` when a timer is active |
| `time_entry` | object | Active time entry details |
| `time_entry.id` | string | Unique ID for the time entry |
| `time_entry.description` | string | Description provided when started (or empty) |
| `time_entry.start` | string | ISO 8601 timestamp when timer started |
| `time_entry.elapsed` | string | **Real-time** human-readable elapsed time (e.g., "2h 15m") |
| `time_entry.elapsed_ms` | number | **Real-time** elapsed duration in milliseconds |
| `time_entry.task` | object | Task details |
| `time_entry.task.id` | string | Task ID |
| `time_entry.task.name` | string | Task name |
| `time_entry.billable` | boolean | Whether time is billable |
| `time_entry.tags` | array[string] | Assigned tags |

**Note**: `elapsed` and `elapsed_ms` are **calculated in real-time** based on the current time minus start time, not stored values.

---

## Success Response - No Timer Running

```json
{
  "success": true,
  "timer_running": false,
  "message": "No timer is currently running."
}
```

### Response Fields (No Timer)

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Always `true` for successful checks |
| `timer_running` | boolean | `false` when no timer is active |
| `message` | string | Informational message |

---

## Error Responses

### 1. AUTH - No Permission

```json
{
  "success": false,
  "error": {
    "type": "AUTH",
    "message": "You do not have permission to view time tracking status",
    "timestamp": "2025-01-05T12:45:00.123Z"
  }
}
```

### 2. RATE_LIMIT

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
- **Single query**: 1 request (get current timer) = 1% of rate limit

**Note**: This is a very lightweight operation suitable for frequent polling or status checks.

---

## API Dependencies

### ClickUp API Endpoints

1. **Get Current Time Entry**:
   - `GET /team/{teamId}/time_entries/current`

### Required Permissions

- **Time Tracking**: Required to view timer status

---

## Integration Examples

### Python Example - Check Timer Status

```python
from mcp_client import MCPClient

async def check_timer_status():
    """Check if a timer is currently running"""
    client = MCPClient()

    response = await client.call_tool('get_current_time_entry')

    if response['success']:
        if response['timer_running']:
            entry = response['time_entry']
            print(f"⏱️  Timer running")
            print(f"   Task: {entry['task']['name']}")
            print(f"   Started: {entry['start']}")
            print(f"   Elapsed: {entry['elapsed']} ({entry['elapsed_ms']}ms)")
            print(f"   Description: {entry['description'] or 'No description'}")
            print(f"   Billable: {'Yes' if entry['billable'] else 'No'}")
            if entry['tags']:
                print(f"   Tags: {', '.join(entry['tags'])}")
            return entry
        else:
            print("✅ No timer running")
            return None
    else:
        print(f"❌ Error: {response['error']['message']}")
        return None

# Usage
await check_timer_status()
```

### Python Example - Safe Start Timer

```python
async def safe_start_timer(task_id: str, description: str, billable: bool = False):
    """Start timer only if no timer is currently running"""
    client = MCPClient()

    # Check for existing timer
    current = await client.call_tool('get_current_time_entry')

    if current['success'] and current['timer_running']:
        entry = current['time_entry']
        print(f"⚠️  Timer already running on: {entry['task']['name']}")
        print(f"   Elapsed: {entry['elapsed']}")
        print(f"   Please stop current timer first")
        return None

    # No timer running, safe to start
    start_result = await client.call_tool('start_time_tracking', {
        'taskId': task_id,
        'description': description,
        'billable': billable
    })

    if start_result['success']:
        print(f"✅ Timer started on: {start_result['time_entry']['task']['name']}")
        return start_result['time_entry']
    else:
        print(f"❌ Failed to start: {start_result['error']['message']}")
        return None

# Usage
await safe_start_timer('86fpd7vgc', 'Implementing authentication', billable=True)
```

### TypeScript Example - Timer Status Widget

```typescript
import { MCPClient } from 'mcp-client';

class TimerStatusWidget {
  private client: MCPClient;
  private refreshInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.client = new MCPClient();
  }

  async displayStatus() {
    const response = await this.client.callTool('get_current_time_entry');

    if (!response.success) {
      console.error(`❌ Error: ${response.error.message}`);
      return;
    }

    // Clear screen (for terminal display)
    console.clear();

    if (response.timer_running) {
      const entry = response.time_entry;

      console.log('╔══════════════════════════════════════╗');
      console.log('║       TIMER RUNNING                 ║');
      console.log('╚══════════════════════════════════════╝');
      console.log('');
      console.log(`Task: ${entry.task.name}`);
      console.log(`Description: ${entry.description || 'No description'}`);
      console.log(`Started: ${new Date(entry.start).toLocaleString()}`);
      console.log('');
      console.log(`⏱️  Elapsed: ${entry.elapsed}`);
      console.log(`💰 Billable: ${entry.billable ? 'Yes' : 'No'}`);

      if (entry.tags && entry.tags.length > 0) {
        console.log(`🏷️  Tags: ${entry.tags.join(', ')}`);
      }
    } else {
      console.log('╔══════════════════════════════════════╗');
      console.log('║       NO TIMER RUNNING              ║');
      console.log('╚══════════════════════════════════════╝');
      console.log('');
      console.log('Start a timer with: start_time_tracking');
    }
  }

  startAutoRefresh(intervalMs: number = 5000) {
    this.stopAutoRefresh();

    this.refreshInterval = setInterval(async () => {
      await this.displayStatus();
    }, intervalMs);

    // Display immediately
    this.displayStatus();
  }

  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }
}

// Usage - auto-updating status widget
const widget = new TimerStatusWidget();
widget.startAutoRefresh(5000);  // Refresh every 5 seconds

// Stop refreshing after 1 minute
setTimeout(() => {
  widget.stopAutoRefresh();
}, 60000);
```

### Python Example - End-of-Day Timer Check

```python
import asyncio
from datetime import datetime

async def end_of_day_timer_check():
    """Check for running timers at end of day and prompt user"""
    client = MCPClient()

    print(f"🌙 End-of-day timer check at {datetime.now().strftime('%H:%M')}")

    current = await client.call_tool('get_current_time_entry')

    if not current['success']:
        print(f"❌ Error checking timer: {current['error']['message']}")
        return

    if current['timer_running']:
        entry = current['time_entry']
        elapsed_hours = entry['elapsed_ms'] / 3600000

        print(f"\n⚠️  WARNING: Timer still running!")
        print(f"   Task: {entry['task']['name']}")
        print(f"   Started: {entry['start']}")
        print(f"   Elapsed: {entry['elapsed']} ({elapsed_hours:.2f}h)")

        if elapsed_hours > 8:
            print(f"\n⚠️  Timer has been running for over 8 hours!")
            print(f"   This seems unusual. Did you forget to stop it?")

        # Prompt to stop timer
        print(f"\nWould you like to stop this timer?")
        # (In real implementation, add user input handling)

        # For automation, could auto-stop:
        # stop_result = await client.call_tool('stop_time_tracking', {
        #     'description': 'Automatic end-of-day stop'
        # })
    else:
        print("✅ No timers running - all good!")

# Usage - run as part of shutdown script or cron job
await end_of_day_timer_check()
```

### TypeScript Example - Timer Conflict Checker

```typescript
async function ensureNoTimerConflict(newTaskId: string) {
  const client = new MCPClient();

  // Check current timer
  const current = await client.callTool('get_current_time_entry');

  if (!current.success) {
    console.error(`❌ Error: ${current.error.message}`);
    return false;
  }

  if (current.timer_running) {
    const entry = current.time_entry;

    // Check if timer is on same task
    if (entry.task.id === newTaskId) {
      console.log(`✅ Timer already running on this task`);
      console.log(`   Elapsed: ${entry.elapsed}`);
      return true;
    }

    // Timer on different task - prompt user
    console.log(`⚠️  Timer running on different task:`);
    console.log(`   Current: ${entry.task.name} (${entry.elapsed} elapsed)`);
    console.log(`   Requested: Task ${newTaskId}`);
    console.log(`\nOptions:`);
    console.log(`   1. Stop current timer and start new one`);
    console.log(`   2. Continue with current timer`);

    // Return false to indicate conflict
    return false;
  }

  // No timer running, no conflict
  console.log('✅ No timer conflict');
  return true;
}

// Usage
const canStart = await ensureNoTimerConflict('86fpd7vgc');
if (canStart) {
  await client.callTool('start_time_tracking', { taskId: '86fpd7vgc' });
}
```

### Python Example - Timer Status for Status Bar

```python
async def get_timer_status_brief():
    """Get brief timer status for status bar display"""
    client = MCPClient()

    current = await client.call_tool('get_current_time_entry')

    if not current['success']:
        return "⏱️  Error checking timer"

    if current['timer_running']:
        entry = current['time_entry']
        task_name = entry['task']['name']

        # Truncate long task names
        if len(task_name) > 30:
            task_name = task_name[:27] + "..."

        return f"⏱️  {entry['elapsed']} - {task_name}"
    else:
        return "⏱️  No timer"

# Usage in status bar
status = await get_timer_status_brief()
print(status)  # Output: ⏱️  2h 15m - Implement user authentication
```

---

## Related Tools

- **`start_time_tracking`** - Start timer after checking none is running
- **`stop_time_tracking`** - Stop the currently running timer
- **`add_time_entry`** - Add manual time entry (when no timer used)
- **`delete_time_entry`** - Delete time entry by ID
- **`get_task_time_entries`** - Get all time entries for a task
- **`get_task`** - Get task details for the active timer's task

---

## Best Practices

### DO:
- ✅ **Check before starting** - Always check for running timer before starting new one
- ✅ **Poll for status displays** - Use this tool for real-time timer displays
- ✅ **Validate before operations** - Check timer state before automated operations
- ✅ **End-of-day checks** - Include timer checks in shutdown scripts
- ✅ **Cache briefly** - Cache result for 10-30 seconds if polling frequently
- ✅ **Show elapsed time** - Display real-time elapsed duration to users
- ✅ **Handle both states** - Support both timer_running true and false responses
- ✅ **Use for conflict prevention** - Check before starting timers programmatically

### DON'T:
- ❌ **Don't poll too frequently** - Avoid checking more than once per second
- ❌ **Don't assume timer exists** - Always check timer_running field first
- ❌ **Don't ignore response structure** - Handle both timer running and not running cases
- ❌ **Don't cache too long** - Stale timer status can cause conflicts
- ❌ **Don't bypass for manual starts** - Always check even for manual timer starts
- ❌ **Don't forget error handling** - Handle API errors gracefully
- ❌ **Don't rely solely on client state** - Always check server-side timer state

---

## Performance Tips

1. **Cache timer status briefly**:
```python
# ✅ GOOD: Cache for short periods when polling
class TimerStatusCache:
    def __init__(self, cache_ttl_ms: int = 5000):
        self.cached_status = None
        self.last_check = 0
        self.cache_ttl_ms = cache_ttl_ms

    async def get_status(self):
        now = time.time() * 1000

        # Return cached if still valid
        if self.cached_status and (now - self.last_check) < self.cache_ttl_ms:
            return self.cached_status

        # Fetch new status
        result = await client.call_tool('get_current_time_entry')

        if result['success']:
            self.cached_status = result
            self.last_check = now

        return result

# Usage
cache = TimerStatusCache(cache_ttl_ms=5000)  # 5 second cache
status = await cache.get_status()
```

2. **Batch timer checks efficiently**:
```typescript
// ✅ GOOD: Check once, use result multiple times
async function validateAndStart(taskId: string) {
  // Single check
  const current = await client.callTool('get_current_time_entry');

  if (!current.success) {
    throw new Error(current.error.message);
  }

  // Use result for multiple validations
  const hasTimer = current.timer_running;
  const isRightTask = hasTimer && current.time_entry.task.id === taskId;
  const elapsedMs = hasTimer ? current.time_entry.elapsed_ms : 0;

  // Make decisions based on single check
  if (hasTimer && !isRightTask) {
    console.log('Stop existing timer first');
    return false;
  }

  return true;
}
```

3. **Avoid unnecessary checks**:
```python
# ✅ GOOD: Track timer state locally to reduce API calls
class TimerManager:
    def __init__(self):
        self.timer_active = False
        self.last_started_task = None

    async def start_timer(self, task_id: str):
        # Only check API if we think timer might be running
        if self.timer_active:
            current = await client.call_tool('get_current_time_entry')
            if current['success'] and current['timer_running']:
                print("Timer already running")
                return None

        # Start timer
        result = await client.call_tool('start_time_tracking', {'taskId': task_id})

        if result['success']:
            self.timer_active = True
            self.last_started_task = task_id

        return result

    async def stop_timer(self):
        result = await client.call_tool('stop_time_tracking')

        if result['success']:
            self.timer_active = False
            self.last_started_task = None

        return result
```

---

## Common Patterns

### 1. Auto-refresh Timer Display
```python
import asyncio

async def timer_display_loop():
    """Continuously display timer status"""
    while True:
        current = await client.call_tool('get_current_time_entry')

        if current['success'] and current['timer_running']:
            entry = current['time_entry']
            print(f"\r⏱️  {entry['elapsed']} - {entry['task']['name']}", end='', flush=True)
        else:
            print(f"\r⏱️  No timer running" + " " * 50, end='', flush=True)

        await asyncio.sleep(1)  # Update every second

# Run in background
asyncio.create_task(timer_display_loop())
```

### 2. Timer Health Check
```typescript
async function checkTimerHealth(): Promise<{
  healthy: boolean;
  issues: string[];
  timer: any | null;
}> {
  const issues: string[] = [];
  let timer = null;

  const current = await client.callTool('get_current_time_entry');

  if (!current.success) {
    issues.push(`API Error: ${current.error.message}`);
    return { healthy: false, issues, timer };
  }

  if (current.timer_running) {
    timer = current.time_entry;
    const elapsedHours = timer.elapsed_ms / 3600000;

    // Check for abnormally long timer
    if (elapsedHours > 10) {
      issues.push(`Timer running for ${elapsedHours.toFixed(1)}h - unusually long`);
    }

    // Check if timer has no description
    if (!timer.description) {
      issues.push('Timer has no description');
    }

    // Check if started more than 24 hours ago
    const startTime = new Date(timer.start).getTime();
    const hoursSinceStart = (Date.now() - startTime) / 3600000;

    if (hoursSinceStart > 24) {
      issues.push(`Timer started ${hoursSinceStart.toFixed(0)}h ago - possible forgotten timer`);
    }
  }

  return {
    healthy: issues.length === 0,
    issues,
    timer
  };
}

// Usage
const health = await checkTimerHealth();
if (!health.healthy) {
  console.log('⚠️  Timer issues detected:');
  health.issues.forEach(issue => console.log(`   - ${issue}`));
}
```

### 3. Smart Task Switcher
```python
async def switch_task_smart(new_task_id: str, new_description: str):
    """Intelligently switch between tasks"""
    client = MCPClient()

    # Check current status
    current = await client.call_tool('get_current_time_entry')

    if not current['success']:
        print(f"❌ Error: {current['error']['message']}")
        return False

    if current['timer_running']:
        entry = current['time_entry']

        # Check if already on this task
        if entry['task']['id'] == new_task_id:
            print(f"✅ Already tracking {entry['task']['name']}")
            print(f"   Elapsed: {entry['elapsed']}")
            return True

        # Stop current timer
        print(f"⏱️  Stopping timer on: {entry['task']['name']}")
        print(f"   Duration: {entry['elapsed']}")

        stop_result = await client.call_tool('stop_time_tracking', {
            'description': f"{entry['description']} (switched tasks)"
        })

        if not stop_result['success']:
            print(f"❌ Failed to stop: {stop_result['error']['message']}")
            return False

    # Start new timer
    start_result = await client.call_tool('start_time_tracking', {
        'taskId': new_task_id,
        'description': new_description
    })

    if start_result['success']:
        print(f"✅ Started timer on: {start_result['time_entry']['task']['name']}")
        return True
    else:
        print(f"❌ Failed to start: {start_result['error']['message']}")
        return False

# Usage
await switch_task_smart('86fpd7vgc', 'Working on authentication')
```

---

## Troubleshooting

### Issue: Response shows timer_running but timer details missing

**Problem**: Response has `timer_running: true` but no `time_entry` field.

**Solution**:
- This shouldn't happen with properly functioning API
- If it does, try stopping the timer blindly:
```python
await client.call_tool('stop_time_tracking')
```

### Issue: Elapsed time seems incorrect

**Problem**: Elapsed duration doesn't match expectations.

**Solution**:
- Elapsed time is calculated in real-time (current time - start time)
- Check your system clock is correct
- Verify start time in the response
- Consider timezone differences

### Issue: Polling causes rate limit errors

**Problem**: Checking timer status too frequently triggers rate limits.

**Solution**:
```python
# ✅ GOOD: Reasonable polling interval
import asyncio

async def poll_with_backoff():
    while True:
        result = await client.call_tool('get_current_time_entry')

        if not result['success'] and 'rate_limit' in result['error']['type'].lower():
            # Back off if rate limited
            print("Rate limited, waiting...")
            await asyncio.sleep(10)
        else:
            await asyncio.sleep(5)  # Normal 5-second interval
```

### Issue: Timer status is stale/cached

**Problem**: Timer status doesn't reflect recent start/stop operations.

**Solution**:
- This tool always returns live data from the API
- If data seems stale, check for caching in your client code
- Verify you're not caching the response yourself
- Try waiting 1-2 seconds after start/stop before checking

---

## Changelog

### Version 1.1.0
- ✨ **New**: Automatic retry with exponential backoff
- ✨ **New**: Real-time elapsed duration calculation
- ✨ **New**: Debug logging with request tracking
- 🔧 **Changed**: Improved response structure with clear timer_running flag
- 🔧 **Changed**: Enhanced elapsed time formatting

### Version 1.0.0
- ✨ **New**: Initial implementation
- ✨ **New**: No parameters required
- ✨ **New**: Returns timer status and details
- ✨ **New**: Real-time elapsed duration in response
