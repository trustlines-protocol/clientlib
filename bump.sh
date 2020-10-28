#!/bin/bash

# Run `yarn bump patch|minor|major` or `npm run bump -- patch|minor|major`

if [ $# -eq 0 ]; then
    echo "You ran the script with no arguments. Please use one of patch|minor|major"
    exit 1
fi

# Add git tag and updated version in package.json
yarn version --new-version "$@"

# Prepare next version and omit git tag
yarn version --new-version prepatch --no-git-tag-version

git add package.json
git commit -m "Update prepatch version"
git push && git push --tags
