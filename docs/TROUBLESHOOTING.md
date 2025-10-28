# Troubleshooting Guide & FAQ

Comprehensive guide for diagnosing and resolving common issues with ClickUp MCP Server.

---

## Table of Contents

1. [Quick Diagnostics](#quick-diagnostics)
2. [OAuth Authentication Issues](#oauth-authentication-issues)
3. [JWT Token Problems](#jwt-token-problems)
4. [Rate Limiting Errors](#rate-limiting-errors)
5. [MCP Protocol Issues](#mcp-protocol-issues)
6. [Deployment Issues](#deployment-issues)
7. [Performance Issues](#performance-issues)
8. [Data & Storage Issues](#data--storage-issues)
9. [Frequently Asked Questions](#frequently-asked-questions)
10. [Getting Help](#getting-help)

---

## Quick Diagnostics

Before diving into specific issues, run these quick diagnostic checks:

### 1. Health Check

```bash
curl https://clickup-mcp.workers.dev/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-28T10:30:15.000Z",
  "environment": "production",
  "version": "1.0.0"
}
```

**If health check fails:**
- ❌ `Connection refused` → Service is down
- ❌ `502 Bad Gateway` → CloudFlare Workers error
- ❌ `503 Service Unavailable` → Service overloaded
- ❌ `DNS resolution failed` → Wrong URL or DNS issue

### 2. Version Check

```bash
curl https://clickup-mcp.workers.dev/health | jq '.version'
```

Ensure you're running the latest version (check [GitHub releases](https://github.com/taazkareem/clickup-mcp-server/releases)).

### 3. OAuth Availability

```bash
curl -I https://clickup-mcp.workers.dev/auth/login
```

**Expected:** `HTTP/1.1 302 Found` (redirect to ClickUp)

### 4. MCP Endpoint Test

```bash
curl -X POST https://clickup-mcp.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

**Expected:** `401 Unauthorized` (auth required - this is correct!)

---

## OAuth Authentication Issues

### Issue: "redirect_uri_mismatch" Error

**Error message:**
```json
{
  "error": "redirect_uri_mismatch",
  "error_description": "The redirect URI provided does not match a registered redirect URI"
}
```

**Cause:** ClickUp OAuth app redirect URI doesn't match Worker URL.

**Solution:**

1. Go to ClickUp Settings → Apps → OAuth Applications
2. Find your OAuth app
3. Verify redirect URI **exactly** matches:
   - Development: `https://clickup-mcp-dev.workers.dev/auth/callback`
   - Production: `https://clickup-mcp.workers.dev/auth/callback`

**Common mistakes:**
- ❌ Trailing slash: `https://clickup-mcp.workers.dev/auth/callback/`
- ❌ HTTP instead of HTTPS: `http://clickup-mcp.workers.dev/auth/callback`
- ❌ Wrong environment: Using dev URL with production OAuth app

**Verify configuration:**

```bash
# Check OAuth config in wrangler.toml
grep -A 5 "CLICKUP_CLIENT_ID" wrangler.toml

# Check secrets are set
wrangler secret list --env production
```

### Issue: "Invalid or Expired State" Error

**Error message:**
```json
{
  "error": "invalid_state",
  "message": "Invalid or expired state parameter"
}
```

**Cause:** OAuth state parameter missing or expired (10-minute lifetime).

**Reasons:**
1. Took too long to authorize (> 10 minutes)
2. State stored in wrong KV namespace
3. KV namespace not accessible

**Solution:**

1. **Try again immediately:**
   ```bash
   # Start fresh OAuth flow
   curl https://clickup-mcp.workers.dev/auth/login
   ```

2. **Complete authorization within 10 minutes**

3. **Verify KV namespace configuration:**
   ```bash
   # Check USER_SESSIONS namespace exists
   wrangler kv namespace list
   ```

4. **Check Worker logs:**
   ```bash
   wrangler tail --env production
   ```

### Issue: "Access Denied" After Authorization

**Error:** User clicks "Authorize" but gets "Access denied"

**Causes:**
1. Insufficient permissions granted
2. ClickUp account doesn't have access to workspace
3. OAuth scopes not approved

**Solution:**

1. **Re-authorize with all scopes:**
   - Visit `/auth/login` again
   - Click "Authorize" and approve **all** scopes

2. **Verify workspace access:**
   - Log into ClickUp
   - Confirm you have access to the workspace
   - Check workspace permissions (must be member or admin)

3. **Check required scopes:**
   Required OAuth scopes:
   - `user:read`, `team:read`
   - `task:read`, `task:write`
   - `list:read`, `list:write`
   - `folder:read`, `folder:write`
   - `space:read`, `space:write`
   - `time_tracking:read`, `time_tracking:write` (premium)
   - `custom_field:read`, `custom_field:write` (premium)

4. **Create new OAuth app if needed:**
   Sometimes OAuth apps get corrupted. Create a fresh one:
   - ClickUp Settings → Apps → Create OAuth Application
   - Use new Client ID and Secret
   - Update CloudFlare secrets

### Issue: "Failed to Exchange Code for Token"

**Error in logs:**
```
Failed to exchange authorization code for access token
```

**Causes:**
1. `CLICKUP_CLIENT_SECRET` not set or incorrect
2. Authorization code already used (can only use once)
3. Network timeout

**Solution:**

1. **Verify Client Secret is set:**
   ```bash
   wrangler secret list --env production | grep CLICKUP_CLIENT_SECRET
   ```

2. **Re-set Client Secret if needed:**
   ```bash
   echo "YOUR_CLIENT_SECRET" | wrangler secret put CLICKUP_CLIENT_SECRET --env production
   ```

3. **Start fresh OAuth flow:**
   - Don't reuse authorization codes
   - Complete flow without interruption

4. **Check CloudFlare logs:**
   ```bash
   wrangler tail --env production --level error
   ```

---

## JWT Token Problems

### Issue: "Unauthorized" (401) on MCP Requests

**Error:**
```json
{
  "error": {
    "code": "unauthorized",
    "message": "Invalid or missing JWT token"
  }
}
```

**Causes:**
1. JWT token expired (24-hour lifetime)
2. JWT token not included in request
3. JWT token malformed
4. `JWT_SECRET` changed after token was issued

**Solution:**

1. **Check token is included in Authorization header:**
   ```bash
   curl -X POST https://clickup-mcp.workers.dev/mcp \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
   ```

2. **Verify token format:**
   - Must start with `Bearer `
   - Token format: `eyJhbGc...` (three base64 parts separated by dots)

3. **Check token expiry:**
   Decode token at [jwt.io](https://jwt.io):
   ```json
   {
     "user_id": "user123",
     "team_id": "team456",
     "tier": "free",
     "exp": 1706523600  // Unix timestamp
   }
   ```

   If `exp` < current time, token is expired.

4. **Get new token:**
   ```bash
   # Re-authenticate via OAuth
   curl https://clickup-mcp.workers.dev/auth/login
   # Complete flow to get new JWT
   ```

5. **Use refresh endpoint (if expired < 7 days ago):**
   ```bash
   curl -X POST https://clickup-mcp.workers.dev/auth/refresh \
     -H "Authorization: Bearer YOUR_EXPIRED_TOKEN" \
     -H "Content-Type: application/json"
   ```

### Issue: "Token Signature Verification Failed"

**Error in logs:**
```
JWTInvalid: signature verification failed
```

**Cause:** `JWT_SECRET` changed after token was issued.

**Solution:**

1. **Don't change JWT_SECRET in production** without migrating users
2. **If JWT_SECRET was changed:**
   - All existing tokens are now invalid
   - Users must re-authenticate via OAuth
   - Notify users of the change

3. **Verify JWT_SECRET is set correctly:**
   ```bash
   wrangler secret list --env production | grep JWT_SECRET
   ```

### Issue: Session Data Not Found

**Error:**
```json
{
  "error": {
    "code": "session_not_found",
    "message": "User session not found or expired"
  }
}
```

**Cause:** Session data missing from `USER_SESSIONS` KV namespace.

**Reasons:**
1. Session expired (24 hours)
2. KV namespace was cleared
3. Wrong KV namespace ID in wrangler.toml

**Solution:**

1. **Re-authenticate:**
   ```bash
   curl https://clickup-mcp.workers.dev/auth/login
   ```

2. **Verify KV namespace configuration:**
   ```bash
   # Check namespace exists and has correct ID
   wrangler kv namespace list
   ```

3. **Check wrangler.toml:**
   ```toml
   [env.production]
   kv_namespaces = [
     { binding = "USER_SESSIONS", id = "correct_namespace_id" }
   ]
   ```

---

## Rate Limiting Errors

### Issue: "Rate Limit Exceeded" (429)

**Error:**
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

**Cause:** Exceeded requests per minute limit:
- Free tier: 100 requests/minute
- Premium tier: 500 requests/minute

**Solution:**

1. **Wait for rate limit to reset:**
   ```bash
   # Wait time shown in response
   sleep 45
   ```

2. **Check rate limit headers:**
   ```bash
   curl -I https://clickup-mcp.workers.dev/mcp \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

   Headers:
   ```
   X-RateLimit-Limit: 100
   X-RateLimit-Remaining: 95
   X-RateLimit-Reset: 1706436660
   X-RateLimit-Window: 60
   ```

3. **Implement exponential backoff:**
   ```typescript
   async function callWithRetry(fn, maxRetries = 3) {
     for (let i = 0; i < maxRetries; i++) {
       try {
         return await fn();
       } catch (error) {
         if (error.code === 'rate_limited' && i < maxRetries - 1) {
           const waitTime = error.details?.reset_in_seconds || 60;
           await sleep(waitTime * 1000);
           continue;
         }
         throw error;
       }
     }
   }
   ```

4. **Upgrade to premium tier:**
   ```bash
   curl -X POST https://clickup-mcp.workers.dev/stripe/create-checkout \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

   Premium tier: 500 requests/minute ($4.99/month)

### Issue: Rate Limit Never Resets

**Symptom:** Getting 429 errors continuously, even after waiting.

**Cause:** Stale rate limit data in `RATE_LIMITS` KV namespace.

**Solution:**

1. **Clear rate limit data:**
   ```bash
   # List rate limit keys for your user
   wrangler kv key list --namespace-id="YOUR_RATE_LIMITS_ID" \
     --prefix="ratelimit:your_user_id"

   # Delete all rate limit keys
   wrangler kv key list --namespace-id="YOUR_RATE_LIMITS_ID" \
     --prefix="ratelimit:your_user_id" | \
     jq -r '.[].name' | \
     xargs -I {} wrangler kv key delete {} --namespace-id="YOUR_RATE_LIMITS_ID"
   ```

2. **Wait 1 minute for rate limit window to expire**

3. **Try request again**

### Issue: Immediate 429 After Deployment

**Symptom:** Getting rate limited immediately after deploying new version.

**Cause:** Rate limit state persisted from previous version.

**Solution:**

1. **Wait for rate limit window (60 seconds)**

2. **Clear rate limits if urgent:**
   ```bash
   # Clear all rate limits (use with caution!)
   wrangler kv key list --namespace-id="YOUR_RATE_LIMITS_ID" | \
     jq -r '.[].name' | \
     xargs -I {} wrangler kv key delete {} --namespace-id="YOUR_RATE_LIMITS_ID"
   ```

3. **Configure rate limit reset on deployment:**
   Add to CI/CD pipeline:
   ```yaml
   - name: Clear Rate Limits After Deployment
     run: |
       # Clear rate limits for test users
       wrangler kv key delete "ratelimit:test_user_1" --namespace-id="$RATE_LIMITS_ID"
   ```

---

## MCP Protocol Issues

### Issue: "Method Not Found"

**Error:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32601,
    "message": "Method not found"
  }
}
```

**Cause:** Invalid MCP method name.

**Valid methods:**
- `tools/list` - List all available tools
- `tools/call` - Invoke a specific tool
- `resources/list` - List available resources (if implemented)

**Solution:**

1. **Use correct method name:**
   ```json
   {
     "jsonrpc": "2.0",
     "id": 1,
     "method": "tools/list",
     "params": {}
   }
   ```

2. **Check MCP protocol version:**
   Include `X-MCP-Version` header:
   ```bash
   curl -X POST https://clickup-mcp.workers.dev/mcp \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -H "X-MCP-Version: 2024-11-05" \
     -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
   ```

### Issue: "Tool Not Found"

**Error:**
```json
{
  "error": {
    "code": "tool_not_found",
    "message": "Tool 'create_task' not found"
  }
}
```

**Causes:**
1. Tool name misspelled (case-sensitive)
2. Tool not available in your tier (free vs premium)
3. Tool not registered in server

**Solution:**

1. **List available tools:**
   ```bash
   curl -X POST https://clickup-mcp.workers.dev/mcp \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' \
     | jq '.result.tools[].name'
   ```

2. **Use exact tool name:**
   Tool names are case-sensitive:
   - ✅ `clickup_task_create`
   - ❌ `create_task`
   - ❌ `CreateTask`

3. **Check tier requirements:**
   Premium-only tools (require subscription):
   - `clickup_task_bulk_create`
   - `clickup_task_bulk_update`
   - `clickup_time_tracking_start`
   - `clickup_custom_field_set`
   - etc.

   Upgrade at: `https://clickup-mcp.workers.dev/stripe/create-checkout`

4. **Verify tool is implemented:**
   See [TOOL_REFERENCE.md](TOOL_REFERENCE.md) for complete tool list.

### Issue: "Invalid Tool Parameters"

**Error:**
```json
{
  "error": {
    "code": "invalid_parameters",
    "message": "Validation error: 'list_id' is required"
  }
}
```

**Cause:** Missing or invalid tool parameters.

**Solution:**

1. **Check required parameters:**
   ```bash
   curl -X POST https://clickup-mcp.workers.dev/mcp \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' \
     | jq '.result.tools[] | select(.name == "clickup_task_create") | .inputSchema'
   ```

2. **Provide all required parameters:**
   ```json
   {
     "jsonrpc": "2.0",
     "id": 1,
     "method": "tools/call",
     "params": {
       "name": "clickup_task_create",
       "arguments": {
         "list_id": "90144360426",
         "name": "Task name",
         "description": "Task description"
       }
     }
   }
   ```

3. **Verify parameter types:**
   - `list_id`: string
   - `name`: string (required)
   - `priority`: number (1-4, optional)
   - `due_date`: string (ISO 8601 or natural language, optional)

4. **See tool reference:**
   Full parameter documentation: [TOOL_REFERENCE.md](TOOL_REFERENCE.md)

---

## Deployment Issues

### Issue: Build Fails with "Cannot Resolve Node Module"

**Error:**
```
✘ [ERROR] Could not resolve "node:crypto"
```

**Cause:** Attempting to import Node.js built-in modules in Worker code.

**Solution:**

1. **Use Web APIs instead of Node.js APIs:**
   ```typescript
   // ❌ Don't use Node.js crypto
   import crypto from 'node:crypto';

   // ✅ Use Web Crypto API
   const crypto = globalThis.crypto;
   await crypto.subtle.encrypt(/* ... */);
   ```

2. **Mark as external in esbuild:**
   ```json
   // package.json
   "build:worker": "esbuild src/worker.ts --bundle --external:node:*"
   ```

3. **See Workers-specific patterns:**
   [DEVELOPER_GUIDE.md - Workers-Specific Patterns](DEVELOPER_GUIDE.md#workers-specific-patterns)

### Issue: KV Namespace Not Found

**Error in logs:**
```
[ERROR] KV namespace 'USER_SESSIONS' not found
```

**Cause:** Incorrect namespace ID in `wrangler.toml`.

**Solution:**

1. **List KV namespaces:**
   ```bash
   wrangler kv namespace list
   ```

2. **Verify IDs match wrangler.toml:**
   ```toml
   [env.production]
   kv_namespaces = [
     { binding = "USER_SESSIONS", id = "abc123def456" }
   ]
   ```

3. **Update wrangler.toml with correct IDs**

4. **Redeploy:**
   ```bash
   npm run deploy:production
   ```

### Issue: Secrets Not Available

**Error:**
```
Cannot read property 'ENCRYPTION_KEY' of undefined
```

**Cause:** CloudFlare secrets not set.

**Solution:**

1. **List configured secrets:**
   ```bash
   wrangler secret list --env production
   ```

2. **Set missing secrets:**
   ```bash
   echo "YOUR_VALUE" | wrangler secret put ENCRYPTION_KEY --env production
   echo "YOUR_VALUE" | wrangler secret put JWT_SECRET --env production
   ```

3. **Verify all required secrets are set:**
   - `CLICKUP_CLIENT_ID`
   - `CLICKUP_CLIENT_SECRET`
   - `ENCRYPTION_KEY`
   - `JWT_SECRET`
   - `STRIPE_SECRET_KEY` (if using premium)
   - `STRIPE_WEBHOOK_SECRET` (if using premium)
   - `STRIPE_PRICE_ID` (if using premium)

4. **Redeploy after setting secrets:**
   ```bash
   npm run deploy:production
   ```

### Issue: Deployment Succeeds But Service Returns 500

**Symptom:** Deployment completes successfully, but all requests return 500 errors.

**Causes:**
1. Runtime error in Worker code
2. Missing environment variables
3. KV/R2 bindings misconfigured

**Solution:**

1. **Check CloudFlare logs immediately:**
   ```bash
   wrangler tail --env production --level error
   ```

2. **Look for specific errors:**
   - "TypeError: Cannot read property" → Missing binding or secret
   - "ReferenceError: X is not defined" → Undefined variable
   - "Error: KV namespace not found" → Wrong KV namespace ID

3. **Verify configuration:**
   ```bash
   # Check wrangler.toml matches deployed environment
   cat wrangler.toml

   # Verify secrets
   wrangler secret list --env production

   # Verify KV namespaces
   wrangler kv namespace list
   ```

4. **Rollback if needed:**
   ```bash
   wrangler rollback --env production
   ```

5. **Fix issue and redeploy:**
   ```bash
   # Fix code/configuration
   npm run build:worker
   npm run deploy:production
   ```

---

## Performance Issues

### Issue: Slow Response Times

**Symptom:** Requests taking > 2 seconds to complete.

**Diagnostic:**

```bash
# Measure response time
time curl -X POST https://clickup-mcp.workers.dev/mcp \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

**Causes:**
1. ClickUp API slow or rate limited
2. Large response size
3. Cold start (first request after idle)
4. Network latency

**Solution:**

1. **Check ClickUp API status:**
   - Visit [status.clickup.com](https://status.clickup.com)
   - Check ClickUp API response times

2. **Implement caching:**
   ```typescript
   // Cache frequently accessed data
   const cacheKey = `workspace:${teamId}:hierarchy`;
   let cached = await env.CACHE.get(cacheKey);

   if (!cached) {
     const data = await clickup.getWorkspaceHierarchy();
     await env.CACHE.put(cacheKey, JSON.stringify(data), {
       expirationTtl: 3600  // 1 hour
     });
     cached = data;
   }
   ```

3. **Reduce response size:**
   - Use pagination for large lists
   - Request only needed fields
   - Filter results on server side

4. **Optimize cold starts:**
   - Minimize bundle size
   - Use dynamic imports for optional features
   - Keep Worker warm with health checks

5. **Check CloudFlare Analytics:**
   - Dashboard → Workers → clickup-mcp → Metrics
   - Look for p95/p99 latency spikes

### Issue: High CPU Time Usage

**Error:**
```
Worker exceeded CPU time limit (30s)
```

**Causes:**
1. Infinite loops
2. Heavy computation
3. Large data processing

**Solution:**

1. **Add timeouts:**
   ```typescript
   const timeout = setTimeout(() => {
     throw new Error('Operation timeout');
   }, 25000);  // 25 seconds (before 30s limit)

   try {
     const result = await expensiveOperation();
     clearTimeout(timeout);
     return result;
   } catch (error) {
     clearTimeout(timeout);
     throw error;
   }
   ```

2. **Process in batches:**
   ```typescript
   // Instead of processing all at once
   for (const batch of chunks(largeArray, 100)) {
     await processBatch(batch);
   }
   ```

3. **Offload heavy computation:**
   - Use ClickUp API for filtering (don't fetch and filter locally)
   - Process on client side when possible
   - Use dedicated service for heavy tasks

4. **Profile code:**
   ```typescript
   const start = Date.now();
   const result = await operation();
   const duration = Date.now() - start;

   if (duration > 1000) {
     console.warn(`Slow operation: ${duration}ms`);
   }
   ```

---

## Data & Storage Issues

### Issue: Encrypted Data Cannot Be Decrypted

**Error:**
```
DecryptionError: Failed to decrypt data
```

**Causes:**
1. `ENCRYPTION_KEY` changed
2. Data corrupted in KV
3. Wrong encryption algorithm

**Solution:**

1. **Verify ENCRYPTION_KEY hasn't changed:**
   ```bash
   wrangler secret list --env production | grep ENCRYPTION_KEY
   ```

2. **If ENCRYPTION_KEY was rotated:**
   - Old encrypted data is unrecoverable
   - Users must re-authenticate via OAuth
   - API keys will be re-encrypted with new key

3. **Check data format:**
   ```bash
   # Get encrypted value from KV
   wrangler kv key get "apikey:user123" --namespace-id="YOUR_API_KEYS_ID"
   ```

   Should be base64-encoded string.

4. **Re-encrypt data with new key:**
   Users must complete OAuth flow again to re-encrypt API keys.

### Issue: Audit Logs Not Appearing in R2

**Symptom:** Actions performed but no audit logs in R2 bucket.

**Causes:**
1. `ENABLE_AUDIT_LOGGING` set to `false`
2. R2 bucket binding misconfigured
3. R2 write permissions issue

**Solution:**

1. **Check audit logging is enabled:**
   ```bash
   # Verify environment variable
   wrangler tail --env production | grep AUDIT_LOGGING
   ```

2. **Verify R2 bucket binding:**
   ```toml
   # wrangler.toml
   [env.production]
   r2_buckets = [
     { binding = "AUDIT_LOGS", bucket_name = "clickup-mcp-audit-prod" }
   ]
   ```

3. **Test R2 write access:**
   ```bash
   # List objects in bucket
   wrangler r2 object list clickup-mcp-audit-prod

   # Upload test file
   echo "test" | wrangler r2 object put clickup-mcp-audit-prod test.txt
   ```

4. **Check CloudFlare logs:**
   ```bash
   wrangler tail --env production --level error | grep "R2"
   ```

5. **Verify audit logging code:**
   Ensure `AuditLogger` is called after tool executions.

### Issue: KV Data Loss

**Symptom:** Session data or API keys disappearing.

**Causes:**
1. Data expired (TTL reached)
2. KV namespace manually cleared
3. Wrong namespace ID

**Solution:**

1. **Check TTL configuration:**
   ```typescript
   // User sessions expire after 24 hours
   await env.USER_SESSIONS.put(key, value, {
     expirationTtl: 86400  // 24 hours
   });
   ```

2. **Don't clear KV namespaces in production:**
   ```bash
   # Be very careful with this command!
   wrangler kv key delete "key" --namespace-id="NAMESPACE_ID"
   ```

3. **Implement backup strategy:**
   - Export critical data periodically
   - Store backups in R2
   - Document restoration procedure

4. **Verify namespace IDs:**
   ```bash
   wrangler kv namespace list
   ```

---

## Frequently Asked Questions

### General Questions

**Q: What is ClickUp MCP Server?**

A: ClickUp MCP Server is a Remote MCP Server hosted on CloudFlare Workers that enables AI agents to interact with ClickUp workspaces through OAuth authentication. It provides 72 tools across 12 categories for comprehensive task management.

**Q: Is it free to use?**

A: Yes! We offer a free tier with 45 tools and 100 requests/minute. Premium tier ($4.99/month) includes 72 tools and 500 requests/minute.

**Q: How do I get started?**

A:
1. Visit `https://clickup-mcp.workers.dev/auth/login`
2. Authorize ClickUp access
3. Receive JWT token
4. Use token in MCP client configuration

See [README.md](../README.md) for detailed quick start.

### Authentication & Security

**Q: Do you store my ClickUp password?**

A: No! We use OAuth 2.0 authentication. You authorize via ClickUp's official OAuth flow, and we never see your password.

**Q: How is my API key stored?**

A: Your ClickUp API key (obtained via OAuth) is encrypted with AES-256-GCM using a unique encryption key and stored in CloudFlare KV. We never store unencrypted API keys.

See [SECURITY.md](SECURITY.md) for complete security details.

**Q: How long do JWT tokens last?**

A: JWT tokens have a 24-hour lifetime. After expiry, re-authenticate via `/auth/login` or use `/auth/refresh` to get a new token.

**Q: Can I revoke access?**

A: Yes! Visit ClickUp Settings → Apps → Authorized Apps and revoke "ClickUp MCP Server" access. Your stored API key will no longer work.

### Features & Tools

**Q: What's the difference between free and premium tiers?**

A:
- **Free**: 45 tools (basic CRUD, workspace navigation, comments) - 100 req/min
- **Premium**: 72 tools (bulk operations, time tracking, custom fields, project management) - 500 req/min

See [PREMIUM_FEATURES.md](PREMIUM_FEATURES.md) for complete comparison.

**Q: Can I test premium features before subscribing?**

A: Currently, no free trial is available. However, premium tier is only $4.99/month and can be canceled anytime.

**Q: How do I upgrade to premium?**

A:
```bash
curl -X POST https://clickup-mcp.workers.dev/stripe/create-checkout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Complete payment via Stripe checkout and premium features activate immediately.

**Q: Which tools are included in the free tier?**

A: Free tier includes:
- Workspace navigation (`clickup_workspace_hierarchy`)
- Basic task operations (`create_task`, `get_task`, `update_task`, `delete_task`)
- List/folder management
- Comment operations
- Space/member viewing

See [TOOL_REFERENCE.md](TOOL_REFERENCE.md) for complete tool list.

### Rate Limiting

**Q: What are the rate limits?**

A:
- **Free tier**: 100 requests per minute
- **Premium tier**: 500 requests per minute

Rate limits are per user (based on JWT token).

**Q: What happens if I exceed the rate limit?**

A: You'll receive a `429 Too Many Requests` error with headers indicating when the limit resets (60 seconds).

**Q: Can rate limits be increased?**

A: Enterprise customers can request custom rate limits. Contact support@yourcompany.com.

### Data & Privacy

**Q: What data do you store?**

A: We store:
- Encrypted ClickUp API keys
- JWT session tokens (24-hour lifetime)
- User ID and team ID mappings
- Audit logs (user actions)
- Usage metrics (anonymous)

See [SECURITY.md](SECURITY.md) for complete data handling details.

**Q: Do you store task content?**

A: No! We only proxy requests to ClickUp API. Task content stays in ClickUp and is never stored on our servers.

**Q: Is my data encrypted?**

A: Yes! All API keys are encrypted with AES-256-GCM at rest. Data in transit uses HTTPS (TLS 1.3).

**Q: Can I delete my data?**

A: Yes! Contact support@yourcompany.com to request data deletion. We'll remove all stored data within 30 days.

### Technical Questions

**Q: What transport protocols are supported?**

A: We support:
- **HTTP Streamable** (recommended) - Bi-directional streaming
- **Server-Sent Events (SSE)** - Server-to-client streaming
- **WebSocket** - Full-duplex communication

See [API_REFERENCE.md](API_REFERENCE.md) for transport details.

**Q: Can I self-host this?**

A: Yes! The codebase is open-source (MIT license). See [DEPLOYMENT.md](DEPLOYMENT.md) for self-hosting instructions.

**Q: Which ClickUp API version is used?**

A: We use ClickUp API v2 (latest version).

**Q: Are webhooks supported?**

A: Not yet, but webhook support is planned for a future release.

### Troubleshooting

**Q: Why am I getting "Authentication Required" errors?**

A: Your JWT token expired (24-hour lifetime). Re-authenticate at `/auth/login` or use `/auth/refresh`.

**Q: Tools are not showing up in my MCP client**

A:
1. Verify JWT token is valid
2. Check client configuration (URL, headers)
3. Call `tools/list` to verify server is responding

**Q: Getting "Tool not available" errors**

A: The tool may be premium-only. Check [TOOL_REFERENCE.md](TOOL_REFERENCE.md) for tier requirements.

---

## Getting Help

### Self-Service Resources

1. **📚 Documentation:**
   - [README.md](../README.md) - Quick start and overview
   - [AUTHENTICATION.md](AUTHENTICATION.md) - OAuth flow details
   - [TOOL_REFERENCE.md](TOOL_REFERENCE.md) - Complete tool list
   - [API_REFERENCE.md](API_REFERENCE.md) - API endpoints
   - [SECURITY.md](SECURITY.md) - Security architecture
   - [DEPLOYMENT.md](DEPLOYMENT.md) - Self-hosting guide
   - [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) - Development setup

2. **🔍 Diagnostic Commands:**
   ```bash
   # Health check
   curl https://clickup-mcp.workers.dev/health

   # List tools
   curl -X POST https://clickup-mcp.workers.dev/mcp \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'

   # Check rate limit status
   curl -I https://clickup-mcp.workers.dev/mcp \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

3. **📊 Service Status:**
   - CloudFlare Status: [status.cloudflare.com](https://status.cloudflare.com)
   - ClickUp Status: [status.clickup.com](https://status.clickup.com)

### Community Support

1. **GitHub Issues:**
   - Report bugs: [github.com/taazkareem/clickup-mcp-server/issues](https://github.com/taazkareem/clickup-mcp-server/issues)
   - Feature requests: Use "Feature Request" template

2. **GitHub Discussions:**
   - Ask questions: [github.com/taazkareem/clickup-mcp-server/discussions](https://github.com/taazkareem/clickup-mcp-server/discussions)
   - Share tips and tricks

### Premium Support

**For premium subscribers:**

- **Email:** support@yourcompany.com
- **Response Time:** < 24 hours (business days)
- **Priority:** High priority queue
- **Scope:** Technical issues, feature guidance, integration help

**Enterprise Support:**

- **Dedicated Slack channel**
- **Video consultations**
- **Custom feature development**
- **SLA guarantees**

Contact sales@yourcompany.com for enterprise inquiries.

### Before Contacting Support

Please provide:

1. **Environment details:**
   - Server URL (dev/staging/production)
   - CloudFlare Worker version
   - Error occurred timestamp

2. **Error information:**
   - Complete error message
   - Request ID (if available)
   - Steps to reproduce

3. **Diagnostic results:**
   ```bash
   # Run and include output
   curl https://clickup-mcp.workers.dev/health
   ```

4. **What you've tried:**
   - Solutions attempted
   - Troubleshooting steps followed

This helps us resolve issues faster!

---

*Last Updated: 2025-01-28*
*Version: 1.0.0*
