#!/bin/bash
# Branding Update Script
# Updates all references from taazkareem to your own branding

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
echo "  Branding Update Script"
echo "================================================"
echo ""

# Get new values
read -p "Enter your npm scope/username (e.g., 'johnfreier' for @johnfreier/package): " NPM_SCOPE
read -p "Enter your GitHub username (e.g., 'johnfreier'): " GITHUB_USER
read -p "Enter your full name (for SPDX headers): " FULL_NAME
read -p "Enter your email (for SPDX headers): " EMAIL

if [ -z "$NPM_SCOPE" ] || [ -z "$GITHUB_USER" ]; then
    error "NPM scope and GitHub username are required"
    exit 1
fi

# Set defaults if not provided
FULL_NAME=${FULL_NAME:-"$GITHUB_USER"}
EMAIL=${EMAIL:-"$GITHUB_USER@users.noreply.github.com"}

info "Updating branding..."
echo "  NPM Package: @$NPM_SCOPE/clickup-mcp-server"
echo "  GitHub Repo: https://github.com/$GITHUB_USER/clickup-mcp-server"
echo "  Author: $FULL_NAME"
echo "  Email: $EMAIL"
echo ""

read -p "Continue with these values? (y/n): " CONFIRM
if [[ $CONFIRM != "y" && $CONFIRM != "Y" ]]; then
    warn "Cancelled"
    exit 0
fi

# Update package.json
info "Updating package.json..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/@taazkareem\/clickup-mcp-server/@$NPM_SCOPE\/clickup-mcp-server/g" package.json
    sed -i '' "s/\"author\": \"Talib Kareem\"/\"author\": \"$FULL_NAME\"/g" package.json
    sed -i '' "s|git+https://github.com/taazkareem/clickup-mcp-server.git|git+https://github.com/$GITHUB_USER/clickup-mcp-server.git|g" package.json
    sed -i '' "s|https://github.com/taazkareem/clickup-mcp-server/issues|https://github.com/$GITHUB_USER/clickup-mcp-server/issues|g" package.json
    sed -i '' "s|https://github.com/taazkareem/clickup-mcp-server#readme|https://github.com/$GITHUB_USER/clickup-mcp-server#readme|g" package.json
else
    # Linux
    sed -i "s/@taazkareem\/clickup-mcp-server/@$NPM_SCOPE\/clickup-mcp-server/g" package.json
    sed -i "s/\"author\": \"Talib Kareem\"/\"author\": \"$FULL_NAME\"/g" package.json
    sed -i "s|git+https://github.com/taazkareem/clickup-mcp-server.git|git+https://github.com/$GITHUB_USER/clickup-mcp-server.git|g" package.json
    sed -i "s|https://github.com/taazkareem/clickup-mcp-server/issues|https://github.com/$GITHUB_USER/clickup-mcp-server/issues|g" package.json
    sed -i "s|https://github.com/taazkareem/clickup-mcp-server#readme|https://github.com/$GITHUB_USER/clickup-mcp-server#readme|g" package.json
fi
success "Updated package.json"

# Update SPDX headers in source files
info "Updating SPDX headers in source files..."

find src -type f -name "*.ts" -exec sh -c '
    for file; do
        if grep -q "SPDX-FileCopyrightText.*Talib Kareem" "$file"; then
            if [[ "$OSTYPE" == "darwin"* ]]; then
                sed -i "" "s/SPDX-FileCopyrightText: © [0-9]* Talib Kareem <taazkareem@icloud.com>/SPDX-FileCopyrightText: © $(date +%Y) '"$FULL_NAME"' <'"$EMAIL"'>/g" "$file"
            else
                sed -i "s/SPDX-FileCopyrightText: © [0-9]* Talib Kareem <taazkareem@icloud.com>/SPDX-FileCopyrightText: © $(date +%Y) '"$FULL_NAME"' <'"$EMAIL"'>/g" "$file"
            fi
        fi
    done
' sh {} +

success "Updated SPDX headers"

# Update README
info "Updating README.md..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s/taazkareem\/clickup-mcp-server/$GITHUB_USER\/clickup-mcp-server/g" README.md
    sed -i '' "s/@taazkareem\/clickup-mcp-server/@$NPM_SCOPE\/clickup-mcp-server/g" README.md
else
    sed -i "s/taazkareem\/clickup-mcp-server/$GITHUB_USER\/clickup-mcp-server/g" README.md
    sed -i "s/@taazkareem\/clickup-mcp-server/@$NPM_SCOPE\/clickup-mcp-server/g" README.md
fi
success "Updated README.md"

# Update git remote (if it exists)
if git remote get-url origin &> /dev/null; then
    info "Updating git remote..."
    git remote set-url origin "https://github.com/$GITHUB_USER/clickup-mcp-server.git"
    success "Updated git remote"
else
    warn "No git remote found. You may need to set it manually:"
    echo "  git remote add origin https://github.com/$GITHUB_USER/clickup-mcp-server.git"
fi

# Update package-lock.json
info "Regenerating package-lock.json..."
npm install
success "Regenerated package-lock.json"

echo ""
echo "================================================"
success "Branding update complete!"
echo ""
info "Updated:"
echo "  ✓ package.json"
echo "  ✓ package-lock.json"
echo "  ✓ README.md"
echo "  ✓ SPDX headers in src/ files"
echo "  ✓ Git remote (if present)"
echo ""
warn "Please review the changes before committing:"
echo "  git diff"
echo ""
info "If everything looks good, commit the changes:"
echo "  git add ."
echo "  git commit -m 'chore: update branding to $NPM_SCOPE'"
