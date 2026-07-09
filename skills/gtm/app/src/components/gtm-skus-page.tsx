"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "kui/badge";
import { Button } from "kui/button";
import { useMemo } from "react";
import { ColumnHeader, DataTable } from "sharelib/data-table";
import { useLocation } from "wouter";
import { type SKU, tGtm, useGtmData, useGtmLocale } from "../data";

const skusText = {
  sku: { en: "SKU", "zh-CN": "SKU", "zh-TW": "SKU", ja: "SKU", pt: "SKU" },
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
  listings: {
    en: "Listings",
    "zh-CN": "上架",
    "zh-TW": "上架",
    ja: "掲載",
    pt: "Listagens",
  },
  description: { en: "Description", "zh-CN": "描述", "zh-TW": "描述", ja: "説明", pt: "Descrição" },
  subscription: {
    en: "Subscription",
    "zh-CN": "订阅",
    "zh-TW": "訂閱",
    ja: "サブスク",
    pt: "Assinatura",
  },
  course: { en: "Course", "zh-CN": "课程", "zh-TW": "課程", ja: "コース", pt: "Curso" },
  service: { en: "Service", "zh-CN": "服务", "zh-TW": "服務", ja: "サービス", pt: "Serviço" },
  oneTime: { en: "One-time", "zh-CN": "一次性", "zh-TW": "一次性", ja: "単発", pt: "Único" },
  view: { en: "View →", "zh-CN": "查看 →", "zh-TW": "查看 →", ja: "表示 →", pt: "Ver →" },
  title: { en: "SKUs", "zh-CN": "SKU", "zh-TW": "SKU", ja: "SKU", pt: "SKUs" },
  summary: {
    en: "{skuCount} SKUs · {lineCount} business lines",
    "zh-CN": "共 {skuCount} 个 SKU · {lineCount} 条业务线",
    "zh-TW": "共 {skuCount} 個 SKU · {lineCount} 條業務線",
    ja: "{skuCount} SKU · {lineCount} 事業ライン",
    pt: "{skuCount} SKUs · {lineCount} linhas de negócio",
  },
};

export function GtmSkusPage() {
  const locale = useGtmLocale();
  const data = useGtmData();
  const [, navigate] = useLocation();

  const columns = useMemo<ColumnDef<SKU>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <ColumnHeader column={column} title={tGtm(skusText.sku, locale)} />,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="text-lg">{row.original.emoji}</span>
            <span className="font-medium">{row.original.name}</span>
          </div>
        ),
      },
      {
        accessorKey: "businessLineId",
        header: tGtm(skusText.businessLine, locale),
        cell: ({ row }) => {
          const bl = data.businessLines.find((b) => b.id === row.original.businessLineId);
          return bl ? (
            <Badge variant="outline">
              {bl.emoji} {bl.name}
            </Badge>
          ) : null;
        },
      },
      {
        accessorKey: "productId",
        header: tGtm(skusText.product, locale),
        cell: ({ row }) => {
          const product = row.original.productId
            ? data.products.find((p) => p.id === row.original.productId)
            : null;
          return product ? (
            <Badge variant="outline">
              {product.emoji} {product.name}
            </Badge>
          ) : (
            <span className="text-muted-foreground text-xs">—</span>
          );
        },
      },
      {
        accessorKey: "type",
        header: tGtm(skusText.type, locale),
        cell: ({ row }) => {
          const typeLabel = {
            subscription: tGtm(skusText.subscription, locale),
            course: tGtm(skusText.course, locale),
            service: tGtm(skusText.service, locale),
            "one-time": tGtm(skusText.oneTime, locale),
          } as const;
          return <Badge variant="secondary">{typeLabel[row.original.type]}</Badge>;
        },
      },
      {
        accessorKey: "price",
        header: tGtm(skusText.price, locale),
        cell: ({ row }) => (
          <span className="font-mono text-sm">
            {row.original.pricing?.display ?? row.original.price}
          </span>
        ),
      },
      {
        accessorKey: "description",
        header: tGtm(skusText.description, locale),
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground max-w-md truncate">
            {row.original.description}
          </div>
        ),
      },
      {
        id: "listings",
        header: tGtm(skusText.listings, locale),
        cell: ({ row }) => {
          const listings = data.channelListings.filter((listing) =>
            listing.variants.some((variant) => variant.skuId === row.original.id),
          );
          return (
            <div className="flex flex-wrap gap-1">
              {listings.map((listing) => (
                <Badge key={listing.id} variant="secondary" className="text-xs">
                  {data.storefronts.find((storefront) => storefront.id === listing.storefrontId)
                    ?.name ?? listing.channel}
                </Badge>
              ))}
            </div>
          );
        },
      },
      {
        id: "view",
        header: "",
        cell: ({ row }) => (
          <Button variant="ghost" size="sm" onClick={() => navigate(`/skus/${row.original.id}`)}>
            {tGtm(skusText.view, locale)}
          </Button>
        ),
      },
    ],
    [data, navigate, locale],
  );

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{tGtm(skusText.title, locale)}</h1>
        <p className="text-sm text-muted-foreground">
          {tGtm(skusText.summary, locale)
            .replace("{skuCount}", data.skus.length.toString())
            .replace("{lineCount}", data.businessLines.length.toString())}
        </p>
      </div>
      <DataTable
        columns={columns}
        data={data.skus}
        onRowClick={(row: SKU) => navigate(`/skus/${row.id}`)}
      />
    </div>
  );
}
