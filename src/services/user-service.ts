import { Env } from '../worker.js';

export interface User {
  id: string;
  email: string;
  name: string;
  team_id: string;
  subscription_tier: 'free' | 'premium';
  stripe_customer_id?: string;
  has_api_key?: boolean;
  api_key_updated?: number;
  created_at: number;
  updated_at?: number;
  last_login?: number;
  subscription_updated?: number;
}

export interface UserConfig {
  has_api_key?: boolean;
  team_id?: string;
  api_key_updated?: number;
  subscription_tier?: 'free' | 'premium';
  stripe_customer_id?: string;
  subscription_updated?: number;
  last_login?: number;
}

export class UserService {
  constructor(private env: Env) {}

  /**
   * Creates or updates a user record
   */
  async createOrUpdateUser(userData: Partial<User> & { id: string }): Promise<void> {
    const existingUser = await this.getUser(userData.id);
    
    const user: User = existingUser ? {
      ...existingUser,
      ...userData,
      updated_at: Date.now(),
      last_login: Date.now()
    } : {
      subscription_tier: 'free',
      created_at: Date.now(),
      last_login: Date.now(),
      ...userData
    } as User;

    await this.env.USER_MAPPINGS.put(
      `user:${userData.id}`,
      JSON.stringify(user),
      {
        metadata: {
          email: user.email,
          subscription_tier: user.subscription_tier
        }
      }
    );
  }

  /**
   * Gets a user by ID
   */
  async getUser(userId: string): Promise<User | null> {
    const data = await this.env.USER_MAPPINGS.get(`user:${userId}`);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Updates user configuration
   */
  async updateUserConfig(userId: string, config: UserConfig): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const updatedUser: User = {
      ...user,
      ...config,
      updated_at: Date.now()
    };

    await this.env.USER_MAPPINGS.put(
      `user:${userId}`,
      JSON.stringify(updatedUser),
      {
        metadata: {
          email: updatedUser.email,
          subscription_tier: updatedUser.subscription_tier
        }
      }
    );
  }

  /**
   * Gets user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    // This would require a secondary index in production
    // For now, we'll use KV list with metadata filtering
    const list = await this.env.USER_MAPPINGS.list({
      prefix: 'user:'
    });

    for (const key of list.keys) {
      const metadata = key.metadata as { email?: string } | undefined;
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
  async isPremiumUser(userId: string): Promise<boolean> {
    const user = await this.getUser(userId);
    return user?.subscription_tier === 'premium';
  }

  /**
   * Gets all users (paginated)
   */
  async listUsers(cursor?: string, limit: number = 100): Promise<{
    users: User[];
    cursor?: string;
  }> {
    const list = await this.env.USER_MAPPINGS.list({
      prefix: 'user:',
      cursor,
      limit
    });

    const users: User[] = [];
    for (const key of list.keys) {
      const data = await this.env.USER_MAPPINGS.get(key.name);
      if (data) {
        users.push(JSON.parse(data));
      }
    }

    return {
      users,
      cursor: list.list_complete ? undefined : (list as any).cursor
    };
  }

  /**
   * Deletes a user and all associated data
   */
  async deleteUser(userId: string): Promise<void> {
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
  async getUserStats(userId: string): Promise<{
    total_requests: number;
    requests_today: number;
    last_request: number | null;
    tools_used: string[];
  }> {
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