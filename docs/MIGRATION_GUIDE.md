# Migration Guide

Guide for migrating from local NPX server to Remote MCP Server SaaS platform.

---

## Table of Contents

1. [Why We Migrated](#why-we-migrated)
2. [What Changed](#what-changed)
3. [Migration Steps](#migration-steps)
4. [Configuration Comparison](#configuration-comparison)
5. [Feature Comparison](#feature-comparison)
6. [Migration Troubleshooting](#migration-troubleshooting)
7. [Rollback (If Needed)](#rollback-if-needed)

---

## Why We Migrated

### The Problem with Local NPX Servers

The original ClickUp MCP Server ran locally via NPX, requiring users to:

1. **Manage API keys manually** - Store sensitive `CLICKUP_API_KEY` in plaintext
2. **Install and update manually** - Run `npx @YOUR_GITHUB_USERNAME/clickup-remote-mcp-server@latest` for updates
3. **Limited availability** - Only works when local machine is running
4. **No premium features** - No monetization path for advanced capabilities
5. **Security concerns** - API keys stored in env files or config files

### The Solution: Remote SaaS Platform

The new Remote MCP Server hosted on CloudFlare Workers provides:

1. **✅ Zero API Key Management** - OAuth 2.0 handles authentication securely
2. **✅ Always Available** - Hosted on global CloudFlare edge network (99.9% uptime)
3. **✅ Auto-Updates** - Server updates automatically, no user action needed
4. **✅ Premium Features** - Freemium model enables bulk operations, time tracking, etc.
5. **✅ Enterprise Security** - AES-256-GCM encryption, audit logging, rate limiting

### Architecture Change

```
OLD: Local NPX Server
┌──────────────┐
│  MCP Client  │
│   (Claude)   │
└──────┬───────┘
       │ stdio
       ▼
┌──────────────┐      ┌───────────┐
│  NPX Server  │─────→│  ClickUp  │
│   (Local)    │◄─────│    API    │
└──────────────┘      └───────────┘
 Requires:
 - CLICKUP_API_KEY
 - CLICKUP_TEAM_ID


NEW: Remote SaaS Platform
┌──────────────┐
│  MCP Client  │
│   (Claude)   │
└──────┬───────┘
       │ HTTPS + JWT
       ▼
┌────────────────────┐      ┌───────────┐
│  CloudFlare Worker │─────→│  ClickUp  │
│  (Remote SaaS)     │◄─────│    API    │
└────────────────────┘      └───────────┘
 Features:
 - OAuth 2.0 auth
 - Multi-tenant isolation
 - Premium tier ($4.99/mo)
 - Global edge deployment
```

---

## What Changed

### Before (Local NPX)

```json
{
  "mcpServers": {
    "clickup": {
      "command": "npx",
      "args": ["-y", "@YOUR_GITHUB_USERNAME/clickup-remote-mcp-server@latest"],
      "env": {
        "CLICKUP_API_KEY": "pk_1234567890_ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        "CLICKUP_TEAM_ID": "12345678"
      }
    }
  }
}
```

**Characteristics:**
- Runs locally via NPX
- API key stored in config (security risk!)
- Stdio transport only
- All 72 tools available (no tiers)
- Manual updates required

### After (Remote SaaS)

```json
{
  "mcpServers": {
    "clickup": {
      "url": "https://clickup-mcp.workers.dev/mcp",
      "headers": {
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      },
      "name": "ClickUp Workspace",
      "description": "Manage ClickUp tasks and projects"
    }
  }
}
```

**Characteristics:**
- Remote server (always available)
- JWT token for authentication (obtained via OAuth)
- HTTP Streamable transport (+ SSE, WebSocket)
- Tiered access (Free: 45 tools, Premium: 72 tools)
- Auto-updates (server-side)

---

## Migration Steps

### Step 1: Remove Old Configuration

**Claude Desktop (macOS/Linux):**

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```bash
# Open config file
code ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Remove old NPX configuration
```

Remove this section:
```json
{
  "mcpServers": {
    "clickup": {
      "command": "npx",
      "args": ["-y", "@YOUR_GITHUB_USERNAME/clickup-remote-mcp-server@latest"],
      "env": {
        "CLICKUP_API_KEY": "pk_...",
        "CLICKUP_TEAM_ID": "..."
      }
    }
  }
}
```

**Other MCP Clients:**

Remove `clickup-mcp-server` from your MCP client configuration.

### Step 2: Authenticate via OAuth

Visit the authentication URL to start OAuth 2.0 flow:

```
https://clickup-mcp.workers.dev/auth/login
```

**What happens:**
1. Redirected to ClickUp authorization page
2. Log in to ClickUp (if not already logged in)
3. Click "Authorize" to grant access to your workspace
4. Redirected back with JWT token

**Save your JWT token** - you'll need it for Step 3.

Example JWT token:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMTIzNDU2IiwidGl...
```

**Security Note:** JWT tokens have 24-hour lifetime. After expiry, visit `/auth/login` again or use `/auth/refresh` to get a new token.

### Step 3: Update MCP Client Configuration

**Claude Desktop:**

```json
{
  "mcpServers": {
    "clickup": {
      "url": "https://clickup-mcp.workers.dev/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_JWT_TOKEN_HERE"
      },
      "name": "ClickUp Workspace",
      "description": "Manage ClickUp tasks and projects"
    }
  }
}
```

**Other MCP Clients:**

Update configuration with:
- **URL:** `https://clickup-mcp.workers.dev/mcp`
- **Authentication:** Bearer token in Authorization header
- **Transport:** HTTP Streamable (recommended) or SSE

### Step 4: Restart MCP Client

**Claude Desktop:**

1. Quit Claude Desktop completely (Cmd+Q on macOS)
2. Reopen Claude Desktop
3. Verify ClickUp MCP Server appears in available tools

**Other clients:**

Restart your MCP client to load new configuration.

### Step 5: Test Connection

Ask Claude (or your AI assistant):

```
"List my ClickUp workspace structure"
```

Claude should call `clickup_workspace_hierarchy` tool and return your workspace structure.

**If this works, migration is complete!** 🎉

---

## Configuration Comparison

### Local NPX vs Remote SaaS

| Aspect | Local NPX (Old) | Remote SaaS (New) |
|--------|----------------|-------------------|
| **Installation** | `npx @YOUR_GITHUB_USERNAME/clickup-remote-mcp-server@latest` | No installation needed |
| **Authentication** | API key in env vars | OAuth 2.0 + JWT token |
| **Availability** | Only when local machine running | 24/7 on CloudFlare edge |
| **Updates** | Manual (`npx @latest`) | Automatic (server-side) |
| **Security** | API key in plaintext | Encrypted API keys (AES-256-GCM) |
| **Transport** | stdio only | HTTP Streamable, SSE, WebSocket |
| **Tools Available** | All 72 tools | Free: 45, Premium: 72 |
| **Rate Limiting** | None | Free: 100/min, Premium: 500/min |
| **Audit Logging** | None | Complete audit trail (R2) |
| **Cost** | Free | Free + Premium ($4.99/mo) |
| **Multi-User** | No (single machine) | Yes (multi-tenant SaaS) |
| **Global Deployment** | No | Yes (300+ CloudFlare data centers) |

---

## Feature Comparison

### Tools Available

**Free Tier (Remote SaaS):**

45 tools available:
- ✅ Workspace hierarchy navigation
- ✅ Basic task operations (create, read, update, delete, move, duplicate)
- ✅ List and folder management
- ✅ Space operations
- ✅ Comment management
- ✅ Member information
- ❌ Bulk operations (premium)
- ❌ Time tracking (premium)
- ❌ Custom fields (premium)
- ❌ Project management features (premium)

**Premium Tier (Remote SaaS):**

All 72 tools:
- ✅ Everything in Free tier
- ✅ Bulk operations (create/update/move/delete multiple items)
- ✅ Time tracking (start/stop timers, time entries)
- ✅ Custom fields (full management)
- ✅ Project management (Gantt charts, milestones, templates)
- ✅ Advanced task operations (dependencies, scheduling)
- ✅ Documents (create and manage)
- ✅ 5x rate limit (500 req/min vs 100 req/min)

**Local NPX (Old):**

All 72 tools available (no tiers):
- ✅ All tools unlocked by default
- ❌ No rate limiting enforcement
- ❌ No audit logging
- ❌ No multi-user support

### Authentication

| Feature | Local NPX | Remote SaaS |
|---------|-----------|-------------|
| **Method** | API key in env | OAuth 2.0 |
| **Storage** | Plaintext in config | AES-256-GCM encrypted |
| **Rotation** | Manual (regenerate key) | Automatic (OAuth refresh) |
| **Revocation** | Delete key in ClickUp | Revoke OAuth app access |
| **Session Management** | No sessions | 24-hour JWT tokens |
| **Multi-Device** | Copy API key to each device | Same JWT on all devices |

### Deployment

| Aspect | Local NPX | Remote SaaS |
|--------|-----------|-------------|
| **Hosting** | User's machine | CloudFlare Workers |
| **Uptime** | When machine is on | 99.9% SLA |
| **Scalability** | Single machine | Auto-scales globally |
| **Updates** | User must update | Automatic deployment |
| **Monitoring** | No monitoring | CloudFlare analytics |
| **Backup** | No backup | Automated backups |

---

## Migration Troubleshooting

### Issue: "Cannot Find NPX Configuration"

**Problem:** Old NPX configuration not found during removal.

**Solution:** That's fine! If NPX configuration doesn't exist, skip Step 1 and proceed to Step 2 (OAuth authentication).

### Issue: OAuth Redirects to Error Page

**Problem:** OAuth flow fails with "redirect_uri_mismatch" or similar error.

**Causes:**
- Using custom domain instead of workers.dev domain
- Browser blocking redirects

**Solution:**

1. **Use official domain:**
   ```
   https://clickup-mcp.workers.dev/auth/login
   ```

2. **Allow redirects in browser** (check browser settings)

3. **Try different browser** (Chrome, Firefox, Safari)

4. **Clear cookies and try again**

### Issue: JWT Token Expired

**Problem:** "Unauthorized" errors after 24 hours.

**Solution:**

JWT tokens expire after 24 hours. Get a new token:

**Option 1: Re-authenticate**
```
https://clickup-mcp.workers.dev/auth/login
```

**Option 2: Refresh token** (if expired < 7 days ago)
```bash
curl -X POST https://clickup-mcp.workers.dev/auth/refresh \
  -H "Authorization: Bearer YOUR_EXPIRED_TOKEN"
```

### Issue: Tools Not Available

**Problem:** Some tools show as unavailable.

**Cause:** Premium-only tools require subscription.

**Solution:**

1. **Check tool tier:**
   See [TOOL_REFERENCE.md](TOOL_REFERENCE.md) for tool-by-tool tier requirements.

2. **Upgrade to premium:**
   ```bash
   curl -X POST https://clickup-mcp.workers.dev/stripe/create-checkout \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

   Complete Stripe checkout to activate premium features immediately.

### Issue: Different Results Than Local Server

**Problem:** Remote server returns different results than local NPX server.

**Causes:**
1. Rate limiting (remote enforces limits, local doesn't)
2. Tool access restrictions (free vs premium tiers)
3. API version differences (remote always uses latest)

**Solution:**

1. **Check rate limit headers:**
   ```bash
   curl -I https://clickup-mcp.workers.dev/mcp \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

2. **Verify tool access:**
   Check if tool requires premium tier.

3. **Upgrade to premium** for full feature parity with local server.

### Issue: Performance Slower Than Local

**Problem:** Remote server feels slower than local NPX server.

**Expected:** Remote server adds ~50-100ms network latency (global edge reduces this).

**If experiencing >500ms latency:**

1. **Check ClickUp API status:**
   Visit [status.clickup.com](https://status.clickup.com)

2. **Test from different location:**
   Network latency varies by geography (CloudFlare's edge network minimizes this).

3. **Report performance issue:**
   Contact support with details (location, timestamp, tool used).

---

## Rollback (If Needed)

If you need to temporarily revert to local NPX server:

### Step 1: Restore Local Configuration

```json
{
  "mcpServers": {
    "clickup": {
      "command": "npx",
      "args": ["-y", "@YOUR_GITHUB_USERNAME/clickup-remote-mcp-server@latest"],
      "env": {
        "CLICKUP_API_KEY": "YOUR_API_KEY",
        "CLICKUP_TEAM_ID": "YOUR_TEAM_ID"
      }
    }
  }
}
```

### Step 2: Get ClickUp API Key

If you don't have your API key:

1. Go to ClickUp Settings → Apps
2. Click "Apps" → "API Token"
3. Click "Generate" or copy existing token
4. Save securely

**Note:** OAuth and API key authentication are separate. You can use both simultaneously if needed.

### Step 3: Restart MCP Client

Restart Claude Desktop or your MCP client.

### Step 4: Test Local Server

Ask Claude:
```
"List my ClickUp workspace structure"
```

If this works, rollback is complete.

### Why Rollback Might Be Needed

- Remote server experiencing downtime
- Testing local development version
- Network connectivity issues
- Preference for local execution

**Recommendation:** Report issues to support rather than permanently rolling back. The remote platform provides better security, availability, and features.

---

## Additional Resources

- [README.md](../README.md) - Overview and quick start
- [AUTHENTICATION.md](AUTHENTICATION.md) - OAuth 2.0 flow details
- [API_REFERENCE.md](API_REFERENCE.md) - API endpoints
- [TOOL_REFERENCE.md](TOOL_REFERENCE.md) - All 72 tools
- [PREMIUM_FEATURES.md](PREMIUM_FEATURES.md) - Premium tier features
- [SECURITY.md](SECURITY.md) - Security architecture
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues

---

## Getting Help

**Migration Issues:**

1. **Documentation:** Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
2. **Community:** [GitHub Discussions](https://github.com/YOUR_GITHUB_USERNAME/clickup-remote-mcp-server/discussions)
3. **Support:** Email support@yourcompany.com

**Pre-Migration Questions:**

- Ask in [GitHub Discussions](https://github.com/YOUR_GITHUB_USERNAME/clickup-remote-mcp-server/discussions)
- Read [DOCUMENTATION_ALIGNMENT_PLAN.md](../DOCUMENTATION_ALIGNMENT_PLAN.md) for complete migration rationale

---

*Last Updated: 2025-10-28*
*Version: 1.0.0*
