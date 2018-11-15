#!/bin/bash

# Run `yarn bump patch|minor|major` or `npm run bump -- patch|minor|major`

# Add git tag and updated version in package.json
npm version "$@"

# Prepare next version and omit git tag
npm --no-git-tag-version version prepatch

git add package.json package-lock.json
git commit -m "Update prepatch version"
git push && git push --tags
