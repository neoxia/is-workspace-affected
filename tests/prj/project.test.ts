import glob from '@actions/glob';
import { fs, vol } from 'memfs';
import path from 'node:path';
import { vi } from 'vitest';

import { Project } from '@/src/project/project.js';

// Mocks
vi.mock('@actions/glob', () => ({
  default: {
    create: vi.fn(() => ({
      async* globGenerator() {
        console.log('toto');
        yield 'wks-a';
        yield 'wks-b';
        yield 'wks-c';
      }
    })),
  }
}));
vi.mock('node:fs/promises', () => ({ default: fs.promises }));

// Setup
let project: Project;

beforeEach(() => {
  vi.clearAllMocks();

  // Setup project
  project = new Project('/project');

  // Setup memory fs
  vol.fromNestedJSON({
    'wks-a': {
      'package.json': JSON.stringify({
        name: 'wks-a',
        version: '1.0.0',
        dependencies: {
          'wks-b': '^1.0.0'
        },
        devDependencies: {
          'wks-c': '^1.0.0'
        }
      }),
    },
    'wks-b': {
      'package.json': JSON.stringify({
        name: 'wks-b',
        version: '1.0.0',
        devDependencies: {
          'wks-c': '^1.0.0'
        }
      }),
    },
    'wks-c': {
      'package.json': JSON.stringify({
        name: 'wks-c',
        version: '1.0.0'
      }),
    },
    'package.json': JSON.stringify({
      name: 'project',
      private: true,
      workspaces: ['wks-*'],
    }),
  }, '/project');
});

afterEach(() => {
  vol.reset();
});

// Tests
describe('new Project', () => {
  it('should resolve project root', () => {
    expect(project.root).toBe(path.resolve('/project'));
  });
});

describe('Project.mainWorkspace', () => {
  it('should load project manifest', async () => {
    const wks = await project.mainWorkspace();

    expect(wks.name).toBe('project');
  });
});

describe('Project.workspace', () => {
  it('should load all workspaces', async () => {
    const gen = project.workspaces();

    await expect(gen.next()).resolves.toEqual({ done: false, value: expect.objectContaining({ name: 'project' }) });
    await expect(gen.next()).resolves.toEqual({ done: false, value: expect.objectContaining({ name: 'wks-a' }) });
    await expect(gen.next()).resolves.toEqual({ done: false, value: expect.objectContaining({ name: 'wks-b' }) });
    await expect(gen.next()).resolves.toEqual({ done: false, value: expect.objectContaining({ name: 'wks-c' }) });
    await expect(gen.next()).resolves.toEqual({ done: true });

    expect(glob.create).toHaveBeenCalledWith(path.resolve('/project/wks-*'), { matchDirectories: true });
  });
});
