import * as core from '@actions/core';
import * as glob from '@actions/glob';
import path from 'path';

import { Workspace } from './workspace';

// Class
export class Project extends Workspace {
  // Attributes
  private readonly _workspaces = new Map<string, Workspace>();

  // Statics
  static async loadProject(root: string): Promise<Project> {
    const prj = new Project(await this.loadPackage(root), root);
    await prj.loadWorkspaces();

    return prj;
  }

  // Methods
  private async loadWorkspaces() {
    // Load workspaces
    if (this.pkg.workspaces && this.pkg.workspaces.length > 0) {
      const patterns = this.pkg.workspaces.map(wks => path.join(this.root, wks, 'package.json'));
      const globber = await glob.create(patterns.join('\n'));

      for await (let root of globber.globGenerator()) {
        root = root.replace(/[\\/]package\.json$/, '');

        try {
          // Store it
          const wks = await Workspace.loadWorkspace(root, this);
          this._workspaces.set(wks.name, wks);

        } catch (error) {
          core.warning(`Unable to load workspace at ${root}: ${error}`);
        }
      }
    }
  }

  getWorkspace(name: string): Workspace | null {
    return this._workspaces.get(name) || null;
  }
}
