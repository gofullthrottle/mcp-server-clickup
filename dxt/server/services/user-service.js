export class UserService {
    constructor(env) {
        this.env = env;
    }
    /**
     * Creates or updates a user record
     */
    async createOrUpdateUser(userData) {
        const existingUser = await this.getUser(userData.id);
        const user = existingUser ? {
            ...existingUser,
            ...userData,
            updated_at: Date.now(),
            last_login: Date.now()
        } : {
            subscription_tier: 'free',
            created_at: Date.now(),
            last_login: Date.now(),
            ...userData
        };
        await this.env.USER_MAPPINGS.put(`user:${userData.id}`, JSON.stringify(user), {
            metadata: {
                email: user.email,
                subscription_tier: user.subscription_tier
            }
        });
    }
    /**
     * Gets a user by ID
     */
    async getUser(userId) {
        const data = await this.env.USER_MAPPINGS.get(`user:${userId}`);
        return data ? JSON.parse(data) : null;
    }
    /**
     * Updates user configuration
     */
    async updateUserConfig(userId, config) {
        const user = await this.getUser(userId);
        if (!user) {
            throw new Error('User not found');
        }
        const updatedUser = {
            ...user,
            ...config,
            updated_at: Date.now()
        };
        await this.env.USER_MAPPINGS.put(`user:${userId}`, JSON.stringify(updatedUser), {
            metadata: {
                email: updatedUser.email,
                subscription_tier: updatedUser.subscription_tier
            }
        });
    }
    /**
     * Gets user by email
     */
    async getUserByEmail(email) {
        // This would require a secondary index in production
        // For now, we'll use KV list with metadata filtering
        const list = await this.env.USER_MAPPINGS.list({
            prefix: 'user:'
        });
        for (const key of list.keys) {
            const metadata = key.metadata;
            if (metadata?.email === email) {
                const data = await this.env.USER_MAPPINGS.get(key.name);
                return data ? JSON.parse(data) : null;
            }
        }
        return null;
    }
    /**
     * Checks if user has premium subscription
     */
    async isPremiumUser(userId) {
        const user = await this.getUser(userId);
        return user?.subscription_tier === 'premium';
    }
    /**
     * Gets all users (paginated)
     */
    async listUsers(cursor, limit = 100) {
        const list = await this.env.USER_MAPPINGS.list({
            prefix: 'user:',
            cursor,
            limit
        });
        const users = [];
        for (const key of list.keys) {
            const data = await this.env.USER_MAPPINGS.get(key.name);
            if (data) {
                users.push(JSON.parse(data));
            }
        }
        return {
            users,
            cursor: list.list_complete ? undefined : list.cursor
        };
    }
    /**
     * Deletes a user and all associated data
     */
    async deleteUser(userId) {
        // Delete user record
        await this.env.USER_MAPPINGS.delete(`user:${userId}`);
        // Delete API key
        await this.env.API_KEYS.delete(`user:${userId}:api_key`);
        // Delete sessions
        const sessions = await this.env.USER_SESSIONS.list({
            prefix: `session:${userId}:`
        });
        for (const key of sessions.keys) {
            await this.env.USER_SESSIONS.delete(key.name);
        }
        // Delete rate limit data
        await this.env.RATE_LIMITS.delete(`rate:${userId}`);
    }
    /**
     * Gets usage statistics for a user
     */
    async getUserStats(userId) {
        // This would be implemented with analytics in production
        // For now, return mock data
        return {
            total_requests: 0,
            requests_today: 0,
            last_request: null,
            tools_used: []
        };
    }
}
