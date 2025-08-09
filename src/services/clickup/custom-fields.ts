import { BaseClickUpService } from './base.js';

export interface CustomFieldDefinition {
  id: string;
  name: string;
  type: string;
  type_config?: any;
  date_created: string;
  hide_from_guests: boolean;
  required?: boolean;
}

export interface CustomFieldOption {
  id: string;
  name: string;
  color?: string;
  orderindex?: number;
}

export interface DetailedCustomField extends CustomFieldDefinition {
  options?: CustomFieldOption[];
  placeholder?: string;
  default_value?: any;
  required_on_subtasks?: boolean;
}

/**
 * Service for managing custom field definitions
 * (not values - those are handled by TaskServiceCustomFields)
 */
export class CustomFieldDefinitionService extends BaseClickUpService {
  /**
   * Get accessible custom fields for a space
   */
  async getSpaceCustomFields(spaceId: string): Promise<DetailedCustomField[]> {
    try {
      const response = await this.makeRequest<{ fields: DetailedCustomField[] }>(async () => {
        const result = await this.client.get(`/space/${spaceId}/field`);
        return result.data;
      });
      return response.fields || [];
    } catch (error) {
      throw new Error(`Failed to get custom fields for space ${spaceId}: ${error.message}`);
    }
  }

  /**
   * Get accessible custom fields for a folder
   */
  async getFolderCustomFields(folderId: string): Promise<DetailedCustomField[]> {
    try {
      const response = await this.makeRequest<{ fields: DetailedCustomField[] }>(async () => {
        const result = await this.client.get(`/folder/${folderId}/field`);
        return result.data;
      });
      return response.fields || [];
    } catch (error) {
      throw new Error(`Failed to get custom fields for folder ${folderId}: ${error.message}`);
    }
  }

  /**
   * Get accessible custom fields for a list
   */
  async getListCustomFields(listId: string): Promise<DetailedCustomField[]> {
    try {
      const response = await this.makeRequest<{ fields: DetailedCustomField[] }>(async () => {
        const result = await this.client.get(`/list/${listId}/field`);
        return result.data;
      });
      return response.fields || [];
    } catch (error) {
      throw new Error(`Failed to get custom fields for list ${listId}: ${error.message}`);
    }
  }

  /**
   * Remove/clear a custom field value from a task
   */
  async removeCustomFieldValue(
    taskId: string,
    fieldId: string,
    useCustomTaskIds: boolean = false
  ): Promise<void> {
    try {
      const params: any = {};
      if (useCustomTaskIds) {
        params.custom_task_ids = 'true';
        params.team_id = this.teamId;
      }

      await this.makeRequest(async () => {
        return await this.client.delete(`/task/${taskId}/field/${fieldId}`, { params });
      });
    } catch (error) {
      throw new Error(`Failed to remove custom field ${fieldId} from task ${taskId}: ${error.message}`);
    }
  }

  /**
   * Set a custom field value with proper type formatting
   */
  async setCustomFieldValue(
    taskId: string,
    fieldId: string,
    value: any,
    fieldType?: string,
    useCustomTaskIds: boolean = false
  ): Promise<any> {
    try {
      const params: any = {};
      if (useCustomTaskIds) {
        params.custom_task_ids = 'true';
        params.team_id = this.teamId;
      }

      // Format value based on field type
      let formattedValue = value;
      if (fieldType) {
        formattedValue = this.formatCustomFieldValue(value, fieldType);
      }

      const response = await this.makeRequest(async () => {
        const result = await this.client.post(`/task/${taskId}/field/${fieldId}`, formattedValue, { params });
        return result.data;
      });

      return response;
    } catch (error) {
      throw new Error(`Failed to set custom field ${fieldId} on task ${taskId}: ${error.message}`);
    }
  }

  /**
   * Format custom field value based on field type
   */
  private formatCustomFieldValue(value: any, fieldType: string): any {
    switch (fieldType.toLowerCase()) {
      case 'text':
      case 'short_text':
      case 'long_text':
        return { value: String(value) };
      
      case 'number':
      case 'currency':
      case 'automatic_progress':
        return { value: Number(value) };
      
      case 'money':
        return { value: Math.round(Number(value) * 100) }; // Convert to cents
      
      case 'date':
        // Convert to Unix timestamp in milliseconds
        if (typeof value === 'string') {
          return { value: new Date(value).getTime() };
        }
        return { value };
      
      case 'date_time':
        // Date with time
        if (typeof value === 'string') {
          return { 
            value: new Date(value).getTime(),
            value_options: { time: true }
          };
        }
        return { value, value_options: { time: true } };
      
      case 'drop_down':
      case 'dropdown':
        // Single selection - expects option UUID
        return { value: value };
      
      case 'labels':
      case 'label':
        // Multiple selection - expects array of option UUIDs
        return { value: Array.isArray(value) ? value : [value] };
      
      case 'email':
        return { value: String(value) };
      
      case 'phone':
        return { value: String(value) };
      
      case 'url':
        return { value: String(value) };
      
      case 'checkbox':
        return { value: Boolean(value) };
      
      case 'users':
      case 'people':
        // Expects { add: [user_ids], rem: [user_ids] }
        if (typeof value === 'object' && (value.add || value.rem)) {
          return { value };
        }
        // If just user IDs provided, add them
        return { value: { add: Array.isArray(value) ? value : [value] } };
      
      case 'tasks':
      case 'task_relationship':
        // Expects { add: [task_ids], rem: [task_ids] }
        if (typeof value === 'object' && (value.add || value.rem)) {
          return { value };
        }
        // If just task IDs provided, add them
        return { value: { add: Array.isArray(value) ? value : [value] } };
      
      case 'location':
        // Expects { location: { lat, lng }, formatted_address }
        return { value };
      
      case 'rating':
      case 'emoji':
        // Integer from 0 to max count
        return { value: Number(value) };
      
      case 'manual_progress':
        // Expects { current: number, total: number }
        if (typeof value === 'object' && 'current' in value) {
          return { value };
        }
        return { value: { current: Number(value) } };
      
      default:
        // Return as-is for unknown types
        return { value };
    }
  }

  /**
   * Get a custom field definition by name from a list
   */
  async findCustomFieldByName(
    listId: string,
    fieldName: string
  ): Promise<DetailedCustomField | null> {
    try {
      const fields = await this.getListCustomFields(listId);
      const field = fields.find(f => 
        f.name.toLowerCase() === fieldName.toLowerCase()
      );
      return field || null;
    } catch (error) {
      throw new Error(`Failed to find custom field "${fieldName}" in list ${listId}: ${error.message}`);
    }
  }

  /**
   * Get all custom fields across a workspace hierarchy
   */
  async getWorkspaceCustomFields(
    spaceId?: string,
    folderId?: string,
    listId?: string
  ): Promise<{
    space?: DetailedCustomField[];
    folder?: DetailedCustomField[];
    list?: DetailedCustomField[];
    all: DetailedCustomField[];
  }> {
    try {
      const result: any = { all: [] };
      const fieldMap = new Map<string, DetailedCustomField>();

      // Get list fields first (most specific)
      if (listId) {
        result.list = await this.getListCustomFields(listId);
        result.list.forEach((f: DetailedCustomField) => fieldMap.set(f.id, f));
      }

      // Get folder fields
      if (folderId) {
        result.folder = await this.getFolderCustomFields(folderId);
        result.folder.forEach((f: DetailedCustomField) => {
          if (!fieldMap.has(f.id)) fieldMap.set(f.id, f);
        });
      }

      // Get space fields
      if (spaceId) {
        result.space = await this.getSpaceCustomFields(spaceId);
        result.space.forEach((f: DetailedCustomField) => {
          if (!fieldMap.has(f.id)) fieldMap.set(f.id, f);
        });
      }

      // Combine all unique fields
      result.all = Array.from(fieldMap.values());
      
      return result;
    } catch (error) {
      throw new Error(`Failed to get workspace custom fields: ${error.message}`);
    }
  }
}