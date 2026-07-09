"use client";

import { Badge } from "kui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "kui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "kui/tabs";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import {
  type AppStoreTarget,
  deriveAppStoreMatrix,
  type GTMLocale,
  PRODUCT_PLATFORM_LABEL,
  pickLocale,
  summarizeAppStoreMatrix,
  tGtm,
  useGtmData,
  useGtmLocale,
} from "../data";
import { GtmCommerceAxisNote } from "./gtm-commerce-axis-note";

const text = {
  title: {
    en: "Listings",
    "zh-CN": "上架商品",
    "zh-TW": "上架商品",
    ja: "掲載",
    pt: "Listagens",
  },
  intro: {
    en: "Every storefront product page is a listing — including app stores. The inventory tab lists the records we have; the coverage tab derives the stores each product should be on and flags what's missing.",
    "zh-CN":
      "每个店铺商品页都是一条 listing —— App Store 也算。「上架清单」列出已有记录；「上架覆盖」自动推导每个产品应上架的商店并标记缺口。",
    "zh-TW":
      "每個店鋪商品頁都是一條 listing —— App Store 也算。「上架清單」列出已有記錄；「上架覆蓋」自動推導每個產品應上架的商店並標記缺口。",
    ja: "各ストアの製品ページが掲載です（アプリストア含む）。",
    pt: "Cada página de produto é uma listagem — incluindo lojas de apps.",
  },
  tabInventory: {
    en: "Listings",
    "zh-CN": "上架清单",
    "zh-TW": "上架清單",
    ja: "掲載一覧",
    pt: "Listagens",
  },
  tabCoverage: {
    en: "App-store coverage",
    "zh-CN": "上架覆盖",
    "zh-TW": "上架覆蓋",
    ja: "ストア網羅",
    pt: "Cobertura",
  },
  inventorySummary: {
    en: "{listings} storefront product pages · {variants} platform SKU variants mapped to internal SKUs",
    "zh-CN": "{listings} 个店铺商品页 · {variants} 个平台规格映射到内部 SKU",
    "zh-TW": "{listings} 個店鋪商品頁 · {variants} 個平台規格映射到內部 SKU",
    ja: "{listings} 掲載 · {variants} バリアント",
    pt: "{listings} listagens · {variants} variantes",
  },
  coverageSummary: {
    en: "{products} products with a store presence · {covered}/{targets} store targets covered · {missing} missing",
    "zh-CN":
      "{products} 个有商店分发的产品 · 已覆盖 {covered}/{targets} 个商店入口 · {missing} 个待上架",
    "zh-TW":
      "{products} 個有商店分發的產品 · 已覆蓋 {covered}/{targets} 個商店入口 · {missing} 個待上架",
    ja: "{products} 製品 · {covered}/{targets} 対応 · {missing} 未対応",
    pt: "{products} produtos · {covered}/{targets} cobertos · {missing} faltando",
  },
  // Inventory table columns
  colListing: { en: "Listing", "zh-CN": "商品页", "zh-TW": "商品頁", ja: "掲載", pt: "Listagem" },
  colChannel: { en: "Channel", "zh-CN": "渠道", "zh-TW": "渠道", ja: "チャネル", pt: "Canal" },
  colStorefront: { en: "Storefront", "zh-CN": "店铺", "zh-TW": "店鋪", ja: "ストア", pt: "Loja" },
  colProduct: { en: "Product", "zh-CN": "产品", "zh-TW": "產品", ja: "製品", pt: "Produto" },
  colVariants: {
    en: "Variants",
    "zh-CN": "平台规格",
    "zh-TW": "平台規格",
    ja: "バリアント",
    pt: "Variantes",
  },
  colStatus: { en: "Status", "zh-CN": "状态", "zh-TW": "狀態", ja: "状態", pt: "Status" },
  // Coverage table columns
  colPlatforms: { en: "Platforms", "zh-CN": "平台", "zh-TW": "平台", ja: "PF", pt: "Plataformas" },
  colStores: {
    en: "Store targets",
    "zh-CN": "商店入口",
    "zh-TW": "商店入口",
    ja: "ストア",
    pt: "Lojas",
  },
  colCoverage: {
    en: "Coverage",
    "zh-CN": "覆盖率",
    "zh-TW": "覆蓋率",
    ja: "網羅",
    pt: "Cobertura",
  },
  noStore: { en: "no store", "zh-CN": "无商店", "zh-TW": "無商店", ja: "なし", pt: "sem loja" },
  emptyListings: {
    en: "No listings yet.",
    "zh-CN": "暂无上架记录。",
    "zh-TW": "暫無上架記錄。",
    ja: "掲載なし。",
    pt: "Nenhuma listagem.",
  },
};

function trafficTierLabel(tier?: string): string {
  if (!tier) return "unclassified";
  return tier.replace(/-/g, " ");
}

function TargetBadge({ target, locale }: { target: AppStoreTarget; locale: GTMLocale }) {
  if (!target.meta) {
    return (
      <Badge variant="outline" className="opacity-60">
        {PRODUCT_PLATFORM_LABEL[target.platform]} · {tGtm(text.noStore, locale)}
      </Badge>
    );
  }
  const covered = target.status === "covered";
  const label = `${target.meta.emoji ? `${target.meta.emoji} ` : ""}${target.meta.label}`;
  const inner = (
    <Badge
      variant={covered ? "default" : "outline"}
      className={covered ? "" : "border-dashed text-muted-foreground"}
    >
      {covered ? "✓ " : "○ "}
      {label}
      {target.coveredBy ? ` · ${target.coveredBy.status}` : ""}
    </Badge>
  );
  if (covered && target.coveredBy?.url) {
    return (
      <Link href={target.coveredBy.url} className="hover:opacity-80">
        {inner}
      </Link>
    );
  }
  return inner;
}

export function GtmListingsPage() {
  const locale = useGtmLocale();
  const data = useGtmData();

  const variantCount = data.channelListings.reduce(
    (sum, listing) => sum + listing.variants.length,
    0,
  );

  const coverageRows = deriveAppStoreMatrix(data.products, data.channelListings, data.directories);
  const coverageSummary = summarizeAppStoreMatrix(coverageRows);

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{tGtm(text.title, locale)}</h1>
        <p className="text-xs text-muted-foreground mt-2 max-w-3xl">{tGtm(text.intro, locale)}</p>
      </div>

      <GtmCommerceAxisNote current="listings" />

      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inventory">
            {tGtm(text.tabInventory, locale)} · {data.channelListings.length}
          </TabsTrigger>
          <TabsTrigger value="coverage">
            {tGtm(text.tabCoverage, locale)} · {coverageSummary.covered}/
            {coverageSummary.storeTargets}
          </TabsTrigger>
        </TabsList>

        {/* ── Inventory: data-table of every channel listing ───────────────── */}
        <TabsContent value="inventory" className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {tGtm(text.inventorySummary, locale)
              .replace("{listings}", data.channelListings.length.toString())
              .replace("{variants}", variantCount.toString())}
          </p>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tGtm(text.colListing, locale)}</TableHead>
                  <TableHead>{tGtm(text.colChannel, locale)}</TableHead>
                  <TableHead>{tGtm(text.colStorefront, locale)}</TableHead>
                  <TableHead>{tGtm(text.colProduct, locale)}</TableHead>
                  <TableHead>{tGtm(text.colVariants, locale)}</TableHead>
                  <TableHead className="text-right">{tGtm(text.colStatus, locale)}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.channelListings.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      {tGtm(text.emptyListings, locale)}
                    </TableCell>
                  </TableRow>
                )}
                {data.channelListings.map((listing) => {
                  const storefront = data.storefronts.find(
                    (item) => item.id === listing.storefrontId,
                  );
                  const trafficTier = listing.trafficTier ?? storefront?.trafficTier;
                  const product = listing.productId
                    ? data.products.find((item) => item.id === listing.productId)
                    : null;
                  const offer = listing.offerId
                    ? data.offers.find((item) => item.id === listing.offerId)
                    : null;
                  return (
                    <TableRow key={listing.id} className="align-top hover:bg-muted/30">
                      <TableCell>
                        <Link
                          href={`/listings/${listing.id}`}
                          className="group inline-flex items-center gap-1 font-medium hover:text-primary"
                        >
                          {pickLocale(listing.title, locale)}
                          <ChevronRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                        </Link>
                        <div className="text-xs text-muted-foreground max-w-sm line-clamp-2">
                          {pickLocale(listing.description, locale)}
                        </div>
                        {listing.url && (
                          <Link href={listing.url} className="text-xs text-primary hover:underline">
                            {listing.url.replace("https://", "")}
                          </Link>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant="secondary" className="w-fit">
                            {listing.channel}
                          </Badge>
                          {trafficTier && (
                            <span className="text-xs text-muted-foreground">
                              {trafficTierLabel(trafficTier)}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {storefront ? (
                          <Link href={`/storefronts/${storefront.id}`}>
                            <Badge variant="outline" className="hover:bg-muted">
                              {storefront.name}
                            </Badge>
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {product ? (
                            <span className="text-sm">
                              {product.emoji} {product.name}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                          {offer && (
                            <Badge className="w-fit" variant="default">
                              {offer.name}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {listing.variants.map((variant) => {
                            const sku = data.skus.find((item) => item.id === variant.skuId);
                            return (
                              <Badge
                                key={variant.id}
                                variant="outline"
                                className="w-fit font-normal"
                              >
                                {variant.platformSkuName}
                                {sku ? ` · ${sku.name}` : ""}
                                {variant.priceOverride?.display
                                  ? ` · ${variant.priceOverride.display}`
                                  : ""}
                              </Badge>
                            );
                          })}
                          {listing.variants.length === 0 && (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">{listing.status}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ── Coverage: derived app-store gap matrix ───────────────────────── */}
        <TabsContent value="coverage" className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {tGtm(text.coverageSummary, locale)
              .replace("{products}", coverageSummary.products.toString())
              .replace("{covered}", coverageSummary.covered.toString())
              .replace("{targets}", coverageSummary.storeTargets.toString())
              .replace("{missing}", coverageSummary.missing.toString())}
          </p>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tGtm(text.colProduct, locale)}</TableHead>
                  <TableHead>{tGtm(text.colPlatforms, locale)}</TableHead>
                  <TableHead>{tGtm(text.colStores, locale)}</TableHead>
                  <TableHead className="text-right">{tGtm(text.colCoverage, locale)}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coverageRows.map((row) => {
                  const businessLine = data.businessLines.find(
                    (line) => line.id === row.product.businessLineId,
                  );
                  const complete =
                    row.coverage.total > 0 && row.coverage.covered === row.coverage.total;
                  return (
                    <TableRow key={row.product.id} className="align-top">
                      <TableCell>
                        <div className="font-medium">
                          {row.product.emoji} {row.product.name}
                        </div>
                        {businessLine && (
                          <Badge variant="secondary" className="mt-1 w-fit">
                            {businessLine.emoji} {businessLine.name}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {row.platforms.map((platform) => (
                            <Badge key={platform} variant="outline" className="font-normal">
                              {PRODUCT_PLATFORM_LABEL[platform]}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5 max-w-md">
                          {row.targets.map((target) => (
                            <TargetBadge
                              key={`${target.platform}-${target.meta?.channel ?? "none"}`}
                              target={target}
                              locale={locale}
                            />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={complete ? "default" : "outline"} className="font-mono">
                          {row.coverage.covered}/{row.coverage.total}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
