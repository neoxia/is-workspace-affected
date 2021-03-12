const core = require('@actions/core');
const fslib = require('@yarnpkg/fslib');
const simpleGit = require('simple-git/promise');

const yarn = require('./yarn');

(async () => {
  try {
    // Load inputs
    const inputs = {
      projectRoot: '../neoxia/nx-live', //core.getInput('project-root') || '.',
      workspace:   'nx-users', //core.getInput('workspace', { required: true }),
      base:        'dev', //core.getInput('base', { required: true }),
    };

    // Load yarn project
    const project = await yarn.getProject(inputs.projectRoot);
    const workspace = project.workspaces.find(wks => wks.manifest.name.name === inputs.workspace);

    if (!workspace) {
      return core.setFailed(`Workspace ${inputs.workspace} not found.`);
    }

    // Compute diff
    const git = simpleGit({ baseDir: inputs.projectRoot });
    const diff = await git.diff(['--name-only', inputs.base, '--', fslib.npath.fromPortablePath(workspace.cwd)]);
    const lines = diff.split('\n').filter(l => l);

    if (lines.length > 0) {
      core.setOutput('affected', 'true');
    } else {
      core.setOutput('affected', 'false');
    }

  } catch (error) {
    core.setFailed(error.message);
  }
})();
