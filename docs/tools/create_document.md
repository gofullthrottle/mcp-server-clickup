# create_document

## Overview

Creates a document in a ClickUp space, folder, or list. Documents are rich text collaboration tools separate from tasks.

**Category**: Document Management - CRUD Operations

**Rate Limit Impact**: ~2-3% of available requests (100 req/min on Free Forever plan)

---

## Use Cases

1. **Project Documentation**: Create project specs, requirements, and technical docs
2. **Team Wikis**: Build knowledge bases and process documentation
3. **Meeting Notes**: Collaborative meeting notes linked to lists
4. **SOPs**: Standard operating procedures for teams

---

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | **Yes** | Name and title of the document |
| `parent` | object | **Yes** | Parent container object |
| `parent.id` | string | **Yes** | ID of parent (space/folder/list) |
| `parent.type` | number | **Yes** | Type: 4=space, 5=folder, 6=list, 7=everything, 12=workspace |
| `visibility` | string (enum) | **Yes** | `"PUBLIC"` or `"PRIVATE"` |
| `create_page` | boolean | **Yes** | Whether to create an initial blank page |

### Parent Types
- `4` = Space
- `5` = Folder
- `6` = List (most common)
- `7` = Everything
- `12` = Workspace

---

## Success Response

```json
{
  "id": "abc123-def456-ghi789",
  "name": "Engineering Handbook",
  "parent": {
    "id": "901234567",
    "type": 6
  },
  "url": "https://app.clickup.com/1234567/v/d/abc123-def456-ghi789",
  "message": "Document \"Engineering Handbook\" created successfully"
}
```

---

## Integration Examples

### Python Example
```python
# Create document in a list
result = await mcp_server.call_tool(
    "create_document",
    {
        "name": "Project Specification",
        "parent": {
            "id": "901234567",
            "type": 6  # List
        },
        "visibility": "PUBLIC",
        "create_page": True
    }
)

print(f"✅ {result['message']}")
print(f"Document URL: {result['url']}")
```

### TypeScript Example
```typescript
// Create document in space
const result = await mcpServer.callTool(
  "create_document",
  {
    name: "Team Handbook",
    parent: {
      id: "90123456",
      type: 4  // Space
    },
    visibility: "PUBLIC",
    create_page: true
  }
);

console.log(`✅ ${result.message}`);
```

---

## Best Practices

1. **USE LIST PARENT**: Most documents belong in lists (type 6)
2. **PUBLIC BY DEFAULT**: Use PUBLIC visibility for team collaboration
3. **INITIAL PAGE**: Set `create_page: true` to avoid empty documents
4. **VERIFY PARENT**: Check parent ID exists before creating

---

## Related Tools

- **get_document**: Retrieve document details
- **create_document_page**: Add pages to document
- **list_documents**: List documents in container

---

**Last Updated**: 2025-10-30
