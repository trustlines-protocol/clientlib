#!/bin/bash
set -ev

DIR="$(dirname "$(readlink -f "$0")")"
COMPOSE_DIR="$DIR/../tests/testrelay"
COMPOSE_FILE="$COMPOSE_DIR/docker-compose.yml"

docker-compose -f "$COMPOSE_FILE" build

