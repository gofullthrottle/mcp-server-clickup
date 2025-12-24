# clickup_space_create

## Overview

Creates a new space in the workspace with configurable features.

**Category**: Space Management - CRUD Operations

**Rate Limit Impact**: ~2-3% of available requests (100 req/min on Free Forever plan)

---

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | **Yes** | Name of the new space |
| `multiple_assignees` | boolean | **Yes** | Allow multiple assignees on tasks |
| `features` | object | No | Feature configuration (see below) |

### Features Object

```json
{
  "due_dates": {
    "enabled": true,
    "start_date": true,
    "remap_due_dates": true,
    "remap_closed_due_date": false
  },
  "time_tracking": { "enabled": true },
  "tags": { "enabled": true },
  "time_estimates": { "enabled": true },
  "checklists": { "enabled": true },
  "custom_fields": { "enabled": true },
  "remap_dependencies": { "enabled": true },
  "dependency_warning": { "enabled": true },
  "portfolios": { "enabled": false }
}
```

---

## Success Response

```json
{
  "id": "90123456",
  "name": "Engineering",
  "message": "Space \"Engineering\" created successfully",
  "features": {
    "due_dates": { "enabled": true },
    "time_tracking": { "enabled": true }
  }
}
```

---

## Integration Examples

### Python Example
```python
# Create space with features
result = await mcp_server.call_tool(
    "clickup_space_create",
    {
        "name": "Product Development",
        "multiple_assignees": True,
        "features": {
            "due_dates": {"enabled": True, "start_date": True},
            "time_tracking": {"enabled": True},
            "custom_fields": {"enabled": True}
        }
    }
)

print(f"✅ {result['message']}")
print(f"Space ID: {result['id']}")
```

---

## Related Tools

- **clickup_space_get**: Get space details
- **clickup_space_update**: Update space properties

---

**Last Updated**: 2025-10-30
