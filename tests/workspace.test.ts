import path from 'node:path';

import { git } from '@/src/git';
import { Project } from '@/src/project';
import { Workspace } from '@/src/workspace';

// Constants
const TEST_PROJECT_ROOT = path.join(__dirname, 'project');

// Test suites
describe('Workspace.loadWorkspace', () => {
  const root = path.join(TEST_PROJECT_ROOT, 'test-a');

  it('should return the test-a workspace', async () => {
    await expect(Workspace.loadWorkspace(root))
      .resolves.toEqual(expect.objectContaining({
        name: 'test-a',
        root
      }));
  });
});

describe('Workspace.dependencies', () => {
  let prj: Project;

  beforeEach(async () => {
    prj = await Project.loadProject(TEST_PROJECT_ROOT);
  });

  // Tests
  it('should return test-b', () => {
    const wks = prj.getWorkspace('test-c');
    expect(wks).not.toBeNull();

    expect(Array.from(wks!.dependencies()))
      .toEqual([
        expect.objectContaining({ name: 'test-b' })
      ]);
  });

  it('should return nothing', () => {
    const wks = prj.getWorkspace('test-b');
    expect(wks).not.toBeNull();

    expect(Array.from(wks!.dependencies()))
      .toEqual([]);
  });
});

describe('Workspace.isAffected', () => {
  let prj: Project;

  beforeEach(async () => {
    jest.resetAllMocks();
    jest.restoreAllMocks();

    prj = await Project.loadProject(TEST_PROJECT_ROOT);
    git.root = TEST_PROJECT_ROOT;
  });

  // Tests
  describe('direct change', () => {
    it('should be affected (test-b, no pattern)', async () => {
      // Spy
      jest.spyOn(git, 'diff')
        .mockResolvedValue(['test-b/test.js']);

      // Test
      const wks = prj.getWorkspace('test-b');
      expect(wks).not.toBeNull();

      await expect(wks!.isAffected('master'))
        .resolves.toBeTruthy();

      expect(git.diff).toBeCalledTimes(1);
      expect(git.diff).toBeCalledWith('--name-only', 'master', '--', path.join(TEST_PROJECT_ROOT, 'test-b'));
    });

    it('should not be affected (test-b, no pattern)', async () => {
      // Spy
      jest.spyOn(git, 'diff')
        .mockResolvedValue([]);

      // Test
      const wks = prj.getWorkspace('test-b');
      expect(wks).not.toBeNull();

      await expect(wks!.isAffected('master'))
        .resolves.toBeFalsy();

      expect(git.diff).toBeCalledTimes(1);
      expect(git.diff).toBeCalledWith('--name-only', 'master', '--', path.join(TEST_PROJECT_ROOT, 'test-b'));
    });

    it('should be affected (test-b, with pattern)', async () => {
      // Spy
      jest.spyOn(git, 'diff')
        .mockResolvedValue(['test-b/src/test.js']);

      // Test
      const wks = prj.getWorkspace('test-b');
      expect(wks).not.toBeNull();

      await expect(wks!.isAffected('master', 'src/**'))
        .resolves.toBeTruthy();

      expect(git.diff).toBeCalledTimes(1);
      expect(git.diff).toBeCalledWith('--name-only', 'master', '--', path.join(TEST_PROJECT_ROOT, 'test-b'));
    });

    it('should not be affected (test-b, with pattern)', async () => {
      // Spy
      jest.spyOn(git, 'diff')
        .mockResolvedValue(['test-b/test.js']);

      // Test
      const wks = prj.getWorkspace('test-b');
      expect(wks).not.toBeNull();

      await expect(wks!.isAffected('master', '*.ts'))
        .resolves.toBeFalsy();

      expect(git.diff).toBeCalledTimes(1);
      expect(git.diff).toBeCalledWith('--name-only', 'master', '--', path.join(TEST_PROJECT_ROOT, 'test-b'));
    });
  });

  describe('dependency change', () => {
    it('should be affected (test-c, no pattern)', async () => {
      // Spy
      jest.spyOn(git, 'diff')
        .mockImplementation(async (...args) => args[args.length - 1].endsWith('test-b') ? ['test-b/test.js'] : []);

      // Test
      const wks = prj.getWorkspace('test-c');
      expect(wks).not.toBeNull();

      await expect(wks!.isAffected('master'))
        .resolves.toBeTruthy();

      expect(git.diff).toBeCalledTimes(2);
      expect(git.diff).toBeCalledWith('--name-only', 'master', '--', path.join(TEST_PROJECT_ROOT, 'test-c'));
      expect(git.diff).toBeCalledWith('--name-only', 'master', '--', path.join(TEST_PROJECT_ROOT, 'test-b'));
    });

    it('should not be affected (test-c, no pattern)', async () => {
      // Spy
      jest.spyOn(git, 'diff')
        .mockResolvedValue([]);

      // Test
      const wks = prj.getWorkspace('test-c');
      expect(wks).not.toBeNull();

      await expect(wks!.isAffected('master'))
        .resolves.toBeFalsy();

      expect(git.diff).toBeCalledTimes(2);
      expect(git.diff).toBeCalledWith('--name-only', 'master', '--', path.join(TEST_PROJECT_ROOT, 'test-c'));
      expect(git.diff).toBeCalledWith('--name-only', 'master', '--', path.join(TEST_PROJECT_ROOT, 'test-b'));
    });

    it('should be affected (test-c, with pattern)', async () => {
      // Spy
      jest.spyOn(git, 'diff')
        .mockImplementation(async (...args) => args[args.length - 1].endsWith('test-b') ? ['test-b/test.js'] : []);

      // Test
      const wks = prj.getWorkspace('test-c');
      expect(wks).not.toBeNull();

      await expect(wks!.isAffected('master', '*.js'))
        .resolves.toBeTruthy();

      expect(git.diff).toBeCalledTimes(2);
      expect(git.diff).toBeCalledWith('--name-only', 'master', '--', path.join(TEST_PROJECT_ROOT, 'test-c'));
      expect(git.diff).toBeCalledWith('--name-only', 'master', '--', path.join(TEST_PROJECT_ROOT, 'test-b'));
    });

    it('should not be affected (test-c, with pattern)', async () => {
      // Spy
      jest.spyOn(git, 'diff')
        .mockImplementation(async (...args) => args[args.length - 1].endsWith('test-b') ? ['test-b/test.js'] : []);


      // Test
      const wks = prj.getWorkspace('test-c');
      expect(wks).not.toBeNull();

      await expect(wks!.isAffected('master', '*.ts'))
        .resolves.toBeFalsy();

      expect(git.diff).toBeCalledTimes(2);
      expect(git.diff).toBeCalledWith('--name-only', 'master', '--', path.join(TEST_PROJECT_ROOT, 'test-c'));
      expect(git.diff).toBeCalledWith('--name-only', 'master', '--', path.join(TEST_PROJECT_ROOT, 'test-b'));
    });
  });
});
