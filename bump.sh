#!/bin/bash
VERSION=$(npx -c 'echo "$npm_package_version"')
npm version $VERSION --allow-same-version