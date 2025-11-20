#!/bin/sh
# Wait for Redis to be ready before starting the API

set -e

host="$1"
port="$2"
shift 2
cmd="$@"

echo "Waiting for Redis at $host:$port..."

max_retries=30
retry_count=0

until nc -z "$host" "$port" > /dev/null 2>&1; do
  retry_count=$((retry_count + 1))
  if [ $retry_count -ge $max_retries ]; then
    echo "Redis is not available after $max_retries attempts"
    exit 1
  fi
  echo "Redis is unavailable - sleeping (attempt $retry_count/$max_retries)"
  sleep 2
done

echo "Redis is up - executing command"
exec $cmd
