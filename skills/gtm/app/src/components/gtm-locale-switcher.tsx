"use client";

/**
 * GTM Locale Switcher — sits in the GTM sidebar footer.
 *
 * Lets users preview GTM content (taglines, ICP messaging, SKUs…) in any
 * locale without changing their global account language.
 *
 * - "Account" entry clears the override and follows the user's account language
 * - Any other entry sets a preview-only override (persisted to localStorage)
 * - Visual state: shows current GTM locale + "(preview)" badge when overridden
 */

import { Button } from "kui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "kui/dropdown-menu";
import { Check, Globe } from "lucide-react";
import { GTM_LOCALES, gtmUiText, tGtm, useGtmLocaleContext } from "../data";

const LOCALE_DISPLAY_NAMES: Record<(typeof GTM_LOCALES)[number], string> = {
  en: "English",
  "zh-CN": "简体中文",
  "zh-TW": "繁體中文",
  ja: "日本語",
  pt: "Português",
};

export function GtmLocaleSwitcher() {
  const { locale, override, setOverride } = useGtmLocaleContext();
  const text = gtmUiText.localeSwitcher;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 px-2 text-xs font-normal"
          title={tGtm(text.title, locale)}
        >
          <Globe className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{LOCALE_DISPLAY_NAMES[locale]}</span>
          {override && (
            <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-foreground">
              {tGtm(text.preview, locale)}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-56">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {tGtm(text.label, locale)}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => setOverride(null)}
          className="flex items-center justify-between gap-2"
        >
          <span className="flex flex-col">
            <span className="text-sm">{tGtm(text.accountDefault, locale)}</span>
            <span className="text-[10px] text-muted-foreground">
              {tGtm(text.followProfile, locale)}
            </span>
          </span>
          {!override && <Check className="h-3.5 w-3.5" />}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {GTM_LOCALES.map((code) => (
          <DropdownMenuItem
            key={code}
            onClick={() => setOverride(code)}
            className="flex items-center justify-between gap-2"
          >
            <span className="text-sm">{LOCALE_DISPLAY_NAMES[code]}</span>
            {override === code && <Check className="h-3.5 w-3.5" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
