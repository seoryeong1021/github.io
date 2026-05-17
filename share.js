const share = (() => {
  function generateText() {
    const places = planner.get();
    const region = document.getElementById('travel-region')?.value || '여행지';
    const date = document.getElementById('travel-date')?.value || '';

    if (places.length === 0) return null;

    const header = `[Route Mate] ${region} 여행 루트${date ? ' (' + date + ')' : ''}\n`;
    const divider = '─'.repeat(28) + '\n';

    const lines = places.map((p, i) => {
      const move = i < places.length - 1 ? `\n   ↓ 이동 약 ${MOVE_TIME}분` : '';
      return `${i + 1}. ${p.name} (${p.type}, ${planner.formatMinutes(p.stay)})${p.memo ? '\n   메모: ' + p.memo : ''}${move}`;
    }).join('\n');

    const totalStay = places.reduce((s, p) => s + p.stay, 0);
    const totalMove = (places.length - 1) * MOVE_TIME;
    const footer = `\n${divider}총 ${places.length}개 장소 / 예상 ${planner.formatMinutes(totalStay + totalMove)}\nRoute Mate로 만든 여행 루트`;

    return header + divider + lines + footer;
  }

  function showToast(msg) {
    const existing = document.querySelector('.copy-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'copy-toast';
    toast.textContent = msg;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 2100);
  }

  async function copyToClipboard() {
    const text = generateText();
    if (!text) {
      showToast('장소를 먼저 추가해주세요');
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      showToast('일정이 클립보드에 복사되었습니다');
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0;';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast('일정이 클립보드에 복사되었습니다');
    }
  }

  return { copy: copyToClipboard };
})();
