# get_space_tags

## Overview

Gets all tags in a ClickUp space. Tags are defined at the space level and can be applied to any task within that space. Use this tool to check available tags before adding them to tasks.

**Category**: Space Management - Tag Operations

**Rate Limit Impact**: ~1% of available requests (100 req/min on Free Forever plan)

---

## Use Cases

1. **List Available Tags**: Display all tags available in a space for task organization
2. **Tag Validation**: Check if a tag exists before attempting to add it to a task
3. **Tag Discovery**: Browse existing tags to maintain consistency
4. **Pre-Task Validation**: Verify tag existence before bulk tag operations

---

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `spaceId` | string | One required | ID of the space to get tags from. **Preferred** if you have the ID. |
| `spaceName` | string | One required | Name of the space to get tags from. Only use if you don't have spaceId. |

**Note**: You must provide **either** `spaceId` (preferred) or `spaceName` (will be resolved to ID).

### Input Schema
```json
{
  "spaceId": "90123456"
}
```

**OR**

```json
{
  "spaceName": "Marketing"
}
```

---

## Success Response

```json
{
  "tags": [
    {
      "name": "urgent",
      "tag_fg": "#FFFFFF",
      "tag_bg": "#FF0000",
      "creator": 12345678
    },
    {
      "name": "review",
      "tag_fg": "#000000",
      "tag_bg": "#FFFF00",
      "creator": 23456789
    },
    {
      "name": "blocked",
      "tag_fg": "#FFFFFF",
      "tag_bg": "#808080",
      "creator": 12345678
    }
  ]
}
```

**Response Fields**:
- `name` (string): Tag name (case-sensitive)
- `tag_fg` (string): Foreground (text) color in HEX format
- `tag_bg` (string): Background color in HEX format
- `creator` (number): User ID of member who created the tag

---

## Error Responses

### Missing Space Identifier
```json
{
  "error": "Either spaceId or spaceName is required"
}
```

### Space Not Found
```json
{
  "error": "Space not found: Marketing Team"
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
# Get tags by space ID (preferred)
result = await mcp_server.call_tool(
    "get_space_tags",
    {
        "spaceId": "90123456"
    }
)

tags = result["tags"]
print(f"Found {len(tags)} tags in space")

# Check if specific tag exists
tag_name = "urgent"
tag_exists = any(tag["name"].lower() == tag_name.lower() for tag in tags)

if tag_exists:
    print(f"✅ Tag '{tag_name}' exists")
else:
    print(f"❌ Tag '{tag_name}' does not exist - create it first")
```

### TypeScript Example
```typescript
// Get tags by space name (resolved to ID automatically)
const result = await mcpServer.callTool(
  "get_space_tags",
  {
    spaceName: "Marketing"
  }
);

const tags = result.tags;
console.log(`Found ${tags.length} tags in space`);

// Display tag list with colors
tags.forEach((tag: any) => {
  console.log(`- ${tag.name}: BG=${tag.tag_bg}, FG=${tag.tag_fg}`);
});

// Find tag by name (case-insensitive)
const targetTag = "urgent";
const tag = tags.find((t: any) =>
  t.name.toLowerCase() === targetTag.toLowerCase()
);

if (tag) {
  console.log(`Found tag: ${tag.name}`);
} else {
  console.log(`Tag not found: ${targetTag}`);
}
```

---

## Notes

- **Space-Level Tags**: Tags are defined at space level, not list or task level
- **Case-Sensitive Names**: Tag names are case-sensitive in ClickUp
- **Empty Result**: Returns empty array if space has no tags (not an error)
- **Space Name Resolution**: When using `spaceName`, tool performs case-insensitive lookup
- **Color Codes**: Colors are in HEX format (e.g., `#FF0000` for red)

---

## Best Practices

1. **Use spaceId When Available**: Direct ID lookup is faster than name resolution
2. **Cache Tag List**: Store tags locally to avoid repeated API calls
3. **Case-Insensitive Search**: When searching for tags, use case-insensitive comparison
4. **Validate Before Add**: Always check tag existence before calling `add_tag_to_task`
5. **List for Users**: Display tag list to users before tag operations

---

## Related Tools

- **create_space_tag**: Create new tag in space
- **update_space_tag**: Update existing tag name or colors
- **delete_space_tag**: Delete tag from space
- **add_tag_to_task**: Add existing tag to a task
- **remove_tag_from_task**: Remove tag from a task

---

## Performance Considerations

- **Execution Time**: ~200-400ms for space name resolution, ~100-200ms for direct space ID
- **Rate Limit Cost**: 1-2 requests (~1-2% of rate limit) - 2 if using space name resolution
- **Response Size**: ~1KB per 10 tags
- **Optimization**: Cache tag list for 10-15 minutes to reduce API calls

---

## Common Pitfalls

1. **Case Sensitivity**: Tag names are case-sensitive - "urgent" ≠ "Urgent"
2. **Missing Space Identifier**: Must provide either `spaceId` or `spaceName`
3. **Assuming Tags Exist**: Always verify tag existence before adding to tasks
4. **Confusing Space and List**: Tags are space-level, not list-level
5. **Not Caching Results**: Repeated calls for same space waste rate limit

---

## Example Workflow: Verify Tag Before Adding

```python
# Step 1: Get all tags in space
tags_result = await mcp_server.call_tool(
    "get_space_tags",
    {"spaceId": "90123456"}
)

tags = tags_result["tags"]
tag_names = [tag["name"].lower() for tag in tags]

# Step 2: Check if target tag exists
target_tag = "urgent"
if target_tag.lower() not in tag_names:
    print(f"❌ Tag '{target_tag}' doesn't exist - creating it...")

    # Create the tag first
    create_result = await mcp_server.call_tool(
        "create_space_tag",
        {
            "spaceId": "90123456",
            "tagName": target_tag,
            "colorCommand": "red tag"
        }
    )
    print(f"✅ Created tag: {target_tag}")

# Step 3: Add tag to task
add_result = await mcp_server.call_tool(
    "add_tag_to_task",
    {
        "taskId": "abc123",
        "tagName": target_tag
    }
)
print(f"✅ Added tag '{target_tag}' to task")
```

---

**Last Updated**: 2025-10-30
**Related Documentation**: [create_space_tag.md](create_space_tag.md), [add_tag_to_task.md](add_tag_to_task.md)
