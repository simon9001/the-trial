// --- Tribute wall (localStorage demo) ---
const form = document.getElementById('tributeForm');
const nameInput = document.getElementById('name');
const relationInput = document.getElementById('relation');
const messageInput = document.getElementById('message');
const list = document.getElementById('tributeList');
const submit = document.getElementById('submitTribute');
const clearAll = document.getElementById('clearAll');

function loadTributes() {
  const raw = localStorage.getItem('tributes_v1') || '[]';
  try {
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function saveTributes(arr) {
  localStorage.setItem('tributes_v1', JSON.stringify(arr));
}

function renderTributes() {
  const tribs = loadTributes().reverse();
  list.innerHTML = '';
  if (!tribs.length) {
    list.innerHTML = '<p class="muted">No tributes yet — be the first to share a memory.</p>';
    return;
  }
  tribs.forEach(t => {
    const el = document.createElement('div');
    el.className = 'tribute';
    el.innerHTML = `
      <strong>${escapeHtml(t.name || 'Anonymous')}</strong>
      <small>• ${escapeHtml(t.relation || '')}</small>
      <div style="margin-top:6px">${escapeHtml(t.message)}</div>
      <small class="muted">${new Date(t.ts).toLocaleString()}</small>`;
    list.appendChild(el);
  });
}

function escapeHtml(s) {
  return (s + '').replace(/[&<>"']/g, c => (
    {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]
  ));
}

submit.addEventListener('click', () => {
  const message = messageInput.value.trim();
  if (!message) {
    alert('Please write a short tribute.');
    messageInput.focus();
    return;
  }
  const arr = loadTributes();
  arr.push({
    name: nameInput.value.trim(),
    relation: relationInput.value.trim(),
    message,
    ts: Date.now()
  });
  saveTributes(arr);
  messageInput.value = '';
  nameInput.value = '';
  relationInput.value = '';
  renderTributes();
});

clearAll.addEventListener('click', () => {
  if (confirm('Clear all tributes stored locally?')) {
    localStorage.removeItem('tributes_v1');
    renderTributes();
  }
});

// gallery lightbox
document.querySelectorAll('.thumb').forEach(t => {
  t.addEventListener('click', () => {
    const src = t.dataset.src;
    const lb = document.getElementById('lightbox');
    const img = document.getElementById('lightboxImg');
    img.src = src;
    lb.classList.add('show');
    lb.setAttribute('aria-hidden', 'false');
  });
});

document.getElementById('lightbox').addEventListener('click', (e) => {
  if (e.target.id === 'lightbox' || e.target.id === 'lightboxImg') {
    e.currentTarget.classList.remove('show');
    e.currentTarget.setAttribute('aria-hidden', 'true');
  }
});

// initial render
renderTributes();

// keyboard close
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.getElementById('lightbox').classList.remove('show');
  }
});
