/* EMDI Travel & Passport Connect registration prototype.
   This static project has no configured backend or Supabase connection, so submissions are
   stored in this browser's localStorage for functional demonstration. Replace the adapter
   with a secured server/Supabase implementation before public launch. */
(function () {
  'use strict';
  var PROVIDER_KEY = 'emdiTravelConnect.providers.v3';
  var ADMIN_SESSION_KEY = 'emdiTravelConnect.adminSession';
  var APPOINTMENT_KEY = 'emdiTravelConnect.appointmentRequests.v1';
  var ADMIN_ACCESS_CODE = 'EMDI-ADMIN';
  var categories = ['Passport Agents', 'Visa Consultants', 'Travel Agencies', 'Accommodation Providers', 'Flight Booking & Ticketing Assistance', 'Airport Transfers & Transport', 'Tourism & Tours'];
  var provinces = ['National Capital District', 'Central', 'Gulf', 'Milne Bay', 'Oro', 'Southern Highlands', 'Hela', 'Enga', 'Western Highlands', 'Jiwaka', 'Chimbu', 'Eastern Highlands', 'Morobe', 'Madang', 'East Sepik', 'West Sepik (Sandaun)', 'Manus', 'New Ireland', 'East New Britain', 'West New Britain', 'Autonomous Region of Bougainville', 'Other / outside PNG'];

  function samples() {
    return [
      { id: 'sample-passport-1', businessName: 'Sunbird Passport Guidance', category: 'Passport Agents', contactName: 'Miriam Kila', phone: '+675 7000 1001', email: 'hello@sunbirdpassport.example', location: 'Waigani, National Capital District', services: 'Passport information, document checklist guidance, appointment preparation', description: 'Independent travel-document information and checklist support for people preparing to contact the relevant authorities.', status: 'Approved', subscription: 'Active Subscription', plan: 'Professional', logo: '', sample: true, createdAt: '2026-10-02T09:00:00.000Z' },
      { id: 'sample-visa-1', businessName: 'Highlands Visa Support', category: 'Visa Consultants', contactName: 'Peter Wama', phone: '+675 7000 1002', email: 'info@highlandsvisa.example', location: 'Goroka, Eastern Highlands', services: 'Visa consultation, travel document review, general visitor visa guidance', description: 'A fictional independent consulting service helping travellers understand general visa information and prepare questions for official sources.', status: 'Approved', subscription: 'Active Subscription', plan: 'Premium', logo: '', sample: true, createdAt: '2026-10-04T09:00:00.000Z' },
      { id: 'sample-travel-1', businessName: 'PNG Footprints Travel', category: 'Travel Agencies', contactName: 'Lani Kora', phone: '+675 7000 1003', email: 'trips@pngfootprints.example', location: 'Lae, Morobe Province', services: 'Travel planning, itinerary advice, domestic and regional trip enquiries', description: 'A demonstration travel agency profile showcasing trip-planning support and travel enquiry options in Papua New Guinea.', status: 'Approved', subscription: 'Active Subscription', plan: 'Basic', logo: '', sample: true, createdAt: '2026-10-06T09:00:00.000Z' },
      { id: 'sample-stay-1', businessName: 'Tufi Harbour Stay', category: 'Accommodation Providers', contactName: 'Jonah Paliau', phone: '+675 7000 1004', email: 'stay@tufiharbour.example', location: 'Tufi, Oro Province', services: 'Guest rooms, meals, local area information', description: 'A fictional small accommodation provider profile featuring a welcoming stay on Papua New Guinea’s northern coast.', status: 'Approved', subscription: 'Expired Subscription', plan: 'Basic', logo: '', sample: true, createdAt: '2026-10-08T09:00:00.000Z' },
      { id: 'sample-pending-1', businessName: 'Port Moresby Travel Desk', category: 'Passport Agents', contactName: 'Ruth Aihi', phone: '+675 7000 1005', email: 'desk@pmtravel.example', location: 'Boroko, National Capital District', services: 'Travel information and passport document checklist support', description: 'Fictional sample application awaiting administrator review. Does not process official passport applications.', status: 'Pending', subscription: 'Free Trial', plan: 'Basic', logo: '', sample: true, createdAt: '2026-10-10T09:00:00.000Z' }
    ];
  }
  function read(key, fallback) { try { var raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch (e) { return fallback; } }
  function save(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; } }
  var records = read(PROVIDER_KEY, samples());
  var storageAvailable = save(PROVIDER_KEY, records);
  function byId(id) { return document.getElementById(id); }
  var ICONS = {
    pin: '<path d="M12 21s-6.5-5.6-6.5-11A6.5 6.5 0 0 1 12 3.5 6.5 6.5 0 0 1 18.5 10c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>'
  };
  function icon(name) { return '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + ICONS[name] + '</svg>'; }
  function serviceTags(text) { return String(text || '').split(',').map(function (t) { return t.trim(); }).filter(Boolean).slice(0, 4).map(function (t) { return '<span class="service-tag">' + escapeHTML(t) + '</span>'; }).join(''); }
  function escapeHTML(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function statusClass(status) { return String(status || '').toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, ''); }
  function findProvider(id) { return records.find(function (item) { return item.id === id; }); }
  function formatDate(value) { if (!value) return '—'; var date = new Date(value); return isNaN(date.getTime()) ? '—' : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }); }
  function showMessage(element, text, error) { if (!element) return; element.textContent = text; element.hidden = false; element.classList.toggle('message-error', Boolean(error)); }
  function logoMarkup(provider, extraClass) { if (provider.logo && /^data:image\/(png|jpeg|webp);base64,/i.test(provider.logo)) return '<img class="' + extraClass + '" src="' + provider.logo + '" alt="' + escapeHTML(provider.businessName || 'Provider') + ' logo">'; var initials = (provider.businessName || 'EM').split(/\s+/).slice(0, 2).map(function (word) { return word.charAt(0); }).join('').toUpperCase(); return '<span class="' + extraClass + ' logo-placeholder">' + escapeHTML(initials || 'EM') + '</span>'; }
  function persistAll() { storageAvailable = save(PROVIDER_KEY, records); return storageAvailable; }
  var supabaseReady = window.EMDI_SUPABASE_READY || Promise.resolve(null);
  var insights = {};
  function planOf(p) { return p.plan || 'Basic'; }
  function insightText(p) { var i = insights[p.id]; return planOf(p) === 'Premium' && i ? 'Performance insights: ' + i.profile_view + ' profile views · ' + i.call + ' calls · ' + i.email + ' emails' : ''; }
  function track(id, event) { if (!/^[0-9a-f-]{36}$/i.test(String(id || ''))) return; supabaseReady.then(function (db) { if (db && db.logProviderEvent) db.logProviderEvent(id, event); }); }
  function galleryMarkup(p) { var pics = (planOf(p) !== 'Basic' && p.gallery || []).filter(function (u) { return /^data:image\/(png|jpeg|webp);base64,/i.test(u); }); return pics.length ? '<div class="provider-gallery" aria-label="Photo gallery">' + pics.map(function (u, n) { return '<img src="' + u + '" alt="' + escapeHTML(p.businessName) + ' photo ' + (n + 1) + '" loading="lazy">'; }).join('') + '</div>' : ''; }
  function resizeImage(file) { return new Promise(function (resolve, reject) { if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return reject(new Error('Gallery photos must be PNG, JPEG or WebP images.')); if (file.size > 4 * 1024 * 1024) return reject(new Error('Each gallery photo must be 4 MB or smaller.')); var img = new Image(), url = URL.createObjectURL(file); img.onload = function () { var scale = Math.min(1, 900 / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); resolve(c.toDataURL('image/jpeg', 0.72)); }; img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('A gallery photo could not be read. Please try another image.')); }; img.src = url; }); }
  function isAdmin() { return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true'; }

  var menuButton = document.querySelector('.menu-toggle'), nav = document.querySelector('.primary-nav');
  if (menuButton && nav) { menuButton.addEventListener('click', function () { var open = menuButton.getAttribute('aria-expanded') === 'true'; menuButton.setAttribute('aria-expanded', String(!open)); nav.classList.toggle('open', !open); }); nav.querySelectorAll('a').forEach(function (link) { link.addEventListener('click', function () { nav.classList.remove('open'); menuButton.setAttribute('aria-expanded', 'false'); }); }); }


  var description = document.querySelector('#provider-form textarea[name="description"]'), count = document.querySelector('.char-count');
  if (description && count) description.addEventListener('input', function () { count.textContent = description.value.length + ' / 500'; });
  var providerForm = byId('provider-form');
  function readLogo(file) { return new Promise(function (resolve, reject) { if (!file) return resolve(''); if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return reject(new Error('Please choose a PNG, JPEG or WebP logo image.')); if (file.size > 1024 * 1024) return reject(new Error('Logo images must be 1 MB or smaller.')); var reader = new FileReader(); reader.onload = function () { resolve(String(reader.result)); }; reader.onerror = function () { reject(new Error('The logo could not be read. Please try another image.')); }; reader.readAsDataURL(file); }); }
  if (providerForm) providerForm.addEventListener('submit', async function (event) {
    event.preventDefault(); if (!providerForm.reportValidity()) return;
    var f = providerForm.elements;
    var notice = providerForm.querySelector('.form-success');
    try {
      var logo = await readLogo(f.logo && f.logo.files[0]);
      var plan = f.plan ? f.plan.value : 'Basic', picks = f.gallery ? Array.prototype.slice.call(f.gallery.files) : [], gallery = [];
      if (picks.length && plan === 'Basic') throw new Error('Photo galleries are available on the Professional and Premium plans. Choose a higher plan or remove the photos.');
      if (picks.length > 4) throw new Error('Please choose up to 4 gallery photos.');
      for (var n = 0; n < picks.length; n++) gallery.push(await resizeImage(picks[n]));
      var provider = { id: 'provider-' + Date.now().toString(36), businessName: f.businessName.value.trim(), category: f.category.value, contactName: f.contactName.value.trim(), phone: f.phone.value.trim(), email: f.email.value.trim(), location: f.location.value.trim(), services: f.services.value.trim(), description: f.description.value.trim(), logo: logo, plan: plan, gallery: gallery, status: 'Pending', subscription: 'Free Trial', sample: false, createdAt: new Date().toISOString() };
      try { var db = await supabaseReady; if (db) provider = await db.createProviderApplication(provider); } catch (error) { showMessage(notice, error.message, true); return; }
    records.unshift(provider); persistAll(); providerForm.reset(); if (count) count.textContent = '0 / 500';
    showMessage(notice, 'Application received for ' + provider.businessName + '. It is marked Pending for administrator review.');
    renderAll(provider.id);
    } catch (error) { showMessage(notice, error.message, true); }
  });

  function providerProvince(provider) {
    var location = String(provider.location || '').toLowerCase();
    var known = ['National Capital District', 'Central', 'Eastern Highlands', 'Morobe', 'Oro', 'East New Britain', 'Western Highlands', 'Madang'];
    return known.find(function (province) { return location.indexOf(province.toLowerCase()) !== -1; }) || (provider.location || 'Other / outside PNG');
  }
  function renderDirectory() {
    var container = byId('public-directory');
    if (!container) return;
    var search = (byId('directory-search') ? byId('directory-search').value : '').trim().toLowerCase();
    var category = byId('directory-filter') ? byId('directory-filter').value : '';
    var location = byId('directory-location') ? byId('directory-location').value : '';
    var sort = byId('directory-sort') ? byId('directory-sort').value : 'newest';
    var approved = records.filter(function (p) {
      if (p.status !== 'Approved' || p.subscription !== 'Active Subscription') return false;
      if (category && p.category !== category) return false;
      if (location && providerProvince(p) !== location) return false;
      if (search) {
        var haystack = [p.businessName, p.category, p.location, p.services, p.description].join(' ').toLowerCase();
        if (haystack.indexOf(search) === -1) return false;
      }
      return true;
    });
    approved.sort(function (a, b) {
      var pa = planOf(a) === 'Premium', pb = planOf(b) === 'Premium'; if (pa !== pb) return pa ? -1 : 1;
      if (sort === 'name') return a.businessName.localeCompare(b.businessName);
      if (sort === 'category') return a.category.localeCompare(b.category) || a.businessName.localeCompare(b.businessName);
      if (sort === 'location') return a.location.localeCompare(b.location) || a.businessName.localeCompare(b.businessName);
      return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
    });
    var count = byId('directory-count');
    if (count) count.textContent = approved.length + ' approved ' + (approved.length === 1 ? 'provider' : 'providers');
    container.innerHTML = approved.length ? approved.map(function (p) { var tel = escapeHTML(p.phone.replace(/[^+\d]/g, '')); return '<article class="public-provider-card' + (planOf(p) === 'Premium' ? ' is-featured' : '') + '" data-provider-id="' + escapeHTML(p.id) + '" tabindex="0" role="button" aria-label="View profile for ' + escapeHTML(p.businessName) + '"><div class="provider-card-top">' + logoMarkup(p, 'provider-logo public-logo') + '<div class="provider-card-heading"><span class="category-kicker">' + escapeHTML(p.category) + '</span>' + (planOf(p) === 'Premium' ? '<span class="featured-badge">Featured</span>' : '') + '<h4>' + escapeHTML(p.businessName) + '</h4></div><span class="verified-badge" title="Approved by EMDI">' + icon('check') + 'Approved</span></div><div class="public-provider-info"><p class="provider-location">' + icon('pin') + '<span>' + escapeHTML(p.location) + '</span></p><p class="provider-description">' + escapeHTML(p.description) + '</p><div class="provider-services" aria-label="Services">' + serviceTags(p.services) + '</div><div class="provider-contact"><button type="button" class="provider-detail-trigger" data-provider-id="' + escapeHTML(p.id) + '">View profile ↗</button><a data-track="call" href="tel:' + tel + '">' + icon('phone') + 'Call</a><a data-track="email" href="mailto:' + escapeHTML(p.email) + '">' + icon('mail') + 'Email</a></div></div></article>'; }).join('') : '<p class="empty-state">No approved providers match these filters. Try a broader search or clear the filters.</p>';
    document.querySelectorAll('.map-region').forEach(function (button) { button.classList.toggle('active', button.dataset.province === location); });
    document.querySelectorAll('.category-tile[data-category]').forEach(function (tile) { tile.classList.toggle('active', tile.getAttribute('data-category') === category); });
  }
  ['directory-search', 'directory-filter', 'directory-location', 'directory-sort'].forEach(function (id) { if (byId(id)) byId(id).addEventListener(id === 'directory-search' ? 'input' : 'change', renderDirectory); });
  if (byId('directory-clear')) byId('directory-clear').addEventListener('click', function () { ['directory-search', 'directory-filter', 'directory-location', 'directory-sort'].forEach(function (id) { if (byId(id)) byId(id).value = id === 'directory-sort' ? 'newest' : ''; }); renderDirectory(); });
  document.querySelectorAll('.map-region').forEach(function (button) { button.addEventListener('click', function () { var location = byId('directory-location'); if (location) location.value = location.value === button.dataset.province ? '' : button.dataset.province; renderDirectory(); }); });
  document.querySelectorAll('[data-category]').forEach(function (link) { link.addEventListener('click', function () { var filter = byId('directory-filter'); if (filter) filter.value = link.getAttribute('data-category'); renderDirectory(); }); });

  function openProviderDialog(id) {
    var dialog = byId('provider-dialog'), content = byId('provider-dialog-content'), p = findProvider(id);
    if (!dialog || !content || !p || p.status !== 'Approved') return;
    content.innerHTML = '<div class="provider-dialog-head">' + logoMarkup(p, 'provider-logo provider-dialog-logo') + '<div><p class="eyebrow">' + escapeHTML(p.category) + '</p><h2 id="provider-dialog-title">' + escapeHTML(p.businessName) + '</h2><p class="provider-dialog-location">' + escapeHTML(p.location) + '</p></div></div>' +
      '<div class="provider-dialog-body"><p class="provider-dialog-description">' + escapeHTML(p.description) + '</p>' + galleryMarkup(p) + '<div class="provider-dialog-details"><div><span>Services offered</span><strong>' + escapeHTML(p.services) + '</strong></div><div><span>Contact person</span><strong>' + escapeHTML(p.contactName || 'Provider contact') + '</strong></div></div><div class="provider-dialog-actions"><a class="button button-dark" data-track="call" href="tel:' + escapeHTML(p.phone.replace(/[^+\d]/g, '')) + '">' + icon('phone') + 'Call provider</a><a class="button button-outline" data-track="email" href="mailto:' + escapeHTML(p.email) + '">' + icon('mail') + 'Email provider</a></div><div class="appointment-request"><div class="appointment-heading"><p class="eyebrow">APPOINTMENT REQUEST</p><h3>Request a time to connect</h3><p>This sends a request for the provider to confirm. No payment or sensitive documents are required.</p></div><form class="appointment-form" data-provider-id="' + escapeHTML(p.id) + '"><div class="appointment-fields"><label>Preferred date *<input name="appointmentDate" type="date" min="' + new Date().toISOString().slice(0, 10) + '" required></label><label>Preferred time<select name="preferredTime" required><option value="">Choose a time</option><option>Morning (8am–12pm)</option><option>Afternoon (12pm–4pm)</option><option>Evening (4pm–6pm)</option></select></label><label>Your name *<input name="requestName" type="text" autocomplete="name" required></label><label>Email address *<input name="requestEmail" type="email" autocomplete="email" required></label><label>Mobile number *<input name="requestPhone" type="tel" autocomplete="tel" required></label><label class="appointment-full">What would you like help with? *<textarea name="requestNote" rows="3" maxlength="500" required></textarea></label></div><button type="submit" class="button">Send appointment request ↗</button><p class="appointment-note" aria-live="polite">Your request is saved locally in this demonstration.</p><p class="inline-message appointment-success" role="status" hidden></p></form></div></div>';
    dialog.dataset.providerId = p.id; track(p.id, 'profile_view');
    if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');
  }
  document.addEventListener('click', function (event) { var a = event.target.closest('a[data-track]'); if (!a) return; var holder = a.closest('[data-provider-id]'), dialog = byId('provider-dialog'); track(holder ? holder.dataset.providerId : dialog && dialog.dataset.providerId, a.dataset.track); });
  function closeProviderDialog() { var dialog = byId('provider-dialog'); if (!dialog) return; if (typeof dialog.close === 'function') dialog.close(); else dialog.removeAttribute('open'); }
  async function saveAppointmentRequest(form) {
    var requests = read(APPOINTMENT_KEY, []), f = form.elements, provider = findProvider(form.dataset.providerId);
    if (!provider) return null;
    var request = { id: 'appointment-' + Date.now().toString(36), providerId: provider.id, providerName: provider.businessName, appointmentDate: f.appointmentDate.value, preferredTime: f.preferredTime.value, requestName: f.requestName.value.trim(), requestEmail: f.requestEmail.value.trim(), requestPhone: f.requestPhone.value.trim(), requestNote: f.requestNote.value.trim(), status: 'Pending', createdAt: new Date().toISOString() };
    requests.unshift(request);
    try { var db = await supabaseReady; if (db) { await db.createAppointmentRequest(request); } else { localStorage.setItem(APPOINTMENT_KEY, JSON.stringify(requests)); } } catch (e) { return null; }
    return request;
  }
  document.addEventListener('submit', async function (event) {
    var form = event.target.closest('.appointment-form'); if (!form) return; event.preventDefault();
    if (!form.reportValidity()) return;
    var request = await saveAppointmentRequest(form), notice = form.querySelector('.appointment-success');
    if (!request) { showMessage(notice, 'This request could not be saved in the browser. Please use the provider contact buttons instead.', true); return; }
    showMessage(notice, 'Request received for ' + request.appointmentDate + ' (' + request.preferredTime + '). The provider can now confirm availability.');
    form.reset();
  });

  if (byId('public-directory')) byId('public-directory').addEventListener('click', function (event) {
    if (event.target.closest('a,button')) { var trigger = event.target.closest('[data-provider-id]'); if (trigger && event.target.closest('.provider-detail-trigger')) openProviderDialog(trigger.dataset.providerId); return; }
    var card = event.target.closest('[data-provider-id]'); if (card) openProviderDialog(card.dataset.providerId);
  });
  if (byId('public-directory')) byId('public-directory').addEventListener('keydown', function (event) { var card = event.target.closest('[data-provider-id]'); if (card && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); openProviderDialog(card.dataset.providerId); } });
  if (document.querySelector('.provider-dialog-close')) document.querySelector('.provider-dialog-close').addEventListener('click', closeProviderDialog);
  if (byId('provider-dialog')) byId('provider-dialog').addEventListener('click', function (event) { if (event.target === this) closeProviderDialog(); });
  document.addEventListener('keydown', function (event) { if (event.key === 'Escape') closeProviderDialog(); });
  function refreshDashboardOptions(selectedId) { var select = byId('dashboard-provider'); if (!select) return; var current = selectedId || select.value; select.innerHTML = '<option value="">Choose a provider</option>' + records.map(function (p) { return '<option value="' + escapeHTML(p.id) + '">' + escapeHTML(p.businessName) + ' — ' + escapeHTML(p.email) + '</option>'; }).join(''); if (current && findProvider(current)) select.value = current; }
  function renderDashboard(id) { var form = byId('dashboard-form'), empty = byId('dashboard-empty'), p = findProvider(id || (byId('dashboard-provider') && byId('dashboard-provider').value)); if (!form || !empty) return; if (!p) { form.hidden = true; empty.hidden = false; return; } empty.hidden = true; form.hidden = false; form.dataset.providerId = p.id; ['contactName', 'phone', 'email', 'location', 'services', 'description'].forEach(function (field) { form.elements[field].value = p[field] || ''; }); byId('dashboard-name').textContent = p.businessName; byId('dashboard-status').textContent = p.status; byId('dashboard-status').className = 'status-chip status-' + statusClass(p.status); byId('dashboard-subscription').textContent = planOf(p) + ' plan · ' + (p.subscription || 'Free Trial'); var ins = byId('dashboard-insights'); if (ins) { var t = insightText(p); ins.textContent = t; ins.hidden = !t; } }
  if (byId('dashboard-provider')) byId('dashboard-provider').addEventListener('change', function () { renderDashboard(this.value); });
  if (byId('dashboard-form')) byId('dashboard-form').addEventListener('submit', function (event) { event.preventDefault(); var form = event.currentTarget; if (!form.reportValidity()) return; var p = findProvider(form.dataset.providerId); if (!p) return; ['contactName', 'phone', 'email', 'location', 'services', 'description'].forEach(function (field) { p[field] = form.elements[field].value.trim(); }); persistAll(); renderAll(p.id); showMessage(byId('dashboard-message'), 'Profile changes saved in this browser.'); });

  function renderAdmin() { var list = byId('admin-list'), summary = byId('admin-summary'); if (!list || !summary) return; var counts = { Pending: 0, Approved: 0, Rejected: 0, Suspended: 0 }; records.forEach(function (p) { if (counts[p.status] !== undefined) counts[p.status]++; }); summary.innerHTML = Object.keys(counts).map(function (s) { return '<span><strong>' + counts[s] + '</strong> ' + s + '</span>'; }).join(''); list.innerHTML = records.length ? records.map(function (p) { var actions = p.status === 'Pending' ? '<button type="button" class="admin-action approve-action" data-action="approve" data-id="' + escapeHTML(p.id) + '">Approve</button><button type="button" class="admin-action reject-action" data-action="reject" data-id="' + escapeHTML(p.id) + '">Reject</button>' : p.status === 'Approved' ? '<button type="button" class="admin-action suspend-action" data-action="suspend" data-id="' + escapeHTML(p.id) + '">Suspend</button>' : p.status === 'Suspended' ? '<button type="button" class="admin-action approve-action" data-action="restore" data-id="' + escapeHTML(p.id) + '">Restore approval</button>' : ''; return '<article class="admin-provider"><div class="admin-provider-main">' + logoMarkup(p, 'provider-logo admin-logo') + '<div><h4>' + escapeHTML(p.businessName) + '</h4><p>' + escapeHTML(p.category) + ' · ' + escapeHTML(p.location) + ' · ' + escapeHTML(planOf(p)) + ' plan</p><a href="mailto:' + escapeHTML(p.email) + '">' + escapeHTML(p.email) + '</a><small class="admin-date">Registered ' + escapeHTML(formatDate(p.createdAt)) + '</small>' + (insightText(p) ? '<small class="admin-date">' + escapeHTML(insightText(p)) + '</small>' : '') + '</div></div><div class="admin-meta"><span class="status-chip status-' + statusClass(p.status) + '">' + escapeHTML(p.status) + '</span></div><div class="admin-actions">' + actions + '<button type="button" class="admin-action edit-action" data-action="edit" data-id="' + escapeHTML(p.id) + '">Edit</button></div></article>'; }).join('') : '<p class="empty-state">No business applications yet.</p>'; }

  async function loadAdminData() { var db = await supabaseReady; if (!db) throw new Error('Supabase is not available.'); records = await db.listProviderApplications(); save(PROVIDER_KEY, records); insights = {}; (db.listProviderEvents ? await db.listProviderEvents() : []).forEach(function (e) { var i = insights[e.provider_id] = insights[e.provider_id] || { profile_view: 0, call: 0, email: 0 }; if (i[e.event] !== undefined) i[e.event]++; }); }
  function setAdminView() { var gate = byId('admin-gate'), content = byId('admin-content'), label = byId('admin-access-state'); if (!gate || !content) return; var active = isAdmin(); gate.hidden = active; content.hidden = !active; if (label) label.textContent = active ? 'Admin session active' : 'Supabase admin sign-in required'; if (active) renderAdmin(); }
  var loginForm = byId('admin-login-form'); if (loginForm) loginForm.addEventListener('submit', async function (event) { event.preventDefault(); if (!loginForm.reportValidity()) return; try { var db = await supabaseReady; if (!db) throw new Error('Supabase is not available.'); await db.signIn(loginForm.elements.email.value.trim(), loginForm.elements.password.value); await loadAdminData(); sessionStorage.setItem(ADMIN_SESSION_KEY, 'true'); loginForm.reset(); setAdminView(); showMessage(byId('admin-message'), 'Admin session started securely.'); } catch (error) { sessionStorage.removeItem(ADMIN_SESSION_KEY); showMessage(byId('admin-login-message'), error.message || 'Sign-in failed.', true); } });
  var logout = byId('admin-logout'); if (logout) logout.addEventListener('click', async function () { try { var db = await supabaseReady; if (db) await db.signOut(); } catch (error) {} sessionStorage.removeItem(ADMIN_SESSION_KEY); setAdminView(); });
  if (byId('admin-list')) byId('admin-list').addEventListener('click', function (event) { var button = event.target.closest('[data-action]'); if (!button) return; var p = findProvider(button.dataset.id); if (!p) return; if (button.dataset.action === 'approve' || button.dataset.action === 'restore') p.status = 'Approved'; else if (button.dataset.action === 'reject') p.status = 'Rejected'; else if (button.dataset.action === 'suspend') p.status = 'Suspended'; else if (button.dataset.action === 'edit') { var form = byId('admin-edit-form'); ['id', 'businessName', 'category', 'contactName', 'phone', 'email', 'location', 'services', 'description', 'status', 'subscription', 'plan'].forEach(function (field) { form.elements[field].value = p[field] || (field === 'plan' ? 'Basic' : ''); }); byId('edit-dialog').showModal(); return; } persistAll(); renderAll(p.id); showMessage(byId('admin-message'), p.businessName + ' status updated to ' + p.status + '.'); });
  if (byId('admin-edit-form')) byId('admin-edit-form').addEventListener('submit', function (event) { event.preventDefault(); var form = event.currentTarget; if (!form.reportValidity()) return; var p = findProvider(form.elements.id.value); if (!p) return; ['businessName', 'category', 'contactName', 'phone', 'email', 'location', 'services', 'description', 'status', 'subscription', 'plan'].forEach(function (field) { p[field] = form.elements[field].value.trim(); }); persistAll(); byId('edit-dialog').close(); renderAll(p.id); showMessage(byId('admin-message'), 'Provider application updated.'); });
  document.querySelectorAll('[data-close-dialog]').forEach(function (button) { button.addEventListener('click', function () { byId('edit-dialog').close(); }); });
  if (byId('edit-dialog')) byId('edit-dialog').addEventListener('click', function (event) { if (event.target === this) this.close(); });
  var reset = byId('reset-demo'); if (reset) reset.addEventListener('click', function () { if (!window.confirm('Restore the five fictional sample providers?')) return; records = samples(); persistAll(); renderAll(); showMessage(byId('admin-message'), 'Sample provider records restored.'); });
  function renderAll(selectedId) { renderDirectory(); refreshDashboardOptions(selectedId); if (selectedId) renderDashboard(selectedId); else if (byId('dashboard-provider') && byId('dashboard-provider').value) renderDashboard(byId('dashboard-provider').value); if (isAdmin()) renderAdmin(); }
  var year = byId('year'); if (year) year.textContent = new Date().getFullYear();
  (function applyQueryFilters() {
    if (!window.URLSearchParams) return;
    var params = new URLSearchParams(window.location.search);
    [['category', 'directory-filter'], ['location', 'directory-location'], ['q', 'directory-search']].forEach(function (pair) {
      var value = params.get(pair[0]), el = byId(pair[1]);
      if (!value || !el) return;
      if (el.tagName === 'SELECT' && !Array.prototype.some.call(el.options, function (o) { return o.value === value || o.text === value; })) return;
      el.value = value;
    });
  }());
  setAdminView(); renderAll();
  supabaseReady.then(function (db) { if (!db) return; db.listPublishedProviders().then(function (liveProviders) { if (liveProviders.length) { records = liveProviders; save(PROVIDER_KEY, records); renderAll(); } }).catch(function () {}); });
}());
