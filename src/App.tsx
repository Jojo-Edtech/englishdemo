import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  BookMarked,
  BookOpenCheck,
  Brain,
  ChevronRight,
  CircleCheck,
  ClipboardCheck,
  ClipboardList,
  Download,
  ExternalLink,
  FileCheck2,
  FileText,
  Filter,
  GraduationCap,
  LayoutDashboard,
  LineChart,
  MessageSquareText,
  Monitor,
  Play,
  RefreshCw,
  SearchCheck,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Target,
  UploadCloud,
  UserRound,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart as ReLineChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  accuracyTrend,
  assignments,
  causeStack,
  classSnapshots,
  closedLoopMetrics,
  essayWorkbench,
  essayStressCsv,
  essayStressSamples,
  essayStressSummary,
  fieldMappingRows,
  heatmap,
  heatmapColumns,
  importSources,
  interventionGroups,
  liveDemoCsv,
  liveQuestionGuide,
  knowledgeGraphNodes,
  optionMisconceptions,
  platformFeatureBenchmarks,
  repeatedErrorTracks,
  reportPreviewItems,
  reportTemplates,
  reviewLessonPlan,
  skillRadar,
  studentTaskClosures,
  studentProgressProfiles,
  warningCases,
  writingRubricRows,
  writingRubricStandards,
} from "./data/mockData";
import type { PracticeItem, QuestionItem, StudentAttempt } from "./types";

type PanelId =
  | "overview"
  | "upload"
  | "results"
  | "diagnosis"
  | "analytics"
  | "reports"
  | "ima"
  | "practice"
  | "student";

const assignment = assignments[0];

const teacherNav = [
  { id: "overview", label: "总览", icon: LayoutDashboard },
  { id: "upload", label: "导入", icon: UploadCloud },
  { id: "results", label: "批改", icon: FileCheck2 },
  { id: "diagnosis", label: "错因", icon: SearchCheck },
  { id: "analytics", label: "学情", icon: BarChart3 },
  { id: "reports", label: "报告", icon: FileText },
  { id: "ima", label: "ima助手", icon: Brain },
  { id: "practice", label: "练习", icon: BookOpenCheck },
] satisfies Array<{ id: PanelId; label: string; icon: typeof LayoutDashboard }>;

const mobileNav = [
  { id: "overview", label: "总览", icon: LayoutDashboard },
  { id: "upload", label: "导入", icon: UploadCloud },
  { id: "diagnosis", label: "错因", icon: SearchCheck },
  { id: "analytics", label: "学情", icon: BarChart3 },
  { id: "student", label: "学生", icon: UserRound },
] satisfies Array<{ id: PanelId; label: string; icon: typeof LayoutDashboard }>;

const sampleQuestionText = `Passage C: As electric buses become common in many cities, engineers are testing ways to reuse the energy created when buses slow down.

31. Why does the author mention the old charging station?
A. To introduce a tourist attraction.
B. To show how public transport used to work.
C. To compare two unrelated inventions.
D. To explain the need for a more efficient system.`;

const percent = (value: number) => `${Math.round(value * 100)}%`;

type LiveStudentRow = {
  id: string;
  displayName: string;
  className: string;
  total: number;
  rate: number;
  weakItems: string[];
  completedCorrection: boolean;
};

type LiveWeakItem = {
  field: string;
  label: string;
  type: string;
  cause: string;
  suggestion: string;
  averageRate: number;
  weakCount: number;
};

type LiveDataSummary = {
  rowCount: number;
  classNames: string[];
  scoreColumns: string[];
  maxTotal: number;
  averageTotal: number;
  averageRate: number;
  riskCount: number;
  completedCorrection: number;
  weakItems: LiveWeakItem[];
  causeCounts: Array<{ cause: string; count: number }>;
  students: LiveStudentRow[];
};

type DeepSeekStatus = "idle" | "ready" | "loading" | "success" | "error";

type DeepSeekState = {
  status: DeepSeekStatus;
  message: string;
  result: string;
};

const identityColumnPattern = /(学生ID|学号|姓名|学生姓名|学生|班级|年级|class|name|id)$/i;

const parseScore = (value?: string) => {
  if (!value) return null;
  const cleaned = value.replace(/[,%分\s]/g, "");
  if (!cleaned) return null;
  const score = Number(cleaned);
  return Number.isFinite(score) ? score : null;
};

const parseDelimitedLine = (line: string, delimiter: string) => {
  if (delimiter === "\t") return line.split("\t");
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
};

const getQuestionGuide = (field: string) => {
  const code = field.match(/Q\d+|听说/)?.[0];
  return liveQuestionGuide.find((guide) => {
    const guideCode = guide.field.match(/Q\d+|听说/)?.[0];
    return field === guide.field || field.includes(guide.field) || guide.field.includes(field) || (!!code && code === guideCode);
  });
};

const inferMaxScore = (field: string, observedMax: number) => {
  const guide = getQuestionGuide(field);
  if (guide) return guide.max;
  if (observedMax <= 2) return 2;
  if (observedMax <= 5) return 5;
  if (observedMax <= 15) return 15;
  if (observedMax <= 25) return 25;
  if (observedMax <= 60) return 60;
  return Math.max(observedMax, 1);
};

const maskStudentName = (name: string, index: number) => {
  const prefix = `S${String(index + 1).padStart(2, "0")}`;
  const cleaned = name.trim();
  if (!cleaned) return `${prefix} 匿名学生`;
  return `${prefix} ${cleaned.slice(0, 1)}同学`;
};

const analyzeLiveData = (rawText: string): LiveDataSummary | null => {
  const lines = rawText
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) return null;

  const delimiter = lines[0].includes("\t") ? "\t" : ",";
  const headers = parseDelimitedLine(lines[0], delimiter).map((header) => header.trim());
  const rawRows = lines.slice(1).map((line) => parseDelimitedLine(line, delimiter));
  const records = rawRows.map((cells) =>
    headers.reduce<Record<string, string>>((record, header, index) => {
      record[header] = (cells[index] ?? "").trim();
      return record;
    }, {}),
  );

  const totalColumn = headers.find((header) => /总分|合计|total/i.test(header));
  const scoreColumns = headers.filter((header) => {
    if (header === totalColumn) return false;
    if (identityColumnPattern.test(header)) return false;
    return records.some((record) => parseScore(record[header]) !== null);
  });

  if (!scoreColumns.length) return null;

  const maxByColumn = scoreColumns.reduce<Record<string, number>>((acc, field) => {
    const observedMax = Math.max(...records.map((record) => parseScore(record[field]) ?? 0));
    acc[field] = inferMaxScore(field, observedMax);
    return acc;
  }, {});
  const maxTotal = scoreColumns.reduce((sum, field) => sum + maxByColumn[field], 0);

  const students = records.map((record, index) => {
    const totalFromColumn = totalColumn ? parseScore(record[totalColumn]) : null;
    const itemTotal = scoreColumns.reduce((sum, field) => sum + (parseScore(record[field]) ?? 0), 0);
    const total = totalFromColumn ?? itemTotal;
    const weakItems = scoreColumns.filter((field) => {
      const score = parseScore(record[field]) ?? 0;
      return score < maxByColumn[field] * 0.65;
    });
    const correctionValue = Object.entries(record).find(([key]) => key.includes("订正"))?.[1] ?? "";
    return {
      id: record["学生ID"] || record["学号"] || `S${String(index + 1).padStart(2, "0")}`,
      displayName: maskStudentName(record["姓名"] || record["学生姓名"] || record["学生"] || "", index),
      className: record["班级"] || record["年级"] || "未分班",
      total,
      rate: maxTotal > 0 ? total / maxTotal : 0,
      weakItems,
      completedCorrection: /是|已|完成|1|true/i.test(correctionValue),
    };
  });

  const weakItems = scoreColumns
    .map((field) => {
      const guide = getQuestionGuide(field);
      const totalScore = records.reduce((sum, record) => sum + (parseScore(record[field]) ?? 0), 0);
      const averageRate = totalScore / (records.length * maxByColumn[field]);
      const weakCount = records.filter((record) => (parseScore(record[field]) ?? 0) < maxByColumn[field] * 0.65).length;
      return {
        field,
        label: guide?.label ?? field,
        type: guide?.type ?? "自定义题目",
        cause: guide?.cause ?? "待老师确认",
        suggestion: guide?.suggestion ?? "建议老师补充题型和错因标签后生成讲评建议。",
        averageRate,
        weakCount,
      };
    })
    .sort((a, b) => a.averageRate - b.averageRate);

  const causeCountMap = new Map<string, number>();
  students.forEach((student) => {
    student.weakItems.forEach((field) => {
      const cause = getQuestionGuide(field)?.cause ?? "待老师确认";
      causeCountMap.set(cause, (causeCountMap.get(cause) ?? 0) + 1);
    });
  });

  const averageTotal = students.reduce((sum, student) => sum + student.total, 0) / students.length;
  return {
    rowCount: students.length,
    classNames: [...new Set(students.map((student) => student.className))],
    scoreColumns,
    maxTotal,
    averageTotal,
    averageRate: maxTotal > 0 ? averageTotal / maxTotal : 0,
    riskCount: students.filter((student) => student.rate < 0.6 || student.weakItems.length >= 3).length,
    completedCorrection: students.filter((student) => student.completedCorrection).length,
    weakItems: weakItems.slice(0, 5),
    causeCounts: [...causeCountMap.entries()]
      .map(([cause, count]) => ({ cause, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4),
    students: students.slice(0, 8),
  };
};

const downloadTextFile = (content: string, filename: string) => {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const buildImaLearningSummary = ({
  className,
  classSnapshot,
  liveSummary,
  question,
}: {
  className: string;
  classSnapshot: (typeof classSnapshots)[number];
  liveSummary: LiveDataSummary | null;
  question: QuestionItem;
}) => {
  const liveLines = liveSummary
    ? [
        `本地解析数据：${liveSummary.rowCount}名学生，${liveSummary.scoreColumns.length}个得分字段，平均达成率${percent(liveSummary.averageRate)}，需跟进${liveSummary.riskCount}人。`,
        `薄弱题目：${liveSummary.weakItems.map((item) => `${item.label}(${item.cause}, 达成率${percent(item.averageRate)})`).join("；") || "暂无"}`,
        `高频错因：${liveSummary.causeCounts.map((item) => `${item.cause}${item.count}次`).join("；") || "暂无"}`,
      ]
    : ["本地解析数据：暂未导入真实成绩表，请先在平台内解析后再复制摘要。"];

  return [
    "请基于以下匿名学情摘要，结合高中英语课程标准、教材与备课组知识库，生成下一节课的教学建议、分层练习方向和备课组讨论问题。",
    "",
    "【隐私边界】",
    "以下内容只包含班级层面的匿名汇总，不包含学生姓名、原始逐项成绩或可识别个人信息。",
    "",
    "【班级概况】",
    `班级/范围：${className}`,
    `班级平均正确率：${percent(classSnapshot.averageAccuracy)}`,
    `完成率：${percent(classSnapshot.completionRate)}`,
    `写作均分：${classSnapshot.writingScore}/40`,
    `需跟进学生数：${classSnapshot.riskStudents}人`,
    "",
    "【重点错题】",
    `题号：Q${question.number}`,
    `题型：${question.questionType}`,
    `主题：${question.passageTheme}`,
    `正确率：${percent(question.correctRate)}`,
    `主要误选：${question.topWrongOption}`,
    `错因标签：${question.diagnosis.causes.join(" / ")}`,
    `诊断叙述：${question.diagnosis.narrative}`,
    `建议动作：${question.diagnosis.teachingInsight.suggestion}`,
    "",
    "【真实数据本地解析摘要】",
    ...liveLines,
    "",
    "【希望ima输出】",
    "1. 下节课10-15分钟微训练设计",
    "2. 按错因分层的练习建议",
    "3. 备课组讨论问题",
    "4. 可复制给学生的订正提示语",
  ].join("\n");
};

const buildImaKnowledgePrompt = () =>
  [
    "请帮我规划一个“高中英语备课组学情分析”ima知识库。",
    "",
    "【知识库定位】",
    "它不是学生成绩数据库，而是服务备课、教研、讲评和教师发展的知识库。结构化学生数据继续留在学情分析平台；ima只接收匿名学情摘要、教材课标、试卷讲评资料和教研文档。",
    "",
    "【建议上传到ima的资料】",
    "1. 课程标准、考试说明、区域教研文件",
    "2. 教材单元目标、阅读篇章、写作任务和评价量规",
    "3. 试卷、答案解析、讲评课课件、错因标签说明",
    "4. 备课组会议纪要、教学反思、优秀课例",
    "5. 教师发展、AI教育、学情分析相关政策和培训材料",
    "",
    "【请ima帮我建立】",
    "1. 知识库目录结构",
    "2. 文档命名规则",
    "3. 适合老师日常提问的提示词模板",
    "4. 如何把学情平台的匿名摘要转化为备课建议",
    "5. 哪些数据不应该上传，以保护学生隐私",
  ].join("\n");

const deepSeekFallbackText = [
  "【本地回退结果】",
  "1. 先用最低正确率题目做 8-12 分钟错因讲评，要求学生说出原文证据和排除理由。",
  "2. 按错因分组：词汇语境组补语义场迁移，篇章逻辑组做段落功能标注，长难句组做主干-修饰-指代拆解。",
  "3. 课后推送 2 道同类题，并要求上传订正证据；下次课前用 5 分钟再测核验。",
].join("\n");

const demoEssayText = `Paragraph continuation task:
When the last bus left, Li Hua found a small blue notebook on the bench. The rain was getting heavier, and the owner might be very worried.

Li Hua opened the notebook and saw a phone number on the first page. He called the number at once. A tired voice answered, "This is Ms. Chen. Did you find my notebook?" Li Hua told her that he was waiting at the bus stop near the library. Because Ms. Chen lived far away, Li Hua decided to stay for a few more minutes. The wind was cold, but he kept the notebook dry under his coat.

Twenty minutes later, Ms. Chen arrived. She said the notebook contained her students' exam plans and teaching notes. Li Hua smiled and said it was what anyone should do. On his way home, he felt warm because he had helped someone protect something important.`;

const essayCorrectionFallbackText = [
  "【本地样例批改】",
  "总评：续写情节完整，能围绕“归还 notebook”推进故事，结尾有正向价值；语言较准确，但细节描写和句式层次还可以更丰富。",
  "建议分数：31/40",
  "",
  "1. 内容与情节：事件链清楚，但冲突与转折偏弱，可补充“等待时的犹豫/担心”来增强故事张力。",
  "2. 语言表达：多用简单句，建议加入原因状语、非谓语或定语从句，例如把 He called the number at once. 改为 Seeing a phone number, he called it without hesitation.",
  "3. 衔接连贯：Because / Twenty minutes later 使用自然，可增加 Meanwhile / To his relief 等衔接语。",
  "4. 教学启示：本题适合训练“情节链 + 情绪线 + 价值升华”，课上可让学生先圈出原文伏笔，再写两句动作描写和一句心理描写。",
].join("\n");

const essayRubricPromptText = writingRubricStandards
  .map((standard) => {
    const dimensions = standard.dimensions
      .map((dimension) => `${dimension.name}${dimension.weight}分：${dimension.criteria}`)
      .join("；");
    const bands = standard.bands
      .map((band) => `${band.label}${band.scoreRange}：${band.descriptor}`)
      .join("；");
    return `${standard.title}（${standard.examUse}）：${standard.summary}\n维度：${dimensions}\n分档：${bands}`;
  })
  .join("\n\n");

const buildEssayCorrectionPrompt = ({
  className,
  essayText,
}: {
  className: string;
  essayText: string;
}) =>
  [
    "你是广东高中英语教师，请按高考英语应用文/读后续写批改口径，给老师一个可直接展示的作文批改结果。",
    "",
    "【隐私边界】",
    "只批改文本本身，不推断学生身份，不编造学生个人信息。",
    "",
    "【班级/场景】",
    className,
    "",
    "【评分标准库】",
    essayRubricPromptText,
    "",
    "【请输出】",
    "1. 总体评价：一句话说明优势和主要短板。",
    "2. 建议得分：按 40 分制给出分数，并说明扣分理由。",
    "3. 分项诊断：内容完成度、结构连贯、语言准确性、词汇句式、读后续写情节/应用文交际目的。",
    "4. 逐句或片段批注：列出 3-5 个最值得改的原句、问题、修改建议。",
    "5. 修改示范：给出一个更自然的改写版本，不要太长。",
    "6. 同类迁移练习：给学生 2 个可马上练的微任务。",
    "7. 教学启示：给老师 2 条教考衔接建议，聚焦高中英语核心素养和高考写作能力。",
    "",
    "【学生作文/文章】",
    essayText,
  ].join("\n");

const buildDeepSeekPrompt = ({
  className,
  classSnapshot,
  liveSummary,
  question,
  mode,
}: {
  className: string;
  classSnapshot: (typeof classSnapshots)[number];
  liveSummary: LiveDataSummary | null;
  question: QuestionItem;
  mode: "teaching" | "practice" | "report";
}) => {
  const liveSummaryLines = liveSummary
    ? [
        `真实数据本地解析：${liveSummary.rowCount}名学生，平均达成率${percent(liveSummary.averageRate)}，需跟进${liveSummary.riskCount}人。`,
        `薄弱题：${liveSummary.weakItems.map((item) => `${item.label}(${item.type}, ${item.cause}, 达成率${percent(item.averageRate)})`).join("；")}`,
        `高频错因：${liveSummary.causeCounts.map((item) => `${item.cause}${item.count}次`).join("；")}`,
      ]
    : ["暂未导入真实成绩表，请基于模拟班级概况输出。"];

  const task =
    mode === "practice"
      ? "请生成 3 道同类迁移练习，每道题包含题干、选项、答案、错因提示和讲评要点。"
      : mode === "report"
        ? "请生成一段可给备课组/校长看的简洁学情说明，包含发现、证据、下一步教学动作。"
        : "请生成下一节课 15 分钟讲评与分层练习建议，必须体现教考衔接。";

  return [
    "你是广东高中英语备课组的教研助手。请只基于以下匿名学情摘要输出，不编造学生个人隐私。",
    "",
    "【任务】",
    task,
    "",
    "【输出格式】",
    "用中文，分为：核心判断、课堂动作、分层练习、跟踪证据。每点尽量短，适合老师直接复制到备课记录。",
    "",
    "【班级概况】",
    `范围：${className}`,
    `班级平均正确率：${percent(classSnapshot.averageAccuracy)}`,
    `完成率：${percent(classSnapshot.completionRate)}`,
    `写作均分：${classSnapshot.writingScore}/40`,
    `需跟进学生数：${classSnapshot.riskStudents}人`,
    "",
    "【重点错题】",
    `题号：Q${question.number}`,
    `题型：${question.questionType}`,
    `主题：${question.passageTheme}`,
    `正确率：${percent(question.correctRate)}`,
    `主要误选：${question.topWrongOption}`,
    `错因标签：${question.diagnosis.causes.join(" / ")}`,
    `诊断叙述：${question.diagnosis.narrative}`,
    "",
    "【真实数据摘要】",
    ...liveSummaryLines,
  ].join("\n");
};

function App() {
  const [activePanel, setActivePanel] = useState<PanelId>("overview");
  const [selectedClass, setSelectedClass] = useState("高二(3)班");
  const [selectedQuestionId, setSelectedQuestionId] = useState("q1");
  const [selectedStudentId, setSelectedStudentId] = useState("s2");
  const [questionText, setQuestionText] = useState(sampleQuestionText);
  const [fileName, setFileName] = useState("高二阅读与续写周测06.pdf");
  const [analysisReady, setAnalysisReady] = useState(true);
  const [generated, setGenerated] = useState<PracticeItem[]>([]);
  const [selectedReportId, setSelectedReportId] = useState(reportTemplates[0].id);
  const [copiedReport, setCopiedReport] = useState("");
  const [copiedImaText, setCopiedImaText] = useState("");
  const [liveCsv, setLiveCsv] = useState(liveDemoCsv);
  const [liveSummary, setLiveSummary] = useState<LiveDataSummary | null>(() =>
    analyzeLiveData(liveDemoCsv),
  );
  const [liveMessage, setLiveMessage] = useState("已载入深圳高中英语样例数据，可直接替换为老师自己的表格。");
  const [deepSeekApiKey, setDeepSeekApiKey] = useState(() =>
    typeof window === "undefined" ? "" : window.localStorage.getItem("deepseek_api_key") ?? "",
  );
  const [deepSeekModel, setDeepSeekModel] = useState(() =>
    typeof window === "undefined" ? "deepseek-v4-flash" : window.localStorage.getItem("deepseek_model") ?? "deepseek-v4-flash",
  );
  const [deepSeekState, setDeepSeekState] = useState<DeepSeekState>(() => ({
    status: typeof window !== "undefined" && window.localStorage.getItem("deepseek_api_key") ? "ready" : "idle",
    message: typeof window !== "undefined" && window.localStorage.getItem("deepseek_api_key")
      ? "已检测到本机浏览器保存的 DeepSeek Key，可测试连接。"
      : "未填写 API Key 时使用本地演示结果。",
    result: "",
  }));
  const [essayText, setEssayText] = useState(demoEssayText);
  const [essayFileName, setEssayFileName] = useState("样例续写作文.txt");
  const [essayCorrectionState, setEssayCorrectionState] = useState<DeepSeekState>({
    status: "idle",
    message: "可粘贴作文或上传 txt/csv 文本；点击批改后生成反馈。",
    result: "",
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (deepSeekApiKey.trim()) {
      window.localStorage.setItem("deepseek_api_key", deepSeekApiKey.trim());
    } else {
      window.localStorage.removeItem("deepseek_api_key");
    }
  }, [deepSeekApiKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("deepseek_model", deepSeekModel);
  }, [deepSeekModel]);

  const selectedQuestion = useMemo(
    () =>
      assignment.questions.find((question) => question.id === selectedQuestionId) ??
      assignment.questions[0],
    [selectedQuestionId],
  );

  const classSnapshot = useMemo(
    () =>
      classSnapshots.find((snapshot) => snapshot.className === selectedClass) ??
      classSnapshots[0],
    [selectedClass],
  );

  const filteredAttempts = useMemo(
    () =>
      assignment.attempts.filter((attempt) =>
        selectedClass === "高三英语备课组"
          ? true
          : attempt.className === selectedClass,
      ),
    [selectedClass],
  );

  const students = useMemo(() => {
    const unique = new Map<string, StudentAttempt>();
    assignment.attempts.forEach((attempt) => {
      if (!unique.has(attempt.studentId)) unique.set(attempt.studentId, attempt);
    });
    return [...unique.values()];
  }, []);

  const selectedStudentAttempts = useMemo(
    () =>
      assignment.attempts.filter((attempt) => attempt.studentId === selectedStudentId),
    [selectedStudentId],
  );

  const wrongAttempts = selectedStudentAttempts.filter((attempt) => !attempt.isCorrect);
  const lowQuestions = [...assignment.questions].sort(
    (a, b) => a.correctRate - b.correctRate,
  );

  const handleGeneratePractice = () => {
    const next = selectedQuestion.diagnosis.practiceItems;
    setGenerated(next);
    setActivePanel("practice");
  };

  const handleAnalyzeLiveCsv = (nextCsv = liveCsv) => {
    const summary = analyzeLiveData(nextCsv);
    if (!summary) {
      setLiveSummary(null);
      setLiveMessage("暂时没有识别到有效成绩列。请保留表头，并至少包含姓名/班级和一列数字得分。");
      return;
    }
    setLiveSummary(summary);
    setLiveMessage(`已解析 ${summary.rowCount} 名学生、${summary.scoreColumns.length} 个得分字段，预览已自动匿名。`);
  };

  const handleLoadLiveSample = () => {
    setLiveCsv(liveDemoCsv);
    const summary = analyzeLiveData(liveDemoCsv);
    setLiveSummary(summary);
    setLiveMessage("已重新载入样例数据。明天展示时可以先点这里，再换老师自己的表格。");
  };

  const handleClearLiveData = () => {
    setLiveCsv("");
    setLiveSummary(null);
    setLiveMessage("已清空当前输入。真实学生数据不会保存，刷新页面也会回到样例状态。");
  };

  const handleLiveDataFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      setLiveCsv(text);
      handleAnalyzeLiveCsv(text);
    };
    reader.readAsText(file, "utf-8");
  };

  const requestDeepSeek = async (mode: "test" | "teaching" | "practice" | "report") => {
    const key = deepSeekApiKey.trim();
    const prompt = mode === "test"
      ? "请用一句中文回复：DeepSeek API 连接正常。"
      : buildDeepSeekPrompt({
          className: selectedClass,
          classSnapshot,
          liveSummary,
          question: selectedQuestion,
          mode,
        });

    if (!key) {
      setDeepSeekState({
        status: "ready",
        message: "未填写 DeepSeek API Key，已使用本地回退结果；明天演示时可临时粘贴 Key 再测试。",
        result: deepSeekFallbackText,
      });
      return;
    }

    setDeepSeekState({
      status: "loading",
      message: mode === "test" ? "正在测试 DeepSeek API 连接..." : "正在请求 DeepSeek 生成建议...",
      result: deepSeekState.result,
    });

    try {
      const response = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: deepSeekModel,
          messages: [
            {
              role: "system",
              content: "你是高中英语教研助手，回答要短、清楚、可落地，避免编造学生个人隐私。",
            },
            { role: "user", content: prompt },
          ],
          thinking: { type: "disabled" },
          temperature: 0.4,
          max_tokens: mode === "test" ? 80 : 900,
        }),
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`DeepSeek API 返回 ${response.status}：${detail.slice(0, 160)}`);
      }

      const payload = await response.json();
      const content = payload?.choices?.[0]?.message?.content?.trim();
      if (!content) throw new Error("DeepSeek 返回为空。");

      setDeepSeekState({
        status: "success",
        message: mode === "test" ? "DeepSeek API 连接正常。" : "已由 DeepSeek 生成，可复制给老师讨论。",
        result: content,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "未知错误";
      setDeepSeekState({
        status: "error",
        message: `API 暂时不可用，已显示本地回退结果。原因：${message}`,
        result: deepSeekFallbackText,
      });
    }
  };

  const requestEssayCorrection = async () => {
    const key = deepSeekApiKey.trim();
    const cleanEssay = essayText.trim();

    if (cleanEssay.length < 60) {
      setEssayCorrectionState({
        status: "error",
        message: "请先粘贴一篇较完整的作文/续写文本，再进行批改。",
        result: "至少建议输入 60 个以上字符；正式试用时可以直接复制学生作文原文到这里。",
      });
      return;
    }

    if (!key) {
      setEssayCorrectionState({
        status: "ready",
        message: "未填写 DeepSeek API Key，已展示本地样例批改。填入 Key 后可批改真实文本。",
        result: essayCorrectionFallbackText,
      });
      return;
    }

    setEssayCorrectionState({
      status: "loading",
      message: "正在请求 DeepSeek 批改作文...",
      result: essayCorrectionState.result,
    });

    try {
      const response = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: deepSeekModel,
          messages: [
            {
              role: "system",
              content: "你是高中英语作文批改与教研助手，输出要具体、克制、可落地，不编造学生隐私。",
            },
            {
              role: "user",
              content: buildEssayCorrectionPrompt({
                className: selectedClass,
                essayText: cleanEssay,
              }),
            },
          ],
          thinking: { type: "disabled" },
          temperature: 0.35,
          max_tokens: 1200,
        }),
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`DeepSeek API 返回 ${response.status}：${detail.slice(0, 160)}`);
      }

      const payload = await response.json();
      const content = payload?.choices?.[0]?.message?.content?.trim();
      if (!content) throw new Error("DeepSeek 返回为空。");

      setEssayCorrectionState({
        status: "success",
        message: "DeepSeek 已完成作文批改，可复制给老师讨论。",
        result: content,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "未知错误";
      setEssayCorrectionState({
        status: "error",
        message: `API 暂时不可用，已显示本地样例批改。原因：${message}`,
        result: essayCorrectionFallbackText,
      });
    }
  };

  const panelTitle = {
    overview: "教师总览",
    upload: "数据导入与解析",
    results: "批改结果",
    diagnosis: "单题错因分析",
    analytics: "班级学情可视化",
    reports: "报告生成与导出",
    ima: "DeepSeek / ima 助手",
    practice: "拓展练习生成",
    student: "学生学情跟踪",
  }[activePanel];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <GraduationCap size={24} />
          </div>
          <div>
            <p>英语备课组</p>
            <strong>学情分析平台</strong>
          </div>
        </div>

        <nav className="nav-list" aria-label="教师端导航">
          {teacherNav.map((item) => (
            <button
              className={activePanel === item.id ? "nav-item active" : "nav-item"}
              key={item.id}
              onClick={() => setActivePanel(item.id)}
              type="button"
              title={item.label}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="side-card">
          <div className="device-pair">
            <Monitor size={18} />
            <span>网页端</span>
            <Smartphone size={18} />
            <span>移动端</span>
          </div>
          <p>默认使用模拟数据；导入页可本地解析老师自带表格，不上传服务器。</p>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">合作校英语教研 · 演示数据</p>
            <h1>{panelTitle}</h1>
          </div>
          <div className="top-actions">
            <span className="data-badge">
              <ShieldCheck size={16} />
              本地解析 · 不上传
            </span>
            <label className="select-wrap">
              <Filter size={16} />
              <select
                value={selectedClass}
                onChange={(event) => setSelectedClass(event.target.value)}
              >
                {classSnapshots.map((snapshot) => (
                  <option key={snapshot.className} value={snapshot.className}>
                    {snapshot.className}
                  </option>
                ))}
              </select>
            </label>
            <div className="mode-switch">
              <button
                className={activePanel !== "student" ? "selected" : ""}
                onClick={() => setActivePanel("overview")}
                type="button"
              >
                教师
              </button>
              <button
                className={activePanel === "student" ? "selected" : ""}
                onClick={() => setActivePanel("student")}
                type="button"
              >
                学生
              </button>
            </div>
          </div>
        </header>

        {activePanel === "overview" && (
          <Overview
            classSnapshot={classSnapshot}
            lowQuestions={lowQuestions}
            onNavigate={setActivePanel}
            onSelectQuestion={(id) => {
              setSelectedQuestionId(id);
              setActivePanel("diagnosis");
            }}
          />
        )}
        {activePanel === "upload" && (
          <UploadPanel
            analysisReady={analysisReady}
            fileName={fileName}
            liveCsv={liveCsv}
            liveMessage={liveMessage}
            liveSummary={liveSummary}
            questionText={questionText}
            onAnalyzeLiveCsv={handleAnalyzeLiveCsv}
            onClearLiveData={handleClearLiveData}
            onDownloadLiveSample={() => downloadTextFile(liveDemoCsv, "shenzhen-english-demo-sample.csv")}
            onLiveDataFile={handleLiveDataFile}
            onLoadLiveSample={handleLoadLiveSample}
            setAnalysisReady={setAnalysisReady}
            setFileName={setFileName}
            setLiveCsv={setLiveCsv}
            setQuestionText={setQuestionText}
            onPublish={() => setActivePanel("results")}
          />
        )}
        {activePanel === "results" && (
          <ResultsPanel
            deepSeekApiKey={deepSeekApiKey}
            deepSeekModel={deepSeekModel}
            essayCorrectionState={essayCorrectionState}
            essayFileName={essayFileName}
            essayText={essayText}
            questions={assignment.questions}
            onCorrectEssay={requestEssayCorrection}
            onSelectQuestion={(id) => {
              setSelectedQuestionId(id);
              setActivePanel("diagnosis");
            }}
            setDeepSeekApiKey={setDeepSeekApiKey}
            setEssayFileName={setEssayFileName}
            setEssayText={setEssayText}
          />
        )}
        {activePanel === "diagnosis" && (
          <DiagnosisPanel
            attempts={filteredAttempts}
            question={selectedQuestion}
            questions={assignment.questions}
            selectedQuestionId={selectedQuestionId}
            setSelectedQuestionId={setSelectedQuestionId}
            onGeneratePractice={handleGeneratePractice}
          />
        )}
        {activePanel === "analytics" && <AnalyticsPanel />}
        {activePanel === "reports" && (
          <ReportsPanel
            copiedReport={copiedReport}
            selectedReportId={selectedReportId}
            setCopiedReport={setCopiedReport}
            setSelectedReportId={setSelectedReportId}
          />
        )}
        {activePanel === "ima" && (
          <ImaAssistantPanel
            classSnapshot={classSnapshot}
            copiedImaText={copiedImaText}
            deepSeekApiKey={deepSeekApiKey}
            deepSeekModel={deepSeekModel}
            deepSeekState={deepSeekState}
            liveSummary={liveSummary}
            onDeepSeekGenerate={requestDeepSeek}
            question={selectedQuestion}
            selectedClass={selectedClass}
            setCopiedImaText={setCopiedImaText}
            setDeepSeekApiKey={setDeepSeekApiKey}
            setDeepSeekModel={setDeepSeekModel}
          />
        )}
        {activePanel === "practice" && (
          <PracticePanel
            generated={generated}
            question={selectedQuestion}
            onGeneratePractice={handleGeneratePractice}
          />
        )}
        {activePanel === "student" && (
          <StudentPanel
            students={students}
            selectedStudentId={selectedStudentId}
            setSelectedStudentId={setSelectedStudentId}
            attempts={selectedStudentAttempts}
            wrongAttempts={wrongAttempts}
            questions={assignment.questions}
          />
        )}
      </main>

      <nav className="mobile-nav" aria-label="移动端导航">
        {mobileNav.map((item) => (
          <button
            className={activePanel === item.id ? "active" : ""}
            key={item.id}
            onClick={() => setActivePanel(item.id)}
            type="button"
            title={item.label}
          >
            <item.icon size={19} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function Overview({
  classSnapshot,
  lowQuestions,
  onNavigate,
  onSelectQuestion,
}: {
  classSnapshot: (typeof classSnapshots)[number];
  lowQuestions: QuestionItem[];
  onNavigate: (id: PanelId) => void;
  onSelectQuestion: (id: string) => void;
}) {
  return (
    <div className="page-grid">
      <section className="demo-hero panel">
        <div className="hero-copy">
          <span className="hero-kicker">
            <BadgeCheck size={16} />
            第一版 demo · 面向高中英语备课组
          </span>
          <h2>把批改结果变成可讨论、可追踪、可落课的学情证据</h2>
          <p>
            这版重点演示老师导入题目与成绩后，平台如何自动汇总批改结果、定位单题错因、生成班级学情图表，并把问题转化为下节课微训练和学生同类练习。
          </p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => onSelectQuestion(lowQuestions[0].id)} type="button">
              <SearchCheck size={16} />
              看最低分错题
            </button>
            <button className="secondary-button" onClick={() => onNavigate("upload")} type="button">
              <UploadCloud size={16} />
              体验导入流程
            </button>
          </div>
        </div>
        <div className="hero-proof">
          <div>
            <strong>9类</strong>
            <span>错因标签</span>
          </div>
          <div>
            <strong>6题型</strong>
            <span>阅读+续写覆盖</span>
          </div>
          <div>
            <strong>4步</strong>
            <span>批改到教学闭环</span>
          </div>
        </div>
      </section>

      <section className="panel priority-panel">
        <PanelHeader icon={Activity} title="今日教师工作台" action="先处理高价值动作" />
        <div className="priority-grid">
          <button className="priority-card accent" onClick={() => onSelectQuestion(lowQuestions[0].id)} type="button">
            <span>待讲评</span>
            <strong>Q{lowQuestions[0].number} {lowQuestions[0].questionType}</strong>
            <small>{percent(lowQuestions[0].correctRate)}正确率 · {lowQuestions[0].diagnosis.causes.slice(0, 2).join(" / ")}</small>
            <em>查看证据链</em>
          </button>
          <button className="priority-card" onClick={() => onNavigate("upload")} type="button">
            <span>试用入口</span>
            <strong>导入真实成绩</strong>
            <small>粘贴 Excel/CSV 后本地解析，不上传服务器</small>
            <em>进入导入台</em>
          </button>
          <button className="priority-card" onClick={() => onNavigate("analytics")} type="button">
            <span>学情判断</span>
            <strong>题-人-薄弱点</strong>
            <small>{classSnapshot.riskStudents}人需跟进 · 写作{classSnapshot.writingScore}/40</small>
            <em>看可视化</em>
          </button>
          <button className="priority-card" onClick={() => onNavigate("reports")} type="button">
            <span>汇报材料</span>
            <strong>生成周报话术</strong>
            <small>备课组、校长、家长三种口径可切换</small>
            <em>打开报告</em>
          </button>
          <button className="priority-card" onClick={() => onNavigate("student")} type="button">
            <span>学生端</span>
            <strong>个人错题跟踪</strong>
            <small>错因解释、掌握度变化、下一步任务</small>
            <em>查看学生</em>
          </button>
        </div>
      </section>

      <section className="metric-grid">
        <MetricCard
          icon={Target}
          label="班级平均正确率"
          tone="blue"
          value={percent(classSnapshot.averageAccuracy)}
          trend="+5.2% / 6周"
        />
        <MetricCard
          icon={ClipboardCheck}
          label="完成率"
          tone="green"
          value={percent(classSnapshot.completionRate)}
          trend="42/44 人"
        />
        <MetricCard
          icon={MessageSquareText}
          label="写作均分"
          tone="orange"
          value={`${classSnapshot.writingScore}/40`}
          trend="读后续写偏弱"
        />
        <MetricCard
          icon={AlertTriangle}
          label="需跟进学生"
          tone="red"
          value={`${classSnapshot.riskStudents} 人`}
          trend="连续两次低于60%"
        />
      </section>

      <section className="demo-flow">
        <button className="demo-step" onClick={() => onNavigate("upload")} type="button">
          <span>01</span>
          <strong>导入数据</strong>
          <small>识别试卷、成绩和能力标签</small>
        </button>
        <button className="demo-step" onClick={() => onNavigate("results")} type="button">
          <span>02</span>
          <strong>批改诊断</strong>
          <small>定位错题类型和共性错因</small>
        </button>
        <button className="demo-step" onClick={() => onNavigate("analytics")} type="button">
          <span>03</span>
          <strong>学情可视化</strong>
          <small>看班级、题型、能力变化</small>
        </button>
        <button className="demo-step" onClick={() => onNavigate("practice")} type="button">
          <span>04</span>
          <strong>推送练习</strong>
          <small>给学生同类迁移与订正建议</small>
        </button>
      </section>

      <section className="panel benchmark-panel">
        <PanelHeader icon={ShieldCheck} title="中小学平台能力补齐" action="参考竞品后加入" />
        <div className="benchmark-grid">
          {platformFeatureBenchmarks.map((item) => (
            <article className="benchmark-card" key={item.id}>
              <strong>{item.title}</strong>
              <p>{item.signal}</p>
              <span>{item.demoAction}</span>
            </article>
          ))}
        </div>
        <div className="closure-metrics">
          {closedLoopMetrics.map((item) => (
            <div key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <small>{item.detail}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="decision-grid">
        <div className="panel action-panel">
          <PanelHeader icon={ClipboardCheck} title="下节课建议" action="备课组可直接讨论" />
          <div className="action-list">
            <div>
              <span>12分钟</span>
              <strong>段落功能标注</strong>
              <p>围绕主旨与推断错题，先判断段落作用，再回到选项边界。</p>
            </div>
            <div>
              <span>8分钟</span>
              <strong>长难句证据链</strong>
              <p>把关键句拆成主干、修饰和指代对象，降低词义猜测误判。</p>
            </div>
            <div>
              <span>课后</span>
              <strong>同类迁移练习</strong>
              <p>给错误学生推送 2 道同类题，要求写出排除选项理由。</p>
            </div>
          </div>
        </div>

        <div className="panel capability-panel">
          <PanelHeader icon={GraduationCap} title="高考能力映射" action="教考衔接口径" />
          <div className="capability-list">
            {[
              ["阅读理解", "主旨、推断、细节、词义猜测"],
              ["综合读写", "读后续写情节证据链与语言连贯"],
              ["语言能力", "词汇语境、长难句、语法结构"],
              ["思维品质", "概括、推断、判断选项边界"],
            ].map(([title, detail]) => (
              <div key={title}>
                <strong>{title}</strong>
                <span>{detail}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="panel intervention-panel">
        <PanelHeader icon={Users} title="分层干预看板" action="按错因自动成组" />
        <div className="intervention-grid">
          {interventionGroups.map((group) => (
            <article className={`intervention-card ${group.tone}`} key={group.id}>
              <div className="intervention-head">
                <span>{group.count}人</span>
                <strong>{group.title}</strong>
              </div>
              <p>{group.basis}</p>
              <div className="intervention-action">
                <small>{group.owner}</small>
                <b>{group.action}</b>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="two-column">
        <div className="panel chart-panel">
          <PanelHeader
            icon={LineChart}
            title="六周能力趋势"
            action="阅读与写作同步提升"
          />
          <div className="chart-frame">
            <ResponsiveContainer height={260} width="100%">
              <AreaChart data={accuracyTrend} margin={{ top: 10, right: 20, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="reading" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e6eaf1" strokeDasharray="3 3" />
                <XAxis dataKey="week" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} domain={[40, 90]} />
                <Tooltip />
                <Area
                  dataKey="阅读"
                  stroke="#2563eb"
                  fill="url(#reading)"
                  strokeWidth={3}
                  type="monotone"
                  isAnimationActive={false}
                />
                <Line dataKey="写作" stroke="#f97316" strokeWidth={3} type="monotone" isAnimationActive={false} />
                <Line dataKey="听说" stroke="#16a34a" strokeWidth={3} type="monotone" isAnimationActive={false} />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel">
          <PanelHeader icon={AlertTriangle} title="重点错题排行" action="按正确率升序" />
          <div className="question-rank">
            {lowQuestions.slice(0, 5).map((question) => (
              <button
                className="rank-row"
                key={question.id}
                onClick={() => onSelectQuestion(question.id)}
                type="button"
              >
                <span className="rank-number">Q{question.number}</span>
                <span>
                  <strong>{question.questionType}</strong>
                  <small>{question.diagnosis.causes.join(" / ")}</small>
                </span>
                <b>{percent(question.correctRate)}</b>
                <ChevronRight size={18} />
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="panel insight-strip">
        <div className="strip-copy">
          <PanelHeader icon={BadgeCheck} title="教考衔接依据" action="广东 2026" />
          <p>
            英语听说考试成绩按卷面分除以 3 计入英语科；新课标卷强化阅读、写作、真实情境和思维品质。当前班级最需要把“错因标签”转化为课堂微技能训练。
          </p>
        </div>
        <div className="source-links">
          <a href="https://eea.gd.gov.cn/ptgk/content/post_4881153.html" target="_blank">
            广东英语听说成绩 <ExternalLink size={14} />
          </a>
          <a href="https://www.neea.edu.cn/xhtml1/report/2401/499-1.htm" target="_blank">
            新课标卷解读 <ExternalLink size={14} />
          </a>
          <a href="https://www.sohu.com/a/1033862114_121106884" target="_blank">
            2026英语评析 <ExternalLink size={14} />
          </a>
        </div>
      </section>
    </div>
  );
}

function UploadPanel({
  analysisReady,
  fileName,
  liveCsv,
  liveMessage,
  liveSummary,
  questionText,
  onAnalyzeLiveCsv,
  onClearLiveData,
  onDownloadLiveSample,
  onLiveDataFile,
  onLoadLiveSample,
  setAnalysisReady,
  setFileName,
  setLiveCsv,
  setQuestionText,
  onPublish,
}: {
  analysisReady: boolean;
  fileName: string;
  liveCsv: string;
  liveMessage: string;
  liveSummary: LiveDataSummary | null;
  questionText: string;
  onAnalyzeLiveCsv: (value?: string) => void;
  onClearLiveData: () => void;
  onDownloadLiveSample: () => void;
  onLiveDataFile: (file: File) => void;
  onLoadLiveSample: () => void;
  setAnalysisReady: (value: boolean) => void;
  setFileName: (value: string) => void;
  setLiveCsv: (value: string) => void;
  setQuestionText: (value: string) => void;
  onPublish: () => void;
}) {
  const liveInputRef = useRef<HTMLTextAreaElement | null>(null);

  return (
    <div className="upload-layout">
      <section className="panel upload-card">
        <PanelHeader icon={UploadCloud} title="数据导入中心" action="PDF / Excel / 阅卷 / 表单" />
        <div className="demo-notice">
          <ShieldCheck size={17} />
          <span>文件解析入口为模拟流程；真实成绩表可在下方试用台本地解析，不会保存到服务器。</span>
        </div>
        <div className="import-source-grid">
          {importSources.map((source) => (
            <article className="import-source-card" key={source.id}>
              <span>{source.status}</span>
              <strong>{source.title}</strong>
              <p>{source.description}</p>
              <small>{source.sample}</small>
            </article>
          ))}
        </div>
        <label className="drop-zone">
          <UploadCloud size={34} />
          <span>{fileName}</span>
          <small>点击选择文件，演示版会生成模拟解析结果</small>
          <input
            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                setFileName(file.name);
                setAnalysisReady(false);
                window.setTimeout(() => setAnalysisReady(true), 500);
              }
            }}
            type="file"
          />
        </label>
        <div className="upload-actions">
          <button
            className="secondary-button"
            onClick={() => {
              setQuestionText(sampleQuestionText);
              setAnalysisReady(true);
            }}
            type="button"
          >
            <RefreshCw size={16} />
            恢复样例
          </button>
          <button className="primary-button" onClick={onPublish} type="button">
            <Send size={16} />
            发布练习
          </button>
        </div>
      </section>

      <section className="panel editor-card">
        <PanelHeader icon={FileText} title="题目文本" action="自动识别题型与答案" />
        <textarea
          value={questionText}
          onChange={(event) => {
            setQuestionText(event.target.value);
            setAnalysisReady(event.target.value.trim().length > 40);
          }}
        />
      </section>

      <section className="panel parse-card">
        <PanelHeader icon={Sparkles} title="解析确认" action={analysisReady ? "已完成 · 老师可编辑" : "解析中"} />
        <div className="parse-steps">
          {[
            ["题型识别", "阅读理解 · 推理判断"],
            ["答案抽取", "参考答案 D"],
            ["能力标签", "语篇逻辑 / 高考拓展"],
            ["评分入口", "选择题 + 续写量规"],
          ].map(([title, value], index) => (
            <div className="parse-step" key={title}>
              <span className={analysisReady || index < 2 ? "step-dot done" : "step-dot"} />
              <div>
                <strong>{title}</strong>
                <small>{value}</small>
              </div>
            </div>
          ))}
        </div>
        <div className="field-mapping">
          <div className="field-title">
            <span>字段映射预览</span>
            <small>来源字段会先匿名化，再进入学情分析</small>
          </div>
          <div className="field-head">
            <span>来源字段</span>
            <span>平台字段</span>
            <span>状态</span>
          </div>
          {fieldMappingRows.map((row) => (
            <div className="field-row" key={`${row.source}-${row.target}`}>
              <strong>{row.source}</strong>
              <span>{row.target}</span>
              <b>{row.quality}</b>
              <small>{row.note}</small>
            </div>
          ))}
        </div>
        <div className="mini-table">
          <div>
            <span>识别题数</span>
            <b>6</b>
          </div>
          <div>
            <span>预计批改</span>
            <b>44人</b>
          </div>
          <div>
            <span>错因标签</span>
            <b>9类</b>
          </div>
        </div>
      </section>

      <section className="panel live-data-card">
        <PanelHeader icon={ClipboardList} title="真实数据试用台" action="本地解析 · 不上传" />
        <div className="live-privacy-note">
          <ShieldCheck size={17} />
          <span>可以粘贴 Excel 表格或上传 CSV。数据只在当前浏览器里计算，不会发送到服务器；预览默认匿名化学生姓名。</span>
        </div>
        <div className="live-toolbar">
          <button className="secondary-button" onClick={onLoadLiveSample} type="button">
            <RefreshCw size={16} />
            载入样例
          </button>
          <button
            className="primary-button"
            onClick={() => onAnalyzeLiveCsv(liveInputRef.current?.value ?? liveCsv)}
            type="button"
          >
            <Sparkles size={16} />
            解析学情
          </button>
          <button className="secondary-button" onClick={onDownloadLiveSample} type="button">
            <Download size={16} />
            下载样例CSV
          </button>
          <label className="secondary-button file-button">
            <UploadCloud size={16} />
            上传CSV
            <input
              accept=".csv,.txt,.tsv"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onLiveDataFile(file);
              }}
              type="file"
            />
          </label>
          <button className="secondary-button" onClick={onClearLiveData} type="button">
            清空
          </button>
        </div>
        <div className="paste-target-hint">
          <strong>复制粘贴位置</strong>
          <span>把下面给老师看的 CSV/Excel 数据粘贴到这个大输入框，再点击“解析学情”。</span>
        </div>
        <textarea
          className="live-data-input"
          onChange={(event) => setLiveCsv(event.target.value)}
          placeholder="从 Excel 复制表头和学生成绩后粘贴到这里，或上传 CSV 文件。"
          ref={liveInputRef}
          value={liveCsv}
        />
        <div className={liveSummary ? "live-message ready" : "live-message"}>
          <CircleCheck size={16} />
          <span>{liveMessage}</span>
        </div>
        {liveSummary ? (
          <div className="live-analysis">
            <div className="live-metrics">
              <MetricCard
                icon={Users}
                label="已解析学生"
                tone="blue"
                value={`${liveSummary.rowCount}人`}
                trend={liveSummary.classNames.join(" / ")}
              />
              <MetricCard
                icon={Target}
                label="平均得分"
                tone="green"
                value={`${liveSummary.averageTotal.toFixed(1)}/${liveSummary.maxTotal}`}
                trend={`达成率 ${percent(liveSummary.averageRate)}`}
              />
              <MetricCard
                icon={AlertTriangle}
                label="需跟进"
                tone="red"
                value={`${liveSummary.riskCount}人`}
                trend="低于60%或薄弱项较多"
              />
              <MetricCard
                icon={ClipboardCheck}
                label="订正完成"
                tone="orange"
                value={`${liveSummary.completedCorrection}/${liveSummary.rowCount}`}
                trend="来自订正完成列"
              />
            </div>
            <div className="live-detail-grid">
              <div className="live-weak-panel">
                <strong>薄弱题与即时教学建议</strong>
                {liveSummary.weakItems.map((item) => (
                  <article className="live-weak-row" key={item.field}>
                    <div>
                      <span>{item.type}</span>
                      <strong>{item.label}</strong>
                      <small>{item.cause} · {item.weakCount}人需跟进</small>
                    </div>
                    <b>{percent(item.averageRate)}</b>
                    <p>{item.suggestion}</p>
                  </article>
                ))}
              </div>
              <div className="live-weak-panel compact">
                <strong>高频错因</strong>
                {liveSummary.causeCounts.map((item) => (
                  <div className="cause-count-row" key={item.cause}>
                    <span>{item.cause}</span>
                    <b>{item.count}次</b>
                  </div>
                ))}
              </div>
            </div>
            <div className="live-preview">
              <div className="field-title">
                <span>匿名学生预览</span>
                <small>真实姓名不会在预览里完整显示</small>
              </div>
              <div className="live-preview-head">
                <span>学生</span>
                <span>班级</span>
                <span>总分</span>
                <span>薄弱项</span>
              </div>
              {liveSummary.students.map((student) => (
                <div className="live-preview-row" key={student.id}>
                  <strong>{student.displayName}</strong>
                  <span>{student.className}</span>
                  <span>{student.total.toFixed(1)}</span>
                  <b>{student.weakItems.length}项</b>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="empty-live-state">
            <ClipboardList size={24} />
            <span>粘贴或上传数据后，点击“解析学情”生成即时看板。</span>
          </div>
        )}
      </section>
    </div>
  );
}

function ResultsPanel({
  deepSeekApiKey,
  deepSeekModel,
  essayCorrectionState,
  essayFileName,
  essayText,
  questions,
  onCorrectEssay,
  onSelectQuestion,
  setDeepSeekApiKey,
  setEssayFileName,
  setEssayText,
}: {
  deepSeekApiKey: string;
  deepSeekModel: string;
  essayCorrectionState: DeepSeekState;
  essayFileName: string;
  essayText: string;
  questions: QuestionItem[];
  onCorrectEssay: () => void;
  onSelectQuestion: (id: string) => void;
  setDeepSeekApiKey: (value: string) => void;
  setEssayFileName: (value: string) => void;
  setEssayText: (value: string) => void;
}) {
  const handleEssayFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setEssayFileName(file.name);
      setEssayText(String(reader.result ?? ""));
    };
    reader.readAsText(file, "utf-8");
    event.target.value = "";
  };

  return (
    <div className="page-grid">
      <section className="metric-grid">
        <MetricCard icon={CircleCheck} label="自动判分" tone="green" value="264份" trend="选择题已完成" />
        <MetricCard icon={Brain} label="AI反馈" tone="blue" value="72条" trend="作文与续写建议" />
        <MetricCard icon={Target} label="低分题" tone="red" value="3题" trend="正确率低于60%" />
        <MetricCard icon={Download} label="导出" tone="orange" value="Excel" trend="班级与个人报告" />
      </section>

      <section className="panel">
        <PanelHeader icon={FileCheck2} title="题目批改结果" action="点击查看诊断" />
        <div className="result-table">
          <div className="table-head">
            <span>题号</span>
            <span>题型</span>
            <span>正确率</span>
            <span>主要误因</span>
            <span>操作</span>
          </div>
          {questions.map((question) => (
            <button
              className="table-row"
              key={question.id}
              onClick={() => onSelectQuestion(question.id)}
              type="button"
            >
              <span>Q{question.number}</span>
              <span>{question.questionType}</span>
              <span>
                <Progress value={question.correctRate * 100} />
              </span>
              <span>{question.diagnosis.causes.slice(0, 2).join(" / ")}</span>
              <span className="row-action">
                查看 <ChevronRight size={16} />
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="panel essay-live-panel">
        <PanelHeader
          icon={Sparkles}
          title="作文批改试用台"
          action={deepSeekApiKey ? `DeepSeek · ${deepSeekModel}` : "无 Key 先看样例"}
        />
        <div className="essay-live-grid">
          <div className="essay-live-editor">
            <div className="essay-live-meta">
              <span>作文/续写原文</span>
              <b>{essayFileName}</b>
            </div>
            <label className="essay-key-row">
              <span>DeepSeek Key</span>
              <input
                autoComplete="off"
                onChange={(event) => setDeepSeekApiKey(event.target.value)}
                placeholder="可选：粘贴 Key 后批改真实文本"
                type="password"
                value={deepSeekApiKey}
              />
              <small>{deepSeekApiKey ? "已保存在本机浏览器，本页可直接批改。" : "不填 Key 会显示本地样例批改结果。"}</small>
            </label>
            <textarea
              className="essay-live-input"
              onChange={(event) => setEssayText(event.target.value)}
              placeholder="把学生作文、读后续写或应用文原文粘贴到这里。演示版支持 txt/csv 文本上传；Word/PDF 可在正式版接入解析服务。"
              value={essayText}
            />
            <div className="essay-live-actions">
              <label className="secondary-button file-button">
                <UploadCloud size={16} />
                上传文本
                <input accept=".txt,.csv,.md,text/plain,text/csv" onChange={handleEssayFileChange} type="file" />
              </label>
              <button
                className="secondary-button"
                onClick={() => {
                  setEssayText(demoEssayText);
                  setEssayFileName("样例续写作文.txt");
                }}
                type="button"
              >
                <RefreshCw size={16} />
                载入样例
              </button>
              <button
                className="primary-button"
                disabled={essayCorrectionState.status === "loading"}
                onClick={onCorrectEssay}
                type="button"
              >
                <Sparkles size={16} />
                {essayCorrectionState.status === "loading" ? "批改中" : "批改作文"}
              </button>
            </div>
            <p className="essay-live-note">
              点击批改才会把文本发送给 DeepSeek；给真实学生试用时建议先去姓名、学号等个人信息。无 API Key 时会展示本地样例结果，保证演示不断。
            </p>
          </div>
          <div className={`deepseek-output essay-correction-output ${essayCorrectionState.status}`}>
            <span>{essayCorrectionState.message}</span>
            <pre>{essayCorrectionState.result || "这里会显示作文总评、40分制得分、片段批注、修改示范、同类微练习和教学启示。"}</pre>
            <button
              className="secondary-button"
              disabled={!essayCorrectionState.result}
              onClick={() => {
                void navigator.clipboard?.writeText(essayCorrectionState.result);
              }}
              type="button"
            >
              <ClipboardCheck size={16} />
              复制批改结果
            </button>
          </div>
        </div>
      </section>

      <section className="panel rubric-panel">
        <PanelHeader icon={BadgeCheck} title="高考写作评分标准库" action="应用文 / 读后续写 / 40分综合" />
        <div className="rubric-standard-grid">
          {writingRubricStandards.map((standard) => (
            <article className="rubric-standard-card" key={standard.id}>
              <div className="rubric-standard-head">
                <span>{standard.examUse}</span>
                <strong>{standard.title}</strong>
                <b>{standard.totalScore}分</b>
              </div>
              <p>{standard.summary}</p>
              <div className="rubric-dimension-list">
                {standard.dimensions.slice(0, 4).map((dimension) => (
                  <div key={dimension.name}>
                    <span>{dimension.weight}分</span>
                    <strong>{dimension.name}</strong>
                    <small>{dimension.teacherCheck}</small>
                  </div>
                ))}
              </div>
              <div className="rubric-band-list">
                {standard.bands.slice(0, 3).map((band) => (
                  <span key={`${standard.id}-${band.label}`}>
                    {band.label} {band.scoreRange}
                  </span>
                ))}
              </div>
              <a href={standard.sourceUrl} rel="noreferrer" target="_blank">
                {standard.sourceLabel} <ExternalLink size={13} />
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="panel essay-stress-panel">
        <PanelHeader icon={Activity} title="批量模拟测试数据" action={`${essayStressSummary.total}篇 · 本地压力测试`} />
        <div className="stress-summary-grid">
          <div>
            <span>应用文</span>
            <strong>{essayStressSummary.application}</strong>
          </div>
          <div>
            <span>读后续写</span>
            <strong>{essayStressSummary.continuation}</strong>
          </div>
          {essayStressSummary.bands.map((item) => (
            <div key={item.band}>
              <span>{item.band}</span>
              <strong>{item.count}</strong>
            </div>
          ))}
        </div>
        <div className="stress-sample-grid">
          {essayStressSamples.slice(0, 6).map((sample) => (
            <article key={sample.id}>
              <span>{sample.type} · {sample.band}</span>
              <strong>{sample.id} · {sample.expectedScore}分</strong>
              <p>{sample.mainIssue}</p>
            </article>
          ))}
        </div>
        <div className="stress-actions">
          <button
            className="secondary-button"
            onClick={() => downloadTextFile(essayStressCsv, "essay-correction-stress-samples.csv")}
            type="button"
          >
            <Download size={16} />
            下载模拟作文数据
          </button>
          {essayStressSummary.passCriteria.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>

      <section className="panel rubric-panel">
        <PanelHeader icon={MessageSquareText} title="续写 Rubric 与 QuickMarks" action="标准化反馈示例" />
        <div className="rubric-table">
          <div className="rubric-head">
            <span>维度</span>
            <span>得分</span>
            <span>主要问题</span>
            <span>可复用评语</span>
          </div>
          {writingRubricRows.map((row) => (
            <div className="rubric-row" key={row.criterion}>
              <strong>{row.criterion}</strong>
              <b>{row.score}</b>
              <span>{row.issue}</span>
              <span>{row.quickMark}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel essay-workbench">
        <PanelHeader icon={MessageSquareText} title="作文批改工作台" action="原文批注 + 二次修改" />
        <div className="essay-grid">
          <article className="essay-original">
            <span>{essayWorkbench.student} · {essayWorkbench.task}</span>
            <p>{essayWorkbench.original}</p>
          </article>
          <article className="essay-comments">
            <strong>逐句批注</strong>
            {essayWorkbench.inlineComments.map((item) => (
              <div className="essay-comment" key={`${item.fragment}-${item.type}`}>
                <span>{item.type}</span>
                <b>{item.fragment}</b>
                <p>{item.comment}</p>
              </div>
            ))}
          </article>
          <article className="essay-score-card">
            <strong>Rubric 得分</strong>
            {essayWorkbench.scores.map((score) => (
              <div className="essay-score" key={score.label}>
                <span>{score.label}</span>
                <b>{score.value}/{score.max}</b>
                <Progress value={(score.value / score.max) * 100} />
              </div>
            ))}
          </article>
        </div>
        <div className="essay-revision">
          <div>
            <span>AI 修改建议 · 老师可编辑</span>
            <p>{essayWorkbench.revision}</p>
          </div>
          <div className="teacher-control-list">
            {essayWorkbench.teacherControl.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function DiagnosisPanel({
  attempts,
  question,
  questions,
  selectedQuestionId,
  setSelectedQuestionId,
  onGeneratePractice,
}: {
  attempts: StudentAttempt[];
  question: QuestionItem;
  questions: QuestionItem[];
  selectedQuestionId: string;
  setSelectedQuestionId: (id: string) => void;
  onGeneratePractice: () => void;
}) {
  const wrongAttempts = attempts.filter((attempt) => attempt.questionId === question.id && !attempt.isCorrect);
  const rightAttempts = attempts.filter((attempt) => attempt.questionId === question.id && attempt.isCorrect);
  const wrongRate = attempts.length ? wrongAttempts.length / attempts.length : 0;
  const optionRows =
    question.id === "q3"
      ? optionMisconceptions
      : [
          {
            option: question.topWrongOption,
            share: Math.round((1 - question.correctRate) * 100),
            misconception: `学生把“${question.diagnosis.causes[0]}”问题当成局部信息定位问题处理，导致选项边界判断偏差。`,
            evidence: question.diagnosis.evidence,
            action: question.diagnosis.teachingInsight.suggestion,
          },
          {
            option: "次高误选",
            share: 14,
            misconception: "能找到原文线索，但没有验证选项是否过度概括或偷换概念。",
            evidence: "这类学生通常用时不长，说明答题策略过快。",
            action: "要求学生写出“保留选项”和“排除选项”的证据句。",
          },
        ];

  return (
    <div className="diagnosis-layout">
      <section className="panel question-picker">
        <PanelHeader icon={ClipboardList} title="题目列表" action={assignment.title} />
        <div className="chip-list vertical">
          {questions.map((item) => (
            <button
              className={selectedQuestionId === item.id ? "question-chip active" : "question-chip"}
              key={item.id}
              onClick={() => setSelectedQuestionId(item.id)}
              type="button"
            >
              <span>Q{item.number}</span>
              <strong>{item.questionType}</strong>
              <small>{percent(item.correctRate)}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="panel diagnosis-main">
        <div className="diagnosis-heading">
          <div>
            <p className="eyebrow">{question.passageTheme}</p>
            <h2>Q{question.number}. {question.title}</h2>
          </div>
          <button className="primary-button" onClick={onGeneratePractice} type="button">
            <Sparkles size={16} />
            生成同类练习
          </button>
        </div>

        <div className="diagnosis-cards">
          <div className="diagnosis-card">
            <span>错题类型</span>
            <strong>{question.questionType}</strong>
            <small>参考答案：{question.answer}</small>
          </div>
          <div className="diagnosis-card">
            <span>错误比例</span>
            <strong>{percent(wrongRate || 1 - question.correctRate)}</strong>
            <small>主要误选：{question.topWrongOption}</small>
          </div>
          <div className="diagnosis-card">
            <span>平均用时</span>
            <strong>{question.averageTime}s</strong>
            <small>{question.averageTime > 180 ? "写作题" : "阅读题"}</small>
          </div>
        </div>

        <div className="reason-block">
          <PanelHeader icon={SearchCheck} title="错误原因分析" action="题型 + 错因 + 证据" />
          <div className="tag-row">
            {question.diagnosis.causes.map((cause) => (
              <span className="tag" key={cause}>{cause}</span>
            ))}
          </div>
          <p>{question.diagnosis.evidence}</p>
          <p>{question.diagnosis.narrative}</p>
        </div>

        <div className="teacher-output">
          <span>可落地输出</span>
          <strong>备课组可以把这道题拆成“错因讲评 + 变式训练 + 课后跟进”三段式微课。</strong>
        </div>

        <div className="option-analysis">
          <PanelHeader icon={Brain} title="误选项与学生误区" action="选项级 item analysis" />
          <div className="option-list">
            {optionRows.map((row) => (
              <article className="option-row" key={row.option}>
                <div className="option-share">
                  <strong>{row.option}</strong>
                  <span>{row.share}%</span>
                </div>
                <div>
                  <b>{row.misconception}</b>
                  <p>{row.evidence}</p>
                  <small>{row.action}</small>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="insight-grid">
          <div className="insight-box">
            <h3>教学启示</h3>
            <strong>{question.diagnosis.teachingInsight.title}</strong>
            <p>{question.diagnosis.teachingInsight.suggestion}</p>
          </div>
          <div className="insight-box">
            <h3>教考衔接</h3>
            <strong>{question.diagnosis.teachingInsight.focus}</strong>
            <p>{question.diagnosis.teachingInsight.gaokaoAlignment}</p>
          </div>
        </div>
      </section>

      <section className="panel student-split">
        <PanelHeader icon={Users} title="学生分布" action={`${rightAttempts.length} 对 / ${wrongAttempts.length} 错`} />
        <div className="donut-wrap">
          <div
            className="donut"
            style={{
              background: `conic-gradient(#2563eb 0 ${question.correctRate * 360}deg, #f59e0b ${question.correctRate * 360}deg 360deg)`,
            }}
          >
            <span>{percent(question.correctRate)}</span>
          </div>
          <div className="legend-list">
            <span><i className="blue" />正确</span>
            <span><i className="amber" />错误</span>
          </div>
        </div>
        <div className="wrong-list">
          {wrongAttempts.slice(0, 6).map((attempt) => (
            <div className="wrong-student" key={`${attempt.studentId}-${attempt.questionId}`}>
              <span>{attempt.studentName}</span>
              <small>{attempt.cause}</small>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function AnalyticsPanel() {
  return (
    <div className="analytics-grid">
      <section className="panel chart-panel wide">
        <PanelHeader icon={BarChart3} title="题型 × 错因堆叠" action="阅读理解重点复盘" />
        <div className="chart-takeaway">
          当前最集中的问题不是单纯“不会做题”，而是篇章逻辑、词汇语境和审题边界叠加影响。
        </div>
        <div className="chart-frame">
          <ResponsiveContainer height={280} width="100%">
            <BarChart data={causeStack} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#e6eaf1" strokeDasharray="3 3" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="词汇" stackId="a" fill="#2563eb" radius={[4, 4, 0, 0]} isAnimationActive={false} />
              <Bar dataKey="句法" stackId="a" fill="#0f766e" radius={[4, 4, 0, 0]} isAnimationActive={false} />
              <Bar dataKey="篇章" stackId="a" fill="#f97316" radius={[4, 4, 0, 0]} isAnimationActive={false} />
              <Bar dataKey="审题" stackId="a" fill="#dc2626" radius={[4, 4, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="panel chart-panel">
        <PanelHeader icon={Activity} title="学生能力雷达" action="年级均值" />
        <div className="chart-frame">
          <ResponsiveContainer height={280} width="100%">
            <RadarChart data={skillRadar}>
              <PolarGrid stroke="#d9e1ec" />
              <PolarAngleAxis dataKey="skill" tick={{ fill: "#475569", fontSize: 12 }} />
              <Radar
                dataKey="value"
                fill="#2563eb"
                fillOpacity={0.22}
                stroke="#2563eb"
                strokeWidth={3}
                isAnimationActive={false}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="panel heatmap-panel">
        <PanelHeader icon={Target} title="题型热力图" action="正确率 %" />
        <div className="heatmap">
          <div className="heatmap-row header">
            <span />
            {heatmapColumns.map((column) => (
              <b key={column}>{column}</b>
            ))}
          </div>
          {heatmap.map((row) => (
            <div className="heatmap-row" key={row.row}>
              <strong>{row.row}</strong>
              {row.values.map((value, index) => (
                <span
                  className="heat-cell"
                  key={`${row.row}-${heatmapColumns[index]}`}
                  style={{
                    backgroundColor:
                      value < 55 ? "#fee2e2" : value < 65 ? "#ffedd5" : value < 75 ? "#dbeafe" : "#dcfce7",
                    color: value < 55 ? "#991b1b" : value < 65 ? "#9a3412" : value < 75 ? "#1e40af" : "#166534",
                  }}
                >
                  {value}
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="panel knowledge-panel full">
        <PanelHeader icon={Brain} title="英语知识与能力图谱" action="能力点 -> 错因 -> 任务" />
        <div className="knowledge-map">
          {knowledgeGraphNodes.map((node) => (
            <article className="knowledge-node" key={node.skill}>
              <div>
                <span>{node.skill}</span>
                <strong>{node.mastery}%</strong>
              </div>
              <Progress value={node.mastery} />
              <p>{node.evidence}</p>
              <small>{node.linkedTask}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="panel repeated-error-panel full">
        <PanelHeader icon={RefreshCw} title="重复错因追踪" action="跨周复现 -> 干预 -> 再测" />
        <div className="repeat-track-grid">
          {repeatedErrorTracks.map((item) => (
            <article className={`repeat-track-card ${item.retest === "未达标" ? "risk" : item.retest === "进行中" ? "active" : "done"}`} key={item.skill}>
              <div>
                <span>{item.weeks}</span>
                <strong>{item.skill}</strong>
                <b>{item.students}人</b>
              </div>
              <p>{item.evidence}</p>
              <small>{item.intervention}</small>
              <em>{item.retest}</em>
            </article>
          ))}
        </div>
      </section>

      <section className="panel warning-panel">
        <PanelHeader icon={AlertTriangle} title="学生预警中心" action="连续风险自动入列" />
        <div className="warning-list">
          {warningCases.map((item) => (
            <article className={`warning-card level-${item.level}`} key={item.student}>
              <div className="warning-head">
                <strong>{item.student}</strong>
                <span>{item.level}风险</span>
              </div>
              <p>{item.reason}</p>
              <small>{item.action}</small>
              <b>{item.owner}</b>
            </article>
          ))}
        </div>
      </section>

      <section className="panel lesson-plan-panel">
        <PanelHeader icon={ClipboardCheck} title="讲评课备课单" action="课前-课中-课后闭环" />
        <div className="lesson-brief">
          {reviewLessonPlan.map((item) => (
            <article key={item.phase}>
              <span>{item.phase}</span>
              <strong>{item.title}</strong>
              <p>{item.output}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel chart-panel wide">
        <PanelHeader icon={LineChart} title="分项正确率趋势" action="阅读 / 写作 / 听说" />
        <div className="chart-frame">
          <ResponsiveContainer height={240} width="100%">
            <ReLineChart data={accuracyTrend} margin={{ top: 10, right: 22, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#e6eaf1" strokeDasharray="3 3" />
              <XAxis dataKey="week" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} domain={[40, 90]} />
              <Tooltip />
              <Legend />
              <Line dataKey="阅读" stroke="#2563eb" strokeWidth={3} type="monotone" isAnimationActive={false} />
              <Line dataKey="写作" stroke="#f97316" strokeWidth={3} type="monotone" isAnimationActive={false} />
              <Line dataKey="听说" stroke="#16a34a" strokeWidth={3} type="monotone" isAnimationActive={false} />
            </ReLineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="panel report-preview-panel full">
        <PanelHeader icon={Download} title="周报与家校沟通预览" action="可导出摘要" />
        <div className="report-preview-grid">
          {reportPreviewItems.map((item) => (
            <article key={item.audience}>
              <span>{item.audience}</span>
              <strong>{item.title}</strong>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function ReportsPanel({
  copiedReport,
  selectedReportId,
  setCopiedReport,
  setSelectedReportId,
}: {
  copiedReport: string;
  selectedReportId: string;
  setCopiedReport: (value: string) => void;
  setSelectedReportId: (value: string) => void;
}) {
  const selectedReport =
    reportTemplates.find((item) => item.id === selectedReportId) ?? reportTemplates[0];
  const reportText = `${selectedReport.title}\n\n${selectedReport.body}\n\n${selectedReport.bullets
    .map((item) => `- ${item}`)
    .join("\n")}`;

  const handleCopy = () => {
    void navigator.clipboard?.writeText(reportText);
    setCopiedReport(selectedReport.id);
  };

  return (
    <div className="reports-layout">
      <section className="panel report-switch-panel">
        <PanelHeader icon={FileText} title="报告类型" action="一键生成 · 老师可编辑" />
        <div className="report-type-list">
          {reportTemplates.map((item) => (
            <button
              className={selectedReport.id === item.id ? "report-type active" : "report-type"}
              key={item.id}
              onClick={() => setSelectedReportId(item.id)}
              type="button"
            >
              <span>{item.audience}</span>
              <strong>{item.title}</strong>
              <small>{item.tone}语气</small>
            </button>
          ))}
        </div>
        <div className="privacy-note">
          <ShieldCheck size={16} />
          <span>家长版默认隐藏班级排名，只展示进步、风险和下一步任务。</span>
        </div>
      </section>

      <section className="panel report-editor-panel">
        <PanelHeader icon={MessageSquareText} title={selectedReport.title} action={`${selectedReport.audience} · ${selectedReport.tone}`} />
        <div className="report-toolbar">
          <button className="primary-button" onClick={handleCopy} type="button">
            <ClipboardCheck size={16} />
            {copiedReport === selectedReport.id ? "已复制" : "复制报告"}
          </button>
          <button className="secondary-button" type="button">
            <Download size={16} />
            下载 PDF
          </button>
          <button className="secondary-button" type="button">
            <Sparkles size={16} />
            改写语气
          </button>
        </div>
        <article className="report-document">
          <span>AI 初稿 · 老师可编辑</span>
          <h2>{selectedReport.title}</h2>
          <p>{selectedReport.body}</p>
          <ul>
            {selectedReport.bullets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="panel report-delivery-panel">
        <PanelHeader icon={Send} title="发送前检查" action="备课组 / 学生 / 家长" />
        <div className="delivery-checks">
          {[
            ["数据口径", "已使用模拟周测与错因数据"],
            ["隐私处理", selectedReport.id === "parent" ? "已隐藏排名与班级比较" : "仅展示匿名学生编号"],
            ["下一步任务", "已包含订正、同类练习与再测提醒"],
          ].map(([title, detail]) => (
            <div key={title}>
              <CircleCheck size={16} />
              <strong>{title}</strong>
              <span>{detail}</span>
            </div>
          ))}
        </div>
        <div className="report-preview-grid compact">
          {reportPreviewItems.map((item) => (
            <article key={item.audience}>
              <span>{item.audience}</span>
              <strong>{item.title}</strong>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function ImaAssistantPanel({
  classSnapshot,
  copiedImaText,
  deepSeekApiKey,
  deepSeekModel,
  deepSeekState,
  liveSummary,
  onDeepSeekGenerate,
  question,
  selectedClass,
  setCopiedImaText,
  setDeepSeekApiKey,
  setDeepSeekModel,
}: {
  classSnapshot: (typeof classSnapshots)[number];
  copiedImaText: string;
  deepSeekApiKey: string;
  deepSeekModel: string;
  deepSeekState: DeepSeekState;
  liveSummary: LiveDataSummary | null;
  onDeepSeekGenerate: (mode: "test" | "teaching" | "practice" | "report") => void;
  question: QuestionItem;
  selectedClass: string;
  setCopiedImaText: (value: string) => void;
  setDeepSeekApiKey: (value: string) => void;
  setDeepSeekModel: (value: string) => void;
}) {
  const learningSummary = buildImaLearningSummary({
    className: selectedClass,
    classSnapshot,
    liveSummary,
    question,
  });
  const knowledgePrompt = buildImaKnowledgePrompt();

  const handleCopy = (kind: "summary" | "knowledge", text: string) => {
    void navigator.clipboard?.writeText(text);
    setCopiedImaText(kind);
  };

  const knowledgeCards = [
    {
      title: "课程标准与教材",
      tag: "稳定资料",
      detail: "课标、教材单元目标、阅读篇章、写作任务、评价量规，适合长期放在ima里反复引用。",
    },
    {
      title: "试卷与讲评资料",
      tag: "教学证据",
      detail: "周测试卷、答案解析、错因标签口径、讲评课PPT，用来生成讲评策略和同类练习。",
    },
    {
      title: "教研记录",
      tag: "备课组资产",
      detail: "会议纪要、公开课反思、分层干预方案，让ima沉淀备课组自己的经验。",
    },
    {
      title: "教师发展与政策",
      tag: "外部依据",
      detail: "AI教育、教师培训、考试改革和区域教研文件，帮助报告和建议有依据。",
    },
  ];

  const workflowSteps = [
    ["平台分析", "在这里保留成绩、错因、学生跟踪和可视化。"],
    ["复制摘要", "只复制班级层面匿名学情，不复制学生明细。"],
    ["打开ima", "把摘要贴进ima，并引用备课组知识库。"],
    ["回到课堂", "把ima建议转化为讲评课、练习包和家校沟通。"],
  ];

  return (
    <div className="ima-layout">
      <section className="panel ima-hero-panel">
        <div className="ima-hero-copy">
          <span className="hero-kicker">
            <Brain size={16} />
            知识库桥接 · 不替代学情数据库
          </span>
          <h2>把结构化学情结果带到ima里，用校本知识生成备课建议</h2>
          <p>
            学情平台负责本地解析、统计和跟踪；DeepSeek 可按匿名摘要生成讲评建议和同类练习；ima 适合承载课标、教材、试卷讲评和教研记录。
          </p>
          <div className="hero-actions">
            <a className="primary-button ima-open-link" href="https://ima.qq.com/" rel="noreferrer" target="_blank">
              <ExternalLink size={16} />
              打开 ima
            </a>
            <button
              className="secondary-button"
              onClick={() => handleCopy("summary", learningSummary)}
              type="button"
            >
              <ClipboardCheck size={16} />
              {copiedImaText === "summary" ? "已复制学情摘要" : "复制学情摘要"}
            </button>
            <button
              className="secondary-button"
              onClick={() => handleCopy("knowledge", knowledgePrompt)}
              type="button"
            >
              <Sparkles size={16} />
              {copiedImaText === "knowledge" ? "已复制提示词" : "复制知识库提示词"}
            </button>
          </div>
        </div>
        <div className="ima-privacy-card">
          <ShieldCheck size={22} />
          <strong>API边界</strong>
          <p>DeepSeek Key 只保存在当前浏览器；点击生成时才会把匿名学情摘要发送到 DeepSeek。未填 Key 时自动使用本地演示结果。</p>
        </div>
      </section>

      <section className="panel deepseek-panel">
        <PanelHeader icon={Sparkles} title="DeepSeek API 接入" action="可选 · 演示时临时填写" />
        <div className="deepseek-grid">
          <div className="deepseek-settings">
            <label>
              <span>API Key</span>
              <input
                autoComplete="off"
                onChange={(event) => setDeepSeekApiKey(event.target.value)}
                placeholder="sk-... 只保存在本机浏览器"
                type="password"
                value={deepSeekApiKey}
              />
            </label>
            <label>
              <span>模型</span>
              <select value={deepSeekModel} onChange={(event) => setDeepSeekModel(event.target.value)}>
                <option value="deepseek-v4-flash">deepseek-v4-flash（推荐演示）</option>
                <option value="deepseek-v4-pro">deepseek-v4-pro</option>
              </select>
            </label>
            <div className="deepseek-actions">
              <button
                className="secondary-button"
                disabled={deepSeekState.status === "loading"}
                onClick={() => onDeepSeekGenerate("test")}
                type="button"
              >
                <CircleCheck size={16} />
                测试连接
              </button>
              <button
                className="primary-button"
                disabled={deepSeekState.status === "loading"}
                onClick={() => onDeepSeekGenerate("teaching")}
                type="button"
              >
                <Sparkles size={16} />
                生成教学建议
              </button>
              <button
                className="secondary-button"
                disabled={deepSeekState.status === "loading"}
                onClick={() => onDeepSeekGenerate("practice")}
                type="button"
              >
                <BookOpenCheck size={16} />
                生成同类题
              </button>
              <button
                className="secondary-button"
                disabled={deepSeekState.status === "loading"}
                onClick={() => onDeepSeekGenerate("report")}
                type="button"
              >
                <FileText size={16} />
                生成汇报话术
              </button>
            </div>
            <p className="deepseek-note">
              浏览器直连适合 demo；正式产品建议改成学校服务器代理，并加入权限、审计和脱敏策略。
            </p>
          </div>
          <div className={`deepseek-output ${deepSeekState.status}`}>
            <span>{deepSeekState.message}</span>
            <pre>{deepSeekState.result || "这里会显示 DeepSeek 返回内容；没有 API Key 时会展示本地回退建议。"}</pre>
            <button
              className="secondary-button"
              disabled={!deepSeekState.result}
              onClick={() => {
                void navigator.clipboard?.writeText(deepSeekState.result);
              }}
              type="button"
            >
              <ClipboardCheck size={16} />
              复制结果
            </button>
          </div>
        </div>
      </section>

      <section className="ima-workflow-grid">
        {workflowSteps.map(([title, detail], index) => (
          <article className="panel ima-step-card" key={title}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{title}</strong>
            <p>{detail}</p>
          </article>
        ))}
      </section>

      <section className="panel ima-current-context">
        <PanelHeader icon={ClipboardCheck} title="即将复制给ima的匿名摘要" action={`${selectedClass} · Q${question.number}`} />
        <div className="ima-context-grid">
          <div>
            <span>班级概况</span>
            <strong>{percent(classSnapshot.averageAccuracy)}</strong>
            <small>平均正确率 · {classSnapshot.riskStudents}人需跟进</small>
          </div>
          <div>
            <span>重点错题</span>
            <strong>Q{question.number} {question.questionType}</strong>
            <small>{question.diagnosis.causes.join(" / ")}</small>
          </div>
          <div>
            <span>本地解析</span>
            <strong>{liveSummary ? `${liveSummary.rowCount}人` : "未导入"}</strong>
            <small>{liveSummary ? `平均达成率 ${percent(liveSummary.averageRate)}` : "导入后会补充班级摘要"}</small>
          </div>
        </div>
      </section>

      <section className="panel ima-resource-panel">
        <PanelHeader icon={BookMarked} title="建议放进ima的资料" action="资料库，不是学生数据库" />
        <div className="ima-resource-grid">
          {knowledgeCards.map((item) => (
            <article className="ima-resource-card" key={item.title}>
              <span>{item.tag}</span>
              <strong>{item.title}</strong>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel ima-boundary-panel">
        <PanelHeader icon={ShieldCheck} title="v1接入边界" action="外部工作台链接" />
        <div className="delivery-checks">
          {[
            ["不嵌入", "不把ima嵌到iframe里，避免登录和权限问题。"],
            ["不上传", "不自动上传原始成绩表或学生明细。"],
            ["不存密钥", "不保存ima账号、Cookie、OAuth或任何访问令牌。"],
          ].map(([title, detail]) => (
            <div key={title}>
              <CircleCheck size={16} />
              <strong>{title}</strong>
              <span>{detail}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function PracticePanel({
  generated,
  question,
  onGeneratePractice,
}: {
  generated: PracticeItem[];
  question: QuestionItem;
  onGeneratePractice: () => void;
}) {
  const items = generated.length ? generated : question.diagnosis.practiceItems;

  return (
    <div className="practice-layout">
      <section className="panel practice-hero">
        <PanelHeader icon={BookMarked} title="拓展练习包" action={`基于 Q${question.number} ${question.questionType}`} />
        <div className="practice-summary">
          <div>
            <span>目标题型</span>
            <strong>{question.questionType}</strong>
          </div>
          <div>
            <span>错因聚焦</span>
            <strong>{question.diagnosis.causes.slice(0, 2).join(" / ")}</strong>
          </div>
          <div>
            <span>练习数量</span>
            <strong>{items.length} 题</strong>
          </div>
        </div>
        <button className="primary-button" onClick={onGeneratePractice} type="button">
          <Sparkles size={16} />
          重新生成
        </button>
      </section>

      <section className="practice-list">
        {items.map((item) => (
          <article className="panel practice-card" key={item.id}>
            <div className="practice-card-head">
              <span className="difficulty">{item.difficulty}</span>
              <span>{item.targetSkill}</span>
            </div>
            <h2>{item.title}</h2>
            <p>{item.prompt}</p>
            {item.choices && (
              <div className="choice-grid">
                {item.choices.map((choice) => (
                  <span key={choice}>{choice}</span>
                ))}
              </div>
            )}
            <div className="answer-line">
              <CircleCheck size={16} />
              <strong>答案 {item.answer}</strong>
              <span>{item.explanation}</span>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

function StudentPanel({
  students,
  selectedStudentId,
  setSelectedStudentId,
  attempts,
  wrongAttempts,
  questions,
}: {
  students: StudentAttempt[];
  selectedStudentId: string;
  setSelectedStudentId: (id: string) => void;
  attempts: StudentAttempt[];
  wrongAttempts: StudentAttempt[];
  questions: QuestionItem[];
}) {
  const averageMastery = attempts.length
    ? Math.round(attempts.reduce((sum, attempt) => sum + attempt.mastery, 0) / attempts.length)
    : 0;
  const selectedStudent = students.find((student) => student.studentId === selectedStudentId);
  const profile =
    studentProgressProfiles.find((item) => item.studentId === selectedStudentId) ??
    studentProgressProfiles.find((item) => item.studentId === "s2") ??
    studentProgressProfiles[0];
  const riskTone =
    profile.riskLevel === "高" ? "high" : profile.riskLevel === "中" ? "medium" : "low";
  const statusClass = (status: string) =>
    status === "已完成" ? "done" : status === "进行中" ? "active" : "pending";

  return (
    <div className="student-layout">
      <section className="panel student-selector">
        <PanelHeader icon={UserRound} title="学生" action="匿名演示" />
        <div className="student-list">
          {students.map((student) => (
            <button
              className={selectedStudentId === student.studentId ? "student-row active" : "student-row"}
              key={student.studentId}
              onClick={() => setSelectedStudentId(student.studentId)}
              type="button"
            >
              <span>{student.studentName}</span>
              <small>{student.className}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="student-main">
        <div className="metric-grid compact">
          <MetricCard icon={Target} label="掌握度" tone="blue" value={`${averageMastery}%`} trend="个人画像" />
          <MetricCard icon={AlertTriangle} label="错题数" tone="red" value={`${wrongAttempts.length}`} trend="需订正" />
          <MetricCard icon={ShieldCheck} label="跟踪等级" tone={riskTone === "high" ? "red" : riskTone === "medium" ? "orange" : "green"} value={profile.riskLevel} trend={profile.phase} />
        </div>

        <section className="panel student-profile-hero">
          <div className="student-identity">
            <span className="profile-kicker">学生学情画像</span>
            <h2>{selectedStudent?.studentName ?? "匿名学生"}</h2>
            <p>{profile.summary}</p>
            <div className="skill-pill-list">
              {profile.focusSkills.map((skill) => (
                <span key={skill}>{skill}</span>
              ))}
            </div>
            <div className="privacy-flags">
              <span>教师可见：完整错因证据</span>
              <span>家长版：隐藏排名与班级比较</span>
            </div>
          </div>
          <div className="profile-review-card">
            <span className={`risk-badge ${riskTone}`}>{profile.riskLevel}风险</span>
            <strong>{profile.phase}</strong>
            <small>下一次复盘：{profile.nextReview}</small>
            <button className="ghost-button" type="button">
              <RefreshCw size={16} />
              生成跟进任务
            </button>
          </div>
        </section>

        <div className="student-progress-grid">
          <section className="panel">
            <PanelHeader icon={LineChart} title="个人学习进度曲线" action="按周跟踪" />
            <div className="chart-box student-chart">
              <ResponsiveContainer width="100%" height={250}>
                <ReLineChart data={profile.progressTrend} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="week" tickLine={false} axisLine={false} />
                  <YAxis domain={[40, 100]} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="阅读" stroke="#2563eb" strokeWidth={3} dot={{ r: 3 }} isAnimationActive={false} />
                  <Line type="monotone" dataKey="写作" stroke="#16a34a" strokeWidth={3} dot={{ r: 3 }} isAnimationActive={false} />
                  <Line type="monotone" dataKey="听说" stroke="#f97316" strokeWidth={3} dot={{ r: 3 }} isAnimationActive={false} />
                  <Line type="monotone" dataKey="综合" stroke="#0f766e" strokeWidth={3} dot={{ r: 3 }} isAnimationActive={false} />
                </ReLineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="panel">
            <PanelHeader icon={ClipboardList} title="学习进度框架图" action="诊断-干预-跟踪-调整" />
            <div className="framework-map">
              {profile.framework.map((step, index) => (
                <article className={`framework-step ${statusClass(step.status)}`} key={step.stage}>
                  <span className="step-index">{index + 1}</span>
                  <small>{step.stage}</small>
                  <strong>{step.title}</strong>
                  <p>{step.detail}</p>
                  <em>{step.status}</em>
                </article>
              ))}
            </div>
          </section>
        </div>

        <section className="panel tracking-panel">
          <PanelHeader icon={Activity} title="学生学情跟踪板" action="过程证据 + 下一步" />
          <div className="tracking-board">
            {profile.trackers.map((item) => (
              <article className="tracker-row" key={`${item.date}-${item.task}`}>
                <div className="tracker-date">{item.date}</div>
                <div className="tracker-main">
                  <strong>{item.task}</strong>
                  <span>{item.evidence}</span>
                  <small>{item.next}</small>
                </div>
                <span className={`status-chip ${statusClass(item.status)}`}>{item.status}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="panel task-closure-panel">
          <PanelHeader icon={ClipboardCheck} title="本周任务闭环" action="布置-完成-反馈-再测" />
          <div className="task-closure-grid">
            {studentTaskClosures.map((item) => (
              <article className={`task-closure-card ${statusClass(item.status)}`} key={item.label}>
                <span>{item.status}</span>
                <strong>{item.label}</strong>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <PanelHeader icon={BookMarked} title="个人错题本" action="错因解释 + 同类练习" />
          <div className="mistake-list">
            {wrongAttempts.length ? (
              wrongAttempts.map((attempt) => {
                const question = questions.find((item) => item.id === attempt.questionId) ?? questions[0];
                return (
                  <article className="mistake-card" key={`${attempt.studentId}-${attempt.questionId}`}>
                    <div>
                      <span className="tag">Q{question.number} · {question.questionType}</span>
                      <h3>{question.title}</h3>
                      <p>{question.diagnosis.narrative}</p>
                    </div>
                    <div className="mistake-side">
                      <strong>{attempt.cause}</strong>
                      <small>我的答案：{attempt.selected}</small>
                      <Progress value={attempt.mastery} />
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="empty-state">
                <CircleCheck size={32} />
                <strong>本次暂无错题</strong>
                <span>继续完成高考拓展题，保持阅读和写作节奏。</span>
              </div>
            )}
          </div>
        </section>

        <section className="panel next-steps">
          <PanelHeader icon={Play} title="下一步学习建议" action="15分钟" />
          <div className="next-step-grid">
            <div>
              <strong>1. 复盘关键词</strong>
              <span>标出题干关键词、原文定位句和干扰选项。</span>
            </div>
            <div>
              <strong>2. 拆一句长难句</strong>
              <span>主干、修饰、指代各写一行。</span>
            </div>
            <div>
              <strong>3. 做一题同类迁移</strong>
              <span>完成后写出排除两个选项的理由。</span>
            </div>
          </div>
        </section>
      </section>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  tone,
  value,
  trend,
}: {
  icon: typeof Target;
  label: string;
  tone: "blue" | "green" | "orange" | "red";
  value: string;
  trend: string;
}) {
  return (
    <article className={`metric-card ${tone}`}>
      <div className="metric-icon"><Icon size={20} /></div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{trend}</small>
    </article>
  );
}

function PanelHeader({
  icon: Icon,
  title,
  action,
}: {
  icon: typeof Target;
  title: string;
  action?: string;
}) {
  return (
    <div className="panel-header">
      <div>
        <Icon size={18} />
        <h2>{title}</h2>
      </div>
      {action && <span>{action}</span>}
    </div>
  );
}

function Progress({ value }: { value: number }) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <span className="progress-wrap">
      <i style={{ width: `${safeValue}%` }} />
      <b>{Math.round(safeValue)}%</b>
    </span>
  );
}

export default App;
