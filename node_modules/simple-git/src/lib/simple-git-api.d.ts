import { PushResult, SimpleGit, SimpleGitBase, TaskOptions } from '../../typings';
import { SimpleGitExecutor, SimpleGitTaskCallback } from './types';
export declare class SimpleGitApi implements SimpleGitBase {
    private _executor;
    constructor(_executor: SimpleGitExecutor);
    private _runTask;
    add(files: string | string[]): any;
    push(remote?: string, branch?: string, options?: TaskOptions, callback?: SimpleGitTaskCallback<PushResult>): SimpleGit & Promise<PushResult>;
    push(options?: TaskOptions, callback?: SimpleGitTaskCallback<PushResult>): SimpleGit & Promise<PushResult>;
    push(callback?: SimpleGitTaskCallback<PushResult>): SimpleGit & Promise<PushResult>;
}
