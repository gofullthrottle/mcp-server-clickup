# create_space_tag

## Overview

Creates a new tag in a ClickUp space. Tags are space-level and become available for all tasks within that space. Supports manual color specification or natural language color commands.

**Category**: Space Management - Tag Operations

**Rate Limit Impact**: ~2-3% of available requests (100 req/min on Free Forever plan)

---

## Use Cases

1. **Organize Tasks**: Create tags for task categorization (urgent, review, blocked)
2. **Workflow States**: Define custom workflow states using colored tags
3. **Priority Markers**: Create priority tags with distinctive colors
4. **Team Labels**: Tag tasks by team, department, or project phase

---

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `spaceId` | string | One required | ID of the space to create tag in. **Preferred** if you have the ID. |
| `spaceName` | string | One required | Name of the space. Only use if you don't have spaceId. |
| `tagName` | string | **Yes** | Name of the new tag. Must be unique within the space. |
| `tagBg` | string | No | Background color in HEX format (e.g., `#FF0000`). Overrides colorCommand. |
| `tagFg` | string | No | Foreground (text) color in HEX format (e.g., `#FFFFFF`). Overrides colorCommand. |
| `colorCommand` | string | No | Natural language color command (e.g., "red tag", "blue background"). |

**Note**: You must provide **either** `spaceId` (preferred) or `spaceName` (will be resolved to ID).

### Input Schema

#### Using Direct Colors
```json
{
  "spaceId": "90123456",
  "tagName": "urgent",
  "tagBg": "#FF0000",
  "tagFg": "#FFFFFF"
}
```

#### Using Color Command
```json
{
  "spaceName": "Marketing",
  "tagName": "review",
  "colorCommand": "yellow tag"
}
```

#### Minimal (Default Colors)
```json
{
  "spaceId": "90123456",
  "tagName": "blocked"
}
```

---

## Color Command Support

Natural language color commands automatically generate color pairs:

| Command | Background | Foreground | Use Case |
|---------|------------|------------|----------|
| `"red tag"` | `#FF0000` | `#FFFFFF` | Urgent, high priority |
| `"blue tag"` | `#0000FF` | `#FFFFFF` | Information, in progress |
| `"green tag"` | `#00FF00` | `#000000` | Complete, approved |
| `"yellow tag"` | `#FFFF00` | `#000000` | Warning, review needed |
| `"orange tag"` | `#FFA500` | `#000000` | Medium priority |
| `"purple tag"` | `#800080` | `#FFFFFF` | Special, important |
| `"gray tag"` | `#808080` | `#FFFFFF` | Blocked, on hold |

**Note**: `tagBg` and `tagFg` parameters override `colorCommand` if provided.

---

## Success Response

```json
{
  "tag": {
    "name": "urgent",
    "tag_fg": "#FFFFFF",
    "tag_bg": "#FF0000",
    "creator": 12345678
  }
}
```

**Response Fields**:
- `name` (string): Tag name as created
- `tag_fg` (string): Foreground (text) color in HEX format
- `tag_bg` (string): Background color in HEX format
- `creator` (number): User ID of member who created the tag

---

## Error Responses

### Missing Required Parameters
```json
{
  "error": "tagName is required"
}
```

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

### Tag Already Exists
```json
{
  "error": "Tag 'urgent' already exists in space"
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
# Create tag with color command (easiest)
result = await mcp_server.call_tool(
    "create_space_tag",
    {
        "spaceId": "90123456",
        "tagName": "urgent",
        "colorCommand": "red tag"
    }
)

print(f"✅ Created tag: {result['tag']['name']}")
print(f"   Colors: BG={result['tag']['tag_bg']}, FG={result['tag']['tag_fg']}")

# Create tag with custom colors
result = await mcp_server.call_tool(
    "create_space_tag",
    {
        "spaceName": "Marketing",
        "tagName": "review",
        "tagBg": "#FFD700",  # Gold
        "tagFg": "#000000"   # Black
    }
)
```

### TypeScript Example
```typescript
// Create multiple tags with different colors
const tags = [
  { name: "urgent", color: "red tag" },
  { name: "review", color: "yellow tag" },
  { name: "blocked", color: "gray tag" },
  { name: "approved", color: "green tag" }
];

for (const tag of tags) {
  const result = await mcpServer.callTool(
    "create_space_tag",
    {
      spaceId: "90123456",
      tagName: tag.name,
      colorCommand: tag.color
    }
  );

  console.log(`✅ Created: ${result.tag.name} (${result.tag.tag_bg})`);
}
```

---

## Notes

- **Space-Level Tags**: Tag created is available to all tasks in the space
- **Unique Names**: Tag names must be unique within each space
- **Default Colors**: If no colors specified, ClickUp assigns default colors
- **Color Priority**: Manual `tagBg`/`tagFg` override `colorCommand`
- **Case-Sensitive**: Tag names are case-sensitive ("urgent" ≠ "Urgent")

---

## Best Practices

1. **Use Color Commands**: Easier than manual HEX codes for common colors
2. **Verify Space First**: Check space exists before creating tags
3. **Check for Duplicates**: Use `get_space_tags` to avoid duplicate tag names
4. **Meaningful Names**: Use clear, descriptive tag names
5. **Consistent Colors**: Use consistent color schemes across similar tags

---

## Related Tools

- **get_space_tags**: List all tags in space to check for duplicates
- **update_space_tag**: Update existing tag name or colors
- **delete_space_tag**: Delete tag from space
- **add_tag_to_task**: Add newly created tag to tasks

---

## Performance Considerations

- **Execution Time**: ~300-600ms (includes space resolution if using name)
- **Rate Limit Cost**: 2-3 requests (~2-3% of rate limit)
  - 1 request: Get spaces (if using spaceName)
  - 1 request: Create tag
  - 1 request: Verify tag creation
- **Response Size**: ~1KB
- **Optimization**: Use `spaceId` directly to save 1 API call

---

## Common Pitfalls

1. **Duplicate Tags**: Always check existing tags before creating
2. **Invalid HEX Colors**: Use proper format `#RRGGBB` (6 hex digits with #)
3. **Missing Space Identifier**: Must provide spaceId or spaceName
4. **Case Sensitivity**: Remember tag names are case-sensitive
5. **Color Readability**: Ensure good contrast between foreground and background colors

---

## Example Workflow: Create Standard Tag Set

```python
# Define standard tags for project workflow
standard_tags = [
    {"name": "urgent", "color": "red tag"},
    {"name": "in-review", "color": "yellow tag"},
    {"name": "blocked", "color": "gray tag"},
    {"name": "approved", "color": "green tag"},
    {"name": "high-priority", "color": "orange tag"}
]

# Get existing tags to avoid duplicates
existing_tags = await mcp_server.call_tool(
    "get_space_tags",
    {"spaceId": "90123456"}
)
existing_names = [tag["name"].lower() for tag in existing_tags["tags"]]

# Create only missing tags
created_count = 0
for tag_def in standard_tags:
    if tag_def["name"].lower() not in existing_names:
        result = await mcp_server.call_tool(
            "create_space_tag",
            {
                "spaceId": "90123456",
                "tagName": tag_def["name"],
                "colorCommand": tag_def["color"]
            }
        )
        print(f"✅ Created: {tag_def['name']}")
        created_count += 1
    else:
        print(f"⏭️ Skipped: {tag_def['name']} (already exists)")

print(f"\n🎉 Created {created_count} new tags")
```

---

## Color Command Reference

```python
# All supported color commands
color_commands = {
    "red tag": {"bg": "#FF0000", "fg": "#FFFFFF"},
    "blue tag": {"bg": "#0000FF", "fg": "#FFFFFF"},
    "green tag": {"bg": "#00FF00", "fg": "#000000"},
    "yellow tag": {"bg": "#FFFF00", "fg": "#000000"},
    "orange tag": {"bg": "#FFA500", "fg": "#000000"},
    "purple tag": {"bg": "#800080", "fg": "#FFFFFF"},
    "pink tag": {"bg": "#FFC0CB", "fg": "#000000"},
    "gray tag": {"bg": "#808080", "fg": "#FFFFFF"},
    "black tag": {"bg": "#000000", "fg": "#FFFFFF"},
    "white tag": {"bg": "#FFFFFF", "fg": "#000000"}
}
```

---

**Last Updated**: 2025-10-30
**Related Documentation**: [get_space_tags.md](get_space_tags.md), [update_space_tag.md](update_space_tag.md), [add_tag_to_task.md](add_tag_to_task.md)
