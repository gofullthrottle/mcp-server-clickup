# update_space_tag

## Overview

Updates an existing tag in a ClickUp space. You can update the tag name, colors, or both. Changes apply to all tasks currently using the tag.

**Category**: Space Management - Tag Operations

**Rate Limit Impact**: ~2-3% of available requests (100 req/min on Free Forever plan)

---

## Use Cases

1. **Rename Tags**: Update tag names for clarity or consistency
2. **Change Colors**: Adjust tag colors for better visual distinction
3. **Standardize Tags**: Update tags to match organizational color schemes
4. **Fix Typos**: Correct tag name typos that affect multiple tasks

---

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `spaceId` | string | One required | ID of the space containing the tag. **Preferred** if you have the ID. |
| `spaceName` | string | One required | Name of the space. Only use if you don't have spaceId. |
| `tagName` | string | **Yes** | Current name of the tag to update. |
| `newTagName` | string | One required | New name for the tag. |
| `tagBg` | string | One required | New background color in HEX format (e.g., `#FF0000`). Overrides colorCommand. |
| `tagFg` | string | One required | New foreground (text) color in HEX format (e.g., `#FFFFFF`). Overrides colorCommand. |
| `colorCommand` | string | One required | Natural language color command (e.g., "red tag", "blue background"). |

**Notes**:
- You must provide **either** `spaceId` (preferred) or `spaceName` (will be resolved to ID).
- At least **one update parameter** is required: `newTagName`, `tagBg`/`tagFg`, or `colorCommand`.

### Input Schema

#### Rename Tag Only
```json
{
  "spaceId": "90123456",
  "tagName": "urgent",
  "newTagName": "high-priority"
}
```

#### Change Colors Only
```json
{
  "spaceName": "Marketing",
  "tagName": "review",
  "colorCommand": "yellow tag"
}
```

#### Update Name and Colors
```json
{
  "spaceId": "90123456",
  "tagName": "old-name",
  "newTagName": "new-name",
  "tagBg": "#FF0000",
  "tagFg": "#FFFFFF"
}
```

---

## Success Response

```json
{
  "tag": {
    "name": "high-priority",
    "tag_fg": "#FFFFFF",
    "tag_bg": "#FF0000",
    "creator": 12345678
  }
}
```

**Response Fields**:
- `name` (string): Updated tag name
- `tag_fg` (string): Updated foreground (text) color in HEX format
- `tag_bg` (string): Updated background color in HEX format
- `creator` (number): User ID of original creator (unchanged)

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

```json
{
  "error": "At least one of newTagName, tagBg, tagFg, or colorCommand must be provided"
}
```

### Space Not Found
```json
{
  "error": "Space not found: Marketing Team"
}
```

### Tag Not Found
```json
{
  "error": "Tag 'urgent' not found in space"
}
```

### New Name Already Exists
```json
{
  "error": "Tag 'high-priority' already exists in space"
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
# Rename a tag (updates all tasks using it)
result = await mcp_server.call_tool(
    "update_space_tag",
    {
        "spaceId": "90123456",
        "tagName": "urgent",
        "newTagName": "high-priority"
    }
)

print(f"✅ Renamed tag: urgent → {result['tag']['name']}")

# Change tag colors using color command
result = await mcp_server.call_tool(
    "update_space_tag",
    {
        "spaceName": "Marketing",
        "tagName": "review",
        "colorCommand": "orange tag"
    }
)

print(f"✅ Updated colors: BG={result['tag']['tag_bg']}, FG={result['tag']['tag_fg']}")

# Update both name and colors
result = await mcp_server.call_tool(
    "update_space_tag",
    {
        "spaceId": "90123456",
        "tagName": "old-tag",
        "newTagName": "new-tag",
        "tagBg": "#0000FF",
        "tagFg": "#FFFFFF"
    }
)
```

### TypeScript Example
```typescript
// Update tag name with validation
const oldName = "urgent";
const newName = "high-priority";

// Check if new name already exists
const existingTags = await mcpServer.callTool(
  "get_space_tags",
  { spaceId: "90123456" }
);

const nameExists = existingTags.tags.some((t: any) =>
  t.name.toLowerCase() === newName.toLowerCase()
);

if (nameExists) {
  console.error(`❌ Tag '${newName}' already exists`);
} else {
  const result = await mcpServer.callTool(
    "update_space_tag",
    {
      spaceId: "90123456",
      tagName: oldName,
      newTagName: newName
    }
  );

  console.log(`✅ Renamed: ${oldName} → ${result.tag.name}`);
}
```

---

## Notes

- **Affects All Tasks**: Tag updates apply to all tasks currently using the tag
- **Atomic Updates**: Cannot partially fail - either all changes apply or none do
- **Name Uniqueness**: New tag name must be unique within the space
- **Color Priority**: Manual `tagBg`/`tagFg` override `colorCommand`
- **Case-Sensitive**: Tag names are case-sensitive for matching

---

## Best Practices

1. **Verify Tag Exists**: Check tag exists before attempting update
2. **Check Name Conflicts**: Verify new name doesn't already exist
3. **Use Color Commands**: Easier than manual HEX codes for common colors
4. **Communicate Changes**: Inform team before renaming widely-used tags
5. **Batch Updates**: Update multiple tags in sequence if standardizing colors

---

## Related Tools

- **get_space_tags**: List all tags to verify current names and check for conflicts
- **create_space_tag**: Create new tags if needed
- **delete_space_tag**: Delete tags that are no longer needed
- **add_tag_to_task**: Add updated tag to tasks

---

## Performance Considerations

- **Execution Time**: ~300-600ms (includes space resolution if using name)
- **Rate Limit Cost**: 2-3 requests (~2-3% of rate limit)
  - 1 request: Get spaces (if using spaceName)
  - 1 request: Get tags (to verify tag exists)
  - 1 request: Update tag
- **Response Size**: ~1KB
- **Optimization**: Use `spaceId` directly to save 1 API call

---

## Common Pitfalls

1. **Not Checking Existence**: Attempting to update non-existent tags
2. **Name Conflicts**: New name already exists in space
3. **Missing Update Parameters**: Must provide at least one update field
4. **Invalid HEX Colors**: Use proper format `#RRGGBB` (6 hex digits with #)
5. **Case Sensitivity**: Tag name matching is case-sensitive

---

## Example Workflow: Standardize Tag Colors

```python
# Standardize all priority tags to use consistent colors
priority_tags = {
    "urgent": "red tag",
    "high-priority": "orange tag",
    "medium-priority": "yellow tag",
    "low-priority": "blue tag"
}

# Get existing tags
existing_tags = await mcp_server.call_tool(
    "get_space_tags",
    {"spaceId": "90123456"}
)

existing_names = [tag["name"] for tag in existing_tags["tags"]]

# Update colors for existing priority tags
updated_count = 0
for tag_name, color_command in priority_tags.items():
    if tag_name in existing_names:
        result = await mcp_server.call_tool(
            "update_space_tag",
            {
                "spaceId": "90123456",
                "tagName": tag_name,
                "colorCommand": color_command
            }
        )
        print(f"✅ Updated: {tag_name} → {result['tag']['tag_bg']}")
        updated_count += 1
    else:
        print(f"⏭️ Skipped: {tag_name} (doesn't exist)")

print(f"\n🎉 Updated {updated_count} tags")
```

---

## Example Workflow: Rename Tags for Consistency

```python
# Rename tags to follow naming convention
renames = {
    "urgent": "priority-high",
    "high": "priority-high",
    "medium": "priority-medium",
    "low": "priority-low"
}

for old_name, new_name in renames.items():
    try:
        result = await mcp_server.call_tool(
            "update_space_tag",
            {
                "spaceId": "90123456",
                "tagName": old_name,
                "newTagName": new_name
            }
        )
        print(f"✅ Renamed: {old_name} → {new_name}")
    except Exception as e:
        if "not found" in str(e):
            print(f"⏭️ Skipped: {old_name} (doesn't exist)")
        elif "already exists" in str(e):
            print(f"⚠️ Skipped: {old_name} (target name already exists)")
        else:
            print(f"❌ Error updating {old_name}: {e}")
```

---

**Last Updated**: 2025-10-30
**Related Documentation**: [get_space_tags.md](get_space_tags.md), [create_space_tag.md](create_space_tag.md), [delete_space_tag.md](delete_space_tag.md)
