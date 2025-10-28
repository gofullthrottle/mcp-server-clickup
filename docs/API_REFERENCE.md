---
title: API Reference - Remote MCP Server Endpoints
description: Complete API reference for ClickUp MCP Server remote endpoints including authentication, MCP protocol, rate limiting, and error handling
keywords: [api-reference, mcp-protocol, remote-mcp, http-streamable, authentication-headers, error-codes, rate-limiting]
category: api
ai_tags: [api-documentation, mcp-protocol, rest-api, endpoints, authentication]
last_updated: 2025-10-28
---

# API Reference - Remote MCP Server

<!-- AI-OPTIMIZATION: Complete API endpoint documentation for embeddings -->

## Overview

The ClickUp MCP Server is a **Remote MCP Server** hosted on CloudFlare Workers, providing HTTP-based access to Model Context Protocol (MCP) tools for ClickUp workspace management.

**Base URL:** `https://clickup-mcp.workers.dev`

**Key Features:**
- OAuth 2.0 authentication flow
- HTTP Streamable transport (recommended)
- Server-Sent Events (SSE) support
- WebSocket connections
- JWT session tokens
- Rate limiting per tier
- Comprehensive error responses

**Quick Navigation:**
- [Authentication Endpoints](#authentication-endpoints)
- [MCP Protocol Endpoints](#mcp-protocol-endpoints)
- [Billing Endpoints](#billing-endpoints)
- [Request/Response Format](#requestresponse-format)
- [Error Codes](#error-codes)
- [Rate Limiting](#rate-limiting)
- [Transport Options](#transport-options)

---

## Authentication Endpoints

### Overview

Authentication uses OAuth 2.0 authorization code grant flow. See [AUTHENTICATION.md](AUTHENTICATION.md) for complete authentication guide.

**Base Path:** `/auth`

---

### `GET /auth/login`

**Description:** Initiate OAuth 2.0 login flow with ClickUp.

**Authentication:** None (public endpoint)

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `redirect_uri` | string | No | Custom redirect after auth (default: `/auth/callback`) |

**Response:** HTTP 302 redirect to ClickUp authorization page

**Example Request:**
```bash
curl -X GET https://clickup-mcp.workers.dev/auth/login
```

**Flow:**
1. User clicks link → redirected to ClickUp
2. User authorizes → ClickUp redirects to callback
3. Server exchanges code for access token
4. Server returns JWT session token

**Related Endpoints:**
- [`GET /auth/callback`](#get-authcallback) - OAuth callback handler
- [AUTHENTICATION.md](AUTHENTICATION.md) - Complete auth guide

---

### `GET /auth/callback`

**Description:** OAuth 2.0 callback endpoint. ClickUp redirects here after user authorization.

**Authentication:** None (public endpoint)

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `code` | string | Yes | Authorization code from ClickUp |
| `state` | string | Yes | CSRF protection state parameter |

**Response:** JSON with JWT session token

**Example Response:**
```json
{
  "success": true,
  "jwt_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzEyMzQ1IiwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIiwidGVhbV9pZCI6IjY3ODkwIiwidGllciI6ImZyZWUiLCJpYXQiOjE3MDY0MzY2MDAsImV4cCI6MTcwNjUyMzAwMH0...",
  "expires_in": 86400,
  "user": {
    "id": "user_12345",
    "email": "user@example.com",
    "team_id": "67890"
  }
}
```

**Error Responses:**
```json
{
  "error": "invalid_code",
  "message": "Authorization code is invalid or expired"
}
```

**Security:**
- State parameter validated to prevent CSRF attacks
- Authorization code single-use only
- JWT token expires in 24 hours

---

### `POST /auth/refresh`

**Description:** Refresh JWT session token before expiration.

**Authentication:** Required - Bearer token in `Authorization` header

**Headers:**
```http
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "refresh_token": "optional_refresh_token"
}
```

**Response:**
```json
{
  "success": true,
  "jwt_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 86400
}
```

**Error Responses:**
| Status Code | Error Code | Message | Solution |
|-------------|------------|---------|----------|
| 401 | `token_expired` | JWT token has expired | Re-authenticate via `/auth/login` |
| 401 | `invalid_token` | JWT signature invalid | Re-authenticate via `/auth/login` |
| 429 | `rate_limited` | Too many refresh requests | Wait and retry |

**Best Practices:**
- Refresh tokens proactively before expiration (e.g., when < 1 hour remaining)
- Implement exponential backoff for retry logic
- Store new JWT token securely

**Example with Auto-Refresh:**
```python
import time
import jwt

class MCPClient:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.jwt_token = None

    def is_token_expiring_soon(self, threshold_seconds: int = 3600) -> bool:
        """Check if token expires within threshold (default: 1 hour)"""
        if not self.jwt_token:
            return True
        try:
            payload = jwt.decode(self.jwt_token, options={"verify_signature": False})
            exp = payload.get('exp', 0)
            return (exp - time.time()) < threshold_seconds
        except:
            return True

    async def call(self, method: str, params: dict):
        # Auto-refresh if needed
        if self.is_token_expiring_soon():
            await self.refresh_token()

        # Make MCP call
        response = await self.http_client.post(
            f"{self.base_url}/mcp",
            headers={"Authorization": f"Bearer {self.jwt_token}"},
            json={"method": method, "params": params}
        )
        return response.json()

    async def refresh_token(self):
        """Refresh JWT token"""
        response = await self.http_client.post(
            f"{self.base_url}/auth/refresh",
            headers={"Authorization": f"Bearer {self.jwt_token}"}
        )
        data = response.json()
        self.jwt_token = data['jwt_token']
```

---

### `POST /auth/logout`

**Description:** Terminate JWT session and revoke access.

**Authentication:** Required - Bearer token

**Headers:**
```http
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "message": "Session terminated successfully"
}
```

**Actions Performed:**
1. JWT session blacklisted
2. Encrypted API keys deleted from storage
3. Rate limit counters cleared
4. Audit log entry created

**Best Practices:**
- Always logout when finished to prevent unauthorized access
- Logout is idempotent (safe to call multiple times)
- Client should discard JWT token after logout

---

## MCP Protocol Endpoints

### Overview

MCP (Model Context Protocol) endpoints provide access to ClickUp tools through standardized protocol.

**Base Path:** `/mcp`

**Authentication:** All MCP endpoints require JWT authentication

**Supported Methods:**
- `tools/list` - List available tools
- `tools/call` - Execute a tool
- `resources/list` - List available resources (future)
- `prompts/list` - List available prompts (future)

---

### `POST /mcp`

**Description:** Main MCP protocol endpoint for HTTP Streamable transport.

**Authentication:** Required - Bearer JWT token

**Headers:**
```http
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Format:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "METHOD_NAME",
  "params": {
    ...
  }
}
```

**Response Format:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    ...
  }
}
```

**Example: List Tools**

Request:
```bash
curl -X POST https://clickup-mcp.workers.dev/mcp \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list"
  }'
```

Response:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {
        "name": "get_workspace_hierarchy",
        "description": "Get complete workspace structure",
        "inputSchema": {
          "type": "object",
          "properties": {
            "team_id": {
              "type": "string",
              "description": "Workspace team ID"
            }
          },
          "required": ["team_id"]
        }
      },
      {
        "name": "create_task",
        "description": "Create a new task",
        "inputSchema": {
          "type": "object",
          "properties": {
            "list_id": {
              "type": "string",
              "description": "List ID"
            },
            "name": {
              "type": "string",
              "description": "Task name"
            }
          },
          "required": ["list_id", "name"]
        }
      }
    ]
  }
}
```

**Example: Call Tool**

Request:
```bash
curl -X POST https://clickup-mcp.workers.dev/mcp \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "create_task",
      "arguments": {
        "list_id": "90144360426",
        "name": "Implement OAuth authentication",
        "description": "Add OAuth 2.0 + PKCE flow",
        "priority": 1,
        "due_date": "2025-02-15"
      }
    }
  }'
```

Response:
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "✅ Task created successfully\n\nID: abc123xyz\nName: Implement OAuth authentication\nStatus: to do\nPriority: urgent\nDue: 2025-02-15\nURL: https://app.clickup.com/t/abc123xyz"
      }
    ],
    "isError": false
  }
}
```

**Error Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "error": {
    "code": -32600,
    "message": "Invalid request",
    "data": {
      "details": "Missing required parameter: list_id"
    }
  }
}
```

---

### `GET /mcp/sse`

**Description:** Server-Sent Events (SSE) transport for MCP protocol.

**Authentication:** Query parameter or Bearer header

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `token` | string | Yes | JWT session token (if not in header) |

**Headers:**
```http
Authorization: Bearer YOUR_JWT_TOKEN
Accept: text/event-stream
```

**Connection:**
```javascript
const eventSource = new EventSource(
  'https://clickup-mcp.workers.dev/mcp/sse?token=YOUR_JWT_TOKEN'
);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('MCP Message:', data);
};

eventSource.onerror = (error) => {
  console.error('SSE Error:', error);
  eventSource.close();
};
```

**Message Format:**
```
event: mcp-message
data: {"jsonrpc":"2.0","id":1,"result":{...}}

event: mcp-error
data: {"jsonrpc":"2.0","id":1,"error":{...}}
```

**Use Cases:**
- Real-time tool execution updates
- Streaming large responses
- Bidirectional communication

---

### `WS /mcp/ws`

**Description:** WebSocket transport for MCP protocol.

**Authentication:** JWT token in connection URL or first message

**Connection:**
```javascript
const ws = new WebSocket(
  'wss://clickup-mcp.workers.dev/mcp/ws?token=YOUR_JWT_TOKEN'
);

ws.onopen = () => {
  // Send MCP request
  ws.send(JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list'
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('MCP Response:', data);
};

ws.onerror = (error) => {
  console.error('WebSocket Error:', error);
};

ws.onclose = () => {
  console.log('WebSocket connection closed');
};
```

**Message Format:** Same as HTTP Streamable (JSON-RPC 2.0)

**Benefits:**
- Persistent connection (no repeated auth)
- Lower latency
- Bidirectional real-time communication

---

## Billing Endpoints

### `POST /stripe/create-checkout`

**Description:** Create Stripe checkout session for Premium tier subscription.

**Authentication:** Required - Bearer JWT token

**Headers:**
```http
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "return_url": "https://yourapp.com/success",
  "cancel_url": "https://yourapp.com/cancelled"
}
```

**Response:**
```json
{
  "success": true,
  "checkout_url": "https://checkout.stripe.com/c/pay/cs_test_...",
  "session_id": "cs_test_abc123"
}
```

**Example Request:**
```bash
curl -X POST https://clickup-mcp.workers.dev/stripe/create-checkout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "return_url": "https://myapp.com/success",
    "cancel_url": "https://myapp.com/cancelled"
  }'
```

**Usage Flow:**
1. User clicks "Upgrade to Premium"
2. App calls `/stripe/create-checkout`
3. App redirects user to `checkout_url`
4. User completes payment on Stripe
5. Stripe redirects to `return_url`
6. Premium features activate automatically

**Pricing:** $4.99/month (see [PREMIUM_FEATURES.md](PREMIUM_FEATURES.md))

---

### `POST /stripe/webhook`

**Description:** Stripe webhook handler for subscription events.

**Authentication:** Stripe webhook signature validation

**Headers:**
```http
Stripe-Signature: t=...,v1=...
Content-Type: application/json
```

**Events Handled:**
- `checkout.session.completed` - Activate premium subscription
- `invoice.payment_succeeded` - Renewal successful
- `invoice.payment_failed` - Payment failed (downgrade to free)
- `customer.subscription.deleted` - Subscription cancelled

**Note:** This endpoint is called by Stripe, not by clients.

---

## Request/Response Format

### JSON-RPC 2.0

The MCP protocol uses JSON-RPC 2.0 specification:

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": <number | string | null>,
  "method": "<method_name>",
  "params": {
    ...
  }
}
```

**Response (Success):**
```json
{
  "jsonrpc": "2.0",
  "id": <same_as_request>,
  "result": {
    ...
  }
}
```

**Response (Error):**
```json
{
  "jsonrpc": "2.0",
  "id": <same_as_request>,
  "error": {
    "code": <error_code>,
    "message": "<error_message>",
    "data": {
      "details": "<additional_info>"
    }
  }
}
```

### MCP Tool Response Format

Tool calls return results in MCP content format:

**Success Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Human-readable result text"
    }
  ],
  "isError": false
}
```

**Error Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Error: Task not found"
    }
  ],
  "isError": true
}
```

**Content Types:**
- `"text"` - Plain text or Markdown content
- `"image"` - Base64-encoded image data
- `"resource"` - Reference to MCP resource

---

## Error Codes

### HTTP Status Codes

| Status Code | Meaning | Common Causes |
|-------------|---------|---------------|
| 200 | OK | Request successful |
| 400 | Bad Request | Invalid JSON, missing parameters |
| 401 | Unauthorized | Missing/invalid JWT token |
| 403 | Forbidden | Insufficient permissions, tier restriction |
| 404 | Not Found | Endpoint doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error |
| 502 | Bad Gateway | ClickUp API error |
| 503 | Service Unavailable | CloudFlare maintenance |

---

### Application Error Codes

#### Authentication Errors

| Error Code | HTTP Status | Message | Solution |
|------------|-------------|---------|----------|
| `unauthorized` | 401 | Invalid or expired JWT token | Refresh token or re-authenticate |
| `invalid_token` | 401 | JWT signature validation failed | Re-authenticate via `/auth/login` |
| `token_expired` | 401 | JWT token has expired | Use `/auth/refresh` or re-authenticate |
| `invalid_credentials` | 401 | OAuth credentials invalid | Check ClickUp API keys |

**Example:**
```json
{
  "error": {
    "code": "token_expired",
    "message": "JWT token has expired",
    "details": {
      "expired_at": "2025-01-27T10:30:00Z",
      "current_time": "2025-01-28T10:30:00Z"
    }
  }
}
```

---

#### Rate Limiting Errors

| Error Code | HTTP Status | Message | Solution |
|------------|-------------|---------|----------|
| `rate_limited` | 429 | Rate limit exceeded | Wait for reset or upgrade to Premium |
| `quota_exceeded` | 429 | Monthly quota exceeded | Upgrade tier or wait for reset |

**Example:**
```json
{
  "error": {
    "code": "rate_limited",
    "message": "Rate limit exceeded",
    "details": {
      "limit": 100,
      "remaining": 0,
      "reset_in_seconds": 45,
      "upgrade_url": "https://clickup-mcp.workers.dev/stripe/create-checkout"
    }
  }
}
```

**Rate Limit Headers:**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1706436660
Retry-After: 45
```

---

#### Tool Execution Errors

| Error Code | HTTP Status | Message | Solution |
|------------|-------------|---------|----------|
| `invalid_parameters` | 400 | Missing or invalid parameters | Check tool documentation |
| `tool_not_found` | 404 | Tool does not exist | Verify tool name with `tools/list` |
| `premium_required` | 403 | Tool requires Premium tier | Upgrade to Premium ($4.99/mo) |
| `clickup_api_error` | 502 | ClickUp API returned error | Check ClickUp service status |

**Example:**
```json
{
  "error": {
    "code": "invalid_parameters",
    "message": "Missing required parameter: list_id",
    "details": {
      "parameter": "list_id",
      "required": true,
      "type": "string"
    }
  }
}
```

---

#### ClickUp API Errors

| Error Code | HTTP Status | Message | Solution |
|------------|-------------|---------|----------|
| `clickup_not_found` | 404 | Resource not found in ClickUp | Verify resource exists |
| `clickup_forbidden` | 403 | No permission to access resource | Check ClickUp permissions |
| `clickup_rate_limit` | 429 | ClickUp API rate limit | Server-side rate limiting active |
| `clickup_server_error` | 502 | ClickUp API unavailable | Retry later or check ClickUp status |

**Example:**
```json
{
  "error": {
    "code": "clickup_not_found",
    "message": "Task not found",
    "details": {
      "task_id": "abc123xyz",
      "clickup_status": 404,
      "clickup_error": "TASK_NOT_FOUND"
    }
  }
}
```

---

### JSON-RPC Error Codes

Standard JSON-RPC 2.0 error codes:

| Code | Message | Meaning |
|------|---------|---------|
| -32700 | Parse error | Invalid JSON |
| -32600 | Invalid request | Missing required fields |
| -32601 | Method not found | Unknown method |
| -32602 | Invalid params | Invalid method parameters |
| -32603 | Internal error | Server-side error |

---

## Rate Limiting

### Rate Limit Tiers

| Tier | Requests/Minute | Requests/Hour | Requests/Day |
|------|-----------------|---------------|--------------|
| **Free** | 100 | 6,000 | 144,000 |
| **Premium** | 500 | 30,000 | 720,000 |

### Rate Limit Headers

Every response includes rate limit information:

```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1706436660
X-RateLimit-Window: 60
```

**Header Descriptions:**
- `X-RateLimit-Limit`: Maximum requests allowed in window
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Unix timestamp when limit resets
- `X-RateLimit-Window`: Window duration in seconds (60 = 1 minute)

### Rate Limit Algorithm

**Sliding Window:** 1-minute rolling window

**Example:**
- Time: 10:30:00 - Make 50 requests
- Time: 10:30:30 - Make 50 requests (total: 100, limit reached)
- Time: 10:31:00 - Window resets, 50 requests from 10:30:00 expired
- Time: 10:31:01 - 50 requests available

### Rate Limit Exceeded Response

**HTTP 429 Response:**
```json
{
  "error": {
    "code": "rate_limited",
    "message": "Rate limit exceeded",
    "details": {
      "limit": 100,
      "remaining": 0,
      "reset_at": 1706436660,
      "reset_in_seconds": 45,
      "upgrade_url": "https://clickup-mcp.workers.dev/stripe/create-checkout"
    }
  }
}
```

**Headers:**
```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1706436660
Retry-After: 45
```

### Rate Limit Best Practices

**1. Implement Exponential Backoff:**

```python
import time

def call_with_backoff(func, max_retries=3):
    for attempt in range(max_retries):
        try:
            return func()
        except RateLimitError as e:
            if attempt < max_retries - 1:
                wait_time = min(2 ** attempt, e.reset_in_seconds)
                print(f"Rate limited, waiting {wait_time}s...")
                time.sleep(wait_time)
            else:
                raise
```

**2. Monitor Remaining Requests:**

```python
def monitor_rate_limit(response):
    limit = int(response.headers.get('X-RateLimit-Limit', 100))
    remaining = int(response.headers.get('X-RateLimit-Remaining', 0))

    if remaining < limit * 0.1:  # Less than 10% remaining
        print(f"⚠️ Rate limit low: {remaining}/{limit} remaining")

    return remaining
```

**3. Use Bulk Operations (Premium):**

```python
# ❌ Bad - 50 API calls
for task_data in tasks:
    create_task(task_data)

# ✅ Good - 1 API call (Premium tier)
bulk_create_tasks(tasks)  # Up to 50 tasks
```

**4. Cache Responses:**

```python
from functools import lru_cache

@lru_cache(maxsize=100)
def get_workspace_hierarchy(team_id: str):
    # Workspace structure rarely changes
    return mcp_client.call('get_workspace_hierarchy', {'team_id': team_id})
```

---

## Transport Options

### HTTP Streamable (Recommended)

**Best For:** Most applications, AI assistants, automation scripts

**Pros:**
- ✅ Simple HTTP POST requests
- ✅ Works with any HTTP client
- ✅ Stateless (no connection management)
- ✅ Compatible with all MCP clients
- ✅ Firewall-friendly (port 443)

**Cons:**
- ❌ No real-time streaming
- ❌ Higher latency for multiple requests

**Example:**
```python
import requests

def call_tool(tool_name: str, arguments: dict):
    response = requests.post(
        'https://clickup-mcp.workers.dev/mcp',
        headers={'Authorization': f'Bearer {jwt_token}'},
        json={
            'jsonrpc': '2.0',
            'id': 1,
            'method': 'tools/call',
            'params': {
                'name': tool_name,
                'arguments': arguments
            }
        }
    )
    return response.json()
```

---

### Server-Sent Events (SSE)

**Best For:** Real-time updates, streaming responses, notifications

**Pros:**
- ✅ Real-time server→client updates
- ✅ Automatic reconnection
- ✅ Standard EventSource API
- ✅ HTTP-based (firewall-friendly)

**Cons:**
- ❌ One-way communication (server→client only)
- ❌ Not all MCP clients support SSE
- ❌ Requires persistent connection

**Example:**
```javascript
const eventSource = new EventSource(
  'https://clickup-mcp.workers.dev/mcp/sse?token=YOUR_JWT'
);

eventSource.addEventListener('mcp-message', (event) => {
  const data = JSON.parse(event.data);
  console.log('Tool result:', data.result);
});

eventSource.addEventListener('mcp-error', (event) => {
  const error = JSON.parse(event.data);
  console.error('Tool error:', error.error);
});

// Send requests via separate POST to /mcp
fetch('https://clickup-mcp.workers.dev/mcp', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {...}
  })
});
```

---

### WebSocket

**Best For:** Interactive applications, bidirectional communication, low latency

**Pros:**
- ✅ Full-duplex communication
- ✅ Lowest latency
- ✅ Persistent connection
- ✅ Real-time bidirectional updates

**Cons:**
- ❌ Complex connection management
- ❌ Not all environments support WebSockets
- ❌ More resource-intensive (persistent connections)

**Example:**
```javascript
const ws = new WebSocket('wss://clickup-mcp.workers.dev/mcp/ws');

ws.onopen = () => {
  // Authenticate
  ws.send(JSON.stringify({
    jsonrpc: '2.0',
    id: 0,
    method: 'auth',
    params: { token: 'YOUR_JWT' }
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.id === 0) {
    console.log('Authenticated');
    // Now can send tool calls
    ws.send(JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'get_workspace_hierarchy',
        arguments: { team_id: '12345' }
      }
    }));
  } else {
    console.log('Tool result:', data.result);
  }
};
```

---

### Transport Comparison

| Feature | HTTP Streamable | SSE | WebSocket |
|---------|-----------------|-----|-----------|
| **Latency** | Medium | Medium | Low |
| **Real-time** | ❌ | ✅ (one-way) | ✅ (bidirectional) |
| **Complexity** | Low | Medium | High |
| **Firewall-friendly** | ✅ | ✅ | ⚠️ (sometimes blocked) |
| **Connection** | Stateless | Persistent | Persistent |
| **Browser Support** | ✅ Universal | ✅ Modern browsers | ✅ Modern browsers |
| **MCP Client Support** | ✅ All clients | ⚠️ Some clients | ⚠️ Some clients |

**Recommendation:** Use **HTTP Streamable** for most applications unless you need real-time features.

---

## Client Libraries

### Python

```python
import requests
import jwt
import time

class ClickUpMCPClient:
    def __init__(self, base_url: str = "https://clickup-mcp.workers.dev"):
        self.base_url = base_url
        self.jwt_token = None

    def authenticate(self, jwt_token: str):
        """Set JWT token from OAuth flow"""
        self.jwt_token = jwt_token

    def call_tool(self, tool_name: str, arguments: dict):
        """Call MCP tool"""
        response = requests.post(
            f"{self.base_url}/mcp",
            headers={
                'Authorization': f'Bearer {self.jwt_token}',
                'Content-Type': 'application/json'
            },
            json={
                'jsonrpc': '2.0',
                'id': int(time.time()),
                'method': 'tools/call',
                'params': {
                    'name': tool_name,
                    'arguments': arguments
                }
            }
        )
        response.raise_for_status()
        data = response.json()

        if 'error' in data:
            raise Exception(f"Tool error: {data['error']['message']}")

        return data['result']

    def list_tools(self):
        """List available tools"""
        response = requests.post(
            f"{self.base_url}/mcp",
            headers={
                'Authorization': f'Bearer {self.jwt_token}',
                'Content-Type': 'application/json'
            },
            json={
                'jsonrpc': '2.0',
                'id': 1,
                'method': 'tools/list'
            }
        )
        response.raise_for_status()
        return response.json()['result']['tools']

# Usage
client = ClickUpMCPClient()
client.authenticate("YOUR_JWT_TOKEN")

# List tools
tools = client.list_tools()
print(f"Available tools: {len(tools)}")

# Create task
result = client.call_tool('create_task', {
    'list_id': '90144360426',
    'name': 'Implement OAuth',
    'priority': 1
})
print(result)
```

---

### TypeScript

```typescript
interface MCPRequest {
  jsonrpc: '2.0';
  id: number | string;
  method: string;
  params?: any;
}

interface MCPResponse {
  jsonrpc: '2.0';
  id: number | string;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

class ClickUpMCPClient {
  private baseUrl: string;
  private jwtToken: string | null = null;

  constructor(baseUrl: string = 'https://clickup-mcp.workers.dev') {
    this.baseUrl = baseUrl;
  }

  authenticate(jwtToken: string) {
    this.jwtToken = jwtToken;
  }

  async callTool(toolName: string, arguments: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.jwtToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
          name: toolName,
          arguments,
        },
      } as MCPRequest),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: MCPResponse = await response.json();

    if (data.error) {
      throw new Error(`Tool error: ${data.error.message}`);
    }

    return data.result;
  }

  async listTools(): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.jwtToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
      } as MCPRequest),
    });

    const data: MCPResponse = await response.json();
    return data.result.tools;
  }
}

// Usage
const client = new ClickUpMCPClient();
client.authenticate('YOUR_JWT_TOKEN');

// Create task
const result = await client.callTool('create_task', {
  list_id: '90144360426',
  name: 'Implement OAuth',
  priority: 1,
});
console.log(result);
```

---

## Additional Resources

- [AUTHENTICATION.md](AUTHENTICATION.md) - Complete OAuth 2.0 authentication guide
- [TOOL_REFERENCE.md](TOOL_REFERENCE.md) - All 72 tools documented
- [PREMIUM_FEATURES.md](PREMIUM_FEATURES.md) - Premium tier benefits and upgrade
- [SECURITY.md](SECURITY.md) - Security architecture and best practices
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues and solutions

---

*Last Updated: 2025-10-28*
*For questions or issues, see [Troubleshooting Guide](TROUBLESHOOTING.md)*
