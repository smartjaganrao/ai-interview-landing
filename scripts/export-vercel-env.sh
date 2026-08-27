#!/usr/bin/env bash
# export-vercel-env.sh
# Exports all Vercel environment variables to a local file for backup/migration.
#
# Usage:
#   cd ai-interview-landing
#   bash scripts/export-vercel-env.sh
#
# Output: .env.vercel-export
# Note: Secret values are masked as [SENSITIVE] by Vercel CLI.

set -euo pipefail

export PATH="$HOME/.npm-global/bin:$PATH"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "Exporting Vercel environment variables..."
echo "Repo: $REPO_ROOT"
echo ""

cd "$REPO_ROOT"

# Pull all environments
echo "Pulling production env vars..."
vercel env pull --yes --environment=production .env.vercel-production 2>/dev/null || \
  vercel env pull --yes .env.vercel-production 2>/dev/null || \
  echo "WARNING: Could not pull production env vars"

echo ""
echo "Pulling preview env vars..."
vercel env pull --yes --environment=preview .env.vercel-preview 2>/dev/null || \
  echo "Note: Preview env vars may not exist or CLI version may not support --environment flag"

echo ""
echo "Pulling development env vars..."
vercel env pull --yes --environment=development .env.vercel-development 2>/dev/null || \
  echo "Note: Development env vars may not exist"

echo ""
echo "=== Export complete ==="
echo "Files created:"
ls -la .env.vercel-* 2>/dev/null || echo "  No files created"
echo ""
echo "NOTE: Secret values show as [SENSITIVE]."
echo "      Fill them in from your password manager before importing to a new project."
