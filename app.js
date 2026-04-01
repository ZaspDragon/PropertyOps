const STORAGE_KEY = 'propertyops-mobile-v1';
const STATUS_FLOW = ['Processing', 'In Transit', 'Delivered'];

const PRODUCT_CATALOG = [
  { id: 'p1', sku: 'HV-101', name: 'MERV 8 Air Filter 16x20x1', category: 'HVAC', supplier: 'Midwest Supply Co.', price: 8.99, eta: '1–2 days', stock: 124 },
  { id: 'p2', sku: 'PL-205', name: 'Chrome Bathroom Faucet', category: 'Plumbing', supplier: 'PlumbDirect 3PL', price: 64.5, eta: '2–3 days', stock: 38 },
  { id: 'p3', sku: 'EL-332', name: 'LED A19 Bulb 12-Pack', category: 'Electrical', supplier: 'Electra Fulfillment', price: 21.99, eta: '1–2 days', stock: 91 },
  { id: 'p4', sku: 'CL-117', name: 'Heavy Duty Degreaser Gallon', category: 'Cleaning', supplier: 'CleanFlow Logistics', price: 17.25, eta: '2–4 days', stock: 53 },
  { id: 'p5', sku: 'MT-905', name: 'Commercial Door Closer', category: 'Maintenance', supplier: 'Midwest Supply Co.', price: 84.0, eta: '3–5 days', stock: 17 },
  { id: 'p6', sku: 'HV-208', name: 'Thermostat Smart Wi-Fi', category: 'HVAC', supplier: 'Electra Fulfillment', price: 119.99, eta: '2–3 days', stock: 26 },
  { id: 'p7', sku: 'PL-411', name: 'Wax Ring Kit', category: 'Plumbing', supplier: 'PlumbDirect 3PL', price: 6.75, eta: '1–2 days', stock: 140 },
  { id: 'p8', sku: 'CL-488', name: 'Microfiber Mop Kit', category: 'Cleaning', supplier: 'CleanFlow Logistics', price: 29.99, eta: '2–4 days', stock: 47 },
  { id: 'p9', sku: 'EL-510', name: 'GFCI Outlet White 10-Pack', category: 'Electrical', supplier: 'Electra Fulfillment', price: 54.25, eta: '1–3 days', stock: 31 }
];

const appState = loadState();
let deferredPrompt = null;

const els = {
  authView: document.getElementById('authView'),
  appView: document.getElementById('appView'),
  loginForm: document.getElementById('loginForm'),
  logoutBtn: document.getElementById('logoutBtn'),
  welcomeName: document.getElementById('welcomeName'),
  welcomeBusiness: document.getElementById('welcomeBusiness'),
  statOpenOrders: document.getElementById('statOpenOrders'),
  statIssueReports: document.getElementById('statIssueReports'),
  statLocations: document.getElementById('statLocations'),
  statCartCount: document.getElementById('statCartCount'),
  cartButtonCount: document.getElementById('cartButtonCount'),
  recentOrders: document.getElementById('recentOrders'),
  savedLocationsPreview: document.getElementById('savedLocationsPreview'),
  catalogGrid: document.getElementById('catalogGrid'),
  productSearch: document.getElementById('productSearch'),
  supplierFilter: document.getElementById('supplierFilter'),
  categoryFilter: document.getElementById('categoryFilter'),
  openCartBtn: document.getElementById('openCartBtn'),
  closeCartBtn: document.getElementById('closeCartBtn'),
  cartBackdrop: document.getElementById('cartBackdrop'),
  cartDrawer: document.getElementById('cartDrawer'),
  cartItems: document.getElementById('cartItems'),
  cartSummaryCount: document.getElementById('cartSummaryCount'),
  cartSummaryTotal: document.getElementById('cartSummaryTotal'),
  checkoutForm: document.getElementById('checkoutForm'),
  checkoutLocation: document.getElementById('checkoutLocation'),
  checkoutNeededBy: document.getElementById('checkoutNeededBy'),
  checkoutPriority: document.getElementById('checkoutPriority'),
  checkoutNotes: document.getElementById('checkoutNotes'),
  ordersList: document.getElementById('ordersList'),
  exportOrdersBtn: document.getElementById('exportOrdersBtn'),
  issueForm: document.getElementById('issueForm'),
  issueList: document.getElementById('issueList'),
  issuePhoto: document.getElementById('issuePhoto'),
  locationForm: document.getElementById('locationForm'),
  preferredSupplier: document.getElementById('preferredSupplier'),
  locationsList: document.getElementById('locationsList'),
  toast: document.getElementById('toast'),
  installBtn: document.getElementById('installBtn')
};

init();

function init() {
  bindEvents();
  seedDefaults();
  populateFilters();
  refreshUI();
}

function bindEvents() {
  els.loginForm.addEventListener('submit', handleLogin);
  els.logoutBtn.addEventListener('click', handleLogout);
  document.querySelectorAll('.tab-btn').forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));
  document.querySelectorAll('[data-jump]').forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.jump)));

  els.productSearch.addEventListener('input', renderCatalog);
  els.supplierFilter.addEventListener('change', renderCatalog);
  els.categoryFilter.addEventListener('change', renderCatalog);

  els.openCartBtn.addEventListener('click', () => setCartOpen(true));
  els.closeCartBtn.addEventListener('click', () => setCartOpen(false));
  els.cartBackdrop.addEventListener('click', () => setCartOpen(false));
  els.checkoutForm.addEventListener('submit', handleCheckout);
  els.issueForm.addEventListener('submit', handleIssueSubmit);
  els.locationForm.addEventListener('submit', handleLocationSubmit);
  els.exportOrdersBtn.addEventListener('click', exportOrders);

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    els.installBtn.classList.remove('hidden');
  });

  els.installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    els.installBtn.classList.add('hidden');
  });
}

function seedDefaults() {
  if (!appState.locations.length) {
    appState.locations.push({
      id: crypto.randomUUID(),
      name: 'Main Property',
      street: '123 Main St',
      city: 'Columbus',
      state: 'OH',
      zip: '43215',
      preferredSupplier: 'Midwest Supply Co.'
    });
    saveState();
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return {
      user: parsed.user || null,
      cart: Array.isArray(parsed.cart) ? parsed.cart : [],
      orders: Array.isArray(parsed.orders) ? parsed.orders : [],
      issues: Array.isArray(parsed.issues) ? parsed.issues : [],
      locations: Array.isArray(parsed.locations) ? parsed.locations : []
    };
  } catch {
    return defaultState();
  }
}

function defaultState() {
  return { user: null, cart: [], orders: [], issues: [], locations: [] };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
}

function refreshUI() {
  const isLoggedIn = Boolean(appState.user);
  els.authView.classList.toggle('active', !isLoggedIn);
  els.appView.classList.toggle('active', isLoggedIn);

  if (isLoggedIn) {
    els.welcomeName.textContent = appState.user.fullName;
    els.welcomeBusiness.textContent = `${appState.user.businessName} • ${appState.user.primaryLocation}`;
    updateStats();
    renderCatalog();
    renderCart();
    renderOrders();
    renderIssues();
    renderLocations();
    populateCheckoutLocations();
  }
}

function updateStats() {
  els.statOpenOrders.textContent = appState.orders.length;
  els.statIssueReports.textContent = appState.issues.length;
  els.statLocations.textContent = appState.locations.length;
  const cartCount = appState.cart.reduce((sum, item) => sum + item.quantity, 0);
  els.statCartCount.textContent = cartCount;
  els.cartButtonCount.textContent = cartCount;

  const recent = appState.orders.slice(0, 3);
  els.recentOrders.innerHTML = recent.length ? recent.map(order => orderPreview(order)).join('') : 'No orders yet.';
  const locations = appState.locations.slice(0, 3);
  els.savedLocationsPreview.innerHTML = locations.length ? locations.map(locationPreview).join('') : 'No saved locations yet.';
}

function populateFilters() {
  const suppliers = ['all', ...new Set(PRODUCT_CATALOG.map(p => p.supplier))];
  const categories = ['all', ...new Set(PRODUCT_CATALOG.map(p => p.category))];

  els.supplierFilter.innerHTML = suppliers.map(s => `<option value="${escapeHtml(s)}">${s === 'all' ? 'All Suppliers' : escapeHtml(s)}</option>`).join('');
  els.categoryFilter.innerHTML = categories.map(c => `<option value="${escapeHtml(c)}">${c === 'all' ? 'All Categories' : escapeHtml(c)}</option>`).join('');
  els.preferredSupplier.innerHTML = suppliers.filter(s => s !== 'all').map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');
}

function renderCatalog() {
  const query = els.productSearch.value.trim().toLowerCase();
  const supplier = els.supplierFilter.value;
  const category = els.categoryFilter.value;

  const filtered = PRODUCT_CATALOG.filter(product => {
    const searchMatch = !query || [product.sku, product.name, product.category, product.supplier].some(field => field.toLowerCase().includes(query));
    const supplierMatch = supplier === 'all' || product.supplier === supplier;
    const categoryMatch = category === 'all' || product.category === category;
    return searchMatch && supplierMatch && categoryMatch;
  });

  els.catalogGrid.innerHTML = filtered.length
    ? filtered.map(product => `
      <article class="product-card card">
        <div class="product-header">
          <div>
            <span class="badge">${escapeHtml(product.category)}</span>
            <h3>${escapeHtml(product.name)}</h3>
          </div>
          <strong class="price">${formatCurrency(product.price)}</strong>
        </div>
        <div class="small-meta">
          <span><strong>SKU:</strong> ${escapeHtml(product.sku)}</span>
          <span><strong>Supplier:</strong> ${escapeHtml(product.supplier)}</span>
        </div>
        <div class="meta-line">
          <span>ETA ${escapeHtml(product.eta)}</span>
          <span>${product.stock} in stock</span>
        </div>
        <div class="product-actions">
          <input id="qty-${product.id}" type="number" min="1" max="99" value="1" aria-label="Quantity for ${escapeHtml(product.name)}" />
          <button class="primary-btn compact" type="button" onclick="addToCart('${product.id}')">Add to Cart</button>
        </div>
      </article>
    `).join('')
    : '<p class="empty-state-inline">No products match that search.</p>';
}

window.addToCart = function addToCart(productId) {
  const qtyInput = document.getElementById(`qty-${productId}`);
  const quantity = Math.max(1, Number(qtyInput?.value || 1));
  const product = PRODUCT_CATALOG.find(item => item.id === productId);
  if (!product) return;

  const existing = appState.cart.find(item => item.productId === productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    appState.cart.push({ productId, quantity });
  }
  saveState();
  updateStats();
  renderCart();
  toast(`Added ${quantity} × ${product.name}`);
};

function renderCart() {
  const grouped = appState.cart.reduce((acc, line) => {
    const product = PRODUCT_CATALOG.find(item => item.id === line.productId);
    if (!product) return acc;
    if (!acc[product.supplier]) acc[product.supplier] = [];
    acc[product.supplier].push({ ...product, quantity: line.quantity, lineTotal: product.price * line.quantity });
    return acc;
  }, {});

  const suppliers = Object.entries(grouped);
  els.cartItems.innerHTML = suppliers.length ? suppliers.map(([supplier, items]) => `
    <section class="stack-list">
      <div class="supplier-group-head">
        <div>
          <strong>${escapeHtml(supplier)}</strong>
          <div class="muted">${items.length} product${items.length === 1 ? '' : 's'}</div>
        </div>
        <span class="badge">${formatCurrency(items.reduce((sum, item) => sum + item.lineTotal, 0))}</span>
      </div>
      ${items.map(item => `
        <article class="cart-item">
          <div class="cart-row">
            <div>
              <strong>${escapeHtml(item.name)}</strong>
              <div class="small-meta">
                <span>${escapeHtml(item.sku)}</span>
                <span>${formatCurrency(item.price)} each</span>
              </div>
            </div>
            <strong>${formatCurrency(item.lineTotal)}</strong>
          </div>
          <div class="cart-row" style="margin-top: 12px; align-items: center;">
            <div class="qty-control">
              <button type="button" onclick="changeCartQty('${item.id}', -1)">−</button>
              <span>${item.quantity}</span>
              <button type="button" onclick="changeCartQty('${item.id}', 1)">+</button>
            </div>
            <button class="ghost-btn compact" type="button" onclick="removeFromCart('${item.id}')">Remove</button>
          </div>
        </article>
      `).join('')}
    </section>
  `).join('') : 'Your cart is empty.';

  const count = appState.cart.reduce((sum, line) => sum + line.quantity, 0);
  const total = appState.cart.reduce((sum, line) => {
    const product = PRODUCT_CATALOG.find(item => item.id === line.productId);
    return sum + ((product?.price || 0) * line.quantity);
  }, 0);
  els.cartSummaryCount.textContent = count;
  els.cartSummaryTotal.textContent = formatCurrency(total);
  populateCheckoutLocations();
}

window.changeCartQty = function changeCartQty(productId, delta) {
  const item = appState.cart.find(line => line.productId === productId);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) {
    appState.cart = appState.cart.filter(line => line.productId !== productId);
  }
  saveState();
  updateStats();
  renderCart();
};

window.removeFromCart = function removeFromCart(productId) {
  appState.cart = appState.cart.filter(line => line.productId !== productId);
  saveState();
  updateStats();
  renderCart();
  toast('Removed from cart');
};

function populateCheckoutLocations() {
  const options = appState.locations.length
    ? appState.locations.map(loc => `<option value="${escapeHtml(loc.id)}">${escapeHtml(`${loc.name} • ${loc.city}, ${loc.state}`)}</option>`).join('')
    : '<option value="">Add a location first</option>';
  els.checkoutLocation.innerHTML = options;
}

function handleLogin(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  appState.user = {
    fullName: String(formData.get('fullName') || '').trim(),
    businessName: String(formData.get('businessName') || '').trim(),
    email: String(formData.get('email') || '').trim(),
    primaryLocation: String(formData.get('primaryLocation') || '').trim()
  };
  saveState();
  refreshUI();
  toast('Welcome to PropertyOps Mobile');
}

function handleLogout() {
  appState.user = null;
  saveState();
  refreshUI();
}

function handleCheckout(event) {
  event.preventDefault();
  if (!appState.cart.length) {
    toast('Your cart is empty');
    return;
  }

  const location = appState.locations.find(loc => loc.id === els.checkoutLocation.value);
  if (!location) {
    toast('Add or choose a delivery location');
    return;
  }

  const groups = appState.cart.reduce((acc, line) => {
    const product = PRODUCT_CATALOG.find(item => item.id === line.productId);
    if (!product) return acc;
    if (!acc[product.supplier]) acc[product.supplier] = [];
    acc[product.supplier].push({
      productId: product.id,
      sku: product.sku,
      name: product.name,
      price: product.price,
      quantity: line.quantity,
      supplier: product.supplier
    });
    return acc;
  }, {});

  const neededBy = els.checkoutNeededBy.value;
  const priority = els.checkoutPriority.value;
  const notes = els.checkoutNotes.value.trim();

  Object.entries(groups).forEach(([supplier, items]) => {
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const order = {
      id: makeOrderId(),
      createdAt: new Date().toISOString(),
      supplier,
      items,
      neededBy,
      priority,
      notes,
      location,
      total,
      status: STATUS_FLOW[0]
    };
    appState.orders.unshift(order);
  });

  appState.cart = [];
  saveState();
  updateStats();
  renderCart();
  renderOrders();
  setCartOpen(false);
  event.currentTarget.reset();
  toast('Order submitted successfully');
}

function renderOrders() {
  const orders = appState.orders.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  els.ordersList.innerHTML = orders.length ? orders.map(order => `
    <article class="order-card">
      <div class="order-top">
        <div>
          <strong>${escapeHtml(order.id)}</strong>
          <div class="small-meta">
            <span>${escapeHtml(order.supplier)}</span>
            <span>${formatDate(order.createdAt)}</span>
          </div>
        </div>
        <div>
          <span class="status-pill ${statusClass(order.status)}">${escapeHtml(order.status)}</span>
        </div>
      </div>
      <div class="order-meta">
        <span><strong>Deliver to:</strong> ${escapeHtml(order.location.name)}, ${escapeHtml(order.location.city)}</span>
        <span><strong>Needed by:</strong> ${escapeHtml(order.neededBy || '—')}</span>
        <span><strong>Priority:</strong> ${escapeHtml(order.priority)}</span>
        <span><strong>Total:</strong> ${formatCurrency(order.total)}</span>
      </div>
      <div class="small-meta">${order.items.map(item => `${item.quantity} × ${escapeHtml(item.name)}`).join(' • ')}</div>
      <div class="cart-row" style="margin-top: 12px; align-items: center;">
        <button class="ghost-btn compact" type="button" onclick="advanceOrderStatus('${order.id}')">Advance Status</button>
        <button class="ghost-btn compact" type="button" onclick="duplicateOrder('${order.id}')">Reorder</button>
      </div>
    </article>
  `).join('') : 'No orders submitted yet.';
}

window.advanceOrderStatus = function advanceOrderStatus(orderId) {
  const order = appState.orders.find(item => item.id === orderId);
  if (!order) return;
  const currentIndex = STATUS_FLOW.indexOf(order.status);
  order.status = STATUS_FLOW[Math.min(currentIndex + 1, STATUS_FLOW.length - 1)];
  saveState();
  renderOrders();
  toast(`Order ${order.id} moved to ${order.status}`);
};

window.duplicateOrder = function duplicateOrder(orderId) {
  const order = appState.orders.find(item => item.id === orderId);
  if (!order) return;
  order.items.forEach(item => {
    const existing = appState.cart.find(line => line.productId === item.productId);
    if (existing) existing.quantity += item.quantity;
    else appState.cart.push({ productId: item.productId, quantity: item.quantity });
  });
  saveState();
  updateStats();
  renderCart();
  switchTab('catalog');
  setCartOpen(true);
  toast('Order copied to cart');
};

async function handleIssueSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const photoInput = els.issuePhoto;
  let photoDataUrl = '';
  const file = photoInput.files?.[0];
  if (file) photoDataUrl = await fileToDataUrl(file);

  appState.issues.unshift({
    id: `IR-${Date.now().toString().slice(-6)}`,
    createdAt: new Date().toISOString(),
    orderNumber: String(formData.get('orderNumber') || '').trim(),
    propertyName: String(formData.get('propertyName') || '').trim(),
    sku: String(formData.get('sku') || '').trim(),
    productName: String(formData.get('productName') || '').trim(),
    issueType: String(formData.get('issueType') || '').trim(),
    description: String(formData.get('description') || '').trim(),
    photoDataUrl
  });

  saveState();
  updateStats();
  renderIssues();
  form.reset();
  toast('Issue report saved');
}

function renderIssues() {
  els.issueList.innerHTML = appState.issues.length ? appState.issues.map(issue => `
    <article class="issue-card">
      <div class="issue-top">
        <div>
          <strong>${escapeHtml(issue.id)}</strong>
          <div class="small-meta">
            <span>${escapeHtml(issue.issueType)}</span>
            <span>${formatDate(issue.createdAt)}</span>
          </div>
        </div>
        <span class="status-pill status-reported">Reported</span>
      </div>
      <div class="order-meta">
        <span><strong>Order:</strong> ${escapeHtml(issue.orderNumber)}</span>
        <span><strong>Property:</strong> ${escapeHtml(issue.propertyName)}</span>
        <span><strong>SKU:</strong> ${escapeHtml(issue.sku)}</span>
      </div>
      <p>${escapeHtml(issue.description || 'No additional notes provided.')}</p>
      ${issue.photoDataUrl ? `<img src="${issue.photoDataUrl}" alt="Issue attachment" style="width:100%; max-width:220px; border-radius: 14px; border:1px solid var(--border);">` : ''}
    </article>
  `).join('') : 'No issue reports yet.';
}

function handleLocationSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  appState.locations.unshift({
    id: crypto.randomUUID(),
    name: String(formData.get('name') || '').trim(),
    street: String(formData.get('street') || '').trim(),
    city: String(formData.get('city') || '').trim(),
    state: String(formData.get('state') || '').trim().toUpperCase(),
    zip: String(formData.get('zip') || '').trim(),
    preferredSupplier: String(formData.get('preferredSupplier') || '').trim()
  });
  saveState();
  updateStats();
  renderLocations();
  populateCheckoutLocations();
  event.currentTarget.reset();
  toast('Location saved');
}

function renderLocations() {
  els.locationsList.innerHTML = appState.locations.length ? appState.locations.map(location => `
    <article class="location-card">
      <div class="location-top">
        <div>
          <strong>${escapeHtml(location.name)}</strong>
          <div class="small-meta">
            <span>${escapeHtml(location.city)}, ${escapeHtml(location.state)} ${escapeHtml(location.zip)}</span>
          </div>
        </div>
        <span class="badge">${escapeHtml(location.preferredSupplier)}</span>
      </div>
      <div class="small-meta">${escapeHtml(location.street)}</div>
      <div style="margin-top: 12px;">
        <button class="ghost-btn compact" type="button" onclick="deleteLocation('${location.id}')">Delete</button>
      </div>
    </article>
  `).join('') : 'No saved locations yet.';
}

window.deleteLocation = function deleteLocation(locationId) {
  appState.locations = appState.locations.filter(location => location.id !== locationId);
  saveState();
  updateStats();
  renderLocations();
  populateCheckoutLocations();
  toast('Location deleted');
};

function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabName));
  document.querySelectorAll('.tab-view').forEach(view => view.classList.toggle('active', view.id === `${tabName}Tab`));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setCartOpen(isOpen) {
  els.cartDrawer.classList.toggle('open', isOpen);
  els.cartDrawer.setAttribute('aria-hidden', String(!isOpen));
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

function formatDate(isoString) {
  return new Date(isoString).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function statusClass(status) {
  return {
    'Processing': 'status-processing',
    'In Transit': 'status-in-transit',
    'Delivered': 'status-delivered'
  }[status] || 'status-processing';
}

function makeOrderId() {
  return `PO-${Math.floor(1000 + Math.random() * 9000)}`;
}

function toast(message) {
  els.toast.textContent = message;
  els.toast.classList.add('show');
  window.clearTimeout(toast._timer);
  toast._timer = window.setTimeout(() => els.toast.classList.remove('show'), 2400);
}

function orderPreview(order) {
  return `
    <article class="order-card">
      <div class="order-top">
        <div>
          <strong>${escapeHtml(order.id)}</strong>
          <div class="small-meta">
            <span>${escapeHtml(order.supplier)}</span>
            <span>${formatDate(order.createdAt)}</span>
          </div>
        </div>
        <span class="status-pill ${statusClass(order.status)}">${escapeHtml(order.status)}</span>
      </div>
    </article>
  `;
}

function locationPreview(location) {
  return `
    <article class="location-card">
      <strong>${escapeHtml(location.name)}</strong>
      <div class="small-meta">${escapeHtml(location.city)}, ${escapeHtml(location.state)} ${escapeHtml(location.zip)}</div>
    </article>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function exportOrders() {
  if (!appState.orders.length) {
    toast('No orders to export');
    return;
  }
  const rows = [
    ['Order ID', 'Created At', 'Supplier', 'Status', 'Location', 'Needed By', 'Priority', 'Items', 'Total']
  ];
  appState.orders.forEach(order => {
    rows.push([
      order.id,
      order.createdAt,
      order.supplier,
      order.status,
      `${order.location.name} - ${order.location.city}, ${order.location.state}`,
      order.neededBy,
      order.priority,
      order.items.map(item => `${item.quantity}x ${item.name}`).join(' | '),
      order.total
    ]);
  });
  const csv = rows.map(row => row.map(csvEscape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'propertyops-orders.csv';
  link.click();
  URL.revokeObjectURL(url);
  toast('Orders exported');
}

function csvEscape(value) {
  const str = String(value ?? '');
  if (/[,"\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
