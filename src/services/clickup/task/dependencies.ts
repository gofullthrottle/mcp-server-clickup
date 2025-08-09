import { BaseClickUpService } from '../base.js';

export interface TaskDependency {
  task_id: string;
  depends_on?: string;
  dependency_of?: string;
  custom_task_ids?: boolean;
  team_id?: string;
}

export interface TaskLink {
  task_id: string;
  links_to: string;
  custom_task_ids?: boolean;
  team_id?: string;
}

export interface DependencyResponse {
  id: string;
  name: string;
  status: any;
  dependencies?: string[];
  linked_tasks?: Array<{
    task_id: string;
    link_id: string;
    relationship_type: string;
  }>;
}

export class TaskDependencyService extends BaseClickUpService {
  /**
   * Add a dependency between two tasks
   * @param taskId The task ID
   * @param dependsOn The task ID that this task depends on (optional)
   * @param dependencyOf The task ID that depends on this task (optional)
   * @param useCustomTaskIds Whether to use custom task IDs
   */
  async addDependency(
    taskId: string,
    dependsOn?: string,
    dependencyOf?: string,
    useCustomTaskIds: boolean = false
  ): Promise<DependencyResponse> {
    try {
      if (!dependsOn && !dependencyOf) {
        throw new Error('Either depends_on or dependency_of must be provided');
      }

      if (dependsOn && dependencyOf) {
        throw new Error('Only one of depends_on or dependency_of can be provided');
      }

      const params: any = {};
      const data: any = {};

      if (useCustomTaskIds) {
        params.custom_task_ids = 'true';
        params.team_id = this.teamId;
      }

      if (dependsOn) {
        data.depends_on = dependsOn;
      } else if (dependencyOf) {
        data.dependency_of = dependencyOf;
      }

      const response = await this.makeRequest<DependencyResponse>(async () => {
        const result = await this.client.post(`/task/${taskId}/dependency`, data, { params });
        return result.data;
      });

      return response;
    } catch (error) {
      throw new Error(`Failed to add dependency for task ${taskId}: ${error.message}`);
    }
  }

  /**
   * Remove a dependency between two tasks
   * @param taskId The task ID
   * @param dependsOn The task ID that this task depends on (optional)
   * @param dependencyOf The task ID that depends on this task (optional)
   * @param useCustomTaskIds Whether to use custom task IDs
   */
  async removeDependency(
    taskId: string,
    dependsOn?: string,
    dependencyOf?: string,
    useCustomTaskIds: boolean = false
  ): Promise<void> {
    try {
      if (!dependsOn && !dependencyOf) {
        throw new Error('Either depends_on or dependency_of must be provided');
      }

      if (dependsOn && dependencyOf) {
        throw new Error('Only one of depends_on or dependency_of can be provided');
      }

      const params: any = {};

      if (useCustomTaskIds) {
        params.custom_task_ids = 'true';
        params.team_id = this.teamId;
      }

      if (dependsOn) {
        params.depends_on = dependsOn;
      } else if (dependencyOf) {
        params.dependency_of = dependencyOf;
      }

      await this.makeRequest(async () => {
        return await this.client.delete(`/task/${taskId}/dependency`, { params });
      });
    } catch (error) {
      throw new Error(`Failed to remove dependency for task ${taskId}: ${error.message}`);
    }
  }

  /**
   * Add a link between two tasks (not a dependency, just a relationship)
   * @param taskId The source task ID
   * @param linksTo The target task ID to link to
   * @param useCustomTaskIds Whether to use custom task IDs
   */
  async addTaskLink(
    taskId: string,
    linksTo: string,
    useCustomTaskIds: boolean = false
  ): Promise<DependencyResponse> {
    try {
      const params: any = {};

      if (useCustomTaskIds) {
        params.custom_task_ids = 'true';
        params.team_id = this.teamId;
      }

      const response = await this.makeRequest<DependencyResponse>(async () => {
        const result = await this.client.post(`/task/${taskId}/link/${linksTo}`, {}, { params });
        return result.data;
      });

      return response;
    } catch (error) {
      throw new Error(`Failed to add link between tasks ${taskId} and ${linksTo}: ${error.message}`);
    }
  }

  /**
   * Remove a link between two tasks
   * @param taskId The source task ID
   * @param linksTo The target task ID to unlink from
   * @param useCustomTaskIds Whether to use custom task IDs
   */
  async removeTaskLink(
    taskId: string,
    linksTo: string,
    useCustomTaskIds: boolean = false
  ): Promise<void> {
    try {
      const params: any = {};

      if (useCustomTaskIds) {
        params.custom_task_ids = 'true';
        params.team_id = this.teamId;
      }

      await this.makeRequest(async () => {
        return await this.client.delete(`/task/${taskId}/link/${linksTo}`, { params });
      });
    } catch (error) {
      throw new Error(`Failed to remove link between tasks ${taskId} and ${linksTo}: ${error.message}`);
    }
  }

  /**
   * Get all dependencies for a task
   * Note: This fetches the full task details which includes dependencies
   * @param taskId The task ID
   * @param useCustomTaskIds Whether to use custom task IDs
   */
  async getTaskDependencies(
    taskId: string,
    useCustomTaskIds: boolean = false
  ): Promise<{
    dependencies: string[];
    linked_tasks: Array<{
      task_id: string;
      link_id: string;
      relationship_type: string;
    }>;
  }> {
    try {
      const params: any = {
        include_subtasks: false
      };

      if (useCustomTaskIds) {
        params.custom_task_ids = 'true';
        params.team_id = this.teamId;
      }

      const response = await this.makeRequest<any>(async () => {
        const result = await this.client.get(`/task/${taskId}`, { params });
        return result.data;
      });

      return {
        dependencies: response.dependencies || [],
        linked_tasks: response.linked_tasks || []
      };
    } catch (error) {
      throw new Error(`Failed to get dependencies for task ${taskId}: ${error.message}`);
    }
  }

  /**
   * Get tasks that depend on the given task
   * @param taskId The task ID
   * @param useCustomTaskIds Whether to use custom task IDs
   */
  async getDependentTasks(
    taskId: string,
    useCustomTaskIds: boolean = false
  ): Promise<string[]> {
    try {
      // This would require searching through all tasks to find which ones depend on this task
      // The ClickUp API doesn't provide a direct endpoint for this
      // For now, we'll throw an informative error
      throw new Error(
        'Getting dependent tasks is not directly supported by the ClickUp API. ' +
        'You would need to search through all tasks in the workspace to find dependencies.'
      );
    } catch (error) {
      throw new Error(`Failed to get dependent tasks for task ${taskId}: ${error.message}`);
    }
  }
}