# create_list_in_folder

## Overview

Creates a list inside a ClickUp folder. Use this when organizing lists under folders for better hierarchy. Supports folder identification by ID or name with space context.

**Category**: List Management - CRUD Operations

**Rate Limit Impact**: ~3-4% of available requests (100 req/min on Free Forever plan)

---

## Use Cases

1. **Hierarchical Organization**: Create lists under folders for complex project structures
2. **Department Organization**: Organize lists by department folders
3. **Client Projects**: Create client-specific lists under client folders
4. **Feature Development**: Group feature lists under epic folders

---

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | **Yes** | Name of the list. |
| `folderId` | string | One required | ID of the folder. **Preferred** if you have the ID. |
| `folderName` | string | One required | Name of the folder. Requires space context. |
| `spaceId` | string | Conditional | ID of space containing folder. Required when using `folderName`. |
| `spaceName` | string | Conditional | Name of space containing folder. Required when using `folderName`. |
| `content` | string | No | Description or content of the list. |
| `status` | string | No | Status of the list (uses folder default if not specified). |

**Note**: You must provide **either** `folderId` (preferred) or `folderName` + (`spaceId` or `spaceName`).

### Input Schema

#### Using Folder ID (Preferred)
```json
{
  "name": "Feature Tasks",
  "folderId": "801234567",
  "content": "Tasks for authentication feature"
}
```

#### Using Folder Name + Space ID
```json
{
  "name": "Client Deliverables",
  "folderName": "Acme Corp",
  "spaceId": "90123456",
  "content": "Q1 deliverables for Acme"
}
```

#### Using Folder Name + Space Name
```json
{
  "name": "Marketing Tasks",
  "folderName": "Q1 Campaigns",
  "spaceName": "Marketing",
  "status": "active"
}
```

---

## Success Response

```json
{
  "id": "901234567",
  "name": "Feature Tasks",
  "content": "Tasks for authentication feature",
  "folder": {
    "id": "801234567",
    "name": "Authentication"
  },
  "space": {
    "id": "90123456",
    "name": "Engineering"
  },
  "url": "https://app.clickup.com/123456/v/l/901234567",
  "message": "List \"Feature Tasks\" created successfully in folder \"Authentication\""
}
```

**Response Fields**:
- `id` (string): Unique list ID
- `name` (string): List name as created
- `content` (string): List description/content
- `folder` (object): Folder containing the list
  - `id` (string): Folder ID
  - `name` (string): Folder name
- `space` (object): Space containing the folder
  - `id` (string): Space ID
  - `name` (string): Space name
- `url` (string): Direct link to list in ClickUp
- `message` (string): Confirmation message

---

## Error Responses

### Missing Required Parameters
```json
{
  "error": "List name is required"
}
```

```json
{
  "error": "Either folderId or folderName must be provided"
}
```

```json
{
  "error": "When using folderName to identify a folder, you must also provide either spaceId or spaceName to locate the correct folder. This is because folder names might not be unique across different spaces."
}
```

### Folder Not Found
```json
{
  "error": "Folder \"Authentication\" not found in space"
}
```

### Space Not Found
```json
{
  "error": "Space \"Engineering\" not found"
}
```

### Authentication Error
```json
{
  "error": "Authentication failed: Invalid API key"
}
```

### Rate Limit Error
```json
{
  "error": "Rate limit exceeded. Please try again in 60 seconds."
}
```

---

## Integration Examples

### Python Example
```python
# Create list using folder ID (fastest)
result = await mcp_server.call_tool(
    "create_list_in_folder",
    {
        "name": "Sprint 23 Tasks",
        "folderId": "801234567",
        "content": "Authentication feature tasks",
        "status": "active"
    }
)

print(f"✅ {result['message']}")
print(f"   List ID: {result['id']}")
print(f"   Folder: {result['folder']['name']}")
print(f"   URL: {result['url']}")

# Create list using folder + space names
result = await mcp_server.call_tool(
    "create_list_in_folder",
    {
        "name": "Client Deliverables",
        "folderName": "Acme Corp",
        "spaceName": "Projects",
        "content": "Q1 2024 deliverables"
    }
)
```

### TypeScript Example
```typescript
// Create multiple lists in a folder
const folderLists = [
  { name: "Backend Tasks", content: "API and database work" },
  { name: "Frontend Tasks", content: "UI and component work" },
  { name: "Testing Tasks", content: "QA and testing" }
];

const folderId = "801234567";

for (const listDef of folderLists) {
  const result = await mcpServer.callTool(
    "create_list_in_folder",
    {
      folderId,
      ...listDef
    }
  );
  console.log(`✅ Created: ${result.name}`);
}

// Create list with folder name lookup
const result = await mcpServer.callTool(
  "create_list_in_folder",
  {
    name: "Campaign Tasks",
    folderName: "Q1 2024",
    spaceId: "90123456",
    content: "Marketing campaign tasks"
  }
);
```

---

## Notes

- **Folder-Level Lists**: Lists created are nested under folders in ClickUp hierarchy
- **Space Context Required**: When using `folderName`, space context is required because folder names may not be unique
- **Folder Status**: Lists inherit folder's default status if not specified
- **For Space Lists**: Use `create_list` to create lists directly in spaces (not folders)

---

## Best Practices

1. **Use Folder ID**: Prefer `folderId` for fastest, most reliable creation
2. **Provide Space Context**: Always include space info when using folder names
3. **Inherit Defaults**: Let list inherit folder status for consistency
4. **Verify Folder**: Check folder exists before bulk list creation
5. **Organize by Feature**: Use folders for epics, lists for features

---

## Related Tools

- **create_list**: Create list directly in space (not in folder)
- **create_folder**: Create folders before creating lists in them
- **get_list**: Retrieve list details
- **update_list**: Update list properties
- **delete_list**: Delete list and all its tasks

---

## Performance Considerations

- **Execution Time**: ~400-800ms (includes space and folder resolution if using names)
- **Rate Limit Cost**: 3-4 requests (~3-4% of rate limit)
  - 1 request: Get spaces (if using spaceName)
  - 1 request: Get workspace hierarchy (if using folderName)
  - 1 request: Create list
- **Response Size**: ~1-2KB
- **Optimization**: Use `folderId` directly to minimize API calls

---

## Common Pitfalls

1. **Missing Space Context**: Not providing spaceId/spaceName when using folderName
2. **Wrong Tool**: Using this for space-level lists (use `create_list` instead)
3. **Non-Unique Names**: Folder names may not be unique across spaces
4. **Invalid Folder ID**: Folder ID doesn't exist or isn't accessible
5. **Hierarchy Confusion**: Not understanding space → folder → list hierarchy

---

## Example Workflow: Create Client Project Structure

```python
# Create complete client project structure
space_id = "90123456"
client_name = "Acme Corp"

# Step 1: Create client folder
folder_result = await mcp_server.call_tool(
    "create_folder",
    {
        "name": client_name,
        "spaceId": space_id
    }
)

folder_id = folder_result["id"]
print(f"✅ Created folder: {client_name}")

# Step 2: Create lists within folder
project_lists = [
    {"name": "Discovery", "content": "Requirements and planning"},
    {"name": "Design", "content": "UI/UX design tasks"},
    {"name": "Development", "content": "Implementation tasks"},
    {"name": "Testing", "content": "QA and testing"},
    {"name": "Deployment", "content": "Release tasks"}
]

created_lists = []

for list_def in project_lists:
    result = await mcp_server.call_tool(
        "create_list_in_folder",
        {
            "folderId": folder_id,
            **list_def
        }
    )
    created_lists.append(result)
    print(f"✅ Created list: {list_def['name']}")

print(f"\n🎉 Client project ready with {len(created_lists)} lists")
```

---

## Example Workflow: Feature Epic Structure

```python
# Create feature epic with sub-features as lists
async def create_epic_structure(space_id: str, epic_name: str, features: list):
    """Create folder for epic with lists for each feature."""

    # Create epic folder
    folder_result = await mcp_server.call_tool(
        "create_folder",
        {
            "name": epic_name,
            "spaceId": space_id
        }
    )

    folder_id = folder_result["id"]
    print(f"📁 Created epic: {epic_name}")

    # Create list for each feature
    feature_lists = []

    for feature in features:
        result = await mcp_server.call_tool(
            "create_list_in_folder",
            {
                "name": feature["name"],
                "folderId": folder_id,
                "content": feature.get("description", "")
            }
        )
        feature_lists.append(result)
        print(f"  ✅ Feature list: {feature['name']}")

    return {
        "folder": folder_result,
        "lists": feature_lists
    }

# Usage
features = [
    {"name": "User Authentication", "description": "Login, signup, password reset"},
    {"name": "User Profile", "description": "Profile management and settings"},
    {"name": "OAuth Integration", "description": "Google and GitHub OAuth"}
]

epic = await create_epic_structure(
    space_id="90123456",
    epic_name="Authentication Epic",
    features=features
)

print(f"\n🎉 Epic created with {len(epic['lists'])} features")
```

---

## ClickUp Hierarchy Context

```
Workspace
└── Space
    ├── List (use create_list)
    │   └── Task
    └── Folder (created by create_folder)
        └── List (created by this tool) ← You are here
            └── Task
```

**When to use `create_list` vs `create_list_in_folder`**:
- Use `create_list`: For top-level lists directly in spaces
- Use `create_list_in_folder`: For lists organized under folders ← **This tool**

**Common Organization Patterns**:
- **Flat Structure**: Space → Lists (use `create_list`)
- **Hierarchical**: Space → Folders → Lists (use this tool)
- **Hybrid**: Mix of both based on project complexity

---

## Folder Name Resolution

When using `folderName` instead of `folderId`, the tool:

1. **Requires Space Context**: Must provide `spaceId` or `spaceName`
2. **Searches Hierarchy**: Looks up folder in workspace hierarchy
3. **Case-Insensitive**: Matches folder names case-insensitively
4. **First Match**: Returns first matching folder in specified space

**Example Resolution Flow**:
```python
# Input
{
    "folderName": "Q1 Campaigns",
    "spaceName": "Marketing"
}

# Internal steps:
# 1. Resolve space name → space ID
# 2. Get workspace hierarchy
# 3. Find folder "Q1 Campaigns" in Marketing space
# 4. Use folder ID to create list
```

---

**Last Updated**: 2025-10-30
**Related Documentation**: [create_list.md](create_list.md), [create_folder.md](create_folder.md), [get_list.md](get_list.md)
