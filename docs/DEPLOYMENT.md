# ClickUp MCP Server - Deployment Guide

## Prerequisites

Before deploying the ClickUp MCP Server to Cloudflare Workers, ensure you have:

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **ClickUp OAuth App**: Create at [ClickUp App Console](https://app.clickup.com/api)
3. **Stripe Account**: Sign up at [stripe.com](https://stripe.com) (for premium features)
4. **Node.js**: Version 18+ installed
5. **Wrangler CLI**: Install with `npm install -g wrangler`

## Step 1: Clone and Setup

```bash
# Clone your modified repository
git clone [your-repo-url]
cd clickup-mcp-server

# Install dependencies
npm install

# Install additional Worker dependencies
npm install --save-dev esbuild
```

## Step 2: Configure Cloudflare Account

### Login to Wrangler
```bash
wrangler login
```

### Get Your Account ID
```bash
wrangler whoami
```

### Update wrangler.toml
Replace `YOUR_CLOUDFLARE_ACCOUNT_ID` in `wrangler.toml` with your actual account ID.

## Step 3: Create ClickUp OAuth Application

1. Go to [ClickUp App Console](https://app.clickup.com/api)
2. Create a new app with:
   - **App Name**: Your MCP Server Name
   - **Redirect URI**: 
     - Development: `http://localhost:8787/auth/callback`
     - Production: `https://your-worker.workers.dev/auth/callback`
   - **Scopes**: Select all necessary scopes for task management

3. Note down:
   - Client ID
   - Client Secret

## Step 4: Setup Stripe (Optional - for Premium Tier)

1. Create a Stripe account
2. Create a subscription product and price
3. Note down:
   - Secret Key
   - Price ID
   - Webhook Endpoint Secret (after creating webhook)

### Create Stripe Webhook
1. In Stripe Dashboard, go to Developers → Webhooks
2. Add endpoint: `https://your-worker.workers.dev/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.deleted`

## Step 5: Create Cloudflare Resources

### Create KV Namespaces
```bash
# Create all KV namespaces for each environment
npm run kv:create
```

Note the IDs returned and update them in `wrangler.toml` if needed.

### Create R2 Buckets
```bash
# Create R2 buckets for audit logs
npm run r2:create
```

## Step 6: Set Environment Secrets

### Generate Secure Keys
```bash
# Generate encryption key
openssl rand -base64 32

# Generate JWT secret
openssl rand -base64 32
```

### Set Secrets for Each Environment

#### Development
```bash
wrangler secret put CLICKUP_CLIENT_ID --env development
# Enter your ClickUp Client ID

wrangler secret put CLICKUP_CLIENT_SECRET --env development
# Enter your ClickUp Client Secret

wrangler secret put ENCRYPTION_KEY --env development
# Enter generated encryption key

wrangler secret put JWT_SECRET --env development
# Enter generated JWT secret

wrangler secret put STRIPE_SECRET_KEY --env development
# Enter Stripe secret key (or use test key)

wrangler secret put STRIPE_WEBHOOK_SECRET --env development
# Enter Stripe webhook secret

wrangler secret put STRIPE_PRICE_ID --env development
# Enter Stripe price ID
```

Repeat for staging and production environments.

## Step 7: Build and Deploy

### Development Deployment
```bash
# Build the Worker
npm run build:worker

# Deploy to development
npm run deploy:dev

# Test locally
npm run dev:worker
```

### Staging Deployment
```bash
npm run deploy:staging
```

### Production Deployment
```bash
npm run deploy:production
```

## Step 8: Verify Deployment

### Check Health Endpoint
```bash
curl https://your-worker.workers.dev/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "environment": "production",
  "version": "1.0.0"
}
```

## Step 9: User Onboarding Flow

### For End Users

1. **Initial Authentication**
   - Navigate to: `https://your-worker.workers.dev/auth/login`
   - Authorize with ClickUp
   - Receive JWT token

2. **Store API Key**
   ```bash
   curl -X POST https://your-worker.workers.dev/auth/api-key \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"api_key": "YOUR_CLICKUP_API_KEY", "team_id": "YOUR_TEAM_ID"}'
   ```

3. **Upgrade to Premium (Optional)**
   ```bash
   curl -X POST https://your-worker.workers.dev/stripe/create-checkout \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

4. **Configure MCP Client**
   
   **For Claude Desktop:**
   ```json
   {
     "mcpServers": {
       "clickup": {
         "url": "https://your-worker.workers.dev/mcp",
         "headers": {
           "Authorization": "Bearer YOUR_JWT_TOKEN"
         }
       }
     }
   }
   ```

## Step 10: Monitoring and Maintenance

### View Logs
```bash
# Real-time logs
wrangler tail --env production

# Filter logs
wrangler tail --env production --search "error"
```

### View Metrics
- Go to Cloudflare Dashboard → Workers & Pages → Your Worker → Analytics

### Update Configuration

#### Update Tool Whitelists
Edit `wrangler.toml`:
```toml
FREE_TIER_TOOLS = "tool1,tool2,tool3"
PREMIUM_TIER_TOOLS = "tool4,tool5,tool6"
```

Then redeploy:
```bash
npm run deploy:production
```

## Troubleshooting

### Common Issues

1. **OAuth Redirect Error**
   - Ensure redirect URI in ClickUp app matches your Worker URL
   - Check CLICKUP_CLIENT_ID and CLICKUP_CLIENT_SECRET are set correctly

2. **KV Storage Errors**
   - Verify KV namespace IDs in wrangler.toml
   - Ensure namespaces are created: `wrangler kv namespace list`

3. **Rate Limiting Issues**
   - Adjust MAX_REQUESTS_PER_MINUTE in wrangler.toml
   - Premium users automatically get 5x the limit

4. **Stripe Webhook Failures**
   - Verify webhook endpoint URL
   - Check STRIPE_WEBHOOK_SECRET is correct
   - Ensure webhook events are properly configured

### Debug Mode
```bash
# Run locally with debug output
wrangler dev --env development --local
```

## Security Best Practices

1. **Rotate Secrets Regularly**
   ```bash
   wrangler secret put ENCRYPTION_KEY --env production
   wrangler secret put JWT_SECRET --env production
   ```

2. **Monitor Audit Logs**
   - Check R2 bucket for audit trail
   - Set up alerts for suspicious activity

3. **Rate Limiting**
   - Adjust limits based on usage patterns
   - Consider geographic rate limiting

4. **API Key Security**
   - API keys are encrypted at rest
   - Never log or expose API keys
   - Implement key rotation reminders

## Cost Optimization

### Cloudflare Workers Pricing
- **Free Tier**: 100,000 requests/day
- **Paid**: $5/month + $0.50 per million requests

### Optimization Tips
1. Enable caching where appropriate
2. Use KV namespaces efficiently
3. Implement request coalescing
4. Monitor usage patterns

## Support and Updates

### Getting Help
- Check logs: `wrangler tail`
- Review metrics in Cloudflare Dashboard
- Check ClickUp API status

### Updating the Server
```bash
# Pull latest changes
git pull

# Update dependencies
npm update

# Rebuild and deploy
npm run build:worker
npm run deploy:production
```

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| CLICKUP_CLIENT_ID | OAuth Client ID | Yes |
| CLICKUP_CLIENT_SECRET | OAuth Client Secret | Yes |
| ENCRYPTION_KEY | Data encryption key | Yes |
| JWT_SECRET | JWT signing secret | Yes |
| STRIPE_SECRET_KEY | Stripe API key | No |
| STRIPE_WEBHOOK_SECRET | Stripe webhook secret | No |
| STRIPE_PRICE_ID | Subscription price ID | No |
| ENVIRONMENT | Environment name | Yes |
| ENABLE_AUDIT_LOGGING | Enable audit logs | Yes |
| ENABLE_RATE_LIMITING | Enable rate limiting | Yes |
| MAX_REQUESTS_PER_MINUTE | Rate limit threshold | Yes |
| FREE_TIER_TOOLS | Comma-separated free tools | Yes |
| PREMIUM_TIER_TOOLS | Comma-separated premium tools | Yes |

## Next Steps

1. **Test the deployment** with a simple MCP client
2. **Configure monitoring** and alerts
3. **Document your specific tool configurations**
4. **Set up backup and recovery procedures**
5. **Plan for scaling** as usage grows

---

For questions or issues, please refer to the main README.md or create an issue in the repository.