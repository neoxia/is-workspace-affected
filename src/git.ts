import * as core from '@actions/core';
import simpleGit, { FetchResult, TagResult } from 'simple-git';

import { fixDefaultExport } from './utils.ts';

// Types
export interface GitTagsOptions {
  fetch?: boolean;
}

// Namespace
export const git = {
  // Attributes
  git: fixDefaultExport(simpleGit)(),
  root: process.cwd(),

  // Methods
  setup(root: string): void {
    this.git = fixDefaultExport(simpleGit)({ baseDir: root });
    this.root = root;
  },

  // Commands
  async fetch(...args: string[]): Promise<FetchResult> {
    return await core.group(`git fetch ${args.join(' ')}`, async () => {
      const res = await this.git.fetch(args);
      core.info(res.raw);

      return res;
    });
  },

  async diff(...args: string[]): Promise<string[]> {
    // Run command
    const res = await core.group(`git diff ${args.join(' ')}`, async () => {
      const res = await this.git.diff(args);
      core.info(res);

      return res;
    });

    // Parse result
    return res.split('\n').filter(f => f);
  },

  async tags(opts: GitTagsOptions = { fetch: false }): Promise<TagResult> {
    // Fetch tags
    if (opts.fetch) {
      await this.git.fetch(['--tags']);
    }

    // Get tags
    return await this.git.tags();
  }
};
