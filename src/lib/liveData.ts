import Papa from "papaparse";

export interface QuestionGuide {
  field: string; label: string; max: number; type: string; cause: string; suggestion: string;
}

export interface LiveStudentRow {
  id: string; displayName: string; className: string;
  total: number | null; rate: number | null; weakItems: string[]; completedCorrection: boolean;
}

export interface LiveWeakItem {
  field: string; label: string; type: string; cause: string; suggestion: string;
  averageRate: number | null; weakCount: number;
}

export interface LiveDataSummary {
  rowCount: number; classNames: string[]; scoreColumns: string[]; maxTotal: number;
  averageTotal: number | null; averageRate: number | null; scoredStudents: number;
  riskCount: number; completedCorrection: number; weakItems: LiveWeakItem[];
  causeCounts: Array<{ cause: string; count: number }>; students: LiveStudentRow[];
  quality: {
    coverage: number; duplicateRows: number; missingClassRows: number; missingIdentityRows: number;
    missingScoreCells: number; invalidScoreCells: number; totalScoreCells: number;
    validScoreCells: number; totalMismatchRows: number; unconfirmedColumns: string[];
    issues: Array<{ row: number; field: string; message: string }>;
  };
}

export function findQuestionGuide(field: string, guides: QuestionGuide[]) {
  const code = /listening\s*(?:&|and)\s*speaking/i.test(field) ? "听说" : field.match(/Q\d+|听说/i)?.[0].toUpperCase();
  return guides.find((guide) => guide.field === field ||
    (!!code && guide.field.match(/Q\d+|听说/i)?.[0].toUpperCase() === code));
}

export function parseScore(value: string | undefined): number | null {
  const cleaned = (value ?? "").trim().replace(/分$/, "").trim();
  if (!/^-?\d+(?:\.\d+)?$/.test(cleaned)) return null;
  const result = Number(cleaned);
  return Number.isFinite(result) ? result : null;
}

export function analyzeLiveData(rawText: string, guides: QuestionGuide[]): LiveDataSummary | null {
  const parsed = Papa.parse<string[]>(rawText.replace(/^\uFEFF/, ""), {
    skipEmptyLines: "greedy", delimitersToGuess: [",", "\t", ";"],
  });
  if (parsed.errors.length || parsed.data.length < 2) return null;
  const [head, ...rows] = parsed.data;
  const headers = head.map((value) => value.trim());
  if (headers.some((value) => !value) || new Set(headers).size !== headers.length ||
      rows.some((row) => row.length !== headers.length)) return null;
  const records = rows.map((row) => Object.fromEntries(headers.map((field, i) => [field, row[i].trim()])));
  const column = (pattern: RegExp) => headers.find((field) => pattern.test(field));
  const idField = column(/^(学生ID|学号|id|student[_ ]?id)$/i);
  const nameField = column(/^(姓名|学生姓名|学生|name|student[_ ]?name)$/i);
  const classField = column(/^(班级|年级|class|class[_ ]?name)$/i);
  const correctionField = column(/订正|correction/i);
  const totalField = column(/^(总分|合计|total|total[_ ]?score)$/i);
  const metadata = /订正|完成|状态|排名|序号|电话|手机|年龄|邮箱|备注|日期|时间|rank|status|phone|email|age|comment|date|time/i;
  const scoreColumns = headers.filter((field) =>
    ![idField, nameField, classField, correctionField, totalField].includes(field) &&
    !metadata.test(field) && (!!findQuestionGuide(field, guides) || /^Q\d+/i.test(field) ||
      records.some((record) => parseScore(record[field]) !== null)));
  if (!scoreColumns.length) return null;

  const maxima = new Map(scoreColumns.map((field) => {
    const declaredMax = field.match(/(?:满分|max(?:imum)?\s*[:=]?)\s*(\d+(?:\.\d+)?)/i)?.[1];
    const max = declaredMax ? Number(declaredMax) : findQuestionGuide(field, guides)?.max;
    return [field, max && max > 0 ? max : null];
  }));
  const quality: LiveDataSummary["quality"] = {
    coverage: 0, duplicateRows: 0, missingClassRows: 0, missingIdentityRows: 0,
    missingScoreCells: 0, invalidScoreCells: 0, totalScoreCells: records.length * scoreColumns.length,
    validScoreCells: 0, totalMismatchRows: 0,
    unconfirmedColumns: scoreColumns.filter((field) => maxima.get(field) === null), issues: [],
  };
  const seen = new Set<string>();
  const scores = records.map((record, rowIndex) => {
    const result = new Map<string, number | null>();
    for (const field of scoreColumns) {
      const raw = record[field];
      const max = maxima.get(field);
      const score = parseScore(raw);
      const missing = /^(?:|缺考|未交|NA|N\/A|—|-)$/i.test(raw);
      if (missing) quality.missingScoreCells++;
      else if (score === null || score < 0 || (max != null && score > max)) {
        quality.invalidScoreCells++;
        quality.issues.push({ row: rowIndex + 2, field, message: `得分无效${max != null ? `，范围应为 0–${max}` : ""}` });
      }
      const valid = !missing && score !== null && max != null && score >= 0 && score <= max;
      result.set(field, valid ? score : null);
      if (valid) quality.validScoreCells++;
    }
    return result;
  });
  const students = records.map((record, index): LiveStudentRow => {
    const identity = (idField && record[idField]) || (nameField && record[nameField]) || "";
    const className = (classField && record[classField]) || "未分班";
    const identityKey = `${className}\u0000${identity}`;
    if (!identity) quality.missingIdentityRows++;
    else if (seen.has(identityKey)) quality.duplicateRows++;
    else seen.add(identityKey);
    if (className === "未分班") quality.missingClassRows++;
    const available = scoreColumns.filter((field) => scores[index].get(field) != null);
    const total = available.length ? available.reduce((sum, field) => sum + scores[index].get(field)!, 0) : null;
    const max = available.reduce((sum, field) => sum + maxima.get(field)!, 0);
    // A supplied exam total may cover other questions; never divide it by the imported subtotal maximum.
    const suppliedTotal = totalField ? parseScore(record[totalField]) : null;
    if (suppliedTotal !== null && total !== null && Math.abs(suppliedTotal - total) > 0.001) {
      quality.totalMismatchRows++;
      quality.issues.push({ row: index + 2, field: totalField!, message: "总分与已导入小题合计不一致；统计仅使用有效小题得分" });
    }
    const name = (nameField && record[nameField]) || "";
    return {
      id: (idField && record[idField]) || `S${index + 1}`,
      displayName: `S${String(index + 1).padStart(2, "0")} ${name ? `${Array.from(name)[0]}同学` : "匿名学生"}`,
      className, total, rate: total !== null && max > 0 ? total / max : null,
      weakItems: available.filter((field) => scores[index].get(field)! < maxima.get(field)! * 0.65),
      completedCorrection: /^(是|已完成|完成|已订正|1|true|yes)$/i.test(correctionField ? record[correctionField] : ""),
    };
  });
  const scored = students.filter((student) => student.rate !== null);
  const weakItems = scoreColumns.map((field): LiveWeakItem => {
    const guide = findQuestionGuide(field, guides);
    const values = scores.map((row) => row.get(field)).filter((value): value is number => value != null);
    const max = maxima.get(field);
    return {
      field, label: guide?.label ?? field, type: guide?.type ?? "自定义题目",
      cause: guide?.cause ?? "待老师确认", suggestion: guide?.suggestion ?? "补充题型与能力标签后再制定讲评建议。",
      averageRate: values.length && max ? values.reduce((sum, value) => sum + value, 0) / (values.length * max) : null,
      weakCount: max ? values.filter((value) => value < max * 0.65).length : 0,
    };
  }).sort((a, b) => (a.averageRate ?? 2) - (b.averageRate ?? 2));
  const causes = new Map<string, number>();
  students.forEach((student) => student.weakItems.forEach((field) => {
    const cause = findQuestionGuide(field, guides)?.cause ?? "待老师确认";
    causes.set(cause, (causes.get(cause) ?? 0) + 1);
  }));
  quality.coverage = quality.validScoreCells / quality.totalScoreCells;
  return {
    rowCount: students.length, scoredStudents: scored.length,
    classNames: [...new Set(students.map((student) => student.className))], scoreColumns,
    maxTotal: [...maxima.values()].reduce<number>((sum, max) => sum + (max ?? 0), 0),
    averageTotal: scored.length ? scored.reduce((sum, student) => sum + student.total!, 0) / scored.length : null,
    averageRate: scored.length ? scored.reduce((sum, student) => sum + student.rate!, 0) / scored.length : null,
    riskCount: scored.filter((student) => student.rate! < 0.6 || student.weakItems.length >= 3).length,
    completedCorrection: students.filter((student) => student.completedCorrection).length,
    weakItems: weakItems.slice(0, 5), causeCounts: [...causes].map(([cause, count]) => ({ cause, count })).sort((a, b) => b.count - a.count),
    students: students.slice(0, 8), quality,
  };
}
