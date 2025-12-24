import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { CustomFieldDefinitionService } from '../services/clickup/custom-fields.js';
import { taskService } from '../services/shared.js';
import { sponsorService } from '../utils/sponsor-service.js';

// Create a singleton instance of the custom field service
let customFieldService: CustomFieldDefinitionService | null = null;

function getCustomFieldService(): CustomFieldDefinitionService {
  if (!customFieldService) {
    const apiKey = process.env.CLICKUP_API_KEY!;
    const teamId = process.env.CLICKUP_TEAM_ID!;
    customFieldService = new CustomFieldDefinitionService(apiKey, teamId, 'https://api.clickup.com/api/v2');
  }
  return customFieldService;
}

export const customFieldTools: Tool[] = [
  {
    name: 'clickup_custom_field_get_definitions',
    description: 'Get custom field definitions for a space, folder, or list. Returns field types, options, and configuration.',
    inputSchema: {
      type: 'object',
      properties: {
        space_id: {
          type: 'string',
          description: 'Space ID to get custom fields for'
        },
        folder_id: {
          type: 'string',
          description: 'Folder ID to get custom fields for'
        },
        list_id: {
          type: 'string',
          description: 'List ID to get custom fields for'
        }
      }
    }
  },
  {
    name: 'clickup_custom_field_set_value',
    description: 'Set a custom field value on a task. Supports all ClickUp custom field types with proper formatting.',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: {
          type: 'string',
          description: 'The task ID to set custom field on'
        },
        field_id: {
          type: 'string',
          description: 'The custom field ID (UUID)'
        },
        value: {
          description: 'The value to set (format depends on field type)'
        },
        field_type: {
          type: 'string',
          enum: ['text', 'number', 'date', 'date_time', 'dropdown', 'labels', 'email', 'phone', 'url', 'checkbox', 'users', 'tasks', 'location', 'rating', 'money', 'manual_progress'],
          description: 'The type of the custom field (helps with formatting)'
        },
        use_custom_task_ids: {
          type: 'boolean',
          description: 'Whether to use custom task IDs'
        }
      },
      required: ['task_id', 'field_id', 'value']
    }
  },
  {
    name: 'clickup_custom_field_remove_value',
    description: 'Remove/clear a custom field value from a task.',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: {
          type: 'string',
          description: 'The task ID to remove custom field from'
        },
        field_id: {
          type: 'string',
          description: 'The custom field ID to remove'
        },
        use_custom_task_ids: {
          type: 'boolean',
          description: 'Whether to use custom task IDs'
        }
      },
      required: ['task_id', 'field_id']
    }
  },
  {
    name: 'clickup_custom_field_get_values',
    description: 'Get all custom field values for a task.',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: {
          type: 'string',
          description: 'The task ID to get custom field values for'
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
    name: 'clickup_custom_field_find_by_name',
    description: 'Find a custom field definition by name in a list.',
    inputSchema: {
      type: 'object',
      properties: {
        list_id: {
          type: 'string',
          description: 'The list ID to search in'
        },
        field_name: {
          type: 'string',
          description: 'The name of the custom field to find'
        }
      },
      required: ['list_id', 'field_name']
    }
  },
  {
    name: 'clickup_custom_field_set_by_name',
    description: 'Set a custom field value by field name instead of ID (convenience method).',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: {
          type: 'string',
          description: 'The task ID to set custom field on'
        },
        list_id: {
          type: 'string',
          description: 'The list ID containing the custom field'
        },
        field_name: {
          type: 'string',
          description: 'The name of the custom field'
        },
        value: {
          description: 'The value to set'
        },
        use_custom_task_ids: {
          type: 'boolean',
          description: 'Whether to use custom task IDs'
        }
      },
      required: ['task_id', 'list_id', 'field_name', 'value']
    }
  }
];

export async function handleCustomFieldTool(
  toolName: string,
  args: any
): Promise<any> {
  const startTime = Date.now();
  const service = getCustomFieldService();

  switch (toolName) {
    case 'clickup_custom_field_get_definitions': {
      const validated = z.object({
        space_id: z.string().optional(),
        folder_id: z.string().optional(),
        list_id: z.string().optional()
      }).parse(args);

      if (!validated.space_id && !validated.folder_id && !validated.list_id) {
        throw new Error('At least one of space_id, folder_id, or list_id must be provided');
      }

      const result = await service.getWorkspaceCustomFields(
        validated.space_id,
        validated.folder_id,
        validated.list_id
      );

      const executionTime = Date.now() - startTime;
      const rateLimitInfo = service.getRateLimitMetadata();
      const retryInfo = service.getRetryTelemetry();

      return sponsorService.createResponse({
        fields: result.all,
        count: result.all.length,
        by_location: {
          space: result.space?.length || 0,
          folder: result.folder?.length || 0,
          list: result.list?.length || 0
        }
      }, true, {
        tool_name: 'clickup_custom_field_get_definitions',
        execution_time_ms: executionTime,
        rate_limit: rateLimitInfo,
        retry: retryInfo
      });
    }

    case 'clickup_custom_field_set_value': {
      const validated = z.object({
        task_id: z.string(),
        field_id: z.string(),
        value: z.any(),
        field_type: z.string().optional(),
        use_custom_task_ids: z.boolean().optional()
      }).parse(args);

      const result = await service.setCustomFieldValue(
        validated.task_id,
        validated.field_id,
        validated.value,
        validated.field_type,
        validated.use_custom_task_ids || false
      );

      const executionTime = Date.now() - startTime;
      const rateLimitInfo = service.getRateLimitMetadata();
      const retryInfo = service.getRetryTelemetry();

      return sponsorService.createResponse({
        task_id: validated.task_id,
        field_id: validated.field_id,
        value: validated.value,
        message: `Custom field ${validated.field_id} set successfully`
      }, true, {
        tool_name: 'clickup_custom_field_set_value',
        execution_time_ms: executionTime,
        rate_limit: rateLimitInfo,
        retry: retryInfo
      });
    }

    case 'clickup_custom_field_remove_value': {
      const validated = z.object({
        task_id: z.string(),
        field_id: z.string(),
        use_custom_task_ids: z.boolean().optional()
      }).parse(args);

      await service.removeCustomFieldValue(
        validated.task_id,
        validated.field_id,
        validated.use_custom_task_ids || false
      );

      const executionTime = Date.now() - startTime;
      const rateLimitInfo = service.getRateLimitMetadata();
      const retryInfo = service.getRetryTelemetry();

      return sponsorService.createResponse({
        task_id: validated.task_id,
        field_id: validated.field_id,
        message: `Custom field ${validated.field_id} removed from task`
      }, true, {
        tool_name: 'clickup_custom_field_remove_value',
        execution_time_ms: executionTime,
        rate_limit: rateLimitInfo,
        retry: retryInfo
      });
    }

    case 'clickup_custom_field_get_values': {
      const validated = z.object({
        task_id: z.string(),
        use_custom_task_ids: z.boolean().optional()
      }).parse(args);

      // Use the task service to get custom field values
      const customFields = await taskService.getCustomFieldValues(validated.task_id);

      const executionTime = Date.now() - startTime;
      const rateLimitInfo = taskService.getRateLimitMetadata();
      const retryInfo = taskService.getRetryTelemetry();

      return sponsorService.createResponse({
        task_id: validated.task_id,
        custom_fields: customFields,
        field_count: Object.keys(customFields).length
      }, true, {
        tool_name: 'clickup_custom_field_get_values',
        execution_time_ms: executionTime,
        rate_limit: rateLimitInfo,
        retry: retryInfo
      });
    }

    case 'clickup_custom_field_find_by_name': {
      const validated = z.object({
        list_id: z.string(),
        field_name: z.string()
      }).parse(args);

      const field = await service.findCustomFieldByName(
        validated.list_id,
        validated.field_name
      );

      const executionTime = Date.now() - startTime;
      const rateLimitInfo = service.getRateLimitMetadata();
      const retryInfo = service.getRetryTelemetry();

      if (!field) {
        return sponsorService.createResponse({
          found: false,
          message: `Custom field "${validated.field_name}" not found in list ${validated.list_id}`
        }, true, {
          tool_name: 'clickup_custom_field_find_by_name',
          execution_time_ms: executionTime,
          rate_limit: rateLimitInfo,
          retry: retryInfo
        });
      }

      return sponsorService.createResponse({
        found: true,
        field: {
          id: field.id,
          name: field.name,
          type: field.type,
          required: field.required,
          options: field.options
        }
      }, true, {
        tool_name: 'clickup_custom_field_find_by_name',
        execution_time_ms: executionTime,
        rate_limit: rateLimitInfo,
        retry: retryInfo
      });
    }

    case 'clickup_custom_field_set_by_name': {
      const validated = z.object({
        task_id: z.string(),
        list_id: z.string(),
        field_name: z.string(),
        value: z.any(),
        use_custom_task_ids: z.boolean().optional()
      }).parse(args);

      // First find the field by name
      const field = await service.findCustomFieldByName(
        validated.list_id,
        validated.field_name
      );

      if (!field) {
        throw new Error(`Custom field "${validated.field_name}" not found in list ${validated.list_id}`);
      }

      // Then set the value using the field ID
      await service.setCustomFieldValue(
        validated.task_id,
        field.id,
        validated.value,
        field.type,
        validated.use_custom_task_ids || false
      );

      const executionTime = Date.now() - startTime;
      const rateLimitInfo = service.getRateLimitMetadata();
      const retryInfo = service.getRetryTelemetry();

      return sponsorService.createResponse({
        task_id: validated.task_id,
        field: {
          id: field.id,
          name: field.name,
          type: field.type
        },
        value: validated.value,
        message: `Custom field "${validated.field_name}" set successfully`
      }, true, {
        tool_name: 'clickup_custom_field_set_by_name',
        execution_time_ms: executionTime,
        rate_limit: rateLimitInfo,
        retry: retryInfo
      });
    }

    default:
      throw new Error(`Unknown custom field tool: ${toolName}`);
  }
}