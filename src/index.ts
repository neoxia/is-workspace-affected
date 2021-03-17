import * as core from '@actions/core';
import simpleGit from 'simple-git';

import { Project } from './project';

(async () => {
  try {
    // Load inputs
    const inputs = {
      projectRoot: core.getInput('project-root') || '.',
      workspace:   core.getInput('workspace', { required: true }),
      base:        core.getInput('base', { required: true }),
    };

    // Load project
    const git = simpleGit({ baseDir: inputs.projectRoot });
    const project = await Project.loadProject(inputs.projectRoot);

    // Get workspace
    const workspace = await project.getWorkspace(inputs.workspace);

    if (!workspace) {
      return core.setFailed(`Workspace ${inputs.workspace} not found.`);
    }

    // Fetch tags
    const tags = await core.group('git fetch --tags', async () => {
      const result = await git.fetch(['--tags']);
      core.info(result.raw);

      return await git.tags();
    });

    // Fetch base
    await core.group(`git fetch origin ${inputs.base}`, async () => {
      const result = await git.fetch('origin', inputs.base, ['--progress', '--depth=1']);
      core.info(result.raw);
    });

    // Compute diff
    const isTag = tags.all.some(tag => tag === inputs.base);
    let baseRef = inputs.base;

    if (!isTag) {
      baseRef = `origin/${baseRef}`;
    }

    const diff = await core.group('git diff', async () => {
      const res = await git.diff(['--name-only', baseRef, '--', workspace.root]);
      core.info(res);

      return res;
    });

    // Test if affected
    const affected = diff.split('\n').some(l => l !== '');

    if (affected) {
      core.setOutput('affected', true);
      core.info(`Workspace ${inputs.workspace} affected`);
    } else {
      core.info(`Workspace ${inputs.workspace} not affected`);
    }

  } catch (error) {
    core.setFailed(error.message);
  }
})();
