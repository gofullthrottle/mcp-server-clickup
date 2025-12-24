# clickup_space_delete

## Overview

**PERMANENTLY** deletes a space from the workspace including all folders, lists, and tasks. This action **cannot be undone**.

**Category**: Space Management - CRUD Operations

**Rate Limit Impact**: ~2-3% of available requests (100 req/min on Free Forever plan)

---

## ⚠️ CRITICAL WARNINGS

1. **IRREVERSIBLE**: Deletion cannot be undone
2. **ALL CONTENTS DELETED**: Every folder, list, and task is permanently removed
3. **NO BACKUP**: ClickUp doesn't provide automatic backups
4. **USE SPACE ID**: Never delete by name

---

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `space_id` | string | **Yes** | ID of the space to delete |

---

## Success Response

```json
{
  "message": "Space 90123456 deleted successfully"
}
```

---

## Integration Examples

### Python Example (with Safety Checks)
```python
# SAFE deletion with confirmation
async def delete_space_safely(space_id: str, dry_run: bool = True):
    """Delete space with safety checks."""

    # Get space details
    space_info = await mcp_server.call_tool(
        "clickup_space_get",
        {"space_id": space_id}
    )

    print("⚠️" * 30)
    print(f"⚠️ WARNING: About to DELETE space and ALL contents!")
    print(f"⚠️ Space: {space_info['name']}")
    print(f"⚠️ Members: {len(space_info['members'])}")
    print(f"⚠️ This action CANNOT be undone!")
    print("⚠️" * 30)

    if dry_run:
        print("\n🔍 DRY RUN - No action taken")
        return False

    confirm = input("\nType 'DELETE' to confirm: ")

    if confirm != "DELETE":
        print("❌ Deletion cancelled")
        return False

    # Perform deletion
    result = await mcp_server.call_tool(
        "clickup_space_delete",
        {"space_id": space_id}
    )

    print(f"\n✅ {result['message']}")
    return True

# Usage
await delete_space_safely("90123456", dry_run=True)  # Check first
await delete_space_safely("90123456", dry_run=False)  # Actual deletion
```

---

## Best Practices

1. **ALWAYS USE SPACE ID**: Never use name for deletion
2. **IMPLEMENT CONFIRMATION**: Require explicit user confirmation
3. **DRY RUN MODE**: Test with dry run before actual deletion
4. **AUDIT LOGGING**: Log all deletions with timestamp
5. **EXPORT FIRST**: Export space contents before deletion
6. **CONSIDER ARCHIVING**: Use `clickup_space_archive` instead

---

## Related Tools

- **clickup_space_archive**: Archive instead of deleting (reversible)
- **clickup_space_get**: Get space details before deletion

---

**Last Updated**: 2025-10-30
