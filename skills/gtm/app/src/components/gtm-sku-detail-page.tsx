"use client";

import { Badge } from "kui/badge";
import { Button } from "kui/button";
import { Card, CardContent, CardHeader, CardTitle } from "kui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useLocation, useParams } from "wouter";
import { pickLocale, type SKUEntitlement, tGtm, useGtmData, useGtmLocale } from "../data";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function entitlementItems(entitlement: SKUEntitlement | undefined): string[] {
  if (!entitlement) return [];
  const items: string[] = [];
  if (entitlement.seats !== undefined) items.push(`Seats: ${entitlement.seats}`);
  if (entitlement.agents !== undefined) items.push(`Agents: ${entitlement.agents}`);
  if (entitlement.workspaces !== undefined) items.push(`Workspaces: ${entitlement.workspaces}`);
  if (entitlement.sessions !== undefined) items.push(`Sessions: ${entitlement.sessions}`);
  if (entitlement.storageGb !== undefined) items.push(`Storage: ${entitlement.storageGb}GB`);
  if (entitlement.apiAccess) items.push("API access");
  if (entitlement.support) items.push(`Support: ${entitlement.support}`);
  if (entitlement.deployment) items.push(`Deployment: ${entitlement.deployment}`);
  if (entitlement.credits !== undefined) items.push(`Credits: ${entitlement.credits}`);
  if (entitlement.courseAccess) items.push("Course access");
  if (entitlement.cohortAccess) items.push("Cohort access");
  if (entitlement.replayAccess) items.push("Replay access");
  if (entitlement.notes) items.push(...entitlement.notes);
  return items;
}

const skuDetailText = {
  notFound: {
    en: "SKU not found.",
    "zh-CN": "未找到 SKU。",
    "zh-TW": "未找到 SKU。",
    ja: "SKU が見つかりません。",
    pt: "SKU não encontrado.",
  },
  backToList: {
    en: "Back to list",
    "zh-CN": "返回列表",
    "zh-TW": "返回列表",
    ja: "一覧に戻る",
    pt: "Voltar à lista",
  },
  back: { en: "Back", "zh-CN": "返回", "zh-TW": "返回", ja: "戻る", pt: "Voltar" },
  basicInfo: {
    en: "📋 Basic information",
    "zh-CN": "📋 基本信息",
    "zh-TW": "📋 基本資訊",
    ja: "📋 基本情報",
    pt: "📋 Informações básicas",
  },
  businessLine: {
    en: "Business line",
    "zh-CN": "业务线",
    "zh-TW": "業務線",
    ja: "事業ライン",
    pt: "Linha de negócio",
  },
  product: {
    en: "Product",
    "zh-CN": "商品",
    "zh-TW": "商品",
    ja: "商品",
    pt: "Produto",
  },
  type: { en: "Type", "zh-CN": "类型", "zh-TW": "類型", ja: "種類", pt: "Tipo" },
  price: { en: "Price", "zh-CN": "价格", "zh-TW": "價格", ja: "価格", pt: "Preço" },
  link: { en: "Link", "zh-CN": "链接", "zh-TW": "連結", ja: "リンク", pt: "Link" },
  entitlement: {
    en: "🎁 Entitlement",
    "zh-CN": "🎁 开通权益",
    "zh-TW": "🎁 開通權益",
    ja: "🎁 権利",
    pt: "🎁 Direito",
  },
  fulfillment: {
    en: "🚚 Fulfillment",
    "zh-CN": "🚚 交付方式",
    "zh-TW": "🚚 交付方式",
    ja: "🚚 履行",
    pt: "🚚 Entrega",
  },
  channelListings: {
    en: "🛒 Where this SKU is sold",
    "zh-CN": "🛒 这个 SKU 出现在哪些上架里",
    "zh-TW": "🛒 這個 SKU 出現在哪些上架裡",
    ja: "🛒 チャネル掲載",
    pt: "🛒 Listagens",
  },
  goals: { en: "🎯 Goals", "zh-CN": "🎯 目标", "zh-TW": "🎯 目標", ja: "🎯 目標", pt: "🎯 Metas" },
};

export function GtmSkuDetailPage() {
  const locale = useGtmLocale();
  const data = useGtmData();
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const sku = data.skus.find((s) => s.id === params.id);

  if (!sku) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">{tGtm(skuDetailText.notFound, locale)}</p>
        <Button variant="ghost" onClick={() => navigate("/skus")}>
          {tGtm(skuDetailText.backToList, locale)}
        </Button>
      </div>
    );
  }

  const businessLine = data.businessLines.find((b) => b.id === sku.businessLineId);
  const product = sku.productId ? data.products.find((p) => p.id === sku.productId) : null;
  const skuListings = data.channelListings
    .map((listing) => {
      const variants = listing.variants.filter((variant) => variant.skuId === sku.id);
      return variants.length > 0 ? { listing, variants } : null;
    })
    .filter(
      (
        x,
      ): x is {
        listing: (typeof data.channelListings)[number];
        variants: (typeof data.channelListings)[number]["variants"];
      } => x !== null,
    );
  const skuGoals = data.goals.filter((g) => g.skuId === sku.id);

  return (
    <div className="p-6 space-y-4 max-w-5xl">
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate("/skus")} className="-ml-2 mb-2">
          <ArrowLeft className="w-4 h-4 mr-1" /> {tGtm(skuDetailText.back, locale)}
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-3xl">{sku.emoji}</span>
          {sku.name}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{sku.description}</p>
      </div>

      <Section title={tGtm(skuDetailText.basicInfo, locale)}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">
              {tGtm(skuDetailText.businessLine, locale)}
            </div>
            <div className="font-medium">
              {businessLine ? `${businessLine.emoji} ${businessLine.name}` : sku.businessLineId}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">
              {tGtm(skuDetailText.product, locale)}
            </div>
            <div className="font-medium">{product ? `${product.emoji} ${product.name}` : "—"}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">{tGtm(skuDetailText.type, locale)}</div>
            <div className="font-medium">{sku.type}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">{tGtm(skuDetailText.price, locale)}</div>
            <div className="font-mono font-medium">{sku.pricing?.display ?? sku.price}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">{tGtm(skuDetailText.link, locale)}</div>
            {sku.url ? (
              <Link href={sku.url} className="text-primary hover:underline truncate block">
                {sku.url.replace("https://", "")}
              </Link>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
        </div>
      </Section>

      {sku.entitlement && (
        <Section title={tGtm(skuDetailText.entitlement, locale)}>
          <div className="flex flex-wrap gap-2">
            {entitlementItems(sku.entitlement).map((item) => (
              <Badge key={item} variant="outline">
                {item}
              </Badge>
            ))}
          </div>
        </Section>
      )}

      {sku.fulfillment && (
        <Section title={tGtm(skuDetailText.fulfillment, locale)}>
          <div className="grid gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Type: </span>
              <span className="font-medium">{sku.fulfillment.type}</span>
            </div>
            {sku.fulfillment.deliveryTime && (
              <div>
                <span className="text-muted-foreground">Delivery: </span>
                <span className="font-medium">{sku.fulfillment.deliveryTime}</span>
              </div>
            )}
            {sku.fulfillment.instructions && (
              <div className="text-muted-foreground">
                {pickLocale(sku.fulfillment.instructions, locale)}
              </div>
            )}
          </div>
        </Section>
      )}

      {skuListings.length > 0 && (
        <Section title={tGtm(skuDetailText.channelListings, locale)}>
          <div className="space-y-2">
            {skuListings.map(({ listing, variants }) => (
              <div key={listing.id} className="rounded-lg border border-border p-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary">{listing.channel}</Badge>
                  {listing.storefrontId && (
                    <Badge variant="outline">
                      {data.storefronts.find((storefront) => storefront.id === listing.storefrontId)
                        ?.name ?? listing.storefrontId}
                    </Badge>
                  )}
                  <span className="font-medium">{pickLocale(listing.title, locale)}</span>
                  <Badge variant="outline" className="text-[9px]">
                    {listing.status}
                  </Badge>
                  {listing.url && (
                    <Link href={listing.url} className="text-primary hover:underline text-sm">
                      {listing.url.replace("https://", "")}
                    </Link>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {variants.map((variant) => (
                    <Badge key={variant.id} variant="outline">
                      {variant.platformSkuName}
                      {variant.priceOverride?.display ? ` · ${variant.priceOverride.display}` : ""}
                    </Badge>
                  ))}
                </div>
                {listing.offerId && (
                  <div className="text-xs text-muted-foreground mt-2">
                    Offer:{" "}
                    {data.offers.find((offer) => offer.id === listing.offerId)?.name ??
                      listing.offerId}
                  </div>
                )}
                {listing.notes && (
                  <div className="text-xs text-muted-foreground mt-2">{listing.notes}</div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Goals for this SKU */}
      {skuGoals.length > 0 && (
        <Section title={tGtm(skuDetailText.goals, locale)}>
          <div className="space-y-3">
            {skuGoals.map((g) => {
              const pct = Math.min(100, (g.current / g.target) * 100);
              return (
                <div key={g.metric}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{g.metric}</span>
                    <span className="font-mono">
                      {g.unit === "$" || g.unit === "¥"
                        ? `${g.unit}${g.current.toLocaleString()}`
                        : g.current}
                      <span className="text-muted-foreground"> / </span>
                      {g.unit === "$" || g.unit === "¥"
                        ? `${g.unit}${g.target.toLocaleString()}`
                        : g.target}
                      {g.unit !== "$" && g.unit !== "¥" && (
                        <span className="text-muted-foreground ml-1">{g.unit}</span>
                      )}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${pct >= 80 ? "bg-green-500" : pct >= 40 ? "bg-yellow-500" : "bg-red-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}
    </div>
  );
}
