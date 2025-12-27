import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema, ListResourcesRequestSchema, ListPromptsRequestSchema, GetPromptRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { createClickUpServices } from './services/clickup/index.js';
export class MCPServer {
    constructor(env, config) {
        this.env = env;
        this.allTools = new Map();
        this.config = config;
        this.server = new Server({
            name: 'clickup-mcp-server',
            version: '1.0.0'
        });
        // Create per-user ClickUp services instance
        this.services = createClickUpServices({
            apiKey: config.apiKey,
            teamId: config.teamId
        });
        this.initializeTools();
        this.setupHandlers();
    }
    /**
     * Initialize all available tools
     */
    async initializeTools() {
        // Import all tool definitions
        const toolModules = [
            await import('./tools/workspace.js'),
            await import('./tools/task/index.js'),
            await import('./tools/list.js'),
            await import('./tools/folder.js'),
            await import('./tools/tag.js'),
            await import('./tools/member.js'),
            await import('./tools/space.js'),
            await import('./tools/custom-fields.js'),
            await import('./tools/project.js'),
            await import('./tools/documents.js')
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
    setupHandlers() {
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
                // Wrap result in MCP content format
                return {
                    content: [
                        {
                            type: 'text',
                            text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
                        }
                    ]
                };
            }
            catch (error) {
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
    getFilteredTools() {
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
    isToolAvailable(toolName) {
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
    async executeToolHandler(toolName, args) {
        // Direct service method execution based on tool name
        // This is a simplified implementation - full tool handlers are in server.ts
        try {
            // Route to appropriate service based on tool name prefix
            switch (toolName) {
                // Workspace tools
                case 'get_workspace_hierarchy':
                case 'clickup_workspace_hierarchy':
                    return await this.services.workspace.getWorkspaceHierarchy();
                // Task tools
                case 'create_task':
                case 'clickup_task_create':
                    return await this.services.task.createTask(args.list_id, args);
                case 'get_task':
                case 'clickup_task_get':
                    return await this.services.task.getTask(args.task_id);
                case 'update_task':
                case 'clickup_task_update':
                    return await this.services.task.updateTask(args.task_id, args);
                case 'delete_task':
                case 'clickup_task_delete':
                    return await this.services.task.deleteTask(args.task_id);
                // List tools
                case 'create_list':
                case 'clickup_list_create':
                    return await this.services.list.createList(args.space_id, args);
                case 'get_list':
                case 'clickup_list_get':
                    return await this.services.list.getList(args.list_id);
                case 'update_list':
                case 'clickup_list_update':
                    return await this.services.list.updateList(args.list_id, args);
                case 'delete_list':
                case 'clickup_list_delete':
                    return await this.services.list.deleteList(args.list_id);
                // Space tools
                case 'get_spaces':
                case 'clickup_space_list':
                    return await this.services.space.getSpaces();
                case 'get_space':
                case 'clickup_space_get':
                    return await this.services.space.getSpace(args.space_id);
                // Time tracking tools
                case 'get_time_entries':
                case 'clickup_time_get_entries':
                    return await this.services.timeTracking.getTimeEntries(args);
                case 'create_time_entry':
                case 'clickup_time_create_entry':
                    return await this.services.timeTracking.createTimeEntry(args);
                // Default error for unimplemented tools
                default:
                    throw new Error(`Tool '${toolName}' is not yet implemented in CloudFlare Workers mode. Full implementation coming soon.`);
            }
        }
        catch (error) {
            console.error(`Error executing tool ${toolName}:`, error);
            throw error;
        }
    }
    /**
     * Log tool usage for analytics
     */
    async logToolUsage(toolName) {
        const key = `usage:${this.config.userId}:${new Date().toISOString().split('T')[0]}`;
        const existing = await this.env.RATE_LIMITS.get(key);
        const usage = existing ? JSON.parse(existing) : {};
        usage[toolName] = (usage[toolName] || 0) + 1;
        await this.env.RATE_LIMITS.put(key, JSON.stringify(usage), { expirationTtl: 86400 * 30 } // 30 days
        );
    }
    /**
     * Handle MCP request (Direct JSON-RPC handling)
     */
    async handleRequest(request) {
        try {
            const { method, params, id } = request;
            // Route to appropriate handler based on JSON-RPC method
            let result;
            switch (method) {
                case 'tools/list':
                    result = await this.handleListTools();
                    break;
                case 'tools/call':
                    result = await this.handleCallTool(params);
                    break;
                case 'resources/list':
                    result = await this.handleListResources();
                    break;
                case 'prompts/list':
                    result = await this.handleListPrompts();
                    break;
                case 'prompts/get':
                    result = await this.handleGetPrompt(params);
                    break;
                case 'initialize':
                    result = await this.handleInitialize(params);
                    break;
                default:
                    throw new Error(`Unknown method: ${method}`);
            }
            // Return JSON-RPC success response
            return {
                jsonrpc: '2.0',
                id,
                result
            };
        }
        catch (error) {
            console.error('MCP request error:', error);
            return {
                jsonrpc: '2.0',
                id: request?.id,
                error: {
                    code: -32603,
                    message: error instanceof Error ? error.message : 'Internal error'
                }
            };
        }
    }
    /**
     * Handle initialize request
     */
    async handleInitialize(params) {
        return {
            protocolVersion: '2024-11-05',
            capabilities: {
                tools: {},
                resources: {},
                prompts: {}
            },
            serverInfo: {
                name: 'clickup-mcp-server',
                version: '1.0.0'
            }
        };
    }
    /**
     * Handle tools/list request
     */
    async handleListTools() {
        const filteredTools = this.getFilteredTools();
        return { tools: filteredTools };
    }
    /**
     * Handle tools/call request
     */
    async handleCallTool(params) {
        const { name, arguments: args } = params;
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
        const result = await this.executeToolHandler(name, args);
        // Log tool usage for analytics
        await this.logToolUsage(name);
        return result;
    }
    /**
     * Handle resources/list request
     */
    async handleListResources() {
        return { resources: [] };
    }
    /**
     * Handle prompts/list request
     */
    async handleListPrompts() {
        return { prompts: [] };
    }
    /**
     * Handle prompts/get request
     */
    async handleGetPrompt(params) {
        return {
            prompt: {
                name: '',
                description: '',
                arguments: []
            }
        };
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
