import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { translate, type Locale, type Translator } from "./translate";
import { LocaleContext } from "./LocaleContext";

const LOCALE_KEY = "englishdemo.locale";

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => {
    try { return localStorage.getItem(LOCALE_KEY) === "en" ? "en" : "zh-CN"; }
    catch { return "zh-CN"; }
  });
  const t: Translator = useCallback((value, values) => translate(value, locale, values), [locale]);
  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = t("英语备课组学情分析平台");
    try { localStorage.setItem(LOCALE_KEY, locale); } catch { /* Language switching also works without storage. */ }
  }, [locale, t]);
  const value = useMemo(() => ({ locale, setLocale, t }), [locale, t]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
