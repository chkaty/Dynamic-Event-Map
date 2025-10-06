#!/bin/bash

set -e

BACKUP_DIR="/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/eventmap_$TIMESTAMP.sql"
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}

echo "Starting database backup at $(date)"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Perform backup
PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
  -h "$POSTGRES_HOST" \
  -U "$POSTGRES_USER" \
  -d "$POSTGRES_DB" \
  -F c \
  -f "$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_FILE"

echo "Backup completed: ${BACKUP_FILE}.gz"

# Upload to DigitalOcean Spaces (if configured)
if [ -n "$SPACES_ACCESS_KEY_ID" ] && [ -n "$SPACES_SECRET_ACCESS_KEY" ]; then
  echo "Uploading backup to DigitalOcean Spaces..."
  # This would require s3cmd or aws cli to be installed
  # aws s3 cp "${BACKUP_FILE}.gz" "s3://${SPACES_BUCKET}/backups/" --endpoint-url "$SPACES_ENDPOINT"
fi

# Clean up old backups
echo "Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "eventmap_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup process completed at $(date)"

# Schedule next backup (runs daily at 2 AM)
while true; do
  sleep 86400  # Sleep for 24 hours
  exec "$0"    # Re-execute this script
done
