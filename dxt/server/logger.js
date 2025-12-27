/**
 * SPDX-FileCopyrightText: © 2025 Talib Kareem <taazkareem@icloud.com>
 * SPDX-License-Identifier: MIT
 *
 * Logger module for MCP Server
 *
 * This module provides logging functionality that works in both Node.js and CloudFlare Workers environments.
 * In Node.js: writes to log file
 * In CloudFlare Workers: uses console logging
 */
import { LogLevel } from './config.js';
// Detect environment - CloudFlare Workers don't have process.env.NODE_ENV set typically
const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;
const isBrowser = typeof window !== 'undefined';
// Use INFO level by default in Workers, can be overridden via env
const configuredLevel = LogLevel.INFO;
let logStream = null;
let pid = 'worker';
// Only set up file logging in Node.js environment
if (isNode && !isBrowser) {
    try {
        const fs = await import('fs');
        const path = await import('path');
        const url = await import('url');
        const config = await import('./config.js');
        const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
        pid = process.pid;
        const logFileName = 'server.log';
        logStream = fs.createWriteStream(path.join(__dirname, logFileName), { flags: 'w' });
        logStream.write(`Logging initialized to ${path.join(__dirname, logFileName)}\n`);
    }
    catch (e) {
        // If imports fail, we're in Workers environment - use console
        console.log('Logger: Running in CloudFlare Workers mode');
    }
}
// Re-export LogLevel enum
export { LogLevel };
/**
 * Check if a log level is enabled based on the configured level
 * @param level The log level to check
 * @returns True if the level should be logged
 */
function isLevelEnabled(level) {
    return level >= configuredLevel;
}
/**
 * Log function that writes to file (Node.js) or console (Workers)
 * @param level Log level (trace, debug, info, warn, error)
 * @param message Message to log
 * @param data Optional data to include in log
 */
function log(level, message, data) {
    const levelEnum = level === 'trace' ? LogLevel.TRACE
        : level === 'debug' ? LogLevel.DEBUG
            : level === 'info' ? LogLevel.INFO
                : level === 'warn' ? LogLevel.WARN
                    : LogLevel.ERROR;
    // Skip if level is below configured level
    if (!isLevelEnabled(levelEnum)) {
        return;
    }
    const timestamp = new Date().toISOString();
    // Format the log message differently based on the level and data
    let logMessage = `[${timestamp}] [PID:${pid}] ${level.toUpperCase()}: ${message}`;
    // Format data differently based on content and log level
    if (data) {
        // For debugging and trace levels, try to make the data more readable
        if (level === 'debug' || level === 'trace') {
            // If data is a simple object with few properties, format it inline
            if (typeof data === 'object' && data !== null && !Array.isArray(data) &&
                Object.keys(data).length <= 4 && Object.keys(data).every(k => typeof data[k] !== 'object' || data[k] === null)) {
                const dataStr = Object.entries(data)
                    .map(([k, v]) => `${k}=${v === undefined ? 'undefined' :
                    (v === null ? 'null' :
                        (typeof v === 'string' ? `"${v}"` : v))}`)
                    .join(' ');
                logMessage += ` (${dataStr})`;
            }
            else {
                // For more complex data, keep the JSON format but on new lines
                logMessage += '\n' + JSON.stringify(data, null, 2);
            }
        }
        else {
            // For other levels, keep the original JSON format
            logMessage += '\n' + JSON.stringify(data, null, 2);
        }
    }
    // Write to file (Node.js) or console (Workers)
    if (logStream) {
        logStream.write(logMessage + '\n');
    }
    else {
        // CloudFlare Workers - use console
        if (level === 'error') {
            console.error(logMessage);
        }
        else if (level === 'warn') {
            console.warn(logMessage);
        }
        else {
            console.log(logMessage);
        }
    }
}
/**
 * Shorthand for info level logs
 * @param message Message to log
 * @param data Optional data to include in log
 */
export function info(message, data) {
    log('info', message, data);
}
/**
 * Shorthand for error level logs
 * @param message Message to log
 * @param data Optional data to include in log
 */
export function error(message, data) {
    log('error', message, data);
}
/**
 * Logger class for creating context-specific loggers
 */
export class Logger {
    /**
     * Create a new logger with context
     * @param context The context to prepend to log messages
     */
    constructor(context) {
        this.context = context;
    }
    /**
     * Check if a log level is enabled for this logger
     * @param level The level to check
     * @returns True if logging at this level is enabled
     */
    isLevelEnabled(level) {
        return isLevelEnabled(level);
    }
    /**
     * Log at trace level
     * @param message Message to log
     * @param data Optional data to include in log
     */
    trace(message, data) {
        log('trace', `[${this.context}] ${message}`, data);
    }
    /**
     * Log at debug level
     * @param message Message to log
     * @param data Optional data to include in log
     */
    debug(message, data) {
        log('debug', `[${this.context}] ${message}`, data);
    }
    /**
     * Log at info level
     * @param message Message to log
     * @param data Optional data to include in log
     */
    info(message, data) {
        log('info', `[${this.context}] ${message}`, data);
    }
    /**
     * Log at warn level
     * @param message Message to log
     * @param data Optional data to include in log
     */
    warn(message, data) {
        log('warn', `[${this.context}] ${message}`, data);
    }
    /**
     * Log at error level
     * @param message Message to log
     * @param data Optional data to include in log
     */
    error(message, data) {
        log('error', `[${this.context}] ${message}`, data);
    }
}
// Handle SIGTERM for clean shutdown (Node.js only)
if (isNode && logStream) {
    process.on('SIGTERM', () => {
        log('info', 'Received SIGTERM signal, shutting down...');
        logStream.end(() => {
            process.exit(0);
        });
    });
}
