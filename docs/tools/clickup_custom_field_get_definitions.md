# clickup_custom_field_get_definitions

## Overview

Retrieves custom field definitions for a space, folder, or list including field types, options, and configuration.

**Category**: Custom Fields - Query Operations

**Rate Limit Impact**: ~2-3% of available requests (100 req/min on Free Forever plan)

---

## Use Cases

1. **Field Discovery**: Find available custom fields for task creation
2. **Validation**: Get field types and options for proper value formatting
3. **Dropdown Options**: Retrieve available choices for dropdown/label fields
4. **Field Inheritance**: Understand custom fields at space/folder/list levels

---

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `space_id` | string | One required | Space ID to get custom fields for |
| `folder_id` | string | One required | Folder ID to get custom fields for |
| `list_id` | string | One required | List ID to get custom fields for |

**Note**: At least **one** of the IDs must be provided.

---

## Success Response

```json
{
  "fields": [
    {
      "id": "abc123-def456",
      "name": "Priority Level",
      "type": "dropdown",
      "required": false,
      "options": [
        {"id": "opt1", "label": "High", "color": "#FF0000"},
        {"id": "opt2", "label": "Medium", "color": "#FFA500"},
        {"id": "opt3", "label": "Low", "color": "#00FF00"}
      ]
    },
    {
      "id": "xyz789-abc123",
      "name": "Estimated Hours",
      "type": "number",
      "required": true
    }
  ],
  "count": 2,
  "by_location": {
    "space": 1,
    "folder": 0,
    "list": 1
  }
}
```

---

## Integration Examples

### Python Example
```python
# Get custom fields for a list
result = await mcp_server.call_tool(
    "clickup_custom_field_get_definitions",
    {"list_id": "901234567"}
)

print(f"Found {result['count']} custom field(s)")

for field in result['fields']:
    print(f"\nField: {field['name']}")
    print(f"  Type: {field['type']}")
    print(f"  Required: {field['required']}")

    if field.get('options'):
        print(f"  Options: {', '.join([opt['label'] for opt in field['options']])}")
```

### TypeScript Example
```typescript
// Get custom fields with dropdown options
const result = await mcpServer.callTool(
  "clickup_custom_field_get_definitions",
  { list_id: "901234567" }
);

// Find a specific field by name
function findField(fields: any[], fieldName: string) {
  return fields.find(f => f.name.toLowerCase() === fieldName.toLowerCase());
}

const priorityField = findField(result.fields, "Priority Level");
if (priorityField && priorityField.options) {
  console.log("Priority options:");
  priorityField.options.forEach(opt => {
    console.log(`  - ${opt.label} (${opt.color})`);
  });
}
```

---

## Custom Field Types

| Type | Description | Value Format |
|------|-------------|--------------|
| `text` | Single-line text | String |
| `number` | Numeric value | Number |
| `date` | Date only | Unix timestamp (milliseconds) |
| `date_time` | Date and time | Unix timestamp (milliseconds) |
| `dropdown` | Single selection | Option ID |
| `labels` | Multi-selection | Array of option IDs |
| `email` | Email address | String (validated email) |
| `phone` | Phone number | String |
| `url` | Website URL | String (validated URL) |
| `checkbox` | Boolean | Boolean (true/false) |
| `users` | User selection | Array of user IDs |
| `tasks` | Task references | Array of task IDs |
| `location` | Geographic location | Location object |
| `rating` | Star rating | Number (0-5) |
| `money` | Currency value | Number (cents) |
| `manual_progress` | Progress percentage | Number (0-100) |

---

## Best Practices

1. **CACHE DEFINITIONS**: Custom fields change rarely - cache results
2. **VALIDATE VALUES**: Check field type before setting values
3. **HANDLE REQUIRED**: Validate required fields before task creation
4. **DROPDOWN OPTIONS**: Always use option IDs, not labels
5. **FIELD INHERITANCE**: Check space, folder, and list levels

---

## Related Tools

- **clickup_custom_field_set_value**: Set custom field value on task
- **clickup_custom_field_find_by_name**: Find field by name
- **clickup_custom_field_get_values**: Get field values from task

---

**Last Updated**: 2025-10-30
