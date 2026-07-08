export type QuestionType =
  | "主旨大意"
  | "推理判断"
  | "细节理解"
  | "词义猜测"
  | "完形填空"
  | "七选五"
  | "语法填空"
  | "应用文"
  | "读后续写"
  | "听说";

export type ErrorCause =
  | "词汇难度"
  | "熟词生义"
  | "长难句/句法结构"
  | "篇章逻辑"
  | "指代关系"
  | "审题偏差"
  | "选项干扰"
  | "文化背景"
  | "时间策略";

export type Competency =
  | "语言能力"
  | "思维品质"
  | "文化意识"
  | "学习能力";

export interface TeachingInsight {
  id: string;
  title: string;
  focus: string;
  suggestion: string;
  gaokaoAlignment: string;
}

export interface PracticeItem {
  id: string;
  questionId: string;
  title: string;
  targetSkill: QuestionType;
  prompt: string;
  choices?: string[];
  answer: string;
  explanation: string;
  difficulty: "基础巩固" | "同类迁移" | "高考拓展";
}

export interface ErrorDiagnosis {
  questionId: string;
  questionType: QuestionType;
  causes: ErrorCause[];
  evidence: string;
  narrative: string;
  competency: Competency[];
  examAbility: string[];
  practiceItems: PracticeItem[];
  teachingInsight: TeachingInsight;
}

export interface QuestionItem {
  id: string;
  number: number;
  title: string;
  passageTheme: string;
  questionType: QuestionType;
  answer: string;
  correctRate: number;
  averageTime: number;
  topWrongOption: string;
  diagnosis: ErrorDiagnosis;
}

export interface StudentAttempt {
  studentId: string;
  studentName: string;
  className: string;
  questionId: string;
  selected: string;
  isCorrect: boolean;
  timeSpent: number;
  mastery: number;
  cause: ErrorCause;
}

export interface Assignment {
  id: string;
  title: string;
  className: string;
  date: string;
  source: string;
  questions: QuestionItem[];
  attempts: StudentAttempt[];
}

export interface ClassSnapshot {
  className: string;
  averageAccuracy: number;
  completionRate: number;
  writingScore: number;
  listeningSpeaking: number;
  riskStudents: number;
}

export interface StudentProgressPoint {
  week: string;
  阅读: number;
  写作: number;
  听说: number;
  综合: number;
}

export interface StudentFrameworkStep {
  stage: string;
  title: string;
  detail: string;
  status: "已完成" | "进行中" | "待跟进";
}

export interface StudentTrackerItem {
  date: string;
  task: string;
  status: "已完成" | "进行中" | "待跟进";
  evidence: string;
  next: string;
}

export interface StudentProgressProfile {
  studentId: string;
  phase: string;
  riskLevel: "低" | "中" | "高";
  summary: string;
  focusSkills: string[];
  nextReview: string;
  progressTrend: StudentProgressPoint[];
  framework: StudentFrameworkStep[];
  trackers: StudentTrackerItem[];
}

export interface WritingRubricDimension {
  name: string;
  weight: number;
  criteria: string;
  teacherCheck: string;
}

export interface WritingRubricBand {
  label: string;
  scoreRange: string;
  descriptor: string;
}

export interface WritingRubricStandard {
  id: string;
  title: string;
  examUse: string;
  totalScore: number;
  sourceLabel: string;
  sourceUrl: string;
  summary: string;
  dimensions: WritingRubricDimension[];
  bands: WritingRubricBand[];
  cautions: string[];
}

export interface EssayStressSample {
  id: string;
  type: "应用文" | "读后续写";
  band: "高分" | "中高分" | "临界" | "低分";
  expectedScore: number;
  mainIssue: string;
  text: string;
}
