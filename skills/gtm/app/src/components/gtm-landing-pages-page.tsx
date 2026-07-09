"use client";

/**
 * GTM Landing Pages — Cross-ICP view
 *
 * Aggregates all landing-page assets from every ICP and overlays the landing copy status.
 * Lets the growth lead spot inconsistencies (headline variants, CTA mismatches, missing copy).
 */

import { Badge } from "kui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "kui/card";
import { ExternalLink } from "lucide-react";
import { useMemo } from "react";
import { useLocation } from "wouter";
import { type ICP, pickLocale, tGtm, useGtmData, useGtmLocale } from "../data";

const statusColor = {
  live: "bg-green-500",
  draft: "bg-yellow-500",
  todo: "bg-zinc-400",
} as const;

interface LandingRow {
  icp: ICP;
  landingAssets: ICP["assets"];
  copyHeadline: string | null;
  copySubheadline: string | null;
  copyPrimaryCta: string | null;
  featureCount: number;
  useCaseCount: number;
  completeness: number; // 0-100 heuristic
}

const landingText = {
  title: {
    en: "📄 Landing Pages",
    "zh-CN": "📄 落地页",
    "zh-TW": "📄 落地頁",
    ja: "📄 LP",
    pt: "📄 Landing pages",
  },
  description: {
    en: "Cross-ICP landing assets and copy matrix · review Hero / CTA consistency and coverage",
    "zh-CN": "所有 ICP 的落地页资产与文案横向对比 · 用于审查 Hero / CTA 一致性和覆盖度",
    "zh-TW": "所有 ICP 的落地頁資產與文案橫向對比 · 用於審查 Hero / CTA 一致性和覆蓋度",
    ja: "ICP 横断の LP 資産とコピー比較 · Hero / CTA の一貫性と網羅性を確認",
    pt: "Matriz de assets e copy de landing pages por ICP · revisar consistência e cobertura de Hero / CTA",
  },
  live: { en: "live", "zh-CN": "live", "zh-TW": "live", ja: "live", pt: "live" },
  landingAssets: {
    en: "Landing assets",
    "zh-CN": "Landing 资产",
    "zh-TW": "Landing 資產",
    ja: "LP 資産",
    pt: "Assets de landing",
  },
  icpsWithCopy: {
    en: "ICPs with copy",
    "zh-CN": "ICPs 有文案",
    "zh-TW": "ICPs 有文案",
    ja: "コピーあり ICP",
    pt: "ICPs com copy",
  },
  avgCompleteness: {
    en: "Avg completeness",
    "zh-CN": "平均完整度",
    "zh-TW": "平均完整度",
    ja: "平均完成度",
    pt: "Completude média",
  },
  icpTotal: {
    en: "ICP total",
    "zh-CN": "ICP 总数",
    "zh-TW": "ICP 總數",
    ja: "ICP 合計",
    pt: "Total de ICPs",
  },
  heroMatrix: {
    en: "Hero copy matrix",
    "zh-CN": "Hero 文案矩阵",
    "zh-TW": "Hero 文案矩陣",
    ja: "Hero コピーマトリクス",
    pt: "Matriz de copy do Hero",
  },
  icp: { en: "ICP", "zh-CN": "ICP", "zh-TW": "ICP", ja: "ICP", pt: "ICP" },
  headline: { en: "Headline", "zh-CN": "标题", "zh-TW": "標題", ja: "見出し", pt: "Headline" },
  subheadline: {
    en: "Subheadline",
    "zh-CN": "副标题",
    "zh-TW": "副標題",
    ja: "サブ見出し",
    pt: "Subheadline",
  },
  primaryCta: {
    en: "Primary CTA",
    "zh-CN": "主 CTA",
    "zh-TW": "主 CTA",
    ja: "主要 CTA",
    pt: "CTA principal",
  },
  completeness: {
    en: "Completeness",
    "zh-CN": "完整度",
    "zh-TW": "完整度",
    ja: "完成度",
    pt: "Completude",
  },
  undefined: {
    en: "Undefined",
    "zh-CN": "未定义",
    "zh-TW": "未定義",
    ja: "未定義",
    pt: "Não definido",
  },
  allAssets: {
    en: "All landing assets",
    "zh-CN": "所有 Landing 资产",
    "zh-TW": "所有 Landing 資產",
    ja: "すべての LP 資産",
    pt: "Todos os assets de landing",
  },
  noAssets: {
    en: "No landing assets yet",
    "zh-CN": "暂无 landing 资产",
    "zh-TW": "暫無 landing 資產",
    ja: "LP 資産なし",
    pt: "Sem assets de landing",
  },
  visit: { en: "Visit", "zh-CN": "访问", "zh-TW": "造訪", ja: "開く", pt: "Visitar" },
};

function computeCompleteness(icp: ICP): number {
  let score = 0;
  const landingLive = icp.assets.some((a) => a.category === "landing-page" && a.status === "live");
  if (landingLive) score += 30;
  if (icp.landingCopy?.hero?.headline) score += 20;
  if (icp.landingCopy?.hero?.subheadline) score += 10;
  if (icp.landingCopy?.hero?.primaryCta?.label) score += 10;
  const features = icp.landingCopy?.features?.length ?? 0;
  if (features >= 3) score += 15;
  else if (features > 0) score += 5;
  const useCases = icp.landingCopy?.useCases?.length ?? 0;
  if (useCases >= 2) score += 15;
  else if (useCases > 0) score += 5;
  return Math.min(100, score);
}

export function GtmLandingPagesPage() {
  const locale = useGtmLocale();
  const data = useGtmData();
  const [, navigate] = useLocation();

  const rows = useMemo<LandingRow[]>(
    () =>
      data.icps.map((icp) => {
        const landingAssets = icp.assets.filter((a) => a.category === "landing-page");
        return {
          icp,
          landingAssets,
          copyHeadline: icp.landingCopy?.hero?.headline ?? null,
          copySubheadline: icp.landingCopy?.hero?.subheadline ?? null,
          copyPrimaryCta: icp.landingCopy?.hero?.primaryCta?.label ?? null,
          featureCount: icp.landingCopy?.features?.length ?? 0,
          useCaseCount: icp.landingCopy?.useCases?.length ?? 0,
          completeness: computeCompleteness(icp),
        };
      }),
    [data],
  );

  // Aggregate stats
  const stats = useMemo(() => {
    const totalLanding = rows.reduce((s, r) => s + r.landingAssets.length, 0);
    const liveLanding = rows.reduce(
      (s, r) => s + r.landingAssets.filter((a) => a.status === "live").length,
      0,
    );
    const icpsWithCopy = rows.filter((r) => !!r.copyHeadline).length;
    const avgCompleteness = Math.round(rows.reduce((s, r) => s + r.completeness, 0) / rows.length);
    return { totalLanding, liveLanding, icpsWithCopy, avgCompleteness };
  }, [rows]);

  return (
    <div className="p-6 space-y-4 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">{tGtm(landingText.title, locale)}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {tGtm(landingText.description, locale)}
        </p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label={tGtm(landingText.landingAssets, locale)}
          value={`${stats.liveLanding}/${stats.totalLanding} ${tGtm(landingText.live, locale)}`}
        />
        <StatCard
          label={tGtm(landingText.icpsWithCopy, locale)}
          value={`${stats.icpsWithCopy}/${rows.length}`}
        />
        <StatCard
          label={tGtm(landingText.avgCompleteness, locale)}
          value={`${stats.avgCompleteness}%`}
        />
        <StatCard label={tGtm(landingText.icpTotal, locale)} value={rows.length.toString()} />
      </div>

      {/* Hero copy matrix */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{tGtm(landingText.heroMatrix, locale)}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2 pr-4 font-medium w-[18%]">{tGtm(landingText.icp, locale)}</th>
                  <th className="py-2 pr-4 font-medium w-[30%]">
                    {tGtm(landingText.headline, locale)}
                  </th>
                  <th className="py-2 pr-4 font-medium w-[25%]">
                    {tGtm(landingText.subheadline, locale)}
                  </th>
                  <th className="py-2 pr-4 font-medium w-[12%]">
                    {tGtm(landingText.primaryCta, locale)}
                  </th>
                  <th className="py-2 pr-4 font-medium w-[15%]">
                    {tGtm(landingText.completeness, locale)}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.icp.id}
                    className="border-b border-border/50 hover:bg-muted/30 cursor-pointer"
                    onClick={() => navigate(`/icps/${r.icp.id}#landing-copy`)}
                  >
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{r.icp.emoji}</span>
                        <span className="font-medium text-xs">
                          {pickLocale(r.icp.name, locale)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-xs">
                      {r.copyHeadline ?? (
                        <span className="text-muted-foreground italic">
                          {tGtm(landingText.undefined, locale)}
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-xs text-muted-foreground">
                      {r.copySubheadline ?? <span className="italic">—</span>}
                    </td>
                    <td className="py-3 pr-4 text-xs">
                      {r.copyPrimaryCta ? (
                        <Badge variant="outline" className="text-[10px]">
                          {r.copyPrimaryCta}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground italic">—</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-20">
                          <div
                            className={`h-full ${
                              r.completeness >= 75
                                ? "bg-green-500"
                                : r.completeness >= 40
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            }`}
                            style={{ width: `${r.completeness}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {r.completeness}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Landing assets list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{tGtm(landingText.allAssets, locale)}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            {rows.flatMap((r) =>
              r.landingAssets.length === 0
                ? [
                    <div
                      key={`${r.icp.id}-empty`}
                      className="flex items-center gap-2 text-xs py-2 px-2 text-muted-foreground"
                    >
                      <span className="text-sm">{r.icp.emoji}</span>
                      <span>{pickLocale(r.icp.name, locale)}</span>
                      <span className="italic ml-auto">{tGtm(landingText.noAssets, locale)}</span>
                    </div>,
                  ]
                : r.landingAssets.map((asset) => (
                    <div
                      key={`${r.icp.id}-${asset.name}`}
                      className="flex items-center gap-2 text-sm py-2 px-2 rounded hover:bg-muted/50"
                    >
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${statusColor[asset.status]}`}
                      />
                      <span className="text-sm shrink-0">{r.icp.emoji}</span>
                      <span className="text-xs text-muted-foreground shrink-0 w-32 truncate">
                        {pickLocale(r.icp.name, locale)}
                      </span>
                      <span className="text-xs flex-1 truncate">{asset.name}</span>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {asset.status}
                      </Badge>
                      {asset.url && (
                        <a
                          href={asset.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1 shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {tGtm(landingText.visit, locale)} <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )),
            )}
          </div>
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
