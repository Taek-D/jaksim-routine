# 작심루틴 (Jaksim Routine)

> "작심삼일도 괜찮아요 — 다시 시작하면 되니까."

토스 미니앱(Apps in Toss) 기반의 일상 루틴 트래커.
원탭 체크인, 연속 기록(스트릭), 배지, 주간 리포트, IAP 프리미엄 기능을 제공합니다.

---

## Tech Stack

| 영역 | 기술 |
|------|------|
| Framework | React 18 + TypeScript + Vite |
| Routing | React Router v6 (SPA) |
| State | React Context (`AppStateProvider`) |
| Storage | localStorage (`storageDriver`) |
| Backend | Supabase (RPC) / InMemory stub |
| Platform | Toss Mini App SDK (window bridge) |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) |
| Icons | Material Symbols Outlined (Google Fonts CDN) |
| Animation | Motion (Framer Motion) + canvas-confetti |
| Utilities | clsx + tailwind-merge (`cn()` 헬퍼) |

---

## 프로젝트 구조

```
src/
  app/           라우팅, 딥링크, 온보딩 가드
  analytics/     토스 Analytics 브릿지
  backend/       Supabase / InMemory 백엔드
  components/    공유 UI 컴포넌트 (AppShell, BadgeOverlay, Icon, NoteModal, WarningToast)
  config/        앱 설정 (지원 이메일, 약관 URL)
  domain/        도메인 모델, 진행도 계산, 배지 로직, 템플릿
  integrations/  토스 SDK 브릿지 (IAP, Identity, MiniApp)
  lib/           유틸 함수 (cn)
  pages/         라우트 페이지 컴포넌트
  state/         AppStateProvider (Context 기반 전역 상태) + selectors
  storage/       localStorage 영속화 계층
  utils/         날짜(KST), ID 유틸리티
```

---

## 페이지별 기능 명세

### 1. 온보딩 (`/onboarding`) — `OnboardingPage`

첫 실행 시 1회만 표시되는 3단계 소개 슬라이드.

| 슬라이드 | 이모지 | 제목 | 설명 |
|----------|--------|------|------|
| 1 | 🧭 | 작심삼일도 괜찮아요 | 멈췄다가 다시 시작해도 됩니다 |
| 2 | ✅ | 오늘 할 일 하나만 체크해요 | 한 번 탭으로 완료 체크 |
| 3 | 📈 | 실패해도 기록은 남아요 | 성장 기록은 사라지지 않음 |

**UI 요소**
- 슬라이드 인디케이터 (상단 도트, 활성=넓은 막대)
- AnimatePresence 슬라이드 전환 애니메이션
- 이모지 원형 배경 (`w-40 h-40 rounded-full bg-gray-50`)
- 하단 고정 버튼 (`h-[56px] rounded-[18px]`)
- 슬라이드 1~2: "다음" 버튼 (primary)
- 슬라이드 3: "루틴 시작하기" (primary) + "나중에" (secondary)
- `?next=` 파라미터로 딥링크 목적지 보존

---

### 2. 홈 (`/home`) — `HomePage`

오늘 예정된 루틴 목록과 체크인 액션을 제공하는 메인 화면.

**UI 요소**
- **날짜 헤더**: KST 기준 오늘 날짜 (`22px bold`) + 최고 스트릭 pill 배지 (오렌지)
- **프로그레스 카드** (`rounded-[20px]`): 완료 수/전체 + 달성률 pill + 애니메이션 프로그레스 바 (`motion.div`, emerald 그라데이션)
- **루틴 카드** (`rounded-[20px]`): 오늘 요일에 해당하는 루틴만 필터
  - 상태 pill: 완료됨(초록) / 건너뜀(회색) / N일 연속(오렌지) / 미체크(회색)
  - 루틴 제목 (링크 → 상세)
  - 완료 시: 초록 배경(`bg-emerald-50/60`), 메모 인라인 표시 (좌측 보더 액센트)
  - 미완료 시: "완료" / "메모" / "건너뜀" 3버튼 그리드
  - 체크인 완료 시 confetti 애니메이션
- **메모 입력**: `NoteModal` 바텀시트 (최대 120자 textarea)
- **건너뜀 경고**: `WarningToast` — 스트릭 초기화 경고 + 확인/취소
- **하단 플로팅 액션바**: "루틴 추가" (primary) + "주간 리포트" (secondary)

**조건부 배너**
| 조건 | 메시지 | CTA |
|------|--------|-----|
| 환불 감지 | "환불이 확인되어 이용권이 해제됐어요" | → 페이월 |
| 체험 만료 | "무료 체험이 만료됐어요" | → 페이월 |
| 보관된 루틴 있음 (무료) | "숨겨진 루틴이 N개 있어요" | → 페이월 |
| 루틴 없음 | "첫 루틴을 만들어볼까요?" | → 루틴 생성 |

---

### 3. 루틴 생성 (`/routine/new`) — `RoutineNewPage`

새 루틴을 만드는 폼 화면.

**UI 요소**
- **헤더**: 뒤로가기 화살표 + "새 루틴 만들기" 중앙 제목
- **제목 입력** (`rounded-xl`, focus ring): 최대 20자, 우측 글자수 카운터 (N/20)
- **추천 루틴**: pill 버튼 (`rounded-2xl`), 선택 시 검정 배경 + 흰 텍스트
  - 운동 30분, 공부 45분, 절약 기록, 정리 15분, 독서 10페이지 (모두 월~금)
  - 선택 시 제목·요일 자동 입력
- **요일 선택**: 원형 버튼 (`w-11 h-11 rounded-full`), 선택 시 shadow + `active:scale-90` 터치 피드백
- **"주 N일 실천해요"** 카운트 텍스트
- **저장 버튼** (`h-[52px] rounded-2xl`, 하단 고정): 무료 3개 제한 초과 시 → `/paywall`

---

### 4. 루틴 상세 (`/routine/:routineId`) — `RoutineDetailPage`

개별 루틴의 기록 히스토리와 액션 제공.

**UI 요소**
- **헤더**: 루틴 제목 (`22px bold`), 목표 요일 표시, 현재 스트릭
- **최근 기록 카드** (`rounded-[20px]`): 최대 14개 체크인 리스트
  - 각 항목: 날짜, 상태 (완료/건너뜀), 메모(있을 경우)
- **액션 행**: "오늘 메모+완료" (NoteModal) / "편집" (→ edit 페이지) / "다시 시작하기"
- **다시 시작하기**: `restartAt` 설정으로 스트릭 기준점 리셋
- **루틴 없음 상태**: "루틴을 찾을 수 없어요" + "홈으로" 버튼

---

### 5. 루틴 편집 (`/routine/:routineId/edit`) — `RoutineEditPage`

기존 루틴의 제목, 목표 횟수, 요일을 수정하거나 삭제.

**UI 요소**
- **헤더**: 뒤로가기 화살표 + "루틴 편집" 중앙 제목
- **제목 입력** (`rounded-xl`): 기존 값 프리필, 최대 20자
- **하루 목표 횟수**: 숫자 입력 (1~10)
- **요일 선택**: 원형 버튼 (`w-11 h-11 rounded-full`, `active:scale-90`)
- **저장 버튼** (`rounded-2xl`, 하단 고정)
- **루틴 삭제 버튼** (빨간 텍스트): `confirm()` 확인 후 삭제 → 홈

---

### 6. 주간 리포트 (`/report`) — `ReportPage`

주간 루틴 달성 통계와 배지를 보여주는 대시보드.

**UI 요소**
- **주간 네비게이션**: Material Symbols 화살표 + 주간 라벨 ("2월 17일 ~ 2월 23일") + 다음 주 (현재 주면 disabled)
- **전체 달성률 카드** (`rounded-[20px]`): 큰 숫자 (`34px bold`) + 변화량 pill + `monitoring` 아이콘
- **동기부여 코멘트** (`bg-[#f9fafb] rounded-xl`):
  - ≥80%: "이번 주 최고예요! 🎉"
  - ≥50%: "절반 이상 해냈어요 💪"
  - <50%: "다시 시작해도 괜찮아요. 다음 주가 있어요 🔄"
- **최고 요일 표시** (가장 많이 완료한 요일)
- **루틴별 카드**: 아이콘 원형 + 이름 + 목표 + 애니메이션 프로그레스 바 (`motion.div`) + 스트릭 pill
- **배지 그리드**: 3열, 원형 아이콘 + 라벨 (미획득 배지 `opacity-50 grayscale`)

---

### 7. 설정 (`/settings`) — `SettingsPage`

이용권 관리, 고객 지원, 데이터 관리.

**UI 요소**
- **배경**: `bg-[#f4f6f8]`
- **멤버십 카드**: Basic/Premium 뱃지 + 만료일 (한국어 날짜 포맷) + CTA 링크
- **섹션 그룹**: 회색 라벨 + 흰색 `rounded-[14px]` 카드 리스트
- **고객 지원**: Material Symbols 아이콘 + `chevron_right`
  - 고객센터 메일, 이용약관, 개인정보처리방침
- **이용권 관리**: 복원하기, 이용권 이력 보기
- **데이터 관리**: 빨간 `delete` 아이콘 + 경고 텍스트
  - 데이터 초기화 시 멤버십은 보존됨

---

### 8. 이용권 이력 (`/settings/entitlements`) — `EntitlementHistoryPage`

구매/환불 내역 조회.

**UI 요소**
- **이력 리스트**: SKU, 상태 (COMPLETED/REFUNDED), 타임스탬프
- **빈 상태**: "아직 이용권 내역이 없어요"
- **"설정으로 돌아가기" 버튼**

---

### 9. 페이월 (`/paywall`) — `PaywallPage`

프리미엄 업셀 + IAP 구매 화면.

**UI 요소**
- **히어로**: `workspace_premium` 아이콘 (블루 라운드 박스) + "프리미엄 이용권" 대형 제목
- **혜택 리스트**: 아이콘 원형 + 제목 + 설명
  - 루틴 제한 해제 / 확장 통계(예정) / 템플릿 팩(예정)
- **상품 선택**: 라디오 카드 (선택 시 `border` + `ring`) + 체크 원형
  - 월 1,900원 / 연 14,900원 ("BEST VALUE" 뱃지)
  - SDK에서 동적 로드, 폴백 고정값
- **하단 고정**: "7일 무료 체험 시작하기" (primary) + "괜찮아요, 무료로 계속할게요" (secondary)
- **만료일 표시**: 한국어 날짜 포맷 (예: "2026년 3월 1일")
- `?trigger=` 파라미터로 진입 경로 구분 (routine_limit, settings, trial_expired 등)

---

### 10. 404 (`*`) — `NotFoundPage`

- 중앙 정렬 `rounded-[20px]` 카드: "페이지를 찾을 수 없어요" + "홈으로" 버튼

---

## 공유 컴포넌트

| 컴포넌트 | 설명 | 사용 위치 |
|----------|------|----------|
| `AppShell` | 상단 네비 + 플로팅 탭바 + 오버레이를 감싸는 앱 쉘 | 모든 페이지 |
| `BadgeOverlay` | 배지 획득 축하 오버레이 (앰버 그라데이션 카드) | 홈 (체크인 후) |
| `Icon` | Material Symbols Outlined 아이콘 래퍼 | 전체 |
| `NoteModal` | 바텀시트 메모 입력 다이얼로그 (`rounded-2xl`) | 홈, 루틴 상세 |
| `WarningToast` | 하단 경고 토스트 | 홈 (건너뜀 시) |

### AppShell 구조

```
┌─────────────────────────────────┐
│  [✓] 작심루틴          [⋯] [✕] │  ← 상단 네비 (sticky, 48px)
├─────────────────────────────────┤
│                                 │
│         <page content>          │  ← 메인 콘텐츠 (bg-[#f4f6f8])
│                                 │
│                                 │
│  ┌───────────────────────────┐  │
│  │   홈    │  리포트  │  설정 │  │  ← 플로팅 탭바 (fixed bottom-4)
│  └───────────────────────────┘  │     backdrop-blur, rounded-2xl
└─────────────────────────────────┘
```

- **더보기 메뉴**: "⋯" 클릭 시 오버레이 — "신고하기" / "공유하기" / "닫기"
- **미니 토스트**: 공유/신고 후 2.2초 자동 닫힘 알림

---

## 네비게이션 플로우

```
앱 시작
  │
  ├── 온보딩 미완료 ──→ /onboarding (3단계) ──→ /routine/new 또는 /home
  │
  └── 온보딩 완료 ──→ /home (또는 딥링크 목적지)
                        │
                        ├── 루틴 카드 클릭 ──→ /routine/:id
                        │                        ├── 편집 ──→ /routine/:id/edit
                        │                        └── 다시 시작 ──→ /home
                        │
                        ├── + 루틴 추가 ──→ /routine/new
                        │                    └── 제한 초과 ──→ /paywall
                        │
                        ├── 주간 리포트 ──→ /report
                        │
                        └── 탭: 설정 ──→ /settings
                                          ├── 이용권 이력 ──→ /settings/entitlements
                                          ├── 이용권 보기 ──→ /paywall
                                          └── 데이터 초기화 ──→ /onboarding (멤버십 보존)
```

**딥링크**: `intoss://jaksim-routine/{target}` — 지원 경로: `/home`, `/report`, `/routine/new`

---

## UI 디자인 가이드라인

### 디자인 기조

Tailwind CSS v4 유틸리티 클래스 기반. Material Symbols Outlined 아이콘. 토스 디자인 시스템(TDS)의 핵심 원칙을 참고합니다.

| 원칙 | 적용 방식 |
|------|----------|
| **간결함** | 화면당 하나의 핵심 액션에 집중. 불필요한 장식 최소화 |
| **밀도** | 카드 기반 레이아웃 (`rounded-[20px]`), 적절한 간격 (`gap-3~5`), 컴팩트한 요소 |
| **접근성** | 최소 터치 타겟 44px, 명확한 색상 대비, 큰 폰트 사이즈 |
| **피드백** | 체크인 → confetti + 배지 오버레이, 건너뜀 → 경고 토스트, 공유 → 미니 토스트 |
| **일관성** | `rounded-[20px]` 카드, `rounded-2xl` 버튼, 통일된 색상 팔레트 |
| **애니메이션** | Motion 라이브러리로 프로그레스 바, 카드 진입, 슬라이드 전환 |

### 레이아웃

| 속성 | 값 |
|------|-----|
| 최대 너비 | `max-w-[640px]` (모바일 최적화) |
| 배경색 | 바디/콘텐츠 `#f4f6f8` / 카드 `#ffffff` |
| 카드 스타일 | `rounded-[20px] shadow-sm` |
| 상단 네비 | `sticky top-0 z-10`, 48px, `border-b border-gray-100` |
| 하단 탭 | `fixed bottom-4`, 플로팅 `rounded-2xl`, `backdrop-blur-md` |
| 오버레이 | z-index: 100 (모달), 130 (미니 토스트) |

### 컬러 팔레트

| 용도 | Hex |
|------|-----|
| 텍스트 (기본) | `#101828` |
| 텍스트 (보조) | `#344054` |
| 텍스트 (음소거) | `#475467` |
| Primary 버튼 배경 | `#111827` |
| Secondary 버튼 배경 | `#f2f4f7` |
| Danger 텍스트 | `#b42318` |
| 카드 배경 | `#ffffff` |
| 완료 상태 배경 | `emerald-50/60` |
| 스트릭 pill | `orange-50` / `orange-700` |
| 프로그레스 바 | `emerald-400 → emerald-600` (그라데이션) |
| 미니 토스트 배경 | `#101828` |
| 바디 배경 | `#f4f6f8` |

### 타이포그래피

| 용도 | 크기 | 두께 |
|------|------|------|
| 대제목 (날짜 등) | 22px | 700 (bold) |
| 카드 내 제목 | 16~18px | 700 |
| 본문 / 버튼 | 15px | 500~600 |
| 보조 텍스트 | 13~14px | 400~500 |
| 대형 수치 (리포트) | 34px | 700 |
| 상태 pill | 11~13px | 700 |

### 주요 컴포넌트 스펙

#### 버튼

| 종류 | 스타일 |
|------|--------|
| Primary | `bg-[#111827] text-white rounded-2xl h-[52px] font-bold` |
| Secondary | `bg-[#f2f4f7] text-[#344054] rounded-xl h-[44px] font-medium` |
| Danger | `text-[#b42318]` (텍스트만) |
| Pill/Chip (기본) | `bg-[#f2f4f7] text-[#344054] rounded-2xl` |
| Pill/Chip (활성) | `bg-[#111827] text-white rounded-2xl` |
| 요일 토글 | `w-11 h-11 rounded-full`, 활성: `bg-[#111827] text-white shadow-md` |
| 터치 피드백 | `active:scale-[0.95~0.98]` |

#### 카드

```
bg-white rounded-[20px] p-5 shadow-sm
완료 상태: bg-emerald-50/60 border-emerald-100
```

#### 프로그레스 바

```
트랙: bg-[#f2f4f7] rounded-full h-3 shadow-inner
필: motion.div bg-gradient-to-r from-emerald-400 to-emerald-600 (애니메이션)
```

#### z-index 체계

| 레이어 | z-index | 용도 |
|--------|---------|------|
| 상단 네비 | 10 | NavigationBar |
| 하단 플로팅 액션 | 40 | 루틴 추가 / 리포트 버튼 |
| 하단 플로팅 탭 | 50 | 홈 / 리포트 / 설정 |
| 오버레이 (모달) | 100 | NoteModal, 더보기 메뉴 |
| 미니 토스트 | 130 | 공유/신고 알림 |

---

## 도메인 모델 요약

### 루틴 (Routine)

| 필드 | 타입 | 설명 |
|------|------|------|
| id | string | `routine_{timestamp}_{random}` |
| title | string | 최대 20자 |
| daysOfWeek | DayOfWeek[] | MON~SUN 중 선택 |
| goalPerDay | number | 1~10 |
| createdAt | string | ISO 타임스탬프 |
| restartAt? | string | "다시 시작" 시점 |
| archivedAt? | string | 무료 제한 초과 시 보관 |

### 체크인 (Checkin)

| 필드 | 타입 | 설명 |
|------|------|------|
| id | string | `checkin_{timestamp}_{random}` |
| routineId | string | 연결된 루틴 |
| date | string | KST 날짜 "YYYY-MM-DD" |
| status | `COMPLETED` \| `SKIPPED` | 완료 또는 건너뜀 |
| note? | string | 메모 (최대 120자) |
| createdAt | string | ISO 타임스탬프 |

### 배지 (Badge)

| 배지 | 조건 | 라벨 |
|------|------|------|
| FIRST_CHECKIN | 첫 체크인 완료 | 첫 체크인 |
| STREAK_3 | 3일 연속 | 3일 연속 |
| STREAK_7 | 7일 연속 | 7일 연속 |
| STREAK_14 | 14일 연속 | 14일 완주 |
| COMEBACK | 건너뜀/재시작 후 복귀 | 다시 시작 |

### 이용권 정책

| 구분 | 무료 | 프리미엄 |
|------|------|---------|
| 활성 루틴 | 최대 3개 | 제한 해제 |
| 무료 체험 | 7일 (1회) | — |
| 월 이용권 | — | 1,900원 (30일) |
| 연 이용권 | — | 14,900원 (365일) |

---

## 개발 참고사항

1. **모바일 퍼스트**: 모든 화면은 640px 이하 모바일 뷰포트 기준
2. **라이트 모드 전용**: 다크 모드 미지원 (`color-scheme: light` 고정)
3. **핀치 줌 비활성**: `user-scalable=no` (토스 미니앱 요구사항)
4. **터치 타겟**: 모든 인터랙티브 요소 최소 44px 높이
5. **KST 기준**: 모든 날짜 표시는 한국 시간 (Asia/Seoul)
6. **TDS 톤 유지**: 토스 앱 내에서 실행되므로, 간결한 UI 톤 — 모노톤 + 미니멀 카드 레이아웃
7. **피드백 레이어**: 배지 획득, 건너뜀 경고, confetti 축하 등 사용자 액션마다 적절한 피드백 존재
8. **데이터 초기화**: 루틴/체크인/배지만 초기화, 멤버십(이용권)은 보존

---

## 개발 커맨드

```bash
pnpm dev            # 개발 서버 (localhost:5173)
pnpm build          # 프로덕션 빌드
pnpm typecheck      # 타입 검사
pnpm lint           # ESLint
pnpm qa:iap:static  # IAP 정적 분석
```
