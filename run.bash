#!/bin/bash

# Initialize variables
COMPOSE_FILE="docker-compose.yml"
SHOW_HELP=false
BUILD=false

# Load environment variables for script usage only
source .env

backup_db() {
    if docker container ls --filter "name=postgres" --format '{{.Names}}' | grep -q .; then
        echo "Creating database backup..."
        mkdir -p backups
        docker exec postgres pg_dump -U $DB_USER $DB_NAME > backups/backup.sql
        if [ -f backups/backup.sql ]; then
            timestamp=$(date +"%m-%d-%y_%T")
            cp backups/backup.sql backups/backup_$timestamp.sql
            echo "Backup created as backup.sql"
        else
            echo "Failed to create backup"
        fi
    else
        echo "postgres container is not running, skipping backup"
    fi
}

teardown() {
    backup_db

    echo "Stopping running containers..."
    docker compose -f $COMPOSE_FILE down --remove-orphans  --volumes

    echo "Removing existing pg_log directory..."
    rm -rf ./logs/pg_log
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            SHOW_HELP=true
            shift
            ;;
        --down)
            teardown
            exit 0
            ;;
        --build)
            BUILD=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            SHOW_HELP=true
            shift
            ;;
    esac
done

# Show help message if requested
if [ "$SHOW_HELP" = true ]; then
    cat << 'EOF'
Usage: $0 [OPTIONS]

Options:
  -h, --help    Show this help message
  --down        Stop and remove containers, networks, volumes, and images created by 'up'
  --build       Build images before starting containers

Description:
  This script manages the Finance application containers.
  It handles container cleanup, directory permissions,
  and PostgreSQL initialization.
EOF
    exit 0
fi

teardown

# Create necessary directories
echo "Creating new pg_log directory..."
mkdir -p ./logs/pg_log

# Set correct permissions for postgres user (UID 999 is typically postgres in the container)
echo "Setting correct permissions..."
chown -R $(whoami):$(whoami) ./logs/pg_log
chmod -R 750 ./logs/pg_log

# Start the containers
if [ "$BUILD" = true ]; then
    echo "Building and starting containers with $COMPOSE_FILE..."
    docker compose --env-file .env -f $COMPOSE_FILE up -d --build
else
    echo "Starting containers with $COMPOSE_FILE..."
    docker compose --env-file .env -f $COMPOSE_FILE up -d
fi

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
sleep 10

# Restore db from last backup
echo "Restoring database from backup..."
if [ -f backups/backup.sql ]; then
    docker exec -i finance_postgres psql -U $DB_USER $DB_NAME -c "DROP TABLE IF EXISTS bank_statements CASCADE;" > /dev/null 2>&1
    docker exec -i finance_postgres psql -U $DB_USER $DB_NAME < backups/backup.sql > /dev/null 2>&1
    echo "Restore completed"
else
    echo "No backup file found, skipping restore"
fi
