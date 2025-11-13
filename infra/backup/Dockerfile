FROM postgres:16-alpine

# Install s3cmd for DigitalOcean Spaces backup
RUN apk add --no-cache \
    python3 \
    py3-dateutil \
    py3-magic \
    bash \
    && python3 -m ensurepip \
    && pip3 install --no-cache-dir --break-system-packages s3cmd

# Copy backup scripts
COPY backup.sh /usr/local/bin/backup.sh
COPY restore.sh /usr/local/bin/restore.sh
RUN chmod +x /usr/local/bin/backup.sh /usr/local/bin/restore.sh

ENTRYPOINT ["/usr/local/bin/backup.sh"]
