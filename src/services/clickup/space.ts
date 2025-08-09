import { BaseClickUpService } from './base.js';

export interface SpaceFeatures {
  due_dates?: {
    enabled: boolean;
    start_date?: boolean;
    remap_due_dates?: boolean;
    remap_closed_due_date?: boolean;
  };
  time_tracking?: {
    enabled: boolean;
  };
  tags?: {
    enabled: boolean;
  };
  time_estimates?: {
    enabled: boolean;
  };
  checklists?: {
    enabled: boolean;
  };
  custom_fields?: {
    enabled: boolean;
  };
  remap_dependencies?: {
    enabled: boolean;
  };
  dependency_warning?: {
    enabled: boolean;
  };
  portfolios?: {
    enabled: boolean;
  };
}

export interface CreateSpaceRequest {
  name: string;
  multiple_assignees: boolean;
  features?: SpaceFeatures;
}

export interface UpdateSpaceRequest {
  name?: string;
  multiple_assignees?: boolean;
  features?: SpaceFeatures;
  color?: string;
  private?: boolean;
  admin_can_manage?: boolean;
}

export interface Space {
  id: string;
  name: string;
  private: boolean;
  color?: string;
  avatar?: string;
  admin_can_manage?: boolean;
  statuses: Array<{
    id: string;
    status: string;
    type: string;
    orderindex: number;
    color: string;
  }>;
  multiple_assignees: boolean;
  features: SpaceFeatures;
  archived: boolean;
  members: Array<{
    user: {
      id: string;
      username: string;
      email: string;
      color: string;
      profilePicture?: string;
      initials: string;
    };
  }>;
}

export class SpaceService extends BaseClickUpService {
  /**
   * Get all spaces in the team
   */
  async getSpaces(archived: boolean = false): Promise<Space[]> {
    try {
      const response = await this.makeRequest<{ spaces: Space[] }>(async () => {
        const result = await this.client.get(`/team/${this.teamId}/space`, {
          params: { archived }
        });
        return result.data;
      });
      return response.spaces || [];
    } catch (error) {
      throw new Error(`Failed to get spaces: ${error.message}`);
    }
  }

  /**
   * Get a specific space by ID
   */
  async getSpace(spaceId: string): Promise<Space> {
    try {
      const response = await this.makeRequest<Space>(async () => {
        const result = await this.client.get(`/space/${spaceId}`);
        return result.data;
      });
      return response;
    } catch (error) {
      throw new Error(`Failed to get space ${spaceId}: ${error.message}`);
    }
  }

  /**
   * Create a new space
   */
  async createSpace(data: CreateSpaceRequest): Promise<Space> {
    try {
      // Set default features if not provided
      const requestData = {
        ...data,
        features: data.features || {
          due_dates: {
            enabled: true,
            start_date: false,
            remap_due_dates: true,
            remap_closed_due_date: false
          },
          time_tracking: { enabled: false },
          tags: { enabled: true },
          time_estimates: { enabled: true },
          checklists: { enabled: true },
          custom_fields: { enabled: true },
          remap_dependencies: { enabled: true },
          dependency_warning: { enabled: true },
          portfolios: { enabled: true }
        }
      };

      const response = await this.makeRequest<Space>(async () => {
        const result = await this.client.post(`/team/${this.teamId}/space`, requestData);
        return result.data;
      });
      return response;
    } catch (error) {
      throw new Error(`Failed to create space: ${error.message}`);
    }
  }

  /**
   * Update an existing space
   */
  async updateSpace(spaceId: string, data: UpdateSpaceRequest): Promise<Space> {
    try {
      const response = await this.makeRequest<Space>(async () => {
        const result = await this.client.put(`/space/${spaceId}`, data);
        return result.data;
      });
      return response;
    } catch (error) {
      throw new Error(`Failed to update space ${spaceId}: ${error.message}`);
    }
  }

  /**
   * Delete a space
   */
  async deleteSpace(spaceId: string): Promise<void> {
    try {
      await this.makeRequest(async () => {
        return await this.client.delete(`/space/${spaceId}`);
      });
    } catch (error) {
      throw new Error(`Failed to delete space ${spaceId}: ${error.message}`);
    }
  }

  /**
   * Archive or unarchive a space
   */
  async archiveSpace(spaceId: string, archive: boolean = true): Promise<Space> {
    try {
      const response = await this.makeRequest<Space>(async () => {
        const result = await this.client.put(`/space/${spaceId}`, { archived: archive });
        return result.data;
      });
      return response;
    } catch (error) {
      throw new Error(`Failed to ${archive ? 'archive' : 'unarchive'} space ${spaceId}: ${error.message}`);
    }
  }

  /**
   * Get space members
   */
  async getSpaceMembers(spaceId: string): Promise<Array<{ user: any }>> {
    try {
      const space = await this.getSpace(spaceId);
      return space.members || [];
    } catch (error) {
      throw new Error(`Failed to get members for space ${spaceId}: ${error.message}`);
    }
  }

  /**
   * Enable or disable a specific feature in a space
   */
  async toggleSpaceFeature(
    spaceId: string, 
    feature: keyof SpaceFeatures, 
    enabled: boolean
  ): Promise<Space> {
    try {
      const currentSpace = await this.getSpace(spaceId);
      const updatedFeatures = {
        ...currentSpace.features,
        [feature]: { enabled }
      };

      return await this.updateSpace(spaceId, {
        features: updatedFeatures
      });
    } catch (error) {
      throw new Error(`Failed to toggle feature ${feature} for space ${spaceId}: ${error.message}`);
    }
  }
}