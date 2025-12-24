# update_document_page

## Overview

Updates an existing page in a ClickUp document with support for replace, append, or prepend modes.

**Category**: Document Management - Page Operations

**Rate Limit Impact**: ~2-3% of available requests (100 req/min on Free Forever plan)

---

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `documentId` | string | **Yes** | ID of the document |
| `pageId` | string | **Yes** | ID of the page to update |
| `name` | string | No | New name for the page |
| `sub_title` | string | No | New subtitle |
| `content` | string | No | New content |
| `content_edit_mode` | string (enum) | No | `"replace"`, `"append"`, or `"prepend"` (default: replace) |
| `content_format` | string (enum) | No | `"text/md"` (default) or `"text/plain"` |

---

## Success Response

```json
{
  "message": "Page updated successfully"
}
```

---

## Integration Examples

### Python Example
```python
# Replace page content
result = await mcp_server.call_tool(
    "update_document_page",
    {
        "documentId": "abc123-def456",
        "pageId": "page-123",
        "content": "# Updated Content\n\nThis replaces all existing content.",
        "content_edit_mode": "replace"
    }
)

print(f"✅ {result['message']}")

# Append to existing content
result = await mcp_server.call_tool(
    "update_document_page",
    {
        "documentId": "abc123-def456",
        "pageId": "page-123",
        "content": "\n\n## Additional Section\n\nThis is appended.",
        "content_edit_mode": "append"
    }
)

# Prepend to existing content
result = await mcp_server.call_tool(
    "update_document_page",
    {
        "documentId": "abc123-def456",
        "pageId": "page-123",
        "content": "> Important note at the top\n\n",
        "content_edit_mode": "prepend"
    }
)
```

### TypeScript Example (Update Metadata Only)
```typescript
// Update page name and subtitle without changing content
const result = await mcpServer.callTool(
  "update_document_page",
  {
    documentId: "abc123-def456",
    pageId: "page-123",
    name: "Introduction (Updated)",
    sub_title: "A comprehensive guide"
  }
);

console.log(`✅ ${result.message}`);
```

---

## Best Practices

1. **USE APPEND/PREPEND**: Preserve existing content when adding new sections
2. **MARKDOWN FORMAT**: Default to `text/md` for rich formatting
3. **ATOMIC UPDATES**: Update name/subtitle separately from content
4. **VERSION CONTROL**: Consider backing up content before replacing

---

## Related Tools

- **get_document_pages**: Get current page content
- **create_document_page**: Create new page

---

**Last Updated**: 2025-10-30
