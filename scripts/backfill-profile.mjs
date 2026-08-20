/**
 * Backfill script: migrate existing users with complete legacy flat profile
 * fields into the new nested `profile` + `acquisition` structure.
 *
 * Run from the landing repo root:
 *   node scripts/backfill-profile.mjs
 *
 * Requirements:
 *   - FIREBASE_ADMIN_SDK_JSON must be set (same credential used by landing server)
 *
 * Behavior:
 *   - Reads all `users/{uid}` docs in batches
 *   - If a user already has `profileCompleted === true`, skip
 *   - If a user has `phone`, `experienceLevel`, `city`, and `referralSource`
 *     populated in legacy flat fields, backfill them into the new structure
 *     and set `profileCompleted = true`
 *   - Otherwise, leave them untouched (they will be prompted on next login)
 *
 * This is idempotent and safe to run multiple times.
 */

import * as admin from 'firebase-admin';

function init() {
  if (admin.apps.length) return;
  const raw = process.env.FIREBASE_ADMIN_SDK_JSON;
  if (!raw) {
    console.error('FIREBASE_ADMIN_SDK_JSON is not set.');
    process.exit(1);
  }
  admin.initializeApp({ credential: admin.credential.cert(JSON.parse(raw)) });
}
init();

const db = admin.firestore();
const BATCH_SIZE = 500;

async function backfill() {
  console.log('Starting profile backfill...');
  let processed = 0;
  let backfilled = 0;
  let skipped = 0;
  let failed = 0;

  const snapshot = await db.collection('users').get();
  const docs = snapshot.docs;
  console.log(`Found ${docs.length} users.`);

  // Process in batches
  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = docs.slice(i, i + BATCH_SIZE);

    for (const doc of chunk) {
      const data = doc.data();
      processed++;

      // Skip if already backfilled
      if (data.profileCompleted === true) {
        skipped++;
        continue;
      }

      const phone = (data.phone || '').trim();
      const experienceLevel = (data.experienceLevel || '').trim();
      const city = (data.city || '').trim();
      const referralSource = (data.referralSource || '').trim();

      // Only backfill if all required legacy fields are present
      if (!phone || !experienceLevel || !city || !referralSource) {
        skipped++;
        continue;
      }

      try {
        batch.set(
          doc.ref,
          {
            profile: {
              fullName: data.name || data.fullName || '',
              whatsapp: phone,
              experienceLevel,
              jobRole: '', // legacy users may not have this; they'll be prompted
              city,
              profileCompleted: true,
              profileCompletedAt: Date.now(),
            },
            acquisition: {
              customerSelectedSource: referralSource,
            },
            // Backward compatibility
            phone,
            fullName: data.name || data.fullName || '',
            experienceLevel,
            city,
          },
          { merge: true }
        );
        backfilled++;
      } catch {
        failed++;
      }
    }

    await batch.commit();
    console.log(`Processed ${Math.min(i + BATCH_SIZE, docs.length)}/${docs.length} users...`);
  }

  console.log('\nBackfill complete.');
  console.log(`  Processed: ${processed}`);
  console.log(`  Backfilled: ${backfilled}`);
  console.log(`  Skipped (already complete or incomplete): ${skipped}`);
  console.log(`  Failed: ${failed}`);
}

backfill()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Backfill failed:', err);
    process.exit(1);
  });
