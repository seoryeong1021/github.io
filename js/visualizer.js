const visualizer = (() => {
  let map = null;
  let markers = [];
  let directionsRenderer = null;
  let directionsService = null;
  let geocoder = null;
  let transportMode = 'DRIVING';
  let geocodeCache = {};     // { "장소명": LatLng }
  let openInfoWindow = null;

  // ── 초기화 (Google Maps 로드 완료 후 호출) ──
  function initMap() {
    const canvas = document.getElementById('route-map-canvas');
    if (!canvas || !window.google) return;

    map = new google.maps.Map(canvas, {
      zoom: 13,
      center: { lat: 37.5665, lng: 126.9780 }, // 서울 기본
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControlOptions: {
        position: google.maps.ControlPosition.RIGHT_CENTER,
      },
      styles: MAP_STYLES,
    });

    geocoder = new google.maps.Geocoder();
    directionsService = new google.maps.DirectionsService();

    directionsRenderer = new google.maps.DirectionsRenderer({
      suppressMarkers: true,         // 우리가 직접 마커를 관리
      preserveViewport: false,
      polylineOptions: {
        strokeColor: '#4F7FA8',
        strokeWeight: 5,
        strokeOpacity: 0.85,
      },
    });
    directionsRenderer.setMap(map);
  }

  // ── 장소 이름 → LatLng (캐시 활용) ──
  function geocodePlace(name) {
    if (geocodeCache[name]) return Promise.resolve(geocodeCache[name]);

    const region = document.getElementById('travel-region')?.value?.trim() || '';
    const query = region ? `${name}, ${region}` : name;

    return new Promise((resolve) => {
      geocoder.geocode({ address: query, language: 'ko' }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const loc = results[0].geometry.location;
          geocodeCache[name] = loc;
          resolve(loc);
        } else {
          resolve(null);
        }
      });
    });
  }

  // ── 전체 업데이트 (장소 추가/삭제/이동 시 호출) ──
  async function update(places) {
    updateSummary(places);

    if (!map || !geocoder) return;

    // 기존 마커 제거
    markers.forEach(m => m.setMap(null));
    markers = [];
    if (openInfoWindow) { openInfoWindow.close(); openInfoWindow = null; }

    if (places.length === 0) {
      if (directionsRenderer) directionsRenderer.setDirections({ routes: [] });
      resetRouteInfo();
      return;
    }

    setRouteInfoState('loading');

    // 순차 지오코딩 (API 쿼터 보호)
    const geocoded = [];
    for (const place of places) {
      const loc = await geocodePlace(place.name);
      if (loc) geocoded.push({ place, loc });
    }

    if (geocoded.length === 0) {
      setRouteInfoState('error');
      return;
    }

    // 지도 범위 조정
    if (geocoded.length === 1) {
      map.setCenter(geocoded[0].loc);
      map.setZoom(15);
    } else {
      const bounds = new google.maps.LatLngBounds();
      geocoded.forEach(({ loc }) => bounds.extend(loc));
      map.fitBounds(bounds, { top: 60, right: 40, bottom: 60, left: 40 });
    }

    // 마커 추가
    geocoded.forEach(({ place, loc }, i) => {
      const marker = new google.maps.Marker({
        position: loc,
        map,
        zIndex: i + 10,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 17,
          fillColor: i === 0 ? '#1E2A3A' : '#8FCFD1',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2.5,
        },
        label: {
          text: String(i + 1),
          color: i === 0 ? '#FFFFFF' : '#1E2A3A',
          fontWeight: '700',
          fontSize: '12px',
        },
        title: place.name,
      });

      const infoWindow = new google.maps.InfoWindow({
        content: buildInfoWindowContent(place, i + 1),
        maxWidth: 220,
      });

      marker.addListener('click', () => {
        if (openInfoWindow) openInfoWindow.close();
        infoWindow.open(map, marker);
        openInfoWindow = infoWindow;
      });

      markers.push(marker);
    });

    // 경로 계산 (2개 이상)
    if (geocoded.length >= 2) {
      await drawRoute(geocoded);
    } else {
      if (directionsRenderer) directionsRenderer.setDirections({ routes: [] });
      setRouteInfoState('empty');
    }
  }

  // ── Directions API 경로 그리기 ──
  function drawRoute(geocoded) {
    return new Promise((resolve) => {
      const origin = geocoded[0].loc;
      const destination = geocoded[geocoded.length - 1].loc;
      const waypoints = geocoded.slice(1, -1).map(({ loc }) => ({
        location: loc,
        stopover: true,
      }));

      const request = {
        origin,
        destination,
        waypoints,
        travelMode: google.maps.TravelMode[transportMode],
        optimizeWaypoints: false,
        unitSystem: google.maps.UnitSystem.METRIC,
      };

      if (transportMode === 'TRANSIT') {
        request.transitOptions = { departureTime: new Date() };
      }

      directionsService.route(request, (result, status) => {
        if (status === 'OK') {
          directionsRenderer.setDirections(result);
          updateRouteInfo(result);
        } else {
          directionsRenderer.setDirections({ routes: [] });
          if (status === 'ZERO_RESULTS') {
            setRouteInfoState('noroute');
          } else {
            setRouteInfoState('error');
          }
        }
        resolve();
      });
    });
  }

  // ── Directions 결과에서 이동 정보 추출 ──
  function updateRouteInfo(result) {
    const legs = result.routes[0].legs;
    let totalSecs = 0;
    let totalMeters = 0;

    legs.forEach(leg => {
      totalSecs += leg.duration.value;
      totalMeters += leg.distance.value;
    });

    const durationEl = document.getElementById('route-duration');
    const distanceEl = document.getElementById('route-distance');
    const totalEl = document.getElementById('summary-total');

    if (durationEl) {
      const mins = Math.round(totalSecs / 60);
      durationEl.textContent = mins < 60
        ? `${mins}분`
        : `${Math.floor(mins / 60)}시간 ${mins % 60 ? (mins % 60) + '분' : ''}`;
    }

    if (distanceEl) {
      distanceEl.textContent = totalMeters >= 1000
        ? `${(totalMeters / 1000).toFixed(1)}km`
        : `${totalMeters}m`;
    }

    // 체류 시간 + 이동 시간 합산 표시
    if (totalEl) {
      const places = planner.get();
      const stayMins = places.reduce((s, p) => s + p.stay, 0);
      const moveMins = Math.round(totalSecs / 60);
      totalEl.textContent = planner.formatMinutes(stayMins + moveMins);
    }
  }

  // ── 요약 숫자 업데이트 ──
  function updateSummary(places) {
    const summaryPlaces = document.getElementById('summary-places');
    const summaryTime = document.getElementById('summary-time');
    const totalStay = places.reduce((s, p) => s + p.stay, 0);
    if (summaryPlaces) summaryPlaces.textContent = places.length;
    if (summaryTime) summaryTime.textContent = places.length ? planner.formatMinutes(totalStay) : '0분';
  }

  // ── 경로 정보 상태별 표시 ──
  function setRouteInfoState(state) {
    const durationEl = document.getElementById('route-duration');
    const distanceEl = document.getElementById('route-distance');
    const totalEl = document.getElementById('summary-total');
    const msgs = {
      loading:  { d: '계산 중...', dist: '-', t: '-' },
      error:    { d: '오류', dist: '-', t: '-' },
      noroute:  { d: '경로 없음', dist: '-', t: '-' },
      empty:    { d: '-', dist: '-', t: '-' },
    };
    const m = msgs[state] || msgs.empty;
    if (durationEl) durationEl.textContent = m.d;
    if (distanceEl) distanceEl.textContent = m.dist;
    if (totalEl) totalEl.textContent = m.t;
  }

  function resetRouteInfo() { setRouteInfoState('empty'); }

  // ── 교통수단 변경 ──
  function setTransportMode(mode) {
    transportMode = mode;
    const places = planner.get();
    if (places.length >= 1) update(places);
  }

  // ── 지역 바뀌면 캐시 초기화 ──
  function clearCache() { geocodeCache = {}; }

  // ── InfoWindow HTML ──
  function buildInfoWindowContent(place, num) {
    const typeColors = {
      관광지: '#2980B9', 맛집: '#E67E22', 카페: '#D4A017',
      숙소: '#27AE60', 쇼핑: '#8E44AD', 액티비티: '#16A085',
    };
    const color = typeColors[place.type] || '#4F7FA8';
    return `
      <div style="font-family:'Noto Sans KR',sans-serif;padding:4px 2px;min-width:160px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
          <div style="width:24px;height:24px;border-radius:50%;background:#8FCFD1;color:#1E2A3A;font-weight:700;font-size:11px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${num}</div>
          <strong style="font-size:14px;color:#1E2A3A;">${escHtml(place.name)}</strong>
        </div>
        <div style="display:flex;gap:6px;align-items:center;">
          <span style="font-size:11px;font-weight:600;padding:2px 8px;border-radius:999px;background:${color}18;color:${color};">${place.type}</span>
          <span style="font-size:12px;color:#6B7A89;">체류 ${planner.formatMinutes(place.stay)}</span>
        </div>
        ${place.memo ? `<div style="margin-top:6px;font-size:12px;color:#6B7A89;border-top:1px solid #DCE6EC;padding-top:6px;">${escHtml(place.memo)}</div>` : ''}
      </div>`;
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ── 지도 커스텀 스타일 (차분한 블루 계열) ──
  const MAP_STYLES = [
    { elementType: 'geometry',           stylers: [{ color: '#f5f7fa' }] },
    { elementType: 'labels.text.fill',   stylers: [{ color: '#4a5568' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
    { featureType: 'administrative',      elementType: 'geometry',           stylers: [{ color: '#e2e8f0' }] },
    { featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
    { featureType: 'poi',                 stylers: [{ visibility: 'off' }] },
    { featureType: 'poi.park',            elementType: 'geometry',           stylers: [{ color: '#d4edda', visibility: 'on' }] },
    { featureType: 'poi.park',            elementType: 'labels.text.fill',   stylers: [{ color: '#4a7c59', visibility: 'on' }] },
    { featureType: 'road',                elementType: 'geometry',           stylers: [{ color: '#ffffff' }] },
    { featureType: 'road.arterial',       elementType: 'geometry',           stylers: [{ color: '#e9eef3' }] },
    { featureType: 'road.arterial',       elementType: 'labels.text.fill',   stylers: [{ color: '#757575' }] },
    { featureType: 'road.highway',        elementType: 'geometry',           stylers: [{ color: '#dce6ec' }] },
    { featureType: 'road.highway',        elementType: 'geometry.stroke',    stylers: [{ color: '#b3c7d4' }] },
    { featureType: 'road.highway',        elementType: 'labels.text.fill',   stylers: [{ color: '#616161' }] },
    { featureType: 'road.local',          elementType: 'labels.text.fill',   stylers: [{ color: '#9e9e9e' }] },
    { featureType: 'transit',             stylers: [{ visibility: 'simplified' }] },
    { featureType: 'transit.station',     stylers: [{ visibility: 'on' }] },
    { featureType: 'transit.station',     elementType: 'labels.text.fill',   stylers: [{ color: '#4F7FA8' }] },
    { featureType: 'water',               elementType: 'geometry',           stylers: [{ color: '#b3d9e8' }] },
    { featureType: 'water',               elementType: 'labels.text.fill',   stylers: [{ color: '#4F7FA8' }] },
  ];

  return { initMap, update, setTransportMode, clearCache };
})();
