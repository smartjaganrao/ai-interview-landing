#!/usr/bin/env node
/**
 * deploy-firestore-rules.mjs
 *
 * Deploys Firestore security rules without needing the Firebase CLI.
 * Uses the Firebase Management REST API with a service-account JWT.
 *
 * Usage (reads .env.local automatically):
 *   node scripts/deploy-firestore-rules.mjs
 *
 * Or with env inline:
 *   FIREBASE_ADMIN_SDK_JSON='{"type":"service_account",...}' node scripts/deploy-firestore-rules.mjs
 *
 * Rules source: ai-interview-helper/firestore.rules
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSign } from 'node:crypto';

const __dir = dirname(fileURLToPath(import.meta.url));
const root  = resolve(__dir, '..');

// ── Load .env.local ───────────────────────────────────────────────────────────
const envPath = resolve(root, '.env.local');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
    if (!process.env[key]) process.env[key] = val;
  }
}

// ── Load service account ──────────────────────────────────────────────────────
const SDK_JSON = process.env.FIREBASE_ADMIN_SDK_JSON;
if (!SDK_JSON) {
  console.error('❌ FIREBASE_ADMIN_SDK_JSON not set');
  process.exit(1);
}
const sa = JSON.parse(SDK_JSON);
const PROJECT_ID = sa.project_id;
console.log(`\n🔥 Deploying Firestore rules for project: ${PROJECT_ID}\n`);

// ── Read the rules file ───────────────────────────────────────────────────────
// Resolve relative to project root, or go up to ai-interview-helper
const rulesLocations = [
  resolve(root, '..', 'ai-interview-helper', 'firestore.rules'),
  resolve(root, 'firestore.rules'),
];
let rulesPath = rulesLocations.find(existsSync);
if (!rulesPath) {
  console.error('❌ Could not find firestore.rules. Searched:');
  rulesLocations.forEach((p) => console.error('  ', p));
  process.exit(1);
}
const rulesContent = readFileSync(rulesPath, 'utf8');
console.log(`✅ Loaded rules from: ${rulesPath}`);
console.log(`   (${rulesContent.split('\n').length} lines)\n`);

// ── Generate a short-lived service-account access token via JWT ───────────────
async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: sa.client_email,
    sub: sa.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/firebase',
  })).toString('base64url');

  const sign = createSign('RSA-SHA256');
  sign.update(`${header}.${payload}`);
  const sig = sign.sign(sa.private_key.replace(/\\n/g, '\n'), 'base64url');
  const jwt = `${header}.${payload}.${sig}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${t}`);
  }
  const data = await res.json();
  return data.access_token;
}

// ── Deploy via Firebase Management API ───────────────────────────────────────
async function deployRules(token) {
  const base = `https://firebaserules.googleapis.com/v1/projects/${PROJECT_ID}`;
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  // 1) Create a new ruleset
  console.log('1️⃣  Creating ruleset...');
  const createRes = await fetch(`${base}/rulesets`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ source: { files: [{ name: 'firestore.rules', content: rulesContent }] } }),
  });
  if (!createRes.ok) {
    const t = await createRes.text();
    throw new Error(`Failed to create ruleset: ${createRes.status} ${t}`);
  }
  const { name: rulesetName } = await createRes.json();
  console.log(`   ✅ Ruleset created: ${rulesetName}`);

  // 2) Update the cloud.firestore release to point to the new ruleset
  console.log('2️⃣  Updating release cloud.firestore...');
  const releaseName = `projects/${PROJECT_ID}/releases/cloud.firestore`;
  const updateRes = await fetch(`${base}/releases/cloud.firestore`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ release: { name: releaseName, rulesetName } }),
  });

  // 404 means the release doesn't exist yet — create it instead
  if (updateRes.status === 404) {
    console.log('   ℹ️  Release not found, creating it...');
    const createRelRes = await fetch(`${base}/releases`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ release: { name: releaseName, rulesetName } }),
    });
    if (!createRelRes.ok) {
      const t = await createRelRes.text();
      throw new Error(`Failed to create release: ${createRelRes.status} ${t}`);
    }
    console.log('   ✅ Release created');
  } else if (!updateRes.ok) {
    const t = await updateRes.text();
    throw new Error(`Failed to update release: ${updateRes.status} ${t}`);
  } else {
    console.log('   ✅ Release updated');
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
try {
  console.log('🔑 Getting access token...');
  const token = await getAccessToken();
  console.log('   ✅ Token obtained\n');

  await deployRules(token);

  console.log('\n✅ Firestore rules deployed successfully!');
  console.log('   Verify at:');
  console.log(`   https://console.firebase.google.com/project/${PROJECT_ID}/firestore/rules\n`);
} catch (err) {
  console.error('\n❌ Deployment failed:', err.message);
  console.error('\n👉 Manual fallback:');
  console.error('   1. Open: https://console.firebase.google.com/project/ai-interview-tutor/firestore/rules');
  console.error('   2. Paste the contents of: ai-interview-helper/firestore.rules');
  console.error('   3. Click "Publish"\n');
  process.exit(1);
}
