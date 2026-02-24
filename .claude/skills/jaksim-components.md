---
name: jaksim-components
description: UI 컴포넌트, 디자인 패턴, 스타일링 관련 작업 시 적용. Use when working with component, UI, button, modal, card, overlay, toast, styling, tailwind, emotion, animation.
---

# UI Components

## 개요
공유 UI 컴포넌트와 페이지 컴포넌트의 패턴 및 스타일링 규칙.

## 핵심 파일
- `src/components/` - 공유 컴포넌트
- `src/pages/` - 라우트 페이지 컴포넌트
- `src/lib/utils.ts` - `cn()` 유틸리티 (clsx + tailwind-merge)
- `src/styles.css` - 글로벌 스타일

## 컴포넌트 목록

### 공유 컴포넌트 (`src/components/`)
| 컴포넌트 | 용도 |
|----------|------|
| `AppShell` | 앱 전체 레이아웃 쉘 |
| `RoutineCard` | 루틴 카드 (홈에서 체크인 포함) |
| `DaySelector` | 요일 선택 UI |
| `HeatmapGrid` | 체크인 히트맵 |
| `BadgeOverlay` | 배지 획득 오버레이 (canvas-confetti) |
| `NoteModal` | 체크인 메모 모달 |
| `WarningToast` | 경고 토스트 |
| `StreakShieldPrompt` | 스트릭 보호권 프롬프트 |
| `Icon` | SVG 아이콘 컴포넌트 |
| `RoutineNotFound` | 루틴 미발견 fallback |

### 페이지 컴포넌트 (`src/pages/`)
| 페이지 | 용도 |
|--------|------|
| `HomePage` | 메인 (루틴 목록 + 오늘의 체크인) |
| `OnboardingPage` | 온보딩 플로우 |
| `RoutineNewPage` | 루틴 생성 폼 |
| `RoutineDetailPage` | 루틴 상세 + 히트맵 |
| `RoutineEditPage` | 루틴 수정 폼 |
| `ReportPage` | 주간 리포트 |
| `PaywallPage` | 프리미엄 구매/업셀 |
| `SettingsPage` | 설정 |
| `EntitlementHistoryPage` | 구매/환불 이력 |
| `NotFoundPage` | 404 |

## 스타일링 규칙

### Tailwind CSS v4
- `cn()` 헬퍼로 조건부 클래스 병합: `cn("base", condition && "extra")`
- Tailwind Merge로 충돌 해결
- 반응형은 모바일 퍼스트 (Toss Mini App은 모바일 전용)

### Emotion
- `@emotion/react`의 `css` prop은 Tailwind로 표현 어려운 복잡한 동적 스타일에만 사용
- 대부분은 Tailwind 클래스로 처리

### Toss Design System
- `@toss/tds-mobile` 컴포넌트 활용 (Button, Input 등)
- `@toss/tds-mobile-ait` (apps-in-toss 전용 확장)

### 애니메이션
- `motion` 라이브러리 (framer-motion 후속)
- 페이지 전환, 카드 인터랙션 등에 활용

## 컴포넌트 작성 패턴

### 기본 구조
```typescript
import { cn } from "../lib/utils";

type MyComponentProps = {
  title: string;
  active?: boolean;
  onPress?: () => void;
};

function MyComponent({ title, active, onPress }: MyComponentProps) {
  return (
    <div className={cn("p-4 rounded-lg", active && "bg-blue-100")}>
      {title}
    </div>
  );
}

export { MyComponent };
```

### 규칙
- `export default` 지양 → named export 사용
- Props는 `type`으로 정의 (component props의 경우 `interface`도 허용)
- 이벤트 핸들러: `on` 접두사 (`onPress`, `onClick`, `onDismiss`)
- 조건부 렌더링: `&&` 연산자 또는 삼항연산자
- 리스트 렌더링: `.map()` + 고유 `key`

## 자주 사용하는 명령어
- `pnpm typecheck` - 컴포넌트 props 변경 후 전체 검증
- `pnpm lint` - React hooks 규칙 위반 체크
