import { useLocale } from "../i18n/LocaleContext";
import { ArrowUpRight, ArrowRight, UploadCloud, FileCheck2, BarChart3, FileText, Check, ChevronRight, Plus, CircleCheck, Clock3 } from "lucide-react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { accuracyTrend, interventionGroups } from "../data/mockData";
import type { ClassSnapshot, QuestionItem } from "../types";

type Destination = "upload" | "results" | "analytics" | "reports" | "practice" | "student";

export function OverviewWorkspace({ classSnapshot, lowQuestions, completedTasks, onToggleTask, onPractice, onNavigate, onSelectQuestion }: {
  classSnapshot: ClassSnapshot;
  lowQuestions: QuestionItem[];
  completedTasks: string[];
  onToggleTask: (id: string) => void;
  onPractice: (questionId: string) => void;
  onNavigate: (panel: Destination) => void;
  onSelectQuestion: (id: string) => void;
}) {
  const { t } = useLocale();
  const lowest = lowQuestions[0];
  const accuracy = Math.round(classSnapshot.averageAccuracy * 100);
  const completion = Math.round(classSnapshot.completionRate * 100);
  const practiceForGroup = (id: string) => {
    const type = id === "vocab-context" ? "词义猜测" : id === "discourse-logic" ? "主旨大意" : "读后续写";
    const question = lowQuestions.find((item) => item.questionType === type);
    if (question) onPractice(question.id);
    else onNavigate("practice");
  };

  return (
    <div className="workspace-overview">
      <section className="overview-intro" aria-label={t("本次测评操作")}>
        <p>{t("从这一次作答，开始下一步教学。")}</p>
        <div className="overview-intro-actions">
          <button className="primary-button" type="button" onClick={() => onNavigate("upload")}><Plus size={16} aria-hidden="true" />{t(" 导入新测评")}</button>
          <button className="text-button" type="button" onClick={() => onNavigate("reports")}>{t("查看测评报告 ")}<ArrowUpRight size={16} aria-hidden="true" /></button>
        </div>
      </section>

      <section className="workspace-mosaic" aria-label={t("教师工作台快捷入口")}>
        <button className="mosaic-tile mosaic-accuracy" type="button" onClick={() => onNavigate("analytics")}>
          <span className="tile-topline">{t("班级平均正确率 ")}<ArrowUpRight size={17} aria-hidden="true" /></span>
          <strong className="tile-number">{t(accuracy)}<small>%</small></strong>
          <div className="mini-column-chart" role="img" aria-label={t("最近六周阅读正确率：{0}，演示数据", [accuracyTrend.map((point) => `${point.week} ${point.阅读}%`).join("，")])}>
            {accuracyTrend.map((point, index) => <span key={point.week} style={{ height: `${point.阅读}%` }} className={index === accuracyTrend.length - 1 ? "current" : ""}><i>{t(point.week)}</i></span>)}
          </div>
          <span className="tile-footnote">{t("六周阅读趋势 · 演示数据")}</span>
        </button>

        <button className="mosaic-tile mosaic-writing" type="button" onClick={() => onNavigate("results")}>
          <img src="./images/reading-workspace.jpg" alt={t("英文习作、批注和笔组成的书写桌面")} width="1000" height="667" fetchPriority="high" />
          <span className="writing-caption"><span><small>{t("读后续写 · 应用文")}</small><strong>{t("打开作文批改")}</strong></span><ArrowUpRight size={21} aria-hidden="true" /></span>
        </button>

        <button className="mosaic-tile mosaic-review" type="button" onClick={() => lowest && onSelectQuestion(lowest.id)} disabled={!lowest}>
          <span className="tile-topline">{t("优先讲评 ")}<ArrowUpRight size={17} aria-hidden="true" /></span>
          {lowest ? <><span className="question-chip">Q{t(lowest.number)}</span><strong>{t(lowest.questionType)}</strong><p>{t(lowest.diagnosis.causes.slice(0, 2).join(" · "))}</p><span className="tile-footer"><b>{t(Math.round(lowest.correctRate * 100))}%</b>{t(" 正确率 ")}<span>{t("查看证据 ")}<ArrowRight size={14} aria-hidden="true" /></span></span></> : <p>{t("暂无待讲评题目")}</p>}
        </button>

        <button className="mosaic-tile mosaic-followup" type="button" onClick={() => onNavigate("analytics")}>
          <span className="tile-topline">{t("待跟进学生 ")}<ArrowUpRight size={17} aria-hidden="true" /></span>
          <span className="followup-number"><strong>{t(classSnapshot.riskStudents)}</strong><span>{t("人")}</span></span>
          <span className="tile-footnote">{t("查看薄弱能力与支持建议")}</span>
        </button>

        <button className="mosaic-tile mosaic-import" type="button" onClick={() => onNavigate("upload")}>
          <UploadCloud size={25} strokeWidth={1.5} aria-hidden="true" />
          <strong>{t("导入成绩")}</strong>
          <span>{t("Excel 粘贴 / CSV")}</span>
          <ArrowUpRight size={17} className="tile-corner-arrow" aria-hidden="true" />
        </button>

        <button className="mosaic-tile mosaic-student" type="button" onClick={() => onNavigate("student")}>
          <span className="tile-topline">{t("学生学习档案 ")}<ArrowUpRight size={17} aria-hidden="true" /></span>
          <strong>{t("把错题变成进步")}</strong>
          <span className="student-tile-tags"><span>{t("错题订正")}</span><span>{t("同类练习")}</span></span>
          <span className="tile-footnote">{t("进入学生视图")}</span>
        </button>
      </section>

      <section className="overview-stat-line" aria-label={t("测评关键指标")}>
        <div><span>{t("班级平均正确率")}</span><strong>{t(accuracy)}<small>%</small></strong><em>{t("本次测评")}</em></div>
        <div><span>{t("完成率")}</span><strong>{t(completion)}<small>%</small></strong><em>{t("本次测评")}</em></div>
        <div><span>{t("写作均分")}</span><strong>{t(classSnapshot.writingScore)}<small>/40</small></strong><em>{t("应用文 + 续写")}</em></div>
        <div><span>{t("需跟进学生")}</span><strong>{t(classSnapshot.riskStudents)}<small>{t(" 人")}</small></strong><em>{t("需要重点支持")}</em></div>
      </section>

      <section className="workspace-actions-band" aria-label={t("测评处理流程")}>
        {[
          { id: "upload" as const, icon: UploadCloud, label: "导入数据", detail: "题目与成绩" },
          { id: "results" as const, icon: FileCheck2, label: "批改诊断", detail: "作答与证据" },
          { id: "analytics" as const, icon: BarChart3, label: "学情分析", detail: "能力与错因" },
          { id: "reports" as const, icon: FileText, label: "教学报告", detail: "复盘与跟进" },
        ].map((item, index) => <button type="button" key={item.id} onClick={() => onNavigate(item.id)}><item.icon size={19} aria-hidden="true" /><span><strong>{t(item.label)}</strong><small>{t(item.detail)}</small></span><span className="flow-index">0{t(index + 1)}</span></button>)}
      </section>

      <div className="overview-analysis-row">
        <section className="workspace-section">
          <div className="workspace-section-title"><div><span className="section-caption">{t("班级表现")}</span><h2>{t("六周能力趋势")}</h2></div><button type="button" className="text-button" onClick={() => onNavigate("analytics")}>{t("详细分析 ")}<ArrowUpRight size={15} aria-hidden="true" /></button></div>
          <div className="overview-trend-chart" aria-label={t("阅读、写作、听说六周趋势，演示数据")}>
            <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 320, height: 228 }}>
              <LineChart data={accuracyTrend} margin={{ top: 14, right: 8, left: -22, bottom: 0 }}>
                <CartesianGrid stroke="#ecebf0" strokeDasharray="3 5" vertical={false} />
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: "#73717c", fontSize: 11 }} dy={8} tickFormatter={(value) => t(String(value))} />
                <YAxis domain={[30, 100]} axisLine={false} tickLine={false} tick={{ fill: "#73717c", fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e3ea", fontSize: 12 }} formatter={(value) => `${value}%`} labelFormatter={(label) => t(String(label))} />
                <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: 11, paddingTop: 20 }} />
                <Line dataKey="阅读" stroke="#6951d5" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} isAnimationActive={false} name={t("阅读")} />
                <Line dataKey="写作" stroke="#cc745d" strokeWidth={2} dot={false} isAnimationActive={false} name={t("写作")} />
                <Line dataKey="听说" stroke="#26998a" strokeWidth={2} dot={false} isAnimationActive={false} name={t("听说")} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="workspace-section">
          <div className="workspace-section-title"><div><span className="section-caption">{t("从问题开始")}</span><h2>{t("重点错题")}</h2></div><span className="muted-label">{t("正确率由低到高")}</span></div>
          <div className="overview-question-list">
            {lowQuestions.slice(0, 4).map((question) => <button type="button" key={question.id} onClick={() => onSelectQuestion(question.id)}><span className="overview-question-number">{t(question.number)}</span><span><strong>{t(question.questionType)}</strong><small>{t(question.diagnosis.causes.slice(0, 2).join(" · "))}</small></span><b>{t(Math.round(question.correctRate * 100))}%</b><ChevronRight size={16} aria-hidden="true" /></button>)}
          </div>
        </section>
      </div>

      <section className="workspace-section lesson-section">
        <div className="workspace-section-title"><div><span className="section-caption">{t("下一步教学")}</span><h2>{t("讲评课安排")}</h2></div><span className="muted-label" role="status">{t(completedTasks.length)} / {t(interventionGroups.length)}{t(" 已完成")}</span></div>
        <div className="lesson-task-list">
          {interventionGroups.map((group) => <article key={group.id} className={completedTasks.includes(group.id) ? "lesson-task is-done" : "lesson-task"}>
            <button type="button" className="lesson-checkbox" aria-label={t("{0}：{1}", [completedTasks.includes(group.id) ? "撤销完成" : "标记完成", group.title])} aria-pressed={completedTasks.includes(group.id)} onClick={() => onToggleTask(group.id)}>{completedTasks.includes(group.id) ? <Check size={16} aria-hidden="true" /> : <span />}</button>
            <div><strong>{t(group.title)}</strong><p>{t(group.action)}</p></div><span className="lesson-timing"><Clock3 size={14} aria-hidden="true" />{t(group.owner)}</span><button className="text-button" type="button" onClick={() => practiceForGroup(group.id)}>{t("查看练习 ")}<ArrowRight size={14} aria-hidden="true" /></button>
          </article>)}
        </div>
      </section>

      <details className="workspace-curriculum">
        <summary><CircleCheck size={16} aria-hidden="true" /><span>{t("教学能力与高考衔接")}</span><ChevronRight size={16} aria-hidden="true" /></summary>
        <div><p>{t("阅读理解：主旨、推断、细节、词义猜测。综合读写：原文证据、情节合理性与语言连贯。教学建议由教师结合班级情况复核。")}</p><a href="https://www.neea.edu.cn/xhtml1/report/2401/499-1.htm" target="_blank" rel="noreferrer">{t("查看教育考试院新课标卷解读 ")}<ArrowUpRight size={14} aria-hidden="true" /></a></div>
      </details>
    </div>
  );
}
