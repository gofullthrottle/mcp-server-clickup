# find_member_by_name

## Overview

Finds a member in the ClickUp workspace by name or email. Returns the member object if found, or null if not found. Performs case-insensitive matching on email, username, and name fields.

**Category**: Workspace Management - Member Resolution

**Rate Limit Impact**: ~1% of available requests (100 req/min on Free Forever plan)

---

## Use Cases

1. **Quick Member Lookup**: Find a specific member by their email or username
2. **Assignee Validation**: Verify if a member exists before task assignment
3. **User ID Resolution**: Get user ID from human-readable name/email
4. **Pre-Task Validation**: Check member existence before creating tasks with assignees

---

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nameOrEmail` | string | **Yes** | The name or email of the member to find. Case-insensitive matching. |

### Input Schema
```json
{
  "nameOrEmail": "john.doe@company.com"
}
```

**Examples**:
- Email: `"john.doe@company.com"`
- Username: `"john.doe"`
- Full name: `"John Doe"` (if name field is set in ClickUp profile)

---

## Success Response

### Member Found
```json
{
  "member": {
    "id": 12345678,
    "username": "john.doe",
    "email": "john.doe@company.com",
    "color": "#7b68ee",
    "profilePicture": "https://...",
    "initials": "JD",
    "role": 3,
    "custom_role": null,
    "last_active": "1640000000000",
    "date_joined": "1630000000000",
    "date_invited": "1630000000000"
  }
}
```

### Member Not Found
```json
{
  "member": null
}
```

**Response Fields** (when member found):
- `id` (number): Unique user ID for API operations
- `username` (string): User's ClickUp username
- `email` (string): User's email address
- `color` (string): User's color in hex format
- `profilePicture` (string): URL to user's profile picture
- `initials` (string): User's initials
- `role` (number): User's role level (1=owner, 2=admin, 3=member, 4=guest)
- `last_active` (string): Unix timestamp of last activity
- `date_joined` (string): Unix timestamp when user joined
- `date_invited` (string): Unix timestamp when user was invited

---

## Error Responses

### Missing Required Parameter
```json
{
  "error": "nameOrEmail is required"
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
# Find member by email
result = await mcp_server.call_tool(
    "find_member_by_name",
    {
        "nameOrEmail": "john.doe@company.com"
    }
)

if result["member"]:
    member = result["member"]
    print(f"Found: {member['username']} (ID: {member['id']})")

    # Use member ID to create task
    task_result = await mcp_server.call_tool(
        "create_task",
        {
            "listId": "123456789",
            "name": "New task",
            "assignees": [member['id']]
        }
    )
else:
    print("Member not found")
```

### TypeScript Example
```typescript
// Find member by username (case-insensitive)
const result = await mcpServer.callTool(
  "find_member_by_name",
  {
    nameOrEmail: "John.Doe"  // Case doesn't matter
  }
);

if (result.member) {
  const member = result.member;
  console.log(`Found: ${member.username} (ID: ${member.id})`);

  // Check if user is active
  const lastActive = new Date(parseInt(member.last_active));
  const daysSinceActive = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSinceActive > 30) {
    console.warn(`Warning: User inactive for ${Math.floor(daysSinceActive)} days`);
  }
} else {
  console.log("Member not found");
}
```

---

## Notes

- **Case-Insensitive**: Matching is case-insensitive for all search fields (email, username, name)
- **Null Result**: Returns `{"member": null}` if no match found (not an error)
- **Multiple Fields**: Searches email, username, and name fields in parallel
- **First Match**: Returns first matching member if multiple fields match
- **Exact Match**: Requires exact match on at least one field (no partial matching)

---

## Best Practices

1. **Use Email for Reliability**: Email addresses are unique and most reliable for member lookup
2. **Handle Null Results**: Always check if `member` is null before using the result
3. **Cache Member IDs**: Store resolved member IDs to avoid repeated lookups
4. **Validate Before Assignment**: Use this tool to validate members before bulk operations
5. **Use resolve_assignees for Bulk**: For multiple member lookups, use `resolve_assignees` tool instead

---

## Related Tools

- **get_workspace_members**: Get all members in workspace
- **resolve_assignees**: Resolve multiple assignee names to user IDs
- **create_task**: Create tasks with assignee IDs
- **update_task**: Update task assignees using user IDs

---

## Performance Considerations

- **Execution Time**: ~200-500ms (same as get_workspace_members)
- **Rate Limit Cost**: 1 request (~1% of rate limit)
- **Response Size**: ~1-2KB for single member
- **Optimization**: Cache successful lookups for 5-10 minutes

---

## Common Pitfalls

1. **Assuming Non-Null**: Always check for null before accessing member fields
2. **Case Sensitivity**: Don't assume exact case matching - tool handles case-insensitive search
3. **Partial Matching**: Tool requires exact match on full email/username/name (no substring search)
4. **Multiple Lookups**: Use `resolve_assignees` instead of calling this tool multiple times

---

**Last Updated**: 2025-10-30
**Related Documentation**: [get_workspace_members.md](get_workspace_members.md), [resolve_assignees.md](resolve_assignees.md)
