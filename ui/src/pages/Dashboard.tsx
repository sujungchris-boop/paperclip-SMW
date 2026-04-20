import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@/lib/router";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "../api/dashboard";
import { activityApi } from "../api/activity";
import { issuesApi } from "../api/issues";
import { agentsApi } from "../api/agents";
import { projectsApi } from "../api/projects";
import { useCompany } from "../context/CompanyContext";
import { useDialog } from "../context/DialogContext";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { queryKeys } from "../lib/queryKeys";
import { MetricCard } from "../components/MetricCard";
import { EmptyState } from "../components/EmptyState";
import { StatusIcon } from "../components/StatusIcon";

import { ActivityRow } from "../components/ActivityRow";
import { Identity } from "../components/Identity";
import { Bot, CircleDot, FileText, Handshake, LayoutDashboard, PauseCircle, Presentation, ShieldCheck } from "lucide-react";
import { ActiveAgentsPanel } from "../components/ActiveAgentsPanel";
import { PageSkeleton } from "../components/PageSkeleton";
import type { Agent, Issue, Project } from "@paperclipai/shared";
import { PluginSlotOutlet } from "@/plugins/slots";

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function endOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

export function Dashboard() {
  const { selectedCompanyId, companies } = useCompany();
  const { openOnboarding } = useDialog();
  const { setBreadcrumbs } = useBreadcrumbs();
  const [animatedActivityIds, setAnimatedActivityIds] = useState<Set<string>>(new Set());
  const seenActivityIdsRef = useRef<Set<string>>(new Set());
  const hydratedActivityRef = useRef(false);
  const activityAnimationTimersRef = useRef<number[]>([]);

  const { data: agents } = useQuery({
    queryKey: queryKeys.agents.list(selectedCompanyId!),
    queryFn: () => agentsApi.list(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });

  useEffect(() => {
    setBreadcrumbs([{ label: "Dashboard" }]);
  }, [setBreadcrumbs]);

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.dashboard(selectedCompanyId!),
    queryFn: () => dashboardApi.summary(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });

  const { data: activity } = useQuery({
    queryKey: queryKeys.activity(selectedCompanyId!),
    queryFn: () => activityApi.list(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });

  const { data: issues } = useQuery({
    queryKey: queryKeys.issues.list(selectedCompanyId!),
    queryFn: () => issuesApi.list(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });

  const { data: projects } = useQuery({
    queryKey: queryKeys.projects.list(selectedCompanyId!),
    queryFn: () => projectsApi.list(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });
  const recentActivity = useMemo(() => (activity ?? []).slice(0, 10), [activity]);

  useEffect(() => {
    for (const timer of activityAnimationTimersRef.current) {
      window.clearTimeout(timer);
    }
    activityAnimationTimersRef.current = [];
    seenActivityIdsRef.current = new Set();
    hydratedActivityRef.current = false;
    setAnimatedActivityIds(new Set());
  }, [selectedCompanyId]);

  useEffect(() => {
    if (recentActivity.length === 0) return;

    const seen = seenActivityIdsRef.current;
    const currentIds = recentActivity.map((event) => event.id);

    if (!hydratedActivityRef.current) {
      for (const id of currentIds) seen.add(id);
      hydratedActivityRef.current = true;
      return;
    }

    const newIds = currentIds.filter((id) => !seen.has(id));
    if (newIds.length === 0) {
      for (const id of currentIds) seen.add(id);
      return;
    }

    setAnimatedActivityIds((prev) => {
      const next = new Set(prev);
      for (const id of newIds) next.add(id);
      return next;
    });

    for (const id of newIds) seen.add(id);

    const timer = window.setTimeout(() => {
      setAnimatedActivityIds((prev) => {
        const next = new Set(prev);
        for (const id of newIds) next.delete(id);
        return next;
      });
      activityAnimationTimersRef.current = activityAnimationTimersRef.current.filter((t) => t !== timer);
    }, 980);
    activityAnimationTimersRef.current.push(timer);
  }, [recentActivity]);

  useEffect(() => {
    return () => {
      for (const timer of activityAnimationTimersRef.current) {
        window.clearTimeout(timer);
      }
    };
  }, []);

  const agentMap = useMemo(() => {
    const map = new Map<string, Agent>();
    for (const a of agents ?? []) map.set(a.id, a);
    return map;
  }, [agents]);

  const entityNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const i of issues ?? []) map.set(`issue:${i.id}`, i.identifier ?? i.id.slice(0, 8));
    for (const a of agents ?? []) map.set(`agent:${a.id}`, a.name);
    for (const p of projects ?? []) map.set(`project:${p.id}`, p.name);
    return map;
  }, [issues, agents, projects]);

  const entityTitleMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const i of issues ?? []) map.set(`issue:${i.id}`, i.title);
    return map;
  }, [issues]);

  const agentName = (id: string | null) => {
    if (!id || !agents) return null;
    return agents.find((a) => a.id === id)?.name ?? null;
  };

  if (!selectedCompanyId) {
    if (companies.length === 0) {
      return (
        <EmptyState
          icon={LayoutDashboard}
          message="Welcome to Paperclip. Set up your first company and agent to get started."
          action="Get Started"
          onAction={openOnboarding}
        />
      );
    }
    return (
      <EmptyState icon={LayoutDashboard} message="Create or select a company to view the dashboard." />
    );
  }

  if (isLoading) {
    return <PageSkeleton variant="dashboard" />;
  }

  const hasNoAgents = agents !== undefined && agents.length === 0;

  const projectById = useMemo(() => {
    const map = new Map<string, Project>();
    for (const p of projects ?? []) map.set(p.id, p);
    return map;
  }, [projects]);

  const pipelineCounts = useMemo(() => {
    const counts = {
      inquiry: 0,
      proposal: 0,
      contract: 0,
      planning: 0,
      ops: 0,
      completedThisMonth: 0,
    };

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    for (const issue of issues ?? []) {
      // Stage mapping is best-effort: Paperclip's generic task statuses → event pipeline stages.
      // We can refine later when event-specific statuses/tags are introduced.
      if (issue.status === "backlog") counts.inquiry++;
      else if (issue.status === "todo") counts.proposal++;
      else if (issue.status === "in_review") counts.contract++;
      else if (issue.status === "in_progress") counts.planning++;
      else if (issue.status === "blocked") counts.ops++;

      if (issue.status === "done") {
        const completedAt = issue.completedAt ? new Date(issue.completedAt) : null;
        if (completedAt && completedAt >= monthStart && completedAt <= monthEnd) {
          counts.completedThisMonth++;
        }
      }
    }

    return counts;
  }, [issues]);

  const urgentIssues = useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const windowEnd = endOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3));

    const items = (issues ?? [])
      .filter((issue) => issue.status !== "done" && issue.status !== "cancelled")
      .map((issue) => {
        const project = issue.projectId ? projectById.get(issue.projectId) : null;
        const targetDate = project ? parseDate(project.targetDate) : null;
        return { issue, project, targetDate };
      })
      .filter(({ targetDate }) => !!targetDate && targetDate >= todayStart && targetDate <= windowEnd)
      .sort((a, b) => (a.targetDate!.getTime() - b.targetDate!.getTime()));

    return items;
  }, [issues, projectById]);

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-destructive">{error.message}</p>}

      {/* Section 1 — Header */}
      <div className="space-y-1">
        <div className="text-2xl font-semibold tracking-tight">Agency OS</div>
        <div className="text-sm text-muted-foreground">Chris &amp; Partners AI Operations</div>
      </div>

      {hasNoAgents && (
        <div className="flex items-center justify-between gap-3 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-500/25 dark:bg-amber-950/60">
          <div className="flex items-center gap-2.5">
            <Bot className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="text-sm text-amber-900 dark:text-amber-100">
              You have no agents.
            </p>
          </div>
          <button
            onClick={() => openOnboarding({ initialStep: 2, companyId: selectedCompanyId! })}
            className="text-sm font-medium text-amber-700 hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-100 underline underline-offset-2 shrink-0"
          >
            Create one here
          </button>
        </div>
      )}

      {data && (
        <>
          {data.budgets.activeIncidents > 0 ? (
            <div className="flex items-start justify-between gap-3 rounded-xl border border-red-500/20 bg-[linear-gradient(180deg,rgba(255,80,80,0.12),rgba(255,255,255,0.02))] px-4 py-3">
              <div className="flex items-start gap-2.5">
                <PauseCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
                <div>
                  <p className="text-sm font-medium text-red-50">
                    {data.budgets.activeIncidents} active budget incident{data.budgets.activeIncidents === 1 ? "" : "s"}
                  </p>
                  <p className="text-xs text-red-100/70">
                    {data.budgets.pausedAgents} agents paused · {data.budgets.pausedProjects} projects paused · {data.budgets.pendingApprovals} pending budget approvals
                  </p>
                </div>
              </div>
              <Link to="/costs" className="text-sm underline underline-offset-2 text-red-100">
                Open budgets
              </Link>
            </div>
          ) : null}

          {/* Section 2 — Event Pipeline Summary */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Event Pipeline
            </h3>
            <MetricCard
              icon={FileText}
              value={pipelineCounts.inquiry}
              label="문의접수 중"
              to="/inbox"
            />
            <MetricCard
              icon={CircleDot}
              value={pipelineCounts.proposal}
              label="제안서 작성 중"
              to="/issues"
            />
            <MetricCard
              icon={Handshake}
              value={pipelineCounts.contract}
              label="계약 완료"
              to="/projects"
            />
            <MetricCard
              icon={Presentation}
              value={pipelineCounts.planning}
              label="기획 진행 중"
              to="/issues"
            />
            <MetricCard
              icon={Bot}
              value={pipelineCounts.ops}
              label="운영 진행 중"
              to="/issues"
            />
            <MetricCard
              icon={ShieldCheck}
              value={pipelineCounts.completedThisMonth}
              label="이번 달 완료"
              to="/issues"
            />
          </div>

          {/* Section 3 — AI Team Status */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              AI Team Status
            </h3>
            <ActiveAgentsPanel companyId={selectedCompanyId!} />
          </div>

          {/* Section 4 — 긴급 태스크 (3일 이내) */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              긴급 태스크
            </h3>
            {urgentIssues.length === 0 ? (
              <div className="border border-border p-4">
                <p className="text-sm text-muted-foreground">
                  3일 이내 마감(프로젝트 Target Date 기준) 태스크가 없습니다.
                </p>
              </div>
            ) : (
              <div className="border border-border divide-y divide-border overflow-hidden">
                {urgentIssues.slice(0, 10).map(({ issue, project, targetDate }) => (
                  <Link
                    key={issue.id}
                    to={`/issues/${issue.identifier ?? issue.id}`}
                    className="px-4 py-3 text-sm cursor-pointer hover:bg-accent/50 transition-colors no-underline text-inherit block"
                  >
                    <div className="flex items-start gap-2 sm:items-center sm:gap-3">
                      <span className="shrink-0 sm:hidden">
                        <StatusIcon status={issue.status} />
                      </span>

                      <span className="flex min-w-0 flex-1 flex-col gap-1 sm:contents">
                        <span className="line-clamp-2 text-sm sm:order-2 sm:flex-1 sm:min-w-0 sm:line-clamp-none sm:truncate">
                          {issue.title}
                        </span>
                        <span className="flex items-center gap-2 sm:order-1 sm:shrink-0">
                          <span className="hidden sm:inline-flex"><StatusIcon status={issue.status} /></span>
                          <span className="text-xs font-mono text-muted-foreground">
                            {issue.identifier ?? issue.id.slice(0, 8)}
                          </span>
                          {project?.name ? (
                            <span className="text-xs text-muted-foreground truncate max-w-[12rem]">
                              {project.name}
                            </span>
                          ) : null}
                          {issue.assigneeAgentId && (() => {
                            const name = agentName(issue.assigneeAgentId);
                            return name
                              ? <span className="hidden sm:inline-flex"><Identity name={name} size="sm" /></span>
                              : null;
                          })()}
                          {targetDate ? (
                            <span className="text-xs text-muted-foreground shrink-0 sm:order-last">
                              Due {Math.max(0, Math.ceil((targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))}d
                            </span>
                          ) : null}
                        </span>
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Keep extensibility for future widgets without changing fetch logic */}
          <PluginSlotOutlet
            slotTypes={["dashboardWidget"]}
            context={{ companyId: selectedCompanyId }}
            className="grid gap-4 md:grid-cols-2"
            itemClassName="rounded-lg border bg-card p-4 shadow-sm"
          />

          {/* Keep recent activity available below the operational dashboard */}
          {recentActivity.length > 0 && (
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Recent Activity
              </h3>
              <div className="border border-border divide-y divide-border overflow-hidden">
                {recentActivity.map((event) => (
                  <ActivityRow
                    key={event.id}
                    event={event}
                    agentMap={agentMap}
                    entityNameMap={entityNameMap}
                    entityTitleMap={entityTitleMap}
                    className={animatedActivityIds.has(event.id) ? "activity-row-enter" : undefined}
                  />
                ))}
              </div>
            </div>
          )}

        </>
      )}
    </div>
  );
}
