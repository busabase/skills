"use client";

/**
 * GTM Content Library — Cross-ICP published content inventory
 *
 * Aggregates `icp.content[]` (what's been produced) across all ICPs.
 * Filter by type (blog / video / xhs / etc.) and status (published / draft / planned).
 * Complements Calendar (what's scheduled) and Distribute (publishing queue).
 */

import { Badge } from "kui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "kui/card";
import { ExternalLink } from "lucide-react";
import { useMemo, useState } from "react";
import { pickLocale, tGtm, useGtmData, useGtmLocale } from "../data";

interface LibraryItem {
  title: string;
  type: string;
  status: "published" | "draft" | "planned";
  url?: string;
  date?: string;
  icpId: string;
  icpName: string;
  icpEmoji: string;
}

const typeEmoji: Record<string, string> = {
  blog: "📄",
  xhs: "📕",
  video: "🎬",
  course: "🎓",
  event: "📅",
  email: "📧",
  tweet: "🐦",
  linkedin: "💼",
};

const statusColor = {
  published: "bg-green-500 text-white",
  draft: "bg-yellow-500 text-white",
  planned: "bg-zinc-400 text-white",
} as const;

const libraryText = {
  title: {
    en: "📚 Content Library",
    "zh-CN": "📚 内容库",
    "zh-TW": "📚 內容庫",
    ja: "📚 コンテンツライブラリ",
    pt: "📚 Biblioteca de conteúdo",
  },
  description: {
    en: "All ICP produced, in-progress, and planned content · review hub",
    "zh-CN": "所有 ICP 已产出 / 在制 / 计划中的内容清单 · 审查入口",
    "zh-TW": "所有 ICP 已產出 / 製作中 / 計劃中的內容清單 · 審查入口",
    ja: "すべての ICP の制作済み / 進行中 / 予定コンテンツ · レビューハブ",
    pt: "Conteúdo produzido, em andamento e planejado de todos os ICPs · central de revisão",
  },
  total: { en: "Total", "zh-CN": "总数", "zh-TW": "總數", ja: "合計", pt: "Total" },
  published: {
    en: "Published",
    "zh-CN": "已发布",
    "zh-TW": "已發布",
    ja: "公開済み",
    pt: "Publicado",
  },
  draft: { en: "Draft", "zh-CN": "草稿", "zh-TW": "草稿", ja: "下書き", pt: "Rascunho" },
  planned: { en: "Planned", "zh-CN": "计划中", "zh-TW": "計劃中", ja: "予定", pt: "Planejado" },
  type: { en: "Type", "zh-CN": "类型", "zh-TW": "類型", ja: "種類", pt: "Tipo" },
  status: { en: "Status", "zh-CN": "状态", "zh-TW": "狀態", ja: "ステータス", pt: "Status" },
  all: { en: "All", "zh-CN": "全部", "zh-TW": "全部", ja: "すべて", pt: "Todos" },
  listTitle: {
    en: "Content list · {count} items",
    "zh-CN": "内容清单 · {count} 项",
    "zh-TW": "內容清單 · {count} 項",
    ja: "コンテンツ一覧 · {count} 件",
    pt: "Lista de conteúdo · {count} itens",
  },
  noMatches: {
    en: "No matching content",
    "zh-CN": "没有匹配的内容",
    "zh-TW": "沒有符合的內容",
    ja: "一致するコンテンツがありません",
    pt: "Nenhum conteúdo correspondente",
  },
};

export function GtmContentLibraryPage() {
  const locale = useGtmLocale();
  const data = useGtmData();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const allItems = useMemo<LibraryItem[]>(
    () =>
      data.icps.flatMap((icp) =>
        icp.content.map((c) => ({
          title: pickLocale(c.title, locale) ?? "",
          type: c.type,
          status: c.status,
          url: c.url,
          date: c.date,
          icpId: icp.id,
          icpName: pickLocale(icp.name, locale) ?? "",
          icpEmoji: icp.emoji,
        })),
      ),
    [data, locale],
  );

  const types = useMemo(() => {
    const set = new Set(allItems.map((i) => i.type));
    return ["all", ...Array.from(set).sort()];
  }, [allItems]);

  const filtered = useMemo(
    () =>
      allItems
        .filter((i) => typeFilter === "all" || i.type === typeFilter)
        .filter((i) => statusFilter === "all" || i.status === statusFilter)
        .sort((a, b) => {
          // Published first, then by date desc
          if (a.status !== b.status) {
            const order = { published: 0, draft: 1, planned: 2 };
            return order[a.status] - order[b.status];
          }
          if (a.date && b.date) return b.date.localeCompare(a.date);
          return 0;
        }),
    [allItems, typeFilter, statusFilter],
  );

  const stats = useMemo(() => {
    const published = allItems.filter((i) => i.status === "published").length;
    const draft = allItems.filter((i) => i.status === "draft").length;
    const planned = allItems.filter((i) => i.status === "planned").length;
    return { total: allItems.length, published, draft, planned };
  }, [allItems]);

  return (
    <div className="p-6 space-y-4 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">{tGtm(libraryText.title, locale)}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {tGtm(libraryText.description, locale)}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard label={tGtm(libraryText.total, locale)} value={stats.total.toString()} />
        <StatCard label={tGtm(libraryText.published, locale)} value={stats.published.toString()} />
        <StatCard label={tGtm(libraryText.draft, locale)} value={stats.draft.toString()} />
        <StatCard label={tGtm(libraryText.planned, locale)} value={stats.planned.toString()} />
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap items-center text-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{tGtm(libraryText.type, locale)}:</span>
          <div className="flex gap-1 flex-wrap">
            {types.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t)}
                className={`px-2 py-0.5 rounded text-xs border ${
                  typeFilter === t
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                {t === "all"
                  ? tGtm(libraryText.all, locale)
                  : typeEmoji[t]
                    ? `${typeEmoji[t]} ${t}`
                    : t}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{tGtm(libraryText.status, locale)}:</span>
          <div className="flex gap-1">
            {["all", "published", "draft", "planned"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-2 py-0.5 rounded text-xs border ${
                  statusFilter === s
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                {s === "all"
                  ? tGtm(libraryText.all, locale)
                  : tGtm(libraryText[s as "published" | "draft" | "planned"], locale)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {tGtm(libraryText.listTitle, locale).replace("{count}", filtered.length.toString())}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              {tGtm(libraryText.noMatches, locale)}
            </p>
          ) : (
            <div className="space-y-1">
              {filtered.map((item) => (
                <div
                  key={`${item.icpId}-${item.title}`}
                  className="flex items-center gap-2 text-sm py-2 px-2 rounded hover:bg-muted/50"
                >
                  <span className="shrink-0 text-sm">{typeEmoji[item.type] ?? "•"}</span>
                  <Badge variant="outline" className="text-[9px] shrink-0 w-16 justify-center">
                    {item.type}
                  </Badge>
                  <Badge className={`text-[9px] shrink-0 ${statusColor[item.status]}`}>
                    {item.status}
                  </Badge>
                  <span className="text-xs flex-1 truncate" title={item.title}>
                    {item.title}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0" title={item.icpName}>
                    {item.icpEmoji}
                  </span>
                  {item.date && (
                    <span className="text-[10px] font-mono text-muted-foreground shrink-0 w-20 text-right">
                      {item.date}
                    </span>
                  )}
                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1 shrink-0"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="w-3 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-bold mt-1 font-mono">{value}</div>
    </div>
  );
}
