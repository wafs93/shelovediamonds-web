/* ============================================
   SHELOVEDIAMONDS — CART
   Handles cart state via localStorage
   ============================================ */

/* Cart is managed in nav.js (getCart, saveCart, addToCart, updateCartCount)
   This file adds the cart page rendering and checkout helpers */

function renderCartPage(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const cart = getCart();

  if (cart.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:80px 20px">
        <p style="font-family:var(--font-serif);font-size:1.5rem;color:var(--text-mid);font-style:italic;margin-bottom:24px">
          Your bag is empty.
        </p>
        <a href="/shop.html" class="btn btn-dark" style="display:inline-flex">
          Continue Shopping
        </a>
      </div>`;
    return;
  }

  const subtotal = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);

  container.innerHTML = `
    <div class="cart-layout">
      <div class="cart-items">
        <div class="cart-header">
          <span>Item</span>
          <span>Price</span>
          <span>Qty</span>
          <span>Total</span>
          <span></span>
        </div>
        ${cart.map(item => `
          <div class="cart-item" data-key="${item.key}">
            <div class="cart-item__info">
              <img src="${item.image}" alt="${item.name}"
                   onerror="this.style.display='none'">
              <div>
                <div class="cart-item__name">${item.name}</div>
                <div class="cart-item__variant">${item.variant}</div>
              </div>
            </div>
            <div class="cart-item__price">${formatPrice(item.price)}</div>
            <div class="cart-item__qty">
              <button onclick="changeQty('${item.key}', -1)">−</button>
              <span>${item.quantity}</span>
              <button onclick="changeQty('${item.key}', 1)">+</button>
            </div>
            <div class="cart-item__total">${formatPrice(item.price * item.quantity)}</div>
            <button class="cart-item__remove" onclick="removeItem('${item.key}')">×</button>
          </div>
        `).join('')}
      </div>

      <div class="cart-summary">
        <div class="cart-summary__title">Order Summary</div>
        <div class="cart-summary__row">
          <span>Subtotal</span>
          <span>${formatPrice(subtotal)}</span>
        </div>
        <div class="cart-summary__row">
          <span>Shipping</span>
          <span style="color:var(--gold)">Free</span>
        </div>
        <div class="cart-summary__row cart-summary__total">
          <span>Total</span>
          <span>${formatPrice(subtotal)}</span>
        </div>
        <a href="/checkout.html" class="btn btn-dark" style="width:100%;justify-content:center;margin-top:24px">
          Proceed to Checkout
        </a>
        <a href="/shop.html" class="btn btn-outline" style="width:100%;justify-content:center;margin-top:12px">
          Continue Shopping
        </a>
        <div class="cart-summary__note">
          Free UK shipping on all orders. Worldwide delivery available.
        </div>
      </div>
    </div>`;
}

function changeQty(key, delta) {
  const cart = getCart();
  const item = cart.find(i => i.key === key);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) {
    const idx = cart.indexOf(item);
    cart.splice(idx, 1);
  }
  saveCart(cart);
  renderCartPage('cart-container');
}

function removeItem(key) {
  const cart = getCart().filter(i => i.key !== key);
  saveCart(cart);
  renderCartPage('cart-container');
}

const cartStyles = document.createElement('style');
cartStyles.textContent = `
  .cart-layout {
    display: grid;
    grid-template-columns: 1fr 340px;
    gap: 48px;
    align-items: start;
  }
  .cart-header {
    display: grid;
    grid-template-columns: 3fr 1fr 1fr 1fr 32px;
    gap: 16px;
    padding: 12px 0;
    border-bottom: 1px solid var(--border-soft);
    font-size: 0.58rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--text-dim);
  }
  .cart-item {
    display: grid;
    grid-template-columns: 3fr 1fr 1fr 1fr 32px;
    gap: 16px;
    align-items: center;
    padding: 24px 0;
    border-bottom: 1px solid var(--border-soft);
  }
  .cart-item__info {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .cart-item__info img {
    width: 72px;
    height: 72px;
    object-fit: contain;
    background: var(--white);
    border: 1px solid var(--border-soft);
    padding: 8px;
    flex-shrink: 0;
  }
  .cart-item__name {
    font-family: var(--font-serif);
    font-size: 0.95rem;
    color: var(--charcoal);
    margin-bottom: 4px;
  }
  .cart-item__variant {
    font-size: 0.68rem;
    color: var(--text-dim);
    letter-spacing: 0.05em;
  }
  .cart-item__price,
  .cart-item__total {
    font-size: 0.85rem;
    color: var(--charcoal);
  }
  .cart-item__qty {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .cart-item__qty button {
    width: 28px;
    height: 28px;
    border: 1px solid var(--border-soft);
    background: transparent;
    font-size: 1rem;
    color: var(--charcoal);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }
  .cart-item__qty button:hover { background: var(--charcoal); color: var(--cream); }
  .cart-item__qty span { font-size: 0.85rem; color: var(--charcoal); min-width: 16px; text-align: center; }
  .cart-item__remove {
    font-size: 1.2rem;
    color: var(--text-dim);
    cursor: pointer;
    background: none;
    border: none;
    transition: color 0.2s;
    line-height: 1;
  }
  .cart-item__remove:hover { color: var(--charcoal); }
  .cart-summary {
    background: var(--white);
    border: 1px solid var(--border-soft);
    padding: 32px;
    position: sticky;
    top: calc(var(--nav-height) + 24px);
  }
  .cart-summary__title {
    font-family: var(--font-serif);
    font-size: 1.2rem;
    color: var(--charcoal);
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--border-soft);
  }
  .cart-summary__row {
    display: flex;
    justify-content: space-between;
    font-size: 0.82rem;
    color: var(--text-mid);
    padding: 10px 0;
    border-bottom: 1px solid var(--border-soft);
  }
  .cart-summary__total {
    font-family: var(--font-serif);
    font-size: 1.1rem;
    color: var(--charcoal);
    border-bottom: none;
    margin-top: 8px;
    padding-top: 16px;
  }
  .cart-summary__note {
    font-size: 0.65rem;
    color: var(--text-dim);
    text-align: center;
    margin-top: 16px;
    line-height: 1.6;
  }
  @media (max-width: 1024px) {
    .cart-layout { grid-template-columns: 1fr; }
    .cart-summary { position: static; }
  }
  @media (max-width: 768px) {
    .cart-header { display: none; }
    .cart-item { grid-template-columns: 1fr; gap: 12px; }
  }
`;
document.head.appendChild(cartStyles);
