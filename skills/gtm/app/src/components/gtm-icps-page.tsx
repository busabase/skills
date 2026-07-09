"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "kui/badge";
import { Button } from "kui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "kui/tooltip";
import Link from "next/link";
import { useMemo } from "react";
import { ColumnHeader, DataTable } from "sharelib/data-table";
import { useLocation } from "wouter";
import { pickLocale, tGtm, useGtmData, useGtmLocale } from "../data";
import { computeIcpPillars, PILLAR_LABELS, type PillarStatus } from "../pillar-scoring";

const healthColors: Record<PillarStatus["health"], string> = {
  green: "bg-green-500 text-white",
  yellow: "bg-yellow-500 text-white",
  red: "bg-red-500 text-white",
};

const healthDot: Record<PillarStatus["health"], string> = {
  green: "bg-green-500",
  yellow: "bg-yellow-500",
  red: "bg-red-500",
};

function PillarCell({
  pillar,
  status,
  icpId,
}: {
  pillar: "foundation" | "content" | "paid" | "retention";
  status: PillarStatus;
  icpId: string;
}) {
  const [, navigate] = useLocation();
  const label = PILLAR_LABELS[pillar];
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 cursor-help select-none">
            <span className={`w-2.5 h-2.5 rounded-full ${healthDot[status.health]}`} />
            <span className="text-xs font-mono">
              {status.doneCount}
              <span className="text-muted-foreground">/{status.totalCount}</span>
            </span>
            <span className="text-[10px] text-muted-foreground">({status.pct}%)</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-sm p-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2 border-b border-border pb-1.5">
              <span>{label.emoji}</span>
              <span className="font-bold">{label.name}</span>
              <span className="text-xs text-muted-foreground">{label.desc}</span>
              <Badge className={`ml-auto ${healthColors[status.health]}`}>{status.pct}%</Badge>
            </div>
            <div className="space-y-1 text-xs">
              {status.items.map((item) => {
                const itemUrl = item.url;
                const labelBlock = (
                  <div className="flex-1 min-w-0">
                    <div className={item.done ? "" : "text-muted-foreground"}>{item.label}</div>
                    {item.hint && (
                      <div className="text-[10px] text-muted-foreground mt-0.5">{item.hint}</div>
                    )}
                  </div>
                );
                return (
                  <div key={item.label} className="flex items-start gap-2">
                    <span className={item.done ? "text-green-500" : "text-zinc-400"}>
                      {item.done ? "✓" : "○"}
                    </span>
                    {itemUrl ? (
                      itemUrl.startsWith("#") ? (
                        // In-page anchors only work on detail page; on list page, go to detail with anchor
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/icps/${icpId}${itemUrl}`);
                          }}
                          className="flex-1 min-w-0 hover:text-primary text-left"
                        >
                          {labelBlock}
                        </button>
                      ) : itemUrl.startsWith("/") && !itemUrl.startsWith("/kit/") ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(itemUrl);
                          }}
                          className="flex-1 min-w-0 hover:text-primary text-left"
                        >
                          {labelBlock}
                        </button>
                      ) : (
                        <Link
                          href={itemUrl}
                          className="flex-1 min-w-0 hover:text-primary"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {labelBlock}
                        </Link>
                      )
                    ) : (
                      labelBlock
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function OverallCell({ pct, health }: { pct: number; health: PillarStatus["health"] }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-2.5 h-2.5 rounded-full ${healthDot[health]}`} />
      <span className="text-sm font-bold font-mono">{pct}%</span>
    </div>
  );
}

const icpsText = {
  icp: { en: "ICP", "zh-CN": "ICP", "zh-TW": "ICP", ja: "ICP", pt: "ICP" },
  foundation: {
    en: "🏗️ Sellable",
    "zh-CN": "🏗️ 能不能卖",
    "zh-TW": "🏗️ 能不能賣",
    ja: "🏗️ 販売可能性",
    pt: "🏗️ Vendável",
  },
  foundationDesc: {
    en: "Offer / LP / listing",
    "zh-CN": "商品/落地页/上架",
    "zh-TW": "商品/落地頁/上架",
    ja: "商品 / LP / 掲載",
    pt: "Oferta / LP / listing",
  },
  content: {
    en: "📝 Organic",
    "zh-CN": "📝 自然获客",
    "zh-TW": "📝 內容",
    ja: "📝 オーガニック",
    pt: "📝 Orgânico",
  },
  contentDesc: {
    en: "Content cadence",
    "zh-CN": "内容与账号节奏",
    "zh-TW": "內容與帳號節奏",
    ja: "コンテンツ運用",
    pt: "Cadência de conteúdo",
  },
  paid: { en: "📢 Paid", "zh-CN": "📢 付费", "zh-TW": "📢 付費", ja: "📢 有料", pt: "📢 Pago" },
  paidDesc: {
    en: "Paid acquisition",
    "zh-CN": "付费获客",
    "zh-TW": "付費獲客",
    ja: "有料獲得",
    pt: "Aquisição paga",
  },
  retention: {
    en: "💬 Delivery",
    "zh-CN": "💬 交付留存",
    "zh-TW": "💬 交付留存",
    ja: "💬 提供と継続",
    pt: "💬 Entrega",
  },
  retentionDesc: {
    en: "Retention",
    "zh-CN": "留存",
    "zh-TW": "留存",
    ja: "リテンション",
    pt: "Retenção",
  },
  overall: {
    en: "Loop",
    "zh-CN": "闭环",
    "zh-TW": "閉環",
    ja: "ループ",
    pt: "Loop",
  },
  overallDesc: {
    en: "Commercial index",
    "zh-CN": "商业闭环指数",
    "zh-TW": "商業閉環指數",
    ja: "商業ループ指数",
    pt: "Índice comercial",
  },
  nextStep: {
    en: "Next step",
    "zh-CN": "下一步",
    "zh-TW": "下一步",
    ja: "次のステップ",
    pt: "Próximo passo",
  },
  pending: { en: "pending", "zh-CN": "pending", "zh-TW": "pending", ja: "保留", pt: "pendente" },
  done: { en: "done", "zh-CN": "done", "zh-TW": "done", ja: "完了", pt: "concluído" },
  view: { en: "View →", "zh-CN": "查看 →", "zh-TW": "查看 →", ja: "表示 →", pt: "Ver →" },
  title: {
    en: "ICPs · Commercial Loop Index",
    "zh-CN": "ICPs · 商业闭环指数",
    "zh-TW": "ICPs · 商業閉環指數",
    ja: "ICP · 商業ループ指数",
    pt: "ICPs · Índice de loop comercial",
  },
  summary: {
    en: "Ideal Customer Profiles — {count} precise audiences · average loop index {avg}% · {green} ready to scale",
    "zh-CN":
      "Ideal Customer Profiles — 共 {count} 个精准人群 · 平均闭环指数 {avg}% · {green} 个 ready to scale",
    "zh-TW":
      "Ideal Customer Profiles — 共 {count} 個精準人群 · 平均完成度 {avg}% · {green} 個 ready to scale",
    ja: "Ideal Customer Profiles — {count} 件の精密オーディエンス · 平均完成度 {avg}% · {green} 件 ready to scale",
    pt: "Ideal Customer Profiles — {count} públicos precisos · prontidão média {avg}% · {green} ready to scale",
  },
  dimensions: {
    en: "Commercial loop evaluation (hover for checklist): 🏗️ Sellable foundation · 📝 Organic · 📢 Paid · 💬 Delivery & retention",
    "zh-CN":
      "商业闭环评估（Hover 查看 checklist）：🏗️ 能不能卖 · 📝 自然获客 · 📢 付费获客 · 💬 交付留存",
    "zh-TW":
      "4 維度評估（Hover 查看 checklist）：🏗️ Foundation（40% 權重） · 📝 Content · 📢 Paid · 💬 Retention",
    ja: "4軸評価（ホバーでチェックリスト）：🏗️ Foundation（40%） · 📝 Content · 📢 Paid · 💬 Retention",
    pt: "Avaliação em 4 dimensões (hover para checklist): 🏗️ Foundation (peso 40%) · 📝 Content · 📢 Paid · 💬 Retention",
  },
};

export function GtmIcpsPage() {
  const locale = useGtmLocale();
  const data = useGtmData();
  const [, navigate] = useLocation();

  // Precompute pillar scores per ICP
  const rows = useMemo(
    () =>
      data.icps.map((icp) => ({
        icp,
        pillars: computeIcpPillars(icp, data),
      })),
    [data],
  );

  type Row = (typeof rows)[number];

  const columns = useMemo<ColumnDef<Row>[]>(
    () => [
      {
        id: "name",
        header: ({ column }) => <ColumnHeader column={column} title={tGtm(icpsText.icp, locale)} />,
        accessorFn: (row) => row.icp.name,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="text-lg">{row.original.icp.emoji}</span>
            <div>
              <div className="font-medium">{pickLocale(row.original.icp.name, locale)}</div>
              <div className="text-[11px] text-muted-foreground italic max-w-sm truncate">
                {pickLocale(row.original.icp.tagline, locale)}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {row.original.icp.share}% share
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "foundation",
        header: () => (
          <div className="flex flex-col items-start">
            <span className="text-xs">{tGtm(icpsText.foundation, locale)}</span>
            <span className="text-[10px] text-muted-foreground">
              {tGtm(icpsText.foundationDesc, locale)}
            </span>
          </div>
        ),
        accessorFn: (row) => row.pillars.foundation.pct,
        cell: ({ row }) => (
          <PillarCell
            pillar="foundation"
            status={row.original.pillars.foundation}
            icpId={row.original.icp.id}
          />
        ),
        sortingFn: (a, b) => a.original.pillars.foundation.pct - b.original.pillars.foundation.pct,
      },
      {
        id: "content",
        header: () => (
          <div className="flex flex-col items-start">
            <span className="text-xs">{tGtm(icpsText.content, locale)}</span>
            <span className="text-[10px] text-muted-foreground">
              {tGtm(icpsText.contentDesc, locale)}
            </span>
          </div>
        ),
        accessorFn: (row) => row.pillars.content.pct,
        cell: ({ row }) => (
          <PillarCell
            pillar="content"
            status={row.original.pillars.content}
            icpId={row.original.icp.id}
          />
        ),
        sortingFn: (a, b) => a.original.pillars.content.pct - b.original.pillars.content.pct,
      },
      {
        id: "paid",
        header: () => (
          <div className="flex flex-col items-start">
            <span className="text-xs">{tGtm(icpsText.paid, locale)}</span>
            <span className="text-[10px] text-muted-foreground">
              {tGtm(icpsText.paidDesc, locale)}
            </span>
          </div>
        ),
        accessorFn: (row) => row.pillars.paid.pct,
        cell: ({ row }) => (
          <PillarCell
            pillar="paid"
            status={row.original.pillars.paid}
            icpId={row.original.icp.id}
          />
        ),
        sortingFn: (a, b) => a.original.pillars.paid.pct - b.original.pillars.paid.pct,
      },
      {
        id: "retention",
        header: () => (
          <div className="flex flex-col items-start">
            <span className="text-xs">{tGtm(icpsText.retention, locale)}</span>
            <span className="text-[10px] text-muted-foreground">
              {tGtm(icpsText.retentionDesc, locale)}
            </span>
          </div>
        ),
        accessorFn: (row) => row.pillars.retention.pct,
        cell: ({ row }) => (
          <PillarCell
            pillar="retention"
            status={row.original.pillars.retention}
            icpId={row.original.icp.id}
          />
        ),
        sortingFn: (a, b) => a.original.pillars.retention.pct - b.original.pillars.retention.pct,
      },
      {
        id: "overall",
        header: () => (
          <div className="flex flex-col items-start">
            <span className="text-xs font-bold">{tGtm(icpsText.overall, locale)}</span>
            <span className="text-[10px] text-muted-foreground">
              {tGtm(icpsText.overallDesc, locale)}
            </span>
          </div>
        ),
        accessorFn: (row) => row.pillars.overallPct,
        cell: ({ row }) => (
          <OverallCell
            pct={row.original.pillars.overallPct}
            health={row.original.pillars.overallHealth}
          />
        ),
        sortingFn: (a, b) => a.original.pillars.overallPct - b.original.pillars.overallPct,
      },
      {
        id: "actions-pending",
        header: tGtm(icpsText.nextStep, locale),
        cell: ({ row }) => {
          const pending = row.original.icp.actions.filter((a) => !a.done).length;
          const done = row.original.icp.actions.filter((a) => a.done).length;
          return (
            <div className="text-xs font-mono">
              <span className="text-primary">{pending}</span>
              <span className="text-muted-foreground"> {tGtm(icpsText.pending, locale)} · </span>
              <span className="text-green-500">{done}</span>
              <span className="text-muted-foreground"> {tGtm(icpsText.done, locale)}</span>
            </div>
          );
        },
      },
      {
        id: "view",
        header: "",
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/icps/${row.original.icp.id}`)}
          >
            {tGtm(icpsText.view, locale)}
          </Button>
        ),
      },
    ],
    [navigate, locale],
  );

  // Aggregate stats
  const avgOverall = Math.round(
    rows.reduce((sum, r) => sum + r.pillars.overallPct, 0) / Math.max(1, rows.length),
  );
  const greenCount = rows.filter((r) => r.pillars.overallHealth === "green").length;

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{tGtm(icpsText.title, locale)}</h1>
        <p className="text-sm text-muted-foreground">
          {tGtm(icpsText.summary, locale)
            .replace("{count}", rows.length.toString())
            .replace("{avg}", avgOverall.toString())
            .replace("{green}", greenCount.toString())}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{tGtm(icpsText.dimensions, locale)}</p>
      </div>
      <DataTable
        columns={columns}
        data={rows}
        onRowClick={(row: { icp: { id: string } }) => navigate(`/icps/${row.icp.id}`)}
      />
    </div>
  );
}
