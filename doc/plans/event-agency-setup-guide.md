# Chris & Partners AI OS — Paperclip 초기 셋업 가이드

## Step 1: Company 생성
- 회사명: Chris & Partners AI OS
- 미션: 이벤트 에이전시 업무의 80%를 AI 에이전트가 처리한다
- 예산 알림: 월 $50 (토큰 비용 임계값)

## Step 2: Project 구조 생성
아래 Project들을 순서대로 생성:

1. [상시] Ongoing Operations
   - 목적: Lead 처리, Finance 정산, Marketing 상시 운영
   - 담당 에이전트: Lead, Finance, Marketing

2. [자사 행사] AI Builders Conference 2026
   - 목적: AI Builders Conference 기획/운영/마케팅 전담
   - 담당 에이전트: Ops, Marketing, Sponsor

3. [자사 행사] AI Marketing Summit 2026
4. [자사 행사] AI InvestCon 2026

5. [클라이언트] Template — 새 클라이언트 행사 수주 시
   이 템플릿을 복사해서 "[클라이언트명] — [행사명]"으로 생성

## Step 3: 에이전트 7개 등록
각 에이전트 설정:

| 에이전트명 | Platform | SKILL.md 경로 | Heartbeat |
|-----------|----------|--------------|-----------|
| Director | Claude Code | .agents/skills/EVENT-AGENCY-DIRECTOR.md | 수동 트리거 |
| Proposal | Claude Code | .agents/skills/EVENT-AGENCY-PROPOSAL.md | 수동 트리거 |
| Lead | Claude Code | .agents/skills/EVENT-AGENCY-LEAD.md | 이메일 웹훅 |
| Ops | Claude Code | .agents/skills/EVENT-AGENCY-OPS.md | 매시간 |
| Marketing | Claude Code | .agents/skills/EVENT-AGENCY-MARKETING.md | 매일 오전 9시 |
| Sponsor | Claude Code | .agents/skills/EVENT-AGENCY-SPONSOR.md | 수동 트리거 |
| Finance | Claude Code | .agents/skills/EVENT-AGENCY-FINANCE.md | 수동 트리거 |

## Step 4: 첫 실행 테스트 체크리스트
- [ ] Director 에이전트에게: "현재 진행 중인 행사 목록 만들어줘"
- [ ] Proposal 에이전트에게: "테스트 제안서 하나 만들어줘 - 100명 규모 AI 컨퍼런스, 예산 3000만원"
- [ ] Ops 에이전트에게: "AI Builders Conference D-60 체크리스트 생성해줘"
- [ ] Marketing 에이전트에게: "AI Builders Conference LinkedIn 포스팅 초안 만들어줘"

## Step 5: 업스트림 동기화 루틴 (월 1회)
터미널에서:
git fetch upstream
git checkout master
git merge upstream/master
git checkout feat/event-agency-os
git merge master
