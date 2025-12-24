# Tool Documentation Template

## Purpose

This template defines the standard documentation format for all 72 MCP tools. Each tool should follow this structure to ensure consistency and completeness.

## Template Structure

### Tool Name: `clickup_[category]_[action]`

**Category**: [Task | List | Workspace | Space | Folder | Time | Custom Fields | Goal | User | Team | Comment | View]

**Description**: [1-2 sentences describing what the tool does and when to use it]

**Use Cases**:
- [Specific scenario 1]
- [Specific scenario 2]
- [Specific scenario 3]

---

### Input Parameters

```json
{
  "parameter_name": {
    "type": "string | number | boolean | array | object",
    "required": true | false,
    "description": "Clear description of what this parameter does",
    "example": "example_value"
  }
}
```

**Parameter Details**:
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| parameter1 | string | Yes | Description | `"value"` |
| parameter2 | number | No | Description | `123` |

---

### Returns

**Success Response** (when `ENABLE_DEBUG=false`):
```json
{
  "success": true,
  "data": {
    "id": "abc123",
    "name": "Example",
    "status": "active"
  },
  "metadata": {
    "timestamp": "2025-01-18T10:30:00.000Z",
    "tool_name": "clickup_example_action",
    "execution_time_ms": 245,
    "rate_limit": {
      "remaining": 98,
      "limit": 100,
      "reset_at": 1705575000000
    }
  }
}
```

**Success Response** (when `ENABLE_DEBUG=true`):
```json
{
  "success": true,
  "data": { ... },
  "metadata": {
    "timestamp": "2025-01-18T10:30:00.000Z",
    "tool_name": "clickup_example_action",
    "execution_time_ms": 245,
    "rate_limit": {
      "remaining": 98,
      "limit": 100,
      "reset_at": 1705575000000
    },
    "retry": {
      "attempted": 1,
      "total_delay_ms": 100,
      "last_error": "Rate limit exceeded"
    },
    "debug": {
      "request_id": "a7b3c9d2",
      "tool_name": "clickup_example_action",
      "timing": {
        "total_ms": 245,
        "api_calls": [
          {
            "method": "GET",
            "path": "/team/{id}/resource/{id}",
            "duration": 180,
            "status": 200
          }
        ]
      },
      "api_summary": {
        "total_calls": 1,
        "total_api_time_ms": 245,
        "success_count": 1,
        "error_count": 0
      }
    }
  }
}
```

**Response Fields**:
| Field | Type | Description |
|-------|------|-------------|
| success | boolean | Always `true` for successful responses |
| data | object | The actual response data (structure varies by tool) |
| metadata.timestamp | string | ISO 8601 timestamp of operation completion |
| metadata.tool_name | string | Name of the tool that generated the response |
| metadata.execution_time_ms | number | Total execution time in milliseconds |
| metadata.rate_limit | object | Current rate limit status (if available) |
| metadata.retry | object | Retry information (only if retries occurred) |
| metadata.debug | object | Debug information (only when ENABLE_DEBUG=true) |

---

### Error Types

This tool may return the following errors:

**1. RATE_LIMIT**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit of 100 requests per minute exceeded",
    "type": "RATE_LIMIT",
    "retry_after": 30,
    "suggested_action": "Wait 30 seconds before retrying. Consider implementing exponential backoff."
  }
}
```

**2. NOT_FOUND**
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Task abc123 not found",
    "type": "NOT_FOUND",
    "suggested_action": "Verify the ID is correct and the resource exists in your workspace."
  }
}
```

**3. AUTH**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid API key or insufficient permissions",
    "type": "AUTH",
    "suggested_action": "Check your CLICKUP_API_KEY environment variable and ensure the API key has the required permissions."
  }
}
```

**4. VALIDATION**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "Parameter 'status' must be one of: open, closed, archived",
    "type": "VALIDATION",
    "details": {
      "parameter": "status",
      "value": "invalid_value",
      "allowed_values": ["open", "closed", "archived"]
    },
    "suggested_action": "Update the parameter to use a valid value."
  }
}
```

**5. API_ERROR**
```json
{
  "success": false,
  "error": {
    "code": "SERVER_ERROR",
    "message": "ClickUp API returned 500: Internal Server Error",
    "type": "API_ERROR",
    "suggested_action": "This is a temporary ClickUp API issue. Retry the request after a short delay."
  }
}
```

**Error Type Summary**:
| Error Type | HTTP Status | Retryable | Description |
|------------|-------------|-----------|-------------|
| RATE_LIMIT | 429 | Yes | Rate limit exceeded - wait and retry |
| NOT_FOUND | 404 | No | Resource does not exist |
| AUTH | 401, 403 | No | Authentication or authorization failed |
| VALIDATION | 400 | No | Invalid input parameters |
| API_ERROR | 500, 502, 503 | Yes | Server error - retry with backoff |

---

### Rate Limits

**ClickUp API Rate Limit**: 100 requests/minute (Free Forever plan)

**This Tool's Impact**:
- **API Calls**: [Number] call(s) per execution
- **Estimated Impact**: ~[Percentage]% of rate limit per execution

**Rate Limit Behavior**:
1. Automatic retry with exponential backoff (100ms → 200ms → 400ms → 800ms)
2. Rate limit info included in response metadata
3. Requests queued when rate limit hit
4. Automatic throttling to prevent hitting rate limit

**Recommendations**:
- For bulk operations, use batch tools (e.g., `clickup_task_create_bulk`)
- Monitor `rate_limit.remaining` in response metadata
- Implement client-side throttling for high-frequency usage

---

### API Dependencies

**ClickUp API Endpoints Called**:
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/team/{team_id}/resource/{resource_id}` | Fetch resource details |
| POST | `/team/{team_id}/resource` | Create new resource |

**Required Permissions**:
- [Permission 1]: [Description of what this permission enables]
- [Permission 2]: [Description of what this permission enables]

**API Documentation**:
- [ClickUp API Reference](https://clickup.com/api/clickupreference/operation/GetResource)

---

### Examples

#### Example 1: Basic Usage
```javascript
// Input
{
  "parameter1": "value1",
  "parameter2": 123
}

// Output
{
  "success": true,
  "data": {
    "id": "abc123",
    "name": "Example",
    "status": "active"
  },
  "metadata": {
    "tool_name": "clickup_example_action",
    "execution_time_ms": 180,
    "rate_limit": {
      "remaining": 98,
      "limit": 100,
      "reset_at": 1705575000000
    }
  }
}
```

#### Example 2: With Optional Parameters
```javascript
// Input
{
  "parameter1": "value1",
  "parameter2": 123,
  "optional_parameter": true
}

// Output
{
  "success": true,
  "data": {
    "id": "abc123",
    "name": "Example",
    "status": "active",
    "additional_field": "value"
  }
}
```

#### Example 3: Error Handling
```javascript
// Input (invalid parameter)
{
  "parameter1": "invalid_value"
}

// Output
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "Parameter 'parameter1' must be a valid ID",
    "type": "VALIDATION"
  }
}
```

---

### Integration Examples

#### Python
```python
from mcp import Client

client = Client()

# Call the tool
response = client.call_tool(
    "clickup_example_action",
    {
        "parameter1": "value1",
        "parameter2": 123
    }
)

if response["success"]:
    data = response["data"]
    print(f"Success: {data['name']}")

    # Check rate limit
    rate_limit = response["metadata"]["rate_limit"]
    print(f"Rate limit remaining: {rate_limit['remaining']}/{rate_limit['limit']}")
else:
    error = response["error"]
    print(f"Error: {error['message']}")
    print(f"Suggested action: {error['suggested_action']}")
```

#### TypeScript
```typescript
import { Client } from '@modelcontextprotocol/sdk/client';

const client = new Client();

// Call the tool
const response = await client.callTool('clickup_example_action', {
  parameter1: 'value1',
  parameter2: 123
});

if (response.success) {
  const data = response.data;
  console.log(`Success: ${data.name}`);

  // Check rate limit
  const rateLimit = response.metadata.rate_limit;
  console.log(`Rate limit remaining: ${rateLimit.remaining}/${rateLimit.limit}`);
} else {
  const error = response.error;
  console.error(`Error: ${error.message}`);
  console.error(`Suggested action: ${error.suggested_action}`);
}
```

---

### Related Tools

- **[Related Tool 1]**: [Brief description of how it relates]
- **[Related Tool 2]**: [Brief description of how it relates]
- **[Related Tool 3]**: [Brief description of how it relates]

---

### Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.1.0 | 2025-01-18 | Added debug metadata support (Phase 5) |
| 1.0.0 | 2025-01-15 | Added automatic retry with telemetry (Phase 4) |
| 0.9.0 | 2025-01-10 | Initial tool implementation |

---

**Last Updated**: 2025-01-18
**Status**: Template complete - ready for application to all 72 tools
