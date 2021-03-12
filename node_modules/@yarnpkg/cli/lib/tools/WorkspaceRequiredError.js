"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceRequiredError = void 0;
const core_1 = require("@yarnpkg/core");
const fslib_1 = require("@yarnpkg/fslib");
const clipanion_1 = require("clipanion");
class WorkspaceRequiredError extends clipanion_1.UsageError {
    constructor(projectCwd, cwd) {
        const relativePath = fslib_1.ppath.relative(projectCwd, cwd);
        const manifestPath = fslib_1.ppath.join(projectCwd, core_1.Manifest.fileName);
        super(`This command can only be run from within a workspace of your project (${relativePath} isn't a workspace of ${manifestPath}).`);
    }
}
exports.WorkspaceRequiredError = WorkspaceRequiredError;
