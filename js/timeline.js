const timeline = (() => {
  const SLOTS = [
    { id: 'morning',   label: '오전',   start: 9 * 60,  end: 12 * 60 },
    { id: 'lunch',     label: '점심',   start: 12 * 60, end: 14 * 60 },
    { id: 'afternoon', label: '오후',   start: 14 * 60, end: 18 * 60 },
    { id: 'evening',   label: '저녁',   start: 18 * 60, end: 24 * 60 },
  ];

  function formatTime(minutes) {
    const h = Math.floor(minutes / 60) % 24;
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  function update(places) {
    const wrapper = document.getElementById('timeline-wrapper');
    if (!wrapper) return;

    if (places.length === 0) {
      wrapper.innerHTML = `<div class="timeline-empty">장소를 추가하면 하루 일정이 여기에 표시됩니다.</div>`;
      return;
    }

    // 각 장소에 시작 시간 할당
    let cursor = DAY_START;
    const scheduled = places.map((p, i) => {
      const start = cursor;
      cursor += p.stay;
      const moveAfter = i < places.length - 1 ? MOVE_TIME : 0;
      cursor += moveAfter;
      return { ...p, start, moveAfter };
    });

    // 슬롯별로 분류
    const slotItems = SLOTS.map(slot => {
      const items = scheduled.filter(p => p.start >= slot.start && p.start < slot.end);
      return { ...slot, items };
    }).filter(s => s.items.length > 0);

    if (slotItems.length === 0) {
      wrapper.innerHTML = `<div class="timeline-empty">일정이 자정을 넘어 표시할 수 없습니다.</div>`;
      return;
    }

    wrapper.innerHTML = slotItems.map(slot => `
      <div class="timeline-slot">
        <div class="timeline-time-col">
          <div class="timeline-slot-label">${slot.label}</div>
          <div class="timeline-slot-time">${formatTime(slot.items[0].start)}</div>
        </div>
        <div class="timeline-items">
          ${slot.items.map((p, idx) => `
            <div class="timeline-item">
              <div class="timeline-dot"></div>
              <div class="timeline-item-info">
                <div class="timeline-item-name">${escHtml(p.name)}</div>
                <div class="timeline-item-meta">
                  ${p.type} &middot; ${formatTime(p.start)} ~ ${formatTime(p.start + p.stay)} &middot; ${planner.formatMinutes(p.stay)}
                </div>
              </div>
              <span class="place-type-tag tag-${p.type}">${p.type}</span>
            </div>
            ${p.moveAfter > 0 ? `
              <div class="timeline-move">
                &#8595; 이동 약 ${p.moveAfter}분
              </div>` : ''}
          `).join('')}
        </div>
      </div>
    `).join('');
  }

  function escHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  return { update };
})();
