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
  *dependencies(): Generator<Workspace, void> {
    if (!this.project) {
      core.warning(`Cannot load dependencies of workspace ${this.name}: loaded outside of a project`);
      return;
    }

    // Generate dependencies
    for (const deps of [this.pkg.dependencies, this.pkg.devDependencies]) {
      if (!deps) continue;

      for (const dep of Object.keys(deps)) {
        const wks = this.project.getWorkspace(dep);
        if (wks) yield wks;
      }
    }
  }

  private async _testAffected(baseRef: string, pattern = '**'): Promise<boolean> {
    core.info(`Testing workspace ${this.name}`);

    // Compute diff
    const diff = await git.diff('--name-only', baseRef, '--', this.root);

    // No pattern
    if (pattern === '**') {
      return diff.length > 0;
    }

    const rel = path.relative(git.root, this.root);
    return diff.some(minimatch.filter(path.join(rel, pattern)));
  }

  private async _testDepsAffected(tested: Set<Workspace>, baseRef: string, pattern = '**'): Promise<boolean> {
    tested.add(this);

    // Test if is affected
    const affected = await this._testAffected(baseRef, pattern);
    if (affected) return true;

    // Test dependencies if are affected
    for (const dep of this.dependencies()) {
      // Check if already tested
      if (tested.has(dep)) continue;

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
}
