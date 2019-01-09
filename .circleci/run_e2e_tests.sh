#!/bin/bash
set -ev
DIR="$(dirname "$(readlink -f "$0")")"
COMPOSE_DIR="$DIR/../tests/testrelay"
COMPOSE_FILE="$COMPOSE_DIR/docker-compose.yml"
ENV_FILE="$COMPOSE_DIR/.env"

# export variable names manually because of bug in docker-compose
set -o allexport
source $ENV_FILE
set +o allexport

docker-compose -f "$COMPOSE_FILE" up -d
sleep 30
yarn test:e2e
docker-compose -f "$COMPOSE_FILE" down
