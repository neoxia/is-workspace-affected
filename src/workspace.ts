import * as core from '@actions/core';
import { promises as fs } from 'fs';
import minimatch from 'minimatch';
import path from 'path';

import { git } from './git';
import { Package } from './package';
import { Project } from './project';

// Class
export class Workspace {
  // Constructor
  constructor(
    protected readonly pkg: Package,
    readonly root: string,
    readonly project?: Project
  ) {}

  // Statics
  protected static async loadPackage(root: string): Promise<Package> {
    const file = path.join(root, 'package.json');
    const data = await fs.readFile(file, 'utf-8');

    return JSON.parse(data);
  }

  static async loadWorkspace(root: string, project?: Project): Promise<Workspace> {
    return new Workspace(await this.loadPackage(root), root, project);
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

  get dependencies(): Workspace[] {
    if (!this.project) {
      core.warning(`Cannot load dependencies of workspace ${this.name}: loaded outside of a project`);
      return [];
    }

    // Build dependency array
    const dependencies: Workspace[] = [];

    if (this.pkg.dependencies) {
      for (const dep of Object.keys(this.pkg.dependencies)) {
        const wks = this.project.getWorkspace(dep);

        if (wks) {
          dependencies.push(wks);
        }
      }
    }

    return dependencies;
  }
}
