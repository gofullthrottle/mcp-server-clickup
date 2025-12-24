# delete_space_tag

## Overview

Deletes a tag from a ClickUp space. **Warning**: This action removes the tag from all tasks using it and cannot be undone. Use with caution.

**Category**: Space Management - Tag Operations

**Rate Limit Impact**: ~2-3% of available requests (100 req/min on Free Forever plan)

---

## Use Cases

1. **Remove Obsolete Tags**: Delete tags that are no longer relevant
2. **Clean Up Duplicates**: Remove duplicate or misspelled tags
3. **Standardize Tags**: Delete non-standard tags during tag consolidation
4. **Reorganize Workflow**: Remove tags when restructuring project organization

---

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `spaceId` | string | One required | ID of the space containing the tag. **Preferred** if you have the ID. |
| `spaceName` | string | One required | Name of the space. Only use if you don't have spaceId. |
| `tagName` | string | **Yes** | Name of the tag to delete. |

**Note**: You must provide **either** `spaceId` (preferred) or `spaceName` (will be resolved to ID).

### Input Schema
```json
{
  "spaceId": "90123456",
  "tagName": "obsolete-tag"
}
```

**OR**

```json
{
  "spaceName": "Marketing",
  "tagName": "old-tag"
}
```

---

## Success Response

```json
{
  "success": true,
  "message": "Tag 'obsolete-tag' deleted successfully from space"
}
```

**Response Fields**:
- `success` (boolean): Always `true` on successful deletion
- `message` (string): Confirmation message with tag name

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

### Tag Not Found
```json
{
  "error": "Tag 'obsolete-tag' not found in space"
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
# Delete a tag with user confirmation
tag_to_delete = "obsolete-tag"
space_id = "90123456"

# Get tag info before deletion
tags_result = await mcp_server.call_tool(
    "get_space_tags",
    {"spaceId": space_id}
)

tag_exists = any(tag["name"] == tag_to_delete for tag in tags_result["tags"])

if tag_exists:
    # Confirm deletion
    confirm = input(f"⚠️ Delete tag '{tag_to_delete}' from all tasks? (yes/no): ")

    if confirm.lower() == "yes":
        result = await mcp_server.call_tool(
            "delete_space_tag",
            {
                "spaceId": space_id,
                "tagName": tag_to_delete
            }
        )
        print(f"✅ {result['message']}")
    else:
        print("❌ Deletion cancelled")
else:
    print(f"❌ Tag '{tag_to_delete}' not found in space")
```

### TypeScript Example
```typescript
// Delete tag with safety check
async function deleteTagSafely(
  spaceId: string,
  tagName: string,
  dryRun: boolean = true
) {
  // Check if tag exists
  const tagsResult = await mcpServer.callTool(
    "get_space_tags",
    { spaceId }
  );

  const tagExists = tagsResult.tags.some(
    (t: any) => t.name === tagName
  );

  if (!tagExists) {
    console.error(`❌ Tag '${tagName}' not found`);
    return;
  }

  if (dryRun) {
    console.log(`🔍 DRY RUN: Would delete tag '${tagName}'`);
    return;
  }

  // Actual deletion
  const result = await mcpServer.callTool(
    "delete_space_tag",
    { spaceId, tagName }
  );

  console.log(`✅ ${result.message}`);
}

// Usage
await deleteTagSafely("90123456", "obsolete-tag", true);  // Dry run first
await deleteTagSafely("90123456", "obsolete-tag", false); // Actual deletion
```

---

## Notes

- **Irreversible Action**: Tag deletion cannot be undone
- **Affects All Tasks**: Tag is removed from all tasks currently using it
- **Case-Sensitive**: Tag name matching is case-sensitive
- **No Confirmation**: API performs deletion immediately without confirmation
- **Tag Definition Only**: Deletes tag definition, not tasks that used the tag

---

## Best Practices

1. **Verify Before Deletion**: Always check tag exists before attempting deletion
2. **Implement Confirmation**: Add user confirmation for destructive operations
3. **Use Dry Run**: Test with dry run flag before actual deletion
4. **Document Reasons**: Log why tags are being deleted for audit purposes
5. **Batch Cleanup**: Delete multiple obsolete tags in a single maintenance session

---

## Related Tools

- **get_space_tags**: List all tags to identify tags for deletion
- **update_space_tag**: Update tag instead of deleting if renaming is sufficient
- **create_space_tag**: Create replacement tag if needed
- **remove_tag_from_task**: Remove tag from specific tasks instead of deleting entirely

---

## Performance Considerations

- **Execution Time**: ~300-600ms (includes space resolution if using name)
- **Rate Limit Cost**: 2-3 requests (~2-3% of rate limit)
  - 1 request: Get spaces (if using spaceName)
  - 1 request: Get tags (to verify tag exists)
  - 1 request: Delete tag
- **Response Size**: ~500 bytes
- **Optimization**: Use `spaceId` directly to save 1 API call

---

## Common Pitfalls

1. **No Confirmation**: API doesn't prompt for confirmation - implement in application
2. **Wrong Tag Name**: Tag names are case-sensitive - match exactly
3. **Deleting Active Tags**: Removing tags currently in use by many tasks
4. **Missing Audit Trail**: Not logging deletions for later reference
5. **Batch Deletion Failures**: Not handling partial failures when deleting multiple tags

---

## Example Workflow: Safe Tag Deletion with Audit

```python
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def delete_tag_with_audit(space_id: str, tag_name: str, reason: str):
    """Delete tag with audit logging and safety checks."""

    # Step 1: Verify tag exists
    tags_result = await mcp_server.call_tool(
        "get_space_tags",
        {"spaceId": space_id}
    )

    tag = next((t for t in tags_result["tags"] if t["name"] == tag_name), None)

    if not tag:
        logger.error(f"Tag '{tag_name}' not found in space {space_id}")
        return False

    # Step 2: Log deletion intent
    logger.info(f"Preparing to delete tag: {tag_name}")
    logger.info(f"Reason: {reason}")
    logger.info(f"Tag details: BG={tag['tag_bg']}, FG={tag['tag_fg']}")

    # Step 3: User confirmation
    confirm = input(f"\n⚠️ This will remove '{tag_name}' from ALL tasks. Continue? (yes/no): ")

    if confirm.lower() != "yes":
        logger.info("Deletion cancelled by user")
        return False

    # Step 4: Perform deletion
    try:
        result = await mcp_server.call_tool(
            "delete_space_tag",
            {
                "spaceId": space_id,
                "tagName": tag_name
            }
        )

        # Step 5: Log successful deletion
        logger.info(f"✅ Tag deleted successfully: {tag_name}")
        logger.info(f"Timestamp: {datetime.now().isoformat()}")
        logger.info(f"Reason: {reason}")

        return True

    except Exception as e:
        logger.error(f"❌ Failed to delete tag: {e}")
        return False

# Usage
await delete_tag_with_audit(
    space_id="90123456",
    tag_name="obsolete-tag",
    reason="Tag no longer relevant after workflow redesign"
)
```

---

## Example Workflow: Bulk Tag Cleanup

```python
# Clean up obsolete tags with safety checks
obsolete_tags = [
    "old-workflow",
    "deprecated",
    "temp-tag",
    "testing"
]

space_id = "90123456"

# Get current tags
tags_result = await mcp_server.call_tool(
    "get_space_tags",
    {"spaceId": space_id}
)

existing_names = [tag["name"] for tag in tags_result["tags"]]

# Delete only existing obsolete tags
deleted_count = 0
skipped_count = 0

for tag_name in obsolete_tags:
    if tag_name in existing_names:
        try:
            result = await mcp_server.call_tool(
                "delete_space_tag",
                {
                    "spaceId": space_id,
                    "tagName": tag_name
                }
            )
            print(f"✅ Deleted: {tag_name}")
            deleted_count += 1
        except Exception as e:
            print(f"❌ Error deleting {tag_name}: {e}")
    else:
        print(f"⏭️ Skipped: {tag_name} (doesn't exist)")
        skipped_count += 1

print(f"\n🎉 Deleted {deleted_count} tags, skipped {skipped_count}")
```

---

## Warning: Data Loss Prevention

**Critical Considerations**:

1. **No Undo**: Deletion is permanent and cannot be reversed
2. **All Tasks Affected**: Tag removed from every task using it
3. **No Backup**: ClickUp doesn't provide tag deletion backups
4. **Audit Trail**: Consider logging tag details before deletion

**Recommended Safeguards**:
- ✅ Export tag list before bulk deletion
- ✅ Implement confirmation prompts
- ✅ Use dry run mode for testing
- ✅ Log all deletions with timestamps
- ✅ Consider "archive" pattern instead of deletion

---

**Last Updated**: 2025-10-30
**Related Documentation**: [get_space_tags.md](get_space_tags.md), [update_space_tag.md](update_space_tag.md), [remove_tag_from_task.md](remove_tag_from_task.md)
