import * as core from '@actions/core';
import { qstr } from '@jujulego/quick-tag';
import { minimatch } from 'minimatch';
import path from 'node:path';
import { Package } from 'normalize-package-data';
import { satisfies } from 'semver';

import { git } from '../git.ts';
import { Project } from './project.ts';

// Class
export class Workspace {
  // Attributes
  readonly cwd: string;

  private readonly _affectedCache = new Map<string, Promise<boolean>>();

  // Constructor
  constructor(
    readonly project: Project,
    cwd: string,
    readonly manifest: Package
  ) {
    this.cwd = path.resolve(project.root, cwd);
  }

  // Methods
  private _satisfies(from: Workspace, range: string): boolean {
    if (range.startsWith('file:')) {
      return path.resolve(from.cwd, range.substring(5)) === this.cwd;
    }

    if (range.startsWith('workspace:')) {
      range = range.substring(10);
    }

    return !this.version || satisfies(this.version, range);
  }

  private async _isAffected(reference: string, pattern = '**'): Promise<boolean> {
    let diff = await git.diff('--name-only', reference, '--', this.cwd);

    if (pattern !== '**') {
      const rel = path.relative(git.root, this.cwd);
      diff = diff.filter(minimatch.filter(path.join(rel, pattern)));
    }

    if (diff.length > 0) {
      return true;
    }

    // Test dependencies
    const proms: Promise<boolean>[] = [];

    for await (const dep of this.dependencies()) {
      proms.push(dep.isAffected(reference, pattern));
    }

    for await (const dep of this.devDependencies()) {
      proms.push(dep.isAffected(reference, pattern));
    }

    const results = await Promise.all(proms);
    return results.some(r => r);
  }

  async isAffected(reference: string, pattern = '**'): Promise<boolean> {
    let isAffected = this._affectedCache.get(`${reference},${pattern}`);

    if (!isAffected) {
      isAffected = this._isAffected(reference, pattern);
      this._affectedCache.set(reference, isAffected);
    }

    return await isAffected;
  }

  private async* _loadDependencies(dependencies: Record<string, string>, kind: string): AsyncGenerator<Workspace, void> {
    for (const [dep, range] of Object.entries(dependencies)) {
      const ws = await this.project.workspace(dep);

      if (ws) {
        if (ws._satisfies(this, range)) {
          yield ws;
        } else {
          core.debug(`Ignoring ${kind} ${ws.reference} as it does not match requirement ${range}`);
        }
      }
    }
  }

  async* dependencies(): AsyncGenerator<Workspace, void> {
    if (!this.manifest.dependencies) return;

    for await (const ws of this._loadDependencies(this.manifest.dependencies, 'dependency')) {
      yield ws;
    }
  }

  async* devDependencies(): AsyncGenerator<Workspace, void> {
    if (!this.manifest.devDependencies) return;

    for await (const ws of this._loadDependencies(this.manifest.devDependencies, 'devDependency')) {
      yield ws;
    }
  }

  // Properties
  get name(): string {
    return this.manifest.name;
  }

  get version(): string {
    return this.manifest.version;
  }

  get reference(): string {
    return qstr`${this.name}#?:${this.version}@#$?#`;
  }
}
