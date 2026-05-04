#!/bin/bash
# Start PocketBase + Next.js dev server for gut-reset-v2

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/.."

# Start PocketBase
nohup "$DIR/pocketbase/pocketbase" serve \
  --http=127.0.0.1:8090 \
  --dir="$DIR/pocketbase/pb_data" \
  > /tmp/gut-reset-pocketbase.log 2>&1 &

echo "PocketBase started (PID: $!)"
sleep 2

# Start Next.js
nohup bash -c "cd $DIR && npm run dev -- -p 3003" > /tmp/gut-reset-v2.log 2>&1 &
echo "Next.js started (PID: $!)"
sleep 3

curl -s http://localhost:8090/api/health > /dev/null && echo "PocketBase: ✓" || echo "PocketBase: ✗"
curl -s -o /dev/null -w "Next.js: HTTP %{http_code}\n" http://localhost:3003
