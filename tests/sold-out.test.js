const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadStorefront } = require('./_browser');

const read = (file) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

const priced = { id: 'a', name: 'Priced', price: 120, inStock: true, badge: 'New', mainImage: 'a.png' };

test('a product is sold out when its price is missing, zero or not a number, or In Stock is off', () => {
  const { get } = loadStorefront({ files: ['products.js'] });
  const isSoldOut = get('isProductSoldOut');

  assert.equal(isSoldOut(priced), false);
  assert.equal(isSoldOut({ ...priced, price: '179' }), false);
  for (const price of [undefined, null, 0, -5, NaN, '', 'abc', true]) {
    assert.equal(isSoldOut({ ...priced, price }), true, `price ${String(price)} should be sold out`);
  }
  assert.equal(isSoldOut({ ...priced, inStock: false }), true);
  assert.equal(isSoldOut({ ...priced, inStock: undefined }), false, 'only an explicit false means out of stock');
});

test('grid badge and price: "Sold out" replaces the badge and no price (never £0) is shown', () => {
  const { get } = loadStorefront({ files: ['products.js'] });
  const badge = get('productBadge');
  const price = get('productPriceLabel');

  assert.equal(badge(priced), 'New');
  assert.equal(price(priced), '£120');
  assert.equal(badge({ ...priced, price: 0, badge: 'Bestseller' }), 'Sold out');
  assert.equal(price({ ...priced, price: 0 }), '');
  assert.equal(price({ ...priced, price: null }), '');
  assert.equal(badge({ ...priced, inStock: false }), 'Sold out');
  assert.equal(price({ ...priced, inStock: false }), '');
});

test('sorting by price works in both directions and always puts sold out pieces last', () => {
  const { get } = loadStorefront({ files: ['products.js'] });
  const sort = get('sortProductsByPrice');
  const list = [
    { id: 'none', price: null },
    { id: 'mid', price: 150 },
    { id: 'zero', price: 0 },
    { id: 'low', price: 90 },
    { id: 'off', price: 50, inStock: false },
    { id: 'high', price: 300 },
  ];

  const asc = sort(list, 'asc').map((p) => p.id);
  const desc = sort(list, 'desc').map((p) => p.id);
  assert.deepEqual(asc.slice(0, 3), ['low', 'mid', 'high']);
  assert.deepEqual(desc.slice(0, 3), ['high', 'mid', 'low']);
  assert.deepEqual(new Set(asc.slice(3)), new Set(['none', 'zero', 'off']));
  assert.deepEqual(new Set(desc.slice(3)), new Set(['none', 'zero', 'off']));
  assert.equal(list[0].id, 'none', 'the input list is not mutated');
});

test('structured data: OutOfStock with no price for sold out, InStock with GBP price otherwise', () => {
  const { get } = loadStorefront({ files: ['products.js'] });
  const jsonLd = get('productJsonLd');

  const inStock = jsonLd(priced, 'https://example.com/p').offers;
  assert.equal(inStock.availability, 'https://schema.org/InStock');
  assert.equal(inStock.price, '120.00');
  assert.equal(inStock.priceCurrency, 'GBP');

  for (const p of [{ ...priced, price: null }, { ...priced, price: 0 }, { ...priced, inStock: false }]) {
    const offer = jsonLd(p, 'https://example.com/p').offers;
    assert.equal(offer.availability, 'https://schema.org/OutOfStock');
    assert.equal('price' in offer, false);
    assert.equal('priceCurrency' in offer, false);
  }
});

test('fallback data follows the rule: the unpriced earrings are sold out, priced pieces are not', () => {
  const { get } = loadStorefront({ files: ['products.js'] });
  const products = get('SLD_PRODUCTS_FALLBACK');
  const isSoldOut = get('isProductSoldOut');

  for (const p of products) {
    assert.equal(isSoldOut(p), !(Number(p.price) > 0) || p.inStock === false, p.id);
    assert.notEqual(p.price, 0, `${p.id}: use null, not 0, for "no price yet"`);
  }
  assert.equal(isSoldOut(products.find((p) => p.id === 'abayo-rainbow-earrings')), true);
});

test('the bag refuses a sold out piece on every route through addToCart', () => {
  const shop = loadStorefront();
  const addToCart = shop.get('addToCart');

  assert.equal(addToCart({ ...priced, price: 0 }, 'Rose Gold'), false);
  assert.equal(addToCart({ ...priced, inStock: false }, 'Rose Gold'), false);
  assert.deepEqual(shop.savedCart(), []);
  assert.match(shop.toasts.at(-1), /sold out/);

  assert.equal(addToCart(priced, 'Rose Gold'), true);
  assert.equal(shop.savedCart().length, 1);
});

test('a sold out piece already in a saved bag is removed, and the shopper is told', () => {
  const shop = loadStorefront({
    cart: [
      // Fallback data: the earrings have no price, so they are sold out
      { key: 'e-Rose', id: 'abayo-rainbow-earrings', name: 'ABAYO Rainbow Infinity Earrings', variant: 'Rose Gold', price: 0, quantity: 1 },
      { key: 'b-Rose', id: 'abayo-infinity', name: 'Abayo Infinity Bangle', variant: 'Rose Gold', price: 179, quantity: 2 },
    ],
  });

  const removed = shop.get('pruneSoldOutFromCart()');
  assert.equal(removed.length, 1);
  assert.deepEqual(shop.savedCart().map((i) => i.id), ['abayo-infinity']);
  assert.match(shop.toasts.at(-1), /ABAYO Rainbow Infinity Earrings is sold out/);

  // A second pass has nothing left to remove
  assert.equal(shop.get('pruneSoldOutFromCart()').length, 0);
});

test('a bag item is pruned when the live product is switched out of stock, even with a saved price', () => {
  const shop = loadStorefront({
    cart: [{ key: 'b-Rose', id: 'abayo-infinity', name: 'Abayo Infinity Bangle', variant: 'Rose Gold', price: 179, quantity: 1 }],
  });
  shop.get(`SLD_PRODUCTS = SLD_PRODUCTS.map(p => p.id === 'abayo-infinity' ? { ...p, inStock: false } : p)`);
  assert.equal(shop.get('pruneSoldOutFromCart()').length, 1);
  assert.deepEqual(shop.savedCart(), []);
});

test('the Sanity mapping keeps a missing price missing, and drops the per-product shipping field', () => {
  const src = read('js/sanity-client.js');
  assert.match(src, /price: item\.price == null \? null : Number\(item\.price\)/);
  assert.doesNotMatch(src, /shipping/);
});

test('product page disables Add to Bag and Buy Now and shows "Sold out" instead of a price', () => {
  const html = read('product.html');
  assert.match(html, /priceEl\.textContent = soldOut \? 'Sold out' : formatPrice\(product\.price\)/);
  assert.match(html, /\['add-to-cart-btn', 'buy-now-btn'\]\.forEach[\s\S]*?btn\.disabled = true/);
  assert.match(html, /if \(soldOut\) return false;/);
});

test('every product grid uses the sold out badge and price helpers', () => {
  for (const file of ['shop.html', 'index.html', 'product.html']) {
    const html = read(file);
    assert.match(html, /productBadge\(p\)/, file);
    assert.match(html, /productPriceLabel\(p\)/, file);
    assert.doesNotMatch(html, /p\.badge \?/, `${file} still renders the raw badge`);
    assert.doesNotMatch(html, /formatPrice(Fn)?\(p\.price\)/, `${file} still formats a raw grid price`);
  }
  assert.match(read('shop.html'), /sortProductsByPrice\(p, 'asc'\)[\s\S]*sortProductsByPrice\(p, 'desc'\)/);
});

test('cart and checkout drop sold out pieces once live product data has loaded', () => {
  const cart = read('cart.html');
  assert.match(cart, /js\/sanity-client\.js/);
  assert.match(cart, /await ensureProductsLoaded\(\);\s*if \(pruneSoldOutFromCart\(\)\.length\)/);
  const checkout = read('checkout.html');
  assert.match(checkout, /await ensureProductsLoaded\(\);\s*pruneSoldOutFromCart\(\);/);
  assert.match(checkout, /if \(pruneSoldOutFromCart\(\)\.length\) \{/, 'checked again when the order is placed');
});

test('Sanity schema: price is optional with the "Leave empty to show Sold out" note', () => {
  const schema = read('sanity-studio/schemaTypes/productType.ts');
  const priceField = schema.slice(schema.indexOf("name: 'price'"), schema.indexOf("name: 'shortDesc'"));
  assert.match(priceField, /description: 'Leave empty to show Sold out'/);
  assert.doesNotMatch(priceField, /required\(\)/);
});
