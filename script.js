// ----------------- Tribute helpers -----------------
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx7C_0PcP6NR5_KXPJAKfXaNQDpfEHIzpXQ4vBoSoRTXP757LwgDAXVJnI-00ebapTIDA/exec';

// Wait for DOM to be fully loaded before accessing elements
document.addEventListener('DOMContentLoaded', () => {
  // Initialize elements inside DOMContentLoaded
  const form = document.getElementById('tributeForm');
  const nameInput = document.getElementById('name');
  const relationInput = document.getElementById('relation');
  const messageInput = document.getElementById('message');
  const list = document.getElementById('tributeList');
  const submit = document.getElementById('submitTribute');
  const clearAll = document.getElementById('clearAll');
  const switchBtn = document.getElementById('langSwitch');

  // Unique user UUID for ownership tracking
  if (!localStorage.getItem('user_uuid')) {
    localStorage.setItem('user_uuid', crypto.randomUUID());
  }
  const userUUID = localStorage.getItem('user_uuid');

  function loadTributes() {
    const raw = localStorage.getItem('tributes_v1') || '[]';
    try { return JSON.parse(raw); } catch { return []; }
  }

  function saveTributes(arr) {
    localStorage.setItem('tributes_v1', JSON.stringify(arr));
  }

  function escapeHtml(s) {
    return (s + '').replace(/[&<>"']/g, c => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }

  function renderTributes(tributes = loadTributes()) {
    if (!list) return; // Guard clause if element doesn't exist
    list.innerHTML = '';
    if (!tributes.length) {
      list.innerHTML = '<p class="muted">No tributes yet — be the first to share a memory.</p>';
      return;
    }

    tributes.slice().reverse().forEach(t => {
      const el = document.createElement('div');
      el.className = 'tribute';
      el.dataset.uuid = t.uuid || '';
      el.dataset.id = t.id || '';

      el.innerHTML = `
        <strong>${escapeHtml(t.name || 'Anonymous')}</strong>
        <small>• ${escapeHtml(t.relation || '')}</small>
        <div style="margin-top:6px">${escapeHtml(t.message)}</div>
        ${t.uuid === userUUID ? '<button class="delete-btn">Delete</button>' : ''}
        <small class="muted">${t.ts ? new Date(t.ts).toLocaleString() : ''}</small>`;

      list.appendChild(el);

      if (t.uuid === userUUID) {
        const deleteBtn = el.querySelector('.delete-btn');
        if (deleteBtn) {
          deleteBtn.addEventListener('click', async () => {
            if (confirm('Delete your tribute?')) {
              await deleteTribute(t.id, t.uuid);
              const updated = loadTributes().filter(x => x.id !== t.id);
              saveTributes(updated);
              renderTributes(updated);
            }
          });
        }
      }
    });
  }

  // ----------------- POST new tribute -----------------
  async function submitToWebApp(name, relation, message) {
    const payload = { name, relation, message, uuid: userUUID, ts: Date.now() };

    try {
      if (submit) submit.disabled = true;
      // Add mode: 'no-cors' for local testing, but note this limits response reading
      const res = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        mode: 'cors' // Explicitly set CORS mode
      });

      const data = await res.json();
      if (submit) submit.disabled = false;

      if (data.status === 'success') return data.id;
      console.error('Submission failed:', data);
      alert('Failed to submit tribute.');
      return null;
    } catch (err) {
      console.error('Error submitting tribute:', err);
      if (submit) submit.disabled = false;
      
      // For local testing, simulate success if CORS fails
      if (window.location.protocol === 'file:') {
        alert('Note: Running locally - tribute saved to local storage only.');
        return 'local-' + Date.now();
      }
      
      alert('Unable to reach the server. Check your internet or script URL.');
      return null;
    }
  }

  // ----------------- DELETE tribute -----------------
  async function deleteTribute(id, uuid) {
    try {
      const res = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteId: id, uuid })
      });
      const data = await res.json();

      if (data.status === 'deleted') {
        console.log(`Deleted tribute with id ${id}`);
      } else {
        console.warn('Delete failed or not found', id);
      }
    } catch (err) {
      console.error('Error deleting tribute:', err);
    }
  }

  // ----------------- GET tributes -----------------
  async function loadAllTributes() {
    try {
      // For local testing, use a proxy to avoid CORS
      let url = SCRIPT_URL;
      
      // If running locally, you might need a CORS proxy
      if (window.location.protocol === 'file:') {
        // Option 1: Use a CORS proxy (remove in production)
        // url = 'https://corsproxy.io/?' + encodeURIComponent(SCRIPT_URL);
        
        // Option 2: Load from localStorage only
        console.log('Running locally - loading from localStorage only');
        const tributes = loadTributes();
        renderTributes(tributes);
        return;
      }

      const res = await fetch(url);
      const json = await res.json();

      // Expect { status: 'success', data: [...] }
      const tributes = json?.data || [];
      saveTributes(tributes);
      renderTributes(tributes);
    } catch (err) {
      console.error('Error loading tributes:', err);
      // Fallback to localStorage
      const tributes = loadTributes();
      renderTributes(tributes);
    }
  }

  // ----------------- Form handling -----------------
  if (submit) {
    submit.addEventListener('click', async e => {
      e.preventDefault();
      const name = nameInput ? nameInput.value.trim() : '';
      const relation = relationInput ? relationInput.value.trim() : '';
      const message = messageInput ? messageInput.value.trim() : '';

      if (!message) {
        alert('Please write a short tribute.');
        if (messageInput) messageInput.focus();
        return;
      }

      const id = await submitToWebApp(name, relation, message);
      if (!id) return;

      const tribute = { 
        id, 
        name, 
        relation, 
        message, 
        ts: new Date().toISOString(), 
        uuid: userUUID 
      };
      const arr = loadTributes();
      arr.push(tribute);
      saveTributes(arr);
      renderTributes(arr);

      if (nameInput) nameInput.value = '';
      if (relationInput) relationInput.value = '';
      if (messageInput) messageInput.value = '';
    });
  }

  // Clear all locally cached tributes
  if (clearAll) {
    clearAll.addEventListener('click', () => {
      if (confirm('Clear all tributes stored locally?')) {
        localStorage.removeItem('tributes_v1');
        renderTributes();
      }
    });
  }

  // ----------------- Accordion -----------------
  document.querySelectorAll('.accordion-header').forEach(button => {
    button.addEventListener('click', () => {
      const item = button.parentElement;
      const openItem = document.querySelector('.accordion-item.active');
      if (openItem && openItem !== item) {
        openItem.classList.remove('active');
        openItem.querySelector('.accordion-content').style.maxHeight = null;
      }
      item.classList.toggle('active');
      const content = item.querySelector('.accordion-content');
      if (item.classList.contains('active')) {
        content.style.maxHeight = content.scrollHeight + 'px';
      } else {
        content.style.maxHeight = null;
      }
    });
  });

  // ----------------- Language Switch -----------------
  if (switchBtn) {
    let isKikuyu = false; // default language = English

    switchBtn.addEventListener('click', () => {
      isKikuyu = !isKikuyu;
      switchBtn.textContent = isKikuyu ? 'change to English' : 'change to Kikuyu';

      document.querySelectorAll('.timeline .muted').forEach(p => {
        const text = isKikuyu ? p.dataset.ki : p.dataset.en;
        if (text) p.innerHTML = text;
      });
    });
  }

  // ----------------- Gallery -----------------
  const container = document.querySelector('.gallery-container');
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = lightbox ? lightbox.querySelector('img') : null;
  
  if (container) {
    // store original thumbs (so we can rebuild pages on resize)
    const originalThumbs = Array.from(container.querySelectorAll('.thumb'));
    let pages = [];
    let currentPage = 0;
    let perPage = calcPerPage();
    let autoSlide = null;
    let isPaused = false;
    let resumeTimer = null;
    const AUTO_MS = 4000;

    function calcPerPage() {
      const w = window.innerWidth;
      if (w > 900) return 6;
      if (w > 600) return 4;
      return 2;
    }

    function buildPages() {
      perPage = calcPerPage();
      const visibleStartIndex = currentPage * perPage;

      container.innerHTML = '';
      pages = [];
      for (let i = 0; i < originalThumbs.length; i += perPage) {
        const page = document.createElement('div');
        page.className = 'gallery-page';
        const grid = document.createElement('div');
        grid.className = 'gallery-grid';
        const slice = originalThumbs.slice(i, i + perPage);
        slice.forEach(t => grid.appendChild(t));
        page.appendChild(grid);
        container.appendChild(page);
        pages.push(page);
      }

      currentPage = Math.min(Math.floor(visibleStartIndex / perPage), Math.max(0, pages.length - 1));
      requestAnimationFrame(() => {
        container.scrollTo({ left: currentPage * container.clientWidth, behavior: 'auto' });
      });

      attachThumbHandlers();
    }

    function attachThumbHandlers() {
      const imgs = container.querySelectorAll('.thumb img');
      imgs.forEach(img => {
        img.onclick = () => {
          openLightbox(img);
        };
      });
    }

    function startAutoSlide() {
      if (isPaused || pages.length <= 1) return;
      stopAutoSlide();
      autoSlide = setInterval(() => {
        currentPage = (currentPage + 1) % pages.length;
        container.scrollTo({ left: currentPage * container.clientWidth, behavior: 'smooth' });
      }, AUTO_MS);
    }
    
    function stopAutoSlide() {
      clearInterval(autoSlide);
      autoSlide = null;
    }

    function pauseThenResume() {
      stopAutoSlide();
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => {
        if (!isPaused) startAutoSlide();
      }, 3000);
    }

    container.addEventListener('scroll', () => {
      clearTimeout(container._scrollTimeout);
      stopAutoSlide();
      container._scrollTimeout = setTimeout(() => {
        if (!isPaused) startAutoSlide();
      }, 3000);
      currentPage = Math.round(container.scrollLeft / Math.max(1, container.clientWidth));
    }, { passive: true });

    container.addEventListener('wheel', () => { pauseThenResume(); }, { passive: true });
    container.addEventListener('touchstart', () => { pauseThenResume(); }, { passive: true });

    function openLightbox(imgEl) {
      if (!lightbox || !lightboxImg) return;
      isPaused = true;
      stopAutoSlide();
      lightboxImg.src = imgEl.src;
      lightboxImg.alt = imgEl.alt || '';
      lightbox.classList.add('show');
    }

    function closeLightbox() {
      if (!lightbox) return;
      lightbox.classList.remove('show');
      isPaused = false;
      setTimeout(() => startAutoSlide(), 250);
    }

    if (lightbox) {
      lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox || e.target === lightboxImg) {
          closeLightbox();
        }
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeLightbox();
      });
    }

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const oldPer = perPage;
        perPage = calcPerPage();
        if (perPage !== oldPer) {
          buildPages();
        } else {
          container.scrollTo({ left: currentPage * container.clientWidth, behavior: 'auto' });
        }
      }, 220);
    });

    buildPages();
    startAutoSlide();
  }

  // ----------------- Farewell canvas -----------------
  const canvas = document.getElementById('farewellCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let petals = [];
    
    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    petals = Array.from({length: 40}, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: 2 + Math.random() * 3,
      speedY: 0.2 + Math.random() * 0.5,
      speedX: Math.random() * 0.3 - 0.15,
      opacity: 0.3 + Math.random() * 0.6
    }));

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      petals.forEach(p => {
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 182, 193, ${p.opacity})`;
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        p.y -= p.speedY;
        p.x += p.speedX;
        if (p.y < -10) p.y = canvas.height + 10;
        if (p.x > canvas.width + 10) p.x = -10;
        if (p.x < -10) p.x = canvas.width + 10;
      });
      requestAnimationFrame(animate);
    }
    animate();
  }

  // ----------------- Download message -----------------
  function showDownloadMessage(event) {
    event.preventDefault();
    const link = event.currentTarget;
    const progressContainer = document.getElementById('downloadProgress');
    const fill = document.querySelector('.progress-fill');

    if (progressContainer) progressContainer.style.display = 'block';
    if (fill) fill.style.width = '0%';
    
    alert('Your download is starting...\n\nPlease keep this page open.');

    setTimeout(() => {
      if (fill) fill.style.width = '100%';
    }, 100);

    setTimeout(() => {
      const a = document.createElement('a');
      a.href = link.getAttribute('href');
      a.download = link.getAttribute('download');
      a.click();

      alert('✅ Download complete! Check your downloads folder.');
      if (progressContainer) progressContainer.style.display = 'none';
    }, 2500);
  }

  // Attach download handlers
  document.querySelectorAll('a.download-link').forEach(link => {
    link.addEventListener('click', showDownloadMessage);
  });

  // Initial load
  loadAllTributes();
});