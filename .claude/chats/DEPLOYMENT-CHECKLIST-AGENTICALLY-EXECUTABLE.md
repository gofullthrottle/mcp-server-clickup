# ClickUp MCP Server: Agentically-Executable Deployment Checklist

> **Status**: Ready for AI Agent Execution  
> **Estimated Time**: 2-4 hours (human supervision required for auth flows)  
> **Prerequisites**: CloudFlare account, Stripe account, ClickUp OAuth app

---

## ✅ Pre-Flight Verification

### Environment Setup
```bash
# Agent can execute these checks automatically
node --version  # Verify >= 18.0.0
npm --version   # Verify >= 10.0.0
cd ~/initiatives/projects/clickup-mcp-server
npm run build   # Verify build succeeds
npm run build:worker  # Verify worker bundle succeeds
```

**Expected Outputs:**
- ✅ Node v18+ or v20+
- ✅ NPM v10+
- ✅ `build/index.js` created
- ✅ `dist/worker.js` created

---

## 🔧 Phase 1: CloudFlare Configuration (30 min)

### 1.1 Account Setup
**Human Required:**
1. Sign up at cloudflare.com
2. Navigate to Workers & Pages
3. Copy Account ID from sidebar (32 hex characters)

**Agent Task:**
```bash
# Update wrangler.toml with actual account ID
ACCOUNT_ID="your_account_id_here"
sed -i '' "s/YOUR_CLOUDFLARE_ACCOUNT_ID/$ACCOUNT_ID/" wrangler.toml

# Verify update
grep "account_id" wrangler.toml
```

### 1.2 Wrangler Authentication
```bash
# Agent initiates, human completes in browser
wrangler login

# Verify authentication
wrangler whoami
```

### 1.3 Create KV Namespaces
```bash
# Agent executes, captures namespace IDs
npm run kv:create:dev

# Agent must parse output and update wrangler.toml
# Example output:
# ⛅️ wrangler 3.x.x
# ✨ Created namespace dev_user_sessions with id: abc123...
# ✨ Created namespace dev_api_keys with id: def456...
# (etc for 6 namespaces)
```

**Agent Post-Processing Required:**
```python
# Pseudo-code for agent to update wrangler.toml
output = run_command("npm run kv:create:dev")
namespace_ids = {
    "USER_SESSIONS": extract_id(output, "dev_user_sessions"),
    "API_KEYS": extract_id(output, "dev_api_keys"),
    "USER_MAPPINGS": extract_id(output, "dev_user_mappings"),
    "RATE_LIMITS": extract_id(output, "dev_rate_limits"),
    "TOOL_CONFIGS": extract_id(output, "dev_tool_configs"),
    "STRIPE_CUSTOMERS": extract_id(output, "dev_stripe_customers")
}

# Update wrangler.toml with actual IDs
update_wrangler_toml_kv_namespaces(namespace_ids, env="development")
```

### 1.4 Create R2 Buckets
```bash
# Agent executes
npm run r2:create

# Expected: 3 buckets created
# - clickup-mcp-audit-dev
# - clickup-mcp-audit-staging  
# - clickup-mcp-audit-prod
```

---

## 🔐 Phase 2: Secrets Configuration (20 min)

### 2.1 ClickUp OAuth Credentials
**Human Required:**
1. Visit https://app.clickup.com/settings/apps
2. Create new app:
   - **Name**: "ClickUp MCP Server"
   - **Redirect**: `https://clickup-mcp-dev.YOUR_SUBDOMAIN.workers.dev/auth/callback`
   - **Description**: "Advanced MCP server for multi-agent workflows"
3. Copy Client ID and Client Secret

**Agent Task:**
```bash
# Store temporarily (will set as secrets later)
echo "CLICKUP_CLIENT_ID=..." >> .env.production
echo "CLICKUP_CLIENT_SECRET=..." >> .env.production
```

### 2.2 Generate Encryption Keys
**Agent Automated:**
```bash
# Generate encryption key
ENCRYPTION_KEY=$(openssl rand -base64 32)
echo "ENCRYPTION_KEY=$ENCRYPTION_KEY" >> .env.production

# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 32)
echo "JWT_SECRET=$JWT_SECRET" >> .env.production

# Verify
cat .env.production
```

### 2.3 Stripe Configuration
**Human Required:**
1. Sign up at stripe.com
2. Create product:
   - **Name**: "ClickUp MCP Premium"
   - **Price**: $4.99/month recurring
3. Copy Price ID (starts with `price_...`)
4. Navigate to Developers → API Keys
5. Copy Secret Key (starts with `sk_test_...` or `sk_live_...`)

**Agent Task:**
```bash
# Add Stripe keys (webhook secret comes after deployment)
echo "STRIPE_SECRET_KEY=sk_..." >> .env.production
echo "STRIPE_PRICE_ID=price_..." >> .env.production
echo "STRIPE_WEBHOOK_SECRET=whsec_..." >> .env.production  # Placeholder
```

### 2.4 Set CloudFlare Secrets
**Agent Automated:**
```bash
# Read from .env.production and set each secret
wrangler secret put CLICKUP_CLIENT_ID --env development < <(grep CLICKUP_CLIENT_ID .env.production | cut -d= -f2)
wrangler secret put CLICKUP_CLIENT_SECRET --env development < <(grep CLICKUP_CLIENT_SECRET .env.production | cut -d= -f2)
wrangler secret put ENCRYPTION_KEY --env development < <(grep ENCRYPTION_KEY .env.production | cut -d= -f2)
wrangler secret put JWT_SECRET --env development < <(grep JWT_SECRET .env.production | cut -d= -f2)
wrangler secret put STRIPE_SECRET_KEY --env development < <(grep STRIPE_SECRET_KEY .env.production | cut -d= -f2)
wrangler secret put STRIPE_PRICE_ID --env development < <(grep STRIPE_PRICE_ID .env.production | cut -d= -f2)
wrangler secret put STRIPE_WEBHOOK_SECRET --env development < <(grep STRIPE_WEBHOOK_SECRET .env.production | cut -d= -f2)

# Verify secrets are set
wrangler secret list --env development
```

---

## 🚀 Phase 3: Deployment (15 min)

### 3.1 Initial Deployment
**Agent Automated:**
```bash
# Deploy to development environment
npm run deploy:dev

# Expected output:
# ⛅️ wrangler 3.x.x
# Total Upload: xx.xx KiB / gzip: xx.xx KiB
# Uploaded clickup-mcp-dev (x.xx sec)
# Published clickup-mcp-dev (x.xx sec)
#   https://clickup-mcp-dev.YOUR_SUBDOMAIN.workers.dev
```

**Agent captures deployment URL for next steps**

### 3.2 Configure Stripe Webhook
**Human Required:**
1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Enter URL: `https://clickup-mcp-dev.YOUR_SUBDOMAIN.workers.dev/stripe/webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
5. Copy Webhook Signing Secret (starts with `whsec_...`)

**Agent Task:**
```bash
# Update webhook secret
wrangler secret put STRIPE_WEBHOOK_SECRET --env development
# Paste whsec_... when prompted
```

---

## ✅ Phase 4: Testing (30 min)

### 4.1 Health Check
**Agent Automated:**
```bash
# Test health endpoint
DEPLOYMENT_URL="https://clickup-mcp-dev.YOUR_SUBDOMAIN.workers.dev"
curl "$DEPLOYMENT_URL/health"

# Expected:
# {
#   "status": "healthy",
#   "timestamp": "2025-01-XX...",
#   "environment": "development",
#   "version": "1.0.0"
# }
```

### 4.2 OAuth Flow Test
**Human Required:**
```bash
# Agent opens browser
open "$DEPLOYMENT_URL/auth/login"

# Human completes:
# 1. Authorize ClickUp OAuth
# 2. Copy JWT token from success page
# 3. Paste token for next test
```

**Agent Task:**
```bash
# Test authenticated endpoint with JWT
JWT="paste_jwt_here"
curl -H "Authorization: Bearer $JWT" "$DEPLOYMENT_URL/health"
```

### 4.3 MCP Endpoint Test
**Agent Automated:**
```bash
# Test MCP tools listing (requires valid JWT)
curl -X POST "$DEPLOYMENT_URL/mcp" \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "id": 1
  }'

# Expected: JSON response with 72 tools listed
```

### 4.4 Stripe Checkout Test
**Agent Automated:**
```bash
# Create test checkout session
curl -X POST "$DEPLOYMENT_URL/stripe/create-checkout" \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json"

# Expected: {"checkout_url": "https://checkout.stripe.com/..."}
```

**Human Required:**
1. Visit checkout URL
2. Use test card: 4242 4242 4242 4242
3. Complete checkout
4. Verify webhook received in Stripe dashboard

---

## 📋 Phase 5: Local Usage Setup (15 min)

### 5.1 Configure Claude Desktop
**Agent Automated:**
```bash
# Backup existing config
cp ~/Library/Application\ Support/Claude/claude_desktop_config.json \
   ~/Library/Application\ Support/Claude/claude_desktop_config.json.backup

# Add local MCP server
cat >> ~/Library/Application\ Support/Claude/claude_desktop_config.json << 'EOF'
{
  "mcpServers": {
    "clickup-local": {
      "command": "node",
      "args": ["/Users/johnfreier/initiatives/projects/clickup-mcp-server/build/index.js"],
      "env": {
        "CLICKUP_API_KEY": "pk_YOUR_API_KEY",
        "CLICKUP_TEAM_ID": "YOUR_TEAM_ID"
      }
    }
  }
}
EOF
```

**Human Required:**
1. Get ClickUp API key from https://app.clickup.com/settings/apps
2. Replace `pk_YOUR_API_KEY` and `YOUR_TEAM_ID` in config
3. Restart Claude Desktop

### 5.2 Test Local MCP
**Human Required:**
1. Open Claude Desktop
2. Ask: "Get my workspace hierarchy from ClickUp"
3. Verify response shows ClickUp data

---

## 🎯 Phase 6: Production Deployment (Optional - After Testing)

### 6.1 Create Production Resources
```bash
# Create KV namespaces for production
npm run kv:create:prod

# Create R2 buckets (already done)
# Set production secrets
npm run secrets:set:prod
```

### 6.2 Deploy to Production
```bash
# Deploy to production environment
npm run deploy:production

# Update Stripe webhook URL to production
# https://clickup-mcp.YOUR_SUBDOMAIN.workers.dev/stripe/webhook
```

---

## 📊 Post-Deployment Checklist

### Monitoring Setup
- [ ] Set up CloudFlare analytics alerts
- [ ] Configure Stripe email notifications
- [ ] Create status page (optional)
- [ ] Set up error logging (Sentry/LogTail)

### Documentation Updates
- [ ] Update README with deployment URL
- [ ] Add "Getting Started" guide with OAuth instructions
- [ ] Create video tutorial for setup
- [ ] Document troubleshooting steps

### Marketing Preparation
- [ ] Prepare HackerNews launch post
- [ ] Create Product Hunt listing
- [ ] Write announcement blog post
- [ ] Prepare social media posts
- [ ] Set up analytics tracking

---

## 🤖 Agent Execution Summary

### Fully Automated (Agent Can Execute):
- ✅ Build verification
- ✅ KV namespace creation
- ✅ R2 bucket creation
- ✅ Encryption key generation
- ✅ Secret configuration
- ✅ Deployment
- ✅ Health checks
- ✅ Local config setup

### Requires Human Input:
- ⚠️ CloudFlare account signup (one-time)
- ⚠️ ClickUp OAuth app creation (5 min)
- ⚠️ Stripe product creation (5 min)
- ⚠️ OAuth flow testing (browser interaction)
- ⚠️ Stripe checkout testing (test payment)

### Total Time Breakdown:
- **Automated Tasks**: 45 minutes
- **Human Required**: 45 minutes
- **Testing & Verification**: 30 minutes
- **Total**: 2 hours

---

## 🚨 Troubleshooting

### Common Issues

**1. "Account ID not found"**
```bash
# Verify wrangler.toml has actual account ID
grep account_id wrangler.toml
# Should NOT show "YOUR_CLOUDFLARE_ACCOUNT_ID"
```

**2. "Secret not found"**
```bash
# List all secrets
wrangler secret list --env development
# Re-set missing secret
wrangler secret put SECRET_NAME --env development
```

**3. "OAuth callback error"**
```bash
# Verify redirect URL in ClickUp app matches deployment URL
echo "Expected: https://clickup-mcp-dev.YOUR_SUBDOMAIN.workers.dev/auth/callback"
echo "Actual: [check ClickUp app settings]"
```

**4. "Stripe webhook signature invalid"**
```bash
# Verify webhook secret is correctly set
wrangler secret list --env development | grep STRIPE_WEBHOOK_SECRET
# Re-set if needed
wrangler secret put STRIPE_WEBHOOK_SECRET --env development
```

---

## 🎓 Converting to Fully Agentic Execution

### Future Enhancement: Claude Plugin Package

This deployment checklist can be converted into a **Claude Plugin** (.claude-plugin format) that bundles:

1. **Prompt Template** - Structured deployment instructions
2. **MCP Server** - ClickUp integration tools
3. **Skills** - Deployment automation scripts
4. **Agent Role** - "Deployment Assistant" persona

**Plugin Structure:**
```
clickup-mcp-deployment.claude-plugin/
├── manifest.json (plugin metadata)
├── prompt.md (this deployment checklist)
├── mcp-config.json (MCP server configuration)
├── skills/
│   ├── cloudflare-deploy.py
│   ├── stripe-setup.py
│   └── verification.py
└── agent-role.json (deployment assistant configuration)
```

**Benefits:**
- ✅ One-click deployment orchestration
- ✅ Automated error recovery
- ✅ Progress tracking and reporting
- ✅ Rollback capabilities
- ✅ Shareable/reusable across projects

**Next Steps:**
1. Complete manual deployment first
2. Document all agent decision points
3. Extract automation patterns
4. Package as Claude Plugin for future deployments

---

## ✨ Success Criteria

### Deployment Successful When:
- ✅ Health endpoint returns 200 OK
- ✅ OAuth flow completes successfully
- ✅ JWT token validates correctly
- ✅ MCP tools list returns 72 tools
- ✅ Stripe checkout creates valid session
- ✅ Webhook receives test events
- ✅ Local Claude Desktop can use MCP server

### Ready to Launch When:
- ✅ All tests passing
- ✅ Documentation updated
- ✅ Marketing materials prepared
- ✅ Analytics configured
- ✅ Support channels set up

---

**Ship Status**: 🚢 Ready to deploy in 2 hours!

**Note**: This checklist assumes development environment deployment. For production, repeat relevant steps with `--env production` flag and update all URLs accordingly.
