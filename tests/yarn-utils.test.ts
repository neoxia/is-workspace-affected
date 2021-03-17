import * as path from 'path';

import YarnUtils from '../src/yarn';

// Constants
const TEST_PROJECT_ROOT = path.join(__dirname, 'project');

// Tests
describe('YarnUtils.getProject', () => {
  it('should return a project with 3 workspaces', async () => {
    const project = await YarnUtils.getProject(TEST_PROJECT_ROOT);

    expect(project.workspaces).toEqual(expect.arrayContaining([
      expect.objectContaining({
        manifest: expect.objectContaining({
          name: expect.objectContaining({
            name: 'test-project'
          })
        })
      }),
      expect.objectContaining({
        manifest: expect.objectContaining({
          name: expect.objectContaining({
            name: 'test-a'
          })
        })
      }),
      expect.objectContaining({
        manifest: expect.objectContaining({
          name: expect.objectContaining({
            name: 'test-b'
          })
        })
      })
    ]));
  });
})
