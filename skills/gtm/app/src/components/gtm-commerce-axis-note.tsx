"use client";

/**
 * GtmCommerceAxisNote — shared "where we sell & appear" explainer + cross-nav.
 *
 * Rendered at the top of the three sibling pages that people keep confusing:
 *   Storefronts (shop)  →  Listings (product page inside a shop)  →  Directories (external, no transaction)
 *
 * It states the relationship in one line and links the two sibling pages, with
 * the current page highlighted. This is the "各页面互相介绍和跳转" affordance.
 */

import { Globe, PackageCheck, Store } from "lucide-react";
import Link from "next/link";
import { tGtm, useGtmLocale } from "../data";

export type CommerceAxisPage = "storefronts" | "listings" | "directories";

const text = {
  intro: {
    en: "Three layers of where we sell and appear: a Storefront is a shop you can transact in; a Listing is a product page inside a storefront (maps to a SKU + price); a Directory is an external listing you can't transact in (Product Hunt, G2…).",
    "zh-CN":
      "「在哪卖 / 在哪露出」分三层：店铺是能交易的店；上架商品是店里的商品页（映射 SKU + 价格）；外链收录是不能交易的外部登记（Product Hunt、G2 等）。",
    "zh-TW":
      "「在哪賣 / 在哪露出」分三層：店鋪是能交易的店；上架商品是店裡的商品頁（映射 SKU + 價格）；外鏈收錄是不能交易的外部登記（Product Hunt、G2 等）。",
    ja: "販売・露出の3階層：ストアは取引できる店、掲載はストア内の商品ページ（SKU + 価格に紐づく）、ディレクトリは取引できない外部掲載（Product Hunt、G2 など）。",
    pt: "Três camadas de onde vendemos e aparecemos: Storefront é uma loja onde se pode transacionar; Listing é a página de produto dentro de uma loja (mapeia para SKU + preço); Directory é uma listagem externa sem transação (Product Hunt, G2…).",
  },
  storefronts: { en: "Storefronts", "zh-CN": "店铺", "zh-TW": "店鋪", ja: "ストア", pt: "Lojas" },
  storefrontsHint: {
    en: "transactable shop",
    "zh-CN": "可交易的店",
    "zh-TW": "可交易的店",
    ja: "取引可能な店",
    pt: "loja transacionável",
  },
  listings: {
    en: "Listings",
    "zh-CN": "上架商品",
    "zh-TW": "上架商品",
    ja: "掲載",
    pt: "Listagens",
  },
  listingsHint: {
    en: "product page in a shop",
    "zh-CN": "店里的商品页",
    "zh-TW": "店裡的商品頁",
    ja: "店内の商品ページ",
    pt: "página dentro da loja",
  },
  directories: {
    en: "Directories",
    "zh-CN": "外链收录",
    "zh-TW": "外鏈收錄",
    ja: "ディレクトリ",
    pt: "Diretórios",
  },
  directoriesHint: {
    en: "external · no transaction",
    "zh-CN": "外链 · 不可交易",
    "zh-TW": "外鏈 · 不可交易",
    ja: "外部 · 取引不可",
    pt: "externo · sem transação",
  },
} as const;

const items = [
  { key: "storefronts", href: "/storefronts", icon: Store },
  { key: "listings", href: "/listings", icon: PackageCheck },
  { key: "directories", href: "/directories", icon: Globe },
] as const;

export function GtmCommerceAxisNote({ current }: { current: CommerceAxisPage }) {
  const locale = useGtmLocale();

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
      <p className="text-xs text-muted-foreground">{tGtm(text.intro, locale)}</p>
      <div className="flex flex-wrap gap-2">
        {items.map(({ key, href, icon: Icon }) => {
          const label = tGtm(text[key], locale);
          const hint = tGtm(text[`${key}Hint`], locale);
          const active = key === current;
          const inner = (
            <>
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="font-medium">{label}</span>
              <span className="text-muted-foreground font-normal">· {hint}</span>
            </>
          );
          if (active) {
            return (
              <span
                key={key}
                className="inline-flex items-center gap-1.5 rounded-md border border-primary bg-primary/10 px-2.5 py-1 text-xs"
              >
                {inner}
              </span>
            );
          }
          return (
            <Link
              key={key}
              href={href}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs hover:bg-muted"
            >
              {inner}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
