const test = require('node:test');
const assert = require('node:assert/strict');

function makeRes() {
  return {
    statusCode: undefined,
    headers: {},
    body: undefined,
    setHeader(key, value) {
      this.headers[key] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    send(payload) {
      this.body = payload;
      return this;
    },
  };
}

function loadHandler() {
  delete require.cache[require.resolve('../api/sitemap.js')];
  return require('../api/sitemap.js');
}

function withFetch(impl, fn) {
  const original = global.fetch;
  global.fetch = impl;
  return Promise.resolve().then(fn).finally(() => {
    global.fetch = original;
  });
}

test('lists static pages and one URL per Sanity product', () =>
  withFetch(async () => ({
    ok: true,
    json: async () => ({ result: [{ slug: 'abayo-infinity-bracelet', _updatedAt: '2026-09-01T10:00:00Z' }] }),
  }), async () => {
    const res = makeRes();
    await loadHandler()({ method: 'GET' }, res);
    assert.equal(res.statusCode, 200);
    assert.match(res.headers['Content-Type'], /application\/xml/);
    assert.match(res.body, /<loc>https:\/\/www\.shelovediamonds\.co\.uk\/<\/loc>/);
    assert.match(res.body, /<loc>https:\/\/www\.shelovediamonds\.co\.uk\/shop<\/loc>/);
    assert.match(res.body, /<loc>https:\/\/www\.shelovediamonds\.co\.uk\/product\?slug=abayo-infinity-bracelet<\/loc>/);
    assert.match(res.body, /<lastmod>2026-09-01<\/lastmod>/);
    assert.doesNotMatch(res.body, /cart|checkout|dashboard/);
  }));

test('still serves static pages when Sanity is unavailable', () =>
  withFetch(async () => ({ ok: false, status: 503 }), async () => {
    const res = makeRes();
    await loadHandler()({ method: 'GET' }, res);
    assert.equal(res.statusCode, 200);
    assert.match(res.body, /\/our-story<\/loc>/);
    assert.doesNotMatch(res.body, /product\?slug=/);
  }));

test('escapes XML-special characters in slugs', () => {
  const xml = loadHandler().buildSitemap([{ slug: 'a&b' }]);
  assert.match(xml, /slug=a%26b/);
});
