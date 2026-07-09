"use client";

import { Badge } from "kui/badge";
import { Button } from "kui/button";
import { Card, CardContent, CardHeader, CardTitle } from "kui/card";
import { ArrowLeft, ExternalLink, PackageCheck, ShoppingBag, Store } from "lucide-react";
import Link from "next/link";
import { useLocation, useParams } from "wouter";
import { pickLocale, tGtm, useGtmData, useGtmLocale } from "../data";

const text = {
  notFound: {
    en: "Storefront not found.",
    "zh-CN": "未找到店铺。",
    "zh-TW": "未找到店鋪。",
    ja: "ストアが見つかりません。",
    pt: "Loja não encontrada.",
  },
  back: { en: "Back", "zh-CN": "返回", "zh-TW": "返回", ja: "戻る", pt: "Voltar" },
  storeMetrics: {
    en: "Storefront metrics",
    "zh-CN": "店铺经营概况",
    "zh-TW": "店鋪經營概況",
    ja: "ストア指標",
    pt: "Métricas da loja",
  },
  listingPreview: {
    en: "Storefront product preview",
    "zh-CN": "店铺商品预览",
    "zh-TW": "店鋪商品預覽",
    ja: "商品プレビュー",
    pt: "Prévia de produtos",
  },
  listingPreviewHelp: {
    en: "A listing is the product page published in this storefront. Its platform variants map back to internal SKUs for entitlement and fulfillment.",
    "zh-CN": "上架商品是这个店铺里的商品页；平台规格会映射回内部 SKU，用来决定权益和交付。",
    "zh-TW": "上架商品是這個店鋪裡的商品頁；平台規格會映射回內部 SKU，用來決定權益和交付。",
    ja: "掲載はストア内の商品ページで、バリアントは内部 SKU に紐づきます。",
    pt: "Uma listagem é a página do produto na loja; variantes mapeiam para SKUs internos.",
  },
  variants: {
    en: "Platform variants",
    "zh-CN": "平台规格",
    "zh-TW": "平台規格",
    ja: "バリアント",
    pt: "Variantes",
  },
  internalSku: {
    en: "Internal SKU",
    "zh-CN": "内部 SKU",
    "zh-TW": "內部 SKU",
    ja: "内部 SKU",
    pt: "SKU interno",
  },
  fulfillment: {
    en: "Fulfillment",
    "zh-CN": "交付",
    "zh-TW": "交付",
    ja: "履行",
    pt: "Entrega",
  },
  targetIcps: {
    en: "Target ICPs",
    "zh-CN": "目标 ICP",
    "zh-TW": "目標 ICP",
    ja: "対象 ICP",
    pt: "ICPs-alvo",
  },
  offers: { en: "Offers", "zh-CN": "Offer", "zh-TW": "Offer", ja: "オファー", pt: "Ofertas" },
  listings: {
    en: "Listings",
    "zh-CN": "上架商品",
    "zh-TW": "上架商品",
    ja: "掲載",
    pt: "Listagens",
  },
  sellableProducts: {
    en: "Sellable products",
    "zh-CN": "可售商品",
    "zh-TW": "可售商品",
    ja: "販売可能商品",
    pt: "Produtos vendáveis",
  },
  trafficTier: {
    en: "Traffic tier",
    "zh-CN": "流量类型",
    "zh-TW": "流量類型",
    ja: "流入タイプ",
    pt: "Tipo de tráfego",
  },
  liveListings: {
    en: "Ready/live",
    "zh-CN": "可发布/已上线",
    "zh-TW": "可發布/已上線",
    ja: "準備完了/公開中",
    pt: "Prontas/ativas",
  },
  notes: {
    en: "Operations notes",
    "zh-CN": "运营备注",
    "zh-TW": "營運備註",
    ja: "運用メモ",
    pt: "Notas operacionais",
  },
  openExternal: {
    en: "Open external store",
    "zh-CN": "打开外部店铺",
    "zh-TW": "打開外部店鋪",
    ja: "外部ストアを開く",
    pt: "Abrir loja externa",
  },
};

function trafficTierLabel(tier?: string): string {
  if (!tier) return "unclassified";
  return tier.replace(/-/g, " ");
}

function channelTone(channel: string): string {
  if (channel === "website") return "from-primary/15 via-accent/20 to-background";
  if (channel === "manual-sales") return "from-muted via-accent/20 to-background";
  return "from-primary/15 via-muted to-background";
}

export function GtmStorefrontDetailPage() {
  const locale = useGtmLocale();
  const data = useGtmData();
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const storefront = data.storefronts.find((item) => item.id === params.id);

  if (!storefront) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">{tGtm(text.notFound, locale)}</p>
        <Button variant="ghost" onClick={() => navigate("/storefronts")}>
          {tGtm(text.back, locale)}
        </Button>
      </div>
    );
  }

  const listings = data.channelListings.filter((listing) => listing.storefrontId === storefront.id);
  const offers = data.offers.filter((offer) => offer.storefrontIds?.includes(storefront.id));
  const sellableProducts = (
    storefront.productIds ?? [
      ...new Set(listings.map((listing) => listing.productId).filter(Boolean)),
    ]
  )
    .map((id) => data.products.find((product) => product.id === id))
    .filter((product): product is (typeof data.products)[number] => Boolean(product));
  const readyListings = listings.filter(
    (listing) => listing.status === "ready" || listing.status === "live",
  );

  return (
    <div className="p-6 space-y-4">
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/storefronts")}
          className="-ml-2 mb-2"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> {tGtm(text.back, locale)}
        </Button>

        <div
          className={`rounded-lg border border-border bg-gradient-to-br ${channelTone(storefront.channel)} p-5`}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{storefront.channel}</Badge>
                <Badge variant="outline">{storefront.status}</Badge>
                {storefront.trafficTier && (
                  <Badge variant="outline">{trafficTierLabel(storefront.trafficTier)}</Badge>
                )}
                {storefront.region && <Badge variant="outline">{storefront.region}</Badge>}
              </div>
              <h1 className="mt-3 flex items-center gap-2 text-2xl font-bold">
                <Store className="h-6 w-6 text-primary" />
                {storefront.name}
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                {pickLocale(storefront.audience ?? storefront.notes ?? storefront.channel, locale)}
              </p>
            </div>

            {storefront.url && (
              <Link href={storefront.url}>
                <Button variant="outline" size="sm">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  {tGtm(text.openExternal, locale)}
                </Button>
              </Link>
            )}
          </div>

          {sellableProducts.length > 0 && (
            <div className="mt-4">
              <div className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                {tGtm(text.sellableProducts, locale)}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {sellableProducts.map((product) => (
                  <Badge key={product.id} variant="outline">
                    {product.emoji} {product.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{tGtm(text.storeMetrics, locale)}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
            <div className="rounded border border-border p-3">
              <div className="text-xs text-muted-foreground">{tGtm(text.listings, locale)}</div>
              <div className="mt-1 font-mono text-lg font-semibold">{listings.length}</div>
            </div>
            <div className="rounded border border-border p-3">
              <div className="text-xs text-muted-foreground">{tGtm(text.liveListings, locale)}</div>
              <div className="mt-1 font-mono text-lg font-semibold">{readyListings.length}</div>
            </div>
            <div className="rounded border border-border p-3">
              <div className="text-xs text-muted-foreground">{tGtm(text.offers, locale)}</div>
              <div className="mt-1 font-mono text-lg font-semibold">{offers.length}</div>
            </div>
            <div className="rounded border border-border p-3">
              <div className="text-xs text-muted-foreground">{tGtm(text.variants, locale)}</div>
              <div className="mt-1 font-mono text-lg font-semibold">
                {listings.reduce((sum, listing) => sum + listing.variants.length, 0)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">{tGtm(text.listingPreview, locale)}</h2>
          <p className="text-sm text-muted-foreground">{tGtm(text.listingPreviewHelp, locale)}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {listings.map((listing) => {
            const product = listing.productId
              ? data.products.find((item) => item.id === listing.productId)
              : null;
            const offer = listing.offerId
              ? data.offers.find((item) => item.id === listing.offerId)
              : null;
            const trafficTier = listing.trafficTier ?? storefront.trafficTier;
            const targetIcps = (listing.targetIcpIds ?? [])
              .map((id) => data.icps.find((icp) => icp.id === id))
              .filter((icp): icp is (typeof data.icps)[number] => Boolean(icp));

            return (
              <Card key={listing.id} className="overflow-hidden">
                <div className={`h-2 bg-gradient-to-r ${channelTone(listing.channel)}`} />
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <PackageCheck className="h-5 w-5 text-primary" />
                        <span className="truncate">{pickLocale(listing.title, locale)}</span>
                      </CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {pickLocale(listing.description, locale)}
                      </p>
                    </div>
                    <Badge variant="outline">{listing.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{listing.category ?? listing.channel}</Badge>
                    {trafficTier && (
                      <Badge variant="outline">{trafficTierLabel(trafficTier)}</Badge>
                    )}
                    {product && (
                      <Badge variant="outline">
                        {product.emoji} {product.name}
                      </Badge>
                    )}
                    {offer && (
                      <Badge>
                        <ShoppingBag className="mr-1 h-3 w-3" />
                        {offer.name}
                      </Badge>
                    )}
                  </div>

                  <div>
                    <div className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                      {tGtm(text.variants, locale)}
                    </div>
                    <div className="grid gap-2">
                      {listing.variants.map((variant) => {
                        const sku = data.skus.find((item) => item.id === variant.skuId);
                        return (
                          <div
                            key={variant.id}
                            className="rounded border border-border bg-background p-3"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="font-medium">{variant.platformSkuName}</div>
                              <div className="font-mono text-sm font-semibold text-primary">
                                {variant.priceOverride?.display ??
                                  sku?.pricing?.display ??
                                  sku?.price}
                              </div>
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {tGtm(text.internalSku, locale)}: {sku?.name ?? variant.skuId}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {listing.fulfillment && (
                    <div className="rounded border border-border p-3 text-sm">
                      <div className="font-medium">{tGtm(text.fulfillment, locale)}</div>
                      <div className="mt-1 text-muted-foreground">
                        {listing.fulfillment.type}
                        {listing.fulfillment.deliveryTime
                          ? ` · ${listing.fulfillment.deliveryTime}`
                          : ""}
                      </div>
                      {listing.fulfillment.instructions && (
                        <div className="mt-1 text-muted-foreground">
                          {pickLocale(listing.fulfillment.instructions, locale)}
                        </div>
                      )}
                    </div>
                  )}

                  {targetIcps.length > 0 && (
                    <div>
                      <div className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                        {tGtm(text.targetIcps, locale)}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {targetIcps.map((icp) => (
                          <Badge key={icp.id} variant="secondary">
                            {icp.emoji} {pickLocale(icp.name, locale)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {listing.notes && (
                    <div className="text-xs text-muted-foreground">{listing.notes}</div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {(storefront.notes || offers.length > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{tGtm(text.notes, locale)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {storefront.notes && <p className="text-muted-foreground">{storefront.notes}</p>}
            {offers.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {offers.map((offer) => (
                  <Badge key={offer.id} variant="outline">
                    {offer.name}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
