const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');
const { loadStorefront } = require('./_browser');

const ROOT = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');

// Every tracked text file the site, dashboard, API or Studio is built from
const siteFiles = execSync('git ls-files', { cwd: ROOT, encoding: 'utf8' })
  .split('\n')
  .filter((f) => /\.(html|js|mjs|ts|json|txt)$/.test(f))
  .filter((f) => !f.startsWith('tests/') && !f.endsWith('package-lock.json'));

test('the site-wide delivery line is defined once, in js/products.js', () => {
  const { get } = loadStorefront({ files: ['products.js'] });
  assert.equal(get('SLD_DELIVERY.uk'), 'Free UK standard delivery');
  assert.equal(get('SLD_DELIVERY.worldwide'), 'Worldwide delivery available');
  assert.equal(get('SLD_DELIVERY_LINE'), 'Free UK standard delivery · Worldwide delivery available');

  const definitions = siteFiles.filter((f) => /const SLD_DELIVERY\b/.test(read(f)));
  assert.deepEqual(definitions, ['js/products.js']);
});

test('no £100 threshold, Parcelforce or "free UK shipping" wording is left anywhere', () => {
  for (const file of siteFiles) {
    const text = read(file);
    assert.doesNotMatch(text, /(£|&pound;)\s?100\b/i, `${file} mentions £100`);
    assert.doesNotMatch(text, /parcel\s?force/i, `${file} mentions Parcelforce`);
    assert.doesNotMatch(text, /free (uk )?shipping/i, `${file} says free shipping`);
    assert.doesNotMatch(text, /(orders|spend) over/i, `${file} mentions a spend threshold`);
  }
});

test('every product page shows the shared delivery line, not a per-product shipping field', () => {
  const html = read('product.html');
  assert.match(html, /<div class="product-info__shipping" id="product-delivery"><\/div>/);
  assert.match(html, /getElementById\('product-delivery'\)\.textContent = `✓ \$\{SLD_DELIVERY_LINE\}`/);
  assert.doesNotMatch(html, /product\.shipping/);

  const { get } = loadStorefront({ files: ['products.js'] });
  for (const p of get('SLD_PRODUCTS_FALLBACK')) {
    assert.equal('shipping' in p, false, `${p.id} still carries a shipping field`);
  }
});

test('the per-product shipping field is optional in the Sanity schema', () => {
  const schema = read('sanity-studio/schemaTypes/productType.ts');
  const field = schema.slice(schema.indexOf("name: 'shipping'"), schema.indexOf("name: 'inStock'"));
  assert.ok(field.length > 0);
  assert.doesNotMatch(field, /validation/);
});

test('SEO descriptions say free UK standard delivery and stay within 160 characters', () => {
  const { get } = loadStorefront({ files: ['products.js'] });
  const describe = get('productSeoDescription');
  for (const p of get('SLD_PRODUCTS_FALLBACK')) {
    assert.ok(describe(p).length <= 160, p.id);
  }
  assert.match(describe({ name: 'Ring', shortDesc: 'Short.' }), /free UK standard delivery/);

  for (const file of ['index.html', 'shop.html', 'product.html', 'cart.html', 'checkout.html']) {
    const metas = [...read(file).matchAll(/<meta (?:name="description"|property="og:description") content="([^"]*)"/g)];
    assert.equal(metas.length, 2, file);
    for (const [, content] of metas) {
      assert.match(content, /free UK standard delivery/, file);
      assert.ok(content.length <= 160, `${file}: ${content.length} characters`);
    }
  }
});

test('checkout: UK standard delivery is free with no threshold, international has no invented rate', () => {
  const html = read('checkout.html');
  assert.match(html, /Free UK standard delivery \(3-5 days\)<\/span>\s*<span class="shipping-option__meta">Free<\/span>/);
  assert.match(html, /standard: 0,/);
  assert.match(html, /international: null/);
  assert.match(html, /Worldwide delivery available<\/span>\s*<span class="shipping-option__meta">Contact us<\/span>/);
  assert.doesNotMatch(html, /subtotal\s*[<>]=?\s*\d/, 'no subtotal-based delivery threshold');
});

test('the WhatsApp order message names the delivery the shopper picked', () => {
  const html = read('checkout.html');
  assert.match(html, /\\nDelivery: \$\{shippingLabel\}\\n/);
  assert.match(html, /selectedMethod === 'standard' \? SLD_DELIVERY\.uk/);
  assert.match(html, /\$\{SLD_DELIVERY\.worldwide\} \(to be confirmed\)/);
});

test('both AI brand prompts state free UK standard delivery and forbid inventing rates', () => {
  const line = 'Delivery: free UK standard delivery on every order, with no minimum spend. Worldwide delivery is available. Never quote a delivery price, minimum spend or courier, and never invent an international rate.';
  assert.ok(read('dashboard.html').includes(line));
  assert.ok(read('api/auto-post.js').includes(line));
});

test('checkout offers only free UK standard and worldwide delivery; hidden options can never be charged', () => {
  const html = read('checkout.html');
  const liveMarkup = html.replace(/<!--[\s\S]*?-->/g, '');
  const methods = [...liveMarkup.matchAll(/name="shippingMethod" value="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(methods, ['standard', 'international']);
  assert.match(html, /<!-- HIDDEN: Express and Same Day delivery are hidden until Morayo confirms/);
  assert.doesNotMatch(liveMarkup, /£4\.99|£15\.99/);

  const rates = html.match(/const shippingRates = \{([\s\S]*?)\};/)[1].replace(/\/\/.*$/gm, '');
  assert.doesNotMatch(rates, /express|same-day/, 'hidden options must not have a live rate');
  assert.match(html, /hasOwnProperty\.call\(shippingRates, input\.value\) \? input\.value : 'standard'/);
  assert.equal((html.match(/shippingRates\[selectedDeliveryMethod\(\)\]/g) || []).length, 1);
  assert.doesNotMatch(html, /shippingRates\[selectedShipping/);
});

test('footer "Delivery Info" goes to a delivery section with no international price', () => {
  assert.match(read('js/nav.js'), /<a href="\/contact\.html#delivery">Delivery Info<\/a>/);
  const contact = read('contact.html');
  const section = contact.slice(contact.indexOf('id="delivery"'), contact.indexOf('<!-- Form -->'));
  assert.match(section, /Free UK standard delivery on every order/);
  assert.match(section, /Worldwide delivery available\. Ask us for details\./);
  assert.doesNotMatch(section, /£|\$|€/);
});
