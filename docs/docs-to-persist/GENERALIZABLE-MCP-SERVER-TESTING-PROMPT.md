# Generalizable MCP Server Integration Testing Prompt

## Purpose

This document provides a comprehensive, reusable prompt for creating integration test suites for **any MCP (Model Context Protocol) server**. Use this as a template when building integration tests for MCP servers that interact with external APIs or services.

## Overview

Integration testing for MCP servers requires validating:
1. **MCP Protocol Compliance** - Tools, resources, and prompts work correctly
2. **External API Integration** - Correct interaction with target service
3. **Error Handling** - Graceful handling of failures and edge cases
4. **Data Consistency** - State management and data integrity
5. **Performance** - Acceptable response times under load
6. **Concurrency** - Thread-safety and parallel operation handling

## Quick Start Testing Prompt

Use this prompt to generate an integration test suite for any MCP server:

```
Create a comprehensive integration test suite for the [SERVICE NAME] MCP Server.

# Context
- MCP Server: [server name and purpose]
- External Service: [API/service being integrated]
- Protocol: MCP over [STDIO/SSE/HTTP Streamable]
- Language: [TypeScript/Python/etc.]
- Test Framework: [Vitest/Jest/Pytest/etc.]

# Requirements

## Phase 1: Test Infrastructure Setup (2 hours)
1. Create test client wrapper for MCP protocol communication
2. Implement environment configuration loader
3. Set up test resource tracking and automatic cleanup
4. Create helper functions for common operations
5. Configure test framework with appropriate timeouts

## Phase 2: Core Integration Tests (6-8 hours)
Create test files covering:

### 2.1 Basic CRUD Operations
- Create, read, update, delete operations
- List and search operations
- Filtering and pagination
- Batch operations

### 2.2 Relationships and Hierarchies
- Parent-child relationships
- Dependencies between resources
- Nested structures
- Cross-references

### 2.3 Metadata Management
- Tags/labels
- Custom fields
- Comments/annotations
- Timestamps and audit trails

### 2.4 Error Handling
- Invalid parameters
- Missing required fields
- Not found errors (404)
- Permission errors (403)
- Rate limiting (429)
- Server errors (500)
- Network failures
- Timeout handling

### 2.5 Authentication & Authorization
- Valid credentials work
- Invalid credentials rejected
- Token expiry handling
- Permission boundaries
- Tier/subscription limits

## Phase 3: Advanced Scenario Tests (4-6 hours)
Create test files for:

### 3.1 Multi-Step Workflows
- Complete lifecycle operations
- State machine transitions
- Long-running operations
- Rollback scenarios

### 3.2 Concurrency
- Parallel operations
- Race conditions
- Simultaneous updates
- Deadlock prevention

### 3.3 Data Integrity
- Consistency validation
- Orphaned resource detection
- Referential integrity
- Cascade operations

## Phase 4: Documentation (1-2 hours)
Create:
- Test execution guide
- Environment setup documentation
- Common issues and solutions
- CI/CD integration instructions

# Test Structure Template

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MCPTestClient } from './utils/mcp-test-client';
import { getTestEnvironment, cleanupTestResources } from './utils/test-helpers';

describe('[Feature] Integration Tests', () => {
  let client: MCPTestClient;
  let testContext: any;

  beforeAll(async () => {
    const env = await getTestEnvironment();
    client = new MCPTestClient();
    await client.connect();
    testContext = env;
  });

  afterAll(async () => {
    await cleanupTestResources();
    await client.disconnect();
  });

  describe('[Sub-feature]', () => {
    it('should [behavior]', async () => {
      // Arrange
      const input = prepareTestData();

      // Act
      const result = await client.callTool('[tool_name]', input);

      // Assert
      expect(result.isError).toBe(false);
      const data = client.parseJsonResult(result);
      expect(data).toBeDefined();
    });
  });
});
```

# Deliverables

Provide:
1. Complete test suite with 50+ test cases
2. Test utilities and helper functions
3. Environment configuration templates
4. README with test execution instructions
5. CI/CD integration examples
```

## Test File Organization

Organize tests by feature domain, not by MCP protocol components:

```
tests/
├── integration/
│   ├── utils/
│   │   ├── mcp-test-client.ts      # MCP protocol wrapper
│   │   ├── test-helpers.ts         # Common utilities
│   │   └── test-environment.ts     # Environment config
│   ├── [feature]-lifecycle.test.ts # CRUD operations
│   ├── [feature]-relationships.test.ts
│   ├── [feature]-metadata.test.ts
│   ├── error-handling.test.ts
│   ├── authentication.test.ts
│   ├── workflows.test.ts           # Advanced scenarios
│   ├── concurrency.test.ts
│   └── data-integrity.test.ts
├── unit/                            # Unit tests
└── e2e/                             # End-to-end tests
```

## Key Testing Patterns

### 1. Resource Tracking Pattern

Always track created resources for cleanup:

```typescript
// Global resource tracker (singleton)
class ResourceTracker {
  private static instance: ResourceTracker;
  private resources: Map<string, string[]> = new Map();

  static getInstance(): ResourceTracker {
    if (!ResourceTracker.instance) {
      ResourceTracker.instance = new ResourceTracker();
    }
    return ResourceTracker.instance;
  }

  track(type: string, id: string) {
    const existing = this.resources.get(type) || [];
    this.resources.set(type, [...existing, id]);
  }

  async cleanup() {
    // Delete in reverse order of creation
    for (const [type, ids] of Array.from(this.resources.entries()).reverse()) {
      for (const id of ids) {
        await this.deleteResource(type, id);
      }
    }
    this.resources.clear();
  }
}
```

### 2. Test Isolation Pattern

Ensure tests don't interfere with each other:

```typescript
// Use unique names for every test resource
function uniqueTestName(baseName: string): string {
  return `${baseName}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// Example usage
const taskName = uniqueTestName('My Task'); // "My Task-1698765432-a3x9z"
```

### 3. Error Handling Pattern

Test both success and failure cases:

```typescript
describe('Error Handling', () => {
  it('should succeed with valid input', async () => {
    const result = await client.callTool('resource_create', {
      name: 'Valid Name',
      required_field: 'value'
    });

    expect(result.isError).toBe(false);
  });

  it('should fail with missing required field', async () => {
    const result = await client.callTool('resource_create', {
      name: 'Invalid'
      // Missing required_field
    });

    expect(result.isError).toBe(true);
    const errorText = client.parseTextResult(result);
    expect(errorText.toLowerCase()).toMatch(/required|missing/);
  });
});
```

### 4. Async Operation Pattern

Handle asynchronous operations with appropriate delays:

```typescript
async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Use between operations that may not be immediately consistent
await client.createResource(data);
await delay(100); // Allow API to process
const retrieved = await client.getResource(id);
```

### 5. Bulk Operation Pattern

Test performance with bulk operations:

```typescript
it('should handle bulk creation', async () => {
  const count = 50;
  const startTime = Date.now();

  const resources = await Promise.all(
    Array.from({ length: count }, (_, i) =>
      client.createResource({ name: `Resource ${i + 1}` })
    )
  );

  const endTime = Date.now();
  const duration = endTime - startTime;

  expect(resources).toHaveLength(count);
  console.log(`Created ${count} resources in ${duration}ms (${(duration/count).toFixed(0)}ms avg)`);
});
```

### 6. Relationship Testing Pattern

Test parent-child and dependency relationships:

```typescript
it('should maintain parent-child relationship', async () => {
  const parent = await client.createResource({ name: 'Parent' });

  const child = await client.createResource({
    name: 'Child',
    parent_id: parent.id
  });

  expect(child.parent_id).toBe(parent.id);

  // Verify relationship from parent side
  const children = await client.getChildren(parent.id);
  expect(children).toContainEqual(expect.objectContaining({ id: child.id }));
});
```

### 7. State Machine Testing Pattern

Test valid and invalid state transitions:

```typescript
it('should allow valid state transitions', async () => {
  const resource = await client.createResource({
    name: 'Test',
    state: 'draft'
  });

  // Valid transition: draft → review
  await client.updateResource(resource.id, { state: 'review' });

  // Valid transition: review → published
  await client.updateResource(resource.id, { state: 'published' });

  const final = await client.getResource(resource.id);
  expect(final.state).toBe('published');
});

it('should reject invalid state transitions', async () => {
  const resource = await client.createResource({
    name: 'Test',
    state: 'draft'
  });

  // Invalid transition: draft → published (skipping review)
  const result = await client.callTool('resource_update', {
    id: resource.id,
    state: 'published'
  });

  expect(result.isError).toBe(true);
});
```

### 8. Concurrency Testing Pattern

Test concurrent operations:

```typescript
it('should handle concurrent updates', async () => {
  const resource = await client.createResource({ name: 'Concurrent Test' });

  // Update same resource concurrently
  const updates = await Promise.all([
    client.updateResource(resource.id, { field1: 'Value 1' }),
    client.updateResource(resource.id, { field2: 'Value 2' }),
    client.updateResource(resource.id, { field3: 'Value 3' })
  ]);

  // All updates should succeed (last write wins)
  expect(updates.every(u => u.id === resource.id)).toBe(true);

  const final = await client.getResource(resource.id);
  expect(final.id).toBe(resource.id);
});
```

## Environment Configuration

### Required Environment Variables

```bash
# Service API credentials
API_KEY=xxx
API_TOKEN=xxx

# Test environment identifiers
TEST_WORKSPACE_ID=xxx
TEST_PROJECT_ID=xxx

# Feature flags
ENABLE_INTEGRATION_TESTS=true
INTEGRATION_TEST_TIMEOUT=30000

# Optional: Cleanup behavior
AUTO_CLEANUP=true
PRESERVE_TEST_DATA=false
```

### Environment Loader

```typescript
export interface TestEnvironment {
  apiKey: string;
  workspaceId: string;
  projectId: string;
  timeout: number;
}

export async function getTestEnvironment(): Promise<TestEnvironment> {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error('API_KEY environment variable required');
  }

  return {
    apiKey,
    workspaceId: process.env.TEST_WORKSPACE_ID!,
    projectId: process.env.TEST_PROJECT_ID!,
    timeout: parseInt(process.env.INTEGRATION_TEST_TIMEOUT || '30000', 10)
  };
}
```

## Performance Benchmarking

Include performance metrics in tests:

```typescript
it('should meet performance requirements', async () => {
  const iterations = 100;
  const startTime = Date.now();

  for (let i = 0; i < iterations; i++) {
    await client.callTool('lightweight_operation', {});
    await delay(10);
  }

  const endTime = Date.now();
  const duration = endTime - startTime;
  const avgTime = duration / iterations;

  expect(avgTime).toBeLessThan(100); // 100ms max per operation

  console.log(`Performance: ${avgTime.toFixed(0)}ms avg over ${iterations} iterations`);
});
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Integration Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  integration-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Run integration tests
        env:
          API_KEY: ${{ secrets.TEST_API_KEY }}
          TEST_WORKSPACE_ID: ${{ secrets.TEST_WORKSPACE_ID }}
          TEST_PROJECT_ID: ${{ secrets.TEST_PROJECT_ID }}
        run: npm run test:integration

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: test-results/
```

## Common Pitfalls

### ❌ Don't Do This

1. **Hardcoded IDs**: Never hardcode resource IDs in tests
```typescript
// BAD
const task = await client.getTask('12345');
```

2. **Missing Cleanup**: Always cleanup test resources
```typescript
// BAD - no cleanup
it('should create task', async () => {
  await client.createTask({ name: 'Test' });
  // Test ends, resource remains
});
```

3. **Race Conditions**: Don't assume immediate consistency
```typescript
// BAD - no delay
await client.createResource(data);
const result = await client.getResource(id); // May fail
```

4. **Shared State**: Don't reuse resources between tests
```typescript
// BAD - shared state
let sharedResource;
beforeAll(async () => {
  sharedResource = await client.createResource();
});

it('test 1', async () => {
  await client.updateResource(sharedResource.id); // Affects test 2
});
```

### ✅ Do This Instead

1. **Dynamic IDs**: Use test helpers to create resources
```typescript
// GOOD
const task = await createTestTask(client, { name: uniqueTestName('Task') });
```

2. **Automatic Cleanup**: Track and cleanup all resources
```typescript
// GOOD
afterAll(async () => {
  await cleanupTestResources();
});
```

3. **Appropriate Delays**: Add delays between operations
```typescript
// GOOD
await client.createResource(data);
await delay(100);
const result = await client.getResource(id);
```

4. **Test Isolation**: Create fresh resources per test
```typescript
// GOOD
it('test 1', async () => {
  const resource = await client.createResource({ name: uniqueTestName('R') });
  // Use resource
});
```

## Test Coverage Goals

Aim for these coverage targets:

| Test Category | Minimum Coverage |
|--------------|------------------|
| CRUD Operations | 100% |
| Error Handling | 90% |
| Authentication | 100% |
| Relationships | 80% |
| Workflows | 70% |
| Concurrency | 60% |
| Edge Cases | 50% |

## Success Criteria

A complete integration test suite should:

- ✅ Cover all MCP tools provided by the server
- ✅ Test all major use cases and workflows
- ✅ Include error handling for all failure modes
- ✅ Validate data consistency and integrity
- ✅ Run reliably in CI/CD pipeline
- ✅ Complete in under 5 minutes
- ✅ Clean up all test resources
- ✅ Provide clear error messages on failure

## References

- **MCP Specification**: https://spec.modelcontextprotocol.io/
- **MCP SDK (TypeScript)**: https://github.com/modelcontextprotocol/typescript-sdk
- **MCP SDK (Python)**: https://github.com/modelcontextprotocol/python-sdk
- **Vitest Documentation**: https://vitest.dev/
- **Testing Best Practices**: https://testingjavascript.com/

---

**Last Updated**: 2025-01-01
**Version**: 1.0.0
**Tested With**: MCP SDK 0.5.0+, TypeScript 5.0+, Vitest 1.0+
