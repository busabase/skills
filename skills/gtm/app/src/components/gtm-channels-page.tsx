"use client";

/**
 * GTM Channels Page — one row per channel (platform).
 *
 * Displays each channel once, showing all ICPs that use it and their
 * specific hooks/frequency. The channel itself (name/emoji) comes from
 * the global `channels` registry; the ICP-specific angle comes from
 * `icp.channels[]` (ChannelStrategy).
 */

import { Badge } from "kui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "kui/card";
import Link from "next/link";
import { useMemo } from "react";
import {
  type ChannelStrategy,
  type GTMChannel,
  pickLocale,
  tGtm,
  useGtmData,
  useGtmLocale,
} from "../data";

interface IcpUsage {
  icpId: string;
  icpName: string;
  icpEmoji: string;
  strategy: ChannelStrategy;
}

interface ChannelGroup {
  channel: GTMChannel;
  icpUsages: IcpUsage[];
}

const channelsText = {
  title: { en: "Channels", "zh-CN": "渠道", "zh-TW": "渠道", ja: "チャネル", pt: "Canais" },
  summary: {
    en: "{channels} unique channels · {strategies} ICP strategies",
    "zh-CN": "{channels} 个独立渠道 · {strategies} 个 ICP 策略",
    "zh-TW": "{channels} 個獨立渠道 · {strategies} 個 ICP 策略",
    ja: "{channels} 個のチャネル · {strategies} 件の ICP 戦略",
    pt: "{channels} canais únicos · {strategies} estratégias de ICP",
  },
  kind: {
    social: {
      en: "Social",
      "zh-CN": "社交平台",
      "zh-TW": "社交平台",
      ja: "ソーシャル",
      pt: "Social",
    },
    community: {
      en: "Community",
      "zh-CN": "社区",
      "zh-TW": "社群",
      ja: "コミュニティ",
      pt: "Comunidade",
    },
    content: {
      en: "Content platforms",
      "zh-CN": "内容平台",
      "zh-TW": "內容平台",
      ja: "コンテンツ平台",
      pt: "Plataformas de conteúdo",
    },
    launch: {
      en: "Launch platforms",
      "zh-CN": "发布平台",
      "zh-TW": "發布平台",
      ja: "ローンチ平台",
      pt: "Plataformas de lançamento",
    },
    direct: {
      en: "Direct outreach",
      "zh-CN": "直接触达",
      "zh-TW": "直接觸達",
      ja: "直接接触",
      pt: "Contato direto",
    },
  },
};

const kindColor: Record<GTMChannel["kind"], string> = {
  social: "bg-blue-500",
  community: "bg-purple-500",
  content: "bg-amber-500",
  launch: "bg-green-500",
  direct: "bg-red-500",
};

export function GtmChannelsPage() {
  const locale = useGtmLocale();
  const data = useGtmData();

  // Group ICP channel strategies by channel
  const groups = useMemo<ChannelGroup[]>(() => {
    const byChannel = new Map<string, ChannelGroup>();
    for (const icp of data.icps) {
      for (const strategy of icp.channels) {
        const channel = data.channels.find((item) => item.id === strategy.channelId);
        if (!channel) continue;
        let group = byChannel.get(channel.id);
        if (!group) {
          group = { channel, icpUsages: [] };
          byChannel.set(channel.id, group);
        }
        group.icpUsages.push({
          icpId: icp.id,
          icpName: pickLocale(icp.name, locale) ?? "",
          icpEmoji: icp.emoji,
          strategy,
        });
      }
    }
    return Array.from(byChannel.values()).sort((a, b) => b.icpUsages.length - a.icpUsages.length);
  }, [data, locale]);

  // Group channels by kind
  const groupedByKind = useMemo(() => {
    const result: Record<GTMChannel["kind"], ChannelGroup[]> = {
      social: [],
      community: [],
      content: [],
      launch: [],
      direct: [],
    };
    for (const g of groups) {
      result[g.channel.kind].push(g);
    }
    return result;
  }, [groups]);

  const totalIcpUsages = groups.reduce((sum, g) => sum + g.icpUsages.length, 0);

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{tGtm(channelsText.title, locale)}</h1>
        <p className="text-sm text-muted-foreground">
          {tGtm(channelsText.summary, locale)
            .replace("{channels}", groups.length.toString())
            .replace("{strategies}", totalIcpUsages.toString())}
        </p>
      </div>

      {(Object.entries(groupedByKind) as Array<[GTMChannel["kind"], ChannelGroup[]]>).map(
        ([kind, kindGroups]) =>
          kindGroups.length === 0 ? null : (
            <Card key={kind}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${kindColor[kind]}`} />
                  <span>{tGtm(channelsText.kind[kind], locale)}</span>
                  <Badge variant="outline" className="ml-auto text-[10px]">
                    {kindGroups.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {kindGroups.map((g) => (
                    <div
                      key={g.channel.id}
                      className="flex items-start gap-3 p-3 rounded border border-border hover:bg-muted/30"
                    >
                      <div className="flex items-center gap-2 min-w-0 w-40 shrink-0">
                        <span className="text-2xl shrink-0">{g.channel.emoji}</span>
                        <div className="min-w-0">
                          <div className="font-medium truncate">
                            {pickLocale(g.channel.name, locale)}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono">
                            {g.channel.id}
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 min-w-0 space-y-1.5">
                        {g.icpUsages.map((u) => (
                          <div
                            key={u.icpId}
                            className="flex items-start gap-2 text-sm py-1.5 px-2 rounded hover:bg-muted/40"
                          >
                            <Badge variant="outline" className="text-[10px] shrink-0 mt-0.5">
                              {u.icpEmoji} {u.icpName}
                            </Badge>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                {u.strategy.link ? (
                                  <Link
                                    href={u.strategy.link}
                                    className="text-xs text-primary hover:underline"
                                  >
                                    {pickLocale(u.strategy.hook, locale)}
                                  </Link>
                                ) : (
                                  <span className="text-xs">
                                    {pickLocale(u.strategy.hook, locale)}
                                  </span>
                                )}
                                {u.strategy.frequency && (
                                  <Badge variant="secondary" className="text-[9px]">
                                    {u.strategy.frequency}
                                  </Badge>
                                )}
                              </div>
                              {u.strategy.detailsPath && (
                                <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                                  📄 {u.strategy.detailsPath}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ),
      )}
    </div>
  );
}
