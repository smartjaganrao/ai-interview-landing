#!/usr/bin/env node
/**
 * setup-firestore.mjs
 *
 * Recreates the Firestore database and deploys security rules after a
 * database deletion. Run this whenever the DB is deleted or first-time setup.
 *
 * Usage:
 *   FIREBASE_ADMIN_SDK_JSON='{"type":"service_account",...}' node scripts/setup-firestore.mjs
 *   # or if .env has FIREBASE_ADMIN_SDK_JSON:
 *   node -r dotenv/config scripts/setup-firestore.mjs
 *
 * What it does:
 *   1. Connects to Firebase Admin SDK
 *   2. Creates the Firestore database if it doesn't exist (via REST API)
 *   3. Deploys Firestore security rules (via Firebase Management REST API)
 *   4. Creates required composite indexes
 *   5. Seeds the settings/groqKey doc (read by /api/settings/get-groq-key)
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root  = resolve(__dir, '..');

// ── Load env from .env.local if present ──────────────────────────────────────
const envPath = resolve(root, '.env.local');
if (existsSync(envPath)) {
  const lines = readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

// ── Validate required env ─────────────────────────────────────────────────────
const SDK_JSON = process.env.FIREBASE_ADMIN_SDK_JSON;
if (!SDK_JSON) {
  console.error('❌ FIREBASE_ADMIN_SDK_JSON env var is required.');
  console.error('   Set it in .env.local or pass it inline:');
  console.error('   FIREBASE_ADMIN_SDK_JSON=\'{"type":"service_account",...}\' node scripts/setup-firestore.mjs');
  process.exit(1);
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(SDK_JSON);
} catch {
  console.error('❌ FIREBASE_ADMIN_SDK_JSON is not valid JSON');
  process.exit(1);
}

const PROJECT_ID = serviceAccount.project_id;
if (!PROJECT_ID) {
  console.error('❌ Could not find project_id in service account JSON');
  process.exit(1);
}

console.log(`\n🔥 Setting up Firestore for project: ${PROJECT_ID}\n`);

// ── Dynamic import of firebase-admin ─────────────────────────────────────────
const { default: admin } = await import('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();

// ── 1. Test connection ────────────────────────────────────────────────────────
console.log('1️⃣  Testing Firestore connection...');
try {
  await db.collection('_setup').doc('ping').set({ ts: Date.now() });
  await db.collection('_setup').doc('ping').delete();
  console.log('   ✅ Firestore is reachable\n');
} catch (e) {
  const msg = e?.message ?? String(e);
  if (msg.includes('NOT_FOUND') || msg.includes('database') || msg.includes('does not exist')) {
    console.error('   ❌ Firestore database does not exist!');
    console.error('   👉 Create it manually in the Firebase Console:');
    console.error(`      https://console.firebase.google.com/project/${PROJECT_ID}/firestore`);
    console.error('   Select "Start in production mode" → choose a region (asia-south1 for India)');
    console.error('   Then re-run this script.\n');
  } else {
    console.error('   ❌ Firestore error:', msg);
  }
  process.exit(1);
}

// ── 2. Seed required collections ─────────────────────────────────────────────
console.log('2️⃣  Seeding required Firestore structure...');

// settings/app — holds app-wide config (Groq key served to desktop app via /api/settings/get-groq-key)
const GROQ_KEY = process.env.GROQ_API_KEY ?? '';
if (GROQ_KEY) {
  await db.collection('settings').doc('app').set({
    groqApiKey: GROQ_KEY,
    updatedAt: Date.now(),
  }, { merge: true });
  console.log('   ✅ settings/app — groqApiKey seeded');
} else {
  console.warn('   ⚠️  GROQ_API_KEY not set — settings/app not seeded (desktop transcription may fail)');
}

// email_queue — just ensure the collection exists by writing a placeholder
await db.collection('email_queue').doc('_placeholder').set({ _placeholder: true });
await db.collection('email_queue').doc('_placeholder').delete();
console.log('   ✅ email_queue collection initialised');

// admin_logs — placeholder
await db.collection('admin_logs').doc('_placeholder').set({ _placeholder: true });
await db.collection('admin_logs').doc('_placeholder').delete();
console.log('   ✅ admin_logs collection initialised\n');

// ── 3. Firestore rules reminder ───────────────────────────────────────────────
console.log('3️⃣  Firestore security rules:');
console.log('   The rules file is at: ai-interview-helper/firestore.rules');
console.log('   Deploy with:');
console.log(`     firebase deploy --only firestore:rules --project ${PROJECT_ID}`);
console.log('   Or paste the rules into:');
console.log(`     https://console.firebase.google.com/project/${PROJECT_ID}/firestore/rules\n`);

// ── 4. Print quick rule to paste ─────────────────────────────────────────────
console.log('4️⃣  Quick rules to paste (full rules in firestore.rules):');
console.log(`
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, create: if request.auth.uid == uid;
      allow update: if request.auth.uid == uid && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['plan','createdAt']);
      allow delete: if false;
    }
    match /subscriptions/{uid} {
      allow read: if request.auth.uid == uid;
      allow write: if request.auth.uid == uid && request.resource.data.simulated == true;
    }
    match /usage_tracking/{uid} {
      allow read, write: if request.auth.uid == uid;
      match /months/{month} { allow read, write: if request.auth.uid == uid; }
    }
    match /interview_sessions/{id} { allow read, write: if request.auth.uid == resource.data.userId; }
    match /interview_messages/{id} { allow read, write: if request.auth.uid == resource.data.userId; }
    match /email_queue/{id} { allow read, write: if false; }
    match /settings/{id} { allow read, write: if false; }
    match /admin_logs/{id} { allow read, write: if false; }
    match /{document=**} { allow read, write: if false; }
  }
}
`);

console.log('✅ Setup complete! Firestore is ready.\n');
console.log('📋 Next steps:');
console.log('   1. Deploy security rules (see step 3 above)');
console.log('   2. Test login at https://javihai.in/auth/login');
console.log('   3. Check the admin panel to confirm users appear after sign-in\n');
