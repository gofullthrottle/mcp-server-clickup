# get_list

## Overview

Gets details of a ClickUp list including name, content, and space information. Supports identification by list ID or name.

**Category**: List Management - CRUD Operations

**Rate Limit Impact**: ~1-2% of available requests (100 req/min on Free Forever plan)

---

## Use Cases

1. **Retrieve List Details**: Get list information before operations
2. **Verify List Exists**: Check if list is accessible
3. **Get List URL**: Obtain direct link to list in ClickUp
4. **List Metadata**: Access list properties for automation

---

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `listId` | string | One required | ID of the list. **Preferred** for reliability. |
| `listName` | string | One required | Name of the list. May be ambiguous if multiple lists have same name. |

**Note**: You must provide **either** `listId` (preferred) or `listName`.

### Input Schema

#### Using List ID (Preferred)
```json
{
  "listId": "901234567"
}
```

#### Using List Name
```json
{
  "listName": "Sprint 23"
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
  "url": "https://app.clickup.com/123456/v/l/901234567"
}
```

**Response Fields**:
- `id` (string): Unique list ID
- `name` (string): List name
- `content` (string): List description/content (may be empty)
- `space` (object): Space containing the list
  - `id` (string): Space ID
  - `name` (string): Space name
- `url` (string): Direct link to list in ClickUp

---

## Error Responses

### Missing Required Parameters
```json
{
  "error": "Either listId or listName must be provided"
}
```

### List Not Found
```json
{
  "error": "List \"Sprint 23\" not found"
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
# Get list by ID (most reliable)
result = await mcp_server.call_tool(
    "get_list",
    {
        "listId": "901234567"
    }
)

print(f"List: {result['name']}")
print(f"Space: {result['space']['name']}")
print(f"Content: {result.get('content', 'No description')}")
print(f"URL: {result['url']}")

# Get list by name
result = await mcp_server.call_tool(
    "get_list",
    {
        "listName": "Sprint 23"
    }
)

# Check if list has content
if result.get('content'):
    print(f"Description: {result['content']}")
else:
    print("No description set")
```

### TypeScript Example
```typescript
// Get list details by ID
const result = await mcpServer.callTool(
  "get_list",
  {
    listId: "901234567"
  }
);

console.log(`📋 ${result.name}`);
console.log(`   Space: ${result.space.name}`);
console.log(`   URL: ${result.url}`);

// Verify list exists before operations
async function ensureListExists(listName: string): Promise<boolean> {
  try {
    const result = await mcpServer.callTool(
      "get_list",
      { listName }
    );
    console.log(`✅ List found: ${result.name} (ID: ${result.id})`);
    return true;
  } catch (error) {
    console.error(`❌ List not found: ${listName}`);
    return false;
  }
}

await ensureListExists("Sprint 23");
```

---

## Notes

- **ID Preferred**: Using `listId` is more reliable than `listName`
- **Name Ambiguity**: Multiple lists can have the same name across spaces
- **Empty Content**: Content field may be empty if no description set
- **Space Info**: Always returns space information for context
- **URL Format**: URL follows ClickUp's list view pattern

---

## Best Practices

1. **Use List ID**: Prefer `listId` for unambiguous identification
2. **Cache List IDs**: Store list IDs to avoid repeated name lookups
3. **Verify Before Operations**: Check list exists before bulk operations
4. **Handle Not Found**: Implement error handling for missing lists
5. **Extract URL**: Use returned URL for direct navigation

---

## Related Tools

- **create_list**: Create new list in space
- **create_list_in_folder**: Create list in folder
- **update_list**: Update list properties
- **delete_list**: Delete list and all its tasks
- **get_tasks**: Get tasks within the list

---

## Performance Considerations

- **Execution Time**: ~200-400ms for ID lookup, ~400-600ms for name lookup
- **Rate Limit Cost**: 1-2 requests (~1-2% of rate limit)
  - 1 request: Get list (if using ID)
  - 2 requests: Find list by name + get list (if using name)
- **Response Size**: ~1KB
- **Optimization**: Use `listId` to avoid name lookup overhead

---

## Common Pitfalls

1. **Name Ambiguity**: Using listName when multiple lists have same name
2. **Assuming Content**: Not handling empty content field
3. **Not Caching IDs**: Repeated name lookups waste rate limit
4. **Wrong Error Handling**: Not checking for "not found" errors
5. **Ignoring Space Context**: Not using returned space information

---

## Example Workflow: Get List Before Creating Tasks

```python
# Verify list exists before creating tasks
list_name = "Sprint 23"

# Get list details
try:
    list_result = await mcp_server.call_tool(
        "get_list",
        {"listName": list_name}
    )

    list_id = list_result["id"]
    print(f"✅ Found list: {list_name} (ID: {list_id})")

    # Create tasks in the list
    tasks = [
        "Implement user authentication",
        "Add password reset flow",
        "Write unit tests"
    ]

    for task_name in tasks:
        task_result = await mcp_server.call_tool(
            "create_task",
            {
                "listId": list_id,
                "name": task_name
            }
        )
        print(f"  ✅ Created task: {task_name}")

except Exception as e:
    print(f"❌ List not found: {list_name}")
    print("Please create the list first")
```

---

## Example Workflow: List Information Dashboard

```python
# Display comprehensive list information
async def display_list_info(list_id: str):
    """Display detailed list information."""

    # Get list details
    list_info = await mcp_server.call_tool(
        "get_list",
        {"listId": list_id}
    )

    # Get tasks in list
    tasks_result = await mcp_server.call_tool(
        "get_tasks",
        {"listId": list_id}
    )

    tasks = tasks_result.get("tasks", [])

    # Display dashboard
    print("=" * 60)
    print(f"📋 {list_info['name']}")
    print("=" * 60)
    print(f"ID:          {list_info['id']}")
    print(f"Space:       {list_info['space']['name']}")
    print(f"Description: {list_info.get('content', 'No description')}")
    print(f"URL:         {list_info['url']}")
    print(f"Tasks:       {len(tasks)} total")
    print("=" * 60)

    # Display task summary
    if tasks:
        completed = len([t for t in tasks if t.get("status", {}).get("status") == "complete"])
        print(f"\nTask Summary:")
        print(f"  ✅ Completed: {completed}")
        print(f"  ⏳ Remaining: {len(tasks) - completed}")

# Usage
await display_list_info("901234567")
```

---

## Example Workflow: List ID Cache

```python
# Cache list IDs to avoid repeated lookups
class ListCache:
    def __init__(self):
        self.cache = {}

    async def get_list_id(self, list_name: str) -> str:
        """Get list ID with caching."""

        # Check cache first
        if list_name in self.cache:
            print(f"✅ Using cached ID for '{list_name}'")
            return self.cache[list_name]

        # Fetch from API
        result = await mcp_server.call_tool(
            "get_list",
            {"listName": list_name}
        )

        list_id = result["id"]
        self.cache[list_name] = list_id
        print(f"✅ Cached ID for '{list_name}': {list_id}")

        return list_id

    async def get_list_info(self, list_identifier: str) -> dict:
        """Get list info by ID or name."""

        # Determine if identifier is ID or name
        is_id = list_identifier.isdigit()

        if is_id:
            # Direct ID lookup
            return await mcp_server.call_tool(
                "get_list",
                {"listId": list_identifier}
            )
        else:
            # Name lookup with caching
            list_id = await self.get_list_id(list_identifier)
            return await mcp_server.call_tool(
                "get_list",
                {"listId": list_id}
            )

# Usage
cache = ListCache()

# First call - API lookup
list_info1 = await cache.get_list_info("Sprint 23")

# Second call - uses cache
list_info2 = await cache.get_list_info("Sprint 23")
```

---

**Last Updated**: 2025-10-30
**Related Documentation**: [create_list.md](create_list.md), [update_list.md](update_list.md), [delete_list.md](delete_list.md)
