export class TaskPlanningService {
    constructor(core, dependencies) {
        this.core = core;
        this.dependencies = dependencies;
    }
    /**
     * Parse a markdown/text plan and create tasks from it
     */
    async createTasksFromPlan(listId, planText, options = {}) {
        try {
            const parsedTasks = this.parsePlanText(planText);
            const createdTasks = [];
            const taskMap = new Map(); // Track task IDs by index
            // Create tasks maintaining hierarchy
            for (let i = 0; i < parsedTasks.length; i++) {
                const task = parsedTasks[i];
                // Determine parent task
                let parentId = options.parentTaskId;
                if (task.level > 0) {
                    // Find the nearest parent task (previous task with lower level)
                    for (let j = i - 1; j >= 0; j--) {
                        if (parsedTasks[j].level < task.level) {
                            parentId = taskMap.get(j);
                            break;
                        }
                    }
                }
                // Create task data
                const taskData = {
                    name: task.title,
                    description: task.description || '',
                    priority: this.mapPriorityFromText(task.priority) || options.defaultPriority || 3,
                    status: task.completed ? 'complete' : 'open',
                    tags: [...(options.defaultTags || []), ...(task.tags || [])]
                };
                if (parentId) {
                    taskData.parent = parentId;
                }
                // Create the task
                const createdTask = await this.core.createTask(listId, taskData);
                taskMap.set(i, createdTask.id);
                createdTasks.push({
                    id: createdTask.id,
                    name: createdTask.name,
                    level: task.level
                });
                // Auto-detect and create dependencies if enabled
                if (options.autoDetectDependencies) {
                    const dependencies = this.detectDependencies(task.title, parsedTasks, i);
                    for (const depIndex of dependencies) {
                        const depTaskId = taskMap.get(depIndex);
                        if (depTaskId) {
                            try {
                                await this.dependencies.addDependency(createdTask.id, depTaskId);
                            }
                            catch (depError) {
                                // Log but don't fail on dependency errors
                                this.core.logger.debug(`Could not add dependency: ${depError}`);
                            }
                        }
                    }
                }
            }
            return createdTasks;
        }
        catch (error) {
            this.core.handleError(error, 'Failed to create tasks from plan');
            throw error;
        }
    }
    /**
     * Parse plan text into structured tasks
     */
    parsePlanText(planText) {
        const lines = planText.split('\n');
        const tasks = [];
        for (const line of lines) {
            if (!line.trim())
                continue;
            // Check for markdown checkbox format: - [ ] or - [x]
            const checkboxMatch = line.match(/^(\s*)- \[([ x])\] (.+)/);
            if (checkboxMatch) {
                const level = Math.floor(checkboxMatch[1].length / 2);
                const completed = checkboxMatch[2] === 'x';
                const content = checkboxMatch[3];
                tasks.push(this.parseTaskContent(content, level, completed));
                continue;
            }
            // Check for numbered list format: 1. or 1)
            const numberedMatch = line.match(/^(\s*)\d+[.)]\s+(.+)/);
            if (numberedMatch) {
                const level = Math.floor(numberedMatch[1].length / 2);
                const content = numberedMatch[2];
                tasks.push(this.parseTaskContent(content, level, false));
                continue;
            }
            // Check for bullet list format: - or *
            const bulletMatch = line.match(/^(\s*)[-*]\s+(.+)/);
            if (bulletMatch) {
                const level = Math.floor(bulletMatch[1].length / 2);
                const content = bulletMatch[2];
                tasks.push(this.parseTaskContent(content, level, false));
                continue;
            }
            // Check for section headers as tasks: # or ##
            const headerMatch = line.match(/^(#+)\s+(.+)/);
            if (headerMatch) {
                const level = headerMatch[1].length - 1;
                const content = headerMatch[2];
                tasks.push(this.parseTaskContent(content, level, false));
                continue;
            }
            // Plain text line - treat as level 0 task
            if (line.trim()) {
                tasks.push(this.parseTaskContent(line.trim(), 0, false));
            }
        }
        return tasks;
    }
    /**
     * Parse task content for metadata
     */
    parseTaskContent(content, level, completed) {
        const task = {
            level,
            title: content,
            completed
        };
        // Extract priority: [P1], [HIGH], !!, etc.
        const priorityMatch = content.match(/\[P([0-4])\]|\[(HIGH|MEDIUM|LOW)\]|(!{1,3})/i);
        if (priorityMatch) {
            task.priority = priorityMatch[0];
            task.title = content.replace(priorityMatch[0], '').trim();
        }
        // Extract tags: #tag or [tag]
        const tags = [];
        const tagMatches = content.matchAll(/#(\w+)|\[(\w+)\]/g);
        for (const match of tagMatches) {
            tags.push(match[1] || match[2]);
        }
        if (tags.length > 0) {
            task.tags = tags;
            // Remove tags from title
            task.title = task.title.replace(/#\w+|\[\w+\]/g, '').trim();
        }
        // Extract assignee: @username
        const assigneeMatch = content.match(/@(\w+)/);
        if (assigneeMatch) {
            task.assignee = assigneeMatch[1];
            task.title = task.title.replace(assigneeMatch[0], '').trim();
        }
        // Extract description after colon or dash
        const descMatch = task.title.match(/^(.+?)[\:\-]\s+(.+)$/);
        if (descMatch) {
            task.title = descMatch[1].trim();
            task.description = descMatch[2].trim();
        }
        return task;
    }
    /**
     * Create bulk tasks with dependencies
     */
    async createBulkTasksWithDependencies(listId, config) {
        try {
            const createdTasks = [];
            const taskNameToId = new Map();
            // First pass: Create all tasks
            for (const taskConfig of config.tasks) {
                const taskData = {
                    name: taskConfig.name,
                    description: taskConfig.description || '',
                    priority: taskConfig.priority || 3,
                    tags: config.tags || []
                };
                if (config.startDate) {
                    taskData.start_date = config.startDate.getTime();
                }
                if (taskConfig.estimatedHours) {
                    taskData.time_estimate = taskConfig.estimatedHours * 3600000; // Convert to milliseconds
                }
                if (config.assignees && config.assignees.length > 0) {
                    taskData.assignees = config.assignees;
                }
                const task = await this.core.createTask(listId, taskData);
                taskNameToId.set(taskConfig.name, task.id);
                createdTasks.push({
                    id: task.id,
                    name: task.name,
                    dependencies: taskConfig.dependencies
                });
                // Create subtasks if provided
                if (taskConfig.subtasks && taskConfig.subtasks.length > 0) {
                    for (const subtask of taskConfig.subtasks) {
                        const subtaskData = {
                            name: subtask.name,
                            parent: task.id,
                            priority: taskConfig.priority || 3,
                            tags: config.tags || []
                        };
                        if (subtask.estimatedHours) {
                            subtaskData.time_estimate = subtask.estimatedHours * 3600000;
                        }
                        await this.core.createTask(listId, subtaskData);
                    }
                }
            }
            // Second pass: Create dependencies
            for (const task of createdTasks) {
                if (task.dependencies && task.dependencies.length > 0) {
                    for (const depName of task.dependencies) {
                        const depId = taskNameToId.get(depName);
                        if (depId) {
                            try {
                                await this.dependencies.addDependency(task.id, depId);
                            }
                            catch (depError) {
                                this.core.logger.debug(`Could not add dependency ${depName}: ${depError}`);
                            }
                        }
                    }
                }
            }
            return createdTasks;
        }
        catch (error) {
            this.core.handleError(error, 'Failed to create bulk tasks with dependencies');
            throw error;
        }
    }
    /**
     * Create a task with advanced scheduling options
     */
    async createTaskWithScheduling(listId, params) {
        try {
            // Calculate due date if not provided
            let dueDate = params.dueDate;
            if (!dueDate && params.estimatedHours) {
                dueDate = new Date(params.startDate);
                // Assume 8 hours per workday
                const days = Math.ceil(params.estimatedHours / 8);
                dueDate.setDate(dueDate.getDate() + days);
            }
            const taskData = {
                name: params.name,
                description: params.description || '',
                start_date: params.startDate.getTime(),
                priority: params.priority || 3,
                tags: params.tags || []
            };
            if (dueDate) {
                taskData.due_date = dueDate.getTime();
            }
            if (params.estimatedHours) {
                taskData.time_estimate = params.estimatedHours * 3600000;
            }
            if (params.assignees && params.assignees.length > 0) {
                taskData.assignees = params.assignees;
            }
            // Create the task
            const task = await this.core.createTask(listId, taskData);
            // Add dependencies if provided
            if (params.dependencies && params.dependencies.length > 0) {
                for (const depId of params.dependencies) {
                    try {
                        await this.dependencies.addDependency(task.id, depId);
                    }
                    catch (depError) {
                        this.core.logger.debug(`Could not add dependency: ${depError}`);
                    }
                }
            }
            // Set custom fields if provided
            if (params.customFields && Object.keys(params.customFields).length > 0) {
                // This would need the custom field service integration
                this.core.logger.debug('Custom fields would be set here if service was available');
            }
            return {
                id: task.id,
                name: task.name,
                startDate: params.startDate,
                dueDate,
                estimatedHours: params.estimatedHours,
                dependencies: params.dependencies || []
            };
        }
        catch (error) {
            this.core.handleError(error, 'Failed to create task with scheduling');
            throw error;
        }
    }
    /**
     * Map priority text to ClickUp priority number
     */
    mapPriorityFromText(priorityText) {
        if (!priorityText)
            return undefined;
        const text = priorityText.toUpperCase();
        // P1-P4 format
        if (text.includes('P1'))
            return 1;
        if (text.includes('P2'))
            return 2;
        if (text.includes('P3'))
            return 3;
        if (text.includes('P4'))
            return 4;
        // HIGH/MEDIUM/LOW format
        if (text.includes('HIGH') || text === '!!!')
            return 1;
        if (text.includes('MEDIUM') || text === '!!')
            return 2;
        if (text.includes('LOW') || text === '!')
            return 4;
        // URGENT/CRITICAL
        if (text.includes('URGENT') || text.includes('CRITICAL'))
            return 1;
        return undefined;
    }
    /**
     * Detect potential dependencies from task text
     */
    detectDependencies(taskTitle, allTasks, currentIndex) {
        const dependencies = [];
        const lowerTitle = taskTitle.toLowerCase();
        // Look for explicit dependency keywords
        const depKeywords = ['after', 'depends on', 'requires', 'following', 'once'];
        for (const keyword of depKeywords) {
            if (lowerTitle.includes(keyword)) {
                // Find potential dependency in previous tasks
                for (let i = 0; i < currentIndex; i++) {
                    const prevTask = allTasks[i];
                    // Simple heuristic: if the previous task name is mentioned
                    const prevWords = prevTask.title.toLowerCase().split(/\s+/);
                    for (const word of prevWords) {
                        if (word.length > 4 && lowerTitle.includes(word)) {
                            dependencies.push(i);
                            break;
                        }
                    }
                }
            }
        }
        // Sequential dependency heuristic for same-level tasks
        if (dependencies.length === 0 && currentIndex > 0) {
            const currentLevel = allTasks[currentIndex].level;
            // Check if this appears to be a sequential step
            const sequentialKeywords = ['then', 'next', 'finally', 'step'];
            if (sequentialKeywords.some(kw => lowerTitle.includes(kw))) {
                // Find the previous task at the same level
                for (let i = currentIndex - 1; i >= 0; i--) {
                    if (allTasks[i].level === currentLevel) {
                        dependencies.push(i);
                        break;
                    }
                }
            }
        }
        return dependencies;
    }
}
