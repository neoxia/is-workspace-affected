import * as core from '@actions/core';
import * as glob from '@actions/glob';
import * as path from 'path';

import { Workspace } from './workspace';

// Class
export class Project extends Workspace {
  // Attributes
  private _workspaces?: Workspace[];

  // Statics
  static async loadProject(root: string): Promise<Project> {
    return new Project(root, await this.loadPackage(root));
  }

  // Methods
  private async* generateWorkspaces() {
    // Self ;)
    yield this;

    // Load workspaces
    if (this.pkg.workspaces && this.pkg.workspaces.length > 0) {
      const patterns = this.pkg.workspaces.map(wks => path.join(this.root, wks, 'package.json'));
      const globber = await glob.create(patterns.join('\n'));

      for await (let root of globber.globGenerator()) {
        root = root.replace(/[\\/]package\.json$/, '');

        try {
          yield await Workspace.loadWorkspace(root);
        } catch (error) {
          core.warning(`Unable to load workspace at ${root}: ${error}`);
        }
      }
    }
  }

  async getWorkspace(name: string): Promise<Workspace | null> {
    for await (const wks of this.generateWorkspaces()) {
      if (wks.name === name) return wks;
    }

    return null;
  }
}
