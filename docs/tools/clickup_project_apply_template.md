# clickup_project_apply_template

## Overview

Applies a project template to an existing space, creating the folder and list structure.

**Category**: Project Management - Template Operations

**Rate Limit Impact**: ~10-15% of available requests (creates multiple folders/lists)

---

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `space_id` | string | **Yes** | Space ID to apply template to |
| `template` | string (enum) | **Yes** | Template: `"default"`, `"agile"`, or `"kanban"` |

---

## Success Response

```json
{
  "folders": [
    {
      "id": "801234567",
      "name": "Planning",
      "lists": [
        {"id": "901234567", "name": "Requirements"},
        {"id": "901234568", "name": "Design"}
      ]
    }
  ],
  "message": "Template \"default\" applied successfully",
  "total_folders": 4,
  "total_lists": 12
}
```

---

## Integration Examples

### Python Example
```python
# Apply template to existing space
result = await mcp_server.call_tool(
    "clickup_project_apply_template",
    {
        "space_id": "90123456",
        "template": "agile"
    }
)

print(f"✅ {result['message']}")
print(f"Created {result['total_folders']} folders")
print(f"Created {result['total_lists']} lists")

# List created structure
for folder in result['folders']:
    print(f"\nFolder: {folder['name']}")
    for list_item in folder['lists']:
        print(f"  - {list_item['name']}")
```

---

## Use Cases

1. **Retrofit Projects**: Add structure to existing spaces
2. **Template Migration**: Change project methodology
3. **Standardization**: Apply consistent structure across spaces

---

## Best Practices

1. **EMPTY SPACE**: Best applied to newly created spaces
2. **BACKUP FIRST**: Export existing structure before applying template
3. **NO OVERWRITE**: Template adds to existing structure (doesn't replace)
4. **CUSTOMIZE AFTER**: Modify template structure as needed

---

## Related Tools

- **clickup_project_initialize**: Create space + apply template in one operation
- **clickup_project_get_templates**: List available templates

---

**Last Updated**: 2025-10-30
