# list_document_pages

## Overview

Lists all pages in a document with optional depth control for nested page structures.

**Category**: Document Management - Page Operations

**Rate Limit Impact**: ~1-2% of available requests (100 req/min on Free Forever plan)

---

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `documentId` | string | **Yes** | ID of the document |
| `max_page_depth` | number | No | Maximum depth of pages to retrieve (-1 for unlimited) |

---

## Success Response

```json
{
  "pages": [
    {
      "id": "page-123",
      "name": "Introduction",
      "order": 0,
      "parent_page_id": null
    },
    {
      "id": "page-456",
      "name": "Overview",
      "order": 0,
      "parent_page_id": "page-123"
    }
  ]
}
```

---

## Integration Examples

### Python Example
```python
# List all pages (unlimited depth)
result = await mcp_server.call_tool(
    "list_document_pages",
    {
        "documentId": "abc123-def456",
        "max_page_depth": -1
    }
)

print(f"Found {len(result['pages'])} page(s)")

# Build page hierarchy
for page in result['pages']:
    indent = "  " if page['parent_page_id'] else ""
    print(f"{indent}- {page['name']}")
```

---

## Related Tools

- **get_document_pages**: Get page content
- **create_document_page**: Create new page
- **update_document_page**: Update page content

---

**Last Updated**: 2025-10-30
