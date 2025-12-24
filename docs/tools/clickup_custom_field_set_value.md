# clickup_custom_field_set_value

## Overview

Sets a custom field value on a task with support for all ClickUp custom field types and proper formatting.

**Category**: Custom Fields - Value Operations

**Rate Limit Impact**: ~2-3% of available requests (100 req/min on Free Forever plan)

---

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `task_id` | string | **Yes** | Task ID to set custom field on |
| `field_id` | string | **Yes** | Custom field ID (UUID) |
| `value` | any | **Yes** | Value to set (format depends on field type) |
| `field_type` | string (enum) | No | Field type (helps with formatting) |
| `use_custom_task_ids` | boolean | No | Whether to use custom task IDs |

---

## Value Formats by Field Type

```python
# Text
value = "Engineering Team"

# Number
value = 42

# Date / Date Time
value = 1674835200000  # Unix timestamp in milliseconds

# Dropdown (single selection)
value = "option-id-123"

# Labels (multi-selection)
value = ["option-id-1", "option-id-2"]

# Email
value = "john@example.com"

# Phone
value = "+1-555-0123"

# URL
value = "https://example.com"

# Checkbox
value = True  # or False

# Users
value = [12345, 67890]  # User IDs

# Tasks
value = ["task-id-1", "task-id-2"]

# Rating
value = 4  # 0-5 stars

# Money (in cents)
value = 4999  # $49.99

# Manual Progress
value = 75  # 75%
```

---

## Success Response

```json
{
  "task_id": "task-123",
  "field_id": "abc123-def456",
  "value": "High",
  "message": "Custom field abc123-def456 set successfully"
}
```

---

## Integration Examples

### Python Example
```python
# Set text field
result = await mcp_server.call_tool(
    "clickup_custom_field_set_value",
    {
        "task_id": "task-123",
        "field_id": "abc123-def456",
        "value": "Engineering",
        "field_type": "text"
    }
)

print(f"✅ {result['message']}")

# Set dropdown field
result = await mcp_server.call_tool(
    "clickup_custom_field_set_value",
    {
        "task_id": "task-123",
        "field_id": "priority-field-id",
        "value": "high-priority-option-id",
        "field_type": "dropdown"
    }
)

# Set date field
from datetime import datetime, timezone
due_date = int(datetime.now(timezone.utc).timestamp() * 1000)

result = await mcp_server.call_tool(
    "clickup_custom_field_set_value",
    {
        "task_id": "task-123",
        "field_id": "deadline-field-id",
        "value": due_date,
        "field_type": "date"
    }
)
```

---

## Common Pitfalls

1. **WRONG VALUE FORMAT**: Using label instead of option ID for dropdowns
2. **DATE TIMESTAMPS**: Forgetting to convert to milliseconds
3. **MONEY FORMAT**: Using dollars instead of cents
4. **MISSING FIELD TYPE**: Not providing field_type for validation
5. **INVALID OPTION IDS**: Using outdated or incorrect option IDs

---

## Best Practices

1. **GET DEFINITIONS FIRST**: Use `clickup_custom_field_get_definitions` to get field IDs and options
2. **VALIDATE FORMAT**: Check field type before setting value
3. **USE OPTION IDS**: For dropdowns, always use option ID, not label
4. **TIMESTAMPS**: Convert dates to Unix timestamp in milliseconds
5. **ERROR HANDLING**: Handle invalid values gracefully

---

## Related Tools

- **clickup_custom_field_get_definitions**: Get field IDs and options
- **clickup_custom_field_remove_value**: Clear custom field value
- **clickup_custom_field_set_by_name**: Set field by name instead of ID

---

**Last Updated**: 2025-10-30
