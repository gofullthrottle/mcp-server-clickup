# list_documents

## Overview

Lists all documents in a ClickUp space, folder, or list with filtering and pagination support.

**Category**: Document Management - Query Operations

**Rate Limit Impact**: ~1-2% of available requests (100 req/min on Free Forever plan)

---

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | No | Filter by specific document ID |
| `creator` | number | No | Filter by creator ID |
| `deleted` | boolean | No | Include deleted documents |
| `archived` | boolean | No | Include archived documents |
| `parent_id` | string | No | ID of parent container |
| `parent_type` | string (enum) | No | Type: TASK, SPACE, FOLDER, LIST, EVERYTHING, WORKSPACE |
| `limit` | number | No | Maximum results to return |
| `next_cursor` | string | No | Pagination cursor |

---

## Success Response

```json
{
  "documents": [
    {
      "id": "abc123",
      "name": "Engineering Handbook",
      "url": "https://app.clickup.com/1234567/v/d/abc123",
      "parent": { "id": "901234567", "type": 6 },
      "created": "2024-01-15T10:30:00Z",
      "updated": "2024-01-20T14:45:00Z",
      "creator": { "id": 12345 },
      "public": true,
      "type": "doc"
    }
  ],
  "count": 5,
  "next_cursor": "eyJwYWdlIjoyfQ==",
  "message": "Found 5 document(s)"
}
```

---

## Integration Examples

### Python Example
```python
# List all documents in a list
result = await mcp_server.call_tool(
    "list_documents",
    {
        "parent_id": "901234567",
        "parent_type": "LIST",
        "limit": 10
    }
)

print(f"Found {result['count']} document(s)")

for doc in result['documents']:
    print(f"- {doc['name']} (Created: {doc['created']})")

# Pagination
if result.get('next_cursor'):
    next_page = await mcp_server.call_tool(
        "list_documents",
        {
            "parent_id": "901234567",
            "parent_type": "LIST",
            "limit": 10,
            "next_cursor": result['next_cursor']
        }
    )
```

---

## Related Tools

- **get_document**: Get document details
- **create_document**: Create new document

---

**Last Updated**: 2025-10-30
