---
title: Authentication & Authorization
description: OAuth 2.0 authentication flow, JWT session management, and security best practices for ClickUp MCP Server
keywords: [oauth, authentication, jwt, clickup, security, authorization, tokens]
category: authentication
ai_tags: [oauth2, jwt, security, authentication, api-access]
last_updated: 2025-10-28
---

# Authentication & Authorization

<!-- AI-OPTIMIZATION: Clear authentication flow for embeddings -->

## Overview

The ClickUp MCP Server uses **OAuth 2.0 authorization code flow** for secure authentication. Users authenticate through ClickUp's authorization server, and the server manages encrypted API keys and JWT session tokens.

**Key Features:**
- OAuth 2.0 authorization code grant for secure user authorization
- JWT session tokens with 24-hour lifetime
- AES-256-GCM encryption for stored API keys
- Automatic token refresh capabilities
- Multi-tenant user isolation

**Authentication Flow Summary:**
1. User initiates login → Redirected to ClickUp authorization
2. User grants permissions → ClickUp redirects with authorization code
3. Server exchanges code for access tokens → Encrypts and stores tokens
4. Server generates JWT session token → User receives JWT for API access

## Quick Start

### Prerequisites

- ClickUp account with workspace access
- OAuth application credentials (client ID and secret)
- CloudFlare Workers environment configured

### Basic Authentication Flow

**Step 1: Initiate Login**
```bash
# Navigate to login endpoint
https://clickup-mcp.workers.dev/auth/login
```

**Step 2: Authorize in ClickUp**
- Log in to your ClickUp account
- Review requested permissions
- Click "Authorize" to grant access

**Step 3: Receive JWT Token**
After authorization, you'll receive a JWT session token:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 86400,
  "user": {
    "id": "12345",
    "email": "user@example.com",
    "team_id": "67890"
  }
}
```

**Step 4: Use JWT for API Requests**
```bash
curl -X POST https://clickup-mcp.workers.dev/mcp \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"method": "tools/list"}'
```

## OAuth 2.0 Flow

### Architecture Overview

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant Worker as CloudFlare Worker
    participant ClickUp as ClickUp OAuth Server
    participant KV as CloudFlare KV

    User->>Browser: Click "Login"
    Browser->>Worker: GET /auth/login
    Worker->>Worker: Generate state parameter
    Worker->>KV: Store state
    Worker->>Browser: Redirect to ClickUp

    Browser->>ClickUp: Authorization request
    User->>ClickUp: Login & authorize
    ClickUp->>Browser: Redirect with auth code

    Browser->>Worker: GET /auth/callback?code=xxx&state=yyy
    Worker->>KV: Verify state
    Worker->>ClickUp: POST /oauth/token<br/>(exchange code for tokens)
    ClickUp->>Worker: Access token + refresh token

    Worker->>Worker: Encrypt API key (AES-256-GCM)
    Worker->>KV: Store encrypted tokens
    Worker->>Worker: Generate JWT session token
    Worker->>Browser: Return JWT token
    Browser->>User: Show JWT token
```

### Step-by-Step Flow

#### 1. Initiate OAuth Flow

**Endpoint:** `GET /auth/login`

When a user accesses this endpoint, the server:
- Generates a cryptographically secure state parameter (32 bytes, hex-encoded)
- Stores state in CloudFlare KV for verification (expires in 10 minutes)
- Constructs ClickUp authorization URL with required parameters
- Redirects user to ClickUp authorization page

**Authorization URL Structure:**
```
https://app.clickup.com/api/v2/oauth/authorize?
  client_id=YOUR_CLIENT_ID&
  redirect_uri=https://clickup-mcp.workers.dev/auth/callback&
  response_type=code&
  state=RANDOM_STATE_VALUE&
  scope=user:read team:read task:write
```

**Required Scopes:**
- `user:read` - Read user profile information
- `team:read` - Access workspace/team data
- `task:write` - Create and modify tasks

#### 2. User Authorization

ClickUp presents the authorization page where users:
- Review the permissions being requested
- Log in to their ClickUp account (if not already logged in)
- Grant or deny access to their workspace

#### 3. Authorization Callback

**Endpoint:** `GET /auth/callback?code=xxx&state=yyy`

ClickUp redirects back with:
- `code` - Authorization code (one-time use, expires in 10 minutes)
- `state` - State parameter for CSRF protection

**Server validates:**
1. State parameter matches stored value
2. State hasn't expired
3. Authorization code is present

#### 4. Token Exchange

**Internal Process:** Server exchanges authorization code for access tokens

**Request to ClickUp:**
```http
POST https://app.clickup.com/api/v2/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&
client_id=YOUR_CLIENT_ID&
client_secret=YOUR_CLIENT_SECRET&
code=AUTHORIZATION_CODE&
redirect_uri=https://clickup-mcp.workers.dev/auth/callback
```

**Response from ClickUp:**
```json
{
  "access_token": "pk_12345_ABCDEFGHIJKLMNOP",
  "refresh_token": "rt_12345_XYZABCDEFGHIJKLM",
  "expires_in": 3600,
  "token_type": "Bearer"
}
```

#### 5. Secure Storage

**Encryption Process:**
1. Access token encrypted using AES-256-GCM with server encryption key
2. Refresh token encrypted separately
3. Both stored in CloudFlare KV with user ID as key
4. Encryption key stored in CloudFlare Workers secrets (never exposed)

**Storage Format:**
```typescript
interface StoredTokens {
  encryptedAccessToken: string;  // AES-256-GCM encrypted
  encryptedRefreshToken: string; // AES-256-GCM encrypted
  iv: string;                     // Initialization vector for encryption
  authTag: string;                // Authentication tag for GCM mode
  expiresAt: number;              // Unix timestamp
  userId: string;
  teamId: string;
}
```

#### 6. JWT Generation

**Server generates JWT session token** containing:
```json
{
  "sub": "user_12345",
  "email": "user@example.com",
  "team_id": "67890",
  "tier": "free",
  "iat": 1234567890,
  "exp": 1234654290
}
```

**JWT Properties:**
- **Algorithm:** HS256 (HMAC with SHA-256)
- **Lifetime:** 24 hours from issuance
- **Secret:** Stored in CloudFlare Workers secrets
- **Signature:** Prevents tampering

**User receives:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 86400,
  "token_type": "Bearer",
  "user": {
    "id": "12345",
    "email": "user@example.com",
    "username": "john_doe",
    "team": {
      "id": "67890",
      "name": "My Workspace"
    }
  }
}
```

## JWT Session Management

### Token Structure

JWT tokens consist of three parts (header.payload.signature):

**Header:**
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**Payload (Claims):**
```json
{
  "sub": "user_12345",        // Subject: User ID
  "email": "user@example.com", // User email
  "team_id": "67890",          // ClickUp team/workspace ID
  "tier": "free",              // Subscription tier (free/premium)
  "iat": 1234567890,           // Issued at (Unix timestamp)
  "exp": 1234654290            // Expires at (Unix timestamp)
}
```

**Signature:**
```
HMACSHA256(
  base64UrlEncode(header) + "." +
  base64UrlEncode(payload),
  SECRET_KEY
)
```

### Token Lifecycle

**1. Token Issuance**
- Generated after successful OAuth flow
- 24-hour lifetime (configurable via `JWT_EXPIRY` environment variable)
- Signed with server secret key

**2. Token Validation**
- Every MCP request includes `Authorization: Bearer <token>` header
- Server validates signature using secret key
- Checks expiration timestamp
- Extracts user context (user ID, team ID, tier)

**3. Token Usage**
```typescript
// Example: Using JWT in MCP client
const response = await fetch('https://clickup-mcp.workers.dev/mcp', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    method: 'tools/call',
    params: {
      name: 'clickup_task_create',
      arguments: {
        list_id: '12345',
        name: 'New Task'
      }
    }
  })
});
```

**4. Token Expiration**
- Tokens automatically expire after 24 hours
- Server rejects requests with expired tokens
- Client must refresh or re-authenticate

### Token Storage Best Practices

**Recommended Storage Locations:**

**Browser Applications:**
```javascript
// Option 1: HTTP-only cookie (most secure)
// Set by server in Set-Cookie header
// Not accessible via JavaScript

// Option 2: Secure localStorage (if HTTP-only cookies not possible)
localStorage.setItem('clickup_jwt', token);

// Retrieve token
const token = localStorage.getItem('clickup_jwt');
```

**Node.js Applications:**
```javascript
// Use environment variables or secure vault
process.env.CLICKUP_JWT_TOKEN = token;

// Or use keychain/credential manager
const keytar = require('keytar');
await keytar.setPassword('clickup-mcp', 'jwt', token);
```

**Security Warnings:**
- ❌ Never commit tokens to version control
- ❌ Don't expose tokens in URLs or logs
- ❌ Don't store in plain text files
- ✅ Use secure storage mechanisms
- ✅ Clear tokens on logout
- ✅ Implement token refresh before expiry

## Token Refresh

### Automatic Token Refresh

**Endpoint:** `POST /auth/refresh`

**When to Refresh:**
- **Proactive:** Refresh 1 hour before expiry (recommended)
- **Reactive:** Refresh when receiving 401 Unauthorized errors

**Request:**
```http
POST /auth/refresh
Authorization: Bearer CURRENT_JWT_TOKEN
Content-Type: application/json
```

**Response (Success):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 86400,
  "token_type": "Bearer"
}
```

**Response (Failure):**
```json
{
  "error": {
    "code": "refresh_failed",
    "message": "Unable to refresh token. Please re-authenticate.",
    "details": {
      "reason": "refresh_token_expired"
    }
  }
}
```

### Refresh Flow Diagram

```mermaid
sequenceDiagram
    participant Client
    participant Worker as CloudFlare Worker
    participant KV as CloudFlare KV
    participant ClickUp

    Client->>Worker: POST /auth/refresh<br/>(JWT in header)
    Worker->>Worker: Validate JWT signature
    Worker->>Worker: Check JWT expiration

    alt JWT Valid
        Worker->>KV: Retrieve encrypted refresh token
        Worker->>Worker: Decrypt refresh token
        Worker->>ClickUp: POST /oauth/token<br/>(grant_type=refresh_token)

        alt Refresh Success
            ClickUp->>Worker: New access token
            Worker->>Worker: Encrypt new access token
            Worker->>KV: Store encrypted token
            Worker->>Worker: Generate new JWT
            Worker->>Client: Return new JWT
        else Refresh Failed
            ClickUp->>Worker: Error response
            Worker->>Client: 401 Unauthorized<br/>(re-authentication required)
        end
    else JWT Invalid/Expired
        Worker->>Client: 401 Unauthorized<br/>(re-authentication required)
    end
```

### Implementing Auto-Refresh

**Python Example:**
```python
import time
import jwt
import requests

class ClickUpClient:
    def __init__(self, jwt_token):
        self.jwt_token = jwt_token
        self.base_url = "https://clickup-mcp.workers.dev"

    def is_token_expiring_soon(self, threshold_seconds=3600):
        """Check if token expires within threshold (default: 1 hour)"""
        try:
            payload = jwt.decode(
                self.jwt_token,
                options={"verify_signature": False}
            )
            exp = payload.get('exp', 0)
            return (exp - time.time()) < threshold_seconds
        except:
            return True

    async def ensure_valid_token(self):
        """Refresh token if expiring soon"""
        if self.is_token_expiring_soon():
            response = requests.post(
                f"{self.base_url}/auth/refresh",
                headers={"Authorization": f"Bearer {self.jwt_token}"}
            )

            if response.status_code == 200:
                data = response.json()
                self.jwt_token = data['token']
                print("Token refreshed successfully")
            else:
                print("Token refresh failed, re-authentication required")
                raise Exception("Re-authentication required")

    async def make_request(self, method, endpoint, data=None):
        """Make authenticated request with auto-refresh"""
        await self.ensure_valid_token()

        response = requests.post(
            f"{self.base_url}{endpoint}",
            headers={
                "Authorization": f"Bearer {self.jwt_token}",
                "Content-Type": "application/json"
            },
            json=data
        )

        if response.status_code == 401:
            # Token expired, try refreshing once
            await self.ensure_valid_token()
            response = requests.post(
                f"{self.base_url}{endpoint}",
                headers={
                    "Authorization": f"Bearer {self.jwt_token}",
                    "Content-Type": "application/json"
                },
                json=data
            )

        return response.json()
```

**TypeScript Example:**
```typescript
import jwt from 'jsonwebtoken';

interface JWTPayload {
  sub: string;
  email: string;
  team_id: string;
  tier: string;
  iat: number;
  exp: number;
}

class ClickUpClient {
  private jwtToken: string;
  private readonly baseUrl = 'https://clickup-mcp.workers.dev';

  constructor(jwtToken: string) {
    this.jwtToken = jwtToken;
  }

  private isTokenExpiringSoon(thresholdSeconds = 3600): boolean {
    try {
      const decoded = jwt.decode(this.jwtToken) as JWTPayload;
      const now = Math.floor(Date.now() / 1000);
      return (decoded.exp - now) < thresholdSeconds;
    } catch {
      return true;
    }
  }

  private async refreshToken(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.jwtToken}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      this.jwtToken = data.token;
      console.log('Token refreshed successfully');
    } else {
      throw new Error('Token refresh failed. Re-authentication required.');
    }
  }

  async ensureValidToken(): Promise<void> {
    if (this.isTokenExpiringSoon()) {
      await this.refreshToken();
    }
  }

  async makeRequest(endpoint: string, data: any): Promise<any> {
    await this.ensureValidToken();

    let response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.jwtToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (response.status === 401) {
      // Try refreshing once
      await this.refreshToken();
      response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.jwtToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
    }

    return response.json();
  }
}
```

## Error Handling

### Common Authentication Errors

#### OAuth Flow Errors

**Error: Invalid Client**
```json
{
  "error": "invalid_client",
  "error_description": "Client authentication failed"
}
```
**Causes:**
- Incorrect client ID
- Incorrect client secret
- OAuth app not found or deleted

**Solutions:**
1. Verify `CLICKUP_CLIENT_ID` in environment variables
2. Verify `CLICKUP_CLIENT_SECRET` is correct
3. Check OAuth app exists in ClickUp settings
4. Ensure OAuth app is not suspended

---

**Error: Invalid Redirect URI**
```json
{
  "error": "invalid_request",
  "error_description": "Redirect URI mismatch"
}
```
**Causes:**
- Redirect URI doesn't match OAuth app configuration
- Protocol mismatch (http vs https)
- Port mismatch in development

**Solutions:**
1. Verify redirect URI in OAuth app settings matches exactly
2. Include port number if running locally: `http://localhost:8787/auth/callback`
3. Use HTTPS in production
4. Check for trailing slashes (must match exactly)

---

**Error: Access Denied**
```json
{
  "error": "access_denied",
  "error_description": "User denied authorization"
}
```
**Causes:**
- User clicked "Deny" on authorization page
- User cancelled the authorization flow

**Solutions:**
1. Restart authorization flow
2. Ensure user understands required permissions
3. Check if workspace permissions allow OAuth apps

---

**Error: State Mismatch**
```json
{
  "error": {
    "code": "invalid_state",
    "message": "State parameter validation failed"
  }
}
```
**Causes:**
- CSRF attack attempt
- State expired (older than 10 minutes)
- Session storage cleared during flow

**Solutions:**
1. Clear browser cache and cookies
2. Restart authorization flow
3. Ensure browser allows cookies
4. Check for browser extensions blocking state parameter

#### JWT Token Errors

**Error: Invalid Token**
```json
{
  "error": {
    "code": "invalid_token",
    "message": "JWT token is invalid",
    "details": {
      "reason": "invalid_signature"
    }
  }
}
```
**Causes:**
- Token tampered with
- Wrong JWT secret used for validation
- Token format corrupted

**Solutions:**
1. Obtain new token via `/auth/login`
2. Verify token hasn't been modified
3. Check for encoding issues (base64url)

---

**Error: Token Expired**
```json
{
  "error": {
    "code": "token_expired",
    "message": "JWT token has expired",
    "details": {
      "expired_at": "2024-10-28T12:00:00Z"
    }
  }
}
```
**Causes:**
- Token older than 24 hours
- System clock skew

**Solutions:**
1. Use `/auth/refresh` to get new token
2. Implement proactive token refresh (1 hour before expiry)
3. If refresh fails, re-authenticate via `/auth/login`

---

**Error: Token Malformed**
```json
{
  "error": {
    "code": "token_malformed",
    "message": "JWT token format is invalid"
  }
}
```
**Causes:**
- Token missing header or payload
- Invalid base64url encoding
- Missing signature

**Solutions:**
1. Verify token has three parts separated by dots: `header.payload.signature`
2. Check for whitespace or line breaks in token
3. Ensure proper base64url encoding (not standard base64)

#### Network & CORS Errors

**Error: CORS Policy Blocked**
```
Access to fetch at 'https://clickup-mcp.workers.dev/auth/login' from origin
'http://localhost:3000' has been blocked by CORS policy
```
**Causes:**
- Origin not whitelisted in CORS configuration
- Preflight request failed
- Credentials mode mismatch

**Solutions:**
1. Add origin to allowed origins in Worker CORS configuration
2. Include `credentials: 'include'` in fetch requests if using cookies
3. Check for correct CORS headers in Worker responses

---

**Error: Network Timeout**
```json
{
  "error": {
    "code": "network_timeout",
    "message": "Request timed out"
  }
}
```
**Causes:**
- Slow network connection
- ClickUp API unresponsive
- CloudFlare Workers timeout

**Solutions:**
1. Retry request with exponential backoff
2. Check ClickUp API status: https://status.clickup.com
3. Increase timeout in client configuration
4. Verify network connectivity

## Security Best Practices

### Authentication Security

**1. Never Expose Credentials**
```typescript
// ❌ WRONG: Hardcoded secrets
const config = {
  clientId: 'abc123',
  clientSecret: 'secret_key_xyz'  // NEVER DO THIS
};

// ✅ CORRECT: Use environment variables
const config = {
  clientId: process.env.CLICKUP_CLIENT_ID!,
  clientSecret: process.env.CLICKUP_CLIENT_SECRET!
};
```

**2. Secure Token Storage**
```typescript
// ❌ WRONG: Plain text storage
localStorage.setItem('token', jwtToken);

// ✅ CORRECT: Use secure storage mechanisms
// Browser: HTTP-only cookies (set by server)
// Node.js: Environment variables or keychain
import keytar from 'keytar';
await keytar.setPassword('clickup-mcp', 'jwt', jwtToken);
```

**3. HTTPS Only**
```typescript
// ❌ WRONG: HTTP in production
const baseUrl = 'http://clickup-mcp.workers.dev';

// ✅ CORRECT: HTTPS required
const baseUrl = 'https://clickup-mcp.workers.dev';
```

**4. Token Rotation**
```typescript
// Implement regular token refresh
setInterval(async () => {
  await client.ensureValidToken();
}, 3600000); // Refresh every hour
```

### Data Protection

**Encryption at Rest:**
- All ClickUp API keys encrypted with AES-256-GCM
- Encryption keys stored in CloudFlare Workers secrets
- Per-user encryption with unique initialization vectors
- Authentication tags prevent tampering

**Encryption in Transit:**
- All communication over HTTPS/TLS 1.3
- JWT tokens transmitted in Authorization header (not URL)
- Sensitive data never logged or exposed

**Multi-Tenant Isolation:**
- Complete data separation between users
- User context validated on every request
- No cross-user data access possible
- Audit trail for all user actions

### Rate Limiting

**Per-User Limits:**
- Free tier: 100 requests/minute
- Premium tier: 500 requests/minute
- Limits enforced per user ID from JWT

**Implementing Client-Side Rate Limiting:**
```typescript
class RateLimiter {
  private requests: number = 0;
  private resetTime: number = Date.now() + 60000;

  async checkLimit(tier: 'free' | 'premium'): Promise<void> {
    const limit = tier === 'free' ? 100 : 500;

    if (Date.now() > this.resetTime) {
      this.requests = 0;
      this.resetTime = Date.now() + 60000;
    }

    if (this.requests >= limit) {
      const waitMs = this.resetTime - Date.now();
      console.log(`Rate limit reached. Waiting ${waitMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitMs));
      this.requests = 0;
      this.resetTime = Date.now() + 60000;
    }

    this.requests++;
  }
}
```

### Audit Logging

All authentication events are logged to CloudFlare R2:
- User login attempts (success/failure)
- Token refreshes
- Authorization grants/denials
- API access patterns
- Security events (e.g., invalid signatures)

**Log Structure:**
```json
{
  "timestamp": "2024-10-28T12:00:00Z",
  "event_type": "auth_success",
  "user_id": "12345",
  "ip_address": "203.0.113.45",
  "user_agent": "Mozilla/5.0...",
  "details": {
    "team_id": "67890",
    "tier": "free",
    "scopes": ["user:read", "team:read", "task:write"]
  }
}
```

## Code Examples

### Complete Python Example

```python
#!/usr/bin/env python3
"""
ClickUp MCP Client with OAuth 2.0 and JWT management
"""
import requests
import jwt
import time
from typing import Optional, Dict, Any

class ClickUpMCPClient:
    """
    ClickUp MCP client with automatic token management
    """

    def __init__(self, base_url: str = "https://clickup-mcp.workers.dev"):
        self.base_url = base_url
        self.jwt_token: Optional[str] = None

    def authenticate(self) -> str:
        """
        Initiates OAuth flow and returns login URL.
        User must complete authorization in browser.
        """
        response = requests.get(f"{self.base_url}/auth/login")

        if response.status_code == 302:
            login_url = response.headers.get('Location')
            print(f"Please visit: {login_url}")
            print("After authorizing, you'll receive a JWT token.")
            return login_url
        else:
            raise Exception(f"Failed to initiate OAuth: {response.text}")

    def set_token(self, jwt_token: str):
        """Set JWT token received from OAuth flow"""
        self.jwt_token = jwt_token

    def is_token_expiring_soon(self, threshold_seconds: int = 3600) -> bool:
        """Check if token expires within threshold (default: 1 hour)"""
        if not self.jwt_token:
            return True

        try:
            payload = jwt.decode(
                self.jwt_token,
                options={"verify_signature": False}
            )
            exp = payload.get('exp', 0)
            return (exp - time.time()) < threshold_seconds
        except:
            return True

    def refresh_token(self) -> bool:
        """Refresh JWT token"""
        if not self.jwt_token:
            return False

        try:
            response = requests.post(
                f"{self.base_url}/auth/refresh",
                headers={"Authorization": f"Bearer {self.jwt_token}"}
            )

            if response.status_code == 200:
                data = response.json()
                self.jwt_token = data['token']
                print("Token refreshed successfully")
                return True
            else:
                print(f"Token refresh failed: {response.text}")
                return False
        except Exception as e:
            print(f"Error refreshing token: {e}")
            return False

    def ensure_valid_token(self):
        """Ensure token is valid, refresh if needed"""
        if self.is_token_expiring_soon():
            if not self.refresh_token():
                raise Exception("Token expired and refresh failed. Re-authentication required.")

    def call_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """
        Call an MCP tool

        Args:
            tool_name: Name of the tool (e.g., 'clickup_task_create')
            arguments: Tool arguments

        Returns:
            Tool response
        """
        self.ensure_valid_token()

        response = requests.post(
            f"{self.base_url}/mcp",
            headers={
                "Authorization": f"Bearer {self.jwt_token}",
                "Content-Type": "application/json"
            },
            json={
                "method": "tools/call",
                "params": {
                    "name": tool_name,
                    "arguments": arguments
                }
            }
        )

        if response.status_code == 401:
            # Token expired, try refreshing
            if self.refresh_token():
                # Retry request with new token
                response = requests.post(
                    f"{self.base_url}/mcp",
                    headers={
                        "Authorization": f"Bearer {self.jwt_token}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "method": "tools/call",
                        "params": {
                            "name": tool_name,
                            "arguments": arguments
                        }
                    }
                )

        return response.json()

    def list_tools(self) -> Dict[str, Any]:
        """List available MCP tools"""
        self.ensure_valid_token()

        response = requests.post(
            f"{self.base_url}/mcp",
            headers={
                "Authorization": f"Bearer {self.jwt_token}",
                "Content-Type": "application/json"
            },
            json={"method": "tools/list"}
        )

        return response.json()


# Usage Example
if __name__ == "__main__":
    # Initialize client
    client = ClickUpMCPClient()

    # Option 1: Get login URL for browser authorization
    # login_url = client.authenticate()
    # # User completes OAuth in browser and receives JWT

    # Option 2: Use existing JWT token
    jwt_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    client.set_token(jwt_token)

    # List available tools
    tools = client.list_tools()
    print(f"Available tools: {len(tools.get('tools', []))}")

    # Create a task
    result = client.call_tool('clickup_task_create', {
        'list_id': '12345',
        'name': 'Test Task',
        'description': 'Created via MCP client'
    })
    print(f"Task created: {result}")
```

### Complete TypeScript Example

```typescript
/**
 * ClickUp MCP Client with OAuth 2.0 and JWT management
 */
import jwt from 'jsonwebtoken';

interface JWTPayload {
  sub: string;
  email: string;
  team_id: string;
  tier: string;
  iat: number;
  exp: number;
}

interface ToolCallParams {
  name: string;
  arguments: Record<string, any>;
}

interface MCPResponse {
  content?: Array<{ type: string; text: string }>;
  isError?: boolean;
  error?: {
    code: string;
    message: string;
  };
}

class ClickUpMCPClient {
  private jwtToken: string | null = null;
  private readonly baseUrl: string;

  constructor(baseUrl: string = 'https://clickup-mcp.workers.dev') {
    this.baseUrl = baseUrl;
  }

  /**
   * Initiates OAuth flow and returns login URL
   */
  async authenticate(): Promise<string> {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      redirect: 'manual'
    });

    const loginUrl = response.headers.get('Location');
    if (!loginUrl) {
      throw new Error('Failed to get OAuth login URL');
    }

    console.log(`Please visit: ${loginUrl}`);
    console.log('After authorizing, you\'ll receive a JWT token.');

    return loginUrl;
  }

  /**
   * Set JWT token received from OAuth flow
   */
  setToken(jwtToken: string): void {
    this.jwtToken = jwtToken;
  }

  /**
   * Check if token expires within threshold (default: 1 hour)
   */
  private isTokenExpiringSoon(thresholdSeconds: number = 3600): boolean {
    if (!this.jwtToken) return true;

    try {
      const decoded = jwt.decode(this.jwtToken) as JWTPayload;
      const now = Math.floor(Date.now() / 1000);
      return (decoded.exp - now) < thresholdSeconds;
    } catch {
      return true;
    }
  }

  /**
   * Refresh JWT token
   */
  private async refreshToken(): Promise<boolean> {
    if (!this.jwtToken) return false;

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.jwtToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.jwtToken = data.token;
        console.log('Token refreshed successfully');
        return true;
      } else {
        console.error('Token refresh failed:', await response.text());
        return false;
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  }

  /**
   * Ensure token is valid, refresh if needed
   */
  private async ensureValidToken(): Promise<void> {
    if (!this.jwtToken) {
      throw new Error('No JWT token set. Please authenticate first.');
    }

    if (this.isTokenExpiringSoon()) {
      const refreshed = await this.refreshToken();
      if (!refreshed) {
        throw new Error('Token expired and refresh failed. Re-authentication required.');
      }
    }
  }

  /**
   * Call an MCP tool
   */
  async callTool(toolName: string, arguments: Record<string, any>): Promise<MCPResponse> {
    await this.ensureValidToken();

    let response = await fetch(`${this.baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.jwtToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        method: 'tools/call',
        params: {
          name: toolName,
          arguments
        }
      })
    });

    if (response.status === 401) {
      // Token expired, try refreshing once
      const refreshed = await this.refreshToken();
      if (refreshed) {
        response = await fetch(`${this.baseUrl}/mcp`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.jwtToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            method: 'tools/call',
            params: {
              name: toolName,
              arguments
            }
          })
        });
      }
    }

    return response.json();
  }

  /**
   * List available MCP tools
   */
  async listTools(): Promise<any> {
    await this.ensureValidToken();

    const response = await fetch(`${this.baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.jwtToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        method: 'tools/list'
      })
    });

    return response.json();
  }
}

// Usage Example
async function main() {
  // Initialize client
  const client = new ClickUpMCPClient();

  // Option 1: Get login URL for browser authorization
  // const loginUrl = await client.authenticate();
  // // User completes OAuth in browser and receives JWT

  // Option 2: Use existing JWT token
  const jwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
  client.setToken(jwtToken);

  // List available tools
  const tools = await client.listTools();
  console.log(`Available tools: ${tools.tools?.length || 0}`);

  // Create a task
  const result = await client.callTool('clickup_task_create', {
    list_id: '12345',
    name: 'Test Task',
    description: 'Created via MCP client'
  });
  console.log('Task created:', result);
}

main().catch(console.error);
```

### cURL Examples

**1. Initiate OAuth Flow:**
```bash
# Get OAuth login URL
curl -i -X GET https://clickup-mcp.workers.dev/auth/login

# Response will be 302 redirect to ClickUp authorization page
# Follow the Location header in your browser
```

**2. Exchange Code for Token (handled automatically by callback):**
```bash
# This happens automatically in the /auth/callback endpoint
# Shown here for reference only

curl -X POST https://app.clickup.com/api/v2/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "code=AUTHORIZATION_CODE" \
  -d "redirect_uri=https://clickup-mcp.workers.dev/auth/callback"
```

**3. Use JWT Token:**
```bash
# List MCP tools
curl -X POST https://clickup-mcp.workers.dev/mcp \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/list"
  }'

# Call a tool
curl -X POST https://clickup-mcp.workers.dev/mcp \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "clickup_task_create",
      "arguments": {
        "list_id": "12345",
        "name": "Test Task",
        "description": "Created via cURL"
      }
    }
  }'
```

**4. Refresh JWT Token:**
```bash
curl -X POST https://clickup-mcp.workers.dev/auth/refresh \
  -H "Authorization: Bearer YOUR_CURRENT_JWT_TOKEN"
```

**5. Logout:**
```bash
curl -X POST https://clickup-mcp.workers.dev/auth/logout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Technical Note: PKCE Terminology

**Important Clarification:**

You may notice references to "OAuth 2.0 + PKCE" in other documentation (README.md, CLAUDE.md). However, the **current implementation uses OAuth 2.0 authorization code grant with client credentials** (client_id + client_secret), not PKCE.

### Why No PKCE?

**PKCE (Proof Key for Code Exchange)** is designed for:
- Public clients (mobile apps, SPAs) that can't securely store client secrets
- Preventing authorization code interception attacks

**Current Implementation Uses:**
- CloudFlare Workers (server-side execution)
- Client secret stored securely in Workers environment secrets
- This is the **recommended pattern for server-side OAuth clients**

### Security Equivalence

The current implementation is **equally secure** for this architecture because:
1. ✅ Client secret never exposed to browser/client
2. ✅ Authorization code interception prevented by server-side exchange
3. ✅ State parameter prevents CSRF attacks
4. ✅ HTTPS enforced for all communications
5. ✅ CloudFlare Workers secrets provide secure storage

### Future Considerations

PKCE may be added in future versions to:
- Support public client applications (browser extensions, mobile apps)
- Align with evolving OAuth best practices
- Provide additional defense-in-depth security

**For now:** The OAuth 2.0 implementation with client credentials is the correct and secure approach for this CloudFlare Workers architecture.

## Related Documentation

- [User Management](USER_MANAGEMENT.md) - User account operations
- [Security Guide](SECURITY.md) - Security best practices
- [API Reference](API_REFERENCE.md) - MCP protocol endpoints
- [Deployment Guide](DEPLOYMENT.md) - CloudFlare Workers deployment
- [Troubleshooting](TROUBLESHOOTING.md) - Common issues and solutions

## References

- [OAuth 2.0 Specification](https://oauth.net/2/)
- [PKCE RFC 7636](https://tools.ietf.org/html/rfc7636)
- [JWT RFC 7519](https://tools.ietf.org/html/rfc7519)
- [ClickUp OAuth Documentation](https://clickup.com/api/developer-portal/authentication/)
- [CloudFlare Workers Security](https://developers.cloudflare.com/workers/runtime-apis/web-crypto/)

---
*For questions or issues, see [Troubleshooting Guide](TROUBLESHOOTING.md)*
*Last Updated: 2025-10-28*
