import { uiEnglish } from "./ui";
import { learningEnglish } from "./learning";
import { reportEnglish } from "./reports";
import { promptEnglish } from "./prompts";

export type Locale = "zh-CN" | "en";
export const english = { ...uiEnglish, ...learningEnglish, ...reportEnglish, ...promptEnglish };
const hasChinese = /[\u3400-\u9fff]/;
const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const templates = Object.entries(english)
  .filter(([source]) => /\{\d+\}/.test(source))
  .sort(([a], [b]) => b.replace(/\{\d+\}/g, "").length - a.replace(/\{\d+\}/g, "").length)
  .map(([source, target]) => ({
    expression: new RegExp(`^${source.split(/\{\d+\}/).map(escapeRegExp).join("(.+?)")}$`, "s"),
    target,
  }));

function englishText(source: string, depth = 0): string {
  if (depth > 8) return source;
  const text = source.trim();
  const exact = english[text];
  if (exact !== undefined) return source.replace(text, () => exact);
  if (!hasChinese.test(source)) return source;
  if (text.includes("\n")) return source.split("\n").map((line) => englishText(line, depth + 1)).join("\n");
  if (text.includes("；")) return text.split("；").map((part) => englishText(part, depth + 1)).join("; ");
  const classMatch = text.match(/^高([一二三])\((\d+)\)班$/);
  if (classMatch) return `Grade ${10 + ["一", "二", "三"].indexOf(classMatch[1])} Class ${classMatch[2]}`;
  const week = text.match(/^第?(\d+)周$/);
  if (week) return `W${week[1]}`;
  const count = text.match(/^(\d+(?:\.\d+)?)(人|分|次|项|题)$/);
  if (count) {
    const unit = ({ "人": "student", "分": "point", "次": "occurrence", "项": "area", "题": "question" } as Record<string, string>)[count[2]];
    return `${count[1]} ${unit}${Number(count[1]) === 1 ? "" : "s"}`;
  }
  const causeCount = text.match(/^(.+?)(\d+)次$/);
  if (causeCount) return `${englishText(causeCount[1], depth + 1)}: ${causeCount[2]} occurrences`;
  // Display templates keep IDs, enum values and chart data keys unchanged.
  for (const { expression, target } of templates) {
    const match = text.match(expression);
    if (match) return target.replace(/\{(\d+)\}/g, (_, index) => englishText(match[Number(index) + 1], depth + 1));
  }
  for (const separator of [" · ", " / ", "：", "；", "、"]) {
    if (text.includes(separator)) {
      const parts = text.split(separator).map((part) => englishText(part, depth + 1));
      if (parts.some((part, index) => part !== text.split(separator)[index])) {
        return parts.join(separator === "：" ? ": " : separator === "；" ? "; " : separator === "、" ? ", " : separator);
      }
    }
  }
  return source;
}

const singularCounts = (text: string) => text.replace(
  /\b(1(?:\.0)?) (score columns|score fields|scored students|students|points|questions|areas|occurrences|essays|responses)\b/g,
  (_, number, unit) => `${number} ${unit.slice(0, -1)}`,
);

// Translate presentation values only. Never use this for input values or data keys.
export function translate<T>(value: T, locale: Locale, values?: readonly unknown[]): T {
  if (typeof value === "string" && values) {
    const pattern = locale === "en" ? english[value] ?? value : value;
    const rendered = pattern.replace(/\{(\d+)\}/g, (_, index) => String(translate(values[Number(index)] ?? "", locale)));
    return (locale === "en" ? singularCounts(englishText(rendered)) : rendered) as T;
  }
  if (locale !== "en") return value;
  if (typeof value === "string") {
    const translated = englishText(value);
    return (translated === value ? value : singularCounts(translated)) as T;
  }
  if (Array.isArray(value)) return value.map((item) => translate(item, locale)) as T;
  return value;
}

export type Translator = <T>(value: T, values?: readonly unknown[]) => T;

const chartLabels: Record<string, string> = {
  "信息定位": "Evidence", "推断概括": "Inference", "语篇逻辑": "Structure",
  "词汇语境": "Vocabulary", "综合读写": "Read & write", "听说表达": "Oral skills",
  "高二(3)班": "G11 C3", "高二(7)班": "G11 C7", "高三英语备课组": "Grade 12",
  "词义": "Vocab.", "续写": "Writing",
};

export function chartLabel(value: unknown, locale: Locale): string {
  const text = String(value);
  return locale === "en" ? chartLabels[text] ?? translate(text, locale) : text;
}
