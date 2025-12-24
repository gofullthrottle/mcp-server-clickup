# clickup_project_get_templates

## Overview

Retrieves available project templates with their descriptions and structure details.

**Category**: Project Management - Template Operations

**Rate Limit Impact**: ~1% of available requests (no external API call - returns cached templates)

---

## Input Parameters

This tool takes **no parameters**.

---

## Success Response

```json
{
  "templates": [
    {
      "name": "default",
      "description": "Standard software development project structure",
      "structure": {
        "Planning": ["Requirements", "Design", "Research"],
        "Development": ["Frontend", "Backend", "Database"],
        "Testing": ["Unit Tests", "Integration Tests", "QA Testing"],
        "Deployment": ["Staging", "Production"]
      }
    },
    {
      "name": "agile",
      "description": "Agile/Scrum project structure with sprint-based organization",
      "structure": {
        "Product Backlog": [],
        "Sprint Planning": [],
        "Current Sprint": [],
        "In Review": [],
        "Done": []
      }
    },
    {
      "name": "kanban",
      "description": "Kanban board structure for continuous flow",
      "structure": {
        "Backlog": [],
        "To Do": [],
        "In Progress": [],
        "Review": [],
        "Completed": []
      }
    }
  ],
  "count": 3
}
```

---

## Integration Examples

### Python Example
```python
# Get available templates
result = await mcp_server.call_tool(
    "clickup_project_get_templates",
    {}
)

print(f"Available templates: {result['count']}")

for template in result['templates']:
    print(f"\n{template['name'].upper()}")
    print(f"Description: {template['description']}")
    print(f"Structure:")

    for folder, lists in template['structure'].items():
        print(f"  📁 {folder}")
        for list_name in lists:
            print(f"    📋 {list_name}")
```

### TypeScript Example
```typescript
// List templates for user selection
const result = await mcpServer.callTool(
  "clickup_project_get_templates",
  {}
);

console.log("Available Templates:");
result.templates.forEach((template, index) => {
  console.log(`${index + 1}. ${template.name}`);
  console.log(`   ${template.description}`);
});

// User selects template
const selectedTemplate = result.templates[0].name;
```

---

## Template Comparison

| Template | Best For | Structure | Complexity |
|----------|----------|-----------|------------|
| **default** | Traditional projects | Waterfall-style phases | High (12 lists) |
| **agile** | Sprint-based work | Scrum/Agile methodology | Low (5 lists) |
| **kanban** | Continuous flow | Kanban boards | Low (5 lists) |

---

## Use Cases

1. **Template Selection**: Help users choose appropriate template
2. **Documentation**: Show available project structures
3. **Integration**: List templates in UI dropdown
4. **Customization**: Base custom templates on existing ones

---

## Best Practices

1. **PREVIEW STRUCTURE**: Review template structure before applying
2. **MATCH METHODOLOGY**: Choose template matching team workflow
3. **START SIMPLE**: Begin with agile/kanban, expand as needed
4. **CUSTOMIZE**: Templates are starting points, not rigid structures

---

## Related Tools

- **clickup_project_initialize**: Initialize project with template
- **clickup_project_apply_template**: Apply template to existing space

---

**Last Updated**: 2025-10-30
