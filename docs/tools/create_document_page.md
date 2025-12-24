# create_document_page

## Overview

Creates a new page in a ClickUp document with optional sub-page support.

**Category**: Document Management - Page Operations

**Rate Limit Impact**: ~2-3% of available requests (100 req/min on Free Forever plan)

---

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `documentId` | string | **Yes** | ID of the document |
| `name` | string | **Yes** | Name/title of the page |
| `content` | string | No | Markdown or plain text content |
| `sub_title` | string | No | Subtitle of the page |
| `parent_page_id` | string | No | ID of parent page (for sub-pages) |

---

## Success Response

```json
{
  "id": "page-123",
  "name": "Getting Started",
  "sub_title": "Quick start guide",
  "parent_page_id": null,
  "order": 0
}
```

---

## Integration Examples

### Python Example
```python
# Create top-level page
result = await mcp_server.call_tool(
    "create_document_page",
    {
        "documentId": "abc123-def456",
        "name": "Introduction",
        "content": "# Welcome\n\nThis is the introduction page."
    }
)

print(f"✅ Created page: {result['name']}")
parent_page_id = result['id']

# Create sub-page
sub_page = await mcp_server.call_tool(
    "create_document_page",
    {
        "documentId": "abc123-def456",
        "name": "Overview",
        "parent_page_id": parent_page_id,
        "content": "This is a sub-page under Introduction."
    }
)

print(f"✅ Created sub-page: {sub_page['name']}")
```

---

## Best Practices

1. **STRUCTURE FIRST**: Plan page hierarchy before creating
2. **MARKDOWN CONTENT**: Use markdown for rich formatting
3. **SUB-PAGES**: Use `parent_page_id` for nested structure
4. **ORDER**: Pages created sequentially have incrementing order

---

## Related Tools

- **list_document_pages**: List all pages
- **update_document_page**: Update page content

---

**Last Updated**: 2025-10-30
