#!/bin/bash
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$DIR/pocketbase" serve --http=127.0.0.1:8090 --dir="$DIR/pb_data"
