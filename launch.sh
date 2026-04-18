#!/bin/bash

export PUID=$(id -u)
export PGID=$(id -g)
export TIMEZONE="Europe/Paris"
export GITHUB_COMMIT_SHA=$(git rev-parse --short HEAD)


docker compose down --remove-orphans

read -p "Do you want to rebuild the Docker images? (y/n): " input

if [[ "$input" == "y" || "$input" == "Y" ]]; then
    docker compose up --build
else
    docker compose up 
fi
