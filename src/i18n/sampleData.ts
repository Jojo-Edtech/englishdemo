import Papa from "papaparse";
import { liveDemoCsv, essayStressCsv, essayStressSamples } from "../data/mockData";
import { translate, type Locale } from "./translate";

export function sampleCsvForLocale(locale: Locale): string {
  if (locale === "zh-CN") return liveDemoCsv;
  const rows = Papa.parse<string[]>(liveDemoCsv, { skipEmptyLines: true }).data;
  const headers = ["Student ID", "Name", "Class", "Q21 Main idea", "Q24 Inference", "Q27 Vocabulary", "Q31 Inference", "Q35 Detail", "Q47 Continuation", "Q48 Functional writing", "Listening and speaking", "Corrections complete"];
  return Papa.unparse([
    headers,
    ...rows.slice(1).map((row, index) => [row[0], `Student ${index + 1}`, "Grade 11 Class 3", ...row.slice(3, -1), row.at(-1) === "是" ? "Yes" : "No"]),
  ]);
}

export function sampleEssaysForLocale(locale: Locale): string {
  if (locale === "zh-CN") return essayStressCsv;
  return Papa.unparse(essayStressSamples.map((sample) => ({
    "Sample ID": sample.id,
    "Task type": translate(sample.type, locale),
    "Expected band": translate(sample.band, locale),
    "Expected score": sample.expectedScore,
    "Main issue": translate(sample.mainIssue, locale),
    "Essay text": sample.text.replace(sample.mainIssue, translate(sample.mainIssue, locale)),
  })));
}
