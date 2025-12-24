# get_workspace_members

## Overview

Returns all members (users) in the ClickUp workspace/team. Essential for resolving assignees by name or email before creating or updating tasks.

**Category**: Workspace Management - Member Resolution

**Rate Limit Impact**: ~1% of available requests (100 req/min on Free Forever plan)

---

## Use Cases

1. **List All Team Members**: Display available assignees for task assignment
2. **Validate Member Existence**: Check if a user exists before assigning them to tasks
3. **Member Discovery**: Find members by browsing the complete member list
4. **Pre-Assignment Validation**: Verify team members before bulk task operations

---

## Input Parameters

**No parameters required.**

```json
{}
```

---

## Success Response

Returns an array of member objects with user details:

```json
{
  "members": [
    {
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
  ]
}
```

**Response Fields**:
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
# Get all workspace members
result = await mcp_server.call_tool(
    "get_workspace_members",
    {}
)

members = result["members"]
print(f"Found {len(members)} members")

# Find member by email
target_email = "john.doe@company.com"
member = next(
    (m for m in members if m["email"].lower() == target_email.lower()),
    None
)

if member:
    print(f"Found user: {member['username']} (ID: {member['id']})")
else:
    print(f"User not found: {target_email}")
```

### TypeScript Example
```typescript
// Get all workspace members
const result = await mcpServer.callTool(
  "get_workspace_members",
  {}
);

const members = result.members;
console.log(`Found ${members.length} members`);

// Find member by username (case-insensitive)
const targetUsername = "john.doe";
const member = members.find(m =>
  m.username?.toLowerCase() === targetUsername.toLowerCase()
);

if (member) {
  console.log(`Found user: ${member.username} (ID: ${member.id})`);
} else {
  console.log(`User not found: ${targetUsername}`);
}
```

---

## Notes

- **Case-Insensitive Matching**: When searching members, use case-insensitive comparison for email/username/name fields
- **No Parameters**: This tool requires no input parameters - returns entire workspace member list
- **Caching Recommended**: Cache member list locally if making multiple member lookups
- **Guest Users**: Members with `role: 4` are guests with limited permissions
- **Inactive Users**: Check `last_active` timestamp to identify inactive members

---

## Best Practices

1. **Cache Member Data**: Store member list locally to avoid repeated API calls
2. **Use Helper Tools**: For single member lookups, use `find_member_by_name` instead
3. **Bulk Resolution**: For multiple assignee lookups, use `resolve_assignees` tool
4. **Validate Roles**: Check user roles before assigning critical tasks
5. **Handle Missing Data**: Some fields (profilePicture, custom_role) may be null

---

## Related Tools

- **find_member_by_name**: Find specific member by name or email
- **resolve_assignees**: Resolve multiple assignee names to user IDs
- **create_task**: Create tasks with assignee IDs
- **update_task**: Update task assignees using user IDs

---

## Performance Considerations

- **Execution Time**: ~200-500ms depending on team size
- **Rate Limit Cost**: 1 request (~1% of rate limit)
- **Response Size**: Scales with number of members (typically 1-50KB)
- **Optimization**: Cache results for 5-10 minutes to reduce API calls

---

**Last Updated**: 2025-10-30
**Related Documentation**: [find_member_by_name.md](find_member_by_name.md), [resolve_assignees.md](resolve_assignees.md)
