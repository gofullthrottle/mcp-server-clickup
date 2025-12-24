# clickup_space_archive

## Overview

Archives or unarchives a space. **Reversible** alternative to deleting spaces.

**Category**: Space Management - CRUD Operations

**Rate Limit Impact**: ~2-3% of available requests (100 req/min on Free Forever plan)

---

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `space_id` | string | **Yes** | ID of the space to archive/unarchive |
| `archive` | boolean | No | `true` to archive, `false` to unarchive (default: true) |

---

## Success Response

```json
{
  "id": "90123456",
  "name": "Engineering",
  "archived": true,
  "message": "Space \"Engineering\" archived successfully"
}
```

---

## Integration Examples

### Python Example
```python
# Archive space
result = await mcp_server.call_tool(
    "clickup_space_archive",
    {
        "space_id": "90123456",
        "archive": True
    }
)

print(f"✅ {result['message']}")

# Unarchive space
result = await mcp_server.call_tool(
    "clickup_space_archive",
    {
        "space_id": "90123456",
        "archive": False
    }
)

print(f"✅ {result['message']}")
```

---

## Best Practices

1. **PREFER OVER DELETE**: Always archive first before considering deletion
2. **REVERSIBLE**: Can be undone, unlike deletion
3. **PRESERVES DATA**: All contents remain intact
4. **LIST ARCHIVED**: Use `clickup_space_list` with `archived: true` to see archived spaces

---

## Related Tools

- **clickup_space_delete**: Permanent deletion (irreversible)
- **clickup_space_list**: List archived spaces

---

**Last Updated**: 2025-10-30
