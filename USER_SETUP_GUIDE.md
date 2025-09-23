# ClickUp MCP Server - User Setup Guide

Welcome! This guide will help you connect your ClickUp workspace to AI assistants like Claude using our MCP Server.

## Quick Start (5 minutes)

### Step 1: Authenticate with ClickUp

Visit our authentication page:
```
https://clickup-mcp.workers.dev/auth/login
```

You'll be redirected to ClickUp to authorize the connection. After approval, you'll receive a session token.

### Step 2: Get Your ClickUp API Key

1. Log into [ClickUp](https://app.clickup.com)
2. Navigate to **Settings** → **Apps** → **API Token**
3. Generate or copy your personal API token
4. Find your Team ID in the URL when viewing your workspace

### Step 3: Store Your API Key Securely

Using the token from Step 1, store your ClickUp credentials:

```bash
curl -X POST https://clickup-mcp.workers.dev/auth/api-key \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "pk_YOUR_CLICKUP_API_KEY",
    "team_id": "YOUR_TEAM_ID"
  }'
```

Your API key is now encrypted and securely stored!

### Step 4: Configure Your AI Client

#### For Claude Desktop

1. Open Claude Desktop settings
2. Navigate to MCP Servers configuration
3. Add this configuration:

```json
{
  "clickup-mcp": {
    "url": "https://clickup-mcp.workers.dev/mcp",
    "headers": {
      "Authorization": "Bearer YOUR_SESSION_TOKEN"
    },
    "name": "ClickUp Workspace",
    "description": "Manage ClickUp tasks and projects"
  }
}
```

4. Restart Claude Desktop

## Available Features

### Free Tier
All users get access to essential ClickUp operations:

- **View workspace hierarchy** - Navigate spaces, folders, and lists
- **Create tasks** - Add new tasks with descriptions and due dates
- **Update tasks** - Modify existing tasks
- **View tasks** - Get task details and status
- **Basic organization** - Access lists, folders, and spaces

### Premium Tier ($4.99/month)
Unlock advanced features for power users:

- **Bulk operations** - Create, update, move, or delete multiple tasks at once
- **Time tracking** - Start/stop timers and manage time entries
- **Custom fields** - Set and manage custom field values
- **Project management** - Create and update projects
- **Advanced task operations** - Complex task manipulations
- **Priority support** - Get help when you need it
- **5x rate limits** - 500 requests/minute vs 100 for free tier

## Usage Examples

Once configured, you can use natural language with your AI assistant:

### Basic Task Management
```
"Create a task called 'Review Q1 Reports' due next Monday in my Marketing list"

"Update the task 'Website Redesign' status to 'In Progress'"

"Show me all tasks in the Development folder"
```

### Time Tracking (Premium)
```
"Start tracking time on the 'Client Meeting Prep' task"

"Stop my current timer and add a description"

"Log 2 hours on the 'Code Review' task for yesterday"
```

### Bulk Operations (Premium)
```
"Create 5 tasks for the sprint planning: 
1. Setup environment
2. Database migration
3. API development
4. Frontend integration
5. Testing and QA"

"Move all tasks from 'Backlog' to 'Sprint 23'"
```

## Upgrade to Premium

### Why Upgrade?

- **Save hours** with bulk operations
- **Track time** directly through AI commands
- **Manage complex projects** with custom fields
- **Get more done** with 5x rate limits
- **Support development** of new features

### How to Upgrade

1. Get your subscription link:
```bash
curl -X POST https://clickup-mcp.workers.dev/stripe/create-checkout \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

2. Complete payment through Stripe's secure checkout
3. Premium features activate immediately!

### Manage Subscription

- **Cancel anytime** - No contracts or hidden fees
- **Instant activation** - Start using premium features immediately
- **Secure payments** - Handled by Stripe
- **Auto-renewal** - Never lose access to your tools

## Security & Privacy

### How We Protect Your Data

- **Encrypted Storage**: Your ClickUp API key is encrypted using AES-256-GCM
- **Secure Sessions**: JWT tokens expire after 24 hours
- **No Password Storage**: We never store your ClickUp password
- **Audit Logging**: Track all actions for security monitoring
- **Data Isolation**: Your data is completely isolated from other users

### What We Store

- **Encrypted API Key**: For accessing your ClickUp workspace
- **Team ID**: To identify your workspace
- **Session Tokens**: For authentication (auto-expire)
- **Usage Metrics**: Anonymous statistics for rate limiting

### What We DON'T Store

- ❌ Your ClickUp password
- ❌ Task content or descriptions
- ❌ Personal information beyond email
- ❌ Unencrypted API keys

## Troubleshooting

### Common Issues

#### "Authentication Required"
Your session has expired. Get a new token:
1. Visit `https://clickup-mcp.workers.dev/auth/login`
2. Update your MCP configuration with the new token

#### "API Key Not Found"
You haven't stored your ClickUp API key yet. Follow Step 3 in Quick Start.

#### "Rate Limit Exceeded"
You've hit the request limit. Options:
- Wait 1 minute for the limit to reset
- Upgrade to Premium for 5x higher limits

#### "Tool Not Available"
This tool requires Premium access. Upgrade to unlock all features.

### Getting Help

1. **Check Status**: Verify the service is running
   ```bash
   curl https://clickup-mcp.workers.dev/health
   ```

2. **Review Your Setup**: Ensure your API key and Team ID are correct

3. **Contact Support**: Premium users get priority support

## Best Practices

### Optimize Your Workflow

1. **Use Specific Names**: Be specific when referencing tasks or lists
2. **Batch Operations**: Group similar actions together
3. **Natural Language**: Speak naturally - the AI understands context
4. **Regular Sync**: Refresh your session token monthly

### Security Tips

1. **Rotate API Keys**: Generate new ClickUp API keys periodically
2. **Secure Storage**: Never share your session token
3. **Monitor Usage**: Check your audit logs regularly
4. **Logout When Done**: Revoke tokens you're not using

## API Limits

| Feature | Free Tier | Premium Tier |
|---------|-----------|--------------|
| Requests/minute | 100 | 500 |
| Bulk operations | ❌ | ✅ Up to 50 items |
| Time tracking | ❌ | ✅ Unlimited |
| Custom fields | ❌ | ✅ All types |
| Session duration | 24 hours | 24 hours |
| Support | Community | Priority |

## Frequently Asked Questions

### Is my data safe?
Yes! We use bank-level encryption and never store your actual task data. Only your encrypted API key is stored for authentication.

### Can I use multiple workspaces?
Currently, one workspace per account. We're working on multi-workspace support!

### What happens if I cancel Premium?
You immediately return to the Free tier with its features. No data is lost.

### Do you access my ClickUp data?
No. The server only processes commands you explicitly send through your AI assistant.

### Can I self-host this?
Yes! The code is open source. See DEPLOYMENT.md for self-hosting instructions.

### What AI assistants are supported?
Any MCP-compatible client: Claude Desktop, Continue.dev, and more coming soon!

## Updates and Changelog

### Version 1.0.0 (Current)
- ✅ OAuth authentication
- ✅ Secure API key storage
- ✅ 65+ ClickUp tools
- ✅ Stripe payment integration
- ✅ Free and Premium tiers
- ✅ Rate limiting
- ✅ Audit logging

### Coming Soon
- 🚧 Multi-workspace support
- 🚧 Team collaboration features
- 🚧 Webhook integrations
- 🚧 Mobile app support
- 🚧 Advanced reporting

---

**Need more help?** Check our [documentation](https://github.com/your-repo) or reach out to support (Premium users get priority response).

**Ready to supercharge your ClickUp workflow?** [Get started now!](https://clickup-mcp.workers.dev/auth/login)