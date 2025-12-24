# clickup_project_initialize

## Overview

Initializes a complete project with space, folders, lists, and optional Gantt support. Applies a template structure (default, agile, or kanban).

**Category**: Project Management - Setup Operations

**Rate Limit Impact**: ~15-20% of available requests (creates space + multiple folders/lists)

---

## Use Cases

1. **Rapid Project Setup**: Create complete project structure in one operation
2. **Template-Based Projects**: Apply best-practice templates
3. **Consistent Structure**: Ensure all projects follow same organization
4. **Gantt Project Management**: Optional Gantt chart for timeline tracking

---

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | **Yes** | Project name |
| `description` | string | No | Project description |
| `template` | string (enum) | No | Template: `"default"`, `"agile"`, `"kanban"` (default: "default") |
| `start_date` | string (ISO) | No | Project start date |
| `duration_days` | number | No | Project duration in days (default: 90) |
| `enable_gantt` | boolean | No | Create main Gantt project task (default: true) |
| `enable_dependencies` | boolean | No | Enable task dependencies (default: true) |
| `enable_time_tracking` | boolean | No | Enable time tracking (default: true) |
| `enable_custom_fields` | boolean | No | Enable custom fields (default: true) |
| `enable_multiple_assignees` | boolean | No | Allow multiple assignees (default: true) |

---

## Project Templates

### Default Template
```
Project Space
├── Planning
│   ├── Requirements
│   ├── Design
│   └── Research
├── Development
│   ├── Frontend
│   ├── Backend
│   └── Database
├── Testing
│   ├── Unit Tests
│   ├── Integration Tests
│   └── QA Testing
└── Deployment
    ├── Staging
    └── Production
```

### Agile Template
```
Project Space
├── Product Backlog
├── Sprint Planning
├── Current Sprint
├── In Review
└── Done
```

### Kanban Template
```
Project Space
├── Backlog
├── To Do
├── In Progress
├── Review
└── Completed
```

---

## Success Response

```json
{
  "space_id": "90123456",
  "folders": [
    {
      "id": "801234567",
      "name": "Planning",
      "lists": [
        {"id": "901234567", "name": "Requirements"},
        {"id": "901234568", "name": "Design"}
      ]
    }
  ],
  "gantt_project": {
    "id": "task-123",
    "name": "Engineering Platform",
    "url": "https://app.clickup.com/..."
  },
  "message": "Project initialized successfully",
  "template_used": "default",
  "total_lists_created": 12
}
```

---

## Integration Examples

### Python Example
```python
# Initialize agile project
result = await mcp_server.call_tool(
    "clickup_project_initialize",
    {
        "name": "Engineering Platform",
        "description": "Core platform development project",
        "template": "agile",
        "start_date": "2024-03-01T00:00:00Z",
        "duration_days": 180,
        "enable_gantt": True,
        "enable_time_tracking": True
    }
)

print(f"✅ {result['message']}")
print(f"Space ID: {result['space_id']}")
print(f"Created {result['total_lists_created']} lists")

if result.get('gantt_project'):
    print(f"Gantt Project: {result['gantt_project']['url']}")
```

### TypeScript Example
```typescript
// Quick kanban setup
const result = await mcpServer.callTool(
  "clickup_project_initialize",
  {
    name: "Marketing Campaign Q1",
    template: "kanban",
    enable_gantt: false
  }
);

console.log(`✅ ${result.message}`);
console.log(`Space: ${result.space_id}`);
```

---

## Best Practices

1. **CHOOSE TEMPLATE**: Select template matching project methodology
2. **GANTT FOR TIMELINES**: Enable Gantt for date-sensitive projects
3. **CUSTOM STRUCTURE**: Use default template then customize as needed
4. **FEATURE PLANNING**: Enable only needed features to reduce complexity
5. **START DATE**: Provide start date for accurate Gantt scheduling

---

## Related Tools

- **clickup_task_create_with_duration**: Create task with start date and duration
- **clickup_project_apply_template**: Apply template to existing space
- **clickup_project_get_templates**: List available templates

---

**Last Updated**: 2025-10-30
