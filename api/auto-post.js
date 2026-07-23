/* ============================================
   SHELOVEDIAMONDS — AUTO-POST WORKER
   Invoked on a recurring basis by Vercel Cron (see vercel.json).
   - Reads the saved posting schedule from Sanity
   - If now matches the scheduled day/hour (Europe/London), picks a
     product, asks Claude for an Instagram caption in the brand voice,
     and saves it as a "scheduledPost" draft in Sanity for review.
   - Does NOT post to Instagram yet (pending API approval).
   ============================================ */

const SANITY_PROJECT_ID = process.env.SANITY_PROJECT_ID || 'suyafnjq';
const SANITY_DATASET = process.env.SANITY_DATASET || 'production';
const SANITY_API_VERSION = '2025-01-01';
const SANITY_API_TOKEN = process.env.SANITY_API_TOKEN;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const CRON_SECRET = process.env.CRON_SECRET;

const SETTINGS_DOC_ID = 'postingScheduleSettings';

// Kept identical to the SYSTEM prompt in dashboard.html so generated
// captions match the brand voice used elsewhere in the dashboard.
const BRAND_SYSTEM_PROMPT = `You are the AI Marketing Assistant for SheLoveDiamonds — a luxury diamond jewellery brand based in the UK with Sierra Leone heritage.

Brand voice: elegant, aspirational, warm, confident. Never generic. Never filler.

Products: Abayo Infinity Bracelet (£350, pavé lab-grown diamonds, 18K gold plated, Rose/White/Yellow Gold), Abayo Infinity Rainbow Bracelet (£120, multicolour Moissanite, 3 gold tones), Personalised Name Bracelet (£195, diamond letters, made to order, Rose/White Gold).

Target audience: women aged 25–50 who appreciate fine jewellery; gift-buyers (partners, parents).

Key phrases Morayo uses: "women who know their worth", "from the mines of Sierra Leone", "pieces she earned", "built for her".

Always write polished luxury copy. Ready to use. Concise. No asterisks or markdown in output unless asked.`;

function sanityQueryUrl(query) {
  const base = `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}`;
  return `${base}?query=${encodeURIComponent(query)}`;
}

async function sanityQuery(query) {
  const res = await fetch(sanityQueryUrl(query), { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    throw new Error(`Sanity query failed: ${res.status}`);
  }
  const data = await res.json();
  return data.result;
}

async function sanityCreate(doc) {
  if (!SANITY_API_TOKEN) {
    throw new Error('Missing SANITY_API_TOKEN environment variable');
  }
  const url = `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/mutate/${SANITY_DATASET}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SANITY_API_TOKEN}`,
    },
    body: JSON.stringify({ mutations: [{ create: doc }] }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sanity mutate failed: ${res.status} ${text}`);
  }
  return res.json();
}

function getLondonNow() {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = fmt.formatToParts(new Date());
  const map = {};
  for (const part of parts) map[part.type] = part.value;
  return { day: map.weekday.toLowerCase(), hour: map.hour, minute: map.minute };
}

async function generateCaption(product) {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('Missing ANTHROPIC_API_KEY environment variable');
  }
  const prompt = `Write an Instagram caption for SheLoveDiamonds. Product: ${product.name}. Description: ${
    product.shortDesc || product.fullDesc || ''
  }. Include relevant hashtags at the end. Platform-appropriate length and tone.`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-8',
      max_tokens: 500,
      system: BRAND_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Claude API error: ${res.status} ${text}`);
  }
  const data = await res.json();
  const textBlock = (data.content || []).find((block) => block.type === 'text');
  return textBlock ? textBlock.text : '';
}

module.exports = async (req, res) => {
  // Vercel sends this header automatically on cron-triggered requests
  // when CRON_SECRET is set — see https://vercel.com/docs/cron-jobs
  if (CRON_SECRET) {
    const authHeader = req.headers['authorization'] || '';
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
  }

  try {
    const settings = await sanityQuery(`*[_type == "settings" && _id == "${SETTINGS_DOC_ID}"][0]`);
    if (!settings || !settings.enabled) {
      res.status(200).json({ skipped: true, reason: 'auto-posting is disabled or not configured yet' });
      return;
    }

    const now = getLondonNow();
    const scheduledHour = (settings.time || '').split(':')[0];
    const scheduledDays = Array.isArray(settings.days) ? settings.days : [];

    if (!scheduledDays.includes(now.day) || scheduledHour !== now.hour) {
      res.status(200).json({ skipped: true, reason: 'not the scheduled day/hour', now });
      return;
    }

    // Avoid generating more than one post per day if the cron fires
    // more than once within the scheduled hour.
    const dayStart = new Date();
    dayStart.setUTCHours(0, 0, 0, 0);
    const alreadyPostedToday = await sanityQuery(
      `count(*[_type == "scheduledPost" && generatedAt >= "${dayStart.toISOString()}"])`
    );
    if (alreadyPostedToday > 0) {
      res.status(200).json({ skipped: true, reason: 'already generated a post today' });
      return;
    }

    const products = await sanityQuery(
      `*[_type == "product"]{ _id, name, shortDesc, fullDesc, "imageUrl": mainImage.asset->url, "images": images[].asset->url }`
    );
    if (!Array.isArray(products) || products.length === 0) {
      res.status(200).json({ skipped: true, reason: 'no products found in Sanity' });
      return;
    }

    // Rotate: avoid repeating whichever products were used most recently.
    const recentProductIds = await sanityQuery(
      `*[_type == "scheduledPost"] | order(generatedAt desc) [0...5].product._ref`
    );
    const recentSet = new Set(Array.isArray(recentProductIds) ? recentProductIds : []);
    const pool = products.filter((p) => !recentSet.has(p._id));
    const candidates = pool.length > 0 ? pool : products;
    const product = candidates[Math.floor(Math.random() * candidates.length)];
    const imageUrl = product.imageUrl || (Array.isArray(product.images) && product.images[0]) || '';

    const caption = await generateCaption(product);

    await sanityCreate({
      _type: 'scheduledPost',
      product: { _type: 'reference', _ref: product._id },
      productName: product.name,
      caption,
      imageUrl,
      status: 'draft',
      generatedAt: new Date().toISOString(),
    });

    res.status(200).json({ ok: true, product: product.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
