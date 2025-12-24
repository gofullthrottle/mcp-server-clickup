# remove_tag_from_task

## Overview

Removes a tag from a ClickUp task without deleting the tag from the space. The tag remains available for other tasks. Supports multiple task identification methods for flexibility.

**Category**: Task Management - Tag Operations

**Rate Limit Impact**: ~2-3% of available requests (100 req/min on Free Forever plan)

---

## Use Cases

1. **Update Task Status**: Remove workflow state tags when status changes
2. **Declutter Tasks**: Remove irrelevant or outdated tags
3. **Reclassify Tasks**: Remove old tags before adding new categorization
4. **Clean Up Bulk Operations**: Remove incorrectly applied tags

---

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `taskId` | string | One required | ClickUp task ID. **Preferred** for direct identification. |
| `customTaskId` | string | One required | Custom task ID (e.g., "TASK-123"). |
| `taskName` | string | One required | Task name for lookup. Requires `listName` for disambiguation. |
| `listName` | string | Conditional | Required when using `taskName` to identify task. |
| `tagName` | string | **Yes** | Name of the tag to remove. |

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
  "message": "Tag 'urgent' removed from task successfully"
}
```

**Response Fields**:
- `success` (boolean): Always `true` on successful removal
- `taskId` (string): ID of the task that was untagged
- `tagName` (string): Name of the tag that was removed
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

### Tag Not on Task
```json
{
  "error": "Tag 'urgent' is not currently applied to this task"
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
# Remove tag from task
result = await mcp_server.call_tool(
    "remove_tag_from_task",
    {
        "taskId": "abc123",
        "tagName": "urgent"
    }
)

print(f"✅ {result['message']}")

# Remove tag using custom task ID
result = await mcp_server.call_tool(
    "remove_tag_from_task",
    {
        "customTaskId": "TASK-123",
        "tagName": "blocked"
    }
)

print(f"✅ Removed tag from task {result['taskId']}")
```

### TypeScript Example
```typescript
// Remove tag using task name
const result = await mcpServer.callTool(
  "remove_tag_from_task",
  {
    taskName: "Fix login bug",
    listName: "Sprint Backlog",
    tagName: "blocked"
  }
);

console.log(`✅ ${result.message}`);

// Check if tag exists on task before removing
const task = await mcpServer.callTool(
  "get_task",
  { taskId: "abc123" }
);

const tags = task.task.tags || [];
const hasTag = tags.some((t: any) => t.name === "urgent");

if (hasTag) {
  await mcpServer.callTool(
    "remove_tag_from_task",
    {
      taskId: "abc123",
      tagName: "urgent"
    }
  );
  console.log("✅ Tag removed");
} else {
  console.log("⏭️ Tag not on task");
}
```

---

## Notes

- **Tag Remains in Space**: Only removes tag from task, not from space
- **Case-Sensitive**: Tag name matching is case-sensitive
- **Idempotent**: Removing tag that's not on task returns success (no error)
- **Smart Disambiguation**: Uses task name + list name for accurate identification
- **No Verification Delay**: Tag removal is immediate

---

## Best Practices

1. **Verify Tag Presence**: Check task has tag before attempting removal
2. **Use Task ID**: Prefer `taskId` for fastest, most reliable identification
3. **Handle Not Found**: Treat "tag not on task" as success (already desired state)
4. **Batch Operations**: Use loops for removing same tag from multiple tasks
5. **Use vs Delete**: Use this for specific tasks, `delete_space_tag` for complete removal

---

## Related Tools

- **add_tag_to_task**: Add tag to task
- **delete_space_tag**: Delete tag from space entirely
- **get_task**: View task's current tags
- **get_space_tags**: List all available tags in space

---

## Performance Considerations

- **Execution Time**: ~200-500ms depending on identification method
- **Rate Limit Cost**: 2-3 requests (~2-3% of rate limit)
  - 1 request: Task lookup (if using name/custom ID)
  - 1 request: Get task details (to verify tag exists)
  - 1 request: Remove tag
- **Response Size**: ~500 bytes
- **Optimization**: Use `taskId` directly to minimize API calls

---

## Common Pitfalls

1. **Case Sensitivity**: Tag names must match exactly (case-sensitive)
2. **Wrong Tool**: Using `delete_space_tag` when only removing from one task
3. **Missing listName**: Not providing listName when using taskName
4. **Assuming Tag Present**: Not checking if tag exists on task first
5. **Confusion with Delete**: This removes tag-task association, doesn't delete tag

---

## Example Workflow: Remove Tags from Multiple Tasks

```python
# Remove "urgent" tag from completed tasks
tag_name = "urgent"
list_id = "123456789"

# Step 1: Get all tasks in list
tasks_result = await mcp_server.call_tool(
    "get_tasks",
    {"listId": list_id}
)

tasks = tasks_result["tasks"]

# Step 2: Filter completed tasks with "urgent" tag
completed_tasks = [
    task for task in tasks
    if task.get("status", {}).get("status") == "complete"
    and any(tag["name"] == tag_name for tag in task.get("tags", []))
]

print(f"Found {len(completed_tasks)} completed tasks with '{tag_name}' tag")

# Step 3: Remove tag from completed tasks
success_count = 0
failed_count = 0

for task in completed_tasks:
    try:
        result = await mcp_server.call_tool(
            "remove_tag_from_task",
            {
                "taskId": task["id"],
                "tagName": tag_name
            }
        )
        print(f"✅ Removed tag from: {task['name']}")
        success_count += 1
    except Exception as e:
        print(f"❌ Failed to remove tag from {task['name']}: {e}")
        failed_count += 1

print(f"\n🎉 Removed tag from {success_count} tasks, {failed_count} failed")
```

---

## Example Workflow: Replace Tag on Tasks

```python
# Replace "urgent" tag with "high-priority" on all tasks
async def replace_tag(task_id: str, old_tag: str, new_tag: str):
    """Remove old tag and add new tag to task."""

    # Get task details
    task = await mcp_server.call_tool(
        "get_task",
        {"taskId": task_id}
    )

    tags = task["task"].get("tags", [])
    has_old_tag = any(tag["name"] == old_tag for tag in tags)

    if not has_old_tag:
        print(f"⏭️ Task {task_id} doesn't have '{old_tag}' tag")
        return

    # Remove old tag
    remove_result = await mcp_server.call_tool(
        "remove_tag_from_task",
        {
            "taskId": task_id,
            "tagName": old_tag
        }
    )
    print(f"✅ Removed '{old_tag}' from task {task_id}")

    # Add new tag
    add_result = await mcp_server.call_tool(
        "add_tag_to_task",
        {
            "taskId": task_id,
            "tagName": new_tag
        }
    )
    print(f"✅ Added '{new_tag}' to task {task_id}")

# Usage: Replace all "urgent" tags with "high-priority"
task_ids = ["abc123", "def456", "ghi789"]
for task_id in task_ids:
    await replace_tag(task_id, "urgent", "high-priority")
```

---

## Example Workflow: Clean Up Tags by Pattern

```python
# Remove all "temp-" prefixed tags from tasks
async def remove_temp_tags(task_id: str):
    """Remove all temporary tags from a task."""

    # Get task details
    task = await mcp_server.call_tool(
        "get_task",
        {"taskId": task_id}
    )

    tags = task["task"].get("tags", [])
    temp_tags = [tag["name"] for tag in tags if tag["name"].startswith("temp-")]

    if not temp_tags:
        print(f"⏭️ Task {task_id} has no temporary tags")
        return

    # Remove each temp tag
    removed_count = 0
    for tag_name in temp_tags:
        try:
            result = await mcp_server.call_tool(
                "remove_tag_from_task",
                {
                    "taskId": task_id,
                    "tagName": tag_name
                }
            )
            print(f"✅ Removed: {tag_name}")
            removed_count += 1
        except Exception as e:
            print(f"❌ Failed to remove {tag_name}: {e}")

    print(f"🎉 Removed {removed_count} temporary tags from task {task_id}")

# Usage
await remove_temp_tags("abc123")
```

---

## Comparison: remove_tag_from_task vs delete_space_tag

| Feature | remove_tag_from_task | delete_space_tag |
|---------|---------------------|------------------|
| **Scope** | Single task | All tasks in space |
| **Tag Definition** | Remains in space | Deleted from space |
| **Use Case** | Update individual task | Remove obsolete tag entirely |
| **Reversibility** | Easy (add tag back) | Difficult (recreate tag) |
| **Risk** | Low | High (affects all tasks) |

**When to use which**:
- Use `remove_tag_from_task` when: Updating individual task organization
- Use `delete_space_tag` when: Tag is obsolete and should be removed everywhere

---

**Last Updated**: 2025-10-30
**Related Documentation**: [add_tag_to_task.md](add_tag_to_task.md), [delete_space_tag.md](delete_space_tag.md), [get_task.md](get_task.md)
