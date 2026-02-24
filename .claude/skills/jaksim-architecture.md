---
name: jaksim-architecture
description: 전체 아키텍처, 폴더 구조, 의존성 방향, 라우팅 관련 작업 시 적용. Use when working with architecture, folder structure, routing, dependency, module, import, project structure.
---

# Architecture

## 개요
작심루틴은 Toss Mini App 플랫폼 위에 React SPA로 구동되는 루틴 트래킹 앱이다.
Vite로 번들링하고, React Router v6로 클라이언트 라우팅한다.

## 폴더 구조 및 의존성 방향
```
src/
  main.tsx              ← 엔트리포인트
  app/                  ← App 쉘, 라우팅, 딥링크
    App.tsx             ← AppStateProvider 감싸기, 라우팅 설정
    AppRoutes.tsx       ← Route 정의
    deeplink.ts         ← 딥링크 파싱
  pages/                ← 라우트별 페이지 컴포넌트
  components/           ← 공유 UI 컴포넌트
  domain/               ← 순수 비즈니스 로직 (React 의존 없음)
    models.ts           ← 타입 정의
    progress.ts         ← 스트릭, 배지, 리포트 계산
    templates.ts        ← 루틴 템플릿
  state/                ← React Context 기반 상태관리
    AppStateProvider.tsx ← 전역 Provider + 액션
    selectors.ts        ← 파생 상태 조회
  storage/              ← localStorage 추상화
  integrations/         ← 토스 SDK 브릿지
  backend/              ← 백엔드 계약/스텁 (Supabase 포함)
  analytics/            ← 분석 이벤트
  config/               ← 환경 설정
  utils/                ← 날짜, ID 유틸리티
  lib/                  ← 공통 라이브러리 유틸 (clsx/twMerge)
```

## 의존성 방향 규칙
```
pages → components, state, domain, integrations
components → domain, utils, lib
state → domain, storage, backend, integrations
domain → utils (순수 함수, React 무관)
storage → (독립)
integrations → (독립, window 브릿지)
backend → integrations, storage
```

**금지 방향:**
- `domain/` → `state/`, `components/`, `pages/` (역방향 의존 금지)
- `storage/` → `state/` (역방향 의존 금지)
- `components/` → `pages/` (역방향 의존 금지)

## 라우팅 구조
| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/` | HomePage | 메인 (루틴 목록 + 체크인) |
| `/onboarding` | OnboardingPage | 첫 실행 온보딩 |
| `/routine/new` | RoutineNewPage | 루틴 생성 |
| `/routine/:id` | RoutineDetailPage | 루틴 상세 |
| `/routine/:id/edit` | RoutineEditPage | 루틴 수정 |
| `/report` | ReportPage | 주간 리포트 |
| `/paywall` | PaywallPage | 프리미엄 구매 |
| `/settings` | SettingsPage | 설정 |
| `/entitlement-history` | EntitlementHistoryPage | 구매 이력 |
| `*` | NotFoundPage | 404 |

## 기술 스택 요약
| 항목 | 기술 |
|------|------|
| 런타임 | React 18 |
| 빌드 | Vite 6 |
| 라우팅 | React Router v6 |
| CSS | Tailwind CSS v4 + Emotion |
| 컴포넌트 | @toss/tds-mobile (Toss Design System) |
| 상태관리 | React Context + useReducer 패턴 |
| 저장소 | localStorage (StorageDriver 추상화) |
| 백엔드 | Supabase + localStorage 스텁 |
| 플랫폼 SDK | @apps-in-toss/web-framework |
| 애니메이션 | motion (framer-motion 후속) |

## 빌드/배포
- `pnpm build` → Vite 프로덕션 빌드
- `pnpm granite:build` → Toss Mini App 빌드 (apps-in-toss 프레임워크)
- `pnpm granite:dev` → Toss Mini App 개발 서버
