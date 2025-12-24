# clickup_space_get

## Overview

Gets detailed information about a specific space including features, members, and statuses.

**Category**: Space Management - CRUD Operations

**Rate Limit Impact**: ~1-2% of available requests (100 req/min on Free Forever plan)

---

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `space_id` | string | **Yes** | ID of the space to retrieve |

---

## Success Response

```json
{
  "id": "90123456",
  "name": "Engineering",
  "private": false,
  "color": "#FF5733",
  "archived": false,
  "multiple_assignees": true,
  "features": {
    "due_dates": { "enabled": true, "start_date": true },
    "time_tracking": { "enabled": true },
    "tags": { "enabled": true },
    "checklists": { "enabled": true }
  },
  "statuses": [
    {
      "id": "p90123456_abc123",
      "status": "To Do",
      "type": "open",
      "orderindex": 0,
      "color": "#d3d3d3"
    }
  ],
  "members": [
    {
      "id": 12345,
      "username": "john.doe",
      "email": "john@example.com",
      "initials": "JD"
    }
  ]
}
```

---

## Integration Examples

### Python Example
```python
# Get space details
result = await mcp_server.call_tool(
    "clickup_space_get",
    {"space_id": "90123456"}
)

print(f"Space: {result['name']}")
print(f"Features:")
print(f"  Time Tracking: {result['features']['time_tracking']['enabled']}")
print(f"  Custom Fields: {result['features']['custom_fields']['enabled']}")
print(f"Members: {len(result['members'])}")
```

---

## Related Tools

- **clickup_space_list**: List all spaces
- **clickup_space_update**: Update space properties
- **clickup_space_toggle_feature**: Enable/disable features

---

**Last Updated**: 2025-10-30
