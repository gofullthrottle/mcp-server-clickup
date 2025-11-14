# Integration Test Patterns

## Purpose

This document captures common integration test patterns and anti-patterns discovered during the development of the ClickUp MCP Server integration test suite. These patterns are applicable to any integration testing scenario, particularly for MCP servers and external API integrations.

## Table of Contents

1. [Essential Patterns](#essential-patterns)
2. [Anti-Patterns to Avoid](#anti-patterns-to-avoid)
3. [Test Organization](#test-organization)
4. [Resource Management](#resource-management)
5. [Error Handling](#error-handling)
6. [Performance Testing](#performance-testing)
7. [Concurrency Testing](#concurrency-testing)
8. [Data Integrity](#data-integrity)

## Essential Patterns

### 1. Arrange-Act-Assert (AAA) Pattern

**✅ GOOD**: Clear separation of test phases

```typescript
it('should create task with valid data', async () => {
  // Arrange
  const taskData = {
    name: uniqueTestName('Test Task'),
    description: 'Test description'
  };

  // Act
  const result = await client.callTool('task_create', taskData);

  // Assert
  expect(result.isError).toBe(false);
  const task = client.parseJsonResult(result);
  expect(task.id).toBeDefined();
  expect(task.name).toBe(taskData.name);
});
```

**❌ BAD**: Mixed phases

```typescript
it('should create task', async () => {
  const result = await client.callTool('task_create', {
    name: uniqueTestName('Test')  // Arrange mixed with Act
  });
  expect(result.isError).toBe(false);  // Assert immediately
  const task = client.parseJsonResult(result);  // More Act
  expect(task.id).toBeDefined();  // More Assert
});
```

### 2. Test Isolation Pattern

**✅ GOOD**: Each test creates its own resources

```typescript
it('test 1', async () => {
  const resource = await createResource({ name: uniqueTestName('R1') });
  // Use resource
  // Cleanup handled automatically
});

it('test 2', async () => {
  const resource = await createResource({ name: uniqueTestName('R2') });
  // Use resource independently
});
```

**❌ BAD**: Shared state between tests

```typescript
let sharedResource;

beforeAll(async () => {
  sharedResource = await createResource({ name: 'Shared' });
});

it('test 1', async () => {
  await updateResource(sharedResource.id, { field: 'value1' });
  // Modifies shared state - affects test 2
});

it('test 2', async () => {
  const resource = await getResource(sharedResource.id);
  expect(resource.field).toBe(???); // Unknown due to test 1
});
```

### 3. Unique Naming Pattern

**✅ GOOD**: Guaranteed unique test resource names

```typescript
function uniqueTestName(baseName: string): string {
  return `${baseName}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const taskName = uniqueTestName('My Task');
// Result: "My Task-1698765432-a3x9z"
```

**❌ BAD**: Static or predictable names

```typescript
const taskName = 'Test Task';  // Collision if test runs twice
const taskName = `Test Task ${i}`;  // Collision across test runs
```

### 4. Resource Tracking Pattern

**✅ GOOD**: Automatic cleanup of all created resources

```typescript
class ResourceTracker {
  private resources: Map<string, string[]> = new Map();

  track(type: string, id: string) {
    const existing = this.resources.get(type) || [];
    this.resources.set(type, [...existing, id]);
  }

  async cleanup() {
    // Delete in reverse order of creation
    for (const [type, ids] of Array.from(this.resources.entries()).reverse()) {
      for (const id of ids) {
        try {
          await deleteResource(type, id);
        } catch (error) {
          console.warn(`Failed to cleanup ${type}:${id}`, error);
        }
      }
    }
    this.resources.clear();
  }
}

// Usage
afterAll(async () => {
  await ResourceTracker.getInstance().cleanup();
});
```

**❌ BAD**: Manual cleanup or no cleanup

```typescript
it('should create task', async () => {
  const task = await createTask({ name: 'Test' });
  // No cleanup - resource remains forever
});
```

### 5. Async Delay Pattern

**✅ GOOD**: Wait for eventual consistency

```typescript
async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Create resource
const task = await createTask(data);

// Wait for API to process
await delay(100);

// Now fetch
const retrieved = await getTask(task.id);
```

**❌ BAD**: Assume immediate consistency

```typescript
const task = await createTask(data);
const retrieved = await getTask(task.id);  // May fail - no delay
```

### 6. Error Testing Pattern

**✅ GOOD**: Test both success and failure cases

```typescript
describe('Task Creation', () => {
  it('should succeed with valid data', async () => {
    const result = await client.callTool('task_create', {
      name: 'Valid Task',
      required_field: 'value'
    });

    expect(result.isError).toBe(false);
  });

  it('should fail with missing required field', async () => {
    const result = await client.callTool('task_create', {
      name: 'Invalid Task'
      // Missing required_field
    });

    expect(result.isError).toBe(true);
    const errorText = client.parseTextResult(result);
    expect(errorText).toMatch(/required|missing/i);
  });
});
```

**❌ BAD**: Only test happy path

```typescript
it('should create task', async () => {
  const result = await client.callTool('task_create', {
    name: 'Task',
    required_field: 'value'
  });

  expect(result.isError).toBe(false);
  // Never tests error cases
});
```

### 7. Performance Benchmarking Pattern

**✅ GOOD**: Include performance metrics

```typescript
it('should meet performance requirements', async () => {
  const iterations = 100;
  const startTime = Date.now();

  for (let i = 0; i < iterations; i++) {
    await performOperation();
    await delay(10);
  }

  const duration = Date.now() - startTime;
  const avgTime = duration / iterations;

  expect(avgTime).toBeLessThan(100); // Assert performance requirement

  console.log(`Performance: ${avgTime.toFixed(0)}ms avg over ${iterations} iterations`);
});
```

**❌ BAD**: No performance validation

```typescript
it('should perform operation', async () => {
  await performOperation();
  // No timing or performance validation
});
```

### 8. Bulk Operation Pattern

**✅ GOOD**: Test with realistic batch sizes

```typescript
it('should handle bulk creation efficiently', async () => {
  const batchSize = 50;
  const startTime = Date.now();

  const resources = await Promise.all(
    Array.from({ length: batchSize }, (_, i) =>
      createResource({ name: uniqueTestName(`Item ${i + 1}`) })
    )
  );

  const duration = Date.now() - startTime;

  expect(resources).toHaveLength(batchSize);
  console.log(`Created ${batchSize} resources in ${duration}ms`);
});
```

**❌ BAD**: Only test single operations

```typescript
it('should create resource', async () => {
  const resource = await createResource({ name: 'Single' });
  expect(resource.id).toBeDefined();
  // Never tests bulk scenarios
});
```

## Anti-Patterns to Avoid

### 1. Hardcoded IDs

**❌ NEVER DO THIS**:

```typescript
const task = await client.getTask('12345');  // Hardcoded ID
```

**✅ DO THIS INSTEAD**:

```typescript
const task = await createTask({ name: uniqueTestName('Task') });
const retrieved = await client.getTask(task.id);  // Dynamic ID
```

### 2. Timing Assumptions

**❌ NEVER DO THIS**:

```typescript
await createResource(data);
const result = await getResource(id);  // Assumes instant consistency
```

**✅ DO THIS INSTEAD**:

```typescript
await createResource(data);
await delay(100);  // Explicit delay
const result = await getResource(id);
```

### 3. Ignoring Cleanup

**❌ NEVER DO THIS**:

```typescript
it('test', async () => {
  await createResource({ name: 'Test' });
  // No cleanup
});
```

**✅ DO THIS INSTEAD**:

```typescript
it('test', async () => {
  const resource = await createResource({ name: uniqueTestName('Test') });
  ResourceTracker.getInstance().track('resource', resource.id);
  // Automatic cleanup in afterAll
});
```

### 4. Silent Failures

**❌ NEVER DO THIS**:

```typescript
try {
  await riskyOperation();
} catch (error) {
  // Silent failure - test passes but operation failed
}
```

**✅ DO THIS INSTEAD**:

```typescript
try {
  await riskyOperation();
} catch (error) {
  console.error('Operation failed:', error);
  throw error;  // Fail test if unexpected
}
```

### 5. Over-Mocking

**❌ NEVER DO THIS** (for integration tests):

```typescript
// Integration test with mocked external API
const mockApi = jest.fn().mockResolvedValue({ id: '123' });
```

**✅ DO THIS INSTEAD**:

```typescript
// Integration test with real API
const result = await client.callTool('api_operation', realData);
// Tests actual integration
```

### 6. Test Order Dependencies

**❌ NEVER DO THIS**:

```typescript
it('step 1: create', async () => {
  sharedTask = await createTask({ name: 'Shared' });
});

it('step 2: update', async () => {
  await updateTask(sharedTask.id, { field: 'value' });
  // Depends on step 1 running first
});
```

**✅ DO THIS INSTEAD**:

```typescript
it('should create and update task', async () => {
  const task = await createTask({ name: uniqueTestName('Task') });
  await updateTask(task.id, { field: 'value' });
  // Self-contained test
});
```

## Test Organization

### File Structure

```
tests/
├── integration/
│   ├── utils/
│   │   ├── mcp-test-client.ts
│   │   ├── test-helpers.ts
│   │   └── test-environment.ts
│   ├── task-lifecycle.test.ts
│   ├── task-relationships.test.ts
│   ├── error-handling.test.ts
│   ├── authentication.test.ts
│   ├── workflows.test.ts
│   ├── concurrency.test.ts
│   └── data-integrity.test.ts
```

### Test Suite Structure

```typescript
describe('[Feature] Integration Tests', () => {
  let client: TestClient;
  let context: TestContext;

  beforeAll(async () => {
    // Setup once for entire suite
    context = await getTestEnvironment();
    client = new TestClient();
    await client.connect();
  });

  afterAll(async () => {
    // Cleanup once for entire suite
    await cleanupTestResources();
    await client.disconnect();
  });

  describe('[Sub-feature A]', () => {
    it('should [behavior 1]', async () => {
      // Test implementation
    });

    it('should [behavior 2]', async () => {
      // Test implementation
    });
  });

  describe('[Sub-feature B]', () => {
    it('should [behavior 3]', async () => {
      // Test implementation
    });
  });
});
```

## Resource Management

### Creation Helper Pattern

```typescript
async function createTestTask(
  client: TestClient,
  listId: string,
  overrides: Partial<TaskData> = {}
): Promise<Task> {
  const taskData = {
    name: uniqueTestName('Task'),
    ...overrides
  };

  const result = await client.callTool('task_create', {
    list_id: listId,
    ...taskData
  });

  if (result.isError) {
    throw new Error(`Failed to create task: ${client.parseTextResult(result)}`);
  }

  const task = client.parseJsonResult(result);

  // Track for cleanup
  ResourceTracker.getInstance().track('task', task.id);

  return task;
}
```

### Cleanup Strategy

```typescript
class ResourceTracker {
  async cleanup() {
    // Delete in reverse order of dependency
    const deletionOrder = [
      'comment',      // Delete comments first
      'subtask',      // Then subtasks
      'task',         // Then tasks
      'list',         // Then lists
      'space'         // Finally spaces
    ];

    for (const type of deletionOrder) {
      const ids = this.resources.get(type) || [];
      for (const id of ids) {
        await this.safeDelete(type, id);
      }
    }
  }

  private async safeDelete(type: string, id: string) {
    try {
      await deleteResource(type, id);
    } catch (error) {
      console.warn(`Failed to delete ${type}:${id}`, error.message);
      // Continue with other cleanup
    }
  }
}
```

## Error Handling

### Expected Error Pattern

```typescript
it('should handle expected error gracefully', async () => {
  const result = await client.callTool('operation', {
    invalid: 'data'
  });

  expect(result.isError).toBe(true);

  const errorText = client.parseTextResult(result);
  expect(errorText).toBeDefined();
  expect(errorText.length).toBeGreaterThan(0);
  expect(errorText).toMatch(/error|invalid|failed/i);
});
```

### Unexpected Error Pattern

```typescript
it('should not encounter unexpected errors', async () => {
  try {
    const result = await client.callTool('operation', validData);

    if (result.isError) {
      const errorText = client.parseTextResult(result);
      throw new Error(`Unexpected error: ${errorText}`);
    }

    expect(result.isError).toBe(false);
  } catch (error) {
    console.error('Unexpected error in test:', error);
    throw error;
  }
});
```

## Performance Testing

### Throughput Measurement

```typescript
it('should measure throughput', async () => {
  const operationCount = 30;
  const startTime = Date.now();

  const operations = [];
  for (let i = 0; i < operationCount; i++) {
    operations.push(performOperation());
    await delay(50);
  }

  await Promise.all(operations);

  const duration = Date.now() - startTime;
  const throughput = (operationCount / duration) * 1000; // ops/second

  console.log(`Throughput: ${throughput.toFixed(2)} operations/second`);
  console.log(`Total time: ${duration}ms for ${operationCount} operations`);

  expect(throughput).toBeGreaterThan(5); // Minimum 5 ops/sec
});
```

### Response Time Validation

```typescript
it('should meet response time SLA', async () => {
  const maxResponseTime = 500; // 500ms SLA
  const iterations = 10;
  const responseTimes = [];

  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    await performOperation();
    const duration = Date.now() - start;
    responseTimes.push(duration);
    await delay(100);
  }

  const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / iterations;
  const maxObserved = Math.max(...responseTimes);

  expect(avgResponseTime).toBeLessThan(maxResponseTime);
  console.log(`Avg: ${avgResponseTime.toFixed(0)}ms, Max: ${maxObserved}ms`);
});
```

## Concurrency Testing

### Parallel Creation Pattern

```typescript
it('should handle parallel creation', async () => {
  const concurrentCount = 10;

  const creationPromises = Array.from({ length: concurrentCount }, (_, i) =>
    createResource({ name: uniqueTestName(`Parallel ${i + 1}`) })
  );

  const resources = await Promise.all(creationPromises);

  expect(resources).toHaveLength(concurrentCount);
  expect(resources.every(r => r.id !== undefined)).toBe(true);

  // Verify unique IDs
  const uniqueIds = new Set(resources.map(r => r.id));
  expect(uniqueIds.size).toBe(concurrentCount);
});
```

### Race Condition Detection

```typescript
it('should detect race condition', async () => {
  const resource = await createResource({ name: uniqueTestName('Race') });

  // Update same resource concurrently with different values
  const updatePromises = [
    updateResource(resource.id, { field: 'value1' }),
    updateResource(resource.id, { field: 'value2' }),
    updateResource(resource.id, { field: 'value3' })
  ];

  const results = await Promise.all(updatePromises);

  // All updates should succeed (last write wins)
  expect(results.every(r => r.id === resource.id)).toBe(true);

  // Final state should be one of the values
  const final = await getResource(resource.id);
  expect(['value1', 'value2', 'value3']).toContain(final.field);

  console.log('Last write wins:', final.field);
});
```

## Data Integrity

### Referential Integrity Pattern

```typescript
it('should maintain referential integrity', async () => {
  const parent = await createResource({ name: uniqueTestName('Parent') });
  const child = await createResource({
    name: uniqueTestName('Child'),
    parent_id: parent.id
  });

  // Verify relationship
  expect(child.parent_id).toBe(parent.id);

  // Verify parent exists
  const retrievedParent = await getResource(parent.id);
  expect(retrievedParent.id).toBe(parent.id);

  // Verify child linked to parent
  const children = await getChildren(parent.id);
  expect(children).toContainEqual(
    expect.objectContaining({ id: child.id })
  );
});
```

### Consistency Validation Pattern

```typescript
it('should maintain data consistency after updates', async () => {
  const resource = await createResource({
    name: uniqueTestName('Consistency'),
    field1: 'initial'
  });

  // Perform multiple updates
  await updateResource(resource.id, { field1: 'updated1' });
  await delay(100);
  await updateResource(resource.id, { field2: 'value2' });
  await delay(100);
  await updateResource(resource.id, { field1: 'updated2' });
  await delay(100);

  // Verify final state
  const final = await getResource(resource.id);
  expect(final.id).toBe(resource.id);
  expect(final.field1).toBe('updated2');
  expect(final.field2).toBe('value2');

  console.log('✅ Data consistency maintained');
});
```

## Summary

### Key Takeaways

1. **Always isolate tests** - Each test should be independent
2. **Track and cleanup resources** - Don't leave test data behind
3. **Use unique names** - Prevent collisions across test runs
4. **Test both success and failure** - Error paths are just as important
5. **Include performance metrics** - Validate response times
6. **Test concurrency** - Validate parallel operation handling
7. **Validate data integrity** - Ensure consistency after operations
8. **Wait for consistency** - Add appropriate delays for eventual consistency

### When in Doubt

- **Prefer integration over mocking** - Test real interactions
- **Prefer explicit over implicit** - Be clear about what you're testing
- **Prefer simple over clever** - Tests should be easy to understand
- **Prefer verbose over terse** - Clarity beats brevity in tests

---

**Last Updated**: 2025-01-01
**Version**: 1.0.0
