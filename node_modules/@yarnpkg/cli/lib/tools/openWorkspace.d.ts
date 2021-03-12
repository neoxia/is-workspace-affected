import { Configuration } from '@yarnpkg/core';
import { PortablePath } from '@yarnpkg/fslib';
export declare function openWorkspace(configuration: Configuration, cwd: PortablePath): Promise<import("@yarnpkg/core").Workspace>;
