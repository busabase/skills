"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "kui/badge";
import { useMemo } from "react";
import { ColumnHeader, DataTable } from "sharelib/data-table";
import { type Goal, tGtm, useGtmData, useGtmLocale } from "../data";

const goalsText = {
  sku: { en: "SKU", "zh-CN": "SKU", "zh-TW": "SKU", ja: "SKU", pt: "SKU" },
  metric: { en: "Metric", "zh-CN": "指标", "zh-TW": "指標", ja: "指標", pt: "Métrica" },
  progress: { en: "Progress", "zh-CN": "进度", "zh-TW": "進度", ja: "進捗", pt: "Progresso" },
  period: { en: "Period", "zh-CN": "周期", "zh-TW": "週期", ja: "期間", pt: "Período" },
  status: { en: "Status", "zh-CN": "状态", "zh-TW": "狀態", ja: "ステータス", pt: "Status" },
  onTrack: { en: "On Track", "zh-CN": "正常", "zh-TW": "正常", ja: "順調", pt: "No prazo" },
  behind: { en: "Behind", "zh-CN": "落后", "zh-TW": "落後", ja: "遅れ", pt: "Atrasado" },
  critical: { en: "Critical", "zh-CN": "严重", "zh-TW": "嚴重", ja: "重大", pt: "Crítico" },
  title: {
    en: "Goals / OKRs",
    "zh-CN": "目标 / OKR",
    "zh-TW": "目標 / OKR",
    ja: "目標 / OKR",
    pt: "Metas / OKRs",
  },
  summary: {
    en: "{count} goals · {quarter}",
    "zh-CN": "共 {count} 个目标 · {quarter}",
    "zh-TW": "共 {count} 個目標 · {quarter}",
    ja: "{count} 件の目標 · {quarter}",
    pt: "{count} metas · {quarter}",
  },
};

export function GtmGoalsPage() {
  const locale = useGtmLocale();
  const data = useGtmData();
  const columns = useMemo<ColumnDef<Goal>[]>(
    () => [
      {
        accessorKey: "skuId",
        header: tGtm(goalsText.sku, locale),
        cell: ({ row }) => {
          const sku = data.skus.find((s) => s.id === row.original.skuId);
          return sku ? (
            <div className="flex items-center gap-2">
              <span>{sku.emoji}</span>
              <span className="font-medium">{sku.name}</span>
            </div>
          ) : (
            row.original.skuId
          );
        },
      },
      {
        accessorKey: "metric",
        header: ({ column }) => (
          <ColumnHeader column={column} title={tGtm(goalsText.metric, locale)} />
        ),
      },
      {
        id: "progress",
        header: tGtm(goalsText.progress, locale),
        cell: ({ row }) => {
          const g = row.original;
          const pct = Math.min(100, (g.current / g.target) * 100);
          const fmt = (n: number) =>
            g.unit === "$" || g.unit === "¥" ? `${g.unit}${n.toLocaleString()}` : n.toString();
          return (
            <div className="w-56">
              <div className="flex justify-between text-xs mb-1">
                <span className="font-mono">{fmt(g.current)}</span>
                <span className="text-muted-foreground font-mono">
                  {fmt(g.target)} {g.unit !== "$" && g.unit !== "¥" ? g.unit : ""}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${pct >= 80 ? "bg-green-500" : pct >= 40 ? "bg-yellow-500" : "bg-red-500"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="text-[10px] text-muted-foreground text-right mt-0.5">
                {Math.round(pct)}%
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "period",
        header: tGtm(goalsText.period, locale),
        cell: ({ row }) => <Badge variant="outline">{row.original.period}</Badge>,
      },
      {
        id: "status",
        header: tGtm(goalsText.status, locale),
        cell: ({ row }) => {
          const g = row.original;
          const pct = (g.current / g.target) * 100;
          if (pct >= 80)
            return <Badge className="bg-green-500">{tGtm(goalsText.onTrack, locale)}</Badge>;
          if (pct >= 40)
            return <Badge className="bg-yellow-500">{tGtm(goalsText.behind, locale)}</Badge>;
          return <Badge variant="destructive">{tGtm(goalsText.critical, locale)}</Badge>;
        },
      },
    ],
    [data, locale],
  );

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{tGtm(goalsText.title, locale)}</h1>
        <p className="text-sm text-muted-foreground">
          {tGtm(goalsText.summary, locale)
            .replace("{count}", data.goals.length.toString())
            .replace("{quarter}", data.quarter)}
        </p>
      </div>
      <DataTable columns={columns} data={data.goals} />
    </div>
  );
}
