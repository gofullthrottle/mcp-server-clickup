/**
 * Integration Tests: Bulk Operations
 *
 * Tests the bulk operation capabilities through MCP server:
 * - Bulk task creation
 * - Bulk task updates
 * - Bulk task deletion
 * - Bulk dependency operations
 * - Rate limiting behavior
 * - Performance validation
 *
 * These tests verify the server's ability to handle multiple operations
 * efficiently, which is critical for AI agents performing batch operations.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MCPTestClient, createMCPTestClient } from './mcp-test-client';
import { setupTestEnvironment, teardownTestEnvironment } from './setup';
import { createTask, createBulkTestData, uniqueTestName, delay } from './utils';

describe('Bulk Operations Integration Tests', () => {
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

  describe('Bulk Task Creation', () => {
    it('should create 10 tasks in sequence', async () => {
      const taskCount = 10;
      const startTime = Date.now();

      const tasks = [];
      for (let i = 1; i <= taskCount; i++) {
        const task = await createTask(client, listId, {
          name: uniqueTestName(`Bulk Create ${i}`),
          description: `Task ${i} of ${taskCount} in bulk creation test`
        });
        tasks.push(task);
        await delay(50); // Small delay for rate limiting
      }

      const endTime = Date.now();
      const duration = endTime - startTime;
      const avgTimePerTask = duration / taskCount;

      expect(tasks).toHaveLength(taskCount);
      console.log(`Created ${taskCount} tasks in ${duration}ms (${avgTimePerTask.toFixed(0)}ms per task)`);

      // Verify all tasks were created successfully
      for (const task of tasks) {
        expect(task.id).toBeDefined();
        expect(task.list.id).toBe(listId);
      }
    });

    it('should create 50 tasks with varied properties', async () => {
      const taskCount = 50;
      const startTime = Date.now();

      const tasks = await createBulkTestData(
        client,
        listId,
        taskCount,
        uniqueTestName('Bulk Varied')
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(tasks).toHaveLength(taskCount);
      console.log(`Created ${taskCount} varied tasks in ${duration}ms (${(duration/taskCount).toFixed(0)}ms per task)`);

      // Verify task diversity
      const priorities = new Set(tasks.map(t => t.priority?.id));
      const tags = new Set(tasks.flatMap(t => t.tags?.map((tag: any) => tag.name) || []));

      expect(priorities.size).toBeGreaterThan(1); // Multiple priorities used
      expect(tags.size).toBeGreaterThan(1); // Multiple tags used
    });

    it('should create 100 minimal tasks (performance test)', async () => {
      const taskCount = 100;
      const startTime = Date.now();

      const tasks = [];
      for (let i = 1; i <= taskCount; i++) {
        const task = await createTask(client, listId, {
          name: uniqueTestName(`Perf ${i}`)
        });
        tasks.push(task);

        // Small delay every 10 tasks to respect rate limits
        if (i % 10 === 0) {
          await delay(100);
        }
      }

      const endTime = Date.now();
      const duration = endTime - startTime;
      const avgTimePerTask = duration / taskCount;

      expect(tasks).toHaveLength(taskCount);
      console.log(`Created ${taskCount} minimal tasks in ${duration}ms (${avgTimePerTask.toFixed(0)}ms per task)`);

      // Performance assertion: should average less than 500ms per task
      expect(avgTimePerTask).toBeLessThan(500);
    });

    it('should handle concurrent task creation', async () => {
      const taskCount = 5;
      const taskNames = Array.from({ length: taskCount }, (_, i) =>
        uniqueTestName(`Concurrent ${i + 1}`)
      );

      const startTime = Date.now();

      // Create tasks concurrently using Promise.all
      const taskPromises = taskNames.map(name =>
        createTask(client, listId, { name })
      );

      const tasks = await Promise.all(taskPromises);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(tasks).toHaveLength(taskCount);
      console.log(`Created ${taskCount} tasks concurrently in ${duration}ms`);

      // Verify all tasks created successfully
      for (const task of tasks) {
        expect(task.id).toBeDefined();
        expect(taskNames).toContain(task.name);
      }
    });
  });

  describe('Bulk Task Updates', () => {
    let testTasks: any[] = [];

    beforeAll(async () => {
      // Create tasks for bulk update tests
      testTasks = await createBulkTestData(
        client,
        listId,
        20,
        uniqueTestName('Bulk Update')
      );
    });

    it('should update multiple tasks sequentially', async () => {
      const tasksToUpdate = testTasks.slice(0, 10);
      const startTime = Date.now();

      const updatedTasks = [];
      for (const task of tasksToUpdate) {
        const updated = await client.updateTask(task.id, {
          description: 'Updated via bulk update test',
          priority: 1 // Set to urgent
        });
        updatedTasks.push(updated);
        await delay(50);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(updatedTasks).toHaveLength(10);
      console.log(`Updated 10 tasks in ${duration}ms (${(duration/10).toFixed(0)}ms per task)`);

      // Verify updates
      for (const task of updatedTasks) {
        expect(task.description).toBe('Updated via bulk update test');
        expect(task.priority?.id).toBe('1');
      }
    });

    it('should update task statuses in bulk', async () => {
      const tasksToUpdate = testTasks.slice(10, 20);

      const updatedTasks = [];
      for (const task of tasksToUpdate) {
        const updated = await client.updateTask(task.id, {
          status: 'in progress'
        });
        updatedTasks.push(updated);
        await delay(50);
      }

      expect(updatedTasks).toHaveLength(10);

      // Verify status updates
      for (const task of updatedTasks) {
        expect(task.status).toBeDefined();
        expect(task.status.status.toLowerCase()).toMatch(/progress|in progress/);
      }
    });

    it('should add tags to multiple tasks', async () => {
      const tasksToUpdate = testTasks.slice(0, 5);
      const bulkTag = 'bulk-updated';

      for (const task of tasksToUpdate) {
        await client.updateTask(task.id, {
          tags: [bulkTag, 'integration-test']
        });
        await delay(50);
      }

      // Verify tags added
      for (const task of tasksToUpdate) {
        const updated = await client.getTask(task.id);
        const tagNames = updated.tags?.map((t: any) => t.name) || [];
        expect(tagNames).toContain(bulkTag);
      }
    });

    it('should update due dates for multiple tasks', async () => {
      const tasksToUpdate = testTasks.slice(0, 5);
      const futureDate = Date.now() + (7 * 86400000); // 7 days from now

      for (const task of tasksToUpdate) {
        await client.updateTask(task.id, {
          due_date: futureDate
        });
        await delay(50);
      }

      // Verify due dates
      for (const task of tasksToUpdate) {
        const updated = await client.getTask(task.id);
        expect(updated.due_date).toBeDefined();
      }
    });
  });

  describe('Bulk Task Deletion', () => {
    it('should delete multiple tasks sequentially', async () => {
      // Create tasks to delete
      const taskCount = 10;
      const tasks = await createBulkTestData(
        client,
        listId,
        taskCount,
        uniqueTestName('Bulk Delete')
      );

      expect(tasks).toHaveLength(taskCount);

      const startTime = Date.now();

      // Delete all tasks
      for (const task of tasks) {
        await client.deleteTask(task.id);
        await delay(50);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`Deleted ${taskCount} tasks in ${duration}ms (${(duration/taskCount).toFixed(0)}ms per task)`);

      // Verify deletion
      for (const task of tasks) {
        const result = await client.callTool('clickup_task_get', {
          task_id: task.id
        });
        expect(result.isError).toBe(true);
      }
    });

    it('should delete 50 tasks efficiently', async () => {
      // Create tasks to delete
      const taskCount = 50;
      const tasks = await createBulkTestData(
        client,
        listId,
        taskCount,
        uniqueTestName('Bulk Delete Large')
      );

      const startTime = Date.now();

      for (const task of tasks) {
        await client.deleteTask(task.id);

        // Delay every 10 deletions
        if (tasks.indexOf(task) % 10 === 9) {
          await delay(100);
        }
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`Deleted ${taskCount} tasks in ${duration}ms (${(duration/taskCount).toFixed(0)}ms per task)`);

      // Performance assertion
      expect(duration / taskCount).toBeLessThan(500);
    });
  });

  describe('Bulk Dependency Operations', () => {
    it('should create multiple dependencies in sequence', async () => {
      // Create a chain of 10 tasks with dependencies
      const taskCount = 10;
      const tasks = [];

      for (let i = 1; i <= taskCount; i++) {
        const task = await createTask(client, listId, {
          name: uniqueTestName(`Chain ${i}`)
        });
        tasks.push(task);
        await delay(50);
      }

      const startTime = Date.now();

      // Add dependencies (each task depends on previous)
      for (let i = 1; i < tasks.length; i++) {
        await client.addDependency(tasks[i].id, tasks[i - 1].id);
        await delay(50);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`Created ${taskCount - 1} dependencies in ${duration}ms`);

      // Verify dependency chain
      const lastTask = tasks[tasks.length - 1];
      const deps = await client.getDependencies(lastTask.id);
      expect(deps.depends_on?.length).toBeGreaterThan(0);
    });

    it('should create multiple parallel dependencies', async () => {
      // Create root task
      const root = await createTask(client, listId, {
        name: uniqueTestName('Bulk Dep Root')
      });

      // Create 10 tasks that all depend on root
      const dependentCount = 10;
      const dependents = [];

      for (let i = 1; i <= dependentCount; i++) {
        const task = await createTask(client, listId, {
          name: uniqueTestName(`Bulk Dep ${i}`)
        });
        dependents.push(task);
        await delay(50);
      }

      // Add dependencies
      for (const dependent of dependents) {
        await client.addDependency(dependent.id, root.id);
        await delay(50);
      }

      // Verify root blocks all dependents
      const rootDeps = await client.getDependencies(root.id);
      expect(rootDeps.dependency_of?.length).toBeGreaterThanOrEqual(dependentCount);
    });

    it('should remove multiple dependencies', async () => {
      // Create tasks with dependencies
      const task1 = await createTask(client, listId, {
        name: uniqueTestName('Remove Dep 1')
      });
      const task2 = await createTask(client, listId, {
        name: uniqueTestName('Remove Dep 2')
      });
      const task3 = await createTask(client, listId, {
        name: uniqueTestName('Remove Dep 3')
      });

      // Add dependencies
      await client.addDependency(task2.id, task1.id);
      await delay(50);
      await client.addDependency(task3.id, task1.id);
      await delay(50);

      // Verify dependencies exist
      const deps = await client.getDependencies(task1.id);
      const initialDependencyCount = deps.dependency_of?.length || 0;
      expect(initialDependencyCount).toBeGreaterThanOrEqual(2);

      // Remove dependencies
      await client.removeDependency(task2.id, task1.id);
      await delay(50);
      await client.removeDependency(task3.id, task1.id);
      await delay(50);

      // Verify dependencies removed
      const updatedDeps = await client.getDependencies(task1.id);
      expect(updatedDeps.dependency_of?.length || 0).toBe(0);
    });
  });

  describe('Rate Limiting Behavior', () => {
    it('should handle rapid sequential requests', async () => {
      const requestCount = 20;
      const startTime = Date.now();

      const tasks = [];
      for (let i = 1; i <= requestCount; i++) {
        const task = await createTask(client, listId, {
          name: uniqueTestName(`Rapid ${i}`)
        });
        tasks.push(task);
        // No delay - test rate limiting handling
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(tasks).toHaveLength(requestCount);
      console.log(`Created ${requestCount} rapid requests in ${duration}ms (${(duration/requestCount).toFixed(0)}ms per request)`);
    });

    it('should measure rate limit recovery time', async () => {
      // Perform burst of requests
      const burstSize = 10;
      const burstStartTime = Date.now();

      for (let i = 1; i <= burstSize; i++) {
        await createTask(client, listId, {
          name: uniqueTestName(`Burst ${i}`)
        });
      }

      const burstEndTime = Date.now();
      const burstDuration = burstEndTime - burstStartTime;

      console.log(`Burst of ${burstSize} requests took ${burstDuration}ms`);

      // Wait for rate limit recovery
      await delay(1000);

      // Perform another request
      const recoveryStartTime = Date.now();
      await createTask(client, listId, {
        name: uniqueTestName('Post-Burst')
      });
      const recoveryEndTime = Date.now();
      const recoveryDuration = recoveryEndTime - recoveryStartTime;

      console.log(`Post-burst request took ${recoveryDuration}ms`);
    });

    it('should track request timing distribution', async () => {
      const requestCount = 10;
      const timings: number[] = [];

      for (let i = 1; i <= requestCount; i++) {
        const startTime = Date.now();

        await createTask(client, listId, {
          name: uniqueTestName(`Timing ${i}`)
        });

        const duration = Date.now() - startTime;
        timings.push(duration);

        await delay(100); // Standard delay
      }

      // Calculate statistics
      const avgTime = timings.reduce((a, b) => a + b, 0) / timings.length;
      const minTime = Math.min(...timings);
      const maxTime = Math.max(...timings);

      console.log(`Request timing statistics:`);
      console.log(`  Average: ${avgTime.toFixed(0)}ms`);
      console.log(`  Min: ${minTime}ms`);
      console.log(`  Max: ${maxTime}ms`);

      expect(avgTime).toBeLessThan(1000); // Should average under 1 second
    });
  });

  describe('Performance Validation', () => {
    it('should measure task creation throughput', async () => {
      const taskCount = 30;
      const startTime = Date.now();

      const tasks = [];
      for (let i = 1; i <= taskCount; i++) {
        const task = await createTask(client, listId, {
          name: uniqueTestName(`Throughput ${i}`)
        });
        tasks.push(task);
        await delay(50);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;
      const throughput = (taskCount / duration) * 1000; // tasks per second

      expect(tasks).toHaveLength(taskCount);
      console.log(`Throughput: ${throughput.toFixed(2)} tasks/second`);
      console.log(`Total time: ${duration}ms for ${taskCount} tasks`);
    });

    it('should measure task retrieval performance', async () => {
      // Create tasks
      const taskCount = 10;
      const tasks = await createBulkTestData(
        client,
        listId,
        taskCount,
        uniqueTestName('Retrieval Perf')
      );

      const startTime = Date.now();

      // Retrieve all tasks
      for (const task of tasks) {
        await client.getTask(task.id);
        await delay(50);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;
      const avgTime = duration / taskCount;

      console.log(`Retrieved ${taskCount} tasks in ${duration}ms (${avgTime.toFixed(0)}ms per task)`);
      expect(avgTime).toBeLessThan(500);
    });

    it('should measure task update performance', async () => {
      // Create tasks
      const taskCount = 10;
      const tasks = await createBulkTestData(
        client,
        listId,
        taskCount,
        uniqueTestName('Update Perf')
      );

      const startTime = Date.now();

      // Update all tasks
      for (const task of tasks) {
        await client.updateTask(task.id, {
          description: 'Performance test update'
        });
        await delay(50);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;
      const avgTime = duration / taskCount;

      console.log(`Updated ${taskCount} tasks in ${duration}ms (${avgTime.toFixed(0)}ms per task)`);
      expect(avgTime).toBeLessThan(500);
    });

    it('should measure overall system responsiveness', async () => {
      // Perform mixed operations
      const operations = [
        { type: 'create', count: 5 },
        { type: 'read', count: 5 },
        { type: 'update', count: 5 },
        { type: 'delete', count: 5 }
      ];

      const startTime = Date.now();
      const createdTasks = [];

      // Create
      for (let i = 0; i < operations[0].count; i++) {
        const task = await createTask(client, listId, {
          name: uniqueTestName(`Mixed Ops ${i}`)
        });
        createdTasks.push(task);
        await delay(50);
      }

      // Read
      for (let i = 0; i < operations[1].count; i++) {
        await client.getTask(createdTasks[i].id);
        await delay(50);
      }

      // Update
      for (let i = 0; i < operations[2].count; i++) {
        await client.updateTask(createdTasks[i].id, {
          description: 'Mixed operation update'
        });
        await delay(50);
      }

      // Delete
      for (let i = 0; i < operations[3].count; i++) {
        await client.deleteTask(createdTasks[i].id);
        await delay(50);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;
      const totalOps = operations.reduce((sum, op) => sum + op.count, 0);
      const avgTime = duration / totalOps;

      console.log(`Performed ${totalOps} mixed operations in ${duration}ms (${avgTime.toFixed(0)}ms per operation)`);
      expect(avgTime).toBeLessThan(600);
    });
  });

  describe('Bulk Operation Edge Cases', () => {
    it('should handle creating tasks with duplicate names', async () => {
      const duplicateName = uniqueTestName('Duplicate Name');
      const taskCount = 5;

      const tasks = [];
      for (let i = 1; i <= taskCount; i++) {
        const task = await createTask(client, listId, {
          name: duplicateName // Same name for all
        });
        tasks.push(task);
        await delay(50);
      }

      expect(tasks).toHaveLength(taskCount);

      // Verify all tasks have unique IDs despite duplicate names
      const ids = tasks.map(t => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(taskCount);
    });

    it('should handle bulk operations with partial failures', async () => {
      // Create some valid tasks
      const validTasks = await createBulkTestData(
        client,
        listId,
        3,
        uniqueTestName('Valid')
      );

      // Attempt to update with mix of valid and invalid IDs
      const taskIds = [
        ...validTasks.map(t => t.id),
        'invalid_id_1',
        'invalid_id_2'
      ];

      const results = [];
      for (const taskId of taskIds) {
        const result = await client.callTool('clickup_task_update', {
          task_id: taskId,
          description: 'Bulk update attempt'
        });
        results.push({
          taskId,
          success: !result.isError
        });
        await delay(50);
      }

      // Verify: valid tasks updated, invalid tasks failed
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      expect(successCount).toBe(3); // Valid tasks
      expect(failureCount).toBe(2); // Invalid tasks
    });

    it('should maintain data consistency across bulk operations', async () => {
      // Create tasks with specific priorities
      const tasks = [];
      const priorities = [1, 2, 3, 4]; // urgent, high, normal, low

      for (const priority of priorities) {
        const task = await createTask(client, listId, {
          name: uniqueTestName(`Priority ${priority}`),
          priority
        });
        tasks.push(task);
        await delay(50);
      }

      // Retrieve and verify priorities maintained
      for (let i = 0; i < tasks.length; i++) {
        const retrieved = await client.getTask(tasks[i].id);
        expect(retrieved.priority?.id).toBe(priorities[i].toString());
      }
    });
  });
});
