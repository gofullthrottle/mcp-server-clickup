# clickup_custom_field_get_values

## Overview

Retrieves all custom field values for a task.

**Category**: Custom Fields - Value Operations

**Rate Limit Impact**: ~1-2% of available requests (100 req/min on Free Forever plan)

---

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `task_id` | string | **Yes** | Task ID to get custom field values for |
| `use_custom_task_ids` | boolean | No | Whether to use custom task IDs |

---

## Success Response

```json
{
  "task_id": "task-123",
  "custom_fields": {
    "Priority Level": "High",
    "Estimated Hours": 8,
    "Due Date": "2024-03-15T10:00:00Z",
    "Assigned Team": ["Engineering", "QA"]
  },
  "field_count": 4
}
```

---

## Integration Examples

### Python Example
```python
# Get all custom field values
result = await mcp_server.call_tool(
    "clickup_custom_field_get_values",
    {"task_id": "task-123"}
)

print(f"Found {result['field_count']} custom field(s)")

for field_name, field_value in result['custom_fields'].items():
    print(f"{field_name}: {field_value}")
```

### TypeScript Example
```typescript
// Get custom fields and check specific field
const result = await mcpServer.callTool(
  "clickup_custom_field_get_values",
  { task_id: "task-123" }
);

if (result.custom_fields["Priority Level"] === "High") {
  console.log("⚠️ High priority task!");
}
```

---

## Use Cases

1. **Task Inspection**: View all custom data on a task
2. **Conditional Logic**: Make decisions based on custom field values
3. **Reporting**: Extract custom field data for reports
4. **Validation**: Verify required custom fields are set

---

## Related Tools

- **clickup_custom_field_set_value**: Set custom field value
- **clickup_custom_field_remove_value**: Clear custom field value
- **clickup_custom_field_get_definitions**: Get field definitions

---

**Last Updated**: 2025-10-30
