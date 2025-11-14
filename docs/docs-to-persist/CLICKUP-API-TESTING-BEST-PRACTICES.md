# ClickUp API Testing Best Practices

## Purpose

This document provides ClickUp-specific testing guidance based on real-world integration experience with the ClickUp API v2. Use these practices when building MCP servers or applications that integrate with ClickUp.

## ClickUp API Overview

**Base URL**: `https://api.clickup.com/api/v2`

**Key Concepts**:
- **Workspace (Team)**: Top-level organization container
- **Space**: Major project grouping within a workspace
- **Folder**: Optional organizational layer within spaces
- **List**: Container for tasks
- **Task**: Core work item with rich metadata
- **Custom Fields**: User-defined task properties
- **Dependencies**: Blocking/waiting relationships between tasks
- **Subtasks**: Hierarchical parent-child task relationships

## Authentication Testing

### API Key Authentication

```typescript
// Environment setup
const apiKey = process.env.CLICKUP_API_KEY;
const teamId = process.env.CLICKUP_TEAM_ID;

// Test API key validation
it('should authenticate with valid API key', async () => {
  const response = await fetch('https://api.clickup.com/api/v2/team', {
    headers: {
      'Authorization': apiKey,
      'Content-Type': 'application/json'
    }
  });

  expect(response.status).toBe(200);
});

// Test invalid API key handling
it('should reject invalid API key', async () => {
  const response = await fetch('https://api.clickup.com/api/v2/team', {
    headers: {
      'Authorization': 'invalid_key',
      'Content-Type': 'application/json'
    }
  });

  expect(response.status).toBe(401);
});
```

### OAuth 2.0 Testing

```typescript
// Document OAuth flow (not executable in tests)
it('should document OAuth 2.0 flow', () => {
  console.log('OAuth Flow:');
  console.log('1. Redirect to: https://app.clickup.com/api?client_id=XXX');
  console.log('2. User authorizes application');
  console.log('3. Callback receives authorization code');
  console.log('4. Exchange code for access token');
  console.log('5. Use access token for API requests');
});
```

## Rate Limiting

### Official Rate Limits (2024)

- **Free/Unlimited Plans**: 100 requests per minute
- **Business Plans**: 100 requests per minute
- **Enterprise Plans**: Custom limits (typically 10,000+ per minute)

### Rate Limit Testing

```typescript
class RateLimiter {
  private lastRequest: number = 0;
  private readonly minDelay: number = 100; // 100ms between requests

  async throttle(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequest;

    if (elapsed < this.minDelay) {
      await new Promise(resolve =>
        setTimeout(resolve, this.minDelay - elapsed)
      );
    }

    this.lastRequest = Date.now();
  }
}

// Test rate limiting
it('should respect rate limits', async () => {
  const rateLimiter = new RateLimiter();
  const requests = 50;
  const startTime = Date.now();

  for (let i = 0; i < requests; i++) {
    await rateLimiter.throttle();
    await client.callTool('clickup_task_get', { task_id: testTaskId });
  }

  const duration = Date.now() - startTime;
  const requestsPerSecond = (requests / duration) * 1000;

  console.log(`Rate: ${requestsPerSecond.toFixed(2)} requests/second`);
  expect(requestsPerSecond).toBeLessThan(100); // Stay under API limit
});
```

### Rate Limit Response Headers

```typescript
// Monitor rate limit headers
const response = await fetch(url, options);

const rateLimitInfo = {
  limit: response.headers.get('X-RateLimit-Limit'),
  remaining: response.headers.get('X-RateLimit-Remaining'),
  reset: response.headers.get('X-RateLimit-Reset')
};

console.log('Rate Limit Status:', rateLimitInfo);
```

## Workspace Hierarchy Testing

### Hierarchy Structure

```
Workspace (Team)
└── Space
    └── Folder (Optional)
        └── List
            └── Task
                └── Subtask
                    └── Nested Subtask
```

### Testing Hierarchy

```typescript
it('should retrieve complete workspace hierarchy', async () => {
  const result = await client.callTool('clickup_workspace_hierarchy_get', {});

  const hierarchy = client.parseJsonResult(result);

  expect(hierarchy.teams).toBeDefined();
  expect(Array.isArray(hierarchy.teams)).toBe(true);

  const team = hierarchy.teams[0];
  expect(team.spaces).toBeDefined();

  const space = team.spaces[0];
  expect(space.lists || space.folders).toBeDefined();

  console.log(`Workspace contains ${team.spaces.length} spaces`);
});

it('should validate list belongs to workspace', async () => {
  const env = await getTestEnvironment();

  const hierarchy = await client.callTool('clickup_workspace_hierarchy_get', {});
  const workspaceData = client.parseJsonResult(hierarchy);

  // Find list in hierarchy
  let listFound = false;
  for (const team of workspaceData.teams) {
    for (const space of team.spaces) {
      const lists = space.lists || [];
      if (lists.some(l => l.id === env.listId)) {
        listFound = true;
        break;
      }
    }
  }

  expect(listFound).toBe(true);
});
```

## Task Testing Patterns

### Task Creation

```typescript
it('should create task with minimal required fields', async () => {
  const result = await client.callTool('clickup_task_create', {
    list_id: listId,
    name: 'Minimal Task'
  });

  expect(result.isError).toBe(false);
  const task = client.parseJsonResult(result);

  expect(task.id).toBeDefined();
  expect(task.name).toBe('Minimal Task');
  expect(task.status).toBeDefined();
  expect(task.list.id).toBe(listId);
});

it('should create task with full details', async () => {
  const dueDate = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

  const result = await client.callTool('clickup_task_create', {
    list_id: listId,
    name: 'Full Details Task',
    description: 'Complete description',
    priority: 2, // High priority
    due_date: dueDate,
    status: 'in progress'
  });

  expect(result.isError).toBe(false);
  const task = client.parseJsonResult(result);

  expect(task.description).toBe('Complete description');
  expect(task.priority).toBeDefined();
  expect(task.status.status).toBe('in progress');
});
```

### Task Status Values

ClickUp has different status values per list configuration:

```typescript
// Common default statuses
const DEFAULT_STATUSES = [
  'to do',
  'in progress',
  'complete',
  'closed'
];

// Test status transitions
it('should handle valid status transitions', async () => {
  const task = await createTask(client, listId, {
    name: uniqueTestName('Status Test')
  });

  const statuses = ['to do', 'in progress', 'complete'];

  for (const status of statuses) {
    const updated = await client.updateTask(task.id, { status });
    expect(updated.status.status).toBe(status);
    await delay(100);
  }
});
```

### Task Priority Values

```typescript
// ClickUp priority mapping
const PRIORITY_VALUES = {
  URGENT: 1,
  HIGH: 2,
  NORMAL: 3,
  LOW: 4
};

it('should set task priority', async () => {
  const task = await createTask(client, listId, {
    name: uniqueTestName('Priority Test'),
    priority: PRIORITY_VALUES.HIGH
  });

  expect(task.priority).toBeDefined();
  expect(task.priority.id).toBe('2');
});
```

## Subtask Hierarchy

### Creating Subtasks

```typescript
it('should create nested subtask hierarchy', async () => {
  // Level 1: Parent
  const parent = await createTask(client, listId, {
    name: uniqueTestName('Parent')
  });

  // Level 2: Child
  const child = await createTask(client, listId, {
    name: uniqueTestName('Child'),
    parent: parent.id
  });

  expect(child.parent).toBe(parent.id);

  // Level 3: Grandchild
  const grandchild = await createTask(client, listId, {
    name: uniqueTestName('Grandchild'),
    parent: child.id
  });

  expect(grandchild.parent).toBe(child.id);

  console.log('Created 3-level hierarchy: Parent → Child → Grandchild');
});
```

### Subtask Limitations

```typescript
// Note: ClickUp API has limits on nesting depth
it('should document subtask depth limitations', () => {
  console.log('ClickUp Subtask Limits:');
  console.log('- Maximum nesting depth: Varies by plan');
  console.log('- Free plans: Typically 5 levels');
  console.log('- Business plans: Typically 10 levels');
  console.log('- Subtasks inherit list from parent');
});
```

## Dependency Testing

### Dependency Types

```typescript
const DEPENDENCY_TYPES = {
  WAITING_ON: 'waiting_on',    // This task waits for another
  BLOCKING: 'blocking'          // This task blocks another
};

it('should create dependency relationship', async () => {
  const taskA = await createTask(client, listId, {
    name: uniqueTestName('Task A')
  });

  const taskB = await createTask(client, listId, {
    name: uniqueTestName('Task B')
  });

  // B waits for A to complete
  await client.callTool('clickup_task_add_dependency', {
    task_id: taskB.id,
    depends_on: taskA.id,
    dependency_type: 'waiting_on'
  });

  console.log('Dependency: Task B waits for Task A');
});
```

### Circular Dependency Prevention

```typescript
it('should prevent circular dependencies', async () => {
  const taskA = await createTask(client, listId, {
    name: uniqueTestName('Circular A')
  });

  const taskB = await createTask(client, listId, {
    name: uniqueTestName('Circular B')
  });

  // Create: A → B
  await client.callTool('clickup_task_add_dependency', {
    task_id: taskB.id,
    depends_on: taskA.id,
    dependency_type: 'waiting_on'
  });

  // Attempt to create circular: B → A (should fail)
  const circularResult = await client.callTool('clickup_task_add_dependency', {
    task_id: taskA.id,
    depends_on: taskB.id,
    dependency_type: 'waiting_on'
  });

  expect(circularResult.isError).toBe(true);
  console.log('✅ Circular dependency prevented by API');
});
```

## Custom Fields Testing

### Custom Field Types

```typescript
const CUSTOM_FIELD_TYPES = [
  'text',           // Short text
  'textarea',       // Long text
  'number',         // Numeric value
  'currency',       // Money value
  'date',           // Date picker
  'dropdown',       // Single select
  'labels',         // Multi-select
  'checkbox',       // Boolean
  'url',            // URL field
  'email',          // Email field
  'phone',          // Phone number
  'emoji',          // Emoji rating
  'location'        // Location field
];

it('should set text custom field', async () => {
  // Note: Custom field must exist in list
  const task = await createTask(client, listId, {
    name: uniqueTestName('Custom Field Test')
  });

  // Set custom field value
  const result = await client.callTool('clickup_task_set_custom_field', {
    task_id: task.id,
    field_id: 'custom_field_id', // Must be actual field ID
    value: 'Custom value'
  });

  expect(!result.isError).toBe(true);
});
```

## Comments and Annotations

### Comment Structure

```typescript
it('should create comment with formatting', async () => {
  const task = await createTask(client, listId, {
    name: uniqueTestName('Comment Test')
  });

  const comment = await client.addComment(
    task.id,
    '**Bold text** and *italic text* with [links](https://example.com)'
  );

  expect(comment.id).toBeDefined();
  expect(comment.comment_text).toContain('Bold text');
});

it('should create threaded comment', async () => {
  const task = await createTask(client, listId, {
    name: uniqueTestName('Thread Test')
  });

  const parentComment = await client.addComment(
    task.id,
    'Parent comment'
  );

  const replyComment = await client.callTool('clickup_comment_create', {
    task_id: task.id,
    comment_text: 'Reply comment',
    parent_id: parentComment.id
  });

  expect(!replyComment.isError).toBe(true);
});
```

## Tags and Labels

### Tag Operations

```typescript
it('should add and remove tags', async () => {
  const task = await createTask(client, listId, {
    name: uniqueTestName('Tag Test')
  });

  // Add tags
  await client.callTool('clickup_task_add_tag', {
    task_id: task.id,
    tag_name: 'urgent'
  });

  await client.callTool('clickup_task_add_tag', {
    task_id: task.id,
    tag_name: 'backend'
  });

  await delay(100);

  // Verify tags
  const taggedTask = await client.getTask(task.id);
  expect(taggedTask.tags.length).toBeGreaterThanOrEqual(2);

  // Remove tag
  await client.callTool('clickup_task_remove_tag', {
    task_id: task.id,
    tag_name: 'urgent'
  });

  await delay(100);

  const finalTask = await client.getTask(task.id);
  expect(finalTask.tags.length).toBe(taggedTask.tags.length - 1);
});
```

## Search and Filtering

### Task Search

```typescript
it('should search tasks by name', async () => {
  const uniqueName = uniqueTestName('Searchable');

  const task = await createTask(client, listId, {
    name: uniqueName
  });

  await delay(1000); // Allow search index to update

  const result = await client.callTool('clickup_task_search', {
    team_id: teamId,
    query: uniqueName
  });

  const tasks = client.parseJsonResult(result);
  const found = tasks.tasks.some(t => t.id === task.id);

  expect(found).toBe(true);
});
```

## Bulk Operations Best Practices

### Batch Size Recommendations

```typescript
// Recommended batch sizes for ClickUp API
const BATCH_SIZES = {
  TASK_CREATION: 10,      // Create max 10 tasks at once
  TASK_UPDATES: 20,       // Update max 20 tasks at once
  TAG_OPERATIONS: 50,     // Tag operations can be larger
  COMMENTS: 10            // Comment creation batch size
};

it('should create tasks in optimal batches', async () => {
  const totalTasks = 50;
  const batchSize = BATCH_SIZES.TASK_CREATION;

  const allTasks = [];
  for (let i = 0; i < totalTasks; i += batchSize) {
    const batch = await Promise.all(
      Array.from(
        { length: Math.min(batchSize, totalTasks - i) },
        (_, j) =>
          createTask(client, listId, {
            name: uniqueTestName(`Batch ${i + j + 1}`)
          })
      )
    );

    allTasks.push(...batch);
    await delay(100); // Delay between batches
  }

  expect(allTasks).toHaveLength(totalTasks);
  console.log(`Created ${totalTasks} tasks in ${totalTasks / batchSize} batches`);
});
```

## Error Handling Patterns

### Common ClickUp Errors

```typescript
// Error code mapping
const CLICKUP_ERRORS = {
  INVALID_AUTH: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  RATE_LIMITED: 429,
  SERVER_ERROR: 500
};

it('should handle common error scenarios', async () => {
  // Invalid task ID
  const notFoundResult = await client.callTool('clickup_task_get', {
    task_id: 'invalid_id_12345'
  });

  expect(notFoundResult.isError).toBe(true);
  const errorMessage = client.parseTextResult(notFoundResult);
  expect(errorMessage.toLowerCase()).toMatch(/not found|error/);
});
```

## Performance Optimization

### Response Time Expectations

```typescript
// Expected response times for ClickUp API
const PERFORMANCE_BENCHMARKS = {
  TASK_GET: 200,          // Get single task: 200ms
  TASK_CREATE: 500,       // Create task: 500ms
  TASK_UPDATE: 300,       // Update task: 300ms
  TASK_SEARCH: 1000,      // Search tasks: 1s
  HIERARCHY_GET: 2000     // Get hierarchy: 2s
};

it('should meet performance benchmarks', async () => {
  const task = await createTask(client, listId, {
    name: uniqueTestName('Perf Test')
  });

  const startTime = Date.now();
  await client.getTask(task.id);
  const duration = Date.now() - startTime;

  expect(duration).toBeLessThan(PERFORMANCE_BENCHMARKS.TASK_GET);
  console.log(`Task retrieval: ${duration}ms`);
});
```

## Testing Checklist

### Essential Tests

- [ ] API key authentication works
- [ ] Workspace hierarchy retrieval works
- [ ] Task CRUD operations work
- [ ] Subtask creation and hierarchy work
- [ ] Dependencies (waiting_on, blocking) work
- [ ] Custom fields can be set
- [ ] Comments can be added
- [ ] Tags can be added/removed
- [ ] Search finds tasks correctly
- [ ] Rate limiting is respected
- [ ] Error handling works for all failure modes
- [ ] Bulk operations work efficiently
- [ ] Cleanup removes all test resources

### ClickUp-Specific Tests

- [ ] Task status transitions work
- [ ] Priority values work correctly
- [ ] Due dates can be set and updated
- [ ] Assignees can be added (if user IDs available)
- [ ] Time tracking works (if enabled)
- [ ] Checklists work (if needed)
- [ ] Attachments work (if needed)
- [ ] Webhooks trigger correctly (if using)

## Common Gotchas

### 1. Eventual Consistency

ClickUp's search index is eventually consistent:

```typescript
// BAD - search immediately after creation
const task = await createTask(client, listId, { name: 'New Task' });
const searchResult = await client.searchTasks('New Task'); // May not find it

// GOOD - wait for indexing
const task = await createTask(client, listId, { name: 'New Task' });
await delay(1000); // Wait for search index
const searchResult = await client.searchTasks('New Task'); // Now finds it
```

### 2. Status Values are List-Specific

Status values vary per list configuration:

```typescript
// BAD - assume status exists
await client.updateTask(taskId, { status: 'done' }); // May not exist

// GOOD - use common statuses or verify first
await client.updateTask(taskId, { status: 'complete' }); // More common
```

### 3. Custom Fields Require Pre-Creation

Custom fields must exist in the list before use:

```typescript
// BAD - try to set non-existent custom field
await client.setCustomField(taskId, 'field_123', 'value'); // Fails

// GOOD - verify custom field exists or create it first
const listFields = await client.getListCustomFields(listId);
const field = listFields.find(f => f.name === 'My Field');
if (field) {
  await client.setCustomField(taskId, field.id, 'value');
}
```

### 4. Deleted Tasks Cannot Be Retrieved

Once deleted, tasks are gone:

```typescript
// BAD - assume deleted task still accessible
await client.deleteTask(taskId);
const task = await client.getTask(taskId); // Throws error

// GOOD - verify task exists before operating on it
const taskResult = await client.callTool('clickup_task_get', {
  task_id: taskId
});

if (!taskResult.isError) {
  // Task exists, can operate on it
}
```

## References

- **ClickUp API v2 Documentation**: https://clickup.com/api
- **ClickUp API Rate Limits**: https://clickup.com/api/#rate-limits
- **ClickUp OAuth Guide**: https://clickup.com/api/#oauth-flow
- **ClickUp Webhooks**: https://clickup.com/api/#webhooks

---

**Last Updated**: 2025-01-01
**ClickUp API Version**: v2
**Tested Against**: ClickUp API v2 (2024)
