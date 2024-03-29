import { FetchResult, TagResult } from 'simple-git';
import { vi } from 'vitest';

import { git } from '@/src/git.js';

// Setup
beforeEach(() => {
  vi.clearAllMocks();
});

// Tests
describe('git.fetch', () => {
  it('should call git fetch command', async () => {
    const result = { raw: 'test' } as FetchResult;
    vi.spyOn(git.git, 'fetch').mockResolvedValue(result);

    // Call
    await expect(git.fetch('a', 'b')).resolves.toEqual(result);

    expect(git.git.fetch).toHaveBeenCalledWith(['a', 'b']);
  });
});

describe('git.diff', () => {
  it('should call git diff command', async () => {
    vi.spyOn(git.git, 'diff').mockResolvedValue('test\nlife=42');

    // Call
    await expect(git.diff('a', 'b')).resolves.toEqual([
      'test',
      'life=42'
    ]);

    expect(git.git.diff).toHaveBeenCalledWith(['a', 'b']);
  });
});

describe('git.tags', () => {
  const result: TagResult = {
    all: ['a', 'b'],
    latest: 'b',
  };

  beforeEach(() => {
    vi.spyOn(git.git, 'tags').mockResolvedValue(result);
  });

  it('should run git tag to load tags', async () => {
    await expect(git.tags()).resolves.toEqual(result);

    expect(git.git.tags).toHaveBeenCalled();
  });

  it('should run git fetch and git tag to load tags', async () => {
    vi.spyOn(git.git, 'fetch').mockResolvedValue({} as FetchResult);

    await expect(git.tags({ fetch: true })).resolves.toEqual(result);

    expect(git.git.fetch).toHaveBeenCalledWith(['--tags']);
    expect(git.git.tags).toHaveBeenCalled();
  });
});
