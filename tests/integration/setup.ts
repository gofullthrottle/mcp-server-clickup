/**
 * Integration Test Environment Setup
 *
 * Creates and manages dedicated test space for integration testing.
 * Test Space: "MCP-Integration-Tests-2025"
 *
 * Usage:
 *   import { setupTestEnvironment, teardownTestEnvironment } from './setup';
 *
 *   beforeAll(async () => {
 *     await setupTestEnvironment();
 *   });
 *
 *   afterAll(async () => {
 *     await teardownTestEnvironment();
 *   });
 */

import axios from 'axios';
import { afterAll, beforeAll } from 'vitest';

// Test environment configuration
export interface TestEnvironment {
  apiKey: string;
  teamId: string;
  spaceId: string;
  spaceName: string;
  folderId?: string;
  listId?: string;
  createdResources: {
    tasks: string[];
    lists: string[];
    folders: string[];
  };
}

// Singleton test environment
let testEnv: TestEnvironment | null = null;

/**
 * Get or create test environment
 */
export async function getTestEnvironment(): Promise<TestEnvironment> {
  if (testEnv) {
    return testEnv;
  }

  // Load from environment variables
  const apiKey = process.env.CLICKUP_API_KEY;
  const teamId = process.env.CLICKUP_TEAM_ID;

  if (!apiKey || !teamId) {
    throw new Error(
      'Missing required environment variables: CLICKUP_API_KEY, CLICKUP_TEAM_ID\n' +
      'Set these in .env.test file or export them before running tests'
    );
  }

  testEnv = {
    apiKey,
    teamId,
    spaceId: '',
    spaceName: 'MCP-Integration-Tests-2025',
    createdResources: {
      tasks: [],
      lists: [],
      folders: []
    }
  };

  return testEnv;
}

/**
 * Setup test environment
 * Creates dedicated test space if it doesn't exist
 */
export async function setupTestEnvironment(): Promise<TestEnvironment> {
  const env = await getTestEnvironment();

  console.log('🔧 Setting up integration test environment...');

  try {
    // Check if test space exists
    const spacesResponse = await axios.get(
      `https://api.clickup.com/api/v2/team/${env.teamId}/space`,
      {
        headers: {
          'Authorization': env.apiKey,
          'Content-Type': 'application/json'
        }
      }
    );

    const existingSpace = spacesResponse.data.spaces.find(
      (s: any) => s.name === env.spaceName
    );

    if (existingSpace) {
      console.log(`✅ Found existing test space: ${existingSpace.id}`);
      env.spaceId = existingSpace.id;
    } else {
      // Create test space
      console.log(`📝 Creating test space: ${env.spaceName}...`);
      const createResponse = await axios.post(
        `https://api.clickup.com/api/v2/team/${env.teamId}/space`,
        {
          name: env.spaceName,
          multiple_assignees: true,
          features: {
            due_dates: {
              enabled: true,
              start_date: true,
              remap_due_dates: true,
              remap_closed_due_date: false
            },
            time_tracking: {
              enabled: true
            },
            tags: {
              enabled: true
            },
            custom_fields: {
              enabled: true
            },
            dependency_warning: {
              enabled: true
            }
          }
        },
        {
          headers: {
            'Authorization': env.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      env.spaceId = createResponse.data.id;
      console.log(`✅ Created test space: ${env.spaceId}`);
    }

    // Create default test folder if needed
    const foldersResponse = await axios.get(
      `https://api.clickup.com/api/v2/space/${env.spaceId}/folder`,
      {
        headers: {
          'Authorization': env.apiKey
        }
      }
    );

    const existingFolder = foldersResponse.data.folders.find(
      (f: any) => f.name === 'Test Data'
    );

    if (existingFolder) {
      env.folderId = existingFolder.id;
      console.log(`✅ Found existing test folder: ${env.folderId}`);
    } else {
      const folderResponse = await axios.post(
        `https://api.clickup.com/api/v2/space/${env.spaceId}/folder`,
        {
          name: 'Test Data'
        },
        {
          headers: {
            'Authorization': env.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      env.folderId = folderResponse.data.id;
      env.createdResources.folders.push(env.folderId);
      console.log(`✅ Created test folder: ${env.folderId}`);
    }

    // Create default test list if needed
    const listsResponse = await axios.get(
      `https://api.clickup.com/api/v2/folder/${env.folderId}/list`,
      {
        headers: {
          'Authorization': env.apiKey
        }
      }
    );

    const existingList = listsResponse.data.lists.find(
      (l: any) => l.name === 'Test Tasks'
    );

    if (existingList) {
      env.listId = existingList.id;
      console.log(`✅ Found existing test list: ${env.listId}`);
    } else {
      const listResponse = await axios.post(
        `https://api.clickup.com/api/v2/folder/${env.folderId}/list`,
        {
          name: 'Test Tasks',
          content: 'Test tasks created during integration testing',
          due_date_time: false,
          priority: 1,
          assignee: null,
          status: 'red'
        },
        {
          headers: {
            'Authorization': env.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      env.listId = listResponse.data.id;
      env.createdResources.lists.push(env.listId);
      console.log(`✅ Created test list: ${env.listId}`);
    }

    console.log('✅ Test environment ready!');
    console.log(`   Space: ${env.spaceName} (${env.spaceId})`);
    console.log(`   Folder: Test Data (${env.folderId})`);
    console.log(`   List: Test Tasks (${env.listId})`);

    return env;

  } catch (error: any) {
    console.error('❌ Failed to setup test environment:', error.message);
    if (error.response) {
      console.error('   API Response:', error.response.data);
    }
    throw error;
  }
}

/**
 * Teardown test environment
 * Cleans up test data created during tests
 */
export async function teardownTestEnvironment(
  deleteSpace: boolean = false
): Promise<void> {
  const env = await getTestEnvironment();

  console.log('🧹 Cleaning up test environment...');

  try {
    // Delete tasks created during tests
    if (env.createdResources.tasks.length > 0) {
      console.log(`   Deleting ${env.createdResources.tasks.length} tasks...`);
      await Promise.allSettled(
        env.createdResources.tasks.map(taskId =>
          axios.delete(
            `https://api.clickup.com/api/v2/task/${taskId}`,
            {
              headers: {
                'Authorization': env.apiKey
              }
            }
          ).catch(err => {
            console.warn(`   ⚠️  Failed to delete task ${taskId}:`, err.message);
          })
        )
      );
      env.createdResources.tasks = [];
    }

    // Delete lists created during tests
    if (env.createdResources.lists.length > 0) {
      console.log(`   Deleting ${env.createdResources.lists.length} lists...`);
      await Promise.allSettled(
        env.createdResources.lists.map(listId =>
          axios.delete(
            `https://api.clickup.com/api/v2/list/${listId}`,
            {
              headers: {
                'Authorization': env.apiKey
              }
            }
          ).catch(err => {
            console.warn(`   ⚠️  Failed to delete list ${listId}:`, err.message);
          })
        )
      );
      env.createdResources.lists = [];
    }

    // Delete folders created during tests
    if (env.createdResources.folders.length > 0) {
      console.log(`   Deleting ${env.createdResources.folders.length} folders...`);
      await Promise.allSettled(
        env.createdResources.folders.map(folderId =>
          axios.delete(
            `https://api.clickup.com/api/v2/folder/${folderId}`,
            {
              headers: {
                'Authorization': env.apiKey
              }
            }
          ).catch(err => {
            console.warn(`   ⚠️  Failed to delete folder ${folderId}:`, err.message);
          })
        )
      );
      env.createdResources.folders = [];
    }

    // Optionally delete entire test space
    if (deleteSpace && env.spaceId) {
      console.log(`   Deleting test space: ${env.spaceId}...`);
      await axios.delete(
        `https://api.clickup.com/api/v2/space/${env.spaceId}`,
        {
          headers: {
            'Authorization': env.apiKey
          }
        }
      );
      console.log(`   ✅ Deleted test space`);
    }

    console.log('✅ Test environment cleaned up!');

  } catch (error: any) {
    console.error('❌ Failed to cleanup test environment:', error.message);
    if (error.response) {
      console.error('   API Response:', error.response.data);
    }
    // Don't throw - best effort cleanup
  }
}

/**
 * Track task for cleanup
 */
export function trackTaskForCleanup(taskId: string): void {
  if (testEnv) {
    testEnv.createdResources.tasks.push(taskId);
  }
}

/**
 * Track list for cleanup
 */
export function trackListForCleanup(listId: string): void {
  if (testEnv) {
    testEnv.createdResources.lists.push(listId);
  }
}

/**
 * Track folder for cleanup
 */
export function trackFolderForCleanup(folderId: string): void {
  if (testEnv) {
    testEnv.createdResources.folders.push(folderId);
  }
}

/**
 * Global setup and teardown hooks
 * Can be imported in individual test files or configured globally
 */
export function setupIntegrationTestHooks(): void {
  beforeAll(async () => {
    await setupTestEnvironment();
  });

  afterAll(async () => {
    // Don't delete space by default - can be manually cleaned up
    await teardownTestEnvironment(false);
  });
}

/**
 * Clean up specific test resources after each test
 */
export async function cleanupTestResources(): Promise<void> {
  await teardownTestEnvironment(false);
}
