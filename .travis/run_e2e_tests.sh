#!/bin/sh

DIR="$(dirname "$(readlink -f "$0")")"

cd $DIR/../tests/testrelay
docker-compose up -d
sleep 30
npm run test
docker-compose down
