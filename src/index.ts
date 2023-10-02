import * as core from '@actions/core';

import { git } from './git.ts';
import { Project } from './project/project.ts';

(async () => {
  try {
    // Load inputs
    const inputs = {
      projectRoot: core.getInput('project-root') || '.',
      workspace:   core.getInput('workspace', { required: true }),
      base:        core.getInput('base', { required: true }),
      pattern:     core.getInput('pattern') || '**'
    };

    // Fetch base
    git.setup(inputs.projectRoot);
    await git.fetch('origin', inputs.base, '--progress', '--depth=1');

    // Get workspace
    const project = new Project(inputs.projectRoot);
    const workspace = await project.workspace(inputs.workspace);

    if (!workspace) {
      return core.setFailed(`Workspace ${inputs.workspace} not found.`);
    }

    // Build base ref for git diff
    const tags = await git.tags({ fetch: true });
    const isTag = tags.all.some((tag) => tag === inputs.base);

    let baseRef = inputs.base;

    if (!isTag) {
      baseRef = `origin/${baseRef}`;
    }

    // Test if affected
    if (await workspace.isAffected(baseRef, inputs.pattern)) {
      core.setOutput('affected', true);
      core.info(`Workspace ${inputs.workspace} affected`);
    } else {
      core.info(`Workspace ${inputs.workspace} not affected`);
    }
  } catch (error) {
    core.setFailed(error.message);
  }
})();
