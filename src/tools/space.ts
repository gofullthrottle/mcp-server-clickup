import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { SpaceService } from '../services/clickup/space.js';

const SpaceFeaturesSchema = z.object({
  due_dates: z.object({
    enabled: z.boolean(),
    start_date: z.boolean().optional(),
    remap_due_dates: z.boolean().optional(),
    remap_closed_due_date: z.boolean().optional()
  }).optional(),
  time_tracking: z.object({
    enabled: z.boolean()
  }).optional(),
  tags: z.object({
    enabled: z.boolean()
  }).optional(),
  time_estimates: z.object({
    enabled: z.boolean()
  }).optional(),
  checklists: z.object({
    enabled: z.boolean()
  }).optional(),
  custom_fields: z.object({
    enabled: z.boolean()
  }).optional(),
  remap_dependencies: z.object({
    enabled: z.boolean()
  }).optional(),
  dependency_warning: z.object({
    enabled: z.boolean()
  }).optional(),
  portfolios: z.object({
    enabled: z.boolean()
  }).optional()
});

export const spaceTools: Tool[] = [
  {
    name: 'clickup_space_list',
    description: 'List all spaces in the workspace. Returns active spaces by default.',
    inputSchema: {
      type: 'object',
      properties: {
        archived: {
          type: 'boolean',
          description: 'Include archived spaces (default: false)'
        }
      }
    }
  },
  {
    name: 'clickup_space_get',
    description: 'Get details of a specific space including its features, members, and statuses.',
    inputSchema: {
      type: 'object',
      properties: {
        space_id: {
          type: 'string',
          description: 'The ID of the space to retrieve'
        }
      },
      required: ['space_id']
    }
  },
  {
    name: 'clickup_space_create',
    description: 'Create a new space in the workspace with configurable features.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the new space'
        },
        multiple_assignees: {
          type: 'boolean',
          description: 'Allow multiple assignees on tasks'
        },
        features: {
          type: 'object',
          description: 'Feature configuration for the space',
          properties: {
            due_dates: {
              type: 'object',
              properties: {
                enabled: { type: 'boolean' },
                start_date: { type: 'boolean' },
                remap_due_dates: { type: 'boolean' },
                remap_closed_due_date: { type: 'boolean' }
              }
            },
            time_tracking: {
              type: 'object',
              properties: { enabled: { type: 'boolean' } }
            },
            tags: {
              type: 'object',
              properties: { enabled: { type: 'boolean' } }
            },
            time_estimates: {
              type: 'object',
              properties: { enabled: { type: 'boolean' } }
            },
            checklists: {
              type: 'object',
              properties: { enabled: { type: 'boolean' } }
            },
            custom_fields: {
              type: 'object',
              properties: { enabled: { type: 'boolean' } }
            },
            remap_dependencies: {
              type: 'object',
              properties: { enabled: { type: 'boolean' } }
            },
            dependency_warning: {
              type: 'object',
              properties: { enabled: { type: 'boolean' } }
            },
            portfolios: {
              type: 'object',
              properties: { enabled: { type: 'boolean' } }
            }
          }
        }
      },
      required: ['name', 'multiple_assignees']
    }
  },
  {
    name: 'clickup_space_update',
    description: 'Update an existing space including its name, features, color, and privacy settings.',
    inputSchema: {
      type: 'object',
      properties: {
        space_id: {
          type: 'string',
          description: 'The ID of the space to update'
        },
        name: {
          type: 'string',
          description: 'New name for the space'
        },
        multiple_assignees: {
          type: 'boolean',
          description: 'Allow multiple assignees on tasks'
        },
        color: {
          type: 'string',
          description: 'Hex color code for the space (e.g., #FF5733)'
        },
        private: {
          type: 'boolean',
          description: 'Make the space private'
        },
        admin_can_manage: {
          type: 'boolean',
          description: 'Allow admins to manage (Enterprise feature)'
        },
        features: {
          type: 'object',
          description: 'Feature configuration for the space',
          properties: {
            due_dates: {
              type: 'object',
              properties: {
                enabled: { type: 'boolean' },
                start_date: { type: 'boolean' },
                remap_due_dates: { type: 'boolean' },
                remap_closed_due_date: { type: 'boolean' }
              }
            },
            time_tracking: {
              type: 'object',
              properties: { enabled: { type: 'boolean' } }
            },
            tags: {
              type: 'object',
              properties: { enabled: { type: 'boolean' } }
            },
            time_estimates: {
              type: 'object',
              properties: { enabled: { type: 'boolean' } }
            },
            checklists: {
              type: 'object',
              properties: { enabled: { type: 'boolean' } }
            },
            custom_fields: {
              type: 'object',
              properties: { enabled: { type: 'boolean' } }
            },
            remap_dependencies: {
              type: 'object',
              properties: { enabled: { type: 'boolean' } }
            },
            dependency_warning: {
              type: 'object',
              properties: { enabled: { type: 'boolean' } }
            },
            portfolios: {
              type: 'object',
              properties: { enabled: { type: 'boolean' } }
            }
          }
        }
      },
      required: ['space_id']
    }
  },
  {
    name: 'clickup_space_delete',
    description: 'Delete a space from the workspace. This action cannot be undone.',
    inputSchema: {
      type: 'object',
      properties: {
        space_id: {
          type: 'string',
          description: 'The ID of the space to delete'
        }
      },
      required: ['space_id']
    }
  },
  {
    name: 'clickup_space_archive',
    description: 'Archive or unarchive a space.',
    inputSchema: {
      type: 'object',
      properties: {
        space_id: {
          type: 'string',
          description: 'The ID of the space to archive/unarchive'
        },
        archive: {
          type: 'boolean',
          description: 'True to archive, false to unarchive (default: true)'
        }
      },
      required: ['space_id']
    }
  },
  {
    name: 'clickup_space_toggle_feature',
    description: 'Enable or disable a specific feature in a space.',
    inputSchema: {
      type: 'object',
      properties: {
        space_id: {
          type: 'string',
          description: 'The ID of the space'
        },
        feature: {
          type: 'string',
          enum: ['due_dates', 'time_tracking', 'tags', 'time_estimates', 'checklists', 'custom_fields', 'remap_dependencies', 'dependency_warning', 'portfolios'],
          description: 'The feature to toggle'
        },
        enabled: {
          type: 'boolean',
          description: 'Enable or disable the feature'
        }
      },
      required: ['space_id', 'feature', 'enabled']
    }
  }
];

export async function handleSpaceTool(
  toolName: string,
  args: any,
  spaceService: SpaceService
): Promise<any> {
  switch (toolName) {
    case 'clickup_space_list': {
      const spaces = await spaceService.getSpaces(args.archived || false);
      return {
        spaces: spaces.map(space => ({
          id: space.id,
          name: space.name,
          private: space.private,
          color: space.color,
          archived: space.archived,
          multiple_assignees: space.multiple_assignees,
          features: space.features,
          member_count: space.members?.length || 0
        })),
        total: spaces.length
      };
    }

    case 'clickup_space_get': {
      const space = await spaceService.getSpace(args.space_id);
      return {
        id: space.id,
        name: space.name,
        private: space.private,
        color: space.color,
        archived: space.archived,
        multiple_assignees: space.multiple_assignees,
        features: space.features,
        statuses: space.statuses,
        members: space.members?.map(m => ({
          id: m.user.id,
          username: m.user.username,
          email: m.user.email,
          initials: m.user.initials
        })) || []
      };
    }

    case 'clickup_space_create': {
      const validated = z.object({
        name: z.string(),
        multiple_assignees: z.boolean(),
        features: SpaceFeaturesSchema.optional()
      }).parse(args);

      const space = await spaceService.createSpace({
        name: validated.name,
        multiple_assignees: validated.multiple_assignees,
        features: validated.features as any
      });
      return {
        id: space.id,
        name: space.name,
        message: `Space "${space.name}" created successfully`,
        features: space.features
      };
    }

    case 'clickup_space_update': {
      const validated = z.object({
        space_id: z.string(),
        name: z.string().optional(),
        multiple_assignees: z.boolean().optional(),
        color: z.string().optional(),
        private: z.boolean().optional(),
        admin_can_manage: z.boolean().optional(),
        features: SpaceFeaturesSchema.optional()
      }).parse(args);

      const { space_id, ...updateData } = validated;
      const space = await spaceService.updateSpace(space_id, updateData as any);
      return {
        id: space.id,
        name: space.name,
        message: `Space "${space.name}" updated successfully`,
        features: space.features
      };
    }

    case 'clickup_space_delete': {
      await spaceService.deleteSpace(args.space_id);
      return {
        message: `Space ${args.space_id} deleted successfully`
      };
    }

    case 'clickup_space_archive': {
      const archive = args.archive !== false; // Default to true
      const space = await spaceService.archiveSpace(args.space_id, archive);
      return {
        id: space.id,
        name: space.name,
        archived: space.archived,
        message: `Space "${space.name}" ${archive ? 'archived' : 'unarchived'} successfully`
      };
    }

    case 'clickup_space_toggle_feature': {
      const validated = z.object({
        space_id: z.string(),
        feature: z.enum(['due_dates', 'time_tracking', 'tags', 'time_estimates', 'checklists', 'custom_fields', 'remap_dependencies', 'dependency_warning', 'portfolios']),
        enabled: z.boolean()
      }).parse(args);

      const space = await spaceService.toggleSpaceFeature(
        validated.space_id,
        validated.feature as keyof typeof space.features,
        validated.enabled
      );
      return {
        id: space.id,
        name: space.name,
        feature: validated.feature,
        enabled: validated.enabled,
        message: `Feature "${validated.feature}" ${validated.enabled ? 'enabled' : 'disabled'} in space "${space.name}"`
      };
    }

    default:
      throw new Error(`Unknown space tool: ${toolName}`);
  }
}