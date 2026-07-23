/* ============================================
   SHELOVEDIAMONDS — POSTING SCHEDULE SETTINGS API
   GET  -> public read of the current posting schedule
   POST -> write the posting schedule (requires x-dashboard-key,
           and a SANITY_API_TOKEN env var with write access)
   ============================================ */

const SANITY_PROJECT_ID = process.env.SANITY_PROJECT_ID || 'suyafnjq';
const SANITY_DATASET = process.env.SANITY_DATASET || 'production';
const SANITY_API_VERSION = '2025-01-01';
const SANITY_API_TOKEN = process.env.SANITY_API_TOKEN;
const DASHBOARD_SECRET = process.env.DASHBOARD_SECRET;

const SETTINGS_DOC_ID = 'postingScheduleSettings';
const VALID_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function sanityQueryUrl(query) {
  const base = `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}`;
  return `${base}?query=${encodeURIComponent(query)}`;
}

async function fetchSettings() {
  const res = await fetch(sanityQueryUrl(`*[_type == "settings" && _id == "${SETTINGS_DOC_ID}"][0]`), {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Sanity query failed: ${res.status}`);
  }
  const data = await res.json();
  return data.result || null;
}

async function saveSettings({ enabled, days, time }) {
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
    body: JSON.stringify({
      mutations: [
        {
          createOrReplace: {
            _id: SETTINGS_DOC_ID,
            _type: 'settings',
            enabled: Boolean(enabled),
            days,
            time,
            updatedAt: new Date().toISOString(),
          },
        },
      ],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sanity mutate failed: ${res.status} ${text}`);
  }
  return res.json();
}

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    try {
      const settings = await fetchSettings();
      res.status(200).json({ settings });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
    return;
  }

  if (req.method === 'POST') {
    if (!DASHBOARD_SECRET || req.headers['x-dashboard-key'] !== DASHBOARD_SECRET) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const body = req.body || {};
    const { enabled, days, time } = body;

    if (!Array.isArray(days) || days.some((d) => !VALID_DAYS.includes(d))) {
      res.status(400).json({ error: 'days must be an array of valid weekday names' });
      return;
    }
    if (typeof time !== 'string' || !/^([01]\d|2[0-3]):([0-5]\d)$/.test(time)) {
      res.status(400).json({ error: 'time must be in HH:MM 24-hour format' });
      return;
    }

    try {
      await saveSettings({ enabled, days, time });
      res.status(200).json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
