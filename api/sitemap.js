/* ============================================
   SHELOVEDIAMONDS — SITEMAP
   Served at /sitemap.xml (see vercel.json). Lists the public pages
   plus one URL per product, read live from Sanity so new products
   appear without a redeploy. Cart and checkout are left out
   (they are noindex).
   ============================================ */

const SANITY_PROJECT_ID = process.env.SANITY_PROJECT_ID || 'suyafnjq';
const SANITY_DATASET = process.env.SANITY_DATASET || 'production';
const SANITY_API_VERSION = '2025-01-01';
const SITE_URL = 'https://www.shelovediamonds.co.uk';

const STATIC_PAGES = [
  { path: '/', priority: '1.0' },
  { path: '/shop', priority: '0.9' },
  { path: '/our-story', priority: '0.6' },
  { path: '/contact', priority: '0.5' },
];

async function fetchProductSlugs() {
  const query = '*[_type == "product" && defined(slug.current)]{ "slug": slug.current, _updatedAt }';
  const url = `https://${SANITY_PROJECT_ID}.apicdn.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}?query=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    throw new Error(`Sanity query failed: ${res.status}`);
  }
  const data = await res.json();
  return Array.isArray(data.result) ? data.result : [];
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildSitemap(products) {
  const entries = STATIC_PAGES.map((page) => ({ loc: `${SITE_URL}${page.path}`, priority: page.priority }));
  for (const product of products) {
    entries.push({
      loc: `${SITE_URL}/product?slug=${encodeURIComponent(product.slug)}`,
      lastmod: product._updatedAt ? product._updatedAt.slice(0, 10) : undefined,
      priority: '0.8',
    });
  }
  const urls = entries.map((entry) => [
    '  <url>',
    `    <loc>${escapeXml(entry.loc)}</loc>`,
    entry.lastmod ? `    <lastmod>${entry.lastmod}</lastmod>` : null,
    `    <priority>${entry.priority}</priority>`,
    '  </url>',
  ].filter(Boolean).join('\n'));
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

module.exports = async (req, res) => {
  let products = [];
  try {
    products = await fetchProductSlugs();
  } catch (err) {
    // Still serve the static pages rather than a broken sitemap
    console.warn('Sitemap: could not load products from Sanity', err.message);
  }
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(buildSitemap(products));
};

module.exports.buildSitemap = buildSitemap;
