# add_tag_to_task

## Overview

Adds an existing tag to a ClickUp task. The tag must already exist in the task's space. Supports multiple task identification methods for flexibility.

**Category**: Task Management - Tag Operations

**Rate Limit Impact**: ~2-4% of available requests (100 req/min on Free Forever plan)

---

## Use Cases

1. **Categorize Tasks**: Add tags for task categorization (urgent, review, blocked)
2. **Workflow States**: Tag tasks with current workflow state
3. **Priority Marking**: Add priority tags to important tasks
4. **Bulk Tagging**: Add same tag to multiple tasks for organization

---

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `taskId` | string | One required | ClickUp task ID. **Preferred** for direct identification. |
| `customTaskId` | string | One required | Custom task ID (e.g., "TASK-123"). |
| `taskName` | string | One required | Task name for lookup. Requires `listName` for disambiguation. |
| `listName` | string | Conditional | Required when using `taskName` to identify task. |
| `tagName` | string | **Yes** | Name of the tag to add. Must exist in task's space. |

**Note**: You must provide **one** of: `taskId` (preferred), `customTaskId`, or `taskName` + `listName`.

### Input Schema

#### Using Task ID (Preferred)
```json
{
  "taskId": "abc123",
  "tagName": "urgent"
}
```

#### Using Custom Task ID
```json
{
  "customTaskId": "TASK-123",
  "tagName": "high-priority"
}
```

#### Using Task Name
```json
{
  "taskName": "Fix login bug",
  "listName": "Sprint Backlog",
  "tagName": "blocked"
}
```

---

## Success Response

```json
{
  "success": true,
  "taskId": "abc123",
  "tagName": "urgent",
  "message": "Tag 'urgent' added to task successfully"
}
```

**Response Fields**:
- `success` (boolean): Always `true` on successful addition
- `taskId` (string): ID of the task that was tagged
- `tagName` (string): Name of the tag that was added
- `message` (string): Confirmation message

---

## Error Responses

### Missing Required Parameters
```json
{
  "error": "At least one of taskId, customTaskId, or taskName must be provided"
}
```

```json
{
  "error": "tagName is required"
}
```

```json
{
  "error": "listName is required when using taskName"
}
```

### Task Not Found
```json
{
  "error": "Task not found with the provided identification"
}
```

### Tag Not Found in Space
```json
{
  "error": "The tag 'urgent' does not exist in the space. Please create it first using create_space_tag."
}
```

### Space Not Found
```json
{
  "error": "Could not determine which space the task belongs to."
}
```

### Tag Verification Failed
```json
{
  "error": "The tag addition could not be verified. Please check if the tag was added manually."
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
# Add tag to task (verify tag exists first)
space_id = "90123456"
task_id = "abc123"
tag_name = "urgent"

# Step 1: Verify tag exists in space
tags_result = await mcp_server.call_tool(
    "get_space_tags",
    {"spaceId": space_id}
)

tag_exists = any(tag["name"] == tag_name for tag in tags_result["tags"])

if not tag_exists:
    # Create tag if it doesn't exist
    print(f"⚠️ Tag '{tag_name}' not found, creating it...")
    create_result = await mcp_server.call_tool(
        "create_space_tag",
        {
            "spaceId": space_id,
            "tagName": tag_name,
            "colorCommand": "red tag"
        }
    )

# Step 2: Add tag to task
result = await mcp_server.call_tool(
    "add_tag_to_task",
    {
        "taskId": task_id,
        "tagName": tag_name
    }
)

print(f"✅ {result['message']}")
```

### TypeScript Example
```typescript
// Add tag using custom task ID
const result = await mcpServer.callTool(
  "add_tag_to_task",
  {
    customTaskId: "TASK-123",
    tagName: "high-priority"
  }
);

console.log(`✅ ${result.message}`);

// Add tag using task name (with disambiguation)
const result2 = await mcpServer.callTool(
  "add_tag_to_task",
  {
    taskName: "Fix login bug",
    listName: "Sprint Backlog",
    tagName: "blocked"
  }
);

console.log(`✅ Tagged task: ${result2.taskId}`);
```

---

## Notes

- **Tag Must Exist**: Tag must be created in space before adding to tasks
- **Case-Sensitive**: Tag name matching is case-sensitive
- **Idempotent**: Adding same tag multiple times has no additional effect
- **Space Detection**: Tool automatically determines task's space
- **Smart Disambiguation**: Uses task name + list name for accurate identification

---

## Best Practices

1. **Verify Tag Exists**: Check tag exists in space before attempting to add
2. **Use Task ID**: Prefer `taskId` for fastest, most reliable identification
3. **Handle Missing Tags**: Create missing tags automatically or prompt user
4. **Batch Operations**: Use loops for adding same tag to multiple tasks
5. **Error Handling**: Implement robust error handling for tag not found scenarios

---

## Related Tools

- **get_space_tags**: Verify tag exists before adding
- **create_space_tag**: Create tag if it doesn't exist
- **remove_tag_from_task**: Remove tag from task
- **get_task**: View task's current tags

---

## Performance Considerations

- **Execution Time**: ~300-700ms depending on identification method
- **Rate Limit Cost**: 2-4 requests (~2-4% of rate limit)
  - 1 request: Task lookup (if using name/custom ID)
  - 1 request: Get space tags (to verify tag exists)
  - 1 request: Add tag
  - 1 request: Verify tag was added
- **Response Size**: ~500 bytes
- **Optimization**: Use `taskId` directly to minimize API calls

---

## Common Pitfalls

1. **Tag Doesn't Exist**: Attempting to add non-existent tags
2. **Case Sensitivity**: Tag names must match exactly (case-sensitive)
3. **Wrong Space**: Tag exists in different space than task
4. **Missing listName**: Not providing listName when using taskName
5. **Assuming Success**: Not checking for TAG_NOT_FOUND error

---

## Example Workflow: Add Tags to Multiple Tasks

```python
# Add "urgent" tag to multiple tasks
task_ids = ["abc123", "def456", "ghi789"]
tag_name = "urgent"
space_id = "90123456"

# Step 1: Verify tag exists
tags_result = await mcp_server.call_tool(
    "get_space_tags",
    {"spaceId": space_id}
)

tag_exists = any(tag["name"] == tag_name for tag in tags_result["tags"])

if not tag_exists:
    # Create tag
    print(f"Creating tag '{tag_name}'...")
    create_result = await mcp_server.call_tool(
        "create_space_tag",
        {
            "spaceId": space_id,
            "tagName": tag_name,
            "colorCommand": "red tag"
        }
    )

# Step 2: Add tag to all tasks
success_count = 0
failed_count = 0

for task_id in task_ids:
    try:
        result = await mcp_server.call_tool(
            "add_tag_to_task",
            {
                "taskId": task_id,
                "tagName": tag_name
            }
        )
        print(f"✅ Tagged task: {task_id}")
        success_count += 1
    except Exception as e:
        print(f"❌ Failed to tag {task_id}: {e}")
        failed_count += 1

print(f"\n🎉 Tagged {success_count} tasks, {failed_count} failed")
```

---

## Example Workflow: Conditional Tagging

```python
# Add tags based on task properties
async def tag_by_priority(task_id: str):
    """Add priority tag based on task priority."""

    # Get task details
    task = await mcp_server.call_tool(
        "get_task",
        {"taskId": task_id}
    )

    # Determine tag based on priority
    priority = task["task"].get("priority", {}).get("priority")

    tag_map = {
        1: "urgent",         # Urgent priority
        2: "high-priority",  # High priority
        3: "medium-priority",# Normal priority
        4: "low-priority"    # Low priority
    }

    tag_name = tag_map.get(priority)

    if tag_name:
        result = await mcp_server.call_tool(
            "add_tag_to_task",
            {
                "taskId": task_id,
                "tagName": tag_name
            }
        )
        print(f"✅ Tagged task {task_id} as '{tag_name}'")
    else:
        print(f"⏭️ Skipped task {task_id} (no priority set)")

# Usage
await tag_by_priority("abc123")
```

---

## Error Code Reference

| Error Code | Description | Solution |
|------------|-------------|----------|
| `TAG_NOT_FOUND` | Tag doesn't exist in space | Create tag with `create_space_tag` first |
| `SPACE_NOT_FOUND` | Can't determine task's space | Verify task exists and space is accessible |
| `TAG_VERIFICATION_FAILED` | Tag addition couldn't be verified | Check manually if tag was added |
| `TASK_NOT_FOUND` | Task not found with provided ID | Verify task identification parameters |

---

**Last Updated**: 2025-10-30
**Related Documentation**: [get_space_tags.md](get_space_tags.md), [create_space_tag.md](create_space_tag.md), [remove_tag_from_task.md](remove_tag_from_task.md)
