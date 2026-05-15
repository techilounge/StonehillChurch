const { initializeApp, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { eventSchema } = require('./lib/validators');

if (!getApps().length) {
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
  initializeApp({ projectId: 'stonehill-church-86ca2' });
}
const db = getFirestore();

async function run() {
  const snap = await db.collection('events').where('title', '==', 'Pathfinder Spring Campout').get();
  if (snap.empty) {
    console.log('Not found.');
    return;
  }
  const doc = snap.docs[0].data();
  console.log('Doc Keys:', Object.keys(doc));
  
  const merged = { ...doc, featured: true };
  const parsed = eventSchema.safeParse(merged);
  if (!parsed.success) {
    console.log('VALIDATION FAILED:');
    console.log(parsed.error.flatten().fieldErrors);
  } else {
    console.log('VALIDATION SUCCEEDED');
  }
}
run().catch(console.error);
