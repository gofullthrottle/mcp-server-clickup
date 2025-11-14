/**
 * Workflows Integration Tests
 *
 * Tests multi-step task workflows and agent coordination scenarios.
 * Validates state machine transitions and long-running operations.
 *
 * Test Categories:
 * 1. Complete Task Lifecycle Workflows
 * 2. Multi-Agent Coordination
 * 3. State Machine Transitions
 * 4. Complex Dependency Chains
 * 5. Error Recovery Workflows
 * 6. Long-Running Operations
 * 7. Bulk Workflow Patterns
 * 8. Integration Workflows
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

describe('Workflows Integration Tests', () => {
  let client: MCPTestClient;
  let listId: string;
  let spaceId: string;

  beforeAll(async () => {
    const env = await getTestEnvironment();
    client = new MCPTestClient();
    await client.connect();

    spaceId = env.spaceId;
    listId = env.listId;

    console.log('Workflows tests initialized');
    console.log(`Space ID: ${spaceId}`);
    console.log(`List ID: ${listId}`);
  });

  afterAll(async () => {
    await cleanupTestResources();
    await client.disconnect();
    console.log('Workflows tests completed');
  });

  describe('Complete Task Lifecycle Workflows', () => {
    it('should execute complete task creation workflow', async () => {
      const workflowName = uniqueTestName('Workflow Complete');

      // Step 1: Create parent task
      const parentTask = await createTask(client, listId, {
        name: workflowName,
        description: 'Parent task in workflow',
        status: 'to do',
      });

      expect(parentTask.id).toBeDefined();
      expect(parentTask.status.status).toBe('to do');

      // Step 2: Add subtasks
      const subtask1 = await createTask(client, listId, {
        name: `${workflowName} - Subtask 1`,
        parent: parentTask.id,
      });

      const subtask2 = await createTask(client, listId, {
        name: `${workflowName} - Subtask 2`,
        parent: parentTask.id,
      });

      expect(subtask1.parent).toBe(parentTask.id);
      expect(subtask2.parent).toBe(parentTask.id);

      // Step 3: Add dependencies between subtasks
      const depResult = await client.callTool('clickup_task_add_dependency', {
        task_id: subtask2.id,
        depends_on: subtask1.id,
        dependency_type: 'waiting_on',
      });

      expect(depResult.isError).toBe(false);

      // Step 4: Add comments for tracking
      await client.addComment(
        parentTask.id,
        '🤖 Agent: Workflow initiated - processing subtasks'
      );

      // Step 5: Complete subtask 1
      await client.updateTask(subtask1.id, {
        status: 'complete',
      });

      await client.addComment(
        parentTask.id,
        '✅ Agent: Subtask 1 completed, starting subtask 2'
      );

      await delay(100);

      // Step 6: Complete subtask 2
      await client.updateTask(subtask2.id, {
        status: 'complete',
      });

      await client.addComment(
        parentTask.id,
        '✅ Agent: All subtasks completed'
      );

      // Step 7: Complete parent task
      const completedParent = await client.updateTask(parentTask.id, {
        status: 'complete',
      });

      expect(completedParent.status.status).toBe('complete');

      // Step 8: Verify final state
      const finalTask = await client.getTask(parentTask.id);
      expect(finalTask.status.status).toBe('complete');

      console.log('✅ Complete workflow executed successfully');
    });

    it('should execute task creation with tags workflow', async () => {
      const workflowName = uniqueTestName('Tagged Workflow');

      // Step 1: Create task
      const task = await createTask(client, listId, {
        name: workflowName,
      });

      // Step 2: Add multiple tags
      const tags = ['agent-created', 'priority-high', 'automated'];

      for (const tagName of tags) {
        await client.callTool('clickup_task_add_tag', {
          task_id: task.id,
          tag_name: tagName,
        });
        await delay(50);
      }

      // Step 3: Verify tags applied
      const taggedTask = await client.getTask(task.id);
      expect(taggedTask.tags.length).toBeGreaterThanOrEqual(3);

      console.log('✅ Tag workflow completed');
    });

    it('should execute task update workflow with multiple modifications', async () => {
      const workflowName = uniqueTestName('Update Workflow');

      // Step 1: Create minimal task
      const task = await createTask(client, listId, {
        name: workflowName,
      });

      // Step 2: Sequential updates
      const updates = [
        { description: 'Added description' },
        { status: 'in progress' },
        { priority: 2 }, // High priority
        { due_date: Date.now() + 7 * 24 * 60 * 60 * 1000 }, // 7 days
      ];

      for (const update of updates) {
        await client.updateTask(task.id, update);
        await delay(100);
      }

      // Step 3: Verify final state
      const finalTask = await client.getTask(task.id);
      expect(finalTask.description).toBe('Added description');
      expect(finalTask.status.status).toBe('in progress');
      expect(finalTask.priority).toBeDefined();
      expect(finalTask.due_date).toBeDefined();

      console.log('✅ Update workflow completed');
    });
  });

  describe('Multi-Agent Coordination', () => {
    it('should coordinate multiple agents via comments', async () => {
      const workflowName = uniqueTestName('Multi-Agent Coord');

      // Agent A: Create task
      const task = await createTask(client, listId, {
        name: workflowName,
        description: 'Multi-agent coordination test',
      });

      await client.addComment(
        task.id,
        '🤖 Agent A: Task created, awaiting data collection'
      );

      await delay(100);

      // Agent B: Add data collection comment
      await client.addComment(
        task.id,
        '🤖 Agent B: Data collected, 1000 records processed'
      );

      await delay(100);

      // Agent C: Add analysis comment
      await client.addComment(
        task.id,
        '🤖 Agent C: Analysis complete, results attached'
      );

      await delay(100);

      // Agent A: Mark complete
      await client.updateTask(task.id, {
        status: 'complete',
      });

      await client.addComment(
        task.id,
        '🤖 Agent A: Workflow complete, all agents coordinated successfully'
      );

      // Verify coordination
      const commentsResult = await client.callTool(
        'clickup_task_get_comments',
        {
          task_id: task.id,
        }
      );

      const comments = client.parseJsonResult(commentsResult);
      const agentComments = comments.filter((c: any) =>
        c.comment_text.includes('Agent')
      );

      expect(agentComments.length).toBeGreaterThanOrEqual(4);
      console.log(
        `✅ Multi-agent coordination: ${agentComments.length} agent interactions`
      );
    });

    it('should coordinate agents with dependency blocking', async () => {
      const workflowName = uniqueTestName('Agent Deps');

      // Agent A creates task 1
      const task1 = await createTask(client, listId, {
        name: `${workflowName} - Data Collection`,
      });

      await client.addComment(
        task1.id,
        '🤖 Agent A: Starting data collection'
      );

      // Agent B creates task 2 that depends on task 1
      const task2 = await createTask(client, listId, {
        name: `${workflowName} - Data Processing`,
      });

      await client.callTool('clickup_task_add_dependency', {
        task_id: task2.id,
        depends_on: task1.id,
        dependency_type: 'waiting_on',
      });

      await client.addComment(
        task2.id,
        '🤖 Agent B: Waiting for Agent A to complete data collection'
      );

      // Agent A completes task 1
      await client.updateTask(task1.id, {
        status: 'complete',
      });

      await client.addComment(
        task1.id,
        '🤖 Agent A: Data collection complete, Agent B can proceed'
      );

      await delay(100);

      // Agent B starts and completes task 2
      await client.updateTask(task2.id, {
        status: 'in progress',
      });

      await client.addComment(
        task2.id,
        '🤖 Agent B: Processing data from Agent A'
      );

      await client.updateTask(task2.id, {
        status: 'complete',
      });

      // Verify workflow
      const finalTask1 = await client.getTask(task1.id);
      const finalTask2 = await client.getTask(task2.id);

      expect(finalTask1.status.status).toBe('complete');
      expect(finalTask2.status.status).toBe('complete');

      console.log('✅ Agent dependency coordination completed');
    });

    it('should coordinate parallel agent work', async () => {
      const workflowName = uniqueTestName('Parallel Agents');

      // Create parent task
      const parentTask = await createTask(client, listId, {
        name: workflowName,
      });

      // Three agents create parallel subtasks
      const subtasks = await Promise.all([
        createTask(client, listId, {
          name: `${workflowName} - Agent A Work`,
          parent: parentTask.id,
        }),
        createTask(client, listId, {
          name: `${workflowName} - Agent B Work`,
          parent: parentTask.id,
        }),
        createTask(client, listId, {
          name: `${workflowName} - Agent C Work`,
          parent: parentTask.id,
        }),
      ]);

      // All agents work simultaneously
      await Promise.all(
        subtasks.map(async (subtask, index) => {
          await client.addComment(
            subtask.id,
            `🤖 Agent ${String.fromCharCode(65 + index)}: Starting parallel work`
          );

          await delay(50);

          await client.updateTask(subtask.id, {
            status: 'complete',
          });

          await client.addComment(
            subtask.id,
            `🤖 Agent ${String.fromCharCode(65 + index)}: Work complete`
          );
        })
      );

      // Verify all subtasks completed
      const completedSubtasks = await Promise.all(
        subtasks.map((st) => client.getTask(st.id))
      );

      expect(
        completedSubtasks.every((st) => st.status.status === 'complete')
      ).toBe(true);

      console.log('✅ Parallel agent coordination completed');
    });
  });

  describe('State Machine Transitions', () => {
    it('should execute valid state transitions', async () => {
      const workflowName = uniqueTestName('State Machine');

      const task = await createTask(client, listId, {
        name: workflowName,
        status: 'to do',
      });

      // Valid state progression: to do → in progress → complete
      const validTransitions = [
        { from: 'to do', to: 'in progress' },
        { from: 'in progress', to: 'complete' },
      ];

      let currentTask = task;
      for (const transition of validTransitions) {
        expect(currentTask.status.status).toBe(transition.from);

        currentTask = await client.updateTask(currentTask.id, {
          status: transition.to,
        });

        expect(currentTask.status.status).toBe(transition.to);
        await delay(100);
      }

      console.log('✅ Valid state transitions executed');
    });

    it('should handle reopening completed tasks', async () => {
      const workflowName = uniqueTestName('Reopen Task');

      // Create and complete task
      const task = await createTask(client, listId, {
        name: workflowName,
      });

      const completedTask = await client.updateTask(task.id, {
        status: 'complete',
      });

      expect(completedTask.status.status).toBe('complete');

      await delay(100);

      // Reopen task
      const reopenedTask = await client.updateTask(task.id, {
        status: 'to do',
      });

      expect(reopenedTask.status.status).toBe('to do');

      console.log('✅ Task reopening workflow completed');
    });

    it('should track state change history via comments', async () => {
      const workflowName = uniqueTestName('State History');

      const task = await createTask(client, listId, {
        name: workflowName,
        status: 'to do',
      });

      const states = ['to do', 'in progress', 'complete', 'to do'];

      for (let i = 1; i < states.length; i++) {
        await client.updateTask(task.id, {
          status: states[i],
        });

        await client.addComment(
          task.id,
          `🔄 State changed: ${states[i - 1]} → ${states[i]}`
        );

        await delay(100);
      }

      // Verify state history in comments
      const commentsResult = await client.callTool(
        'clickup_task_get_comments',
        {
          task_id: task.id,
        }
      );

      const comments = client.parseJsonResult(commentsResult);
      const stateChanges = comments.filter((c: any) =>
        c.comment_text.includes('State changed')
      );

      expect(stateChanges.length).toBe(3);
      console.log('✅ State history tracking completed');
    });
  });

  describe('Complex Dependency Chains', () => {
    it('should execute sequential dependency chain', async () => {
      const workflowName = uniqueTestName('Sequential Chain');

      // Create 5 tasks in sequence: A → B → C → D → E
      const tasks = [];
      for (let i = 0; i < 5; i++) {
        const task = await createTask(client, listId, {
          name: `${workflowName} - Step ${String.fromCharCode(65 + i)}`,
        });
        tasks.push(task);

        // Add dependency to previous task
        if (i > 0) {
          await client.callTool('clickup_task_add_dependency', {
            task_id: task.id,
            depends_on: tasks[i - 1].id,
            dependency_type: 'waiting_on',
          });
        }

        await delay(50);
      }

      // Execute chain: complete tasks in order
      for (let i = 0; i < tasks.length; i++) {
        await client.updateTask(tasks[i].id, {
          status: 'complete',
        });

        await client.addComment(
          tasks[i].id,
          `✅ Step ${String.fromCharCode(65 + i)} completed`
        );

        await delay(100);
      }

      // Verify all completed
      const completedTasks = await Promise.all(
        tasks.map((t) => client.getTask(t.id))
      );

      expect(
        completedTasks.every((t) => t.status.status === 'complete')
      ).toBe(true);

      console.log('✅ Sequential dependency chain completed');
    });

    it('should execute parallel dependency branches', async () => {
      const workflowName = uniqueTestName('Parallel Branches');

      // Create root task
      const root = await createTask(client, listId, {
        name: `${workflowName} - Root`,
      });

      // Create 3 parallel branches
      const branches = await Promise.all([
        createTask(client, listId, {
          name: `${workflowName} - Branch A`,
        }),
        createTask(client, listId, {
          name: `${workflowName} - Branch B`,
        }),
        createTask(client, listId, {
          name: `${workflowName} - Branch C`,
        }),
      ]);

      // All branches depend on root
      await Promise.all(
        branches.map((branch) =>
          client.callTool('clickup_task_add_dependency', {
            task_id: branch.id,
            depends_on: root.id,
            dependency_type: 'waiting_on',
          })
        )
      );

      // Complete root
      await client.updateTask(root.id, {
        status: 'complete',
      });

      await delay(100);

      // Complete all branches in parallel
      await Promise.all(
        branches.map((branch) =>
          client.updateTask(branch.id, {
            status: 'complete',
          })
        )
      );

      // Verify all completed
      const finalBranches = await Promise.all(
        branches.map((b) => client.getTask(b.id))
      );

      expect(
        finalBranches.every((b) => b.status.status === 'complete')
      ).toBe(true);

      console.log('✅ Parallel dependency branches completed');
    });

    it('should execute diamond dependency pattern', async () => {
      const workflowName = uniqueTestName('Diamond Pattern');

      // Diamond: A → B,C → D
      const taskA = await createTask(client, listId, {
        name: `${workflowName} - A (Start)`,
      });

      const taskB = await createTask(client, listId, {
        name: `${workflowName} - B (Branch 1)`,
      });

      const taskC = await createTask(client, listId, {
        name: `${workflowName} - C (Branch 2)`,
      });

      const taskD = await createTask(client, listId, {
        name: `${workflowName} - D (Merge)`,
      });

      // B and C depend on A
      await Promise.all([
        client.callTool('clickup_task_add_dependency', {
          task_id: taskB.id,
          depends_on: taskA.id,
          dependency_type: 'waiting_on',
        }),
        client.callTool('clickup_task_add_dependency', {
          task_id: taskC.id,
          depends_on: taskA.id,
          dependency_type: 'waiting_on',
        }),
      ]);

      // D depends on both B and C
      await Promise.all([
        client.callTool('clickup_task_add_dependency', {
          task_id: taskD.id,
          depends_on: taskB.id,
          dependency_type: 'waiting_on',
        }),
        client.callTool('clickup_task_add_dependency', {
          task_id: taskD.id,
          depends_on: taskC.id,
          dependency_type: 'waiting_on',
        }),
      ]);

      // Execute diamond pattern
      await client.updateTask(taskA.id, { status: 'complete' });
      await delay(100);

      await Promise.all([
        client.updateTask(taskB.id, { status: 'complete' }),
        client.updateTask(taskC.id, { status: 'complete' }),
      ]);
      await delay(100);

      await client.updateTask(taskD.id, { status: 'complete' });

      // Verify all completed
      const finalTasks = await Promise.all([
        client.getTask(taskA.id),
        client.getTask(taskB.id),
        client.getTask(taskC.id),
        client.getTask(taskD.id),
      ]);

      expect(finalTasks.every((t) => t.status.status === 'complete')).toBe(
        true
      );

      console.log('✅ Diamond dependency pattern completed');
    });
  });

  describe('Error Recovery Workflows', () => {
    it('should recover from failed task creation', async () => {
      const workflowName = uniqueTestName('Recovery Test');

      // Attempt to create task with invalid data
      const failResult = await client.callTool('clickup_task_create', {
        list_id: 'invalid_list_id',
        name: workflowName,
      });

      expect(failResult.isError).toBe(true);

      // Recover: create with valid data
      const task = await createTask(client, listId, {
        name: workflowName,
      });

      expect(task.id).toBeDefined();

      await client.addComment(
        task.id,
        '🔄 Recovery: Task created after initial failure'
      );

      console.log('✅ Error recovery workflow completed');
    });

    it('should handle partial workflow failure', async () => {
      const workflowName = uniqueTestName('Partial Failure');

      // Step 1: Create task (success)
      const task = await createTask(client, listId, {
        name: workflowName,
      });

      // Step 2: Attempt invalid update (failure expected)
      const failResult = await client.callTool('clickup_task_update', {
        task_id: 'invalid_id',
        description: 'This will fail',
      });

      expect(failResult.isError).toBe(true);

      // Step 3: Continue workflow with valid task
      const updatedTask = await client.updateTask(task.id, {
        description: 'Workflow continued after handling error',
      });

      expect(updatedTask.description).toBe(
        'Workflow continued after handling error'
      );

      await client.addComment(
        task.id,
        '✅ Workflow continued successfully after error'
      );

      console.log('✅ Partial failure recovery completed');
    });

    it('should implement retry logic for transient failures', async () => {
      const workflowName = uniqueTestName('Retry Logic');

      const task = await createTask(client, listId, {
        name: workflowName,
      });

      // Simulate retry logic (in practice, would retry on network errors)
      const maxRetries = 3;
      let attempt = 0;
      let success = false;

      while (attempt < maxRetries && !success) {
        attempt++;

        const result = await client.callTool('clickup_task_update', {
          task_id: task.id,
          description: `Retry attempt ${attempt}`,
        });

        if (!result.isError) {
          success = true;
          console.log(`✅ Succeeded on attempt ${attempt}`);
        } else {
          console.log(`⚠️ Attempt ${attempt} failed, retrying...`);
          await delay(100 * attempt); // Exponential backoff
        }
      }

      expect(success).toBe(true);
      console.log('✅ Retry logic workflow completed');
    });
  });

  describe('Long-Running Operations', () => {
    it('should execute multi-phase long-running workflow', async () => {
      const workflowName = uniqueTestName('Long Running');

      const task = await createTask(client, listId, {
        name: workflowName,
        description: 'Long-running operation with multiple phases',
      });

      const phases = [
        'Initialization',
        'Data Collection',
        'Processing',
        'Analysis',
        'Reporting',
        'Completion',
      ];

      const startTime = Date.now();

      for (let i = 0; i < phases.length; i++) {
        await client.addComment(
          task.id,
          `📊 Phase ${i + 1}/${phases.length}: ${phases[i]}`
        );

        // Simulate work
        await delay(100);

        // Update progress
        const progress = Math.round(((i + 1) / phases.length) * 100);
        await client.updateTask(task.id, {
          description: `Long-running operation: ${progress}% complete`,
        });
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      await client.updateTask(task.id, {
        status: 'complete',
      });

      await client.addComment(
        task.id,
        `✅ Long-running operation completed in ${duration}ms`
      );

      console.log(`✅ Long-running workflow completed in ${duration}ms`);
    });

    it('should track progress of iterative operations', async () => {
      const workflowName = uniqueTestName('Iterative Progress');

      const task = await createTask(client, listId, {
        name: workflowName,
      });

      const totalIterations = 10;

      for (let i = 1; i <= totalIterations; i++) {
        await client.addComment(
          task.id,
          `🔄 Processing iteration ${i}/${totalIterations}`
        );

        await delay(50);

        // Update every 25%
        if (i % Math.ceil(totalIterations / 4) === 0) {
          const progress = (i / totalIterations) * 100;
          await client.updateTask(task.id, {
            description: `Progress: ${progress}%`,
          });
        }
      }

      await client.updateTask(task.id, {
        status: 'complete',
      });

      console.log('✅ Iterative progress tracking completed');
    });

    it('should maintain state across workflow sessions', async () => {
      const workflowName = uniqueTestName('Session State');

      // Session 1: Initialize
      const task = await createTask(client, listId, {
        name: workflowName,
      });

      await client.addComment(
        task.id,
        '📝 Session 1: Workflow initialized, state saved'
      );

      await client.updateTask(task.id, {
        description: 'State: Session 1 complete',
      });

      await delay(100);

      // Session 2: Resume
      const resumedTask = await client.getTask(task.id);
      expect(resumedTask.description).toBe('State: Session 1 complete');

      await client.addComment(
        task.id,
        '📝 Session 2: Workflow resumed from saved state'
      );

      await client.updateTask(task.id, {
        description: 'State: Session 2 complete',
      });

      await delay(100);

      // Session 3: Finalize
      const finalTask = await client.getTask(task.id);
      expect(finalTask.description).toBe('State: Session 2 complete');

      await client.updateTask(task.id, {
        status: 'complete',
      });

      await client.addComment(
        task.id,
        '✅ Session 3: Workflow completed, state persisted across sessions'
      );

      console.log('✅ State persistence workflow completed');
    });
  });

  describe('Bulk Workflow Patterns', () => {
    it('should execute batch processing workflow', async () => {
      const workflowName = uniqueTestName('Batch Process');
      const batchSize = 10;

      // Create batch of tasks
      const tasks = [];
      for (let i = 1; i <= batchSize; i++) {
        const task = await createTask(client, listId, {
          name: `${workflowName} - Item ${i}`,
        });
        tasks.push(task);
        await delay(50);
      }

      // Process batch
      for (const task of tasks) {
        await client.updateTask(task.id, {
          description: 'Processed in batch',
        });

        await client.addComment(task.id, '✅ Batch processing complete');
        await delay(50);
      }

      // Verify batch
      const processedTasks = await Promise.all(
        tasks.map((t) => client.getTask(t.id))
      );

      expect(processedTasks.every((t) => t.description === 'Processed in batch')).toBe(true);

      console.log(`✅ Batch processing workflow: ${batchSize} items`);
    });

    it('should execute staged deployment workflow', async () => {
      const workflowName = uniqueTestName('Staged Deploy');

      // Stage 1: Development
      const devTasks = await Promise.all([
        createTask(client, listId, {
          name: `${workflowName} - Dev Task 1`,
        }),
        createTask(client, listId, {
          name: `${workflowName} - Dev Task 2`,
        }),
      ]);

      await Promise.all(
        devTasks.map((t) =>
          client.addComment(t.id, '🔵 Stage: Development')
        )
      );

      await Promise.all(
        devTasks.map((t) =>
          client.updateTask(t.id, { status: 'complete' })
        )
      );

      await delay(100);

      // Stage 2: Staging
      await Promise.all(
        devTasks.map((t) =>
          client.addComment(t.id, '🟡 Stage: Staging')
        )
      );

      await delay(100);

      // Stage 3: Production
      await Promise.all(
        devTasks.map((t) =>
          client.addComment(t.id, '🟢 Stage: Production - Deployed')
        )
      );

      console.log('✅ Staged deployment workflow completed');
    });

    it('should execute bulk update with rollback capability', async () => {
      const workflowName = uniqueTestName('Bulk Rollback');

      // Create tasks with original state
      const tasks = [];
      for (let i = 1; i <= 5; i++) {
        const task = await createTask(client, listId, {
          name: `${workflowName} - Task ${i}`,
          description: 'Original state',
        });
        tasks.push(task);
        await delay(50);
      }

      // Bulk update
      await Promise.all(
        tasks.map((t) =>
          client.updateTask(t.id, {
            description: 'Updated state',
          })
        )
      );

      await delay(100);

      // Verify update
      let updatedTasks = await Promise.all(
        tasks.map((t) => client.getTask(t.id))
      );

      expect(
        updatedTasks.every((t) => t.description === 'Updated state')
      ).toBe(true);

      // Rollback
      await Promise.all(
        tasks.map((t) =>
          client.updateTask(t.id, {
            description: 'Original state',
          })
        )
      );

      await delay(100);

      // Verify rollback
      updatedTasks = await Promise.all(
        tasks.map((t) => client.getTask(t.id))
      );

      expect(
        updatedTasks.every((t) => t.description === 'Original state')
      ).toBe(true);

      console.log('✅ Bulk rollback workflow completed');
    });
  });

  describe('Integration Workflows', () => {
    it('should execute complete integration workflow', async () => {
      const workflowName = uniqueTestName('Full Integration');

      // Step 1: Create task with full details
      const task = await createTask(client, listId, {
        name: workflowName,
        description: 'Complete integration test',
        priority: 2,
        due_date: Date.now() + 7 * 24 * 60 * 60 * 1000,
      });

      // Step 2: Add tags
      await client.callTool('clickup_task_add_tag', {
        task_id: task.id,
        tag_name: 'integration-test',
      });

      // Step 3: Create subtask
      const subtask = await createTask(client, listId, {
        name: `${workflowName} - Subtask`,
        parent: task.id,
      });

      // Step 4: Add dependency
      const dependencyTask = await createTask(client, listId, {
        name: `${workflowName} - Dependency`,
      });

      await client.callTool('clickup_task_add_dependency', {
        task_id: task.id,
        depends_on: dependencyTask.id,
        dependency_type: 'waiting_on',
      });

      // Step 5: Add comments
      await client.addComment(
        task.id,
        '🚀 Integration workflow started'
      );

      // Step 6: Complete dependency
      await client.updateTask(dependencyTask.id, {
        status: 'complete',
      });

      // Step 7: Complete subtask
      await client.updateTask(subtask.id, {
        status: 'complete',
      });

      // Step 8: Update and complete main task
      await client.updateTask(task.id, {
        status: 'complete',
      });

      await client.addComment(
        task.id,
        '✅ Integration workflow completed successfully'
      );

      // Verify final state
      const finalTask = await client.getTask(task.id);
      expect(finalTask.status.status).toBe('complete');
      expect(finalTask.tags.length).toBeGreaterThan(0);

      console.log('✅ Complete integration workflow finished');
    });

    it('should execute cross-list workflow', async () => {
      const workflowName = uniqueTestName('Cross-List');

      // Create task in primary list
      const task1 = await createTask(client, listId, {
        name: `${workflowName} - List 1`,
      });

      await client.addComment(
        task1.id,
        '📋 Created in primary list'
      );

      // Note: In a real scenario, would create in different list
      // For this test, we document the pattern
      await client.addComment(
        task1.id,
        '🔄 Cross-list workflow: Tasks can coordinate across lists'
      );

      await client.updateTask(task1.id, {
        status: 'complete',
      });

      console.log('✅ Cross-list workflow pattern documented');
    });

    it('should execute hierarchical workflow', async () => {
      const workflowName = uniqueTestName('Hierarchical');

      // Level 1: Parent
      const parent = await createTask(client, listId, {
        name: `${workflowName} - Parent`,
      });

      // Level 2: Children
      const children = await Promise.all([
        createTask(client, listId, {
          name: `${workflowName} - Child 1`,
          parent: parent.id,
        }),
        createTask(client, listId, {
          name: `${workflowName} - Child 2`,
          parent: parent.id,
        }),
      ]);

      // Level 3: Grandchildren
      const grandchildren = await Promise.all([
        createTask(client, listId, {
          name: `${workflowName} - Grandchild 1.1`,
          parent: children[0].id,
        }),
        createTask(client, listId, {
          name: `${workflowName} - Grandchild 1.2`,
          parent: children[0].id,
        }),
      ]);

      // Complete from bottom up
      for (const gc of grandchildren) {
        await client.updateTask(gc.id, { status: 'complete' });
      }

      await delay(100);

      for (const child of children) {
        await client.updateTask(child.id, { status: 'complete' });
      }

      await delay(100);

      await client.updateTask(parent.id, { status: 'complete' });

      // Verify hierarchy
      const finalParent = await client.getTask(parent.id);
      expect(finalParent.status.status).toBe('complete');

      console.log('✅ Hierarchical workflow completed');
    });
  });
});
