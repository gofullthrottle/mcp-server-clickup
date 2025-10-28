# Documentation Consistency Guide

## Purpose
This guide defines standard terminology and phrasing for the ClickUp MCP Server project to ensure consistency across all documentation files.

## Core Terminology

### Architecture & Platform

**✅ ALWAYS USE:**
- **"Remote MCP Server"** - Emphasizes the remote/cloud nature
- **"CloudFlare Workers"** - Correct capitalization (not "Cloudflare" or "CF Workers")
- **"SaaS platform"** or **"SaaS architecture"** - Highlights the service model
- **"Multi-tenant SaaS"** - When discussing user isolation

**❌ NEVER USE:**
- "MCP Server" alone (ambiguous - could be local or remote)
- "Local server" or "NPX installation" (old architecture)
- "STDIO server" or "local transport" (misleading for main use case)

### Authentication & Security

**✅ ALWAYS USE:**
- **"OAuth 2.0 + PKCE"** - Full specification (not just "OAuth")
- **"JWT session tokens"** - Specific token type
- **"24-hour session lifetime"** - Exact duration
- **"Bearer token authentication"** - HTTP auth method
- **"AES-256-GCM encryption"** - Specific encryption algorithm
- **"Encrypted at rest"** - For stored API keys
- **"Per-user rate limiting"** - Clarifies multi-tenancy

**❌ NEVER USE:**
- "OAuth" alone (which version? PKCE?)
- "Session token" without JWT specification
- "Token" ambiguously (JWT? API key? Refresh token?)
- "API key in environment variables" (old local mode)

### Tool Count & Categories

**✅ ALWAYS USE:**
- **"72 tools across 12 categories"** - Exact count everywhere
- **"Task Management (27 tools)"** - Category with count
- **"List Management (12 tools)"**
- **"Workspace Operations (8 tools)"**
- **"Time Tracking (6 tools)"**
- **"Custom Fields (5 tools)"**
- **"Space Management (4 tools)"**
- **"Goal Tracking (3 tools)"**
- **"User Management (2 tools)"**
- **"Team Management (2 tools)"**
- **"Comment Management (2 tools)"**
- **"View Management (1 tool)"**
- **"Other (1 tool)"**

**❌ NEVER USE:**
- "36 tools" (outdated count)
- "70+ tools" or "~72 tools" (be exact)
- Tool categories without counts

### Subscription Tiers

**✅ ALWAYS USE:**
- **"Free tier"** - For basic access
- **"Premium tier"** or **"Premium subscription"** - For paid access
- **"$4.99/month"** - Exact pricing
- **"100 requests/minute"** - Free tier limit
- **"500 requests/minute"** - Premium tier limit
- **"Premium-only tools"** - Tools requiring subscription
- **"Free tier tools"** - Available to all users

**❌ NEVER USE:**
- "Free plan" vs "free tier" (use "tier" consistently)
- "$5/month" (be exact: $4.99)
- "Unlimited tools" (specify tier access instead)

### Protocol & Transport

**✅ ALWAYS USE:**
- **"HTTP Streamable transport"** - Primary remote protocol
- **"MCP protocol"** - Model Context Protocol
- **"SSE (Server-Sent Events)"** - For streaming (spell out first use)
- **"WebSocket support"** - For real-time connections

**❌ NEVER USE:**
- "STDIO transport" as primary (it's legacy/local mode)
- "HTTP transport" ambiguously (specify "HTTP Streamable")

### Storage & Infrastructure

**✅ ALWAYS USE:**
- **"CloudFlare KV"** - For session storage
- **"CloudFlare R2"** - For audit logs and file storage
- **"ClickUp API v2"** - Specify API version
- **"Wrangler"** - CloudFlare Workers CLI tool

**❌ NEVER USE:**
- "KV storage" without "CloudFlare" prefix
- "R2 buckets" without "CloudFlare" prefix
- "ClickUp API" without version

## Phrasing Standards

### User Flows

**For OAuth Flow:**
```markdown
1. User initiates OAuth login
2. System redirects to ClickUp authorization
3. User grants permissions
4. System receives authorization code
5. System exchanges code for access token (PKCE verified)
6. System generates JWT session token
7. User receives JWT for API authentication
```

**For Tool Usage:**
```markdown
1. Client sends MCP request with JWT Bearer token
2. Worker validates JWT and extracts user context
3. Worker decrypts user's ClickUp API key
4. Worker calls ClickUp API on behalf of user
5. Worker returns response through MCP protocol
```

### Architecture Descriptions

**When describing the system:**
```markdown
ClickUp MCP Server is a Remote MCP Server hosted on CloudFlare Workers that enables AI agents to securely interact with ClickUp workspaces through OAuth 2.0 + PKCE authentication. It provides 72 tools across 12 categories for comprehensive task management, time tracking, and workspace operations.
```

**When describing authentication:**
```markdown
The server uses OAuth 2.0 + PKCE for secure authentication, eliminating the need for users to expose their ClickUp API keys. JWT session tokens with 24-hour lifetime provide stateless authentication for all API requests.
```

**When describing multi-tenancy:**
```markdown
The multi-tenant SaaS architecture ensures complete user isolation. Each user's ClickUp API key is encrypted at rest using AES-256-GCM encryption and decrypted only for authenticated requests using their JWT session token.
```

## File Naming Conventions

### Documentation Files
- `AUTHENTICATION.md` - OAuth and security
- `PREMIUM_FEATURES.md` - Subscription tiers
- `TOOL_REFERENCE.md` - Complete tool documentation
- `API_REFERENCE.md` - MCP protocol endpoints
- `DEPLOYMENT.md` - CloudFlare Workers deployment
- `DEVELOPER_GUIDE.md` - Local development setup
- `TROUBLESHOOTING.md` - Common issues and solutions
- `MIGRATION_GUIDE.md` - Migrating from local to remote

### Code Files (Reference Only)
- `src/worker.ts` - Worker entry point
- `src/auth/oauth-service.ts` - OAuth implementation
- `src/services/user-service.ts` - User management
- `src/security/encryption.ts` - Encryption utilities
- `src/mcp-worker-server.ts` - MCP protocol handler

## Cross-Reference Standards

### When Linking to Other Docs
```markdown
See [Authentication Guide](docs/AUTHENTICATION.md) for OAuth 2.0 + PKCE flow details.
See [Premium Features](docs/PREMIUM_FEATURES.md) for subscription tier comparison.
Refer to [Tool Reference](docs/TOOL_REFERENCE.md) for complete list of 72 tools.
```

### When Referencing Code
```markdown
Implementation: `src/auth/oauth-service.ts`
Example: See `test-all-tools-ultrathink.js` for tool validation.
Configuration: Set `CLICKUP_CLIENT_ID` in CloudFlare Workers environment.
```

## Version References

**Current System:**
- MCP Protocol: Latest (Model Context Protocol)
- ClickUp API: v2
- Node.js: 18+ (for local development)
- TypeScript: 5.x
- CloudFlare Workers: Latest runtime

## Acronyms & Abbreviations

**Always spell out on first use:**
- MCP (Model Context Protocol)
- OAuth (Open Authorization) 2.0
- PKCE (Proof Key for Code Exchange)
- JWT (JSON Web Token)
- SSE (Server-Sent Events)
- KV (Key-Value) storage
- R2 (CloudFlare object storage)
- AES (Advanced Encryption Standard)
- GCM (Galois/Counter Mode)
- CRUD (Create, Read, Update, Delete)

## Examples vs. Placeholders

**Use realistic examples:**
```typescript
// ✅ Good - realistic example
const JWT_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

// ❌ Bad - vague placeholder
const JWT_TOKEN = "your-jwt-token-here"
```

**Use descriptive placeholders when needed:**
```bash
# ✅ Good - descriptive
export CLICKUP_CLIENT_ID="your_clickup_oauth_client_id"

# ❌ Bad - ambiguous
export CLICKUP_CLIENT_ID="xxx"
```

## Quality Checklist for Every Doc

Before publishing any documentation, verify:
- [ ] Uses "Remote MCP Server" (not "MCP Server" alone)
- [ ] States "72 tools across 12 categories" (exact count)
- [ ] Specifies "OAuth 2.0 + PKCE" (not just "OAuth")
- [ ] References "CloudFlare Workers" (correct capitalization)
- [ ] Uses "JWT session tokens" (not just "tokens")
- [ ] No mentions of "local server" or "NPX installation"
- [ ] No mentions of "36 tools" (old count)
- [ ] All acronyms spelled out on first use
- [ ] Cross-references use consistent file names

---
*This guide must be consulted when creating or updating any documentation.*
*Last Updated: 2024-10-28*
