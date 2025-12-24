# delete_time_entry

**Category**: Task Management - Time Tracking

Deletes a time entry by its unique ID. Permanently removes the time entry from the task's time tracking records. Useful for correcting mistakes, removing duplicate entries, or managing accidental time logs.

---

## Use Cases

### 1. **Correct Tracking Mistakes**
Remove time entries that were accidentally created or logged incorrectly (wrong task, wrong duration, wrong date) to maintain accurate time tracking records.

### 2. **Remove Duplicate Entries**
Delete duplicate time entries that were created by mistake when bulk importing or when a timer was accidentally started multiple times.

### 3. **Clean Up Test Data**
Remove test time entries created during development, testing, or training to keep production time tracking data clean and accurate.

### 4. **Manage Billing Corrections**
Delete non-billable time entries that were mistakenly marked as billable, or remove entries that shouldn't be included in client invoices.

---

## Input Parameters

```json
{
  "timeEntryId": "time_123456789"
}
```

### Parameter Reference

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `timeEntryId` | string | **Required** | Unique ID of the time entry to delete. Obtained from `get_task_time_entries` or time tracking tool responses. |

**Note**: The time entry ID is the unique identifier returned when creating or retrieving time entries, not the task ID.

---

## Success Response

```json
{
  "success": true,
  "message": "Time entry deleted successfully."
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Always `true` for successful deletions |
| `message` | string | Confirmation message |

---

## Error Responses

### 1. VALIDATION - Missing Time Entry ID

```json
{
  "success": false,
  "error": {
    "type": "VALIDATION",
    "message": "Time entry ID is required.",
    "timestamp": "2025-01-05T14:00:00.123Z"
  }
}
```

### 2. NOT_FOUND - Time Entry Not Found

```json
{
  "success": false,
  "error": {
    "type": "NOT_FOUND",
    "message": "Time entry with ID 'time_123456789' not found",
    "timestamp": "2025-01-05T14:00:00.123Z"
  }
}
```

**Why This Happens**:
- Time entry ID is incorrect or doesn't exist
- Time entry was already deleted
- Time entry belongs to a different workspace/team

**How to Resolve**: Verify the time entry ID by listing entries for the task using `get_task_time_entries`.

### 3. AUTH - No Permission

```json
{
  "success": false,
  "error": {
    "type": "AUTH",
    "message": "You do not have permission to delete this time entry",
    "timestamp": "2025-01-05T14:00:00.123Z"
  }
}
```

**Why This Happens**:
- Insufficient permissions to delete time entries
- Time entry belongs to another user (depending on workspace settings)
- Role restrictions prevent time entry deletion

### 4. RATE_LIMIT

```json
{
  "success": false,
  "error": {
    "type": "RATE_LIMIT",
    "message": "Rate limit exceeded. Please wait before making more requests.",
    "retry_after": 3000,
    "timestamp": "2025-01-05T14:00:00.123Z"
  }
}
```

---

## Rate Limit Information

**Rate Limit Impact**: ~1% per execution

- **Free Forever Plan**: 100 requests/minute
- **Single query**: 1 request (delete entry) = 1% of rate limit

---

## API Dependencies

### ClickUp API Endpoints

1. **Delete Time Entry**:
   - `DELETE /team/{teamId}/time_entries/{timeEntryId}`

### Required Permissions

- **Time Tracking**: Required to delete time entries
- **Delete Time**: May require specific delete permission depending on workspace settings

---

## Integration Examples

### Python Example - Delete Single Time Entry

```python
from mcp_client import MCPClient

async def delete_time_entry(time_entry_id: str):
    """Delete a time entry by ID"""
    client = MCPClient()

    response = await client.call_tool('delete_time_entry', {
        'timeEntryId': time_entry_id
    })

    if response['success']:
        print(f"✅ Time entry deleted successfully")
        return True
    else:
        print(f"❌ Error: {response['error']['message']}")
        return False

# Usage
await delete_time_entry('time_123456789')
```

### Python Example - Delete with Confirmation

```python
async def delete_time_entry_safe(time_entry_id: str, confirm: bool = True):
    """Delete time entry with confirmation"""
    client = MCPClient()

    # Get time entry details first
    # (Assumes you have the task ID or can look it up)
    if confirm:
        # Show entry details before deletion
        print(f"⚠️  About to delete time entry: {time_entry_id}")
        confirmation = input("Are you sure? (yes/no): ")

        if confirmation.lower() != 'yes':
            print("Deletion cancelled")
            return False

    # Delete entry
    response = await client.call_tool('delete_time_entry', {
        'timeEntryId': time_entry_id
    })

    if response['success']:
        print(f"✅ Time entry deleted")
        return True
    else:
        print(f"❌ Failed to delete: {response['error']['message']}")
        return False

# Usage
await delete_time_entry_safe('time_123456789')
```

### Python Example - Delete Duplicate Entries

```python
from collections import defaultdict

async def delete_duplicate_time_entries(task_id: str):
    """Find and delete duplicate time entries on a task"""
    client = MCPClient()

    # Get all time entries for task
    entries_response = await client.call_tool('get_task_time_entries', {
        'taskId': task_id
    })

    if not entries_response['success']:
        print(f"❌ Failed to get entries: {entries_response['error']['message']}")
        return

    entries = entries_response['time_entries']

    # Group by start time and duration to find duplicates
    entry_groups = defaultdict(list)
    for entry in entries:
        key = (entry['start'], entry['duration_ms'])
        entry_groups[key].append(entry)

    # Find duplicates
    duplicates_deleted = 0
    for key, group in entry_groups.items():
        if len(group) > 1:
            print(f"⚠️  Found {len(group)} duplicates for {group[0]['start']}, {group[0]['duration']}")

            # Keep first, delete rest
            for entry in group[1:]:
                delete_result = await client.call_tool('delete_time_entry', {
                    'timeEntryId': entry['id']
                })

                if delete_result['success']:
                    print(f"   ✅ Deleted duplicate: {entry['id']}")
                    duplicates_deleted += 1
                else:
                    print(f"   ❌ Failed to delete {entry['id']}: {delete_result['error']['message']}")

    print(f"\n✅ Deleted {duplicates_deleted} duplicate entries")

# Usage
await delete_duplicate_time_entries('86fpd7vgc')
```

### TypeScript Example - Bulk Delete by Filter

```typescript
import { MCPClient } from 'mcp-client';

async function deleteTimeEntriesByTag(taskId: string, tag: string) {
  const client = new MCPClient();

  // Get all time entries
  const entriesResponse = await client.callTool('get_task_time_entries', {
    taskId
  });

  if (!entriesResponse.success) {
    console.error(`❌ Failed to get entries: ${entriesResponse.error.message}`);
    return;
  }

  const entries = entriesResponse.time_entries;

  // Filter entries by tag
  const toDelete = entries.filter((entry: any) =>
    entry.tags && entry.tags.includes(tag)
  );

  console.log(`Found ${toDelete.length} entries with tag "${tag}"`);

  if (toDelete.length === 0) {
    console.log('No entries to delete');
    return;
  }

  // Delete each entry
  let deleted = 0;
  let failed = 0;

  for (const entry of toDelete) {
    const deleteResponse = await client.callTool('delete_time_entry', {
      timeEntryId: entry.id
    });

    if (deleteResponse.success) {
      console.log(`✅ Deleted: ${entry.description || 'No description'} (${entry.duration})`);
      deleted++;
    } else {
      console.error(`❌ Failed to delete ${entry.id}: ${deleteResponse.error.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Deleted: ${deleted}`);
  console.log(`   Failed: ${failed}`);
}

// Usage
await deleteTimeEntriesByTag('86fpd7vgc', 'test-data');
```

### TypeScript Example - Delete Entries by Date Range

```typescript
async function deleteTimeEntriesInRange(
  taskId: string,
  startDate: string,
  endDate: string
) {
  const client = new MCPClient();

  // Get time entries in date range
  const entriesResponse = await client.callTool('get_task_time_entries', {
    taskId,
    startDate,
    endDate
  });

  if (!entriesResponse.success) {
    console.error(`❌ Failed to get entries: ${entriesResponse.error.message}`);
    return;
  }

  const entries = entriesResponse.time_entries;

  if (entries.length === 0) {
    console.log('No entries found in date range');
    return;
  }

  console.log(`⚠️  About to delete ${entries.length} time entries`);
  console.log(`Date range: ${startDate} to ${endDate}`);

  // Show summary of what will be deleted
  const totalMs = entries.reduce((sum: number, e: any) => sum + e.duration_ms, 0);
  const totalHours = (totalMs / 3600000).toFixed(2);
  console.log(`Total time: ${totalHours}h`);

  // Confirm deletion
  // (In real implementation, add proper confirmation mechanism)

  // Delete all entries
  let deleted = 0;
  for (const entry of entries) {
    const deleteResponse = await client.callTool('delete_time_entry', {
      timeEntryId: entry.id
    });

    if (deleteResponse.success) {
      console.log(`✅ Deleted: ${entry.start} - ${entry.duration}`);
      deleted++;
    } else {
      console.error(`❌ Failed: ${deleteResponse.error.message}`);
    }
  }

  console.log(`\n✅ Deleted ${deleted} / ${entries.length} entries`);
}

// Usage
await deleteTimeEntriesInRange('86fpd7vgc', 'last week', '6 days ago');
```

### Python Example - Undo Recent Time Entry

```python
async def undo_last_time_entry(task_id: str):
    """Delete the most recent time entry for a task"""
    client = MCPClient()

    # Get all time entries, sorted by most recent
    entries_response = await client.call_tool('get_task_time_entries', {
        'taskId': task_id
    })

    if not entries_response['success']:
        print(f"❌ Failed to get entries: {entries_response['error']['message']}")
        return False

    entries = entries_response['time_entries']

    if not entries:
        print("No time entries found")
        return False

    # Sort by start time (most recent first)
    sorted_entries = sorted(entries, key=lambda e: e['start'], reverse=True)
    latest = sorted_entries[0]

    print(f"⚠️  Deleting most recent entry:")
    print(f"   Started: {latest['start']}")
    print(f"   Duration: {latest['duration']}")
    print(f"   Description: {latest['description'] or 'No description'}")

    # Delete entry
    delete_response = await client.call_tool('delete_time_entry', {
        'timeEntryId': latest['id']
    })

    if delete_response['success']:
        print(f"✅ Entry deleted")
        return True
    else:
        print(f"❌ Failed to delete: {delete_response['error']['message']}")
        return False

# Usage
await undo_last_time_entry('86fpd7vgc')
```

---

## Related Tools

- **`get_task_time_entries`** - Get time entry IDs to delete
- **`add_time_entry`** - Add corrected time entry after deleting wrong one
- **`start_time_tracking`** - Start new timer after deleting incorrect entry
- **`stop_time_tracking`** - Creates time entry that might need deletion
- **`get_current_time_entry`** - Check running timer before operations
- **`get_task`** - Get task details to verify time tracking enabled

---

## Best Practices

### DO:
- ✅ **Confirm before deleting** - Show entry details and ask for confirmation
- ✅ **Get entry details first** - Use `get_task_time_entries` to see what you're deleting
- ✅ **Keep audit trail** - Log deleted entries for accountability and rollback
- ✅ **Delete duplicates** - Remove duplicate entries to maintain data quality
- ✅ **Batch delete carefully** - Validate filters before bulk operations
- ✅ **Verify entry ID** - Ensure you're deleting the correct entry
- ✅ **Add replacement** - If deleting incorrect entry, add correct one immediately
- ✅ **Check permissions** - Verify you can delete entries before attempting

### DON'T:
- ❌ **Don't delete without confirmation** - Always show what will be deleted
- ❌ **Don't bulk delete blindly** - Review entries before deleting many at once
- ❌ **Don't delete billable entries carelessly** - Verify with stakeholders first
- ❌ **Don't lose entry data** - Save entry details before deletion for records
- ❌ **Don't delete other users' entries** - Respect ownership and permissions
- ❌ **Don't delete without backup** - Keep records of deleted data
- ❌ **Don't use wrong entry ID** - Double-check the ID before deletion

---

## Performance Tips

1. **Batch operations efficiently**:
```python
# ✅ GOOD: Delete multiple entries with progress tracking
async def batch_delete_entries(entry_ids: list[str]):
    results = {'deleted': 0, 'failed': 0}

    for i, entry_id in enumerate(entry_ids):
        print(f"Deleting {i+1}/{len(entry_ids)}...")

        result = await client.call_tool('delete_time_entry', {
            'timeEntryId': entry_id
        })

        if result['success']:
            results['deleted'] += 1
        else:
            results['failed'] += 1

    return results

# ❌ BAD: No progress tracking or error handling
async def batch_delete_bad(entry_ids: list[str]):
    for entry_id in entry_ids:
        await client.call_tool('delete_time_entry', {'timeEntryId': entry_id})
```

2. **Cache entry details before deletion**:
```typescript
// ✅ GOOD: Save entry data before deleting
async function deleteWithBackup(entryId: string, taskId: string) {
  // Get full entry details first
  const entries = await client.callTool('get_task_time_entries', { taskId });
  const entry = entries.time_entries.find((e: any) => e.id === entryId);

  // Save to backup
  const backup = {
    id: entry.id,
    task: entry.task,
    start: entry.start,
    end: entry.end,
    duration: entry.duration,
    description: entry.description,
    billable: entry.billable,
    tags: entry.tags,
    deleted_at: new Date().toISOString()
  };

  // Store backup (implementation depends on your system)
  await saveBackup(backup);

  // Now safe to delete
  return await client.callTool('delete_time_entry', { timeEntryId: entryId });
}
```

3. **Validate before attempting deletion**:
```python
# ✅ GOOD: Check entry exists before deleting
async def safe_delete(entry_id: str, task_id: str):
    # Get entries first
    entries_response = await client.call_tool('get_task_time_entries', {
        'taskId': task_id
    })

    if entries_response['success']:
        entry_ids = [e['id'] for e in entries_response['time_entries']]

        if entry_id not in entry_ids:
            print(f"❌ Entry {entry_id} not found in task")
            return False

    # Entry exists, safe to delete
    return await client.call_tool('delete_time_entry', {
        'timeEntryId': entry_id
    })
```

---

## Troubleshooting

### Issue: "Time entry with ID 'xxx' not found"

**Problem**: Entry ID doesn't exist or is incorrect.

**Solution**:
```python
# Get all entries to find correct ID
entries = await client.call_tool('get_task_time_entries', {
    'taskId': task_id
})

if entries['success']:
    for entry in entries['time_entries']:
        print(f"ID: {entry['id']}")
        print(f"  Start: {entry['start']}")
        print(f"  Duration: {entry['duration']}")
        print(f"  Description: {entry['description']}")
```

### Issue: "You do not have permission to delete this time entry"

**Problem**: Insufficient permissions or trying to delete another user's entry.

**Solution**:
- Check workspace time tracking settings
- Verify you have delete permission for time entries
- Confirm entry ownership (some workspaces restrict deleting others' entries)
- Check if you're an admin or have appropriate role

### Issue: Deleted wrong entry by mistake

**Problem**: Accidentally deleted the wrong time entry.

**Solution**:
```python
# If you have backup data, recreate the entry
await client.call_tool('add_time_entry', {
    'taskId': backup['task']['id'],
    'start': backup['start'],
    'duration': str(backup['duration_ms']) + 'm',  # Convert to minutes
    'description': backup['description'],
    'billable': backup['billable'],
    'tags': backup['tags']
})
```

**Prevention**: Always back up entry data before deletion.

### Issue: Bulk deletion rate limited

**Problem**: Deleting too many entries too quickly.

**Solution**:
```python
import asyncio

async def rate_limited_bulk_delete(entry_ids: list[str]):
    """Delete entries with rate limiting"""
    for i, entry_id in enumerate(entry_ids):
        result = await client.call_tool('delete_time_entry', {
            'timeEntryId': entry_id
        })

        if result['success']:
            print(f"✅ Deleted {i+1}/{len(entry_ids)}")
        else:
            print(f"❌ Failed: {result['error']['message']}")

        # Add delay between deletions to avoid rate limit
        if i < len(entry_ids) - 1:
            await asyncio.sleep(0.1)  # 100ms delay
```

---

## Changelog

### Version 1.1.0
- ✨ **New**: Automatic retry with exponential backoff
- ✨ **New**: Debug logging with request tracking
- 🔧 **Changed**: Improved error messages with actionable guidance
- 🔧 **Changed**: Enhanced validation for entry ID

### Version 1.0.0
- ✨ **New**: Initial implementation
- ✨ **New**: Delete time entry by ID
- ✨ **New**: Validation for required timeEntryId parameter
