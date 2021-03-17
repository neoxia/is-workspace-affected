import { promises as fs } from 'fs';
import * as path from 'path';

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

  // Properties
  get name(): string {
    return this.pkg.name;
  }
}
