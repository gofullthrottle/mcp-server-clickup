import { BaseClickUpService } from './base.js';
export class SpaceService extends BaseClickUpService {
    /**
     * Get all spaces in the team
     */
    async getSpaces(archived = false) {
        try {
            const response = await this.makeRequest(async () => {
                const result = await this.client.get(`/team/${this.teamId}/space`, {
                    params: { archived }
                });
                return result.data;
            });
            return response.spaces || [];
        }
        catch (error) {
            throw new Error(`Failed to get spaces: ${error.message}`);
        }
    }
    /**
     * Get a specific space by ID
     */
    async getSpace(spaceId) {
        try {
            const response = await this.makeRequest(async () => {
                const result = await this.client.get(`/space/${spaceId}`);
                return result.data;
            });
            return response;
        }
        catch (error) {
            throw new Error(`Failed to get space ${spaceId}: ${error.message}`);
        }
    }
    /**
     * Create a new space
     */
    async createSpace(data) {
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
            const response = await this.makeRequest(async () => {
                const result = await this.client.post(`/team/${this.teamId}/space`, requestData);
                return result.data;
            });
            return response;
        }
        catch (error) {
            throw new Error(`Failed to create space: ${error.message}`);
        }
    }
    /**
     * Update an existing space
     */
    async updateSpace(spaceId, data) {
        try {
            const response = await this.makeRequest(async () => {
                const result = await this.client.put(`/space/${spaceId}`, data);
                return result.data;
            });
            return response;
        }
        catch (error) {
            throw new Error(`Failed to update space ${spaceId}: ${error.message}`);
        }
    }
    /**
     * Delete a space
     */
    async deleteSpace(spaceId) {
        try {
            await this.makeRequest(async () => {
                return await this.client.delete(`/space/${spaceId}`);
            });
        }
        catch (error) {
            throw new Error(`Failed to delete space ${spaceId}: ${error.message}`);
        }
    }
    /**
     * Archive or unarchive a space
     */
    async archiveSpace(spaceId, archive = true) {
        try {
            const response = await this.makeRequest(async () => {
                const result = await this.client.put(`/space/${spaceId}`, { archived: archive });
                return result.data;
            });
            return response;
        }
        catch (error) {
            throw new Error(`Failed to ${archive ? 'archive' : 'unarchive'} space ${spaceId}: ${error.message}`);
        }
    }
    /**
     * Get space members
     */
    async getSpaceMembers(spaceId) {
        try {
            const space = await this.getSpace(spaceId);
            return space.members || [];
        }
        catch (error) {
            throw new Error(`Failed to get members for space ${spaceId}: ${error.message}`);
        }
    }
    /**
     * Enable or disable a specific feature in a space
     */
    async toggleSpaceFeature(spaceId, feature, enabled) {
        try {
            const currentSpace = await this.getSpace(spaceId);
            const updatedFeatures = {
                ...currentSpace.features,
                [feature]: { enabled }
            };
            return await this.updateSpace(spaceId, {
                features: updatedFeatures
            });
        }
        catch (error) {
            throw new Error(`Failed to toggle feature ${feature} for space ${spaceId}: ${error.message}`);
        }
    }
}
