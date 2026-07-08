import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.join(rootDir, "test-artifacts", "essay-rubric-stress");
fs.mkdirSync(outputDir, { recursive: true });

const standards = [
  {
    id: "application-15",
    total: 15,
    type: "应用文",
    dimensions: ["内容要点与交际目的", "语言准确与表达多样", "结构连贯与格式得体", "书写规范与可读性"],
  },
  {
    id: "continuation-25",
    total: 25,
    type: "读后续写",
    dimensions: ["情节合理与原文衔接", "内容丰富与主题升华", "语言准确与句式层次", "篇章连贯与段落衔接", "规范性与可读性"],
  },
  {
    id: "combined-40",
    total: 40,
    type: "综合",
    dimensions: ["任务完成与真实情境表达", "综合读写与内容生成", "语言能力与准确性", "思维品质与篇章逻辑", "文化意识与表达得体"],
  },
];

const templates = [
  {
    type: "应用文",
    band: "高分",
    score: 14,
    issue: "个别表达可更自然",
    text:
      "Dear Chris, I am delighted to invite you to the paper-cutting exhibition in our school library next Friday. It will present works from different regions and include a short workshop. I believe it will help you experience Chinese art in a vivid way. Yours, Li Hua",
  },
  {
    type: "应用文",
    band: "中高分",
    score: 11,
    issue: "要点完整但句式变化不足",
    text:
      "Dear Chris, There will be a paper-cutting show in our school library on Friday. You can see many works and try to make one. I hope you can come. Yours, Li Hua",
  },
  {
    type: "应用文",
    band: "临界",
    score: 8,
    issue: "格式和内容展开不足",
    text:
      "Dear Chris, There is an activity about paper cutting. It is interesting. You can come if you have time. Yours, Li Hua",
  },
  {
    type: "读后续写",
    band: "高分",
    score: 23,
    issue: "可继续增强动作细节",
    text:
      "Li Hua found a notebook in the rain. Seeing a phone number on the first page, he called the owner immediately and waited at the bus stop, keeping the notebook dry under his coat. When Ms. Chen arrived, she was moved because the notebook held plans for her students.",
  },
  {
    type: "读后续写",
    band: "中高分",
    score: 17,
    issue: "故事完整但语言偏平",
    text:
      "Li Hua found the phone number and called the owner. The woman came later and thanked him. Li Hua was happy because he helped her keep an important notebook.",
  },
  {
    type: "读后续写",
    band: "低分",
    score: 7,
    issue: "情节过短且缺少原文衔接",
    text:
      "Li Hua found a notebook. He called someone. The woman came and said thanks. Then he went home.",
  },
];

const records = Array.from({ length: 240 }, (_, index) => {
  const template = templates[index % templates.length];
  const variant = index % 7 === 0 ? "adds sentence errors" : index % 5 === 0 ? "adds weak cohesion" : "baseline";
  const expectedScore = Math.max(1, template.score + (index % 11 === 0 ? -1 : index % 13 === 0 ? 1 : 0));
  return {
    id: `stress-${String(index + 1).padStart(3, "0")}`,
    type: template.type,
    band: template.band,
    expectedScore,
    mainIssue: template.issue,
    variant,
    text: `${template.text} Variant ${index + 1}: ${variant}.`,
  };
});

const bandRanges = {
  应用文: {
    高分: [13, 15],
    中高分: [10, 12],
    临界: [7, 9],
    低分: [1, 6],
  },
  读后续写: {
    高分: [21, 25],
    中高分: [16, 20],
    临界: [11, 15],
    低分: [1, 10],
  },
};

const issues = [];

for (const standard of standards) {
  if (!standard.dimensions.length) {
    issues.push(`${standard.id} has no rubric dimensions`);
  }
  if (standard.total <= 0) {
    issues.push(`${standard.id} has invalid total score`);
  }
}

for (const record of records) {
  const range = bandRanges[record.type]?.[record.band];
  if (!range) {
    issues.push(`${record.id} has unsupported band ${record.band}`);
    continue;
  }
  if (record.expectedScore < range[0] || record.expectedScore > range[1]) {
    issues.push(`${record.id} score ${record.expectedScore} outside ${record.band} range ${range.join("-")}`);
  }
  if (record.text.length < 60) {
    issues.push(`${record.id} text is too short for stress prompt`);
  }
}

const promptLengths = records.map((record) => {
  const standard = standards.find((item) => item.type === record.type) ?? standards[2];
  const prompt = [
    "你是广东高中英语作文批改助手。",
    `题型：${record.type}`,
    `评分标准：${standard.dimensions.join("、")}`,
    `作文：${record.text}`,
  ].join("\n");
  return prompt.length;
});

const distribution = records.reduce((acc, record) => {
  const key = `${record.type}-${record.band}`;
  acc[key] = (acc[key] ?? 0) + 1;
  return acc;
}, {});

const report = {
  generatedAt: new Date().toISOString(),
  recordCount: records.length,
  standardCount: standards.length,
  distribution,
  maxPromptChars: Math.max(...promptLengths),
  minPromptChars: Math.min(...promptLengths),
  averagePromptChars: Math.round(promptLengths.reduce((sum, value) => sum + value, 0) / promptLengths.length),
  issues,
  passed: issues.length === 0,
};

const csv = [
  "样本ID,题型,档位,预期分数,主要问题,变体,作文文本",
  ...records.map((record) =>
    [
      record.id,
      record.type,
      record.band,
      record.expectedScore,
      record.mainIssue,
      record.variant,
      `"${record.text.replace(/"/g, '""')}"`,
    ].join(","),
  ),
].join("\n");

fs.writeFileSync(path.join(outputDir, "essay-rubric-stress-report.json"), JSON.stringify(report, null, 2));
fs.writeFileSync(path.join(outputDir, "essay-rubric-stress-samples.csv"), csv);

console.log(JSON.stringify(report, null, 2));

if (!report.passed) {
  process.exitCode = 1;
}
