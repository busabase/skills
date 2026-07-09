"use client";

/**
 * GTM Competitors — Cross-ICP view
 *
 * Aggregates all competitors from every ICP to surface:
 *  - Who we compete with (direct / indirect / status-quo)
 *  - Which ICP(s) see them as a threat
 *  - Compare page coverage (vs competitor)
 */

import { Badge } from "kui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "kui/card";
import { ExternalLink } from "lucide-react";
import { useMemo } from "react";
import { useLocation } from "wouter";
import { type Competitor, pickLocale, tGtm, useGtmData, useGtmLocale } from "../data";

interface CompetitorRow {
  name: string;
  category: Competitor["category"];
  appearsInIcps: Array<{
    id: string;
    name: string;
    emoji: string;
    their_strength: string;
    our_advantage: string;
    comparePageStatus?: Competitor["comparePageStatus"];
    comparePageUrl?: string;
  }>;
  url?: string;
}

const categoryColor = {
  direct: "bg-red-500 text-white",
  indirect: "bg-yellow-500 text-white",
  "status-quo": "bg-zinc-500 text-white",
} as const;

const comparePageColor = {
  live: "bg-green-500 text-white",
  draft: "bg-yellow-500 text-white",
  todo: "bg-zinc-400 text-white",
} as const;

const competitorsText = {
  title: {
    en: "⚔️ Competitors",
    "zh-CN": "⚔️ 竞品",
    "zh-TW": "⚔️ 競品",
    ja: "⚔️ 競合",
    pt: "⚔️ Concorrentes",
  },
  description: {
    en: "Competitors aggregated across ICPs · deduplicated · sorted by appearance frequency · unify competitive narrative",
    "zh-CN": "所有 ICP 的竞争对手聚合 · 去重 · 按出现频率排序 · 用于统一竞争叙事",
    "zh-TW": "所有 ICP 的競爭對手聚合 · 去重 · 按出現頻率排序 · 用於統一競爭敘事",
    ja: "ICP 横断の競合を集約 · 重複排除 · 出現頻度順 · 競合ストーリーを統一",
    pt: "Concorrentes agregados por ICP · deduplicados · ordenados por frequência · narrativa competitiva unificada",
  },
  unique: {
    en: "Unique competitors",
    "zh-CN": "独立竞品",
    "zh-TW": "獨立競品",
    ja: "ユニーク競合",
    pt: "Concorrentes únicos",
  },
  direct: { en: "Direct", "zh-CN": "直接竞争", "zh-TW": "直接競爭", ja: "直接競合", pt: "Diretos" },
  indirect: {
    en: "Indirect",
    "zh-CN": "间接竞争",
    "zh-TW": "間接競爭",
    ja: "間接競合",
    pt: "Indiretos",
  },
  comparePages: {
    en: "Compare pages",
    "zh-CN": "Compare 页",
    "zh-TW": "Compare 頁",
    ja: "比較ページ",
    pt: "Páginas compare",
  },
  statusQuo: {
    en: "Status quo",
    "zh-CN": "现状替代",
    "zh-TW": "現狀替代",
    ja: "現状維持",
    pt: "Status quo",
  },
  live: { en: "live", "zh-CN": "live", "zh-TW": "live", ja: "live", pt: "live" },
  icpSingular: { en: "ICP", "zh-CN": "ICP", "zh-TW": "ICP", ja: "ICP", pt: "ICP" },
  icpPlural: { en: "ICPs", "zh-CN": "ICPs", "zh-TW": "ICPs", ja: "ICP", pt: "ICPs" },
  website: { en: "Website", "zh-CN": "官网", "zh-TW": "官網", ja: "公式サイト", pt: "Site" },
  theirStrength: {
    en: "Their strength",
    "zh-CN": "他们的强点",
    "zh-TW": "他們的強點",
    ja: "相手の強み",
    pt: "Força deles",
  },
  ourAdvantage: {
    en: "Our advantage",
    "zh-CN": "我们的优势",
    "zh-TW": "我們的優勢",
    ja: "自社の優位",
    pt: "Nossa vantagem",
  },
};

export function GtmCompetitorsPage() {
  const locale = useGtmLocale();
  const data = useGtmData();
  const [, navigate] = useLocation();

  const rows = useMemo<CompetitorRow[]>(() => {
    const byName = new Map<string, CompetitorRow>();
    for (const icp of data.icps) {
      for (const c of icp.competitors) {
        const competitorName = pickLocale(c.name, locale) ?? "";
        const existing = byName.get(competitorName);
        const appearance = {
          id: icp.id,
          name: pickLocale(icp.name, locale) ?? "",
          emoji: icp.emoji,
          their_strength: pickLocale(c.their_strength, locale) ?? "",
          our_advantage: pickLocale(c.our_advantage, locale) ?? "",
          comparePageStatus: c.comparePageStatus,
          comparePageUrl: c.comparePageUrl,
        };
        if (existing) {
          existing.appearsInIcps.push(appearance);
          if (!existing.url && c.url) existing.url = c.url;
        } else {
          byName.set(competitorName, {
            name: competitorName,
            category: c.category,
            appearsInIcps: [appearance],
            url: c.url,
          });
        }
      }
    }
    return Array.from(byName.values()).sort((a, b) => {
      // Sort by category (direct first) then by ICP appearance count desc
      const catOrder = { direct: 0, indirect: 1, "status-quo": 2 };
      const catDiff = catOrder[a.category] - catOrder[b.category];
      if (catDiff !== 0) return catDiff;
      return b.appearsInIcps.length - a.appearsInIcps.length;
    });
  }, [data, locale]);

  const stats = useMemo(() => {
    const totalComparePages = rows.reduce(
      (s, r) =>
        s +
        r.appearsInIcps.filter(
          (a) => a.comparePageStatus === "live" || a.comparePageStatus === "draft",
        ).length,
      0,
    );
    const liveComparePages = rows.reduce(
      (s, r) => s + r.appearsInIcps.filter((a) => a.comparePageStatus === "live").length,
      0,
    );
    return {
      uniqueCompetitors: rows.length,
      direct: rows.filter((r) => r.category === "direct").length,
      indirect: rows.filter((r) => r.category === "indirect").length,
      statusQuo: rows.filter((r) => r.category === "status-quo").length,
      liveComparePages,
      totalComparePages,
    };
  }, [rows]);

  return (
    <div className="p-6 space-y-4 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">{tGtm(competitorsText.title, locale)}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {tGtm(competitorsText.description, locale)}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard
          label={tGtm(competitorsText.unique, locale)}
          value={stats.uniqueCompetitors.toString()}
        />
        <StatCard label={tGtm(competitorsText.direct, locale)} value={stats.direct.toString()} />
        <StatCard
          label={tGtm(competitorsText.indirect, locale)}
          value={stats.indirect.toString()}
        />
        <StatCard
          label={tGtm(competitorsText.statusQuo, locale)}
          value={stats.statusQuo.toString()}
        />
        <StatCard
          label={tGtm(competitorsText.comparePages, locale)}
          value={`${stats.liveComparePages} ${tGtm(competitorsText.live, locale)}`}
        />
      </div>

      {/* Competitor cards */}
      <div className="space-y-3">
        {rows.map((r) => (
          <Card key={r.name}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 flex-wrap">
                <span>{r.name}</span>
                <Badge className={`text-[10px] ${categoryColor[r.category]}`}>{r.category}</Badge>
                <Badge variant="outline" className="text-[10px]">
                  {r.appearsInIcps.length}{" "}
                  {r.appearsInIcps.length > 1
                    ? tGtm(competitorsText.icpPlural, locale)
                    : tGtm(competitorsText.icpSingular, locale)}
                </Badge>
                {r.url && (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 ml-auto"
                  >
                    {tGtm(competitorsText.website, locale)} <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {r.appearsInIcps.map((a) => (
                  <button
                    key={`${r.name}-${a.id}`}
                    type="button"
                    onClick={() => navigate(`/icps/${a.id}#competitors`)}
                    className="w-full grid grid-cols-12 gap-2 items-start text-xs py-2 px-2 rounded hover:bg-muted/50 text-left"
                  >
                    <div className="col-span-3 flex items-center gap-2 min-w-0">
                      <span className="text-base">{a.emoji}</span>
                      <span className="font-medium truncate">{a.name}</span>
                    </div>
                    <div className="col-span-4 text-muted-foreground">
                      <div className="text-[10px] uppercase tracking-wide mb-0.5">
                        {tGtm(competitorsText.theirStrength, locale)}
                      </div>
                      {a.their_strength}
                    </div>
                    <div className="col-span-4">
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
                        {tGtm(competitorsText.ourAdvantage, locale)}
                      </div>
                      {a.our_advantage}
                    </div>
                    <div className="col-span-1 flex justify-end">
                      {a.comparePageStatus ? (
                        <Badge className={`text-[9px] ${comparePageColor[a.comparePageStatus]}`}>
                          {a.comparePageStatus}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-[10px] italic">—</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
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
