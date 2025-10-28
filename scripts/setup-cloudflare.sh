#!/bin/bash
# CloudFlare Workers Setup Automation Script
# This script helps automate the CloudFlare infrastructure setup

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
info() { echo -e "${BLUE}ℹ${NC} $1"; }
success() { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }
error() { echo -e "${RED}✗${NC} $1"; }

echo "================================================"
echo "  CloudFlare Workers Setup for ClickUp MCP"
echo "================================================"
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    error "wrangler is not installed"
    info "Install with: npm install -g wrangler"
    exit 1
fi

# Step 1: Get Account ID
info "Step 1: Getting CloudFlare Account ID..."
echo ""
wrangler whoami
echo ""
read -p "Enter your CloudFlare Account ID: " ACCOUNT_ID

if [ -z "$ACCOUNT_ID" ]; then
    error "Account ID is required"
    exit 1
fi

# Update wrangler.toml
info "Updating wrangler.toml with Account ID..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/account_id = \"YOUR_CLOUDFLARE_ACCOUNT_ID\"/account_id = \"$ACCOUNT_ID\"/" wrangler.toml
else
    # Linux
    sed -i "s/account_id = \"YOUR_CLOUDFLARE_ACCOUNT_ID\"/account_id = \"$ACCOUNT_ID\"/" wrangler.toml
fi
success "Updated wrangler.toml"
echo ""

# Step 2: Create KV Namespaces
echo "================================================"
info "Step 2: Creating KV Namespaces..."
echo ""

read -p "Create DEVELOPMENT KV namespaces? (y/n): " create_dev
if [[ $create_dev == "y" || $create_dev == "Y" ]]; then
    info "Creating development KV namespaces..."
    npm run kv:create:dev 2>&1 | tee /tmp/kv_dev_output.txt
    success "Development KV namespaces created"
    warn "Please copy the namespace IDs from above and update wrangler.toml manually"
    echo "  Lines to update: 18-23 (development environment)"
fi

echo ""
read -p "Create STAGING KV namespaces? (y/n): " create_staging
if [[ $create_staging == "y" || $create_staging == "Y" ]]; then
    info "Creating staging KV namespaces..."
    npm run kv:create:staging 2>&1 | tee /tmp/kv_staging_output.txt
    success "Staging KV namespaces created"
    warn "Please copy the namespace IDs from above and update wrangler.toml manually"
    echo "  Lines to update: 45-50 (staging environment)"
fi

echo ""

# Step 3: Create R2 Buckets
echo "================================================"
info "Step 3: Creating R2 Buckets..."
echo ""

read -p "Create R2 buckets for audit logs? (y/n): " create_r2
if [[ $create_r2 == "y" || $create_r2 == "Y" ]]; then
    info "Creating R2 buckets..."
    npm run r2:create
    success "R2 buckets created"
fi

echo ""

# Step 4: Generate Secure Keys
echo "================================================"
info "Step 4: Generating Secure Keys..."
echo ""

info "Generating ENCRYPTION_KEY (32 bytes)..."
ENCRYPTION_KEY=$(openssl rand -base64 32)
echo "ENCRYPTION_KEY: $ENCRYPTION_KEY"
echo "$ENCRYPTION_KEY" > .cloudflare-secrets/encryption_key.txt

info "Generating JWT_SECRET (64 bytes)..."
JWT_SECRET=$(openssl rand -base64 64)
echo "JWT_SECRET: $JWT_SECRET"
echo "$JWT_SECRET" > .cloudflare-secrets/jwt_secret.txt

mkdir -p .cloudflare-secrets
chmod 700 .cloudflare-secrets

success "Keys generated and saved to .cloudflare-secrets/"
warn "Keep these keys secure! Add .cloudflare-secrets/ to .gitignore"

echo ""

# Step 5: Configure Secrets
echo "================================================"
info "Step 5: Setting CloudFlare Secrets..."
echo ""

read -p "Configure secrets for DEVELOPMENT environment? (y/n): " config_dev_secrets
if [[ $config_dev_secrets == "y" || $config_dev_secrets == "Y" ]]; then
    info "Setting development secrets..."
    info "You will be prompted for each secret value"
    echo ""

    # ClickUp Credentials
    info "ClickUp OAuth Credentials:"
    echo "$CLICKUP_CLIENT_ID" | wrangler secret put CLICKUP_CLIENT_ID --env development
    echo "$CLICKUP_CLIENT_SECRET" | wrangler secret put CLICKUP_CLIENT_SECRET --env development

    # Generated Keys
    info "Encryption and JWT Keys:"
    echo "$ENCRYPTION_KEY" | wrangler secret put ENCRYPTION_KEY --env development
    echo "$JWT_SECRET" | wrangler secret put JWT_SECRET --env development

    # Stripe (optional)
    read -p "Configure Stripe secrets? (y/n): " config_stripe
    if [[ $config_stripe == "y" || $config_stripe == "Y" ]]; then
        wrangler secret put STRIPE_SECRET_KEY --env development
        wrangler secret put STRIPE_WEBHOOK_SECRET --env development
        wrangler secret put STRIPE_PRICE_ID --env development
    fi

    success "Development secrets configured"
fi

echo ""
read -p "Configure secrets for STAGING environment? (y/n): " config_staging_secrets
if [[ $config_staging_secrets == "y" || $config_staging_secrets == "Y" ]]; then
    info "Setting staging secrets..."

    # ClickUp Credentials
    wrangler secret put CLICKUP_CLIENT_ID --env staging
    wrangler secret put CLICKUP_CLIENT_SECRET --env staging

    # Generated Keys (use DIFFERENT keys for staging!)
    warn "Generate NEW keys for staging (don't reuse development keys)"
    STAGING_ENCRYPTION_KEY=$(openssl rand -base64 32)
    STAGING_JWT_SECRET=$(openssl rand -base64 64)

    echo "$STAGING_ENCRYPTION_KEY" | wrangler secret put ENCRYPTION_KEY --env staging
    echo "$STAGING_JWT_SECRET" | wrangler secret put JWT_SECRET --env staging

    # Stripe (optional)
    read -p "Configure Stripe secrets for staging? (y/n): " config_stripe_staging
    if [[ $config_stripe_staging == "y" || $config_stripe_staging == "Y" ]]; then
        wrangler secret put STRIPE_SECRET_KEY --env staging
        wrangler secret put STRIPE_WEBHOOK_SECRET --env staging
        wrangler secret put STRIPE_PRICE_ID --env staging
    fi

    success "Staging secrets configured"
fi

echo ""
echo "================================================"
success "CloudFlare setup complete!"
echo ""
info "Next steps:"
echo "  1. Verify KV namespace IDs in wrangler.toml (lines 18-23 and 45-50)"
echo "  2. Configure ClickUp OAuth redirect URIs"
echo "  3. Set up Stripe webhook (if using Stripe)"
echo "  4. Run 'npm run deploy:dev' to deploy to development"
echo ""
info "Saved files:"
echo "  - .cloudflare-secrets/encryption_key.txt"
echo "  - .cloudflare-secrets/jwt_secret.txt"
echo ""
warn "Add .cloudflare-secrets/ to .gitignore to prevent committing secrets!"
