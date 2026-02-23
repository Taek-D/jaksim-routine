type RoutineColorSet = {
  accent: string;
  bgTint: string;
  iconBg: string;
  iconText: string;
  progressBar: string;
};

const PALETTE: RoutineColorSet[] = [
  {
    accent: "border-l-emerald-500",
    bgTint: "bg-emerald-50/30",
    iconBg: "bg-emerald-100",
    iconText: "text-emerald-600",
    progressBar: "bg-emerald-500",
  },
  {
    accent: "border-l-blue-500",
    bgTint: "bg-blue-50/30",
    iconBg: "bg-blue-100",
    iconText: "text-blue-600",
    progressBar: "bg-blue-500",
  },
  {
    accent: "border-l-violet-500",
    bgTint: "bg-violet-50/30",
    iconBg: "bg-violet-100",
    iconText: "text-violet-600",
    progressBar: "bg-violet-500",
  },
];

// 순서 중요: 구체적 키워드가 먼저, 포괄적 키워드가 뒤에
const KEYWORD_ICON_MAP: [string[], string][] = [
  // 기상 / 아침 — 해 모양
  [["기상", "일어나기", "얼리버드", "미라클모닝"], "wb_sunny"],
  // 아침 루틴 전반
  [["아침", "모닝"], "light_mode"],
  // 수면 / 취침
  [["수면", "잠", "취침", "일찍 자기", "숙면", "밤"], "bedtime"],
  // 운동 — 웨이트/근력 계열
  [["헬스", "스쿼트", "푸쉬업", "풀업", "플랭크", "웨이트", "근력", "벤치프레스", "데드리프트", "덤벨"], "fitness_center"],
  // 운동 — 달리기/유산소 계열
  [["달리기", "러닝", "조깅", "마라톤", "유산소", "사이클", "자전거"], "directions_run"],
  // 운동 — 걷기/산책
  [["걷기", "산책", "걸음", "만보"], "hiking"],
  // 운동 — 수영
  [["수영", "물놀이"], "pool"],
  // 운동 — 포괄
  [["운동", "체육", "홈트", "워크아웃"], "exercise"],
  // 요가/스트레칭
  [["요가", "스트레칭", "필라테스", "유연성"], "self_improvement"],
  // 명상/마음챙김
  [["명상", "마음챙김", "호흡", "마인드풀니스", "심호흡"], "spa"],
  // 독서/책
  [["독서", "읽기", "책", "리딩", "도서"], "auto_stories"],
  // 공부/학습
  [["공부", "학습", "시험", "수능", "자격증", "인강"], "school"],
  // 영어/외국어
  [["영어", "외국어", "언어", "단어", "토익", "회화", "일본어", "중국어", "스페인어"], "translate"],
  // 코딩/개발
  [["코딩", "개발", "프로그래밍", "알고리즘", "깃허브"], "code"],
  // 물/수분
  [["물", "수분", "마시기", "물마시기"], "water_drop"],
  // 식사/영양
  [["식사", "밥", "식단", "영양", "건강식", "채소", "과일"], "restaurant"],
  // 다이어트/체중
  [["다이어트", "체중", "칼로리", "감량", "몸무게"], "monitor_weight"],
  // 비타민/약
  [["비타민", "영양제", "약 먹", "약 챙", "유산균", "보충제", "복용"], "medication"],
  // 글쓰기/일기
  [["일기", "저널", "글쓰기", "기록", "다이어리", "일지"], "edit_note"],
  // 그림/예술
  [["그림", "드로잉", "스케치", "그리기", "일러스트", "캘리"], "brush"],
  // 디자인
  [["디자인", "피그마", "UI", "UX"], "palette"],
  // 음악
  [["음악", "피아노", "기타", "노래", "악기", "연주", "작곡", "보컬"], "music_note"],
  // 사진
  [["사진", "촬영", "카메라"], "photo_camera"],
  // 청소/정리
  [["청소", "정리", "빨래", "집안일", "정돈", "미니멀"], "cleaning_services"],
  // 요리
  [["요리", "쿡", "레시피", "베이킹", "반찬"], "skillet"],
  // 돈/저축
  [["저축", "절약", "가계부", "돈", "재테크", "투자", "소비"], "savings"],
  // 감사/긍정
  [["감사", "긍정", "칭찬", "행복"], "favorite"],
  // 자연/환경/식물
  [["자연", "환경", "식물", "화분", "물주기", "가드닝"], "eco"],
  // 뉴스/정보
  [["뉴스", "신문", "시사", "트렌드"], "newspaper"],
  // SNS/디톡스
  [["디톡스", "스크린", "스마트폰", "폰", "sns"], "phone_android"],
  // 먹기 — 포괄 (위 식사와 별개로 간식 등)
  [["먹기", "간식", "야식"], "lunch_dining"],
  // 습관 — 가장 포괄적이므로 맨 뒤
  [["습관", "루틴", "챌린지", "도전"], "flag"],
];

const FALLBACK_ICONS = [
  "check_circle",
  "target",
  "star",
  "bolt",
  "emoji_objects",
  "thumb_up",
];

function hashId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function getRoutineIcon(title: string, id: string): string {
  const normalized = title.toLowerCase();
  for (const [keywords, icon] of KEYWORD_ICON_MAP) {
    if (keywords.some((kw) => normalized.includes(kw))) {
      return icon;
    }
  }
  return FALLBACK_ICONS[hashId(id) % FALLBACK_ICONS.length];
}

export function getRoutineColor(id: string): RoutineColorSet {
  return PALETTE[hashId(id) % PALETTE.length];
}
