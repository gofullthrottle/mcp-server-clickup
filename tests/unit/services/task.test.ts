import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TaskService } from '../../../src/services/clickup/task/index';
import axios from 'axios';

vi.mock('axios');

describe('TaskService', () => {
  let taskService: TaskService;
  const mockApiKey = 'test_api_key';
  const mockTeamId = 'test_team_id';

  beforeEach(() => {
    taskService = new TaskService(mockApiKey, mockTeamId);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Task CRUD Operations', () => {
    describe('createTask', () => {
      it('should create a task with required fields', async () => {
        const mockTask = {
          id: 'task123',
          name: 'Test Task',
          status: { status: 'to do' }
        };

        vi.mocked(axios.post).mockResolvedValueOnce({ data: mockTask });

        const result = await taskService.createTask('list123', {
          name: 'Test Task',
          description: 'Test Description'
        });

        expect(result).toEqual(mockTask);
        expect(axios.post).toHaveBeenCalledWith(
          expect.stringContaining('/list/list123/task'),
          expect.objectContaining({
            name: 'Test Task',
            description: 'Test Description'
          }),
          expect.objectContaining({
            headers: expect.objectContaining({
              'Authorization': mockApiKey
            })
          })
        );
      });

      it('should parse natural language dates', async () => {
        const mockTask = {
          id: 'task123',
          name: 'Test Task',
          due_date: '1735689600000'
        };

        vi.mocked(axios.post).mockResolvedValueOnce({ data: mockTask });

        const result = await taskService.createTask('list123', {
          name: 'Test Task',
          due_date: 'next Monday'
        });

        expect(axios.post).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            name: 'Test Task',
            due_date: expect.any(String)
          }),
          expect.any(Object)
        );
      });

      it('should handle custom fields', async () => {
        const mockTask = {
          id: 'task123',
          name: 'Test Task',
          custom_fields: [
            { id: 'field1', value: 'custom value' }
          ]
        };

        vi.mocked(axios.post).mockResolvedValueOnce({ data: mockTask });

        const result = await taskService.createTask('list123', {
          name: 'Test Task',
          custom_fields: [
            { id: 'field1', value: 'custom value' }
          ]
        });

        expect(result).toEqual(mockTask);
        expect(result.custom_fields).toHaveLength(1);
      });

      it('should handle API errors gracefully', async () => {
        vi.mocked(axios.post).mockRejectedValueOnce(new Error('API Error'));

        await expect(
          taskService.createTask('list123', { name: 'Test Task' })
        ).rejects.toThrow('API Error');
      });
    });

    describe('getTask', () => {
      it('should retrieve a task by ID', async () => {
        const mockTask = {
          id: 'task123',
          name: 'Test Task',
          description: 'Test Description'
        };

        vi.mocked(axios.get).mockResolvedValueOnce({ data: mockTask });

        const result = await taskService.getTask('task123');

        expect(result).toEqual(mockTask);
        expect(axios.get).toHaveBeenCalledWith(
          expect.stringContaining('/task/task123'),
          expect.objectContaining({
            headers: expect.objectContaining({
              'Authorization': mockApiKey
            })
          })
        );
      });

      it('should support custom task IDs', async () => {
        const mockTask = {
          id: 'actualId',
          custom_id: 'TASK-123',
          name: 'Test Task'
        };

        vi.mocked(axios.get).mockResolvedValueOnce({ data: mockTask });

        const result = await taskService.getTask('TASK-123', {
          custom_task_ids: true,
          team_id: mockTeamId
        });

        expect(axios.get).toHaveBeenCalledWith(
          expect.stringContaining('custom_task_ids=true'),
          expect.any(Object)
        );
      });
    });

    describe('updateTask', () => {
      it('should update task fields', async () => {
        const updatedTask = {
          id: 'task123',
          name: 'Updated Task',
          status: { status: 'complete' }
        };

        vi.mocked(axios.put).mockResolvedValueOnce({ data: updatedTask });

        const result = await taskService.updateTask('task123', {
          name: 'Updated Task',
          status: 'complete'
        });

        expect(result).toEqual(updatedTask);
        expect(axios.put).toHaveBeenCalledWith(
          expect.stringContaining('/task/task123'),
          expect.objectContaining({
            name: 'Updated Task',
            status: 'complete'
          }),
          expect.any(Object)
        );
      });
    });

    describe('deleteTask', () => {
      it('should delete a task', async () => {
        vi.mocked(axios.delete).mockResolvedValueOnce({ data: {} });

        await taskService.deleteTask('task123');

        expect(axios.delete).toHaveBeenCalledWith(
          expect.stringContaining('/task/task123'),
          expect.any(Object)
        );
      });
    });
  });

  describe('Bulk Operations', () => {
    describe('createBulkTasks', () => {
      it('should create multiple tasks in parallel', async () => {
        const tasks = [
          { name: 'Task 1', description: 'Desc 1' },
          { name: 'Task 2', description: 'Desc 2' },
          { name: 'Task 3', description: 'Desc 3' }
        ];

        const mockResponses = tasks.map((t, i) => ({
          data: { id: `task${i}`, ...t }
        }));

        mockResponses.forEach(response => {
          vi.mocked(axios.post).mockResolvedValueOnce(response);
        });

        const results = await taskService.createBulkTasks('list123', tasks);

        expect(results).toHaveLength(3);
        expect(axios.post).toHaveBeenCalledTimes(3);
      });

      it('should handle partial failures in bulk operations', async () => {
        const tasks = [
          { name: 'Task 1' },
          { name: 'Task 2' }
        ];

        vi.mocked(axios.post)
          .mockResolvedValueOnce({ data: { id: 'task1', name: 'Task 1' } })
          .mockRejectedValueOnce(new Error('Failed to create Task 2'));

        const results = await taskService.createBulkTasks('list123', tasks);

        expect(results).toHaveLength(2);
        expect(results[0].success).toBe(true);
        expect(results[1].success).toBe(false);
        expect(results[1].error).toContain('Failed to create Task 2');
      });
    });
  });

  describe('Task Comments', () => {
    it('should add a comment to a task', async () => {
      const mockComment = {
        id: 'comment123',
        comment_text: 'Test comment',
        user: { id: 'user123' }
      };

      vi.mocked(axios.post).mockResolvedValueOnce({ data: mockComment });

      const result = await taskService.comments.createComment('task123', {
        comment_text: 'Test comment'
      });

      expect(result).toEqual(mockComment);
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/task/task123/comment'),
        expect.objectContaining({
          comment_text: 'Test comment'
        }),
        expect.any(Object)
      );
    });

    it('should retrieve task comments', async () => {
      const mockComments = {
        comments: [
          { id: 'comment1', comment_text: 'Comment 1' },
          { id: 'comment2', comment_text: 'Comment 2' }
        ]
      };

      vi.mocked(axios.get).mockResolvedValueOnce({ data: mockComments });

      const result = await taskService.comments.getComments('task123');

      expect(result.comments).toHaveLength(2);
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/task/task123/comment'),
        expect.any(Object)
      );
    });
  });

  describe('Task Attachments', () => {
    it('should attach a file to a task', async () => {
      const mockAttachment = {
        id: 'attachment123',
        title: 'test.pdf',
        url: 'https://example.com/test.pdf'
      };

      vi.mocked(axios.post).mockResolvedValueOnce({ data: mockAttachment });

      const result = await taskService.attachments.attachFile('task123', {
        attachment: 'https://example.com/test.pdf',
        filename: 'test.pdf'
      });

      expect(result).toEqual(mockAttachment);
    });
  });

  describe('Custom Fields', () => {
    it('should update custom fields on a task', async () => {
      const updatedTask = {
        id: 'task123',
        custom_fields: [
          { id: 'field1', value: 'updated value' }
        ]
      };

      vi.mocked(axios.post).mockResolvedValueOnce({ data: updatedTask });

      const result = await taskService.customFields.setCustomField(
        'task123',
        'field1',
        'updated value'
      );

      expect(result).toEqual(updatedTask);
    });
  });

  describe('Task Search', () => {
    it('should search tasks in workspace', async () => {
      const mockSearchResults = {
        tasks: [
          { id: 'task1', name: 'Matching Task 1' },
          { id: 'task2', name: 'Matching Task 2' }
        ]
      };

      vi.mocked(axios.get).mockResolvedValueOnce({ data: mockSearchResults });

      const result = await taskService.search.searchTasks({
        query: 'Matching'
      });

      expect(result.tasks).toHaveLength(2);
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/team/' + mockTeamId + '/task'),
        expect.objectContaining({
          params: expect.objectContaining({
            query: 'Matching'
          })
        })
      );
    });
  });

  describe('Rate Limiting', () => {
    it('should respect rate limits between requests', async () => {
      const startTime = Date.now();
      
      vi.mocked(axios.post).mockResolvedValue({ data: { id: 'task1' } });

      await taskService.createTask('list123', { name: 'Task 1' });
      await taskService.createTask('list123', { name: 'Task 2' });

      const endTime = Date.now();
      const elapsedTime = endTime - startTime;

      // Should have some delay between requests (rate limiting)
      expect(elapsedTime).toBeGreaterThanOrEqual(100);
    });
  });
});