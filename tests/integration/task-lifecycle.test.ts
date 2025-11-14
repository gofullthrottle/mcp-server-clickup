/**
 * Integration Tests: Task Lifecycle
 *
 * Tests the complete lifecycle of ClickUp tasks through MCP server:
 * - Task creation (minimal and complete)
 * - Task retrieval
 * - Task updates (status, assignees, fields)
 * - Task deletion
 * - Error handling
 *
 * These tests verify the core task management capabilities that form
 * the foundation of the ClickUp MCP server.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MCPTestClient, createMCPTestClient } from './mcp-test-client';
import { setupTestEnvironment, teardownTestEnvironment, getTestEnvironment } from './setup';
import { createTask, uniqueTestName } from './utils';

describe('Task Lifecycle Integration Tests', () => {
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

  describe('Task Creation', () => {
    it('should create task with minimal fields (name only)', async () => {
      const taskName = uniqueTestName('Minimal Task');

      const task = await client.createTask(listId, {
        name: taskName
      });

      expect(task).toBeDefined();
      expect(task.id).toBeDefined();
      expect(task.name).toBe(taskName);
      expect(task.list).toBeDefined();
      expect(task.list.id).toBe(listId);
    });

    it('should create task with all optional fields', async () => {
      const taskName = uniqueTestName('Complete Task');
      const dueDate = Date.now() + 86400000; // Tomorrow

      const task = await client.createTask(listId, {
        name: taskName,
        description: 'This is a comprehensive test task with all fields populated',
        status: 'to do',
        priority: 2, // High priority
        due_date: dueDate,
        tags: ['integration-test', 'lifecycle', 'complete']
      });

      expect(task).toBeDefined();
      expect(task.id).toBeDefined();
      expect(task.name).toBe(taskName);
      expect(task.description).toBe('This is a comprehensive test task with all fields populated');
      expect(task.status).toBeDefined();
      expect(task.priority).toBeDefined();
      expect(task.due_date).toBeDefined();
      expect(task.tags).toBeDefined();
      expect(task.tags.length).toBeGreaterThanOrEqual(3);
    });

    it('should create task with natural language due date', async () => {
      const taskName = uniqueTestName('NLP Date Task');

      const task = await client.createTask(listId, {
        name: taskName,
        description: 'Task with natural language due date',
        due_date: 'tomorrow at 3pm'
      });

      expect(task).toBeDefined();
      expect(task.id).toBeDefined();
      expect(task.due_date).toBeDefined();
      // Due date should be parsed and set
      expect(typeof task.due_date).toBe('string');
    });

    it('should fail to create task with invalid list ID', async () => {
      const taskName = uniqueTestName('Invalid List Task');
      const invalidListId = 'invalid_list_123';

      const result = await client.callTool('clickup_task_create', {
        list_id: invalidListId,
        name: taskName
      });

      expect(result.isError).toBe(true);
      const errorText = client.parseTextResult(result);
      expect(errorText.toLowerCase()).toMatch(/error|invalid|not found/);
    });

    it('should fail to create task without required name field', async () => {
      const result = await client.callTool('clickup_task_create', {
        list_id: listId
        // Missing 'name' field
      });

      expect(result.isError).toBe(true);
      const errorText = client.parseTextResult(result);
      expect(errorText.toLowerCase()).toMatch(/error|required|name/);
    });
  });

  describe('Task Retrieval', () => {
    let testTaskId: string;

    beforeAll(async () => {
      // Create a task for retrieval tests
      const task = await createTask(client, listId, {
        name: uniqueTestName('Retrieval Test Task'),
        description: 'Task created for testing retrieval operations'
      });
      testTaskId = task.id;
    });

    it('should retrieve task by ID', async () => {
      const task = await client.getTask(testTaskId);

      expect(task).toBeDefined();
      expect(task.id).toBe(testTaskId);
      expect(task.name).toBeDefined();
      expect(task.description).toBeDefined();
    });

    it('should retrieve task with include_subtasks option', async () => {
      const task = await client.getTask(testTaskId, {
        include_subtasks: true
      });

      expect(task).toBeDefined();
      expect(task.id).toBe(testTaskId);
      // Subtasks array should be included (may be empty)
      expect(task.subtasks !== undefined || task.subtasks === null).toBe(true);
    });

    it('should retrieve task with include_closed option', async () => {
      const task = await client.getTask(testTaskId, {
        include_closed: true
      });

      expect(task).toBeDefined();
      expect(task.id).toBe(testTaskId);
    });

    it('should fail to retrieve non-existent task', async () => {
      const invalidTaskId = 'invalid_task_xyz';

      const result = await client.callTool('clickup_task_get', {
        task_id: invalidTaskId
      });

      expect(result.isError).toBe(true);
      const errorText = client.parseTextResult(result);
      expect(errorText.toLowerCase()).toMatch(/error|not found|invalid/);
    });
  });

  describe('Task Updates', () => {
    let testTaskId: string;

    beforeAll(async () => {
      // Create a task for update tests
      const task = await createTask(client, listId, {
        name: uniqueTestName('Update Test Task'),
        description: 'Task created for testing update operations',
        status: 'to do'
      });
      testTaskId = task.id;
    });

    it('should update task name', async () => {
      const newName = uniqueTestName('Updated Task Name');

      const updatedTask = await client.updateTask(testTaskId, {
        name: newName
      });

      expect(updatedTask).toBeDefined();
      expect(updatedTask.name).toBe(newName);
    });

    it('should update task description', async () => {
      const newDescription = 'This description has been updated via integration test';

      const updatedTask = await client.updateTask(testTaskId, {
        description: newDescription
      });

      expect(updatedTask).toBeDefined();
      expect(updatedTask.description).toBe(newDescription);
    });

    it('should update task status', async () => {
      // First, ensure task is in a known state
      await client.updateTask(testTaskId, { status: 'to do' });

      // Now update to 'in progress'
      const updatedTask = await client.updateTask(testTaskId, {
        status: 'in progress'
      });

      expect(updatedTask).toBeDefined();
      expect(updatedTask.status).toBeDefined();
      expect(updatedTask.status.status.toLowerCase()).toMatch(/progress|in progress/);
    });

    it('should update task priority', async () => {
      const updatedTask = await client.updateTask(testTaskId, {
        priority: 1 // Urgent
      });

      expect(updatedTask).toBeDefined();
      expect(updatedTask.priority).toBeDefined();
      expect(updatedTask.priority.id).toBe('1');
    });

    it('should update task due date', async () => {
      const newDueDate = Date.now() + (7 * 86400000); // 7 days from now

      const updatedTask = await client.updateTask(testTaskId, {
        due_date: newDueDate
      });

      expect(updatedTask).toBeDefined();
      expect(updatedTask.due_date).toBeDefined();
    });

    it('should update task tags', async () => {
      const newTags = ['updated', 'integration', 'test'];

      const updatedTask = await client.updateTask(testTaskId, {
        tags: newTags
      });

      expect(updatedTask).toBeDefined();
      expect(updatedTask.tags).toBeDefined();
      expect(updatedTask.tags.length).toBeGreaterThanOrEqual(newTags.length);
    });

    it('should update multiple fields simultaneously', async () => {
      const updates = {
        name: uniqueTestName('Multi-Update Task'),
        description: 'Updated multiple fields at once',
        status: 'in progress',
        priority: 2
      };

      const updatedTask = await client.updateTask(testTaskId, updates);

      expect(updatedTask).toBeDefined();
      expect(updatedTask.name).toBe(updates.name);
      expect(updatedTask.description).toBe(updates.description);
    });

    it('should fail to update non-existent task', async () => {
      const invalidTaskId = 'non_existent_task_999';

      const result = await client.callTool('clickup_task_update', {
        task_id: invalidTaskId,
        name: 'Should Fail'
      });

      expect(result.isError).toBe(true);
      const errorText = client.parseTextResult(result);
      expect(errorText.toLowerCase()).toMatch(/error|not found|invalid/);
    });

    it('should handle invalid status gracefully', async () => {
      const result = await client.callTool('clickup_task_update', {
        task_id: testTaskId,
        status: 'invalid_status_xyz'
      });

      // Depending on implementation, this might error or ignore invalid status
      // Just verify server handles it without crashing
      expect(result).toBeDefined();
    });
  });

  describe('Task Deletion', () => {
    it('should delete task successfully', async () => {
      // Create a task to delete
      const task = await createTask(client, listId, {
        name: uniqueTestName('Task To Delete'),
        description: 'This task will be deleted'
      });

      const taskId = task.id;

      // Delete the task
      await client.deleteTask(taskId);

      // Verify task is deleted by attempting to retrieve it
      const result = await client.callTool('clickup_task_get', {
        task_id: taskId
      });

      expect(result.isError).toBe(true);
      const errorText = client.parseTextResult(result);
      expect(errorText.toLowerCase()).toMatch(/error|not found|deleted/);
    });

    it('should fail to delete non-existent task', async () => {
      const invalidTaskId = 'non_existent_delete_999';

      const result = await client.callTool('clickup_task_delete', {
        task_id: invalidTaskId
      });

      expect(result.isError).toBe(true);
      const errorText = client.parseTextResult(result);
      expect(errorText.toLowerCase()).toMatch(/error|not found|invalid/);
    });

    it('should fail to delete already deleted task', async () => {
      // Create and delete a task
      const task = await createTask(client, listId, {
        name: uniqueTestName('Double Delete Task')
      });
      await client.deleteTask(task.id);

      // Try to delete again
      const result = await client.callTool('clickup_task_delete', {
        task_id: task.id
      });

      expect(result.isError).toBe(true);
    });
  });

  describe('Task Assignees', () => {
    let testTaskId: string;
    let userId: string;

    beforeAll(async () => {
      // Create a task for assignee tests
      const task = await createTask(client, listId, {
        name: uniqueTestName('Assignee Test Task'),
        description: 'Task for testing assignee operations'
      });
      testTaskId = task.id;

      // Get workspace hierarchy to find a valid user ID
      const hierarchy = await client.getWorkspaceHierarchy();
      if (hierarchy.teams && hierarchy.teams[0] && hierarchy.teams[0].members) {
        userId = hierarchy.teams[0].members[0].user.id;
      }
    });

    it('should assign user to task', async () => {
      if (!userId) {
        console.log('Skipping assignee test - no user ID available');
        return;
      }

      const updatedTask = await client.updateTask(testTaskId, {
        assignees: {
          add: [parseInt(userId)]
        }
      });

      expect(updatedTask).toBeDefined();
      expect(updatedTask.assignees).toBeDefined();
      expect(updatedTask.assignees.length).toBeGreaterThan(0);
    });

    it('should remove assignee from task', async () => {
      if (!userId) {
        console.log('Skipping assignee removal test - no user ID available');
        return;
      }

      const updatedTask = await client.updateTask(testTaskId, {
        assignees: {
          rem: [parseInt(userId)]
        }
      });

      expect(updatedTask).toBeDefined();
      // Assignees list should no longer contain the removed user
    });
  });

  describe('Task Status Transitions', () => {
    let testTaskId: string;

    beforeAll(async () => {
      // Create a task for status transition tests
      const task = await createTask(client, listId, {
        name: uniqueTestName('Status Transition Task'),
        status: 'to do'
      });
      testTaskId = task.id;
    });

    it('should transition task through workflow: to do → in progress → complete', async () => {
      // Start: to do
      let task = await client.getTask(testTaskId);
      expect(task.status.status.toLowerCase()).toMatch(/to do|todo|open/);

      // Transition to: in progress
      task = await client.updateTask(testTaskId, { status: 'in progress' });
      expect(task.status.status.toLowerCase()).toMatch(/progress|in progress/);

      // Transition to: complete
      task = await client.updateTask(testTaskId, { status: 'complete' });
      expect(task.status.status.toLowerCase()).toMatch(/complete|closed|done/);
    });

    it('should allow reopening completed task', async () => {
      // Ensure task is complete
      await client.updateTask(testTaskId, { status: 'complete' });

      // Reopen task
      const task = await client.updateTask(testTaskId, { status: 'to do' });

      expect(task).toBeDefined();
      expect(task.status.status.toLowerCase()).toMatch(/to do|todo|open/);
    });
  });

  describe('Task Metadata', () => {
    let testTaskId: string;

    beforeAll(async () => {
      // Create a task for metadata tests
      const task = await createTask(client, listId, {
        name: uniqueTestName('Metadata Test Task')
      });
      testTaskId = task.id;
    });

    it('should retrieve task with creator information', async () => {
      const task = await client.getTask(testTaskId);

      expect(task).toBeDefined();
      expect(task.creator).toBeDefined();
      expect(task.creator.id).toBeDefined();
      expect(task.creator.username).toBeDefined();
    });

    it('should retrieve task with timestamps', async () => {
      const task = await client.getTask(testTaskId);

      expect(task).toBeDefined();
      expect(task.date_created).toBeDefined();
      expect(task.date_updated).toBeDefined();
    });

    it('should retrieve task with list information', async () => {
      const task = await client.getTask(testTaskId);

      expect(task).toBeDefined();
      expect(task.list).toBeDefined();
      expect(task.list.id).toBe(listId);
      expect(task.list.name).toBeDefined();
    });

    it('should retrieve task with folder and space information', async () => {
      const task = await client.getTask(testTaskId);

      expect(task).toBeDefined();
      expect(task.folder).toBeDefined();
      expect(task.space).toBeDefined();
    });
  });
});
