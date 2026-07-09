"use client";

/**
 * GTM locale context — lets users preview GTM multi-locale content in any
 * locale without changing their global account language.
 *
 * Resolution order (read from `useGtmLocale()`):
 *   1. Preview override (set via `useSetGtmLocale()`, persisted in localStorage)
 *   2. User's account language (from i18n-react context)
 *
 * ```tsx
 * // Reading (anywhere in GTM UI):
 * const locale = useGtmLocale();
 * pickLocale(icp.tagline, locale);
 *
 * // Setting (sidebar switcher):
 * const setLocale = useSetGtmLocale();
 * setLocale("zh-CN");
 * setLocale(null); // clear override, revert to account language
 * ```
 */

import { GTM_LOCALES, type GTMLocale } from "gtm-data/i18n";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "gtm-preview-locale";

function isGtmLocale(value: string | null | undefined): value is GTMLocale {
  return GTM_LOCALES.includes(value as GTMLocale);
}

function normalizeBrowserLocale(value: string | null | undefined): GTMLocale | null {
  if (!value) return null;
  if (isGtmLocale(value)) return value;
  const normalized = value.toLowerCase();
  if (normalized.startsWith("zh-cn") || normalized.startsWith("zh-hans")) return "zh-CN";
  if (normalized.startsWith("zh-tw") || normalized.startsWith("zh-hant")) return "zh-TW";
  if (normalized.startsWith("ja")) return "ja";
  if (normalized.startsWith("pt")) return "pt";
  if (normalized.startsWith("en")) return "en";
  return null;
}

interface GtmLocaleContextValue {
  /** Currently applied GTM locale (preview override OR account language). */
  locale: GTMLocale;
  /** Preview override if user explicitly picked one, else null. */
  override: GTMLocale | null;
  /** Set preview override. Pass `null` to clear and revert to account language. */
  setOverride: (locale: GTMLocale | null) => void;
}

const GtmLocaleContext = createContext<GtmLocaleContextValue | null>(null);

export function GtmLocaleProvider({
  children,
  locale: accountLocale,
}: {
  children: ReactNode;
  locale: GTMLocale;
}) {
  const [override, setOverrideState] = useState<GTMLocale | null>(null);

  // Load override from localStorage on mount (client-side only)
  useEffect(() => {
    try {
      const queryLocale = normalizeBrowserLocale(
        new URLSearchParams(window.location.search).get("locale"),
      );
      if (queryLocale) {
        setOverrideState(queryLocale);
        window.localStorage.setItem(STORAGE_KEY, queryLocale);
        return;
      }

      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (isGtmLocale(stored)) {
        setOverrideState(stored);
        return;
      }

      const browserLocale = normalizeBrowserLocale(window.navigator.language);
      if (browserLocale) setOverrideState(browserLocale);
    } catch {
      // localStorage unavailable — ignore
    }
  }, []);

  const setOverride = useCallback((next: GTMLocale | null) => {
    setOverrideState(next);
    try {
      if (next) window.localStorage.setItem(STORAGE_KEY, next);
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // localStorage unavailable — ignore
    }
  }, []);

  const value = useMemo<GtmLocaleContextValue>(
    () => ({ locale: override ?? accountLocale, override, setOverride }),
    [override, accountLocale, setOverride],
  );

  return <GtmLocaleContext.Provider value={value}>{children}</GtmLocaleContext.Provider>;
}

/** Get current GTM locale (preview override OR account language). */
export function useGtmLocale(): GTMLocale {
  const ctx = useContext(GtmLocaleContext);
  if (!ctx) {
    throw new Error("useGtmLocale must be used inside <GtmLocaleProvider>");
  }
  return ctx.locale;
}

/** Get full GTM locale context (for building switchers / showing current state). */
export function useGtmLocaleContext(): GtmLocaleContextValue {
  const ctx = useContext(GtmLocaleContext);
  if (!ctx) {
    throw new Error("useGtmLocaleContext must be used inside <GtmLocaleProvider>");
  }
  return ctx;
}
