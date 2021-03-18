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
  private async _testAffected(baseRef: string, pattern = '**'): Promise<boolean> {
    core.info(`Testing workspace ${this.name}`);

    // Compute diff
    const diff = await git.diff('--name-only', baseRef, '--', this.root);

    // No pattern
    if (pattern === '**') {
      return diff.length > 0;
    }

    return diff.some(minimatch.filter(pattern));
  }

  private async _testDepsAffected(tested: Set<Workspace>, baseRef: string, pattern = '**'): Promise<boolean> {
    tested.add(this);

    // Test if affected
    const affected = this._testAffected(baseRef, pattern);
    if (affected) return true;

    // If not affected => test dependencies
    for (const dep of this.dependencies) {
      if (tested.has(dep)) continue; // Already tested

      // Test
      const affected = await dep._testDepsAffected(tested, baseRef, pattern);
      if (affected) return true;
    }

    return false;
  }

  async isAffected(baseRef: string, pattern = '**'): Promise<boolean> {
    return await this._testDepsAffected(new Set(), baseRef, pattern);
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

    if (this.pkg.devDependencies) {
      for (const dep of Object.keys(this.pkg.devDependencies)) {
        const wks = this.project.getWorkspace(dep);

        if (wks) {
          dependencies.push(wks);
        }
      }
    }

    return dependencies;
  }
}
