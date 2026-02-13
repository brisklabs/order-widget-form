// widget.js
(function () {
  if (window.brisklabsOrderWidgetLoaded) return;
  window.brisklabsOrderWidgetLoaded = true;

  const script = document.currentScript ||
    Array.from(document.scripts).find(s => s.src.includes('widget.js'));

  if (!script) {
    console.error('Widget script tag not found');
    return;
  }

  // ─── Config ───────────────────────────────────────
  const config = {
    title: script.dataset.title || 'Quick Order',
    submitUrl: script.dataset.submitUrl || 'https://your-api.com/api/order',
    currency: script.dataset.currency || '₱',
    position: script.dataset.position || 'bottom-right',
    buttonText: script.dataset.buttonText || '🛒',
    buttonColor: script.dataset.buttonColor || '#2563eb',
    defaultView: script.dataset.view === 'card' ? 'grid' : 'list',
    orderNote: script.dataset.orderNote || null,  
    customTrigger: script.dataset.customTrigger || null,
    products: []
  };

  try {
    config.products = JSON.parse(script.dataset.products || '[]');
    if (!Array.isArray(config.products)) config.products = [];
  } catch (e) {
    console.error('Invalid products JSON', e);
    config.products = [{ id: 'error', name: 'Contact us', price: 0 }];
  }

  // ─── Widget + Shadow DOM ──────────────────────────
  const widget = document.createElement('div');
  widget.id = 'orw-brisklabs-order-widget';
  const shadow = widget.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = `
    :host {
      font-family: system-ui, sans-serif;
      --primary: ${config.buttonColor};
      --primary-dark: color-mix(in srgb, ${config.buttonColor} 80%, black);
      --success: #10b981;
      --danger: #ef4444;
      --bg: white;
      --text: #1f2937;
      --border: #e5e7eb;
      --shadow: 0 8px 24px rgba(0,0,0,0.18);
      --font-base: 16px;
    }

    .orw-fab-container {
      position: fixed;
      z-index: 999998;
      bottom: 24px;
      right: 24px;
      display: inline-block;
      pointer-events: none;
    }

    .orw-fab {
      pointer-events: auto;
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: var(--primary);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.6em;
      font-weight: bold;
      cursor: pointer;
      box-shadow: var(--shadow);
      transition: transform 0.2s;
    }
    .orw-fab:hover { transform: scale(1.08); }

    .orw-cart-badge {
      position: absolute; top: -6px; right: -6px;
      background: #ef4444; color: white;
      font-size: 11px; font-weight: bold;
      min-width: 18px; height: 18px;
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
      padding: 0 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      transform: scale(0.95);
    }

    .orw-panel {
      position: fixed;
      z-index: 999999;
      background: var(--bg);
      border-radius: 16px;
      box-shadow: var(--shadow);
      width: 400px;
      max-width: 90vw;
      max-height: 85vh;
      overflow-y: auto;
      padding: 16px;
      color: var(--text);
      display: none;
      transition: opacity 0.3s ease, transform 0.3s ease;
      opacity: 0;
      transform: translateY(20px);
      font-size: var(--font-base);
    }

    .orw-panel.open {
      display: block;
      opacity: 1;
      transform: translateY(0);
      bottom: 65px;
    }

    /* Position overrides */
    ${config.position === 'bottom-right' ? `
      .orw-fab-container { right: 24px; }
      .orw-panel        { right: 24px; }
    ` : ''}
    ${config.position === 'bottom-left' ? `
      .orw-fab-container { left: 24px; }
      .orw-panel        { left: 24px; }
    ` : ''}

    /* Mobile: center the panel */
    @media (max-width: 768px) {
      .orw-panel {
        width: 90vw;
        max-width: none;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        bottom: auto !important;
        border-radius: 12px;
        padding: 20px 16px;
      }
      .orw-panel.open {
        transform: translate(-50%, -50%) scale(1);
      }
      .orw-fab { width: 56px; height: 56px; font-size: 1.4em; }
      .orw-fab-container { bottom: 16px; right: 16px; }
      .orw-product-name, .orw-product-price { font-size: 15px; }
      .orw-product-desc { font-size: 13px; }
      .orw-qty-btn, .orw-remove-btn { width: 36px; height: 36px; }
      .orw-send-btn { padding: 16px; font-size: 16px; }
    }

    .orw-footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border); text-align: center; font-size: 12px; color: #64748b; line-height: 1.5;}
    .orw-footer a { color: var(--primary); text-decoration: none; font-weight: 500; transition: color 0.2s ease;}
    .orw-footer a:hover,
    .orw-footer a:focus { color: var(--primary-dark); text-decoration: underline; }
    @media (max-width: 768px) { .orw-footer { font-size: 11px; margin-top: 20px; padding-top: 12px; } }

    .orw-note { background: #fff7e6; border-left: 5px solid #ff9800; padding: 16px 20px; border-radius: 10px; margin: 20px 0; font-size: 0.85rem; color: #333; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .orw-note strong { display: block; margin-bottom: 8px; font-size: 0.8rem; color: #ff9800; }
    .orw-note p { margin: 4px 0;}
    @media (max-width: 600px) { .orw-note { padding: 14px; } }

    h2 { margin: 0 0 16px; font-size: 14px; text-align: center; font-weight: 600; }
    .orw-close { position: absolute; top: 12px; right: 16px; font-size: 1.8em; cursor: pointer; color: #6b7280; }
    .orw-close:hover { color: #374151; }

    .orw-tabs { display: flex; margin: 0 -16px 16px; border-bottom: 1px solid var(--border); }
    .orw-tab-btn { display: flex; flex: 1; align-items: center; gap: 8px; padding: 10px 18px;  background: transparent;  border: none; font-weight: 600;  color: #64748b;  cursor: pointer;  font-size: 16px; justify-content: center;}
    .orw-tab-btn.active { color: var(--primary); border-bottom: 3px solid var(--primary); }
    .orw-tab-badge {  background: #ff9800; color: white;width: 24px;height: 24px; display: flex; align-content: center; border-radius: 50%; font-size: 12px; font-weight: bold; line-height: 1; margin-left: 6px; }

    .orw-tab-content { display: none; }
    .orw-tab-content.active { display: block; }

    .orw-view-toggle { display: flex; gap: 8px; margin-bottom: 16px; justify-content: center; }
    .orw-view-btn { padding: 6px 14px; border: 1px solid var(--border); border-radius: 8px; cursor: pointer; background: #f8fafc; font-size: 13px; }
    .orw-view-btn.active { background: var(--primary); color: white; border-color: var(--primary); }

    .orw-products-list { display: flex; flex-direction: column; gap: 16px; }
    .orw-products-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }

    @media (max-width: 420px) {
      .orw-products-grid { grid-template-columns: 1fr; }
    }

    .orw-product-item, .orw-product-card {
      padding: 12px; border: 1px solid var(--border); border-radius: 12px;
      background: #f9fafb; cursor: pointer; transition: all 0.15s;
    }
    .orw-product-item:hover, .orw-product-card:hover { border-color: var(--primary); transform: translateY(-2px); }

    .orw-product-image { object-fit: cover; border-radius: 8px; }

    .orw-products-list .orw-product-image { width: 80px; height: 80px; }
    .orw-products-grid .orw-product-image { width: 100%; height: 140px; }

    .orw-product-name { font-weight: 600; font-size: 14px; margin: 0 0 4px; }
    .orw-product-price { color: #059669; font-weight: bold; font-size: 14px; }
    .orw-product-desc { margin-top: 6px; font-size: 12px; font-style: italic; color: #64748b; line-height: 1.45; }
    .orw-in-cart-badge { margin-top: 8px; display: inline-block; color: var(--primary); font-weight: 500; font-size: 12px; }

    .orw-customer-form .orw-field { margin: 14px 0; }
    label { font-size: 13px; font-weight: 600; margin-bottom: 5px; display: block; }
    input, textarea { width: 100%; padding: 10px; font-size: 14px; border: 1px solid var(--border); border-radius: 8px; box-sizing: border-box; }

    .orw-cart-item { display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #f1f5f9; border-radius: 10px; margin-bottom: 10px; font-size: 13px; }
    .orw-qty-btn { width: 32px; height: 32px; border-radius: 50%; border: none; background: var(--primary); color: white; font-size: 1.1em; cursor: pointer; touch-action: manipulation; }
    .orw-remove-btn { background: #ef4444; color: white; border: none; border-radius: 50%; width: 28px; height: 28px; cursor: pointer; }

    .orw-total { font-size: 1.15em; font-weight: bold; text-align: right; margin: 16px 0; }
    .orw-send-btn { width: 100%; padding: 14px; background: var(--primary); color: white; border: none; border-radius: 10px; font-weight: bold; cursor: pointer; font-size: 15px; }
    .orw-send-btn:disabled { background: #9ca3af; cursor: not-allowed; }

    .orw-status { text-align: center; padding: 20px 12px; border-radius: 12px; font-size: 15px; font-weight: bold; margin: 24px 0; }
    .orw-success { background: #ecfdf5; color: var(--success); }
    .orw-error   { background: #fef2f2; color: var(--danger); }
  `;
  shadow.appendChild(style);

  // ─── HTML ─────────────────────────────────────────
  let fabHTML = '';
  if (!config.customTrigger) {
    fabHTML = `
      <div class="orw-fab-container">
        <div class="orw-fab" id="orw-fab">${config.buttonText}</div>
        <div class="orw-cart-badge" id="orw-cart-badge" style="display:none;">0</div>
      </div>
    `;
  }

  shadow.innerHTML += `
    ${fabHTML}

    <div class="orw-panel" id="orw-panel">
      <span class="orw-close">×</span>
      <h2>${config.title}</h2>

      <div class="orw-tabs">
        <button class="orw-tab-btn active" data-tab="products">Products</button>
        <button class="orw-tab-btn" data-tab="order">
          Checkout 
           <div id="orw-tab-badge" class="orw-tab-badge">0</div> 
        </button>
      </div>

      <div id="orw-products-tab" class="orw-tab-content active">
        <div id="orw-products-container"></div>
      </div>

      <div id="orw-order-tab" class="orw-tab-content">
        <div class="orw-customer-form">
          <div class="orw-field">
            <label>Your Name</label>
            <input type="text" name="name" required placeholder="Juan Dela Cruz">
          </div>
          <div class="orw-field">
            <label>Contact (email / phone)</label>
            <input type="text" name="contact" required placeholder="example@email.com or 0917...">
          </div>
          <div class="orw-field">
            <label>Notes / Special requests</label>
            <textarea name="notes" rows="3" placeholder="Less ice, extra cheese, deliver after 5pm..."></textarea>
          </div>
        </div>

        <div class="orw-cart-summary" id="orw-cart-summary" style="display:none;">
          <h3 style="text-align:center; margin:0 0 16px;">Your Order</h3>

          <div id="orw-note"></div>

          <div id="orw-cart-items"></div>

          <div id="orw-status" class="orw-status" style="display:none;"></div>
          
          <div class="orw-total" id="orw-cart-total">Total: ${config.currency}0.00</div>
          <button class="orw-send-btn" id="orw-send-order">Place Order</button>
        </div>
      </div>

        <p class="orw-footer">
            <span style="font-size:14px;">⚡</span> built by: 
            <a href="https://www.brisklabs.dev" target="_blank" rel="noopener noreferrer">brisklabs.dev</a>
        </p>
        
    </div>
  `;

  document.body.appendChild(widget);

  // ─── Elements ─────────────────────────────────────
  const panel      = shadow.getElementById('orw-panel');
  const closeBtn   = shadow.querySelector('.orw-close');
  const productsContainer = shadow.getElementById('orw-products-container');
  const cartSummary = shadow.getElementById('orw-cart-summary');
  const cartItems   = shadow.getElementById('orw-cart-items');
  const cartTotal   = shadow.getElementById('orw-cart-total');
  const sendBtn     = shadow.getElementById('orw-send-order');
  const status      = shadow.getElementById('orw-status');
  const orderNote   = shadow.getElementById('orw-note');
  const tabBadge    = shadow.getElementById("orw-tab-badge");
  let cart = [];
  let viewMode = config.defaultView;

  const placeholderImage = 'https://placehold.co/400x300/eeeeee/666666?text=No+Image&font=roboto';

  // ─── Custom Trigger + Default FAB Logic ───────────
  let fab = null;
  let cartBadge = null;

  // Append Note
  if (config.orderNote) {
    let noteOrder = `
      <div class="orw-note">
        <strong>Note:</strong>
        <p>${config.orderNote}</p>
      </div>
    `;
    orderNote.innerHTML = noteOrder;
  }

  if (!config.customTrigger) {
    // Default FAB mode
    fab = shadow.getElementById('orw-fab');
    cartBadge = shadow.getElementById('orw-cart-badge');

    if (fab) {
      fab.onclick = () => {
        panel.classList.toggle('open');
        if (panel.classList.contains('open')) {
          renderProducts();
          updateCartDisplay();
        }
      };
    }
  } else {
    // Custom trigger mode - hide default FAB
    const triggerSelector = config.customTrigger;
    const triggerElements = document.querySelectorAll(triggerSelector);

    if (triggerElements.length === 0) {
      console.warn(`Custom trigger selector "${triggerSelector}" did not match any elements`);
    }

    triggerElements.forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault(); // prevent default action if link/button
        panel.classList.add('open');
        renderProducts();
        updateCartDisplay();
      });
    });
  }

  // ─── Render Products ──────────────────────────────
  function renderProducts() {
    productsContainer.innerHTML = '';
    productsContainer.className = viewMode === 'list' ? 'orw-products-list' : 'orw-products-grid';

    config.products.forEach(p => {
      const inCart = cart.find(i => i.id === p.id);
      const qty = inCart ? inCart.quantity : 0;

      const imgSrc = (p.image && p.image.trim()) ? p.image.trim() : placeholderImage;

      const desc = (p.description && p.description.trim())
        ? `<div class="orw-product-desc">${p.description.trim()}</div>`
        : '';

      const badge = qty > 0
        ? `<div class="orw-in-cart-badge">In cart: ${qty}</div>`
        : '';

      let html = '';

      if (viewMode === 'list') {
        html = `
          <div style="display:flex; gap:12px; align-items:flex-start;">
            <img src="${imgSrc}" class="orw-product-image" alt="${p.name}">
            <div style="flex:1;">
              <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:4px;">
                <span class="orw-product-name">${p.name}</span>
                <span class="orw-product-price">${config.currency}${p.price}</span>
              </div>
              ${desc}
              ${badge}
            </div>
          </div>
        `;
      } else {
        html = `
          <div style="display:flex; flex-direction:column; height:100%;">
            <img src="${imgSrc}" class="orw-product-image" alt="${p.name}">
            <div style="padding:8px 0; flex:1;">
              <div class="orw-product-name">${p.name}</div>
              <div class="orw-product-price">${config.currency}${p.price}</div>
              ${desc}
              ${badge ? `<div style="margin-top:auto; text-align:center;">${badge}</div>` : ''}
            </div>
          </div>
        `;
      }

      const el = document.createElement('div');
      el.className = viewMode === 'list' ? 'orw-product-item' : 'orw-product-card';
      el.innerHTML = html;
      el.addEventListener('click', () => addToCart(p));
      productsContainer.appendChild(el);
    });
  }

  // ─── Cart Logic ───────────────────────────────────
  function addToCart(product) {
    let entry = cart.find(i => i.id === product.id);
    if (entry) entry.quantity++;
    else cart.push({ ...product, quantity: 1 });
    updateCartDisplay();
    renderProducts();
  }

  function updateQuantity(id, delta) {
    const item = cart.find(i => i.id === id);
    if (item) {
      item.quantity = Math.max(1, item.quantity + delta);
      updateCartDisplay();
      renderProducts();
    }
  }

  function updateCartBadge(count) {
    if (tabBadge) {
      if (count > 0) {
        tabBadge.style.display = 'block';
      } else {
        tabBadge.style.display = 'none';
      }
      tabBadge.textContent = count;
    } else {
      console.log("Can't find the badge")
    }
  }

  function removeItem(id) {
    cart = cart.filter(i => i.id !== id);
    updateCartDisplay();
    renderProducts();
  }

  function updateCartDisplay() {
    const itemCount = cart.reduce((sum, i) => sum + i.quantity, 0);

    // Update badge (only if default FAB exists)
    if (cartBadge) {
      if (itemCount > 0) {
        cartBadge.textContent = itemCount > 99 ? '99+' : itemCount;
        cartBadge.style.display = 'flex';
      } else {
        cartBadge.style.display = 'none';
      }
    }
    // Checkout badge
    updateCartBadge(itemCount)
    if (cart.length === 0) {
      cartSummary.style.display = 'none';
      return;
    }

    cartSummary.style.display = 'block';
    cartItems.innerHTML = '';

    let total = 0;
    cart.forEach(item => {
      total += item.price * item.quantity;
      const row = document.createElement('div');
      row.className = 'orw-cart-item';
      row.innerHTML = `
        <div style="flex:1">
          <div style="font-weight:500">${item.name}</div>
          <div>${config.currency}${item.price} × ${item.quantity}</div>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <button class="orw-qty-btn" data-delta="-1" data-id="${item.id}">-</button>
          <span>${item.quantity}</span>
          <button class="orw-qty-btn" data-delta="1" data-id="${item.id}">+</button>
          <button class="orw-remove-btn" data-id="${item.id}">×</button>
        </div>
      `;
      cartItems.appendChild(row);
    });

    cartTotal.textContent = `Total: ${config.currency}${total.toFixed(2)}`;

    cartItems.querySelectorAll('.orw-qty-btn').forEach(btn => {
      btn.onclick = () => updateQuantity(btn.dataset.id, Number(btn.dataset.delta));
    });
    cartItems.querySelectorAll('.orw-remove-btn').forEach(btn => {
      btn.onclick = () => removeItem(btn.dataset.id);
    });
  }

  // ─── Send Order ───────────────────────────────────
  async function sendOrder() {
    const name    = shadow.querySelector('[name="name"]').value.trim();
    const contact = shadow.querySelector('[name="contact"]').value.trim();
    const notes   = shadow.querySelector('[name="notes"]').value.trim();

    if (!name || !contact) {
      alert('Please enter your name and contact information');
      return;
    }

    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending...';

    const payload = {
      host: "brisklabs", //window.location.hostname,   // automatically sends the current domain (e.g. "brisklabs.dev")
      customer: { name, contact, notes: notes || undefined },
      items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
      total: cart.reduce((sum, i) => sum + i.price * i.quantity, 0),
      timestamp: new Date().toISOString()
    };

    try {
      const res = await fetch(config.submitUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      status.innerHTML = '✅ Order placed successfully!<br> You will be notified through your provided contact details once the seller confirms your order.<br>Thank you!';
      status.className = 'orw-success';
      status.style.display = 'block';

      setTimeout(() => {
        cart = [];
        updateCartDisplay();
        status.style.display = 'none';
        switchTab('products');
      }, 4000);

    } catch (err) {
      console.error(err);
      status.innerHTML = '❌ Failed to place order<br>Please try again';
      status.className = 'orw-error';
      status.style.display = 'block';
    } finally {
      sendBtn.disabled = false;
      sendBtn.textContent = 'Place Order';
    }
  }

  // ─── Tab Switching ────────────────────────────────
  function switchTab(tabName) {
    shadow.querySelectorAll('.orw-tab-btn').forEach(b => b.classList.remove('active'));
    shadow.querySelectorAll('.orw-tab-content').forEach(c => c.classList.remove('active'));

    shadow.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    shadow.getElementById(`orw-${tabName}-tab`).classList.add('active');
  }

  // ─── Events ───────────────────────────────────────
  closeBtn.onclick = () => panel.classList.remove('open');

  shadow.querySelectorAll('.orw-tab-btn').forEach(btn => {
    btn.onclick = () => switchTab(btn.dataset.tab);
  });

  shadow.querySelectorAll('.orw-view-btn').forEach(btn => {
    btn.onclick = () => {
      viewMode = btn.dataset.view;
      shadow.querySelectorAll('.orw-view-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderProducts();
    };
  });

  sendBtn.onclick = sendOrder;

  // Initial render
  renderProducts();
  updateCartDisplay();

  console.log('Widget loaded – custom trigger support added');
})();