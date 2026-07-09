"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "kui/badge";
import Link from "next/link";
import { useMemo } from "react";
import { ColumnHeader, DataTable } from "sharelib/data-table";
import { type GTMAccount, pickLocale, tGtm, useGtmData, useGtmLocale } from "../data";

const platformLabel: Record<
  GTMAccount["platform"],
  { name: Record<string, string>; emoji: string }
> = {
  youtube: {
    name: { en: "YouTube", "zh-CN": "YouTube", "zh-TW": "YouTube", ja: "YouTube", pt: "YouTube" },
    emoji: "📺",
  },
  twitter: {
    name: {
      en: "Twitter/X",
      "zh-CN": "Twitter/X",
      "zh-TW": "Twitter/X",
      ja: "Twitter/X",
      pt: "Twitter/X",
    },
    emoji: "🐦",
  },
  linkedin: {
    name: {
      en: "LinkedIn",
      "zh-CN": "LinkedIn",
      "zh-TW": "LinkedIn",
      ja: "LinkedIn",
      pt: "LinkedIn",
    },
    emoji: "💼",
  },
  xiaohongshu: {
    name: {
      en: "Xiaohongshu",
      "zh-CN": "小红书",
      "zh-TW": "小紅書",
      ja: "小紅書",
      pt: "Xiaohongshu",
    },
    emoji: "📱",
  },
  "wechat-gzh": {
    name: {
      en: "WeChat Official",
      "zh-CN": "公众号",
      "zh-TW": "公眾號",
      ja: "WeChat公式アカウント",
      pt: "WeChat Oficial",
    },
    emoji: "📝",
  },
  "wechat-video": {
    name: {
      en: "WeChat Channels",
      "zh-CN": "视频号",
      "zh-TW": "視頻號",
      ja: "WeChat動画",
      pt: "WeChat Vídeos",
    },
    emoji: "🎥",
  },
  github: {
    name: { en: "GitHub", "zh-CN": "GitHub", "zh-TW": "GitHub", ja: "GitHub", pt: "GitHub" },
    emoji: "🐙",
  },
  producthunt: {
    name: {
      en: "Product Hunt",
      "zh-CN": "Product Hunt",
      "zh-TW": "Product Hunt",
      ja: "Product Hunt",
      pt: "Product Hunt",
    },
    emoji: "🚀",
  },
  instagram: {
    name: {
      en: "Instagram",
      "zh-CN": "Instagram",
      "zh-TW": "Instagram",
      ja: "Instagram",
      pt: "Instagram",
    },
    emoji: "📸",
  },
  tiktok: {
    name: { en: "TikTok", "zh-CN": "TikTok", "zh-TW": "TikTok", ja: "TikTok", pt: "TikTok" },
    emoji: "🎵",
  },
  discord: {
    name: { en: "Discord", "zh-CN": "Discord", "zh-TW": "Discord", ja: "Discord", pt: "Discord" },
    emoji: "💬",
  },
  telegram: {
    name: {
      en: "Telegram",
      "zh-CN": "Telegram",
      "zh-TW": "Telegram",
      ja: "Telegram",
      pt: "Telegram",
    },
    emoji: "✈️",
  },
  medium: {
    name: { en: "Medium", "zh-CN": "Medium", "zh-TW": "Medium", ja: "Medium", pt: "Medium" },
    emoji: "✍️",
  },
  hackernews: {
    name: {
      en: "Hacker News",
      "zh-CN": "Hacker News",
      "zh-TW": "Hacker News",
      ja: "Hacker News",
      pt: "Hacker News",
    },
    emoji: "🗞️",
  },
  zhihu: {
    name: { en: "Zhihu", "zh-CN": "知乎", "zh-TW": "知乎", ja: "知乎", pt: "Zhihu" },
    emoji: "🅩",
  },
  bilibili: {
    name: {
      en: "Bilibili",
      "zh-CN": "Bilibili",
      "zh-TW": "Bilibili",
      ja: "Bilibili",
      pt: "Bilibili",
    },
    emoji: "📼",
  },
  other: {
    name: { en: "Other", "zh-CN": "其他", "zh-TW": "其他", ja: "その他", pt: "Outro" },
    emoji: "🔗",
  },
};

const statusVariant: Record<
  GTMAccount["status"],
  "default" | "secondary" | "outline" | "destructive"
> = {
  active: "default",
  dormant: "secondary",
  planned: "outline",
  archived: "destructive",
};

const accountsText = {
  platform: {
    en: "Platform",
    "zh-CN": "平台",
    "zh-TW": "平台",
    ja: "プラットフォーム",
    pt: "Plataforma",
  },
  account: { en: "Account", "zh-CN": "账号", "zh-TW": "帳號", ja: "アカウント", pt: "Conta" },
  purpose: { en: "Purpose", "zh-CN": "用途", "zh-TW": "用途", ja: "用途", pt: "Finalidade" },
  targetIcp: {
    en: "Target ICP",
    "zh-CN": "针对 ICP",
    "zh-TW": "針對 ICP",
    ja: "対象 ICP",
    pt: "ICP-alvo",
  },
  audience: {
    en: "Audience",
    "zh-CN": "粉丝",
    "zh-TW": "粉絲",
    ja: "オーディエンス",
    pt: "Audiência",
  },
  lastPosted: {
    en: "Last posted",
    "zh-CN": "最近发布",
    "zh-TW": "最近發布",
    ja: "最終投稿",
    pt: "Última publicação",
  },
  status: { en: "Status", "zh-CN": "状态", "zh-TW": "狀態", ja: "ステータス", pt: "Status" },
  owner: { en: "Owner", "zh-CN": "负责人", "zh-TW": "負責人", ja: "担当者", pt: "Responsável" },
  active: { en: "Active", "zh-CN": "活跃", "zh-TW": "活躍", ja: "有効", pt: "Ativa" },
  dormant: { en: "Dormant", "zh-CN": "休眠", "zh-TW": "休眠", ja: "休眠", pt: "Inativa" },
  planned: { en: "Planned", "zh-CN": "计划中", "zh-TW": "計劃中", ja: "予定", pt: "Planejada" },
  archived: {
    en: "Archived",
    "zh-CN": "已归档",
    "zh-TW": "已歸檔",
    ja: "アーカイブ済み",
    pt: "Arquivada",
  },
  title: { en: "Accounts", "zh-CN": "账号", "zh-TW": "帳號", ja: "アカウント", pt: "Contas" },
  summary: {
    en: "{count} social assets · {active} active · {platforms} platforms",
    "zh-CN": "共 {count} 个社媒资产 · {active} 活跃 · {platforms} 个平台",
    "zh-TW": "共 {count} 個社媒資產 · {active} 活躍 · {platforms} 個平台",
    ja: "{count} 件のソーシャル資産 · {active} 有効 · {platforms} プラットフォーム",
    pt: "{count} ativos sociais · {active} ativos · {platforms} plataformas",
  },
};

export function GtmAccountsPage() {
  const locale = useGtmLocale();
  const data = useGtmData();
  const columns = useMemo<ColumnDef<GTMAccount>[]>(
    () => [
      {
        accessorKey: "platform",
        header: ({ column }) => (
          <ColumnHeader column={column} title={tGtm(accountsText.platform, locale)} />
        ),
        cell: ({ row }) => {
          const p = platformLabel[row.original.platform];
          return (
            <div className="flex items-center gap-2">
              <span>{p.emoji}</span>
              <span className="font-medium">
                {(pickLocale(p.name, locale) ?? "Unknown") as string}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "handle",
        header: tGtm(accountsText.account, locale),
        cell: ({ row }) => (
          <div>
            {row.original.url ? (
              <Link href={row.original.url} className="font-mono text-primary hover:underline">
                {row.original.handle}
              </Link>
            ) : (
              <span className="font-mono">{row.original.handle}</span>
            )}
            {row.original.displayName && (
              <div className="text-xs text-muted-foreground">{row.original.displayName}</div>
            )}
          </div>
        ),
      },
      {
        accessorKey: "purpose",
        header: tGtm(accountsText.purpose, locale),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground max-w-md">{row.original.purpose}</span>
        ),
      },
      {
        accessorKey: "targetIcpIds",
        header: tGtm(accountsText.targetIcp, locale),
        cell: ({ row }) => {
          const icps = row.original.targetIcpIds
            .map((id) => data.icps.find((i) => i.id === id))
            .filter((x): x is NonNullable<typeof x> => x !== undefined);
          return (
            <div className="flex flex-wrap gap-1">
              {icps.map((icp) => (
                <Badge key={icp.id} variant="outline" className="text-xs">
                  {icp.emoji}
                </Badge>
              ))}
            </div>
          );
        },
      },
      {
        accessorKey: "audienceSize",
        header: tGtm(accountsText.audience, locale),
        cell: ({ row }) =>
          row.original.audienceSize ? (
            <span className="font-mono text-sm">{row.original.audienceSize.toLocaleString()}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: "lastPostedAt",
        header: tGtm(accountsText.lastPosted, locale),
        cell: ({ row }) =>
          row.original.lastPostedAt ? (
            <span className="text-xs font-mono text-muted-foreground">
              {row.original.lastPostedAt}
            </span>
          ) : (
            <span className="text-muted-foreground text-xs">—</span>
          ),
      },
      {
        accessorKey: "status",
        header: tGtm(accountsText.status, locale),
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <Badge variant={statusVariant[status]}>{tGtm(accountsText[status], locale)}</Badge>
          );
        },
      },
      {
        accessorKey: "owner",
        header: tGtm(accountsText.owner, locale),
        cell: ({ row }) =>
          row.original.owner ? (
            <span className="text-xs text-muted-foreground">{row.original.owner}</span>
          ) : (
            <span className="text-muted-foreground text-xs">—</span>
          ),
      },
    ],
    [data, locale],
  );

  // Group by platform for stats
  const byPlatform = data.accounts.reduce(
    (acc, a) => {
      acc[a.platform] = (acc[a.platform] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  const activeCount = data.accounts.filter((a) => a.status === "active").length;

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{tGtm(accountsText.title, locale)}</h1>
        <p className="text-sm text-muted-foreground">
          {tGtm(accountsText.summary, locale)
            .replace("{count}", data.accounts.length.toString())
            .replace("{active}", activeCount.toString())
            .replace("{platforms}", Object.keys(byPlatform).length.toString())}
        </p>
      </div>
      <DataTable columns={columns} data={data.accounts} />
    </div>
  );
}
