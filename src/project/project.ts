import core from '@actions/core';
import glob from '@actions/glob';
import { Lock } from '@jujulego/utils';
import normalize, { Package } from 'normalize-package-data';
import fs from 'node:fs/promises';
import path from 'node:path';

import { Workspace } from './workspace.ts';

// Class
export class Project {
  // Attributes
  readonly root: string;
  private readonly _lock = new Lock();

  private _isFullyLoaded = false;
  private _mainWorkspace?: Workspace;
  private readonly _names = new Map<string, Workspace>();
  private readonly _workspaces = new Map<string, Workspace>();

  // Constructor
  constructor(root: string) {
    this.root = path.resolve(root);
  }

  // Methods
  private async _loadManifest(dir: string): Promise<Package> {
    const file = path.resolve(this.root, dir, 'package.json');
    core.debug(`Loading ${path.relative(this.root, file)} ...`);

    const data = await fs.readFile(file, 'utf-8');
    const mnf = JSON.parse(data);
    normalize(mnf, (msg) => core.debug(msg));

    return mnf;
  }

  private async _loadWorkspace(dir: string): Promise<Workspace> {
    return await this._lock.with(async () => {
      let wks = this._workspaces.get(dir);

      if (!wks) {
        const manifest = await this._loadManifest(dir);
        wks = new Workspace(this, dir, manifest);

        this._workspaces.set(dir, wks);
        this._names.set(wks.name, wks);
      }

      return wks;
    });
  }

  async mainWorkspace(): Promise<Workspace> {
    if (!this._mainWorkspace) {
      const manifest = await this._loadManifest('.');
      this._mainWorkspace = new Workspace(this, '.', manifest);

      this._names.set(this._mainWorkspace.name, this._mainWorkspace);
    }

    return this._mainWorkspace;
  }

  async currentWorkspace(cwd = process.cwd()): Promise<Workspace | null> {
    let workspace: Workspace | null = null;
    cwd = path.resolve(cwd);

    for await (const wks of this.workspaces()) {
      if (cwd.startsWith(wks.cwd)) {
        workspace = wks;

        if (wks.cwd !== this.root) return wks;
      }
    }

    return workspace;
  }

  async* workspaces(): AsyncGenerator<Workspace, void> {
    const main = await this.mainWorkspace();
    yield main;

    if (this._isFullyLoaded) {
      for (const wks of this._names.values()) {
        if (wks.name !== main.name) yield wks;
      }
    } else {
      // Load child workspaces
      const { workspaces = [] } = main.manifest;

      for (const pattern of workspaces) {
        const globber = await glob.create(path.join(this.root, pattern), { matchDirectories: true })

        for await (const dir of globber.globGenerator()) {
          try {
            // Check if dir is a directory exists
            const file = path.resolve(this.root, dir);
            const stat = await fs.stat(file);

            if (stat.isDirectory()) {
              yield await this._loadWorkspace(dir);
            }

          } catch (error) {
            if (error.code === 'ENOENT') {
              continue;
            }

            throw error;
          }
        }
      }

      this._isFullyLoaded = true;
    }
  }

  async workspace(name?: string): Promise<Workspace | null> {
    // With current directory
    if (!name) {
      const dir = path.relative(this.root, process.cwd());
      return this._loadWorkspace(dir);
    }

    // Try name index
    const wks = this._names.get(name);

    if (wks) {
      return wks;
    }

    // Load workspaces
    if (!this._isFullyLoaded) {
      for await (const ws of this.workspaces()) {
        if (ws.name === name) {
          return ws;
        }
      }

      this._isFullyLoaded = true;
    }

    return null;
  }
}
