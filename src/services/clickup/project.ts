import { BaseClickUpService } from './base.js';
import { SpaceService } from './space.js';
import { FolderService } from './folder.js';
import { ListService } from './list.js';
import { TaskService } from './task/index.js';
import { CustomFieldDefinitionService } from './custom-fields.js';

export interface ProjectTemplate {
  name: string;
  description: string;
  folders: Array<{
    name: string;
    lists: string[];
  }>;
  customFields?: Array<{
    name: string;
    type: string;
    required?: boolean;
    options?: string[];
  }>;
  defaultTasks?: Array<{
    name: string;
    folder?: string;
    list?: string;
    priority?: number;
    status?: string;
  }>;
}

export interface ProjectConfig {
  name: string;
  description?: string;
  template?: string;
  startDate?: Date;
  durationDays?: number;
  enableGantt?: boolean;
  features?: {
    dependencies?: boolean;
    timeTracking?: boolean;
    customFields?: boolean;
    multipleAssignees?: boolean;
  };
}

export interface GanttProjectConfig {
  name: string;
  description: string;
  startDate: Date;
  dueDate: Date;
  estimatedHours?: number;
  priority?: number;
  customFields?: Record<string, any>;
  subtasks?: Array<{
    name: string;
    estimatedHours?: number;
    dependencies?: string[];
  }>;
}

// Predefined project templates
export const PROJECT_TEMPLATES: Record<string, ProjectTemplate> = {
  default: {
    name: 'Default',
    description: 'Standard project structure',
    folders: [
      { name: 'Planning & Design', lists: ['Requirements', 'Design', 'Architecture'] },
      { name: 'Development', lists: ['Features', 'Bugs', 'Improvements'] },
      { name: 'Testing & QA', lists: ['Test Cases', 'Bug Reports', 'Performance'] },
      { name: 'Documentation', lists: ['User Docs', 'API Docs', 'Guides'] },
      { name: 'Deployment', lists: ['Staging', 'Production', 'Rollback'] },
      { name: 'Setup & Configuration', lists: ['Environment', 'Dependencies', 'Credentials'] }
    ]
  },
  agile: {
    name: 'Agile',
    description: 'Agile/Scrum project structure',
    folders: [
      { name: 'Product', lists: ['Product Backlog', 'Epics', 'User Stories'] },
      { name: 'Sprints', lists: ['Sprint Planning', 'Sprint Backlog', 'Sprint Review'] },
      { name: 'Team', lists: ['Team Backlog', 'Impediments', 'Retrospectives'] },
      { name: 'Metrics', lists: ['Velocity', 'Burndown', 'Reports'] }
    ]
  },
  kanban: {
    name: 'Kanban',
    description: 'Kanban board structure',
    folders: [
      { name: 'Workflow', lists: ['Backlog', 'To Do', 'In Progress', 'Review', 'Done'] },
      { name: 'Work In Progress', lists: ['Active', 'Blocked', 'Waiting'] },
      { name: 'Continuous Improvement', lists: ['Ideas', 'Experiments', 'Metrics'] }
    ]
  }
};

export class ProjectService extends BaseClickUpService {
  private spaceService: SpaceService;
  private folderService: FolderService;
  private listService: ListService;
  private taskService: TaskService;
  private customFieldService: CustomFieldDefinitionService;

  constructor(
    apiKey: string,
    teamId: string,
    baseUrl?: string,
    spaceService?: SpaceService,
    folderService?: FolderService,
    listService?: ListService,
    taskService?: TaskService
  ) {
    super(apiKey, teamId, baseUrl || 'https://api.clickup.com/api/v2');
    
    // Initialize or use provided services
    this.spaceService = spaceService || new SpaceService(apiKey, teamId, baseUrl);
    this.folderService = folderService || new FolderService(apiKey, teamId, baseUrl);
    this.listService = listService || new ListService(apiKey, teamId, baseUrl);
    this.taskService = taskService || new TaskService(apiKey, teamId, baseUrl);
    this.customFieldService = new CustomFieldDefinitionService(apiKey, teamId, baseUrl);
  }

  /**
   * Initialize a complete project with space, folders, lists, and optional Gantt support
   */
  async initializeProject(config: ProjectConfig): Promise<{
    spaceId: string;
    folders: Array<{ id: string; name: string; lists: Array<{ id: string; name: string }> }>;
    ganttProject?: any;
    message: string;
  }> {
    try {
      // Create space with appropriate features
      const spaceFeatures = {
        due_dates: { enabled: true, start_date: true, remap_due_dates: true },
        time_tracking: { enabled: config.features?.timeTracking !== false },
        custom_fields: { enabled: config.features?.customFields !== false },
        remap_dependencies: { enabled: config.features?.dependencies !== false },
        dependency_warning: { enabled: config.features?.dependencies !== false },
        tags: { enabled: true },
        time_estimates: { enabled: true },
        checklists: { enabled: true },
        portfolios: { enabled: true }
      };

      const space = await this.spaceService.createSpace({
        name: config.name,
        multiple_assignees: config.features?.multipleAssignees !== false,
        features: spaceFeatures
      });

      // Apply template
      const template = PROJECT_TEMPLATES[config.template || 'default'];
      const createdFolders: any[] = [];

      for (const folderConfig of template.folders) {
        // Create folder
        const folder = await this.folderService.createFolder(space.id, {
          name: folderConfig.name
        });

        const createdLists: any[] = [];
        
        // Create lists in folder
        for (const listName of folderConfig.lists) {
          const list = await this.listService.createListInFolder(folder.id, {
            name: listName
          });
          createdLists.push({ id: list.id, name: list.name });
        }

        createdFolders.push({
          id: folder.id,
          name: folder.name,
          lists: createdLists
        });
      }

      // Create Gantt project if enabled
      let ganttProject;
      if (config.enableGantt && createdFolders.length > 0) {
        const mainList = createdFolders[0].lists[0]; // Use first list for main project
        ganttProject = await this.createGanttProject({
          listId: mainList.id,
          name: `${config.name} - Main Project`,
          description: config.description || `Main project task for ${config.name}`,
          startDate: config.startDate || new Date(),
          durationDays: config.durationDays || 90
        });
      }

      return {
        spaceId: space.id,
        folders: createdFolders,
        ganttProject,
        message: `Project "${config.name}" initialized with ${template.name} template`
      };
    } catch (error) {
      throw new Error(`Failed to initialize project ${config.name}: ${error.message}`);
    }
  }

  /**
   * Create a Gantt project task with timeline support
   */
  async createGanttProject(params: {
    listId: string;
    name: string;
    description: string;
    startDate: Date;
    durationDays: number;
    estimatedHours?: number;
    priority?: number;
  }): Promise<any> {
    try {
      const dueDate = new Date(params.startDate);
      dueDate.setDate(dueDate.getDate() + params.durationDays);

      const taskData: any = {
        name: params.name,
        description: params.description,
        start_date: params.startDate.getTime(),
        due_date: dueDate.getTime(),
        priority: params.priority || 2, // Normal priority
        status: 'Open'
      };

      if (params.estimatedHours) {
        taskData.time_estimate = params.estimatedHours * 3600000; // Convert hours to milliseconds
      }

      const task = await this.taskService.createTask(params.listId, taskData);

      // Set custom fields if available
      try {
        const customFields = await this.customFieldService.getListCustomFields(params.listId);
        
        // Look for project-related custom fields
        const projectTypeField = customFields.find(f => 
          f.name.toLowerCase().includes('project') && f.name.toLowerCase().includes('type')
        );
        
        if (projectTypeField) {
          await this.customFieldService.setCustomFieldValue(
            task.id,
            projectTypeField.id,
            'Gantt Project',
            projectTypeField.type
          );
        }
      } catch (fieldError) {
        // Custom fields are optional, don't fail if they're not available
        this.logger.debug('Could not set custom fields for Gantt project', fieldError);
      }

      return {
        id: task.id,
        name: task.name,
        startDate: params.startDate,
        dueDate,
        duration: params.durationDays,
        url: task.url
      };
    } catch (error) {
      throw new Error(`Failed to create Gantt project: ${error.message}`);
    }
  }

  /**
   * Apply a template to an existing space
   */
  async applyTemplate(spaceId: string, templateName: string): Promise<{
    folders: Array<{ id: string; name: string; lists: string[] }>;
    message: string;
  }> {
    try {
      const template = PROJECT_TEMPLATES[templateName];
      if (!template) {
        throw new Error(`Template "${templateName}" not found`);
      }

      const createdFolders: any[] = [];

      for (const folderConfig of template.folders) {
        const folder = await this.folderService.createFolder(spaceId, {
          name: folderConfig.name
        });

        const listNames: string[] = [];
        
        for (const listName of folderConfig.lists) {
          await this.listService.createListInFolder(folder.id, {
            name: listName
          });
          listNames.push(listName);
        }

        createdFolders.push({
          id: folder.id,
          name: folder.name,
          lists: listNames
        });
      }

      return {
        folders: createdFolders,
        message: `Applied ${template.name} template to space`
      };
    } catch (error) {
      throw new Error(`Failed to apply template ${templateName}: ${error.message}`);
    }
  }

  /**
   * Setup common custom fields for project management
   */
  async setupProjectCustomFields(spaceId: string): Promise<{
    fields: Array<{ name: string; type: string }>;
    message: string;
  }> {
    try {
      // Note: The ClickUp API doesn't directly support creating custom fields
      // This would require using the ClickUp web UI or enterprise API
      // For now, we'll document the recommended fields
      
      const recommendedFields = [
        { name: 'Estimated Hours', type: 'number' },
        { name: 'Actual Hours', type: 'number' },
        { name: 'Complexity', type: 'dropdown', options: ['Low', 'Medium', 'High', 'Critical'] },
        { name: 'Project Phase', type: 'dropdown', options: ['Planning', 'Design', 'Development', 'Testing', 'Deployment'] },
        { name: 'Blocking Reason', type: 'text' },
        { name: 'Critical Path', type: 'checkbox' },
        { name: 'Parallel Group', type: 'text' },
        { name: 'Completion %', type: 'manual_progress' }
      ];

      return {
        fields: recommendedFields.map(f => ({ name: f.name, type: f.type })),
        message: 'Custom fields recommended for project. Please create them in ClickUp UI.'
      };
    } catch (error) {
      throw new Error(`Failed to setup project custom fields: ${error.message}`);
    }
  }

  /**
   * Create project milestones based on phases
   */
  async createProjectMilestones(
    listId: string,
    projectStartDate: Date,
    projectDurationDays: number
  ): Promise<Array<{ id: string; name: string; dueDate: Date }>> {
    try {
      const milestones = [
        { name: 'Project Kickoff', offsetDays: 0 },
        { name: 'Requirements Complete', offsetDays: Math.floor(projectDurationDays * 0.15) },
        { name: 'Design Complete', offsetDays: Math.floor(projectDurationDays * 0.30) },
        { name: 'Development Complete', offsetDays: Math.floor(projectDurationDays * 0.70) },
        { name: 'Testing Complete', offsetDays: Math.floor(projectDurationDays * 0.85) },
        { name: 'Project Launch', offsetDays: projectDurationDays }
      ];

      const createdMilestones: any[] = [];

      for (const milestone of milestones) {
        const dueDate = new Date(projectStartDate);
        dueDate.setDate(dueDate.getDate() + milestone.offsetDays);

        const task = await this.taskService.createTask(listId, {
          name: `📍 ${milestone.name}`,
          due_date: dueDate.getTime(),
          priority: 1, // High priority
          tags: ['milestone']
        });

        createdMilestones.push({
          id: task.id,
          name: milestone.name,
          dueDate
        });
      }

      return createdMilestones;
    } catch (error) {
      throw new Error(`Failed to create project milestones: ${error.message}`);
    }
  }

  /**
   * Get available project templates
   */
  getTemplates(): Array<{ name: string; description: string }> {
    return Object.entries(PROJECT_TEMPLATES).map(([key, template]) => ({
      name: key,
      description: template.description
    }));
  }
}