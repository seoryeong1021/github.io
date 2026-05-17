const PLACE_TYPES = ['관광지', '맛집', '카페', '숙소', '쇼핑', '액티비티'];

const TRAVEL_STYLES = [
  '여유로운 일정',
  '맛집 중심',
  '관광지 중심',
  '쇼핑 중심',
  '자연 중심',
  '사진 명소 중심',
];

const MOVE_TIME = 30; // 장소 간 기본 이동 시간(분)
const DAY_START = 9 * 60; // 09:00 기준 시작 (분 단위)

const RECOMMENDATIONS = {
  부산: [
    { name: '감천문화마을', type: '관광지', stay: 90,  reason: '알록달록 벽화 골목, 사진 명소로 인기' },
    { name: '해운대 해변',   type: '관광지', stay: 120, reason: '부산 대표 명소, 선호도 최상위' },
    { name: '광안리 해수욕장', type: '관광지', stay: 90, reason: '광안대교 야경과 함께 즐기기 좋음' },
    { name: '자갈치시장',     type: '맛집',   stay: 60,  reason: '신선한 해산물 현지 시장 체험' },
    { name: '남포동 BIFF광장', type: '쇼핑',  stay: 60,  reason: '쇼핑과 길거리 음식 명소' },
    { name: '용두산공원',     type: '관광지', stay: 50,  reason: '부산타워에서 시내 전경 조망 가능' },
    { name: '송정해수욕장',   type: '관광지', stay: 80,  reason: '해운대보다 한적하고 서퍼들에게 인기' },
    { name: '해운대 구남로',  type: '맛집',   stay: 50,  reason: '맛집과 카페가 밀집된 먹자골목' },
  ],
  서울: [
    { name: '경복궁',         type: '관광지', stay: 90,  reason: '조선 대표 궁궐, 한복 체험 가능' },
    { name: '북촌한옥마을',   type: '관광지', stay: 60,  reason: '전통 한옥 골목 산책 명소' },
    { name: '인사동',         type: '쇼핑',   stay: 60,  reason: '전통 공예품과 개성 있는 상점 밀집' },
    { name: '명동',           type: '쇼핑',   stay: 90,  reason: '쇼핑과 길거리 음식의 중심지' },
    { name: '홍대 거리',      type: '쇼핑',   stay: 90,  reason: '젊음의 거리, 카페와 클럽 문화 중심' },
    { name: '이태원',         type: '맛집',   stay: 70,  reason: '다국적 음식과 트렌디한 레스토랑' },
    { name: '한강 공원',      type: '액티비티', stay: 100, reason: '자전거, 피크닉, 야경 즐기기 최적' },
    { name: '남산 타워',      type: '관광지', stay: 80,  reason: '서울 야경 조망 필수 코스' },
  ],
  오사카: [
    { name: '도톤보리',       type: '맛집',   stay: 90,  reason: '오사카 먹거리의 중심, 네온사인 명소' },
    { name: '오사카성',       type: '관광지', stay: 90,  reason: '일본 역사 대표 성곽, 공원 산책 가능' },
    { name: '신사이바시',     type: '쇼핑',   stay: 90,  reason: '쇼핑 아케이드 밀집 구역' },
    { name: '구로몬 시장',    type: '맛집',   stay: 60,  reason: '신선한 해산물과 일본 현지 음식 체험' },
    { name: '유니버설 스튜디오', type: '액티비티', stay: 480, reason: '하루 종일 즐길 수 있는 테마파크' },
    { name: '나리타바시',     type: '관광지', stay: 60,  reason: '오사카 가장 오래된 상점가 산책' },
    { name: '텐포잔 마켓플레이스', type: '쇼핑', stay: 60, reason: '쇼핑과 수족관이 있는 복합 공간' },
  ],
  제주: [
    { name: '성산일출봉',     type: '관광지', stay: 90,  reason: '유네스코 세계자연유산, 일출 명소' },
    { name: '한라산',         type: '액티비티', stay: 300, reason: '국내 최고봉, 등산 코스 다양' },
    { name: '협재해수욕장',   type: '관광지', stay: 90,  reason: '에메랄드빛 바다와 하얀 모래사장' },
    { name: '동문시장',       type: '맛집',   stay: 60,  reason: '제주 야시장과 현지 먹거리 체험' },
    { name: '카멜리아힐',     type: '관광지', stay: 60,  reason: '계절별 꽃이 피는 식물원' },
    { name: '섭지코지',       type: '관광지', stay: 60,  reason: '영화 촬영지로 유명한 해안 절경' },
    { name: '제주 돌하르방공원', type: '관광지', stay: 50, reason: '제주 전통 석상 문화 체험' },
  ],
  교토: [
    { name: '후시미이나리 신사', type: '관광지', stay: 90, reason: '천 개의 토리이가 이어지는 붉은 터널' },
    { name: '아라시야마 대나무숲', type: '관광지', stay: 60, reason: '신비로운 대나무 숲길 산책' },
    { name: '금각사',         type: '관광지', stay: 60,  reason: '황금빛 사찰, 일본 대표 관광지' },
    { name: '기온 거리',      type: '관광지', stay: 70,  reason: '게이샤 문화가 남아있는 전통 거리' },
    { name: '니시키 시장',    type: '맛집',   stay: 60,  reason: "교토의 부엌, 현지 음식 탐방" },
    { name: '철학의 길',      type: '관광지', stay: 50,  reason: '벚꽃 시즌 최고의 산책로' },
  ],
};

const DEFAULT_RECOMMENDATIONS = [
  { name: '현지 유명 관광지', type: '관광지', stay: 90,  reason: '방문자 만족도가 높은 대표 명소입니다.' },
  { name: '현지 추천 맛집',   type: '맛집',   stay: 60,  reason: '리뷰 평점이 높은 현지 음식 맛집입니다.' },
  { name: '분위기 좋은 카페', type: '카페',   stay: 45,  reason: '여행 중 쉬어가기 좋은 카페입니다.' },
  { name: '전통 시장',        type: '쇼핑',   stay: 60,  reason: '현지 특산물과 먹거리를 즐길 수 있습니다.' },
  { name: '자연 공원',        type: '액티비티', stay: 80, reason: '경치가 아름다워 산책하기 좋습니다.' },
];

function getRecommendations(region) {
  if (!region) return DEFAULT_RECOMMENDATIONS;
  const key = Object.keys(RECOMMENDATIONS).find(k => region.includes(k));
  return key ? RECOMMENDATIONS[key] : DEFAULT_RECOMMENDATIONS;
}
