import { PortablePath } from '@yarnpkg/fslib';
import { UsageError } from 'clipanion';
export declare class WorkspaceRequiredError extends UsageError {
    constructor(projectCwd: PortablePath, cwd: PortablePath);
}
