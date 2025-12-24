# clickup_custom_field_set_by_name

## Overview

Sets a custom field value by field name instead of ID. Convenience method that combines field lookup and value setting.

**Category**: Custom Fields - Value Operations

**Rate Limit Impact**: ~4-6% of available requests (100 req/min on Free Forever plan) - performs lookup + set

---

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `task_id` | string | **Yes** | Task ID to set custom field on |
| `list_id` | string | **Yes** | List ID containing the custom field |
| `field_name` | string | **Yes** | Name of the custom field |
| `value` | any | **Yes** | Value to set |
| `use_custom_task_ids` | boolean | No | Whether to use custom task IDs |

---

## Success Response

```json
{
  "task_id": "task-123",
  "field": {
    "id": "abc123-def456",
    "name": "Priority Level",
    "type": "dropdown"
  },
  "value": "High",
  "message": "Custom field \"Priority Level\" set successfully"
}
```

---

## Integration Examples

### Python Example
```python
# Set custom field by name (convenience method)
result = await mcp_server.call_tool(
    "clickup_custom_field_set_by_name",
    {
        "task_id": "task-123",
        "list_id": "901234567",
        "field_name": "Priority Level",
        "value": "High"
    }
)

print(f"✅ {result['message']}")
```

### TypeScript Example
```typescript
// Batch set multiple fields by name
const fieldsToSet = {
  "Priority Level": "High",
  "Estimated Hours": 8,
  "Assigned Team": "Engineering"
};

for (const [fieldName, value] of Object.entries(fieldsToSet)) {
  await mcpServer.callTool(
    "clickup_custom_field_set_by_name",
    {
      task_id: "task-123",
      list_id: "901234567",
      field_name: fieldName,
      value: value
    }
  );
  console.log(`✅ Set ${fieldName}`);
}
```

---

## Notes

- **TWO API CALLS**: This tool makes 2 API calls (find field + set value)
- **RATE LIMIT**: Uses ~4-6% of rate limit (double of direct set)
- **CONVENIENCE**: Easier for one-off operations
- **PERFORMANCE**: For repeated operations, use `clickup_custom_field_find_by_name` once + cache ID

---

## Best Practices

1. **ONE-OFF OPERATIONS**: Use this for single/rare field sets
2. **CACHE FOR BULK**: For repeated operations, cache field ID and use `clickup_custom_field_set_value`
3. **ERROR HANDLING**: Handle field not found errors
4. **VALIDATE VALUE**: Ensure value format matches field type

---

## Related Tools

- **clickup_custom_field_set_value**: Set value by field ID (faster)
- **clickup_custom_field_find_by_name**: Find field ID (for caching)

---

**Last Updated**: 2025-10-30
