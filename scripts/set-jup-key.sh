#!/bin/sh
# Puts the Jupiter key from .env.production.local into the Vercel project's production environment.
# Run by the founder: sh scripts/set-jup-key.sh   (the key is piped, never printed)
cd "$(dirname "$0")/.." || exit 1
if [ ! -f .env.production.local ]; then echo "no .env.production.local here"; exit 1; fi
grep '^JUPITER_API_KEY=' .env.production.local | cut -d= -f2- | tr -d '\n' | vercel env add JUPITER_API_KEY production
