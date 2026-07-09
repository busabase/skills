"use client";

import { Badge } from "kui/badge";
import { Button } from "kui/button";
import { Card, CardContent, CardHeader, CardTitle } from "kui/card";
import { Check, Copy, ExternalLink, FileText, SkipForward } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  type DistributionItem,
  type DistributionTarget,
  pickLocale,
  tGtm,
  useGtmData,
  useGtmDataContext,
  useGtmLocale,
} from "../data";

const platformEmoji: Record<string, string> = {
  youtube: "📺",
  twitter: "🐦",
  linkedin: "💼",
  xiaohongshu: "📱",
  "wechat-gzh": "📝",
  "wechat-video": "🎥",
  github: "🐙",
  producthunt: "🚀",
  discord: "💬",
  bilibili: "📼",
  zhihu: "🅩",
};

const distributeText = {
  posted: { en: "Posted", "zh-CN": "已发布", "zh-TW": "已發布", ja: "投稿済み", pt: "Publicado" },
  skipped: {
    en: "Skipped",
    "zh-CN": "已跳过",
    "zh-TW": "已略過",
    ja: "スキップ済み",
    pt: "Ignorado",
  },
  pending: { en: "Pending", "zh-CN": "待发布", "zh-TW": "待發布", ja: "保留中", pt: "Pendente" },
  merged: { en: "Merged", "zh-CN": "已合并", "zh-TW": "已合併", ja: "マージ済み", pt: "Mesclado" },
  by: { en: "by", "zh-CN": "by", "zh-TW": "by", ja: "by", pt: "por" },
  targets: { en: "targets", "zh-CN": "目标", "zh-TW": "目標", ja: "件の配信先", pt: "destinos" },
  canonical: {
    en: "Canonical (MDX source)",
    "zh-CN": "标准正文（MDX 源）",
    "zh-TW": "標準正文（MDX 來源）",
    ja: "正規版（MDX ソース）",
    pt: "Canônico (fonte MDX)",
  },
  unknown: { en: "Unknown", "zh-CN": "未知", "zh-TW": "未知", ja: "不明", pt: "Desconhecido" },
  body: { en: "Body", "zh-CN": "正文", "zh-TW": "正文", ja: "本文", pt: "Corpo" },
  commentary: {
    en: "Commentary",
    "zh-CN": "评语",
    "zh-TW": "評語",
    ja: "コメント",
    pt: "Comentário",
  },
  backlink: {
    en: "Backlink",
    "zh-CN": "回链",
    "zh-TW": "回鏈",
    ja: "バックリンク",
    pt: "Backlink",
  },
  copiedFull: {
    en: "Copied full kit",
    "zh-CN": "已复制全包",
    "zh-TW": "已複製全包",
    ja: "一式をコピー済み",
    pt: "Kit completo copiado",
  },
  copyFull: {
    en: "Copy full kit (body + commentary + backlink)",
    "zh-CN": "复制全包（正文+评语+回链）",
    "zh-TW": "複製全包（正文+評語+回鏈）",
    ja: "一式をコピー（本文+コメント+バックリンク）",
    pt: "Copiar kit completo (corpo + comentário + backlink)",
  },
  bodyOnly: {
    en: "Body only",
    "zh-CN": "仅正文",
    "zh-TW": "僅正文",
    ja: "本文のみ",
    pt: "Só corpo",
  },
  markPosted: {
    en: "Mark posted",
    "zh-CN": "标记已发布",
    "zh-TW": "標記已發布",
    ja: "投稿済みにする",
    pt: "Marcar publicado",
  },
  skip: { en: "Skip", "zh-CN": "跳过", "zh-TW": "略過", ja: "スキップ", pt: "Ignorar" },
  open: { en: "Open", "zh-CN": "打开", "zh-TW": "打開", ja: "開く", pt: "Abrir" },
  title: {
    en: "Distribution Queue",
    "zh-CN": "分发队列",
    "zh-TW": "分發佇列",
    ja: "配信キュー",
    pt: "Fila de distribuição",
  },
  summary: {
    en: "{items} merged pieces · {pending} pending · {posted} posted",
    "zh-CN": "{items} 条已 merge 内容 · {pending} 待发布 · {posted} 已发布",
    "zh-TW": "{items} 條已 merge 內容 · {pending} 待發布 · {posted} 已發布",
    ja: "{items} 件のマージ済みコンテンツ · {pending} 保留中 · {posted} 投稿済み",
    pt: "{items} peças mescladas · {pending} pendentes · {posted} publicadas",
  },
  mockNotice: {
    en: "This page uses mock data. In the future, Distribution Agent will scan content/writer/ to generate it.",
    "zh-CN": "此页为 mock 数据演示。未来由 Distribution Agent 扫描 content/writer/ 生成。",
    "zh-TW": "此頁為 mock 資料演示。未來由 Distribution Agent 掃描 content/writer/ 生成。",
    ja: "このページはモックデータです。将来は Distribution Agent が content/writer/ をスキャンして生成します。",
    pt: "Esta página usa dados mock. No futuro, o Distribution Agent vai gerar a partir de content/writer/.",
  },
};

function statusChip(status: DistributionTarget["status"], locale: ReturnType<typeof useGtmLocale>) {
  if (status === "posted")
    return <Badge className="bg-green-500">{tGtm(distributeText.posted, locale)}</Badge>;
  if (status === "skipped")
    return <Badge variant="secondary">{tGtm(distributeText.skipped, locale)}</Badge>;
  return (
    <Badge variant="outline" className="border-yellow-500 text-yellow-600">
      {tGtm(distributeText.pending, locale)}
    </Badge>
  );
}

function DistributionItemCard({ item }: { item: DistributionItem }) {
  const locale = useGtmLocale();
  const data = useGtmData();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const icp = data.icps.find((i) => i.id === item.targetIcpId);
  const sku = data.skus.find((s) => s.id === item.targetSkuId);

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // ignore
    }
  };

  const totalTargets = item.distribution.length;
  const postedCount = item.distribution.filter((d) => d.status === "posted").length;
  const pendingCount = item.distribution.filter((d) => d.status === "pending").length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
              <span>{item.title}</span>
            </CardTitle>
            <div className="flex items-center gap-2 mt-2 flex-wrap text-xs">
              {icp && (
                <Badge variant="outline">
                  {icp.emoji} {pickLocale(icp.name, locale)}
                </Badge>
              )}
              {sku && (
                <Badge variant="outline">
                  {sku.emoji} {sku.name}
                </Badge>
              )}
              <span className="text-muted-foreground">
                {tGtm(distributeText.merged, locale)}: {item.mergedAt.slice(0, 10)}{" "}
                {tGtm(distributeText.by, locale)} {item.mergedBy}
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xs font-mono">
              <span className="text-green-500">{postedCount}</span>
              <span className="text-muted-foreground"> / </span>
              <span className="text-yellow-500">
                {pendingCount} {tGtm(distributeText.pending, locale)}
              </span>
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {totalTargets} {tGtm(distributeText.targets, locale)}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Canonical body preview */}
        <details className="border border-border rounded p-2">
          <summary className="text-xs text-muted-foreground cursor-pointer">
            📄 {tGtm(distributeText.canonical, locale)} — {item.mdxPath}
          </summary>
          <pre className="text-xs text-muted-foreground whitespace-pre-wrap mt-2">{item.body}</pre>
        </details>

        {/* Distribution targets */}
        <div className="space-y-2">
          {item.distribution.map((d) => {
            const account = data.accounts.find((a) => a.id === d.accountId);
            const key = `${item.id}-${d.accountId}`;
            const emoji = account ? (platformEmoji[account.platform] ?? "🔗") : "🔗";
            return (
              <div
                key={d.accountId}
                className={`border rounded-lg p-3 ${d.status === "posted" ? "border-green-500/30 bg-green-500/5" : d.status === "skipped" ? "opacity-60" : "border-border"}`}
              >
                {/* Account header */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span>{emoji}</span>
                  {account ? (
                    <>
                      <span className="font-medium text-sm">
                        {account.displayName ?? account.handle}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {account.handle}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {tGtm(distributeText.unknown, locale)}: {d.accountId}
                    </span>
                  )}
                  {d.assignee && (
                    <Badge variant="outline" className="text-[10px]">
                      👤 {d.assignee}
                    </Badge>
                  )}
                  <div className="ml-auto">{statusChip(d.status, locale)}</div>
                </div>

                {/* Kit — Body / Commentary / Backlink */}
                <div className="space-y-1.5 mb-2">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                      {tGtm(distributeText.body, locale)}
                    </div>
                    <pre className="text-xs text-foreground/80 whitespace-pre-wrap bg-muted/50 rounded p-2 max-h-32 overflow-y-auto">
                      {d.body}
                    </pre>
                  </div>
                  {d.commentary && (
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                        {tGtm(distributeText.commentary, locale)}
                      </div>
                      <pre className="text-xs text-foreground/80 whitespace-pre-wrap bg-muted/50 rounded p-2">
                        {d.commentary}
                      </pre>
                    </div>
                  )}
                  {d.backlink && (
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                        {tGtm(distributeText.backlink, locale)}
                      </div>
                      <div className="text-xs font-mono bg-muted/50 rounded p-2 truncate">
                        {d.backlink}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      const full = [d.body, d.commentary, d.backlink].filter(Boolean).join("\n\n");
                      handleCopy(full, `${key}-full`);
                    }}
                    className="h-7 text-xs"
                  >
                    {copiedKey === `${key}-full` ? (
                      <>
                        <Check className="w-3 h-3 mr-1" /> {tGtm(distributeText.copiedFull, locale)}
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 mr-1" /> {tGtm(distributeText.copyFull, locale)}
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(d.body, `${key}-body`)}
                    className="h-7 text-xs"
                  >
                    {copiedKey === `${key}-body` ? (
                      <>
                        <Check className="w-3 h-3 mr-1" /> ✓
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 mr-1" /> {tGtm(distributeText.bodyOnly, locale)}
                      </>
                    )}
                  </Button>

                  {d.status === "pending" && (
                    <>
                      <Button variant="default" size="sm" className="h-7 text-xs" disabled>
                        <Check className="w-3 h-3 mr-1" /> {tGtm(distributeText.markPosted, locale)}
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 text-xs" disabled>
                        <SkipForward className="w-3 h-3 mr-1" /> {tGtm(distributeText.skip, locale)}
                      </Button>
                    </>
                  )}

                  {d.status === "posted" && d.postedUrl && (
                    <>
                      <Link href={d.postedUrl} target="_blank">
                        <Button variant="outline" size="sm" className="h-7 text-xs">
                          <ExternalLink className="w-3 h-3 mr-1" />{" "}
                          {tGtm(distributeText.open, locale)}
                        </Button>
                      </Link>
                      {d.engagement && (
                        <span className="text-xs text-muted-foreground ml-auto">
                          ❤️ {d.engagement.likes ?? 0} · 💬 {d.engagement.comments ?? 0} · 🔁{" "}
                          {d.engagement.shares ?? 0}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function GtmDistributePage() {
  const locale = useGtmLocale();
  const { distributionItems } = useGtmDataContext();
  const totalItems = distributionItems.length;
  const totalPending = distributionItems.reduce(
    (sum, i) => sum + i.distribution.filter((d) => d.status === "pending").length,
    0,
  );
  const totalPosted = distributionItems.reduce(
    (sum, i) => sum + i.distribution.filter((d) => d.status === "posted").length,
    0,
  );

  return (
    <div className="p-6 space-y-4 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">{tGtm(distributeText.title, locale)}</h1>
        <p className="text-sm text-muted-foreground">
          {tGtm(distributeText.summary, locale)
            .replace("{items}", totalItems.toString())
            .replace("{pending}", totalPending.toString())
            .replace("{posted}", totalPosted.toString())}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {tGtm(distributeText.mockNotice, locale)}
        </p>
      </div>

      <div className="space-y-4">
        {distributionItems.map((item) => (
          <DistributionItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
