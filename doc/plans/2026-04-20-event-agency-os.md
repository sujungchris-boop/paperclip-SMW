# Event Agency OS — 프로젝트 계획

## 프로젝트 목표
Chris & Partners 이벤트 에이전시 업무를 AI 에이전트로 자동화하는 전용 OS.
Paperclip의 오케스트레이션 엔진 위에 이벤트 에이전시 특화 레이어를 얹는다.

## 회사 소개
- 회사명: Chris & Partners
- 성격: 서울 기반 국제 이벤트 에이전시(PCO), 40개국 이상 운영
- 자체 이벤트 브랜드:
  - AI Builders Conference (구 Seoul Meta Week / SMW)
  - 서브타이틀: "코드 없이도, 코드로도"
  - AI Marketing Summit 2026
  - AI InvestCon 2026

## 에이전트 팀 구성
| 에이전트 | 역할 | 주요 업무 |
|---------|------|---------|
| Director | CEO | 자연어 명령 수신 → 하위 에이전트 위임 |
| Proposal | Sales Manager | 클라이언트 브리프 → 제안서 초안 |
| Lead | BDR | 인바운드 리드 분류 + 1차 응답 |
| Ops | Project Manager | 행사 체크리스트 생성 + 태스크 추적 |
| Marketing | CMO | 자사 행사 마케팅 콘텐츠 생성 |
| Sponsor | Partnership Manager | 스폰서 리서치 + 아웃리치 |
| Finance | CFO | 견적/인보이스 생성 + 예산 추적 |

## 행사 파이프라인 단계
문의접수 → 제안서작성 → 계약완료 → 기획중 → 운영중 → 완료 → 정산

## 커스터마이징 범위
### 추가/수정하는 것
- .agents/skills/ — 에이전트별 SKILL.md 7개
- doc/plans/ — 이 문서 포함 기획 문서들
- ui/src/ — 이벤트 파이프라인 뷰 추가

### 절대 건드리지 않는 것
- server/src/core/ — 오케스트레이션 엔진 코어
- cli/ — CLI 진입점
- DB 마이그레이션 코어 파일
이유: 업스트림(paperclipai/paperclip) 업데이트를 계속 받아야 하기 때문

## 업스트림 동기화 전략
- origin: sujungchris-boop/agency-os (우리 포크)
- upstream: paperclipai/paperclip (원본)
- 월 1회 upstream 체크: git fetch upstream → git merge upstream/master
- 충돌 원칙: 엔진 코어는 upstream 우선, SKILL.md와 커스텀 UI는 우리 것 유지
