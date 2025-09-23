import { Env } from '../worker';

export interface AuditAction {
  action: string;
  method?: string;
  timestamp: number;
  ip: string;
  metadata?: Record<string, any>;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: AuditAction;
  created_at: number;
}

export class AuditLogger {
  constructor(private env: Env) {}

  /**
   * Logs an action to the audit trail
   */
  async logAction(userId: string, action: AuditAction): Promise<void> {
    const log: AuditLog = {
      id: this.generateId(),
      user_id: userId,
      action,
      created_at: Date.now()
    };

    // Store in R2 for long-term retention
    const key = `audit/${userId}/${new Date().toISOString().split('T')[0]}/${log.id}.json`;
    
    await this.env.AUDIT_LOGS.put(
      key,
      JSON.stringify(log),
      {
        httpMetadata: {
          contentType: 'application/json'
        },
        customMetadata: {
          user_id: userId,
          action: action.action,
          ip: action.ip
        }
      }
    );

    // Also store recent actions in KV for quick access
    const recentKey = `audit:recent:${userId}`;
    const recent = await this.getRecentLogs(userId);
    
    // Keep only last 100 actions in KV
    const updated = [log, ...recent].slice(0, 100);
    
    await this.env.RATE_LIMITS.put(
      recentKey,
      JSON.stringify(updated),
      {
        expirationTtl: 86400 * 7 // 7 days
      }
    );
  }

  /**
   * Gets recent audit logs for a user from KV
   */
  async getRecentLogs(userId: string): Promise<AuditLog[]> {
    const key = `audit:recent:${userId}`;
    const data = await this.env.RATE_LIMITS.get(key);
    return data ? JSON.parse(data) : [];
  }

  /**
   * Queries audit logs from R2 with filters
   */
  async queryLogs(
    userId: string,
    options: {
      start_date?: string;
      end_date?: string;
      action?: string;
      limit?: number;
    } = {}
  ): Promise<AuditLog[]> {
    const logs: AuditLog[] = [];
    const prefix = `audit/${userId}/`;
    
    // List objects in R2
    const listed = await this.env.AUDIT_LOGS.list({
      prefix,
      limit: options.limit || 1000
    });

    for (const object of listed.objects) {
      // Filter by date if specified
      if (options.start_date || options.end_date) {
        const objectDate = object.key.split('/')[2];
        if (options.start_date && objectDate < options.start_date) continue;
        if (options.end_date && objectDate > options.end_date) continue;
      }

      // Get and parse log
      const logData = await this.env.AUDIT_LOGS.get(object.key);
      if (logData) {
        const text = await logData.text();
        const log: AuditLog = JSON.parse(text);
        
        // Filter by action if specified
        if (options.action && log.action.action !== options.action) continue;
        
        logs.push(log);
      }
    }

    return logs.sort((a, b) => b.created_at - a.created_at);
  }

  /**
   * Generates audit statistics for a user
   */
  async getAuditStats(userId: string): Promise<{
    total_actions: number;
    actions_by_type: Record<string, number>;
    unique_ips: string[];
    first_action: number | null;
    last_action: number | null;
  }> {
    const logs = await this.queryLogs(userId);
    
    const stats = {
      total_actions: logs.length,
      actions_by_type: {} as Record<string, number>,
      unique_ips: [] as string[],
      first_action: null as number | null,
      last_action: null as number | null
    };

    const ips = new Set<string>();

    for (const log of logs) {
      // Count by action type
      const actionType = log.action.action;
      stats.actions_by_type[actionType] = (stats.actions_by_type[actionType] || 0) + 1;
      
      // Collect unique IPs
      ips.add(log.action.ip);
      
      // Track first and last actions
      if (!stats.first_action || log.created_at < stats.first_action) {
        stats.first_action = log.created_at;
      }
      if (!stats.last_action || log.created_at > stats.last_action) {
        stats.last_action = log.created_at;
      }
    }

    stats.unique_ips = Array.from(ips);
    
    return stats;
  }

  /**
   * Generates a unique ID for audit logs
   */
  private generateId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 9);
    return `${timestamp}-${random}`;
  }

  /**
   * Archives old audit logs (cleanup job)
   */
  async archiveOldLogs(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];
    
    let deleted = 0;
    const listed = await this.env.AUDIT_LOGS.list();
    
    for (const object of listed.objects) {
      const parts = object.key.split('/');
      if (parts.length >= 3) {
        const dateStr = parts[2];
        if (dateStr < cutoffStr) {
          await this.env.AUDIT_LOGS.delete(object.key);
          deleted++;
        }
      }
    }
    
    return deleted;
  }
}