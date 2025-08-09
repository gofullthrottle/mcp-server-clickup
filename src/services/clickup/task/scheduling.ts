import { TaskServiceCore } from './task-core.js';

export interface TaskSchedule {
  taskId: string;
  name: string;
  startDate?: Date;
  dueDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  completionPercentage?: number;
  priority?: number;
  dependencies?: string[];
  isCritical?: boolean;
  slack?: number; // Days of slack time
}

export interface ProjectTimeline {
  projectStart: Date;
  projectEnd: Date;
  totalDuration: number; // Days
  totalEstimatedHours: number;
  criticalPath: string[]; // Task IDs in critical path
  milestones: Array<{
    name: string;
    date: Date;
    taskId?: string;
  }>;
  parallelGroups: Array<{
    groupId: string;
    tasks: string[];
    startDate: Date;
    endDate: Date;
  }>;
}

export interface GanttChartData {
  tasks: Array<{
    id: string;
    name: string;
    start: Date;
    end: Date;
    progress: number;
    dependencies: string[];
    isCritical: boolean;
    level?: number;
    color?: string;
  }>;
  dependencies: Array<{
    from: string;
    to: string;
    type: 'finish-to-start' | 'start-to-start' | 'finish-to-finish' | 'start-to-finish';
    lag?: number;
  }>;
  timeline: {
    start: Date;
    end: Date;
    today: Date;
  };
  resources?: Array<{
    id: string;
    name: string;
    allocation: Array<{
      taskId: string;
      hours: number;
    }>;
  }>;
}

interface TaskNode {
  id: string;
  name: string;
  duration: number; // Days
  dependencies: string[];
  earlyStart?: number;
  earlyFinish?: number;
  lateStart?: number;
  lateFinish?: number;
  slack?: number;
  isCritical?: boolean;
}

export class TaskSchedulingService {
  constructor(private core: TaskServiceCore) {}

  /**
   * Calculate the critical path using the Critical Path Method (CPM)
   */
  async calculateCriticalPath(
    tasks: Array<{
      id: string;
      name: string;
      estimatedHours?: number;
      dependencies?: string[];
    }>
  ): Promise<{
    criticalPath: string[];
    projectDuration: number;
    taskSchedules: Map<string, TaskNode>;
  }> {
    try {
      // Convert tasks to nodes with duration in days
      const nodes = new Map<string, TaskNode>();
      
      for (const task of tasks) {
        nodes.set(task.id, {
          id: task.id,
          name: task.name,
          duration: Math.ceil((task.estimatedHours || 8) / 8), // Convert hours to days (8 hours/day)
          dependencies: task.dependencies || []
        });
      }

      // Forward pass: Calculate early start and early finish
      this.calculateEarlyTimes(nodes);

      // Backward pass: Calculate late start and late finish
      this.calculateLateTimes(nodes);

      // Calculate slack and identify critical path
      const criticalPath: string[] = [];
      let maxDuration = 0;

      for (const node of nodes.values()) {
        node.slack = (node.lateStart || 0) - (node.earlyStart || 0);
        node.isCritical = node.slack === 0;
        
        if (node.isCritical) {
          criticalPath.push(node.id);
        }
        
        maxDuration = Math.max(maxDuration, node.earlyFinish || 0);
      }

      // Sort critical path by early start time
      criticalPath.sort((a, b) => {
        const nodeA = nodes.get(a)!;
        const nodeB = nodes.get(b)!;
        return (nodeA.earlyStart || 0) - (nodeB.earlyStart || 0);
      });

      return {
        criticalPath,
        projectDuration: maxDuration,
        taskSchedules: nodes
      };
    } catch (error) {
      (this.core as any).handleError(error, 'Failed to calculate critical path');
      throw error;
    }
  }

  /**
   * Forward pass: Calculate early start and early finish times
   */
  private calculateEarlyTimes(nodes: Map<string, TaskNode>): void {
    const visited = new Set<string>();
    const queue: string[] = [];

    // Find tasks with no dependencies (starting points)
    for (const node of nodes.values()) {
      if (node.dependencies.length === 0) {
        node.earlyStart = 0;
        node.earlyFinish = node.duration;
        queue.push(node.id);
        visited.add(node.id);
      }
    }

    // Process tasks in topological order
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const current = nodes.get(currentId)!;

      // Find all tasks that depend on current task
      for (const node of nodes.values()) {
        if (node.dependencies.includes(currentId) && !visited.has(node.id)) {
          // Check if all dependencies have been processed
          const allDepsProcessed = node.dependencies.every(dep => visited.has(dep));
          
          if (allDepsProcessed) {
            // Calculate early start as max of all dependencies' early finish
            let maxEarlyFinish = 0;
            for (const depId of node.dependencies) {
              const dep = nodes.get(depId)!;
              maxEarlyFinish = Math.max(maxEarlyFinish, dep.earlyFinish || 0);
            }
            
            node.earlyStart = maxEarlyFinish;
            node.earlyFinish = node.earlyStart + node.duration;
            
            queue.push(node.id);
            visited.add(node.id);
          }
        }
      }
    }
  }

  /**
   * Backward pass: Calculate late start and late finish times
   */
  private calculateLateTimes(nodes: Map<string, TaskNode>): void {
    // Find the maximum early finish (project end time)
    let projectEnd = 0;
    for (const node of nodes.values()) {
      projectEnd = Math.max(projectEnd, node.earlyFinish || 0);
    }

    // Initialize tasks with no successors
    const hasSuccessors = new Set<string>();
    for (const node of nodes.values()) {
      for (const dep of node.dependencies) {
        hasSuccessors.add(dep);
      }
    }

    for (const node of nodes.values()) {
      if (!hasSuccessors.has(node.id)) {
        node.lateFinish = projectEnd;
        node.lateStart = node.lateFinish - node.duration;
      }
    }

    // Process remaining tasks in reverse topological order
    const processed = new Set<string>();
    let changed = true;
    
    while (changed) {
      changed = false;
      
      for (const node of nodes.values()) {
        if (!processed.has(node.id) && hasSuccessors.has(node.id)) {
          // Find all tasks that depend on this task
          let minLateStart = Infinity;
          let hasUnprocessedSuccessors = false;
          
          for (const successor of nodes.values()) {
            if (successor.dependencies.includes(node.id)) {
              if (successor.lateStart !== undefined) {
                minLateStart = Math.min(minLateStart, successor.lateStart);
              } else {
                hasUnprocessedSuccessors = true;
              }
            }
          }
          
          if (!hasUnprocessedSuccessors && minLateStart !== Infinity) {
            node.lateFinish = minLateStart;
            node.lateStart = node.lateFinish - node.duration;
            processed.add(node.id);
            changed = true;
          }
        }
      }
    }
  }

  /**
   * Identify parallel task groups that can be executed concurrently
   */
  async identifyParallelGroups(
    tasks: Array<{
      id: string;
      name: string;
      dependencies?: string[];
    }>
  ): Promise<Array<{ groupId: string; tasks: string[] }>> {
    try {
      const groups: Array<{ groupId: string; tasks: string[] }> = [];
      const assigned = new Set<string>();
      
      // Build dependency graph
      const dependencyGraph = new Map<string, Set<string>>();
      const reverseDependencyGraph = new Map<string, Set<string>>();
      
      for (const task of tasks) {
        dependencyGraph.set(task.id, new Set(task.dependencies || []));
        
        for (const dep of task.dependencies || []) {
          if (!reverseDependencyGraph.has(dep)) {
            reverseDependencyGraph.set(dep, new Set());
          }
          reverseDependencyGraph.get(dep)!.add(task.id);
        }
      }

      // Find tasks at each level
      let level = 0;
      let currentLevel = tasks.filter(t => (t.dependencies || []).length === 0);
      
      while (currentLevel.length > 0 && level < 100) { // Prevent infinite loops
        const groupTasks: string[] = [];
        
        for (const task of currentLevel) {
          if (!assigned.has(task.id)) {
            groupTasks.push(task.id);
            assigned.add(task.id);
          }
        }
        
        if (groupTasks.length > 0) {
          groups.push({
            groupId: `level_${level}`,
            tasks: groupTasks
          });
        }
        
        // Find next level
        const nextLevel: typeof tasks = [];
        for (const taskId of groupTasks) {
          const successors = reverseDependencyGraph.get(taskId) || new Set();
          
          for (const successorId of successors) {
            // Check if all dependencies of successor are assigned
            const successor = tasks.find(t => t.id === successorId);
            if (successor) {
              const allDepsAssigned = (successor.dependencies || []).every(dep => assigned.has(dep));
              if (allDepsAssigned && !assigned.has(successorId)) {
                nextLevel.push(successor);
              }
            }
          }
        }
        
        currentLevel = nextLevel;
        level++;
      }

      return groups;
    } catch (error) {
      (this.core as any).handleError(error, 'Failed to identify parallel groups');
      throw error;
    }
  }

  /**
   * Generate Gantt chart data structure
   */
  async generateGanttData(
    listId: string,
    options: {
      includeSubtasks?: boolean;
      startDate?: Date;
    } = {}
  ): Promise<GanttChartData> {
    try {
      // Fetch tasks from the list
      const tasks = await this.core.getTasks(listId, {
        include_closed: false,
        subtasks: options.includeSubtasks
      });

      const ganttTasks: GanttChartData['tasks'] = [];
      const dependencies: GanttChartData['dependencies'] = [];
      
      let minDate = new Date();
      let maxDate = new Date();
      
      // Process tasks
      for (const task of tasks) {
        const startDate = task.start_date ? new Date(parseInt(task.start_date)) : options.startDate || new Date();
        const dueDate = task.due_date ? new Date(parseInt(task.due_date)) : new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000); // Default 7 days
        
        minDate = minDate > startDate ? startDate : minDate;
        maxDate = maxDate < dueDate ? dueDate : maxDate;
        
        ganttTasks.push({
          id: task.id,
          name: task.name,
          start: startDate,
          end: dueDate,
          progress: (task.status as any)?.percent_complete || 0,
          dependencies: task.dependencies || [],
          isCritical: false, // Will be calculated
          level: task.parent ? 1 : 0,
          color: this.getPriorityColor(task.priority?.id)
        });

        // Add dependencies
        for (const depId of task.dependencies || []) {
          dependencies.push({
            from: depId,
            to: task.id,
            type: 'finish-to-start',
            lag: 0
          });
        }
      }

      // Calculate critical path if there are dependencies
      if (dependencies.length > 0) {
        const { criticalPath } = await this.calculateCriticalPath(
          ganttTasks.map(t => ({
            id: t.id,
            name: t.name,
            estimatedHours: Math.ceil((t.end.getTime() - t.start.getTime()) / (1000 * 60 * 60)),
            dependencies: t.dependencies
          }))
        );
        
        // Mark critical tasks
        for (const task of ganttTasks) {
          task.isCritical = criticalPath.includes(task.id);
        }
      }

      return {
        tasks: ganttTasks,
        dependencies,
        timeline: {
          start: minDate,
          end: maxDate,
          today: new Date()
        }
      };
    } catch (error) {
      (this.core as any).handleError(error, 'Failed to generate Gantt data');
      throw error;
    }
  }

  /**
   * Create automatic milestones based on task patterns
   */
  async createMilestones(
    tasks: Array<{
      id: string;
      name: string;
      dueDate?: Date;
      tags?: string[];
    }>,
    criticalPath: string[]
  ): Promise<Array<{ name: string; date: Date; taskId?: string }>> {
    const milestones: Array<{ name: string; date: Date; taskId?: string }> = [];
    
    // Pattern-based milestone detection
    const milestonePatterns = [
      { pattern: /kickoff|start|begin/i, name: 'Project Kickoff' },
      { pattern: /requirement|spec|analysis/i, name: 'Requirements Complete' },
      { pattern: /design|architect|plan/i, name: 'Design Complete' },
      { pattern: /develop|implement|build/i, name: 'Development Complete' },
      { pattern: /test|qa|quality/i, name: 'Testing Complete' },
      { pattern: /deploy|release|launch/i, name: 'Deployment Complete' },
      { pattern: /document|docs/i, name: 'Documentation Complete' }
    ];

    for (const pattern of milestonePatterns) {
      const matchingTasks = tasks.filter(t => 
        pattern.pattern.test(t.name) || (t.tags || []).some(tag => pattern.pattern.test(tag))
      );
      
      if (matchingTasks.length > 0) {
        // Use the task on critical path if available, otherwise the latest task
        const criticalTask = matchingTasks.find(t => criticalPath.includes(t.id));
        const selectedTask = criticalTask || matchingTasks.reduce((latest, current) => {
          if (!latest.dueDate) return current;
          if (!current.dueDate) return latest;
          return current.dueDate > latest.dueDate ? current : latest;
        });
        
        if (selectedTask.dueDate) {
          milestones.push({
            name: pattern.name,
            date: selectedTask.dueDate,
            taskId: selectedTask.id
          });
        }
      }
    }

    // Sort milestones by date
    milestones.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    return milestones;
  }

  /**
   * Calculate project timeline summary
   */
  async calculateProjectTimeline(
    tasks: Array<{
      id: string;
      name: string;
      startDate?: Date;
      dueDate?: Date;
      estimatedHours?: number;
      dependencies?: string[];
      tags?: string[];
    }>
  ): Promise<ProjectTimeline> {
    try {
      // Find project bounds
      let projectStart = new Date();
      let projectEnd = new Date();
      let totalEstimatedHours = 0;
      
      for (const task of tasks) {
        if (task.startDate && task.startDate < projectStart) {
          projectStart = task.startDate;
        }
        if (task.dueDate && task.dueDate > projectEnd) {
          projectEnd = task.dueDate;
        }
        totalEstimatedHours += task.estimatedHours || 0;
      }

      // Calculate critical path
      const { criticalPath } = await this.calculateCriticalPath(tasks);

      // Identify parallel groups
      const parallelGroups = await this.identifyParallelGroups(tasks);

      // Create milestones
      const milestones = await this.createMilestones(tasks, criticalPath);

      // Map parallel groups with dates
      const parallelGroupsWithDates = parallelGroups.map(group => {
        const groupTasks = tasks.filter(t => group.tasks.includes(t.id));
        const startDates = groupTasks.map(t => t.startDate).filter(Boolean) as Date[];
        const endDates = groupTasks.map(t => t.dueDate).filter(Boolean) as Date[];
        
        return {
          groupId: group.groupId,
          tasks: group.tasks,
          startDate: startDates.length > 0 ? new Date(Math.min(...startDates.map(d => d.getTime()))) : projectStart,
          endDate: endDates.length > 0 ? new Date(Math.max(...endDates.map(d => d.getTime()))) : projectEnd
        };
      });

      return {
        projectStart,
        projectEnd,
        totalDuration: Math.ceil((projectEnd.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24)), // Days
        totalEstimatedHours,
        criticalPath,
        milestones,
        parallelGroups: parallelGroupsWithDates
      };
    } catch (error) {
      (this.core as any).handleError(error, 'Failed to calculate project timeline');
      throw error;
    }
  }

  /**
   * Get color based on priority
   */
  private getPriorityColor(priority?: string): string {
    switch (priority) {
      case '1': return '#FF5733'; // Urgent - Red
      case '2': return '#FFA500'; // High - Orange
      case '3': return '#3498DB'; // Normal - Blue
      case '4': return '#95A5A6'; // Low - Gray
      default: return '#95A5A6';
    }
  }
}