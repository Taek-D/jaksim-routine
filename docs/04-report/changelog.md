# 작심루틴 PDCA 변경로그

> 각 기능 완료 시 자동으로 업데이트됩니다.
> 모든 항목은 완료된 순서대로 기록됩니다.

---

## [2026-02-25] - review-rejection-fix: App Store Review 반려 사유 사전 수정

### Summary
타 앱 심사 반려 사유 4건을 작심루틴에 대입하여 심사 통과율을 높이기 위한 예방적 수정. **100% 요구사항 충족** (6/6 completion criteria pass, 0 iteration).

**PDCA Cycle**: #1 | **Duration**: 2 days | **Match Rate**: 100%

### Added
- Deeplink 경로 확장: `/settings`, `/paywall`, `/routine/:id` 동적 패턴 지원
- Deeplink query param 지원: `?next=` parameter로 리다이렉트 경로 지정
- App path prefix 처리: `/jaksim-routine/` prefix 제거 후 재탐색

### Changed
- `granite.config.ts`: `withBackButton: true` → `withBackButton: false`
  - 토스 미니앱 네이티브 뒤로가기 비활성화
  - 앱 자체 뒤로가기 버튼 유지로 중복 노출 해결

### Fixed
- **반려 사유 #1 부분 해결**: 랜딩스킴 접근 불가 → 딥링크 경로 확장
- **반려 사유 #2 해결**: 브랜드 로고 미표시 → Supabase URL 확인 및 설정 검증
- **반려 사유 #4 해결**: 뒤로가기 중복 노출 → `withBackButton: false` 설정

### Files Modified
- `granite.config.ts`
- `src/app/deeplink.ts`

### Commits
- `bafef29` - fix: resolve review rejection issues — duplicate back button, deeplink, logo
- `0261cc0` - fix: update default URLs to live GitHub Pages for terms and privacy (follow-up)

### Quality Metrics
- Design Match Rate: 100% ✅
- Completion Criteria: 6/6 ✅
- Code Quality: Pass ✅
- Type Safety: Pass ✅
- Iterations: 0 (첫 구현부터 완벽)

### Documentation
- [Plan](./features/review-rejection-fix.plan.md)
- [Gap Analysis](../03-analysis/review-rejection-fix.analysis.md)
- [Completion Report](./review-rejection-fix.report.md)

---

## Document Standards

### Format
각 변경로그 항목은 다음 구조를 따릅니다:

```markdown
## [YYYY-MM-DD] - {feature-name}: {한줄 설명}

### Summary
{상세 설명, PDCA 주요 지표 포함}

### Added
- {추가된 항목}

### Changed
- {변경된 항목}

### Fixed
- {수정된 버그}

### Files Modified
- {수정된 파일 목록}

### Commits
- {커밋 해시} - {메시지}

### Quality Metrics
- {메트릭}

### Documentation
- {관련 문서 링크}
```

### Related Documents
- PDCA Plan: `docs/01-plan/features/`
- PDCA Design: `docs/02-design/features/`
- PDCA Analysis: `docs/03-analysis/`
- PDCA Reports: `docs/04-report/`
