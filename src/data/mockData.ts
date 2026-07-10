import type {
  Assignment,
  ClassSnapshot,
  ErrorCause,
  PracticeItem,
  QuestionItem,
  StudentAttempt,
  StudentProgressProfile,
  TeachingInsight,
  EssayStressSample,
  WritingRubricStandard,
} from "../types";

const insights: TeachingInsight[] = [
  {
    id: "insight-main",
    title: "从答案定位转向语篇统整",
    focus: "阅读第一节的主旨大意和推理判断",
    suggestion:
      "下节课用“段落功能标注 + 选项改写比对”做 12 分钟微训练，要求学生先说出段落之间的逻辑，再判断选项是否过度推断。",
    gaokaoAlignment:
      "对齐新课标卷对阅读理解、概括归纳和批判性思维的考查，引导学生从信息提取走向语篇理解。",
  },
  {
    id: "insight-syntax",
    title: "长难句拆解要服务于意义判断",
    focus: "定语从句、非谓语结构和代词指代",
    suggestion:
      "把错题中的关键句做成“主干-修饰-指代”三层标注，随后让学生用中文复述逻辑关系，再回到英文选项。",
    gaokaoAlignment:
      "对齐语言知识在真实语境中的综合运用，避免孤立语法讲解。",
  },
  {
    id: "insight-writing",
    title: "读后续写需要先建立情节证据链",
    focus: "情节线索、人物情感和语言连贯",
    suggestion:
      "将续写前 5 分钟固定为“人物目标-冲突-情感变化”三列表，评分反馈优先看情节合理性和衔接词使用。",
    gaokaoAlignment:
      "对齐综合读写能力、创造性表达和真实情境表达。",
  },
];

const practiceItems: PracticeItem[] = [
  {
    id: "p-main-1",
    questionId: "q1",
    title: "同类迁移：判断作者真正想强调什么",
    targetSkill: "主旨大意",
    prompt:
      "A passage describes how a city garden became a shared study place for teenagers. Which title best captures the author's purpose?",
    choices: [
      "A. A Garden That Changed How Students Learn",
      "B. Why Teenagers Prefer Outdoor Sports",
      "C. The History of City Parks",
      "D. How to Plant Vegetables at School",
    ],
    answer: "A",
    explanation:
      "文章核心是“空间如何改变学习方式”，不是泛泛介绍公园或运动。",
    difficulty: "同类迁移",
  },
  {
    id: "p-main-2",
    questionId: "q1",
    title: "高考拓展：段落功能排序",
    targetSkill: "主旨大意",
    prompt:
      "给四段短文标注功能：背景导入、问题呈现、解决路径、意义提升。",
    answer: "背景导入 -> 问题呈现 -> 解决路径 -> 意义提升",
    explanation: "先看段落功能，再看题目选项，能降低被局部细节误导的概率。",
    difficulty: "高考拓展",
  },
  {
    id: "p-infer-1",
    questionId: "q2",
    title: "同类迁移：根据行为推断态度",
    targetSkill: "推理判断",
    prompt:
      "The scientist repeated the experiment despite early failure. What can be inferred about her attitude?",
    choices: ["A. Doubtful", "B. Patient", "C. Uninterested", "D. Confused"],
    answer: "B",
    explanation: "repeated 和 despite early failure 指向坚持与耐心。",
    difficulty: "基础巩固",
  },
  {
    id: "p-word-1",
    questionId: "q3",
    title: "词义猜测：用上下文排除熟词生义干扰",
    targetSkill: "词义猜测",
    prompt:
      "In the sentence 'The policy is designed to address the gap', address most nearly means...",
    choices: ["A. write a location", "B. deal with", "C. speak publicly", "D. greet"],
    answer: "B",
    explanation: "policy 与 gap 构成政策解决问题的搭配，不能按常见名词义理解。",
    difficulty: "基础巩固",
  },
  {
    id: "p-writing-1",
    questionId: "q6",
    title: "读后续写：建立人物情绪曲线",
    targetSkill: "读后续写",
    prompt:
      "根据材料列出主人公在 opening, conflict, turning point, ending 四处的情绪变化，并写出两个可用动作描写。",
    answer: "nervous -> disappointed -> hopeful -> relieved",
    explanation: "续写前先确定情绪线，能避免情节跳跃和语言堆砌。",
    difficulty: "高考拓展",
  },
];

const makeQuestion = (
  id: string,
  number: number,
  title: string,
  passageTheme: string,
  questionType: QuestionItem["questionType"],
  answer: string,
  correctRate: number,
  averageTime: number,
  topWrongOption: string,
  causes: ErrorCause[],
  insight: TeachingInsight,
  practiceIds: string[],
): QuestionItem => ({
  id,
  number,
  title,
  passageTheme,
  questionType,
  answer,
  correctRate,
  averageTime,
  topWrongOption,
  diagnosis: {
    questionId: id,
    questionType,
    causes,
    evidence:
      correctRate < 0.6
        ? `本题正确率 ${(correctRate * 100).toFixed(0)}%，主要误选 ${topWrongOption}，用时高于班级均值。`
        : `本题正确率 ${(correctRate * 100).toFixed(0)}%，少量错误集中在局部信息定位。`,
    narrative:
      causes.includes("篇章逻辑")
        ? "学生能找到原文信息，但容易把局部例子当成全文立意，需要加强段落功能和作者意图判断。"
        : causes.includes("长难句/句法结构")
          ? "错误集中在关键句结构未拆清，尤其是修饰成分和指代对象影响了选项判断。"
          : causes.includes("词汇难度")
            ? "学生对关键词的语境义不稳定，遇到熟词生义时容易直接套用常见释义。"
            : "错误更多来自审题和选项干扰，需要建立题干关键词与选项边界意识。",
    competency:
      questionType === "读后续写"
        ? ["语言能力", "思维品质", "学习能力"]
        : ["语言能力", "思维品质"],
    examAbility:
      questionType === "读后续写"
        ? ["综合读写", "情境表达", "语言连贯"]
        : ["阅读理解", "信息整合", "推断概括"],
    practiceItems: practiceItems.filter((item) => practiceIds.includes(item.id)),
    teachingInsight: insight,
  },
});

export const assignments: Assignment[] = [
  {
    id: "a1",
    title: "高二阅读与续写周测 06",
    className: "高二(3)班",
    date: "2026-06-18",
    source: "教师上传试卷 · 新课标 I 卷风格",
    questions: [
      makeQuestion(
        "q1",
        21,
        "Which title best summarizes the passage?",
        "城市公共空间与青少年学习",
        "主旨大意",
        "A",
        0.54,
        92,
        "C",
        ["篇章逻辑", "选项干扰", "审题偏差"],
        insights[0],
        ["p-main-1", "p-main-2"],
      ),
      makeQuestion(
        "q2",
        24,
        "What can be inferred about Dr. Lin?",
        "科学探究与环保技术",
        "推理判断",
        "B",
        0.61,
        84,
        "D",
        ["指代关系", "选项干扰"],
        insights[0],
        ["p-infer-1"],
      ),
      makeQuestion(
        "q3",
        27,
        "What does the underlined word 'address' mean?",
        "社区政策与社会问题",
        "词义猜测",
        "B",
        0.47,
        78,
        "A",
        ["熟词生义", "词汇难度"],
        insights[1],
        ["p-word-1"],
      ),
      makeQuestion(
        "q4",
        31,
        "Why did the author mention the old bridge?",
        "地方文化与城市记忆",
        "推理判断",
        "D",
        0.66,
        81,
        "B",
        ["篇章逻辑", "文化背景"],
        insights[0],
        ["p-infer-1"],
      ),
      makeQuestion(
        "q5",
        36,
        "Choose the best sentence to fill in the blank.",
        "健康生活与运动习惯",
        "七选五",
        "F",
        0.72,
        69,
        "E",
        ["指代关系", "篇章逻辑"],
        insights[1],
        ["p-main-2"],
      ),
      makeQuestion(
        "q6",
        47,
        "Continue the story with two paragraphs.",
        "志愿服务与个人成长",
        "读后续写",
        "Rubric",
        0.58,
        1020,
        "情节跳跃",
        ["长难句/句法结构", "篇章逻辑", "时间策略"],
        insights[2],
        ["p-writing-1"],
      ),
    ],
    attempts: [],
  },
];

const studentNames = [
  "S01 陈同学",
  "S02 林同学",
  "S03 黄同学",
  "S04 吴同学",
  "S05 张同学",
  "S06 李同学",
  "S07 许同学",
  "S08 郑同学",
  "S09 周同学",
  "S10 何同学",
  "S11 罗同学",
  "S12 梁同学",
];

const causes: ErrorCause[] = [
  "词汇难度",
  "熟词生义",
  "长难句/句法结构",
  "篇章逻辑",
  "指代关系",
  "审题偏差",
  "选项干扰",
  "文化背景",
  "时间策略",
];

const buildAttempts = (): StudentAttempt[] =>
  studentNames.flatMap((studentName, studentIndex) =>
    assignments[0].questions.map((question, questionIndex) => {
      const pattern = (studentIndex * 17 + questionIndex * 23) % 100;
      const isCorrect = pattern / 100 < question.correctRate;
      return {
        studentId: `s${studentIndex + 1}`,
        studentName,
        className: studentIndex < 6 ? "高二(3)班" : "高二(7)班",
        questionId: question.id,
        selected: isCorrect ? question.answer : question.topWrongOption,
        isCorrect,
        timeSpent: Math.round(question.averageTime + ((pattern % 7) - 3) * 9),
        mastery: Math.max(34, Math.min(96, Math.round(question.correctRate * 100 + (isCorrect ? 8 : -18) + (studentIndex % 4) * 3))),
        cause: isCorrect ? "时间策略" : causes[(studentIndex + questionIndex) % causes.length],
      };
    }),
  );

assignments[0].attempts = buildAttempts();

export const classSnapshots: ClassSnapshot[] = [
  {
    className: "高二(3)班",
    averageAccuracy: 0.63,
    completionRate: 0.96,
    writingScore: 22.6,
    listeningSpeaking: 16,
    riskStudents: 5,
  },
  {
    className: "高二(7)班",
    averageAccuracy: 0.58,
    completionRate: 0.91,
    writingScore: 20.4,
    listeningSpeaking: 15,
    riskStudents: 8,
  },
  {
    className: "高三英语备课组",
    averageAccuracy: 0.67,
    completionRate: 0.94,
    writingScore: 24.1,
    listeningSpeaking: 17,
    riskStudents: 11,
  },
];

export const studentProgressProfiles: StudentProgressProfile[] = [
  {
    studentId: "s1",
    phase: "稳定提升期",
    riskLevel: "低",
    summary:
      "阅读定位稳定，写作表达准确性仍有提升空间；适合用高考拓展题保持语篇统整和续写节奏。",
    focusSkills: ["综合读写", "续写情节链", "推断概括"],
    nextReview: "06-25 周测后复盘",
    progressTrend: [
      { week: "W1", 阅读: 72, 写作: 63, 听说: 78, 综合: 70 },
      { week: "W2", 阅读: 74, 写作: 65, 听说: 79, 综合: 72 },
      { week: "W3", 阅读: 76, 写作: 67, 听说: 80, 综合: 74 },
      { week: "W4", 阅读: 79, 写作: 70, 听说: 81, 综合: 77 },
      { week: "W5", 阅读: 81, 写作: 72, 听说: 83, 综合: 79 },
    ],
    framework: [
      {
        stage: "诊断",
        title: "确认优势与短板",
        detail: "阅读定位高于班均，续写转折句证据不足。",
        status: "已完成",
      },
      {
        stage: "干预",
        title: "续写证据链",
        detail: "用人物目标、冲突、情绪变化四格图先搭框架。",
        status: "已完成",
      },
      {
        stage: "跟踪",
        title: "同类题迁移",
        detail: "连续两周检查情节合理性和语言连贯。",
        status: "进行中",
      },
      {
        stage: "调整",
        title: "提高表达层级",
        detail: "下一轮加入非谓语和从句准确性小目标。",
        status: "待跟进",
      },
    ],
    trackers: [
      {
        date: "06-12",
        task: "读后续写四格图",
        status: "已完成",
        evidence: "能补出人物情绪转折，但结尾主题句偏泛。",
        next: "结尾句回扣原文主题词。",
      },
      {
        date: "06-18",
        task: "Q47 续写订正",
        status: "进行中",
        evidence: "情节线完整，连接词使用仍重复。",
        next: "加入 3 个因果/转折衔接表达。",
      },
      {
        date: "06-25",
        task: "续写再测",
        status: "待跟进",
        evidence: "等待下次周测采样。",
        next: "对比情节合理性得分。",
      },
    ],
  },
  {
    studentId: "s2",
    phase: "诊断干预期",
    riskLevel: "中",
    summary:
      "错误集中在熟词生义和篇章逻辑，能定位原文但选项验证不足；需要把错因拆成可跟踪的微任务。",
    focusSkills: ["词汇语境", "篇章逻辑", "选项边界"],
    nextReview: "06-24 词义题再测",
    progressTrend: [
      { week: "W1", 阅读: 54, 写作: 50, 听说: 68, 综合: 57 },
      { week: "W2", 阅读: 56, 写作: 52, 听说: 69, 综合: 59 },
      { week: "W3", 阅读: 55, 写作: 54, 听说: 70, 综合: 60 },
      { week: "W4", 阅读: 59, 写作: 56, 听说: 71, 综合: 62 },
      { week: "W5", 阅读: 63, 写作: 58, 听说: 72, 综合: 65 },
    ],
    framework: [
      {
        stage: "诊断",
        title: "定位主错因",
        detail: "Q27 误把 address 理解为地址，Q21 把局部例子当主题。",
        status: "已完成",
      },
      {
        stage: "干预",
        title: "词义三步验证",
        detail: "词义候选、宾语搭配、段落主题逐步排除。",
        status: "进行中",
      },
      {
        stage: "跟踪",
        title: "错因证据回收",
        detail: "每次订正必须写出排除两个选项的理由。",
        status: "进行中",
      },
      {
        stage: "调整",
        title: "转入推断题",
        detail: "词义稳定后加入作者态度与段落功能题。",
        status: "待跟进",
      },
    ],
    trackers: [
      {
        date: "06-10",
        task: "Q27 熟词生义订正",
        status: "已完成",
        evidence: "能解释 address = deal with，并能说明 gap 的搭配依据。",
        next: "做 2 题语境义迁移。",
      },
      {
        date: "06-18",
        task: "主旨题段落功能标注",
        status: "进行中",
        evidence: "能标出背景和问题，但意义提升段判断慢。",
        next: "用 8 分钟完成一篇四段功能图。",
      },
      {
        date: "06-24",
        task: "词义题再测",
        status: "待跟进",
        evidence: "等待小测数据。",
        next: "若正确率达到 75%，转入推断题干预。",
      },
    ],
  },
  {
    studentId: "s7",
    phase: "重点跟踪期",
    riskLevel: "高",
    summary:
      "阅读和写作波动较大，主要受词汇基础、时间策略和长难句拆解影响；需要教师端持续看板提醒。",
    focusSkills: ["基础词汇", "长难句主干", "时间策略"],
    nextReview: "06-21 晚自习面批",
    progressTrend: [
      { week: "W1", 阅读: 45, 写作: 47, 听说: 60, 综合: 51 },
      { week: "W2", 阅读: 48, 写作: 46, 听说: 61, 综合: 52 },
      { week: "W3", 阅读: 44, 写作: 48, 听说: 62, 综合: 51 },
      { week: "W4", 阅读: 50, 写作: 50, 听说: 63, 综合: 54 },
      { week: "W5", 阅读: 52, 写作: 51, 听说: 64, 综合: 56 },
    ],
    framework: [
      {
        stage: "诊断",
        title: "拆分基础障碍",
        detail: "词汇、句法、用时三项同时拖慢答题。",
        status: "已完成",
      },
      {
        stage: "干预",
        title: "低负荷小步练",
        detail: "每日 6 个高频搭配 + 1 句主干拆解。",
        status: "进行中",
      },
      {
        stage: "跟踪",
        title: "过程证据",
        detail: "记录定位句、关键词和最终排除理由。",
        status: "进行中",
      },
      {
        stage: "调整",
        title: "教师面批",
        detail: "若两次再测未提升，改为课后 10 分钟面批。",
        status: "待跟进",
      },
    ],
    trackers: [
      {
        date: "06-11",
        task: "长难句主干训练",
        status: "已完成",
        evidence: "能划出主谓宾，但修饰成分影响理解。",
        next: "补 3 句定语从句还原。",
      },
      {
        date: "06-18",
        task: "限时阅读一篇",
        status: "进行中",
        evidence: "完成时间从 9 分钟降到 7 分半，正确率仍不稳。",
        next: "先保证细节题定位正确。",
      },
      {
        date: "06-21",
        task: "晚自习面批",
        status: "待跟进",
        evidence: "等待教师确认。",
        next: "复核词汇卡和错题订正质量。",
      },
    ],
  },
];

export const accuracyTrend = [
  { week: "W1", 阅读: 58, 写作: 52, 听说: 68 },
  { week: "W2", 阅读: 61, 写作: 55, 听说: 70 },
  { week: "W3", 阅读: 59, 写作: 58, 听说: 71 },
  { week: "W4", 阅读: 65, 写作: 60, 听说: 73 },
  { week: "W5", 阅读: 63, 写作: 62, 听说: 74 },
  { week: "W6", 阅读: 68, 写作: 65, 听说: 76 },
];

export const causeStack = [
  { name: "主旨", 词汇: 8, 句法: 10, 篇章: 21, 审题: 12 },
  { name: "推断", 词汇: 11, 句法: 13, 篇章: 18, 审题: 15 },
  { name: "细节", 词汇: 13, 句法: 8, 篇章: 9, 审题: 18 },
  { name: "词义", 词汇: 26, 句法: 7, 篇章: 6, 审题: 8 },
  { name: "续写", 词汇: 12, 句法: 19, 篇章: 16, 审题: 10 },
];

export const skillRadar = [
  { skill: "信息定位", value: 82 },
  { skill: "推断概括", value: 61 },
  { skill: "语篇逻辑", value: 58 },
  { skill: "词汇语境", value: 54 },
  { skill: "综合读写", value: 57 },
  { skill: "听说表达", value: 76 },
];

export const heatmap = [
  { row: "高二(3)班", values: [54, 61, 78, 47, 72, 58] },
  { row: "高二(7)班", values: [49, 56, 74, 43, 68, 52] },
  { row: "年级均值", values: [58, 63, 80, 51, 75, 61] },
];

export const heatmapColumns = ["主旨", "推断", "细节", "词义", "七选五", "续写"];

export const interventionGroups = [
  {
    id: "vocab-context",
    title: "词汇语境组",
    count: 9,
    basis: "Q27 词义猜测正确率 47%，A 选项误选集中",
    action: "5分钟熟词生义微课 + 2题语境义迁移",
    owner: "课后订正",
    tone: "red",
  },
  {
    id: "discourse-logic",
    title: "篇章逻辑组",
    count: 14,
    basis: "主旨/推断题中，局部细节替代全文立意",
    action: "段落功能标注 + 干扰项边界讨论",
    owner: "下节课前12分钟",
    tone: "orange",
  },
  {
    id: "writing-chain",
    title: "续写证据链组",
    count: 11,
    basis: "读后续写情节跳跃，人物情绪线断裂",
    action: "人物目标-冲突-转折-结尾四格图",
    owner: "作文面批",
    tone: "blue",
  },
];

export const optionMisconceptions = [
  {
    option: "A",
    share: 31,
    misconception: "把 address 按常见名词义理解为“地址”，没有回到 policy 与 gap 的搭配语境。",
    evidence: "误选学生平均用时 74s，说明不是没读到句子，而是词义判断路径偏差。",
    action: "补一个“熟词生义 + 搭配语境”小练习，要求写出排除 A 的理由。",
  },
  {
    option: "C",
    share: 12,
    misconception: "看到 address 的动词义“演讲”后直接套用，没有检查宾语 gap 是否成立。",
    evidence: "这类学生多能定位原句，但选项验证不足。",
    action: "训练“词义候选 -> 宾语搭配 -> 段落主题”三步验证。",
  },
  {
    option: "D",
    share: 8,
    misconception: "凭熟悉短语 greet/address someone 猜测，缺少上下文证据。",
    evidence: "主要出现在词汇基础较弱学生中。",
    action: "推送基础词汇巩固题，先补 policy/problem/gap 语义场。",
  },
];

export const writingRubricRows = [
  {
    criterion: "情节合理性",
    score: "6/10",
    issue: "转折出现较突然，缺少原文线索回扣。",
    quickMark: "补一个动作或心理描写，让转折有证据。",
  },
  {
    criterion: "语言连贯",
    score: "7/10",
    issue: "连接词使用单一，段内因果关系不够清楚。",
    quickMark: "加入 therefore / as a result / to her surprise 等衔接表达。",
  },
  {
    criterion: "表达准确",
    score: "6/10",
    issue: "非谓语和从句结构错误影响理解。",
    quickMark: "先写短句保证准确，再合并为复合句。",
  },
  {
    criterion: "主题升华",
    score: "5/10",
    issue: "结尾有总结，但没有回应志愿服务与成长主题。",
    quickMark: "用一句具体反思回应人物成长，而不是空泛喊口号。",
  },
];

export const writingRubricStandards: WritingRubricStandard[] = [
  {
    id: "application-15",
    title: "应用文写作评分标准",
    examUse: "新高考英语写作第一节 · 15分",
    totalScore: 15,
    sourceLabel: "公开应用文写作评分标准整理",
    sourceUrl: "https://cdn.zizzs.com/1732670651241%E5%B1%B1%E4%B8%9C%E6%BD%8D%E5%9D%8A2025%E5%B1%8A%E9%AB%98%E4%B8%8911%E6%9C%88%E6%9C%9F%E4%B8%AD%E8%8B%B1%E8%AF%AD%E7%AD%94%E6%A1%88.pdf",
    summary:
      "重点看交际任务是否完成、要点是否覆盖、格式语气是否得体，以及词汇语法是否准确自然。",
    dimensions: [
      {
        name: "内容要点与交际目的",
        weight: 5,
        criteria: "覆盖题目要求的身份、对象、目的和主要内容，不遗漏关键信息。",
        teacherCheck: "先核对要点，再看是否真正完成邀请、建议、申请、告知等交际任务。",
      },
      {
        name: "语言准确与表达多样",
        weight: 5,
        criteria: "词汇和语法基本准确，能使用恰当句式表达原因、建议、期待或感谢。",
        teacherCheck: "标出影响理解的语法错误，并鼓励把简单句升级为自然复合句。",
      },
      {
        name: "结构连贯与格式得体",
        weight: 3,
        criteria: "段落清楚，开头、主体、结尾衔接自然，称呼、落款和语气符合应用场景。",
        teacherCheck: "检查是否有明确开头目的句、主体展开句和礼貌收束句。",
      },
      {
        name: "书写规范与可读性",
        weight: 2,
        criteria: "拼写、标点和大小写规范，卷面清楚，不因表达混乱影响阅卷。",
        teacherCheck: "只把高频、影响理解的表面错误纳入重点反馈，避免批注过载。",
      },
    ],
    bands: [
      { label: "第五档", scoreRange: "13-15", descriptor: "要点完整，表达得体，语言准确自然，少量小错不影响理解。" },
      { label: "第四档", scoreRange: "10-12", descriptor: "要点较完整，结构基本清楚，有少量语言错误但交际目的明确。" },
      { label: "第三档", scoreRange: "7-9", descriptor: "能完成部分任务，但要点、格式或语言准确性存在明显短板。" },
      { label: "第二档", scoreRange: "4-6", descriptor: "信息缺漏较多，句子错误影响理解，应用场景意识不足。" },
      { label: "第一档", scoreRange: "1-3", descriptor: "只写出零散相关信息，难以完成交际任务。" },
    ],
    cautions: ["不要只按语法扣分，先判断交际任务是否完成。", "给学生反馈时保留1-2条最可修改的句子。"],
  },
  {
    id: "continuation-25",
    title: "读后续写评分标准",
    examUse: "新高考英语写作第二节 · 25分",
    totalScore: 25,
    sourceLabel: "公开读后续写评分维度整理",
    sourceUrl: "https://flts.bnu.edu.cn/node/12699",
    summary:
      "重点看续写内容与原文融洽度、情节合理性、人物情感线、语言丰富性和段落衔接。",
    dimensions: [
      {
        name: "情节合理与原文衔接",
        weight: 8,
        criteria: "续写能承接原文人物、冲突、伏笔和场景，不突兀改写人物关系或主题方向。",
        teacherCheck: "要求学生先圈出原文伏笔，再写人物目标、冲突、转折和结局。",
      },
      {
        name: "内容丰富与主题升华",
        weight: 5,
        criteria: "动作、心理、环境细节能推动情节，结尾回应主题且不空泛喊口号。",
        teacherCheck: "看是否有情绪变化和价值回扣，而不是只把故事讲完。",
      },
      {
        name: "语言准确与句式层次",
        weight: 6,
        criteria: "时态、人称、搭配和句法较准确，能自然使用从句、非谓语或描写性表达。",
        teacherCheck: "优先纠正影响理解的时态、主谓一致和中式表达。",
      },
      {
        name: "篇章连贯与段落衔接",
        weight: 4,
        criteria: "两段之间和句子之间有清楚逻辑，衔接词服务于因果、转折、时间推进。",
        teacherCheck: "检查段首句是否承接给定开头，段末句是否推动下一步情节。",
      },
      {
        name: "规范性与可读性",
        weight: 2,
        criteria: "拼写、标点和书写基本规范，不因卷面或低级错误造成理解障碍。",
        teacherCheck: "把重复错误归类为学生下次修改目标。",
      },
    ],
    bands: [
      { label: "第五档", scoreRange: "21-25", descriptor: "情节自然完整，语言丰富准确，与原文高度融合，有清楚主题回扣。" },
      { label: "第四档", scoreRange: "16-20", descriptor: "情节基本合理，衔接较自然，有一定细节描写，语言错误不多。" },
      { label: "第三档", scoreRange: "11-15", descriptor: "故事能继续，但情节或语言较平，部分衔接和表达问题影响质量。" },
      { label: "第二档", scoreRange: "6-10", descriptor: "内容与原文关系较弱，错误较多，情节推进不够清楚。" },
      { label: "第一档", scoreRange: "1-5", descriptor: "续写零散，难以形成完整故事或与原文明显脱节。" },
    ],
    cautions: ["读后续写不是只看高级句型，情节合理性要先行。", "避免把原文没有的信息硬编成新人物或新冲突。"],
  },
  {
    id: "combined-40",
    title: "高中英语写作综合评分框架",
    examUse: "应用文15分 + 读后续写25分 · 共40分",
    totalScore: 40,
    sourceLabel: "新课标卷结构与高中英语核心素养口径整理",
    sourceUrl: "https://www.neea.edu.cn/xhtml1/report/2401/499-1.htm",
    summary:
      "把写作评价从单篇作文扩展到内容、语言、结构、思维和真实情境表达，便于备课组做过程性跟踪。",
    dimensions: [
      {
        name: "任务完成与真实情境表达",
        weight: 11,
        criteria: "能根据题目身份、目的、读者和情境完成表达，不偏题、不套模板。",
        teacherCheck: "把题干角色、对象、目的写成检查清单。",
      },
      {
        name: "综合读写与内容生成",
        weight: 10,
        criteria: "能理解材料信息并生成合理内容，读后续写能利用原文线索和人物情感。",
        teacherCheck: "看学生是否把阅读证据转化为写作内容。",
      },
      {
        name: "语言能力与准确性",
        weight: 9,
        criteria: "词汇、语法、搭配和句式准确，表达清楚自然，有适度变化。",
        teacherCheck: "按错误类型聚合反馈：词汇、句法、时态、搭配、衔接。",
      },
      {
        name: "思维品质与篇章逻辑",
        weight: 6,
        criteria: "内容展开有层次，因果、转折、对比和概括关系清楚。",
        teacherCheck: "用段落功能和情节线检查逻辑，而不是只改单句。",
      },
      {
        name: "文化意识与表达得体",
        weight: 4,
        criteria: "语气、礼貌程度、价值表达和文化场景得体，避免中文式直译。",
        teacherCheck: "把语气问题转化为可替换表达。",
      },
    ],
    bands: [
      { label: "A档", scoreRange: "34-40", descriptor: "任务完成充分，语言准确丰富，逻辑清楚，情境意识强。" },
      { label: "B档", scoreRange: "28-33", descriptor: "任务完成较好，少量语言或逻辑问题不影响整体表达。" },
      { label: "C档", scoreRange: "20-27", descriptor: "能完成基本写作任务，但内容展开、语言准确和衔接有明显短板。" },
      { label: "D档", scoreRange: "12-19", descriptor: "任务完成不足，错误较多，教师需先做结构和基础表达干预。" },
      { label: "E档", scoreRange: "1-11", descriptor: "内容零散或偏题，需从题干理解和基本句表达重新搭建。" },
    ],
    cautions: ["这个40分框架适合过程诊断，正式赋分仍应按当地考试评分细则执行。", "AI建议需要教师复核，尤其是分数和扣分理由。"],
  },
];

const essayTexts = {
  highApplication:
    "Dear Chris, I am delighted to know that you are interested in the Chinese paper-cutting exhibition to be held in our school library next Friday. The exhibition will present works from different regions and include a short workshop where visitors can try simple patterns by themselves. If you are available, I would be happy to show you around and explain the meanings behind some designs. I believe it will be a good chance for you to experience traditional Chinese art in a relaxed way. Looking forward to seeing you then. Yours, Li Hua",
  midApplication:
    "Dear Chris, I am writing to invite you to a paper-cutting show in our school. It will be on Friday afternoon in the library. There are many beautiful works and you can also learn to make one. I think you may like it because you like Chinese culture. If you come, I will wait for you at the gate. Hope you can join us. Yours, Li Hua",
  weakApplication:
    "Dear Chris, There is a activity about paper cutting. It is very interesting and many students will go there. You can see some pictures and maybe do something. I think Chinese culture is good. Please come if you have time. Yours, Li Hua",
  highContinuation:
    "Paragraph continuation task: When the last bus left, Li Hua found a small blue notebook on the bench. The rain was getting heavier, and the owner might be very worried. Li Hua opened the notebook and found a phone number written carefully on the first page. Without hesitation, he dialed it while holding the notebook under his coat to keep it dry. A trembling voice answered, and soon he learned that the notebook contained a teacher's plans for her graduating class. Although the wind blew hard, Li Hua stayed at the bus stop, imagining how anxious the owner must be. Twenty minutes later, Ms. Chen arrived, breathless and wet from the rain. Seeing the notebook safe in Li Hua's hands, she thanked him again and again. Li Hua smiled, saying that anyone would have done the same. On his way home, the rain no longer felt cold, for he had protected not just a notebook, but someone's hope and responsibility.",
  midContinuation:
    "Paragraph continuation task: When the last bus left, Li Hua found a small blue notebook on the bench. The rain was getting heavier, and the owner might be very worried. He opened it and saw a phone number. He called the number at once. The woman said the notebook was very important and asked him to wait for her. Li Hua was cold but he still waited there. After some time, the woman came and took the notebook. She thanked Li Hua and said it was about her students. Li Hua felt happy because he helped others.",
  weakContinuation:
    "Paragraph continuation task: When the last bus left, Li Hua found a small blue notebook on the bench. He saw it and called someone. It was raining. The woman came and said thanks. Li Hua was happy. Then he went home. It was a good day.",
};

export const essayStressSamples: EssayStressSample[] = Array.from({ length: 96 }, (_, index) => {
  const templates = [
    { type: "应用文" as const, band: "高分" as const, expectedScore: 14, mainIssue: "个别表达可更自然", text: essayTexts.highApplication },
    { type: "应用文" as const, band: "中高分" as const, expectedScore: 11, mainIssue: "要点完整但句式变化不足", text: essayTexts.midApplication },
    { type: "应用文" as const, band: "临界" as const, expectedScore: 8, mainIssue: "格式和内容展开不足", text: essayTexts.weakApplication },
    { type: "读后续写" as const, band: "高分" as const, expectedScore: 23, mainIssue: "可继续增强动作细节", text: essayTexts.highContinuation },
    { type: "读后续写" as const, band: "中高分" as const, expectedScore: 17, mainIssue: "故事完整但语言偏平", text: essayTexts.midContinuation },
    { type: "读后续写" as const, band: "低分" as const, expectedScore: 7, mainIssue: "情节过短且缺少原文衔接", text: essayTexts.weakContinuation },
  ];
  const sample = templates[index % templates.length];
  const offset = index % 4 === 0 ? 1 : index % 5 === 0 ? -1 : 0;
  return {
    id: `essay-${String(index + 1).padStart(3, "0")}`,
    type: sample.type,
    band: sample.band,
    expectedScore: Math.max(1, sample.expectedScore + offset),
    mainIssue: sample.mainIssue,
    text: `${sample.text}\n\nBatch variant ${index + 1}: focus on ${sample.mainIssue}.`,
  };
});

export const essayStressCsv = [
  "样本ID,题型,预期档位,预期分数,主要问题,作文文本",
  ...essayStressSamples.map((sample) =>
    [
      sample.id,
      sample.type,
      sample.band,
      sample.expectedScore,
      sample.mainIssue,
      `"${sample.text.replace(/"/g, '""')}"`,
    ].join(","),
  ),
].join("\n");

export const essayStressSummary = {
  total: essayStressSamples.length,
  application: essayStressSamples.filter((sample) => sample.type === "应用文").length,
  continuation: essayStressSamples.filter((sample) => sample.type === "读后续写").length,
  bands: ["高分", "中高分", "临界", "低分"].map((band) => ({
    band,
    count: essayStressSamples.filter((sample) => sample.band === band).length,
  })),
  passCriteria: [
    "所有样本都有题型、预期档位、预期分数和主要问题标签。",
    "样本覆盖应用文与读后续写，包含高分、中高分、临界和低分文本。",
    "本地批量测试只验证 rubric 映射、数据完整性和提示词长度，不批量消耗 DeepSeek Key。",
  ],
};

export const platformFeatureBenchmarks = [
  {
    id: "warning",
    title: "学业预警",
    signal: "连续两次低于班均、订正未完成、同错因重复出现",
    demoAction: "自动进入教师跟进清单，生成面批或分层练习任务。",
  },
  {
    id: "knowledge-map",
    title: "知识/能力图谱",
    signal: "按题型、能力点、错因和课标素养聚合，不只看总分。",
    demoAction: "把英语错题落到词汇语境、篇章逻辑、综合读写等节点。",
  },
  {
    id: "lesson-brief",
    title: "讲评课备课单",
    signal: "从高频错题直接生成课前诊断、课中讲评、课后再练。",
    demoAction: "给备课组输出可讨论的 40 分钟讲评课结构。",
  },
  {
    id: "report",
    title: "学生/家校周报",
    signal: "用过程数据解释学生本周进步、风险和下一步任务。",
    demoAction: "学生端展示个人任务闭环，教师端可导出周报摘要。",
  },
];

export const closedLoopMetrics = [
  { label: "自动采集", value: "4类", detail: "作业、测验、错题、订正" },
  { label: "错因诊断", value: "9类", detail: "题型、能力、误选项联动" },
  { label: "干预触达", value: "86%", detail: "学生完成分层练习" },
  { label: "再测达标", value: "72%", detail: "同类题正确率提升" },
];

export type WarningStatus = "未处理" | "已安排" | "已复盘";

export const warningCases: Array<{
  student: string;
  level: string;
  reason: string;
  action: string;
  owner: string;
  status: WarningStatus;
}> = [
  {
    student: "S02 林同学",
    level: "中",
    reason: "词义猜测连续两次低于 55%，误选集中在熟词生义。",
    action: "推送 3 题语境义迁移，06-24 再测后自动复盘。",
    owner: "阅读小组",
    status: "已安排",
  },
  {
    student: "S07 许同学",
    level: "高",
    reason: "阅读、写作同步低于班均，订正证据不完整。",
    action: "晚自习面批 + 每日 1 句长难句主干拆解。",
    owner: "任课教师",
    status: "未处理",
  },
  {
    student: "S11 罗同学",
    level: "低",
    reason: "完成率稳定，但推断题用时偏长。",
    action: "加入段落功能限时训练，观察下一次周测用时。",
    owner: "课后自练",
    status: "已复盘",
  },
];

export const knowledgeGraphNodes = [
  {
    skill: "词汇语境",
    mastery: 54,
    evidence: "Q27 熟词生义、搭配语境误判集中。",
    linkedTask: "address / gap / policy 语义场迁移练习",
  },
  {
    skill: "篇章逻辑",
    mastery: 58,
    evidence: "主旨题把局部例子当全文立意。",
    linkedTask: "四段功能标注 + 选项边界比对",
  },
  {
    skill: "长难句结构",
    mastery: 61,
    evidence: "定语从句和非谓语修饰影响选项判断。",
    linkedTask: "主干-修饰-指代三层拆句",
  },
  {
    skill: "综合读写",
    mastery: 57,
    evidence: "续写情节线完整度不足，主题回扣偏弱。",
    linkedTask: "人物目标-冲突-转折-结尾四格图",
  },
  {
    skill: "听说表达",
    mastery: 76,
    evidence: "整体稳定，可作为优势能力保持。",
    linkedTask: "听说素材复述 + 写作表达迁移",
  },
];

export const reviewLessonPlan = [
  {
    phase: "课前 5 分钟",
    title: "投放错因热力图",
    output: "让学生先判断本节课要解决的是词义、篇章还是审题问题。",
  },
  {
    phase: "课中 18 分钟",
    title: "讲两道代表错题",
    output: "展示误选项路径，要求写出保留/排除选项的证据句。",
  },
  {
    phase: "课中 10 分钟",
    title: "同类迁移即时练",
    output: "按预警组推送不同题包，系统记录正确率和用时。",
  },
  {
    phase: "课后 7 分钟",
    title: "订正与再测安排",
    output: "形成学生跟踪板，下一次周测自动对比是否达标。",
  },
];

export const reportPreviewItems = [
  {
    audience: "备课组",
    title: "周测讲评摘要",
    detail: "本周主问题为词汇语境和篇章逻辑，建议下节课用两道代表错题做讲评。",
  },
  {
    audience: "学生",
    title: "个人任务卡",
    detail: "先完成熟词生义迁移练习，再补段落功能图，完成后进入再测。",
  },
  {
    audience: "家长",
    title: "学习进度周报",
    detail: "用进步点、风险点和下一步任务表达，不直接展示班级排名。",
  },
];

export const studentTaskClosures = [
  {
    label: "错题订正",
    status: "已完成",
    detail: "Q27 已写出搭配依据和排除理由。",
  },
  {
    label: "同类再练",
    status: "进行中",
    detail: "2/3 题达标，仍需补一题段落功能判断。",
  },
  {
    label: "教师反馈",
    status: "待跟进",
    detail: "06-24 再测后自动生成下一轮建议。",
  },
];

export const importSources = [
  {
    id: "paper",
    title: "试卷 PDF / 图片",
    description: "识别题目、答案、题型和能力标签，适合老师临时上传周测。",
    status: "已接入演示",
    sample: "高二阅读与续写周测06.pdf",
  },
  {
    id: "excel",
    title: "Excel 成绩表",
    description: "导入学生、班级、题号得分和总分，直接生成成绩分析面板。",
    status: "新增演示",
    sample: "月考成绩分析.xlsx",
  },
  {
    id: "marking",
    title: "阅卷系统数据",
    description: "模拟智学网/校内阅卷导出的题目得分和小题维度。",
    status: "新增演示",
    sample: "阅卷系统小题得分.csv",
  },
  {
    id: "form",
    title: "表单/问卷数据",
    description: "接收订正、错因自评和学生学习反馈，补足过程性证据。",
    status: "新增演示",
    sample: "错因自评问卷.csv",
  },
];

export const fieldMappingRows = [
  { source: "姓名", target: "学生", quality: "已匹配", note: "匿名化为 S01/S02" },
  { source: "班级", target: "班级", quality: "已匹配", note: "支持年级/班级筛选" },
  { source: "Q21-Q47", target: "小题得分", quality: "已匹配", note: "用于题型热力图" },
  { source: "作文评语", target: "批注/QuickMarks", quality: "待确认", note: "老师可编辑后发布" },
];

export const liveDemoCsv = `学生ID,姓名,班级,Q21主旨,Q24推断,Q27词义,Q31推断,Q35细节,Q47读后续写,Q48应用文,听说卷面,订正完成
S001,陈同学,高二(3)班,2,1,0,1,2,18,12,52,是
S002,林同学,高二(3)班,1,1,0,0,2,15,10,48,否
S003,黄同学,高二(3)班,2,2,1,1,2,21,13,55,是
S004,吴同学,高二(3)班,1,0,0,1,1,14,9,43,否
S005,周同学,高二(3)班,2,2,2,1,2,23,14,57,是
S006,郑同学,高二(3)班,0,1,0,1,2,16,10,46,否
S007,刘同学,高二(3)班,1,0,1,0,1,13,8,42,否
S008,王同学,高二(3)班,2,1,1,1,2,19,12,50,是
S009,许同学,高二(3)班,1,2,0,1,1,17,11,49,是
S010,赵同学,高二(3)班,2,2,1,2,2,22,14,56,是
S011,何同学,高二(3)班,0,1,0,0,1,12,8,40,否
S012,梁同学,高二(3)班,2,1,0,1,2,18,11,51,是`;

export const liveQuestionGuide = [
  { field: "Q21主旨", label: "Q21 主旨大意", max: 2, type: "主旨大意", cause: "篇章逻辑", suggestion: "用段落功能图训练全文立意，不急着回原文找单句。" },
  { field: "Q24推断", label: "Q24 推理判断", max: 2, type: "推理判断", cause: "选项干扰", suggestion: "要求学生写出保留选项和排除选项的证据句。" },
  { field: "Q27词义", label: "Q27 词义猜测", max: 2, type: "词义猜测", cause: "熟词生义", suggestion: "做熟词生义与搭配验证微训练，避免直接套常见释义。" },
  { field: "Q31推断", label: "Q31 推理判断", max: 2, type: "推理判断", cause: "篇章逻辑", suggestion: "从上下文因果和作者态度判断选项边界。" },
  { field: "Q35细节", label: "Q35 细节理解", max: 2, type: "细节理解", cause: "审题偏差", suggestion: "让学生标出题干限定词，再定位原文证据。" },
  { field: "Q47读后续写", label: "Q47 读后续写", max: 25, type: "读后续写", cause: "长难句/句法结构", suggestion: "用人物目标-冲突-转折-结尾四格图补情节链。" },
  { field: "Q48应用文", label: "Q48 应用文", max: 15, type: "应用文", cause: "篇章逻辑", suggestion: "用写作目的、对象和要点清单检查任务完成度。" },
  { field: "听说卷面", label: "听说卷面", max: 60, type: "听说", cause: "时间策略", suggestion: "听说卷面分可按广东口径除以 3 后与笔试合成。" },
];

export type ReportTone = "正式" | "简洁" | "鼓励";

export type ReportToneVariant = {
  body: string;
  bullets: string[];
};

export const reportTemplates: Array<{
  id: string;
  audience: string;
  title: string;
  tone: ReportTone;
  tones: Record<ReportTone, ReportToneVariant>;
}> = [
  {
    id: "teaching-group",
    audience: "备课组版",
    title: "高二英语周测学情摘要",
    tone: "正式",
    tones: {
      正式: {
        body:
          "本次周测显示，班级主要问题集中在词汇语境、篇章逻辑和读后续写情节链。建议下节讲评课先用 Q27 词义猜测题做误选项路径拆解，再用 Q21 主旨题训练段落功能标注。课后对词汇语境组推送 2 道同类迁移题，对续写证据链组安排四格图订正。",
        bullets: ["共性错因：熟词生义、局部细节替代全文立意", "重点学生：S02、S07、S11 已进入跟踪清单", "下次复盘：06-24 词义题再测"],
      },
      简洁: {
        body:
          "本周三大问题：词汇语境、篇章逻辑、续写情节链。讲评课重点讲 Q27 和 Q21，课后按错因分组推送同类练习。",
        bullets: ["主错因：熟词生义、以偏概全", "跟踪：S02、S07、S11", "再测：06-24"],
      },
      鼓励: {
        body:
          "班级整体作答节奏稳定，定位信息的能力在进步。接下来把火力集中在词汇语境和篇章逻辑上：讲评课用 Q27、Q21 两道代表题带学生走一遍证据链，相信下次再测会看到明显提升。",
        bullets: ["亮点：细节题正确率回升", "聚焦：熟词生义与段落功能", "期待：06-24 再测验证效果"],
      },
    },
  },
  {
    id: "student",
    audience: "学生版",
    title: "S02 林同学个人任务卡",
    tone: "鼓励",
    tones: {
      正式: {
        body:
          "本周测验显示：原文信息定位能力已达标，熟词生义与段落功能判断尚不稳定。请按以下顺序完成任务：一、订正 Q27 词义猜测题；二、完成 2 题语境义迁移练习；三、为每题写出排除两个选项的理由并提交。",
        bullets: ["订正 Q27 并写出依据", "完成 2 题语境义迁移", "06-24 参加再测"],
      },
      简洁: {
        body:
          "本周待办：订正 Q27，做 2 题语境义迁移，每题写出排除理由。完成后等 06-24 再测。",
        bullets: ["订正 Q27", "2 题迁移练习", "写排除理由"],
      },
      鼓励: {
        body:
          "你本周能定位原文信息，但在熟词生义和段落功能判断上还不稳定。下一步先完成 Q27 词义猜测订正，再做 2 题语境义迁移。完成后请写出排除两个选项的理由。",
        bullets: ["先复盘关键词和定位句", "再拆一个长难句", "最后完成同类迁移并提交订正证据"],
      },
    },
  },
  {
    id: "parent",
    audience: "家长版",
    title: "学习进度周报",
    tone: "简洁",
    tones: {
      正式: {
        body:
          "本周学习情况反馈：学生英语学习投入度良好，听说表达稳定；阅读理解中的词汇语境与篇章逻辑为当前重点提升方向。教师已安排针对性订正与同类题练习，请家长协助确认任务按时完成即可，无需额外增加练习量。",
        bullets: ["进步点：能定位原文关键信息", "提升方向：词汇语境判断", "家庭配合：确认订正任务完成情况"],
      },
      简洁: {
        body:
          "孩子本周英语学习整体保持投入，听说表达较稳定，阅读理解中的词汇语境和篇章逻辑仍需巩固。老师已安排短时订正和同类题再练，建议家长关注任务是否按时完成，不需要额外刷大量题。",
        bullets: ["进步点：能定位原文关键信息", "风险点：熟词生义判断不稳", "家庭配合：提醒完成 15 分钟订正任务"],
      },
      鼓励: {
        body:
          "这周孩子在英语学习上很有韧劲：听说表达一直保持稳定，阅读中找关键信息的能力也在进步。词汇语境判断还有提升空间，老师已经安排了小而精的订正任务。只要每天完成 15 分钟，就能看到变化，请放心陪伴、适度提醒就好。",
        bullets: ["值得表扬：听说稳定、定位信息进步", "正在攻克：熟词生义", "家庭配合：每天 15 分钟，不用加练"],
      },
    },
  },
];

export const essayWorkbench = {
  student: "S05 张同学",
  task: "读后续写 Paragraph 1",
  original:
    "She stood there, nervous and sad. The old man smiled to her and gave the box. She suddenly know that helping others was important. At last, everyone was happy.",
  inlineComments: [
    {
      fragment: "nervous and sad",
      type: "情绪线",
      comment: "情绪变化过快，需要补一个动作或心理描写承接原文冲突。",
    },
    {
      fragment: "smiled to her",
      type: "表达准确",
      comment: "smile at her 更自然，注意动词搭配。",
    },
    {
      fragment: "suddenly know",
      type: "时态",
      comment: "叙事时态应为 knew，也可以改成 realized 提升表达。",
    },
  ],
  scores: [
    { label: "情节合理", value: 6, max: 10 },
    { label: "语言准确", value: 6, max: 10 },
    { label: "衔接连贯", value: 7, max: 10 },
    { label: "主题回扣", value: 5, max: 10 },
  ],
  revision:
    "She stood still, fingers tightening around the note. The old man smiled at her as if he had already known her worry, and gently handed her the box.",
  teacherControl: ["老师可编辑批注", "可加入评语库", "可要求二次修改"],
};

export const repeatedErrorTracks = [
  {
    skill: "熟词生义",
    students: 9,
    weeks: "连续 3 周",
    evidence: "address / charge / bridge 等词义题误判反复出现。",
    intervention: "语义场迁移练习 + 搭配验证",
    retest: "未达标",
  },
  {
    skill: "段落功能",
    students: 14,
    weeks: "连续 2 周",
    evidence: "主旨题中把局部例子当全文立意。",
    intervention: "四段功能图 + 选项边界比对",
    retest: "进行中",
  },
  {
    skill: "续写情节链",
    students: 11,
    weeks: "连续 2 次作文",
    evidence: "转折突兀、人物情绪线断裂。",
    intervention: "人物目标-冲突-转折-结尾四格图",
    retest: "已改善",
  },
];
