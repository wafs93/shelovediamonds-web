/* ============================================
  SHELOVEDIAMONDS — PRODUCTS DATA
  Uses Sanity as primary source with local fallback
  ============================================ */

/* ── DELIVERY ──
   The one place delivery wording lives. UK standard delivery is free on
   every order, with no minimum spend. No international rate is published. */
const SLD_DELIVERY = {
  uk: 'Free UK standard delivery',
  worldwide: 'Worldwide delivery available',
};
const SLD_DELIVERY_LINE = `${SLD_DELIVERY.uk} · ${SLD_DELIVERY.worldwide}`;

const SLD_PRODUCTS_FALLBACK = [
  {
    id: "abayo-infinity",
    name: "Abayo Infinity Bangle",
    slug: "abayo-infinity-bracelet",
    category: "Bracelets",
    badge: "Bestseller",
    price: 179,
    shortDesc: "Pave lab-grown diamonds. Infinity symbol. 18K gold plated sterling silver.",
    fullDesc: "The Abayo Infinity Bangle is a celebration of eternal love and feminine strength. Handcrafted from 18K gold plated sterling silver, each piece features a pave setting of lab-grown diamonds arranged in the infinity symbol — a reminder that she is limitless. Available in Rose Gold, White Gold, and Yellow Gold. Each bangle arrives in our signature SheLoveDiamonds gift box, ready to be worn or gifted.",
    variants: ["Rose Gold", "White Gold", "Yellow Gold"],
    sizes: [],
    mainImage: "images/abayo-rose.png",
    images: [
      "images/abayo-rose.png",
      "images/abayo-white.png",
      "images/abayo-yellow.png",
    ],
    details: [
      "18K gold plated 925 sterling silver",
      "Pavé lab-grown diamonds",
      "Infinity symbol design",
      "Secure bangle clasp",
      "Available in 3 gold tones",
      "Gift box included",
    ],
    inStock: true,
    stripeLink: "https://buy.stripe.com/14A28t7849m92hX3secEw00",
  },
  {
    id: "abayo-rainbow",
    name: "Abayo Infinity Rainbow Bangle",
    slug: "abayo-infinity-rainbow-bracelet",
    category: "Bracelets",
    badge: "New",
    price: 120,
    shortDesc: "Multicolour Moissanite rainbow infinity. Rose, White, or Yellow gold.",
    fullDesc: "A vibrant celebration of colour and light. The Abayo Infinity Rainbow Bangle features multicolour Moissanite stones set in the iconic infinity symbol — each stone catching the light differently, creating a rainbow effect that turns heads. Crafted from sterling silver in your choice of gold finish. The perfect statement piece for the woman who refuses to be ordinary.",
    variants: ["Rose Gold", "White Gold", "Yellow Gold"],
    sizes: [],
    mainImage: "images/abayo-rainbow-rose.jpeg",
    images: [
      "images/abayo-rainbow-rose.jpeg",
      "images/abayo-rainbow-white.jpeg",
      "images/abayo-rainbow-yellow.jpeg",
    ],
    details: [
      "18K gold plated 925 sterling silver",
      "Multicolour Moissanite stones",
      "Rainbow infinity design",
      "Secure bangle clasp",
      "Available in 3 gold tones",
      "Gift box included",
    ],
    inStock: true,
    stripeLink: "https://buy.stripe.com/28E4gB2RO69X9Kp2oacEw01",
  },
  {
    id: "name-bracelet",
    name: "Personalised Name Bracelet",
    slug: "personalised-name-bracelet",
    category: "Personalised",
    badge: "Personalise",
    price: 195,
    shortDesc: "Your name. Diamond letters. Deep-engraved. Made for her.",
    fullDesc: `The most personal piece in our collection. Your name — or the name of someone 
    you love — set in diamond-encrusted letters on a sleek sterling silver bracelet.
    
    Each piece is made to order. Please include the name you'd like in the order notes 
    at checkout. Allow 5–7 working days for personalised pieces.`,
    variants: ["Rose Gold", "White Gold"],
    sizes: [],
    mainImage: "images/name-bracelet.png",
    images: [
      "images/name-bracelet.png",
    ],
    details: [
      "18K gold plated 925 sterling silver",
      "Diamond-encrusted letter setting",
      "Made to order — your name",
      "Rose Gold or White Gold",
      "Allow 5–7 working days",
      "Gift box included",
    ],
    inStock: true,
    isPersonalised: true,
    stripeLink: "https://buy.stripe.com/5kQkFeAwaqdf4J7IucEw02",
  },
  {
    id: "shelove-cufflinks",
    name: "HeLove Cufflinks",
    slug: "shelove-cufflinks",
    category: "Cufflinks",
    badge: "New",
    price: 179,
    shortDesc: "Luxurious set of two matching cufflinks. Lab-grown diamonds. Yellow Gold, Rose Gold or White Gold.",
    fullDesc: "These cufflinks combine durability, comfort, and timeless elegance. Fully customizable with any initial of your choice — the perfect gift for groomsmen, fathers, husbands, or yourself. Timeless. Personal. Brilliant.",
    variants: ["Yellow Gold", "Rose Gold", "White Gold"],
    sizes: [],
    mainImage: "images/cufflinks-yellow.png",
    images: ["images/cufflinks-yellow.png", "images/cufflinks-rose.png", "images/cufflinks-white.png"],
    details: [
      "Stainless steel plated in gold",
      "High-quality lab-grown diamonds in full pavé setting",
      "Round face with customizable initial",
      "Polished gold plating",
      "Gift box included"
    ],
    inStock: true,
    isPersonalised: true,
    stripeLink: ""
  },
  {
    id: "abayo-rainbow-earrings",
    name: "ABAYO Rainbow Infinity Earrings",
    slug: "abayo-rainbow-earrings",
    category: "Earrings",
    badge: "New",
    price: null, // no price yet, so it shows as Sold out
    shortDesc: "Gold plated stainless steel with multicoloured Moissanite. Iconic infinity symbol stud earrings.",
    fullDesc: "Add a burst of vibrant color and timeless symbolism to your look. These stunning stud earrings feature the iconic infinity symbol fully pavé-set with a dazzling spectrum of multicolored Moissanite stones, creating a joyful rainbow effect that sparkles from every angle.",
    variants: ["Rose Gold"],
    sizes: [],
    mainImage: "images/earrings-rainbow.jpeg",
    images: ["images/earrings-rainbow.jpeg"],
    details: [
      "Stainless steel plated in gold",
      "Multicolored Moissanite in full rainbow pavé setting",
      "Iconic infinity symbol design",
      "Modern stud with secure post backing",
      "Polished gold plating",
      "Gift box included"
    ],
    inStock: true,
    stripeLink: ""
  },
];

let SLD_PRODUCTS = SLD_PRODUCTS_FALLBACK.slice();
let sldProductsLoadPromise = null;

async function ensureProductsLoaded() {
  if (sldProductsLoadPromise) return sldProductsLoadPromise;

  sldProductsLoadPromise = (async function loadProducts() {
    if (typeof fetchSanityProducts !== 'function') {
      return SLD_PRODUCTS;
    }

    const sanityProducts = await fetchSanityProducts();
    if (Array.isArray(sanityProducts) && sanityProducts.length) {
      SLD_PRODUCTS = sanityProducts;
    }

    return SLD_PRODUCTS;
  })();

  return sldProductsLoadPromise;
}

/* ── HELPERS ── */
function getProductBySlug(slug) {
  return SLD_PRODUCTS.find(p => p.slug === slug) || null;
}

function getProductsByCategory(cat) {
  if (!cat || cat === 'all') return SLD_PRODUCTS;
  return SLD_PRODUCTS.filter(p => p.category === cat);
}

/* Sold out = no usable price (missing, zero, not a number) or In Stock off */
function hasValidPrice(p) {
  if (!p || (typeof p.price !== 'number' && typeof p.price !== 'string')) return false;
  const price = Number(p.price);
  return p.price !== '' && Number.isFinite(price) && price > 0;
}

function isProductSoldOut(p) {
  return !hasValidPrice(p) || p.inStock === false;
}

/* Lets api/auto-post.js reuse the same sold out rule on the server */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { hasValidPrice, isProductSoldOut };
}

/* Grid badge: "Sold out" replaces New / Bestseller etc. */
function productBadge(p) {
  return isProductSoldOut(p) ? 'Sold out' : (p.badge || '');
}

/* Price text for cards and the product page; empty when sold out (never £0) */
function productPriceLabel(p) {
  return isProductSoldOut(p) ? '' : formatPrice(p.price);
}

/* Sort by price (direction 'asc' | 'desc'); sold out pieces always go last */
function sortProductsByPrice(products, direction = 'asc') {
  const sign = direction === 'desc' ? -1 : 1;
  return products.slice().sort((a, b) => {
    const aOut = isProductSoldOut(a);
    const bOut = isProductSoldOut(b);
    if (aOut || bOut) return aOut === bOut ? 0 : aOut ? 1 : -1;
    return sign * (Number(a.price) - Number(b.price));
  });
}

function formatPrice(price) {
  return '£' + Number(price).toLocaleString('en-GB', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}
/* ── SEO HELPERS ── */
function escapeAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function productText(p) {
  return [p.name, p.shortDesc, p.fullDesc].concat(p.details || []).join(' ');
}

/* "Diamond" / "Moissanite" — taken from the product's own copy, never assumed */
function productMaterial(p) {
  const text = productText(p);
  if (/moissanite/i.test(text)) return 'Moissanite';
  if (/diamond/i.test(text)) return 'Diamond';
  return '';
}

function productNoun(p) {
  if (/bangle/i.test(productText(p)) && p.category === 'Bracelets') return 'Bangle';
  return { Bracelets: 'Bracelet', Personalised: 'Bracelet', Cufflinks: 'Cufflinks', Earrings: 'Earrings' }[p.category] || 'Jewellery';
}

/* Alt text for image `index` (images[i] shows variants[i], matching product.html) */
function productImageAlt(p, index = 0) {
  const variant = p.variants && p.variants[index] && p.variants[index] !== 'Default' ? p.variants[index] : '';
  const sentences = (p.shortDesc || '').split('.').map(s => s.trim()).filter(Boolean);
  const summary = [];
  for (const s of sentences) {
    summary.push(s.charAt(0).toLowerCase() + s.slice(1));
    if (summary.join(', ').length >= 25) break;
  }
  let alt = variant ? `${p.name} in ${variant}` : p.name;
  if (summary.length) alt += ` – ${summary.join(', ')}`;
  return alt;
}

function productSeoTitle(p) {
  const brand = ' | SheLoveDiamonds';
  const descriptor = `${productMaterial(p)} ${productNoun(p)}`.trim();
  const candidates = [
    `${p.name} – ${descriptor} UK${brand}`,
    `${p.name} – ${descriptor}${brand}`,
  ];
  return candidates.find(t => t.length <= 60) || `${p.name}${brand}`;
}

function productSeoDescription(p) {
  const base = `${p.name}: ${p.shortDesc}`.replace(/\s+/g, ' ').trim();
  const candidates = [
    `${base} Gift-boxed, with free UK standard delivery from SheLoveDiamonds.`,
    `${base} Free UK standard delivery.`,
    base,
  ];
  const desc = candidates.find(d => d.length <= 160);
  return desc || base.slice(0, 157).replace(/\s+\S*$/, '') + '…';
}

function productJsonLd(p, pageUrl) {
  const images = (p.images || [p.mainImage])
    .filter(Boolean)
    .map(src => new URL(src, window.location.href).href);
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    image: images,
    description: (p.fullDesc || p.shortDesc || '').replace(/\s+/g, ' ').trim(),
    sku: p.id,
    category: p.category,
    brand: { '@type': 'Brand', name: 'SheLoveDiamonds' },
  };
  // Sold out: no price in the Offer (a £0 price would be wrong), just availability
  const offer = {
    '@type': 'Offer',
    url: pageUrl,
    availability: 'https://schema.org/InStock',
    itemCondition: 'https://schema.org/NewCondition',
  };
  if (isProductSoldOut(p)) {
    offer.availability = 'https://schema.org/OutOfStock';
  } else {
    offer.priceCurrency = 'GBP';
    offer.price = Number(p.price).toFixed(2);
  }
  data.offers = offer;
  return data;
}
