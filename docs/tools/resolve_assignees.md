# resolve_assignees

## Overview

Resolves an array of assignee names or emails to ClickUp user IDs. Returns an array of user IDs, or errors for any that cannot be resolved. Optimized for bulk member resolution before task operations.

**Category**: Workspace Management - Member Resolution

**Rate Limit Impact**: ~1% of available requests (100 req/min on Free Forever plan)

---

## Use Cases

1. **Bulk Assignee Resolution**: Convert multiple names/emails to user IDs in one operation
2. **Task Creation Preparation**: Resolve all assignees before creating tasks with multiple assignees
3. **Import Workflows**: Map external user identifiers to ClickUp user IDs during data import
4. **Validation Before Bulk Operations**: Verify all assignees exist before bulk task creation/update

---

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `assignees` | string[] | **Yes** | Array of assignee names or emails to resolve. Case-insensitive matching. |

### Input Schema
```json
{
  "assignees": [
    "john.doe@company.com",
    "jane.smith",
    "Bob Johnson"
  ]
}
```

**Examples**:
- Emails: `["user1@company.com", "user2@company.com"]`
- Usernames: `["john.doe", "jane.smith"]`
- Mixed: `["john.doe@company.com", "jane.smith", "Bob Johnson"]`

---

## Success Response

### All Assignees Resolved
```json
{
  "assignees": [
    12345678,
    23456789,
    34567890
  ]
}
```

### Partial Resolution (Some Not Found)
```json
{
  "assignees": [
    12345678,
    null,
    34567890
  ],
  "errors": [
    {
      "index": 1,
      "input": "jane.smith",
      "message": "Member not found: jane.smith"
    }
  ]
}
```

**Response Fields**:
- `assignees` (array): User IDs in same order as input. `null` for unresolved members.
- `errors` (array, optional): Details about unresolved members
  - `index` (number): Position in input array (0-based)
  - `input` (string): Original name/email that failed to resolve
  - `message` (string): Error description

---

## Error Responses

### Missing Required Parameter
```json
{
  "error": "assignees array is required"
}
```

### Invalid Input Type
```json
{
  "error": "assignees must be an array of strings"
}
```

### Empty Array
```json
{
  "error": "assignees array cannot be empty"
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
# Resolve multiple assignees before task creation
result = await mcp_server.call_tool(
    "resolve_assignees",
    {
        "assignees": [
            "john.doe@company.com",
            "jane.smith",
            "bob.johnson@company.com"
        ]
    }
)

assignee_ids = result["assignees"]

# Check for unresolved assignees
if "errors" in result:
    print("⚠️ Some assignees could not be resolved:")
    for error in result["errors"]:
        print(f"  - {error['input']}: {error['message']}")

# Filter out null values (unresolved members)
valid_assignees = [id for id in assignee_ids if id is not None]

if valid_assignees:
    # Create task with resolved assignees
    task_result = await mcp_server.call_tool(
        "create_task",
        {
            "listId": "123456789",
            "name": "Team task",
            "assignees": valid_assignees
        }
    )
    print(f"✅ Task created with {len(valid_assignees)} assignees")
else:
    print("❌ No valid assignees found")
```

### TypeScript Example
```typescript
// Resolve assignees and handle errors gracefully
const result = await mcpServer.callTool(
  "resolve_assignees",
  {
    assignees: [
      "john.doe@company.com",
      "jane.smith",
      "invalid.user@company.com"
    ]
  }
);

const assigneeIds = result.assignees;

// Separate successful and failed resolutions
const resolved: number[] = [];
const failed: string[] = [];

assigneeIds.forEach((id: number | null, index: number) => {
  if (id !== null) {
    resolved.push(id);
  } else if (result.errors) {
    const error = result.errors.find((e: any) => e.index === index);
    if (error) {
      failed.push(error.input);
    }
  }
});

console.log(`✅ Resolved: ${resolved.length} assignees`);
console.log(`❌ Failed: ${failed.length} assignees`);

if (failed.length > 0) {
  console.log("Failed to resolve:", failed.join(", "));
}

// Create task with successfully resolved assignees
if (resolved.length > 0) {
  await mcpServer.callTool("create_task", {
    listId: "123456789",
    name: "Team task",
    assignees: resolved
  });
}
```

---

## Notes

- **Case-Insensitive**: Matching is case-insensitive for all search fields (email, username, name)
- **Null for Unresolved**: Returns `null` in array position for members that couldn't be resolved
- **Error Details**: Check `errors` array for details about failed resolutions
- **Order Preserved**: Output array maintains same order as input array
- **Partial Success**: Tool succeeds even if some members can't be resolved (check for nulls)

---

## Best Practices

1. **Validate Results**: Always check for `null` values and `errors` array before using results
2. **Filter Before Use**: Remove `null` values before passing to task creation/update tools
3. **Use for Bulk Only**: For single member lookup, use `find_member_by_name` instead
4. **Cache Results**: Store resolved member IDs to avoid repeated lookups
5. **Handle Failures Gracefully**: Decide whether to proceed with partial assignees or abort operation

---

## Related Tools

- **get_workspace_members**: Get all members in workspace
- **find_member_by_name**: Find single member by name or email
- **create_task**: Create tasks with assignee IDs
- **update_task**: Update task assignees using user IDs
- **create_bulk_tasks**: Create multiple tasks with resolved assignees

---

## Performance Considerations

- **Execution Time**: ~200-500ms (same as get_workspace_members, regardless of input size)
- **Rate Limit Cost**: 1 request (~1% of rate limit) - efficient for bulk operations
- **Response Size**: ~1KB per 10 assignees
- **Optimization**: Single API call resolves all assignees, much more efficient than multiple `find_member_by_name` calls

---

## Common Pitfalls

1. **Not Checking for Nulls**: Always filter out `null` values before using resolved IDs
2. **Ignoring Errors Array**: Check `errors` to understand which assignees failed to resolve
3. **Assuming All Success**: Even without errors, check each array element for `null`
4. **Wrong Tool for Single Lookup**: Use `find_member_by_name` for single member resolution
5. **Not Preserving Order**: Remember that output order matches input order (important for batch operations)

---

## Example Workflow: Bulk Task Creation with Assignees

```python
# Step 1: Resolve all assignees upfront
assignee_names = ["john.doe", "jane.smith", "bob.johnson"]
resolve_result = await mcp_server.call_tool(
    "resolve_assignees",
    {"assignees": assignee_names}
)

# Step 2: Extract valid IDs
valid_ids = [id for id in resolve_result["assignees"] if id is not None]

# Step 3: Report any failures
if "errors" in resolve_result:
    print(f"⚠️ {len(resolve_result['errors'])} assignees not found")

# Step 4: Create tasks with resolved assignees
if valid_ids:
    for task_name in ["Task 1", "Task 2", "Task 3"]:
        await mcp_server.call_tool(
            "create_task",
            {
                "listId": "123456789",
                "name": task_name,
                "assignees": valid_ids
            }
        )
    print(f"✅ Created 3 tasks with {len(valid_ids)} assignees each")
```

---

**Last Updated**: 2025-10-30
**Related Documentation**: [get_workspace_members.md](get_workspace_members.md), [find_member_by_name.md](find_member_by_name.md)
