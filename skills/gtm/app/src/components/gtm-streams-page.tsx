"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "kui/badge";
import Link from "next/link";
import { useMemo } from "react";
import { ColumnHeader, DataTable } from "sharelib/data-table";
import { type OperationalStream, tGtm, useGtmData, useGtmLocale } from "../data";

const streamsText = {
  stream: { en: "Stream", "zh-CN": "运营流", "zh-TW": "營運流", ja: "ストリーム", pt: "Fluxo" },
  category: { en: "Category", "zh-CN": "类别", "zh-TW": "類別", ja: "カテゴリ", pt: "Categoria" },
  cadence: { en: "Cadence", "zh-CN": "频率", "zh-TW": "頻率", ja: "頻度", pt: "Cadência" },
  channel: { en: "Channel", "zh-CN": "渠道", "zh-TW": "渠道", ja: "チャネル", pt: "Canal" },
  progress: { en: "Progress", "zh-CN": "进度", "zh-TW": "進度", ja: "進捗", pt: "Progresso" },
  health: { en: "Health", "zh-CN": "健康度", "zh-TW": "健康度", ja: "健全性", pt: "Saúde" },
  status: { en: "Status", "zh-CN": "状态", "zh-TW": "狀態", ja: "ステータス", pt: "Status" },
  skill: { en: "Skill", "zh-CN": "Skill", "zh-TW": "Skill", ja: "Skill", pt: "Skill" },
  content: { en: "Content", "zh-CN": "内容", "zh-TW": "內容", ja: "コンテンツ", pt: "Conteúdo" },
  paid: { en: "Paid", "zh-CN": "付费", "zh-TW": "付費", ja: "有料", pt: "Pago" },
  community: {
    en: "Community",
    "zh-CN": "社区",
    "zh-TW": "社群",
    ja: "コミュニティ",
    pt: "Comunidade",
  },
  support: { en: "Support", "zh-CN": "支持", "zh-TW": "支援", ja: "サポート", pt: "Suporte" },
  ops: { en: "Ops", "zh-CN": "运营", "zh-TW": "營運", ja: "運用", pt: "Ops" },
  daily: { en: "Daily", "zh-CN": "每日", "zh-TW": "每日", ja: "毎日", pt: "Diário" },
  weekly: { en: "Weekly", "zh-CN": "每周", "zh-TW": "每週", ja: "毎週", pt: "Semanal" },
  monthly: { en: "Monthly", "zh-CN": "每月", "zh-TW": "每月", ja: "毎月", pt: "Mensal" },
  green: { en: "Healthy", "zh-CN": "正常", "zh-TW": "正常", ja: "正常", pt: "Saudável" },
  yellow: { en: "Delayed", "zh-CN": "延迟", "zh-TW": "延遲", ja: "遅延", pt: "Atrasado" },
  red: {
    en: "Not started",
    "zh-CN": "未启动",
    "zh-TW": "未啟動",
    ja: "未開始",
    pt: "Não iniciado",
  },
  unknown: { en: "Unknown", "zh-CN": "未知", "zh-TW": "未知", ja: "不明", pt: "Desconhecido" },
  active: { en: "Running", "zh-CN": "运行中", "zh-TW": "執行中", ja: "実行中", pt: "Rodando" },
  paused: { en: "Paused", "zh-CN": "暂停", "zh-TW": "暫停", ja: "一時停止", pt: "Pausado" },
  notStarted: {
    en: "Not started",
    "zh-CN": "未启动",
    "zh-TW": "未啟動",
    ja: "未開始",
    pt: "Não iniciado",
  },
  title: {
    en: "Operational Streams",
    "zh-CN": "运营流",
    "zh-TW": "營運流",
    ja: "運用ストリーム",
    pt: "Fluxos operacionais",
  },
  summary: {
    en: "{total} streams · {green} healthy / {yellow} delayed / {red} not started",
    "zh-CN": "共 {total} 条运营流 · {green} 正常 / {yellow} 延迟 / {red} 未启动",
    "zh-TW": "共 {total} 條營運流 · {green} 正常 / {yellow} 延遲 / {red} 未啟動",
    ja: "{total} ストリーム · {green} 正常 / {yellow} 遅延 / {red} 未開始",
    pt: "{total} fluxos · {green} saudáveis / {yellow} atrasados / {red} não iniciados",
  },
};

export function GtmStreamsPage() {
  const locale = useGtmLocale();
  const data = useGtmData();
  const columns = useMemo<ColumnDef<OperationalStream>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <ColumnHeader column={column} title={tGtm(streamsText.stream, locale)} />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span>{row.original.emoji}</span>
            <span className="font-medium">{row.original.name}</span>
          </div>
        ),
      },
      {
        accessorKey: "category",
        header: tGtm(streamsText.category, locale),
        cell: ({ row }) => {
          const label = {
            content: tGtm(streamsText.content, locale),
            paid: tGtm(streamsText.paid, locale),
            community: tGtm(streamsText.community, locale),
            support: tGtm(streamsText.support, locale),
            ops: tGtm(streamsText.ops, locale),
          } as const;
          return <Badge variant="secondary">{label[row.original.category]}</Badge>;
        },
      },
      {
        accessorKey: "cadence",
        header: tGtm(streamsText.cadence, locale),
        cell: ({ row }) => {
          const label = {
            daily: tGtm(streamsText.daily, locale),
            weekly: tGtm(streamsText.weekly, locale),
            monthly: tGtm(streamsText.monthly, locale),
          } as const;
          return (
            <Badge variant="outline" className="text-xs">
              {label[row.original.cadence]}
            </Badge>
          );
        },
      },
      {
        accessorKey: "channel",
        header: tGtm(streamsText.channel, locale),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.channel}</span>
        ),
      },
      {
        id: "progress",
        header: tGtm(streamsText.progress, locale),
        cell: ({ row }) => {
          const s = row.original;
          if (s.target == null || s.completed == null)
            return <span className="text-muted-foreground">—</span>;
          const pct = Math.min(100, (s.completed / s.target) * 100);
          const barColor =
            s.health === "green"
              ? "bg-green-500"
              : s.health === "yellow"
                ? "bg-yellow-500"
                : "bg-red-500";
          return (
            <div className="w-32">
              <div className="text-xs font-mono mb-0.5">
                {s.completed}/{s.target}
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className={`h-full ${barColor}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "health",
        header: tGtm(streamsText.health, locale),
        cell: ({ row }) => {
          const h = row.original.health;
          const colorClass =
            h === "green"
              ? "bg-green-500"
              : h === "yellow"
                ? "bg-yellow-500"
                : h === "red"
                  ? "bg-red-500"
                  : "bg-zinc-400";
          const label = {
            green: tGtm(streamsText.green, locale),
            yellow: tGtm(streamsText.yellow, locale),
            red: tGtm(streamsText.red, locale),
            unknown: tGtm(streamsText.unknown, locale),
          } as const;
          return (
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${colorClass}`} />
              <span className="text-sm">{label[h]}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: tGtm(streamsText.status, locale),
        cell: ({ row }) => {
          const s = row.original.status;
          const variant = s === "active" ? "default" : s === "paused" ? "secondary" : "outline";
          const label = {
            active: tGtm(streamsText.active, locale),
            paused: tGtm(streamsText.paused, locale),
            "not-started": tGtm(streamsText.notStarted, locale),
          } as const;
          return <Badge variant={variant}>{label[s]}</Badge>;
        },
      },
      {
        id: "skill",
        header: tGtm(streamsText.skill, locale),
        cell: ({ row }) =>
          row.original.skillPath ? (
            <Link
              href={row.original.skillPath}
              className="text-primary hover:underline text-sm font-mono"
            >
              {row.original.skillPath}
            </Link>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
    ],
    [locale],
  );

  // Summary stats
  const total = data.operationalStreams.length;
  const greenCount = data.operationalStreams.filter((s) => s.health === "green").length;
  const yellowCount = data.operationalStreams.filter((s) => s.health === "yellow").length;
  const redCount = data.operationalStreams.filter((s) => s.health === "red").length;

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{tGtm(streamsText.title, locale)}</h1>
        <p className="text-sm text-muted-foreground">
          {tGtm(streamsText.summary, locale)
            .replace("{total}", total.toString())
            .replace("{green}", greenCount.toString())
            .replace("{yellow}", yellowCount.toString())
            .replace("{red}", redCount.toString())}
        </p>
      </div>
      <DataTable columns={columns} data={data.operationalStreams} />
    </div>
  );
}
