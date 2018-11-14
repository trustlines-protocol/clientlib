#!/bin/bash

# Run `yarn bump patch|minor|major` or `npm run bump -- patch|minor|major`

# Add git tag with current version specified in package.json
VERSION=$(npx -c 'echo "$npm_package_version"')
npm version $VERSION --allow-same-version

# Prepare next version and omit git tag
npm --no-git-tag-version version "$@"

# Commit package.json and package-lock.json
git add .
git commit -m "Update version for next release"

git push && git push --tags
