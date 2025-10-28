# Deployment and Configuration Scripts

This directory contains automation scripts to help with deployment and configuration of the ClickUp MCP Server on CloudFlare Workers.

## Scripts Overview

### 1. `update-branding.sh` ⭐ Start Here

**Purpose**: Update all references from the original `taazkareem` branding to your own.

**Usage**:
```bash
./scripts/update-branding.sh
```

**What it does**:
- Updates package.json with your npm scope and GitHub username
- Updates SPDX headers in all source files
- Updates README.md
- Updates git remote URL
- Regenerates package-lock.json

**When to run**: First, before any other setup steps

---

### 2. `configure-services.sh`

**Purpose**: Configure external services (ClickUp OAuth and Stripe)

**Usage**:
```bash
./scripts/configure-services.sh
```

**What it does**:
- Guides you through ClickUp OAuth app configuration
- Saves OAuth credentials securely
- Optionally configures Stripe for payments
- Creates `.cloudflare-secrets/` directory with credentials

**When to run**: After branding update, before CloudFlare setup

**Prerequisites**:
- CloudFlare Workers subdomain name
- ClickUp OAuth app created (or ready to create)
- Stripe account (optional)

---

### 3. `setup-cloudflare.sh` ⚠️ Requires CloudFlare Account

**Purpose**: Automate CloudFlare infrastructure setup

**Usage**:
```bash
./scripts/setup-cloudflare.sh
```

**What it does**:
- Updates wrangler.toml with your CloudFlare account ID
- Creates KV namespaces for dev and staging
- Creates R2 buckets for audit logs
- Generates secure encryption keys and JWT secrets
- Configures CloudFlare secrets

**When to run**: After configuring external services

**Prerequisites**:
- CloudFlare account with Workers enabled
- `wrangler` CLI installed and authenticated
- ClickUp OAuth credentials from previous step

---

### 4. `validate-deployment.sh`

**Purpose**: Test that deployed Worker is functioning correctly

**Usage**:
```bash
./scripts/validate-deployment.sh
```

**What it does**:
- Tests health check endpoint
- Validates OAuth endpoints
- Tests MCP authentication
- Checks CORS headers
- Optionally tests complete OAuth flow
- Tests MCP tools/list with valid JWT

**When to run**: After deploying to any environment

**Supports**:
- Local development (localhost:8787)
- Development worker (deployed)
- Staging worker (deployed)

---

## Recommended Workflow

Follow these steps in order for a smooth deployment:

### Step 1: Branding (5 minutes)
```bash
./scripts/update-branding.sh
```
- Enter your npm scope
- Enter your GitHub username
- Review changes with `git diff`

### Step 2: External Services (10 minutes)
```bash
./scripts/configure-services.sh
```
- Configure ClickUp OAuth app
- Optionally configure Stripe
- Credentials saved to `.cloudflare-secrets/`

### Step 3: CloudFlare Setup (15 minutes)
```bash
./scripts/setup-cloudflare.sh
```
- Enter CloudFlare account ID
- Create KV namespaces
- Create R2 buckets
- Set secrets

⚠️ **Manual Step**: After creating KV namespaces, update `wrangler.toml` with the generated namespace IDs

### Step 4: Build and Deploy (5 minutes)
```bash
npm run build:worker
npm run deploy:dev
```

### Step 5: Validate (5 minutes)
```bash
./scripts/validate-deployment.sh
```
- Choose environment to test
- Run automated tests
- Test OAuth flow interactively

### Step 6: Deploy to Staging
```bash
npm run deploy:staging
./scripts/validate-deployment.sh  # Test staging
```

---

## Credentials and Security

All scripts save sensitive credentials to `.cloudflare-secrets/` which is gitignored.

**Files created**:
- `.cloudflare-secrets/encryption_key.txt` - AES-256 encryption key
- `.cloudflare-secrets/jwt_secret.txt` - JWT signing secret
- `.cloudflare-secrets/clickup-oauth.txt` - ClickUp OAuth credentials
- `.cloudflare-secrets/stripe.txt` - Stripe credentials (if configured)

**Security Best Practices**:
- ✅ `.cloudflare-secrets/` is in .gitignore
- ✅ Files have restrictive permissions (chmod 600)
- ✅ Different keys for each environment
- ✅ Rotate keys periodically
- ❌ Never commit .cloudflare-secrets/ to git
- ❌ Never share these files publicly

---

## Troubleshooting

### wrangler command not found
```bash
npm install -g wrangler
wrangler login
```

### Permission denied when running scripts
```bash
chmod +x scripts/*.sh
```

### KV namespace creation fails
- Ensure you're authenticated: `wrangler login`
- Check CloudFlare account has Workers enabled
- Verify billing is set up

### Secrets not set correctly
```bash
# List current secrets
wrangler secret list --env development

# Delete and re-add a secret
wrangler secret delete SECRET_NAME --env development
wrangler secret put SECRET_NAME --env development
```

### OAuth redirect fails
- Verify redirect URIs match exactly in ClickUp app settings
- Check for trailing slashes (should not have one)
- Ensure HTTPS for deployed workers (HTTP only for localhost)

---

## Additional Manual Steps

### Update KV Namespace IDs in wrangler.toml

After running `setup-cloudflare.sh`, you need to manually update `wrangler.toml`:

1. Copy the namespace IDs from the script output
2. Edit `wrangler.toml`
3. Update lines 18-23 (development environment)
4. Update lines 45-50 (staging environment)

Example:
```toml
kv_namespaces = [
  { binding = "USER_SESSIONS", id = "abc123...", preview_id = "abc123..." },
  # ... etc
]
```

### Configure ClickUp OAuth Redirect URIs

1. Go to https://app.clickup.com/settings/apps
2. Create or edit your OAuth app
3. Add redirect URIs (provided by `configure-services.sh`)
4. Save OAuth Client ID and Client Secret

### Set up Stripe Webhook (Optional)

1. Go to https://dashboard.stripe.com/webhooks
2. Add endpoint URL (provided by `configure-services.sh`)
3. Select events: `checkout.session.completed`, `customer.subscription.deleted`
4. Save webhook signing secret

---

## Getting Help

If you encounter issues:

1. Check script output for specific error messages
2. Review the main deployment plan: `.claude/plans/2025-01-18-clickup-mcp-production-deployment.md`
3. Check CloudFlare Workers logs: `wrangler tail --env development`
4. Validate environment: `wrangler whoami`

For more detailed documentation, see:
- [CloudFlare Workers Docs](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
- [ClickUp API Docs](https://clickup.com/api)
