# delete_list

## Overview

**PERMANENTLY** deletes a ClickUp list and **ALL its tasks**. This action **cannot be undone**. Use with extreme caution.

**Category**: List Management - CRUD Operations

**Rate Limit Impact**: ~2-3% of available requests (100 req/min on Free Forever plan)

---

## ⚠️ CRITICAL WARNINGS

1. **IRREVERSIBLE**: Deletion cannot be undone
2. **ALL TASKS DELETED**: Every task in the list is permanently removed
3. **NO BACKUP**: ClickUp doesn't provide automatic backups
4. **USE LIST ID**: Using `listName` is risky if names aren't unique

---

## Use Cases

1. **Remove Obsolete Lists**: Delete lists that are no longer needed
2. **Clean Up Test Data**: Remove test lists during development
3. **Project Completion**: Delete lists after project archival
4. **Reorganization**: Remove lists during workspace restructuring

---

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `listId` | string | One required | ID of the list to delete. **STRONGLY PREFERRED** for safety. |
| `listName` | string | One required | Name of the list to delete. **RISKY** if not unique. |

**Note**: You must provide **either** `listId` (strongly recommended) or `listName` (risky).

### Input Schema

#### Using List ID (STRONGLY RECOMMENDED)
```json
{
  "listId": "901234567"
}
```

#### Using List Name (RISKY)
```json
{
  "listName": "Old Sprint"
}
```

---

## Success Response

```json
{
  "success": true,
  "message": "List \"Old Sprint\" deleted successfully"
}
```

**Response Fields**:
- `success` (boolean): Always `true` on successful deletion
- `message` (string): Confirmation message with list name

---

## Error Responses

### Missing Required Parameters
```json
{
  "error": "Either listId or listName must be provided"
}
```

### List Not Found
```json
{
  "error": "List \"Old Sprint\" not found"
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

### Python Example (with Safety Checks)
```python
# SAFE deletion with confirmation
async def delete_list_safely(list_id: str, dry_run: bool = True):
    """Delete list with safety checks and confirmation."""

    # Step 1: Get list details
    try:
        list_info = await mcp_server.call_tool(
            "get_list",
            {"listId": list_id}
        )
    except Exception as e:
        print(f"❌ List not found: {list_id}")
        return False

    list_name = list_info["name"]
    space_name = list_info["space"]["name"]

    # Step 2: Count tasks in list
    tasks_result = await mcp_server.call_tool(
        "get_tasks",
        {"listId": list_id}
    )

    task_count = len(tasks_result.get("tasks", []))

    # Step 3: Display warning
    print("⚠️" * 30)
    print(f"⚠️ WARNING: About to DELETE list permanently!")
    print(f"⚠️ List: {list_name}")
    print(f"⚠️ Space: {space_name}")
    print(f"⚠️ Tasks to be deleted: {task_count}")
    print(f"⚠️ This action CANNOT be undone!")
    print("⚠️" * 30)

    if dry_run:
        print("\n🔍 DRY RUN - No action taken")
        return False

    # Step 4: Require explicit confirmation
    confirm = input("\nType 'DELETE' to confirm: ")

    if confirm != "DELETE":
        print("❌ Deletion cancelled")
        return False

    # Step 5: Perform deletion
    try:
        result = await mcp_server.call_tool(
            "delete_list",
            {"listId": list_id}
        )

        print(f"\n✅ {result['message']}")
        print(f"   Deleted {task_count} tasks")
        return True

    except Exception as e:
        print(f"❌ Deletion failed: {e}")
        return False

# Usage with dry run first
await delete_list_safely("901234567", dry_run=True)  # Check what would happen
await delete_list_safely("901234567", dry_run=False)  # Actual deletion
```

### TypeScript Example (with Audit Logging)
```typescript
// Delete list with audit logging
async function deleteListWithAudit(
  listId: string,
  reason: string
): Promise<boolean> {
  // Step 1: Get list details for audit
  const listInfo = await mcpServer.callTool(
    "get_list",
    { listId }
  );

  const auditEntry = {
    timestamp: new Date().toISOString(),
    action: "delete_list",
    listId: listId,
    listName: listInfo.name,
    spaceName: listInfo.space.name,
    reason: reason,
    deletedBy: "automation"
  };

  // Step 2: Log before deletion
  console.log("📝 Audit Log:", JSON.stringify(auditEntry, null, 2));

  // Step 3: Delete list
  try {
    const result = await mcpServer.callTool(
      "delete_list",
      { listId }
    );

    console.log(`✅ ${result.message}`);

    // Step 4: Save audit log (implement your logging here)
    // await saveAuditLog(auditEntry);

    return true;
  } catch (error) {
    console.error(`❌ Deletion failed: ${error.message}`);
    return false;
  }
}

// Usage
await deleteListWithAudit(
  "901234567",
  "Project completed and archived"
);
```

---

## Notes

- **IRREVERSIBLE**: No undo functionality available
- **ALL TASKS DELETED**: Every task in list is permanently removed
- **LIST ID STRONGLY RECOMMENDED**: Name-based deletion is risky
- **NO CONFIRMATION**: API performs deletion immediately
- **AUDIT TRAIL**: Implement logging for deletion operations

---

## Best Practices

1. **ALWAYS USE LIST ID**: Never use listName for deletion
2. **IMPLEMENT CONFIRMATION**: Require explicit user confirmation
3. **DRY RUN MODE**: Test with dry run before actual deletion
4. **AUDIT LOGGING**: Log all deletions with timestamp and reason
5. **EXPORT FIRST**: Export list and tasks before deletion
6. **VERIFY TWICE**: Double-check list ID before deletion

---

## Related Tools

- **get_list**: Get list details before deletion
- **get_tasks**: Count tasks before deletion
- **update_list**: Consider archiving instead of deleting
- **create_list**: Create new list if needed

---

## Performance Considerations

- **Execution Time**: ~400-700ms depending on list size
- **Rate Limit Cost**: 2-3 requests (~2-3% of rate limit)
  - 1 request: Get list details (for confirmation message)
  - 1 request: Find list (if using name)
  - 1 request: Delete list
- **Response Size**: ~500 bytes
- **Optimization**: Use `listId` to minimize API calls

---

## Common Pitfalls

1. **NO CONFIRMATION**: Not implementing user confirmation
2. **USING LIST NAME**: Risk of deleting wrong list if names duplicate
3. **NO AUDIT TRAIL**: Not logging deletions for accountability
4. **NO BACKUP**: Not exporting data before deletion
5. **BATCH DELETION ERRORS**: Not handling partial failures properly

---

## Example Workflow: Safe Deletion with Export

```python
import json
from datetime import datetime

async def export_and_delete_list(list_id: str, reason: str):
    """Export list and tasks before deletion."""

    # Step 1: Get list details
    list_info = await mcp_server.call_tool(
        "get_list",
        {"listId": list_id}
    )

    # Step 2: Get all tasks
    tasks_result = await mcp_server.call_tool(
        "get_tasks",
        {"listId": list_id}
    )

    tasks = tasks_result.get("tasks", [])

    # Step 3: Create export data
    export_data = {
        "exported_at": datetime.now().isoformat(),
        "deletion_reason": reason,
        "list": list_info,
        "tasks": tasks,
        "task_count": len(tasks)
    }

    # Step 4: Save export
    filename = f"list_export_{list_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

    with open(filename, 'w') as f:
        json.dump(export_data, f, indent=2)

    print(f"✅ Exported to: {filename}")
    print(f"   List: {list_info['name']}")
    print(f"   Tasks: {len(tasks)}")

    # Step 5: Confirm deletion
    print(f"\n⚠️ WARNING: About to delete list '{list_info['name']}'")
    print(f"⚠️ This will delete {len(tasks)} tasks permanently!")
    print(f"⚠️ Reason: {reason}")

    confirm = input("\nType 'DELETE' to confirm: ")

    if confirm != "DELETE":
        print("❌ Deletion cancelled")
        print(f"   Export saved: {filename}")
        return False

    # Step 6: Delete list
    try:
        result = await mcp_server.call_tool(
            "delete_list",
            {"listId": list_id}
        )

        print(f"\n✅ {result['message']}")
        print(f"   Backup: {filename}")
        return True

    except Exception as e:
        print(f"❌ Deletion failed: {e}")
        print(f"   Export preserved: {filename}")
        return False

# Usage
await export_and_delete_list(
    "901234567",
    "Project completed - archiving to backup storage"
)
```

---

## Example Workflow: Bulk Deletion with Safety

```python
# Delete multiple obsolete lists safely
async def cleanup_obsolete_lists(list_ids: list, dry_run: bool = True):
    """Delete multiple lists with safety checks."""

    print(f"🔍 Cleaning up {len(list_ids)} lists")

    if dry_run:
        print("⚠️ DRY RUN MODE - No actual deletions\n")

    deleted_count = 0
    failed_count = 0
    total_tasks = 0

    for list_id in list_ids:
        try:
            # Get list details
            list_info = await mcp_server.call_tool(
                "get_list",
                {"listId": list_id}
            )

            # Count tasks
            tasks_result = await mcp_server.call_tool(
                "get_tasks",
                {"listId": list_id}
            )

            task_count = len(tasks_result.get("tasks", []))
            total_tasks += task_count

            print(f"📋 {list_info['name']}")
            print(f"   Tasks: {task_count}")
            print(f"   Space: {list_info['space']['name']}")

            if not dry_run:
                # Actual deletion
                result = await mcp_server.call_tool(
                    "delete_list",
                    {"listId": list_id}
                )
                print(f"   ✅ Deleted")
                deleted_count += 1
            else:
                print(f"   🔍 Would delete")

            print()

        except Exception as e:
            print(f"   ❌ Error: {e}\n")
            failed_count += 1

    # Summary
    print("=" * 60)
    if dry_run:
        print(f"🔍 DRY RUN SUMMARY:")
        print(f"   Would delete: {len(list_ids) - failed_count} lists")
        print(f"   Would remove: {total_tasks} tasks")
    else:
        print(f"🎉 DELETION SUMMARY:")
        print(f"   Deleted: {deleted_count} lists")
        print(f"   Removed: {total_tasks} tasks")
        print(f"   Failed: {failed_count}")
    print("=" * 60)

# Usage
obsolete_lists = ["901234567", "901234568", "901234569"]

# Step 1: Dry run to see what would happen
await cleanup_obsolete_lists(obsolete_lists, dry_run=True)

# Step 2: Actual deletion after review
# await cleanup_obsolete_lists(obsolete_lists, dry_run=False)
```

---

## Alternative: Archive Instead of Delete

Consider archiving lists instead of deleting them:

```python
# Archive list instead of deleting (REVERSIBLE)
async def archive_list(list_id: str):
    """Archive list by renaming instead of deleting."""

    from datetime import datetime

    # Get current list
    list_info = await mcp_server.call_tool(
        "get_list",
        {"listId": list_id}
    )

    # Rename to archived
    archive_date = datetime.now().strftime("%Y-%m-%d")
    new_name = f"[ARCHIVED-{archive_date}] {list_info['name']}"

    result = await mcp_server.call_tool(
        "update_list",
        {
            "listId": list_id,
            "name": new_name,
            "content": f"Archived on {archive_date}. Original name: {list_info['name']}",
            "status": "closed"
        }
    )

    print(f"✅ Archived (REVERSIBLE): {list_info['name']}")
    print(f"   New name: {new_name}")
    print(f"   Status: closed")

    return result

# Usage: Archive instead of delete (can be undone!)
await archive_list("901234567")
```

---

**Last Updated**: 2025-10-30
**Related Documentation**: [get_list.md](get_list.md), [update_list.md](update_list.md), [create_list.md](create_list.md)
