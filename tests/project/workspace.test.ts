import { fs, vol } from 'memfs';
import path from 'node:path';
import { Package } from 'normalize-package-data';
import { vi } from 'vitest';

import { git } from '@/src/git.js';
import { Project } from '@/src/project/project.js';
import { Workspace } from '@/src/project/workspace.js';

// Mocks
vi.mock('node:fs/promises', () => ({ default: fs.promises }));

// Setup
let project: Project;
let wksA: Workspace;
let wksB: Workspace;
let wksC: Workspace;

beforeEach(() => {
  // Setup project
  project = new Project('/project');

  wksA = new Workspace(project, 'wks-a', {
    _id: 'wks-a',
    name: 'wks-a',
    readme: '',
    version: '1.0.0',
    dependencies: {
      'wks-b': '^1.0.0'
    },
    devDependencies: {
      'wks-c': '^1.0.0'
    }
  } as Package);
  wksB = new Workspace(project, 'wks-b', {
    _id: 'wks-b',
    name: 'wks-b',
    readme: '',
    version: '1.0.0',
    devDependencies: {
      'wks-c': '^1.0.0'
    }
  } as Package);
  wksC = new Workspace(project, 'wks-c', {
    _id: 'wks-c',
    name: 'wks-c',
    readme: '',
    version: '1.0.0'
  } as Package);

  vi.spyOn(project, 'workspace').mockImplementation(async (name) => {
    return (name && ({ 'wks-a': wksA, 'wks-b': wksB, 'wks-c': wksC } as Record<string, Workspace>)[name]) || null;
  });

  // Setup memory fs
  vol.fromNestedJSON({
    'wks-a': {
      'package.json': JSON.stringify(wksA.manifest),
    },
    'wks-b': {
      'package.json': JSON.stringify(wksB.manifest),
    },
    'wks-c': {
      'package.json': JSON.stringify(wksC.manifest),
    },
  }, '/project');
});

afterEach(() => {
  vol.reset();
});

// Tests
describe('new Workspace', () => {
  it('should compute absolute cwd of workspace', () => {
    const wks = new Workspace(project, 'wks-a', { name: 'wks-a', version: '1.0.0' } as Package);

    expect(wks.cwd).toBe(path.resolve('/project/wks-a'));
  });

  it('should read elements from manifest', () => {
    const wks = new Workspace(project, 'wks-a', { name: 'wks-a', version: '1.0.0' } as Package);

    expect(wks.name).toBe('wks-a');
    expect(wks.version).toBe('1.0.0');
    expect(wks.reference).toBe('wks-a@1.0.0');
  });
});

describe('Workspace.isAffected', () => {
  it('should return true as tested workspace is affected', async () => {
    vi.spyOn(git, 'diff').mockResolvedValue(['affected.ts']);

    await expect(wksC.isAffected('master')).resolves.toBe(true);

    expect(git.diff).toHaveBeenCalledWith('--name-only', 'master', '--', wksC.cwd);
  });

  it('should return false as tested workspace is not affected', async () => {
    vi.spyOn(git, 'diff').mockResolvedValue([]);

    await expect(wksC.isAffected('master')).resolves.toBe(false);

    expect(git.diff).toHaveBeenCalledWith('--name-only', 'master', '--', wksC.cwd);
  });

  it('should return false as affected files do not match pattern', async () => {
    vi.spyOn(git, 'diff').mockResolvedValue(['affected.ts']);

    await expect(wksC.isAffected('master', '*.js')).resolves.toBe(false);

    expect(git.diff).toHaveBeenCalledWith('--name-only', 'master', '--', wksC.cwd);
  });

  it('should return true as tested workspace is not affected but its dependencies are', async () => {
    vi.spyOn(wksA, 'dependencies').mockImplementation(async function* () { yield wksB; });
    vi.spyOn(wksA, 'devDependencies').mockImplementation(async function* () { yield wksC; });
    vi.spyOn(wksB, 'isAffected').mockResolvedValue(true);
    vi.spyOn(wksC, 'isAffected').mockResolvedValue(false);

    vi.spyOn(git, 'diff').mockResolvedValue([]);

    await expect(wksA.isAffected('master')).resolves.toBe(true);

    expect(git.diff).toHaveBeenCalledWith('--name-only', 'master', '--', wksA.cwd);
    expect(wksB.isAffected).toHaveBeenCalled();
    expect(wksC.isAffected).toHaveBeenCalled();
  });

  it('should return true as tested workspace is not affected but its devDependencies are', async () => {
    vi.spyOn(wksA, 'dependencies').mockImplementation(async function* () { yield wksB; });
    vi.spyOn(wksA, 'devDependencies').mockImplementation(async function* () { yield wksC; });
    vi.spyOn(wksB, 'isAffected').mockResolvedValue(false);
    vi.spyOn(wksC, 'isAffected').mockResolvedValue(true);

    vi.spyOn(git, 'diff').mockResolvedValue([]);

    await expect(wksA.isAffected('master')).resolves.toBe(true);

    expect(git.diff).toHaveBeenCalledWith('--name-only', 'master', '--', wksA.cwd);
    expect(wksB.isAffected).toHaveBeenCalled();
    expect(wksC.isAffected).toHaveBeenCalled();
  });
});

describe('Workspace.dependencies', () => {
  it('should yield wks-b for wks-a', async () => {
    const gen = wksA.dependencies();

    await expect(gen.next()).resolves.toEqual({ done: false, value: wksB });
    await expect(gen.next()).resolves.toEqual({ done: true });

    expect(project.workspace).toHaveBeenCalledWith('wks-b');
  });

  it('should yield nothing for wks-b', async () => {
    const gen = wksB.dependencies();

    await expect(gen.next()).resolves.toEqual({ done: true });

    expect(project.workspace).not.toHaveBeenCalled();
  });

  it('should yield nothing for wks-c', async () => {
    const gen = wksC.dependencies();

    await expect(gen.next()).resolves.toEqual({ done: true });

    expect(project.workspace).not.toHaveBeenCalled();
  });
});

describe('Workspace.devDependencies', () => {
  it('should yield wks-c for wks-a', async () => {
    const gen = wksA.devDependencies();

    await expect(gen.next()).resolves.toEqual({ done: false, value: wksC });
    await expect(gen.next()).resolves.toEqual({ done: true });

    expect(project.workspace).toHaveBeenCalledWith('wks-c');
  });

  it('should yield wks-c for wks-b', async () => {
    const gen = wksB.devDependencies();

    await expect(gen.next()).resolves.toEqual({ done: false, value: wksC });
    await expect(gen.next()).resolves.toEqual({ done: true });

    expect(project.workspace).toHaveBeenCalledWith('wks-c');
  });

  it('should yield nothing for wks-c', async () => {
    const gen = wksC.devDependencies();

    await expect(gen.next()).resolves.toEqual({ done: true });

    expect(project.workspace).not.toHaveBeenCalled();
  });
});
