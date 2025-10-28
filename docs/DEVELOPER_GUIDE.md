# Developer Guide

Comprehensive guide for local development, testing, debugging, and contributing to ClickUp MCP Server on CloudFlare Workers.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Getting Started](#getting-started)
3. [Local Development with Wrangler](#local-development-with-wrangler)
4. [Workers-Specific Patterns](#workers-specific-patterns)
5. [Testing Procedures](#testing-procedures)
6. [Debugging Techniques](#debugging-techniques)
7. [Architecture Deep-Dive](#architecture-deep-dive)
8. [Code Contribution Guidelines](#code-contribution-guidelines)
9. [Performance Considerations](#performance-considerations)
10. [Common Development Tasks](#common-development-tasks)

---

## Prerequisites

### Required Software

- **Node.js** 18.0.0 or higher (but < 23.0.0)
- **npm** or **yarn** package manager
- **Git** for version control
- **Wrangler CLI** (CloudFlare Workers CLI tool)
- **TypeScript** knowledge (intermediate level)

### Recommended Tools

- **VS Code** with extensions:
  - CloudFlare Workers
  - ESLint
  - Prettier
  - TypeScript + JavaScript
  - GitHub Copilot (optional)

- **API Testing Tools:**
  - Postman or Insomnia
  - cURL
  - MCP Inspector (`npx @modelcontextprotocol/inspector`)

- **CloudFlare Account** (Free tier sufficient for development)

### Install Wrangler

```bash
npm install -g wrangler

# Verify installation
wrangler --version
# Output: ⛅️ wrangler 4.33.1 or higher
```

---

## Getting Started

### 1. Fork and Clone Repository

```bash
# Fork on GitHub (click "Fork" button)

# Clone your fork
git clone https://github.com/YOUR_USERNAME/clickup-mcp-server.git
cd clickup-mcp-server

# Add upstream remote (for syncing)
git remote add upstream https://github.com/taazkareem/clickup-mcp-server.git
```

### 2. Install Dependencies

```bash
npm install
```

This installs:
- **@cloudflare/workers-types** - TypeScript definitions for Workers
- **hono** - Fast web framework for Workers
- **@modelcontextprotocol/sdk** - MCP protocol implementation
- **jose** - JWT library (Web Crypto compatible)
- **stripe** - Billing integration
- **esbuild** - Fast bundler for Workers
- **vitest** - Testing framework
- **typescript** - Type checking

### 3. Build Project

```bash
# Build Worker (for deployment)
npm run build:worker

# Build traditional MCP (for local testing)
npm run build
```

**Build output:**
- `dist/worker.js` - CloudFlare Workers bundle (ESM format)
- `build/` - Traditional MCP build (for stdio mode)

### 4. Environment Setup

Create `.dev.vars` file for local development:

```bash
# .dev.vars (gitignored - never commit!)
CLICKUP_CLIENT_ID=your_dev_oauth_client_id
CLICKUP_CLIENT_SECRET=your_dev_oauth_client_secret
ENCRYPTION_KEY=your_32_byte_base64_key
JWT_SECRET=your_64_byte_base64_key
ENVIRONMENT=development
ENABLE_AUDIT_LOGGING=true
ENABLE_RATE_LIMITING=true
MAX_REQUESTS_PER_MINUTE=100
```

**Generate encryption keys:**

```bash
# ENCRYPTION_KEY (32 bytes for AES-256)
openssl rand -base64 32

# JWT_SECRET (64 bytes for HS256)
openssl rand -base64 64
```

**Note:** `.dev.vars` is for local development only. Production secrets are managed via `wrangler secret` (see [DEPLOYMENT.md](DEPLOYMENT.md)).

---

## Local Development with Wrangler

### Development Modes

Wrangler provides two development modes:

| Mode | Command | Description | Use Case |
|------|---------|-------------|----------|
| **Local** | `wrangler dev --local` | Runs in local Node.js process | Fast iteration, no network |
| **Remote** | `wrangler dev --remote` | Runs in CloudFlare's dev environment | Test with real KV/R2 |

### Start Local Development Server

```bash
# Local mode (recommended for most development)
npm run dev:worker
# or
wrangler dev --env development --local
```

Output:
```
⛅️ wrangler 4.33.1
-------------------
⎔ Starting local server...
[wrangler:inf] Ready on http://localhost:8787
```

Access endpoints:
- Health: `http://localhost:8787/health`
- OAuth: `http://localhost:8787/auth/login`
- MCP: `http://localhost:8787/mcp` (requires JWT)

### Hot Reload

Wrangler automatically reloads on file changes:

1. Edit `src/worker.ts`
2. Save file
3. Wrangler detects change and rebuilds
4. Refresh browser or re-send request

**Tip:** Keep `wrangler dev` running in a dedicated terminal window.

### Remote Development (with CloudFlare KV/R2)

```bash
wrangler dev --env development --remote
```

This uses your **development environment** resources:
- Real KV namespaces
- Real R2 buckets
- Real secrets from CloudFlare

**Use remote mode when:**
- Testing KV/R2 interactions
- Debugging encryption/decryption
- Testing audit logging
- Validating OAuth flow with real ClickUp

**Note:** Remote mode requires KV namespaces and secrets to be configured (see [DEPLOYMENT.md](DEPLOYMENT.md)).

### Preview Deployment (Before Production)

```bash
# Deploy to preview environment (temporary URL)
wrangler deploy --env development --dry-run

# View what would be deployed
wrangler deploy --env development --preview
```

### Local Storage with Miniflare

For local KV/R2 simulation without deploying:

```bash
# Install Miniflare (already in devDependencies)
npm install miniflare --save-dev

# Run with Miniflare
npx miniflare --kv USER_SESSIONS --kv API_KEYS --r2 AUDIT_LOGS
```

Miniflare provides:
- Local KV storage (persisted to `.mf/kv/`)
- Local R2 storage (persisted to `.mf/r2/`)
- Fast iteration without network calls

---

## Workers-Specific Patterns

⚠️ **Critical:** CloudFlare Workers run in V8 isolates, **not Node.js**. Many Node.js APIs are unavailable.

### 1. Use Web APIs, Not Node.js APIs

```typescript
// ❌ DON'T: Node.js crypto
import crypto from 'node:crypto';
const hash = crypto.createHash('sha256');

// ✅ DO: Web Crypto API
const hash = await crypto.subtle.digest(
  'SHA-256',
  new TextEncoder().encode(data)
);
```

```typescript
// ❌ DON'T: Node.js Buffer
const buffer = Buffer.from('data', 'utf-8');

// ✅ DO: Uint8Array and TextEncoder
const buffer = new TextEncoder().encode('data');
```

```typescript
// ❌ DON'T: Node.js fs module
import fs from 'node:fs';
fs.readFileSync('file.txt');

// ✅ DO: KV or R2 storage
const data = await env.KV_NAMESPACE.get('file.txt');
const object = await env.R2_BUCKET.get('file.txt');
```

### 2. Use Hono Framework (Not Express)

```typescript
// ❌ DON'T: Express patterns
app.get('/endpoint', (req, res) => {
  res.json({ message: 'Hello' });
});

// ✅ DO: Hono patterns
app.get('/endpoint', async (c) => {
  return c.json({ message: 'Hello' });
});
```

**Key Hono patterns:**

```typescript
// Access environment variables
const apiKey = c.env.CLICKUP_API_KEY;

// Get request data
const body = await c.req.json();
const query = c.req.query('param');
const header = c.req.header('Authorization');

// Set response
return c.json({ data }, 200);
return c.text('Hello', 200);
return c.redirect('/other-path');

// Throw HTTP exceptions
throw new HTTPException(400, { message: 'Bad request' });
```

### 3. Async/Await Everywhere

Workers are async by default. Use async/await for all I/O:

```typescript
// ✅ Async KV operations
const value = await c.env.USER_SESSIONS.get(key);
await c.env.USER_SESSIONS.put(key, value, { expirationTtl: 3600 });

// ✅ Async R2 operations
const object = await c.env.AUDIT_LOGS.get('path/to/file');
await c.env.AUDIT_LOGS.put('path/to/file', data);

// ✅ Async fetch
const response = await fetch('https://api.clickup.com/v2/team');
const data = await response.json();
```

### 4. Environment Variable Access

```typescript
// ❌ DON'T: process.env (not available in Workers)
const key = process.env.API_KEY;

// ✅ DO: Context environment
const key = c.env.API_KEY;

// ✅ DO: In class constructors
class MyService {
  constructor(private env: Env) {}

  async doSomething() {
    const key = this.env.API_KEY;
  }
}
```

### 5. Request and Response Objects

Use Web standard Request/Response:

```typescript
// Request object
const request = c.req.raw; // Raw Request object
const method = request.method; // GET, POST, etc.
const url = new URL(request.url);
const headers = request.headers;

// Response object
return new Response('Hello', {
  status: 200,
  headers: {
    'Content-Type': 'text/plain',
    'X-Custom-Header': 'value'
  }
});
```

### 6. No Global State

Workers may be terminated between requests. Never rely on global state:

```typescript
// ❌ DON'T: Global state
let requestCount = 0; // Will be lost between invocations!

app.get('/count', (c) => {
  requestCount++;
  return c.json({ count: requestCount }); // Unreliable
});

// ✅ DO: Use KV for persistence
app.get('/count', async (c) => {
  const count = parseInt(await c.env.COUNTERS.get('requests') || '0');
  await c.env.COUNTERS.put('requests', (count + 1).toString());
  return c.json({ count: count + 1 });
});
```

### 7. Error Handling Patterns

```typescript
// Structured error responses
try {
  const result = await someOperation();
  return c.json({ success: true, result });
} catch (error) {
  console.error(JSON.stringify({
    level: 'error',
    message: error.message,
    stack: error.stack,
    context: {
      user_id: userId,
      request_id: requestId
    }
  }));

  return c.json({
    error: {
      code: 'internal_error',
      message: 'An error occurred',
      request_id: requestId
    }
  }, 500);
}
```

### 8. TypeScript Configuration

Workers-specific `tsconfig.json` settings:

```json
{
  "compilerOptions": {
    "target": "ES2021",
    "module": "ESNext",
    "lib": ["ES2021"],
    "types": ["@cloudflare/workers-types"],
    "moduleResolution": "bundler",
    "esModuleInterop": true
  }
}
```

### Common Pitfalls

| Pitfall | Solution |
|---------|----------|
| Using `node:*` imports | Use Web APIs instead |
| Global variables | Use KV/R2 for persistence |
| Synchronous I/O | All I/O is async in Workers |
| Large dependencies | Minimize bundle size (< 5MB) |
| Long execution time | Workers timeout after 30s (CPU time) |

---

## Testing Procedures

### Test Pyramid

```
         ╱╲
        ╱  ╲
       ╱ E2E ╲         <- End-to-end (OAuth + MCP flow)
      ╱────────╲
     ╱          ╲
    ╱ Integration ╲    <- Service interactions
   ╱──────────────╲
  ╱                ╲
 ╱  Unit Tests      ╲  <- Individual functions
╱────────────────────╲
```

### 1. Unit Tests (Vitest)

Run unit tests:

```bash
npm test
```

Watch mode (auto-rerun on changes):

```bash
npm run test:watch
```

Coverage report:

```bash
npm run test:coverage
```

**Writing unit tests:**

```typescript
// tests/services/encryption.test.ts
import { describe, it, expect } from 'vitest';
import { EncryptionService } from '../src/security/encryption';

describe('EncryptionService', () => {
  it('should encrypt and decrypt data correctly', async () => {
    const encryptionKey = 'test_key_32_bytes_base64_encoded';
    const service = new EncryptionService(encryptionKey);

    const plaintext = 'sensitive data';
    const encrypted = await service.encrypt(plaintext);
    const decrypted = await service.decrypt(encrypted);

    expect(decrypted).toBe(plaintext);
    expect(encrypted).not.toBe(plaintext);
  });

  it('should throw error for invalid encrypted data', async () => {
    const service = new EncryptionService('test_key');

    await expect(
      service.decrypt('invalid_base64')
    ).rejects.toThrow();
  });
});
```

### 2. Comprehensive Tool Testing

**test-all-tools-ultrathink.js** dynamically tests all 72 MCP tools:

```bash
# Basic run (uses mock data)
node test-all-tools-ultrathink.js
```

**With real ClickUp API:**

```bash
# Set environment variables
export CLICKUP_API_KEY=pk_your_real_api_key
export CLICKUP_TEAM_ID=your_team_id

# Run comprehensive testing
node test-all-tools-ultrathink.js
```

**What it tests:**
- ✅ Tool discovery (`tools/list` method)
- ✅ Tool invocation with valid parameters
- ✅ Edge cases (missing params, invalid types)
- ✅ Error handling
- ✅ Performance (execution time per tool)
- ✅ Coverage (% of tools tested)

**Output:**

```
🚀 Starting ClickUp MCP Server for testing...
✅ Server started successfully

📊 Tool Discovery
   Found 72 tools across 12 categories

🧪 Testing Tools
   [1/72] clickup_workspace_hierarchy ... ✅ PASS (145ms)
   [2/72] create_task ... ✅ PASS (234ms)
   [3/72] update_task ... ✅ PASS (189ms)
   ...
   [72/72] clickup_project_get_templates ... ✅ PASS (156ms)

📈 Results
   Total: 72
   Passed: 72 (100%)
   Failed: 0
   Average: 187ms per tool

✅ All tests passed!
```

**Analyze results:**

```bash
# Results saved to JSON
cat tool-analysis-*.json | jq '.summary'
```

**CI/CD Integration:**

```yaml
# .github/workflows/test.yml
- name: Test All Tools
  run: |
    node test-all-tools-ultrathink.js
    if [ $? -ne 0 ]; then
      echo "Tool tests failed"
      exit 1
    fi
```

### 3. Integration Testing

Test service interactions:

```typescript
// tests/integration/oauth-flow.test.ts
import { describe, it, expect } from 'vitest';

describe('OAuth Flow', () => {
  it('should complete full OAuth flow', async () => {
    // 1. Initiate OAuth
    const response1 = await fetch('http://localhost:8787/auth/login');
    expect(response1.status).toBe(302);

    // 2. Mock ClickUp callback
    const code = 'mock_auth_code';
    const state = 'mock_state';

    // 3. Exchange code for token
    const response2 = await fetch(
      `http://localhost:8787/auth/callback?code=${code}&state=${state}`
    );

    const data = await response2.json();
    expect(data).toHaveProperty('jwt_token');
    expect(data.jwt_token).toBeTruthy();
  });
});
```

### 4. MCP Protocol Testing

Use MCP Inspector to test tools interactively:

```bash
# Build project first
npm run build

# Start MCP Inspector
npx @modelcontextprotocol/inspector build/index.js
```

MCP Inspector provides:
- Visual tool explorer
- Parameter input forms
- Real-time request/response viewer
- Error inspection

### 5. Load Testing (Optional)

Test performance under load:

```bash
# Install k6 (load testing tool)
brew install k6  # macOS
# or: apt-get install k6  # Linux

# Run load test
k6 run tests/load/mcp-load-test.js
```

`tests/load/mcp-load-test.js`:

```javascript
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 10, // 10 virtual users
  duration: '30s',
};

export default function () {
  const res = http.post(
    'https://clickup-mcp-dev.workers.dev/mcp',
    JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
      params: {}
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_JWT_TOKEN'
      }
    }
  );

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

### Testing Best Practices

1. ✅ **Run tests before committing** - Always run `npm test` and `node test-all-tools-ultrathink.js`
2. ✅ **Use mock data for unit tests** - No real API calls in unit tests
3. ✅ **Dedicated test workspace** - Use separate ClickUp workspace for integration tests
4. ✅ **Never test with production credentials** - Use development OAuth app and API keys
5. ✅ **CI/CD automation** - All tests run automatically on PR
6. ✅ **Coverage requirements** - Maintain > 80% code coverage

---

## Debugging Techniques

### 1. Console Logging

**Structured logging pattern:**

```typescript
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  level: 'info',
  message: 'Request completed',
  context: {
    user_id: userId,
    request_id: requestId,
    duration_ms: durationMs,
    status: 200
  }
}));
```

**Log levels:**

```typescript
// Development: verbose logging
if (c.env.ENVIRONMENT === 'development') {
  console.log('Debug:', { variable1, variable2 });
}

// Production: structured JSON only
console.error(JSON.stringify({
  level: 'error',
  error: error.message,
  stack: error.stack,
  context: { user_id, request_id }
}));
```

### 2. Wrangler Tail (Real-Time Logs)

Stream logs from running Worker:

```bash
# Local development
wrangler dev --local
# In another terminal:
wrangler tail --local

# Remote development
wrangler tail --env development

# Production (read-only)
wrangler tail --env production
```

**Filter logs:**

```bash
# Only errors
wrangler tail --env production --level error

# Only specific status codes
wrangler tail --env production --status 500

# Combine filters
wrangler tail --env production --level error --status 500

# Search for text
wrangler tail --env production | grep "user_123"
```

### 3. Chrome DevTools Debugging

**Step 1:** Start Wrangler with inspector:

```bash
wrangler dev --local --inspect
```

**Step 2:** Open Chrome DevTools:

1. Open `chrome://inspect` in Chrome
2. Click "inspect" under your Worker
3. DevTools opens

**Set breakpoints:**

1. Navigate to Sources tab
2. Find your TypeScript file
3. Click line number to set breakpoint
4. Send request to trigger breakpoint

**Inspect variables:**

- Hover over variables to see values
- Use Console to evaluate expressions
- Step through code with F10 (step over) and F11 (step into)

### 4. Request Tracing

Add unique request IDs to track requests:

```typescript
// Middleware to add request ID
app.use('*', async (c, next) => {
  const requestId = crypto.randomUUID();
  c.set('requestId', requestId);

  console.log(JSON.stringify({
    level: 'info',
    message: 'Incoming request',
    request_id: requestId,
    method: c.req.method,
    path: c.req.path
  }));

  await next();
});
```

**Use in error handling:**

```typescript
catch (error) {
  const requestId = c.get('requestId');
  console.error(JSON.stringify({
    level: 'error',
    request_id: requestId,
    error: error.message,
    stack: error.stack
  }));
}
```

### 5. Common Debugging Scenarios

#### OAuth Flow Issues

**Problem:** "redirect_uri_mismatch" error

**Debug:**
```typescript
console.log('OAuth config:', {
  client_id: c.env.CLICKUP_CLIENT_ID,
  redirect_uri: 'https://clickup-mcp-dev.workers.dev/auth/callback'
});
```

Check ClickUp OAuth app settings match exactly.

#### Tool Invocation Errors

**Problem:** "Tool not found" error

**Debug:**
```typescript
// List all registered tools
const tools = await mcpServer.listTools();
console.log('Registered tools:', tools.map(t => t.name));
```

Verify tool name matches exactly (case-sensitive).

#### Rate Limiting Problems

**Problem:** Immediate 429 errors

**Debug:**
```bash
# Inspect rate limit data in KV
wrangler kv key list --namespace-id="YOUR_RATE_LIMITS_ID"

# Get specific user's rate limit
wrangler kv key get "ratelimit:user123:1706436660" --namespace-id="YOUR_RATE_LIMITS_ID"
```

Clear stale data if needed.

#### Encryption Failures

**Problem:** "Decryption failed" error

**Debug:**
```typescript
console.log('Encryption config:', {
  key_length: c.env.ENCRYPTION_KEY?.length,
  key_exists: !!c.env.ENCRYPTION_KEY
});
```

Verify `ENCRYPTION_KEY` is set and is 32-byte base64 string.

#### JWT Token Issues

**Problem:** "Invalid token" error

**Debug:**
```typescript
import { jwtVerify } from 'jose';

try {
  const { payload } = await jwtVerify(
    token,
    new TextEncoder().encode(c.env.JWT_SECRET)
  );
  console.log('Token payload:', payload);
} catch (error) {
  console.error('Token verification failed:', error.message);
}
```

Check token expiry, signature, and JWT_SECRET.

### 6. Debugging Tools

| Tool | Purpose | Usage |
|------|---------|-------|
| **Wrangler Tail** | Real-time log streaming | `wrangler tail` |
| **Chrome DevTools** | Step debugging | `chrome://inspect` |
| **MCP Inspector** | Test MCP protocol | `npx @modelcontextprotocol/inspector` |
| **Postman** | API testing | Import OpenAPI spec |
| **cURL** | Quick endpoint testing | `curl -X POST ...` |
| **jq** | JSON processing | `wrangler tail \| jq` |

---

## Architecture Deep-Dive

### Code Organization

```
src/
├── worker.ts                   # Entry point - Hono app
├── mcp-worker-server.ts        # MCP protocol handler
├── auth/
│   └── oauth-service.ts        # OAuth 2.0 flow implementation
├── services/
│   ├── user-service.ts         # Multi-tenant user management
│   └── clickup/                # ClickUp API services
│       ├── base.ts             # Base service class
│       ├── workspace.ts        # Workspace operations
│       ├── task/               # Task services (composition)
│       │   ├── index.ts        # Main TaskService
│       │   ├── core.ts         # CRUD operations
│       │   ├── search.ts       # Search and filtering
│       │   ├── comments.ts     # Comment management
│       │   └── attachments.ts  # File handling
│       ├── list.ts             # List operations
│       ├── folder.ts           # Folder operations
│       └── space.ts            # Space operations
├── security/
│   ├── encryption.ts           # AES-256-GCM encryption
│   └── audit.ts                # Audit logging to R2
├── middleware/
│   └── rate-limit.ts           # Rate limiting
├── tools/
│   ├── index.ts                # Tool exports
│   ├── workspace.ts            # Workspace tools
│   ├── task/                   # Task tools
│   ├── list.ts                 # List tools
│   └── ...                     # Other tool categories
└── utils/
    └── date-utils.ts           # Natural language date parsing
```

### Architectural Layers

```
┌─────────────────────────────────────────────────────┐
│                  Client (MCP Client)                 │
└─────────────────┬───────────────────────────────────┘
                  │ HTTP Streamable / SSE / WebSocket
                  ▼
┌─────────────────────────────────────────────────────┐
│            Entry Point (src/worker.ts)               │
│  - Hono app initialization                           │
│  - Route definitions                                 │
│  - CORS configuration                                │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│                 Middleware Layer                     │
│  - CORS handling                                     │
│  - JWT authentication                                │
│  - Rate limiting                                     │
│  - Request tracing                                   │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│              MCP Protocol Handler                    │
│           (src/mcp-worker-server.ts)                 │
│  - tools/list - List available tools                 │
│  - tools/call - Invoke specific tool                 │
│  - JSON-RPC 2.0 protocol                             │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│                   Tools Layer                        │
│           (src/tools/*.ts)                           │
│  - 72 tools across 12 categories                     │
│  - Parameter validation (Zod schemas)                │
│  - Delegates to Services                             │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│                 Services Layer                       │
│          (src/services/clickup/*.ts)                 │
│  - Business logic                                    │
│  - ClickUp API communication                         │
│  - Error handling and retries                        │
│  - Rate limiting                                     │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│               Security Layer                         │
│  - Encryption (AES-256-GCM)                          │
│  - Audit logging (R2)                                │
│  - JWT signing/verification                          │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│                Storage Layer                         │
│  - KV Namespaces (6 per environment)                 │
│  - R2 Buckets (audit logs)                           │
│  - Encrypted persistence                             │
└─────────────────────────────────────────────────────┘
```

### Key Design Patterns

#### 1. Service Composition (TaskService)

TaskService uses composition instead of inheritance:

```typescript
// src/services/clickup/task/index.ts
export class TaskService extends BaseClickUpService {
  private core: TaskServiceCore;
  private search: TaskServiceSearch;
  private comments: TaskServiceComments;
  private attachments: TaskServiceAttachments;

  constructor(apiKey: string, teamId: string) {
    super(apiKey, teamId);
    this.core = new TaskServiceCore(apiKey, teamId);
    this.search = new TaskServiceSearch(apiKey, teamId);
    this.comments = new TaskServiceComments(apiKey, teamId);
    this.attachments = new TaskServiceAttachments(apiKey, teamId);
  }

  // Delegate to composed services
  async create(data: CreateTaskData) {
    return this.core.create(data);
  }

  async search(query: string) {
    return this.search.search(query);
  }
}
```

**Benefits:**
- Separation of concerns
- Each service has single responsibility
- Easy to test individual services
- Clear code organization

#### 2. Dependency Injection

Services receive dependencies via constructor:

```typescript
// Dependency injection pattern
class UserService {
  constructor(
    private env: Env,
    private encryptionService: EncryptionService
  ) {}

  async storeApiKey(userId: string, apiKey: string) {
    // Encrypt using injected service
    const encrypted = await this.encryptionService.encrypt(apiKey);
    await this.env.API_KEYS.put(`apikey:${userId}`, encrypted);
  }
}

// Usage in worker.ts
const encryptionService = new EncryptionService(c.env.ENCRYPTION_KEY);
const userService = new UserService(c.env, encryptionService);
```

#### 3. Tools Delegate to Services

Tools handle MCP protocol, services handle business logic:

```typescript
// src/tools/task.ts
{
  name: 'create_task',
  description: 'Create a new ClickUp task',
  inputSchema: CreateTaskSchema,
  handler: async (args, context) => {
    // Tool validates input and delegates to service
    const taskService = new TaskService(
      context.apiKey,
      context.teamId
    );

    const task = await taskService.create({
      list_id: args.list_id,
      name: args.name,
      description: args.description,
      // ...
    });

    return { success: true, task };
  }
}
```

#### 4. Multi-Tenancy with User Isolation

Each user's data is completely isolated:

```typescript
// User data stored with user_id prefix
await env.USER_SESSIONS.put(`user:${userId}`, sessionData);
await env.API_KEYS.put(`apikey:${userId}`, encryptedKey);
await env.TOOL_CONFIGS.put(`tools:${userId}`, toolConfig);

// Rate limiting per user
await env.RATE_LIMITS.put(`ratelimit:${userId}:${timestamp}`, count);
```

### Extension Points

#### Adding New Tools

1. Create tool definition in `src/tools/`:

```typescript
// src/tools/my-new-tool.ts
import { z } from 'zod';

export const MyNewToolSchema = z.object({
  param1: z.string(),
  param2: z.number().optional()
});

export const myNewTool = {
  name: 'clickup_my_new_tool',
  description: 'Does something useful',
  inputSchema: MyNewToolSchema,
  handler: async (args, context) => {
    // Implementation
  }
};
```

2. Export from `src/tools/index.ts`:

```typescript
export * from './my-new-tool.js';
```

3. Register in MCP server (automatic if exported).

#### Adding New Services

1. Create service in `src/services/clickup/`:

```typescript
// src/services/clickup/my-service.ts
import { BaseClickUpService } from './base.js';

export class MyService extends BaseClickUpService {
  async doSomething() {
    return this.makeRequest('/api/endpoint');
  }
}
```

2. Use in tools or other services.

#### Adding Custom Middleware

1. Create middleware in `src/middleware/`:

```typescript
// src/middleware/my-middleware.ts
export const myMiddleware = async (c, next) => {
  // Before request
  console.log('Before request');

  await next();

  // After request
  console.log('After request');
};
```

2. Register in `src/worker.ts`:

```typescript
import { myMiddleware } from './middleware/my-middleware.js';
app.use('*', myMiddleware);
```

---

## Code Contribution Guidelines

### Git Workflow

```
1. Fork repository on GitHub
                ↓
2. Clone your fork locally
                ↓
3. Create feature branch
                ↓
4. Make changes + commit
                ↓
5. Run tests locally
                ↓
6. Push to your fork
                ↓
7. Create Pull Request
                ↓
8. Address code review feedback
                ↓
9. Maintainer merges PR
```

### 1. Fork and Clone

```bash
# Fork on GitHub (click "Fork" button)

# Clone your fork
git clone https://github.com/YOUR_USERNAME/clickup-mcp-server.git
cd clickup-mcp-server

# Add upstream remote
git remote add upstream https://github.com/taazkareem/clickup-mcp-server.git

# Verify remotes
git remote -v
```

### 2. Create Feature Branch

```bash
# Update your fork
git fetch upstream
git checkout main
git merge upstream/main

# Create feature branch
git checkout -b feature/my-new-tool

# Or for bug fixes
git checkout -b fix/issue-description
```

**Branch naming:**
- `feature/tool-name` - New features or tools
- `fix/issue-description` - Bug fixes
- `docs/topic` - Documentation changes
- `refactor/component` - Code refactoring

### 3. Make Changes

Follow existing code patterns:

```typescript
// Use TypeScript with strict types
function processData(input: string): ProcessedData {
  // Implementation
}

// Add JSDoc comments for public APIs
/**
 * Creates a new ClickUp task.
 *
 * @param listId - The list ID where task will be created
 * @param taskData - Task details
 * @returns Created task object
 */
async function createTask(
  listId: string,
  taskData: CreateTaskData
): Promise<Task> {
  // Implementation
}
```

### 4. Commit Changes

Use **Conventional Commits** format:

```bash
git add .
git commit -m "feat: add clickup_custom_field_bulk_update tool"
```

**Commit types:**
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `refactor:` - Code refactoring (no functionality change)
- `test:` - Test additions or changes
- `chore:` - Maintenance tasks (dependencies, build)
- `perf:` - Performance improvements
- `style:` - Code style changes (formatting)

**Good commit messages:**

```
feat: add clickup_custom_field_bulk_update tool

- Implements bulk update for custom fields
- Supports up to 100 tasks per request
- Includes rate limiting and error handling

fix: handle rate limit errors in TaskService

- Implement exponential backoff
- Retry up to 3 times
- Add test coverage

docs: update TOOL_REFERENCE.md with new examples

- Add bulk operation examples
- Include error handling patterns
- Update parameter reference
```

### 5. Run Tests

Before pushing, ensure all tests pass:

```bash
# Unit tests
npm test

# Build check
npm run build:worker

# Comprehensive tool testing
node test-all-tools-ultrathink.js

# Linting
npm run lint  # (if configured)

# Type check
npx tsc --noEmit
```

### 6. Push and Create PR

```bash
# Push to your fork
git push origin feature/my-new-tool
```

On GitHub:
1. Go to your fork
2. Click "Compare & pull request"
3. Fill out PR template
4. Click "Create pull request"

**Pull Request Template:**

```markdown
## Description
Brief description of changes (2-3 sentences)

## Type of Change
- [ ] New feature (non-breaking change adding functionality)
- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] Documentation update
- [ ] Refactoring (code improvement without functionality change)
- [ ] Breaking change (fix or feature causing existing functionality to change)

## How Has This Been Tested?
- [ ] Unit tests pass (`npm test`)
- [ ] Tool testing passes (`node test-all-tools-ultrathink.js`)
- [ ] Manual testing in development environment
- [ ] Integration testing with real ClickUp API

## Checklist
- [ ] My code follows the project's code style
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally
- [ ] Any dependent changes have been merged and published

## Screenshots (if applicable)
```

### 7. Code Review

Maintainers will review your PR. Be responsive to feedback:

```bash
# Make requested changes
git add .
git commit -m "refactor: address code review feedback"
git push origin feature/my-new-tool
```

**Common review feedback:**
- Add more tests
- Improve error handling
- Add documentation
- Follow naming conventions
- Simplify complex logic

### Code Review Checklist

Maintainers check:

- ✅ **Tests pass** - All tests must pass
- ✅ **Code quality** - Follows existing patterns
- ✅ **Documentation** - Public APIs documented
- ✅ **No secrets** - No hardcoded credentials
- ✅ **Error handling** - Graceful error handling
- ✅ **Security** - No security vulnerabilities
- ✅ **Performance** - No performance regressions

### 8. Merge

Once approved, maintainers merge your PR:

```bash
# Update your local main branch
git checkout main
git fetch upstream
git merge upstream/main

# Delete feature branch
git branch -d feature/my-new-tool
git push origin --delete feature/my-new-tool
```

---

## Performance Considerations

### Workers Execution Limits

CloudFlare Workers have strict limits:

| Limit | Free Plan | Paid Plan |
|-------|-----------|-----------|
| **CPU Time** | 10ms | 30s |
| **Memory** | 128 MB | 128 MB |
| **Concurrent Requests** | 1000 | No limit |
| **Request Duration** | 30s | 30s |
| **Subrequest Limit** | 50 | 1000 |

### Optimization Strategies

#### 1. Minimize Bundle Size

```bash
# Check bundle size
npm run build:worker
ls -lh dist/worker.js

# Target: < 1 MB (ideally < 500 KB)
```

**Techniques:**
- Tree-shaking (remove unused code)
- Avoid large dependencies
- Use dynamic imports for optional features
- Externalize Node.js dependencies

#### 2. Efficient KV Access

```typescript
// ❌ SLOW: Multiple sequential reads
const value1 = await env.KV.get('key1');
const value2 = await env.KV.get('key2');
const value3 = await env.KV.get('key3');

// ✅ FAST: Parallel reads
const [value1, value2, value3] = await Promise.all([
  env.KV.get('key1'),
  env.KV.get('key2'),
  env.KV.get('key3')
]);
```

#### 3. Cache Expensive Operations

```typescript
// Cache ClickUp workspace hierarchy (rarely changes)
const cacheKey = `workspace:${teamId}:hierarchy`;
let hierarchy = await env.CACHE.get(cacheKey);

if (!hierarchy) {
  hierarchy = await clickup.getWorkspaceHierarchy();
  // Cache for 1 hour
  await env.CACHE.put(cacheKey, JSON.stringify(hierarchy), {
    expirationTtl: 3600
  });
}
```

#### 4. Batch ClickUp API Calls

```typescript
// ❌ SLOW: One request per task
for (const taskId of taskIds) {
  await clickup.getTask(taskId);
}

// ✅ FAST: Use bulk endpoint
await clickup.getBulkTasks(taskIds);
```

#### 5. Streaming Responses

For large responses, use streaming:

```typescript
// Stream large response
return new Response(
  new ReadableStream({
    async start(controller) {
      for (const chunk of largeData) {
        controller.enqueue(
          new TextEncoder().encode(JSON.stringify(chunk))
        );
      }
      controller.close();
    }
  }),
  {
    headers: { 'Content-Type': 'application/json' }
  }
);
```

### Monitoring Performance

```typescript
// Track execution time
const start = Date.now();
const result = await expensiveOperation();
const duration = Date.now() - start;

console.log(JSON.stringify({
  level: 'info',
  message: 'Operation completed',
  duration_ms: duration,
  operation: 'expensive_operation'
}));

// Alert if slow
if (duration > 1000) {
  console.warn('Slow operation detected:', duration);
}
```

---

## Common Development Tasks

### Adding a New Tool

```bash
# 1. Create tool file
touch src/tools/my-new-tool.ts

# 2. Implement tool
cat > src/tools/my-new-tool.ts << 'EOF'
import { z } from 'zod';

export const MyNewToolSchema = z.object({
  param1: z.string(),
  param2: z.number().optional()
});

export const myNewTool = {
  name: 'clickup_my_new_tool',
  description: 'Does something useful',
  inputSchema: MyNewToolSchema,
  handler: async (args, context) => {
    // Implementation
    return { success: true };
  }
};
EOF

# 3. Export from index
echo "export * from './my-new-tool.js';" >> src/tools/index.ts

# 4. Test
node test-all-tools-ultrathink.js

# 5. Update documentation
echo "New tool documentation" >> docs/TOOL_REFERENCE.md

# 6. Commit
git add .
git commit -m "feat: add clickup_my_new_tool"
```

### Updating Dependencies

```bash
# Check for outdated dependencies
npm outdated

# Update specific package
npm install hono@latest

# Update all dependencies
npm update

# Audit for vulnerabilities
npm audit
npm audit fix

# Test after updates
npm test
node test-all-tools-ultrathink.js
```

### Debugging Production Issues

```bash
# 1. Check production logs
wrangler tail --env production --level error

# 2. Check CloudFlare dashboard
# Visit: https://dash.cloudflare.com → Workers → clickup-mcp

# 3. Test specific endpoint
curl https://clickup-mcp.workers.dev/health

# 4. If needed, rollback
wrangler rollback --env production

# 5. Investigate locally
wrangler dev --env production --remote

# 6. Fix issue and deploy
npm run deploy:production
```

---

## Additional Resources

**Official Documentation:**
- [CloudFlare Workers](https://developers.cloudflare.com/workers/)
- [Hono Framework](https://hono.dev)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [ClickUp API](https://clickup.com/api)

**Internal Documentation:**
- [DEPLOYMENT.md](DEPLOYMENT.md) - Production deployment
- [API_REFERENCE.md](API_REFERENCE.md) - API endpoints
- [TOOL_REFERENCE.md](TOOL_REFERENCE.md) - All 72 tools
- [SECURITY.md](SECURITY.md) - Security architecture
- [AUTHENTICATION.md](AUTHENTICATION.md) - OAuth flow

**Community:**
- GitHub Issues: [Report bugs or request features](https://github.com/taazkareem/clickup-mcp-server/issues)
- Discussions: [Ask questions](https://github.com/taazkareem/clickup-mcp-server/discussions)

---

*Last Updated: 2025-10-28*
*Version: 0.8.5*
