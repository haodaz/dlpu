#!/bin/bash

set -e
set -x

if [ -z "$DOCKER_IMAGE_TAG" ]; then
  echo "Error: DOCKER_IMAGE_TAG is not set"
  exit 1
fi

if [ -n "$DOCKERFILE_DIR" ]; then
    cd "$DOCKERFILE_DIR"
fi

cmd="docker build -t \"$DOCKER_IMAGE_TAG\""

if [ -n "$DOCKERFILE_NAME" ]; then
    cmd+=" -f \"$DOCKERFILE_NAME\""
fi

if [ -n "$NODE_ENV" ]; then
    cmd+=" --build-arg NODE_ENV=\"$NODE_ENV\""
fi

cmd+=" ."

eval "$cmd"

docker push "$DOCKER_IMAGE_TAG"

echo "Build successful."
