#!/bin/sh
set -e
echo "LanceX API — aplicando migrations..."
npx prisma migrate deploy
echo "LanceX API — iniciando..."
exec "$@"
