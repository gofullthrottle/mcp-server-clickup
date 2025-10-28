#!/bin/bash
# External Services Configuration Helper
# Helps configure ClickUp OAuth and Stripe

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info() { echo -e "${BLUE}ℹ${NC} $1"; }
success() { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }
error() { echo -e "${RED}✗${NC} $1"; }

echo "================================================"
echo "  External Services Configuration"
echo "================================================"
echo ""

# Get worker URLs
read -p "Enter your CloudFlare Workers subdomain (e.g., 'myname' for myname.workers.dev): " WORKERS_SUBDOMAIN

if [ -z "$WORKERS_SUBDOMAIN" ]; then
    error "Workers subdomain is required"
    exit 1
fi

DEV_URL="https://clickup-mcp-dev.$WORKERS_SUBDOMAIN.workers.dev"
STAGING_URL="https://clickup-mcp-staging.$WORKERS_SUBDOMAIN.workers.dev"

echo ""
info "Your Worker URLs:"
echo "  Development: $DEV_URL"
echo "  Staging:     $STAGING_URL"
echo ""

# ClickUp OAuth Configuration
echo "================================================"
echo "  ClickUp OAuth Configuration"
echo "================================================"
echo ""

info "Configure your ClickUp OAuth app with these redirect URIs:"
echo ""
echo "  1. Go to: https://app.clickup.com/settings/apps"
echo "  2. Create a new App (or edit existing)"
echo "  3. Add these Redirect URIs:"
echo ""
echo "     http://localhost:8787/auth/callback"
echo "     $DEV_URL/auth/callback"
echo "     $STAGING_URL/auth/callback"
echo ""
echo "  4. Required OAuth Scopes:"
echo "     - user:read"
echo "     - team:read"
echo "     - task:write"
echo ""

read -p "Have you configured the ClickUp OAuth app? (y/n): " CLICKUP_CONFIGURED

if [[ $CLICKUP_CONFIGURED == "y" || $CLICKUP_CONFIGURED == "Y" ]]; then
    read -p "Enter your ClickUp Client ID: " CLICKUP_CLIENT_ID
    read -p "Enter your ClickUp Client Secret: " CLICKUP_CLIENT_SECRET

    # Save to secure file
    mkdir -p .cloudflare-secrets
    chmod 700 .cloudflare-secrets

    cat > .cloudflare-secrets/clickup-oauth.txt <<EOF
CLICKUP_CLIENT_ID=$CLICKUP_CLIENT_ID
CLICKUP_CLIENT_SECRET=$CLICKUP_CLIENT_SECRET

OAuth Redirect URIs:
- Local: http://localhost:8787/auth/callback
- Development: $DEV_URL/auth/callback
- Staging: $STAGING_URL/auth/callback
EOF

    chmod 600 .cloudflare-secrets/clickup-oauth.txt
    success "ClickUp OAuth credentials saved to .cloudflare-secrets/clickup-oauth.txt"
else
    warn "Please configure ClickUp OAuth before continuing"
fi

echo ""

# Stripe Configuration
echo "================================================"
echo "  Stripe Configuration (Optional)"
echo "================================================"
echo ""

read -p "Do you want to configure Stripe? (y/n): " CONFIGURE_STRIPE

if [[ $CONFIGURE_STRIPE == "y" || $CONFIGURE_STRIPE == "Y" ]]; then
    info "Stripe Webhook Configuration:"
    echo ""
    echo "  1. Go to: https://dashboard.stripe.com/webhooks"
    echo "  2. Create a new endpoint with this URL:"
    echo ""
    echo "     $STAGING_URL/stripe/webhook"
    echo ""
    echo "  3. Select these events:"
    echo "     - checkout.session.completed"
    echo "     - customer.subscription.deleted"
    echo ""
    echo "  4. Create a subscription product:"
    echo "     - Go to: https://dashboard.stripe.com/products"
    echo "     - Create a product (e.g., 'ClickUp MCP Premium')"
    echo "     - Add a recurring price (e.g., \$10/month)"
    echo "     - Copy the Price ID (starts with 'price_')"
    echo ""

    read -p "Have you configured Stripe? (y/n): " STRIPE_CONFIGURED

    if [[ $STRIPE_CONFIGURED == "y" || $STRIPE_CONFIGURED == "Y" ]]; then
        read -p "Enter your Stripe Secret Key (starts with sk_): " STRIPE_SECRET_KEY
        read -p "Enter your Stripe Webhook Secret (starts with whsec_): " STRIPE_WEBHOOK_SECRET
        read -p "Enter your Stripe Price ID (starts with price_): " STRIPE_PRICE_ID

        # Save to secure file
        cat > .cloudflare-secrets/stripe.txt <<EOF
STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_ID=$STRIPE_PRICE_ID

Webhook Endpoint:
- Staging: $STAGING_URL/stripe/webhook

Selected Events:
- checkout.session.completed
- customer.subscription.deleted
EOF

        chmod 600 .cloudflare-secrets/stripe.txt
        success "Stripe credentials saved to .cloudflare-secrets/stripe.txt"
    fi
else
    info "Skipping Stripe configuration"
    warn "All users will be on free tier without Stripe"
fi

echo ""
echo "================================================"
success "Service configuration complete!"
echo ""
info "Credentials saved to:"
echo "  - .cloudflare-secrets/clickup-oauth.txt"
if [[ $CONFIGURE_STRIPE == "y" || $CONFIGURE_STRIPE == "Y" ]]; then
    echo "  - .cloudflare-secrets/stripe.txt"
fi
echo ""
info "Next steps:"
echo "  1. Run './scripts/setup-cloudflare.sh' to configure CloudFlare infrastructure"
echo "  2. Use the saved credentials when setting CloudFlare secrets"
echo "  3. Deploy with 'npm run deploy:dev'"
echo ""
warn "Keep .cloudflare-secrets/ directory secure and never commit to git!"
