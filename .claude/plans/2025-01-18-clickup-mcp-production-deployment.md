# Pre-Production Deployment Plan: ClickUp MCP Server on CloudFlare Workers

**Date**: January 18, 2025
**Status**: In Progress
**Estimated Timeline**: 3 hours

## Overview
Deploy the ClickUp MCP Server to CloudFlare Workers with full OAuth authentication, Stripe integration, and multi-tier tool access. This plan covers code fixes, infrastructure setup, external service configuration, deployment to dev + staging environments, and comprehensive testing.

---

## Step 0: Document This Plan ✅
- Save this plan to `.claude/plans/2025-01-18-clickup-mcp-production-deployment.md`
- Use current date format
- Include complete plan text with all phases and validation steps

---

## Phase 1: Critical Code Fixes (30 minutes)

### 1.1 Fix MCP Worker Server Tool Handlers
**Issue**: `src/mcp-worker-server.ts:181` imports `./tools/handlers` which doesn't exist

**Fix**:
- Create `src/tools/handlers.ts` that aggregates all tool handlers from individual modules
- Export a unified `toolHandlers` object mapping tool names to handler functions
- Include handlers from: workspace, task, list, folder, space, tag, member, custom-fields, documents, project

**Validation**: `npm run build:worker` should complete without import errors

### 1.2 Update Tools Index Exports
**Issue**: `src/tools/index.ts` only exports some tool modules (missing space, custom-fields, documents, project)

**Fix**:
- Add exports for space, custom-fields, documents, and project tools
- Ensure all .js extensions are correct for ESM compatibility

**Validation**: Verify all tool modules are exported correctly

### 1.3 Test Build Process
**Commands**:
```bash
npm install
npm run build:worker
```

**Expected Output**: `dist/worker.js` created successfully with no errors

**Checkpoint**: Build must succeed before proceeding to infrastructure setup

---

## Phase 2: CloudFlare Infrastructure Setup (45 minutes)

### 2.1 Update CloudFlare Account Configuration
**Action**: Update `wrangler.toml` line 7 with your CloudFlare account ID

**How to get Account ID**:
```bash
wrangler whoami
# Or visit: CloudFlare Dashboard > Account Settings
```

**Validation**: `wrangler whoami` shows correct account

### 2.2 Create KV Namespaces
**Development Environment** (6 namespaces):
```bash
npm run kv:create:dev
```

**Expected Output**: 6 namespace IDs that look like: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

**Staging Environment** (6 namespaces):
```bash
npm run kv:create:staging
```

**Action Required**: Copy the namespace IDs from output and update `wrangler.toml`:
- Lines 18-23: Development namespace IDs
- Lines 45-50: Staging namespace IDs

**Validation**: `wrangler kv:namespace list` shows all 12 namespaces

### 2.3 Create R2 Buckets
**Command**:
```bash
npm run r2:create
```

**Expected Output**:
- `clickup-mcp-audit-dev` created
- `clickup-mcp-audit-staging` created

**Validation**: `wrangler r2 bucket list` shows both buckets

### 2.4 Configure Secrets
**Development Environment**:
```bash
wrangler secret put CLICKUP_CLIENT_ID --env development
wrangler secret put CLICKUP_CLIENT_SECRET --env development
wrangler secret put ENCRYPTION_KEY --env development
wrangler secret put JWT_SECRET --env development
wrangler secret put STRIPE_SECRET_KEY --env development
wrangler secret put STRIPE_WEBHOOK_SECRET --env development
wrangler secret put STRIPE_PRICE_ID --env development
```

**Staging Environment**: Repeat above with `--env staging`

**How to generate secure keys**:
```bash
# ENCRYPTION_KEY (32 bytes)
openssl rand -base64 32

# JWT_SECRET (64 bytes)
openssl rand -base64 64
```

**Validation**: `wrangler secret list --env development` shows all 7 secrets

**Checkpoint**: All infrastructure must be created before deployment

---

## Phase 3: External Service Configuration (30 minutes)

### 3.1 Configure ClickUp OAuth Application
**Steps**:
1. Go to ClickUp → Settings → Apps → Create an App
2. Set OAuth Redirect URIs:
   - Development: `http://localhost:8787/auth/callback`
   - Staging: `https://clickup-mcp-staging.YOUR_SUBDOMAIN.workers.dev/auth/callback`
3. Required scopes: `user:read`, `team:read`, `task:write`
4. Save Client ID and Client Secret (used in Phase 2.4)

**Validation**: OAuth app shows "Active" status in ClickUp settings

### 3.2 Set Up Stripe Integration
**Steps**:
1. Create Product in Stripe Dashboard:
   - Name: "ClickUp MCP Premium"
   - Type: Recurring subscription
   - Price: Your desired amount (e.g., $10/month)

2. Configure Webhook:
   - Endpoint: `https://clickup-mcp-staging.YOUR_SUBDOMAIN.workers.dev/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.deleted`
   - Copy webhook signing secret

3. Get required values:
   - Stripe Secret Key: Dashboard → Developers → API Keys
   - Price ID: Product page → Pricing → Copy price ID (starts with `price_`)

**Validation**: Webhook shows "Enabled" in Stripe dashboard

**Checkpoint**: All external services configured before deployment

---

## Phase 4: Build and Deploy (20 minutes)

### 4.1 Build Worker Bundle
**Command**:
```bash
npm run build:worker
```

**Expected Output**:
- `dist/worker.js` created
- Bundle size shown (should be < 2MB)

**Validation**: No TypeScript errors or warnings

### 4.2 Deploy to Development Environment
**Command**:
```bash
npm run deploy:dev
```

**Expected Output**:
```
✨ Successfully published your script to
   https://clickup-mcp-dev.YOUR_SUBDOMAIN.workers.dev
```

**Immediate Tests**:
```bash
# Test health endpoint
curl https://clickup-mcp-dev.YOUR_SUBDOMAIN.workers.dev/health

# Expected: {"status":"healthy","timestamp":"...","environment":"development","version":"1.0.0"}
```

### 4.3 Deploy to Staging Environment
**Command**:
```bash
npm run deploy:staging
```

**Expected Output**:
```
✨ Successfully published your script to
   https://clickup-mcp-staging.YOUR_SUBDOMAIN.workers.dev
```

**Immediate Tests**:
```bash
# Test health endpoint
curl https://clickup-mcp-staging.YOUR_SUBDOMAIN.workers.dev/health

# Expected: {"status":"healthy","timestamp":"...","environment":"staging","version":"1.0.0"}
```

**Checkpoint**: Both environments deployed and health checks passing

---

## Phase 5: Validation Testing (45 minutes)

### 5.1 Test OAuth Flow (Development)
**Steps**:
1. Visit: `https://clickup-mcp-dev.YOUR_SUBDOMAIN.workers.dev/auth/login`
2. Authorize with ClickUp account
3. Should redirect to success page with JWT token

**Validation Checklist**:
- ✅ OAuth redirect works
- ✅ JWT token displayed on success page
- ✅ MCP endpoint URL shown
- ✅ User record created in KV (check with `wrangler kv:key list --binding USER_MAPPINGS --env development`)

### 5.2 Test API Key Storage
**Command**:
```bash
curl -X POST https://clickup-mcp-dev.YOUR_SUBDOMAIN.workers.dev/auth/api-key \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "pk_YOUR_CLICKUP_API_KEY",
    "team_id": "YOUR_TEAM_ID"
  }'
```

**Expected**: `{"success":true,"message":"API key stored successfully"}`

**Validation**: API key encrypted and stored in KV

### 5.3 Test MCP Endpoint
**Test List Tools**:
```bash
curl -X POST https://clickup-mcp-dev.YOUR_SUBDOMAIN.workers.dev/mcp \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

**Expected**: JSON response with list of available tools (7 free tier tools)

**Test Tool Execution**:
```bash
curl -X POST https://clickup-mcp-dev.YOUR_SUBDOMAIN.workers.dev/mcp \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "id":2,
    "method":"tools/call",
    "params":{
      "name":"clickup_workspace_hierarchy",
      "arguments":{}
    }
  }'
```

**Expected**: JSON response with workspace hierarchy data

### 5.4 Test Rate Limiting
**Command**: Make 101 rapid requests to exceed 100/min limit

**Expected**: 101st request returns HTTP 429 with `{"error":"Rate limit exceeded"}`

### 5.5 Test Audit Logging
**Check R2 Bucket**:
```bash
wrangler r2 object list clickup-mcp-audit-dev
```

**Expected**: Audit log files in format: `audit/USER_ID/2025-01-18/TIMESTAMP-RANDOM.json`

### 5.6 Test Stripe Checkout (Staging)
**Command**:
```bash
curl -X POST https://clickup-mcp-staging.YOUR_SUBDOMAIN.workers.dev/stripe/create-checkout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected**: `{"checkout_url":"https://checkout.stripe.com/..."}`

**Manual Test**: Visit checkout URL and verify Stripe session works

**Checkpoint**: All core functionality validated

---

## Phase 6: Monitoring and Documentation (30 minutes)

### 6.1 Set Up Monitoring
**CloudFlare Analytics**:
- Visit Workers & Pages → clickup-mcp-dev → Metrics
- Monitor: Requests, Errors, CPU time, Invocations

**Logging**:
```bash
# Tail development logs
wrangler tail --env development

# Tail staging logs
wrangler tail --env staging
```

### 6.2 Create User Setup Guide
**Document Location**: `docs/user-setup-guide.md`

**Include**:
- How to get JWT token (OAuth flow)
- How to configure MCP client (Claude Desktop, etc.)
- MCP endpoint URL format
- Example tool usage
- Troubleshooting common issues

### 6.3 Test MCP Client Integration
**Claude Desktop Configuration**:
```json
{
  "mcpServers": {
    "clickup": {
      "url": "https://clickup-mcp-dev.YOUR_SUBDOMAIN.workers.dev/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_JWT_TOKEN"
      }
    }
  }
}
```

**Test**: Restart Claude Desktop and verify ClickUp tools appear

---

## Phase 7: Production Readiness Checklist

Before promoting to production:

**Security**:
- ✅ All secrets rotated from development/staging
- ✅ Encryption keys are unique per environment
- ✅ OAuth redirect URIs use HTTPS
- ✅ Rate limiting tested and working
- ✅ Audit logging capturing all actions

**Functionality**:
- ✅ All 72 tools working correctly
- ✅ Free tier tools accessible
- ✅ Premium tier tools restricted properly
- ✅ Stripe checkout and webhooks functional
- ✅ OAuth flow completes successfully

**Performance**:
- ✅ Worker response time < 200ms for most requests
- ✅ Bundle size optimized (< 2MB)
- ✅ KV read/write performance acceptable

**Documentation**:
- ✅ User setup guide complete
- ✅ API documentation current
- ✅ Troubleshooting guide created
- ✅ Deployment runbook documented

---

## Rollback Plan

If issues are encountered:

1. **Revert deployment**:
   ```bash
   wrangler rollback --env development
   wrangler rollback --env staging
   ```

2. **Check logs for errors**:
   ```bash
   wrangler tail --env development
   ```

3. **Validate infrastructure**:
   - Verify all KV namespaces accessible
   - Check R2 bucket permissions
   - Confirm secrets are set correctly

---

## Final Step: Document Solution Summary
- Save solution summary to `.claude/plans/2025-01-18-clickup-mcp-production-deployment-solution-summary.md`
- Use same base filename with `-solution-summary` suffix
- Include comprehensive summary of what was accomplished

---

## Estimated Timeline
- **Phase 1**: 30 minutes (code fixes)
- **Phase 2**: 45 minutes (infrastructure)
- **Phase 3**: 30 minutes (external services)
- **Phase 4**: 20 minutes (deployment)
- **Phase 5**: 45 minutes (validation)
- **Phase 6**: 30 minutes (monitoring)
- **Total**: ~3 hours for complete pre-production setup

---

## Support and Troubleshooting

**Common Issues**:

1. **Build fails**: Check TypeScript errors, verify all imports have .js extensions
2. **OAuth redirect fails**: Verify redirect URI matches exactly in ClickUp app settings
3. **KV namespace not found**: Ensure namespace IDs in wrangler.toml match created IDs
4. **Rate limit not working**: Check ENABLE_RATE_LIMITING env var is "true"
5. **Tools not appearing**: Verify tool handler mapping in handlers.ts is complete

**Getting Help**:
- CloudFlare Workers: https://discord.gg/cloudflaredev
- ClickUp API: https://help.clickup.com/
- Stripe Integration: https://stripe.com/docs/webhooks
