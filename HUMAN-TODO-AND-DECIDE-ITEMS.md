# Human TODO & Decision Items

**Created:** November 1, 2025
**Estimated Time:** 2-3 hours
**Priority:** Complete before production deployment

---

## 🚀 Critical Path to Deployment (2 hours)

### 1. CloudFlare Account Setup ⚡ (1 hour)

#### 1.1 Set Account ID
```bash
# Get your account ID from CloudFlare dashboard
# https://dash.cloudflare.com/ → Copy Account ID

# Edit wrangler.toml line 7
account_id = "YOUR_CLOUDFLARE_ACCOUNT_ID"
```

**Location:** `wrangler.toml:7`

#### 1.2 Create KV Namespaces (18 total - 6 per environment)
```bash
# Run automated creation script
npm run kv:create

# This creates:
# Development: USER_SESSIONS_DEV, API_KEYS_DEV, USER_MAPPINGS_DEV, RATE_LIMITS_DEV, TOOL_CONFIGS_DEV, STRIPE_CUSTOMERS_DEV
# Staging: USER_SESSIONS_STAGING, API_KEYS_STAGING, USER_MAPPINGS_STAGING, RATE_LIMITS_STAGING, TOOL_CONFIGS_STAGING, STRIPE_CUSTOMERS_STAGING
# Production: USER_SESSIONS_PROD, API_KEYS_PROD, USER_MAPPINGS_PROD, RATE_LIMITS_PROD, TOOL_CONFIGS_PROD, STRIPE_CUSTOMERS_PROD
```

**Verification:**
```bash
# List all KV namespaces
wrangler kv:namespace list

# Should see 18 namespaces with IDs
```

**Manual Alternative** (if script fails):
```bash
# Development
wrangler kv:namespace create "USER_SESSIONS" --env development
wrangler kv:namespace create "API_KEYS" --env development
wrangler kv:namespace create "USER_MAPPINGS" --env development
wrangler kv:namespace create "RATE_LIMITS" --env development
wrangler kv:namespace create "TOOL_CONFIGS" --env development
wrangler kv:namespace create "STRIPE_CUSTOMERS" --env development

# Repeat for staging and production
```

**Update wrangler.toml:**
Copy the namespace IDs output by the commands above into `wrangler.toml` sections:
- Lines 41-70 (development)
- Lines 95-124 (staging)
- Lines 149-178 (production)

#### 1.3 Create R2 Buckets (3 total - 1 per environment)
```bash
# Development
wrangler r2 bucket create clickup-mcp-audit-logs-dev

# Staging
wrangler r2 bucket create clickup-mcp-audit-logs-staging

# Production
wrangler r2 bucket create clickup-mcp-audit-logs-prod
```

**Verification:**
```bash
# List all R2 buckets
wrangler r2 bucket list

# Should see 3 buckets
```

#### 1.4 Set CloudFlare Secrets
```bash
# Generate encryption key (32 bytes)
openssl rand -base64 32

# Generate JWT secret (64 bytes)
openssl rand -base64 64

# Set secrets for each environment
npm run secrets:set

# This will prompt for:
# - ENCRYPTION_KEY
# - JWT_SECRET
# - CLICKUP_CLIENT_ID (get from step 2)
# - CLICKUP_CLIENT_SECRET (get from step 2)
# - STRIPE_SECRET_KEY (get from step 3)
# - STRIPE_WEBHOOK_SECRET (get from step 3)
```

**Manual Alternative:**
```bash
# Development
wrangler secret put ENCRYPTION_KEY --env development
wrangler secret put JWT_SECRET --env development
wrangler secret put CLICKUP_CLIENT_ID --env development
wrangler secret put CLICKUP_CLIENT_SECRET --env development
wrangler secret put STRIPE_SECRET_KEY --env development
wrangler secret put STRIPE_WEBHOOK_SECRET --env development

# Repeat for staging and production
```

**Checklist:**
- [ ] Account ID set in wrangler.toml
- [ ] 18 KV namespaces created and IDs updated in wrangler.toml
- [ ] 3 R2 buckets created
- [ ] All secrets set for development environment
- [ ] All secrets set for staging environment
- [ ] All secrets set for production environment

---

### 2. ClickUp OAuth App Registration ⚡ (15 minutes)

#### 2.1 Register OAuth Application
1. Go to https://app.clickup.com/settings/apps
2. Click "Create an App"
3. Fill in details:
   - **App Name:** ClickUp MCP Server
   - **Description:** Remote MCP Server for AI agent integration with OAuth 2.0
   - **Redirect URI:** `https://YOUR_WORKER_URL.workers.dev/auth/callback`
   - **Scopes:** (select all that apply)
     - ✅ Read tasks
     - ✅ Write tasks
     - ✅ Read lists
     - ✅ Write lists
     - ✅ Read spaces
     - ✅ Write spaces
     - ✅ Read workspaces
     - ✅ Read users
     - ✅ Read teams
     - ✅ Read time tracking
     - ✅ Write time tracking
     - ✅ Read custom fields
     - ✅ Write custom fields
     - ✅ Read goals
     - ✅ Write goals

4. Save and copy:
   - **Client ID:** (starts with "ABC...")
   - **Client Secret:** (starts with "XYZ...")

#### 2.2 Update Worker Configuration
```bash
# Set ClickUp OAuth credentials
wrangler secret put CLICKUP_CLIENT_ID --env development
# Paste Client ID

wrangler secret put CLICKUP_CLIENT_SECRET --env development
# Paste Client Secret

# Repeat for staging and production
```

#### 2.3 Update Redirect URI in wrangler.toml
Edit `wrangler.toml` and update `OAUTH_REDIRECT_URI` in each environment:

```toml
# Development (line ~39)
OAUTH_REDIRECT_URI = "https://clickup-mcp-dev.YOUR_SUBDOMAIN.workers.dev/auth/callback"

# Staging (line ~93)
OAUTH_REDIRECT_URI = "https://clickup-mcp-staging.YOUR_SUBDOMAIN.workers.dev/auth/callback"

# Production (line ~147)
OAUTH_REDIRECT_URI = "https://clickup-mcp.YOUR_SUBDOMAIN.workers.dev/auth/callback"
```

**Checklist:**
- [ ] OAuth app registered in ClickUp
- [ ] All scopes selected
- [ ] Client ID and Client Secret copied
- [ ] Secrets set in CloudFlare for all environments
- [ ] Redirect URIs updated in wrangler.toml

---

### 3. Stripe Product Configuration ⚡ (30 minutes)

#### 3.1 Create Stripe Product
1. Go to https://dashboard.stripe.com/products
2. Click "+ Add product"
3. Fill in details:
   - **Name:** ClickUp MCP Premium
   - **Description:** Premium tier with 500 req/min, bulk operations, time tracking, and custom fields
   - **Pricing:**
     - **Pricing model:** Recurring
     - **Price:** $4.99 USD
     - **Billing period:** Monthly
   - **Tax code:** Software as a Service (SaaS)

4. Save and copy **Price ID** (starts with "price_...")

#### 3.2 Configure Webhook Endpoint
1. Go to https://dashboard.stripe.com/webhooks
2. Click "+ Add endpoint"
3. Fill in details:
   - **Endpoint URL:** `https://clickup-mcp.YOUR_SUBDOMAIN.workers.dev/stripe/webhook`
   - **Description:** ClickUp MCP subscription events
   - **Events to send:**
     - ✅ `checkout.session.completed`
     - ✅ `customer.subscription.created`
     - ✅ `customer.subscription.updated`
     - ✅ `customer.subscription.deleted`
     - ✅ `invoice.payment_succeeded`
     - ✅ `invoice.payment_failed`

4. Save and copy **Signing secret** (starts with "whsec_...")

#### 3.3 Update Worker Configuration
```bash
# Set Stripe secrets
wrangler secret put STRIPE_SECRET_KEY --env development
# Paste Stripe secret key (sk_test_... for dev, sk_live_... for prod)

wrangler secret put STRIPE_WEBHOOK_SECRET --env development
# Paste webhook signing secret (whsec_...)

# Repeat for staging and production
```

#### 3.4 Update Price ID in wrangler.toml
Edit `wrangler.toml` and update `STRIPE_PRICE_ID` in each environment:

```toml
# Development (line ~40)
STRIPE_PRICE_ID = "price_TEST_ID"  # Use test mode price

# Production (line ~148)
STRIPE_PRICE_ID = "price_LIVE_ID"  # Use live mode price
```

**Test Mode vs Live Mode:**
- Development/Staging: Use Stripe **test mode** (sk_test_..., price_test_...)
- Production: Use Stripe **live mode** (sk_live_..., price_...)

**Checklist:**
- [ ] Stripe product created ($4.99/month)
- [ ] Price ID copied
- [ ] Webhook endpoint configured
- [ ] Webhook signing secret copied
- [ ] Stripe secrets set in CloudFlare for all environments
- [ ] Price IDs updated in wrangler.toml

---

### 4. Deploy to Development Environment ⚡ (15 minutes)

```bash
# Build and deploy to development
npm run deploy:dev

# Expected output:
# ✨ Built successfully
# 🚀 Deployed to https://clickup-mcp-dev.YOUR_SUBDOMAIN.workers.dev
```

**Verify Deployment:**
```bash
# Check worker is running
curl https://clickup-mcp-dev.YOUR_SUBDOMAIN.workers.dev/health

# Expected response:
# {"status":"ok","version":"1.0.0"}
```

**Checklist:**
- [ ] Worker built successfully
- [ ] Worker deployed to CloudFlare
- [ ] Health check returns 200 OK
- [ ] Worker URL accessible

---

## 🧪 Manual Testing Checklist (15 minutes)

### OAuth Flow Test

#### 1. Initiate Login
```bash
# Open in browser
https://clickup-mcp-dev.YOUR_SUBDOMAIN.workers.dev/auth/login
```

**Expected:** Redirect to ClickUp OAuth consent screen

#### 2. Authorize App
- [ ] ClickUp consent screen loads
- [ ] All requested scopes shown
- [ ] Click "Authorize"

**Expected:** Redirect back to `/auth/callback` with code and state

#### 3. Verify Session Created
Check CloudFlare KV:
```bash
wrangler kv:key list --namespace-id=<USER_SESSIONS_DEV_ID>
```

**Expected:** See session key with format `session:<user_id>`

#### 4. Test MCP Request with JWT
```bash
# Get JWT from callback response (check browser developer tools)
JWT_TOKEN="<your_jwt_token>"

# Test tool listing
curl -X POST https://clickup-mcp-dev.YOUR_SUBDOMAIN.workers.dev/mcp \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"method":"tools/list","id":1}'
```

**Expected:** JSON response with 72 tools listed

### Stripe Checkout Test

#### 1. Create Checkout Session
```bash
curl -X POST https://clickup-mcp-dev.YOUR_SUBDOMAIN.workers.dev/stripe/create-checkout \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test_user_123"}'
```

**Expected:** JSON response with `checkout_url`

#### 2. Complete Checkout
- [ ] Open `checkout_url` in browser
- [ ] Fill in test card: `4242 4242 4242 4242`
- [ ] Expiry: Any future date (e.g., 12/25)
- [ ] CVC: Any 3 digits (e.g., 123)
- [ ] Submit payment

**Expected:** Redirect to success page, webhook fired

#### 3. Verify Subscription Created
Check CloudFlare KV:
```bash
wrangler kv:key list --namespace-id=<USER_MAPPINGS_DEV_ID>
```

**Expected:** See user mapping with `subscription_tier: "premium"`

### Tool Execution Test

#### 1. Test Free Tier Tool
```bash
curl -X POST https://clickup-mcp-dev.YOUR_SUBDOMAIN.workers.dev/mcp \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "clickup_workspace_hierarchy",
      "arguments": {}
    },
    "id": 2
  }'
```

**Expected:** Workspace hierarchy returned

#### 2. Test Premium Tool (Free User - Should Fail)
```bash
curl -X POST https://clickup-mcp-dev.YOUR_SUBDOMAIN.workers.dev/mcp \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "clickup_task_bulk_create",
      "arguments": {
        "list_id": "123",
        "tasks": [{"name": "Test"}]
      }
    },
    "id": 3
  }'
```

**Expected:** Error response "Premium tier required"

#### 3. Test Premium Tool (Premium User - Should Succeed)
(Repeat after completing Stripe checkout)

**Expected:** Bulk tasks created successfully

### Rate Limiting Test

```bash
# Send 110 requests rapidly (exceeds free tier limit of 100/min)
for i in {1..110}; do
  curl -X POST https://clickup-mcp-dev.YOUR_SUBDOMAIN.workers.dev/mcp \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"method":"tools/list","id":'$i'}' &
done
wait
```

**Expected:** Requests 101-110 return 429 Too Many Requests

**Checklist:**
- [ ] OAuth login flow completes successfully
- [ ] JWT session created and stored
- [ ] Tool listing returns 72 tools
- [ ] Stripe checkout creates session URL
- [ ] Test payment completes successfully
- [ ] Webhook updates user to premium tier
- [ ] Free tier tools accessible to all users
- [ ] Premium tier tools blocked for free users
- [ ] Premium tier tools accessible to premium users
- [ ] Rate limiting enforces 100 req/min for free users

---

## 🤔 Decision Items

### Decision 1: SPECTRA Workflow Template

**Context:** Current "default" ClickUp project template creates 3 folders (Development, Testing, Documentation). This doesn't align with SPECTRA paradigm where a single agent does all three simultaneously.

**Options:**

#### Option A: Use "epic-based" Template ✅ (Recommended)
```python
# Structure:
Space: "Project Name"
├── Folder: "Epic 1: User Authentication"
│   ├── List: "Wave 1: Setup & Planning"
│   ├── List: "Wave 2: OAuth Implementation"
│   ├── List: "Wave 3: Testing & Documentation"
├── Folder: "Epic 2: Payment Integration"
│   ├── List: "Wave 1: Stripe Setup"
│   ├── List: "Wave 2: Webhook Handling"
│   ├── List: "Wave 3: Testing & Documentation"
```

**Advantages:**
- Folders = Goals/Epics (high-level objectives)
- Lists = Waves/Phases (execution units)
- Single agent handles full wave (dev+test+docs)
- Matches SPECTRA "parallel execution" model

**Disadvantages:**
- Requires initial epic analysis to create folder structure
- Less flexible for ad-hoc tasks

#### Option B: Custom "SPECTRA" Template (Create New)
```python
# Structure:
Space: "Project Name"
├── List: "Wave 1: [Feature Name]"
├── List: "Wave 2: [Feature Name]"
├── List: "Wave 3: [Feature Name]"
├── List: "General Tasks"  # Catch-all for ad-hoc work
```

**Advantages:**
- Flat structure (no folders)
- Each list = complete SPECTRA wave
- Simpler for small projects

**Disadvantages:**
- No grouping by epic/goal
- Can get cluttered with many waves

#### Option C: Keep Current "default" Template
**Advantages:** None for SPECTRA workflow

**Disadvantages:** Forces separation of dev/test/docs into different folders

**Recommendation:** ✅ **Use Option A ("epic-based" template)**

**Action Required:**
```bash
# When initializing ClickUp projects, use:
~/.claude/scripts/clickup-project-init.py --template epic-based
```

**Task Status Recommendation:**
- **To Do** - Wave not started
- **In Progress** - Agent actively working on wave
- **Review** - Wave complete, awaiting review
- **Done** - Wave fully complete and deployed

**Decision:** [ ] Option A (epic-based) [ ] Option B (custom SPECTRA) [ ] Option C (keep default)

---

### Decision 2: PR Workflow for Solo Development

**Context:** Even in solo development, PR-based workflow provides:
- Checkpoint creation before risky changes
- Clear rollback points
- Automatic documentation of changes
- Practice for team collaboration

**Options:**

#### Option A: Adopt PR Workflow with Auto-Merge ✅ (Recommended)
```bash
# Workflow:
1. Create branch: git checkout -b feature/new-feature
2. Make changes and commit
3. Push and create PR: gh pr create --fill
4. Auto-merge (no review needed): gh pr merge --auto --squash
5. CI runs tests, merges if passing
```

**Advantages:**
- Checkpoint before every feature
- CI validates every change
- Easy rollback via PR revert
- Clean commit history (squash merges)
- GitHub Actions can auto-generate release notes

**Disadvantages:**
- Extra step (creating PR)
- Requires GitHub Actions setup

**Implementation:**
```yaml
# .github/workflows/auto-merge.yml
name: Auto-Merge PR
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  auto-merge:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run tests
        run: npm test
      - name: Auto-merge
        if: github.actor == 'gofullthrottle'
        run: gh pr merge --auto --squash
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

#### Option B: Direct Push to Main
**Advantages:** Simpler, faster

**Disadvantages:** No checkpoints, harder rollback, no CI validation

**Recommendation:** ✅ **Adopt Option A (PR workflow with auto-merge)**

**Benefits for Solo Dev:**
- Habit formation for team collaboration
- Automatic documentation via PR descriptions
- CI catch errors before main branch
- Easy feature toggles via draft PRs

**Decision:** [ ] Adopt PR workflow [ ] Keep direct push

---

### Decision 3: Deploy to Production Immediately or Wait?

**Context:** All code complete, manual testing plan ready, 2 hours to deploy.

**Options:**

#### Option A: Deploy to Production Immediately ✅ (Recommended)
**Timeline:** Ship within 2 hours

**Advantages:**
- Get real-world usage feedback
- Validate monetization strategy
- Start learning what users actually need
- Avoid over-engineering before launch

**Disadvantages:**
- Minimal automated test coverage
- May encounter edge cases in production

**Risk Mitigation:**
- Comprehensive manual testing checklist (above)
- Monitor CloudFlare logs closely for first 24 hours
- Start with personal ClickUp workspace
- Rollback plan: Revert deployment via `wrangler rollback`

#### Option B: Build Integration Tests First
**Timeline:** Add 5-7 hours before ship

**Advantages:**
- Higher confidence in code quality
- Catch edge cases before users

**Disadvantages:**
- Delays learning from real users
- May test wrong scenarios (don't know user needs yet)
- Opportunity cost (could be iterating on user feedback)

**Recommendation:** ✅ **Deploy immediately, add tests post-launch**

**Rationale:**
- Code review shows comprehensive implementation
- Manual testing validates critical paths
- User feedback more valuable than speculative tests
- Can add tests for actual failure modes discovered in production

**Decision:** [ ] Deploy immediately [ ] Build tests first

---

### Decision 4: ClickUp Marketplace Application Timing

**Context:** ClickUp accepts third-party MCP servers via application form at https://clickup.com/mcp

**Options:**

#### Option A: Apply Immediately After Launch
**Timeline:** 1-2 hours to prepare materials

**Advantages:**
- Get in queue early
- Official validation and visibility
- Potential featured placement

**Disadvantages:**
- May get questions about test coverage
- No user testimonials yet

#### Option B: Wait 2-4 Weeks for User Feedback ✅ (Recommended)
**Timeline:** Apply after getting 5-10 users

**Advantages:**
- Can include user testimonials
- Have usage metrics to share
- Can showcase actual use cases
- Higher chance of approval with proven traction

**Disadvantages:**
- Delay official listing
- May miss early adopter window

**Recommendation:** ✅ **Wait for initial user feedback before applying**

**Application Checklist (for later):**
- [ ] 5-10 active users
- [ ] User testimonials/feedback
- [ ] Usage metrics (API calls, features used)
- [ ] Video demo of OAuth flow
- [ ] Documentation site live
- [ ] Support email/Discord set up

**Decision:** [ ] Apply immediately [ ] Wait for feedback

---

## 🧹 Repository Cleanup Before Public Release

### Git History Cleanup
**Context:** Repository contains Claude Code-generated markdown files, planning documents, and other development artifacts that should be removed from git history before public release.

**Action Required:** Clean git history using `git-filter-repo` tool.

**Documentation:** See `GIT-HISTORY-CLEANUP-GUIDE.md` in the root folder for complete instructions.

**Checklist:**
- [ ] Review GIT-HISTORY-CLEANUP-GUIDE.md
- [ ] Create backup of repository
- [ ] Create `paths-to-remove.txt` with all unwanted files
- [ ] Run `git-filter-repo` to clean history
- [ ] Verify cleanup and size reduction
- [ ] Force push to new public repository

**⚠️ Important:** Complete this **BEFORE** creating the public GitHub repository to avoid force push complications.

---

## 📋 Final Pre-Launch Checklist

### Infrastructure (1 hour)
- [ ] CloudFlare account ID set
- [ ] 18 KV namespaces created
- [ ] 3 R2 buckets created
- [ ] All secrets configured

### OAuth (15 min)
- [ ] ClickUp OAuth app registered
- [ ] Client ID and secret set
- [ ] Redirect URIs configured
- [ ] All scopes selected

### Stripe (30 min)
- [ ] Product created ($4.99/month)
- [ ] Price ID copied
- [ ] Webhook endpoint configured
- [ ] Test payment completed

### Deployment (15 min)
- [ ] Worker built successfully
- [ ] Deployed to development
- [ ] Health check passing
- [ ] Manual testing completed

### Manual Testing (15 min)
- [ ] OAuth flow works end-to-end
- [ ] JWT sessions created
- [ ] Tool listing returns 72 tools
- [ ] Stripe checkout works
- [ ] Tier enforcement validated
- [ ] Rate limiting enforced

### Decisions
- [ ] SPECTRA template chosen
- [ ] PR workflow decision made
- [ ] Deployment timing decided
- [ ] Marketplace timing decided

### Monitoring Setup
- [ ] CloudFlare dashboard bookmarked
- [ ] Stripe dashboard bookmarked
- [ ] Error alerting configured
- [ ] Usage tracking enabled

---

## 🚨 Rollback Plan

If anything goes wrong after deployment:

### Immediate Rollback
```bash
# Rollback to previous deployment
wrangler rollback --env production

# Verify rollback
curl https://clickup-mcp.YOUR_SUBDOMAIN.workers.dev/health
```

### Disable Payments
```bash
# Pause Stripe webhook endpoint
# Go to https://dashboard.stripe.com/webhooks
# Click endpoint → Disable

# Prevents new subscriptions while debugging
```

### Emergency Shutdown
```bash
# Delete worker (nuclear option)
wrangler delete --env production

# Only use if critical security issue discovered
```

---

## ⏭️ Next Steps After Deployment

### Hour 1-24: Monitor Closely
- Watch CloudFlare Worker logs
- Check error rates
- Validate first real user signup
- Test with personal ClickUp workspace

### Week 1: Initial Feedback
- Use the MCP server yourself daily
- Document any issues encountered
- Add integration tests for discovered edge cases
- Create video walkthrough

### Week 2-4: Iterate and Improve
- Add automated test coverage to 80%+
- Optimize performance based on metrics
- Prepare ClickUp Marketplace application
- Build community (GitHub, Discord, docs site)

### Month 2+: Scale and Enhance
- Submit ClickUp Marketplace application
- Implement MindMap generation feature
- Add enterprise features (SSO, audit exports)
- Partner integrations (Zapier, Make, n8n)

---

**Estimated Total Time:** 2-3 hours to full production deployment

**Status:** Ready to ship! 🚀
