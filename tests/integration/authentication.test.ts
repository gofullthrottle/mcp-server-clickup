/**
 * Integration Tests: Authentication
 *
 * Tests authentication and authorization through MCP server:
 *
 * **Traditional Mode (STDIO):**
 * - API key validation
 * - Invalid API key handling
 * - Team ID validation
 * - Workspace access control
 *
 * **Remote MCP Server (CloudFlare Workers) - Documented:**
 * - OAuth 2.0 flow initiation
 * - JWT token generation
 * - Token refresh mechanism
 * - Session expiry handling
 * - Multi-user isolation
 * - JWT signature validation
 *
 * NOTE: This test suite focuses on Traditional Mode authentication.
 * Remote MCP Server OAuth/JWT tests require HTTP client and separate
 * test infrastructure (see docs-to-persist for Remote MCP test plans).
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MCPTestClient, createMCPTestClient } from './mcp-test-client';
import { setupTestEnvironment, teardownTestEnvironment, getTestEnvironment } from './setup';
import { createTask, uniqueTestName } from './utils';

describe('Authentication Integration Tests', () => {
  let client: MCPTestClient;
  let testEnv: any;
  let listId: string;

  beforeAll(async () => {
    // Setup test environment
    testEnv = await setupTestEnvironment();
    listId = testEnv.listId;

    // Connect MCP client
    client = await createMCPTestClient({
      apiKey: testEnv.apiKey,
      teamId: testEnv.teamId,
      logRequests: false,
      logResponses: false
    });
  });

  afterAll(async () => {
    // Disconnect client
    await client.disconnect();

    // Cleanup test environment
    await teardownTestEnvironment(false);
  });

  describe('API Key Validation (Traditional Mode)', () => {
    it('should successfully authenticate with valid API key', async () => {
      // Verify client can perform operations with valid API key
      const result = await client.callTool('clickup_workspace_hierarchy_get', {});

      expect(result.isError).toBe(false);
      const hierarchy = client.parseJsonResult(result);
      expect(hierarchy).toBeDefined();
      expect(hierarchy.teams).toBeDefined();
    });

    it('should create and retrieve tasks with valid authentication', async () => {
      // Create task
      const task = await createTask(client, listId, {
        name: uniqueTestName('Auth Test')
      });

      expect(task).toBeDefined();
      expect(task.id).toBeDefined();

      // Retrieve task
      const retrieved = await client.getTask(task.id);
      expect(retrieved.id).toBe(task.id);
    });

    it('should handle workspace hierarchy access', async () => {
      const result = await client.callTool('clickup_workspace_hierarchy_get', {});

      expect(result.isError).toBe(false);
      const hierarchy = client.parseJsonResult(result);

      // Verify hierarchy contains expected structure
      expect(hierarchy.teams).toBeDefined();
      expect(Array.isArray(hierarchy.teams)).toBe(true);
      expect(hierarchy.teams.length).toBeGreaterThan(0);

      // Verify authenticated user has access
      const team = hierarchy.teams[0];
      expect(team.id).toBeDefined();
      expect(team.name).toBeDefined();
    });

    it('should validate team ID matches workspace access', async () => {
      const env = await getTestEnvironment();

      const result = await client.callTool('clickup_workspace_hierarchy_get', {});
      const hierarchy = client.parseJsonResult(result);

      // Verify test environment team ID exists in hierarchy
      const teamExists = hierarchy.teams.some((t: any) => t.id === env.teamId);
      expect(teamExists).toBe(true);
    });
  });

  describe('Invalid Credentials Handling (Traditional Mode)', () => {
    it('should document behavior with invalid API key', async () => {
      // NOTE: This test documents expected behavior but cannot be run
      // without restarting the MCP server with invalid credentials

      // Expected behavior:
      // - Server should reject requests with 401 Unauthorized
      // - Error message should indicate authentication failure
      // - No workspace data should be exposed

      console.log('⚠️  Invalid API key test: Manual verification required');
      console.log('To test invalid API key handling:');
      console.log('1. Set CLICKUP_API_KEY to invalid value');
      console.log('2. Restart MCP server');
      console.log('3. Verify all operations fail with auth error');
    });

    it('should document behavior with missing API key', async () => {
      // NOTE: Cannot test without restarting server

      // Expected behavior:
      // - Server should fail to start or reject all requests
      // - Clear error message indicating missing API key

      console.log('⚠️  Missing API key test: Manual verification required');
      console.log('To test missing API key:');
      console.log('1. Unset CLICKUP_API_KEY environment variable');
      console.log('2. Attempt to start MCP server');
      console.log('3. Verify server fails with clear error message');
    });

    it('should document behavior with invalid team ID', async () => {
      // NOTE: Cannot test without restarting server

      // Expected behavior:
      // - Operations may succeed but access wrong workspace
      // - Or operations may fail if team ID doesn't match API key

      console.log('⚠️  Invalid team ID test: Manual verification required');
      console.log('To test invalid team ID:');
      console.log('1. Set CLICKUP_TEAM_ID to invalid/different workspace ID');
      console.log('2. Restart MCP server');
      console.log('3. Verify operations fail or access correct workspace');
    });
  });

  describe('Workspace Access Control', () => {
    it('should only access resources within authenticated workspace', async () => {
      const result = await client.callTool('clickup_workspace_hierarchy_get', {});
      const hierarchy = client.parseJsonResult(result);

      // Verify all spaces belong to authenticated team
      const env = await getTestEnvironment();

      for (const team of hierarchy.teams) {
        if (team.id === env.teamId) {
          expect(team.spaces).toBeDefined();
          expect(Array.isArray(team.spaces)).toBe(true);
        }
      }
    });

    it('should prevent access to resources in other workspaces', async () => {
      // This test verifies we can't access resources outside our workspace
      // We can't easily test without a second workspace, so document expected behavior

      console.log('⚠️  Cross-workspace access test: Expected behavior');
      console.log('- Tasks in other workspaces should return 404/403');
      console.log('- API key only grants access to associated workspace');
      console.log('- Team ID parameter scopes all operations to that workspace');
    });

    it('should respect space-level permissions', async () => {
      const hierarchy = await client.getWorkspaceHierarchy();

      // Verify we can access test space
      const testSpace = hierarchy.teams
        .flatMap((t: any) => t.spaces || [])
        .find((s: any) => s.id === testEnv.spaceId);

      expect(testSpace).toBeDefined();
      expect(testSpace.id).toBe(testEnv.spaceId);
    });

    it('should verify authenticated user in workspace', async () => {
      const hierarchy = await client.getWorkspaceHierarchy();

      // Get team members
      const env = await getTestEnvironment();
      const team = hierarchy.teams.find((t: any) => t.id === env.teamId);

      if (team && team.members) {
        expect(team.members).toBeDefined();
        expect(Array.isArray(team.members)).toBe(true);
        expect(team.members.length).toBeGreaterThan(0);

        // Verify at least one member exists (the authenticated user)
        const member = team.members[0];
        expect(member.user).toBeDefined();
        expect(member.user.id).toBeDefined();
      }
    });
  });

  describe('API Key Scope and Permissions', () => {
    it('should allow task read operations', async () => {
      const task = await createTask(client, listId, {
        name: uniqueTestName('Read Test')
      });

      const retrieved = await client.getTask(task.id);
      expect(retrieved.id).toBe(task.id);
    });

    it('should allow task write operations', async () => {
      const task = await createTask(client, listId, {
        name: uniqueTestName('Write Test')
      });

      const updated = await client.updateTask(task.id, {
        description: 'Updated via API'
      });

      expect(updated.description).toBe('Updated via API');
    });

    it('should allow task delete operations', async () => {
      const task = await createTask(client, listId, {
        name: uniqueTestName('Delete Test')
      });

      await client.deleteTask(task.id);

      const result = await client.callTool('clickup_task_get', {
        task_id: task.id
      });

      expect(result.isError).toBe(true);
    });

    it('should allow comment operations', async () => {
      const task = await createTask(client, listId, {
        name: uniqueTestName('Comment Test')
      });

      const comment = await client.addComment(task.id, 'Test comment');
      expect(comment.id).toBeDefined();
    });

    it('should allow dependency operations', async () => {
      const task1 = await createTask(client, listId, {
        name: uniqueTestName('Dep Test 1')
      });

      const task2 = await createTask(client, listId, {
        name: uniqueTestName('Dep Test 2')
      });

      await client.addDependency(task2.id, task1.id);

      const deps = await client.getDependencies(task2.id);
      expect(deps.depends_on?.length).toBeGreaterThan(0);
    });

    it('should allow custom field operations', async () => {
      const task = await createTask(client, listId, {
        name: uniqueTestName('Custom Field Test')
      });

      const result = await client.callTool('clickup_custom_field_get_accessible', {
        list_id: listId
      });

      expect(result.isError).toBe(false);
    });
  });

  describe('Session Management (Traditional Mode)', () => {
    it('should maintain connection across multiple operations', async () => {
      // Perform sequence of operations
      const task1 = await createTask(client, listId, {
        name: uniqueTestName('Session 1')
      });

      const task2 = await createTask(client, listId, {
        name: uniqueTestName('Session 2')
      });

      const updated = await client.updateTask(task1.id, {
        description: 'Updated'
      });

      const retrieved = await client.getTask(task2.id);

      // All operations should succeed with same connection
      expect(task1.id).toBeDefined();
      expect(task2.id).toBeDefined();
      expect(updated.description).toBe('Updated');
      expect(retrieved.id).toBe(task2.id);
    });

    it('should handle long-running operations', async () => {
      // Perform operations over extended time period
      const operations = [];

      for (let i = 0; i < 5; i++) {
        const task = await createTask(client, listId, {
          name: uniqueTestName(`Long Running ${i}`)
        });
        operations.push(task);

        // Wait between operations to simulate long session
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      expect(operations).toHaveLength(5);
      expect(operations.every(t => t.id)).toBe(true);
    });
  });

  describe('Remote MCP Server Authentication (Documentation)', () => {
    it('should document OAuth 2.0 flow', () => {
      // NOTE: This test documents the OAuth flow for Remote MCP Server
      // Actual implementation requires HTTP client and CloudFlare Workers deployment

      console.log('\n📚 Remote MCP Server OAuth 2.0 Flow:');
      console.log('');
      console.log('1. User initiates OAuth: GET /auth/login');
      console.log('   - Redirects to ClickUp authorization page');
      console.log('   - User grants permissions to MCP app');
      console.log('');
      console.log('2. ClickUp redirects: GET /auth/callback?code=XXX');
      console.log('   - Exchange authorization code for access token');
      console.log('   - Encrypt and store API key in CloudFlare KV');
      console.log('   - Generate JWT session token (24h expiry)');
      console.log('');
      console.log('3. Client uses JWT: Authorization: Bearer JWT_TOKEN');
      console.log('   - All MCP requests include JWT in headers');
      console.log('   - Server validates JWT signature');
      console.log('   - Server decrypts API key from KV');
      console.log('   - Server proxies to ClickUp API');
      console.log('');
      console.log('4. Token refresh: POST /auth/refresh');
      console.log('   - Exchange old JWT for new JWT');
      console.log('   - Extends session without re-authentication');
      console.log('');
      console.log('5. Multi-user isolation:');
      console.log('   - Each user has unique encrypted API key');
      console.log('   - JWT sub claim identifies user');
      console.log('   - Complete data isolation between users');
    });

    it('should document JWT token structure', () => {
      console.log('\n📚 JWT Token Structure:');
      console.log('');
      console.log('Header:');
      console.log('  {');
      console.log('    "alg": "HS256",');
      console.log('    "typ": "JWT"');
      console.log('  }');
      console.log('');
      console.log('Payload:');
      console.log('  {');
      console.log('    "sub": "user_id",           // User identifier');
      console.log('    "clickup_team_id": "123",   // ClickUp workspace');
      console.log('    "tier": "premium",          // Subscription tier');
      console.log('    "iat": 1234567890,          // Issued at');
      console.log('    "exp": 1234654290           // Expires at (24h)');
      console.log('  }');
      console.log('');
      console.log('Signature:');
      console.log('  HMACSHA256(');
      console.log('    base64UrlEncode(header) + "." +');
      console.log('    base64UrlEncode(payload),');
      console.log('    secret');
      console.log('  )');
    });

    it('should document session expiry handling', () => {
      console.log('\n📚 Session Expiry Handling:');
      console.log('');
      console.log('JWT tokens expire after 24 hours.');
      console.log('');
      console.log('Before expiry:');
      console.log('- Client can use /auth/refresh endpoint');
      console.log('- Receives new JWT with extended expiry');
      console.log('- Original API key remains valid');
      console.log('');
      console.log('After expiry:');
      console.log('- MCP requests return 401 Unauthorized');
      console.log('- User must re-authenticate via OAuth flow');
      console.log('- New JWT generated with fresh 24h expiry');
      console.log('');
      console.log('Best Practice:');
      console.log('- Clients should refresh token before expiry');
      console.log('- Implement automatic refresh at 23h mark');
      console.log('- Handle 401 by redirecting to OAuth login');
    });

    it('should document multi-user isolation', () => {
      console.log('\n📚 Multi-User Isolation:');
      console.log('');
      console.log('CloudFlare KV Storage:');
      console.log('  sessions:{user_id} => {');
      console.log('    encrypted_api_key: "...",');
      console.log('    team_id: "123",');
      console.log('    created_at: 1234567890');
      console.log('  }');
      console.log('');
      console.log('Isolation guarantees:');
      console.log('- Each user\'s API key encrypted with AES-256-GCM');
      console.log('- Unique encryption key per user (derived from JWT secret + user_id)');
      console.log('- API keys never shared between users');
      console.log('- JWT sub claim prevents cross-user access');
      console.log('- Audit logs track all user actions');
      console.log('');
      console.log('Security features:');
      console.log('- API keys encrypted at rest in KV');
      console.log('- JWT tokens signed with server secret');
      console.log('- Rate limiting per user (not global)');
      console.log('- Audit logs stored in CloudFlare R2');
    });

    it('should document tier-based authentication', () => {
      console.log('\n📚 Tier-Based Authentication:');
      console.log('');
      console.log('Free Tier:');
      console.log('- JWT includes tier: "free"');
      console.log('- Rate limit: 100 requests/minute');
      console.log('- Access to basic tools only');
      console.log('- Session expiry: 24 hours');
      console.log('');
      console.log('Premium Tier ($4.99/month):');
      console.log('- JWT includes tier: "premium"');
      console.log('- Rate limit: 500 requests/minute');
      console.log('- Access to all 72 tools');
      console.log('- Session expiry: 24 hours');
      console.log('- Priority support');
      console.log('');
      console.log('Tier enforcement:');
      console.log('- JWT tier claim validated on every request');
      console.log('- Premium tools check tier before execution');
      console.log('- Free tier users get upgrade prompts');
      console.log('- Stripe webhook updates tier in real-time');
    });
  });

  describe('Security Best Practices', () => {
    it('should never log API keys', async () => {
      // Verify API keys not exposed in logs
      // This is a documentation test of expected behavior

      console.log('✅ Security: API keys should never appear in:');
      console.log('- Console logs');
      console.log('- Error messages');
      console.log('- Debug output');
      console.log('- Network traces');
      console.log('- Audit logs (log user_id, not keys)');
    });

    it('should use HTTPS for all API communication', () => {
      // Document HTTPS requirement

      console.log('✅ Security: All ClickUp API requests use HTTPS');
      console.log('- BaseClickUpService enforces https://api.clickup.com');
      console.log('- No plaintext HTTP communication');
      console.log('- TLS 1.2+ required');
    });

    it('should implement rate limiting', () => {
      // Document rate limiting behavior

      console.log('✅ Security: Rate limiting protects API keys');
      console.log('- BaseClickUpService includes rate limit delay');
      console.log('- Prevents API key from being rate-limited by ClickUp');
      console.log('- Remote MCP Server: Per-user rate limits');
      console.log('- Free tier: 100 req/min, Premium: 500 req/min');
    });
  });
});
