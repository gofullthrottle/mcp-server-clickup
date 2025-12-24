# get_folder

## Overview

Gets details of a ClickUp folder including name and space information. Supports identification by folder ID or name with space context.

**Category**: Folder Management - CRUD Operations

**Rate Limit Impact**: ~2-3% of available requests (100 req/min on Free Forever plan)

---

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `folderId` | string | One required | ID of the folder. **Preferred** for reliability. |
| `folderName` | string | One required | Name of the folder. Requires space context. |
| `spaceId` | string | Conditional | ID of space containing folder. Required when using `folderName`. |
| `spaceName` | string | Conditional | Name of space containing folder. Required when using `folderName`. |

---

## Success Response

```json
{
  "id": "801234567",
  "name": "Q1 2024",
  "space": {
    "id": "90123456",
    "name": "Marketing"
  }
}
```

---

## Integration Examples

### Python Example
```python
# Get folder by ID
result = await mcp_server.call_tool(
    "get_folder",
    {"folderId": "801234567"}
)

print(f"Folder: {result['name']}")
print(f"Space: {result['space']['name']}")

# Get folder by name
result = await mcp_server.call_tool(
    "get_folder",
    {
        "folderName": "Q1 2024",
        "spaceName": "Marketing"
    }
)
```

---

## Related Tools

- **create_folder**: Create new folder
- **update_folder**: Update folder properties
- **delete_folder**: Delete folder and contents
- **create_list_in_folder**: Create lists in folder

---

**Last Updated**: 2025-10-30
