import { BaseClickUpService } from '../base.js';
export class TaskDependencyService extends BaseClickUpService {
    /**
     * Add a dependency between two tasks
     * @param taskId The task ID
     * @param dependsOn The task ID that this task depends on (optional)
     * @param dependencyOf The task ID that depends on this task (optional)
     * @param useCustomTaskIds Whether to use custom task IDs
     */
    async addDependency(taskId, dependsOn, dependencyOf, useCustomTaskIds = false) {
        try {
            if (!dependsOn && !dependencyOf) {
                throw new Error('Either depends_on or dependency_of must be provided');
            }
            if (dependsOn && dependencyOf) {
                throw new Error('Only one of depends_on or dependency_of can be provided');
            }
            const params = {};
            const data = {};
            if (useCustomTaskIds) {
                params.custom_task_ids = 'true';
                params.team_id = this.teamId;
            }
            if (dependsOn) {
                data.depends_on = dependsOn;
            }
            else if (dependencyOf) {
                data.dependency_of = dependencyOf;
            }
            const response = await this.makeRequest(async () => {
                const result = await this.client.post(`/task/${taskId}/dependency`, data, { params });
                return result.data;
            });
            return response;
        }
        catch (error) {
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
    async removeDependency(taskId, dependsOn, dependencyOf, useCustomTaskIds = false) {
        try {
            if (!dependsOn && !dependencyOf) {
                throw new Error('Either depends_on or dependency_of must be provided');
            }
            if (dependsOn && dependencyOf) {
                throw new Error('Only one of depends_on or dependency_of can be provided');
            }
            const params = {};
            if (useCustomTaskIds) {
                params.custom_task_ids = 'true';
                params.team_id = this.teamId;
            }
            if (dependsOn) {
                params.depends_on = dependsOn;
            }
            else if (dependencyOf) {
                params.dependency_of = dependencyOf;
            }
            await this.makeRequest(async () => {
                return await this.client.delete(`/task/${taskId}/dependency`, { params });
            });
        }
        catch (error) {
            throw new Error(`Failed to remove dependency for task ${taskId}: ${error.message}`);
        }
    }
    /**
     * Add a link between two tasks (not a dependency, just a relationship)
     * @param taskId The source task ID
     * @param linksTo The target task ID to link to
     * @param useCustomTaskIds Whether to use custom task IDs
     */
    async addTaskLink(taskId, linksTo, useCustomTaskIds = false) {
        try {
            const params = {};
            if (useCustomTaskIds) {
                params.custom_task_ids = 'true';
                params.team_id = this.teamId;
            }
            const response = await this.makeRequest(async () => {
                const result = await this.client.post(`/task/${taskId}/link/${linksTo}`, {}, { params });
                return result.data;
            });
            return response;
        }
        catch (error) {
            throw new Error(`Failed to add link between tasks ${taskId} and ${linksTo}: ${error.message}`);
        }
    }
    /**
     * Remove a link between two tasks
     * @param taskId The source task ID
     * @param linksTo The target task ID to unlink from
     * @param useCustomTaskIds Whether to use custom task IDs
     */
    async removeTaskLink(taskId, linksTo, useCustomTaskIds = false) {
        try {
            const params = {};
            if (useCustomTaskIds) {
                params.custom_task_ids = 'true';
                params.team_id = this.teamId;
            }
            await this.makeRequest(async () => {
                return await this.client.delete(`/task/${taskId}/link/${linksTo}`, { params });
            });
        }
        catch (error) {
            throw new Error(`Failed to remove link between tasks ${taskId} and ${linksTo}: ${error.message}`);
        }
    }
    /**
     * Get all dependencies for a task
     * Note: This fetches the full task details which includes dependencies
     * @param taskId The task ID
     * @param useCustomTaskIds Whether to use custom task IDs
     */
    async getTaskDependencies(taskId, useCustomTaskIds = false) {
        try {
            const params = {
                include_subtasks: false
            };
            if (useCustomTaskIds) {
                params.custom_task_ids = 'true';
                params.team_id = this.teamId;
            }
            const response = await this.makeRequest(async () => {
                const result = await this.client.get(`/task/${taskId}`, { params });
                return result.data;
            });
            return {
                dependencies: response.dependencies || [],
                linked_tasks: response.linked_tasks || []
            };
        }
        catch (error) {
            throw new Error(`Failed to get dependencies for task ${taskId}: ${error.message}`);
        }
    }
    /**
     * Get tasks that depend on the given task
     * @param taskId The task ID
     * @param useCustomTaskIds Whether to use custom task IDs
     */
    async getDependentTasks(taskId, useCustomTaskIds = false) {
        try {
            // This would require searching through all tasks to find which ones depend on this task
            // The ClickUp API doesn't provide a direct endpoint for this
            // For now, we'll throw an informative error
            throw new Error('Getting dependent tasks is not directly supported by the ClickUp API. ' +
                'You would need to search through all tasks in the workspace to find dependencies.');
        }
        catch (error) {
            throw new Error(`Failed to get dependent tasks for task ${taskId}: ${error.message}`);
        }
    }
}
