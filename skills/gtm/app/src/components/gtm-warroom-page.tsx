"use client";

/**
 * GTM War Room — Home / Situation Room
 *
 * The landing page of the /systemadmin/gtm command center. Surfaces:
 *  - Commercial Loop Index per ICP (roll-up)
 *  - Loop blockers (🔴 red, 🟡 yellow capability blocks)
 *  - This week's scheduled content & running campaigns
 *  - Active experiments
 *  - Operational stream health
 *
 * NOTE: Read-only view. All mutations happen via PRs to data.ts.
 */

import { Badge } from "kui/badge";
import { Button } from "kui/button";
import { Card, CardContent, CardHeader, CardTitle } from "kui/card";
import { ArrowRight, Calendar, Flag, FlaskConical, Megaphone, Target, Users } from "lucide-react";
import { useMemo } from "react";
import { useLocation } from "wouter";
import { pickLocale, tGtm, useGtmData, useGtmLocale } from "../data";
import { computeIcpPillars, PILLAR_LABELS } from "../pillar-scoring";

const healthDot = {
  green: "bg-green-500",
  yellow: "bg-yellow-500",
  red: "bg-red-500",
} as const;

const healthBg = {
  green: "bg-green-500 text-white",
  yellow: "bg-yellow-500 text-white",
  red: "bg-red-500 text-white",
} as const;

const warRoomText = {
  title: {
    en: "🧭 War Room",
    "zh-CN": "🧭 战情室",
    "zh-TW": "🧭 戰情室",
    ja: "🧭 War Room",
    pt: "🧭 Sala de Guerra",
  },
  subtitle: {
    en: "Go-to-Market command center · situation overview / alerts / this week / running campaigns",
    "zh-CN": "Go-to-Market 指挥中心 · 战情一览 / 告警 / 本周要做 / 在投",
    "zh-TW": "Go-to-Market 指揮中心 · 戰情一覽 / 告警 / 本週要做 / 在投",
    ja: "Go-to-Market 指令センター · 状況 / アラート / 今週 / 配信中",
    pt: "Central de comando Go-to-Market · visão / alertas / semana / campanhas ativas",
  },
  updateNote: {
    en: "Update via PR to",
    "zh-CN": "更新：通过 PR 修改",
    "zh-TW": "更新：透過 PR 修改",
    ja: "更新は PR で変更",
    pt: "Atualize via PR em",
  },
  goalsOnTrack: {
    en: "Goals on track",
    "zh-CN": "目标正常",
    "zh-TW": "目標正常",
    ja: "順調な目標",
    pt: "Metas no prazo",
  },
  icps: { en: "ICPs", "zh-CN": "ICP", "zh-TW": "ICP", ja: "ICP", pt: "ICPs" },
  experiments: {
    en: "Experiments",
    "zh-CN": "实验",
    "zh-TW": "實驗",
    ja: "実験",
    pt: "Experimentos",
  },
  campaignsRunning: {
    en: "Campaigns running",
    "zh-CN": "Campaigns 在投",
    "zh-TW": "Campaigns 在投",
    ja: "配信中キャンペーン",
    pt: "Campanhas ativas",
  },
  healthTitle: {
    en: "🚦 Commercial Loop Index",
    "zh-CN": "🚦 商业闭环指数",
    "zh-TW": "🚦 商業閉環指數",
    ja: "🚦 商業ループ指数",
    pt: "🚦 Índice de loop comercial",
  },
  healthSubtitle: {
    en: "Can this ICP move from offer → acquisition → conversion → delivery → retention?",
    "zh-CN": "这个 ICP 是否已经从商品 → 获客 → 成交 → 交付 → 留存跑通？",
    "zh-TW": "這個 ICP 是否已經從商品 → 獲客 → 成交 → 交付 → 留存跑通？",
    ja: "この ICP は商品 → 獲得 → 成約 → 提供 → 継続まで回っているか？",
    pt: "Este ICP fecha o ciclo oferta → aquisição → conversão → entrega → retenção?",
  },
  detail: { en: "Detail", "zh-CN": "详细", "zh-TW": "詳細", ja: "詳細", pt: "Detalhes" },
  alerts: {
    en: "🚨 Loop blockers",
    "zh-CN": "🚨 闭环阻塞项",
    "zh-TW": "🚨 閉環阻塞項",
    ja: "🚨 ループ阻害要因",
    pt: "🚨 Bloqueios do loop",
  },
  itemCount: {
    en: "{count} items",
    "zh-CN": "{count} 项",
    "zh-TW": "{count} 項",
    ja: "{count} 件",
    pt: "{count} itens",
  },
  allGood: {
    en: "All clear",
    "zh-CN": "一切良好 ✨",
    "zh-TW": "一切良好 ✨",
    ja: "すべて良好 ✨",
    pt: "Tudo certo ✨",
  },
  moreItems: {
    en: "{count} more items not shown",
    "zh-CN": "还有 {count} 项未列出",
    "zh-TW": "還有 {count} 項未列出",
    ja: "さらに {count} 件未表示",
    pt: "Mais {count} itens não listados",
  },
  thisWeek: {
    en: "This week's content",
    "zh-CN": "本周内容",
    "zh-TW": "本週內容",
    ja: "今週のコンテンツ",
    pt: "Conteúdo desta semana",
  },
  contentCount: {
    en: "{count} items",
    "zh-CN": "{count} 条",
    "zh-TW": "{count} 條",
    ja: "{count} 件",
    pt: "{count} itens",
  },
  emptyWeek: {
    en: "No schedule this week",
    "zh-CN": "本周日程为空",
    "zh-TW": "本週日程為空",
    ja: "今週の予定はありません",
    pt: "Sem agenda nesta semana",
  },
  noCampaigns: {
    en: "No running campaigns",
    "zh-CN": "暂无在投 campaign",
    "zh-TW": "暫無在投 campaign",
    ja: "配信中キャンペーンなし",
    pt: "Nenhuma campanha ativa",
  },
  active: { en: "active", "zh-CN": "active", "zh-TW": "active", ja: "active", pt: "ativas" },
  green: { en: "green", "zh-CN": "green", "zh-TW": "green", ja: "green", pt: "verde" },
  yellow: { en: "yellow", "zh-CN": "yellow", "zh-TW": "yellow", ja: "yellow", pt: "amarelo" },
  red: { en: "red", "zh-CN": "red", "zh-TW": "red", ja: "red", pt: "vermelho" },
};

export function GtmWarRoomPage() {
  const locale = useGtmLocale();
  const data = useGtmData();
  const [, navigate] = useLocation();

  const icpHealth = useMemo(
    () =>
      data.icps.map((icp) => ({
        icp,
        pillars: computeIcpPillars(icp, data),
      })),
    [data],
  );

  // Alerts — red/yellow pillars across all ICPs
  const alerts = useMemo(() => {
    const all: Array<{
      icpName: string;
      icpEmoji: string;
      icpId: string;
      pillarKey: "foundation" | "content" | "paid" | "retention";
      pillarLabel: string;
      pillarEmoji: string;
      pct: number;
      health: "red" | "yellow";
    }> = [];
    for (const { icp, pillars } of icpHealth) {
      for (const key of ["foundation", "content", "paid", "retention"] as const) {
        const p = pillars[key];
        if (p.health === "red" || p.health === "yellow") {
          all.push({
            icpName: pickLocale(icp.name, locale) ?? "",
            icpEmoji: icp.emoji,
            icpId: icp.id,
            pillarKey: key,
            pillarLabel: PILLAR_LABELS[key].name,
            pillarEmoji: PILLAR_LABELS[key].emoji,
            pct: p.pct,
            health: p.health,
          });
        }
      }
    }
    // Sort by severity (red first) then by pct ascending
    return all.sort((a, b) => {
      if (a.health !== b.health) return a.health === "red" ? -1 : 1;
      return a.pct - b.pct;
    });
  }, [icpHealth, locale]);

  // This week's content
  const thisWeekContent = useMemo(() => {
    const today = new Date();
    const weekAhead = new Date();
    weekAhead.setDate(weekAhead.getDate() + 7);
    return data.contentCalendar
      .filter((c) => {
        if (!c.date) return false;
        const d = new Date(c.date);
        return d >= today && d <= weekAhead;
      })
      .sort((a, b) => (a.date < b.date ? -1 : 1));
  }, [data]);

  // Running ad campaigns
  const runningCampaigns = useMemo(
    () => data.adCampaigns.filter((c) => c.status === "running"),
    [data],
  );

  // Running experiments
  const runningExperiments = useMemo(
    () => data.experiments.filter((e) => e.status === "running"),
    [data],
  );

  // Ops streams health
  const streamHealth = useMemo(() => {
    const active = data.operationalStreams.filter((s) => s.status === "active");
    return {
      total: active.length,
      green: active.filter((s) => s.health === "green").length,
      yellow: active.filter((s) => s.health === "yellow").length,
      red: active.filter((s) => s.health === "red").length,
    };
  }, [data]);

  // Goals summary
  const goalSummary = useMemo(() => {
    const total = data.goals.length;
    const onTrack = data.goals.filter((g) => g.current / g.target >= 0.7).length;
    return { total, onTrack };
  }, [data]);

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {tGtm(warRoomText.title, locale)}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{tGtm(warRoomText.subtitle, locale)}</p>
        </div>
        <div className="text-xs text-muted-foreground">
          {tGtm(warRoomText.updateNote, locale)}{" "}
          <code className="px-1 py-0.5 bg-muted rounded">domains/gtm/data.ts</code>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          icon={<Users className="w-4 h-4" />}
          label={tGtm(warRoomText.icps, locale)}
          value={data.icps.length.toString()}
          onClick={() => navigate("/icps")}
        />
        <KpiCard
          icon={<Flag className="w-4 h-4" />}
          label={tGtm(warRoomText.goalsOnTrack, locale)}
          value={`${goalSummary.onTrack} / ${goalSummary.total}`}
          onClick={() => navigate("/goals")}
        />
        <KpiCard
          icon={<Megaphone className="w-4 h-4" />}
          label={tGtm(warRoomText.campaignsRunning, locale)}
          value={runningCampaigns.length.toString()}
          onClick={() => navigate("/campaigns")}
        />
        <KpiCard
          icon={<FlaskConical className="w-4 h-4" />}
          label={tGtm(warRoomText.experiments, locale)}
          value={runningExperiments.length.toString()}
          onClick={() => navigate("/experiments")}
        />
      </div>

      {/* 4-Pillar Health per ICP */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              {tGtm(warRoomText.healthTitle, locale)}
              <span className="text-xs text-muted-foreground font-normal">
                {tGtm(warRoomText.healthSubtitle, locale)}
              </span>
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate("/icps")}>
              {tGtm(warRoomText.detail, locale)} <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {icpHealth.map(({ icp, pillars }) => (
              <button
                key={icp.id}
                type="button"
                onClick={() => navigate(`/icps/${icp.id}`)}
                className="w-full grid grid-cols-12 gap-2 items-center text-sm py-2 px-2 rounded hover:bg-muted/50 text-left"
              >
                <div className="col-span-4 flex items-center gap-2 min-w-0">
                  <span className="text-lg">{icp.emoji}</span>
                  <div className="min-w-0">
                    <div className="font-medium truncate">{pickLocale(icp.name, locale)}</div>
                    <div className="text-[10px] text-muted-foreground">{icp.share}% share</div>
                  </div>
                </div>
                <PillarPill emoji={PILLAR_LABELS.foundation.emoji} status={pillars.foundation} />
                <PillarPill emoji={PILLAR_LABELS.content.emoji} status={pillars.content} />
                <PillarPill emoji={PILLAR_LABELS.paid.emoji} status={pillars.paid} />
                <PillarPill emoji={PILLAR_LABELS.retention.emoji} status={pillars.retention} />
                <div className="col-span-2 flex items-center justify-end gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${healthDot[pillars.overallHealth]}`}
                  />
                  <span className="text-sm font-bold font-mono">{pillars.overallPct}%</span>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Alerts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              {tGtm(warRoomText.alerts, locale)}
              <Badge variant="outline" className="ml-auto text-[10px]">
                {tGtm(warRoomText.itemCount, locale).replace("{count}", alerts.length.toString())}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                {tGtm(warRoomText.allGood, locale)}
              </p>
            ) : (
              <div className="space-y-1.5 max-h-80 overflow-auto">
                {alerts.slice(0, 10).map((a) => (
                  <button
                    key={`${a.icpId}-${a.pillarKey}`}
                    type="button"
                    onClick={() => navigate(`/icps/${a.icpId}`)}
                    className="w-full flex items-center gap-2 text-sm py-1.5 px-2 rounded hover:bg-muted/50 text-left"
                  >
                    <Badge className={`${healthBg[a.health]} text-[10px] shrink-0`}>{a.pct}%</Badge>
                    <span className="text-xs">{a.icpEmoji}</span>
                    <span className="text-xs text-muted-foreground truncate">{a.icpName}</span>
                    <span className="text-xs ml-auto whitespace-nowrap">
                      {a.pillarEmoji} {a.pillarLabel}
                    </span>
                  </button>
                ))}
                {alerts.length > 10 && (
                  <div className="text-[10px] text-muted-foreground pt-1 text-center">
                    {tGtm(warRoomText.moreItems, locale).replace(
                      "{count}",
                      (alerts.length - 10).toString(),
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* This week's content */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4" /> {tGtm(warRoomText.thisWeek, locale)}
              <Badge variant="outline" className="ml-auto text-[10px]">
                {tGtm(warRoomText.contentCount, locale).replace(
                  "{count}",
                  thisWeekContent.length.toString(),
                )}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {thisWeekContent.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                {tGtm(warRoomText.emptyWeek, locale)}
              </p>
            ) : (
              <div className="space-y-1.5 max-h-80 overflow-auto">
                {thisWeekContent.map((c) => {
                  const icp = c.icpId ? data.icps.find((i) => i.id === c.icpId) : null;
                  return (
                    <div
                      key={`${c.date}-${c.title}`}
                      className="flex items-center gap-2 text-sm py-1.5 px-2 rounded hover:bg-muted/50"
                    >
                      <span className="text-[10px] font-mono text-muted-foreground shrink-0 w-16">
                        {c.date}
                      </span>
                      <Badge variant="outline" className="text-[9px] shrink-0">
                        {c.platform}
                      </Badge>
                      <span className="text-xs truncate flex-1" title={c.title}>
                        {c.title}
                      </span>
                      {icp && (
                        <span className="text-xs shrink-0" title={pickLocale(icp.name, locale)}>
                          {icp.emoji}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Running campaigns */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Megaphone className="w-4 h-4" /> {tGtm(warRoomText.campaignsRunning, locale)}
              <Badge variant="outline" className="ml-auto text-[10px]">
                {tGtm(warRoomText.itemCount, locale).replace(
                  "{count}",
                  runningCampaigns.length.toString(),
                )}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {runningCampaigns.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                {tGtm(warRoomText.noCampaigns, locale)}
              </p>
            ) : (
              <div className="space-y-1.5 max-h-80 overflow-auto">
                {runningCampaigns.map((c) => {
                  const icp = data.icps.find((i) => i.id === c.targetIcpId);
                  return (
                    <div
                      key={c.id}
                      className="flex items-center gap-2 text-sm py-1.5 px-2 rounded hover:bg-muted/50"
                    >
                      <Badge variant="outline" className="text-[9px] shrink-0">
                        {c.platform}
                      </Badge>
                      <span className="text-xs truncate flex-1">{c.name}</span>
                      {icp && (
                        <span className="text-xs shrink-0" title={pickLocale(icp.name, locale)}>
                          {icp.emoji}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ops streams health */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-4 h-4" /> Ops Streams
              <Badge variant="outline" className="ml-auto text-[10px]">
                {streamHealth.total} {tGtm(warRoomText.active, locale)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 items-center">
              <span className="flex items-center gap-1.5 text-sm">
                <span className={`w-2.5 h-2.5 rounded-full ${healthDot.green}`} />
                <span className="font-mono font-bold">{streamHealth.green}</span>
                <span className="text-muted-foreground text-xs">
                  {tGtm(warRoomText.green, locale)}
                </span>
              </span>
              <span className="flex items-center gap-1.5 text-sm">
                <span className={`w-2.5 h-2.5 rounded-full ${healthDot.yellow}`} />
                <span className="font-mono font-bold">{streamHealth.yellow}</span>
                <span className="text-muted-foreground text-xs">
                  {tGtm(warRoomText.yellow, locale)}
                </span>
              </span>
              <span className="flex items-center gap-1.5 text-sm">
                <span className={`w-2.5 h-2.5 rounded-full ${healthDot.red}`} />
                <span className="font-mono font-bold">{streamHealth.red}</span>
                <span className="text-muted-foreground text-xs">
                  {tGtm(warRoomText.red, locale)}
                </span>
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto text-xs"
                onClick={() => navigate("/streams")}
              >
                {tGtm(warRoomText.detail, locale)} <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-border bg-card p-3 text-left hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="text-xl font-bold mt-1 font-mono">{value}</div>
    </button>
  );
}

function PillarPill({
  emoji,
  status,
}: {
  emoji: string;
  status: { health: "green" | "yellow" | "red"; pct: number };
}) {
  return (
    <div className="col-span-1 flex items-center gap-1.5 text-xs">
      <span className={`w-2 h-2 rounded-full ${healthDot[status.health]}`} />
      <span className="text-[11px] hidden md:inline">{emoji}</span>
      <span className="font-mono text-[10px] text-muted-foreground">{status.pct}%</span>
    </div>
  );
}
