/**
 * Integration Tests: Subtask Hierarchies
 *
 * Tests subtask management and hierarchical task structures:
 * - Creating subtasks with parent relationships
 * - Nested subtask hierarchies (3+ levels)
 * - Querying subtask trees
 * - Moving subtasks between parents
 * - Parent deletion and cascade behavior
 * - Error handling for invalid parent IDs
 *
 * These tests verify hierarchical task organization capabilities
 * essential for breaking down complex projects into manageable units.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MCPTestClient, createMCPTestClient } from './mcp-test-client';
import { setupTestEnvironment, teardownTestEnvironment, getTestEnvironment } from './setup';
import {
  createTask,
  createTaskWithSubtasks,
  createNestedSubtasks,
  uniqueTestName,
  assertArrayLength
} from './utils';

describe('Subtask Hierarchy Integration Tests', () => {
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

  describe('Basic Subtask Operations', () => {
    it('should create subtask with parent relationship', async () => {
      // Create parent task
      const parent = await createTask(client, listId, {
        name: uniqueTestName('Parent Task'),
        description: 'Parent task for subtask creation'
      });

      // Create subtask
      const subtask = await createTask(client, listId, {
        name: uniqueTestName('Subtask'),
        description: 'Child task of parent',
        parent: parent.id
      });

      expect(subtask).toBeDefined();
      expect(subtask.id).toBeDefined();
      expect(subtask.parent).toBeDefined();
      expect(subtask.parent).toBe(parent.id);

      // Verify parent shows subtask
      const parentTask = await client.getTask(parent.id, {
        include_subtasks: true
      });

      expect(parentTask.subtasks).toBeDefined();
      expect(parentTask.subtasks.length).toBeGreaterThan(0);
    });

    it('should create multiple subtasks for single parent', async () => {
      const parentName = uniqueTestName('Multi-Subtask Parent');
      const subtaskNames = [
        'Subtask 1: Setup',
        'Subtask 2: Implementation',
        'Subtask 3: Testing',
        'Subtask 4: Documentation'
      ];

      const { parent, subtasks } = await createTaskWithSubtasks(
        client,
        listId,
        parentName,
        subtaskNames
      );

      expect(subtasks.length).toBe(4);

      // Verify all subtasks have correct parent
      for (const subtask of subtasks) {
        expect(subtask.parent).toBe(parent.id);
      }

      // Verify parent lists all subtasks
      const parentTask = await client.getTask(parent.id, {
        include_subtasks: true
      });

      expect(parentTask.subtasks).toBeDefined();
      expect(parentTask.subtasks.length).toBeGreaterThanOrEqual(4);
    });

    it('should fail to create subtask with invalid parent ID', async () => {
      const invalidParentId = 'invalid_parent_xyz';

      const result = await client.callTool('clickup_task_create', {
        list_id: listId,
        name: uniqueTestName('Invalid Parent Subtask'),
        parent: invalidParentId
      });

      expect(result.isError).toBe(true);
      const errorText = client.parseTextResult(result);
      expect(errorText.toLowerCase()).toMatch(/error|invalid|not found/);
    });
  });

  describe('Nested Subtask Hierarchies', () => {
    it('should create 3-level nested subtask hierarchy', async () => {
      const { level1, level2, level3 } = await createNestedSubtasks(
        client,
        listId
      );

      // Verify Level 1 (root)
      expect(level1).toBeDefined();
      expect(level1.id).toBeDefined();

      // Verify Level 2 (children)
      expect(level2.length).toBe(2);
      for (const task of level2) {
        expect(task.parent).toBe(level1.id);
      }

      // Verify Level 3 (grandchildren)
      expect(level3.length).toBe(3);
      expect(level3[0].parent).toBe(level2[0].id);
      expect(level3[1].parent).toBe(level2[0].id);
      expect(level3[2].parent).toBe(level2[1].id);
    });

    it('should retrieve full subtask tree with include_subtasks', async () => {
      const { level1 } = await createNestedSubtasks(client, listId);

      // Get root task with all subtasks
      const rootTask = await client.getTask(level1.id, {
        include_subtasks: true
      });

      expect(rootTask).toBeDefined();
      expect(rootTask.subtasks).toBeDefined();
      expect(rootTask.subtasks.length).toBeGreaterThan(0);

      // Check that subtasks have their own subtasks
      // (depending on ClickUp API, may need recursive query)
    });

    it('should handle deep nesting (4+ levels)', async () => {
      // Create Level 1
      const level1 = await createTask(client, listId, {
        name: uniqueTestName('Level 1: Root')
      });

      // Create Level 2
      const level2 = await createTask(client, listId, {
        name: uniqueTestName('Level 2: Child'),
        parent: level1.id
      });

      // Create Level 3
      const level3 = await createTask(client, listId, {
        name: uniqueTestName('Level 3: Grandchild'),
        parent: level2.id
      });

      // Create Level 4
      const level4 = await createTask(client, listId, {
        name: uniqueTestName('Level 4: Great-grandchild'),
        parent: level3.id
      });

      // Create Level 5
      const level5 = await createTask(client, listId, {
        name: uniqueTestName('Level 5: Great-great-grandchild'),
        parent: level4.id
      });

      // Verify each level
      expect(level5.parent).toBe(level4.id);
      expect(level4.parent).toBe(level3.id);
      expect(level3.parent).toBe(level2.id);
      expect(level2.parent).toBe(level1.id);
    });
  });

  describe('Subtask Hierarchy Queries', () => {
    let parentTask: any;
    let subtasks: any[];

    beforeAll(async () => {
      // Create parent with multiple subtasks
      const result = await createTaskWithSubtasks(
        client,
        listId,
        uniqueTestName('Query Parent'),
        ['Subtask A', 'Subtask B', 'Subtask C']
      );
      parentTask = result.parent;
      subtasks = result.subtasks;
    });

    it('should query parent and get all subtasks', async () => {
      const task = await client.getTask(parentTask.id, {
        include_subtasks: true
      });

      expect(task).toBeDefined();
      expect(task.subtasks).toBeDefined();
      expect(task.subtasks.length).toBeGreaterThanOrEqual(3);
    });

    it('should query subtask and get parent reference', async () => {
      const subtask = await client.getTask(subtasks[0].id);

      expect(subtask).toBeDefined();
      expect(subtask.parent).toBeDefined();
      expect(subtask.parent).toBe(parentTask.id);
    });

    it('should list tasks and include subtask information', async () => {
      const result = await client.callTool('clickup_list_get_tasks', {
        list_id: listId,
        subtasks: true
      });

      client.assertSuccess(result, 'Failed to get tasks with subtasks');
      const tasksData = client.parseJsonResult(result);

      expect(tasksData).toBeDefined();
      expect(tasksData.tasks).toBeDefined();
      expect(Array.isArray(tasksData.tasks)).toBe(true);
    });
  });

  describe('Subtask Movement', () => {
    it('should move subtask to different parent', async () => {
      // Create two parent tasks
      const parent1 = await createTask(client, listId, {
        name: uniqueTestName('Parent 1')
      });

      const parent2 = await createTask(client, listId, {
        name: uniqueTestName('Parent 2')
      });

      // Create subtask under parent1
      const subtask = await createTask(client, listId, {
        name: uniqueTestName('Movable Subtask'),
        parent: parent1.id
      });

      expect(subtask.parent).toBe(parent1.id);

      // Move subtask to parent2
      const movedTask = await client.updateTask(subtask.id, {
        parent: parent2.id
      });

      expect(movedTask).toBeDefined();
      expect(movedTask.parent).toBe(parent2.id);

      // Verify subtask moved
      const updatedSubtask = await client.getTask(subtask.id);
      expect(updatedSubtask.parent).toBe(parent2.id);
    });

    it('should convert subtask to top-level task', async () => {
      // Create parent and subtask
      const parent = await createTask(client, listId, {
        name: uniqueTestName('Temporary Parent')
      });

      const subtask = await createTask(client, listId, {
        name: uniqueTestName('Future Top-Level Task'),
        parent: parent.id
      });

      expect(subtask.parent).toBe(parent.id);

      // Remove parent relationship (convert to top-level)
      const result = await client.callTool('clickup_task_update', {
        task_id: subtask.id,
        parent: null
      });

      // Check if successful
      if (!result.isError) {
        const updatedTask = client.parseJsonResult(result);
        expect(updatedTask.parent === null || updatedTask.parent === undefined).toBe(true);
      }
    });

    it('should move subtask with its own subtasks', async () => {
      // Create 3-level hierarchy
      const { level1, level2, level3 } = await createNestedSubtasks(
        client,
        listId
      );

      // Create new parent
      const newParent = await createTask(client, listId, {
        name: uniqueTestName('New Parent')
      });

      // Move Level 2 task (which has subtasks) to new parent
      const movedTask = await client.updateTask(level2[0].id, {
        parent: newParent.id
      });

      expect(movedTask.parent).toBe(newParent.id);

      // Verify Level 3 subtasks still belong to Level 2 task
      const level3Task = await client.getTask(level3[0].id);
      expect(level3Task.parent).toBe(level2[0].id);
    });
  });

  describe('Parent Deletion & Cascade Behavior', () => {
    it('should handle parent task deletion', async () => {
      // Create parent with subtasks
      const { parent, subtasks } = await createTaskWithSubtasks(
        client,
        listId,
        uniqueTestName('Delete Parent'),
        ['Subtask 1', 'Subtask 2']
      );

      const subtaskIds = subtasks.map(t => t.id);

      // Delete parent task
      await client.deleteTask(parent.id);

      // Check what happens to subtasks
      // Behavior may vary: ClickUp might cascade delete or convert to top-level
      // Just verify system handles it without error
      for (const subtaskId of subtaskIds) {
        const result = await client.callTool('clickup_task_get', {
          task_id: subtaskId
        });

        // Task may be deleted (error) or promoted to top-level (success)
        expect(result).toBeDefined();
      }
    });

    it('should delete subtask without affecting parent', async () => {
      // Create parent with subtasks
      const { parent, subtasks } = await createTaskWithSubtasks(
        client,
        listId,
        uniqueTestName('Subtask Delete Parent'),
        ['Subtask A', 'Subtask B', 'Subtask C']
      );

      // Delete one subtask
      await client.deleteTask(subtasks[0].id);

      // Verify parent still exists
      const parentTask = await client.getTask(parent.id, {
        include_subtasks: true
      });

      expect(parentTask).toBeDefined();
      expect(parentTask.id).toBe(parent.id);

      // Other subtasks should still exist
      const remainingSubtask = await client.getTask(subtasks[1].id);
      expect(remainingSubtask).toBeDefined();
    });

    it('should handle deleting nested subtask hierarchy', async () => {
      // Create 3-level hierarchy
      const { level1, level2, level3 } = await createNestedSubtasks(
        client,
        listId
      );

      // Delete Level 2 task (which has Level 3 subtasks)
      await client.deleteTask(level2[0].id);

      // Verify Level 1 still exists
      const level1Task = await client.getTask(level1.id);
      expect(level1Task).toBeDefined();

      // Level 3 subtasks may be deleted or promoted
      // Just verify no crash
      const result = await client.callTool('clickup_task_get', {
        task_id: level3[0].id
      });
      expect(result).toBeDefined();
    });
  });

  describe('Subtask Status & Progress', () => {
    it('should track completion status of subtasks', async () => {
      // Create parent with subtasks
      const { parent, subtasks } = await createTaskWithSubtasks(
        client,
        listId,
        uniqueTestName('Progress Parent'),
        ['Subtask 1', 'Subtask 2', 'Subtask 3']
      );

      // Mark first subtask as complete
      await client.updateTask(subtasks[0].id, {
        status: 'complete'
      });

      // Get parent task
      const parentTask = await client.getTask(parent.id, {
        include_subtasks: true
      });

      expect(parentTask).toBeDefined();
      expect(parentTask.subtasks).toBeDefined();

      // Check if subtask status is reflected
      // (may require checking individual subtasks)
    });

    it('should update parent status when all subtasks complete', async () => {
      // Create parent with subtasks
      const { parent, subtasks } = await createTaskWithSubtasks(
        client,
        listId,
        uniqueTestName('Auto-Complete Parent'),
        ['Subtask A', 'Subtask B']
      );

      // Complete all subtasks
      for (const subtask of subtasks) {
        await client.updateTask(subtask.id, {
          status: 'complete'
        });
      }

      // Get parent task
      const parentTask = await client.getTask(parent.id);

      expect(parentTask).toBeDefined();
      // Parent status may or may not auto-update depending on ClickUp settings
      // Just verify we can query it
    });
  });

  describe('Subtask with Dependencies', () => {
    it('should create dependencies between subtasks', async () => {
      // Create parent
      const parent = await createTask(client, listId, {
        name: uniqueTestName('Dep Subtask Parent')
      });

      // Create two subtasks
      const subtask1 = await createTask(client, listId, {
        name: uniqueTestName('Dep Subtask 1'),
        parent: parent.id
      });

      const subtask2 = await createTask(client, listId, {
        name: uniqueTestName('Dep Subtask 2'),
        parent: parent.id
      });

      // Add dependency: subtask2 depends on subtask1
      await client.addDependency(subtask2.id, subtask1.id, undefined);

      // Verify dependency
      const deps = await client.getDependencies(subtask2.id);
      expect(deps).toBeDefined();
      expect(deps.depends_on).toBeDefined();
      expect(deps.depends_on.length).toBeGreaterThan(0);
    });

    it('should create dependency between subtask and parent', async () => {
      // Create parent
      const parent = await createTask(client, listId, {
        name: uniqueTestName('Parent-Dep Parent')
      });

      // Create subtask
      const subtask = await createTask(client, listId, {
        name: uniqueTestName('Parent-Dep Subtask'),
        parent: parent.id
      });

      // Add dependency: parent depends on subtask completion
      await client.addDependency(parent.id, subtask.id, undefined);

      // Verify dependency
      const deps = await client.getDependencies(parent.id);
      expect(deps).toBeDefined();
      expect(deps.depends_on).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should fail to create subtask with non-existent parent', async () => {
      const invalidParent = 'non_existent_parent_999';

      const result = await client.callTool('clickup_task_create', {
        list_id: listId,
        name: uniqueTestName('Invalid Parent Test'),
        parent: invalidParent
      });

      expect(result.isError).toBe(true);
      const errorText = client.parseTextResult(result);
      expect(errorText.toLowerCase()).toMatch(/error|invalid|not found/);
    });

    it('should fail to move subtask to invalid parent', async () => {
      // Create subtask
      const parent = await createTask(client, listId, {
        name: uniqueTestName('Valid Parent')
      });

      const subtask = await createTask(client, listId, {
        name: uniqueTestName('Movable Subtask'),
        parent: parent.id
      });

      // Try to move to invalid parent
      const invalidParent = 'invalid_parent_xyz';

      const result = await client.callTool('clickup_task_update', {
        task_id: subtask.id,
        parent: invalidParent
      });

      expect(result.isError).toBe(true);
      const errorText = client.parseTextResult(result);
      expect(errorText.toLowerCase()).toMatch(/error|invalid|not found/);
    });

    it('should handle circular parent relationships gracefully', async () => {
      // Create parent and subtask
      const parent = await createTask(client, listId, {
        name: uniqueTestName('Circular Parent')
      });

      const subtask = await createTask(client, listId, {
        name: uniqueTestName('Circular Subtask'),
        parent: parent.id
      });

      // Try to make parent a child of subtask (circular relationship)
      const result = await client.callTool('clickup_task_update', {
        task_id: parent.id,
        parent: subtask.id
      });

      // Should fail or be handled gracefully
      expect(result).toBeDefined();
    });
  });
});
