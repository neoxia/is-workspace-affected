# is-workspace-affected

## Description
Github Action that tests if an yarn workspace is affected by diff with another branch.

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
      
      - uses: julien-capellari/is-workspace-affected@v0.5
        id: affected
        with:
          workspace: front
          base: master
      
      - name: Build
        if: steps.affected.outputs.affected
        run: yarn workspace front run build
```

## Inputs
| Name         | Default    | Description
| :----------- | :--------- | :-------------------
| project-root | '.'        | Yarn project root
| workspace    | `required` | Yarn workspace to check
| base         | `required` | Base to compute diff
| pattern      | '**'       | Files to search in the diff. Relative to tested workspace root.
