# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

ClickUp MCP Server - A Model Context Protocol server that enables AI agents to interact with ClickUp workspaces through natural language. It provides 36+ tools for comprehensive task management, time tracking, and workspace operations.

## Build and Development Commands

```bash
# Build and prepare
npm install                 # Install dependencies
npm run build              # Compile TypeScript to JavaScript
npm run dev                # Watch mode for development

# Run the server
npm start                  # Start compiled server
node build/index.js        # Direct execution

# Environment setup (required)
export CLICKUP_API_KEY="your_api_key"
export CLICKUP_TEAM_ID="your_team_id"
```

## Architecture

### Service Layer Pattern
The codebase uses a **service-oriented architecture** with composition pattern:

- **BaseClickUpService** (`src/services/clickup/base.ts`) - Base class providing error handling, rate limiting, and API communication
- **Service Composition** - TaskService uses composition of specialized services (Core, Search, Comments, Attachments, Tags, CustomFields)
- **Tool Layer** (`src/tools/`) - MCP protocol handlers that delegate to services
- **Transport Layer** - Multi-transport support (STDIO, HTTP Streamable, SSE)

### Key Architectural Principles

1. **Composition over Inheritance**: TaskService recently refactored to use composition pattern - when extending, follow this pattern
2. **Service Separation**: Each ClickUp entity has its own service - maintain this separation
3. **Tool-Service Delegation**: Tools handle MCP protocol, services handle ClickUp API
4. **Error Boundary**: BaseClickUpService provides centralized error handling - all services inherit this

## Core Components

### TaskService Composition (`src/services/clickup/task/`)
- `index.ts` - Main TaskService that composes all task-related functionality
- `core.ts` - Basic CRUD operations
- `search.ts` - Search and filtering capabilities
- `comments.ts` - Comment management
- `attachments.ts` - File attachment handling
- `tags.ts` - Task tagging operations
- `custom-fields.ts` - Custom field management

### Transport Configuration (`src/index.ts`)
- Determines transport based on environment variables
- STDIO is default, SSE enabled with `ENABLE_SSE=true`
- HTTP Streamable for modern MCP clients

### Natural Language Processing (`src/utils/date-utils.ts`)
- 47+ date patterns with sub-millisecond parsing
- Used by task creation/update tools for due dates

## Development Patterns

### Adding New Tools
1. Create tool definition in appropriate file under `src/tools/`
2. Implement corresponding service method if needed
3. Register tool in `src/server.ts`
4. Follow existing naming convention: `clickup_[entity]_[action]`

### Service Extension
When extending services:
```typescript
// Follow composition pattern for complex services
class NewTaskFeatureService extends BaseClickUpService {
  // Implement specific functionality
}

// Compose into TaskService
class TaskService extends BaseClickUpService {
  private newFeature: NewTaskFeatureService;
  
  constructor(apiKey: string, teamId: string) {
    super(apiKey, teamId);
    this.newFeature = new NewTaskFeatureService(apiKey, teamId);
  }
}
```

### Error Handling
All API errors should be caught and transformed in BaseClickUpService:
```typescript
// Errors are automatically mapped to user-friendly messages
throw new Error(`ClickUp API Error: ${error.response?.data?.err || error.message}`);
```

## Testing and Validation

### Manual Testing
```bash
# Test with MCP Inspector
npm run build
npx @modelcontextprotocol/inspector build/index.js

# Test specific tools
node build/index.js --test-tool clickup_task_create
```

### Environment Variables for Testing
```bash
# Core (required)
CLICKUP_API_KEY=pk_xxx
CLICKUP_TEAM_ID=xxx

# Optional features
DOCUMENT_SUPPORT=true      # Enable document tools
LOG_LEVEL=debug            # Enable debug logging
ENABLED_TOOLS=task,list    # Whitelist specific tool categories
```

## Common Development Tasks

### Adding Rate Limiting
Rate limiting is handled in BaseClickUpService. Adjust parameters in `src/services/clickup/base.ts`:
```typescript
private rateLimitDelay = 100; // Milliseconds between requests
```

### Implementing Bulk Operations
Use the concurrency utilities for bulk operations:
```typescript
import { processInBatches } from '../utils/concurrency-utils';
await processInBatches(items, async (item) => {
  // Process each item
}, 5); // Batch size
```

### Adding Custom Fields Support
Custom fields are handled through TaskServiceCustomFields. When adding support to other entities:
1. Create a dedicated custom fields service
2. Compose it into the main entity service
3. Follow the existing pattern in `src/services/clickup/task/custom-fields.ts`

## Important Considerations

- **Workspace Context**: Most operations require workspace hierarchy - always ensure WorkspaceService is available
- **ID Formats**: Support both ClickUp IDs and custom task IDs (e.g., "TASK-123")
- **Disambiguation**: When multiple items have the same name, provide context (space/folder/list)
- **Performance**: Use bulk operations and caching where appropriate
- **Security**: Never log API keys or sensitive data
- **Backward Compatibility**: Maintain tool signatures when refactoring services