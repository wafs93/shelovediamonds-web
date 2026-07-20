/* ============================================
   SHELOVEDIAMONDS — SANITY CLIENT (BROWSER)
   ============================================ */

window.SLD_SANITY_CONFIG = window.SLD_SANITY_CONFIG || {
  projectId: '',
  dataset: 'production',
  apiVersion: '2025-01-01',
  useCdn: true,
};

function sanityConfigIsReady() {
  return Boolean(window.SLD_SANITY_CONFIG && window.SLD_SANITY_CONFIG.projectId);
}

function buildSanityProductsQuery() {
  return `*[_type == "product"] | order(name asc) {
    productId,
    name,
    "slug": slug.current,
    category,
    badge,
    price,
    shortDesc,
    fullDesc,
    variants,
    mainImage,
    images,
    details,
    shipping,
    inStock,
    isPersonalised,
    stripeLink
  }`;
}

async function fetchSanityProducts() {
  if (!sanityConfigIsReady()) return null;

  const cfg = window.SLD_SANITY_CONFIG;
  const baseUrl = `https://${cfg.projectId}.api.sanity.io/v${cfg.apiVersion}`;
  const query = encodeURIComponent(buildSanityProductsQuery());
  const endpoint = `${baseUrl}/data/query/${cfg.dataset}?query=${query}`;

  try {
    const res = await fetch(endpoint, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: cfg.useCdn ? 'default' : 'no-store',
    });

    if (!res.ok) {
      console.warn('Sanity query failed with status', res.status);
      return null;
    }

    const payload = await res.json();
    const result = Array.isArray(payload.result) ? payload.result : [];

    return result.map((item) => ({
      id: item.productId || item.slug,
      name: item.name || '',
      slug: item.slug || '',
      category: item.category || 'Uncategorized',
      badge: item.badge || '',
      price: Number(item.price || 0),
      shortDesc: item.shortDesc || '',
      fullDesc: item.fullDesc || '',
      variants: Array.isArray(item.variants) && item.variants.length ? item.variants : ['Default'],
      mainImage: item.mainImage || '',
      images: Array.isArray(item.images) && item.images.length ? item.images : [item.mainImage || ''],
      details: Array.isArray(item.details) ? item.details : [],
      shipping: item.shipping || 'Free UK shipping. Worldwide delivery available.',
      inStock: typeof item.inStock === 'boolean' ? item.inStock : true,
      isPersonalised: Boolean(item.isPersonalised),
      stripeLink: item.stripeLink || '',
    }));
  } catch (err) {
    console.warn('Sanity request error', err);
    return null;
  }
}
