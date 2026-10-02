import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
const cache = new Map();
function load(relative, parent = process.cwd()) {
  let filename = path.resolve(parent, relative);
  if (!path.extname(filename)) filename += ".ts";
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} };
  cache.set(filename, module);
  const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  new Function("require", "module", "exports", compiled)(
    (specifier) => specifier.startsWith(".") ? load(specifier, path.dirname(filename)) : require(specifier),
    module, module.exports,
  );
  return module.exports;
}

const { translate, english } = load("src/i18n/translate.ts");
const { sampleCsvForLocale, sampleEssaysForLocale } = load("src/i18n/sampleData.ts");
const { analyzeLiveData } = load("src/lib/liveData.ts");
const data = load("src/data/mockData.ts");
const en = (value, values) => translate(value, "en", values);
let checks = 0;
function check(name, run) { run(); checks++; console.log(`PASS ${name}`); }

check("Chinese remains unchanged", () => {
  for (const source of Object.keys(english)) assert.equal(translate(source, "zh-CN"), source);
});
check("catalog contains English values and consistent placeholders", () => {
  for (const [source, target] of Object.entries(english)) {
    assert.doesNotMatch(target, /[\u3400-\u9fff]/, source);
    assert.deepEqual([...source.matchAll(/\{\d+\}/g)].map(m => m[0]).sort(), [...target.matchAll(/\{\d+\}/g)].map(m => m[0]).sort(), source);
  }
});
check("render values do not change data structures", () => {
  const record = { 主旨大意: 72, className: "高二(3)班" };
  assert.equal(en(record), record);
  assert.equal(en(72), 72);
  assert.equal(en(null), null);
  assert.equal(en(undefined), undefined);
});
check("idiomatic terminology and class labels", () => {
  assert.equal(en("学情分析"), "Learning analytics");
  assert.equal(en("个人错题本"), "My review notebook");
  assert.equal(en("高二(3)班"), "Grade 11 Class 3");
  assert.equal(en("高一(2)班"), "Grade 10 Class 2");
  assert.equal(en("高三(7)班"), "Grade 12 Class 7");
});
check("explicit placeholders keep multiword names together", () => {
  assert.equal(en("{0} {1} 掌握度 {2}%", ["S02 林同学", "词汇语境", 49]), "S02 Lin: Vocabulary in context mastery 49%");
  assert.equal(translate("{0} {1} 掌握度 {2}%", "zh-CN", ["S02 林同学", "词汇语境", 49]), "S02 林同学 词汇语境 掌握度 49%");
  assert.equal(en("{0}人", [1]), "1 student");
  assert.equal(en("{0}分", [2]), "2 points");
});
check("joined causes and stored messages are translated", () => {
  assert.equal(en("篇章逻辑 / 选项干扰"), "Text structure / Distractor choices");
  assert.equal(en("已解析 12 名学生、8 个得分字段，预览已自动匿名。"), "Parsed 12 students and 8 score columns. The preview uses anonymised names.");
  assert.equal(en("篇章逻辑20次"), "Text structure: 20 occurrences");
  assert.doesNotMatch(en("薄弱题目：Q27 词义猜测(熟词生义, 达成率25%)；Q31 推理判断(篇章逻辑, 达成率42%)"), /[\u3400-\u9fff]/);
  assert.doesNotMatch(en("高频错因：篇章逻辑20次；熟词生义11次"), /[\u3400-\u9fff]/);
});
check("all nine report variants have complete local translations", () => {
  for (const report of data.reportTemplates) {
    assert.doesNotMatch(en(report.title), /[\u3400-\u9fff]/);
    for (const variant of Object.values(report.tones)) {
      assert.doesNotMatch(en(variant.body), /[\u3400-\u9fff]/);
      assert.ok(en(variant.body).length > 50);
      for (const bullet of variant.bullets) assert.doesNotMatch(en(bullet), /[\u3400-\u9fff]/);
    }
  }
});
check("question diagnoses and practice explanations are translated", () => {
  for (const question of data.assignments[0].questions) {
    for (const value of [question.questionType, question.passageTheme, question.diagnosis.narrative, question.diagnosis.evidence, question.diagnosis.teachingInsight.title, question.diagnosis.teachingInsight.suggestion]) {
      assert.doesNotMatch(en(value), /[\u3400-\u9fff]/, value);
    }
    for (const practice of question.diagnosis.practiceItems) {
      for (const value of [practice.title, practice.targetSkill, practice.prompt, practice.answer, practice.explanation, practice.difficulty]) assert.doesNotMatch(en(value), /[\u3400-\u9fff]/, value);
    }
  }
});
check("English and Chinese CSV samples produce identical statistics", () => {
  assert.equal(sampleCsvForLocale("zh-CN"), data.liveDemoCsv);
  assert.doesNotMatch(sampleCsvForLocale("en"), /[\u3400-\u9fff]/);
  const zh = analyzeLiveData(sampleCsvForLocale("zh-CN"), data.liveQuestionGuide);
  const english = analyzeLiveData(sampleCsvForLocale("en"), data.liveQuestionGuide);
  for (const key of ["rowCount", "scoredStudents", "maxTotal", "averageTotal", "averageRate", "riskCount", "completedCorrection"]) assert.equal(english[key], zh[key], key);
  assert.equal(english.quality.coverage, 1);
  assert.deepEqual(english.weakItems.map(x => [x.type, x.averageRate, x.weakCount]), zh.weakItems.map(x => [x.type, x.averageRate, x.weakCount]));
});
check("English custom maxima do not infer or inflate scores", () => {
  for (const field of ["Q99 max10", "Q99 MAX: 10", "Q99 maximum=10", "Q99满分10"]) {
    const result = analyzeLiveData(`id,name,class,${field}\nA1,Example,A,8`, data.liveQuestionGuide);
    assert.equal(result.averageRate, 0.8, field);
  }
  assert.equal(analyzeLiveData("id,name,class,Q99\nA1,Example,A,8", data.liveQuestionGuide).averageRate, null);
});
check("sample essay export localises labels without changing scores", () => {
  assert.equal(sampleEssaysForLocale("zh-CN"), data.essayStressCsv);
  assert.doesNotMatch(sampleEssaysForLocale("en"), /[\u3400-\u9fff]/);
  const rows = require("papaparse").parse(sampleEssaysForLocale("en"), { header: true }).data;
  assert.equal(rows.length, data.essayStressSamples.length);
  rows.forEach((row, index) => assert.equal(Number(row["Expected score"]), data.essayStressSamples[index].expectedScore));
});
check("translations leave unknown teacher-authored text unchanged", () => {
  const original = "My class notes: 学生自己写的内容，不可替换。";
  assert.equal(en(original), original);
});
console.log(`${checks} bilingual regression groups passed; ${Object.keys(english).length} local translations checked.`);
