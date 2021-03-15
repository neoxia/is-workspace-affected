import { openWorkspace, getPluginConfiguration } from '@yarnpkg/cli';
import { Configuration, Project } from '@yarnpkg/core';
import { npath } from '@yarnpkg/fslib';

// Utils
const YarnUtils = {
  /**
   * Load a yarn project
   * @param {string} root project root
   */
  async getProject(root: string): Promise<Project> {
    const path = npath.toPortablePath(npath.resolve(root));

    const config = await Configuration.find(path, getPluginConfiguration());
    const workspace = await openWorkspace(config, path);

    return workspace.project;
  },
};

export default YarnUtils;
