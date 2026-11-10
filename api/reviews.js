/* ============================================
   SHELOVEDIAMONDS — CUSTOMER REVIEW SUBMISSION API
   POST -> validates a review and saves it to Sanity as a private DRAFT.
           Drafts cannot be read by the public website. A review only appears
           after the owner clicks Publish in Sanity Studio.
   Needs the SANITY_API_TOKEN env var (same one the dashboard uses).
   ============================================ */

const crypto = require('node:crypto');

const SANITY_PROJECT_ID = process.env.SANITY_PROJECT_ID || 'suyafnjq';
const SANITY_DATASET = process.env.SANITY_DATASET || 'production';
const SANITY_API_VERSION = '2025-01-01';

const LIMITS = { bodyMin: 20, bodyMax: 1500, titleMax: 80, nameMin: 2, nameMax: 40, locationMax: 40 };

// Best-effort limit per visitor. Serverless instances do not share memory, so this only
// slows down casual abuse; the real gate is that nothing shows until the owner publishes it.
const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_MAX = 3;
const recent = new Map();

function tooManyRecently(ip, now = Date.now()) {
  const hits = (recent.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (hits.length >= RATE_MAX) {
    recent.set(ip, hits);
    return true;
  }
  hits.push(now);
  recent.set(ip, hits);
  return false;
}

function clean(value, max) {
  return String(value == null ? '' : value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, max);
}

const LINK_PATTERN = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|co|uk|net|org|io|ly|me)\b)/i;

function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return null;
    }
  }
  return null;
}

function validate(input) {
  const slug = clean(input.slug, 100);
  const rating = Number(input.rating);
  const title = clean(input.title, LIMITS.titleMax);
  const body = clean(input.body, LIMITS.bodyMax + 1);
  const name = clean(input.name, LIMITS.nameMax + 1);
  const location = clean(input.location, LIMITS.locationMax + 1);

  if (!/^[a-z0-9][a-z0-9-]*$/i.test(slug)) return { error: 'Choose a product to review.' };
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { error: 'Choose a rating from 1 to 5 stars.' };
  if (body.length < LIMITS.bodyMin) return { error: `Please write at least ${LIMITS.bodyMin} characters.` };
  if (body.length > LIMITS.bodyMax) return { error: `Please keep your review under ${LIMITS.bodyMax} characters.` };
  if (name.length < LIMITS.nameMin || name.length > LIMITS.nameMax) return { error: 'Please enter your first name and last initial.' };
  if (location.length > LIMITS.locationMax) return { error: 'Please shorten your location.' };
  if (input.consent !== true) return { error: 'Please confirm the statement about your review.' };
  if (LINK_PATTERN.test(`${title} ${body} ${name} ${location}`)) {
    return { error: "Reviews can't include links or web addresses." };
  }
  return { value: { slug, rating, title, body, displayName: name, location } };
}

async function findProductId(slug) {
  const query = `*[_type == "product" && slug.current == $slug && !(_id in path("drafts.**"))][0]{_id}`;
  const url =
    `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}` +
    `?query=${encodeURIComponent(query)}&$slug=${encodeURIComponent(JSON.stringify(slug))}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Sanity query failed: ${res.status}`);
  const data = await res.json();
  return data.result && data.result._id ? data.result._id : null;
}

async function saveDraft(productId, review, token) {
  const url = `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/mutate/${SANITY_DATASET}`;
  const doc = {
    _id: `drafts.review-${crypto.randomUUID()}`, // the drafts. prefix keeps it private until published
    _type: 'review',
    product: { _type: 'reference', _ref: productId },
    rating: review.rating,
    body: review.body,
    displayName: review.displayName,
    verifiedPurchase: false,
    featured: false,
    submittedAt: new Date().toISOString(),
  };
  if (review.title) doc.title = review.title;
  if (review.location) doc.location = review.location;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ mutations: [{ create: doc }] }),
  });
  if (!res.ok) throw new Error(`Sanity mutate failed: ${res.status}`);
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const input = parseBody(req);
  if (!input) {
    res.status(400).json({ error: 'Invalid request.' });
    return;
  }

  // Hidden field that real visitors never fill in. Pretend it worked so bots learn nothing.
  if (clean(input.website, 200)) {
    res.status(201).json({ ok: true });
    return;
  }

  const checked = validate(input);
  if (checked.error) {
    res.status(400).json({ error: checked.error });
    return;
  }

  const ip = String((req.headers && req.headers['x-forwarded-for']) || 'unknown').split(',')[0].trim();
  if (tooManyRecently(ip)) {
    res.status(429).json({ error: 'Too many reviews from this connection. Please try again later.' });
    return;
  }

  const token = process.env.SANITY_API_TOKEN;
  if (!token) {
    console.error('Review not saved: SANITY_API_TOKEN is not set');
    res.status(500).json({ error: "We couldn't save your review. Please try again later." });
    return;
  }

  try {
    const productId = await findProductId(checked.value.slug);
    if (!productId) {
      res.status(404).json({ error: "We couldn't find that product." });
      return;
    }
    await saveDraft(productId, checked.value, token);
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('Review not saved:', err.message);
    res.status(500).json({ error: "We couldn't save your review. Please try again later." });
  }
};

module.exports._resetRateLimit = () => recent.clear();
