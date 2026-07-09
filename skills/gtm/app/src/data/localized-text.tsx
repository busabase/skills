"use client";

import { type Localized, pickLocale } from "gtm-data/i18n";
import { useGtmLocale } from "./use-gtm-locale";

/**
 * React component that automatically renders Localized<string> with current locale.
 * Handles both plain strings and locale records.
 */
export function LocalizedText({ value }: { value: Localized<string> }) {
  const locale = useGtmLocale();
  return <>{pickLocale(value, locale)}</>;
}

/**
 * Hook to get localized string value in non-JSX contexts.
 * Use LocalizedText component in JSX instead.
 */
export function useLocalizedString(value: Localized<string>): string {
  const locale = useGtmLocale();
  return pickLocale(value, locale) ?? "";
}
