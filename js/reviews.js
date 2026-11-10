/* ============================================
   SHELOVEDIAMONDS — CUSTOMER REVIEWS (BROWSER)
   Only reviews the owner has PUBLISHED in Sanity are ever shown. New reviews are
   saved as private drafts by /api/reviews and stay invisible until published.
   ============================================ */

// Shown next to every review list. This is a promise to customers, so it must stay true.
const SLD_REVIEW_POLICY =
  'We publish every genuine review, good or bad. We only leave out reviews that are spam, abusive, ' +
  'off topic or share personal details. We never pay for reviews or reward people for them.';

const SLD_REVIEW_CONSENT =
  'This is my own honest review of a piece I bought or received, and I am happy for my name to appear with it.';

function reviewEscape(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function reviewQueryFields() {
  return `_id, rating, title, body, displayName, location, verifiedPurchase, featured, ownerReply, _createdAt,
    "productName": product->name, "productSlug": product->slug.current`;
}

async function fetchPublishedReviews({ slug = null, limit = 50 } = {}) {
  const cfg = window.SLD_SANITY_CONFIG;
  if (!cfg || !cfg.projectId) return [];
  const published = '_type == "review" && !(_id in path("drafts.**"))';
  const query = slug
    ? `*[${published} && product->slug.current == $slug] | order(_createdAt desc)[0...${limit}]{${reviewQueryFields()}}`
    : `*[${published}] | order(featured desc, _createdAt desc)[0...${limit}]{${reviewQueryFields()}}`;
  let url = `https://${cfg.projectId}.api.sanity.io/v${cfg.apiVersion}/data/query/${cfg.dataset}?query=${encodeURIComponent(query)}`;
  if (slug) url += `&$slug=${encodeURIComponent(JSON.stringify(slug))}`;
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return [];
    const payload = await res.json();
    return Array.isArray(payload.result) ? payload.result : [];
  } catch (err) {
    return [];
  }
}

function summariseReviews(reviews) {
  const rated = (reviews || []).filter((r) => Number.isInteger(r.rating) && r.rating >= 1 && r.rating <= 5);
  if (!rated.length) return { count: 0, average: 0 };
  const total = rated.reduce((sum, r) => sum + r.rating, 0);
  return { count: rated.length, average: Math.round((total / rated.length) * 10) / 10 };
}

function reviewStarsHtml(rating) {
  const n = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  return `<span class="stars" role="img" aria-label="${n} out of 5 stars">${'★'.repeat(n)}<span class="stars__off">${'★'.repeat(5 - n)}</span></span>`;
}

function reviewDateLabel(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

function reviewCardHtml(r, { showProduct = false } = {}) {
  const who = [reviewEscape(r.displayName), r.location ? reviewEscape(r.location) : ''].filter(Boolean).join(', ');
  const date = reviewDateLabel(r._createdAt);
  return `<article class="review-card">
    <div class="review-card__top">${reviewStarsHtml(r.rating)}${r.verifiedPurchase ? '<span class="review-card__verified">Verified purchase</span>' : ''}</div>
    ${r.title ? `<h3 class="review-card__title">${reviewEscape(r.title)}</h3>` : ''}
    <p class="review-card__body">${reviewEscape(r.body)}</p>
    <div class="review-card__by">${who}${date ? ` <span>· ${reviewEscape(date)}</span>` : ''}</div>
    ${showProduct && r.productName ? `<a class="review-card__product" href="/product.html?slug=${encodeURIComponent(r.productSlug || '')}">${reviewEscape(r.productName)}</a>` : ''}
    ${r.ownerReply ? `<div class="review-card__reply"><strong>Reply from SheLoveDiamonds</strong><p>${reviewEscape(r.ownerReply)}</p></div>` : ''}
  </article>`;
}

// Adds star ratings to a product's structured data ONLY when real published reviews exist.
function productJsonLdWithReviews(data, reviews) {
  const { count, average } = summariseReviews(reviews);
  if (!count) return data;
  return Object.assign({}, data, {
    aggregateRating: { '@type': 'AggregateRating', ratingValue: average, reviewCount: count, bestRating: 5, worstRating: 1 },
    review: reviews.slice(0, 5).map((r) => ({
      '@type': 'Review',
      reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5, worstRating: 1 },
      author: { '@type': 'Person', name: r.displayName },
      datePublished: String(r._createdAt || '').slice(0, 10) || undefined,
      name: r.title || undefined,
      reviewBody: r.body,
    })),
  });
}

async function submitReview(payload) {
  const res = await fetch('/api/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  let data = {};
  try {
    data = await res.json();
  } catch (err) {
    /* ignore */
  }
  if (!res.ok) throw new Error(data.error || "We couldn't send your review. Please try again.");
  return data;
}
