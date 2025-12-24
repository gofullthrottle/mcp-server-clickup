# clickup_project_create_milestones

## Overview

Creates project milestones based on project phases automatically distributed across project duration.

**Category**: Project Management - Milestone Operations

**Rate Limit Impact**: ~5-8% of available requests (creates multiple milestone tasks)

---

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `list_id` | string | **Yes** | List ID where milestones will be created |
| `project_start_date` | string (ISO) | **Yes** | Project start date |
| `project_duration_days` | number | **Yes** | Total project duration in days |

---

## Success Response

```json
{
  "milestones": [
    {
      "id": "task-123",
      "name": "Planning Complete",
      "due_date": "2024-03-22T23:59:59Z"
    },
    {
      "id": "task-124",
      "name": "Development Complete",
      "due_date": "2024-04-30T23:59:59Z"
    },
    {
      "id": "task-125",
      "name": "Testing Complete",
      "due_date": "2024-05-22T23:59:59Z"
    },
    {
      "id": "task-126",
      "name": "Deployment Complete",
      "due_date": "2024-05-30T23:59:59Z"
    }
  ],
  "count": 4,
  "message": "Created 4 project milestones"
}
```

---

## Default Milestones

Milestones are automatically created for standard project phases:

1. **Planning Complete** (25% of duration)
2. **Development Complete** (60% of duration)
3. **Testing Complete** (85% of duration)
4. **Deployment Complete** (100% of duration)

---

## Integration Examples

### Python Example
```python
from datetime import datetime, timezone

# Create milestones for 90-day project
start_date = datetime.now(timezone.utc)

result = await mcp_server.call_tool(
    "clickup_project_create_milestones",
    {
        "list_id": "901234567",
        "project_start_date": start_date.isoformat(),
        "project_duration_days": 90
    }
)

print(f"✅ {result['message']}")

for milestone in result['milestones']:
    print(f"\n{milestone['name']}")
    print(f"  Due: {milestone['due_date']}")
    print(f"  ID: {milestone['id']}")
```

### TypeScript Example
```typescript
// Create milestones for quarterly project
const startDate = new Date().toISOString();

const result = await mcpServer.callTool(
  "clickup_project_create_milestones",
  {
    list_id: "901234567",
    project_start_date: startDate,
    project_duration_days: 90
  }
);

console.log(`✅ ${result.message}`);
console.log(`Created ${result.count} milestones`);
```

---

## Best Practices

1. **CREATE EARLY**: Set up milestones at project start
2. **GANTT VISIBILITY**: Milestones show clearly on Gantt charts
3. **TRACK PROGRESS**: Use milestones for progress reporting
4. **CUSTOMIZE**: Adjust milestone dates after creation if needed
5. **DEPENDENCIES**: Link tasks to milestones for dependency tracking

---

## Related Tools

- **clickup_project_initialize**: Initialize project with automatic milestones
- **clickup_task_create_with_duration**: Create task with start date and duration
- **create_task**: Create custom milestone tasks

---

**Last Updated**: 2025-10-30
