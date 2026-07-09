"use client";

import { Badge } from "kui/badge";
import { Fragment, useMemo, useState } from "react";
import {
  type Localized,
  MILESTONE_STAGE_ORDER,
  type Milestone,
  type MilestoneStage,
  type MilestoneStatus,
  tGtm,
  useGtmData,
  useGtmLocale,
} from "../data";

const text = {
  title: {
    en: "Milestones",
    "zh-CN": "里程碑",
    "zh-TW": "里程碑",
    ja: "マイルストーン",
    pt: "Marcos",
  },
  summary: {
    en: "Product-maturity ladder · click a stage to inspect it · {lines} business lines",
    "zh-CN": "产品成熟度阶梯 · 点击阶段查看完成情况 · 共 {lines} 条业务线",
    "zh-TW": "產品成熟度階梯 · 點擊階段查看完成情況 · 共 {lines} 條業務線",
    ja: "プロダクト成熟度ラダー · ステージをクリックで詳細 · {lines} ライン",
    pt: "Escada de maturidade · clique numa etapa · {lines} linhas",
  },
  criteria: {
    en: "{done}/{total} criteria done",
    "zh-CN": "{done}/{total} 项达标",
    "zh-TW": "{done}/{total} 項達標",
    ja: "{done}/{total} 項目完了",
    pt: "{done}/{total} critérios",
  },
  undefinedStage: {
    en: "No milestone defined for this stage yet.",
    "zh-CN": "此业务线尚未定义该阶段的里程碑。",
    "zh-TW": "此業務線尚未定義該階段的里程碑。",
    ja: "このステージのマイルストーンは未定義です。",
    pt: "Nenhum marco definido para esta etapa.",
  },
} satisfies Record<string, Localized<string>>;

const STAGE_TEXT: Record<MilestoneStage, Localized<string>> = {
  "internal-mvp": {
    en: "Internal MVP",
    "zh-CN": "内部 MVP",
    "zh-TW": "內部 MVP",
    ja: "社内 MVP",
    pt: "MVP interno",
  },
  "launch-ready": {
    en: "Launch (PH / HN)",
    "zh-CN": "上架 (PH/HN)",
    "zh-TW": "上架 (PH/HN)",
    ja: "公開 (PH/HN)",
    pt: "Lançar (PH/HN)",
  },
  "monetization-ready": {
    en: "Monetize",
    "zh-CN": "可收费",
    "zh-TW": "可收費",
    ja: "課金",
    pt: "Monetizar",
  },
  pmf: { en: "PMF", "zh-CN": "PMF", "zh-TW": "PMF", ja: "PMF", pt: "PMF" },
  scale: { en: "Scale", "zh-CN": "规模化", "zh-TW": "規模化", ja: "スケール", pt: "Escala" },
};

// What action/audience each stage is about — the ladder is audience-widening:
// friends → strangers → paying → one ICP's GTM motion → ramp + more ICPs.
const STAGE_HINT: Record<MilestoneStage, Localized<string>> = {
  "internal-mvp": {
    en: "friends use it",
    "zh-CN": "朋友/团队用起来",
    "zh-TW": "朋友/團隊用起來",
    ja: "友人が使う",
    pt: "amigos usam",
  },
  "launch-ready": {
    en: "strangers use it",
    "zh-CN": "外部陌生人用起来",
    "zh-TW": "外部陌生人用起來",
    ja: "外部の人が使う",
    pt: "estranhos usam",
  },
  "monetization-ready": {
    en: "they can pay",
    "zh-CN": "外部人能付费",
    "zh-TW": "外部人能付費",
    ja: "課金できる",
    pt: "podem pagar",
  },
  pmf: {
    en: "1 ICP: GTM works + pays at scale",
    "zh-CN": "跑通 1 个 ICP + 能批量付费",
    "zh-TW": "跑通 1 個 ICP + 能批量付費",
    ja: "1 ICP: GTM + 量産課金",
    pt: "1 ICP: GTM + paga em escala",
  },
  scale: {
    en: "ramp + more ICPs",
    "zh-CN": "放量 + 扩 ICP",
    "zh-TW": "放量 + 擴 ICP",
    ja: "拡大 + ICP 追加",
    pt: "escalar + mais ICPs",
  },
};

const STATUS_TEXT: Record<MilestoneStatus, Localized<string>> = {
  not_started: {
    en: "Not started",
    "zh-CN": "未开始",
    "zh-TW": "未開始",
    ja: "未着手",
    pt: "Não iniciado",
  },
  in_progress: {
    en: "In progress",
    "zh-CN": "进行中",
    "zh-TW": "進行中",
    ja: "進行中",
    pt: "Em andamento",
  },
  reached: { en: "Reached", "zh-CN": "已达成", "zh-TW": "已達成", ja: "達成", pt: "Alcançado" },
};

const STATUS_BADGE: Record<MilestoneStatus, string> = {
  not_started: "",
  in_progress: "bg-yellow-500",
  reached: "bg-green-500",
};

interface LineGroup {
  lineId: string;
  lineName: string;
  byStage: Partial<Record<MilestoneStage, Milestone>>;
  defaultStage: MilestoneStage;
}

const progressOf = (m: Milestone) => {
  const done = m.criteria.filter((c) => c.done).length;
  return { done, total: m.criteria.length };
};

export function GtmMilestonesPage() {
  const locale = useGtmLocale();
  const data = useGtmData();

  const groups = useMemo<LineGroup[]>(() => {
    const lineIdOf = (m: Milestone): string => {
      if (m.scopeKind === "businessLine") return m.scopeId;
      if (m.scopeKind === "product")
        return data.products.find((p) => p.id === m.scopeId)?.businessLineId ?? m.scopeId;
      return data.skus.find((s) => s.id === m.scopeId)?.businessLineId ?? m.scopeId;
    };

    const byLine = new Map<string, Partial<Record<MilestoneStage, Milestone>>>();
    for (const m of data.milestones) {
      const lineId = lineIdOf(m);
      const map = byLine.get(lineId) ?? {};
      map[m.stage] = m;
      byLine.set(lineId, map);
    }

    return [...byLine.entries()].map(([lineId, byStage]) => {
      // Current focus: first in-progress stage, else first not-started, else last
      // reached, else the first stage that has any milestone.
      const present = MILESTONE_STAGE_ORDER.filter((s) => byStage[s]);
      const defaultStage =
        present.find((s) => byStage[s]?.status === "in_progress") ??
        present.find((s) => byStage[s]?.status === "not_started") ??
        [...present].reverse().find((s) => byStage[s]?.status === "reached") ??
        present[0] ??
        MILESTONE_STAGE_ORDER[0];
      return {
        lineId,
        lineName: data.businessLines.find((b) => b.id === lineId)?.name ?? lineId,
        byStage,
        defaultStage,
      };
    });
  }, [data]);

  const [selected, setSelected] = useState<Record<string, MilestoneStage>>({});
  const scopeLabel = (m: Milestone): string => {
    if (m.scopeKind === "businessLine")
      return data.businessLines.find((b) => b.id === m.scopeId)?.name ?? m.scopeId;
    if (m.scopeKind === "product")
      return data.products.find((p) => p.id === m.scopeId)?.name ?? m.scopeId;
    return data.skus.find((s) => s.id === m.scopeId)?.name ?? m.scopeId;
  };

  return (
    <div className="space-y-5 p-6">
      <div>
        <h1 className="font-bold text-2xl">{tGtm(text.title, locale)}</h1>
        <p className="text-muted-foreground text-sm">
          {tGtm(text.summary, locale).replace("{lines}", groups.length.toString())}
        </p>
      </div>

      {groups.map((group) => {
        const activeStage = selected[group.lineId] ?? group.defaultStage;
        const activeMilestone = group.byStage[activeStage];
        return (
          <section className="rounded-xl border bg-background p-5" key={group.lineId}>
            <h2 className="font-semibold text-base">{group.lineName}</h2>

            {/* Horizontal stage timeline */}
            <div className="mt-4 flex items-start">
              {MILESTONE_STAGE_ORDER.map((stage, i) => {
                const m = group.byStage[stage];
                const status = m?.status;
                const isActive = stage === activeStage;
                const reached = status === "reached";
                const prevReached =
                  i > 0 && group.byStage[MILESTONE_STAGE_ORDER[i - 1]]?.status === "reached";
                const dotClass = !m
                  ? "border-dashed border-border bg-background text-muted-foreground/40"
                  : reached
                    ? "border-green-500 bg-green-500 text-white"
                    : status === "in_progress"
                      ? "border-yellow-500 bg-yellow-500 text-white"
                      : "border-border bg-background text-muted-foreground";
                const prog = m ? progressOf(m) : null;
                return (
                  <Fragment key={stage}>
                    <div className="flex flex-1 flex-col items-center">
                      <div className="flex w-full items-center">
                        <div
                          className={`h-0.5 flex-1 ${i === 0 ? "invisible" : prevReached ? "bg-green-500" : "bg-border"}`}
                        />
                        <button
                          aria-label={tGtm(STAGE_TEXT[stage], locale)}
                          className={`flex size-9 shrink-0 items-center justify-center rounded-full border-2 font-medium text-xs transition-all ${dotClass} ${isActive ? "ring-2 ring-primary ring-offset-2" : ""} ${m ? "cursor-pointer" : "cursor-default"}`}
                          disabled={!m}
                          onClick={() =>
                            m && setSelected((prev) => ({ ...prev, [group.lineId]: stage }))
                          }
                          type="button"
                        >
                          {reached
                            ? "✓"
                            : prog
                              ? `${Math.round((prog.done / prog.total) * 100)}`
                              : "·"}
                        </button>
                        <div
                          className={`h-0.5 flex-1 ${i === MILESTONE_STAGE_ORDER.length - 1 ? "invisible" : reached ? "bg-green-500" : "bg-border"}`}
                        />
                      </div>
                      <div
                        className={`mt-2 text-center text-[11px] leading-tight ${isActive ? "font-medium text-foreground" : "text-muted-foreground"}`}
                      >
                        {tGtm(STAGE_TEXT[stage], locale)}
                      </div>
                      <div className="mt-0.5 text-center text-[10px] text-muted-foreground/70 leading-tight">
                        {tGtm(STAGE_HINT[stage], locale)}
                      </div>
                    </div>
                  </Fragment>
                );
              })}
            </div>

            {/* Selected stage detail */}
            <div className="mt-4 rounded-lg border bg-muted/30 p-4">
              {activeMilestone ? (
                <MilestoneDetail
                  locale={locale}
                  milestone={activeMilestone}
                  scope={scopeLabel(activeMilestone)}
                />
              ) : (
                <p className="text-muted-foreground text-sm">{tGtm(text.undefinedStage, locale)}</p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function MilestoneDetail({
  milestone,
  scope,
  locale,
}: {
  milestone: Milestone;
  scope: string;
  locale: Parameters<typeof tGtm>[1];
}) {
  const { done, total } = progressOf(milestone);
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="font-medium text-sm">{milestone.name}</span>
        <Badge
          className={STATUS_BADGE[milestone.status]}
          variant={milestone.status === "not_started" ? "outline" : "default"}
        >
          {tGtm(STATUS_TEXT[milestone.status], locale)}
        </Badge>
        <span className="rounded-full border bg-background px-2 py-0.5 text-muted-foreground text-xs">
          {scope}
        </span>
        <span className="ml-auto text-muted-foreground text-xs">
          {milestone.targetPeriod ?? (milestone.reachedAt ? `✓ ${milestone.reachedAt}` : "")}
        </span>
      </div>
      <p className="text-muted-foreground text-xs">{milestone.definition}</p>

      <div className="mt-3 mb-1 flex justify-between text-muted-foreground text-xs">
        <span>
          {tGtm(text.criteria, locale)
            .replace("{done}", done.toString())
            .replace("{total}", total.toString())}
        </span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full transition-all ${pct === 100 ? "bg-green-500" : "bg-yellow-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <ul className="mt-3 grid gap-1 sm:grid-cols-2">
        {milestone.criteria.map((c) => (
          <li className="flex items-start gap-2 text-xs" key={c.label}>
            <span className={c.done ? "text-green-600" : "text-muted-foreground"}>
              {c.done ? "✓" : "○"}
            </span>
            <span className={c.done ? "text-foreground" : "text-muted-foreground"}>{c.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
