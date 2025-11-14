/**
 * MCP Test Client
 *
 * Wrapper around MCP SDK for testing MCP server functionality.
 * Provides helpers for making MCP requests, capturing responses,
 * and asserting on MCP protocol behavior.
 *
 * Usage:
 *   const client = new MCPTestClient();
 *   const tools = await client.listTools();
 *   const result = await client.callTool('clickup_task_create', { ... });
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { CallToolResultSchema, ListToolsResultSchema } from '@modelcontextprotocol/sdk/types.js';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';

export interface MCPTestClientOptions {
  apiKey: string;
  teamId: string;
  serverPath?: string;
  logRequests?: boolean;
  logResponses?: boolean;
}

export interface ToolCallResult {
  content: Array<{
    type: string;
    text?: string;
    data?: any;
  }>;
  isError?: boolean;
}

/**
 * MCP Test Client for integration testing
 */
export class MCPTestClient {
  private client: Client;
  private transport: StdioClientTransport | null = null;
  private serverProcess: ChildProcess | null = null;
  private options: MCPTestClientOptions;
  private requestLog: any[] = [];
  private responseLog: any[] = [];

  constructor(options: MCPTestClientOptions) {
    this.options = {
      serverPath: path.join(__dirname, '../../build/index.js'),
      logRequests: false,
      logResponses: false,
      ...options
    };

    this.client = new Client({
      name: 'mcp-integration-test-client',
      version: '1.0.0'
    }, {
      capabilities: {}
    });
  }

  /**
   * Connect to MCP server
   */
  async connect(): Promise<void> {
    if (this.transport) {
      throw new Error('Client already connected');
    }

    // Set environment variables for server
    const env = {
      ...process.env,
      CLICKUP_API_KEY: this.options.apiKey,
      CLICKUP_TEAM_ID: this.options.teamId,
      NODE_ENV: 'test'
    };

    // Spawn server process
    this.serverProcess = spawn('node', [this.options.serverPath!], {
      env,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Create STDIO transport
    this.transport = new StdioClientTransport({
      command: 'node',
      args: [this.options.serverPath!],
      env
    });

    // Connect client to transport
    await this.client.connect(this.transport);

    if (this.options.logRequests || this.options.logResponses) {
      console.log('✅ MCP client connected to server');
    }
  }

  /**
   * Disconnect from MCP server
   */
  async disconnect(): Promise<void> {
    if (this.transport) {
      await this.client.close();
      this.transport = null;
    }

    if (this.serverProcess) {
      this.serverProcess.kill();
      this.serverProcess = null;
    }

    if (this.options.logRequests || this.options.logResponses) {
      console.log('✅ MCP client disconnected');
    }
  }

  /**
   * List all available tools
   */
  async listTools(): Promise<any[]> {
    const request = {
      method: 'tools/list' as const
    };

    if (this.options.logRequests) {
      console.log('📤 MCP Request:', JSON.stringify(request, null, 2));
    }
    this.requestLog.push({ timestamp: Date.now(), request });

    const response = await this.client.request(
      request,
      ListToolsResultSchema
    );

    if (this.options.logResponses) {
      console.log('📥 MCP Response:', JSON.stringify(response, null, 2));
    }
    this.responseLog.push({ timestamp: Date.now(), response });

    return response.tools;
  }

  /**
   * Call a tool with arguments
   */
  async callTool(name: string, arguments_: any): Promise<ToolCallResult> {
    const request = {
      method: 'tools/call' as const,
      params: {
        name,
        arguments: arguments_
      }
    };

    if (this.options.logRequests) {
      console.log('📤 MCP Tool Call:', JSON.stringify(request, null, 2));
    }
    this.requestLog.push({ timestamp: Date.now(), request });

    try {
      const response = await this.client.request(
        request,
        CallToolResultSchema
      );

      if (this.options.logResponses) {
        console.log('📥 MCP Tool Response:', JSON.stringify(response, null, 2));
      }
      this.responseLog.push({ timestamp: Date.now(), response });

      return response as ToolCallResult;

    } catch (error: any) {
      const errorResult: ToolCallResult = {
        content: [{
          type: 'text',
          text: error.message
        }],
        isError: true
      };

      if (this.options.logResponses) {
        console.error('📥 MCP Error Response:', error.message);
      }
      this.responseLog.push({ timestamp: Date.now(), error: error.message });

      return errorResult;
    }
  }

  /**
   * Get request/response logs
   */
  getLogs(): { requests: any[]; responses: any[] } {
    return {
      requests: this.requestLog,
      responses: this.responseLog
    };
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.requestLog = [];
    this.responseLog = [];
  }

  /**
   * Helper: Parse tool result text content
   */
  parseTextResult(result: ToolCallResult): string {
    const textContent = result.content.find(c => c.type === 'text');
    return textContent?.text || '';
  }

  /**
   * Helper: Parse tool result data content
   */
  parseDataResult(result: ToolCallResult): any {
    const dataContent = result.content.find(c => c.data);
    return dataContent?.data || null;
  }

  /**
   * Helper: Parse JSON from text result
   */
  parseJsonResult(result: ToolCallResult): any {
    const text = this.parseTextResult(result);
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  /**
   * Helper: Assert tool call succeeded
   */
  assertSuccess(result: ToolCallResult, message?: string): void {
    if (result.isError) {
      const errorText = this.parseTextResult(result);
      throw new Error(message || `Tool call failed: ${errorText}`);
    }
  }

  /**
   * Helper: Assert tool call failed
   */
  assertError(result: ToolCallResult, message?: string): void {
    if (!result.isError) {
      throw new Error(message || 'Expected tool call to fail, but it succeeded');
    }
  }

  /**
   * Helper: Assert result contains text
   */
  assertContainsText(result: ToolCallResult, expected: string, message?: string): void {
    const text = this.parseTextResult(result);
    if (!text.includes(expected)) {
      throw new Error(
        message ||
        `Expected result to contain "${expected}", but got: ${text}`
      );
    }
  }

  /**
   * Helper: Create task via tool call
   */
  async createTask(listId: string, taskData: any): Promise<any> {
    const result = await this.callTool('clickup_task_create', {
      list_id: listId,
      ...taskData
    });

    this.assertSuccess(result, 'Failed to create task');
    return this.parseJsonResult(result);
  }

  /**
   * Helper: Get task via tool call
   */
  async getTask(taskId: string, options?: any): Promise<any> {
    const result = await this.callTool('clickup_task_get', {
      task_id: taskId,
      ...options
    });

    this.assertSuccess(result, 'Failed to get task');
    return this.parseJsonResult(result);
  }

  /**
   * Helper: Update task via tool call
   */
  async updateTask(taskId: string, updates: any): Promise<any> {
    const result = await this.callTool('clickup_task_update', {
      task_id: taskId,
      ...updates
    });

    this.assertSuccess(result, 'Failed to update task');
    return this.parseJsonResult(result);
  }

  /**
   * Helper: Delete task via tool call
   */
  async deleteTask(taskId: string): Promise<void> {
    const result = await this.callTool('clickup_task_delete', {
      task_id: taskId
    });

    this.assertSuccess(result, 'Failed to delete task');
  }

  /**
   * Helper: Add dependency between tasks
   */
  async addDependency(
    taskId: string,
    dependsOn?: string,
    dependencyOf?: string
  ): Promise<void> {
    const result = await this.callTool('clickup_task_add_dependency', {
      task_id: taskId,
      depends_on: dependsOn,
      dependency_of: dependencyOf
    });

    this.assertSuccess(result, 'Failed to add dependency');
  }

  /**
   * Helper: Get task dependencies
   */
  async getDependencies(taskId: string): Promise<any> {
    const result = await this.callTool('clickup_task_get_dependencies', {
      task_id: taskId
    });

    this.assertSuccess(result, 'Failed to get dependencies');
    return this.parseJsonResult(result);
  }

  /**
   * Helper: Set custom field value
   */
  async setCustomField(
    taskId: string,
    fieldId: string,
    value: any,
    fieldType?: string
  ): Promise<any> {
    const result = await this.callTool('clickup_custom_field_set_value', {
      task_id: taskId,
      field_id: fieldId,
      value,
      field_type: fieldType
    });

    this.assertSuccess(result, 'Failed to set custom field');
    return this.parseJsonResult(result);
  }

  /**
   * Helper: Get custom field values
   */
  async getCustomFields(taskId: string): Promise<any> {
    const result = await this.callTool('clickup_custom_field_get_values', {
      task_id: taskId
    });

    this.assertSuccess(result, 'Failed to get custom fields');
    return this.parseJsonResult(result);
  }

  /**
   * Helper: Add comment to task
   */
  async addComment(taskId: string, commentText: string): Promise<any> {
    const result = await this.callTool('clickup_comment_create', {
      task_id: taskId,
      comment_text: commentText
    });

    this.assertSuccess(result, 'Failed to add comment');
    return this.parseJsonResult(result);
  }

  /**
   * Helper: Get workspace hierarchy
   */
  async getWorkspaceHierarchy(): Promise<any> {
    const result = await this.callTool('clickup_workspace_hierarchy', {});

    this.assertSuccess(result, 'Failed to get workspace hierarchy');
    return this.parseJsonResult(result);
  }
}

/**
 * Create and connect MCP test client
 */
export async function createMCPTestClient(
  options: MCPTestClientOptions
): Promise<MCPTestClient> {
  const client = new MCPTestClient(options);
  await client.connect();
  return client;
}
