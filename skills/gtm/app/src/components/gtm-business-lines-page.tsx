"use client";

/**
 * GTM Business Lines — Strategy view
 *
 * Lists each business line (Buda, Sandock, …) with products and SKUs as clickable cards.
 * Each SKU navigates to the SKU Detail page (/skus/:id).
 *
 * Data source: `data.businessLines` + `data.products` + `data.skus`.
 */

import { Badge } from "kui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "kui/card";
import { ArrowRight, ExternalLink } from "lucide-react";
import { useLocation } from "wouter";
import { pickLocale, tGtm, useGtmData, useGtmLocale } from "../data";

const statusBadge = {
  active: "bg-green-500 text-white",
  planned: "bg-zinc-400 text-white",
  sunset: "bg-red-500 text-white",
} as const;

const businessLinesText = {
  title: {
    en: "🏭 Business Lines",
    "zh-CN": "🏭 业务线",
    "zh-TW": "🏭 業務線",
    ja: "🏭 事業ライン",
    pt: "🏭 Linhas de negócio",
  },
  summary: {
    en: "{lineCount} business lines · {skuCount} SKUs",
    "zh-CN": "{lineCount} 条业务线 · 共 {skuCount} 个 SKU",
    "zh-TW": "{lineCount} 條業務線 · 共 {skuCount} 個 SKU",
    ja: "{lineCount} 事業ライン · {skuCount} SKU",
    pt: "{lineCount} linhas de negócio · {skuCount} SKUs",
  },
  active: { en: "Active", "zh-CN": "在运营", "zh-TW": "營運中", ja: "運用中", pt: "Ativa" },
  planned: { en: "Planned", "zh-CN": "规划中", "zh-TW": "規劃中", ja: "予定", pt: "Planejada" },
  sunset: { en: "Sunset", "zh-CN": "已下线", "zh-TW": "已下線", ja: "終了", pt: "Encerrada" },
  skuCount: {
    en: "SKUs · {count}",
    "zh-CN": "SKUs · {count} 个",
    "zh-TW": "SKUs · {count} 個",
    ja: "SKU · {count}",
    pt: "SKUs · {count}",
  },
  productCount: {
    en: "Products · {count}",
    "zh-CN": "商品 · {count} 个",
    "zh-TW": "商品 · {count} 個",
    ja: "商品 · {count}",
    pt: "Produtos · {count}",
  },
  noSkus: {
    en: "This business line has no SKUs yet",
    "zh-CN": "这条业务线还没有 SKU",
    "zh-TW": "這條業務線還沒有 SKU",
    ja: "この事業ラインにはまだ SKU がありません",
    pt: "Esta linha ainda não tem SKUs",
  },
  targetIcps: {
    en: "Target ICPs",
    "zh-CN": "目标 ICPs",
    "zh-TW": "目標 ICPs",
    ja: "対象 ICP",
    pt: "ICPs-alvo",
  },
};

const skuTypeEmoji: Record<string, string> = {
  subscription: "🔁",
  course: "🎓",
  service: "🤝",
  "one-time": "💰",
};

export function GtmBusinessLinesPage() {
  const locale = useGtmLocale();
  const data = useGtmData();
  const [, navigate] = useLocation();

  return (
    <div className="p-6 space-y-4 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{tGtm(businessLinesText.title, locale)}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {tGtm(businessLinesText.summary, locale)
            .replace("{lineCount}", data.businessLines.length.toString())
            .replace("{skuCount}", data.skus.length.toString())}
        </p>
      </div>

      {/* Each business line as a card */}
      <div className="space-y-4">
        {data.businessLines.map((bl) => {
          const skus = data.skus.filter((s) => s.businessLineId === bl.id);
          const products = data.products.filter((p) => p.businessLineId === bl.id);

          // ICPs targeting any product in this business line (via ICP.offers[].productId)
          const targetIcps = data.icps.filter((icp) =>
            icp.offers.some((o) => products.some((product) => product.id === o.productId)),
          );

          return (
            <Card key={bl.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{bl.emoji}</span>
                    <div>
                      <CardTitle className="text-lg">{bl.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {pickLocale(bl.tagline, locale)}
                      </p>
                    </div>
                  </div>
                  <Badge className={`shrink-0 ${statusBadge[bl.status]}`}>
                    {tGtm(businessLinesText[bl.status], locale)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Products and SKUs */}
                <div>
                  <div className="text-xs font-medium text-muted-foreground uppercase mb-2">
                    {tGtm(businessLinesText.productCount, locale).replace(
                      "{count}",
                      products.length.toString(),
                    )}
                  </div>
                  {products.length === 0 && skus.length === 0 ? (
                    <div className="text-xs text-muted-foreground italic">
                      {tGtm(businessLinesText.noSkus, locale)}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(products.length > 0
                        ? products
                        : [{ id: "__unassigned", emoji: "📦", name: "Unassigned SKUs" }]
                      ).map((product) => {
                        const productSkus =
                          product.id === "__unassigned"
                            ? skus.filter((sku) => !sku.productId)
                            : skus.filter((sku) => sku.productId === product.id);
                        if (productSkus.length === 0) return null;

                        return (
                          <div key={product.id} className="rounded border border-border p-3">
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-lg">{product.emoji}</span>
                                <span className="font-medium text-sm truncate">{product.name}</span>
                              </div>
                              <Badge variant="secondary" className="text-[9px]">
                                {tGtm(businessLinesText.skuCount, locale).replace(
                                  "{count}",
                                  productSkus.length.toString(),
                                )}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {productSkus.map((sku) => (
                                <button
                                  key={sku.id}
                                  type="button"
                                  onClick={() => navigate(`/skus/${sku.id}`)}
                                  className="flex items-start gap-2 text-left p-3 rounded border border-border hover:bg-muted/40 hover:border-primary/50 transition-colors group"
                                >
                                  <span className="text-xl shrink-0">
                                    {skuTypeEmoji[sku.type] ?? "📦"}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-medium text-sm">{sku.name}</span>
                                      <Badge variant="outline" className="text-[9px]">
                                        {sku.type}
                                      </Badge>
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-0.5 font-mono">
                                      {sku.pricing?.display ?? sku.price}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                      {sku.description}
                                    </div>
                                  </div>
                                  <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Target ICPs (for this business line = any ICP that offers any product in this line) */}
                {targetIcps.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-muted-foreground uppercase mb-2">
                      {tGtm(businessLinesText.targetIcps, locale)}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {targetIcps.map((icp) => (
                        <button
                          key={icp.id}
                          type="button"
                          onClick={() => navigate(`/icps/${icp.id}`)}
                          className="text-xs px-2 py-0.5 rounded border border-border hover:bg-muted/50 hover:border-primary/50 flex items-center gap-1"
                        >
                          <span>{icp.emoji}</span>
                          <span>{pickLocale(icp.name, locale)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Optional: external URL (when SKUs have one) */}
                {skus.some((s) => s.url) && (
                  <div className="flex gap-2 text-xs text-muted-foreground border-t border-border/50 pt-2">
                    {skus
                      .filter((s) => s.url)
                      .map((s) => (
                        <a
                          key={s.id}
                          href={s.url}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-primary flex items-center gap-1"
                        >
                          {s.name} <ExternalLink className="w-3 h-3" />
                        </a>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
