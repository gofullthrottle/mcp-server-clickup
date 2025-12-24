# get_document

## Overview

Retrieves details of a ClickUp document including metadata, parent container, and creator information.

**Category**: Document Management - CRUD Operations

**Rate Limit Impact**: ~1-2% of available requests (100 req/min on Free Forever plan)

---

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `documentId` | string | **Yes** | ID of the document to retrieve |

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
  "created": "2024-01-15T10:30:00Z",
  "updated": "2024-01-20T14:45:00Z",
  "creator": {
    "id": 12345,
    "username": "john.doe",
    "email": "john@example.com"
  },
  "public": true,
  "type": "doc",
  "url": "https://app.clickup.com/1234567/v/d/abc123-def456-ghi789"
}
```

---

## Integration Examples

### Python Example
```python
# Get document details
result = await mcp_server.call_tool(
    "get_document",
    {"documentId": "abc123-def456-ghi789"}
)

print(f"Document: {result['name']}")
print(f"Created: {result['created']}")
print(f"Last Updated: {result['updated']}")
print(f"Public: {result['public']}")
```

---

## Related Tools

- **create_document**: Create new document
- **list_documents**: List documents in container
- **list_document_pages**: List pages in document

---

**Last Updated**: 2025-10-30
