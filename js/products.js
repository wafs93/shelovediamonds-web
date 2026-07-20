/* ============================================
  SHELOVEDIAMONDS — PRODUCTS DATA
  Uses Sanity as primary source with local fallback
  ============================================ */

const SLD_PRODUCTS_FALLBACK = [
  {
    id: "abayo-infinity",
    name: "Abayo Infinity Bracelet",
    slug: "abayo-infinity-bracelet",
    category: "Bracelets",
    badge: "Bestseller",
    price: 179,
    shortDesc: "Pavé lab-grown diamonds. Infinity symbol. 18K gold plated sterling silver.",
    fullDesc: `The Abayo Infinity Bracelet is a celebration of eternal love and feminine strength. 
    Handcrafted from 18K gold plated sterling silver, each piece features a pavé setting of 
    lab-grown diamonds arranged in the infinity symbol — a reminder that she is limitless.
    
    Available in Rose Gold, White Gold, and Yellow Gold. Each bracelet arrives in our signature 
    SheLoveDiamonds gift box, ready to be worn or gifted.`,
    variants: ["Rose Gold", "White Gold", "Yellow Gold"],
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
    shipping: "Free UK shipping. Worldwide delivery available.",
    inStock: true,
    stripeLink: "https://buy.stripe.com/14A28t7849m92hX3secEw00",
  },
  {
    id: "abayo-rainbow",
    name: "Abayo Infinity Rainbow Bracelet",
    slug: "abayo-infinity-rainbow-bracelet",
    category: "Bracelets",
    badge: "New",
    price: 120,
    shortDesc: "Multicolour Moissanite rainbow infinity. Rose, White, or Yellow gold.",
    fullDesc: `A vibrant celebration of colour and light. The Abayo Infinity Rainbow Bracelet 
    features multicolour Moissanite stones set in the iconic infinity symbol — each stone 
    catching the light differently, creating a rainbow effect that turns heads.
    
    Crafted from sterling silver in your choice of gold finish. The perfect statement piece 
    for the woman who refuses to be ordinary.`,
    variants: ["Rose Gold", "White Gold", "Yellow Gold"],
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
    shipping: "Free UK shipping. Worldwide delivery available.",
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
    shipping: "Free UK shipping. Worldwide delivery available.",
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
    mainImage: "images/cufflinks-yellow.png",
    images: ["images/cufflinks-yellow.png", "images/cufflinks-rose.png", "images/cufflinks-white.png"],
    details: [
      "Stainless steel plated in gold",
      "High-quality lab-grown diamonds in full pavé setting",
      "Round face with customizable initial",
      "Polished gold plating",
      "Gift box included"
    ],
    shipping: "Free UK shipping. Worldwide delivery available.",
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
    price: 0,
    shortDesc: "Gold plated stainless steel with multicoloured Moissanite. Iconic infinity symbol stud earrings.",
    fullDesc: "Add a burst of vibrant color and timeless symbolism to your look. These stunning stud earrings feature the iconic infinity symbol fully pavé-set with a dazzling spectrum of multicolored Moissanite stones, creating a joyful rainbow effect that sparkles from every angle.",
    variants: ["Rose Gold"],
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
    shipping: "Free UK shipping. Worldwide delivery available.",
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

function formatPrice(price) {
  return '£' + Number(price).toLocaleString('en-GB', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}