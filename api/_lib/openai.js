/* ============================================
   SHELOVEDIAMONDS — SHARED OPENAI CHAT COMPLETIONS HELPER
   Used by both /api/auto-post.js and /api/ai-chat.js so the request
   shape and response parsing live in exactly one place. Files under
   api/_lib/ are private helpers — Vercel does not turn them into
   routes (folders/files prefixed with "_" are excluded from routing).
   ============================================ */

async function callOpenAI({ apiKey, model, maxTokens, system, messages }) {
  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY environment variable');
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('messages must be a non-empty array');
  }

  const fullMessages = system ? [{ role: 'system', content: system }, ...messages] : messages;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: fullMessages,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI API error: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content || '';
}

module.exports = { callOpenAI };
