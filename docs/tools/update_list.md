# update_list

## Overview

Updates a ClickUp list's properties including name, content (description), and status. At least one update field must be provided.

**Category**: List Management - CRUD Operations

**Rate Limit Impact**: ~2-3% of available requests (100 req/min on Free Forever plan)

---

## Use Cases

1. **Rename Lists**: Update list names for clarity or reorganization
2. **Update Descriptions**: Add or modify list content/descriptions
3. **Change Status**: Update list status for workflow management
4. **Maintain Lists**: Keep list information current and accurate

---

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `listId` | string | One required | ID of the list. **Preferred** for reliability. |
| `listName` | string | One required | Current name of the list. May be ambiguous. |
| `name` | string | One update required | New name for the list. |
| `content` | string | One update required | New description or content for the list. |
| `status` | string | One update required | New status for the list. |

**Note**:
- You must provide **either** `listId` (preferred) or `listName`.
- At least **one** of `name`, `content`, or `status` must be provided for update.

### Input Schema

#### Rename List
```json
{
  "listId": "901234567",
  "name": "Sprint 24"
}
```

#### Update Content
```json
{
  "listName": "Sprint 23",
  "content": "Updated: Sprint 23 tasks - Extended to Feb 5"
}
```

#### Update Multiple Properties
```json
{
  "listId": "901234567",
  "name": "Q1 2024 Backlog",
  "content": "Backlog items for Q1 2024",
  "status": "active"
}
```

---

## Success Response

```json
{
  "id": "901234567",
  "name": "Sprint 24",
  "content": "Sprint 24 tasks - Feb 1-15",
  "space": {
    "id": "90123456",
    "name": "Engineering"
  },
  "url": "https://app.clickup.com/123456/v/l/901234567",
  "message": "List \"Sprint 24\" updated successfully"
}
```

**Response Fields**:
- `id` (string): List ID
- `name` (string): Updated list name
- `content` (string): Updated list description/content
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
  "error": "Either listId or listName must be provided"
}
```

```json
{
  "error": "At least one of name, content, or status must be provided for update"
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
# Rename a list
result = await mcp_server.call_tool(
    "update_list",
    {
        "listId": "901234567",
        "name": "Sprint 24"
    }
)

print(f"✅ {result['message']}")

# Update list description
result = await mcp_server.call_tool(
    "update_list",
    {
        "listName": "Backlog",
        "content": "Updated backlog description with priorities"
    }
)

# Update multiple properties
result = await mcp_server.call_tool(
    "update_list",
    {
        "listId": "901234567",
        "name": "Q1 Goals",
        "content": "Q1 2024 strategic goals",
        "status": "active"
    }
)

print(f"✅ Updated list: {result['name']}")
print(f"   Content: {result['content']}")
```

### TypeScript Example
```typescript
// Rename list with error handling
async function renameList(listId: string, newName: string): Promise<boolean> {
  try {
    const result = await mcpServer.callTool(
      "update_list",
      {
        listId,
        name: newName
      }
    );

    console.log(`✅ Renamed to: ${result.name}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to rename list: ${error.message}`);
    return false;
  }
}

await renameList("901234567", "Sprint 24");

// Update list content
const result = await mcpServer.callTool(
  "update_list",
  {
    listId: "901234567",
    content: "Updated description with new information"
  }
);
```

---

## Notes

- **Partial Updates**: Only specified fields are updated, others remain unchanged
- **ID Preferred**: Using `listId` is more reliable than `listName`
- **At Least One Field**: Must provide at least one field to update
- **Name Uniqueness**: New name can duplicate existing list names (ClickUp allows)
- **Status Values**: Status values depend on space configuration

---

## Best Practices

1. **Use List ID**: Prefer `listId` for unambiguous identification
2. **Update Atomically**: Update all related properties in single call
3. **Verify Before Update**: Check list exists before attempting update
4. **Descriptive Content**: Keep list descriptions clear and current
5. **Consistent Naming**: Follow naming conventions when renaming

---

## Related Tools

- **get_list**: Get current list details before updating
- **create_list**: Create new list in space
- **create_list_in_folder**: Create list in folder
- **delete_list**: Delete list and all its tasks

---

## Performance Considerations

- **Execution Time**: ~300-500ms for ID lookup, ~500-700ms for name lookup
- **Rate Limit Cost**: 2-3 requests (~2-3% of rate limit)
  - 1 request: Find list (if using name)
  - 1 request: Update list
- **Response Size**: ~1KB
- **Optimization**: Use `listId` to avoid name lookup overhead

---

## Common Pitfalls

1. **No Update Fields**: Not providing any update fields
2. **Name Ambiguity**: Using listName when multiple lists have same name
3. **Invalid Status**: Providing status value not configured in space
4. **Partial Information**: Not checking current values before update
5. **Missing Verification**: Not verifying update succeeded

---

## Example Workflow: Archive Completed Sprint

```python
# Archive completed sprint by updating name and content
async def archive_sprint(list_id: str, sprint_number: int):
    """Archive completed sprint with updated name and description."""

    from datetime import datetime

    archive_date = datetime.now().strftime("%Y-%m-%d")

    result = await mcp_server.call_tool(
        "update_list",
        {
            "listId": list_id,
            "name": f"[ARCHIVED] Sprint {sprint_number}",
            "content": f"Archived on {archive_date}. Sprint {sprint_number} completed.",
            "status": "closed"
        }
    )

    print(f"✅ Archived sprint {sprint_number}")
    print(f"   Name: {result['name']}")
    print(f"   Status: closed")

    return result

# Usage
await archive_sprint("901234567", 23)
```

---

## Example Workflow: Batch List Rename

```python
# Rename multiple lists to follow new naming convention
async def standardize_list_names(prefix: str, list_ids: list):
    """Standardize list names with a common prefix."""

    renamed_count = 0
    failed_count = 0

    for list_id in list_ids:
        try:
            # Get current list name
            list_info = await mcp_server.call_tool(
                "get_list",
                {"listId": list_id}
            )

            current_name = list_info["name"]

            # Skip if already has prefix
            if current_name.startswith(prefix):
                print(f"⏭️ Skipped: {current_name} (already prefixed)")
                continue

            # Add prefix to name
            new_name = f"{prefix} {current_name}"

            # Rename list
            result = await mcp_server.call_tool(
                "update_list",
                {
                    "listId": list_id,
                    "name": new_name
                }
            )

            print(f"✅ Renamed: {current_name} → {new_name}")
            renamed_count += 1

        except Exception as e:
            print(f"❌ Failed to rename {list_id}: {e}")
            failed_count += 1

    print(f"\n🎉 Renamed {renamed_count} lists, {failed_count} failed")

# Usage: Add "Q1-" prefix to all lists
list_ids = ["901234567", "901234568", "901234569"]
await standardize_list_names("Q1", list_ids)
```

---

## Example Workflow: Update List Descriptions from Template

```python
# Update list descriptions using template
async def update_list_descriptions(space_id: str, template: str):
    """Update all lists in space with template description."""

    # Get all lists in space
    hierarchy = await mcp_server.call_tool(
        "get_workspace_hierarchy",
        {}
    )

    # Extract lists for this space
    lists = []
    for space in hierarchy.get("spaces", []):
        if space["id"] == space_id:
            # Get lists directly in space
            lists.extend(space.get("lists", []))

            # Get lists in folders
            for folder in space.get("folders", []):
                lists.extend(folder.get("lists", []))

    print(f"Found {len(lists)} lists in space")

    # Update each list
    updated_count = 0

    for list_info in lists:
        list_id = list_info["id"]
        list_name = list_info["name"]

        # Create description from template
        description = template.format(list_name=list_name)

        try:
            result = await mcp_server.call_tool(
                "update_list",
                {
                    "listId": list_id,
                    "content": description
                }
            )

            print(f"✅ Updated: {list_name}")
            updated_count += 1

        except Exception as e:
            print(f"❌ Failed: {list_name} - {e}")

    print(f"\n🎉 Updated {updated_count} lists")

# Usage
template = "This list contains tasks for: {list_name}. Last updated: 2024-01-30"
await update_list_descriptions("90123456", template)
```

---

## Example Workflow: Progressive List Status Updates

```python
# Update list status based on task completion
async def update_list_status_by_completion(list_id: str):
    """Update list status based on task completion percentage."""

    # Get list info
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

    if not tasks:
        print("⏭️ No tasks in list")
        return

    # Calculate completion percentage
    completed = len([t for t in tasks if t.get("status", {}).get("status") == "complete"])
    completion_pct = (completed / len(tasks)) * 100

    # Determine status based on completion
    if completion_pct == 100:
        new_status = "complete"
    elif completion_pct >= 75:
        new_status = "nearly-complete"
    elif completion_pct >= 25:
        new_status = "in-progress"
    else:
        new_status = "not-started"

    # Update list status
    result = await mcp_server.call_tool(
        "update_list",
        {
            "listId": list_id,
            "status": new_status,
            "content": f"{completion_pct:.0f}% complete ({completed}/{len(tasks)} tasks)"
        }
    )

    print(f"✅ Updated list status to: {new_status}")
    print(f"   Completion: {completion_pct:.0f}%")

# Usage
await update_list_status_by_completion("901234567")
```

---

**Last Updated**: 2025-10-30
**Related Documentation**: [get_list.md](get_list.md), [create_list.md](create_list.md), [delete_list.md](delete_list.md)
