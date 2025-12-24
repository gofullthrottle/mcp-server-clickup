# create_list

## Overview

Creates a list directly in a ClickUp space (not in a folder). Lists are containers for tasks and support optional properties like content, due date, priority, and assignee.

**Category**: List Management - CRUD Operations

**Rate Limit Impact**: ~2-3% of available requests (100 req/min on Free Forever plan)

---

## Use Cases

1. **Organize Tasks**: Create lists to group related tasks by project or feature
2. **Workflow Containers**: Set up lists with default properties for task workflows
3. **Sprint Planning**: Create sprint lists with due dates and assignees
4. **Project Structure**: Build project hierarchy with lists as primary containers

---

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | **Yes** | Name of the list. |
| `spaceId` | string | One required | ID of the space to create list in. **Preferred** if you have the ID. |
| `spaceName` | string | One required | Name of the space. Only use if you don't have spaceId. |
| `content` | string | No | Description or content of the list. |
| `dueDate` | string | No | Due date for the list (Unix timestamp in milliseconds). |
| `priority` | number | No | Priority level: 1 (urgent), 2 (high), 3 (normal), 4 (low). |
| `assignee` | number | No | User ID to assign the list to. |
| `status` | string | No | Status of the list. |

**Note**: You must provide **either** `spaceId` (preferred) or `spaceName` (will be resolved to ID).

### Input Schema

#### Using Space ID (Preferred)
```json
{
  "name": "Sprint 23",
  "spaceId": "90123456",
  "content": "Sprint 23 tasks - Jan 15-29",
  "dueDate": "1706486400000",
  "priority": 2
}
```

#### Using Space Name
```json
{
  "name": "Backlog",
  "spaceName": "Engineering",
  "content": "Product backlog items"
}
```

#### Minimal (Name Only)
```json
{
  "name": "Todo List",
  "spaceId": "90123456"
}
```

---

## Success Response

```json
{
  "id": "901234567",
  "name": "Sprint 23",
  "content": "Sprint 23 tasks - Jan 15-29",
  "space": {
    "id": "90123456",
    "name": "Engineering"
  },
  "url": "https://app.clickup.com/123456/v/l/901234567",
  "message": "List \"Sprint 23\" created successfully"
}
```

**Response Fields**:
- `id` (string): Unique list ID
- `name` (string): List name as created
- `content` (string): List description/content
- `space` (object): Space containing the list
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
  "error": "Either spaceId or spaceName must be provided"
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
# Create list with full properties
result = await mcp_server.call_tool(
    "create_list",
    {
        "name": "Sprint 23",
        "spaceId": "90123456",
        "content": "Sprint 23: Jan 15-29, 2024",
        "dueDate": "1706486400000",  # Jan 29, 2024
        "priority": 2,  # High priority
        "assignee": 12345678  # Team lead user ID
    }
)

print(f"✅ Created list: {result['name']}")
print(f"   URL: {result['url']}")
print(f"   Space: {result['space']['name']}")

# Create minimal list
result = await mcp_server.call_tool(
    "create_list",
    {
        "name": "Backlog",
        "spaceName": "Engineering"
    }
)
```

### TypeScript Example
```typescript
// Create list using space name
const result = await mcpServer.callTool(
  "create_list",
  {
    name: "Q1 2024 Goals",
    spaceName: "Marketing",
    content: "Marketing goals for Q1 2024",
    dueDate: "1711929600000"  // April 1, 2024
  }
);

console.log(`✅ ${result.message}`);
console.log(`   List ID: ${result.id}`);
console.log(`   URL: ${result.url}`);

// Create multiple lists in a space
const listNames = ["Backlog", "In Progress", "Review", "Done"];
const spaceId = "90123456";

for (const listName of listNames) {
  const result = await mcpServer.callTool(
    "create_list",
    {
      name: listName,
      spaceId: spaceId
    }
  );
  console.log(`✅ Created: ${listName}`);
}
```

---

## Notes

- **Space-Level Lists**: This tool creates lists directly in spaces, not folders
- **For Folder Lists**: Use `create_list_in_folder` to create lists inside folders
- **Due Dates**: Provide Unix timestamps in milliseconds
- **Priority Levels**: 1=Urgent, 2=High, 3=Normal, 4=Low (ClickUp standard)
- **Assignees**: Use user IDs from `get_workspace_members` tool

---

## Best Practices

1. **Use Space ID**: Prefer `spaceId` for faster, more reliable creation
2. **Descriptive Names**: Use clear, consistent naming conventions
3. **Add Content**: Include list descriptions for team context
4. **Set Defaults**: Use priority/assignee to set default task properties
5. **Verify Space**: Check space exists before bulk list creation

---

## Related Tools

- **create_list_in_folder**: Create list inside a folder
- **get_list**: Retrieve list details
- **update_list**: Update list properties
- **delete_list**: Delete list and all its tasks
- **create_task**: Create tasks within the list

---

## Performance Considerations

- **Execution Time**: ~300-600ms (includes space resolution if using name)
- **Rate Limit Cost**: 2-3 requests (~2-3% of rate limit)
  - 1 request: Get spaces (if using spaceName)
  - 1 request: Create list
- **Response Size**: ~1-2KB
- **Optimization**: Use `spaceId` directly to save 1 API call

---

## Common Pitfalls

1. **Wrong Tool**: Using this for folder lists (use `create_list_in_folder` instead)
2. **Invalid Date Format**: Due dates must be Unix timestamps in milliseconds
3. **Invalid Priority**: Priority must be 1-4 (ClickUp standard levels)
4. **Invalid Assignee**: User ID must exist in workspace
5. **Missing Space**: Must provide either spaceId or spaceName

---

## Example Workflow: Create Project Structure

```python
# Create project structure with multiple lists
space_id = "90123456"
project_lists = [
    {
        "name": "Backlog",
        "content": "Ideas and future work",
        "priority": 4
    },
    {
        "name": "Sprint Planning",
        "content": "Items for next sprint",
        "priority": 3
    },
    {
        "name": "In Progress",
        "content": "Current sprint work",
        "priority": 2
    },
    {
        "name": "Code Review",
        "content": "Awaiting review",
        "priority": 2
    },
    {
        "name": "Done",
        "content": "Completed work",
        "priority": 4
    }
]

created_lists = []

for list_def in project_lists:
    result = await mcp_server.call_tool(
        "create_list",
        {
            "spaceId": space_id,
            **list_def
        }
    )
    created_lists.append(result)
    print(f"✅ Created: {list_def['name']}")

print(f"\n🎉 Created {len(created_lists)} lists")

# Display list URLs for quick access
for list_info in created_lists:
    print(f"  - {list_info['name']}: {list_info['url']}")
```

---

## Example Workflow: Sprint List with Dates

```python
from datetime import datetime, timedelta

# Calculate sprint dates
sprint_start = datetime.now()
sprint_end = sprint_start + timedelta(days=14)  # 2-week sprint

# Create sprint list
result = await mcp_server.call_tool(
    "create_list",
    {
        "name": f"Sprint {datetime.now().strftime('%Y-%m')}",
        "spaceId": "90123456",
        "content": f"Sprint: {sprint_start.strftime('%b %d')} - {sprint_end.strftime('%b %d')}",
        "dueDate": str(int(sprint_end.timestamp() * 1000)),
        "priority": 2,  # High priority
        "assignee": 12345678  # Sprint owner
    }
)

print(f"✅ Created sprint list: {result['name']}")
print(f"   Due: {datetime.fromtimestamp(int(result.get('dueDate', 0)) / 1000).strftime('%Y-%m-%d')}")
```

---

## ClickUp Hierarchy Context

```
Workspace
└── Space
    ├── List (created by this tool) ← You are here
    │   └── Task
    └── Folder
        └── List (use create_list_in_folder)
            └── Task
```

**When to use `create_list` vs `create_list_in_folder`**:
- Use `create_list`: For top-level lists directly in spaces
- Use `create_list_in_folder`: For lists organized under folders

---

**Last Updated**: 2025-10-30
**Related Documentation**: [create_list_in_folder.md](create_list_in_folder.md), [get_list.md](get_list.md), [update_list.md](update_list.md)
