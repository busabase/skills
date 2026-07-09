"use client";

import { Badge } from "kui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "kui/card";
import Link from "next/link";
import { useState } from "react";
import { tGtm, useGtmData, useGtmLocale } from "../data";

const calendarText = {
  title: {
    en: "Content Calendar",
    "zh-CN": "内容日历",
    "zh-TW": "內容日曆",
    ja: "コンテンツカレンダー",
    pt: "Calendário editorial",
  },
  summary: {
    en: "{count} scheduled pieces · 🟡 Draft · 🔵 Scheduled · 🟢 Published",
    "zh-CN": "共 {count} 条内容排期 · 🟡 草稿 · 🔵 已排期 · 🟢 已发布",
    "zh-TW": "共 {count} 條內容排期 · 🟡 草稿 · 🔵 已排期 · 🟢 已發布",
    ja: "{count} 件の予定 · 🟡 下書き · 🔵 予定済み · 🟢 公開済み",
    pt: "{count} peças agendadas · 🟡 Rascunho · 🔵 Agendado · 🟢 Publicado",
  },
  timeline: {
    en: "Timeline",
    "zh-CN": "时间轴",
    "zh-TW": "時間軸",
    ja: "タイムライン",
    pt: "Linha do tempo",
  },
  list: { en: "List", "zh-CN": "列表", "zh-TW": "列表", ja: "リスト", pt: "Lista" },
  kanban: { en: "Kanban", "zh-CN": "看板", "zh-TW": "看板", ja: "カンバン", pt: "Kanban" },
  today: { en: "TODAY", "zh-CN": "今天", "zh-TW": "今天", ja: "今日", pt: "HOJE" },
  draft: { en: "Draft", "zh-CN": "草稿", "zh-TW": "草稿", ja: "下書き", pt: "Rascunho" },
  scheduled: {
    en: "Scheduled",
    "zh-CN": "已排期",
    "zh-TW": "已排期",
    ja: "予定済み",
    pt: "Agendado",
  },
  published: {
    en: "Published",
    "zh-CN": "已发布",
    "zh-TW": "已發布",
    ja: "公開済み",
    pt: "Publicado",
  },
  empty: {
    en: "Empty",
    "zh-CN": "暂无",
    "zh-TW": "暫無",
    ja: "なし",
    pt: "Vazio",
  },
};

type DetailView = "list" | "kanban";

export function GtmCalendarPage() {
  const locale = useGtmLocale();
  const data = useGtmData();
  const [detailView, setDetailView] = useState<DetailView>("list");
  const sorted = [...data.contentCalendar].sort((a, b) => a.date.localeCompare(b.date));
  const statusColor = {
    draft: "bg-yellow-500",
    scheduled: "bg-blue-500",
    published: "bg-green-500",
  };
  const statusLabel = {
    draft: tGtm(calendarText.draft, locale),
    scheduled: tGtm(calendarText.scheduled, locale),
    published: tGtm(calendarText.published, locale),
  };
  const today = new Date().toISOString().slice(0, 10);

  const columns: { key: "draft" | "scheduled" | "published"; label: string }[] = [
    { key: "draft", label: tGtm(calendarText.draft, locale) },
    { key: "scheduled", label: tGtm(calendarText.scheduled, locale) },
    { key: "published", label: tGtm(calendarText.published, locale) },
  ];

  const dates = sorted.map((c) => c.date);
  const minDate = dates[0] || today;
  const maxDate = dates[dates.length - 1] || today;
  const minMs = new Date(minDate).getTime();
  const maxMs = new Date(maxDate).getTime();
  const totalDays = Math.max(1, Math.ceil((maxMs - minMs) / (1000 * 60 * 60 * 24))) + 1;

  const todayMs = new Date(today).getTime();
  const todayOffset = totalDays > 1 ? ((todayMs - minMs) / (maxMs - minMs)) * 100 : 0;
  const todayVisible = todayMs >= minMs && todayMs <= maxMs;

  return (
    <div className="p-6 space-y-4 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">{tGtm(calendarText.title, locale)}</h1>
        <p className="text-sm text-muted-foreground">
          {tGtm(calendarText.summary, locale).replace("{count}", sorted.length.toString())}
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{tGtm(calendarText.timeline, locale)}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative py-6 border-y border-border">
            <div className="absolute left-0 right-0 top-1/2 h-px bg-border" />
            {todayVisible && (
              <div
                className="absolute top-0 bottom-0 w-px bg-primary/60"
                style={{ left: `${todayOffset}%` }}
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 text-[9px] text-primary font-mono whitespace-nowrap">
                  {tGtm(calendarText.today, locale)}
                </div>
              </div>
            )}
            {sorted.map((c) => {
              const itemMs = new Date(c.date).getTime();
              const offset = totalDays > 1 ? ((itemMs - minMs) / (maxMs - minMs)) * 100 : 50;
              return (
                <div
                  key={c.date + c.title}
                  className="absolute top-1/2 -translate-y-1/2 group"
                  style={{ left: `${offset}%` }}
                >
                  <div
                    className={`w-3 h-3 rounded-full ${statusColor[c.status]} ring-2 ring-background transition-transform group-hover:scale-150 cursor-pointer ${c.status === "scheduled" ? "animate-pulse" : ""}`}
                  />
                </div>
              );
            })}
            <div className="absolute bottom-0 left-0 text-[9px] text-muted-foreground font-mono">
              {minDate}
            </div>
            <div className="absolute bottom-0 right-0 text-[9px] text-muted-foreground font-mono">
              {maxDate}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">
            {detailView === "list"
              ? tGtm(calendarText.list, locale)
              : tGtm(calendarText.kanban, locale)}
          </CardTitle>
          <div className="flex gap-1">
            {(["list", "kanban"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setDetailView(v)}
                className={`px-2 py-0.5 rounded text-xs border ${
                  detailView === v
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                {tGtm(calendarText[v], locale)}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {detailView === "list" ? (
            <div className="space-y-1.5">
              {sorted.map((c) => {
                const isPast = c.date < today;
                const isToday = c.date === today;
                const icp = c.icpId ? data.icps.find((i) => i.id === c.icpId) : null;
                return (
                  <div
                    key={c.date + c.title}
                    className={`flex items-center gap-2 text-xs ${isPast && c.status !== "published" ? "opacity-50" : ""}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${statusColor[c.status]} ${c.status === "scheduled" ? "animate-pulse" : ""}`}
                    />
                    <span
                      className={`font-mono w-24 shrink-0 ${isToday ? "text-primary font-bold" : "text-muted-foreground"}`}
                    >
                      {c.date}
                    </span>
                    <span className="text-muted-foreground w-20 shrink-0 truncate">
                      {c.platform}
                    </span>
                    {icp && (
                      <Badge variant="outline" className="text-[9px] shrink-0">
                        {icp.emoji}
                      </Badge>
                    )}
                    {c.url ? (
                      <Link href={c.url} className="flex-1 hover:text-primary truncate">
                        {c.title}
                      </Link>
                    ) : (
                      <span className="flex-1 truncate">{c.title}</span>
                    )}
                    <Badge variant="outline" className="text-[9px] shrink-0">
                      {statusLabel[c.status]}
                    </Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-3">
              {columns.map((col) => {
                const items = sorted.filter((c) => c.status === col.key);
                return (
                  <div key={col.key} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${statusColor[col.key]}`} />
                        <span className="text-xs font-medium uppercase tracking-wide">
                          {col.label}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {items.length}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2 rounded-lg border border-dashed border-border bg-muted/20 p-2 min-h-[120px]">
                      {items.length === 0 ? (
                        <p className="text-[10px] text-muted-foreground italic px-1 py-2">
                          {tGtm(calendarText.empty, locale)}
                        </p>
                      ) : (
                        items.map((c) => {
                          const icp = c.icpId ? data.icps.find((i) => i.id === c.icpId) : null;
                          const isToday = c.date === today;
                          const isPast = c.date < today;
                          const card = (
                            <div
                              key={c.date + c.title}
                              className={`rounded-md border bg-card p-2 text-xs hover:border-primary/40 transition-colors ${
                                isPast && col.key !== "published" ? "opacity-60" : ""
                              }`}
                            >
                              <div className="flex items-center gap-1.5 mb-1">
                                <Badge variant="outline" className="text-[9px] px-1 py-0">
                                  {c.platform}
                                </Badge>
                                {icp && (
                                  <Badge variant="outline" className="text-[9px] px-1 py-0">
                                    {icp.emoji}
                                  </Badge>
                                )}
                                <span
                                  className={`ml-auto font-mono text-[9px] ${
                                    isToday ? "text-primary font-bold" : "text-muted-foreground"
                                  }`}
                                >
                                  {c.date}
                                </span>
                              </div>
                              <div className="font-medium leading-snug line-clamp-2">{c.title}</div>
                            </div>
                          );
                          return c.url ? (
                            <Link key={c.date + c.title} href={c.url} className="block">
                              {card}
                            </Link>
                          ) : (
                            <div key={c.date + c.title}>{card}</div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
