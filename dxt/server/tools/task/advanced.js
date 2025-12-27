import { z } from 'zod';
import { taskService } from '../../services/shared.js';
export const advancedTaskTools = [
    {
        name: 'clickup_task_create_from_plan',
        description: 'Parse a markdown/text plan and create tasks with hierarchy. Supports checkboxes, numbered lists, bullet points, and headers.',
        inputSchema: {
            type: 'object',
            properties: {
                list_id: {
                    type: 'string',
                    description: 'List ID where tasks will be created'
                },
                plan_text: {
                    type: 'string',
                    description: 'Markdown/text plan with tasks (supports - [ ], 1., -, #)'
                },
                parent_task_id: {
                    type: 'string',
                    description: 'Optional parent task ID for all created tasks'
                },
                default_priority: {
                    type: 'number',
                    enum: [1, 2, 3, 4],
                    description: 'Default priority for tasks without explicit priority'
                },
                default_tags: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Tags to apply to all tasks'
                },
                auto_detect_dependencies: {
                    type: 'boolean',
                    description: 'Automatically detect and create task dependencies'
                }
            },
            required: ['list_id', 'plan_text']
        }
    },
    {
        name: 'clickup_task_create_with_scheduling',
        description: 'Create a task with advanced scheduling options including dependencies and time estimates.',
        inputSchema: {
            type: 'object',
            properties: {
                list_id: {
                    type: 'string',
                    description: 'List ID where the task will be created'
                },
                name: {
                    type: 'string',
                    description: 'Task name'
                },
                description: {
                    type: 'string',
                    description: 'Task description'
                },
                start_date: {
                    type: 'string',
                    description: 'Start date (ISO format)'
                },
                due_date: {
                    type: 'string',
                    description: 'Due date (ISO format, optional - calculated from estimated hours if not provided)'
                },
                estimated_hours: {
                    type: 'number',
                    description: 'Estimated hours for the task'
                },
                dependencies: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Task IDs that this task depends on'
                },
                priority: {
                    type: 'number',
                    enum: [1, 2, 3, 4],
                    description: 'Priority level'
                },
                assignees: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'User IDs to assign'
                },
                tags: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Tags to apply'
                }
            },
            required: ['list_id', 'name', 'start_date']
        }
    },
    {
        name: 'clickup_task_bulk_create_with_dependencies',
        description: 'Create multiple tasks in bulk with dependency relationships.',
        inputSchema: {
            type: 'object',
            properties: {
                list_id: {
                    type: 'string',
                    description: 'List ID where tasks will be created'
                },
                tasks: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            name: { type: 'string' },
                            description: { type: 'string' },
                            priority: { type: 'number' },
                            estimated_hours: { type: 'number' },
                            dependencies: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'Names of other tasks in this batch that this task depends on'
                            },
                            subtasks: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        name: { type: 'string' },
                                        estimated_hours: { type: 'number' }
                                    }
                                }
                            }
                        },
                        required: ['name']
                    },
                    description: 'Array of tasks to create'
                },
                start_date: {
                    type: 'string',
                    description: 'Project start date for all tasks (ISO format)'
                },
                assignees: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Default assignees for all tasks'
                },
                tags: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Default tags for all tasks'
                }
            },
            required: ['list_id', 'tasks']
        }
    },
    {
        name: 'clickup_task_calculate_timeline',
        description: 'Calculate project timeline, critical path, and parallel groups for tasks in a list.',
        inputSchema: {
            type: 'object',
            properties: {
                list_id: {
                    type: 'string',
                    description: 'List ID to analyze'
                },
                include_subtasks: {
                    type: 'boolean',
                    description: 'Include subtasks in analysis'
                }
            },
            required: ['list_id']
        }
    },
    {
        name: 'clickup_task_generate_gantt_data',
        description: 'Generate Gantt chart data structure for tasks in a list.',
        inputSchema: {
            type: 'object',
            properties: {
                list_id: {
                    type: 'string',
                    description: 'List ID to generate Gantt data for'
                },
                include_subtasks: {
                    type: 'boolean',
                    description: 'Include subtasks in Gantt chart'
                },
                start_date: {
                    type: 'string',
                    description: 'Default start date for tasks without dates (ISO format)'
                }
            },
            required: ['list_id']
        }
    },
    {
        name: 'clickup_task_identify_parallel_groups',
        description: 'Identify groups of tasks that can be executed in parallel.',
        inputSchema: {
            type: 'object',
            properties: {
                list_id: {
                    type: 'string',
                    description: 'List ID to analyze'
                }
            },
            required: ['list_id']
        }
    }
];
export async function handleAdvancedTaskTool(toolName, args) {
    switch (toolName) {
        case 'clickup_task_create_from_plan': {
            const validated = z.object({
                list_id: z.string(),
                plan_text: z.string(),
                parent_task_id: z.string().optional(),
                default_priority: z.number().min(1).max(4).optional(),
                default_tags: z.array(z.string()).optional(),
                auto_detect_dependencies: z.boolean().optional()
            }).parse(args);
            const tasks = await taskService.planning.createTasksFromPlan(validated.list_id, validated.plan_text, {
                parentTaskId: validated.parent_task_id,
                defaultPriority: validated.default_priority,
                defaultTags: validated.default_tags,
                autoDetectDependencies: validated.auto_detect_dependencies
            });
            return {
                tasks: tasks.map(t => ({
                    id: t.id,
                    name: t.name,
                    level: t.level
                })),
                count: tasks.length,
                message: `Created ${tasks.length} tasks from plan`
            };
        }
        case 'clickup_task_create_with_scheduling': {
            const validated = z.object({
                list_id: z.string(),
                name: z.string(),
                description: z.string().optional(),
                start_date: z.string(),
                due_date: z.string().optional(),
                estimated_hours: z.number().optional(),
                dependencies: z.array(z.string()).optional(),
                priority: z.number().min(1).max(4).optional(),
                assignees: z.array(z.string()).optional(),
                tags: z.array(z.string()).optional()
            }).parse(args);
            const task = await taskService.planning.createTaskWithScheduling(validated.list_id, {
                name: validated.name,
                description: validated.description,
                startDate: new Date(validated.start_date),
                dueDate: validated.due_date ? new Date(validated.due_date) : undefined,
                estimatedHours: validated.estimated_hours,
                dependencies: validated.dependencies,
                priority: validated.priority,
                assignees: validated.assignees,
                tags: validated.tags
            });
            return {
                task_id: task.id,
                name: task.name,
                start_date: task.startDate,
                due_date: task.dueDate,
                estimated_hours: task.estimatedHours,
                dependencies: task.dependencies,
                message: `Task "${task.name}" created with scheduling`
            };
        }
        case 'clickup_task_bulk_create_with_dependencies': {
            const validated = z.object({
                list_id: z.string(),
                tasks: z.array(z.object({
                    name: z.string(),
                    description: z.string().optional(),
                    priority: z.number().optional(),
                    estimated_hours: z.number().optional(),
                    dependencies: z.array(z.string()).optional(),
                    subtasks: z.array(z.object({
                        name: z.string(),
                        estimated_hours: z.number().optional()
                    })).optional()
                })),
                start_date: z.string().optional(),
                assignees: z.array(z.string()).optional(),
                tags: z.array(z.string()).optional()
            }).parse(args);
            const createdTasks = await taskService.planning.createBulkTasksWithDependencies(validated.list_id, {
                tasks: validated.tasks.map(t => ({
                    name: t.name,
                    description: t.description,
                    priority: t.priority,
                    estimatedHours: t.estimated_hours,
                    dependencies: t.dependencies,
                    subtasks: t.subtasks?.map(s => ({
                        name: s.name,
                        estimatedHours: s.estimated_hours
                    }))
                })),
                startDate: validated.start_date ? new Date(validated.start_date) : undefined,
                assignees: validated.assignees,
                tags: validated.tags
            });
            return {
                tasks: createdTasks.map(t => ({
                    id: t.id,
                    name: t.name,
                    dependencies: t.dependencies
                })),
                count: createdTasks.length,
                message: `Created ${createdTasks.length} tasks with dependencies`
            };
        }
        case 'clickup_task_calculate_timeline': {
            const validated = z.object({
                list_id: z.string(),
                include_subtasks: z.boolean().optional()
            }).parse(args);
            // Get tasks from the list
            const tasks = await taskService.getTasks(validated.list_id, {
                include_closed: false,
                subtasks: validated.include_subtasks
            });
            // Convert to timeline format
            const timelineTasks = tasks.map(t => ({
                id: t.id,
                name: t.name,
                startDate: t.start_date ? new Date(parseInt(t.start_date)) : undefined,
                dueDate: t.due_date ? new Date(parseInt(t.due_date)) : undefined,
                estimatedHours: t.time_estimate ? t.time_estimate / 3600000 : undefined,
                dependencies: t.dependencies || [],
                tags: t.tags?.map(tag => tag.name) || []
            }));
            const timeline = await taskService.scheduling.calculateProjectTimeline(timelineTasks);
            return {
                project_start: timeline.projectStart,
                project_end: timeline.projectEnd,
                total_duration_days: timeline.totalDuration,
                total_estimated_hours: timeline.totalEstimatedHours,
                critical_path: timeline.criticalPath,
                critical_path_length: timeline.criticalPath.length,
                milestones: timeline.milestones,
                parallel_groups: timeline.parallelGroups,
                message: `Timeline calculated: ${timeline.totalDuration} days, ${timeline.criticalPath.length} tasks on critical path`
            };
        }
        case 'clickup_task_generate_gantt_data': {
            const validated = z.object({
                list_id: z.string(),
                include_subtasks: z.boolean().optional(),
                start_date: z.string().optional()
            }).parse(args);
            const ganttData = await taskService.scheduling.generateGanttData(validated.list_id, {
                includeSubtasks: validated.include_subtasks,
                startDate: validated.start_date ? new Date(validated.start_date) : undefined
            });
            return {
                tasks: ganttData.tasks.map(t => ({
                    id: t.id,
                    name: t.name,
                    start: t.start,
                    end: t.end,
                    progress: t.progress,
                    is_critical: t.isCritical,
                    dependencies: t.dependencies
                })),
                dependencies: ganttData.dependencies,
                timeline: ganttData.timeline,
                task_count: ganttData.tasks.length,
                dependency_count: ganttData.dependencies.length,
                critical_tasks: ganttData.tasks.filter(t => t.isCritical).length,
                message: `Generated Gantt data for ${ganttData.tasks.length} tasks`
            };
        }
        case 'clickup_task_identify_parallel_groups': {
            const validated = z.object({
                list_id: z.string()
            }).parse(args);
            // Get tasks from the list
            const tasks = await taskService.getTasks(validated.list_id, {
                include_closed: false
            });
            // Convert to format for parallel group analysis
            const analysisTask = tasks.map(t => ({
                id: t.id,
                name: t.name,
                dependencies: t.dependencies || []
            }));
            const groups = await taskService.scheduling.identifyParallelGroups(analysisTask);
            return {
                parallel_groups: groups.map(g => ({
                    group_id: g.groupId,
                    tasks: g.tasks,
                    task_count: g.tasks.length
                })),
                total_groups: groups.length,
                message: `Identified ${groups.length} parallel task groups`
            };
        }
        default:
            throw new Error(`Unknown advanced task tool: ${toolName}`);
    }
}
