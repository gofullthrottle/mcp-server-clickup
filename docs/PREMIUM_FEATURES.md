---
title: Premium Features & Subscription
description: Premium tier features, pricing, upgrade procedures, and Stripe billing integration for ClickUp MCP Server
keywords: [premium, subscription, pricing, billing, stripe, features, upgrade]
category: features
ai_tags: [premium-features, subscription, billing, stripe-integration, pricing]
last_updated: 2025-10-28
---

# Premium Features & Subscription

<!-- AI-OPTIMIZATION: Clear premium feature documentation for embeddings -->

## Overview

Upgrade to **Premium** for advanced ClickUp automation capabilities, higher rate limits, and priority support. Premium unlocks 40+ additional tools for bulk operations, time tracking, custom fields, and project management.

**Premium Benefits:**
- 🚀 **5x Rate Limits** - 500 requests/minute (vs 100 free)
- 🛠️ **40+ Premium Tools** - Advanced automation capabilities
- ⏱️ **Time Tracking** - Start/stop timers, manage time entries
- 📦 **Bulk Operations** - Create/update/move multiple tasks at once
- 🔧 **Custom Fields** - Full custom field management
- 📊 **Project Management** - Gantt charts, milestones, dependencies
- 📞 **Priority Support** - Faster response times
- 💼 **Team Features** - Advanced collaboration tools

**Pricing:** $4.99/month

## Quick Start: Upgrade to Premium

### Step 1: Create Subscription

```bash
# Get your Stripe checkout link
curl -X POST https://clickup-mcp.workers.dev/stripe/create-checkout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/c/pay/cs_test_...",
  "session_id": "cs_test_xyz123"
}
```

### Step 2: Complete Payment

1. Visit the Stripe checkout URL
2. Enter payment details (credit/debit card)
3. Complete secure payment via Stripe
4. Premium features activate **immediately** upon successful payment

### Step 3: Verify Premium Access

```bash
# Check your current tier
curl -X GET https://clickup-mcp.workers.dev/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "user": {
    "id": "12345",
    "email": "user@example.com",
    "tier": "premium",
    "rate_limit": 500
  }
}
```

## Feature Comparison

### Complete Free vs Premium Breakdown

| Feature Category | Free Tier | Premium Tier |
|------------------|-----------|--------------|
| **Rate Limits** | 100 requests/minute | ⚡ **500 requests/minute** |
| **Task Management** | ✅ Basic CRUD (create, read, update, delete) | ✅ All free + advanced features |
| **Bulk Operations** | ❌ Not available | ✅ **6 bulk operation tools** |
| **Time Tracking** | ❌ Not available | ✅ **6 time tracking tools** |
| **Custom Fields** | ❌ Read-only access | ✅ **5 custom field management tools** |
| **Project Management** | ❌ Basic views only | ✅ **Gantt charts, milestones, templates** |
| **Workspace Navigation** | ✅ Hierarchy, lists, folders | ✅ Enhanced with advanced filters |
| **Comments** | ✅ Add/view comments | ✅ Advanced comment management |
| **Attachments** | ✅ Basic file operations | ✅ Advanced file management |
| **Dependencies** | ❌ Not available | ✅ **Task dependencies & links** |
| **Tags** | ✅ Basic tag operations | ✅ Advanced tag management |
| **Documents** | ❌ Not available | ✅ **Create and manage ClickUp docs** |
| **Goals** | ❌ Not available | ✅ **Goal tracking & OKRs** |
| **Support** | Community forums | 📞 **Priority email support** |
| **Billing** | Free forever | **$4.99/month** |

### Tool Count Breakdown

**Free Tier: ~30 tools**
- Task Management: 8 tools (basic CRUD)
- List Management: 6 tools
- Workspace Operations: 8 tools
- Comments: 2 tools
- Views: 1 tool
- Tags: 3 tools (basic)
- Other: 2 tools

**Premium Tier: 72 tools total (30 free + 42 premium)**
- All free tier tools
- Bulk Operations: 6 tools
- Time Tracking: 6 tools
- Custom Fields: 5 tools
- Project Management: 5 tools
- Advanced Task Features: 6 tools
- Documents: 7 tools
- Space Management: 4 tools (advanced)
- Tags: 2 additional tools
- Dependencies: 5 tools
- Attachments: 3 tools (advanced)
- Goals: 3 tools

## Premium Tool Categories

### 1. Bulk Operations (6 Tools) 💎

Efficiently manage multiple items at once, saving hours of manual work.

| Tool | Description | Use Case |
|------|-------------|----------|
| `clickup_task_bulk_create` | Create multiple tasks in one request | Sprint planning, project initialization |
| `clickup_task_bulk_update` | Update multiple tasks simultaneously | Mass status changes, bulk assignments |
| `clickup_task_bulk_move` | Move tasks between lists/folders | Workspace reorganization |
| `clickup_task_bulk_delete` | Delete multiple tasks at once | Cleanup, archive old projects |
| `clickup_list_bulk_create` | Create multiple lists | New project setup |
| `clickup_folder_bulk_create` | Create multiple folders | Workspace structuring |

**Example: Bulk Task Creation**
```typescript
await client.callTool('clickup_task_bulk_create', {
  list_id: '12345',
  tasks: [
    { name: 'Sprint Planning', priority: 1 },
    { name: 'Design Review', priority: 2 },
    { name: 'Code Review', priority: 2 },
    { name: 'Testing', priority: 3 },
    { name: 'Deployment', priority: 1 }
  ]
});
// Creates 5 tasks in one API call
```

**ROI:** Save 80% time on bulk operations. What takes 30 minutes manually completes in 3 minutes.

---

### 2. Time Tracking (6 Tools) 💎

Track time spent on tasks, generate time reports, and manage productivity.

| Tool | Description | Use Case |
|------|-------------|----------|
| `clickup_time_start_timer` | Start timer on a task | Begin work session |
| `clickup_time_stop_timer` | Stop active timer | End work session |
| `clickup_time_get_entries` | Retrieve time entries | Time reports, invoicing |
| `clickup_time_create_entry` | Manually log time | Retrospective time logging |
| `clickup_time_update_entry` | Update existing time entry | Correct time records |
| `clickup_time_delete_entry` | Remove time entry | Fix logging errors |

**Example: Time Tracking Workflow**
```typescript
// Start timer
const timer = await client.callTool('clickup_time_start_timer', {
  task_id: 'abc123',
  description: 'Implementing authentication'
});

// Work on task...

// Stop timer
await client.callTool('clickup_time_stop_timer', {
  task_id: 'abc123'
});

// Get weekly report
const entries = await client.callTool('clickup_time_get_entries', {
  team_id: '67890',
  start_date: '2024-10-21',
  end_date: '2024-10-28'
});
```

**ROI:** Accurate time tracking for billing, productivity analysis, and project estimation.

---

### 3. Custom Fields (5 Tools) 💎

Extend ClickUp with custom metadata fields tailored to your workflow.

| Tool | Description | Use Case |
|------|-------------|----------|
| `clickup_custom_field_create` | Create custom field | Add project-specific metadata |
| `clickup_custom_field_list` | List all custom fields | Discover available fields |
| `clickup_custom_field_update` | Update field definition | Modify field options |
| `clickup_custom_field_set_value` | Set field value on task | Tag tasks with custom data |
| `clickup_custom_field_delete` | Remove custom field | Clean up unused fields |

**Example: Custom Field Management**
```typescript
// Create custom field for "Client Name"
const field = await client.callTool('clickup_custom_field_create', {
  list_id: '12345',
  name: 'Client Name',
  type: 'text',
  required: true
});

// Set field value on task
await client.callTool('clickup_custom_field_set_value', {
  task_id: 'abc123',
  field_id: field.id,
  value: 'Acme Corporation'
});
```

**Supported Field Types:**
- Text (short and long)
- Number
- Dropdown (single select)
- Labels (multi-select)
- Date
- Checkbox
- URL
- Email
- Phone
- Currency
- Rating

**ROI:** Customize ClickUp to match your exact workflow without limitations.

---

### 4. Project Management (5 Tools) 💎

Advanced project management features for complex workflows.

| Tool | Description | Use Case |
|------|-------------|----------|
| `clickup_gantt_generate` | Generate Gantt chart | Project timeline visualization |
| `clickup_milestone_create` | Create project milestone | Track major deliverables |
| `clickup_milestone_list` | List all milestones | Monitor progress |
| `clickup_template_create` | Create reusable template | Standardize workflows |
| `clickup_template_apply` | Apply template to space/folder | Quick project setup |

**Example: Gantt Chart Generation**
```typescript
const gantt = await client.callTool('clickup_gantt_generate', {
  space_id: '12345',
  start_date: '2024-11-01',
  end_date: '2024-12-31'
});
// Returns Gantt chart data with task dependencies and timelines
```

**ROI:** Visualize complex projects, manage dependencies, and track critical paths.

---

### 5. Advanced Task Features (6 Tools) 💎

Enhanced task management capabilities for power users.

| Tool | Description | Use Case |
|------|-------------|----------|
| `clickup_task_schedule` | Schedule recurring tasks | Automate repetitive work |
| `clickup_task_add_dependency` | Create task dependencies | Define workflow order |
| `clickup_task_remove_dependency` | Remove dependency | Adjust workflows |
| `clickup_task_watchers_add` | Add watchers to task | Notify stakeholders |
| `clickup_task_watchers_remove` | Remove watchers | Manage notifications |
| `clickup_task_checklist_template` | Apply checklist template | Standardize subtasks |

**Example: Task Dependencies**
```typescript
// Task B depends on Task A completing first
await client.callTool('clickup_task_add_dependency', {
  task_id: 'task_B_id',
  depends_on: 'task_A_id',
  dependency_type: 'waiting_on'
});
```

**ROI:** Model complex workflows with dependencies, automate recurring tasks.

---

### 6. Documents (7 Tools) 💎

Create and manage ClickUp documents (similar to Google Docs/Notion).

| Tool | Description | Use Case |
|------|-------------|----------|
| `clickup_doc_create` | Create new document | Meeting notes, specs |
| `clickup_doc_list` | List all documents | Browse documentation |
| `clickup_doc_get` | Get document content | Read documentation |
| `clickup_doc_update` | Update document | Edit content |
| `clickup_doc_delete` | Delete document | Remove outdated docs |
| `clickup_doc_share` | Share document | Collaborate with team |
| `clickup_doc_search` | Search documents | Find information |

**Example: Document Creation**
```typescript
const doc = await client.callTool('clickup_doc_create', {
  workspace_id: '67890',
  name: 'API Design Specification',
  content: {
    blocks: [
      { type: 'heading', text: 'Overview' },
      { type: 'paragraph', text: 'This document outlines...' },
      { type: 'code', language: 'typescript', code: 'interface API {...}' }
    ]
  }
});
```

**ROI:** Centralize documentation alongside tasks, maintain single source of truth.

---

### 7. Space Management (4 Advanced Tools) 💎

Advanced workspace organization and configuration.

| Tool | Description | Use Case |
|------|-------------|----------|
| `clickup_space_create_with_template` | Create space from template | Standardized project setup |
| `clickup_space_settings_update` | Configure space settings | Customize workspace behavior |
| `clickup_space_permissions_manage` | Manage space permissions | Control access levels |
| `clickup_space_archive` | Archive completed space | Clean up workspace |

**ROI:** Faster project initialization with templates, granular access control.

---

### 8. Task Dependencies (5 Tools) 💎

Model complex task relationships and workflows.

| Tool | Description | Use Case |
|------|-------------|----------|
| `clickup_dependency_create` | Create task dependency | Define workflow order |
| `clickup_dependency_list` | List all dependencies | Visualize relationships |
| `clickup_dependency_update` | Update dependency type | Adjust relationships |
| `clickup_dependency_delete` | Remove dependency | Simplify workflows |
| `clickup_dependency_validate` | Check for circular dependencies | Prevent workflow errors |

**Dependency Types:**
- `waiting_on` - Task blocked by another task
- `blocking` - Task blocks other tasks
- `related_to` - Tasks are related but not blocking

**ROI:** Model waterfall and complex workflows, identify bottlenecks.

---

### 9. Attachments (3 Advanced Tools) 💎

Enhanced file management capabilities.

| Tool | Description | Use Case |
|------|-------------|----------|
| `clickup_attachment_upload_url` | Get secure upload URL | Upload large files |
| `clickup_attachment_version` | Version control attachments | Track file changes |
| `clickup_attachment_preview` | Generate file preview | Quick file viewing |

**ROI:** Better file management, version control for important documents.

---

### 10. Goals & OKRs (3 Tools) 💎

Track team goals and objectives.

| Tool | Description | Use Case |
|------|-------------|----------|
| `clickup_goal_create` | Create team goal | Set objectives |
| `clickup_goal_list` | List all goals | Monitor progress |
| `clickup_goal_update_progress` | Update goal progress | Track completion |

**Example: Goal Tracking**
```typescript
// Create Q4 goal
const goal = await client.callTool('clickup_goal_create', {
  team_id: '67890',
  name: 'Q4 Revenue Target',
  description: 'Achieve $500K in Q4 sales',
  due_date: '2024-12-31',
  targets: [
    { name: 'New customers', target: 50, unit: 'customers' },
    { name: 'Revenue', target: 500000, unit: 'dollars' }
  ]
});

// Update progress
await client.callTool('clickup_goal_update_progress', {
  goal_id: goal.id,
  target_id: target.id,
  current: 35  // 35 customers acquired so far
});
```

**ROI:** Align team on objectives, track OKR progress, measure success.

## Stripe Integration

### Subscription Management

Premium subscriptions are powered by **Stripe** for secure, reliable billing.

**Stripe Features:**
- 🔐 **PCI Compliant** - Your payment data never touches our servers
- 💳 **Multiple Payment Methods** - Credit cards, debit cards, digital wallets
- 🌍 **Global Support** - 135+ currencies supported
- 📧 **Automatic Invoices** - Emailed receipts for every payment
- 🔄 **Automatic Renewal** - Hassle-free monthly billing
- 🛡️ **Fraud Protection** - Advanced security measures

### Creating Subscription

```bash
# Step 1: Create Stripe Checkout Session
curl -X POST https://clickup-mcp.workers.dev/stripe/create-checkout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "return_url": "https://yourapp.com/success",
    "cancel_url": "https://yourapp.com/cancelled"
  }'
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/c/pay/cs_test_...",
  "session_id": "cs_test_xyz123",
  "expires_at": "2024-10-28T13:00:00Z"
}
```

**Step 2:** User completes payment on Stripe checkout page

**Step 3:** Webhook notifies server of successful payment

**Step 4:** User's tier immediately upgraded to "premium"

### Managing Subscription

**Access Billing Portal:**
```bash
curl -X POST https://clickup-mcp.workers.dev/stripe/create-portal-session \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "url": "https://billing.stripe.com/p/session/..."
}
```

**In the Billing Portal, users can:**
- Update payment method
- View payment history and invoices
- Download receipts
- Update billing information
- Cancel subscription

### Webhook Events

The server listens for these Stripe webhook events:

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Upgrade user to premium |
| `customer.subscription.updated` | Update subscription status |
| `customer.subscription.deleted` | Downgrade to free tier |
| `invoice.payment_succeeded` | Log successful payment |
| `invoice.payment_failed` | Notify user of payment issue |

**Security:** All webhooks verified using Stripe signature verification to prevent tampering.

## Upgrade/Downgrade Procedures

### Upgrading to Premium

**Prerequisites:**
- Active JWT session token
- Valid email address
- Payment method (credit/debit card)

**Steps:**
1. **Create Checkout Session** (see above)
2. **Complete Payment** on Stripe checkout page
3. **Instant Activation** - Premium features available immediately
4. **Confirmation Email** - Receipt and subscription details sent

**What Happens:**
- ✅ Rate limit increased to 500 req/min immediately
- ✅ All 42 premium tools unlocked instantly
- ✅ Access to priority support
- ✅ Billing cycle starts (monthly from subscription date)

**No Downtime:** Upgrade happens in real-time without service interruption.

### Downgrading to Free

**Steps:**
1. **Access Billing Portal:**
   ```bash
   curl -X POST https://clickup-mcp.workers.dev/stripe/create-portal-session \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

2. **Click "Cancel Subscription"** in Stripe portal

3. **Confirm Cancellation**

**What Happens:**
- ⏰ **End of Billing Period:** Premium access continues until end of current billing cycle
- 📅 **Billing Cycle Ends:** Account automatically downgrades to free tier
- 🔒 **Premium Tools Locked:** Access to premium-only tools removed
- ⚡ **Rate Limit Reduced:** 500 req/min → 100 req/min
- 💾 **Data Preserved:** All tasks, time entries, custom fields remain accessible (read-only for premium data)

**Data Retention:**
- ✅ All tasks remain accessible
- ✅ Time entries remain viewable (cannot create new entries)
- ✅ Custom field values remain visible (cannot edit)
- ✅ Documents remain readable (cannot edit)
- ✅ No data is deleted on downgrade

**Reactivation:** Can resubscribe anytime to regain full premium access.

### Trial Period

**Note:** Currently, there is no free trial period. Premium access begins immediately upon payment.

**Future Enhancement:** Free trial may be added in future versions.

## Billing FAQ

### General Billing

**Q: How much does Premium cost?**
A: $4.99/month (USD). Billed monthly on the same date each month.

**Q: What payment methods are accepted?**
A: Credit cards (Visa, Mastercard, Amex), debit cards, and digital wallets (Apple Pay, Google Pay) via Stripe.

**Q: Is there a free trial?**
A: Currently, no free trial is offered. Premium access begins immediately upon payment.

**Q: Can I cancel anytime?**
A: Yes! Cancel anytime through the Stripe billing portal. Access continues until the end of your current billing period.

**Q: Do you offer annual billing?**
A: Currently, only monthly billing is available. Annual plans may be added in the future.

**Q: What happens if my payment fails?**
A: You'll receive an email notification. Stripe will automatically retry payment. If payment continues to fail, your subscription will be cancelled and you'll be downgraded to the free tier.

### Upgrades & Downgrades

**Q: How quickly does premium access activate after payment?**
A: Immediately! Premium features are available within seconds of successful payment.

**Q: Can I upgrade mid-month?**
A: Yes! You can upgrade anytime. Your billing cycle starts from the upgrade date.

**Q: What happens to my data if I downgrade?**
A: All your data remains accessible. However, you won't be able to create new time entries, edit custom fields, or use premium-only tools. You can still view everything.

**Q: Can I re-upgrade after downgrading?**
A: Absolutely! Resubscribe anytime to regain full premium access. All your previous data (time entries, custom fields, etc.) becomes fully editable again.

### Refunds & Billing Issues

**Q: Do you offer refunds?**
A: We offer a 7-day money-back guarantee. If you're not satisfied within 7 days of purchase, contact support for a full refund.

**Q: How do I update my payment method?**
A: Access the Stripe billing portal (link provided above) and update your payment details.

**Q: Where can I find my invoices?**
A: Invoices are automatically emailed after each payment. You can also access them in the Stripe billing portal.

**Q: Why was I charged twice?**
A: Contact support immediately at support@clickup-mcp.workers.dev. We'll investigate and resolve any billing errors.

**Q: Can I get an invoice for my company?**
A: Yes! Update your billing information in the Stripe portal to include your company name and tax ID. Future invoices will reflect this information.

### Enterprise & Team Plans

**Q: Do you offer team/enterprise plans?**
A: Currently, Premium is per-user. Enterprise plans with team features, SSO, and dedicated support are coming soon.

**Q: Can I purchase multiple subscriptions?**
A: Each ClickUp workspace requires a separate subscription. Contact us for volume discounts.

**Q: Do you offer educational or non-profit discounts?**
A: Not currently, but this is being considered for future implementation.

### Security & Privacy

**Q: Is my payment information secure?**
A: Yes! All payment processing is handled by Stripe, a PCI Level 1 certified payment processor. We never store your credit card information.

**Q: What data do you store?**
A: We store your Stripe customer ID, subscription status, and billing email. We do NOT store payment card details.

**Q: Can I delete my payment information?**
A: Yes. Cancel your subscription and your payment information will be removed from Stripe. You can also request complete data deletion by contacting support.

## Use Cases & ROI

### For Freelancers

**Scenario:** Track time on client projects for accurate billing

**Free Tier Limitations:**
- ❌ Cannot track time automatically
- ❌ Manual time logging only
- ❌ No time reports

**Premium Solution:**
- ✅ Start/stop timers on tasks
- ✅ Automatic time tracking
- ✅ Generate time reports by date range
- ✅ Export for invoicing

**ROI:** Premium pays for itself if you bill more than 5 minutes/month at $60/hour rate.

---

### For Development Teams

**Scenario:** Sprint planning with 20+ tasks per sprint

**Free Tier Limitations:**
- ❌ Create tasks one at a time (20+ API calls)
- ❌ Manual setup takes 30+ minutes
- ❌ No task dependencies

**Premium Solution:**
- ✅ Bulk create all sprint tasks at once (1 API call)
- ✅ Setup complete in 3 minutes
- ✅ Define task dependencies for workflow

**ROI:** Save 27 minutes per sprint = 9 hours/quarter. Worth $450+ in productivity at $50/hour rate.

---

### For Project Managers

**Scenario:** Track project progress across multiple teams

**Free Tier Limitations:**
- ❌ No Gantt charts
- ❌ No milestone tracking
- ❌ Cannot visualize dependencies

**Premium Solution:**
- ✅ Generate Gantt charts automatically
- ✅ Set and track milestones
- ✅ Visualize task dependencies
- ✅ Identify critical path

**ROI:** Better project visibility = fewer delays. One prevented delay saves 10x the monthly cost.

---

### For Agencies

**Scenario:** Manage multiple client projects with custom workflows

**Free Tier Limitations:**
- ❌ No custom fields for client metadata
- ❌ Cannot track project-specific data
- ❌ No project templates

**Premium Solution:**
- ✅ Custom fields for client name, budget, contract details
- ✅ Reusable project templates
- ✅ Bulk operations for client onboarding

**ROI:** Onboard new clients 10x faster with templates. Close more deals with professional workflows.

## Pricing Transparency

### What You Get for $4.99/Month

**40+ Additional Tools** worth $500+ if built custom
**5x Rate Limits** supporting high-volume automation
**Priority Support** saving hours of troubleshooting
**Time Tracking** for accurate billing
**Bulk Operations** saving 10+ hours/month
**Custom Fields** for tailored workflows

**Total Value: $500+/month**
**Your Cost: $4.99/month**
**Savings: 99% off custom development costs**

### Compared to Alternatives

| Solution | Cost | Setup Time | Limitations |
|----------|------|------------|-------------|
| **Custom Integration** | $5,000+ | 40+ hours | Ongoing maintenance |
| **Zapier Premium** | $19.99/mo | Complex setup | Limited ClickUp actions |
| **ClickUp Automations** | Included | Per-automation | Trigger limitations |
| **ClickUp MCP Premium** | **$4.99/mo** | **Instant** | **None** |

### Value Calculation

**Scenario:** Save 2 hours/month with bulk operations

| Rate | Monthly Savings | Annual Savings | ROI |
|------|----------------|----------------|-----|
| $25/hour | $50/month | $600/year | **10x** |
| $50/hour | $100/month | $1,200/year | **20x** |
| $100/hour | $200/month | $2,400/year | **40x** |

**Break-even:** Save just 6 minutes/month at $50/hour rate.

## Related Documentation

- [Authentication Guide](AUTHENTICATION.md) - OAuth and JWT tokens
- [Tool Reference](TOOL_REFERENCE.md) - Complete tool list with tier markers
- [API Reference](API_REFERENCE.md) - MCP protocol endpoints
- [Security Guide](SECURITY.md) - Security best practices

## Support

### Community Support (Free Tier)
- GitHub Discussions: [github.com/yourrepo/discussions](https://github.com/YOUR_GITHUB_USERNAME/clickup-remote-mcp-server/discussions)
- GitHub Issues: [github.com/yourrepo/issues](https://github.com/YOUR_GITHUB_USERNAME/clickup-remote-mcp-server/issues)

### Priority Support (Premium Tier)
- Email: support@clickup-mcp.workers.dev
- Response Time: 24-48 hours
- Technical Assistance: Implementation help, troubleshooting

### Enterprise Support (Coming Soon)
- Dedicated support engineer
- Response Time: 4-8 hours
- Phone support available
- Custom SLA agreements

---
*For questions or issues, see [Troubleshooting Guide](TROUBLESHOOTING.md)*
*Last Updated: 2025-10-28*
