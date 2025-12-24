# clickup_task_create_with_duration

## What This Tool Does

**In simple terms**: Creates a regular ClickUp task with a **start date** AND a **due date**. You provide the start date and duration (in days), and it automatically calculates the end date for you.

**What it does NOT do**:
- ❌ Does NOT create or manipulate Gantt charts via API (ClickUp API doesn't expose Gantt chart configuration)
- ❌ Does NOT enable Gantt view (that's a UI setting in ClickUp)
- ❌ Does NOT create special "Gantt chart objects"

**What it DOES do**:
- ✅ Creates a task with `start_date` and `due_date` fields
- ✅ Calculates `due_date` automatically from `start_date` + `duration_days`
- ✅ Sets time estimate (shows as duration bar in Gantt view)
- ✅ This task will automatically appear on ClickUp's Gantt timeline view

**Bonus**: Tasks with both start and due dates automatically appear on ClickUp's Gantt chart timeline view (in the web UI).

**Analogy**: Like creating a calendar event - you tell it "starts Monday, lasts 5 days" and it calculates "ends Friday" for you.

---

## Overview

Convenience tool for creating tasks with automatic due date calculation from start date + duration.

**Category**: Project Management - Timeline Task Operations

**Rate Limit Impact**: ~2-3% of available requests (100 req/min on Free Forever plan)

---

## Use Cases

1. **Project Timeline**: Create main project task that spans entire project duration
2. **Phase Tracking**: Create phase tasks (Planning, Development, Testing, Deployment)
3. **Visual Planning**: Tasks appear as bars on ClickUp Gantt timeline view
4. **Duration Calculation**: Automatically calculates end date from start + duration

---

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `list_id` | string | **Yes** | List ID where task will be created |
| `name` | string | **Yes** | Task name |
| `description` | string | No | Task description |
| `start_date` | string (ISO) | **Yes** | Task start date |
| `duration_days` | number | **Yes** | Duration in days (end date calculated automatically) |
| `estimated_hours` | number | No | Total estimated hours |
| `priority` | number (1-4) | No | Priority: 1=urgent, 2=high, 3=normal, 4=low |

---

## Success Response

```json
{
  "task_id": "task-123",
  "name": "Q1 Platform Development",
  "start_date": "2024-03-01T00:00:00Z",
  "due_date": "2024-05-30T23:59:59Z",
  "duration_days": 90,
  "url": "https://app.clickup.com/t/task-123",
  "message": "Task \"Q1 Platform Development\" created with duration successfully"
}
```

---

## Integration Examples

### Python Example
```python
from datetime import datetime, timedelta, timezone

# Create task with duration (auto-calculates end date)
start_date = datetime.now(timezone.utc)
duration = 90

result = await mcp_server.call_tool(
    "clickup_task_create_with_duration",
    {
        "list_id": "901234567",
        "name": "Q1 Platform Development",
        "description": "Core platform features for Q1 release",
        "start_date": start_date.isoformat(),
        "duration_days": duration,
        "estimated_hours": 720,
        "priority": 2  # High priority
    }
)

print(f"✅ {result['message']}")
print(f"Start: {result['start_date']}")
print(f"End: {result['due_date']}")
print(f"Duration: {result['duration_days']} days")
```

---

## Technical Implementation

**What this tool actually does behind the scenes**:

```typescript
// 1. Calculate due date from start + duration
const dueDate = new Date(startDate);
dueDate.setDate(dueDate.getDate() + durationDays);

// 2. Create a normal ClickUp task with BOTH dates
const task = await createTask({
  name: "Q1 Platform Development",
  start_date: startDate.getTime(),  // <-- Makes it appear on Gantt
  due_date: dueDate.getTime(),      // <-- Makes it a timeline bar
  time_estimate: estimatedHours * 3600000  // <-- Bar length in Gantt
});

// 3. That's it! ClickUp UI automatically shows this on Gantt view
```

**Why this is useful**: You don't have to manually calculate "90 days from March 1" - the tool does the date math for you.

---

## Best Practices

1. **REALISTIC DURATION**: Set achievable project duration (days)
2. **ESTIMATED HOURS**: Provide total hours - appears as bar length on Gantt
3. **START DATE**: Use actual project start date for accurate timeline
4. **SUB-TASKS**: Create sub-tasks with their own start/due dates for full timeline
5. **VIEW IN CLICKUP**: Open ClickUp's Gantt view to see the timeline visualization

---

## Common Questions

**Q: Why not just use `create_task` and set both dates manually?**
A: You can! This tool is just a convenience - it calculates the end date for you from start + duration.

**Q: Will this task appear on the Gantt timeline view?**
A: Yes! Any task with both start_date and due_date automatically appears on ClickUp's Gantt chart view in the web UI.

**Q: Can I create subtasks under this?**
A: Yes! Use `create_task` with `parent` parameter to create subtasks under this timeline task.

---

## Related Tools

- **create_task**: Create tasks manually with full control over all fields
- **clickup_project_create_milestones**: Create milestone tasks distributed across project timeline
- **clickup_project_initialize**: Initialize complete project with timeline structure

---

**Last Updated**: 2025-11-14
**Renamed from**: `clickup_project_create_gantt` (clarified purpose: duration-based task creation)
