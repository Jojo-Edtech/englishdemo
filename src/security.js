export const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";
export const DEFAULT_DEEPSEEK_MODEL = "deepseek-v4-flash";

const ALLOWED_DEEPSEEK_MODELS = new Set([DEFAULT_DEEPSEEK_MODEL, "deepseek-v4-pro"]);

/** @param {unknown} value */
export function normalizeDeepSeekModel(value) {
  const model = String(value ?? "").trim();
  return ALLOWED_DEEPSEEK_MODELS.has(model) ? model : DEFAULT_DEEPSEEK_MODEL;
}

/** @param {unknown} value */
export function normalizeTemporaryApiKey(value) {
  const key = String(value ?? "").trim();
  if (key.length < 10 || key.length > 512 || /[\u0000-\u001f\u007f]/u.test(key)) return "";
  return key;
}

/** @param {unknown} value @param {number} index */
export function safeAggregateMetricLabel(value, index) {
  const field = String(value ?? "").replace(/[\u0000-\u001f\u007f]/gu, " ").trim();
  const recognizedCode = field.match(/Q\d{1,4}|听说/iu)?.[0];
  return recognizedCode || `自定义指标 ${index + 1}`;
}

/** @param {unknown} value */
export function redactSensitiveText(value) {
  let text = String(value ?? "");
  let redactionCount = 0;
  const replacements = [
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu,
    /\b(?:\+?\d[\d\s().-]{7,}\d)\b/gu,
    /\b\d{17}[\dX]\b/giu,
    /\b[A-Z]{1,2}\d{6}\(?[0-9A]\)?\b/giu,
  ];

  for (const pattern of replacements) {
    text = text.replace(pattern, () => {
      redactionCount += 1;
      return "[已移除个人标识]";
    });
  }

  text = text.replace(
    /((?:学生姓名|姓名|学号|学生\s*ID|student\s*(?:name|id))\s*[:：]\s*)[^\n,，;；]{1,80}/giu,
    (_match, label) => {
      redactionCount += 1;
      return `${label}[已移除个人标识]`;
    },
  );

  return { text, redactionCount };
}
