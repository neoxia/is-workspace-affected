const cli = require('@yarnpkg/cli');
const core = require('@yarnpkg/core');
const fslib = require('@yarnpkg/fslib');

// Utils
module.exports = {
  /**
   * Load a yarn project
   * @param {string} root
   */
  async getProject(root) {
    const path = fslib.npath.toPortablePath(fslib.npath.resolve(root));

    const config = await core.Configuration.find(path, cli.getPluginConfiguration());
    const workspace = await cli.openWorkspace(config, path);

    return workspace.project;
  },
};
