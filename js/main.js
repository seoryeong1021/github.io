document.addEventListener('DOMContentLoaded', () => {
  initFadeUp();
  initHeader();
  initTabs();
  initManualForm();
  initAiMode();
  initShare();
  initNavLinks();
  initTransportMode();
  initRegionCacheReset();

  // 초기 상태 렌더
  planner.render();
  timeline.update([]);
});

/* ===== GOOGLE MAPS 초기화 콜백 (Maps API 로드 완료 시 호출) ===== */
function onGoogleMapsReady() {
  visualizer.initMap();
  const places = planner.get();
  if (places.length > 0) visualizer.update(places);
}

/* ===== FADE-UP (IntersectionObserver) ===== */
function initFadeUp() {
  const els = document.querySelectorAll('.fade-up');
  if (!els.length) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  els.forEach(el => obs.observe(el));
}

/* ===== HEADER SCROLL ===== */
function initHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });
}

/* ===== NAV SMOOTH SCROLL ===== */
function initNavLinks() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

/* ===== MODE TABS ===== */
function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.tab-panel');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;

      tabBtns.forEach(b => b.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const panel = document.getElementById(`tab-${target}`);
      if (panel) panel.classList.add('active');
    });
  });
}

/* ===== MANUAL FORM ===== */
function initManualForm() {
  const form = document.getElementById('add-place-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('input-place-name')?.value?.trim();
    if (!name) {
      document.getElementById('input-place-name')?.focus();
      return;
    }

    const type = document.getElementById('input-place-type')?.value || '관광지';
    const stay = document.getElementById('input-place-stay')?.value || 60;
    const memo = document.getElementById('input-place-memo')?.value || '';

    planner.add({ name, type, stay, memo });
    form.reset();
    document.getElementById('input-place-name')?.focus();

    // Planner 섹션으로 부드럽게 스크롤
    document.getElementById('place-list')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
}

/* ===== AI MODE ===== */
function initAiMode() {
  const loadBtn = document.getElementById('load-recommendations');
  if (!loadBtn) return;

  loadBtn.addEventListener('click', () => {
    const region = document.getElementById('travel-region')?.value || '';
    const recs = getRecommendations(region);
    renderRecommendations(recs);
  });
}

function renderRecommendations(recs) {
  const list = document.getElementById('rec-list');
  if (!list) return;

  list.innerHTML = recs.map((r, i) => `
    <div class="rec-card is-new" style="animation-delay:${i * 0.05}s">
      <div class="route-pin" style="width:28px;height:28px;font-size:12px;flex-shrink:0;">${i + 1}</div>
      <div class="rec-info">
        <div class="rec-name">${escHtml(r.name)}</div>
        <div class="rec-reason">${escHtml(r.reason)}</div>
      </div>
      <div class="place-meta" style="flex-shrink:0;flex-direction:column;align-items:flex-end;gap:4px;">
        <span class="place-type-tag tag-${r.type}">${r.type}</span>
        <span style="font-size:11px;color:var(--color-text-sub);">${r.stay}분</span>
      </div>
      <button class="rec-add-btn" title="내 루트에 추가" onclick="addFromRecommendation(this, ${JSON.stringify(r).replace(/"/g, '&quot;')})">+</button>
    </div>
  `).join('');
}

function addFromRecommendation(btn, rec) {
  planner.add({ name: rec.name, type: rec.type, stay: rec.stay, memo: rec.reason });
  btn.textContent = '✓';
  btn.style.background = 'var(--color-accent)';
  btn.style.color = 'var(--color-primary)';
  btn.disabled = true;
}

/* ===== SHARE ===== */
function initShare() {
  document.querySelectorAll('[data-action="copy"]').forEach(btn => {
    btn.addEventListener('click', () => share.copy());
  });
}

/* ===== TRANSPORT MODE ===== */
function initTransportMode() {
  const bar = document.getElementById('transport-mode-bar');
  if (!bar) return;

  bar.addEventListener('click', (e) => {
    const btn = e.target.closest('.transport-btn');
    if (!btn) return;

    bar.querySelectorAll('.transport-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const mode = btn.dataset.mode;
    visualizer.setTransportMode(mode);
  });
}

/* ===== 지역 변경 시 지오코딩 캐시 초기화 ===== */
function initRegionCacheReset() {
  const regionInput = document.getElementById('travel-region');
  if (!regionInput) return;
  regionInput.addEventListener('change', () => {
    visualizer.clearCache();
    const places = planner.get();
    if (places.length > 0) visualizer.update(places);
  });
}

function escHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
