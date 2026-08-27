# Vercel Migration Guide

## Overview

This document captures the exact Vercel setup for the JavihAI project so that moving to a new Vercel account/team is a copy-paste or scripted operation.

## Projects

| Repo | Vercel Project Name | Project ID | Org ID |
|------|---------------------|------------|--------|
| `ai-interview-landing` | `ai-interview-landing` | `prj_49jLpXVr3OKlHEPP5oO5V3zwXmGa` | `team_rBYFfWypwkFLTeYWNf7chpFn` |
| `ai-interview-admin` | `ai-interview-admin` | `prj_gHYPCTrFX8Jh3i2P3svmrF0LthkE` | `team_rBYFfWypwkFLTeYWNf7chpFn` |

Both projects are currently under the same Vercel team/org: `javih-ai1` / `team_rBYFfWypwkFLTeYWNf7chpFn`.

## Domains

- **Landing production:** `javihai.in` (aliased in Vercel)
- **Landing preview:** `ai-interview-landing-*.vercel.app`
- **Admin:** separate Vercel deployment (check Vercel dashboard for exact domain)

## Quick Migration Checklist

1. **New account/team created** in Vercel
2. **Install Vercel CLI** on local machine:
   ```bash
   npm install -g vercel@latest --prefix ~/.npm-global
   export PATH="$HOME/.npm-global/bin:$PATH"
   vercel login
   ```
3. **Link repos to new Vercel project:**
   ```bash
   cd ai-interview-landing
   vercel link --project <new-project-id> --yes
   cd ../ai-interview-admin
   vercel link --project <new-project-id> --yes
   ```
4. **Sync environment variables** (see scripts below)
5. **Redeploy both projects:**
   ```bash
   cd ai-interview-landing && vercel --yes --prod
   cd ../ai-interview-admin && vercel --yes --prod
   ```
6. **Verify:**
   - Landing: `https://javihai.in/api/release` returns `{"version":"v1.15.0",...}`
   - Login works on `https://javihai.in/auth/login`
   - Admin dashboard loads

## Environment Variables

### Landing (`ai-interview-landing`)

#### Production - Public Config (`NEXT_PUBLIC_*`)

| Variable | Value | Notes |
|----------|-------|-------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSyBm_MFHfjHS7nL5fHYP9BiMMntgiiNi8pE` | Public, safe to expose |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `ai-interview-tutor.firebaseapp.com` | Public |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `ai-interview-tutor` | Public |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `ai-interview-tutor.firebasestorage.app` | Public |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `475876914174` | Public |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:475876914174:web:caceda87b97359476546af` | Public |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | `G-MEZ0DJ7R0B` | Google Analytics |
| `NEXT_PUBLIC_APP_URL` | `https://www.javihai.in` | Public |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | `rzp_test_T1TBjrCUzf0Abw` | Razorpay public key |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | `919884160332` | WhatsApp click-to-chat |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | `G-MEZ0DJ7R0B` | Legacy GA var (duplicate?) |

#### Production - Secret (Hidden)

| Variable | Value | Notes |
|----------|-------|-------|
| `RESEND_API_KEY` | `re_...` | Resend email service |
| `GITHUB_TOKEN` | `ghp_...` | GitHub API for release assets |
| `VERCEL_OIDC_TOKEN` | Auto-generated | Vercel deployment token |
| `ADMIN_SECRET` | `...` | Admin panel auth |
| `FIREBASE_ADMIN_SDK_JSON` | `{...}` | Firebase admin credentials |
| `RAZORPAY_KEY_SECRET` | `...` | Razorpay secret key |
| `RAZORPAY_KEY_ID` | `...` | Razorpay key ID |

### Admin (`ai-interview-admin`)

*Check Vercel dashboard for exact env vars. Likely similar set: Firebase config, GitHub token, Admin secret.*

## Automation Scripts

### 1. Export Vercel env vars to local file

```bash
#!/usr/bin/env bash
set -euo pipefail

export PATH="$HOME/.npm-global/bin:$PATH"
cd ai-interview-landing

# Pull production env vars (secrets will be masked)
vercel env pull --yes --environment=production .env.vercel-production

echo "Exported to .env.vercel-production"
echo "Note: Secret values show as [SENSITIVE] - fill them in manually or from your password manager"
```

### 2. Import env vars to new Vercel project

```bash
#!/usr/bin/env bash
set -euo pipefail

export PATH="$HOME/.npm-global/bin:$PATH"
cd ai-interview-landing

# Read from exported file and add to new Vercel project
# Public config vars
while IFS='=' read -r key value; do
  # Skip comments and empty lines
  [[ "$key" =~ ^#.* ]] && continue
  [[ -z "$key" ]] && continue
  # Remove quotes
  value="${value%\"}"
  value="${value#\"}"
  
  if [[ "$key" == NEXT_PUBLIC_* ]]; then
    echo "Adding $key..."
    vercel env add "$key" production --type config <<< "$value" || true
  fi
done < .env.vercel-production

# Secret vars - add manually or from secure source
echo "Add secret vars manually:"
echo "  vercel env add RESEND_API_KEY production --type secret"
echo "  vercel env add GITHUB_TOKEN production --type secret"
echo "  ... etc"
```

### 3. Complete migration script

```bash
#!/usr/bin/env bash
# migrate-vercel.sh - Full Vercel migration script
# Usage: ./migrate-vercel.sh <new-vercel-project-id> <new-org-id>

set -euo pipefail

export PATH="$HOME/.npm-global/bin:$PATH"

LANDING_DIR="/Users/jaganrao/Projects/AI Tutor/ai-interview-landing"
ADMIN_DIR="/Users/jaganrao/Projects/AI Tutor/ai-interview-admin"

NEW_PROJECT_ID="${1:?Usage: $0 <new-project-id> <new-org-id>}"
NEW_ORG_ID="${2:?Usage: $0 <new-project-id> <new-org-id>}"

echo "=== Migrating Vercel projects to new account ==="
echo "Landing project: $NEW_PROJECT_ID"
echo "Org ID: $NEW_ORG_ID"
echo ""

# 1. Link landing
echo "[1/4] Linking landing repo..."
cd "$LANDING_DIR"
vercel link --project "$NEW_PROJECT_ID" --yes

# 2. Link admin
echo "[2/4] Linking admin repo..."
cd "$ADMIN_DIR"
# Admin needs its own project ID - adjust as needed
# vercel link --project <admin-project-id> --yes

# 3. Sync env vars (from exported .env.vercel-production)
echo "[3/4] Syncing env vars..."
cd "$LANDING_DIR"
if [[ -f .env.vercel-production ]]; then
  while IFS='=' read -r key value; do
    [[ "$key" =~ ^#.* ]] && continue
    [[ -z "$key" ]] && continue
    value="${value%\"}"
    value="${value#\"}"
    
    if [[ "$key" == NEXT_PUBLIC_* ]]; then
      echo "  Adding $key..."
      vercel env rm "$key" production --yes 2>/dev/null || true
      vercel env add "$key" production --type config <<< "$value" || true
    fi
  done < .env.vercel-production
else
  echo "  WARNING: .env.vercel-production not found. Run export first."
fi

# 4. Deploy
echo "[4/4] Deploying to production..."
cd "$LANDING_DIR"
vercel --yes --prod

echo ""
echo "=== Migration complete ==="
echo "Verify at: https://javihai.in"
echo "Check login: https://javihai.in/auth/login"
```

## Firebase Project Info

- **Project ID:** `ai-interview-tutor`
- **Project Number:** `475876914174`
- **Auth Domain:** `ai-interview-tutor.firebaseapp.com`
- **Storage Bucket:** `ai-interview-tutor.firebasestorage.app`
- **Web App ID:** `1:475876914174:web:caceda87b97359476546af`

**Important:** The Firebase project is separate from Vercel. Moving Vercel accounts does NOT require moving Firebase. Just ensure the same Firebase config env vars are set in the new Vercel project.

## GitHub Repository

- **Helper repo:** `smartjaganrao/ai-interview-helper`
- **Landing repo:** `smartjaganrao/ai-interview-landing`
- **Admin repo:** `smartjaganrao/ai-interview-admin`

These are independent of Vercel. No migration needed unless you're also moving GitHub accounts.

## CI/CD Notes

- Release workflow is in `ai-interview-helper/.github/workflows/release.yml`
- Triggered by pushing a `v*` tag
- Builds Mac DMG + Windows exe together
- Current status: blocked by GitHub Actions billing limit

## Resend Email

- Domain: needs verification in Resend dashboard
- Sender: currently `javihaiofficial@gmail.com` (testing mode)
- To send to all users: verify a domain in Resend and update `RESEND_FROM_EMAIL`

## Support Contacts

- Email: `javihaiofficial@gmail.com`
- Support: `support@javihai.in`
- WhatsApp: `919884160332`

## Last Updated

2026-08-27
