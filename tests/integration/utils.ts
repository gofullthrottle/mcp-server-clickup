/**
 * Integration Test Utilities
 *
 * Helper functions for building complex test scenarios:
 * - Task creation with dependencies
 * - Dependency graphs (linear, parallel, diamond)
 * - Custom field configurations
 * - Comment threads
 * - Bulk operations
 *
 * Usage:
 *   import { createTaskChain, createDependencyDiamond } from './utils';
 *
 *   const tasks = await createTaskChain(client, listId, 5);
 *   const { taskA, taskB, taskC, taskD } = await createDependencyDiamond(client, listId);
 */

import { MCPTestClient } from './mcp-test-client';
import { trackTaskForCleanup } from './setup';

/**
 * Task creation options
 */
export interface TaskOptions {
  name: string;
  description?: string;
  status?: string;
  priority?: number;
  due_date?: string | number;
  assignees?: number[];
  tags?: string[];
  custom_fields?: Array<{
    id: string;
    value: any;
  }>;
}

/**
 * Create a single task and track for cleanup
 */
export async function createTask(
  client: MCPTestClient,
  listId: string,
  options: TaskOptions
): Promise<any> {
  const task = await client.createTask(listId, options);
  trackTaskForCleanup(task.id);
  return task;
}

/**
 * Create multiple tasks in parallel
 */
export async function createTasks(
  client: MCPTestClient,
  listId: string,
  tasks: TaskOptions[]
): Promise<any[]> {
  const results = await Promise.all(
    tasks.map(taskOpts => createTask(client, listId, taskOpts))
  );
  return results;
}

/**
 * Create a linear task chain with dependencies
 * Task 1 → Task 2 → Task 3 → ... → Task N
 *
 * Returns: Array of tasks in dependency order
 */
export async function createTaskChain(
  client: MCPTestClient,
  listId: string,
  count: number,
  namePrefix: string = 'Task'
): Promise<any[]> {
  const tasks: any[] = [];

  // Create all tasks first
  for (let i = 1; i <= count; i++) {
    const task = await createTask(client, listId, {
      name: `${namePrefix} ${i}`,
      description: `Task ${i} of ${count} in linear chain`
    });
    tasks.push(task);
  }

  // Add dependencies (each task depends on previous)
  for (let i = 1; i < tasks.length; i++) {
    await client.addDependency(
      tasks[i].id,
      tasks[i - 1].id, // depends_on previous task
      undefined
    );
  }

  return tasks;
}

/**
 * Create parallel wave of independent tasks
 * Used for testing concurrent execution
 *
 * Returns: Array of independent tasks
 */
export async function createParallelTasks(
  client: MCPTestClient,
  listId: string,
  count: number,
  namePrefix: string = 'Parallel Task'
): Promise<any[]> {
  const taskOptions: TaskOptions[] = [];

  for (let i = 1; i <= count; i++) {
    taskOptions.push({
      name: `${namePrefix} ${i}`,
      description: `Independent task ${i} of ${count}`
    });
  }

  return createTasks(client, listId, taskOptions);
}

/**
 * Create diamond dependency pattern
 *    A
 *   / \
 *  B   C
 *   \ /
 *    D
 *
 * Returns: { taskA, taskB, taskC, taskD }
 */
export async function createDependencyDiamond(
  client: MCPTestClient,
  listId: string
): Promise<{
  taskA: any;
  taskB: any;
  taskC: any;
  taskD: any;
}> {
  // Create all tasks
  const taskA = await createTask(client, listId, {
    name: 'Diamond Root',
    description: 'Root task of diamond dependency'
  });

  const taskB = await createTask(client, listId, {
    name: 'Diamond Left',
    description: 'Left branch of diamond'
  });

  const taskC = await createTask(client, listId, {
    name: 'Diamond Right',
    description: 'Right branch of diamond'
  });

  const taskD = await createTask(client, listId, {
    name: 'Diamond Leaf',
    description: 'Leaf task depending on both branches'
  });

  // B depends on A
  await client.addDependency(taskB.id, taskA.id);

  // C depends on A
  await client.addDependency(taskC.id, taskA.id);

  // D depends on B and C
  await client.addDependency(taskD.id, taskB.id);
  await client.addDependency(taskD.id, taskC.id);

  return { taskA, taskB, taskC, taskD };
}

/**
 * Create two-wave dependency pattern
 * Wave 1: A, B, C (parallel)
 * Wave 2: D, E (depend on Wave 1 completion)
 *
 * Returns: { wave1: [A, B, C], wave2: [D, E] }
 */
export async function createTwoWavePattern(
  client: MCPTestClient,
  listId: string
): Promise<{
  wave1: any[];
  wave2: any[];
}> {
  // Create Wave 1 (parallel)
  const wave1 = await createParallelTasks(client, listId, 3, 'Wave 1 Task');

  // Create Wave 2
  const wave2: any[] = [];

  for (let i = 1; i <= 2; i++) {
    const task = await createTask(client, listId, {
      name: `Wave 2 Task ${i}`,
      description: `Depends on Wave 1 completion`
    });

    // Make Wave 2 task depend on all Wave 1 tasks
    for (const wave1Task of wave1) {
      await client.addDependency(task.id, wave1Task.id);
    }

    wave2.push(task);
  }

  return { wave1, wave2 };
}

/**
 * Create parent task with subtasks
 */
export async function createTaskWithSubtasks(
  client: MCPTestClient,
  listId: string,
  parentName: string,
  subtaskNames: string[]
): Promise<{
  parent: any;
  subtasks: any[];
}> {
  // Create parent
  const parent = await createTask(client, listId, {
    name: parentName,
    description: 'Parent task with subtasks'
  });

  // Create subtasks
  const subtasks = await Promise.all(
    subtaskNames.map(name =>
      createTask(client, listId, {
        name,
        description: `Subtask of ${parentName}`,
        parent: parent.id
      })
    )
  );

  return { parent, subtasks };
}

/**
 * Create nested subtask hierarchy (3 levels)
 */
export async function createNestedSubtasks(
  client: MCPTestClient,
  listId: string
): Promise<{
  level1: any;
  level2: any[];
  level3: any[];
}> {
  // Level 1 (root)
  const level1 = await createTask(client, listId, {
    name: 'Level 1: Root Task',
    description: 'Top-level task'
  });

  // Level 2 (children of level1)
  const level2 = await Promise.all([
    createTask(client, listId, {
      name: 'Level 2: Subtask A',
      parent: level1.id
    }),
    createTask(client, listId, {
      name: 'Level 2: Subtask B',
      parent: level1.id
    })
  ]);

  // Level 3 (grandchildren)
  const level3 = await Promise.all([
    createTask(client, listId, {
      name: 'Level 3: Subtask A1',
      parent: level2[0].id
    }),
    createTask(client, listId, {
      name: 'Level 3: Subtask A2',
      parent: level2[0].id
    }),
    createTask(client, listId, {
      name: 'Level 3: Subtask B1',
      parent: level2[1].id
    })
  ]);

  return { level1, level2, level3 };
}

/**
 * Add threaded comments to a task
 */
export async function createCommentThread(
  client: MCPTestClient,
  taskId: string,
  comments: string[]
): Promise<any[]> {
  const results: any[] = [];

  for (const commentText of comments) {
    const comment = await client.addComment(taskId, commentText);
    results.push(comment);

    // Small delay to ensure order
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return results;
}

/**
 * Set multiple custom fields on a task
 */
export async function setCustomFields(
  client: MCPTestClient,
  taskId: string,
  fields: Array<{
    id: string;
    type: string;
    value: any;
  }>
): Promise<void> {
  for (const field of fields) {
    await client.setCustomField(
      taskId,
      field.id,
      field.value,
      field.type
    );
  }
}

/**
 * Wait for task status to change
 * Useful for testing blocking dependencies
 */
export async function waitForStatus(
  client: MCPTestClient,
  taskId: string,
  expectedStatus: string,
  timeout: number = 5000
): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const task = await client.getTask(taskId);

    if (task.status?.status === expectedStatus) {
      return true;
    }

    // Poll every 500ms
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return false;
}

/**
 * Verify dependency graph structure
 */
export async function verifyDependencyGraph(
  client: MCPTestClient,
  taskId: string,
  expected: {
    depends_on?: string[];
    dependency_of?: string[];
  }
): Promise<boolean> {
  const dependencies = await client.getDependencies(taskId);

  // Check depends_on
  if (expected.depends_on) {
    const actualDependsOn = dependencies.depends_on?.map((d: any) => d.id) || [];
    const expectedSet = new Set(expected.depends_on);
    const actualSet = new Set(actualDependsOn);

    if (expectedSet.size !== actualSet.size) {
      return false;
    }

    for (const id of expectedSet) {
      if (!actualSet.has(id)) {
        return false;
      }
    }
  }

  // Check dependency_of
  if (expected.dependency_of) {
    const actualDependencyOf = dependencies.dependency_of?.map((d: any) => d.id) || [];
    const expectedSet = new Set(expected.dependency_of);
    const actualSet = new Set(actualDependencyOf);

    if (expectedSet.size !== actualSet.size) {
      return false;
    }

    for (const id of expectedSet) {
      if (!actualSet.has(id)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Create bulk test data
 */
export async function createBulkTestData(
  client: MCPTestClient,
  listId: string,
  count: number,
  namePrefix: string = 'Bulk Task'
): Promise<any[]> {
  const tasks: TaskOptions[] = [];

  for (let i = 1; i <= count; i++) {
    tasks.push({
      name: `${namePrefix} ${i}`,
      description: `Bulk created task ${i} of ${count}`,
      priority: (i % 4) + 1, // Vary priorities 1-4
      tags: i % 2 === 0 ? ['even'] : ['odd']
    });
  }

  return createTasks(client, listId, tasks);
}

/**
 * Delay helper for rate limiting tests
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Random string generator for unique names
 */
export function randomString(length: number = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate unique test name with timestamp
 */
export function uniqueTestName(prefix: string): string {
  const timestamp = Date.now();
  const random = randomString(4);
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Assert task has expected properties
 */
export function assertTaskProperties(
  task: any,
  expected: Partial<{
    name: string;
    status: string;
    priority: number;
    description: string;
  }>
): void {
  if (expected.name && task.name !== expected.name) {
    throw new Error(`Expected task name "${expected.name}", got "${task.name}"`);
  }

  if (expected.status && task.status?.status !== expected.status) {
    throw new Error(
      `Expected task status "${expected.status}", got "${task.status?.status}"`
    );
  }

  if (expected.priority !== undefined && task.priority !== expected.priority) {
    throw new Error(
      `Expected task priority ${expected.priority}, got ${task.priority}`
    );
  }

  if (expected.description && task.description !== expected.description) {
    throw new Error(
      `Expected task description "${expected.description}", got "${task.description}"`
    );
  }
}

/**
 * Assert array has expected length
 */
export function assertArrayLength(
  arr: any[],
  expected: number,
  message?: string
): void {
  if (arr.length !== expected) {
    throw new Error(
      message ||
      `Expected array length ${expected}, got ${arr.length}`
    );
  }
}

/**
 * Assert value is truthy
 */
export function assert(condition: any, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}
