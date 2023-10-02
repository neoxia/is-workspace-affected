import { fs, vol } from 'memfs';
import { Package } from 'normalize-package-data';

import { Project } from '@/src/project/project';
import { Workspace } from '@/src/project/workspace';

// Mocks
jest.mock('node:fs/promises', () => fs.promises);

// Setup
let project: Project;

beforeEach(() => {
  vol.fromNestedJSON({
    'wks-a': {
      'package.json': JSON.stringify({ name: 'wks-a', version: '0.0.0' }),
    },
    'package.json': JSON.stringify({
      name: 'project',
      private: true,
      workspace: ['wks-a'],
    }),
  }, '/project');

  project = new Project('/project');
});

afterEach(() => {
  vol.reset();
});

// Tests
describe('new Workspace', () => {
  it('should compute absolute cwd of workspace', () => {
    const wks = new Workspace('/wks-a', { name: 'wks-a', version: '0.0.0' } as Package, project);

    expect(wks.cwd).toBe('/project/wks-a');
  });
});
