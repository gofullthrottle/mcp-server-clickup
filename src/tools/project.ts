import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { ProjectService, PROJECT_TEMPLATES } from '../services/clickup/project.js';

// Create singleton instance
let projectService: ProjectService | null = null;

function getProjectService(): ProjectService {
  if (!projectService) {
    const apiKey = process.env.CLICKUP_API_KEY!;
    const teamId = process.env.CLICKUP_TEAM_ID!;
    projectService = new ProjectService(apiKey, teamId);
  }
  return projectService;
}

export const projectTools: Tool[] = [
  {
    name: 'clickup_project_initialize',
    description: 'Initialize a complete project with space, folders, lists, and optional Gantt support. Applies a template structure.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Project name'
        },
        description: {
          type: 'string',
          description: 'Project description'
        },
        template: {
          type: 'string',
          enum: ['default', 'agile', 'kanban'],
          description: 'Project template to use (default, agile, or kanban)'
        },
        start_date: {
          type: 'string',
          description: 'Project start date (ISO format)'
        },
        duration_days: {
          type: 'number',
          description: 'Project duration in days (default: 90)'
        },
        enable_gantt: {
          type: 'boolean',
          description: 'Create a main Gantt project task'
        },
        enable_dependencies: {
          type: 'boolean',
          description: 'Enable task dependencies'
        },
        enable_time_tracking: {
          type: 'boolean',
          description: 'Enable time tracking'
        },
        enable_custom_fields: {
          type: 'boolean',
          description: 'Enable custom fields'
        },
        enable_multiple_assignees: {
          type: 'boolean',
          description: 'Allow multiple assignees on tasks'
        }
      },
      required: ['name']
    }
  },
  {
    name: 'clickup_project_create_gantt',
    description: 'Create a Gantt project task with timeline support for project management.',
    inputSchema: {
      type: 'object',
      properties: {
        list_id: {
          type: 'string',
          description: 'List ID where the Gantt project will be created'
        },
        name: {
          type: 'string',
          description: 'Project name'
        },
        description: {
          type: 'string',
          description: 'Project description'
        },
        start_date: {
          type: 'string',
          description: 'Project start date (ISO format)'
        },
        duration_days: {
          type: 'number',
          description: 'Project duration in days'
        },
        estimated_hours: {
          type: 'number',
          description: 'Total estimated hours for the project'
        },
        priority: {
          type: 'number',
          enum: [1, 2, 3, 4],
          description: 'Priority (1=urgent, 2=high, 3=normal, 4=low)'
        }
      },
      required: ['list_id', 'name', 'start_date', 'duration_days']
    }
  },
  {
    name: 'clickup_project_apply_template',
    description: 'Apply a project template to an existing space, creating the folder and list structure.',
    inputSchema: {
      type: 'object',
      properties: {
        space_id: {
          type: 'string',
          description: 'Space ID to apply template to'
        },
        template: {
          type: 'string',
          enum: ['default', 'agile', 'kanban'],
          description: 'Template name to apply'
        }
      },
      required: ['space_id', 'template']
    }
  },
  {
    name: 'clickup_project_create_milestones',
    description: 'Create project milestones based on project phases.',
    inputSchema: {
      type: 'object',
      properties: {
        list_id: {
          type: 'string',
          description: 'List ID where milestones will be created'
        },
        project_start_date: {
          type: 'string',
          description: 'Project start date (ISO format)'
        },
        project_duration_days: {
          type: 'number',
          description: 'Total project duration in days'
        }
      },
      required: ['list_id', 'project_start_date', 'project_duration_days']
    }
  },
  {
    name: 'clickup_project_get_templates',
    description: 'Get available project templates with their descriptions.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }
];

export async function handleProjectTool(
  toolName: string,
  args: any
): Promise<any> {
  const service = getProjectService();

  switch (toolName) {
    case 'clickup_project_initialize': {
      const validated = z.object({
        name: z.string(),
        description: z.string().optional(),
        template: z.enum(['default', 'agile', 'kanban']).optional(),
        start_date: z.string().optional(),
        duration_days: z.number().optional(),
        enable_gantt: z.boolean().optional(),
        enable_dependencies: z.boolean().optional(),
        enable_time_tracking: z.boolean().optional(),
        enable_custom_fields: z.boolean().optional(),
        enable_multiple_assignees: z.boolean().optional()
      }).parse(args);

      const config = {
        name: validated.name,
        description: validated.description,
        template: validated.template || 'default',
        startDate: validated.start_date ? new Date(validated.start_date) : new Date(),
        durationDays: validated.duration_days || 90,
        enableGantt: validated.enable_gantt !== false,
        features: {
          dependencies: validated.enable_dependencies !== false,
          timeTracking: validated.enable_time_tracking !== false,
          customFields: validated.enable_custom_fields !== false,
          multipleAssignees: validated.enable_multiple_assignees !== false
        }
      };

      const result = await service.initializeProject(config);
      
      return {
        space_id: result.spaceId,
        folders: result.folders,
        gantt_project: result.ganttProject,
        message: result.message,
        template_used: config.template,
        total_lists_created: result.folders.reduce((sum, f) => sum + f.lists.length, 0)
      };
    }

    case 'clickup_project_create_gantt': {
      const validated = z.object({
        list_id: z.string(),
        name: z.string(),
        description: z.string().optional(),
        start_date: z.string(),
        duration_days: z.number(),
        estimated_hours: z.number().optional(),
        priority: z.number().min(1).max(4).optional()
      }).parse(args);

      const result = await service.createGanttProject({
        listId: validated.list_id,
        name: validated.name,
        description: validated.description || `Main project task for ${validated.name}`,
        startDate: new Date(validated.start_date),
        durationDays: validated.duration_days,
        estimatedHours: validated.estimated_hours,
        priority: validated.priority
      });

      return {
        task_id: result.id,
        name: result.name,
        start_date: result.startDate,
        due_date: result.dueDate,
        duration_days: result.duration,
        url: result.url,
        message: `Gantt project "${result.name}" created successfully`
      };
    }

    case 'clickup_project_apply_template': {
      const validated = z.object({
        space_id: z.string(),
        template: z.enum(['default', 'agile', 'kanban'])
      }).parse(args);

      const result = await service.applyTemplate(validated.space_id, validated.template);
      
      return {
        folders: result.folders,
        message: result.message,
        total_folders: result.folders.length,
        total_lists: result.folders.reduce((sum, f) => sum + f.lists.length, 0)
      };
    }

    case 'clickup_project_create_milestones': {
      const validated = z.object({
        list_id: z.string(),
        project_start_date: z.string(),
        project_duration_days: z.number()
      }).parse(args);

      const milestones = await service.createProjectMilestones(
        validated.list_id,
        new Date(validated.project_start_date),
        validated.project_duration_days
      );

      return {
        milestones: milestones.map(m => ({
          id: m.id,
          name: m.name,
          due_date: m.dueDate
        })),
        count: milestones.length,
        message: `Created ${milestones.length} project milestones`
      };
    }

    case 'clickup_project_get_templates': {
      const templates = service.getTemplates();
      
      return {
        templates: templates.map(t => ({
          name: t.name,
          description: t.description,
          structure: PROJECT_TEMPLATES[t.name]
        })),
        count: templates.length
      };
    }

    default:
      throw new Error(`Unknown project tool: ${toolName}`);
  }
}