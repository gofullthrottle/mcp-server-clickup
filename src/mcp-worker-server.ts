import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import { Env } from './worker';
import { clickUpServices } from './services/shared';
import { configureServer } from './server';

export interface MCPConfig {
  apiKey: string;
  teamId: string;
  userId: string;
  availableTools: string[];
  subscriptionTier: 'free' | 'premium';
}

export class MCPServer {
  private server: Server;
  private config: MCPConfig;
  private allTools: Map<string, any> = new Map();

  constructor(private env: Env, config: MCPConfig) {
    this.config = config;
    this.server = new Server({
      name: 'clickup-mcp-server',
      version: '1.0.0'
    });
    
    // Initialize ClickUp services with user's API key
    clickUpServices.init(config.apiKey, config.teamId);
    
    this.initializeTools();
    this.setupHandlers();
  }

  /**
   * Initialize all available tools
   */
  private async initializeTools() {
    // Import all tool definitions
    const toolModules = [
      await import('./tools/workspace'),
      await import('./tools/task'),
      await import('./tools/time-tracking'),
      await import('./tools/list'),
      await import('./tools/folder'),
      await import('./tools/tag'),
      await import('./tools/member'),
      await import('./tools/space'),
      await import('./tools/dependencies'),
      await import('./tools/custom-fields'),
      await import('./tools/project'),
      await import('./tools/advanced-task')
    ];

    // Collect all tools
    for (const module of toolModules) {
      for (const [key, value] of Object.entries(module)) {
        if (key.endsWith('Tool') && typeof value === 'object') {
          this.allTools.set(value.name, value);
        }
      }
    }
  }

  /**
   * Setup MCP request handlers
   */
  private setupHandlers() {
    // List tools handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const filteredTools = this.getFilteredTools();
      return { tools: filteredTools };
    });

    // Call tool handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      // Check if tool is available for user
      if (!this.isToolAvailable(name)) {
        throw new Error(`Tool '${name}' is not available in your subscription tier`);
      }

      // Get tool definition
      const tool = this.allTools.get(name);
      if (!tool) {
        throw new Error(`Unknown tool: ${name}`);
      }

      // Execute tool handler
      try {
        const result = await this.executeToolHandler(name, args);
        
        // Log tool usage for analytics
        await this.logToolUsage(name);
        
        return result;
      } catch (error) {
        console.error(`Error executing tool ${name}:`, error);
        throw error;
      }
    });

    // Resources handler
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return { resources: [] };
    });

    // Prompts handler
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      return { prompts: [] };
    });

    this.server.setRequestHandler(GetPromptRequestSchema, async () => {
      return {
        prompt: {
          name: '',
          description: '',
          arguments: []
        }
      };
    });
  }

  /**
   * Get filtered tools based on user's subscription
   */
  private getFilteredTools() {
    const filtered = [];
    
    for (const [name, tool] of this.allTools) {
      if (this.isToolAvailable(name)) {
        filtered.push(tool);
      }
    }
    
    return filtered;
  }

  /**
   * Check if a tool is available for the user
   */
  private isToolAvailable(toolName: string): boolean {
    // If no restrictions, all tools are available
    if (this.config.availableTools.length === 0) {
      return true;
    }
    
    // Check against whitelist
    return this.config.availableTools.includes(toolName);
  }

  /**
   * Execute a tool handler with the appropriate service
   */
  private async executeToolHandler(toolName: string, args: any) {
    // Map tool names to their handlers
    // This would be dynamically imported based on tool category
    
    const handlers = await this.getToolHandlers();
    const handler = handlers[toolName];
    
    if (!handler) {
      throw new Error(`No handler found for tool: ${toolName}`);
    }
    
    return handler(args);
  }

  /**
   * Get all tool handlers
   */
  private async getToolHandlers() {
    // Import and return all tool handlers
    // This would be optimized in production to lazy-load
    const { toolHandlers } = await import('./tools/handlers');
    return toolHandlers;
  }

  /**
   * Log tool usage for analytics
   */
  private async logToolUsage(toolName: string) {
    const key = `usage:${this.config.userId}:${new Date().toISOString().split('T')[0]}`;
    
    const existing = await this.env.RATE_LIMITS.get(key);
    const usage = existing ? JSON.parse(existing) : {};
    
    usage[toolName] = (usage[toolName] || 0) + 1;
    
    await this.env.RATE_LIMITS.put(
      key,
      JSON.stringify(usage),
      { expirationTtl: 86400 * 30 } // 30 days
    );
  }

  /**
   * Handle MCP request
   */
  async handleRequest(request: any) {
    try {
      // Process the request through the MCP server
      const response = await this.server.handleRequest(request);
      return response;
    } catch (error) {
      console.error('MCP request error:', error);
      return {
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : 'Internal error'
        }
      };
    }
  }

  /**
   * Get usage statistics for the current user
   */
  async getUserStats() {
    const today = new Date().toISOString().split('T')[0];
    const key = `usage:${this.config.userId}:${today}`;
    
    const usage = await this.env.RATE_LIMITS.get(key);
    return usage ? JSON.parse(usage) : {};
  }
}