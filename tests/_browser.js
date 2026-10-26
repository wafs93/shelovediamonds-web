// Loads the storefront's browser scripts (js/products.js, js/nav.js, js/cart.js)
// into a sandbox with just enough DOM/localStorage to exercise their logic.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadStorefront({ files = ['products.js', 'nav.js', 'cart.js'], cart = [] } = {}) {
  const store = new Map([['sld_cart', JSON.stringify(cart)]]);
  const toasts = [];
  const elements = {};
  const stubEl = () => ({ style: {}, classList: { add() {}, remove() {}, toggle() {} }, appendChild() {} });

  const context = {
    console,
    URL,
    setTimeout: () => 0,
    window: { location: { href: 'https://www.shelovediamonds.co.uk/product.html' } },
    localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
    },
    document: {
      readyState: 'complete',
      head: { appendChild() {} },
      createElement: stubEl,
      getElementById: (id) => {
        if (id === 'toast') {
          return { set textContent(v) { toasts.push(v); }, classList: { add() {}, remove() {} } };
        }
        return elements[id] || null;
      },
      addEventListener() {},
    },
  };
  vm.createContext(context);
  for (const file of files) {
    const code = fs.readFileSync(path.join(__dirname, '..', 'js', file), 'utf8');
    vm.runInContext(code, context, { filename: file });
  }

  return {
    context,
    toasts,
    elements,
    // Top-level const/let/function declarations are reachable by name in the context
    get: (expr) => vm.runInContext(expr, context),
    savedCart: () => JSON.parse(store.get('sld_cart') || '[]'),
  };
}

module.exports = { loadStorefront };
