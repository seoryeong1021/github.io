const planner = (() => {
  let places = [];

  function getPlaces() {
    return [...places];
  }

  function addPlace(place) {
    places.push({
      name: place.name.trim(),
      type: place.type || '관광지',
      stay: parseInt(place.stay) || 60,
      memo: (place.memo || '').trim(),
    });
    renderPlaceList();
    visualizer.update(places);
    timeline.update(places);
  }

  function removePlace(index) {
    places.splice(index, 1);
    renderPlaceList();
    visualizer.update(places);
    timeline.update(places);
  }

  function movePlaceUp(index) {
    if (index === 0) return;
    [places[index - 1], places[index]] = [places[index], places[index - 1]];
    renderPlaceList();
    visualizer.update(places);
    timeline.update(places);
  }

  function movePlaceDown(index) {
    if (index === places.length - 1) return;
    [places[index], places[index + 1]] = [places[index + 1], places[index]];
    renderPlaceList();
    visualizer.update(places);
    timeline.update(places);
  }

  function renderPlaceList() {
    const list = document.getElementById('place-list');
    const countEl = document.getElementById('place-count');
    if (!list) return;

    if (countEl) countEl.textContent = `${places.length}개 장소`;

    if (places.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-title">아직 장소가 없습니다</div>
          <div class="empty-state-desc">아래 폼에서 장소를 추가하거나<br>AI 추천을 불러오세요.</div>
        </div>`;
      return;
    }

    list.innerHTML = places.map((p, i) => `
      <div class="place-card is-new" data-index="${i}">
        <div class="place-num">${i + 1}</div>
        <div class="place-info">
          <div class="place-name">${escHtml(p.name)}</div>
          <div class="place-meta">
            <span class="place-type-tag tag-${p.type}">${p.type}</span>
            <span class="place-stay">${formatMinutes(p.stay)}</span>
          </div>
          ${p.memo ? `<div class="place-memo">${escHtml(p.memo)}</div>` : ''}
        </div>
        <div class="place-actions">
          <button class="place-action-btn" title="위로" onclick="planner.moveUp(${i})">&#8593;</button>
          <button class="place-action-btn" title="아래로" onclick="planner.moveDown(${i})">&#8595;</button>
          <button class="place-action-btn delete" title="삭제" onclick="planner.remove(${i})">&#215;</button>
        </div>
      </div>
    `).join('');

    // is-new 클래스 제거 (애니메이션 1회 실행 후)
    requestAnimationFrame(() => {
      list.querySelectorAll('.place-card.is-new').forEach(el => {
        setTimeout(() => el.classList.remove('is-new'), 400);
      });
    });
  }

  function formatMinutes(min) {
    if (min < 60) return `${min}분`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h}시간 ${m}분` : `${h}시간`;
  }

  function escHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  return {
    get: getPlaces,
    add: addPlace,
    remove: removePlace,
    moveUp: movePlaceUp,
    moveDown: movePlaceDown,
    render: renderPlaceList,
    formatMinutes,
  };
})();
