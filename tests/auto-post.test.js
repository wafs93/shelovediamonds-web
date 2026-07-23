const test = require('node:test');
const assert = require('node:assert/strict');

const REAL_DATE = Date;

// 2026-07-23T10:00:00.000Z is Thursday 11:00 in Europe/London (BST).
const FIXED_NOW_ISO = '2026-07-23T10:00:00.000Z';

function setFixedTime(isoString) {
  global.Date = class extends REAL_DATE {
    constructor(...args) {
      if (args.length === 0) {
        return new REAL_DATE(isoString);
      }
      return new REAL_DATE(...args);
    }
    static now() {
      return new REAL_DATE(isoString).getTime();
    }
  };
}

function restoreTime() {
  global.Date = REAL_DATE;
}

function makeRes() {
  return {
    statusCode: undefined,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

function loadHandler() {
  delete require.cache[require.resolve('../api/auto-post.js')];
  return require('../api/auto-post.js');
}

function sanityQueryResponder({ settings, products, recentRefs, alreadyPostedToday }) {
  return async (url) => {
    const decoded = decodeURIComponent(url);
    if (decoded.includes('_type == "settings"')) {
      return { ok: true, json: async () => ({ result: settings }) };
    }
    if (decoded.includes('count(')) {
      return { ok: true, json: async () => ({ result: alreadyPostedToday || 0 }) };
    }
    if (decoded.includes('_type == "product"')) {
      return { ok: true, json: async () => ({ result: products || [] }) };
    }
    if (decoded.includes('order(generatedAt desc)')) {
      return { ok: true, json: async () => ({ result: recentRefs || [] }) };
    }
    throw new Error('Unexpected Sanity query: ' + decoded);
  };
}

function withEnv(overrides, fn) {
  const keys = ['OPENAI_API_KEY', 'SANITY_API_TOKEN', 'CRON_SECRET'];
  const original = {};
  for (const key of keys) original[key] = process.env[key];
  for (const key of keys) {
    if (key in overrides) {
      if (overrides[key] === undefined) delete process.env[key];
      else process.env[key] = overrides[key];
    }
  }
  return Promise.resolve()
    .then(fn)
    .finally(() => {
      for (const key of keys) {
        if (original[key] === undefined) delete process.env[key];
        else process.env[key] = original[key];
      }
    });
}

test('skips when there is no settings document yet', async () => {
  global.fetch = sanityQueryResponder({ settings: null });
  const handler = loadHandler();
  const res = makeRes();
  await handler({ headers: {} }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.skipped, true);
  assert.match(res.body.reason, /disabled or not configured/);
});

test('skips when auto-posting is disabled', async () => {
  global.fetch = sanityQueryResponder({ settings: { enabled: false, days: ['thursday'], time: '09:00' } });
  const handler = loadHandler();
  const res = makeRes();
  await handler({ headers: {} }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.skipped, true);
  assert.match(res.body.reason, /disabled/);
});

test('rejects with 401 when CRON_SECRET is set and Authorization header does not match', async () => {
  await withEnv({ CRON_SECRET: 'sekrit' }, async () => {
    global.fetch = async () => {
      throw new Error('fetch should not be called for an unauthorized request');
    };
    const handler = loadHandler();
    const res = makeRes();
    await handler({ headers: {} }, res);
    assert.equal(res.statusCode, 401);
    assert.deepEqual(res.body, { error: 'Unauthorized' });
  });
});

test('allows the request through when Authorization matches CRON_SECRET', async () => {
  await withEnv({ CRON_SECRET: 'sekrit' }, async () => {
    global.fetch = sanityQueryResponder({ settings: { enabled: false, days: [], time: '09:00' } });
    const handler = loadHandler();
    const res = makeRes();
    await handler({ headers: { authorization: 'Bearer sekrit' } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.skipped, true);
  });
});

test('skips when today is not a scheduled day', async () => {
  setFixedTime(FIXED_NOW_ISO); // Thursday
  global.fetch = sanityQueryResponder({ settings: { enabled: true, days: ['monday'], time: '09:00' } });
  try {
    const handler = loadHandler();
    const res = makeRes();
    await handler({ headers: {} }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.skipped, true);
    assert.match(res.body.reason, /scheduled day/);
  } finally {
    restoreTime();
  }
});

test('skips when today matches but the scheduled time has not passed yet', async () => {
  setFixedTime(FIXED_NOW_ISO); // Thursday 11:00 London
  global.fetch = sanityQueryResponder({ settings: { enabled: true, days: ['thursday'], time: '13:00' } });
  try {
    const handler = loadHandler();
    const res = makeRes();
    await handler({ headers: {} }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.skipped, true);
    assert.equal(res.body.reason, 'not the scheduled day or time has not passed yet');
  } finally {
    restoreTime();
  }
});

test('skips when a post was already generated today', async () => {
  setFixedTime(FIXED_NOW_ISO);
  global.fetch = sanityQueryResponder({
    settings: { enabled: true, days: ['thursday'], time: '09:00' },
    alreadyPostedToday: 1,
  });
  try {
    const handler = loadHandler();
    const res = makeRes();
    await handler({ headers: {} }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.skipped, true);
    assert.match(res.body.reason, /already generated/);
  } finally {
    restoreTime();
  }
});

test('returns 500 with a clear message when OPENAI_API_KEY is missing', async () => {
  await withEnv({ OPENAI_API_KEY: undefined, SANITY_API_TOKEN: 'sanity-token' }, async () => {
    setFixedTime(FIXED_NOW_ISO);
    global.fetch = sanityQueryResponder({
      settings: { enabled: true, days: ['thursday'], time: '09:00' },
      products: [{ _id: 'prod-1', name: 'Abayo Infinity Bracelet', shortDesc: 'Pave diamonds.', imageUrl: 'https://img/1.png' }],
    });
    try {
      const handler = loadHandler();
      const res = makeRes();
      await handler({ headers: {} }, res);
      assert.equal(res.statusCode, 500);
      assert.match(res.body.error, /Missing OPENAI_API_KEY environment variable/);
    } finally {
      restoreTime();
    }
  });
});

test('happy path: generates a caption via OpenAI and saves a scheduledPost draft, rotating away from recently-used products', async () => {
  await withEnv({ OPENAI_API_KEY: 'openai-test-key', SANITY_API_TOKEN: 'sanity-write-token', CRON_SECRET: undefined }, async () => {
    setFixedTime(FIXED_NOW_ISO); // Thursday 11:00 London — scheduled time 09:00 has passed
    const products = [
      { _id: 'prod-1', name: 'Abayo Infinity Bracelet', shortDesc: 'Pave diamonds.', imageUrl: 'https://img/1.png', images: [] },
      { _id: 'prod-2', name: 'Abayo Rainbow Bracelet', shortDesc: 'Moissanite rainbow.', imageUrl: 'https://img/2.png', images: [] },
    ];

    let createdDoc = null;
    let openaiCall = null;

    global.fetch = async (url, opts) => {
      if (url === 'https://api.openai.com/v1/chat/completions') {
        openaiCall = { url, opts };
        return { ok: true, json: async () => ({ choices: [{ message: { content: 'Elegance, redefined. #SheLoveDiamonds' } }] }) };
      }
      if (typeof url === 'string' && url.includes('/data/mutate/')) {
        createdDoc = JSON.parse(opts.body).mutations[0].create;
        return { ok: true, json: async () => ({}) };
      }
      const responder = sanityQueryResponder({
        settings: { enabled: true, days: ['thursday'], time: '09:00' },
        products,
        recentRefs: ['prod-1'], // prod-1 used recently -> should rotate to prod-2
      });
      return responder(url);
    };

    try {
      const handler = loadHandler();
      const res = makeRes();
      await handler({ headers: {} }, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.ok, true);
      assert.equal(res.body.product, 'Abayo Rainbow Bracelet');

      assert.ok(openaiCall, 'expected a call to the OpenAI chat completions endpoint');
      assert.equal(openaiCall.opts.headers.Authorization, 'Bearer openai-test-key');
      assert.equal(openaiCall.opts.headers['Content-Type'], 'application/json');

      const payload = JSON.parse(openaiCall.opts.body);
      assert.equal(payload.model, 'gpt-4o-mini');
      assert.equal(payload.messages.length, 2);
      assert.equal(payload.messages[0].role, 'system');
      assert.match(payload.messages[0].content, /AI Marketing Assistant for SheLoveDiamonds/);
      assert.equal(payload.messages[1].role, 'user');
      assert.match(payload.messages[1].content, /Abayo Rainbow Bracelet/);

      assert.ok(createdDoc, 'expected a Sanity scheduledPost document to be created');
      assert.equal(createdDoc._type, 'scheduledPost');
      assert.equal(createdDoc.product._ref, 'prod-2');
      assert.equal(createdDoc.caption, 'Elegance, redefined. #SheLoveDiamonds');
      assert.equal(createdDoc.status, 'draft');
    } finally {
      restoreTime();
    }
  });
});
