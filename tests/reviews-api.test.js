const test = require('node:test');
const assert = require('node:assert/strict');

function makeRes() {
  return {
    statusCode: undefined,
    headers: {},
    body: undefined,
    setHeader(key, value) { this.headers[key] = value; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
}

function loadHandler() {
  delete require.cache[require.resolve('../api/reviews.js')];
  return require('../api/reviews.js');
}

const goodReview = {
  slug: 'custom-name-bangle',
  rating: 5,
  title: 'Beautiful',
  body: 'The bangle arrived beautifully packaged and fits perfectly.',
  name: 'Sandra M.',
  location: 'London',
  consent: true,
  website: '',
};

// Fake Sanity: the first call looks the product up, the second saves the draft
function fakeSanity({ productId = 'product-123', mutateOk = true } = {}) {
  const calls = [];
  const impl = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (String(url).includes('/data/query/')) {
      return { ok: true, json: async () => ({ result: productId ? { _id: productId } : null }) };
    }
    return { ok: mutateOk, status: mutateOk ? 200 : 500, json: async () => ({}), text: async () => '' };
  };
  return { impl, calls };
}

async function run(body, { fetchImpl, token = 'test-token', headers = {}, method = 'POST', reset = true } = {}) {
  const original = global.fetch;
  const originalToken = process.env.SANITY_API_TOKEN;
  if (token) process.env.SANITY_API_TOKEN = token; else delete process.env.SANITY_API_TOKEN;
  if (fetchImpl) global.fetch = fetchImpl;
  const handler = loadHandler();
  if (reset) handler._resetRateLimit();
  const res = makeRes();
  try {
    await handler({ method, body, headers }, res);
  } finally {
    global.fetch = original;
    if (originalToken === undefined) delete process.env.SANITY_API_TOKEN; else process.env.SANITY_API_TOKEN = originalToken;
  }
  return res;
}

test('only POST is accepted', async () => {
  const res = await run(undefined, { method: 'GET' });
  assert.equal(res.statusCode, 405);
});

test('a valid review is saved as a private draft that is not verified or featured', async () => {
  const { impl, calls } = fakeSanity();
  const res = await run(goodReview, { fetchImpl: impl });
  assert.equal(res.statusCode, 201);
  const mutation = calls.find((c) => c.url.includes('/data/mutate/'));
  const doc = JSON.parse(mutation.options.body).mutations[0].create;
  assert.match(doc._id, /^drafts\.review-/);
  assert.equal(doc._type, 'review');
  assert.deepEqual(doc.product, { _type: 'reference', _ref: 'product-123' });
  assert.equal(doc.rating, 5);
  assert.equal(doc.displayName, 'Sandra M.');
  assert.equal(doc.verifiedPurchase, false);
  assert.equal(doc.featured, false);
  assert.ok(doc.submittedAt);
  assert.equal(mutation.options.headers.Authorization, 'Bearer test-token');
});

test('the token is only sent to Sanity, never in a URL or the response', async () => {
  const { impl, calls } = fakeSanity();
  const res = await run(goodReview, { fetchImpl: impl });
  assert.ok(calls.every((c) => !c.url.includes('test-token')));
  assert.ok(!JSON.stringify(res.body).includes('test-token'));
});

test('a JSON string body is accepted', async () => {
  const { impl } = fakeSanity();
  const res = await run(JSON.stringify(goodReview), { fetchImpl: impl });
  assert.equal(res.statusCode, 201);
});

test('the hidden honeypot field is answered with success but nothing is saved', async () => {
  const { impl, calls } = fakeSanity();
  const res = await run({ ...goodReview, website: 'http://spam.example' }, { fetchImpl: impl });
  assert.equal(res.statusCode, 201);
  assert.equal(calls.length, 0);
});

for (const [label, change] of [
  ['a missing rating', { rating: undefined }],
  ['a rating above 5', { rating: 6 }],
  ['a fractional rating', { rating: 4.5 }],
  ['a review that is too short', { body: 'Nice' }],
  ['a missing name', { name: '' }],
  ['no consent', { consent: false }],
  ['a link in the review', { body: 'Great piece, see my shop at www.example.com for more' }],
  ['a web address in the name', { name: 'buy.co.uk' }],
  ['a bad product slug', { slug: '../etc' }],
]) {
  test(`rejects ${label}`, async () => {
    const { impl, calls } = fakeSanity();
    const res = await run({ ...goodReview, ...change }, { fetchImpl: impl });
    assert.equal(res.statusCode, 400);
    assert.ok(res.body.error);
    assert.equal(calls.length, 0);
  });
}

test('an unknown product returns 404 and saves nothing', async () => {
  const { impl, calls } = fakeSanity({ productId: null });
  const res = await run(goodReview, { fetchImpl: impl });
  assert.equal(res.statusCode, 404);
  assert.ok(!calls.some((c) => c.url.includes('/data/mutate/')));
});

test('a missing token returns a generic error without naming the token', async () => {
  const { impl } = fakeSanity();
  const res = await run(goodReview, { fetchImpl: impl, token: null });
  assert.equal(res.statusCode, 500);
  assert.ok(!/token/i.test(res.body.error));
});

test('a Sanity failure returns a generic error', async () => {
  const { impl } = fakeSanity({ mutateOk: false });
  const res = await run(goodReview, { fetchImpl: impl });
  assert.equal(res.statusCode, 500);
  assert.match(res.body.error, /couldn't save/i);
});

test('the fourth review in an hour from one connection is rate limited', async () => {
  const { impl } = fakeSanity();
  const original = global.fetch;
  process.env.SANITY_API_TOKEN = 'test-token';
  global.fetch = impl;
  const handler = loadHandler(); // one handler, so the limiter remembers earlier requests
  handler._resetRateLimit();
  const statuses = [];
  try {
    for (let i = 0; i < 4; i++) {
      const res = makeRes();
      await handler({ method: 'POST', body: goodReview, headers: { 'x-forwarded-for': '203.0.113.9' } }, res);
      statuses.push(res.statusCode);
    }
  } finally {
    global.fetch = original;
    delete process.env.SANITY_API_TOKEN;
  }
  assert.deepEqual(statuses, [201, 201, 201, 429]);
});
