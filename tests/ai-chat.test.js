const test = require('node:test');
const assert = require('node:assert/strict');

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
  delete require.cache[require.resolve('../api/ai-chat.js')];
  delete require.cache[require.resolve('../api/_lib/openai.js')];
  return require('../api/ai-chat.js');
}

function withEnv(overrides, fn) {
  const keys = ['OPENAI_API_KEY', 'DASHBOARD_SECRET'];
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

const VALID_BODY = {
  system: 'You are the AI Marketing Assistant for SheLoveDiamonds.',
  messages: [{ role: 'user', content: 'Write a caption for the Abayo bracelet.' }],
};

test('rejects non-POST methods with 405', async () => {
  await withEnv({ DASHBOARD_SECRET: 'sld2026morayo' }, async () => {
    const handler = loadHandler();
    const res = makeRes();
    await handler({ method: 'GET', headers: {} }, res);
    assert.equal(res.statusCode, 405);
  });
});

test('rejects with 401 when x-dashboard-key does not match DASHBOARD_SECRET', async () => {
  await withEnv({ DASHBOARD_SECRET: 'sld2026morayo' }, async () => {
    global.fetch = async () => {
      throw new Error('fetch should not be called for an unauthorized request');
    };
    const handler = loadHandler();
    const res = makeRes();
    await handler({ method: 'POST', headers: { 'x-dashboard-key': 'wrong' }, body: VALID_BODY }, res);
    assert.equal(res.statusCode, 401);
    assert.deepEqual(res.body, { error: 'Unauthorized' });
  });
});

test('rejects with 401 when DASHBOARD_SECRET is not configured at all', async () => {
  await withEnv({ DASHBOARD_SECRET: undefined }, async () => {
    const handler = loadHandler();
    const res = makeRes();
    await handler({ method: 'POST', headers: { 'x-dashboard-key': 'anything' }, body: VALID_BODY }, res);
    assert.equal(res.statusCode, 401);
  });
});

test('rejects with 400 when system prompt is missing', async () => {
  await withEnv({ DASHBOARD_SECRET: 'sld2026morayo' }, async () => {
    const handler = loadHandler();
    const res = makeRes();
    await handler(
      { method: 'POST', headers: { 'x-dashboard-key': 'sld2026morayo' }, body: { messages: VALID_BODY.messages } },
      res
    );
    assert.equal(res.statusCode, 400);
    assert.match(res.body.error, /system/);
  });
});

test('rejects with 400 when messages is missing or malformed', async () => {
  await withEnv({ DASHBOARD_SECRET: 'sld2026morayo' }, async () => {
    const handler = loadHandler();

    const res1 = makeRes();
    await handler(
      { method: 'POST', headers: { 'x-dashboard-key': 'sld2026morayo' }, body: { system: VALID_BODY.system } },
      res1
    );
    assert.equal(res1.statusCode, 400);

    const res2 = makeRes();
    await handler(
      {
        method: 'POST',
        headers: { 'x-dashboard-key': 'sld2026morayo' },
        body: { system: VALID_BODY.system, messages: [{ role: 'system', content: 'nope' }] },
      },
      res2
    );
    assert.equal(res2.statusCode, 400);
  });
});

test('returns 500 with a clear message when OPENAI_API_KEY is missing', async () => {
  await withEnv({ DASHBOARD_SECRET: 'sld2026morayo', OPENAI_API_KEY: undefined }, async () => {
    const handler = loadHandler();
    const res = makeRes();
    await handler({ method: 'POST', headers: { 'x-dashboard-key': 'sld2026morayo' }, body: VALID_BODY }, res);
    assert.equal(res.statusCode, 500);
    assert.match(res.body.error, /Missing OPENAI_API_KEY environment variable/);
  });
});

test('happy path: calls OpenAI with system+user messages and the default model/max_tokens, returns the text', async () => {
  await withEnv({ DASHBOARD_SECRET: 'sld2026morayo', OPENAI_API_KEY: 'openai-test-key' }, async () => {
    let openaiCall = null;
    global.fetch = async (url, opts) => {
      assert.equal(url, 'https://api.openai.com/v1/chat/completions');
      openaiCall = { url, opts };
      return { ok: true, json: async () => ({ choices: [{ message: { content: 'Generated caption.' } }] }) };
    };

    const handler = loadHandler();
    const res = makeRes();
    await handler({ method: 'POST', headers: { 'x-dashboard-key': 'sld2026morayo' }, body: VALID_BODY }, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.text, 'Generated caption.');

    assert.ok(openaiCall);
    assert.equal(openaiCall.opts.headers.Authorization, 'Bearer openai-test-key');
    const payload = JSON.parse(openaiCall.opts.body);
    assert.equal(payload.model, 'gpt-4o-mini');
    assert.equal(payload.max_tokens, 1000);
    assert.equal(payload.messages.length, 2);
    assert.equal(payload.messages[0].role, 'system');
    assert.equal(payload.messages[0].content, VALID_BODY.system);
    assert.equal(payload.messages[1].role, 'user');
    assert.equal(payload.messages[1].content, VALID_BODY.messages[0].content);
  });
});

test('honors an allowed model override (gpt-4o) and a valid max_tokens override', async () => {
  await withEnv({ DASHBOARD_SECRET: 'sld2026morayo', OPENAI_API_KEY: 'openai-test-key' }, async () => {
    let payload = null;
    global.fetch = async (url, opts) => {
      payload = JSON.parse(opts.body);
      return { ok: true, json: async () => ({ choices: [{ message: { content: 'Calendar content.' } }] }) };
    };

    const handler = loadHandler();
    const res = makeRes();
    await handler(
      {
        method: 'POST',
        headers: { 'x-dashboard-key': 'sld2026morayo' },
        body: { ...VALID_BODY, model: 'gpt-4o', max_tokens: 2000 },
      },
      res
    );

    assert.equal(res.statusCode, 200);
    assert.equal(payload.model, 'gpt-4o');
    assert.equal(payload.max_tokens, 2000);
  });
});

test('ignores a disallowed model and an out-of-range max_tokens, falling back to safe defaults', async () => {
  await withEnv({ DASHBOARD_SECRET: 'sld2026morayo', OPENAI_API_KEY: 'openai-test-key' }, async () => {
    let payload = null;
    global.fetch = async (url, opts) => {
      payload = JSON.parse(opts.body);
      return { ok: true, json: async () => ({ choices: [{ message: { content: 'ok' } }] }) };
    };

    const handler = loadHandler();
    const res = makeRes();
    await handler(
      {
        method: 'POST',
        headers: { 'x-dashboard-key': 'sld2026morayo' },
        body: { ...VALID_BODY, model: 'gpt-5-super-expensive', max_tokens: 999999 },
      },
      res
    );

    assert.equal(res.statusCode, 200);
    assert.equal(payload.model, 'gpt-4o-mini');
    assert.equal(payload.max_tokens, 1000);
  });
});

test('returns 500 when the upstream OpenAI call fails', async () => {
  await withEnv({ DASHBOARD_SECRET: 'sld2026morayo', OPENAI_API_KEY: 'openai-test-key' }, async () => {
    global.fetch = async () => ({ ok: false, status: 429, text: async () => 'rate limited' });

    const handler = loadHandler();
    const res = makeRes();
    await handler({ method: 'POST', headers: { 'x-dashboard-key': 'sld2026morayo' }, body: VALID_BODY }, res);

    assert.equal(res.statusCode, 500);
    assert.match(res.body.error, /OpenAI API error: 429/);
  });
});
