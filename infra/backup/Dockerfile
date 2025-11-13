FROM postgres:16-alpine

# Install s3cmd for DigitalOcean Spaces backup
RUN apk add --no-cache \
    python3 \
    py3-pip \
    py3-setuptools \
    bash \
    && pip3 install --no-cache-dir s3cmd

# Copy backup script
COPY backup.sh /usr/local/bin/backup.sh
RUN chmod +x /usr/local/bin/backup.sh

ENTRYPOINT ["/usr/local/bin/backup.sh"]
