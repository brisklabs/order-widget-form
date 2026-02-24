// widget.js
(function () {
  if (window.brisklabsOrderWidgetLoaded) return;
  window.brisklabsOrderWidgetLoaded = true;

  const script = document.currentScript || 
    Array.from(document.scripts).find(s => s.src.includes("widget.js"));

  if (!script) {
    console.error("Widget script tag not found");
    return;
  }

  // ─── Config ───────────────────────────────────────
  const config = {
    title: script.dataset.title || "Quick Order",
    submitUrl: script.dataset.submitUrl || null,
    currency: script.dataset.currency || "₱",
    position: script.dataset.position || "bottom-right",
    buttonColor: script.dataset.buttonColor || "#2563eb",
    defaultView: script.dataset.view === "card" ? "grid" : "list",
    orderNote: script.dataset.orderNote || null,
    customTrigger: script.dataset.customTrigger || null,
    submitMethod: script.dataset.submitMethod || "api", // messenging (whatapp, viber, messager)
    whatsapp: script.dataset.whatsapp || null,
    viber: script.dataset.viber || null,
    messenger: script.dataset.messenger || null,
    productsUrl: script.dataset.productsUrl || null,
    products: [],
    hasFilter: script.dataset.hasFilter || false,
  };

  // ─── Load Products ───────────────────────────────────────
  // This block should come immediately after config
  if (script.dataset.productsUrl) {
    fetch(script.dataset.productsUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Failed to load products: ${response.status} ${response.statusText}`,
          );
        }
        return response.json();
      })
      .then((data) => {
        config.products = Array.isArray(data) ? data : [];
        console.log(`Products loaded from ${script.dataset.productsUrl} — ${config.products.length} categories`);
        // Important: render or refresh UI after products are ready
        if (typeof renderProducts === "function") {
          renderProducts(); // ← call your render function here
        }
      })
      .catch((err) => {
        console.error("Error loading products.json:", err);
        config.products = [];
      });
  } else if (script.dataset.products) {
    try {
      config.products = JSON.parse(script.dataset.products || "[]");
      if (!Array.isArray(config.products)) config.products = [];
      console.log("Products loaded from inline data-products");
    } catch (e) {
      console.error("Invalid inline products JSON", e);
      config.products = [];
    }
  } else {
    console.warn("No products source found (missing data-products or data-products-url)");
    config.products = [];
  }

  // ─── Widget + Shadow DOM ──────────────────────────
  const widget = document.createElement("div");
  widget.id = "orw-brisklabs-order-widget";  
  const shadow = widget.attachShadow({ mode: "open" });
  const style = document.createElement("style");
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

    .orw-fab:hover {
      transform: scale(1.08);
    }

    .orw-cart-badge {
      position: absolute;
      top: -6px;
      right: -6px;
      background: #ef4444;
      color: white;
      font-size: 11px;
      font-weight: bold;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
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
      padding: 10px 16px;
      color: var(--text);
      display: none;
      transition: opacity 0.3s ease, transform 0.3s ease;
      opacity: 0;
      transform: translateY(20px);
      font-size: var(--font-base);
    }

    .orw-panel.open {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      opacity: 1;
      transform: translateY(0);
      bottom: 65px;
    }

    .orw-content-scroll {
      flex: 1 1 auto;
      overflow-y: auto;
      margin-left: 10px;
      -webkit-overflow-scrolling: touch;
    }

    .orw-content-scroll::-webkit-scrollbar {
      width: 6px;
    }

    .orw-content-scroll::-webkit-scrollbar-thumb {
      background: transparent;
      border-radius: 3px;
    }
    ${config.position === "bottom-right" ? `
      .orw-fab-container { right: 24px; }
      .orw-panel        { right: 24px; }
    ` : ""}
    ${config.position === "bottom-left" ? `
      .orw-fab-container { left: 24px; }
      .orw-panel        { left: 24px; }
    ` : ""}
    ${config.position === "top-left" ? `
      .orw-fab-container { left: 24px; top: 24px; bottom: auto; }
      .orw-panel        { left: 24px; top: 24px; }
    ` : ""}
    ${config.position === "top-right" ? `
      .orw-fab-container { right: 24px; top: 24px; bottom: auto; }
      .orw-panel         { right: 24px; top: 24px; }
    ` : ""}
    ${config.position === "center" ? `
      .orw-fab-container {
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        bottom: auto;
        right: auto;
      }
      .orw-panel {
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      }
    ` : ""}

    @media (max-width: 768px) {
      .orw-panel {
        width: 90vw;
        max-width: none;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        bottom: auto !important;
        border-radius: 12px;
        padding: 20px 10px;
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
      .orw-footer { font-size: 11px; margin-top: 20px; padding-top: 12px; }
    }

    .orw-header {
      flex-shrink: 0;
      padding: 0px 20px;
      background: white;
      position: relative;
    }

    .orw-close {
      position: absolute;
      top: 12px;
      right: 16px;
      font-size: 1.8em;
      cursor: pointer;
      color: #6b7280;
    }

    .orw-close:hover {
      color: #374151;
    }

    .orw-tabs {
      display: flex;
      border-bottom: 1px solid var(--border);
      gap: 8px;
    }

    .orw-tab-btn {
      display: flex;
      flex: 1;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      background: transparent;
      border: none;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
      font-size: 16px;
      justify-content: center;
    }

    .orw-tab-btn.active {
      color: var(--primary);
      border-bottom: 3px solid var(--primary);
    }

    .orw-tab-badge {
      background: #ff9800;
      color: white;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      font-size: 12px;
      font-weight: bold;
      line-height: 1;
      margin-left: 6px;
    }
    
    .orw-tab-content { display: none; }
    .orw-tab-content.active { display: block; }
    .orw-view-toggle { display: flex; gap: 8px; margin-bottom: 16px; justify-content: center; }

    .orw-view-btn {
      padding: 6px 14px;
      border: 1px solid var(--border);
      border-radius: 8px;
      cursor: pointer;
      background: #f8fafc;
      font-size: 13px;
    }

    .orw-view-btn.active {
      background: var(--primary);
      color: white;
      border-color: var(--primary);
    }

    /* ==========================================================================
      PRODUCTS LIST / GRID
      ========================================================================== */
    .orw-products-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .orw-products-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    @media (max-width: 420px) {
      .orw-products-grid {
        grid-template-columns: 1fr;
      }
    }

    .orw-product-item,
    .orw-product-card {
      padding: 12px;
      border: 1px solid var(--border);
      border-radius: 12px;
      background: #f9fafb;
      cursor: pointer;
      transition: all 0.15s;
    }

    .orw-product-item:hover,
    .orw-product-card:hover { border-color: var(--primary); transform: translateY(-2px); }

    .orw-product-image { object-fit: cover; border-radius: 8px; }
    .orw-products-list .orw-product-image { width: 80px; height: 80px; }
    .orw-products-grid .orw-product-image { width: 100%; height: 140px; }

    .orw-section-title {
      margin: 32px 0 16px;
      font-size: 1.4rem;
      font-weight: 700;
      color: #111827;
      border-bottom: 2px solid #eee;
      padding-bottom: 8px;
    }

    .orw-products-list .orw-section-title { margin: 36px 0 10px 0; font-size: 1.5rem; }
    .orw-products-grid .orw-section-title { grid-column: 1 / -1; margin: 32px 0 16px 0; font-size: 1.7rem; padding-left: 8px; }

    .orw-product-name { font-weight: 600; font-size: 14px; margin: 0 0 4px; }
    .orw-product-price { color: #059669; font-weight: bold; font-size: 14px; }
    .orw-product-desc { margin-top: 6px; font-size: 12px; font-style: italic; color: #64748b; line-height: 1.45; }
    .orw-in-cart-badge { margin-top: 8px; display: inline-block; color: var(--primary); font-weight: 500; font-size: 12px; }

    .orw-filter-bar {
      margin-top: 20px;
      padding: 12px 16px 16px;
      background: #f9fafb;
      border-radius: 10px;
      border: 1px solid var(--border);
    }
    .orw-filter-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }
    .orw-filter-icon {
      position: absolute;
      left: 12px;
      color: #6b7280;
      pointer-events: none;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1;
    }
    .orw-category-select {
      width: 100%;
      padding: 10px 36px 10px 36px;
      font-size: 15px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      background: white;
      background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='6'><polygon points='0,0 12,0 6,6' fill='%236b7280'/></svg>");
      background-repeat: no-repeat;
      background-position: right 12px center;
      background-size: 10px;
      appearance: none;
      cursor: pointer;
    }

    .orw-category-select:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(37,99,235,0.15);
    }

    .orw-filter-bar:hover .orw-category-select {
      border-color: #9ca3af;
    }

    /* ==========================================================================
      CART, FORM & BUTTONS
      ========================================================================== */
    .orw-customer-form .orw-field { position: relative; margin: 14px 0; }
    label { font-size: 13px; font-weight: 600; margin-bottom: 5px; display: block; }
    input, textarea { width: 100%; padding: 10px; font-size: 14px; border: 1px solid var(--border); border-radius: 8px; box-sizing: border-box; }

    .orw-field.invalid input,
    .orw-field.invalid textarea { border-color: #ef4444 !important; background-color: #fef2f2; animation: shake 0.5s ease-in-out; }

    .orw-field .error-message { color: #ef4444; font-size: 12px; margin-top: 4px; display: none; }
    .orw-field.invalid .error-message { display: block; }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-6px); }
      20%, 40%, 60%, 80% { transform: translateX(6px); }
    }

    .orw-cart-item { display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #f1f5f9; border-radius: 10px; margin-bottom: 10px; font-size: 13px; }
    .orw-qty-btn { width: 32px; height: 32px; border-radius: 50%; border: none; background: var(--primary); color: white; font-size: 1.1em; cursor: pointer; touch-action: manipulation; }
    .orw-remove-btn { background: #ef4444; color: white; border: none; border-radius: 50%; width: 28px; height: 28px; cursor: pointer; }
    .orw-total { font-size: 1.15em; font-weight: bold; text-align: right; margin: 16px 0; }
    .orw-send-btn { width: 100%; padding: 14px; background: var(--primary); color: white; border: none; border-radius: 10px; font-weight: bold; cursor: pointer; font-size: 15px; }
    .orw-send-btn:disabled { background: #9ca3af; cursor: not-allowed; }

    .orw-status { text-align: center; padding: 20px 12px; border-radius: 12px; font-size: 15px; font-weight: bold; margin: 24px 0; }
    .orw-status.orw-success { background: #ecfdf5; color: var(--success); }
    .orw-status.orw-error   { background: #fef2f2; color: var(--danger); }

    .orw-footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border); text-align: center; font-size: 12px; color: #64748b; line-height: 1.5; }
    .orw-footer a { color: var(--primary); text-decoration: none; font-weight: 500; transition: color 0.2s ease; }
    .orw-footer a:hover, .orw-footer a:focus { color: var(--primary-dark); text-decoration: underline; }

    .orw-note { background: #fff7e6; border-left: 5px solid #ff9800; padding: 16px 20px; border-radius: 10px; margin: 20px 0; font-size: 0.85rem; color: #333; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .orw-note strong { display: block; margin-bottom: 8px; font-size: 0.8rem; color: #ff9800; }
    .orw-note p { margin: 4px 0; }
    @media (max-width: 600px) { .orw-note { padding: 14px; } }

    /* ==========================================================================
      FILTERING & FADE ANIMATIONS
      ========================================================================== */
    .orw-section-title.hidden,
    .orw-product-item.hidden,
    .orw-product-card.hidden {
      display: none !important;
    }

    .orw-section-title,
    .orw-product-item,
    .orw-product-card {
      transition: opacity 0.3s ease;
    }

    .orw-section-title.hidden,
    .orw-product-item.hidden,
    .orw-product-card.hidden {
      opacity: 0;
      pointer-events: none;
      visibility: hidden;
    }
  `;
  shadow.appendChild(style);

  // ─── HTML ─────────────────────────────────────────
  let fabHTML = "";
  if (!config.customTrigger) {
    fabHTML = `
      <div class="orw-fab-container">
        <div class="orw-fab" id="orw-fab">
        <svg width="25" height="25" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 21C9.10457 21 10 20.1046 10 19C10 17.8954 9.10457 17 8 17C6.89543 17 6 17.8954 6 19C6 20.1046 6.89543 21 8 21Z" stroke="currentColor" stroke-width="2"/>
          <path d="M19 21C20.1046 21 21 20.1046 21 19C21 17.8954 20.1046 17 19 17C17.8954 17 17 17.8954 17 19C17 20.1046 17.8954 21 19 21Z" stroke="currentColor" stroke-width="2"/>
          <path d="M2 3H5.5L7.5 13.5C7.5 13.5 7.5 15 9 15H18.5C19.5 15 20 14.5 20 13.5L22 5H6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        </div>
        <div class="orw-cart-badge" id="orw-cart-badge" style="display:none;">0</div>
      </div>
    `;
  }

  shadow.innerHTML += `
    ${fabHTML}
    <div class="orw-panel" id="orw-panel">
    <!-- Fixed / Sticky header -->
    <div class="orw-header">
      <span class="orw-close">×</span>
      <h2>${config.title}</h2>
      <div class="orw-tabs">
        <button class="orw-tab-btn active" data-tab="products">Products</button>
        <button class="orw-tab-btn" data-tab="order">
          Checkout
          <div id="orw-tab-badge" class="orw-tab-badge">
            <div>0</div>
          </div>
        </button>
      </div>
    </div>
    
    <!-- Scrollable content area -->
    <div class="orw-content-scroll">
      <div id="orw-products-tab" class="orw-tab-content active">
        <div id="orw-filter-placeholder"></div>
        <div id="orw-products-container"></div>
      </div>

      <div id="orw-order-tab" class="orw-tab-content">
        <div class="orw-customer-form">
          <div class="orw-field">
            <input type="text" name="name" required placeholder="Enter your name">
          </div>
          <div class="orw-field">
            <input type="text" name="address" required placeholder="Enter your address (e.g unit, floor, street, barangay)">
          </div>
          <div class="orw-field">
            <input type="text" name="contact" required placeholder="Enter email or phone number">
          </div>
          <div class="orw-field">
            <textarea name="notes" rows="3" placeholder="Notes/Special request (e.g less ice, extra cheese, deliver after 5pm...)"></textarea>
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
          <span style="font-size:14px;">⚡</span> 
          built by: <a href="https://www.brisklabs.dev" target="_blank" rel="noopener noreferrer">brisklabs.dev</a>
        </p>
      </div>   
    </div>
  `;

  document.body.appendChild(widget);

  // ─── Elements ─────────────────────────────────────
  const panel = shadow.getElementById("orw-panel");
  const closeBtn = shadow.querySelector(".orw-close");
  const productsContainer = shadow.getElementById("orw-products-container");
  const cartSummary = shadow.getElementById("orw-cart-summary");
  const cartItems = shadow.getElementById("orw-cart-items");
  const cartTotal = shadow.getElementById("orw-cart-total");
  const sendBtn = shadow.getElementById("orw-send-order");
  const status = shadow.getElementById("orw-status");
  const orderNote = shadow.getElementById("orw-note");
  const tabBadge = shadow.getElementById("orw-tab-badge");

  let currentFilterValue = "all";
  let cart = [];
  let viewMode = config.defaultView;

  const placeholderImage =
    "https://placehold.co/400x300/eeeeee/666666?text=No+Image&font=roboto";

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
    fab = shadow.getElementById("orw-fab");
    cartBadge = shadow.getElementById("orw-cart-badge");

    if (fab) {
      fab.onclick = () => {
        panel.classList.toggle("open");
        if (panel.classList.contains("open")) {
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
      console.warn(
        `Custom trigger selector "${triggerSelector}" did not match any elements`,
      );
    }

    triggerElements.forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        panel.classList.add("open");
        renderProducts();
        updateCartDisplay();
      });
    });
  }


  // ─── Category Filter Logic ────────────────────────────────
  function getUniqueTypes() {
    const types = config.products.map(group => group?.type?.trim()).filter(t => t && typeof t === 'string');
    return [...new Set(types)].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }

  function initCategoryFilter() {
    if (shadow.getElementById("orw-filter-bar")) {
      console.log("Filter already exists — skipping re-initialization");
      applyFilter();
      return;
    }
    if (!config.hasFilter) {
      const placeholder = shadow.getElementById("orw-filter-placeholder");
      if (placeholder) placeholder.remove();
      return;
    }
    const uniqueTypes = getUniqueTypes();
    if (uniqueTypes.length <= 1) {
      const placeholder = shadow.getElementById("orw-filter-placeholder");
      if (placeholder) placeholder.remove();
      return;
    }

    const filterHTML = `
      <div class="orw-filter-bar" id="orw-filter-bar">
        <div class="orw-filter-wrapper">
          <span class="orw-filter-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
          </span>
          <select id="orw-category-filter" class="orw-category-select">
            <option value="all">All Categories</option>
          </select>
        </div>
      </div>
    `;

    const target = shadow.getElementById("orw-filter-placeholder") || productsContainer;
    if (!target) {
      console.warn("Filter insertion target not found");
      return;
    }

    target.insertAdjacentHTML("beforebegin", filterHTML);

    // 6. Now safe to get the select element
    const categoryFilter = shadow.getElementById("orw-category-filter");
    if (!categoryFilter) {
      console.error("Category filter select not found after injection");
      return;
    }

    // 7. Populate options
    uniqueTypes.forEach(type => {
      const option = document.createElement("option");
      option.value = type;
      option.textContent = type;
      categoryFilter.appendChild(option);
    });

    // 8. Restore previously selected value (if valid)
    if (currentFilterValue && uniqueTypes.includes(currentFilterValue)) {
      categoryFilter.value = currentFilterValue;
    } else {
      categoryFilter.value = "all"; // fallback
      currentFilterValue = "all";
    }

    // 9. Attach change listener (only once)
    categoryFilter.addEventListener("change", () => {
      applyFilter(categoryFilter);
    });

    // 10. Apply filter right after population
    applyFilter(categoryFilter);

    // 11. Clean up placeholder
    const placeholder = shadow.getElementById("orw-filter-placeholder");
    if (placeholder) placeholder.remove();

    console.log("Filter initialized successfully");
  }

  // ─── Apply Filter ────────────────────────────────
  function applyFilter(filterElement = null) {
    // Get the element safely — fallback to query if not passed
    const catFilter = filterElement || shadow.getElementById("orw-category-filter");

    if (!catFilter) {
      console.warn("applyFilter: No category filter element available");
      return;
    }

    currentFilterValue = catFilter.value;
    const selected = currentFilterValue;

    // Update section titles
    shadow.querySelectorAll(".orw-section-title").forEach(title => {
      if (selected === "all" || title.textContent.trim() === selected) {
        title.classList.remove("hidden");
      } else {
        title.classList.add("hidden");
      }
    });

    // Update product cards/items
    shadow.querySelectorAll(".orw-product-item, .orw-product-card").forEach(item => {
      if (selected === "all" || item.dataset.type === selected) {
        item.classList.remove("hidden");
      } else {
        item.classList.add("hidden");
      }
    });
  }

  // ─── Render Products ──────────────────────────────
  function renderProducts() {
    productsContainer.innerHTML = "";
    productsContainer.className =
      viewMode === "list" ? "orw-products-list" : "orw-products-grid";

    function createProductElement(p) {
      const inCart = cart.find((i) => i.id === p.id);
      const qty = inCart ? inCart.quantity : 0;

      const imgSrc =
        p.image && p.image.trim() ? p.image.trim() : placeholderImage;

      const desc =
        p.description && p.description.trim()
          ? `<div class="orw-product-desc">${p.description.trim()}</div>`
          : "";

      const badge =
        qty > 0 ? `<div class="orw-in-cart-badge">In cart: ${qty}</div>` : "";

      let html = "";

      if (viewMode === "list") {
        html = `
          <div style="display:flex; gap:12px; align-items:flex-start;">
            <img src="${imgSrc}" class="orw-product-image" alt="${p.name}">
            <div style="flex:1;">
              <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:4px;">
                <span class="orw-product-name">${p.name}</span>
                <span class="orw-product-price">${formatCurrency(p.price)}</span>
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
              <div class="orw-product-price">${formatCurrency(p.price)}</div>
              ${desc}
              ${badge ? `<div style="margin-top:auto; text-align:center;">${badge}</div>` : ""}
            </div>
          </div>
        `;
      }

      const el = document.createElement("div");
      el.className = viewMode === "list" ? "orw-product-item" : "orw-product-card";
      el.innerHTML = html;
      el.addEventListener("click", () => addToCart(p));
      return el;
    }

    const isGrouped =
      Array.isArray(config.products) &&
      config.products.length > 0 &&
      config.products[0] &&
      "type" in config.products[0] &&
      "items" in config.products[0];

    if (isGrouped) {
      config.products.forEach((category) => {
        if (
          !category?.type ||
          !Array.isArray(category.items) ||
          category.items.length === 0
        )
          return;

        // Section heading
        const heading = document.createElement("h2");
        heading.className = "orw-section-title";
        heading.textContent = category.type;
        productsContainer.appendChild(heading);

        // Products
        category.items.forEach((product) => {
          const card = createProductElement(product);
          card.dataset.type = category.type;
          productsContainer.appendChild(card);
        });
      });
      
      // Check and Apply Category filtering
      if (config.hasFilter) {
        initCategoryFilter()
      }

    } else {
      (config.products || []).forEach((product) => {
        productsContainer.appendChild(createProductElement(product));
      });
    }
  }

  // ─── Cart Logic ───────────────────────────────────
  function addToCart(product) {
    let entry = cart.find((i) => i.id === product.id);
    if (entry) entry.quantity++;
    else cart.push({ ...product, quantity: 1 });
    updateCartDisplay();
    renderProducts();
  }

  function updateQuantity(id, delta) {
    const item = cart.find((i) => i.id === id);
    if (item) {
      item.quantity = Math.max(1, item.quantity + delta);
      updateCartDisplay();
      renderProducts();
    }
  }

  function updateCartBadge(count) {
    if (tabBadge) {
      if (count > 0) {
        tabBadge.style.display = "flex";
      } else {
        tabBadge.style.display = "none";
      }
      tabBadge.innerHTML = `<div>${count}</div>` ;
    } else {
      console.log("Can't find the badge");
    }
  }

  function removeItem(id) {
    cart = cart.filter((i) => i.id !== id);
    updateCartDisplay();
    renderProducts();
  }

  function updateCartDisplay() {
    const itemCount = cart.reduce((sum, i) => sum + i.quantity, 0);

    // Update badge (only if default FAB exists)
    if (cartBadge) {
      if (itemCount > 0) {
        cartBadge.textContent = itemCount > 99 ? "99+" : itemCount;
        cartBadge.style.display = "flex";
      } else {
        cartBadge.style.display = "none";
      }
    }
    // Checkout badge
    updateCartBadge(itemCount);
    if (cart.length === 0) {
      cartSummary.style.display = "none";
      return;
    }

    cartSummary.style.display = "block";
    cartItems.innerHTML = "";

    let total = 0;
    cart.forEach((item) => {
      total += item.price * item.quantity;
      const row = document.createElement("div");
      row.className = "orw-cart-item";
      row.innerHTML = `
        <div style="flex:1">
          <div style="font-weight:500">${item.name}</div>
          <div>${formatCurrency(item.price)} × ${item.quantity}</div>
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

    // cartTotal.textContent = `Total: ${config.currency}${total.toFixed(2)}`;
    cartTotal.textContent = `Total: ${formatCurrency(total)}`;

    cartItems.querySelectorAll(".orw-qty-btn").forEach((btn) => {
      btn.onclick = () =>
        updateQuantity(btn.dataset.id, Number(btn.dataset.delta));
    });
    cartItems.querySelectorAll(".orw-remove-btn").forEach((btn) => {
      btn.onclick = () => removeItem(btn.dataset.id);
    });
  }

  function formatCurrency(price) {
    return `${config.currency}${Number(price).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  // ─── Send Order ───────────────────────────────────
  async function sendOrder() {
    // Get form inputs
    const nameInput = shadow.querySelector('input[name="name"]');
    const addressInput = shadow.querySelector('input[name="address"]');
    const contactInput = shadow.querySelector('input[name="contact"]');
    const notesInput = shadow.querySelector('textarea[name="notes"]');

    // Reset previous errors
    [nameInput, addressInput, contactInput].forEach((input) => {
      if (input) {
        const field = input.closest(".orw-field");
        if (field) {
          field.classList.remove("invalid");
          const err = field.querySelector(".error-message");
          if (err) err.remove();
        }
      }
    });

    let isValid = true;
    let firstInvalid = null;

    // Helper to show error
    function markInvalid(input, msg) {
      if (!input) return;
      const field = input.closest(".orw-field");
      if (!field) return;

      field.classList.add("invalid");

      let err = field.querySelector(".error-message");
      if (!err) {
        err = document.createElement("div");
        err.className = "error-message";
        field.appendChild(err);
      }
      err.textContent = msg;

      isValid = false;
      if (!firstInvalid) firstInvalid = input;
    }

    // Validation rules
    if (!nameInput?.value.trim()) {
      markInvalid(nameInput, "Name is required");
    }

    if (!addressInput?.value.trim()) {
      markInvalid(addressInput, "Address is required");
    }

    if (!contactInput?.value.trim()) {
      markInvalid(contactInput, "Contact is required");
    } else {
      const contactVal = contactInput.value.trim();
      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactVal) &&
        !/^(09\d{9}|\+639\d{9}|0\d{1,2}\s?\d{7,})$/.test(contactVal)
      ) {
        markInvalid(
          contactInput,
          "Enter a valid email or Philippine phone number",
        );
      }
    }

    if (!isValid) {
      if (firstInvalid) {
        firstInvalid.focus();
        const field = firstInvalid.closest(".orw-field");
        if (field) {
          field.classList.add("shake"); // assuming you have .shake animation
          setTimeout(() => field.classList.remove("shake"), 800);
        }
      }
      sendBtn.disabled = false;
      sendBtn.textContent = "Place Order";
      return;
    }

    // Form is valid → proceed
    sendBtn.disabled = true;
    sendBtn.textContent = "Sending...";

    // Build order message (shared between WhatsApp and API)
    const customer = {
      name: nameInput.value.trim(),
      address: addressInput.value.trim(),
      contact: contactInput.value.trim(),
      notes: notesInput?.value.trim() || "",
    };

    const itemsText = cart
      .map(
        (i) =>
          `${i.quantity}× ${i.name} — ${formatCurrency(i.price * i.quantity)}`,
      )
      .join("\n");

    const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const orderText =
      `${config.messagePrefix || `New order from ${window.location.hostname}:`}\n\n` +
      `Customer: ${customer.name}\n` +
      `Contact: ${customer.contact}\n` +
      `Address: ${customer.address}\n` +
      (customer.notes ? `Notes: ${customer.notes}\n\n` : "\n") +
      `Items:\n${itemsText}\n\n` +
      `TOTAL: ${formatCurrency(total)}\n` +
      `Time: ${new Date().toLocaleString("en-PH")}`;

    const encodedMessage = encodeURIComponent(orderText);

    let success = false;
    let usedMessaging = false;

    // ── Messaging methods (WhatsApp Viber Messenger) ──
    if (
      config.submitMethod === "messenging" ||
      config.submitMethod === "both"
    ) {
      if (config.whatsapp) {
        const waUrl = `https://wa.me/${config.whatsapp}?text=${encodedMessage}`;
        window.open(waUrl, "_blank");
        usedMessaging = true;
        success = true;
      }
      // Optional: Viber (prefill is unreliable — just open chat)
      else if (config.viber) {
        const viberUrl = `viber://chat?number=%2B${config.viber}`;
        window.open(viberUrl, "_blank");
        usedMessaging = true;
        success = true;
      }
      // Optional: Messenger (supports ?text= for pages)
      else if (config.messenger) {
        const messengerUrl = `${config.messenger}?text=${encodedMessage}`;
        window.open(messengerUrl, "_blank");
        usedMessaging = true;
        success = true;
      }
    }

    // ── API fallback (or both) ──
    if (
      (usedMessaging && config.submitMethod === "both") ||
      config.submitMethod === "api"
    ) {
      if (config.submitUrl) {
        const payload = {
          host: window.location.hostname,
          customer,
          items: cart.map((i) => ({
            id: i.id,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
          })),
          total,
          timestamp: new Date().toISOString(),
        };

        try {
          const res = await fetch(config.submitUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const result = await res.json();
          if (!result.success)
            throw new Error(result.message || "Server error");
          success = true;
        } catch (err) {
          console.error("API error:", err);
          // If messaging already opened, don't overwrite success
          if (!usedMessaging) {
            status.innerHTML = `❌ ${err.message || "Failed to place order"}`;
            status.className = "orw-status orw-error";
            status.style.display = "block";
          }
        }
      } else {
        status.innerHTML = `❌ host url not found, Please provide a targer url for sending request`;
        status.className = "orw-status orw-error";
        status.style.display = "block";
        sendBtn.disabled = false;
        sendBtn.textContent = "Place Order";
        return;
      }
    }

    // ── Final feedback ──
    if (success) {
      status.innerHTML = `
        Order sent successfully!<br>
        Thank you ${customer.name}!<br>
        ${
          usedMessaging
            ? "Please check your messaging app to confirm with the seller."
            : "We will get back to you soon."
        }
      `;
      status.className = "orw-status orw-success";
      status.style.display = "block";

      setTimeout(() => {
        cart = [];
        updateCartDisplay();
        status.style.display = "none";
        panel.classList.remove("open");
        switchTab("products");
      }, 5000);
    } else {
      status.innerHTML =
        "No valid send method configured. Please contact us directly.";
      status.className = "orw-status orw-error";
      status.style.display = "block";
    }

    sendBtn.disabled = false;
    sendBtn.textContent = "Place Order";
  }

  // ─── Tab Switching ────────────────────────────────
  function switchTab(tabName) {
    shadow
      .querySelectorAll(".orw-tab-btn")
      .forEach((b) => b.classList.remove("active"));
    shadow
      .querySelectorAll(".orw-tab-content")
      .forEach((c) => c.classList.remove("active"));

    shadow.querySelector(`[data-tab="${tabName}"]`).classList.add("active");
    shadow.getElementById(`orw-${tabName}-tab`).classList.add("active");
  }

  // ─── Events ───────────────────────────────────────
  closeBtn.onclick = () => panel.classList.remove("open");

  shadow.querySelectorAll(".orw-tab-btn").forEach((btn) => {
    btn.onclick = () => switchTab(btn.dataset.tab);
  });

  shadow.querySelectorAll(".orw-view-btn").forEach((btn) => {
    btn.onclick = () => {
      viewMode = btn.dataset.view;
      shadow
        .querySelectorAll(".orw-view-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderProducts();
    };
  });

  sendBtn.onclick = sendOrder;

  // Initial render
  renderProducts();
  updateCartDisplay();

  console.log("Widget loaded – custom trigger support added");
})();
