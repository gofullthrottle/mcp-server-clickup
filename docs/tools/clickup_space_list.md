# clickup_space_list

## Overview

Lists all spaces in the workspace. Returns active spaces by default, with option to include archived spaces.

**Category**: Space Management - CRUD Operations

**Rate Limit Impact**: ~1-2% of available requests (100 req/min on Free Forever plan)

---

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `archived` | boolean | No | Include archived spaces (default: false) |

---

## Success Response

```json
{
  "spaces": [
    {
      "id": "90123456",
      "name": "Engineering",
      "private": false,
      "color": "#FF5733",
      "archived": false,
      "multiple_assignees": true,
      "features": {
        "due_dates": { "enabled": true },
        "time_tracking": { "enabled": true }
      },
      "member_count": 12
    }
  ],
  "total": 3
}
```

---

## Integration Examples

### Python Example
```python
# List active spaces
result = await mcp_server.call_tool(
    "clickup_space_list",
    {"archived": False}
)

print(f"Found {result['total']} active space(s)")

for space in result['spaces']:
    print(f"Space: {space['name']} (Members: {space['member_count']})")
```

---

## Related Tools

- **clickup_space_get**: Get detailed space information
- **clickup_space_create**: Create new space
- **get_workspace_hierarchy**: Get complete workspace structure

---

**Last Updated**: 2025-10-30
