/**
 * Integration Tests: Comment Management
 *
 * Tests the comment management capabilities through MCP server:
 * - Creating comments on tasks
 * - Updating comment text
 * - Deleting comments
 * - Retrieving task comments
 * - Comment threading (replies)
 * - Error handling
 *
 * These tests verify the comment features that enable AI agents
 * to communicate and annotate task progress.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MCPTestClient, createMCPTestClient } from './mcp-test-client';
import { setupTestEnvironment, teardownTestEnvironment } from './setup';
import { createTask, uniqueTestName, delay } from './utils';

describe('Comment Management Integration Tests', () => {
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

  describe('Basic Comment Operations', () => {
    let testTaskId: string;

    beforeAll(async () => {
      // Create a task for comment tests
      const task = await createTask(client, listId, {
        name: uniqueTestName('Comment Test Task'),
        description: 'Task for testing comment operations'
      });
      testTaskId = task.id;
    });

    it('should create comment on task', async () => {
      const commentText = 'This is a test comment created via MCP integration test';

      const comment = await client.addComment(testTaskId, commentText);

      expect(comment).toBeDefined();
      expect(comment.id).toBeDefined();
      expect(comment.comment_text).toBe(commentText);
      expect(comment.user).toBeDefined();
      expect(comment.date).toBeDefined();
    });

    it('should create multiple comments on task', async () => {
      const comments = [
        'First comment on task',
        'Second comment on task',
        'Third comment on task'
      ];

      const createdComments = [];

      for (const text of comments) {
        const comment = await client.addComment(testTaskId, text);
        createdComments.push(comment);
        await delay(100); // Small delay to ensure order
      }

      expect(createdComments).toHaveLength(3);
      expect(createdComments[0].comment_text).toBe(comments[0]);
      expect(createdComments[1].comment_text).toBe(comments[1]);
      expect(createdComments[2].comment_text).toBe(comments[2]);
    });

    it('should retrieve all comments for task', async () => {
      const result = await client.callTool('clickup_task_get_comments', {
        task_id: testTaskId
      });

      expect(result.isError).toBe(false);
      const comments = client.parseJsonResult(result);

      expect(comments).toBeDefined();
      expect(Array.isArray(comments)).toBe(true);
      expect(comments.length).toBeGreaterThan(0);

      // Verify comment structure
      const firstComment = comments[0];
      expect(firstComment.id).toBeDefined();
      expect(firstComment.comment_text).toBeDefined();
      expect(firstComment.user).toBeDefined();
      expect(firstComment.date).toBeDefined();
    });

    it('should update comment text', async () => {
      // Create a comment to update
      const originalText = 'Original comment text';
      const comment = await client.addComment(testTaskId, originalText);

      const commentId = comment.id;

      // Update the comment
      const updatedText = 'Updated comment text - modified via integration test';

      const result = await client.callTool('clickup_task_update_comment', {
        comment_id: commentId,
        comment_text: updatedText
      });

      expect(result.isError).toBe(false);
      const updatedComment = client.parseJsonResult(result);

      expect(updatedComment).toBeDefined();
      expect(updatedComment.id).toBe(commentId);
      expect(updatedComment.comment_text).toBe(updatedText);
    });

    it('should delete comment', async () => {
      // Create a comment to delete
      const comment = await client.addComment(testTaskId, 'Comment to be deleted');
      const commentId = comment.id;

      // Delete the comment
      const result = await client.callTool('clickup_task_delete_comment', {
        comment_id: commentId
      });

      expect(result.isError).toBe(false);

      // Verify comment is deleted by getting all comments
      const commentsResult = await client.callTool('clickup_task_get_comments', {
        task_id: testTaskId
      });

      const comments = client.parseJsonResult(commentsResult);
      const deletedComment = comments.find((c: any) => c.id === commentId);

      expect(deletedComment).toBeUndefined();
    });

    it('should create comment with formatting', async () => {
      const formattedText = `# Heading

**Bold text** and *italic text*

- Bullet point 1
- Bullet point 2

[Link to ClickUp](https://clickup.com)

\`inline code\`

\`\`\`javascript
const test = "code block";
\`\`\`
`;

      const comment = await client.addComment(testTaskId, formattedText);

      expect(comment).toBeDefined();
      expect(comment.comment_text).toBe(formattedText);
    });

    it('should create comment with mentions', async () => {
      const commentText = '@all This comment mentions all team members';

      const comment = await client.addComment(testTaskId, commentText);

      expect(comment).toBeDefined();
      expect(comment.comment_text).toContain('@all');
    });
  });

  describe('Comment Threading', () => {
    let testTaskId: string;
    let parentCommentId: string;

    beforeAll(async () => {
      // Create a task for threading tests
      const task = await createTask(client, listId, {
        name: uniqueTestName('Comment Threading Task'),
        description: 'Task for testing comment threading'
      });
      testTaskId = task.id;

      // Create parent comment
      const parentComment = await client.addComment(
        testTaskId,
        'Parent comment - start of thread'
      );
      parentCommentId = parentComment.id;
    });

    it('should create threaded comment (reply)', async () => {
      const replyText = 'This is a reply to the parent comment';

      const result = await client.callTool('clickup_task_add_comment', {
        task_id: testTaskId,
        comment_text: replyText,
        parent: parentCommentId
      });

      expect(result.isError).toBe(false);
      const reply = client.parseJsonResult(result);

      expect(reply).toBeDefined();
      expect(reply.id).toBeDefined();
      expect(reply.comment_text).toBe(replyText);
      expect(reply.parent).toBe(parentCommentId);
    });

    it('should create multiple replies in thread', async () => {
      const replies = [
        'First reply in thread',
        'Second reply in thread',
        'Third reply in thread'
      ];

      const createdReplies = [];

      for (const text of replies) {
        const result = await client.callTool('clickup_task_add_comment', {
          task_id: testTaskId,
          comment_text: text,
          parent: parentCommentId
        });

        expect(result.isError).toBe(false);
        const reply = client.parseJsonResult(result);
        createdReplies.push(reply);

        await delay(100); // Ensure order
      }

      expect(createdReplies).toHaveLength(3);

      // Verify all replies reference the same parent
      for (const reply of createdReplies) {
        expect(reply.parent).toBe(parentCommentId);
      }
    });

    it('should retrieve comments with thread structure', async () => {
      const result = await client.callTool('clickup_task_get_comments', {
        task_id: testTaskId
      });

      expect(result.isError).toBe(false);
      const comments = client.parseJsonResult(result);

      expect(comments).toBeDefined();
      expect(Array.isArray(comments)).toBe(true);

      // Find parent comment
      const parentComment = comments.find((c: any) => c.id === parentCommentId);
      expect(parentComment).toBeDefined();

      // Find replies
      const replies = comments.filter((c: any) => c.parent === parentCommentId);
      expect(replies.length).toBeGreaterThan(0);
    });

    it('should create nested thread (reply to reply)', async () => {
      // Create first-level reply
      const firstReply = await client.addComment(
        testTaskId,
        'First level reply',
        parentCommentId
      );

      await delay(100);

      // Create second-level reply (reply to reply)
      const result = await client.callTool('clickup_task_add_comment', {
        task_id: testTaskId,
        comment_text: 'Second level reply - nested',
        parent: firstReply.id
      });

      expect(result.isError).toBe(false);
      const nestedReply = client.parseJsonResult(result);

      expect(nestedReply).toBeDefined();
      expect(nestedReply.parent).toBe(firstReply.id);
    });
  });

  describe('Comment Metadata', () => {
    let testTaskId: string;

    beforeAll(async () => {
      const task = await createTask(client, listId, {
        name: uniqueTestName('Comment Metadata Task')
      });
      testTaskId = task.id;
    });

    it('should include user information in comment', async () => {
      const comment = await client.addComment(testTaskId, 'Test comment');

      expect(comment.user).toBeDefined();
      expect(comment.user.id).toBeDefined();
      expect(comment.user.username).toBeDefined();
      expect(comment.user.email).toBeDefined();
    });

    it('should include timestamp in comment', async () => {
      const beforeTime = Date.now();
      await delay(100);

      const comment = await client.addComment(testTaskId, 'Test comment');

      await delay(100);
      const afterTime = Date.now();

      expect(comment.date).toBeDefined();

      // Convert ClickUp timestamp (milliseconds) to number
      const commentTime = parseInt(comment.date);

      expect(commentTime).toBeGreaterThanOrEqual(beforeTime);
      expect(commentTime).toBeLessThanOrEqual(afterTime);
    });

    it('should track comment edit history', async () => {
      // Create comment
      const comment = await client.addComment(testTaskId, 'Original text');
      const originalDate = comment.date;

      await delay(500); // Wait before editing

      // Update comment
      const result = await client.callTool('clickup_task_update_comment', {
        comment_id: comment.id,
        comment_text: 'Updated text'
      });

      const updatedComment = client.parseJsonResult(result);

      expect(updatedComment.date).toBeDefined();
      // Date should be updated (greater than original)
      expect(parseInt(updatedComment.date)).toBeGreaterThanOrEqual(parseInt(originalDate));
    });
  });

  describe('Comment Use Cases', () => {
    let testTaskId: string;

    beforeAll(async () => {
      const task = await createTask(client, listId, {
        name: uniqueTestName('Comment Use Case Task')
      });
      testTaskId = task.id;
    });

    it('should use comments for agent execution log', async () => {
      // Simulate AI agent logging progress via comments
      const logEntries = [
        '🤖 Agent started execution at ' + new Date().toISOString(),
        '📊 Processing 100 records...',
        '✅ Completed 50 records (50%)',
        '✅ Completed 100 records (100%)',
        '🎉 Execution completed successfully'
      ];

      const comments = [];
      for (const log of logEntries) {
        const comment = await client.addComment(testTaskId, log);
        comments.push(comment);
        await delay(100);
      }

      expect(comments).toHaveLength(5);

      // Verify log sequence
      const result = await client.callTool('clickup_task_get_comments', {
        task_id: testTaskId
      });

      const allComments = client.parseJsonResult(result);
      expect(allComments.length).toBeGreaterThanOrEqual(5);
    });

    it('should use comments for multi-agent communication', async () => {
      // Simulate multiple agents coordinating via comments
      const agentA = await client.addComment(
        testTaskId,
        '🤖 Agent A: Starting data collection phase'
      );

      await delay(100);

      const agentB = await client.addComment(
        testTaskId,
        '🤖 Agent B: Ready to process data when Agent A completes',
        agentA.id // Reply to Agent A
      );

      await delay(100);

      const agentAUpdate = await client.addComment(
        testTaskId,
        '🤖 Agent A: Data collection complete. 1000 records collected.',
        agentA.id // Reply in same thread
      );

      await delay(100);

      const agentBStart = await client.addComment(
        testTaskId,
        '🤖 Agent B: Starting data processing now',
        agentB.id // Reply to own comment
      );

      // Verify agent coordination
      const result = await client.callTool('clickup_task_get_comments', {
        task_id: testTaskId
      });

      const comments = client.parseJsonResult(result);
      const agentComments = comments.filter((c: any) =>
        c.comment_text.includes('Agent A') || c.comment_text.includes('Agent B')
      );

      expect(agentComments.length).toBeGreaterThanOrEqual(4);
    });

    it('should use comments for error reporting', async () => {
      const errorReport = `❌ Execution Error

**Error Type:** ValidationError
**Message:** Invalid input format detected
**Timestamp:** ${new Date().toISOString()}
**Stack Trace:**
\`\`\`
at validateInput (line 45)
at processData (line 120)
at main (line 200)
\`\`\`

**Action Required:** Please review input data format`;

      const comment = await client.addComment(testTaskId, errorReport);

      expect(comment).toBeDefined();
      expect(comment.comment_text).toContain('ValidationError');
      expect(comment.comment_text).toContain('Stack Trace');
    });

    it('should use comments for status updates', async () => {
      const statusUpdates = [
        '⏳ Status: Queued - Waiting for resources',
        '🔄 Status: In Progress - Processing started',
        '⚠️ Status: Warning - High memory usage detected',
        '✅ Status: Complete - All operations successful'
      ];

      const comments = [];
      for (const status of statusUpdates) {
        const comment = await client.addComment(testTaskId, status);
        comments.push(comment);
        await delay(100);
      }

      expect(comments).toHaveLength(4);

      // Verify latest status
      const latestComment = comments[comments.length - 1];
      expect(latestComment.comment_text).toContain('Complete');
    });
  });

  describe('Error Handling', () => {
    it('should fail to create comment with invalid task ID', async () => {
      const invalidTaskId = 'invalid_task_xyz';

      const result = await client.callTool('clickup_task_add_comment', {
        task_id: invalidTaskId,
        comment_text: 'This should fail'
      });

      expect(result.isError).toBe(true);
      const errorText = client.parseTextResult(result);
      expect(errorText.toLowerCase()).toMatch(/error|not found|invalid/);
    });

    it('should fail to update non-existent comment', async () => {
      const nonExistentCommentId = 'invalid_comment_999';

      const result = await client.callTool('clickup_task_update_comment', {
        comment_id: nonExistentCommentId,
        comment_text: 'This should fail'
      });

      expect(result.isError).toBe(true);
      const errorText = client.parseTextResult(result);
      expect(errorText.toLowerCase()).toMatch(/error|not found|invalid/);
    });

    it('should fail to delete non-existent comment', async () => {
      const nonExistentCommentId = 'invalid_comment_999';

      const result = await client.callTool('clickup_task_delete_comment', {
        comment_id: nonExistentCommentId
      });

      expect(result.isError).toBe(true);
      const errorText = client.parseTextResult(result);
      expect(errorText.toLowerCase()).toMatch(/error|not found|invalid/);
    });

    it('should fail to get comments for invalid task ID', async () => {
      const invalidTaskId = 'invalid_task_xyz';

      const result = await client.callTool('clickup_task_get_comments', {
        task_id: invalidTaskId
      });

      expect(result.isError).toBe(true);
      const errorText = client.parseTextResult(result);
      expect(errorText.toLowerCase()).toMatch(/error|not found|invalid/);
    });

    it('should fail to create comment without required text', async () => {
      const task = await createTask(client, listId, {
        name: uniqueTestName('Error Test Task')
      });

      const result = await client.callTool('clickup_task_add_comment', {
        task_id: task.id
        // Missing comment_text field
      });

      expect(result.isError).toBe(true);
      const errorText = client.parseTextResult(result);
      expect(errorText.toLowerCase()).toMatch(/error|required|text/);
    });

    it('should fail to create comment with empty text', async () => {
      const task = await createTask(client, listId, {
        name: uniqueTestName('Error Test Task')
      });

      const result = await client.callTool('clickup_task_add_comment', {
        task_id: task.id,
        comment_text: ''
      });

      // Depending on API validation, this might error or succeed
      // If it succeeds, verify empty text handling
      if (!result.isError) {
        const comment = client.parseJsonResult(result);
        expect(comment.comment_text).toBe('');
      }
    });

    it('should handle comment with invalid parent ID', async () => {
      const task = await createTask(client, listId, {
        name: uniqueTestName('Error Test Task')
      });

      const result = await client.callTool('clickup_task_add_comment', {
        task_id: task.id,
        comment_text: 'Reply to invalid parent',
        parent: 'invalid_comment_999'
      });

      // Should either error or create root comment
      // Different behavior depending on API validation
      if (result.isError) {
        const errorText = client.parseTextResult(result);
        expect(errorText.toLowerCase()).toMatch(/error|not found|invalid|parent/);
      } else {
        const comment = client.parseJsonResult(result);
        expect(comment).toBeDefined();
      }
    });
  });

  describe('Comment Ordering', () => {
    let testTaskId: string;

    beforeAll(async () => {
      const task = await createTask(client, listId, {
        name: uniqueTestName('Comment Ordering Task')
      });
      testTaskId = task.id;
    });

    it('should retrieve comments in chronological order', async () => {
      const comments = [
        'First comment (oldest)',
        'Second comment',
        'Third comment',
        'Fourth comment (newest)'
      ];

      const createdComments = [];
      for (const text of comments) {
        const comment = await client.addComment(testTaskId, text);
        createdComments.push(comment);
        await delay(200); // Ensure distinct timestamps
      }

      // Get all comments
      const result = await client.callTool('clickup_task_get_comments', {
        task_id: testTaskId
      });

      const retrievedComments = client.parseJsonResult(result);

      // Verify comments are in order (oldest to newest or newest to oldest)
      // The actual order depends on ClickUp API behavior
      expect(retrievedComments.length).toBeGreaterThanOrEqual(4);

      // Check timestamps are in sequence
      const timestamps = retrievedComments
        .slice(0, 4)
        .map((c: any) => parseInt(c.date));

      const isAscending = timestamps.every((val: number, i: number, arr: number[]) =>
        i === 0 || val >= arr[i - 1]
      );

      const isDescending = timestamps.every((val: number, i: number, arr: number[]) =>
        i === 0 || val <= arr[i - 1]
      );

      expect(isAscending || isDescending).toBe(true);
    });
  });

  describe('Bulk Comment Operations', () => {
    let testTaskId: string;

    beforeAll(async () => {
      const task = await createTask(client, listId, {
        name: uniqueTestName('Bulk Comments Task')
      });
      testTaskId = task.id;
    });

    it('should create multiple comments efficiently', async () => {
      const commentCount = 10;
      const startTime = Date.now();

      const comments = [];
      for (let i = 1; i <= commentCount; i++) {
        const comment = await client.addComment(
          testTaskId,
          `Bulk comment ${i} of ${commentCount}`
        );
        comments.push(comment);
        await delay(50); // Small delay for rate limiting
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(comments).toHaveLength(commentCount);
      console.log(`Created ${commentCount} comments in ${duration}ms (${duration/commentCount}ms per comment)`);
    });

    it('should retrieve large comment thread', async () => {
      // Get all comments (should include bulk comments from previous test)
      const result = await client.callTool('clickup_task_get_comments', {
        task_id: testTaskId
      });

      expect(result.isError).toBe(false);
      const comments = client.parseJsonResult(result);

      expect(comments).toBeDefined();
      expect(comments.length).toBeGreaterThanOrEqual(10);
    });
  });
});
