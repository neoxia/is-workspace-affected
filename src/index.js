const core = require('@actions/core');
const fslib = require('@yarnpkg/fslib');
const simpleGit = require('simple-git/promise');

const yarn = require('./yarn');

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
    const project = await yarn.getProject(inputs.projectRoot);

    // Get workspace
    const workspace = project.workspaces.find(wks => wks.manifest.name.name === inputs.workspace);

    if (!workspace) {
      return core.setFailed(`Workspace ${inputs.workspace} not found.`);
    }

    // Fetch base
    await core.group('git fetch', async () => {
      core.info(await git.fetch('origin', inputs.base, ['--progress', '--depth=1']));
    });

    // Compute diff
    const diff = await core.group('git diff', async () => {
      const res = await git.diff(['--name-only', `origin/${inputs.base}`, '--', fslib.npath.fromPortablePath(workspace.cwd)]);
      core.info(res);

      return res;
    });

    const lines = diff.split('\n').filter(l => l);
    core.info(`Workspace ${inputs.workspace} ${lines.length > 0 ? 'affected' : 'not affected'}`)

    if (lines.length > 0) {
      core.setOutput('affected', true);
      core.info(`Workspace ${inputs.workspace} affected`);
    } else {
      core.info(`Workspace ${inputs.workspace} not affected`);
    }

  } catch (error) {
    core.setFailed(error.message);
  }
})();
