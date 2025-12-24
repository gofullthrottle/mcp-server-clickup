# update_folder

## Overview

Updates a ClickUp folder's properties including name and status override settings. At least one update field must be provided.

**Category**: Folder Management - CRUD Operations

**Rate Limit Impact**: ~2-3% of available requests (100 req/min on Free Forever plan)

---

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `folderId` | string | One required | ID of the folder. **Preferred** for reliability. |
| `folderName` | string | One required | Current name of the folder. Requires space context. |
| `spaceId` | string | Conditional | ID of space containing folder. Required when using `folderName`. |
| `spaceName` | string | Conditional | Name of space containing folder. Required when using `folderName`. |
| `name` | string | One update required | New name for the folder. |
| `override_statuses` | boolean | One update required | Whether to override space statuses. |

**Note**: At least **one** of `name` or `override_statuses` must be provided for update.

---

## Success Response

```json
{
  "id": "801234567",
  "name": "Q1 2024 Updated",
  "space": {
    "id": "90123456",
    "name": "Marketing"
  },
  "message": "Folder \"Q1 2024 Updated\" updated successfully"
}
```

---

## Integration Examples

### Python Example
```python
# Rename folder
result = await mcp_server.call_tool(
    "update_folder",
    {
        "folderId": "801234567",
        "name": "Q2 2024"
    }
)

print(f"✅ {result['message']}")

# Enable custom statuses
result = await mcp_server.call_tool(
    "update_folder",
    {
        "folderName": "Engineering Projects",
        "spaceName": "Engineering",
        "override_statuses": true
    }
)
```

---

## Related Tools

- **get_folder**: Get current folder details
- **create_folder**: Create new folder
- **delete_folder**: Delete folder and contents

---

**Last Updated**: 2025-10-30
