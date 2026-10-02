import assert from "node:assert/strict";
import { analyzeLiveData } from "../src/lib/liveData.ts";

const guides = [21, 27].map((number) => ({ field: `Q${number}`, label: `Q${number}`, max: 2, type: "阅读", cause: "待复核", suggestion: "核对原文" }));
const parse = (text) => analyzeLiveData(text, guides);
const csv = (rows, extra = "") => `学生ID,姓名,班级,Q21,Q27${extra}\n${rows}`;
let checks = 0;
const check = (name, run) => { run(); checks++; console.log(`PASS ${name}`); };
check("negative correction status is not complete", () => {
  const r = parse(csv("S1,甲,一班,2,1,未完成\nS2,乙,一班,1,2,未订正", ",订正完成"));
  assert.equal(r.completedCorrection, 0);
  assert.equal(r.averageRate, 0.75);
});
check("numeric correction is metadata", () => {
  const r = parse(csv("S1,甲,一班,2,1,1\nS2,乙,一班,1,2,0", ",订正完成"));
  assert.equal(r.completedCorrection, 1);
  assert.equal(r.scoreColumns.length, 2);
});
check("invalid values and mismatched totals cannot inflate rates", () => {
  const r = parse(csv("S1,甲,一班,2,2,100\nS2,乙,一班,-1,9,100", ",总分"));
  assert.equal(r.averageRate, 1);
  assert.equal(r.averageTotal, 4);
  assert.equal(r.quality.invalidScoreCells, 2);
  assert.equal(r.quality.totalMismatchRows, 1);
  assert.equal(r.students[1].rate, null);
});
check("missing data is not zero or risk", () => {
  const r = parse(csv("S1,甲,一班,2,\nS2,乙,一班,,"));
  assert.equal(r.quality.missingScoreCells, 3);
  assert.equal(r.riskCount, 0);
  assert.equal(r.scoredStudents, 1);
  assert.equal(r.averageRate, 1);
});
check("all missing has an explicit no-score result", () => {
  const r = parse(csv("S1,甲,一班,,\nS2,乙,一班,,"));
  assert.equal(r.averageRate, null);
  assert.equal(r.averageTotal, null);
  assert.equal(r.riskCount, 0);
});
check("quoted multiline fields stay one record", () => {
  const r = parse(csv('S1,"甲,同学",一班,2,2,"第一行\n第二行"', ",备注"));
  assert.equal(r.rowCount, 1);
  assert.equal(r.averageRate, 1);
});
check("duplicate headers and malformed rows rejected", () => {
  assert.equal(parse("姓名,Q21,Q21\n甲,1,2"), null);
  assert.equal(parse("姓名,Q21\n甲,1,2"), null);
});
check("missing class and duplicate identity flagged", () => {
  const r = parse(csv("S1,甲,,2,2\nS1,甲,,1,1"));
  assert.equal(r.quality.missingClassRows, 2);
  assert.equal(r.quality.duplicateRows, 1);
});
check("English headers and TSV", () => {
  const r = parse("id\tname\tclass\tQ21\n1\tAlice\tA\t2");
  assert.equal(r.quality.missingClassRows, 0);
  assert.equal(r.quality.missingIdentityRows, 0);
});
check("unknown maximum never inferred from highest student", () => {
  assert.equal(parse("姓名,班级,Q99\n甲,A,8").averageRate, null);
  assert.equal(parse("姓名,班级,Q99满分10\n甲,A,8").averageRate, 0.8);
});
check("zero is valid, percent and infinity are not raw scores", () => {
  const r = parse(csv("S1,甲,A,0,Infinity\nS2,乙,A,80%,2"));
  assert.equal(r.quality.validScoreCells, 2);
  assert.equal(r.quality.invalidScoreCells, 2);
  assert.equal(r.averageRate, 0.5);
});
check("1,000 deterministic score combinations", () => {
  const combinations = new Set();
  for (let i = 0; i < 1000; i++) {
    const a = (i % 201) / 100, b = Math.floor(i / 201) / 2;
    combinations.add(`${a},${b}`);
    const r = parse(csv(`S${i},甲,A,${a},${b}`));
    assert.equal(r.averageTotal, a + b);
    assert.equal(r.averageRate, (a + b) / 4);
    assert.ok(r.averageRate >= 0 && r.averageRate <= 1);
  }
  assert.equal(combinations.size, 1000);
});
console.log(JSON.stringify({ checks, combinations: 1000, passed: true }));
