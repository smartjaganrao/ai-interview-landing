#!/usr/bin/env bash
# import-vercel-env.sh
# Imports environment variables from exported files to a new Vercel project.
#
# Usage:
#   cd ai-interview-landing
#   bash scripts/import-vercel-env.sh
#
# Prerequisites:
#   - Vercel CLI installed and logged in
#   - Project linked to new Vercel account (vercel link)
#   - .env.vercel-production file exists (from export-vercel-env.sh)

set -euo pipefail

export PATH="$HOME/.npm-global/bin:$PATH"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$REPO_ROOT"

EXPORT_FILE=".env.vercel-production"

if [[ ! -f "$EXPORT_FILE" ]]; then
  echo "ERROR: $EXPORT_FILE not found."
  echo "Run scripts/export-vercel-env.sh first."
  exit 1
fi

echo "Importing environment variables to Vercel..."
echo "Source: $EXPORT_FILE"
echo ""

# Track what we're importing
PUBLIC_COUNT=0
SECRET_COUNT=0
SKIPPED_COUNT=0

while IFS='=' read -r key value; do
  # Skip comments and empty lines
  [[ "$key" =~ ^#.* ]] && continue
  [[ -z "$key" ]] && continue
  [[ "$key" =~ ^[[:space:]]*$ ]] && continue
  
  # Remove quotes
  value="${value%\"}"
  value="${value#\"}"
  value="${value%\'}"
  value="${value#\'}"
  
  # Skip placeholders
  if [[ "$value" == *"your_"* ]] || [[ "$value" == "[SENSITIVE]" ]]; then
    echo "SKIPPED: $key (placeholder or masked value)"
    SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
    continue
  fi
  
  # Determine type
  if [[ "$key" == NEXT_PUBLIC_* ]]; then
    TYPE="config"
    PUBLIC_COUNT=$((PUBLIC_COUNT + 1))
  else
    TYPE="secret"
    SECRET_COUNT=$((SECRET_COUNT + 1))
  fi
  
  echo "Adding $key ($TYPE)..."
  
  # Remove existing var if it exists
  vercel env rm "$key" production --yes 2>/dev/null || true
  
  # Add the var
  if [[ "$TYPE" == "config" ]]; then
    vercel env add "$key" production --type config <<< "$value" || {
      echo "  WARNING: Failed to add $key"
    }
  else
    echo "  SECRET: Add manually with: vercel env add $key production --type secret"
  fi
  
done < "$EXPORT_FILE"

echo ""
echo "=== Import complete ==="
echo "Public config vars imported: $PUBLIC_COUNT"
echo "Secret vars to add manually: $SECRET_COUNT"
echo "Skipped (placeholders): $SKIPPED_COUNT"
echo ""
echo "Next steps:"
echo "1. Add any skipped secret vars manually"
echo "2. Run: vercel --yes --prod"
echo "3. Verify: https://javihai.in/api/release"
