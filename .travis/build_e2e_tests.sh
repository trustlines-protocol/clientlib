#!/bin/sh

PWD="$(pwd)"
DIR="$(dirname "$(readlink -f "$0")")"

cd $DIR/../tests/testrelay
docker-compose build
cd "$PWD"
