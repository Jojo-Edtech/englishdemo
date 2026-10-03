import { useLocale } from "./i18n/LocaleContext";
import { sampleCsvForLocale, sampleEssaysForLocale } from "./i18n/sampleData";
import { chartLabel } from "./i18n/translate";
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
  Menu,
  X,
  LayoutDashboard,
  Languages,
  LineChart,
  MessageSquareText,
  Play,
  PencilLine,
  Printer,
  RefreshCw,
  SearchCheck,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  UploadCloud,
  UserRound,
  Users,
} from "lucide-react";
import {
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
  essayWorkbench,
  essayStressSamples,
  essayStressSummary,
  fieldMappingRows,
  heatmap,
  heatmapColumns,
  importSources,
  liveQuestionGuide,
  knowledgeGraphNodes,
  masteryMatrix,
  masteryMatrixSkills,
  masterySkillActions,
  optionMisconceptions,
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
import type { ReportTone, WarningStatus } from "./data/mockData";
import {
  safeAggregateMetricLabel,
} from "./security";
import type { PracticeItem, QuestionItem, StudentAttempt } from "./types";
import { OverviewWorkspace } from "./components/OverviewWorkspace";
import { analyzeLiveData as parseLiveData, findQuestionGuide } from "./lib/liveData";
import type { LiveDataSummary, LiveWeakItem } from "./lib/liveData";

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
const MAX_LIVE_DATA_CHARS = 2_000_000;
const MAX_ESSAY_CHARS = 30_000;

const teacherNav = [
  { id: "overview", label: "总览", icon: LayoutDashboard },
  { id: "upload", label: "导入", icon: UploadCloud },
  { id: "results", label: "批改", icon: FileCheck2 },
  { id: "diagnosis", label: "错因", icon: SearchCheck },
  { id: "analytics", label: "学情", icon: BarChart3 },
  { id: "reports", label: "报告", icon: FileText },
  { id: "ima", label: "备课助手", icon: Brain },
  { id: "practice", label: "练习", icon: BookOpenCheck },
] satisfies Array<{ id: PanelId; label: string; icon: typeof LayoutDashboard }>;

const mobileNav = [
  { id: "overview", label: "总览", icon: LayoutDashboard },
  { id: "upload", label: "导入", icon: UploadCloud },
  { id: "results", label: "批改", icon: FileCheck2 },
  { id: "analytics", label: "学情", icon: BarChart3 },
] satisfies Array<{ id: PanelId; label: string; icon: typeof LayoutDashboard }>;

const readPanelFromUrl = (): PanelId => {
  const value = window.location.hash.slice(1);
  return value === "student" || teacherNav.some((item) => item.id === value)
    ? value as PanelId
    : "overview";
};

const sampleQuestionText = `Passage C: As electric buses become common in many cities, engineers are testing ways to reuse the energy created when buses slow down.

31. Why does the author mention the old charging station?
A. To introduce a tourist attraction.
B. To show how public transport used to work.
C. To compare two unrelated inventions.
D. To explain the need for a more efficient system.`;

const percent = (value: number | null) => value === null ? "暂无数据" : `${Math.round(value * 100)}%`;

type EssayReviewState = { status: "idle" | "ready" | "error"; message: string; result: string };

const analyzeLiveData = (text: string) => parseLiveData(text, liveQuestionGuide);
const aggregateWeakItemLabel = (item: LiveWeakItem, index: number) =>
  findQuestionGuide(item.field, liveQuestionGuide)?.label ?? safeAggregateMetricLabel(item.field, index);

const downloadTextFile = (content: string, filename: string, mime = "text/csv;charset=utf-8") => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
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
        `薄弱题目：${liveSummary.weakItems.map((item, index) => `${aggregateWeakItemLabel(item, index)}(${item.cause}, 达成率${percent(item.averageRate)})`).join("；") || "暂无"}`,
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

function App() {
  const { t, locale, setLocale } = useLocale();
  const [activePanel, setActivePanel] = useState<PanelId>(readPanelFromUrl);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDialogElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (window.location.hash.slice(1) !== activePanel) {
      window.history.pushState(null, "", `#${activePanel}`);
    }
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [activePanel]);
  useEffect(() => {
    const syncPanel = () => setActivePanel(readPanelFromUrl());
    window.addEventListener("hashchange", syncPanel);
    window.addEventListener("popstate", syncPanel);
    return () => {
      window.removeEventListener("hashchange", syncPanel);
      window.removeEventListener("popstate", syncPanel);
    };
  }, []);
  useEffect(() => {
    const dialog = mobileMenuRef.current;
    if (mobileMenuOpen) {
      dialog?.showModal();
      const previous = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previous;
        dialog?.close();
        mobileMenuButtonRef.current?.focus();
      };
    }
    dialog?.close();
  }, [mobileMenuOpen]);
  const [selectedClass, setSelectedClass] = useState("高二(3)班");
  const [lessonCompletions, setLessonCompletions] = useState<Record<string, string[]>>({});
  const [warningStatusMap, setWarningStatusMap] = useState<Record<string, WarningStatus>>(() =>
    Object.fromEntries(warningCases.map((item) => [item.student, item.status])),
  );
  const [assignedMasteryTasks, setAssignedMasteryTasks] = useState<string[]>([]);
  const [studentFollowUps, setStudentFollowUps] = useState<Record<string, string[]>>({});
  const [reportDrafts, setReportDrafts] = useState<Record<string, string>>({});
  const [reportTone, setReportTone] = useState<ReportTone>("正式");
  const [selectedQuestionId, setSelectedQuestionId] = useState("q1");
  const [selectedStudentId, setSelectedStudentId] = useState("s2");
  const [questionText, setQuestionText] = useState(sampleQuestionText);
  const [fileName, setFileName] = useState("grade-11-weekly-test-06.pdf");
  const [analysisReady, setAnalysisReady] = useState(true);
  const [generated, setGenerated] = useState<{ questionId: string; items: PracticeItem[] } | null>(null);
  const [selectedReportId, setSelectedReportId] = useState(reportTemplates[0].id);
  const [copiedReport, setCopiedReport] = useState("");
  const [copiedImaText, setCopiedImaText] = useState("");
  const [liveCsv, setLiveCsv] = useState(() => sampleCsvForLocale(locale));
  const [liveSummary, setLiveSummary] = useState<LiveDataSummary | null>(() =>
    analyzeLiveData(sampleCsvForLocale(locale)),
  );
  const [liveMessage, setLiveMessage] = useState("已载入高中英语样例数据，可直接替换为老师自己的表格。");
  const [essayText, setEssayText] = useState(demoEssayText);
  const [essayFileName, setEssayFileName] = useState("sample-story-continuation.txt");
  const [essayCorrectionState, setEssayCorrectionState] = useState<EssayReviewState>({
    status: "idle",
    message: "可粘贴作文或上传文本；本地显示样例点评或教师复核清单，不自动评分。",
    result: "",
  });

  useEffect(() => {
    // Remove legacy credentials left by older versions, without reading them.
    try {
      window.localStorage.removeItem("deepseek_api_key");
      window.localStorage.removeItem("deepseek_model");
    } catch { /* The demo also works when browser storage is unavailable. */ }
  }, []);

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
        attempt.className === selectedClass,
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
    setGenerated({ questionId: selectedQuestion.id, items: next });
    setActivePanel("practice");
  };

  const handleAnalyzeLiveCsv = (nextCsv = liveCsv) => {
    if (nextCsv.length > MAX_LIVE_DATA_CHARS) {
      setLiveSummary(null);
      setLiveMessage("数据超过本地演示上限，请先拆分或只保留需要分析的字段和记录。");
      return;
    }
    const summary = analyzeLiveData(nextCsv);
    if (!summary) {
      setLiveSummary(null);
      setLiveMessage("未能解析成绩。请检查表头是否重复、每行列数是否一致，并保留姓名/班级及至少一个小题得分字段。");
      return;
    }
    setLiveSummary(summary);
    setLiveMessage(`已解析 ${summary.rowCount} 名学生、${summary.scoreColumns.length} 个得分字段，预览已自动匿名。`);
  };

  const handleLoadLiveSample = () => {
    const sample = sampleCsvForLocale(locale);
    setLiveCsv(sample);
    const summary = analyzeLiveData(sample);
    setLiveSummary(summary);
    setLiveMessage("已重新载入样例数据。明天展示时可以先点这里，再换老师自己的表格。");
  };

  const handleClearLiveData = () => {
    setLiveCsv("");
    setLiveSummary(null);
    setLiveMessage("已清空当前输入。真实学生数据不会保存，刷新页面也会回到样例状态。");
  };

  const handleLiveDataFile = (file: File) => {
    if (file.size > MAX_LIVE_DATA_CHARS * 4) {
      setLiveMessage("文件过大，未读取。请先拆分后再导入。");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      if (text.length > MAX_LIVE_DATA_CHARS) {
        setLiveSummary(null);
        setLiveMessage("文件内容超过本地演示上限，未截断或解析。请拆分后再导入。");
        return;
      }
      setLiveCsv(text);
      handleAnalyzeLiveCsv(text);
    };
    reader.onerror = () => setLiveMessage("文件读取失败，请重新选择文件或粘贴表格。");
    reader.readAsText(file, "utf-8");
  };

  const requestEssayCorrection = () => {
    const cleanEssay = essayText.trim();
    if (cleanEssay.length < 60 || cleanEssay.length > MAX_ESSAY_CHARS) {
      setEssayCorrectionState({
        status: "error",
        message: "请提供 60 至 30000 个字符的作文文本。",
        result: "",
      });
      return;
    }
    const isSample = cleanEssay === demoEssayText.trim();
    setEssayCorrectionState({
      status: "ready",
      message: isSample
        ? "以下是内置作文的预设点评，不是真实自动评分。"
        : "原文仅在本页暂存。此公开版不自动评分，请教师按量规复核。",
      result: isSample ? essayCorrectionFallbackText : [
        "【教师复核清单】",
        "1. 内容：是否回应题目要求，是否有足够的文本证据。",
        "2. 结构：段落组织、衔接和故事发展是否合理。",
        "3. 语言：检查词汇使用、句法准确性与表达得体性。",
        "4. 反馈：记录一项优势、一项待改进点和下一步练习。",
        "未对当前文本生成分数、逐句批注或能力诊断。",
      ].join("\n"),
    });
  };

  const panelTitle = {
    overview: "教师总览",
    upload: "数据导入与解析",
    results: "批改结果",
    diagnosis: "单题错因分析",
    analytics: "班级学情可视化",
    reports: "报告生成与导出",
    ima: "备课摘要与提示词",
    practice: "拓展练习生成",
    student: "学生学情跟踪",
  }[activePanel];

  return (
    <div className={`app-shell workspace ${activePanel === "overview" ? "is-overview" : ""}`}>
      <a className="skip-link" href="#main-content" onClick={(event) => { event.preventDefault(); document.getElementById("main-content")?.focus(); document.getElementById("main-content")?.scrollIntoView(); }}>{t("跳到主要内容")}</a>
      <header className="workspace-header">
        <button className="workspace-brand" onClick={() => setActivePanel("overview")} type="button" aria-label={t("英语备课组学情分析平台首页")}>
          <strong>{t("英语备课组")}</strong>
          <span>{t("学情分析平台")}</span>
        </button>

        <nav className="nav-list" aria-label={t("教师端导航")}>
          {teacherNav.map((item) => (
            <button
              className={activePanel === item.id ? "nav-item active" : "nav-item"}
              key={item.id}
              onClick={() => setActivePanel(item.id)}
              type="button"
              title={t(item.label)}
              aria-current={activePanel === item.id ? "page" : undefined}
            >
              <item.icon size={16} aria-hidden="true" />
              <span>{t(item.label)}</span>
            </button>
          ))}
        </nav>

        <label className="language-select">
          <Languages size={16} aria-hidden="true" />
          <select aria-label="语言 / Language" value={locale} onChange={(event) => setLocale(event.target.value === "en" ? "en" : "zh-CN")}>
            <option value="zh-CN" lang="zh-CN">中文</option>
            <option value="en" lang="en">English</option>
          </select>
        </label>
        <div className="mode-switch" role="group" aria-label={t("切换角色视图")}>
          <button className={activePanel !== "student" ? "selected" : ""} aria-pressed={activePanel !== "student"} onClick={() => setActivePanel("overview")} type="button">{t("教师")}</button>
          <button className={activePanel === "student" ? "selected" : ""} aria-pressed={activePanel === "student"} onClick={() => setActivePanel("student")} type="button">{t("学生")}</button>
        </div>
      </header>

      <main className="main" id="main-content" tabIndex={-1}>
        <header className="topbar">
          <div>
            <p className="eyebrow">{t(activePanel === "student" ? "我的学习" : "教师工作台")} <span>{t("· 演示数据")}</span></p>
            <h1>{t(activePanel === "overview" ? "英语备课组学情分析平台" : panelTitle)}</h1>
          </div>
          <div className="top-actions">
            <span className="data-badge">
              <ShieldCheck size={16} />{t("本地解析 · 不上传")}</span>
            {["overview", "diagnosis", "ima"].includes(activePanel) && <label className="select-wrap">
              <Filter size={16} />
              <select
                aria-label={t("选择班级")}
                value={selectedClass}
                onChange={(event) => setSelectedClass(event.target.value)}
              >
                {classSnapshots.map((snapshot) => (
                  <option key={snapshot.className} value={snapshot.className}>
                    {t(snapshot.className)}
                  </option>
                ))}
              </select>
            </label>}
          </div>
        </header>

        {activePanel !== "student" && (
          <section className="analysis-context-bar" aria-label={t("当前分析范围")}>
            <div className="analysis-context-main">
              <FileText size={17} />
              <span>{t("演示周测")}</span>
              <strong>{t(assignment.title)}</strong>
            </div>
            <div className="analysis-context-meta">
              <span>{t(["overview", "diagnosis", "ima"].includes(activePanel) ? selectedClass : activePanel === "analytics" ? "跨班级能力样例" : activePanel === "reports" ? "报告模板演示" : "测评样例")}</span>
              <span>{t(assignment.date)}</span>
              <span className="context-source">{t(assignment.source)}</span>
              <b><CircleCheck size={14} />{t(" 演示样例")}</b>
            </div>
            <button onClick={() => setActivePanel("upload")} type="button">
              <RefreshCw size={15} />{t("更新数据")}</button>
          </section>
        )}

        {activePanel === "overview" && (
          <OverviewWorkspace
            classSnapshot={classSnapshot}
            lowQuestions={lowQuestions}
            completedTasks={lessonCompletions[selectedClass] ?? []}
            onToggleTask={(id) => setLessonCompletions((previous) => {
              const tasks = previous[selectedClass] ?? [];
              return { ...previous, [selectedClass]: tasks.includes(id) ? tasks.filter((task) => task !== id) : [...tasks, id] };
            })}
            onPractice={(id) => {
              const question = assignment.questions.find((item) => item.id === id);
              if (!question) return;
              setSelectedQuestionId(id);
              setGenerated({ questionId: id, items: question.diagnosis.practiceItems });
              setActivePanel("practice");
            }}
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
            onDownloadLiveSample={() => downloadTextFile(sampleCsvForLocale(locale), `english-demo-sample-${locale}.csv`)}
            onLiveDataFile={handleLiveDataFile}
            onLoadLiveSample={handleLoadLiveSample}
            setAnalysisReady={setAnalysisReady}
            setFileName={setFileName}
            setLiveCsv={(text) => {
              setLiveCsv(text);
              setLiveSummary(null);
              setLiveMessage("数据已更改，请重新解析。");
            }}
            setQuestionText={setQuestionText}
            onPublish={() => setActivePanel("results")}
          />
        )}
        {activePanel === "results" && (
          <ResultsPanel
            essayCorrectionState={essayCorrectionState}
            essayFileName={essayFileName}
            essayText={essayText}
            questions={assignment.questions}
            onCorrectEssay={requestEssayCorrection}
            onSelectQuestion={(id) => {
              setSelectedQuestionId(id);
              setActivePanel("diagnosis");
            }}
            setEssayFileName={setEssayFileName}
            setEssayText={(value) => {
              setEssayText(value);
              setEssayCorrectionState({ status: "idle", message: "文本已更改，请重新查看复核建议。", result: "" });
            }}
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
        {activePanel === "analytics" && <AnalyticsPanel
          warningStatusMap={warningStatusMap}
          onWarningChange={(student, status) => setWarningStatusMap((previous) => ({ ...previous, [student]: status }))}
          assignedMasteryTasks={assignedMasteryTasks}
          onAssignTask={(key) => setAssignedMasteryTasks((previous) => previous.includes(key) ? previous : [...previous, key])}
        />}
        {activePanel === "reports" && (
          <ReportsPanel
            selectedTone={reportTone}
            setSelectedTone={setReportTone}
            drafts={reportDrafts}
            onDraftChange={(key, value) => setReportDrafts((previous) => ({ ...previous, [key]: value }))}
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
            liveSummary={liveSummary}
            question={selectedQuestion}
            selectedClass={selectedClass}
            setCopiedImaText={setCopiedImaText}
          />
        )}
        {activePanel === "practice" && (
          <PracticePanel
            generated={generated?.questionId === selectedQuestionId ? generated.items : []}
            question={selectedQuestion}
            onGeneratePractice={handleGeneratePractice}
          />
        )}
        {activePanel === "student" && (
          <StudentPanel
            followUpTasks={studentFollowUps[selectedStudentId] ?? []}
            onFollowUpChange={(tasks) => setStudentFollowUps((previous) => ({ ...previous, [selectedStudentId]: tasks }))}
            students={students}
            selectedStudentId={selectedStudentId}
            setSelectedStudentId={setSelectedStudentId}
            attempts={selectedStudentAttempts}
            wrongAttempts={wrongAttempts}
            questions={assignment.questions}
          />
        )}
      </main>

      <footer className="workspace-footer"><span>{t("英语备课组学情分析平台")}</span><span>{t("演示数据 · 不关联任何学校")}</span></footer>
      <dialog className="workspace-menu" ref={mobileMenuRef} aria-labelledby="workspace-menu-title" onCancel={() => setMobileMenuOpen(false)} onClose={() => setMobileMenuOpen(false)} onClick={(event) => { if (event.target === event.currentTarget) setMobileMenuOpen(false); }}>
        <div className="workspace-menu-head"><h2 id="workspace-menu-title">{t("全部功能")}</h2><button type="button" className="icon-button" aria-label={t("关闭全部功能")} onClick={() => setMobileMenuOpen(false)}><X size={20} /></button></div>
        <nav aria-label={t("全部功能导航")}>
          {[...teacherNav, { id: "student" as const, label: "学生", icon: UserRound }].map((item) => (
            <button type="button" key={item.id} className={activePanel === item.id ? "active" : ""} aria-current={activePanel === item.id ? "page" : undefined} onClick={() => { setActivePanel(item.id); setMobileMenuOpen(false); }}><item.icon size={20} aria-hidden="true" /><span>{t(item.label)}</span><ChevronRight size={16} aria-hidden="true" /></button>
          ))}
        </nav>
      </dialog>
      <nav className="mobile-nav" aria-label={t("移动端导航")}>
        {mobileNav.map((item) => (
          <button
            className={activePanel === item.id ? "active" : ""}
            key={item.id}
            onClick={() => setActivePanel(item.id)}
            type="button"
            title={t(item.label)}
            aria-current={activePanel === item.id ? "page" : undefined}
          >
            <item.icon size={19} />
            <span>{t(item.label)}</span>
          </button>
        ))}
        <button type="button" ref={mobileMenuButtonRef} className={!mobileNav.some((item) => item.id === activePanel) ? "active" : ""} aria-expanded={mobileMenuOpen} aria-haspopup="dialog" onClick={() => setMobileMenuOpen(true)}><Menu size={19} aria-hidden="true" /><span>{t("更多")}</span></button>
      </nav>
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
  const { t, locale } = useLocale();
  const liveInputRef = useRef<HTMLTextAreaElement | null>(null);
  const liveQuality = liveSummary?.quality ?? {
    coverage: liveSummary ? 1 : 0,
    duplicateRows: 0,
    missingClassRows: 0,
    missingIdentityRows: 0,
    missingScoreCells: 0,
    invalidScoreCells: 0,
    totalMismatchRows: 0,
    unconfirmedColumns: [],
    issues: [],
    totalScoreCells: liveSummary ? liveSummary.rowCount * liveSummary.scoreColumns.length : 0,
    validScoreCells: liveSummary ? liveSummary.rowCount * liveSummary.scoreColumns.length : 0,
  };
  const qualityNeedsReview = !!liveSummary && (
    liveQuality.coverage < 0.95 ||
    liveQuality.duplicateRows > 0 ||
    liveQuality.missingIdentityRows > 0 || liveQuality.missingClassRows > 0 ||
    liveQuality.invalidScoreCells > 0 || liveQuality.totalMismatchRows > 0 || liveQuality.unconfirmedColumns.length > 0
  );

  return (
    <div className="upload-layout">
      <section className="panel upload-card">
        <PanelHeader icon={UploadCloud} title={t("数据导入中心")} action={t("PDF / Excel / 阅卷 / 表单")} />
        <div className="demo-notice">
          <ShieldCheck size={17} />
          <span>{t("文件解析入口为模拟流程；真实成绩表可在下方试用台本地解析，不会保存到服务器。")}</span>
        </div>
        <div className="import-source-grid">
          {importSources.map((source) => (
            <article className="import-source-card" key={source.id}>
              <span>{t(source.status)}</span>
              <strong>{t(source.title)}</strong>
              <p>{t(source.description)}</p>
              <small>{t(source.sample)}</small>
            </article>
          ))}
        </div>
        <label className="drop-zone">
          <UploadCloud size={34} />
          <span>{fileName}</span>
          <small>{t("点击选择文件，演示版会生成模拟解析结果")}</small>
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
            <RefreshCw size={16} />{t("恢复样例")}</button>
          <button className="primary-button" onClick={onPublish} type="button">
            <Send size={16} />{t("发布练习")}</button>
        </div>
      </section>

      <section className="panel editor-card">
        <PanelHeader icon={FileText} title={t("题目文本")} action={t("自动识别题型与答案")} />
        <textarea
          aria-label={t("题目文本")}
          value={questionText}
          onChange={(event) => {
            setQuestionText(event.target.value);
            setAnalysisReady(event.target.value.trim().length > 40);
          }}
        />
      </section>

      <section className="panel parse-card">
        <PanelHeader icon={Sparkles} title={t("解析确认")} action={t(analysisReady ? "已完成 · 老师可编辑" : "解析中")} />
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
                <strong>{t(title)}</strong>
                <small>{t(value)}</small>
              </div>
            </div>
          ))}
        </div>
        <div className="field-mapping">
          <div className="field-title">
            <span>{t("字段映射预览")}</span>
            <small>{t("来源字段会先匿名化，再进入学情分析")}</small>
          </div>
          <div className="field-head">
            <span>{t("来源字段")}</span>
            <span>{t("平台字段")}</span>
            <span>{t("状态")}</span>
          </div>
          {fieldMappingRows.map((row) => (
            <div className="field-row" key={`${row.source}-${row.target}`}>
              <strong>{t(row.source)}</strong>
              <span>{t(row.target)}</span>
              <b>{t(row.quality)}</b>
              <small>{t(row.note)}</small>
            </div>
          ))}
        </div>
        <div className="mini-table">
          <div>
            <span>{t("识别题数")}</span>
            <b>6</b>
          </div>
          <div>
            <span>{t("预计批改")}</span>
            <b>{t("44人")}</b>
          </div>
          <div>
            <span>{t("错因标签")}</span>
            <b>{t("9类")}</b>
          </div>
        </div>
      </section>

      <section className="panel live-data-card">
        <PanelHeader icon={ClipboardList} title={t("真实数据试用台")} action={t("本地解析 · 不上传")} />
        <div className="live-privacy-note">
          <ShieldCheck size={17} />
          <span>{t("可以粘贴 Excel 表格或上传 CSV。数据只在当前浏览器里计算，不会发送到服务器；预览默认匿名化学生姓名。")}</span>
        </div>
        <div className="live-toolbar">
          <button className="secondary-button" onClick={onLoadLiveSample} type="button">
            <RefreshCw size={16} />{t("载入样例")}</button>
          <button
            className="primary-button"
            onClick={() => onAnalyzeLiveCsv(liveInputRef.current?.value ?? liveCsv)}
            type="button"
          >
            <Sparkles size={16} />{t("解析学情")}</button>
          <button className="secondary-button" onClick={onDownloadLiveSample} type="button">
            <Download size={16} />{t("下载样例CSV")}</button>
          <label className="secondary-button file-button">
            <UploadCloud size={16} />{t("上传CSV")}<input
              accept=".csv,.txt,.tsv"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onLiveDataFile(file);
              }}
              type="file"
            />
          </label>
          <button className="secondary-button" onClick={onClearLiveData} type="button">{t("清空")}</button>
        </div>
        <div className="paste-target-hint">
          <strong>{t("复制粘贴位置")}</strong>
          <span>{t("把下面给老师看的 CSV/Excel 数据粘贴到这个大输入框，再点击“解析学情”。")}</span>
        </div>
        <textarea
          className="live-data-input"
          aria-label={t("学生成绩表")}
          maxLength={MAX_LIVE_DATA_CHARS}
          onChange={(event) => setLiveCsv(event.target.value.slice(0, MAX_LIVE_DATA_CHARS))}
          placeholder={t("从 Excel 复制表头和学生成绩后粘贴到这里，或上传 CSV 文件。")}
          ref={liveInputRef}
          value={liveCsv}
        />
        <div className={liveSummary ? "live-message ready" : "live-message"} role="status">
          <CircleCheck size={16} />
          <span>{t(liveMessage)}</span>
        </div>
        {liveSummary ? (
          <div className="live-analysis">
            <section className="data-quality-gate" aria-label={t("数据质量检查")}>
              <div className="data-quality-head">
                <div>
                  <FileCheck2 size={18} />
                  <strong>{t("数据质量门")}</strong>
                  <span>{t("先确认数据能不能信，再生成学情结论")}</span>
                </div>
                <b className={qualityNeedsReview ? "needs-review" : "ready"}>
                  {t(qualityNeedsReview ? "建议老师确认" : "可直接分析")}
                </b>
              </div>
              <div className="data-quality-grid">
                <div>
                  <span>{t("得分识别覆盖率")}</span>
                  <strong>{t(percent(liveQuality.coverage))}</strong>
                  <small>{t(liveQuality.validScoreCells)}/{t(liveQuality.totalScoreCells)}{t(" 个得分单元")}</small>
                </div>
                <div>
                  <span>{t("缺失得分")}</span>
                  <strong>{t(liveQuality.missingScoreCells)}</strong>
                  <small>{t("缺失值不会自动按 0 分计算")}</small>
                </div>
                <div>
                  <span>{t("重复学生记录")}</span>
                  <strong>{t(liveQuality.duplicateRows)}</strong>
                  <small>{t("按学号 / 学生ID / 姓名检查")}</small>
                </div>
                <div>
                  <span>{t("待补基础字段")}</span>
                  <strong>{t(liveQuality.missingIdentityRows + liveQuality.missingClassRows)}</strong>
                  <small>{t("缺姓名 ")}{t(liveQuality.missingIdentityRows)}{t(" · 缺班级 ")}{t(liveQuality.missingClassRows)}</small>
                </div>
              </div>
              <div className="data-quality-details" role="status">
                <span>{t("异常得分 ")}<b>{t(liveQuality.invalidScoreCells)}</b></span>
                <span>{t("总分口径差异 ")}<b>{t(liveQuality.totalMismatchRows)}</b></span>
                <span>{t("满分待确认 ")}<b>{t(liveQuality.unconfirmedColumns.length)}</b></span>
              </div>
              {liveQuality.issues.length > 0 && <ul className="quality-issues">{liveQuality.issues.slice(0, 6).map((issue, index) => <li key={index}>{t("第 ")}{t(issue.row)}{t(" 行 · ")}{t(issue.field)}：{t(issue.message)}</li>)}</ul>}
              {liveQuality.unconfirmedColumns.length > 0 && <p>{t("请在自定义得分表头标注“满分10”等满分信息：")}{t(liveQuality.unconfirmedColumns.join("、"))}。</p>}
              <p>
                {t(qualityNeedsReview
                  ? "已保留可分析记录；建议先核对黄色提示项，避免把缺失数据误判为学生失分。"
                  : "字段完整、记录无重复；当前数据已通过演示版检查，可进入薄弱题和学生跟进分析。")}
              </p>
            </section>
            <div className="live-metrics">
              <MetricCard
                icon={Users}
                label={t("已解析学生")}
                tone="blue"
                value={t("{0}人", [liveSummary.rowCount])}
                trend={t(liveSummary.classNames.join(" / "))}
              />
              <MetricCard
                icon={Target}
                label={t("有效小题均分")}
                tone="green"
                value={t(liveSummary.averageTotal === null ? "暂无得分" : `${liveSummary.averageTotal.toFixed(1)}分`)}
                trend={t("有效作答 {0}人 · 有效题达成率 {1}", [liveSummary.scoredStudents, percent(liveSummary.averageRate)])}
              />
              <MetricCard
                icon={AlertTriangle}
                label={t("需跟进")}
                tone="red"
                value={t("{0}人", [liveSummary.riskCount])}
                trend={t("仅统计有有效得分的学生")}
              />
              <MetricCard
                icon={ClipboardCheck}
                label={t("订正完成")}
                tone="orange"
                value={t("{0}/{1}", [liveSummary.completedCorrection, liveSummary.rowCount])}
                trend={t("来自订正完成列")}
              />
            </div>
            <div className="live-detail-grid">
              <div className="live-weak-panel">
                <strong>{t("薄弱题与即时教学建议")}</strong>
                {liveSummary.weakItems.map((item) => (
                  <article className="live-weak-row" key={item.field}>
                    <div>
                      <span>{t(item.type)}</span>
                      <strong>{t(item.label)}</strong>
                      <small>{t(item.cause)} · {t("{0}人需跟进", [item.weakCount])}</small>
                    </div>
                    <b>{t(percent(item.averageRate))}</b>
                    <p>{t(item.suggestion)}</p>
                  </article>
                ))}
              </div>
              <div className="live-weak-panel compact">
                <strong>{t("高频错因")}</strong>
                {liveSummary.causeCounts.map((item) => (
                  <div className="cause-count-row" key={item.cause}>
                    <span>{t(item.cause)}</span>
                    <b>{t("{0}次", [item.count])}</b>
                  </div>
                ))}
              </div>
            </div>
            <div className="live-preview">
              <div className="field-title">
                <span>{t("匿名学生预览")}</span>
                <small>{t("真实姓名不会在预览里完整显示")}</small>
              </div>
              <div className="live-preview-head">
                <span>{t("学生")}</span>
                <span>{t("班级")}</span>
                <span>{t("总分")}</span>
                <span>{t("薄弱项")}</span>
              </div>
              {liveSummary.students.map((student, index) => (
                <div className="live-preview-row" key={`${student.id}-${index}`}>
                  <strong>{locale === "en" ? `Student ${String(index + 1).padStart(2, "0")}` : student.displayName}</strong>
                  <span>{student.className}</span>
                  <span>{t(student.total === null ? "未评分" : student.total.toFixed(1))}</span>
                  <b>{t("{0}项", [student.weakItems.length])}</b>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="empty-live-state">
            <ClipboardList size={24} />
            <span>{t("粘贴或上传数据后，点击“解析学情”生成即时看板。")}</span>
          </div>
        )}
      </section>
    </div>
  );
}

function ResultsPanel({
  essayCorrectionState,
  essayFileName,
  essayText,
  questions,
  onCorrectEssay,
  onSelectQuestion,
  setEssayFileName,
  setEssayText,
}: {
  essayCorrectionState: EssayReviewState;
  essayFileName: string;
  essayText: string;
  questions: QuestionItem[];
  onCorrectEssay: () => void;
  onSelectQuestion: (id: string) => void;
  setEssayFileName: (value: string) => void;
  setEssayText: (value: string) => void;
}) {
  const { t, locale } = useLocale();
  const handleEssayFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_ESSAY_CHARS * 4) {
      setEssayFileName("文件过大，未读取");
      setEssayText("");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setEssayFileName(file.name);
      setEssayText(String(reader.result ?? "").slice(0, MAX_ESSAY_CHARS));
    };
    reader.readAsText(file, "utf-8");
    event.target.value = "";
  };

  return (
    <div className="page-grid">
      <section className="metric-grid">
        <MetricCard icon={CircleCheck} label={t("自动判分")} tone="green" value={t("264份")} trend={t("选择题已完成")} />
        <MetricCard icon={Brain} label={t("样例反馈")} tone="blue" value={t("72条")} trend={t("作文与续写建议")} />
        <MetricCard icon={Target} label={t("低分题")} tone="red" value={t("3题")} trend={t("正确率低于60%")} />
        <MetricCard icon={Download} label={t("导出")} tone="orange" value={t("Excel")} trend={t("班级与个人报告")} />
      </section>

      <section className="panel">
        <PanelHeader icon={FileCheck2} title={t("题目批改结果")} action={t("点击查看诊断")} />
        <div className="result-table">
          <div className="table-head">
            <span>{t("题号")}</span>
            <span>{t("题型")}</span>
            <span>{t("正确率")}</span>
            <span>{t("主要误因")}</span>
            <span>{t("操作")}</span>
          </div>
          {questions.map((question) => (
            <button
              className="table-row"
              key={question.id}
              onClick={() => onSelectQuestion(question.id)}
              type="button"
            >
              <span>Q{t(question.number)}</span>
              <span>{t(question.questionType)}</span>
              <span>
                <Progress value={question.correctRate * 100} />
              </span>
              <span>{t(question.diagnosis.causes.slice(0, 2).join(" / "))}</span>
              <span className="row-action">{t("查看 ")}<ChevronRight size={16} />
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="panel essay-live-panel">
        <PanelHeader
          icon={Sparkles}
          title={t("作文复核工作台")}
          action={t("本地样例与教师复核")}
        />
        <div className="essay-live-grid">
          <div className="essay-live-editor">
            <div className="essay-live-meta">
              <span>{t("作文/续写原文")}</span>
              <b>{essayFileName}</b>
            </div>
            <textarea
              className="essay-live-input"
              aria-label={t("学生作文原文")}
              maxLength={MAX_ESSAY_CHARS}
              onChange={(event) => setEssayText(event.target.value.slice(0, MAX_ESSAY_CHARS))}
              placeholder={t("把学生作文、读后续写或应用文原文粘贴到这里。演示版支持 txt/csv 文本上传；Word/PDF 可在正式版接入解析服务。")}
              value={essayText}
            />
            <div className="essay-live-actions">
              <label className="secondary-button file-button">
                <UploadCloud size={16} />{t("上传文本")}<input accept=".txt,.csv,.md,text/plain,text/csv" onChange={handleEssayFileChange} type="file" />
              </label>
              <button
                className="secondary-button"
                onClick={() => {
                  setEssayText(demoEssayText);
                  setEssayFileName("sample-story-continuation.txt");
                }}
                type="button"
              >
                <RefreshCw size={16} />{t("载入样例")}</button>
              <button
                className="primary-button"
                onClick={onCorrectEssay}
                type="button"
              >
                <Sparkles size={16} />
                {t("查看复核建议")}
              </button>
            </div>
            <p className="essay-live-note">{t("本页不向外部服务发送作文。内置作文展示预设点评；自带文本仅提供教师复核清单，不自动生成分数。")}</p>
          </div>
          <div className={`local-review-output essay-correction-output ${essayCorrectionState.status}`}>
            <span>{t(essayCorrectionState.message)}</span>
            <pre>{t(essayCorrectionState.result || "载入内置作文可查看样例点评；其他文本展示教师复核清单。")}</pre>
            <button
              className="secondary-button"
              disabled={!essayCorrectionState.result}
              onClick={() => {
                void navigator.clipboard?.writeText(t(essayCorrectionState.result));
              }}
              type="button"
            >
              <ClipboardCheck size={16} />{t("复制批改结果")}</button>
          </div>
        </div>
      </section>

      <section className="panel rubric-panel">
        <PanelHeader icon={BadgeCheck} title={t("高考写作评分标准库")} action={t("应用文 / 读后续写 / 40分综合")} />
        <div className="rubric-standard-grid">
          {writingRubricStandards.map((standard) => (
            <article className="rubric-standard-card" key={standard.id}>
              <div className="rubric-standard-head">
                <span>{t(standard.examUse)}</span>
                <strong>{t(standard.title)}</strong>
                <b>{t("{0}分", [standard.totalScore])}</b>
              </div>
              <p>{t(standard.summary)}</p>
              <div className="rubric-dimension-list">
                {standard.dimensions.slice(0, 4).map((dimension) => (
                  <div key={dimension.name}>
                    <span>{t("{0}分", [dimension.weight])}</span>
                    <strong>{t(dimension.name)}</strong>
                    <small>{t(dimension.teacherCheck)}</small>
                  </div>
                ))}
              </div>
              <div className="rubric-band-list">
                {standard.bands.slice(0, 3).map((band) => (
                  <span key={`${standard.id}-${band.label}`}>
                    {t(band.label)} {t(band.scoreRange)}
                  </span>
                ))}
              </div>
              {standard.sourceUrl ? <a href={standard.sourceUrl} rel="noreferrer" target="_blank">
                {t(standard.sourceLabel)} <ExternalLink size={13} />
              </a> : <span>{t(standard.sourceLabel)}</span>}
            </article>
          ))}
        </div>
      </section>

      <section className="panel essay-stress-panel">
        <PanelHeader icon={Activity} title={t("批量模拟测试数据")} action={t("{0}篇 · 本地压力测试", [essayStressSummary.total])} />
        <div className="stress-summary-grid">
          <div>
            <span>{t("应用文")}</span>
            <strong>{t(essayStressSummary.application)}</strong>
          </div>
          <div>
            <span>{t("读后续写")}</span>
            <strong>{t(essayStressSummary.continuation)}</strong>
          </div>
          {essayStressSummary.bands.map((item) => (
            <div key={item.band}>
              <span>{t(item.band)}</span>
              <strong>{t(item.count)}</strong>
            </div>
          ))}
        </div>
        <div className="stress-sample-grid">
          {essayStressSamples.slice(0, 6).map((sample) => (
            <article key={sample.id}>
              <span>{t(sample.type)} · {t(sample.band)}</span>
              <strong>{sample.id} · {t("{0}分", [sample.expectedScore])}</strong>
              <p>{t(sample.mainIssue)}</p>
            </article>
          ))}
        </div>
        <div className="stress-actions">
          <button
            className="secondary-button"
            onClick={() => downloadTextFile(sampleEssaysForLocale(locale), `essay-correction-stress-samples-${locale}.csv`)}
            type="button"
          >
            <Download size={16} />{t("下载模拟作文数据")}</button>
          {essayStressSummary.passCriteria.map((item) => (
            <span key={item}>{t(item)}</span>
          ))}
        </div>
      </section>

      <section className="panel rubric-panel">
        <PanelHeader icon={MessageSquareText} title={t("续写 Rubric 与 QuickMarks")} action={t("标准化反馈示例")} />
        <div className="rubric-table">
          <div className="rubric-head">
            <span>{t("维度")}</span>
            <span>{t("得分")}</span>
            <span>{t("主要问题")}</span>
            <span>{t("可复用评语")}</span>
          </div>
          {writingRubricRows.map((row) => (
            <div className="rubric-row" key={row.criterion}>
              <strong>{t(row.criterion)}</strong>
              <b>{t(row.score)}</b>
              <span>{t(row.issue)}</span>
              <span>{t(row.quickMark)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel essay-workbench">
        <PanelHeader icon={MessageSquareText} title={t("作文批改工作台")} action={t("原文批注 + 二次修改")} />
        <div className="essay-grid">
          <article className="essay-original">
            <span>{t(essayWorkbench.student)} · {t(essayWorkbench.task)}</span>
            <p>{t(essayWorkbench.original)}</p>
          </article>
          <article className="essay-comments">
            <strong>{t("逐句批注")}</strong>
            {essayWorkbench.inlineComments.map((item) => (
              <div className="essay-comment" key={`${item.fragment}-${item.type}`}>
                <span>{t(item.type)}</span>
                <b>{t(item.fragment)}</b>
                <p>{t(item.comment)}</p>
              </div>
            ))}
          </article>
          <article className="essay-score-card">
            <strong>{t("Rubric 得分")}</strong>
            {essayWorkbench.scores.map((score) => (
              <div className="essay-score" key={score.label}>
                <span>{t(score.label)}</span>
                <b>{t(score.value)}/{t(score.max)}</b>
                <Progress value={(score.value / score.max) * 100} />
              </div>
            ))}
          </article>
        </div>
        <div className="essay-revision">
          <div>
            <span>{t("预设修改示例 · 需教师复核")}</span>
            <p>{t(essayWorkbench.revision)}</p>
          </div>
          <div className="teacher-control-list">
            {essayWorkbench.teacherControl.map((item) => (
              <span key={item}>{t(item)}</span>
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
  const { t } = useLocale();
  const wrongAttempts = attempts.filter((attempt) => attempt.questionId === question.id && !attempt.isCorrect);
  const rightAttempts = attempts.filter((attempt) => attempt.questionId === question.id && attempt.isCorrect);
  const questionAttemptCount = wrongAttempts.length + rightAttempts.length;
  const wrongRate = questionAttemptCount ? wrongAttempts.length / questionAttemptCount : null;
  const correctRate = questionAttemptCount ? rightAttempts.length / questionAttemptCount : null;
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
        <PanelHeader icon={ClipboardList} title={t("题目列表")} action={t("题库参考正确率 · 非班级统计")} />
        <div className="chip-list vertical">
          {questions.map((item) => (
            <button
              className={selectedQuestionId === item.id ? "question-chip active" : "question-chip"}
              key={item.id}
              onClick={() => setSelectedQuestionId(item.id)}
              type="button"
            >
              <span>Q{t(item.number)}</span>
              <strong>{t(item.questionType)}</strong>
              <small>{t(percent(item.correctRate))}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="panel diagnosis-main">
        <div className="diagnosis-heading">
          <div>
            <p className="eyebrow">{t(question.passageTheme)}</p>
            <h2>Q{t(question.number)}. {t(question.title)}</h2>
          </div>
          <button className="primary-button" onClick={onGeneratePractice} type="button">
            <Sparkles size={16} />{t("生成同类练习")}</button>
        </div>

        <div className="diagnosis-cards">
          <div className="diagnosis-card">
            <span>{t("错题类型")}</span>
            <strong>{t(question.questionType)}</strong>
            <small>{t("参考答案：")}{t(question.answer)}</small>
          </div>
          <div className="diagnosis-card">
            <span>{t("错误比例")}</span>
            <strong>{t(percent(wrongRate))}</strong>
            <small>{t(questionAttemptCount)}{t(" 份本题作答 · 主要误选：")}{t(question.topWrongOption)}</small>
          </div>
          <div className="diagnosis-card">
            <span>{t("平均用时")}</span>
            <strong>{t(question.averageTime)}s</strong>
            <small>{t(question.averageTime > 180 ? "写作题" : "阅读题")}</small>
          </div>
        </div>

        <div className="reason-block">
          <PanelHeader icon={SearchCheck} title={t("错误原因分析")} action={t("可能错因 · 待教师复核")} />
          <div className="tag-row">
            {question.diagnosis.causes.map((cause) => (
              <span className="tag" key={cause}>{t(cause)}</span>
            ))}
          </div>
          <p className="question-response-evidence">{t(questionAttemptCount ? `当前筛选范围：${questionAttemptCount} 份本题作答，${rightAttempts.length} 份正确、${wrongAttempts.length} 份错误。` : "当前筛选范围暂无本题作答记录。")}</p>
          <small>{t("以下为题库错因假设，待教师结合原文和学生解释复核。")}</small>
          <p>{t(question.diagnosis.narrative)}</p>
        </div>

        <div className="teacher-output">
          <span>{t("可落地输出")}</span>
          <strong>{t("备课组可以把这道题拆成“错因讲评 + 变式训练 + 课后跟进”三段式微课。")}</strong>
        </div>

        <div className="option-analysis">
          <PanelHeader icon={Brain} title={t("误选项与学生误区")} action={t("讲评示例 · 非本班选项统计")} />
          <div className="option-list">
            {optionRows.map((row) => (
              <article className="option-row" key={row.option}>
                <div className="option-share">
                  <strong>{t(row.option)}</strong>
                  <span>{t(row.share)}%</span>
                </div>
                <div>
                  <b>{t(row.misconception)}</b>
                  <p>{t(row.evidence)}</p>
                  <small>{t(row.action)}</small>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="insight-grid">
          <div className="insight-box">
            <h3>{t("教学启示")}</h3>
            <strong>{t(question.diagnosis.teachingInsight.title)}</strong>
            <p>{t(question.diagnosis.teachingInsight.suggestion)}</p>
          </div>
          <div className="insight-box">
            <h3>{t("教考衔接")}</h3>
            <strong>{t(question.diagnosis.teachingInsight.focus)}</strong>
            <p>{t(question.diagnosis.teachingInsight.gaokaoAlignment)}</p>
          </div>
        </div>
      </section>

      <section className="panel student-split">
        <PanelHeader icon={Users} title={t("学生分布")} action={t("{0} 对 / {1} 错", [rightAttempts.length, wrongAttempts.length])} />
        <div className="donut-wrap">
          <div
            className="donut"
            style={{
              background: `conic-gradient(#6951d5 0 ${(correctRate ?? 0) * 360}deg, #e7be65 ${(correctRate ?? 0) * 360}deg 360deg)`,
            }}
          >
            <span>{t(percent(correctRate))}</span>
          </div>
          <div className="legend-list">
            <span><i className="blue" />{t("正确")}</span>
            <span><i className="amber" />{t("错误")}</span>
          </div>
        </div>
        <div className="wrong-list">
          {wrongAttempts.slice(0, 6).map((attempt) => (
            <div className="wrong-student" key={`${attempt.studentId}-${attempt.questionId}`}>
              <span>{t(attempt.studentName)}</span>
              <small>{t(attempt.cause)}</small>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const warningStatusFlow: WarningStatus[] = ["未处理", "已安排", "已复盘"];

const classCompareData = classSnapshots.map((snapshot) => ({
  name: snapshot.className,
  平均正确率: Math.round(snapshot.averageAccuracy * 100),
  完成率: Math.round(snapshot.completionRate * 100),
  写作达成: Math.round((snapshot.writingScore / 40) * 100),
}));

function AnalyticsPanel({ warningStatusMap, onWarningChange, assignedMasteryTasks, onAssignTask }: {
  warningStatusMap: Record<string, WarningStatus>;
  onWarningChange: (student: string, status: WarningStatus) => void;
  assignedMasteryTasks: string[];
  onAssignTask: (key: string) => void;
}) {
  const { t, locale } = useLocale();
  const [copiedAnalyticsText, setCopiedAnalyticsText] = useState("");
  const [analyticsCopyError, setAnalyticsCopyError] = useState("");
  const [masteryFilter, setMasteryFilter] = useState<"all" | "attention" | "stable">("all");
  const [selectedMasteryStudent, setSelectedMasteryStudent] = useState(masteryMatrix[0].student);
  const [selectedMasterySkill, setSelectedMasterySkill] = useState<(typeof masteryMatrixSkills)[number]>("词汇语境");

  const getMasteryRows = (filter: "all" | "attention" | "stable") => masteryMatrix.filter((row) => {
    const values = Object.values(row.values);
    if (filter === "attention") return values.some((score) => score < 60);
    if (filter === "stable") return values.every((score) => score >= 65);
    return true;
  });
  const filteredMasteryRows = getMasteryRows(masteryFilter);
  const selectedMasteryRow = masteryMatrix.find((row) => row.student === selectedMasteryStudent) ?? masteryMatrix[0];
  const selectedMasteryAction = masterySkillActions.find((item) => item.skill === selectedMasterySkill) ?? masterySkillActions[0];
  const selectedMasteryScore = selectedMasteryRow.values[selectedMasterySkill];
  const selectedMasteryKey = `${selectedMasteryStudent}-${selectedMasterySkill}`;

  const handleMasteryFilter = (nextFilter: "all" | "attention" | "stable") => {
    const nextRows = getMasteryRows(nextFilter);
    setMasteryFilter(nextFilter);
    if (!nextRows.some((row) => row.student === selectedMasteryStudent) && nextRows[0]) {
      const weakestSkill = masteryMatrixSkills.reduce((weakest, skill) =>
        nextRows[0].values[skill] < nextRows[0].values[weakest] ? skill : weakest,
      masteryMatrixSkills[0]);
      setSelectedMasteryStudent(nextRows[0].student);
      setSelectedMasterySkill(weakestSkill);
    }
  };

  const cycleWarningStatus = (student: string) => {
    const current = warningStatusMap[student] ?? "未处理";
    onWarningChange(student, warningStatusFlow[(warningStatusFlow.indexOf(current) + 1) % warningStatusFlow.length]);
  };

  const handleCopyAnalytics = async (kind: string, text: string) => {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(text);
      setCopiedAnalyticsText(`${kind}:${locale}`);
      setAnalyticsCopyError("");
    } catch {
      setCopiedAnalyticsText("");
      setAnalyticsCopyError("未能复制，请使用下载按钮。");
    }
  };

  const lessonPlanText = `${t("讲评课备课单（40分钟）")}\n\n${reviewLessonPlan
    .map((item) => `${t(item.phase)} · ${t(item.title)}\n${t(item.output)}`)
    .join("\n\n")}`;
  const weeklyPreviewText = reportPreviewItems
    .map((item) => `[${t(item.audience)}] ${t(item.title)}\n${t(item.detail)}`)
    .join("\n\n");

  return (
    <div className="analytics-grid">
      <section className="panel chart-panel wide">
        <PanelHeader icon={BarChart3} title={t("题型 × 错因堆叠")} action={t("阅读理解重点复盘")} />
        <div className="chart-takeaway">{t("当前最集中的问题不是单纯“不会做题”，而是篇章逻辑、词汇语境和审题边界叠加影响。")}</div>
        <div className="chart-frame">
          <ResponsiveContainer height={280} width="100%" initialDimension={{ width: 320, height: 280 }}>
            <BarChart data={causeStack} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#e6eaf1" strokeDasharray="3 3" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tickFormatter={(value) => chartLabel(value, locale)} interval={locale === "en" ? 0 : undefined} angle={locale === "en" ? -25 : 0} textAnchor={locale === "en" ? "end" : "middle"} height={locale === "en" ? 48 : 30} tick={{ fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip labelFormatter={(label) => t(String(label))} />
              <Legend />
              <Bar dataKey="词汇" stackId="a" fill="#2563eb" radius={[4, 4, 0, 0]} isAnimationActive={false} name={t("词汇")} />
              <Bar dataKey="句法" stackId="a" fill="#0f766e" radius={[4, 4, 0, 0]} isAnimationActive={false} name={t("句法")} />
              <Bar dataKey="篇章" stackId="a" fill="#f97316" radius={[4, 4, 0, 0]} isAnimationActive={false} name={t("篇章")} />
              <Bar dataKey="审题" stackId="a" fill="#dc2626" radius={[4, 4, 0, 0]} isAnimationActive={false} name={t("审题")} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="panel chart-panel">
        <PanelHeader icon={Activity} title={t("学生能力雷达")} action={t("年级均值")} />
        <div className="chart-frame">
          <ResponsiveContainer height={280} width="100%" initialDimension={{ width: 320, height: 280 }}>
            <RadarChart data={skillRadar} outerRadius={locale === "en" ? "48%" : "80%"}>
              <PolarGrid stroke="#d9e1ec" />
              <PolarAngleAxis dataKey="skill" tick={{ fill: "#475569", fontSize: 11 }} tickFormatter={(value) => chartLabel(value, locale)} />
              <Radar
                dataKey="value"
                name={t("掌握度")}
                fill="#2563eb"
                fillOpacity={0.22}
                stroke="#2563eb"
                strokeWidth={3}
                isAnimationActive={false}
              />
              <Tooltip labelFormatter={(label) => t(String(label))} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="panel heatmap-panel">
        <PanelHeader icon={Target} title={t("题型热力图")} action={t("正确率 %")} />
        <div className="heatmap">
          <div className="heatmap-row header">
            <span />
            {heatmapColumns.map((column) => (
              <b key={column}>{t(column)}</b>
            ))}
          </div>
          {heatmap.map((row) => (
            <div className="heatmap-row" key={row.row}>
              <strong>{t(row.row)}</strong>
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
                  {t(value)}
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="panel mastery-panel full">
        <PanelHeader icon={Users} title={t("学生 × 能力掌握矩阵")} action={t("从班级结论下钻到个人证据")} />
        <div className="mastery-toolbar">
          <div className="mastery-segments" aria-label={t("掌握矩阵筛选")}>
            {[
              ["all", "全部学生"],
              ["attention", "需关注"],
              ["stable", "稳定达成"],
            ].map(([id, label]) => (
              <button
                className={masteryFilter === id ? "active" : ""}
                key={id}
                onClick={() => handleMasteryFilter(id as "all" | "attention" | "stable")}
                type="button"
              >
                {t(label)}
              </button>
            ))}
          </div>
          <div className="mastery-legend" aria-label={t("掌握度图例")}>
            <span><i className="risk" />{t("不足 60")}</span>
            <span><i className="watch" />60-69</span>
            <span><i className="good" />{t("70 以上")}</span>
          </div>
        </div>
        <div className="mastery-layout">
          <div className="mastery-table-scroll">
            <div className="mastery-table" role="table" aria-label={t("学生能力掌握度")}>
              <div className="mastery-row mastery-head" role="row">
                <span role="columnheader">{t("学生 / 风险")}</span>
                {masteryMatrixSkills.map((skill) => (
                  <strong key={skill} role="columnheader">{t(skill)}</strong>
                ))}
              </div>
              {filteredMasteryRows.map((row) => (
                <div className="mastery-row" key={row.student} role="row">
                  <div className="mastery-student" role="rowheader">
                    <strong>{t(row.student)}</strong>
                    <span>{t(row.risk)} · {t(row.change)}</span>
                  </div>
                  {masteryMatrixSkills.map((skill) => {
                    const score = row.values[skill];
                    const tone = score < 60 ? "risk" : score < 70 ? "watch" : "good";
                    const selected = selectedMasteryStudent === row.student && selectedMasterySkill === skill;
                    return (
                      <button
                        aria-label={t("{0} {1} 掌握度 {2}%", [row.student, skill, score])}
                        aria-pressed={selected}
                        className={`mastery-cell ${tone}${selected ? " selected" : ""}`}
                        key={skill}
                        onClick={() => {
                          setSelectedMasteryStudent(row.student);
                          setSelectedMasterySkill(skill);
                        }}
                        type="button"
                      >
                        {t(score)}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <aside className="mastery-inspector" aria-live="polite">
            <span>{t("当前定位")}</span>
            <h3>{t(selectedMasteryRow.student)} · {t(selectedMasterySkill)}</h3>
            <div className="mastery-score-line">
              <strong>{t(selectedMasteryScore)}%</strong>
              <small>{t(selectedMasteryRow.risk)}{t(" · 六周变化 ")}{t(selectedMasteryRow.change)}</small>
            </div>
            <p>{t(selectedMasteryRow.summary)}</p>
            <dl>
              <div>
                <dt>{t("证据核对")}</dt>
                <dd>{t(selectedMasteryAction.evidence)}</dd>
              </div>
              <div>
                <dt>{t("建议任务")}</dt>
                <dd>{t(selectedMasteryAction.task)}</dd>
              </div>
              <div>
                <dt>{t("教考衔接")}</dt>
                <dd>{t(selectedMasteryAction.examLink)}</dd>
              </div>
            </dl>
            <button
              className="primary-button"
              onClick={() => onAssignTask(selectedMasteryKey)}
              aria-pressed={assignedMasteryTasks.includes(selectedMasteryKey)}
              type="button"
            >
              <Send size={15} />
              {t(assignedMasteryTasks.includes(selectedMasteryKey) ? "已加入跟进清单" : "加入跟进清单")}
            </button>
          </aside>
        </div>
      </section>

      <section className="panel knowledge-panel full">
        <PanelHeader icon={Brain} title={t("英语知识与能力图谱")} action={t("能力点 -> 错因 -> 任务")} />
        <div className="knowledge-map">
          {knowledgeGraphNodes.map((node) => (
            <article className="knowledge-node" key={node.skill}>
              <div>
                <span>{t(node.skill)}</span>
                <strong>{t(node.mastery)}%</strong>
              </div>
              <Progress value={node.mastery} />
              <p>{t(node.evidence)}</p>
              <small>{t(node.linkedTask)}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="panel repeated-error-panel full">
        <PanelHeader icon={RefreshCw} title={t("重复错因追踪")} action={t("跨周复现 -> 干预 -> 再测")} />
        <div className="repeat-track-grid">
          {repeatedErrorTracks.map((item) => (
            <article className={`repeat-track-card ${item.retest === "未达标" ? "risk" : item.retest === "进行中" ? "active" : "done"}`} key={item.skill}>
              <div>
                <span>{t(item.weeks)}</span>
                <strong>{t(item.skill)}</strong>
                <b>{t("{0}人", [item.students])}</b>
              </div>
              <p>{t(item.evidence)}</p>
              <small>{t(item.intervention)}</small>
              <em>{t(item.retest)}</em>
            </article>
          ))}
        </div>
      </section>

      <section className="panel chart-panel wide">
        <PanelHeader icon={BarChart3} title={t("班级横向对比")} action={t("正确率 / 完成率 / 写作达成率 %")} />
        <div className="chart-takeaway">{t("高二(7)班整体落后约 5 个百分点且需跟进人数最多，建议备课组优先共享高二(3)班的讲评课设计。")}</div>
        <div className="chart-frame">
          <ResponsiveContainer height={260} width="100%" initialDimension={{ width: 320, height: 260 }}>
            <BarChart data={classCompareData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#e6eaf1" strokeDasharray="3 3" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tickFormatter={(value) => chartLabel(value, locale)} interval={0} tick={{ fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip labelFormatter={(label) => t(String(label))} />
              <Legend />
              <Bar dataKey="平均正确率" fill="#2563eb" radius={[4, 4, 0, 0]} isAnimationActive={false} name={t("平均正确率")} />
              <Bar dataKey="完成率" fill="#16a34a" radius={[4, 4, 0, 0]} isAnimationActive={false} name={t("完成率")} />
              <Bar dataKey="写作达成" fill="#f97316" radius={[4, 4, 0, 0]} isAnimationActive={false} name={t("写作达成")} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="panel warning-panel">
        <PanelHeader icon={AlertTriangle} title={t("学生预警中心")} action={t("点击状态可流转：未处理→已安排→已复盘")} />
        <div className="warning-list">
          {warningCases.map((item) => {
            const status = warningStatusMap[item.student] ?? item.status;
            return (
              <article className={`warning-card level-${item.level}`} key={item.student}>
                <div className="warning-head">
                  <strong>{t(item.student)}</strong>
                  <span>{t("{0}风险", [item.level])}</span>
                </div>
                <p>{t(item.reason)}</p>
                <small>{t(item.action)}</small>
                <div className="warning-foot">
                  <b>{t(item.owner)}</b>
                  <button
                    className={`warning-status-chip status-${warningStatusFlow.indexOf(status)}`}
                    onClick={() => cycleWarningStatus(item.student)}
                    title={t("点击切换处理状态")}
                    type="button"
                  >
                    {t(status)}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="panel lesson-plan-panel">
        <PanelHeader icon={ClipboardCheck} title={t("讲评课备课单")} action={t("课前-课中-课后闭环")} />
        {analyticsCopyError && <p role="status">{t(analyticsCopyError)}</p>}
        <div className="panel-inline-actions">
          <button
            className="secondary-button"
            onClick={() => handleCopyAnalytics("lesson", lessonPlanText)}
            type="button"
          >
            <ClipboardCheck size={16} />
            {t(copiedAnalyticsText === `lesson:${locale}` ? "已复制备课单" : "复制备课单")}
          </button>
          <button
            className="secondary-button"
            onClick={() => downloadTextFile(lessonPlanText, t("讲评课备课单.md"), "text/markdown;charset=utf-8")}
            type="button"
          >
            <Download size={16} />{t("导出教案大纲")}</button>
        </div>
        <div className="lesson-brief">
          {reviewLessonPlan.map((item) => (
            <article key={item.phase}>
              <span>{t(item.phase)}</span>
              <strong>{t(item.title)}</strong>
              <p>{t(item.output)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel chart-panel wide">
        <PanelHeader icon={LineChart} title={t("分项正确率趋势")} action={t("阅读 / 写作 / 听说")} />
        <div className="chart-frame">
          <ResponsiveContainer height={240} width="100%" initialDimension={{ width: 320, height: 240 }}>
            <ReLineChart data={accuracyTrend} margin={{ top: 10, right: 22, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#e6eaf1" strokeDasharray="3 3" />
              <XAxis dataKey="week" tickLine={false} axisLine={false} tickFormatter={(value) => t(String(value))} />
              <YAxis tickLine={false} axisLine={false} domain={[40, 90]} />
              <Tooltip labelFormatter={(label) => t(String(label))} />
              <Legend />
              <Line dataKey="阅读" stroke="#2563eb" strokeWidth={3} type="monotone" isAnimationActive={false} name={t("阅读")} />
              <Line dataKey="写作" stroke="#f97316" strokeWidth={3} type="monotone" isAnimationActive={false} name={t("写作")} />
              <Line dataKey="听说" stroke="#16a34a" strokeWidth={3} type="monotone" isAnimationActive={false} name={t("听说")} />
            </ReLineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="panel report-preview-panel full">
        <PanelHeader icon={Download} title={t("周报与家校沟通预览")} action={t("可复制 · 可导出")} />
        {analyticsCopyError && <p role="status">{t(analyticsCopyError)}</p>}
        <div className="panel-inline-actions">
          <button
            className="secondary-button"
            onClick={() => handleCopyAnalytics("weekly", weeklyPreviewText)}
            type="button"
          >
            <ClipboardCheck size={16} />
            {t(copiedAnalyticsText === `weekly:${locale}` ? "已复制摘要" : "复制三版摘要")}
          </button>
          <button
            className="secondary-button"
            onClick={() => downloadTextFile(weeklyPreviewText, t("周报摘要.md"), "text/markdown;charset=utf-8")}
            type="button"
          >
            <Download size={16} />{t("下载摘要")}</button>
        </div>
        <div className="report-preview-grid">
          {reportPreviewItems.map((item) => (
            <article key={item.audience}>
              <span>{t(item.audience)}</span>
              <strong>{t(item.title)}</strong>
              <p>{t(item.detail)}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function ReportsPanel({
  drafts,
  onDraftChange,
  selectedTone,
  setSelectedTone,
  copiedReport,
  selectedReportId,
  setCopiedReport,
  setSelectedReportId,
}: {
  drafts: Record<string, string>;
  onDraftChange: (key: string, value: string) => void;
  selectedTone: ReportTone;
  setSelectedTone: (tone: ReportTone) => void;
  copiedReport: string;
  selectedReportId: string;
  setCopiedReport: (value: string) => void;
  setSelectedReportId: (value: string) => void;
}) {
  const { t, locale } = useLocale();
  const selectedReport =
    reportTemplates.find((item) => item.id === selectedReportId) ?? reportTemplates[0];
  const [editing, setEditing] = useState(false);
  const [copyError, setCopyError] = useState("");
  const toneOptions: ReportTone[] = ["正式", "简洁", "鼓励"];
  const variant = selectedReport.tones[selectedTone];
  const draftKey = `${selectedReport.id}:${selectedTone}:${locale}`;
  const defaultBody = `${t(variant.body)}\n\n${variant.bullets.map((item) => `- ${t(item)}`).join("\n")}`;
  const draft = drafts[draftKey] ?? defaultBody;
  const reportText = `${t("{0}（{1} · {2}语气）", [selectedReport.title, selectedReport.audience, selectedTone])}\n\n${draft}`;

  const handleCopy = async () => {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(reportText);
      setCopiedReport(reportText);
      setCopyError("");
    } catch { setCopyError("未能复制，请下载 Markdown 或手动选择正文。"); }
  };

  const handleSelectReport = (id: string) => {
    setSelectedReportId(id);
    const nextReport = reportTemplates.find((item) => item.id === id);
    if (nextReport) setSelectedTone(nextReport.tone);
  };

  const handleDownload = () => {
    downloadTextFile(
      `# ${reportText}`,
      `${t(selectedReport.audience)}-${t(selectedTone)}.md`,
      "text/markdown;charset=utf-8",
    );
  };

  const handlePrint = () => {
    document.body.classList.add("print-report-only");
    const cleanup = () => {
      document.body.classList.remove("print-report-only");
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    window.print();
  };

  return (
    <div className="reports-layout">
      <section className="panel report-switch-panel">
        <PanelHeader icon={FileText} title={t("报告类型")} action={t("一键生成 · 老师可编辑")} />
        <div className="report-type-list">
          {reportTemplates.map((item) => (
            <button
              className={selectedReport.id === item.id ? "report-type active" : "report-type"}
              key={item.id}
              onClick={() => handleSelectReport(item.id)}
              type="button"
            >
              <span>{t(item.audience)}</span>
              <strong>{t(item.title)}</strong>
              <small>{t("默认 {0}语气 · 可切换", [item.tone])}</small>
            </button>
          ))}
        </div>
        <div className="privacy-note">
          <ShieldCheck size={16} />
          <span>{t("家长版默认隐藏班级排名，只展示进步、风险和下一步任务。")}</span>
        </div>
      </section>

      <section className="panel report-editor-panel">
        <PanelHeader icon={MessageSquareText} title={t(selectedReport.title)} action={t("{0} · {1}语气", [selectedReport.audience, selectedTone])} />
        <div className="report-toolbar">
          <button className="primary-button" onClick={handleCopy} type="button">
            <ClipboardCheck size={16} />
            {t(copiedReport === reportText ? "已复制" : "复制报告")}
          </button>
          <button className="secondary-button" onClick={handleDownload} type="button">
            <Download size={16} />{t("下载 Markdown")}</button>
          <button className="secondary-button" onClick={handlePrint} type="button">
            <Printer size={16} />{t("打印 / 存 PDF")}</button>
          <button className="secondary-button" type="button" aria-pressed={editing} onClick={() => setEditing(!editing)}>
            <PencilLine size={16} aria-hidden="true" />{t(editing ? "完成编辑" : "编辑报告")}
          </button>
          <div className="tone-switch" role="group" aria-label={t("改写语气")}>
            <Sparkles size={14} />
            {toneOptions.map((tone) => (
              <button
                className={selectedTone === tone ? "tone-chip active" : "tone-chip"}
                key={tone}
                onClick={() => setSelectedTone(tone)}
                aria-pressed={selectedTone === tone}
                type="button"
              >
                {t(tone)}
              </button>
            ))}
          </div>
        </div>
        {copyError && <p role="status">{t(copyError)}</p>}
        <article className="report-document">
          <span>{t(drafts[draftKey] !== undefined ? "教师修改稿" : "示例报告")} · {t("{0}语气 · 当前页面暂存", [selectedTone])}</span>
          <h2>{t(selectedReport.title)}</h2>
          {editing ? <textarea className="report-draft-input" aria-label={t("报告正文")} maxLength={12000} value={draft} onChange={(event) => onDraftChange(draftKey, event.target.value)} /> : <p className="report-draft-preview">{draft}</p>}
        </article>
      </section>

      <section className="panel report-delivery-panel">
        <PanelHeader icon={Send} title={t("发送前检查")} action={t("备课组 / 学生 / 家长")} />
        <div className="delivery-checks">
          {[
            ["数据口径", "已使用模拟周测与错因数据"],
            ["隐私处理", selectedReport.id === "parent" ? "已隐藏排名与班级比较" : "仅展示匿名学生编号"],
            ["下一步任务", "已包含订正、同类练习与再测提醒"],
          ].map(([title, detail]) => (
            <div key={title}>
              <CircleCheck size={16} />
              <strong>{t(title)}</strong>
              <span>{t(detail)}</span>
            </div>
          ))}
        </div>
        <div className="report-preview-grid compact">
          {reportPreviewItems.map((item) => (
            <article key={item.audience}>
              <span>{t(item.audience)}</span>
              <strong>{t(item.title)}</strong>
              <p>{t(item.detail)}</p>
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
  liveSummary,
  question,
  selectedClass,
  setCopiedImaText,
}: {
  classSnapshot: (typeof classSnapshots)[number];
  copiedImaText: string;
  liveSummary: LiveDataSummary | null;
  question: QuestionItem;
  selectedClass: string;
  setCopiedImaText: (value: string) => void;
}) {
  const { t } = useLocale();
  const learningSummary = t(buildImaLearningSummary({
    className: selectedClass,
    classSnapshot,
    liveSummary,
    question,
  }));
  const knowledgePrompt = t(buildImaKnowledgePrompt());
  const [imaCopyError, setImaCopyError] = useState("");

  const handleCopy = async (_kind: "summary" | "knowledge", text: string) => {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(text);
      setCopiedImaText(text);
      setImaCopyError("");
    } catch {
      setCopiedImaText("");
      setImaCopyError("未能复制，请手动选择下方文本。");
    }
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
            <Brain size={16} />{t("知识库桥接 · 不替代学情数据库")}</span>
          <h2>{t("把结构化学情结果带到ima里，用校本知识生成备课建议")}</h2>
          <p>{t("本平台只在本地解析成绩和整理摘要。教师可自行复核并复制匿名摘要，是否粘贴到外部工具由教师决定。")}</p>
          <div className="hero-actions">
            <a className="primary-button ima-open-link" href="https://ima.qq.com/" rel="noreferrer" target="_blank">
              <ExternalLink size={16} />{t("打开 ima")}</a>
            <button
              className="secondary-button"
              onClick={() => handleCopy("summary", learningSummary)}
              type="button"
            >
              <ClipboardCheck size={16} />
              {t(copiedImaText === learningSummary ? "已复制学情摘要" : "复制学情摘要")}
            </button>
            <button
              className="secondary-button"
              onClick={() => handleCopy("knowledge", knowledgePrompt)}
              type="button"
            >
              <Sparkles size={16} />
              {t(copiedImaText === knowledgePrompt ? "已复制提示词" : "复制知识库提示词")}
            </button>
          </div>
        </div>
        <div className="ima-privacy-card">
          {imaCopyError && <p role="status">{t(imaCopyError)}</p>}
          <ShieldCheck size={22} />
          <strong>{t("本地处理")}</strong>
          <p>{t("没有密钥输入或在线生成功能。复制摘要不会自动发送数据；外部工具有其独立的数据规则。")}</p>
        </div>
      </section>

      <section className="ima-workflow-grid">
        {workflowSteps.map(([title, detail], index) => (
          <article className="panel ima-step-card" key={title}>
            <span>{t(String(index + 1).padStart(2, "0"))}</span>
            <strong>{t(title)}</strong>
            <p>{t(detail)}</p>
          </article>
        ))}
      </section>

      <section className="panel ima-current-context">
        <PanelHeader icon={ClipboardCheck} title={t("即将复制给ima的匿名摘要")} action={t("{0} · Q{1}", [selectedClass, question.number])} />
        <div className="ima-context-grid">
          <div>
            <span>{t("班级概况")}</span>
            <strong>{t(percent(classSnapshot.averageAccuracy))}</strong>
            <small>{t("平均正确率")} · {t("{0}人需跟进", [classSnapshot.riskStudents])}</small>
          </div>
          <div>
            <span>{t("重点错题")}</span>
            <strong>Q{t(question.number)} {t(question.questionType)}</strong>
            <small>{t(question.diagnosis.causes.join(" / "))}</small>
          </div>
          <div>
            <span>{t("本地解析")}</span>
            <strong>{t(liveSummary ? `${liveSummary.rowCount}人` : "未导入")}</strong>
            <small>{t(liveSummary ? `平均达成率 ${percent(liveSummary.averageRate)}` : "导入后会补充班级摘要")}</small>
          </div>
        </div>
      </section>

      <section className="panel ima-resource-panel">
        <PanelHeader icon={BookMarked} title={t("建议放进ima的资料")} action={t("资料库，不是学生数据库")} />
        <div className="ima-resource-grid">
          {knowledgeCards.map((item) => (
            <article className="ima-resource-card" key={item.title}>
              <span>{t(item.tag)}</span>
              <strong>{t(item.title)}</strong>
              <p>{t(item.detail)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel ima-boundary-panel">
        <PanelHeader icon={ShieldCheck} title={t("v1接入边界")} action={t("外部工作台链接")} />
        <div className="delivery-checks">
          {[
            ["不嵌入", "不把ima嵌到iframe里，避免登录和权限问题。"],
            ["不上传", "不自动上传原始成绩表或学生明细。"],
            ["不存密钥", "不保存ima账号、Cookie、OAuth或任何访问令牌。"],
          ].map(([title, detail]) => (
            <div key={title}>
              <CircleCheck size={16} />
              <strong>{t(title)}</strong>
              <span>{t(detail)}</span>
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
  const { t } = useLocale();
  const items = generated.length ? generated : question.diagnosis.practiceItems;

  return (
    <div className="practice-layout">
      <section className="panel practice-hero">
        <PanelHeader icon={BookMarked} title={t("拓展练习包")} action={t("基于 Q{0} {1}", [question.number, question.questionType])} />
        <div className="practice-summary">
          <div>
            <span>{t("目标题型")}</span>
            <strong>{t(question.questionType)}</strong>
          </div>
          <div>
            <span>{t("错因聚焦")}</span>
            <strong>{t(question.diagnosis.causes.slice(0, 2).join(" / "))}</strong>
          </div>
          <div>
            <span>{t("练习数量")}</span>
            <strong>{t(items.length)}{t(" 题")}</strong>
          </div>
        </div>
        <button className="primary-button" onClick={onGeneratePractice} type="button">
          <Sparkles size={16} />{t("重新生成")}</button>
      </section>

      <section className="practice-list">
        {items.map((item) => (
          <article className="panel practice-card" key={item.id}>
            <div className="practice-card-head">
              <span className="difficulty">{t(item.difficulty)}</span>
              <span>{t(item.targetSkill)}</span>
            </div>
            <h2>{t(item.title)}</h2>
            <p>{t(item.prompt)}</p>
            {item.choices && (
              <div className="choice-grid">
                {item.choices.map((choice) => (
                  <span key={choice}>{t(choice)}</span>
                ))}
              </div>
            )}
            <div className="answer-line">
              <CircleCheck size={16} />
              <strong>{t("答案 ")}{t(item.answer)}</strong>
              <span>{t(item.explanation)}</span>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

function StudentPanel({
  followUpTasks,
  onFollowUpChange,
  students,
  selectedStudentId,
  setSelectedStudentId,
  attempts,
  wrongAttempts,
  questions,
}: {
  followUpTasks: string[];
  onFollowUpChange: (tasks: string[]) => void;
  students: StudentAttempt[];
  selectedStudentId: string;
  setSelectedStudentId: (id: string) => void;
  attempts: StudentAttempt[];
  wrongAttempts: StudentAttempt[];
  questions: QuestionItem[];
}) {
  const { t } = useLocale();
  const averageMastery = attempts.length
    ? Math.round(attempts.reduce((sum, attempt) => sum + attempt.mastery, 0) / attempts.length)
    : 0;
  const selectedStudent = students.find((student) => student.studentId === selectedStudentId);
  const savedProfile = studentProgressProfiles.find((item) => item.studentId === selectedStudentId);
  const profile = savedProfile ?? {
    phase: "待建立跟踪", riskLevel: "待评估", summary: "暂无该学生的长期跟踪档案；下方仅展示本次作答记录，不套用其他学生的历史数据。",
    focusSkills: [...new Set(wrongAttempts.map((attempt) => questions.find((question) => question.id === attempt.questionId)?.questionType).filter((skill): skill is NonNullable<typeof skill> => !!skill))],
    nextReview: "待教师安排", progressTrend: [], framework: [], trackers: [],
  };
  const riskTone =
    profile.riskLevel === "高" ? "high" : profile.riskLevel === "中" ? "medium" : profile.riskLevel === "低" ? "low" : "unknown";
  const statusClass = (status: string) =>
    status === "已完成" ? "done" : status === "进行中" ? "active" : "pending";
  const [copiedMistakeBook, setCopiedMistakeBook] = useState("");
  const [studentCopyError, setStudentCopyError] = useState("");

  const handleGenerateFollowUp = () => {
    const skillTasks = profile.focusSkills.slice(0, 3).map(
      (skill, index) => `任务${index + 1}：完成「${skill}」专项练习 2 题，每题写出保留与排除选项的证据句。`,
    );
    const correctionTasks = wrongAttempts
      .slice(0, 2)
      .map((attempt) => {
        const question = questions.find((item) => item.id === attempt.questionId);
        return `订正：Q${question?.number ?? "?"} ${question?.questionType ?? ""}（错因：${attempt.cause}），写出正确答案的原文依据。`;
      });
    onFollowUpChange([...skillTasks, ...correctionTasks, `复盘：${profile.nextReview}，目标与时间由教师确认。`]);
  };

  const buildMistakeBookText = () => {
    const entries = wrongAttempts.map((attempt) => {
      const question = questions.find((item) => item.id === attempt.questionId) ?? questions[0];
      return [
        `## Q${question.number} ${t(question.questionType)} (${question.title})`,
        t("- 我的答案：{0}　参考答案：{1}", [attempt.selected, question.answer]),
        t("- 错因：{0}", [attempt.cause]),
        t("- 讲解：{0}", [question.diagnosis.narrative]),
        t("- 建议：{0}", [question.diagnosis.teachingInsight.suggestion]),
      ].join("\n");
    });
    return [
      t("# {0} 个人错题本", [selectedStudent?.studentName ?? "匿名学生"]),
      t("掌握度：{0}%　跟踪等级：{1}　下次复盘：{2}", [averageMastery, profile.riskLevel, profile.nextReview]),
      "",
      entries.length ? entries.join("\n\n") : t("本次暂无错题。"),
    ].join("\n");
  };

  return (
    <div className="student-layout">
      <section className="panel student-selector">
        <PanelHeader icon={UserRound} title={t("学生")} action={t("匿名演示")} />
        <div className="student-list">
          {students.map((student) => (
            <button
              className={selectedStudentId === student.studentId ? "student-row active" : "student-row"}
              key={student.studentId}
              onClick={() => setSelectedStudentId(student.studentId)}
              type="button"
            >
              <span>{t(student.studentName)}</span>
              <small>{t(student.className)}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="student-main">
        <div className="metric-grid compact">
          <MetricCard icon={Target} label={t("掌握度")} tone="blue" value={t("{0}%", [averageMastery])} trend={t("个人画像")} />
          <MetricCard icon={AlertTriangle} label={t("错题数")} tone="red" value={t("{0}", [wrongAttempts.length])} trend={t("需订正")} />
          <MetricCard icon={ShieldCheck} label={t("跟踪等级")} tone={riskTone === "high" ? "red" : riskTone === "medium" ? "orange" : riskTone === "low" ? "green" : "blue"} value={t(profile.riskLevel)} trend={t(profile.phase)} />
        </div>

        <section className="panel student-profile-hero">
          <div className="student-identity">
            <span className="profile-kicker">{t("学生学情画像")}</span>
            <h2>{t(selectedStudent?.studentName ?? "匿名学生")}</h2>
            <p>{t(profile.summary)}</p>
            <div className="skill-pill-list">
              {profile.focusSkills.map((skill) => (
                <span key={skill}>{t(skill)}</span>
              ))}
            </div>
            <div className="privacy-flags">
              <span>{t("教师可见：完整错因证据")}</span>
              <span>{t("家长版：隐藏排名与班级比较")}</span>
            </div>
          </div>
          <div className="profile-review-card">
            <span className={`risk-badge ${riskTone}`}>{t(savedProfile ? `${profile.riskLevel}风险` : "待评估")}</span>
            <strong>{t(profile.phase)}</strong>
            <small>{t("下一次复盘：")}{t(profile.nextReview)}</small>
            <button className="ghost-button" onClick={handleGenerateFollowUp} type="button">
              <RefreshCw size={16} />
              {t(followUpTasks.length ? "重新生成跟进任务" : "生成跟进任务")}
            </button>
          </div>
        </section>

        {followUpTasks.length > 0 && (
          <section className="panel follow-up-panel">
            <PanelHeader icon={ClipboardList} title={t("跟进任务草稿")} action={t("本地规则生成 · 待教师复核")} />
            <ol className="follow-up-list">
              {followUpTasks.map((task) => (
                <li key={task}>{t(task)}</li>
              ))}
            </ol>
            <div className="panel-inline-actions">
              <button
                className="secondary-button"
                onClick={() => {
                  void navigator.clipboard?.writeText(followUpTasks.map((task, index) => `${index + 1}. ${t(task)}`).join("\n"));
                }}
                type="button"
              >
                <ClipboardCheck size={16} />{t("复制任务清单")}</button>
            </div>
          </section>
        )}

        <div className="student-progress-grid">
          <section className="panel">
            <PanelHeader icon={LineChart} title={t("个人学习进度曲线")} action={t("按周跟踪")} />
            {profile.progressTrend.length > 0 ? <div className="chart-box student-chart">
              <ResponsiveContainer width="100%" height={250} initialDimension={{ width: 320, height: 250 }}>
                <ReLineChart data={profile.progressTrend} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="week" tickLine={false} axisLine={false} tickFormatter={(value) => t(String(value))} />
                  <YAxis domain={[40, 100]} tickLine={false} axisLine={false} />
                  <Tooltip labelFormatter={(label) => t(String(label))} />
                  <Legend />
                  <Line type="monotone" dataKey="阅读" stroke="#2563eb" strokeWidth={3} dot={{ r: 3 }} isAnimationActive={false} name={t("阅读")} />
                  <Line type="monotone" dataKey="写作" stroke="#16a34a" strokeWidth={3} dot={{ r: 3 }} isAnimationActive={false} name={t("写作")} />
                  <Line type="monotone" dataKey="听说" stroke="#f97316" strokeWidth={3} dot={{ r: 3 }} isAnimationActive={false} name={t("听说")} />
                  <Line type="monotone" dataKey="综合" stroke="#0f766e" strokeWidth={3} dot={{ r: 3 }} isAnimationActive={false} name={t("综合")} />
                </ReLineChart>
              </ResponsiveContainer>
            </div> : <div className="empty-state"><strong>{t("暂无历史测验记录")}</strong><span>{t("累计多次测验后再展示学习趋势。")}</span></div>}
          </section>

          <section className="panel">
            <PanelHeader icon={ClipboardList} title={t("学习进度框架图")} action={t("诊断-干预-跟踪-调整")} />
            <div className="framework-map">
              {!profile.framework.length && <p className="empty-state">{t("暂无已确认的干预计划")}</p>}
              {profile.framework.map((step, index) => (
                <article className={`framework-step ${statusClass(step.status)}`} key={step.stage}>
                  <span className="step-index">{t(index + 1)}</span>
                  <small>{t(step.stage)}</small>
                  <strong>{t(step.title)}</strong>
                  <p>{t(step.detail)}</p>
                  <em>{t(step.status)}</em>
                </article>
              ))}
            </div>
          </section>
        </div>

        <section className="panel tracking-panel">
          <PanelHeader icon={Activity} title={t("学生学情跟踪板")} action={t("过程证据 + 下一步")} />
          <div className="tracking-board">
            {!profile.trackers.length && <p className="empty-state">{t("暂无跟踪记录")}</p>}
            {profile.trackers.map((item) => (
              <article className="tracker-row" key={`${item.date}-${item.task}`}>
                <div className="tracker-date">{t(item.date)}</div>
                <div className="tracker-main">
                  <strong>{t(item.task)}</strong>
                  <span>{t(item.evidence)}</span>
                  <small>{t(item.next)}</small>
                </div>
                <span className={`status-chip ${statusClass(item.status)}`}>{t(item.status)}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="panel task-closure-panel">
          <PanelHeader icon={ClipboardCheck} title={t("本周任务闭环")} action={t("流程示例 · 非个人完成记录")} />
          <div className="task-closure-grid">
            {!savedProfile && <p className="empty-state">{t("暂无已分配的个人任务")}</p>}
            {(savedProfile ? studentTaskClosures : []).map((item) => (
              <article className={`task-closure-card ${statusClass(item.status)}`} key={item.label}>
                <span>{t(item.status)}</span>
                <strong>{t(item.label)}</strong>
                <p>{t(item.detail)}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <PanelHeader icon={BookMarked} title={t("个人错题本")} action={t("错因解释 + 同类练习")} />
          <div className="panel-inline-actions">
            <button
              className="secondary-button"
              onClick={async () => {
                const text = buildMistakeBookText();
                try {
                  if (!navigator.clipboard) throw new Error("Clipboard unavailable");
                  await navigator.clipboard.writeText(text);
                  setCopiedMistakeBook(text);
                  setStudentCopyError("");
                } catch { setStudentCopyError("未能复制，请使用导出打印版。"); }
              }}
              type="button"
            >
              <ClipboardCheck size={16} />
              {t(copiedMistakeBook === buildMistakeBookText() ? "已复制错题本" : "复制错题本")}
            </button>
            <button
              className="secondary-button"
              onClick={() =>
                downloadTextFile(
                  buildMistakeBookText(),
                  t("{0}-个人错题本.md", [selectedStudent?.studentName ?? "学生"]),
                  "text/markdown;charset=utf-8",
                )
              }
              type="button"
            >
              <Download size={16} />{t("导出打印版")}</button>
          </div>
          {studentCopyError && <p role="status">{t(studentCopyError)}</p>}
          <div className="mistake-list">
            {wrongAttempts.length ? (
              wrongAttempts.map((attempt) => {
                const question = questions.find((item) => item.id === attempt.questionId) ?? questions[0];
                return (
                  <article className="mistake-card" key={`${attempt.studentId}-${attempt.questionId}`}>
                    <div>
                      <span className="tag">Q{t(question.number)} · {t(question.questionType)}</span>
                      <h3>{t(question.title)}</h3>
                      <p>{t(question.diagnosis.narrative)}</p>
                    </div>
                    <div className="mistake-side">
                      <strong>{t(attempt.cause)}</strong>
                      <small>{t("我的答案：")}{t(attempt.selected)}</small>
                      <Progress value={attempt.mastery} />
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="empty-state">
                <CircleCheck size={32} />
                <strong>{t("本次暂无错题")}</strong>
                <span>{t("继续完成高考拓展题，保持阅读和写作节奏。")}</span>
              </div>
            )}
          </div>
        </section>

        <section className="panel next-steps">
          <PanelHeader icon={Play} title={t("下一步学习建议")} action={t("15分钟")} />
          <div className="next-step-grid">
            <div>
              <strong>{t("1. 复盘关键词")}</strong>
              <span>{t("标出题干关键词、原文定位句和干扰选项。")}</span>
            </div>
            <div>
              <strong>{t("2. 拆一句长难句")}</strong>
              <span>{t("主干、修饰、指代各写一行。")}</span>
            </div>
            <div>
              <strong>{t("3. 做一题同类迁移")}</strong>
              <span>{t("完成后写出排除两个选项的理由。")}</span>
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
  const { t } = useLocale();
  return (
    <article className={`metric-card ${tone}`}>
      <div className="metric-icon"><Icon size={20} /></div>
      <span>{t(label)}</span>
      <strong>{t(value)}</strong>
      <small>{t(trend)}</small>
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
  const { t } = useLocale();
  return (
    <div className="panel-header">
      <div>
        <Icon size={18} />
        <h2>{t(title)}</h2>
      </div>
      {action && <span>{t(action)}</span>}
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
