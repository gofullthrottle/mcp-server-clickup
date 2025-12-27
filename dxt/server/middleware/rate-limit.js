export class RateLimiter {
    constructor(env) {
        this.env = env;
        this.windowMs = 60000; // 1 minute window
        this.maxRequests = parseInt(env.MAX_REQUESTS_PER_MINUTE || '100');
    }
    /**
     * Checks if a user has exceeded their rate limit
     */
    async checkLimit(userId, action = 'default') {
        const key = `rate:${userId}:${action}`;
        const now = Date.now();
        // Get current rate limit entry
        const data = await this.env.RATE_LIMITS.get(key);
        let entry;
        if (data) {
            entry = JSON.parse(data);
            // Check if window has expired
            if (now >= entry.reset_at) {
                // Reset the window
                entry = {
                    count: 1,
                    window_start: now,
                    reset_at: now + this.windowMs
                };
            }
            else {
                // Within current window
                if (entry.count >= this.maxRequests) {
                    return false; // Rate limit exceeded
                }
                entry.count++;
            }
        }
        else {
            // First request in this window
            entry = {
                count: 1,
                window_start: now,
                reset_at: now + this.windowMs
            };
        }
        // Store updated entry with TTL
        await this.env.RATE_LIMITS.put(key, JSON.stringify(entry), {
            expirationTtl: Math.ceil(this.windowMs / 1000) + 60 // Extra 60 seconds buffer
        });
        return true;
    }
    /**
     * Gets remaining requests for a user
     */
    async getRemainingRequests(userId, action = 'default') {
        const key = `rate:${userId}:${action}`;
        const now = Date.now();
        const data = await this.env.RATE_LIMITS.get(key);
        if (!data) {
            return {
                remaining: this.maxRequests,
                reset_at: now + this.windowMs
            };
        }
        const entry = JSON.parse(data);
        if (now >= entry.reset_at) {
            return {
                remaining: this.maxRequests,
                reset_at: now + this.windowMs
            };
        }
        return {
            remaining: Math.max(0, this.maxRequests - entry.count),
            reset_at: entry.reset_at
        };
    }
    /**
     * Resets rate limit for a user
     */
    async resetLimit(userId, action = 'default') {
        const key = `rate:${userId}:${action}`;
        await this.env.RATE_LIMITS.delete(key);
    }
    /**
     * Gets custom rate limits for premium users
     */
    async getPremiumLimits(userId) {
        // Premium users get 5x the rate limit
        return this.maxRequests * 5;
    }
    /**
     * Checks rate limit with tier-based limits
     */
    async checkLimitWithTier(userId, action, isPremium) {
        const limit = isPremium
            ? await this.getPremiumLimits(userId)
            : this.maxRequests;
        const key = `rate:${userId}:${action}`;
        const now = Date.now();
        const data = await this.env.RATE_LIMITS.get(key);
        let entry;
        if (data) {
            entry = JSON.parse(data);
            if (now >= entry.reset_at) {
                entry = {
                    count: 1,
                    window_start: now,
                    reset_at: now + this.windowMs
                };
            }
            else {
                if (entry.count >= limit) {
                    return false;
                }
                entry.count++;
            }
        }
        else {
            entry = {
                count: 1,
                window_start: now,
                reset_at: now + this.windowMs
            };
        }
        await this.env.RATE_LIMITS.put(key, JSON.stringify(entry), {
            expirationTtl: Math.ceil(this.windowMs / 1000) + 60
        });
        return true;
    }
}
