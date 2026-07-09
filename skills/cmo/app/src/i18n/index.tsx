import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { type Lang, type LangMode, resolveLang, translate } from "./messages";

const STORAGE_KEY = "cmo:lang";

interface I18nValue {
  /** Persisted mode: "auto" | "en" | "zh". */
  mode: LangMode;
  /** Effective language after resolving "auto" against the browser. */
  lang: Lang;
  setMode: (mode: LangMode) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

const readStoredMode = (): LangMode => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "zh" || stored === "auto") return stored;
  } catch {
    // ignore storage failures (private mode, etc.)
  }
  return "auto";
};

const browserLangs = (): readonly string[] => {
  if (typeof navigator === "undefined") return [];
  return navigator.languages?.length ? navigator.languages : [navigator.language].filter(Boolean);
};

export function I18nProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<LangMode>(readStoredMode);

  const setMode = useCallback((next: LangMode) => {
    setModeState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore storage failures
    }
  }, []);

  const value = useMemo<I18nValue>(() => {
    const lang = resolveLang(mode, browserLangs());
    return {
      mode,
      lang,
      setMode,
      t: (key, vars) => translate(lang, key, vars),
    };
  }, [mode, setMode]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within an I18nProvider");
  return ctx;
}
