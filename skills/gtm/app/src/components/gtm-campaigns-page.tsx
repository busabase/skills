"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "kui/badge";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { ColumnHeader, DataTable } from "sharelib/data-table";
import {
  type AdCampaign,
  type AdPlatform,
  pickLocale,
  tGtm,
  useGtmData,
  useGtmLocale,
} from "../data";

const platformEmoji: Record<AdPlatform, string> = {
  youtube: "📺",
  tiktok: "🎵",
  facebook: "📘",
  meta: "Ⓜ️",
  google: "🔍",
  linkedin: "💼",
  xiaohongshu: "📱",
  reddit: "🟧",
  twitter: "𝕏",
  other: "🔗",
};

const statusColors: Record<AdCampaign["status"], string> = {
  draft: "bg-zinc-400",
  running: "bg-green-500",
  paused: "bg-yellow-500",
  ended: "bg-zinc-500",
};

const campaignsText = {
  icp: { en: "ICP", "zh-CN": "ICP", "zh-TW": "ICP", ja: "ICP", pt: "ICP" },
  campaign: {
    en: "Campaign",
    "zh-CN": "Campaign",
    "zh-TW": "Campaign",
    ja: "キャンペーン",
    pt: "Campanha",
  },
  status: { en: "Status", "zh-CN": "状态", "zh-TW": "狀態", ja: "ステータス", pt: "Status" },
  dailyBudget: {
    en: "Daily budget",
    "zh-CN": "日预算",
    "zh-TW": "日預算",
    ja: "日予算",
    pt: "Orçamento diário",
  },
  spent: { en: "Spent", "zh-CN": "已花", "zh-TW": "已花費", ja: "消化額", pt: "Gasto" },
  metrics: {
    en: "Key metrics",
    "zh-CN": "关键指标",
    "zh-TW": "關鍵指標",
    ja: "主要指標",
    pt: "Métricas-chave",
  },
  noData: {
    en: "No data",
    "zh-CN": "暂无数据",
    "zh-TW": "暫無資料",
    ja: "データなし",
    pt: "Sem dados",
  },
  creative: {
    en: "Creative",
    "zh-CN": "创意素材",
    "zh-TW": "創意素材",
    ja: "クリエイティブ",
    pt: "Criativo",
  },
  landingPage: {
    en: "Landing page",
    "zh-CN": "落地页",
    "zh-TW": "落地頁",
    ja: "LP",
    pt: "Landing page",
  },
  owner: { en: "Owner", "zh-CN": "负责人", "zh-TW": "負責人", ja: "担当者", pt: "Responsável" },
  unassigned: {
    en: "Unassigned",
    "zh-CN": "未分配",
    "zh-TW": "未分配",
    ja: "未割当",
    pt: "Sem responsável",
  },
  draft: { en: "Draft", "zh-CN": "草稿", "zh-TW": "草稿", ja: "下書き", pt: "Rascunho" },
  running: { en: "Running", "zh-CN": "投放中", "zh-TW": "投放中", ja: "配信中", pt: "Rodando" },
  paused: { en: "Paused", "zh-CN": "已暂停", "zh-TW": "已暫停", ja: "一時停止", pt: "Pausada" },
  ended: { en: "Ended", "zh-CN": "已结束", "zh-TW": "已結束", ja: "終了", pt: "Encerrada" },
  title: {
    en: "Ad Campaigns",
    "zh-CN": "广告投放",
    "zh-TW": "廣告投放",
    ja: "広告キャンペーン",
    pt: "Campanhas pagas",
  },
  summary: {
    en: "{total} campaigns · {running} running · {draft} drafts",
    "zh-CN": "共 {total} 个 campaign · {running} 投放中 · {draft} 草稿",
    "zh-TW": "共 {total} 個 campaign · {running} 投放中 · {draft} 草稿",
    ja: "{total} キャンペーン · {running} 配信中 · {draft} 下書き",
    pt: "{total} campanhas · {running} rodando · {draft} rascunhos",
  },
};

export function GtmCampaignsPage() {
  const locale = useGtmLocale();
  const data = useGtmData();
  const columns = useMemo<ColumnDef<AdCampaign>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <ColumnHeader column={column} title={tGtm(campaignsText.campaign, locale)} />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span>{platformEmoji[row.original.platform]}</span>
            <span className="font-medium">{row.original.name}</span>
          </div>
        ),
      },
      {
        accessorKey: "targetIcpId",
        header: tGtm(campaignsText.icp, locale),
        cell: ({ row }) => {
          const icp = data.icps.find((i) => i.id === row.original.targetIcpId);
          return icp ? (
            <Badge variant="outline">
              {icp.emoji} {pickLocale(icp.name, locale)}
            </Badge>
          ) : (
            <span className="text-muted-foreground">{row.original.targetIcpId}</span>
          );
        },
      },
      {
        accessorKey: "status",
        header: tGtm(campaignsText.status, locale),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${statusColors[row.original.status]}`} />
            <span className="text-sm">{tGtm(campaignsText[row.original.status], locale)}</span>
          </div>
        ),
      },
      {
        accessorKey: "budgetDaily",
        header: tGtm(campaignsText.dailyBudget, locale),
        cell: ({ row }) => {
          if (row.original.budgetDaily == null)
            return <span className="text-muted-foreground">—</span>;
          const cur = row.original.currency ?? "USD";
          return (
            <span className="font-mono text-sm">
              {cur === "USD" ? "$" : "¥"}
              {row.original.budgetDaily}
              <span className="text-muted-foreground">/d</span>
            </span>
          );
        },
      },
      {
        accessorKey: "spent",
        header: tGtm(campaignsText.spent, locale),
        cell: ({ row }) => {
          if (row.original.spent == null) return <span className="text-muted-foreground">—</span>;
          const cur = row.original.currency ?? "USD";
          return (
            <span className="font-mono text-sm">
              {cur === "USD" ? "$" : "¥"}
              {row.original.spent}
            </span>
          );
        },
      },
      {
        id: "metrics",
        header: tGtm(campaignsText.metrics, locale),
        cell: ({ row }) => {
          const m = row.original.metrics;
          if (!m)
            return (
              <span className="text-muted-foreground text-xs">
                {tGtm(campaignsText.noData, locale)}
              </span>
            );
          return (
            <div className="text-xs space-x-2 font-mono">
              {m.impressions != null && <span>👁 {m.impressions.toLocaleString()}</span>}
              {m.clicks != null && <span>👆 {m.clicks}</span>}
              {m.ctr != null && <span>CTR {m.ctr}%</span>}
              {m.cpc != null && <span>CPC ${m.cpc}</span>}
            </div>
          );
        },
      },
      {
        accessorKey: "creativeAssetName",
        header: tGtm(campaignsText.creative, locale),
        cell: ({ row }) =>
          row.original.creativeAssetUrl ? (
            <Link
              href={row.original.creativeAssetUrl}
              className="text-xs text-primary hover:underline truncate"
            >
              {row.original.creativeAssetName ?? "link"}
            </Link>
          ) : (
            <span className="text-xs text-muted-foreground">
              {row.original.creativeAssetName ?? "—"}
            </span>
          ),
      },
      {
        id: "landing",
        header: tGtm(campaignsText.landingPage, locale),
        cell: ({ row }) =>
          row.original.landingPageUrl ? (
            <Link
              href={row.original.landingPageUrl}
              target="_blank"
              className="text-xs text-primary"
            >
              <ExternalLink className="w-3 h-3 inline" />
            </Link>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: "owner",
        header: tGtm(campaignsText.owner, locale),
        cell: ({ row }) =>
          row.original.owner ? (
            <Badge variant="secondary" className="text-xs">
              {row.original.owner}
            </Badge>
          ) : (
            <span className="text-muted-foreground text-xs">
              {tGtm(campaignsText.unassigned, locale)}
            </span>
          ),
      },
    ],
    [data, locale],
  );

  // Stats
  const total = data.adCampaigns.length;
  const running = data.adCampaigns.filter((c) => c.status === "running").length;
  const draft = data.adCampaigns.filter((c) => c.status === "draft").length;

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{tGtm(campaignsText.title, locale)}</h1>
        <p className="text-sm text-muted-foreground">
          {tGtm(campaignsText.summary, locale)
            .replace("{total}", total.toString())
            .replace("{running}", running.toString())
            .replace("{draft}", draft.toString())}
        </p>
      </div>
      <DataTable columns={columns} data={data.adCampaigns} />
    </div>
  );
}
