import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { taskService } from '../../services/shared.js';

export const dependencyTools: Tool[] = [
  {
    name: 'clickup_task_add_dependency',
    description: 'Add a dependency between two tasks. Use either depends_on (this task depends on another) or dependency_of (another task depends on this).',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: {
          type: 'string',
          description: 'The task ID to add dependency to'
        },
        depends_on: {
          type: 'string',
          description: 'The task ID that this task depends on (blocks this task)'
        },
        dependency_of: {
          type: 'string',
          description: 'The task ID that depends on this task (this task blocks another)'
        },
        use_custom_task_ids: {
          type: 'boolean',
          description: 'Whether to use custom task IDs (e.g., TASK-123)'
        }
      },
      required: ['task_id']
    }
  },
  {
    name: 'clickup_task_remove_dependency',
    description: 'Remove a dependency between two tasks.',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: {
          type: 'string',
          description: 'The task ID to remove dependency from'
        },
        depends_on: {
          type: 'string',
          description: 'The task ID that this task depends on'
        },
        dependency_of: {
          type: 'string',
          description: 'The task ID that depends on this task'
        },
        use_custom_task_ids: {
          type: 'boolean',
          description: 'Whether to use custom task IDs'
        }
      },
      required: ['task_id']
    }
  },
  {
    name: 'clickup_task_get_dependencies',
    description: 'Get all dependencies and linked tasks for a specific task.',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: {
          type: 'string',
          description: 'The task ID to get dependencies for'
        },
        use_custom_task_ids: {
          type: 'boolean',
          description: 'Whether to use custom task IDs'
        }
      },
      required: ['task_id']
    }
  },
  {
    name: 'clickup_task_add_link',
    description: 'Add a general link between two tasks (not a dependency, just a relationship).',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: {
          type: 'string',
          description: 'The source task ID'
        },
        links_to: {
          type: 'string',
          description: 'The target task ID to link to'
        },
        use_custom_task_ids: {
          type: 'boolean',
          description: 'Whether to use custom task IDs'
        }
      },
      required: ['task_id', 'links_to']
    }
  },
  {
    name: 'clickup_task_remove_link',
    description: 'Remove a link between two tasks.',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: {
          type: 'string',
          description: 'The source task ID'
        },
        links_to: {
          type: 'string',
          description: 'The target task ID to unlink from'
        },
        use_custom_task_ids: {
          type: 'boolean',
          description: 'Whether to use custom task IDs'
        }
      },
      required: ['task_id', 'links_to']
    }
  }
];

export async function handleDependencyTool(
  toolName: string,
  args: any
): Promise<any> {
  switch (toolName) {
    case 'clickup_task_add_dependency': {
      const validated = z.object({
        task_id: z.string(),
        depends_on: z.string().optional(),
        dependency_of: z.string().optional(),
        use_custom_task_ids: z.boolean().optional()
      }).parse(args);

      if (!validated.depends_on && !validated.dependency_of) {
        throw new Error('Either depends_on or dependency_of must be provided');
      }

      if (validated.depends_on && validated.dependency_of) {
        throw new Error('Only one of depends_on or dependency_of can be provided');
      }

      const result = await taskService.addDependency(
        validated.task_id,
        validated.depends_on,
        validated.dependency_of,
        validated.use_custom_task_ids || false
      );

      return {
        task_id: result.id,
        task_name: result.name,
        dependencies: result.dependencies || [],
        linked_tasks: result.linked_tasks || [],
        message: validated.depends_on 
          ? `Task ${validated.task_id} now depends on ${validated.depends_on}`
          : `Task ${validated.dependency_of} now depends on ${validated.task_id}`
      };
    }

    case 'clickup_task_remove_dependency': {
      const validated = z.object({
        task_id: z.string(),
        depends_on: z.string().optional(),
        dependency_of: z.string().optional(),
        use_custom_task_ids: z.boolean().optional()
      }).parse(args);

      if (!validated.depends_on && !validated.dependency_of) {
        throw new Error('Either depends_on or dependency_of must be provided');
      }

      if (validated.depends_on && validated.dependency_of) {
        throw new Error('Only one of depends_on or dependency_of can be provided');
      }

      await taskService.removeDependency(
        validated.task_id,
        validated.depends_on,
        validated.dependency_of,
        validated.use_custom_task_ids || false
      );

      return {
        message: validated.depends_on 
          ? `Removed dependency: Task ${validated.task_id} no longer depends on ${validated.depends_on}`
          : `Removed dependency: Task ${validated.dependency_of} no longer depends on ${validated.task_id}`
      };
    }

    case 'clickup_task_get_dependencies': {
      const validated = z.object({
        task_id: z.string(),
        use_custom_task_ids: z.boolean().optional()
      }).parse(args);

      const result = await taskService.getTaskDependencies(
        validated.task_id,
        validated.use_custom_task_ids || false
      );

      return {
        task_id: validated.task_id,
        dependencies: result.dependencies,
        dependency_count: result.dependencies.length,
        linked_tasks: result.linked_tasks,
        link_count: result.linked_tasks.length
      };
    }

    case 'clickup_task_add_link': {
      const validated = z.object({
        task_id: z.string(),
        links_to: z.string(),
        use_custom_task_ids: z.boolean().optional()
      }).parse(args);

      const result = await taskService.addTaskLink(
        validated.task_id,
        validated.links_to,
        validated.use_custom_task_ids || false
      );

      return {
        task_id: result.id,
        task_name: result.name,
        linked_tasks: result.linked_tasks || [],
        message: `Created link between tasks ${validated.task_id} and ${validated.links_to}`
      };
    }

    case 'clickup_task_remove_link': {
      const validated = z.object({
        task_id: z.string(),
        links_to: z.string(),
        use_custom_task_ids: z.boolean().optional()
      }).parse(args);

      await taskService.removeTaskLink(
        validated.task_id,
        validated.links_to,
        validated.use_custom_task_ids || false
      );

      return {
        message: `Removed link between tasks ${validated.task_id} and ${validated.links_to}`
      };
    }

    default:
      throw new Error(`Unknown dependency tool: ${toolName}`);
  }
}