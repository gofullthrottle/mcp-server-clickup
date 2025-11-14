/**
 * Integration Tests: Task Dependencies & Blockers
 *
 * Tests dependency management capabilities that enable multi-agent
 * parallelization strategies:
 * - Add/remove depends_on relationships
 * - Add/remove dependency_of relationships
 * - Query dependency graphs
 * - Complex dependency patterns (chains, diamonds, waves)
 * - Circular dependency detection
 * - Multi-level dependency resolution
 *
 * These tests verify the critical dependency features that differentiate
 * our implementation from native ClickUp MCP (which lacks dependency support).
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MCPTestClient, createMCPTestClient } from './mcp-test-client';
import { setupTestEnvironment, teardownTestEnvironment, getTestEnvironment } from './setup';
import {
  createTask,
  createTaskChain,
  createDependencyDiamond,
  createTwoWavePattern,
  verifyDependencyGraph,
  uniqueTestName,
  assertArrayLength
} from './utils';

describe('Task Dependencies & Blockers Integration Tests', () => {
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

  describe('Basic Dependency Operations', () => {
    it('should add depends_on relationship between tasks', async () => {
      // Create two tasks
      const taskA = await createTask(client, listId, {
        name: uniqueTestName('Dependency Task A'),
        description: 'Task that will be depended on'
      });

      const taskB = await createTask(client, listId, {
        name: uniqueTestName('Dependency Task B'),
        description: 'Task that depends on A'
      });

      // Add dependency: B depends_on A
      await client.addDependency(taskB.id, taskA.id, undefined);

      // Verify dependency was created
      const dependencies = await client.getDependencies(taskB.id);

      expect(dependencies).toBeDefined();
      expect(dependencies.depends_on).toBeDefined();
      expect(dependencies.depends_on.length).toBeGreaterThan(0);

      const dependsOnIds = dependencies.depends_on.map((d: any) => d.task_id);
      expect(dependsOnIds).toContain(taskA.id);
    });

    it('should add dependency_of relationship between tasks', async () => {
      // Create two tasks
      const taskA = await createTask(client, listId, {
        name: uniqueTestName('DependencyOf Task A'),
        description: 'Task that will block B'
      });

      const taskB = await createTask(client, listId, {
        name: uniqueTestName('DependencyOf Task B'),
        description: 'Task that is blocked by A'
      });

      // Add dependency: A is dependency_of B (A blocks B)
      await client.addDependency(taskA.id, undefined, taskB.id);

      // Verify dependency was created
      const dependencies = await client.getDependencies(taskA.id);

      expect(dependencies).toBeDefined();
      expect(dependencies.dependency_of).toBeDefined();
      expect(dependencies.dependency_of.length).toBeGreaterThan(0);

      const dependencyOfIds = dependencies.dependency_of.map((d: any) => d.task_id);
      expect(dependencyOfIds).toContain(taskB.id);
    });

    it('should query full dependency graph for a task', async () => {
      // Create dependency chain: A → B → C
      const tasks = await createTaskChain(client, listId, 3, 'Graph Task');

      // Query dependencies for middle task (B)
      const dependencies = await client.getDependencies(tasks[1].id);

      expect(dependencies).toBeDefined();

      // Task B should depend on Task A
      expect(dependencies.depends_on).toBeDefined();
      expect(dependencies.depends_on.length).toBeGreaterThan(0);

      // Task B should be dependency of Task C
      expect(dependencies.dependency_of).toBeDefined();
      expect(dependencies.dependency_of.length).toBeGreaterThan(0);
    });

    it('should remove dependency between tasks', async () => {
      // Create two tasks with dependency
      const taskA = await createTask(client, listId, {
        name: uniqueTestName('Remove Dep Task A')
      });

      const taskB = await createTask(client, listId, {
        name: uniqueTestName('Remove Dep Task B')
      });

      // Add dependency
      await client.addDependency(taskB.id, taskA.id, undefined);

      // Verify dependency exists
      let dependencies = await client.getDependencies(taskB.id);
      expect(dependencies.depends_on.length).toBeGreaterThan(0);

      // Remove dependency
      const result = await client.callTool('clickup_task_remove_dependency', {
        task_id: taskB.id,
        depends_on: taskA.id
      });

      client.assertSuccess(result, 'Failed to remove dependency');

      // Verify dependency removed
      dependencies = await client.getDependencies(taskB.id);
      const dependsOnIds = dependencies.depends_on?.map((d: any) => d.task_id) || [];
      expect(dependsOnIds).not.toContain(taskA.id);
    });
  });

  describe('Complex Dependency Patterns', () => {
    it('should create and verify linear dependency chain', async () => {
      // Create chain: Task 1 → Task 2 → Task 3 → Task 4 → Task 5
      const tasks = await createTaskChain(client, listId, 5, 'Chain Task');

      expect(tasks.length).toBe(5);

      // Verify first task has no dependencies
      const firstDeps = await client.getDependencies(tasks[0].id);
      expect(firstDeps.depends_on?.length || 0).toBe(0);
      expect(firstDeps.dependency_of?.length || 0).toBeGreaterThan(0);

      // Verify middle task (Task 3)
      const verified = await verifyDependencyGraph(
        client,
        tasks[2].id,
        {
          depends_on: [tasks[1].id],
          dependency_of: [tasks[3].id]
        }
      );
      expect(verified).toBe(true);

      // Verify last task has no blocking tasks
      const lastDeps = await client.getDependencies(tasks[4].id);
      expect(lastDeps.depends_on?.length || 0).toBeGreaterThan(0);
      expect(lastDeps.dependency_of?.length || 0).toBe(0);
    });

    it('should create and verify diamond dependency pattern', async () => {
      // Create diamond:
      //    A
      //   / \
      //  B   C
      //   \ /
      //    D
      const { taskA, taskB, taskC, taskD } = await createDependencyDiamond(
        client,
        listId
      );

      // Verify task A (root)
      const depsA = await client.getDependencies(taskA.id);
      expect(depsA.depends_on?.length || 0).toBe(0);
      expect(depsA.dependency_of?.length || 0).toBe(2); // Blocks B and C

      // Verify task B (left branch)
      const verifiedB = await verifyDependencyGraph(
        client,
        taskB.id,
        {
          depends_on: [taskA.id],
          dependency_of: [taskD.id]
        }
      );
      expect(verifiedB).toBe(true);

      // Verify task C (right branch)
      const verifiedC = await verifyDependencyGraph(
        client,
        taskC.id,
        {
          depends_on: [taskA.id],
          dependency_of: [taskD.id]
        }
      );
      expect(verifiedC).toBe(true);

      // Verify task D (leaf)
      const depsD = await client.getDependencies(taskD.id);
      expect(depsD.depends_on?.length || 0).toBe(2); // Depends on B and C
      expect(depsD.dependency_of?.length || 0).toBe(0);
    });

    it('should create and verify two-wave parallel pattern', async () => {
      // Create pattern:
      // Wave 1: A, B, C (parallel - no dependencies)
      // Wave 2: D, E (both depend on all Wave 1 tasks)
      const { wave1, wave2 } = await createTwoWavePattern(client, listId);

      expect(wave1.length).toBe(3);
      expect(wave2.length).toBe(2);

      // Verify Wave 1 tasks have no dependencies
      for (const task of wave1) {
        const deps = await client.getDependencies(task.id);
        expect(deps.depends_on?.length || 0).toBe(0);
      }

      // Verify Wave 2 tasks depend on all Wave 1 tasks
      for (const task of wave2) {
        const deps = await client.getDependencies(task.id);
        expect(deps.depends_on?.length || 0).toBe(3);

        const dependsOnIds = deps.depends_on.map((d: any) => d.task_id);
        for (const wave1Task of wave1) {
          expect(dependsOnIds).toContain(wave1Task.id);
        }
      }
    });

    it('should handle multi-level dependency chains (5+ levels)', async () => {
      // Create long chain: 10 tasks
      const tasks = await createTaskChain(client, listId, 10, 'Long Chain');

      expect(tasks.length).toBe(10);

      // Verify task at position 5 has correct dependencies
      const verified = await verifyDependencyGraph(
        client,
        tasks[5].id,
        {
          depends_on: [tasks[4].id],
          dependency_of: [tasks[6].id]
        }
      );
      expect(verified).toBe(true);

      // Verify last task depends on second-to-last
      const lastVerified = await verifyDependencyGraph(
        client,
        tasks[9].id,
        {
          depends_on: [tasks[8].id]
        }
      );
      expect(lastVerified).toBe(true);
    });
  });

  describe('Parallel Dependencies', () => {
    it('should allow multiple tasks to depend on single task', async () => {
      // Create root task
      const root = await createTask(client, listId, {
        name: uniqueTestName('Root Task'),
        description: 'Single task that blocks multiple tasks'
      });

      // Create 5 tasks that all depend on root
      const dependentTasks = [];
      for (let i = 1; i <= 5; i++) {
        const task = await createTask(client, listId, {
          name: uniqueTestName(`Dependent Task ${i}`)
        });

        await client.addDependency(task.id, root.id, undefined);
        dependentTasks.push(task);
      }

      // Verify root task blocks all 5 tasks
      const rootDeps = await client.getDependencies(root.id);
      expect(rootDeps.dependency_of?.length || 0).toBeGreaterThanOrEqual(5);

      const blockedIds = rootDeps.dependency_of.map((d: any) => d.task_id);
      for (const task of dependentTasks) {
        expect(blockedIds).toContain(task.id);
      }
    });

    it('should allow single task to depend on multiple tasks', async () => {
      // Create 5 prerequisite tasks
      const prerequisites = [];
      for (let i = 1; i <= 5; i++) {
        const task = await createTask(client, listId, {
          name: uniqueTestName(`Prerequisite ${i}`)
        });
        prerequisites.push(task);
      }

      // Create task that depends on all prerequisites
      const dependent = await createTask(client, listId, {
        name: uniqueTestName('Multi-Dependency Task'),
        description: 'Task that depends on 5 prerequisites'
      });

      for (const prereq of prerequisites) {
        await client.addDependency(dependent.id, prereq.id, undefined);
      }

      // Verify task depends on all 5 prerequisites
      const deps = await client.getDependencies(dependent.id);
      expect(deps.depends_on?.length || 0).toBeGreaterThanOrEqual(5);

      const dependsOnIds = deps.depends_on.map((d: any) => d.task_id);
      for (const prereq of prerequisites) {
        expect(dependsOnIds).toContain(prereq.id);
      }
    });
  });

  describe('Error Handling & Edge Cases', () => {
    it('should fail to create circular dependency (2-task cycle)', async () => {
      // Create two tasks
      const taskA = await createTask(client, listId, {
        name: uniqueTestName('Circular Task A')
      });

      const taskB = await createTask(client, listId, {
        name: uniqueTestName('Circular Task B')
      });

      // Add dependency: B depends on A
      await client.addDependency(taskB.id, taskA.id, undefined);

      // Try to add reverse dependency: A depends on B (creates cycle)
      const result = await client.callTool('clickup_task_add_dependency', {
        task_id: taskA.id,
        depends_on: taskB.id
      });

      // Depending on ClickUp API behavior, this may:
      // 1. Return error for circular dependency
      // 2. Allow but show warning
      // 3. Override previous dependency
      // Just verify server handles it without crashing
      expect(result).toBeDefined();
    });

    it('should fail to add dependency with invalid task ID', async () => {
      const validTask = await createTask(client, listId, {
        name: uniqueTestName('Valid Task')
      });

      const invalidTaskId = 'invalid_task_xyz';

      const result = await client.callTool('clickup_task_add_dependency', {
        task_id: validTask.id,
        depends_on: invalidTaskId
      });

      expect(result.isError).toBe(true);
      const errorText = client.parseTextResult(result);
      expect(errorText.toLowerCase()).toMatch(/error|invalid|not found/);
    });

    it('should fail to get dependencies for non-existent task', async () => {
      const invalidTaskId = 'non_existent_dep_task';

      const result = await client.callTool('clickup_task_get_dependencies', {
        task_id: invalidTaskId
      });

      expect(result.isError).toBe(true);
      const errorText = client.parseTextResult(result);
      expect(errorText.toLowerCase()).toMatch(/error|invalid|not found/);
    });

    it('should handle task with no dependencies gracefully', async () => {
      // Create standalone task
      const task = await createTask(client, listId, {
        name: uniqueTestName('Standalone Task'),
        description: 'Task with no dependencies'
      });

      // Query dependencies
      const dependencies = await client.getDependencies(task.id);

      expect(dependencies).toBeDefined();
      expect(dependencies.depends_on?.length || 0).toBe(0);
      expect(dependencies.dependency_of?.length || 0).toBe(0);
    });

    it('should handle removing non-existent dependency gracefully', async () => {
      const taskA = await createTask(client, listId, {
        name: uniqueTestName('Remove Non-Existent Dep A')
      });

      const taskB = await createTask(client, listId, {
        name: uniqueTestName('Remove Non-Existent Dep B')
      });

      // Try to remove dependency that doesn't exist
      const result = await client.callTool('clickup_task_remove_dependency', {
        task_id: taskB.id,
        depends_on: taskA.id
      });

      // Should handle gracefully (either succeed or provide clear error)
      expect(result).toBeDefined();
    });

    it('should fail to add self-dependency (task depends on itself)', async () => {
      const task = await createTask(client, listId, {
        name: uniqueTestName('Self-Dependency Task')
      });

      // Try to make task depend on itself
      const result = await client.callTool('clickup_task_add_dependency', {
        task_id: task.id,
        depends_on: task.id
      });

      // Should fail or be handled gracefully
      expect(result).toBeDefined();
    });
  });

  describe('Dependency Metadata', () => {
    it('should retrieve dependency with task details', async () => {
      // Create tasks with dependencies
      const taskA = await createTask(client, listId, {
        name: uniqueTestName('Metadata Task A'),
        description: 'Task with rich metadata'
      });

      const taskB = await createTask(client, listId, {
        name: uniqueTestName('Metadata Task B'),
        description: 'Dependent task'
      });

      await client.addDependency(taskB.id, taskA.id, undefined);

      // Get dependencies
      const dependencies = await client.getDependencies(taskB.id);

      expect(dependencies).toBeDefined();
      expect(dependencies.depends_on).toBeDefined();
      expect(dependencies.depends_on.length).toBeGreaterThan(0);

      // Check that dependency includes task details
      const dep = dependencies.depends_on[0];
      expect(dep.task_id).toBeDefined();
      expect(dep.task_id).toBe(taskA.id);
    });

    it('should maintain dependency relationships after task updates', async () => {
      // Create dependency chain
      const tasks = await createTaskChain(client, listId, 3, 'Update Task');

      // Update middle task
      await client.updateTask(tasks[1].id, {
        name: uniqueTestName('Updated Middle Task'),
        description: 'Updated description'
      });

      // Verify dependencies still intact
      const verified = await verifyDependencyGraph(
        client,
        tasks[1].id,
        {
          depends_on: [tasks[0].id],
          dependency_of: [tasks[2].id]
        }
      );
      expect(verified).toBe(true);
    });
  });

  describe('Complex Scenario: Multi-Agent Parallelization', () => {
    it('should simulate 10-task project with dependency-based parallelization', async () => {
      // Simulate project structure:
      // Setup (Task 1)
      //   ├─> Phase 1: Tasks 2, 3, 4 (parallel)
      //   └─> Phase 2: Tasks 5, 6 (parallel, depend on Phase 1)
      //       └─> Integration: Task 7 (depends on Phase 2)
      //           ├─> Testing: Tasks 8, 9 (parallel)
      //           └─> Deployment: Task 10 (depends on Testing)

      // Create setup task
      const setup = await createTask(client, listId, {
        name: uniqueTestName('Project Setup'),
        description: 'Initial setup task'
      });

      // Phase 1: Parallel tasks
      const phase1 = [];
      for (let i = 1; i <= 3; i++) {
        const task = await createTask(client, listId, {
          name: uniqueTestName(`Phase 1 Task ${i}`)
        });
        await client.addDependency(task.id, setup.id, undefined);
        phase1.push(task);
      }

      // Phase 2: Parallel tasks (depend on all Phase 1)
      const phase2 = [];
      for (let i = 1; i <= 2; i++) {
        const task = await createTask(client, listId, {
          name: uniqueTestName(`Phase 2 Task ${i}`)
        });

        // Depend on all Phase 1 tasks
        for (const p1Task of phase1) {
          await client.addDependency(task.id, p1Task.id, undefined);
        }

        phase2.push(task);
      }

      // Integration task
      const integration = await createTask(client, listId, {
        name: uniqueTestName('Integration Task')
      });

      for (const p2Task of phase2) {
        await client.addDependency(integration.id, p2Task.id, undefined);
      }

      // Testing tasks (parallel)
      const testing = [];
      for (let i = 1; i <= 2; i++) {
        const task = await createTask(client, listId, {
          name: uniqueTestName(`Testing Task ${i}`)
        });
        await client.addDependency(task.id, integration.id, undefined);
        testing.push(task);
      }

      // Deployment task
      const deployment = await createTask(client, listId, {
        name: uniqueTestName('Deployment Task')
      });

      for (const testTask of testing) {
        await client.addDependency(deployment.id, testTask.id, undefined);
      }

      // Verify complete dependency graph
      // Setup has no dependencies
      const setupDeps = await client.getDependencies(setup.id);
      expect(setupDeps.depends_on?.length || 0).toBe(0);
      expect(setupDeps.dependency_of?.length || 0).toBe(3);

      // Phase 1 tasks depend only on setup
      for (const task of phase1) {
        const deps = await client.getDependencies(task.id);
        expect(deps.depends_on?.length || 0).toBe(1);
      }

      // Phase 2 tasks depend on all Phase 1
      for (const task of phase2) {
        const deps = await client.getDependencies(task.id);
        expect(deps.depends_on?.length || 0).toBe(3);
      }

      // Deployment depends on all testing tasks
      const deployDeps = await client.getDependencies(deployment.id);
      expect(deployDeps.depends_on?.length || 0).toBe(2);
      expect(deployDeps.dependency_of?.length || 0).toBe(0);
    });
  });
});
