import path from 'path';

import { Workspace } from '../src/workspace';

// Constants
const TEST_PROJECT_ROOT = path.join(__dirname, 'project');

// Tests
describe('Workspace.loadWorkspace', () => {
  it('should return the test-a workspace', async () => {
    const root = path.join(TEST_PROJECT_ROOT, 'test-a');
    const wks = await Workspace.loadWorkspace(root);

    expect(wks.root).toBe(root);
    expect(wks.name).toBe('test-a');
  });
})
