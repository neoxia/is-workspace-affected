# is-workspace-affected
[![Javascript](https://github.com/neoxia/is-workspace-affected/actions/workflows/javascript.yml/badge.svg)](https://github.com/neoxia/is-workspace-affected/actions/workflows/javascript.yml)
![License](https://img.shields.io/github/license/julien-capellari/is-workspace-affected)
![Version](https://img.shields.io/github/v/release/julien-capellari/is-workspace-affected)

## Description
Github Action that tests if an yarn workspace is affected by diff with another branch. Affected means we find one file under the workspace root
inside the return of `git diff`. A workspace A depending on another workspace B will also be affected if B is affected by changes.

## How to use it
```yaml
name: Build affected

on:
  pull_request:
    branches: [master]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - uses: neoxia/is-workspace-affected@v2.1.0
        id: affected
        with:
          workspace: front
          base: master
      
      - name: Build
        if: steps.affected.outputs.affected
        run: yarn workspace front run build
```

This will build the `front` workspace if it (or it's dependencies) has any difference with the version on `master` branch.
Here we you a branch, be you can also use a tag, this will allow test on the same branch.

## Inputs
| Name         | Default    | Description                                                                                         |
|:-------------|:-----------|:----------------------------------------------------------------------------------------------------|
| project-root | `'.'`      | Yarn project root                                                                                   |
| workspace    | `required` | Yarn workspace to check                                                                             |
| base         | `required` | Base to compute diff. Supports branchs and tags. The needed revision will be fetched by the action. |
| pattern      | `'**'`     | Files to search in the diff. Relative to tested workspace root.                                     |

### Pattern
The pattern allow to filter the diff. If you set the following pattern '\*.js' the action will search for files matching `/project/workspace/*.js` in the diff (here `/project/workspace` is the root of the workspace).<br />
Supports any pattern supported by [minimatch](https://www.npmjs.com/package/minimatch).

## Outputs
| Name     | Description                                             |
|:---------|:--------------------------------------------------------|
| affected | Will be truthy if the workspace is affected by changes. |
