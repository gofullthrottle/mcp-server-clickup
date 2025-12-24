# clickup_space_update

## Overview

Updates an existing space including name, features, color, and privacy settings.

**Category**: Space Management - CRUD Operations

**Rate Limit Impact**: ~2-3% of available requests (100 req/min on Free Forever plan)

---

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `space_id` | string | **Yes** | ID of the space to update |
| `name` | string | No | New name for the space |
| `multiple_assignees` | boolean | No | Allow multiple assignees on tasks |
| `color` | string | No | Hex color code (e.g., "#FF5733") |
| `private` | boolean | No | Make the space private |
| `admin_can_manage` | boolean | No | Allow admins to manage (Enterprise feature) |
| `features` | object | No | Feature configuration (same as create_space) |

---

## Success Response

```json
{
  "id": "90123456",
  "name": "Engineering (Updated)",
  "message": "Space \"Engineering (Updated)\" updated successfully",
  "features": {
    "due_dates": { "enabled": true },
    "time_tracking": { "enabled": false }
  }
}
```

---

## Integration Examples

### Python Example
```python
# Update space name and color
result = await mcp_server.call_tool(
    "clickup_space_update",
    {
        "space_id": "90123456",
        "name": "Engineering Team",
        "color": "#0066CC"
    }
)

print(f"✅ {result['message']}")
```

---

## Related Tools

- **clickup_space_get**: Get current space details
- **clickup_space_toggle_feature**: Toggle individual features

---

**Last Updated**: 2025-10-30
