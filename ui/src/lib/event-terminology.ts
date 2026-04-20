export function issueStatusEventPipelineLabel(status: string): string {
  if (status === "todo" || status === "backlog") return "문의접수";
  if (status === "in_progress") return "제안서 작성";
  if (status === "in_review") return "계약 완료";
  if (status === "blocked") return "기획 진행";
  if (status === "done" || status === "completed") return "완료";
  // If an extra status appears, treat it as the ops stage by default.
  return "운영 진행";
}

