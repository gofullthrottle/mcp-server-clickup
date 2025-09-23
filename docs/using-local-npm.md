# Using Local npm Package for MCP Server
  1. Use Local Path in MCP Configuration (Immediate Solution)

  Edit your MCP configuration to point to your local build:

  {
    "mcpServers": {
      "clickup": {
        "command": "node",
        "args": ["/Users/youruser/projects/clickup-mcp-server/build/index.js"],
        "env": {
          "CLICKUP_API_KEY": "your_key",
          "CLICKUP_TEAM_ID": "your_team_id"
        }
      }
    }
  }

  First, build your local version:
  cd /Users/youruser/projects/clickup-mcp-server
  npm install
  npm run build

  2. Use npm link for Local Development (Development Solution)

  This creates a global symlink to your local version:

  # In your local clickup-mcp-server directory
  cd /Users/youruser/projects/clickup-mcp-server
  npm link

  # Now you can use it globally
  npx clickup-mcp-server

  Your MCP config would then use:
  {
    "mcpServers": {
      "clickup": {
        "command": "npx",
        "args": ["clickup-mcp-server"],
        "env": {
          "CLICKUP_API_KEY": "your_key",
          "CLICKUP_TEAM_ID": "your_team_id"
        }
      }
    }
  }

  3. Publish to npm Under Your Scope (Permanent Solution)

  To make your modified version available via npx with your own package name:

  1. Update package.json with your scope:
  {
    "name": "@youruser/clickup-mcp-server",
    "version": "1.0.0-custom"
  }

  2. Publish to npm:
  npm login
  npm publish --access public

  3. Then use via npx:
  npx @youruser/clickup-mcp-server@latest

  4. Local npm Registry (Advanced)

  For private use without publishing publicly:

  # Install verdaccio (local npm registry)
  npm install -g verdaccio
  verdaccio

  # In another terminal, set registry and publish
  npm set registry http://localhost:4873/
  npm publish

  # Use your local package
  npx @taazkareem/clickup-mcp-server@latest

  Recommendation: For development, use option #1 (direct path) or #2 (npm link). When your modifications
  are stable and you want to share them, either contribute back to the original repo or publish under your
   own scope (option #3).
