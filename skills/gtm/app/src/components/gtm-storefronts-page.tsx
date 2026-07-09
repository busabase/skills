"use client";

import { Badge } from "kui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "kui/card";
import Link from "next/link";
import { pickLocale, tGtm, useGtmData, useGtmLocale } from "../data";
import { GtmCommerceAxisNote } from "./gtm-commerce-axis-note";

const text = {
  title: {
    en: "Storefronts",
    "zh-CN": "店铺",
    "zh-TW": "店鋪",
    ja: "ストア",
    pt: "Lojas",
  },
  summary: {
    en: "{storefronts} storefronts · {channels} channels · listings are product pages inside a storefront",
    "zh-CN": "{storefronts} 个店铺 · {channels} 个渠道 · 上架商品是店铺里的商品页",
    "zh-TW": "{storefronts} 個店鋪 · {channels} 個渠道 · 上架商品是店鋪裡的商品頁",
    ja: "{storefronts} ストア · {channels} チャネル · 掲載はストア内の商品ページ",
    pt: "{storefronts} lojas · {channels} canais · listagens são páginas de produto na loja",
  },
  listings: {
    en: "Listings",
    "zh-CN": "上架商品",
    "zh-TW": "上架商品",
    ja: "掲載",
    pt: "Listagens",
  },
  offers: { en: "Offers", "zh-CN": "Offer", "zh-TW": "Offer", ja: "オファー", pt: "Ofertas" },
  trafficTier: {
    en: "Traffic tier",
    "zh-CN": "流量类型",
    "zh-TW": "流量類型",
    ja: "流入タイプ",
    pt: "Tipo de tráfego",
  },
  openStore: {
    en: "Open storefront",
    "zh-CN": "打开店铺详情",
    "zh-TW": "打開店鋪詳情",
    ja: "ストアを開く",
    pt: "Abrir loja",
  },
};

function trafficTierLabel(tier?: string): string {
  if (!tier) return "unclassified";
  return tier.replace(/-/g, " ");
}

export function GtmStorefrontsPage() {
  const locale = useGtmLocale();
  const data = useGtmData();
  const channelCount = new Set(data.storefronts.map((storefront) => storefront.channel)).size;

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{tGtm(text.title, locale)}</h1>
        <p className="text-sm text-muted-foreground">
          {tGtm(text.summary, locale)
            .replace("{storefronts}", data.storefronts.length.toString())
            .replace("{channels}", channelCount.toString())}
        </p>
      </div>

      <GtmCommerceAxisNote current="storefronts" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {data.storefronts.map((storefront) => {
          const listings = data.channelListings.filter(
            (listing) => listing.storefrontId === storefront.id,
          );
          const offers = data.offers.filter((offer) =>
            offer.storefrontIds?.includes(storefront.id),
          );
          return (
            <Card key={storefront.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">
                      <Link href={`/storefronts/${storefront.id}`} className="hover:text-primary">
                        {storefront.name}
                      </Link>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {pickLocale(
                        storefront.audience ?? storefront.notes ?? storefront.channel,
                        locale,
                      )}
                    </p>
                  </div>
                  <Badge variant="outline">{storefront.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{storefront.channel}</Badge>
                  {storefront.trafficTier && (
                    <Badge variant="outline">{trafficTierLabel(storefront.trafficTier)}</Badge>
                  )}
                  {storefront.region && <Badge variant="outline">{storefront.region}</Badge>}
                  {storefront.url && (
                    <Link href={storefront.url} className="text-sm text-primary hover:underline">
                      {storefront.url.replace("https://", "")}
                    </Link>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded border border-border p-2">
                    <div className="text-xs text-muted-foreground">
                      {tGtm(text.listings, locale)}
                    </div>
                    <div className="font-mono font-semibold">{listings.length}</div>
                  </div>
                  <div className="rounded border border-border p-2">
                    <div className="text-xs text-muted-foreground">{tGtm(text.offers, locale)}</div>
                    <div className="font-mono font-semibold">{offers.length}</div>
                  </div>
                </div>

                {storefront.trafficTier && (
                  <div className="text-xs text-muted-foreground">
                    {tGtm(text.trafficTier, locale)}: {trafficTierLabel(storefront.trafficTier)}
                  </div>
                )}

                {listings.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {listings.map((listing) => (
                      <Link key={listing.id} href={`/listings/${listing.id}`}>
                        <Badge variant="outline" className="hover:bg-muted">
                          {pickLocale(listing.title, locale)}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                )}

                <Link
                  href={`/storefronts/${storefront.id}`}
                  className="inline-flex text-sm font-medium text-primary hover:underline"
                >
                  {tGtm(text.openStore, locale)}
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
