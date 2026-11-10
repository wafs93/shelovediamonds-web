const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadStorefront } = require('./_browser');

const ROOT = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');
const load = () => loadStorefront({ files: ['reviews.js'] });

const sample = [
  { rating: 5, displayName: 'Sandra M.', body: 'Lovely', _createdAt: '2026-11-01T10:00:00Z' },
  { rating: 4, displayName: 'Ada O.', body: 'Very nice', _createdAt: '2026-11-02T10:00:00Z', verifiedPurchase: true },
];

test('summary averages only valid ratings', () => {
  const { get } = load();
  assert.equal(get('JSON.stringify(summariseReviews([]))'), '{"count":0,"average":0}');
  assert.equal(get(`summariseReviews(${JSON.stringify(sample)}).average`), 4.5);
  assert.equal(get(`summariseReviews([{rating:5},{rating:'x'},{rating:9}]).count`), 1);
});

test('review text is escaped so it cannot inject markup', () => {
  const { get } = load();
  const html = get(`reviewCardHtml({rating:5, displayName:'<img src=x onerror=alert(1)>', body:'<script>alert(1)</script>', title:'"><b>'})`);
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('<img'));
  assert.ok(!html.includes('<b>'));
  assert.ok(html.includes('&lt;script&gt;'));
});

test('the Verified purchase label shows only when the owner turned it on', () => {
  const { get } = load();
  assert.ok(!get(`reviewCardHtml(${JSON.stringify(sample[0])})`).includes('Verified purchase'));
  assert.ok(get(`reviewCardHtml(${JSON.stringify(sample[1])})`).includes('Verified purchase'));
});

test('star ratings are added to structured data only when real reviews exist', () => {
  const { get } = load();
  const base = { '@type': 'Product', name: 'Bangle' };
  assert.equal(get(`JSON.stringify(productJsonLdWithReviews(${JSON.stringify(base)}, []))`), JSON.stringify(base));
  const withReviews = JSON.parse(get(`JSON.stringify(productJsonLdWithReviews(${JSON.stringify(base)}, ${JSON.stringify(sample)}))`));
  assert.equal(withReviews.aggregateRating.reviewCount, 2);
  assert.equal(withReviews.aggregateRating.ratingValue, 4.5);
  assert.equal(withReviews.review.length, 2);
});

test('the public query never reads drafts and passes the product slug safely', async () => {
  const { context } = load();
  const urls = [];
  context.window.SLD_SANITY_CONFIG = { projectId: 'abc', dataset: 'production', apiVersion: '2025-01-01' };
  context.fetch = async (url) => { urls.push(decodeURIComponent(url)); return { ok: true, json: async () => ({ result: [] }) }; };
  await context.fetchPublishedReviews({ slug: 'custom-name-bangle' });
  await context.fetchPublishedReviews({});
  assert.equal(urls.length, 2);
  for (const url of urls) assert.ok(url.includes('!(_id in path("drafts.**"))'));
  assert.ok(urls[0].includes('$slug="custom-name-bangle"'));
});

test('a failed fetch shows no reviews instead of breaking the page', async () => {
  const { context } = load();
  context.window.SLD_SANITY_CONFIG = { projectId: 'abc', dataset: 'production', apiVersion: '2025-01-01' };
  context.fetch = async () => { throw new Error('offline'); };
  assert.equal((await context.fetchPublishedReviews({})).length, 0);
});

test('the review promise to customers is stated and promises no rewards', () => {
  const { get } = load();
  const policy = get('SLD_REVIEW_POLICY');
  assert.match(policy, /every genuine review, good or bad/i);
  assert.match(policy, /never pay for reviews/i);
});

test('the homepage reviews section starts hidden and needs 3 or more real reviews', () => {
  const html = read('index.html');
  assert.match(html, /<section class="reviews-home" id="home-reviews"[^>]*\bhidden\b/);
  assert.match(html, /stats\.count < 3\) return/);
});

test('the product page reviews section starts hidden and never ships sample reviews', () => {
  const html = read('product.html');
  assert.match(html, /<section class="reviews" id="reviews"[^>]*\bhidden\b/);
  assert.ok(!/review-card__by">[A-Z][a-z]+ [A-Z]\./.test(html), 'a hard-coded review is in product.html');
});
