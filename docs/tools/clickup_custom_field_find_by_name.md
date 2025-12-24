# clickup_custom_field_find_by_name

## Overview

Finds a custom field definition by name in a list.

**Category**: Custom Fields - Query Operations

**Rate Limit Impact**: ~2-3% of available requests (100 req/min on Free Forever plan)

---

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `list_id` | string | **Yes** | List ID to search in |
| `field_name` | string | **Yes** | Name of the custom field to find |

---

## Success Response

```json
{
  "found": true,
  "field": {
    "id": "abc123-def456",
    "name": "Priority Level",
    "type": "dropdown",
    "required": false,
    "options": [
      {"id": "opt1", "label": "High"},
      {"id": "opt2", "label": "Medium"}
    ]
  }
}
```

### Not Found Response
```json
{
  "found": false,
  "message": "Custom field \"Priority\" not found in list 901234567"
}
```

---

## Integration Examples

### Python Example
```python
# Find custom field by name
result = await mcp_server.call_tool(
    "clickup_custom_field_find_by_name",
    {
        "list_id": "901234567",
        "field_name": "Priority Level"
    }
)

if result['found']:
    field = result['field']
    print(f"✅ Found field: {field['name']}")
    print(f"   ID: {field['id']}")
    print(f"   Type: {field['type']}")
else:
    print(f"❌ {result['message']}")
```

---

## Use Cases

1. **Name-Based Lookup**: Find field ID when you only know the name
2. **Validation**: Check if a field exists before setting value
3. **Dynamic Field Access**: Reference fields by name in scripts

---

## Best Practices

1. **CASE-INSENSITIVE**: Name matching is case-insensitive
2. **CACHE RESULTS**: Cache field ID for repeated operations
3. **HANDLE NOT FOUND**: Always check `found` field before using result
4. **USE ID AFTER LOOKUP**: After finding field, use ID for subsequent operations

---

## Related Tools

- **clickup_custom_field_get_definitions**: Get all custom field definitions
- **clickup_custom_field_set_by_name**: Set field value by name (convenience)

---

**Last Updated**: 2025-10-30
