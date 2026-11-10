const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const section = html.slice(html.indexOf('<section class="lookbook"'), html.indexOf('<!-- BRAND STORY -->'));
const images = [...section.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);

test('the homepage lookbook has images', () => {
  assert.ok(images.length >= 4);
});

test('every lookbook image exists, uses a relative path and has alt text and dimensions', () => {
  for (const tag of images) {
    const src = /src="([^"]+)"/.exec(tag)?.[1];
    assert.ok(src, `missing src in ${tag}`);
    assert.ok(!src.startsWith('/') && !src.startsWith('http'), `${src} must be a relative path without a leading slash`);
    assert.ok(fs.existsSync(path.join(ROOT, src)), `${src} is missing from the repo`);
    assert.ok(/alt="[^"]{20,}"/.test(tag), `${src} needs descriptive alt text`);
    assert.ok(/width="\d+"/.test(tag) && /height="\d+"/.test(tag), `${src} needs width and height`);
    assert.ok(/loading="lazy"/.test(tag), `${src} should load lazily`);
  }
});

test('lookbook copy makes no stone-origin claims', () => {
  assert.ok(!/\b(mined|lab[- ]grown|lab[- ]created|moissanite|ethically)\b/i.test(section));
});

test('the homepage has no invented customer testimonials', () => {
  assert.ok(!/testimonial/i.test(html), 'testimonial markup or styles are back on the homepage');
  assert.ok(!/Adaeze O\.|Sandra M\.|Chiamaka B\./.test(html));
});
