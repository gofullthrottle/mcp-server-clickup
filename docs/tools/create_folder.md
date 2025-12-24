# create_folder

## Overview

Creates a folder in a ClickUp space. Folders organize lists hierarchically and can override space statuses with folder-specific statuses.

**Category**: Folder Management - CRUD Operations

**Rate Limit Impact**: ~2-3% of available requests (100 req/min on Free Forever plan)

---

## Use Cases

1. **Hierarchical Organization**: Create folders for complex project structures
2. **Client Projects**: Organize client work under dedicated folders
3. **Epic Management**: Group feature lists under epic folders
4. **Department Structure**: Organize work by department or team

---

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | **Yes** | Name of the folder. |
| `spaceId` | string | One required | ID of the space. **Preferred** if you have the ID. |
| `spaceName` | string | One required | Name of the space. Only use if you don't have spaceId. |
| `override_statuses` | boolean | No | Whether to override space statuses with folder-specific statuses. |

**Note**: You must provide **either** `spaceId` (preferred) or `spaceName` (will be resolved to ID).

### Input Schema

#### Using Space ID (Preferred)
```json
{
  "name": "Q1 2024",
  "spaceId": "90123456"
}
```

#### With Custom Statuses
```json
{
  "name": "Engineering Projects",
  "spaceName": "Engineering",
  "override_statuses": true
}
```

---

## Success Response

```json
{
  "id": "801234567",
  "name": "Q1 2024",
  "space": {
    "id": "90123456",
    "name": "Marketing"
  },
  "message": "Folder \"Q1 2024\" created successfully"
}
```

---

## Integration Examples

### Python Example
```python
# Create folder
result = await mcp_server.call_tool(
    "create_folder",
    {
        "name": "Client Projects",
        "spaceId": "90123456"
    }
)

folder_id = result["id"]
print(f"✅ Created folder: {result['name']}")

# Create lists in folder
for list_name in ["Planning", "Development", "Testing"]:
    await mcp_server.call_tool(
        "create_list_in_folder",
        {
            "folderId": folder_id,
            "name": list_name
        }
    )
```

### TypeScript Example
```typescript
// Create folder with custom statuses
const result = await mcpServer.callTool(
  "create_folder",
  {
    name: "Q1 Campaigns",
    spaceId: "90123456",
    override_statuses: true
  }
);

console.log(`✅ ${result.message}`);
```

---

## Related Tools

- **create_list_in_folder**: Create lists within folder
- **get_folder**: Retrieve folder details
- **update_folder**: Update folder properties
- **delete_folder**: Delete folder and all contents

---

**Last Updated**: 2025-10-30
