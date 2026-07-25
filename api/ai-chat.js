/* ============================================
   SHELOVEDIAMONDS — DASHBOARD AI PROXY
   Backs every AI tool in dashboard.html (AI Assistant, Social Posts,
   Email Replies, Find Clients, Content Calendar). The browser never
   sees OPENAI_API_KEY — it POSTs a system prompt + messages here,
   this function calls OpenAI server-side and returns the text.
   Gated by the same DASHBOARD_SECRET shared-secret used by
   /api/settings, so the (unauthenticated, public) dashboard can't be
   used by random visitors to run up an OpenAI bill.
   ============================================ */

const { callOpenAI } = require('./_lib/openai');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DASHBOARD_SECRET = process.env.DASHBOARD_SECRET;

const ALLOWED_MODELS = new Set(['gpt-4o-mini', 'gpt-4o']);
const DEFAULT_MODEL = 'gpt-4o-mini';
const DEFAULT_MAX_TOKENS = 1000;
const MAX_ALLOWED_TOKENS = 4000;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!DASHBOARD_SECRET || req.headers['x-dashboard-key'] !== DASHBOARD_SECRET) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const body = req.body || {};
  const { system, messages, model, max_tokens } = body;

  if (typeof system !== 'string' || !system.trim()) {
    res.status(400).json({ error: 'system must be a non-empty string' });
    return;
  }
  if (
    !Array.isArray(messages) ||
    messages.length === 0 ||
    messages.some((m) => !m || typeof m.content !== 'string' || !['user', 'assistant'].includes(m.role))
  ) {
    res.status(400).json({ error: 'messages must be a non-empty array of { role: "user"|"assistant", content }' });
    return;
  }

  const chosenModel = ALLOWED_MODELS.has(model) ? model : DEFAULT_MODEL;
  const chosenMaxTokens =
    Number.isInteger(max_tokens) && max_tokens > 0 && max_tokens <= MAX_ALLOWED_TOKENS ? max_tokens : DEFAULT_MAX_TOKENS;

  try {
    const text = await callOpenAI({
      apiKey: OPENAI_API_KEY,
      model: chosenModel,
      maxTokens: chosenMaxTokens,
      system,
      messages,
    });
    res.status(200).json({ text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
