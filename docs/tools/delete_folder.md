# delete_folder

## Overview

**PERMANENTLY** deletes a ClickUp folder and **ALL its contents** (lists and tasks). This action **cannot be undone**. Use with extreme caution.

**Category**: Folder Management - CRUD Operations

**Rate Limit Impact**: ~2-3% of available requests (100 req/min on Free Forever plan)

---

## ⚠️ CRITICAL WARNINGS

1. **IRREVERSIBLE**: Deletion cannot be undone
2. **ALL CONTENTS DELETED**: Every list and task in folder is permanently removed
3. **NO BACKUP**: ClickUp doesn't provide automatic backups
4. **USE FOLDER ID**: Using `folderName` is risky if names aren't unique

---

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `folderId` | string | One required | ID of the folder to delete. **STRONGLY PREFERRED** for safety. |
| `folderName` | string | One required | Name of the folder to delete. **RISKY** if not unique. |
| `spaceId` | string | Conditional | ID of space containing folder. Required when using `folderName`. |
| `spaceName` | string | Conditional | Name of space containing folder. Required when using `folderName`. |

---

## Success Response

```json
{
  "success": true,
  "message": "Folder \"Old Projects\" deleted successfully"
}
```

---

## Integration Examples

### Python Example (with Safety Checks)
```python
# SAFE deletion with confirmation
async def delete_folder_safely(folder_id: str, dry_run: bool = True):
    """Delete folder with safety checks."""

    # Get folder details
    folder_info = await mcp_server.call_tool(
        "get_folder",
        {"folderId": folder_id}
    )

    folder_name = folder_info["name"]

    # Warning
    print("⚠️" * 30)
    print(f"⚠️ WARNING: About to DELETE folder and ALL contents!")
    print(f"⚠️ Folder: {folder_name}")
    print(f"⚠️ Space: {folder_info['space']['name']}")
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
        "delete_folder",
        {"folderId": folder_id}
    )

    print(f"\n✅ {result['message']}")
    return True

# Usage
await delete_folder_safely("801234567", dry_run=True)  # Check first
await delete_folder_safely("801234567", dry_run=False)  # Actual deletion
```

### TypeScript Example
```typescript
// Delete with confirmation
async function deleteFolderWithConfirm(folderId: string): Promise<boolean> {
  const folder = await mcpServer.callTool(
    "get_folder",
    { folderId }
  );

  console.log(`⚠️ About to delete folder: ${folder.name}`);
  console.log(`⚠️ This will delete ALL lists and tasks!`);

  // Implement confirmation logic here

  const result = await mcpServer.callTool(
    "delete_folder",
    { folderId }
  );

  console.log(`✅ ${result.message}`);
  return true;
}
```

---

## Alternative: Archive Instead of Delete

```python
# Archive folder by renaming (REVERSIBLE)
async def archive_folder(folder_id: str):
    """Archive folder by renaming instead of deleting."""

    from datetime import datetime

    folder_info = await mcp_server.call_tool(
        "get_folder",
        {"folderId": folder_id}
    )

    archive_date = datetime.now().strftime("%Y-%m-%d")
    new_name = f"[ARCHIVED-{archive_date}] {folder_info['name']}"

    result = await mcp_server.call_tool(
        "update_folder",
        {
            "folderId": folder_id,
            "name": new_name
        }
    )

    print(f"✅ Archived (REVERSIBLE): {folder_info['name']}")
    return result

# Usage: Archive instead of delete (can be undone!)
await archive_folder("801234567")
```

---

## Best Practices

1. **ALWAYS USE FOLDER ID**: Never use folderName for deletion
2. **IMPLEMENT CONFIRMATION**: Require explicit user confirmation
3. **DRY RUN MODE**: Test with dry run before actual deletion
4. **AUDIT LOGGING**: Log all deletions with timestamp and reason
5. **EXPORT FIRST**: Export folder contents before deletion
6. **CONSIDER ARCHIVING**: Rename folder instead of deleting

---

## Related Tools

- **get_folder**: Get folder details before deletion
- **update_folder**: Consider archiving instead of deleting
- **create_folder**: Create new folder if needed
- **delete_list**: Delete individual lists instead of entire folder

---

**Last Updated**: 2025-10-30
