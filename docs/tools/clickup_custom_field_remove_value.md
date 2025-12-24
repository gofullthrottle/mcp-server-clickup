# clickup_custom_field_remove_value

## Overview

Removes/clears a custom field value from a task.

**Category**: Custom Fields - Value Operations

**Rate Limit Impact**: ~2-3% of available requests (100 req/min on Free Forever plan)

---

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `task_id` | string | **Yes** | Task ID to remove custom field from |
| `field_id` | string | **Yes** | Custom field ID to remove |
| `use_custom_task_ids` | boolean | No | Whether to use custom task IDs |

---

## Success Response

```json
{
  "task_id": "task-123",
  "field_id": "abc123-def456",
  "message": "Custom field abc123-def456 removed from task"
}
```

---

## Integration Examples

### Python Example
```python
# Remove custom field value
result = await mcp_server.call_tool(
    "clickup_custom_field_remove_value",
    {
        "task_id": "task-123",
        "field_id": "abc123-def456"
    }
)

print(f"✅ {result['message']}")
```

---

## Use Cases

1. **Clear Invalid Values**: Remove incorrectly set values
2. **Reset Fields**: Clear optional fields to default state
3. **Bulk Cleanup**: Remove obsolete custom field data
4. **Field Migration**: Clear old values before setting new ones

---

## Related Tools

- **clickup_custom_field_set_value**: Set custom field value
- **clickup_custom_field_get_values**: Get all field values from task

---

**Last Updated**: 2025-10-30
