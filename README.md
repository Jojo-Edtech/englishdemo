# 英语备课组学情分析平台（演示原型）

在线预览：<https://jojo-edtech.github.io/englishdemo/>

面向高中英语备课组的学情分析 demo：导入成绩 → 批改诊断 → 错因定位 → 学情可视化 → 讲评课与家校报告，一条闭环走完。

## 主要功能

- **数据导入中心**：粘贴 Excel/CSV/TSV 本地解析（不上传服务器），字段映射预览、学生姓名遮蔽与数据质量门；校验重复表头、异常分数、缺失值、未知满分和总分口径
- **批改与作文工作台**：选择题批改样例、读后续写 rubric、内置作文预设点评与教师复核清单，不对自带作文自动评分
- **错因诊断**：单题错因、误选项 item analysis、学生分布
- **学情可视化**：题型×错因堆叠、能力雷达、热力图、知识图谱、重复错因追踪、**学生×能力掌握矩阵**、**班级横向对比**
- **预警闭环**：学生预警中心，处理状态可流转（未处理 → 已安排 → 已复盘）；多条跟进任务在当前页面会话内保留
- **报告模板**：备课组 / 学生 / 家长三版报告，支持**语气切换（正式/简洁/鼓励）**、正文编辑、复制、下载 Markdown、打印存 PDF；家长模板默认隐藏排名，修改后须教师复核
- **讲评课备课单**：可复制、可导出教案大纲
- **学生端**：个人画像、进度曲线、任务流程示例、**本地规则生成跟进草稿**、**个人错题本导出打印**；任务按学生隔离，缺少历史档案时显示空状态
- **中英文切换**：首次访问默认中文，顶部可选择 English；界面、图表、诊断、练习、报告与导出使用本地英文文案，记住语言偏好，不调用翻译 API

真实导入只驱动本地试用台及相关匿名摘要；其余页面包含标明来源的预设演示数据。教师/学生切换不是权限系统，家长和校长属于报告使用场景，尚无独立账号。当前会话的草稿和跟进状态刷新后重置，不写入云端数据库。

## 中英文内容

- 上传的题目、作文、姓名、班级和教师修改稿保留原文，不自动翻译；中英文报告草稿分别暂存在本次页面会话中。
- 英文模式可下载、载入英文成绩样例；支持 `id`、`name`、`class`、题号及 `max10` 等满分标记。中英文样例的分数与分析结果一致。
- 公开版不包含外部模型调用或密钥输入。语言切换和本地复核不发送学生内容。
- 文案维护在 `src/i18n/`。只翻译显示值，不改动题型枚举、学生 ID、图表 dataKey 或原始数据。动态文案使用 `t("模板 {0}", [value])`，保留完整语序。

English Learning Analytics supports teacher workflows from importing assessment results to reviewing errors, planning targeted practice and sharing student or family reports. Select **English** in the header. Preset examples remain clearly distinguished from teacher-entered records. The public demo does not call external AI services.

## 本地开发

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 产物在 dist/
npm run test:live-data
npm run test:security
npm run test:essay-rubric
npm run test:i18n
```

推送到 `main` 分支后，GitHub Actions 自动构建并部署到 GitHub Pages。

## 设计依据

- [design-refresh.md](design-refresh.md)：Grid 参考图改版、网站调研和下载的设计 skill；白色顶部导航、功能网格、移动端完整菜单与学校标识清理
- [teacher-demand-audit.md](teacher-demand-audit.md)：基于小红书教师需求调研的功能优先级
- [github-platform-benchmark.md](github-platform-benchmark.md)：高星教育平台代码与工作流对标，以及本 demo 的取舍
- [github-benchmark-2026-10-03.md](github-benchmark-2026-10-03.md)：Frappe Education、Kolibri、nbgrader、Moodle 的定向代码对照与本轮建议
- [role-qa-2026-10-03.md](role-qa-2026-10-03.md)：五角色各 300 轮回归、修复记录、视觉检查与测试边界
- 参考主流学情分析产品（智学网、极课大数据、好分数）的报告分层、班级对比、错题本打印、个性化学习手册等模式

## 隐私边界

- 成绩和作文只在浏览器本地处理，不连接模型服务、服务器数据库或私有云接口
- 不收集或保存密钥；自动删除旧版本在同一站点浏览器存储中遗留的模型配置
- 内置作文提供预设点评；其他作文提供通用教师复核清单，不冒充真实评分
- 备课助手只提供手动复制的匿名摘要和提示词；外部网站链接不会自动传输学生数据
- 不包含真实学校名称、校徽、教师资料或真实学生成绩；示例姓名与分数均为模拟数据
- GitHub Pages 工作流只构建静态站点，不包含私有服务器部署连接
- 家长版报告默认隐藏排名与班级比较
