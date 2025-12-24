# get_document_pages

## Overview

Gets the content of specific pages from a document in text/markdown or HTML format.

**Category**: Document Management - Page Operations

**Rate Limit Impact**: ~2-3% of available requests (100 req/min on Free Forever plan)

---

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `documentId` | string | **Yes** | ID of the document |
| `pageIds` | array | **Yes** | Array of page IDs to retrieve |
| `content_format` | string (enum) | No | `"text/md"` (default) or `"text/html"` |

---

## Success Response

```json
{
  "pages": [
    {
      "id": "page-123",
      "name": "Introduction",
      "content": "# Welcome\n\nThis is the introduction...",
      "format": "text/md"
    }
  ]
}
```

---

## Integration Examples

### Python Example
```python
# Get page content as markdown
result = await mcp_server.call_tool(
    "get_document_pages",
    {
        "documentId": "abc123-def456",
        "pageIds": ["page-123", "page-456"],
        "content_format": "text/md"
    }
)

for page in result['pages']:
    print(f"\n## {page['name']}\n")
    print(page['content'])
```

### TypeScript Example
```typescript
// Get pages as HTML
const result = await mcpServer.callTool(
  "get_document_pages",
  {
    documentId: "abc123-def456",
    pageIds: ["page-123"],
    content_format: "text/html"
  }
);

// Render HTML
document.getElementById('content').innerHTML = result.pages[0].content;
```

---

## Related Tools

- **list_document_pages**: Get page IDs
- **update_document_page**: Update page content

---

**Last Updated**: 2025-10-30
