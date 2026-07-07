/* ============================================
   SHELOVEDIAMONDS — NAV + FOOTER INJECTION
   Call injectNav('page') and injectFooter()
   on every page
   ============================================ */

const SLD_CONFIG = {
  whatsapp: '447438451109',
  whatsappMsg: "Hi SheLoveDiamonds! I'd love to find out more about your pieces.",
  instagram: 'https://instagram.com/shelovediamonds',
  email: 'info@shelovediamonds.co.uk',
};

let navInjected = false;
let footerInjected = false;

function runWhenDomReady(callback) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback, { once: true });
  } else {
    callback();
  }
}

/* ── NAV ── */
function injectNav(activePage = '') {
  runWhenDomReady(() => {
    if (navInjected) {
      const existingNav = document.getElementById('main-nav');
      if (existingNav) existingNav.remove();
    }

    const pages = [
      { id: 'home',      label: 'Home',      href: '/index.html' },
      { id: 'shop',      label: 'Shop',      href: '/shop.html' },
      { id: 'story',     label: 'Our Story', href: '/our-story.html' },
      { id: 'contact',   label: 'Contact',   href: '/contact.html' },
    ];

    const links = pages.map(p => `
      <li>
        <a href="${p.href}" class="${activePage === p.id ? 'active' : ''}">
          ${p.label}
        </a>
      </li>
    `).join('');

    const nav = document.createElement('nav');
    nav.className = 'nav';
    nav.id = 'main-nav';
    nav.innerHTML = `
      <a href="/index.html" class="nav__logo">
        <img src="/images/Shelove_Diamond.png" alt="SheLoveDiamonds"
             onerror="this.style.display='none'; this.nextElementSibling.style.display='block'">
        <span class="nav__logo-text" style="display:none">SheLoveDiamonds</span>
      </a>

      <ul class="nav__links">
        ${links}
      </ul>

      <div class="nav__actions">
        <a href="/cart.html" class="nav__cart" id="nav-cart">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="1.5">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 01-8 0"/>
          </svg>
          <span id="cart-label">Bag</span>
          <span class="nav__cart-count" id="cart-count" style="display:none">0</span>
        </a>
        <a href="/shop.html" class="nav__cta">Shop Now</a>
        <button class="nav__hamburger" id="hamburger" aria-label="Menu">
          <span></span><span></span><span></span>
        </button>
      </div>

      <div class="nav__mobile" id="mobile-menu">
        <ul>
          ${links}
          <li><a href="/shop.html" class="btn btn-dark" style="margin-top:16px;display:inline-flex">Shop Now</a></li>
        </ul>
      </div>
    `;

    document.body.prepend(nav);
    document.body.style.paddingTop = 'var(--nav-height)';

    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 40);
    });

    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobile-menu');
    if (hamburger && mobileMenu) {
      hamburger.addEventListener('click', () => {
        mobileMenu.classList.toggle('open');
        hamburger.classList.toggle('open');
      });
    }

    updateCartCount();
    navInjected = true;
  });
}

/* ── FOOTER ── */
function injectFooter() {
  runWhenDomReady(() => {
    if (footerInjected) {
      const existingFooter = document.querySelector('footer.footer');
      if (existingFooter) existingFooter.remove();
      const existingWa = document.querySelector('.wa-float');
      if (existingWa) existingWa.remove();
      const existingToast = document.getElementById('toast');
      if (existingToast) existingToast.remove();
    }

    const footer = document.createElement('footer');
    footer.className = 'footer';
    footer.innerHTML = `
      <div class="footer__grid">
        <div class="footer__brand">
          <img src="/images/Shelove_Diamond.png" alt="SheLoveDiamonds"
               class="footer__brand-logo"
               onerror="this.style.display='none'">
          <div class="footer__brand-name">SheLoveDiamonds</div>
          <p class="footer__brand-desc">
            From the mines of Sierra Leone to the hands of women who know their worth.
            Handcrafted diamond jewellery. Made with intention.
          </p>
          <div class="footer__social">
            <a href="${SLD_CONFIG.instagram}" target="_blank" aria-label="Instagram">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="1.5">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <circle cx="12" cy="12" r="4"/>
                <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/>
              </svg>
            </a>
            <a href="https://wa.me/${SLD_CONFIG.whatsapp}" target="_blank" aria-label="WhatsApp">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </a>
          </div>
        </div>

        <div class="footer__col">
          <div class="footer__col-title">Collections</div>
          <ul>
            <li><a href="/shop.html">All Pieces</a></li>
            <li><a href="/shop.html?cat=Bracelets">Bracelets</a></li>
            <li><a href="/shop.html?cat=Personalised">Personalised</a></li>
            <li><a href="/shop.html?cat=Bangles">Bangles</a></li>
          </ul>
        </div>

        <div class="footer__col">
          <div class="footer__col-title">Company</div>
          <ul>
            <li><a href="/our-story.html">Our Story</a></li>
            <li><a href="/about.html">About Us</a></li>
            <li><a href="/contact.html">Contact</a></li>
          </ul>
        </div>

        <div class="footer__col">
          <div class="footer__col-title">Help</div>
          <ul>
            <li><a href="https://wa.me/${SLD_CONFIG.whatsapp}" target="_blank">WhatsApp Us</a></li>
            <li><a href="mailto:${SLD_CONFIG.email}">Email Us</a></li>
            <li><a href="#">Shipping Info</a></li>
            <li><a href="#">Returns</a></li>
          </ul>
        </div>
      </div>

      <div class="footer__bottom">
        <p class="footer__copy">
          &copy; 2026 <span>SheLoveDiamonds</span>. United Kingdom & Sierra Leone. All rights reserved.
        </p>
        <p class="footer__credit">
          Designed by <a href="https://wafsdesign.com" target="_blank">WafsDesign</a>
        </p>
      </div>
    `;

    document.body.appendChild(footer);

    const wa = document.createElement('a');
    wa.href = `https://wa.me/${SLD_CONFIG.whatsapp}?text=${encodeURIComponent(SLD_CONFIG.whatsappMsg)}`;
    wa.target = '_blank';
    wa.className = 'wa-float';
    wa.setAttribute('aria-label', 'Chat on WhatsApp');
    wa.innerHTML = `
      <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    `;
    document.body.appendChild(wa);

    const toast = document.createElement('div');
    toast.id = 'toast';
    document.body.appendChild(toast);

    footerInjected = true;
  });
}

/* ── CART UTILS ── */
function getCart() {
  try {
    return JSON.parse(localStorage.getItem('sld_cart') || '[]');
  } catch { return []; }
}

function saveCart(cart) {
  localStorage.setItem('sld_cart', JSON.stringify(cart));
  updateCartCount();
}

function addToCart(product, variant, quantity = 1) {
  const cart = getCart();
  const key = `${product.id}-${variant}`;
  const existing = cart.find(i => i.key === key);

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({
      key,
      id: product.id,
      name: product.name,
      variant,
      price: product.price,
      image: product.mainImage,
      quantity,
    });
  }

  saveCart(cart);
  showToast(`${product.name} added to bag`);
}

function updateCartCount() {
  const cart = getCart();
  const total = cart.reduce((sum, i) => sum + i.quantity, 0);
  const countEl = document.getElementById('cart-count');
  if (countEl) {
    if (total > 0) {
      countEl.textContent = total;
      countEl.style.display = 'flex';
    } else {
      countEl.style.display = 'none';
    }
  }
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

/* Mobile nav styles — injected */
const mobileStyles = document.createElement('style');
mobileStyles.textContent = `
  .nav__mobile {
    display: none;
    position: fixed;
    top: var(--nav-height);
    left: 0;
    right: 0;
    background: var(--cream);
    border-bottom: 1px solid var(--border-soft);
    padding: 32px var(--section-pad);
    z-index: 999;
    box-shadow: 0 8px 32px rgba(44,36,32,0.08);
  }
  .nav__mobile.open { display: block; }
  .nav__mobile ul {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  .nav__mobile ul li a {
    font-size: 0.75rem;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: var(--text-mid);
    display: block;
    padding: 4px 0;
  }
  .nav__mobile ul li a.active,
  .nav__mobile ul li a:hover { color: var(--charcoal); }
  .nav__hamburger.open span:nth-child(1) {
    transform: rotate(45deg) translate(4px, 4px);
  }
  .nav__hamburger.open span:nth-child(2) { opacity: 0; }
  .nav__hamburger.open span:nth-child(3) {
    transform: rotate(-45deg) translate(4px, -4px);
  }
`;
document.head.appendChild(mobileStyles);