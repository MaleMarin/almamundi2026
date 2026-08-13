/**
 * 10 historias temporales para ver marcadores coral vs bits en el globo.
 * Tag: globe-marker-qa. Borrar: npx tsx scripts/seedGlobeMarkerQa.ts --delete
 */
import { config } from 'dotenv';
import { Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from './loadFirebase';

config();
config({ path: '.env.local' });

const TAG = 'globe-marker-qa';
const NOW = Date.now();

const QA_STORIES = [
  { id: 'globe-qa-01', title: '[QA] Manaus — centro del encuadre home', city: 'Manaus', country: 'Brasil', lat: -3.119, lng: -60.0217 },
  { id: 'globe-qa-02', title: '[QA] Ushuaia', city: 'Ushuaia', country: 'Argentina', lat: -54.8019, lng: -68.303 },
  { id: 'globe-qa-03', title: '[QA] Cartagena', city: 'Cartagena', country: 'Colombia', lat: 10.391, lng: -75.4794 },
  { id: 'globe-qa-04', title: '[QA] Asunción', city: 'Asunción', country: 'Paraguay', lat: -25.2637, lng: -57.5759 },
  { id: 'globe-qa-05', title: '[QA] Antofagasta', city: 'Antofagasta', country: 'Chile', lat: -23.6509, lng: -70.3975 },
  { id: 'globe-qa-06', title: '[QA] Recife', city: 'Recife', country: 'Brasil', lat: -8.0476, lng: -34.877 },
  { id: 'globe-qa-07', title: '[QA] Ciudad de Panamá', city: 'Panamá', country: 'Panamá', lat: 8.9824, lng: -79.5199 },
  { id: 'globe-qa-08', title: '[QA] Nairobi', city: 'Nairobi', country: 'Kenia', lat: -1.2921, lng: 36.8219 },
  { id: 'globe-qa-09', title: '[QA] Hobart', city: 'Hobart', country: 'Australia', lat: -42.8821, lng: 147.3272 },
  { id: 'globe-qa-10', title: '[QA] Tromsø', city: 'Tromsø', country: 'Noruega', lat: 69.6492, lng: 18.9553 },
] as const;

function toDoc(s: (typeof QA_STORIES)[number], i: number) {
  return {
    status: 'approved',
    title: s.title,
    lat: s.lat,
    lng: s.lng,
    city: s.city,
    country: s.country,
    placeLabel: `${s.city}, ${s.country}`,
    format: 'text',
    text: 'Historia de prueba para marcadores del globo. Se puede borrar (tag globe-marker-qa).',
    media: {},
    tags: [TAG, 'demo-seed'],
    topic: 'identidad',
    excerpt: 'Punto de prueba coral (onda) frente a bits dorados.',
    quote: null,
    authorName: 'QA globo',
    authorAvatar: null,
    thumbnailUrl: null,
    publishedAt: Timestamp.fromMillis(NOW - i * 1000),
    createdAt: Timestamp.fromMillis(NOW - i * 1000),
    updatedAt: Timestamp.fromMillis(NOW),
  };
}

async function deleteQa(db: ReturnType<typeof getAdminDb>) {
  const byTag = await db.collection('stories').where('tags', 'array-contains', TAG).get();
  const batch = db.batch();
  const ids = new Set<string>();
  byTag.docs.forEach((d) => {
    ids.add(d.id);
    batch.delete(d.ref);
  });
  for (const s of QA_STORIES) {
    if (ids.has(s.id)) continue;
    batch.delete(db.collection('stories').doc(s.id));
  }
  await batch.commit();
  console.log(`Deleted globe-marker-qa docs: ${Math.max(ids.size, QA_STORIES.length)}`);
}

async function seedQa(db: ReturnType<typeof getAdminDb>) {
  const batch = db.batch();
  QA_STORIES.forEach((s, i) => {
    batch.set(db.collection('stories').doc(s.id), toDoc(s, i));
  });
  await batch.commit();
  console.log(`Seeded ${QA_STORIES.length} globe-marker-qa stories (status=approved).`);
  QA_STORIES.forEach((s) => console.log(`  ${s.id}  ${s.lat}, ${s.lng}  ${s.city}`));
}

async function countStories(db: ReturnType<typeof getAdminDb>) {
  const snap = await db.collection('stories').get();
  const byStatus: Record<string, number> = {};
  let publicGeo = 0;
  const publicStatuses = new Set(['approved', 'featured', 'beta_demo', 'published', 'active']);
  snap.docs.forEach((d) => {
    const data = d.data();
    const st = String(data.status ?? '(missing)');
    byStatus[st] = (byStatus[st] ?? 0) + 1;
    const lat = Number(data.lat);
    const lng = Number(data.lng);
    const geo = Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
    if (publicStatuses.has(st) && geo) publicGeo += 1;
  });
  console.log('Total stories:', snap.size);
  console.log('By status:', JSON.stringify(byStatus, null, 2));
  console.log('Audience-public + valid lat/lng:', publicGeo);
}

async function run() {
  const db = getAdminDb();
  const del = process.argv.includes('--delete');
  const countOnly = process.argv.includes('--count');
  if (countOnly) {
    await countStories(db);
    return;
  }
  if (del) {
    await deleteQa(db);
    return;
  }
  await countStories(db);
  await seedQa(db);
  await countStories(db);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
