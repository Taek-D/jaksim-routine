# 작업 규칙 (Apps in Toss miniapp)
- PRD는 docs/PRD.md가 소스 오브 트루스.
- 클라이언트: React + TypeScript (WebView miniapp).
- 로컬 저장소(Storage) 기반으로 루틴/체크인/배지/권한 저장.
- MVP 범위: 루틴(무료 3개 제한), 원탭 체크인(완료/건너뜀+경고), 스트릭/배지, 주간 리포트, 다시 시작, 페이월/IAP 흐름.
- 앱인토스 제약 준수: 라이트모드 고정, 핀치줌 비활성(meta viewport), 외부 링크/자사앱 유도 금지, 필요 시 openURL만 사용.
- 작은 PR 단위로: "계획→1단계 구현→동작 확인" 반복.
