import { promises as fs } from 'fs';
import minimatch from 'minimatch';
import path from 'path';

import { git } from './git';
import { Package } from './package';

// Class
export class Workspace {
  // Constructor
  protected constructor(
    readonly root: string,
    protected readonly pkg: Package
  ) {}

  // Statics
  protected static async loadPackage(root: string): Promise<Package> {
    const file = path.join(root, 'package.json');
    const data = await fs.readFile(file, 'utf-8');

    return JSON.parse(data);
  }

  static async loadWorkspace(root: string): Promise<Workspace> {
    return new Workspace(root, await this.loadPackage(root));
  }

  // Methods
  async isAffected(baseRef: string, pattern = '**'): Promise<boolean> {
    // Compute diff
    const diff = await git.diff('--name-only', baseRef, '--', this.root);

    // No pattern
    if (pattern === '**') {
      return diff.length > 0;
    }

    return diff.some(minimatch.filter(pattern));
  }

  // Properties
  get name(): string {
    return this.pkg.name;
  }
}
