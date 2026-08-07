# GitHub 高星教育平台对标记录

检索日期：2026-08-08。Star 数是本次检索快照，会随时间变化；本项目只借鉴产品与代码组织模式，没有复制第三方实现代码。

## 参考项目

| 项目 | 本次 Star 快照 | 观察到的模式 | 本 demo 的落地 |
| --- | ---: | --- | --- |
| [Open edX](https://github.com/openedx/edx-platform) | 8,156 | LMS、教师工作台与成绩流程分层，课程上下文始终明确 | 增加当前周测、班级、日期、来源和分析状态上下文条 |
| [Moodle](https://github.com/moodle/moodle) | 7,314 | Analytics 将预测/洞察与通知、批量动作连接，而非只展示图表 | 掌握度单元格可下钻，并可把建议加入跟进清单 |
| [Canvas LMS](https://github.com/instructure/canvas-lms) | 6,762 | Learning Mastery Gradebook 采用学生×学习成果矩阵、固定学生列、单元格详情与分布 | 新增学生×英语能力掌握矩阵、筛选、证据与教学任务详情 |
| [学之思 xzs-mysql](https://github.com/mindskip/xzs-mysql) | 3,594 | 任务中心、考试记录、自动错题本，以及 Web/小程序双端 | 保留教师端任务闭环、学生错题本与移动端入口 |
| [Frappe Learning](https://github.com/frappe/lms) | 3,116 | Batch、Assessment、Student Progress 分开组织，教师按批次查看进度 | 用班级/周测上下文和学生能力下钻连接班级分析与个人进度 |
| [LearnHouse](https://github.com/learnhouse/learnhouse) | 2,108 | Assignment Editor、Submissions、Analytics 分页，支持分析导出和学习进度快照 | 保持导入、批改、学情、报告分工，并加强导入质量检查 |

## 本轮优先级判断

1. 先补“看完图表之后做什么”：从班级结论下钻到学生、能力点、证据和跟进任务。
2. 先检查数据质量再计算：缺失得分不自动按 0 分，提示重复记录、缺姓名/班级和识别覆盖率。
3. 保留高中英语专属性：能力矩阵使用信息定位、推断概括、词汇语境、篇章逻辑、综合读写，而不是通用 LMS 指标。
4. 移动端优先服务快看和跟进：压缩学生指标区，把更多首屏空间留给学生画像和下一步任务。

## 代码取舍

- 当前仍是本地前端 demo，不引入大型 LMS 的后端、权限、数据库和插件系统。
- 数据结构继续使用 TypeScript 模型和模拟数据；交互状态保留在浏览器端。
- 第三方项目采用 GPL/AGPL 等不同许可证，本轮仅基于公开界面模式和代码结构做独立实现。
