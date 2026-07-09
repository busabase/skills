"use client";

/**
 * GTM Messaging — Cross-ICP view
 *
 * The command center's "all tagline/valueprop/positioning side-by-side" surface.
 * This view makes it easy to audit message consistency across ICPs.
 *
 * Complements the ICP Detail > Messaging tab (which shows one ICP's messaging).
 * Same underlying data (`icp.valueProp`, `icp.tagline`, `icp.keyMessages`, etc.),
 * different projection.
 */

import { Badge } from "kui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "kui/card";
import { ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { pickLocale, tGtm, useGtmData, useGtmLocale } from "../data";

const messagingText = {
  title: {
    en: "💬 Messaging",
    "zh-CN": "💬 信息架构",
    "zh-TW": "💬 訊息架構",
    ja: "💬 メッセージング",
    pt: "💬 Mensagens",
  },
  description: {
    en: "Cross-ICP positioning, value props, and key messages · audit consistency and differentiation",
    "zh-CN": "所有 ICP 的定位语 / Value Prop / 核心信息横向对比 · 用于审查一致性和差异化",
    "zh-TW": "所有 ICP 的定位語 / Value Prop / 核心資訊橫向對比 · 用於審查一致性和差異化",
    ja: "ICP 横断のポジショニング / Value Prop / 主要メッセージ · 一貫性と差別化を確認",
    pt: "Posicionamento, value props e mensagens por ICP · auditar consistência e diferenciação",
  },
  matrix: {
    en: "Core positioning matrix",
    "zh-CN": "核心定位矩阵",
    "zh-TW": "核心定位矩陣",
    ja: "中核ポジショニング表",
    pt: "Matriz de posicionamento",
  },
  icp: { en: "ICP", "zh-CN": "ICP", "zh-TW": "ICP", ja: "ICP", pt: "ICP" },
  category: {
    en: "Category",
    "zh-CN": "Category",
    "zh-TW": "Category",
    ja: "カテゴリ",
    pt: "Categoria",
  },
  positioning: {
    en: "Positioning",
    "zh-CN": "定位",
    "zh-TW": "定位",
    ja: "ポジショニング",
    pt: "Posicionamento",
  },
  tagline: { en: "Tagline", "zh-CN": "标语", "zh-TW": "標語", ja: "タグライン", pt: "Tagline" },
  valueProposition: {
    en: "Value proposition",
    "zh-CN": "价值主张",
    "zh-TW": "價值主張",
    ja: "価値提案",
    pt: "Proposta de valor",
  },
  share: { en: "share", "zh-CN": "占比", "zh-TW": "占比", ja: "シェア", pt: "participação" },
  undefined: {
    en: "Undefined",
    "zh-CN": "未定义",
    "zh-TW": "未定義",
    ja: "未定義",
    pt: "Não definido",
  },
  deepDive: { en: "Deep dive", "zh-CN": "深入", "zh-TW": "深入", ja: "詳細", pt: "Aprofundar" },
  more: {
    en: "{count} more",
    "zh-CN": "…还有 {count} 条",
    "zh-TW": "…還有 {count} 條",
    ja: "さらに {count} 件",
    pt: "Mais {count}",
  },
  differentiators: {
    en: "Differentiators",
    "zh-CN": "差异化",
    "zh-TW": "差異化",
    ja: "差別化",
    pt: "Diferenciais",
  },
  objections: { en: "Objections", "zh-CN": "异议", "zh-TW": "異議", ja: "反論", pt: "Objeções" },
  proofPoints: {
    en: "Proof points",
    "zh-CN": "证明点",
    "zh-TW": "證明點",
    ja: "証拠",
    pt: "Provas",
  },
  competitors: {
    en: "Competitors",
    "zh-CN": "竞品",
    "zh-TW": "競品",
    ja: "競合",
    pt: "Concorrentes",
  },
};

export function GtmMessagingPage() {
  const locale = useGtmLocale();
  const data = useGtmData();
  const [, navigate] = useLocation();

  return (
    <div className="p-6 space-y-4 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{tGtm(messagingText.title, locale)}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {tGtm(messagingText.description, locale)}
        </p>
      </div>

      {/* Message matrix — tagline + valueProp side by side */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{tGtm(messagingText.matrix, locale)}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2 pr-4 font-medium w-[18%]">
                    {tGtm(messagingText.icp, locale)}
                  </th>
                  <th className="py-2 pr-4 font-medium w-[12%]">
                    {tGtm(messagingText.category, locale)}
                  </th>
                  <th className="py-2 pr-4 font-medium w-[10%]">
                    {tGtm(messagingText.positioning, locale)}
                  </th>
                  <th className="py-2 pr-4 font-medium w-[30%]">
                    {tGtm(messagingText.tagline, locale)}
                  </th>
                  <th className="py-2 pr-4 font-medium w-[30%]">
                    {tGtm(messagingText.valueProposition, locale)}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.icps.map((icp) => (
                  <tr
                    key={icp.id}
                    className="border-b border-border/50 hover:bg-muted/30 cursor-pointer"
                    onClick={() => navigate(`/icps/${icp.id}#messaging`)}
                  >
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{icp.emoji}</span>
                        <div>
                          <div className="font-medium text-xs">{pickLocale(icp.name, locale)}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {icp.share}% {tGtm(messagingText.share, locale)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-xs">
                      {icp.category ? (
                        <Badge variant="outline" className="text-[10px]">
                          {icp.category}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground italic">—</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-xs">
                      {icp.categoryPositioning ? (
                        <Badge variant="outline" className="text-[10px]">
                          {icp.categoryPositioning}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground italic">—</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-xs">
                      {pickLocale(icp.tagline, locale) || (
                        <span className="text-muted-foreground italic">
                          {tGtm(messagingText.undefined, locale)}
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-xs">
                      {pickLocale(icp.valueProp, locale) || (
                        <span className="text-muted-foreground italic">
                          {tGtm(messagingText.undefined, locale)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Per-ICP card with key messages / differentiators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.icps.map((icp) => (
          <Card key={icp.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <span>{icp.emoji}</span>
                <span>{pickLocale(icp.name, locale)}</span>
                <button
                  type="button"
                  onClick={() => navigate(`/icps/${icp.id}#messaging`)}
                  className="ml-auto text-xs font-normal text-muted-foreground hover:text-primary flex items-center gap-1"
                >
                  {tGtm(messagingText.deepDive, locale)} <ArrowRight className="w-3 h-3" />
                </button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              {/* Key messages */}
              <div>
                <div className="font-medium mb-1 text-muted-foreground uppercase text-[10px]">
                  Key Messages ({icp.keyMessages.length})
                </div>
                {icp.keyMessages.length === 0 ? (
                  <div className="text-muted-foreground italic">
                    {tGtm(messagingText.undefined, locale)}
                  </div>
                ) : (
                  <ul className="space-y-1">
                    {icp.keyMessages.slice(0, 3).map((m, i) => {
                      const text = pickLocale(m, locale) ?? "";
                      return (
                        <li key={`${i}-${text}`} className="flex gap-1.5">
                          <span className="text-muted-foreground shrink-0">▸</span>
                          <span>{text}</span>
                        </li>
                      );
                    })}
                    {icp.keyMessages.length > 3 && (
                      <li className="text-muted-foreground text-[10px]">
                        {tGtm(messagingText.more, locale).replace(
                          "{count}",
                          (icp.keyMessages.length - 3).toString(),
                        )}
                      </li>
                    )}
                  </ul>
                )}
              </div>

              {/* Differentiators */}
              {icp.differentiators && icp.differentiators.length > 0 && (
                <div>
                  <div className="font-medium mb-1 text-muted-foreground uppercase text-[10px]">
                    {tGtm(messagingText.differentiators, locale)} ({icp.differentiators.length})
                  </div>
                  <ul className="space-y-1">
                    {icp.differentiators.slice(0, 2).map((d) => (
                      <li key={d.attribute} className="flex gap-1.5">
                        <span className="text-muted-foreground shrink-0">▸</span>
                        <span>
                          <span className="font-medium">{d.attribute}</span>
                          <span className="text-muted-foreground"> — {d.valueTheme}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Objections count */}
              <div className="flex gap-3 text-[10px] text-muted-foreground pt-1 border-t border-border/50">
                <span>
                  {tGtm(messagingText.objections, locale)}:{" "}
                  <span className="font-mono font-bold text-foreground">
                    {icp.objections.length}
                  </span>
                </span>
                {icp.proofPoints && (
                  <span>
                    {tGtm(messagingText.proofPoints, locale)}:{" "}
                    <span className="font-mono font-bold text-foreground">
                      {icp.proofPoints.length}
                    </span>
                  </span>
                )}
                <span>
                  {tGtm(messagingText.competitors, locale)}:{" "}
                  <span className="font-mono font-bold text-foreground">
                    {icp.competitors.length}
                  </span>
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
