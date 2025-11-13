#!/bin/bash
set -e

# Configuration from environment variables
DB_HOST="${DB_HOST:-db}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-eventsdb}"
DB_USER="${DB_USER:-user}"
DB_PASSWORD_FILE="${DB_PASSWORD_FILE:-/run/secrets/pg_password}"
BACKUP_DIR="${BACKUP_DIR:-/tmp/backups}"
S3_BUCKET="${S3_BUCKET}"
S3_ENDPOINT="${S3_ENDPOINT}"
S3_ACCESS_KEY="${S3_ACCESS_KEY}"
S3_SECRET_KEY="${S3_SECRET_KEY}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"

# Read password from secret file
if [ -f "$DB_PASSWORD_FILE" ]; then
    DB_PASSWORD=$(cat "$DB_PASSWORD_FILE")
else
    echo "Error: Password file not found at $DB_PASSWORD_FILE"
    exit 1
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Generate timestamp for backup filename
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILENAME="backup_${DB_NAME}_${TIMESTAMP}.sql.gz"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_FILENAME"

echo "[$(date)] Starting database backup..."
echo "Database: $DB_HOST:$DB_PORT/$DB_NAME"
echo "Backup file: $BACKUP_FILENAME"

# Create PostgreSQL backup
export PGPASSWORD="$DB_PASSWORD"
pg_dump -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --no-owner \
        --no-acl \
        -Fc \
        | gzip > "$BACKUP_PATH"

if [ $? -eq 0 ]; then
    echo "[$(date)] Backup created successfully: $BACKUP_PATH"
    BACKUP_SIZE=$(du -h "$BACKUP_PATH" | cut -f1)
    echo "Backup size: $BACKUP_SIZE"
else
    echo "[$(date)] ERROR: Backup failed"
    exit 1
fi

# Upload to DigitalOcean Spaces
if [ -n "$S3_BUCKET" ] && [ -n "$S3_ENDPOINT" ] && [ -n "$S3_ACCESS_KEY" ] && [ -n "$S3_SECRET_KEY" ]; then
    echo "[$(date)] Uploading backup to DigitalOcean Spaces..."
    
    # Configure s3cmd
    cat > /tmp/.s3cfg <<EOF
[default]
access_key = $S3_ACCESS_KEY
secret_key = $S3_SECRET_KEY
host_base = $S3_ENDPOINT
host_bucket = %(bucket)s.$S3_ENDPOINT
use_https = True
EOF

    # Upload backup
    s3cmd -c /tmp/.s3cfg put "$BACKUP_PATH" "s3://$S3_BUCKET/backups/"
    
    if [ $? -eq 0 ]; then
        echo "[$(date)] Backup uploaded successfully to s3://$S3_BUCKET/backups/$BACKUP_FILENAME"
    else
        echo "[$(date)] ERROR: Upload to Spaces failed"
        exit 1
    fi
    
    # Clean up old backups in Spaces (older than BACKUP_RETENTION_DAYS)
    echo "[$(date)] Cleaning up old backups (older than $BACKUP_RETENTION_DAYS days)..."
    CUTOFF_DATE=$(date -d "$BACKUP_RETENTION_DAYS days ago" +%Y%m%d 2>/dev/null || date -v-${BACKUP_RETENTION_DAYS}d +%Y%m%d)
    
    s3cmd -c /tmp/.s3cfg ls "s3://$S3_BUCKET/backups/" | while read -r line; do
        BACKUP_DATE=$(echo "$line" | grep -oP 'backup_[^_]+_\K\d{8}' || true)
        BACKUP_FILE=$(echo "$line" | awk '{print $4}')
        
        if [ -n "$BACKUP_DATE" ] && [ "$BACKUP_DATE" -lt "$CUTOFF_DATE" ]; then
            echo "Deleting old backup: $BACKUP_FILE"
            s3cmd -c /tmp/.s3cfg del "$BACKUP_FILE" || true
        fi
    done
    
    # Clean up s3cfg
    rm -f /tmp/.s3cfg
else
    echo "[$(date)] WARNING: S3 configuration incomplete, skipping upload to Spaces"
fi

# Clean up local backup file
rm -f "$BACKUP_PATH"

echo "[$(date)] Backup process completed successfully"
