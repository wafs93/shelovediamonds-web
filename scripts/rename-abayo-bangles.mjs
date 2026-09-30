#!/usr/bin/env node

/*
  Renames the two Abayo infinity pieces from "Bracelet" to "Bangle" in Sanity.
  Only name, shortDesc and fullDesc are touched — category ("Bracelets"),
  slug and every other field stay as they are.

  Dry run (prints the changes, writes nothing):
  SANITY_API_TOKEN=xxxx node scripts/rename-abayo-bangles.mjs

  Apply:
  SANITY_API_TOKEN=xxxx node scripts/rename-abayo-bangles.mjs --apply
*/

const projectId = process.env.SANITY_PROJECT_ID || 'suyafnjq';
const dataset = process.env.SANITY_DATASET || 'production';
const token = process.env.SANITY_API_TOKEN;
const apply = process.argv.includes('--apply');

const SLUGS = ['abayo-infinity-bracelet', 'abayo-infinity-rainbow-bracelet'];
const FIELDS = ['name', 'shortDesc', 'fullDesc'];

if (!token) {
  console.error('Missing SANITY_API_TOKEN (needs write access)');
  process.exit(1);
}

const base = `https://${projectId}.api.sanity.io/v2025-01-01/data`;
const headers = {Authorization: `Bearer ${token}`, 'Content-Type': 'application/json'};

function toBangle(text) {
  return text.replace(/Bracelet/g, 'Bangle').replace(/bracelet/g, 'bangle');
}

const query = `*[_type == "product" && slug.current in $slugs]{_id, name, shortDesc, fullDesc}`;
const url = `${base}/query/${dataset}?query=${encodeURIComponent(query)}&$slugs=${encodeURIComponent(JSON.stringify(SLUGS))}`;
const res = await fetch(url, {headers});
if (!res.ok) {
  console.error('Sanity query failed:', res.status, await res.text());
  process.exit(1);
}
const {result: products} = await res.json();
if (products.length !== SLUGS.length) {
  console.error(`Expected ${SLUGS.length} products, found ${products.length}`);
  process.exit(1);
}

const mutations = [];
for (const product of products) {
  const set = {};
  for (const field of FIELDS) {
    if (typeof product[field] !== 'string') continue;
    const updated = toBangle(product[field]);
    if (updated !== product[field]) {
      set[field] = updated;
      console.log(`${product._id} ${field}:\n  - ${product[field]}\n  + ${updated}`);
    }
  }
  if (Object.keys(set).length) mutations.push({patch: {id: product._id, set}});
}

if (!mutations.length) {
  console.log('Nothing to change — already renamed.');
  process.exit(0);
}
if (!apply) {
  console.log(`\nDry run: ${mutations.length} product(s) would change. Re-run with --apply to write.`);
  process.exit(0);
}

const mutate = await fetch(`${base}/mutate/${dataset}`, {
  method: 'POST',
  headers,
  body: JSON.stringify({mutations}),
});
if (!mutate.ok) {
  console.error('Sanity update failed:', mutate.status, await mutate.text());
  process.exit(1);
}
console.log(`Updated ${mutations.length} product(s) in ${projectId}/${dataset}`);
