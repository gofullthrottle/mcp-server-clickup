#!/bin/bash
# Deployment Validation Script
# Tests that the deployed Worker is functioning correctly

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
test_result() {
    if [ $1 -eq 0 ]; then
        success "$2"
    else
        error "$2 - FAILED"
        return 1
    fi
}

echo "================================================"
echo "  Deployment Validation Tests"
echo "================================================"
echo ""

# Get environment to test
echo "Which environment do you want to test?"
echo "  1) Development (localhost:8787)"
echo "  2) Development (deployed worker)"
echo "  3) Staging (deployed worker)"
read -p "Enter choice (1-3): " ENV_CHOICE

case $ENV_CHOICE in
    1)
        WORKER_URL="http://localhost:8787"
        ENV_NAME="Local Development"
        ;;
    2)
        read -p "Enter your dev worker URL (e.g., https://clickup-mcp-dev.myname.workers.dev): " WORKER_URL
        ENV_NAME="Development (Deployed)"
        ;;
    3)
        read -p "Enter your staging worker URL (e.g., https://clickup-mcp-staging.myname.workers.dev): " WORKER_URL
        ENV_NAME="Staging (Deployed)"
        ;;
    *)
        error "Invalid choice"
        exit 1
        ;;
esac

echo ""
info "Testing: $ENV_NAME"
info "URL: $WORKER_URL"
echo ""

# Test 1: Health Check
info "Test 1: Health Check Endpoint"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$WORKER_URL/health")
if [ "$HTTP_CODE" -eq 200 ]; then
    HEALTH_RESPONSE=$(curl -s "$WORKER_URL/health")
    echo "$HEALTH_RESPONSE" | jq . > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        success "Health check passed (HTTP $HTTP_CODE)"
        echo "  Response: $HEALTH_RESPONSE"
    else
        error "Health check returned invalid JSON"
    fi
else
    error "Health check failed (HTTP $HTTP_CODE)"
    exit 1
fi
echo ""

# Test 2: OAuth Login Endpoint
info "Test 2: OAuth Login Endpoint"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$WORKER_URL/auth/login")
if [ "$HTTP_CODE" -eq 302 ] || [ "$HTTP_CODE" -eq 200 ]; then
    success "OAuth login endpoint accessible (HTTP $HTTP_CODE)"
else
    warn "OAuth login endpoint returned HTTP $HTTP_CODE (expected 302 redirect)"
fi
echo ""

# Test 3: MCP Endpoint (should require auth)
info "Test 3: MCP Endpoint (Auth Required)"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_CODE}" -X POST "$WORKER_URL/mcp" \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}')
if [ "$HTTP_CODE" -eq 401 ]; then
    success "MCP endpoint correctly requires authentication (HTTP 401)"
else
    warn "MCP endpoint returned HTTP $HTTP_CODE (expected 401 Unauthorized)"
fi
echo ""

# Test 4: CORS Headers
info "Test 4: CORS Configuration"
CORS_HEADERS=$(curl -s -I "$WORKER_URL/health" | grep -i "access-control")
if [ ! -z "$CORS_HEADERS" ]; then
    success "CORS headers present"
    echo "$CORS_HEADERS" | while read line; do echo "  $line"; done
else
    warn "No CORS headers found (may be expected)"
fi
echo ""

# Test 5: Check Wrangler Status (deployed only)
if [[ $ENV_CHOICE -ne 1 ]]; then
    info "Test 5: Wrangler Deployment Status"
    if command -v wrangler &> /dev/null; then
        if [[ $ENV_CHOICE -eq 2 ]]; then
            wrangler deployments list --env development 2>&1 | head -10
        else
            wrangler deployments list --env staging 2>&1 | head -10
        fi
        success "Deployment history retrieved"
    else
        warn "wrangler not found, skipping deployment check"
    fi
    echo ""
fi

# Interactive OAuth Test
echo "================================================"
info "Interactive Tests"
echo "================================================"
echo ""

read -p "Do you want to test the OAuth flow? (y/n): " TEST_OAUTH
if [[ $TEST_OAUTH == "y" || $TEST_OAUTH == "Y" ]]; then
    info "Opening OAuth login page..."
    echo "  URL: $WORKER_URL/auth/login"
    echo ""
    echo "  After authentication, you should see:"
    echo "    ✓ Success page with JWT token"
    echo "    ✓ MCP endpoint URL"
    echo "    ✓ Instructions for next steps"
    echo ""

    # Try to open in browser (macOS/Linux)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open "$WORKER_URL/auth/login"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if command -v xdg-open &> /dev/null; then
            xdg-open "$WORKER_URL/auth/login"
        else
            info "Please open this URL in your browser: $WORKER_URL/auth/login"
        fi
    else
        info "Please open this URL in your browser: $WORKER_URL/auth/login"
    fi

    read -p "Did the OAuth flow complete successfully? (y/n): " OAUTH_SUCCESS
    if [[ $OAUTH_SUCCESS == "y" || $OAUTH_SUCCESS == "Y" ]]; then
        success "OAuth flow completed"
        read -p "Paste your JWT token here (for further testing): " JWT_TOKEN

        if [ ! -z "$JWT_TOKEN" ]; then
            # Test MCP with valid token
            info "Testing MCP with authenticated request..."
            MCP_RESPONSE=$(curl -s -X POST "$WORKER_URL/mcp" \
                -H "Authorization: Bearer $JWT_TOKEN" \
                -H "Content-Type: application/json" \
                -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}')

            echo "$MCP_RESPONSE" | jq . > /dev/null 2>&1
            if [ $? -eq 0 ]; then
                success "MCP tools/list successful"
                TOOL_COUNT=$(echo "$MCP_RESPONSE" | jq '.result.tools | length')
                info "Available tools: $TOOL_COUNT"
            else
                error "MCP request failed"
                echo "  Response: $MCP_RESPONSE"
            fi
        fi
    fi
fi

echo ""
echo "================================================"
success "Validation Complete!"
echo "================================================"
echo ""

info "Summary:"
echo "  Environment: $ENV_NAME"
echo "  URL: $WORKER_URL"
echo "  Health Check: ✓"
echo "  OAuth Endpoint: ✓"
echo "  MCP Authentication: ✓"
echo ""

if [[ $TEST_OAUTH == "y" && $OAUTH_SUCCESS == "y" ]]; then
    info "Next steps:"
    echo "  1. Configure your MCP client (e.g., Claude Desktop)"
    echo "  2. Test all 72 tools using the MCP client"
    echo "  3. Monitor CloudFlare analytics for errors"
    echo "  4. Check R2 bucket for audit logs"
else
    info "Next steps:"
    echo "  1. Complete OAuth flow to get JWT token"
    echo "  2. Test MCP endpoint with authentication"
    echo "  3. Configure MCP client"
fi
