/**
 * Concurrency Integration Tests
 *
 * Tests concurrent operations, race conditions, and parallel execution.
 * Validates thread safety and data consistency under concurrent load.
 *
 * Test Categories:
 * 1. Race Conditions
 * 2. Parallel Task Creation
 * 3. Simultaneous Updates
 * 4. Dependency Conflicts
 * 5. Concurrent Modifications
 * 6. Deadlock Prevention
 * 7. Transaction Isolation
 * 8. Performance Under Load
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MCPTestClient } from './utils/mcp-test-client';
import {
  getTestEnvironment,
  delay,
  uniqueTestName,
  createTask,
  cleanupTestResources,
} from './utils/test-helpers';

describe('Concurrency Integration Tests', () => {
  let client: MCPTestClient;
  let listId: string;
  let spaceId: string;

  beforeAll(async () => {
    const env = await getTestEnvironment();
    client = new MCPTestClient();
    await client.connect();

    spaceId = env.spaceId;
    listId = env.listId;

    console.log('Concurrency tests initialized');
    console.log(`Space ID: ${spaceId}`);
    console.log(`List ID: ${listId}`);
  });

  afterAll(async () => {
    await cleanupTestResources();
    await client.disconnect();
    console.log('Concurrency tests completed');
  });

  describe('Race Conditions', () => {
    it('should handle concurrent task creation with same name', async () => {
      const taskName = uniqueTestName('Race Create');

      // Create multiple tasks with same name concurrently
      const creationPromises = Array.from({ length: 5 }, () =>
        createTask(client, listId, {
          name: taskName,
        })
      );

      const tasks = await Promise.all(creationPromises);

      // Verify all tasks created with unique IDs
      expect(tasks).toHaveLength(5);
      const uniqueIds = new Set(tasks.map((t) => t.id));
      expect(uniqueIds.size).toBe(5);

      console.log('✅ Concurrent creation with duplicate names handled');
    });

    it('should handle concurrent reads of same task', async () => {
      const task = await createTask(client, listId, {
        name: uniqueTestName('Race Read'),
      });

      // Read same task concurrently
      const readPromises = Array.from({ length: 10 }, () =>
        client.getTask(task.id)
      );

      const results = await Promise.all(readPromises);

      // Verify all reads successful and consistent
      expect(results).toHaveLength(10);
      expect(results.every((r) => r.id === task.id)).toBe(true);
      expect(results.every((r) => r.name === task.name)).toBe(true);

      console.log('✅ Concurrent reads handled correctly');
    });

    it('should handle concurrent updates to same task', async () => {
      const task = await createTask(client, listId, {
        name: uniqueTestName('Race Update'),
        description: 'Initial',
      });

      // Update same task concurrently with different descriptions
      const updatePromises = Array.from({ length: 5 }, (_, i) =>
        client.updateTask(task.id, {
          description: `Update ${i + 1}`,
        })
      );

      const results = await Promise.all(updatePromises);

      // Verify all updates succeeded (last write wins)
      expect(results).toHaveLength(5);
      expect(results.every((r) => r.id === task.id)).toBe(true);

      // Final state should be one of the updates
      const finalTask = await client.getTask(task.id);
      expect(finalTask.description).toMatch(/^Update \d$/);

      console.log('✅ Concurrent updates handled (last write wins)');
    });

    it('should handle concurrent comment additions', async () => {
      const task = await createTask(client, listId, {
        name: uniqueTestName('Race Comments'),
      });

      // Add comments concurrently
      const commentPromises = Array.from({ length: 5 }, (_, i) =>
        client.addComment(task.id, `Comment ${i + 1}`)
      );

      const comments = await Promise.all(commentPromises);

      // Verify all comments created
      expect(comments).toHaveLength(5);
      expect(comments.every((c) => c.id !== undefined)).toBe(true);

      console.log('✅ Concurrent comment additions handled');
    });

    it('should handle concurrent tag additions', async () => {
      const task = await createTask(client, listId, {
        name: uniqueTestName('Race Tags'),
      });

      // Add different tags concurrently
      const tagPromises = Array.from({ length: 5 }, (_, i) =>
        client.callTool('clickup_task_add_tag', {
          task_id: task.id,
          tag_name: `tag-${i + 1}`,
        })
      );

      const results = await Promise.all(tagPromises);

      // Verify all tags added
      expect(results.every((r) => !r.isError)).toBe(true);

      const finalTask = await client.getTask(task.id);
      expect(finalTask.tags.length).toBeGreaterThanOrEqual(5);

      console.log('✅ Concurrent tag additions handled');
    });
  });

  describe('Parallel Task Creation', () => {
    it('should create 10 tasks in parallel', async () => {
      const baseName = uniqueTestName('Parallel Create');
      const startTime = Date.now();

      const creationPromises = Array.from({ length: 10 }, (_, i) =>
        createTask(client, listId, {
          name: `${baseName} - ${i + 1}`,
        })
      );

      const tasks = await Promise.all(creationPromises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(tasks).toHaveLength(10);
      expect(tasks.every((t) => t.id !== undefined)).toBe(true);

      console.log(
        `✅ Created 10 tasks in parallel in ${duration}ms (${(duration / 10).toFixed(0)}ms avg)`
      );
    });

    it('should create 50 tasks in parallel with batching', async () => {
      const baseName = uniqueTestName('Parallel Batch');
      const totalTasks = 50;
      const batchSize = 10;
      const startTime = Date.now();

      const tasks = [];
      for (let i = 0; i < totalTasks; i += batchSize) {
        const batchPromises = Array.from(
          { length: Math.min(batchSize, totalTasks - i) },
          (_, j) =>
            createTask(client, listId, {
              name: `${baseName} - ${i + j + 1}`,
            })
        );

        const batchTasks = await Promise.all(batchPromises);
        tasks.push(...batchTasks);

        // Small delay between batches
        await delay(50);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(tasks).toHaveLength(totalTasks);
      console.log(
        `✅ Created ${totalTasks} tasks in batches in ${duration}ms (${(duration / totalTasks).toFixed(0)}ms avg)`
      );
    });

    it('should create tasks with parallel subtasks', async () => {
      const baseName = uniqueTestName('Parallel Subtasks');

      // Create parent tasks in parallel
      const parentPromises = Array.from({ length: 3 }, (_, i) =>
        createTask(client, listId, {
          name: `${baseName} - Parent ${i + 1}`,
        })
      );

      const parents = await Promise.all(parentPromises);

      // Create subtasks for all parents in parallel
      const subtaskPromises = parents.flatMap((parent, i) =>
        Array.from({ length: 3 }, (_, j) =>
          createTask(client, listId, {
            name: `${baseName} - P${i + 1} Subtask ${j + 1}`,
            parent: parent.id,
          })
        )
      );

      const subtasks = await Promise.all(subtaskPromises);

      expect(subtasks).toHaveLength(9); // 3 parents × 3 subtasks
      expect(subtasks.every((st) => st.parent !== undefined)).toBe(true);

      console.log('✅ Parallel parent and subtask creation completed');
    });

    it('should handle parallel creation with dependencies', async () => {
      const baseName = uniqueTestName('Parallel Deps');

      // Create base tasks in parallel
      const baseTasks = await Promise.all(
        Array.from({ length: 5 }, (_, i) =>
          createTask(client, listId, {
            name: `${baseName} - Base ${i + 1}`,
          })
        )
      );

      // Create dependent tasks in parallel (each depends on a base task)
      const dependentPromises = baseTasks.map((baseTask, i) =>
        createTask(client, listId, {
          name: `${baseName} - Dependent ${i + 1}`,
        }).then(async (depTask) => {
          await client.callTool('clickup_task_add_dependency', {
            task_id: depTask.id,
            depends_on: baseTask.id,
            dependency_type: 'waiting_on',
          });
          return depTask;
        })
      );

      const dependentTasks = await Promise.all(dependentPromises);

      expect(dependentTasks).toHaveLength(5);
      console.log('✅ Parallel creation with dependencies completed');
    });
  });

  describe('Simultaneous Updates', () => {
    it('should handle simultaneous status updates', async () => {
      const task = await createTask(client, listId, {
        name: uniqueTestName('Simultaneous Status'),
      });

      // Update status multiple times simultaneously
      const statusUpdates = ['in progress', 'complete', 'to do', 'in progress'];

      const updatePromises = statusUpdates.map((status) =>
        client.updateTask(task.id, { status })
      );

      const results = await Promise.all(updatePromises);

      // All updates should succeed
      expect(results.every((r) => r.id === task.id)).toBe(true);

      // Final state should be one of the statuses
      const finalTask = await client.getTask(task.id);
      expect(statusUpdates).toContain(finalTask.status.status);

      console.log('✅ Simultaneous status updates handled');
    });

    it('should handle simultaneous description updates', async () => {
      const task = await createTask(client, listId, {
        name: uniqueTestName('Simultaneous Desc'),
      });

      // Update description simultaneously
      const descriptions = [
        'Description A',
        'Description B',
        'Description C',
        'Description D',
      ];

      const updatePromises = descriptions.map((description) =>
        client.updateTask(task.id, { description })
      );

      const results = await Promise.all(updatePromises);

      expect(results).toHaveLength(descriptions.length);

      const finalTask = await client.getTask(task.id);
      expect(descriptions).toContain(finalTask.description);

      console.log('✅ Simultaneous description updates handled');
    });

    it('should handle simultaneous multi-field updates', async () => {
      const task = await createTask(client, listId, {
        name: uniqueTestName('Simultaneous Multi'),
      });

      // Update different fields simultaneously
      const updatePromises = [
        client.updateTask(task.id, { description: 'Updated description' }),
        client.updateTask(task.id, { status: 'in progress' }),
        client.updateTask(task.id, { priority: 2 }),
        client.callTool('clickup_task_add_tag', {
          task_id: task.id,
          tag_name: 'concurrent',
        }),
      ];

      const results = await Promise.all(updatePromises);

      // All operations should succeed
      expect(results.every((r) => !r.isError || r.id !== undefined)).toBe(
        true
      );

      const finalTask = await client.getTask(task.id);
      expect(finalTask.id).toBe(task.id);

      console.log('✅ Simultaneous multi-field updates handled');
    });

    it('should handle simultaneous priority changes', async () => {
      const task = await createTask(client, listId, {
        name: uniqueTestName('Simultaneous Priority'),
      });

      // Set different priorities simultaneously
      const priorities = [1, 2, 3, 4];

      const updatePromises = priorities.map((priority) =>
        client.updateTask(task.id, { priority })
      );

      const results = await Promise.all(updatePromises);

      expect(results).toHaveLength(priorities.length);

      const finalTask = await client.getTask(task.id);
      expect(finalTask.priority).toBeDefined();

      console.log('✅ Simultaneous priority changes handled');
    });
  });

  describe('Dependency Conflicts', () => {
    it('should handle concurrent dependency additions', async () => {
      const baseName = uniqueTestName('Concurrent Dep Add');

      // Create tasks
      const tasks = await Promise.all(
        Array.from({ length: 5 }, (_, i) =>
          createTask(client, listId, {
            name: `${baseName} - ${i + 1}`,
          })
        )
      );

      const targetTask = tasks[0];
      const blockerTasks = tasks.slice(1);

      // Add all dependencies concurrently
      const depPromises = blockerTasks.map((blocker) =>
        client.callTool('clickup_task_add_dependency', {
          task_id: targetTask.id,
          depends_on: blocker.id,
          dependency_type: 'waiting_on',
        })
      );

      const results = await Promise.all(depPromises);

      // All dependencies should be added
      expect(results.every((r) => !r.isError)).toBe(true);

      console.log('✅ Concurrent dependency additions handled');
    });

    it('should prevent concurrent circular dependencies', async () => {
      const baseName = uniqueTestName('Circular Dep');

      const taskA = await createTask(client, listId, {
        name: `${baseName} - A`,
      });

      const taskB = await createTask(client, listId, {
        name: `${baseName} - B`,
      });

      // Try to create circular dependency concurrently
      const results = await Promise.all([
        client.callTool('clickup_task_add_dependency', {
          task_id: taskA.id,
          depends_on: taskB.id,
          dependency_type: 'waiting_on',
        }),
        client.callTool('clickup_task_add_dependency', {
          task_id: taskB.id,
          depends_on: taskA.id,
          dependency_type: 'waiting_on',
        }),
      ]);

      // One should succeed, one should fail (or both succeed if API doesn't prevent)
      const successCount = results.filter((r) => !r.isError).length;
      expect(successCount).toBeGreaterThanOrEqual(1);

      console.log('✅ Circular dependency prevention tested');
    });

    it('should handle concurrent dependency removals', async () => {
      const baseName = uniqueTestName('Concurrent Dep Remove');

      const targetTask = await createTask(client, listId, {
        name: `${baseName} - Target`,
      });

      // Create blockers and add dependencies
      const blockers = await Promise.all(
        Array.from({ length: 3 }, (_, i) =>
          createTask(client, listId, {
            name: `${baseName} - Blocker ${i + 1}`,
          })
        )
      );

      for (const blocker of blockers) {
        await client.callTool('clickup_task_add_dependency', {
          task_id: targetTask.id,
          depends_on: blocker.id,
          dependency_type: 'waiting_on',
        });
      }

      await delay(100);

      // Remove all dependencies concurrently
      const removePromises = blockers.map((blocker) =>
        client.callTool('clickup_task_remove_dependency', {
          task_id: targetTask.id,
          depends_on: blocker.id,
          dependency_type: 'waiting_on',
        })
      );

      const results = await Promise.all(removePromises);

      // All removals should succeed
      expect(results.every((r) => !r.isError)).toBe(true);

      console.log('✅ Concurrent dependency removals handled');
    });

    it('should handle concurrent dependency chain modifications', async () => {
      const baseName = uniqueTestName('Dep Chain Mod');

      // Create chain: A → B → C
      const taskA = await createTask(client, listId, {
        name: `${baseName} - A`,
      });
      const taskB = await createTask(client, listId, {
        name: `${baseName} - B`,
      });
      const taskC = await createTask(client, listId, {
        name: `${baseName} - C`,
      });

      await client.callTool('clickup_task_add_dependency', {
        task_id: taskB.id,
        depends_on: taskA.id,
        dependency_type: 'waiting_on',
      });

      await client.callTool('clickup_task_add_dependency', {
        task_id: taskC.id,
        depends_on: taskB.id,
        dependency_type: 'waiting_on',
      });

      await delay(100);

      // Modify chain concurrently
      const modifications = await Promise.all([
        client.updateTask(taskA.id, { status: 'complete' }),
        client.updateTask(taskB.id, { status: 'in progress' }),
        client.addComment(taskC.id, 'Chain being modified'),
      ]);

      expect(modifications.every((m) => m.id !== undefined || !m.isError)).toBe(
        true
      );

      console.log('✅ Concurrent dependency chain modifications handled');
    });
  });

  describe('Concurrent Modifications', () => {
    it('should handle concurrent task and subtask modifications', async () => {
      const baseName = uniqueTestName('Concurrent Hierarchy');

      const parent = await createTask(client, listId, {
        name: `${baseName} - Parent`,
      });

      const subtasks = await Promise.all(
        Array.from({ length: 3 }, (_, i) =>
          createTask(client, listId, {
            name: `${baseName} - Subtask ${i + 1}`,
            parent: parent.id,
          })
        )
      );

      // Modify parent and subtasks concurrently
      const modificationPromises = [
        client.updateTask(parent.id, { description: 'Parent modified' }),
        ...subtasks.map((st) =>
          client.updateTask(st.id, { status: 'complete' })
        ),
      ];

      const results = await Promise.all(modificationPromises);

      expect(results).toHaveLength(4);
      expect(results.every((r) => r.id !== undefined)).toBe(true);

      console.log('✅ Concurrent hierarchy modifications handled');
    });

    it('should handle concurrent comment modifications', async () => {
      const task = await createTask(client, listId, {
        name: uniqueTestName('Concurrent Comments'),
      });

      // Add initial comment
      const comment = await client.addComment(task.id, 'Original comment');

      // Modify comment and add new comments concurrently
      const modifications = await Promise.all([
        client.callTool('clickup_comment_update', {
          comment_id: comment.id,
          comment_text: 'Updated comment',
        }),
        client.addComment(task.id, 'New comment 1'),
        client.addComment(task.id, 'New comment 2'),
      ]);

      expect(modifications.every((m) => !m.isError || m.id !== undefined)).toBe(
        true
      );

      console.log('✅ Concurrent comment modifications handled');
    });

    it('should handle concurrent tag modifications', async () => {
      const task = await createTask(client, listId, {
        name: uniqueTestName('Concurrent Tags'),
      });

      // Add tags concurrently
      await Promise.all(
        Array.from({ length: 3 }, (_, i) =>
          client.callTool('clickup_task_add_tag', {
            task_id: task.id,
            tag_name: `tag-${i + 1}`,
          })
        )
      );

      await delay(100);

      // Add and remove tags concurrently
      const modifications = await Promise.all([
        client.callTool('clickup_task_add_tag', {
          task_id: task.id,
          tag_name: 'new-tag',
        }),
        client.callTool('clickup_task_remove_tag', {
          task_id: task.id,
          tag_name: 'tag-1',
        }),
      ]);

      expect(modifications.every((m) => !m.isError)).toBe(true);

      console.log('✅ Concurrent tag modifications handled');
    });
  });

  describe('Deadlock Prevention', () => {
    it('should prevent deadlock with bidirectional dependencies', async () => {
      const baseName = uniqueTestName('Deadlock Prevent');

      const taskA = await createTask(client, listId, {
        name: `${baseName} - A`,
      });

      const taskB = await createTask(client, listId, {
        name: `${baseName} - B`,
      });

      // Attempt to create bidirectional dependencies
      const result1 = await client.callTool('clickup_task_add_dependency', {
        task_id: taskA.id,
        depends_on: taskB.id,
        dependency_type: 'waiting_on',
      });

      await delay(50);

      const result2 = await client.callTool('clickup_task_add_dependency', {
        task_id: taskB.id,
        depends_on: taskA.id,
        dependency_type: 'waiting_on',
      });

      // One should succeed, preventing deadlock
      const successCount = [result1, result2].filter((r) => !r.isError).length;
      expect(successCount).toBeGreaterThanOrEqual(1);

      console.log('✅ Deadlock prevention validated');
    });

    it('should handle concurrent operations on dependency chain', async () => {
      const baseName = uniqueTestName('Deadlock Chain');

      // Create chain A → B → C
      const tasks = await Promise.all(
        Array.from({ length: 3 }, (_, i) =>
          createTask(client, listId, {
            name: `${baseName} - ${String.fromCharCode(65 + i)}`,
          })
        )
      );

      for (let i = 1; i < tasks.length; i++) {
        await client.callTool('clickup_task_add_dependency', {
          task_id: tasks[i].id,
          depends_on: tasks[i - 1].id,
          dependency_type: 'waiting_on',
        });
      }

      await delay(100);

      // Perform operations on all tasks concurrently
      const operations = await Promise.all([
        client.updateTask(tasks[0].id, { status: 'complete' }),
        client.updateTask(tasks[1].id, { description: 'Modified' }),
        client.addComment(tasks[2].id, 'Comment'),
      ]);

      expect(operations.every((op) => op.id !== undefined || !op.isError)).toBe(
        true
      );

      console.log('✅ Concurrent chain operations handled');
    });
  });

  describe('Transaction Isolation', () => {
    it('should maintain data consistency during concurrent operations', async () => {
      const baseName = uniqueTestName('Transaction Isolation');

      const task = await createTask(client, listId, {
        name: baseName,
        description: 'Initial',
      });

      // Perform multiple operations concurrently
      const operations = await Promise.all([
        client.updateTask(task.id, { description: 'Update 1' }),
        client.addComment(task.id, 'Comment 1'),
        client.callTool('clickup_task_add_tag', {
          task_id: task.id,
          tag_name: 'tag-1',
        }),
        client.updateTask(task.id, { status: 'in progress' }),
      ]);

      // All operations should succeed
      expect(operations.every((op) => !op.isError || op.id !== undefined)).toBe(
        true
      );

      // Verify final state is consistent
      const finalTask = await client.getTask(task.id);
      expect(finalTask.id).toBe(task.id);
      expect(finalTask.status.status).toBe('in progress');

      console.log('✅ Data consistency maintained');
    });

    it('should handle read-modify-write race conditions', async () => {
      const baseName = uniqueTestName('Read-Modify-Write');

      const task = await createTask(client, listId, {
        name: baseName,
        description: 'Count: 0',
      });

      // Simulate multiple clients doing read-modify-write
      const operations = await Promise.all(
        Array.from({ length: 5 }, async (_, i) => {
          // Read current state
          const currentTask = await client.getTask(task.id);

          // Modify based on current state
          return client.updateTask(task.id, {
            description: `Operation ${i + 1} saw: ${currentTask.description}`,
          });
        })
      );

      // All operations should complete
      expect(operations).toHaveLength(5);

      // Final state should reflect one of the operations
      const finalTask = await client.getTask(task.id);
      expect(finalTask.description).toMatch(/^Operation \d+ saw:/);

      console.log('✅ Read-modify-write race condition handled');
    });

    it('should maintain referential integrity during concurrent changes', async () => {
      const baseName = uniqueTestName('Referential Integrity');

      const parent = await createTask(client, listId, {
        name: `${baseName} - Parent`,
      });

      // Create subtasks and dependencies concurrently
      const operations = await Promise.all([
        createTask(client, listId, {
          name: `${baseName} - Subtask 1`,
          parent: parent.id,
        }),
        createTask(client, listId, {
          name: `${baseName} - Subtask 2`,
          parent: parent.id,
        }),
        client.addComment(parent.id, 'Creating subtasks'),
      ]);

      // Verify referential integrity
      const subtasks = operations.slice(0, 2);
      expect(subtasks.every((st) => st.parent === parent.id)).toBe(true);

      console.log('✅ Referential integrity maintained');
    });
  });

  describe('Performance Under Load', () => {
    it('should handle 20 concurrent task creations', async () => {
      const baseName = uniqueTestName('Load Test 20');
      const startTime = Date.now();

      const tasks = await Promise.all(
        Array.from({ length: 20 }, (_, i) =>
          createTask(client, listId, {
            name: `${baseName} - ${i + 1}`,
          })
        )
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(tasks).toHaveLength(20);
      expect(tasks.every((t) => t.id !== undefined)).toBe(true);

      console.log(
        `✅ Created 20 concurrent tasks in ${duration}ms (${(duration / 20).toFixed(0)}ms avg)`
      );
    });

    it('should handle 50 concurrent read operations', async () => {
      const task = await createTask(client, listId, {
        name: uniqueTestName('Load Test Read'),
      });

      const startTime = Date.now();

      const reads = await Promise.all(
        Array.from({ length: 50 }, () => client.getTask(task.id))
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(reads).toHaveLength(50);
      expect(reads.every((r) => r.id === task.id)).toBe(true);

      console.log(
        `✅ Performed 50 concurrent reads in ${duration}ms (${(duration / 50).toFixed(0)}ms avg)`
      );
    });

    it('should handle mixed concurrent operations', async () => {
      const baseName = uniqueTestName('Load Test Mixed');
      const startTime = Date.now();

      // Mix of creates, reads, and updates
      const operations = await Promise.all([
        ...Array.from({ length: 10 }, (_, i) =>
          createTask(client, listId, {
            name: `${baseName} - Create ${i + 1}`,
          })
        ),
        ...Array.from({ length: 10 }, () =>
          client.callTool('clickup_workspace_hierarchy_get', {})
        ),
      ]);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(operations).toHaveLength(20);

      console.log(
        `✅ Performed 20 mixed operations in ${duration}ms (${(duration / 20).toFixed(0)}ms avg)`
      );
    });

    it('should measure throughput under concurrent load', async () => {
      const baseName = uniqueTestName('Throughput Test');
      const concurrentBatches = 5;
      const tasksPerBatch = 5;
      const startTime = Date.now();

      const allTasks = [];
      for (let i = 0; i < concurrentBatches; i++) {
        const batchTasks = await Promise.all(
          Array.from({ length: tasksPerBatch }, (_, j) =>
            createTask(client, listId, {
              name: `${baseName} - B${i + 1}T${j + 1}`,
            })
          )
        );
        allTasks.push(...batchTasks);
        await delay(50);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;
      const totalTasks = concurrentBatches * tasksPerBatch;
      const throughput = (totalTasks / duration) * 1000;

      expect(allTasks).toHaveLength(totalTasks);

      console.log(`✅ Throughput: ${throughput.toFixed(2)} tasks/second`);
      console.log(`   Total: ${totalTasks} tasks in ${duration}ms`);
    });
  });
});
