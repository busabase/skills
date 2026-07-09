"use client";

/**
 * GTM Directories — Third-party platform listings
 *
 * Aggregated view of all external places our products are catalogued:
 * Product Hunt, GitHub, Hacker News, App directories, review sites, etc.
 *
 * Different from `accounts.ts` / Accounts page (which is about where *we* post
 * content as an identity). This page is about where the *product* is listed.
 *
 * Data source: `data.directories`. ICP binding is optional — use
 * `targetIcpIds[]` when a listing explicitly targets an ICP.
 */

import { Badge } from "kui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "kui/card";
import { ExternalLink } from "lucide-react";
import { useMemo, useState } from "react";
import {
  type DirectoryCategory,
  type DirectoryListing,
  pickLocale,
  tGtm,
  useGtmData,
  useGtmLocale,
} from "../data";
import { GtmCommerceAxisNote } from "./gtm-commerce-axis-note";

const categoryEmoji: Record<DirectoryCategory, string> = {
  "launch-platform": "🚀",
  "app-directory": "🏪",
  "code-repo": "🐙",
  "review-site": "⭐",
  community: "💬",
  showcase: "🌟",
  press: "📰",
  other: "📎",
};

const directoriesText = {
  title: {
    en: "🌐 App Directories & Listings",
    "zh-CN": "🌐 应用目录与收录",
    "zh-TW": "🌐 應用目錄與收錄",
    ja: "🌐 アプリディレクトリと掲載",
    pt: "🌐 Diretórios e listagens",
  },
  description: {
    en: "Product listings on third-party platforms (Product Hunt / GitHub / AppSumo / media). This differs from Accounts: directories are where the product is listed, Accounts are identities we use to publish.",
    "zh-CN":
      "产品在第三方平台上的登记（Product Hunt / GitHub / AppSumo / 媒体等）。与 Accounts 区分：这里是产品的“被收录”，Accounts 是“我们发内容”的身份。",
    "zh-TW":
      "產品在第三方平台上的登記（Product Hunt / GitHub / AppSumo / 媒體等）。與 Accounts 區分：這裡是產品的「被收錄」，Accounts 是「我們發內容」的身份。",
    ja: "Product Hunt / GitHub / AppSumo / メディアなど、外部プラットフォームでの掲載一覧。Accounts は投稿用 ID、Directories は製品が掲載される場所です。",
    pt: "Listagens do produto em plataformas externas (Product Hunt / GitHub / AppSumo / mídia). Diferente de Accounts: diretórios são onde o produto é listado; Accounts são identidades de publicação.",
  },
  total: { en: "Total", "zh-CN": "总数", "zh-TW": "總數", ja: "合計", pt: "Total" },
  live: { en: "Live", "zh-CN": "已上线", "zh-TW": "已上線", ja: "公開中", pt: "Ativo" },
  pending: {
    en: "Pending approval",
    "zh-CN": "审核中",
    "zh-TW": "審核中",
    ja: "承認待ち",
    pt: "Aguardando aprovação",
  },
  planned: { en: "Planned", "zh-CN": "规划中", "zh-TW": "規劃中", ja: "予定", pt: "Planejado" },
  category: { en: "Category", "zh-CN": "分类", "zh-TW": "分類", ja: "カテゴリ", pt: "Categoria" },
  status: { en: "Status", "zh-CN": "状态", "zh-TW": "狀態", ja: "ステータス", pt: "Status" },
  all: { en: "All", "zh-CN": "全部", "zh-TW": "全部", ja: "すべて", pt: "Todos" },
  noMatches: {
    en: "No matching listings",
    "zh-CN": "没有匹配的 listing",
    "zh-TW": "沒有符合的 listing",
    ja: "一致する掲載がありません",
    pt: "Nenhuma listagem correspondente",
  },
  reviews: {
    en: "reviews",
    "zh-CN": "条评价",
    "zh-TW": "則評價",
    ja: "件のレビュー",
    pt: "avaliações",
  },
  updated: { en: "updated", "zh-CN": "更新于", "zh-TW": "更新於", ja: "更新", pt: "atualizado" },
  categories: {
    "launch-platform": {
      en: "Launch",
      "zh-CN": "发布平台",
      "zh-TW": "發布平台",
      ja: "ローンチ",
      pt: "Lançamento",
    },
    "app-directory": {
      en: "App Directory",
      "zh-CN": "应用目录",
      "zh-TW": "應用目錄",
      ja: "アプリディレクトリ",
      pt: "Diretório de apps",
    },
    "code-repo": {
      en: "Code Repo",
      "zh-CN": "代码仓库",
      "zh-TW": "程式碼倉庫",
      ja: "コードリポジトリ",
      pt: "Repositório",
    },
    "review-site": {
      en: "Review Site",
      "zh-CN": "评测站",
      "zh-TW": "評測站",
      ja: "レビューサイト",
      pt: "Site de reviews",
    },
    community: {
      en: "Community",
      "zh-CN": "社区",
      "zh-TW": "社群",
      ja: "コミュニティ",
      pt: "Comunidade",
    },
    showcase: {
      en: "Showcase",
      "zh-CN": "展示",
      "zh-TW": "展示",
      ja: "ショーケース",
      pt: "Showcase",
    },
    press: { en: "Press", "zh-CN": "媒体", "zh-TW": "媒體", ja: "プレス", pt: "Imprensa" },
    other: { en: "Other", "zh-CN": "其他", "zh-TW": "其他", ja: "その他", pt: "Outro" },
  },
};

const statusColor = {
  live: "bg-green-500 text-white",
  planned: "bg-zinc-400 text-white",
  "pending-approval": "bg-blue-500 text-white",
  rejected: "bg-red-500 text-white",
  archived: "bg-zinc-300 text-zinc-700",
} as const;

export function GtmDirectoriesPage() {
  const locale = useGtmLocale();
  const data = useGtmData();
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const all = data.directories;

  const stats = useMemo(
    () => ({
      total: all.length,
      live: all.filter((d) => d.status === "live").length,
      planned: all.filter((d) => d.status === "planned").length,
      pending: all.filter((d) => d.status === "pending-approval").length,
    }),
    [all],
  );

  const categories = useMemo(() => {
    const set = new Set<string>(all.map((d) => d.category));
    return ["all", ...Array.from(set).sort()];
  }, [all]);

  const filtered = useMemo(
    () =>
      all
        .filter((d) => categoryFilter === "all" || d.category === categoryFilter)
        .filter((d) => statusFilter === "all" || d.status === statusFilter)
        .sort((a, b) => {
          // Live first, then pending, planned, archived
          const order = {
            live: 0,
            "pending-approval": 1,
            planned: 2,
            rejected: 3,
            archived: 4,
          };
          return order[a.status] - order[b.status];
        }),
    [all, categoryFilter, statusFilter],
  );

  // Group by category for rendering
  const grouped = useMemo(() => {
    const map = new Map<DirectoryCategory, DirectoryListing[]>();
    for (const d of filtered) {
      const list = map.get(d.category) ?? [];
      list.push(d);
      map.set(d.category, list);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div className="p-6 space-y-4 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">{tGtm(directoriesText.title, locale)}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {tGtm(directoriesText.description, locale)}
        </p>
      </div>

      <GtmCommerceAxisNote current="directories" />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label={tGtm(directoriesText.total, locale)} value={stats.total.toString()} />
        <StatCard label={tGtm(directoriesText.live, locale)} value={stats.live.toString()} />
        <StatCard label={tGtm(directoriesText.pending, locale)} value={stats.pending.toString()} />
        <StatCard label={tGtm(directoriesText.planned, locale)} value={stats.planned.toString()} />
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap items-center text-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {tGtm(directoriesText.category, locale)}:
          </span>
          <div className="flex gap-1 flex-wrap">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategoryFilter(c)}
                className={`px-2 py-0.5 rounded text-xs border ${
                  categoryFilter === c
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                {c === "all"
                  ? tGtm(directoriesText.all, locale)
                  : `${categoryEmoji[c as DirectoryCategory]} ${tGtm(directoriesText.categories[c as DirectoryCategory], locale)}`}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {tGtm(directoriesText.status, locale)}:
          </span>
          <div className="flex gap-1">
            {["all", "live", "pending-approval", "planned", "archived"].map((s) => (
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
                  ? tGtm(directoriesText.all, locale)
                  : s === "pending-approval"
                    ? tGtm(directoriesText.pending, locale)
                    : tGtm(directoriesText[s as "live" | "planned"], locale)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grouped by category */}
      {grouped.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-sm text-muted-foreground italic">
            {tGtm(directoriesText.noMatches, locale)}
          </CardContent>
        </Card>
      ) : (
        grouped.map(([cat, items]) => (
          <Card key={cat}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <span>{categoryEmoji[cat]}</span>
                <span>{tGtm(directoriesText.categories[cat], locale)}</span>
                <Badge variant="outline" className="ml-auto text-[10px]">
                  {items.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                {items.map((d) => {
                  const bl = d.businessLineId
                    ? data.businessLines.find((b) => b.id === d.businessLineId)
                    : null;
                  const targetIcps = (d.targetIcpIds ?? [])
                    .map((id) => data.icps.find((i) => i.id === id))
                    .filter(Boolean);
                  return (
                    <div
                      key={d.id}
                      className="flex items-start gap-2 py-2 px-2 rounded hover:bg-muted/30"
                    >
                      <Badge className={`text-[9px] shrink-0 mt-0.5 ${statusColor[d.status]}`}>
                        {d.status}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">{d.displayName}</span>
                          <Badge variant="outline" className="text-[9px]">
                            {d.platform}
                          </Badge>
                          {bl && (
                            <Badge variant="outline" className="text-[9px]">
                              {bl.emoji} {bl.name}
                            </Badge>
                          )}
                        </div>
                        {d.url && (
                          <a
                            href={d.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mt-0.5 break-all"
                          >
                            {d.url}
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        )}
                        {d.notes && (
                          <div className="text-xs text-muted-foreground mt-1 italic">{d.notes}</div>
                        )}
                        {/* Target ICPs (optional) */}
                        {targetIcps.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {targetIcps.map(
                              (icp) =>
                                icp && (
                                  <Badge key={icp.id} variant="outline" className="text-[9px]">
                                    {icp.emoji} {pickLocale(icp.name, locale)}
                                  </Badge>
                                ),
                            )}
                          </div>
                        )}
                        {/* Metrics */}
                        {d.metrics && (
                          <div className="flex gap-3 text-[10px] text-muted-foreground font-mono mt-1">
                            {d.metrics.upvotes !== undefined && <span>▲ {d.metrics.upvotes}</span>}
                            {d.metrics.stars !== undefined && <span>★ {d.metrics.stars}</span>}
                            {d.metrics.reviews !== undefined && (
                              <span>
                                {d.metrics.reviews} {tGtm(directoriesText.reviews, locale)}
                              </span>
                            )}
                            {d.metrics.rating !== undefined && <span>{d.metrics.rating}/5</span>}
                            {d.metrics.capturedAt && (
                              <span className="ml-auto">
                                {tGtm(directoriesText.updated, locale)} {d.metrics.capturedAt}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))
      )}
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
