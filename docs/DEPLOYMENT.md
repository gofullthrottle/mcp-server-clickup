# Deployment Guide

Complete guide for deploying ClickUp MCP Server to CloudFlare Workers with multi-environment setup (development, staging, production).

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [Initial Setup](#initial-setup)
4. [Infrastructure Setup](#infrastructure-setup)
5. [Secrets Management](#secrets-management)
6. [ClickUp OAuth Configuration](#clickup-oauth-configuration)
7. [Stripe Setup (Optional)](#stripe-setup-optional)
8. [Deployment Process](#deployment-process)
9. [Post-Deployment Validation](#post-deployment-validation)
10. [Monitoring and Logging](#monitoring-and-logging)
11. [Troubleshooting](#troubleshooting)
12. [Rollback Procedures](#rollback-procedures)
13. [CI/CD Integration](#cicd-integration)

---

## Quick Start

**For experienced CloudFlare Workers users:**

```bash
# 1. Install and authenticate
npm install -g wrangler
wrangler login

# 2. Update account ID in wrangler.toml
# account_id = "YOUR_CLOUDFLARE_ACCOUNT_ID"

# 3. Run automated setup
./scripts/setup-cloudflare.sh

# 4. Deploy to development
npm run deploy:dev

# 5. Validate deployment
curl https://clickup-mcp-dev.workers.dev/health
```

**For detailed instructions, continue reading below.**

---

## Prerequisites

### Required Tools

- **Node.js** 18.0.0 or higher (but < 23.0.0)
- **npm** or **yarn** package manager
- **Wrangler CLI** (CloudFlare Workers CLI)
- **OpenSSL** (for key generation)
- **Git** (for version control)

Install Wrangler globally:

```bash
npm install -g wrangler
```

Verify installation:

```bash
wrangler --version
# Should output: wrangler 4.33.1 or higher
```

### Required Accounts

1. **CloudFlare Account** (Free or Paid)
   - Sign up at [dash.cloudflare.com](https://dash.cloudflare.com)
   - Note your Account ID (found in Workers dashboard)

2. **ClickUp Account** (for OAuth app creation)
   - Sign up at [clickup.com](https://clickup.com)
   - Access to workspace settings (requires admin permissions)

3. **Stripe Account** (optional, for premium tier)
   - Sign up at [stripe.com](https://stripe.com)
   - Required only if monetizing with premium subscriptions

---

## Initial Setup

### Step 1: Clone Repository

```bash
git clone https://github.com/yourusername/clickup-mcp-server.git
cd clickup-mcp-server
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs:
- CloudFlare Workers SDK
- MCP protocol libraries
- Hono web framework
- Stripe SDK (for billing)
- Development dependencies (TypeScript, esbuild, Wrangler)

### Step 3: Authenticate with CloudFlare

```bash
wrangler login
```

This opens your browser to authenticate. Grant Wrangler access to your CloudFlare account.

Verify authentication:

```bash
wrangler whoami
```

Output:
```
👤  You are logged in with an OAuth Token, associated with the email 'your@email.com'!
┌──────────────────────────────────────┬──────────────────────────────┐
│ Account Name                         │ Account ID                   │
├──────────────────────────────────────┼──────────────────────────────┤
│ Your Account                         │ abc123def456                 │
└──────────────────────────────────────┴──────────────────────────────┘
```

Copy your **Account ID** - you'll need it for the next step.

### Step 4: Configure Account ID

Update `wrangler.toml` with your CloudFlare Account ID:

```toml
# Replace this line:
account_id = "YOUR_CLOUDFLARE_ACCOUNT_ID"

# With your actual Account ID:
account_id = "abc123def456"
```

Or use sed (macOS):

```bash
sed -i '' 's/YOUR_CLOUDFLARE_ACCOUNT_ID/abc123def456/' wrangler.toml
```

Linux:

```bash
sed -i 's/YOUR_CLOUDFLARE_ACCOUNT_ID/abc123def456/' wrangler.toml
```

---

## Infrastructure Setup

CloudFlare Workers requires setting up storage resources:
- **KV Namespaces** (6 per environment) - Key-value storage
- **R2 Buckets** (1 per environment) - Object storage for audit logs

You can use either:
- **Automated Setup** (recommended) - Run `./scripts/setup-cloudflare.sh`
- **Manual Setup** (detailed below)

### Automated Setup (Recommended)

```bash
./scripts/setup-cloudflare.sh
```

This interactive script will:
1. Verify Wrangler authentication
2. Update wrangler.toml with your Account ID
3. Create KV namespaces (development, staging, production)
4. Create R2 buckets for audit logs
5. Generate secure encryption keys
6. Configure CloudFlare secrets
7. Save backup copies of generated keys

**Follow the prompts** - the script will guide you through each step.

After completion, the script outputs:
```
✓ CloudFlare setup complete!

Next steps:
  1. Verify KV namespace IDs in wrangler.toml
  2. Configure ClickUp OAuth redirect URIs
  3. Set up Stripe webhook (if using Stripe)
  4. Run 'npm run deploy:dev' to deploy to development
```

**Important:** Review `wrangler.toml` to ensure KV namespace IDs were correctly updated.

### Manual Setup

If you prefer manual setup or need more control:

#### Create KV Namespaces

**6 namespaces per environment:**

1. **USER_SESSIONS** - JWT session tokens (24-hour lifetime)
2. **API_KEYS** - Encrypted ClickUp API keys (AES-256-GCM)
3. **USER_MAPPINGS** - Email → user_id mapping for OAuth
4. **RATE_LIMITS** - Request rate limiting (1-minute sliding window)
5. **TOOL_CONFIGS** - Per-user tool access configuration
6. **STRIPE_CUSTOMERS** - Stripe customer_id mappings

**Development environment:**

```bash
wrangler kv namespace create dev_user_sessions
wrangler kv namespace create dev_api_keys
wrangler kv namespace create dev_user_mappings
wrangler kv namespace create dev_rate_limits
wrangler kv namespace create dev_tool_configs
wrangler kv namespace create dev_stripe_customers
```

Each command outputs:
```
🌀 Creating namespace with title "clickup-mcp-server-dev_user_sessions"
✨ Success!
Add the following to your configuration file in your kv_namespaces array:
{ binding = "USER_SESSIONS", id = "abc123def456" }
```

**Copy the namespace IDs** and update `wrangler.toml`:

```toml
[env.development]
kv_namespaces = [
  { binding = "USER_SESSIONS", id = "abc123def456", preview_id = "abc123def456" },
  { binding = "API_KEYS", id = "def456ghi789", preview_id = "def456ghi789" },
  { binding = "USER_MAPPINGS", id = "ghi789jkl012", preview_id = "ghi789jkl012" },
  { binding = "RATE_LIMITS", id = "jkl012mno345", preview_id = "jkl012mno345" },
  { binding = "TOOL_CONFIGS", id = "mno345pqr678", preview_id = "mno345pqr678" },
  { binding = "STRIPE_CUSTOMERS", id = "pqr678stu901", preview_id = "pqr678stu901" }
]
```

**Repeat for staging and production:**

```bash
# Staging
wrangler kv namespace create staging_user_sessions --env staging
# ... (repeat for all 6 namespaces)

# Production
wrangler kv namespace create prod_user_sessions --env production
# ... (repeat for all 6 namespaces)
```

Update corresponding sections in `wrangler.toml`.

#### Create R2 Buckets

**1 bucket per environment for audit logs:**

```bash
wrangler r2 bucket create clickup-mcp-audit-dev
wrangler r2 bucket create clickup-mcp-audit-staging
wrangler r2 bucket create clickup-mcp-audit-prod
```

Output:
```
✨ Created bucket 'clickup-mcp-audit-dev' with default storage class set to 'Standard'
```

R2 buckets are automatically bound in `wrangler.toml`:

```toml
[env.development]
r2_buckets = [
  { binding = "AUDIT_LOGS", bucket_name = "clickup-mcp-audit-dev" }
]
```

**Audit Log Structure:**

Logs are stored as JSON objects in R2:
- Path: `audit/{user_id}/{year}/{month}/{day}/{timestamp}.json`
- Example: `audit/user123/2025/01/28/1738051200000.json`
- Content:
  ```json
  {
    "timestamp": "2025-01-28T10:00:00.000Z",
    "user_id": "user123",
    "action": "tool_call",
    "tool_name": "create_task",
    "parameters": { "list_id": "90144360426", "name": "Task name" },
    "result": "success",
    "ip_address": "203.0.113.45",
    "user_agent": "Mozilla/5.0..."
  }
  ```

**Retention Policy (Optional):**

Configure automatic deletion after 90 days:

```bash
# Using wrangler (if supported in future versions)
# Currently, use CloudFlare Dashboard → R2 → Bucket → Lifecycle

# Or use S3-compatible client:
aws s3api put-bucket-lifecycle-configuration \
  --endpoint-url https://YOUR_ACCOUNT.r2.cloudflarestorage.com \
  --bucket clickup-mcp-audit-prod \
  --lifecycle-configuration file://lifecycle-policy.json
```

`lifecycle-policy.json`:
```json
{
  "Rules": [
    {
      "Id": "DeleteAfter90Days",
      "Status": "Enabled",
      "Filter": { "Prefix": "audit/" },
      "Expiration": { "Days": 90 }
    }
  ]
}
```

---

## Secrets Management

**7 secrets required per environment:**

| Secret | Purpose | Generation | Notes |
|--------|---------|------------|-------|
| `CLICKUP_CLIENT_ID` | OAuth app ID | ClickUp Dashboard | Public value |
| `CLICKUP_CLIENT_SECRET` | OAuth app secret | ClickUp Dashboard | **NEVER commit** |
| `ENCRYPTION_KEY` | API key encryption | `openssl rand -base64 32` | 32 bytes = 256 bits |
| `JWT_SECRET` | Session token signing | `openssl rand -base64 64` | 64 bytes = 512 bits |
| `STRIPE_SECRET_KEY` | Stripe API access | Stripe Dashboard | Optional (premium tier) |
| `STRIPE_WEBHOOK_SECRET` | Webhook verification | Stripe Webhook Setup | Optional (premium tier) |
| `STRIPE_PRICE_ID` | Subscription price | Stripe Product Setup | Optional (premium tier) |

### Security Best Practices

1. ✅ **Generate unique keys per environment** (never reuse dev keys in production)
2. ✅ **Use CloudFlare Secrets** (encrypted at rest, never exposed in logs)
3. ✅ **Store backup copies securely** (password manager, encrypted vault)
4. ✅ **Rotate keys periodically** (every 90 days recommended)
5. ✅ **Never commit secrets to git** (add `.cloudflare-secrets/` to `.gitignore`)
6. ✅ **Different ClickUp OAuth apps per environment**

### Generate Encryption Keys

```bash
# Create directory for local key storage
mkdir -p .cloudflare-secrets
chmod 700 .cloudflare-secrets

# Generate ENCRYPTION_KEY (32 bytes for AES-256)
openssl rand -base64 32 > .cloudflare-secrets/encryption_key_dev.txt
echo "Generated ENCRYPTION_KEY:"
cat .cloudflare-secrets/encryption_key_dev.txt

# Generate JWT_SECRET (64 bytes for HS256)
openssl rand -base64 64 > .cloudflare-secrets/jwt_secret_dev.txt
echo "Generated JWT_SECRET:"
cat .cloudflare-secrets/jwt_secret_dev.txt
```

**Important:** Generate **different keys** for staging and production:

```bash
# Staging keys
openssl rand -base64 32 > .cloudflare-secrets/encryption_key_staging.txt
openssl rand -base64 64 > .cloudflare-secrets/jwt_secret_staging.txt

# Production keys
openssl rand -base64 32 > .cloudflare-secrets/encryption_key_prod.txt
openssl rand -base64 64 > .cloudflare-secrets/jwt_secret_prod.txt
```

### Set CloudFlare Secrets

**Development environment:**

```bash
# ClickUp OAuth credentials (get from ClickUp OAuth app)
echo "YOUR_CLICKUP_CLIENT_ID" | wrangler secret put CLICKUP_CLIENT_ID --env development
echo "YOUR_CLICKUP_CLIENT_SECRET" | wrangler secret put CLICKUP_CLIENT_SECRET --env development

# Encryption and JWT keys (use generated values)
cat .cloudflare-secrets/encryption_key_dev.txt | wrangler secret put ENCRYPTION_KEY --env development
cat .cloudflare-secrets/jwt_secret_dev.txt | wrangler secret put JWT_SECRET --env development

# Stripe (optional - skip if not using premium tier)
echo "YOUR_STRIPE_SECRET_KEY" | wrangler secret put STRIPE_SECRET_KEY --env development
echo "YOUR_STRIPE_WEBHOOK_SECRET" | wrangler secret put STRIPE_WEBHOOK_SECRET --env development
echo "price_1234567890" | wrangler secret put STRIPE_PRICE_ID --env development
```

Output for each:
```
✨ Success! Uploaded secret CLICKUP_CLIENT_ID
```

**Staging environment:**

```bash
# Use DIFFERENT ClickUp OAuth app for staging
echo "STAGING_CLICKUP_CLIENT_ID" | wrangler secret put CLICKUP_CLIENT_ID --env staging
echo "STAGING_CLICKUP_CLIENT_SECRET" | wrangler secret put CLICKUP_CLIENT_SECRET --env staging

# Use DIFFERENT encryption keys
cat .cloudflare-secrets/encryption_key_staging.txt | wrangler secret put ENCRYPTION_KEY --env staging
cat .cloudflare-secrets/jwt_secret_staging.txt | wrangler secret put JWT_SECRET --env staging

# Stripe staging keys (if using)
echo "STAGING_STRIPE_SECRET_KEY" | wrangler secret put STRIPE_SECRET_KEY --env staging
# ... etc
```

**Production environment:**

```bash
# Use PRODUCTION ClickUp OAuth app
echo "PROD_CLICKUP_CLIENT_ID" | wrangler secret put CLICKUP_CLIENT_ID --env production
echo "PROD_CLICKUP_CLIENT_SECRET" | wrangler secret put CLICKUP_CLIENT_SECRET --env production

# Use PRODUCTION encryption keys
cat .cloudflare-secrets/encryption_key_prod.txt | wrangler secret put ENCRYPTION_KEY --env production
cat .cloudflare-secrets/jwt_secret_prod.txt | wrangler secret put JWT_SECRET --env production

# Stripe production keys
echo "PROD_STRIPE_SECRET_KEY" | wrangler secret put STRIPE_SECRET_KEY --env production
# ... etc
```

### Verify Secrets

List configured secrets (values are hidden):

```bash
wrangler secret list --env development
```

Output:
```
[
  {
    "name": "CLICKUP_CLIENT_ID",
    "type": "secret_text"
  },
  {
    "name": "CLICKUP_CLIENT_SECRET",
    "type": "secret_text"
  },
  {
    "name": "ENCRYPTION_KEY",
    "type": "secret_text"
  },
  {
    "name": "JWT_SECRET",
    "type": "secret_text"
  }
]
```

### Secret Rotation

Rotate secrets periodically (every 90 days recommended):

```bash
# 1. Generate new keys
openssl rand -base64 32 > .cloudflare-secrets/encryption_key_prod_new.txt
openssl rand -base64 64 > .cloudflare-secrets/jwt_secret_prod_new.txt

# 2. Update CloudFlare secrets
cat .cloudflare-secrets/encryption_key_prod_new.txt | wrangler secret put ENCRYPTION_KEY --env production
cat .cloudflare-secrets/jwt_secret_prod_new.txt | wrangler secret put JWT_SECRET --env production

# 3. Deploy to activate new secrets
npm run deploy:production

# 4. Verify deployment works
curl https://clickup-mcp.workers.dev/health

# 5. Archive old keys (don't delete immediately - keep for rollback)
mv .cloudflare-secrets/encryption_key_prod.txt .cloudflare-secrets/encryption_key_prod_old_$(date +%Y%m%d).txt
```

**Note:** Rotating `ENCRYPTION_KEY` will invalidate all existing encrypted API keys. Users will need to re-authenticate via OAuth.

---

## ClickUp OAuth Configuration

Create separate OAuth apps for each environment to isolate development, staging, and production users.

### Step 1: Create ClickUp OAuth App

1. Go to [app.clickup.com](https://app.clickup.com)
2. Click your workspace avatar → **Settings**
3. Navigate to **Apps** → **OAuth Applications**
4. Click **Create an OAuth application**

### Step 2: Configure OAuth App

**Development OAuth App:**

- **App Name:** `ClickUp MCP Server - Development`
- **Redirect URI:** `https://clickup-mcp-dev.workers.dev/auth/callback`
- **Scopes:** Select all scopes needed (see list below)

Click **Create** and copy:
- **Client ID** (e.g., `ABCDEFGHIJKLMNOP`)
- **Client Secret** (e.g., `QRSTUVWXYZ123456`) - **Save securely!**

**Staging OAuth App:**

- **App Name:** `ClickUp MCP Server - Staging`
- **Redirect URI:** `https://clickup-mcp-staging.workers.dev/auth/callback`
- (Same scopes as development)

**Production OAuth App:**

- **App Name:** `ClickUp MCP Server - Production`
- **Redirect URI:** `https://clickup-mcp.workers.dev/auth/callback`
- (Same scopes as development)

### Required OAuth Scopes

Select these scopes when creating the OAuth app:

**Workspace & User:**
- ✅ `user:read` - Read user information
- ✅ `team:read` - Read workspace/team details

**Tasks:**
- ✅ `task:read` - Read tasks
- ✅ `task:write` - Create and update tasks

**Lists & Folders:**
- ✅ `list:read` - Read lists
- ✅ `list:write` - Create and update lists
- ✅ `folder:read` - Read folders
- ✅ `folder:write` - Create and update folders

**Spaces:**
- ✅ `space:read` - Read spaces
- ✅ `space:write` - Create and update spaces

**Time Tracking (Premium tier):**
- ✅ `time_tracking:read` - Read time entries
- ✅ `time_tracking:write` - Start/stop timers

**Custom Fields (Premium tier):**
- ✅ `custom_field:read` - Read custom field values
- ✅ `custom_field:write` - Update custom field values

**Comments:**
- ✅ `comment:read` - Read comments
- ✅ `comment:write` - Create comments

**Goals:**
- ✅ `goal:read` - Read goals
- ✅ `goal:write` - Create and update goals

### Step 3: Store OAuth Credentials

Set the credentials as CloudFlare secrets (see [Secrets Management](#secrets-management)):

```bash
# Development
echo "ABCDEFGHIJKLMNOP" | wrangler secret put CLICKUP_CLIENT_ID --env development
echo "QRSTUVWXYZ123456" | wrangler secret put CLICKUP_CLIENT_SECRET --env development

# Staging (use staging app credentials)
echo "STAGING_CLIENT_ID" | wrangler secret put CLICKUP_CLIENT_ID --env staging
echo "STAGING_CLIENT_SECRET" | wrangler secret put CLICKUP_CLIENT_SECRET --env staging

# Production (use production app credentials)
echo "PROD_CLIENT_ID" | wrangler secret put CLICKUP_CLIENT_ID --env production
echo "PROD_CLIENT_SECRET" | wrangler secret put CLICKUP_CLIENT_SECRET --env production
```

### OAuth Flow Overview

1. User visits `/auth/login`
2. Redirected to ClickUp authorization page
3. User approves access to workspace
4. ClickUp redirects to `/auth/callback` with authorization code
5. Server exchanges code for access token
6. Access token encrypted with `ENCRYPTION_KEY` and stored in `API_KEYS` KV
7. JWT session token generated (signed with `JWT_SECRET`)
8. User receives JWT token (24-hour lifetime)

See [AUTHENTICATION.md](AUTHENTICATION.md) for complete OAuth flow details.

---

## Stripe Setup (Optional)

**Required only if using premium tier subscriptions.**

### Step 1: Create Stripe Product

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Navigate to **Products** → **Add product**
3. Configure:
   - **Name:** "ClickUp MCP Server - Premium"
   - **Description:** "Premium tier with advanced features"
   - **Pricing model:** Recurring
   - **Price:** $4.99 USD / month
   - **Billing period:** Monthly

4. Click **Save product**
5. Copy **Price ID** (e.g., `price_1234567890abcdef`)

### Step 2: Get Stripe API Keys

1. Navigate to **Developers** → **API keys**
2. Copy **Secret key** (starts with `sk_test_` for test mode, `sk_live_` for production)
3. **Never expose this key** - store as CloudFlare secret

### Step 3: Configure Webhook

1. Navigate to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Configure:
   - **Endpoint URL:**
     - Development: `https://clickup-mcp-dev.workers.dev/stripe/webhook`
     - Production: `https://clickup-mcp.workers.dev/stripe/webhook`
   - **Events to listen:**
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.paid`
     - `invoice.payment_failed`

4. Click **Add endpoint**
5. Copy **Signing secret** (e.g., `whsec_1234567890abcdef`)

### Step 4: Set Stripe Secrets

```bash
# Development (use Stripe test keys)
echo "sk_test_1234567890" | wrangler secret put STRIPE_SECRET_KEY --env development
echo "whsec_test_1234567890" | wrangler secret put STRIPE_WEBHOOK_SECRET --env development
echo "price_test_1234567890" | wrangler secret put STRIPE_PRICE_ID --env development

# Production (use Stripe live keys)
echo "sk_live_1234567890" | wrangler secret put STRIPE_SECRET_KEY --env production
echo "whsec_live_1234567890" | wrangler secret put STRIPE_WEBHOOK_SECRET --env production
echo "price_live_1234567890" | wrangler secret put STRIPE_PRICE_ID --env production
```

### Test Stripe Integration

After deployment:

```bash
# Create test checkout session
curl -X POST https://clickup-mcp-dev.workers.dev/stripe/create-checkout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

Response:
```json
{
  "checkout_url": "https://checkout.stripe.com/c/pay/cs_test_abc123..."
}
```

Visit the URL to complete test payment.

---

## Deployment Process

### Build Configuration

The project uses **esbuild** to bundle the Worker:

```json
// package.json
"build:worker": "esbuild src/worker.ts --bundle --format=esm --platform=browser --outfile=dist/worker.js --external:node:*"
```

- **Entry point:** `src/worker.ts`
- **Output:** `dist/worker.js`
- **Format:** ESM (ES Modules)
- **Platform:** Browser (CloudFlare Workers environment)
- **External:** `node:*` (no Node.js builtins - Workers is V8 isolate)

### Environment Configuration

Three environments defined in `wrangler.toml`:

| Environment | Worker Name | URL | Rate Limit | Purpose |
|-------------|-------------|-----|------------|---------|
| **Development** | `clickup-mcp-dev` | `clickup-mcp-dev.workers.dev` | 100/min | Local testing, rapid iteration |
| **Staging** | `clickup-mcp-staging` | `clickup-mcp-staging.workers.dev` | 100/min | Pre-production testing, QA |
| **Production** | `clickup-mcp` | `clickup-mcp.workers.dev` | 60/min | Live user traffic |

### Deploy to Development

```bash
# Build and deploy in one command
npm run deploy:dev
```

This runs:
1. `npm run build:worker` - Compile TypeScript to JavaScript
2. `wrangler deploy --env development` - Deploy to CloudFlare

Output:
```
⛅️ wrangler 4.33.1
-------------------
Total Upload: 245.67 KiB / gzip: 67.89 KiB
Uploaded clickup-mcp-server (1.23 sec)
Published clickup-mcp-dev (0.45 sec)
  https://clickup-mcp-dev.workers.dev
Current Deployment ID: abc123def456-ghi789jkl012
```

### Deploy to Staging

```bash
npm run deploy:staging
```

**Pre-deployment checklist:**
- ✅ All development testing complete
- ✅ Staging KV namespaces created
- ✅ Staging R2 bucket created
- ✅ Staging secrets configured
- ✅ Staging ClickUp OAuth app configured

### Deploy to Production

```bash
npm run deploy:production
```

**Pre-deployment checklist:**
- ✅ Staging testing complete (OAuth flow, tool calls, rate limiting)
- ✅ Production KV namespaces created
- ✅ Production R2 bucket created
- ✅ Production secrets configured (DIFFERENT from staging!)
- ✅ Production ClickUp OAuth app configured
- ✅ Stripe production keys configured (if using premium tier)
- ✅ Monitoring/alerting configured
- ✅ Rollback plan prepared

**Production deployment best practices:**

1. **Deploy during low-traffic hours** (if applicable)
2. **Monitor logs immediately after deployment** (`wrangler tail --env production`)
3. **Validate health endpoint** (`curl https://clickup-mcp.workers.dev/health`)
4. **Test OAuth flow** (complete end-to-end authentication)
5. **Test MCP endpoint** (call tools/list method)
6. **Monitor error rates** (CloudFlare Dashboard → Workers → Metrics)

### Manual Deployment (Advanced)

If you need more control over the deployment:

```bash
# 1. Build bundle
npm run build:worker

# 2. Preview before deploying (opens local preview)
wrangler dev --env production --remote

# 3. Deploy
wrangler deploy --env production

# 4. Verify deployment
wrangler deployments list --env production
```

### Deployment Versioning

CloudFlare Workers automatically versions deployments:

```bash
# List recent deployments
wrangler deployments list --env production
```

Output:
```
┌────────────────────────┬──────────────────┬─────────────────────┐
│ Deployment ID          │ Version          │ Timestamp           │
├────────────────────────┼──────────────────┼─────────────────────┤
│ abc123def456-ghi789... │ v2               │ 2025-01-28 10:30:15 │
│ def456ghi789-jkl012... │ v1               │ 2025-01-27 14:20:45 │
└────────────────────────┴──────────────────┴─────────────────────┘
```

This allows rollback to previous versions (see [Rollback Procedures](#rollback-procedures)).

---

## Post-Deployment Validation

Validate deployment success with these checks:

### 1. Health Check

```bash
curl https://clickup-mcp-dev.workers.dev/health
```

Expected response:
```json
{
  "status": "ok",
  "environment": "development",
  "version": "0.8.5",
  "timestamp": "2025-01-28T10:30:15.000Z"
}
```

**If health check fails:**
- Check deployment logs: `wrangler tail --env development`
- Verify secrets are set: `wrangler secret list --env development`
- Check KV namespace IDs in `wrangler.toml`

### 2. OAuth Flow Test

**Manual test:**

1. Visit: `https://clickup-mcp-dev.workers.dev/auth/login`
2. Authorize ClickUp access
3. Verify redirect to `/auth/callback`
4. Check response contains JWT token

**Automated test:**

```bash
# Start OAuth flow (copy authorization URL)
curl https://clickup-mcp-dev.workers.dev/auth/login

# After manual authorization, check session was created
# (Requires valid JWT token from OAuth flow)
```

**If OAuth fails:**
- Verify `CLICKUP_CLIENT_ID` and `CLICKUP_CLIENT_SECRET` are set
- Check redirect URI matches ClickUp OAuth app configuration
- Verify OAuth scopes are approved
- Check CloudFlare logs for error details

### 3. MCP Protocol Test

Test MCP endpoint with tools/list method:

```bash
# Replace YOUR_JWT_TOKEN with token from OAuth flow
curl -X POST https://clickup-mcp-dev.workers.dev/mcp \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {}
  }'
```

Expected response:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {
        "name": "clickup_workspace_hierarchy",
        "description": "Get workspace structure...",
        "inputSchema": { ... }
      },
      ... (72 tools total)
    ]
  }
}
```

**If MCP endpoint fails:**
- Verify JWT token is valid (not expired)
- Check Authorization header format: `Bearer <token>`
- Verify user session exists in USER_SESSIONS KV
- Check logs: `wrangler tail --env development`

### 4. Rate Limiting Test

Verify rate limiting is enforced:

```bash
# Make rapid requests to test rate limiting
for i in {1..105}; do
  curl -X POST https://clickup-mcp-dev.workers.dev/mcp \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' \
    -s -o /dev/null -w "%{http_code}\n"
done
```

Expected:
- First 100 requests: `200` (within limit)
- Requests 101-105: `429` (rate limited)

Response headers should include:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1706436660
X-RateLimit-Window: 60
```

### 5. Audit Logging Test

Verify audit logs are written to R2:

```bash
# Perform some actions via MCP
curl -X POST https://clickup-mcp-dev.workers.dev/mcp \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "clickup_workspace_hierarchy",
      "arguments": {}
    }
  }'

# List audit logs in R2 bucket
wrangler r2 object list clickup-mcp-audit-dev
```

Output should show log files:
```
audit/user123/2025/01/28/1706436660000.json
```

Download and verify log content:

```bash
wrangler r2 object get clickup-mcp-audit-dev audit/user123/2025/01/28/1706436660000.json
```

### 6. Stripe Integration Test (if enabled)

Create test checkout session:

```bash
curl -X POST https://clickup-mcp-dev.workers.dev/stripe/create-checkout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "checkout_url": "https://checkout.stripe.com/c/pay/cs_test_abc123..."
}
```

**Test webhook:**

1. Use Stripe CLI to forward events:
   ```bash
   stripe listen --forward-to https://clickup-mcp-dev.workers.dev/stripe/webhook
   ```

2. Trigger test event:
   ```bash
   stripe trigger customer.subscription.created
   ```

3. Verify webhook received:
   ```
   2025-01-28 10:30:15 --> customer.subscription.created [evt_test_abc123]
   2025-01-28 10:30:15 <-- [200] POST https://clickup-mcp-dev.workers.dev/stripe/webhook
   ```

---

## Monitoring and Logging

### CloudFlare Dashboard

Access metrics and analytics:

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Navigate to **Workers & Pages**
3. Click your worker (e.g., `clickup-mcp-dev`)
4. View **Metrics** tab

**Key metrics:**
- **Request rate** (requests/second)
- **Error rate** (% of requests with errors)
- **Duration** (p50, p95, p99 latency percentiles)
- **CPU time** (execution time per request)
- **Invocations** (total request count)

**Graphs available:**
- Requests over time (last 24 hours, 7 days, 30 days)
- Error rate over time
- Duration percentiles over time
- Invocations by status code (200, 400, 429, 500)

### Real-Time Logs

Stream logs in real-time with Wrangler:

```bash
# Development
wrangler tail --env development

# Production
wrangler tail --env production
```

Output:
```
2025-01-28T10:30:15.123Z [INFO] Incoming request: POST /mcp
2025-01-28T10:30:15.145Z [INFO] User authenticated: user123
2025-01-28T10:30:15.167Z [INFO] Tool call: clickup_workspace_hierarchy
2025-01-28T10:30:15.234Z [INFO] Request completed: 200 (111ms)
```

**Filter logs:**

```bash
# Only errors
wrangler tail --env production --level error

# Only specific status codes
wrangler tail --env production --status 500

# Combine filters
wrangler tail --env production --level error --status 500
```

**Log format:**

Structured JSON logs (in code):
```typescript
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  level: 'info',
  message: 'Request completed',
  user_id: 'user123',
  request_id: 'req_abc123',
  duration_ms: 111,
  status: 200
}));
```

### Alerts Configuration

Configure alerts for critical issues:

1. Go to **Workers** → **clickup-mcp** → **Triggers**
2. Click **Add Route** → **Notifications**
3. Configure:

**Error rate alert:**
- Metric: Error rate
- Condition: > 1% for 5 minutes
- Notification: Email / Webhook / PagerDuty

**High latency alert:**
- Metric: Duration (p95)
- Condition: > 1000ms for 5 minutes
- Notification: Email / Webhook

**Request drop alert:**
- Metric: Request rate
- Condition: Drops to 0 for 2 minutes
- Notification: Email / Webhook / PagerDuty (critical)

### Custom Metrics (Advanced)

Use Workers Analytics Engine for custom metrics:

```typescript
// In worker code
env.ANALYTICS.writeDataPoint({
  blobs: ['tool_call', 'create_task'],
  doubles: [duration_ms],
  indexes: [user_id, tier]
});
```

Query via GraphQL API:
```bash
curl https://api.cloudflare.com/client/v4/graphql \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -d '{
    "query": "query { viewer { accounts(filter: { accountTag: \"abc123\" }) { ... } } }"
  }'
```

---

## Troubleshooting

### Common Issues

#### 1. Build Failures

**Symptom:**
```
✘ [ERROR] Could not resolve "node:crypto"
```

**Cause:** Attempting to import Node.js builtins in Worker code

**Solution:**
- Workers run in V8 isolate (not Node.js environment)
- Use Web Crypto API instead: `crypto.subtle.encrypt()`
- Update imports:
  ```typescript
  // ❌ Don't use Node.js crypto
  import crypto from 'node:crypto';

  // ✅ Use Web Crypto API
  const crypto = globalThis.crypto;
  ```

#### 2. KV Namespace Not Found

**Symptom:**
```
[ERROR] KV namespace 'USER_SESSIONS' not found
```

**Cause:** Incorrect namespace ID in `wrangler.toml`

**Solution:**
1. List existing namespaces:
   ```bash
   wrangler kv namespace list
   ```

2. Verify IDs match `wrangler.toml`:
   ```toml
   kv_namespaces = [
     { binding = "USER_SESSIONS", id = "abc123def456" }  # Must match!
   ]
   ```

3. Update `wrangler.toml` with correct IDs
4. Redeploy: `npm run deploy:dev`

#### 3. Secrets Not Set

**Symptom:**
```
[ERROR] Cannot read property 'ENCRYPTION_KEY' of undefined
```

**Cause:** Missing CloudFlare secrets

**Solution:**
1. List configured secrets:
   ```bash
   wrangler secret list --env development
   ```

2. Set missing secrets:
   ```bash
   echo "YOUR_VALUE" | wrangler secret put ENCRYPTION_KEY --env development
   ```

3. Verify all required secrets are set:
   - `CLICKUP_CLIENT_ID`
   - `CLICKUP_CLIENT_SECRET`
   - `ENCRYPTION_KEY`
   - `JWT_SECRET`

#### 4. OAuth Redirect URI Mismatch

**Symptom:**
```
{"error": "redirect_uri_mismatch"}
```

**Cause:** Redirect URI in ClickUp OAuth app doesn't match Worker URL

**Solution:**
1. Go to ClickUp OAuth app settings
2. Verify redirect URI matches exactly:
   - Development: `https://clickup-mcp-dev.workers.dev/auth/callback`
   - Production: `https://clickup-mcp.workers.dev/auth/callback`
3. No trailing slash!
4. HTTPS required (HTTP not allowed)

#### 5. Rate Limiting Issues

**Symptom:** Immediate 429 errors after deployment

**Cause:** Stale rate limit data in KV from previous testing

**Solution:**
1. Clear RATE_LIMITS namespace:
   ```bash
   # List keys
   wrangler kv key list --namespace-id="YOUR_RATE_LIMITS_ID"

   # Delete all keys (careful!)
   wrangler kv key list --namespace-id="YOUR_RATE_LIMITS_ID" | \
     jq -r '.[].name' | \
     xargs -I {} wrangler kv key delete {} --namespace-id="YOUR_RATE_LIMITS_ID"
   ```

2. Wait 1 minute for rate limit window to reset
3. Test again

#### 6. Stripe Webhook Signature Verification Failed

**Symptom:**
```
[ERROR] Webhook signature verification failed
```

**Cause:** `STRIPE_WEBHOOK_SECRET` doesn't match Stripe dashboard

**Solution:**
1. Go to Stripe Dashboard → Developers → Webhooks
2. Click your webhook endpoint
3. Click **Reveal** signing secret
4. Update CloudFlare secret:
   ```bash
   echo "whsec_1234567890" | wrangler secret put STRIPE_WEBHOOK_SECRET --env production
   ```
5. Redeploy: `npm run deploy:production`

#### 7. Deployment Timeout

**Symptom:**
```
⚠️  Warning: Deployment took longer than 60 seconds
```

**Cause:** Large bundle size or slow build process

**Solution:**
1. Check bundle size:
   ```bash
   ls -lh dist/worker.js
   ```

2. If > 5 MB, optimize:
   - Remove unused dependencies
   - Use dynamic imports for large modules
   - Minimize included assets

3. Increase timeout (if needed):
   ```bash
   wrangler deploy --env production --timeout 120
   ```

### Debugging Techniques

#### View Detailed Logs

```bash
# Stream logs with verbose output
wrangler tail --env development --format json

# Save logs to file
wrangler tail --env production > logs.txt
```

#### Test Locally with Miniflare

```bash
# Run Worker locally (simulates CloudFlare environment)
wrangler dev --env development --local

# Access local Worker
curl http://localhost:8787/health
```

#### Inspect KV Data

```bash
# List keys in namespace
wrangler kv key list --namespace-id="abc123def456"

# Get specific key value
wrangler kv key get "user:user123" --namespace-id="abc123def456"

# Put test data
echo '{"test": "value"}' | wrangler kv key put "test_key" --namespace-id="abc123def456"
```

#### Inspect R2 Data

```bash
# List objects in bucket
wrangler r2 object list clickup-mcp-audit-dev

# Get specific object
wrangler r2 object get clickup-mcp-audit-dev audit/user123/2025/01/28/1706436660000.json

# Download object to file
wrangler r2 object get clickup-mcp-audit-dev audit/user123/2025/01/28/1706436660000.json --file=audit.json
```

---

## Rollback Procedures

### Immediate Rollback

**When to rollback:**
- Critical production bugs
- Security vulnerabilities discovered
- High error rate (> 5%)
- Service unavailable

**Rollback command:**

```bash
wrangler rollback --env production
```

This reverts to the previous deployment (takes ~30 seconds).

Output:
```
⛅️ Rolling back to previous deployment...
✨ Rollback successful!
Current Deployment ID: def456ghi789-jkl012... (v1)
```

**Verify rollback:**

```bash
curl https://clickup-mcp.workers.dev/health
# Should return previous version
```

### Rollback to Specific Version

**List available versions:**

```bash
wrangler deployments list --env production
```

Output:
```
┌────────────────────────┬──────────────────┬─────────────────────┐
│ Deployment ID          │ Version          │ Timestamp           │
├────────────────────────┼──────────────────┼─────────────────────┤
│ abc123def456-ghi789... │ v3 (current)     │ 2025-01-28 10:30:15 │
│ def456ghi789-jkl012... │ v2               │ 2025-01-27 14:20:45 │
│ ghi789jkl012-mno345... │ v1               │ 2025-01-26 09:15:30 │
└────────────────────────┴──────────────────┴─────────────────────┘
```

**Deploy specific version:**

```bash
wrangler deployments view def456ghi789-jkl012 --env production
wrangler versions deploy def456ghi789-jkl012 --env production
```

### Emergency Disable

**Last resort** - completely disables Worker:

```bash
wrangler delete --env production
```

⚠️ **Warning:** This removes the Worker entirely. Users will get 404 errors.

**To restore:** Redeploy from git:

```bash
git checkout <last_known_good_commit>
npm run deploy:production
```

### Rollback Checklist

After rollback:
- ✅ Verify health endpoint responds
- ✅ Test OAuth flow
- ✅ Test MCP endpoint (tools/list)
- ✅ Monitor error rates for 10 minutes
- ✅ Check CloudFlare logs for issues
- ✅ Notify users (if applicable)
- ✅ Document rollback reason
- ✅ Create incident postmortem

### Preventing Rollbacks

Best practices:
1. **Thorough testing in staging** before production
2. **Gradual rollouts** (if using traffic splitting)
3. **Feature flags** to disable problematic features
4. **Monitoring and alerts** to catch issues early
5. **Automated tests** in CI/CD pipeline
6. **Load testing** before major releases

---

## CI/CD Integration

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to CloudFlare Workers

on:
  push:
    branches:
      - main          # Deploy to production
      - staging       # Deploy to staging
      - develop       # Deploy to development

jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Deploy
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build Worker
        run: npm run build:worker

      - name: Deploy to Development
        if: github.ref == 'refs/heads/develop'
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          command: deploy --env development

      - name: Deploy to Staging
        if: github.ref == 'refs/heads/staging'
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          command: deploy --env staging

      - name: Deploy to Production
        if: github.ref == 'refs/heads/main'
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          command: deploy --env production

      - name: Verify Deployment
        if: github.ref == 'refs/heads/main'
        run: |
          sleep 5  # Wait for deployment to propagate
          curl -f https://clickup-mcp.workers.dev/health || exit 1
```

### GitHub Secrets

Configure these secrets in GitHub:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add secrets:
   - `CLOUDFLARE_API_TOKEN` - CloudFlare API token with Workers deploy permissions

**Create CloudFlare API token:**

1. Go to [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click **Create Token**
3. Use template: **Edit CloudFlare Workers**
4. Configure:
   - **Permissions:**
     - Account > Workers Scripts > Edit
   - **Account Resources:**
     - Include > Your Account
5. Click **Continue to summary** → **Create Token**
6. Copy token and add to GitHub secrets

### Pre-Deployment Tests

Add testing step before deployment:

```yaml
- name: Run Tests
  run: npm test

- name: Run Integration Tests
  run: npm run test:integration
  env:
    CLICKUP_API_KEY: ${{ secrets.CLICKUP_API_KEY_TEST }}
    CLICKUP_TEAM_ID: ${{ secrets.CLICKUP_TEAM_ID_TEST }}
```

### Post-Deployment Validation

Add validation after deployment:

```yaml
- name: Validate Production Deployment
  if: github.ref == 'refs/heads/main'
  run: |
    # Health check
    curl -f https://clickup-mcp.workers.dev/health

    # OAuth endpoints available
    curl -f https://clickup-mcp.workers.dev/auth/login

    # MCP endpoint responds (requires auth, just check 401)
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://clickup-mcp.workers.dev/mcp)
    if [ "$STATUS" != "401" ]; then
      echo "MCP endpoint not responding correctly"
      exit 1
    fi
```

### Notification on Deployment

Send notifications to Slack/Discord:

```yaml
- name: Notify Deployment Success
  if: success() && github.ref == 'refs/heads/main'
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
    payload: |
      {
        "text": "✅ ClickUp MCP Server deployed to production",
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "*Deployment Successful*\n- Environment: Production\n- Commit: ${{ github.sha }}\n- Author: ${{ github.actor }}"
            }
          }
        ]
      }
```

---

## Additional Resources

- [CloudFlare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
- [ClickUp API Documentation](https://clickup.com/api)
- [Stripe API Documentation](https://stripe.com/docs/api)

**Internal Documentation:**
- [AUTHENTICATION.md](AUTHENTICATION.md) - OAuth 2.0 flow details
- [PREMIUM_FEATURES.md](PREMIUM_FEATURES.md) - Premium tier features
- [SECURITY.md](SECURITY.md) - Security architecture and best practices
- [API_REFERENCE.md](API_REFERENCE.md) - Complete API endpoint reference
- [TOOL_REFERENCE.md](TOOL_REFERENCE.md) - All 72 MCP tools documented

---

## Support

**Issues:**
- GitHub Issues: [github.com/yourusername/clickup-mcp-server/issues](https://github.com/yourusername/clickup-mcp-server/issues)

**Community:**
- Discussions: [github.com/yourusername/clickup-mcp-server/discussions](https://github.com/yourusername/clickup-mcp-server/discussions)

**Enterprise Support:**
- Email: support@yourcompany.com
- Priority support for premium subscribers

---

*Last Updated: 2025-10-28*
*Version: 0.8.5*
