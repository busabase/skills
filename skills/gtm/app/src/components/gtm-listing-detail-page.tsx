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
    en: "Listing not found.",
    "zh-CN": "未找到上架商品。",
    "zh-TW": "未找到上架商品。",
    ja: "掲載が見つかりません。",
    pt: "Listagem não encontrada.",
  },
  back: {
    en: "Back to listings",
    "zh-CN": "返回上架清单",
    "zh-TW": "返回上架清單",
    ja: "一覧へ戻る",
    pt: "Voltar",
  },
  whatIsListing: {
    en: "A listing is the product page published inside a storefront. Its platform variants map back to internal SKUs for entitlement and fulfillment.",
    "zh-CN":
      "上架商品是发布在某个店铺里的商品页；它的平台规格会映射回内部 SKU，用来决定权益和交付。",
    "zh-TW":
      "上架商品是發布在某個店鋪裡的商品頁；它的平台規格會映射回內部 SKU，用來決定權益和交付。",
    ja: "掲載はストア内に公開された商品ページで、バリアントは内部 SKU に紐づきます。",
    pt: "Uma listagem é a página do produto dentro de uma loja; suas variantes mapeiam para SKUs internos.",
  },
  storefront: {
    en: "Storefront",
    "zh-CN": "所属店铺",
    "zh-TW": "所屬店鋪",
    ja: "ストア",
    pt: "Loja",
  },
  openStorefront: {
    en: "Open storefront",
    "zh-CN": "打开店铺详情",
    "zh-TW": "打開店鋪詳情",
    ja: "ストアを開く",
    pt: "Abrir loja",
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
  fulfillment: { en: "Fulfillment", "zh-CN": "交付", "zh-TW": "交付", ja: "履行", pt: "Entrega" },
  targetIcps: {
    en: "Target ICPs",
    "zh-CN": "目标 ICP",
    "zh-TW": "目標 ICP",
    ja: "対象 ICP",
    pt: "ICPs-alvo",
  },
  product: { en: "Product", "zh-CN": "产品", "zh-TW": "產品", ja: "製品", pt: "Produto" },
  offer: { en: "Offer", "zh-CN": "Offer", "zh-TW": "Offer", ja: "オファー", pt: "Oferta" },
  notes: {
    en: "Operations notes",
    "zh-CN": "运营备注",
    "zh-TW": "營運備註",
    ja: "運用メモ",
    pt: "Notas operacionais",
  },
  openExternal: {
    en: "Open external page",
    "zh-CN": "打开外部页面",
    "zh-TW": "打開外部頁面",
    ja: "外部ページを開く",
    pt: "Abrir página externa",
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

export function GtmListingDetailPage() {
  const locale = useGtmLocale();
  const data = useGtmData();
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const listing = data.channelListings.find((item) => item.id === params.id);

  if (!listing) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">{tGtm(text.notFound, locale)}</p>
        <Button variant="ghost" onClick={() => navigate("/listings")}>
          {tGtm(text.back, locale)}
        </Button>
      </div>
    );
  }

  const storefront = listing.storefrontId
    ? data.storefronts.find((item) => item.id === listing.storefrontId)
    : null;
  const product = listing.productId
    ? data.products.find((item) => item.id === listing.productId)
    : null;
  const offer = listing.offerId ? data.offers.find((item) => item.id === listing.offerId) : null;
  const trafficTier = listing.trafficTier ?? storefront?.trafficTier;
  const targetIcps = (listing.targetIcpIds ?? [])
    .map((id) => data.icps.find((icp) => icp.id === id))
    .filter((icp): icp is (typeof data.icps)[number] => Boolean(icp));

  return (
    <div className="p-6 space-y-4">
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/listings")}
          className="-ml-2 mb-2"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> {tGtm(text.back, locale)}
        </Button>

        <div
          className={`rounded-lg border border-border bg-gradient-to-br ${channelTone(listing.channel)} p-5`}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{listing.channel}</Badge>
                <Badge variant="outline">{listing.status}</Badge>
                {listing.category && <Badge variant="outline">{listing.category}</Badge>}
                {trafficTier && <Badge variant="outline">{trafficTierLabel(trafficTier)}</Badge>}
              </div>
              <h1 className="mt-3 flex items-center gap-2 text-2xl font-bold">
                <PackageCheck className="h-6 w-6 text-primary" />
                {pickLocale(listing.title, locale)}
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                {pickLocale(listing.description, locale)}
              </p>
              <p className="mt-2 max-w-3xl text-xs text-muted-foreground">
                {tGtm(text.whatIsListing, locale)}
              </p>
            </div>

            {listing.url && (
              <Link href={listing.url}>
                <Button variant="outline" size="sm">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  {tGtm(text.openExternal, locale)}
                </Button>
              </Link>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase text-muted-foreground">
              {tGtm(text.storefront, locale)}:
            </span>
            {storefront ? (
              <Link href={`/storefronts/${storefront.id}`}>
                <Badge variant="outline" className="hover:bg-muted">
                  <Store className="mr-1 h-3 w-3" />
                  {storefront.name}
                </Badge>
              </Link>
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
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
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{tGtm(text.variants, locale)}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2">
            {listing.variants.map((variant) => {
              const sku = data.skus.find((item) => item.id === variant.skuId);
              return (
                <div key={variant.id} className="rounded border border-border bg-background p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-medium">{variant.platformSkuName}</div>
                    <div className="font-mono text-sm font-semibold text-primary">
                      {variant.priceOverride?.display ?? sku?.pricing?.display ?? sku?.price}
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {tGtm(text.internalSku, locale)}:{" "}
                    {sku ? (
                      <Link href={`/skus/${sku.id}`} className="text-primary hover:underline">
                        {sku.name}
                      </Link>
                    ) : (
                      variant.skuId
                    )}
                  </div>
                </div>
              );
            })}
            {listing.variants.length === 0 && (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </div>
        </CardContent>
      </Card>

      {listing.fulfillment && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{tGtm(text.fulfillment, locale)}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <div className="text-muted-foreground">
              {listing.fulfillment.type}
              {listing.fulfillment.deliveryTime ? ` · ${listing.fulfillment.deliveryTime}` : ""}
            </div>
            {listing.fulfillment.instructions && (
              <div className="mt-1 text-muted-foreground">
                {pickLocale(listing.fulfillment.instructions, locale)}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {targetIcps.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{tGtm(text.targetIcps, locale)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {targetIcps.map((icp) => (
                <Link key={icp.id} href={`/icps/${icp.id}`}>
                  <Badge variant="secondary" className="hover:bg-muted">
                    {icp.emoji} {pickLocale(icp.name, locale)}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {listing.notes && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{tGtm(text.notes, locale)}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{listing.notes}</CardContent>
        </Card>
      )}
    </div>
  );
}
