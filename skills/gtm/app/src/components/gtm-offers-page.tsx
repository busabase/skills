"use client";

import { Badge } from "kui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "kui/card";
import Link from "next/link";
import { pickLocale, tGtm, useGtmData, useGtmLocale } from "../data";

const text = {
  title: { en: "Offers", "zh-CN": "Offer", "zh-TW": "Offer", ja: "オファー", pt: "Ofertas" },
  summary: {
    en: "{offers} offers · {active} active/draft selling packages",
    "zh-CN": "{offers} 个 offer · {active} 个可售/草稿销售包装",
    "zh-TW": "{offers} 個 offer · {active} 個可售/草稿銷售包裝",
    ja: "{offers} オファー · {active} 販売パッケージ",
    pt: "{offers} ofertas · {active} pacotes",
  },
  items: { en: "Items", "zh-CN": "包含", "zh-TW": "包含", ja: "項目", pt: "Itens" },
  channels: { en: "Storefronts", "zh-CN": "店铺", "zh-TW": "店鋪", ja: "ストア", pt: "Lojas" },
  listings: {
    en: "Listings",
    "zh-CN": "上架",
    "zh-TW": "上架",
    ja: "掲載",
    pt: "Listagens",
  },
  pricing: { en: "Pricing", "zh-CN": "定价", "zh-TW": "定價", ja: "価格", pt: "Preço" },
  promotion: {
    en: "Promotion actions",
    "zh-CN": "推广动作",
    "zh-TW": "推廣動作",
    ja: "プロモーション",
    pt: "Promoções",
  },
  experiments: {
    en: "Experiments",
    "zh-CN": "实验",
    "zh-TW": "實驗",
    ja: "実験",
    pt: "Experimentos",
  },
  daily: { en: "Daily ops", "zh-CN": "日常化", "zh-TW": "日常化", ja: "日次運用", pt: "Diário" },
};

function statusSummary(items: Array<{ status: string }>) {
  if (items.length === 0) return "0";
  const counts = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.status] = (acc[item.status] ?? 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts)
    .map(([status, count]) => `${count} ${status}`)
    .join(" / ");
}

export function GtmOffersPage() {
  const locale = useGtmLocale();
  const data = useGtmData();
  const activeCount = data.offers.filter(
    (offer) => offer.status === "active" || offer.status === "draft",
  ).length;

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{tGtm(text.title, locale)}</h1>
        <p className="text-sm text-muted-foreground">
          {tGtm(text.summary, locale)
            .replace("{offers}", data.offers.length.toString())
            .replace("{active}", activeCount.toString())}
        </p>
      </div>

      <div className="space-y-3">
        {data.offers.map((offer) => {
          const businessLine = data.businessLines.find((line) => line.id === offer.businessLineId);
          const listings = data.channelListings.filter((listing) => listing.offerId === offer.id);
          const offerSkuIds = new Set(offer.items.map((item) => item.skuId));
          const productIds = new Set(offer.productIds);
          const storefronts = data.storefronts.filter(
            (storefront) =>
              offer.storefrontIds?.includes(storefront.id) ||
              storefront.productIds?.some((productId) => productIds.has(productId)),
          );
          const contentItems = data.contentCalendar.filter(
            (item) => item.skuId && offerSkuIds.has(item.skuId),
          );
          const campaigns = data.adCampaigns.filter(
            (campaign) => campaign.targetSkuId && offerSkuIds.has(campaign.targetSkuId),
          );
          const targetIcpIds = new Set(offer.targetIcpIds ?? []);
          const experiments = data.experiments.filter((experiment) =>
            experiment.icpId ? targetIcpIds.has(experiment.icpId) : false,
          );
          const dailyStreams = data.operationalStreams.filter(
            (stream) =>
              stream.cadence === "daily" &&
              (stream.category === "content" ||
                stream.category === "paid" ||
                stream.category === "ops"),
          );
          return (
            <Card key={offer.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">{pickLocale(offer.title, locale)}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {pickLocale(offer.description, locale)}
                    </p>
                  </div>
                  <Badge variant="outline">{offer.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {businessLine && (
                    <Badge variant="secondary">
                      {businessLine.emoji} {businessLine.name}
                    </Badge>
                  )}
                  <Badge variant="outline">{offer.type}</Badge>
                  {offer.price?.display && <Badge>{offer.price.display}</Badge>}
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
                  <div className="rounded border border-border p-2">
                    <div className="text-xs text-muted-foreground">{tGtm(text.items, locale)}</div>
                    <div className="font-mono font-semibold">{offer.items.length}</div>
                  </div>
                  <div className="rounded border border-border p-2">
                    <div className="text-xs text-muted-foreground">
                      {tGtm(text.channels, locale)}
                    </div>
                    <div className="font-mono font-semibold">{storefronts.length}</div>
                    <div className="mt-0.5 text-[10px] text-muted-foreground">
                      {statusSummary(storefronts)}
                    </div>
                  </div>
                  <div className="rounded border border-border p-2">
                    <div className="text-xs text-muted-foreground">
                      {tGtm(text.listings, locale)}
                    </div>
                    <div className="font-mono font-semibold">{listings.length}</div>
                    <div className="mt-0.5 text-[10px] text-muted-foreground">
                      {statusSummary(listings)}
                    </div>
                  </div>
                  <div className="rounded border border-border p-2">
                    <div className="text-xs text-muted-foreground">
                      {tGtm(text.promotion, locale)}
                    </div>
                    <div className="font-mono font-semibold">
                      {contentItems.length + campaigns.length + experiments.length}
                    </div>
                    <div className="mt-0.5 text-[10px] text-muted-foreground">
                      {contentItems.length} content / {campaigns.length} campaigns /{" "}
                      {experiments.length} experiments
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-medium text-muted-foreground uppercase mb-2">
                    {tGtm(text.items, locale)}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {offer.items.map((item) => {
                      const sku = data.skus.find((candidate) => candidate.id === item.skuId);
                      return (
                        <Link key={`${offer.id}-${item.skuId}`} href={`/skus/${item.skuId}`}>
                          <Badge variant="outline" className="hover:bg-muted">
                            {pickLocale(item.label ?? sku?.name ?? item.skuId, locale)}
                            {item.quantity && item.quantity > 1 ? ` x${item.quantity}` : ""}
                            {sku?.pricing?.display || sku?.price ? (
                              <span className="ml-1 text-muted-foreground">
                                · {sku.pricing?.display ?? sku.price}
                              </span>
                            ) : null}
                          </Badge>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {(storefronts.length || listings.length) && (
                  <div>
                    <div className="text-xs font-medium text-muted-foreground uppercase mb-2">
                      {tGtm(text.channels, locale)}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {storefronts.map((storefront) => (
                        <Link key={storefront.id} href={`/storefronts/${storefront.id}`}>
                          <Badge variant="secondary" className="hover:bg-muted">
                            {storefront.name} · {storefront.status}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                    {listings.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {listings.map((listing) => (
                          <Link key={listing.id} href={`/listings/${listing.id}`}>
                            <Badge variant="outline" className="hover:bg-muted">
                              {listing.channel} · {listing.status} · {listing.variants.length} vars
                            </Badge>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {(contentItems.length > 0 || campaigns.length > 0 || experiments.length > 0) && (
                  <div className="grid gap-3 text-xs md:grid-cols-3">
                    <div>
                      <div className="mb-2 font-medium uppercase text-muted-foreground">
                        {tGtm(text.promotion, locale)}
                      </div>
                      <div className="space-y-1.5">
                        {contentItems.slice(0, 4).map((item) => (
                          <div key={`${item.date}-${item.title}`} className="rounded border p-2">
                            <div className="font-medium">{item.title}</div>
                            <div className="text-muted-foreground">
                              {item.platform} · {item.status} · {item.date}
                            </div>
                          </div>
                        ))}
                        {campaigns.slice(0, 3).map((campaign) => (
                          <div key={campaign.id} className="rounded border p-2">
                            <div className="font-medium">{campaign.name}</div>
                            <div className="text-muted-foreground">
                              {campaign.platform} · {campaign.status}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="mb-2 font-medium uppercase text-muted-foreground">
                        {tGtm(text.experiments, locale)}
                      </div>
                      <div className="space-y-1.5">
                        {experiments.length > 0 ? (
                          experiments.map((experiment) => (
                            <div key={experiment.id} className="rounded border p-2">
                              <div className="font-medium">{experiment.hypothesis}</div>
                              <div className="text-muted-foreground">
                                {experiment.status} · {experiment.test}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-muted-foreground">No experiment linked</div>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="mb-2 font-medium uppercase text-muted-foreground">
                        {tGtm(text.daily, locale)}
                      </div>
                      <div className="space-y-1.5">
                        {dailyStreams.slice(0, 4).map((stream) => (
                          <div key={stream.id} className="rounded border p-2">
                            <div className="font-medium">
                              {stream.emoji} {stream.name}
                            </div>
                            <div className="text-muted-foreground">
                              {stream.status} · {stream.health} · {stream.channel}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
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
