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
      <section className="overview-intro" aria-label="本次测评操作">
        <p>从这一次作答，开始下一步教学。</p>
        <div className="overview-intro-actions">
          <button className="primary-button" type="button" onClick={() => onNavigate("upload")}><Plus size={16} aria-hidden="true" /> 导入新测评</button>
          <button className="text-button" type="button" onClick={() => onNavigate("reports")}>查看测评报告 <ArrowUpRight size={16} aria-hidden="true" /></button>
        </div>
      </section>

      <section className="workspace-mosaic" aria-label="教师工作台快捷入口">
        <button className="mosaic-tile mosaic-accuracy" type="button" onClick={() => onNavigate("analytics")}>
          <span className="tile-topline">班级平均正确率 <ArrowUpRight size={17} aria-hidden="true" /></span>
          <strong className="tile-number">{accuracy}<small>%</small></strong>
          <div className="mini-column-chart" role="img" aria-label={`最近六周阅读正确率：${accuracyTrend.map((point) => `${point.week} ${point.阅读}%`).join("，")}，演示数据`}>
            {accuracyTrend.map((point, index) => <span key={point.week} style={{ height: `${point.阅读}%` }} className={index === accuracyTrend.length - 1 ? "current" : ""}><i>{point.week}</i></span>)}
          </div>
          <span className="tile-footnote">六周阅读趋势 · 演示数据</span>
        </button>

        <button className="mosaic-tile mosaic-writing" type="button" onClick={() => onNavigate("results")}>
          <img src="./images/reading-workspace.jpg" alt="英文习作、批注和笔组成的书写桌面" width="1000" height="667" fetchPriority="high" />
          <span className="writing-caption"><span><small>读后续写 · 应用文</small><strong>打开作文批改</strong></span><ArrowUpRight size={21} aria-hidden="true" /></span>
        </button>

        <button className="mosaic-tile mosaic-review" type="button" onClick={() => lowest && onSelectQuestion(lowest.id)} disabled={!lowest}>
          <span className="tile-topline">优先讲评 <ArrowUpRight size={17} aria-hidden="true" /></span>
          {lowest ? <><span className="question-chip">Q{lowest.number}</span><strong>{lowest.questionType}</strong><p>{lowest.diagnosis.causes.slice(0, 2).join(" · ")}</p><span className="tile-footer"><b>{Math.round(lowest.correctRate * 100)}%</b> 正确率 <span>查看证据 <ArrowRight size={14} aria-hidden="true" /></span></span></> : <p>暂无待讲评题目</p>}
        </button>

        <button className="mosaic-tile mosaic-followup" type="button" onClick={() => onNavigate("analytics")}>
          <span className="tile-topline">待跟进学生 <ArrowUpRight size={17} aria-hidden="true" /></span>
          <span className="followup-number"><strong>{classSnapshot.riskStudents}</strong><span>人</span></span>
          <span className="tile-footnote">查看薄弱能力与支持建议</span>
        </button>

        <button className="mosaic-tile mosaic-import" type="button" onClick={() => onNavigate("upload")}>
          <UploadCloud size={25} strokeWidth={1.5} aria-hidden="true" />
          <strong>导入成绩</strong>
          <span>Excel 粘贴 / CSV</span>
          <ArrowUpRight size={17} className="tile-corner-arrow" aria-hidden="true" />
        </button>

        <button className="mosaic-tile mosaic-student" type="button" onClick={() => onNavigate("student")}>
          <span className="tile-topline">学生学习档案 <ArrowUpRight size={17} aria-hidden="true" /></span>
          <strong>把错题变成进步</strong>
          <span className="student-tile-tags"><span>错题订正</span><span>同类练习</span></span>
          <span className="tile-footnote">进入学生视图</span>
        </button>
      </section>

      <section className="overview-stat-line" aria-label="测评关键指标">
        <div><span>班级平均正确率</span><strong>{accuracy}<small>%</small></strong><em>本次测评</em></div>
        <div><span>完成率</span><strong>{completion}<small>%</small></strong><em>本次测评</em></div>
        <div><span>写作均分</span><strong>{classSnapshot.writingScore}<small>/40</small></strong><em>应用文 + 续写</em></div>
        <div><span>需跟进学生</span><strong>{classSnapshot.riskStudents}<small> 人</small></strong><em>需要重点支持</em></div>
      </section>

      <section className="workspace-actions-band" aria-label="测评处理流程">
        {[
          { id: "upload" as const, icon: UploadCloud, label: "导入数据", detail: "题目与成绩" },
          { id: "results" as const, icon: FileCheck2, label: "批改诊断", detail: "作答与证据" },
          { id: "analytics" as const, icon: BarChart3, label: "学情分析", detail: "能力与错因" },
          { id: "reports" as const, icon: FileText, label: "教学报告", detail: "复盘与跟进" },
        ].map((item, index) => <button type="button" key={item.id} onClick={() => onNavigate(item.id)}><item.icon size={19} aria-hidden="true" /><span><strong>{item.label}</strong><small>{item.detail}</small></span><span className="flow-index">0{index + 1}</span></button>)}
      </section>

      <div className="overview-analysis-row">
        <section className="workspace-section">
          <div className="workspace-section-title"><div><span className="section-caption">班级表现</span><h2>六周能力趋势</h2></div><button type="button" className="text-button" onClick={() => onNavigate("analytics")}>详细分析 <ArrowUpRight size={15} aria-hidden="true" /></button></div>
          <div className="overview-trend-chart" aria-label="阅读、写作、听说六周趋势，演示数据">
            <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 320, height: 228 }}>
              <LineChart data={accuracyTrend} margin={{ top: 14, right: 8, left: -22, bottom: 0 }}>
                <CartesianGrid stroke="#ecebf0" strokeDasharray="3 5" vertical={false} />
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: "#73717c", fontSize: 11 }} dy={8} />
                <YAxis domain={[30, 100]} axisLine={false} tickLine={false} tick={{ fill: "#73717c", fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e3ea", fontSize: 12 }} formatter={(value) => `${value}%`} />
                <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: 11, paddingTop: 20 }} />
                <Line dataKey="阅读" stroke="#6951d5" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
                <Line dataKey="写作" stroke="#cc745d" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line dataKey="听说" stroke="#26998a" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="workspace-section">
          <div className="workspace-section-title"><div><span className="section-caption">从问题开始</span><h2>重点错题</h2></div><span className="muted-label">正确率由低到高</span></div>
          <div className="overview-question-list">
            {lowQuestions.slice(0, 4).map((question) => <button type="button" key={question.id} onClick={() => onSelectQuestion(question.id)}><span className="overview-question-number">{question.number}</span><span><strong>{question.questionType}</strong><small>{question.diagnosis.causes.slice(0, 2).join(" · ")}</small></span><b>{Math.round(question.correctRate * 100)}%</b><ChevronRight size={16} aria-hidden="true" /></button>)}
          </div>
        </section>
      </div>

      <section className="workspace-section lesson-section">
        <div className="workspace-section-title"><div><span className="section-caption">下一步教学</span><h2>讲评课安排</h2></div><span className="muted-label" role="status">{completedTasks.length} / {interventionGroups.length} 已完成</span></div>
        <div className="lesson-task-list">
          {interventionGroups.map((group) => <article key={group.id} className={completedTasks.includes(group.id) ? "lesson-task is-done" : "lesson-task"}>
            <button type="button" className="lesson-checkbox" aria-label={`${completedTasks.includes(group.id) ? "撤销完成" : "标记完成"}：${group.title}`} aria-pressed={completedTasks.includes(group.id)} onClick={() => onToggleTask(group.id)}>{completedTasks.includes(group.id) ? <Check size={16} aria-hidden="true" /> : <span />}</button>
            <div><strong>{group.title}</strong><p>{group.action}</p></div><span className="lesson-timing"><Clock3 size={14} aria-hidden="true" />{group.owner}</span><button className="text-button" type="button" onClick={() => practiceForGroup(group.id)}>查看练习 <ArrowRight size={14} aria-hidden="true" /></button>
          </article>)}
        </div>
      </section>

      <details className="workspace-curriculum">
        <summary><CircleCheck size={16} aria-hidden="true" /><span>教学能力与高考衔接</span><ChevronRight size={16} aria-hidden="true" /></summary>
        <div><p>阅读理解：主旨、推断、细节、词义猜测。综合读写：原文证据、情节合理性与语言连贯。教学建议由教师结合班级情况复核。</p><a href="https://www.neea.edu.cn/xhtml1/report/2401/499-1.htm" target="_blank" rel="noreferrer">查看教育考试院新课标卷解读 <ArrowUpRight size={14} aria-hidden="true" /></a></div>
      </details>
    </div>
  );
}
