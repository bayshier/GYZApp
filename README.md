# GYZApp · 股宇宙静态站点集

财富在线「股宇宙」产品线的纯静态站点合集：个人主页、股票知识库、证券从业考试学习系统、技术博客与活动专题页。**零构建、零依赖**，直接托管于 GitHub Pages。

🔗 线上地址：**https://bayshier.github.io/GYZApp/**

## 站点矩阵

| 页面 | 入口 | 说明 |
|------|------|------|
| 🏠 Easin 主页 | [easin.html](easin.html) | 编辑部风格个人主页：二进制数字雨背景、23 个技术 Logo 组成的 3D 星球（可拖拽/点击跳官网）、Works 时间线（全部可点击直达） |
| 📚 股宇宙知识库 | [knowledge.html](knowledge.html) | 股票教学百科：33 篇教程（K线/均线/指标/基本面/港美股/玄学）、30 条名词表、25 个财经网址导航、3D 关键词星球、小白 6 步路线 |
| ✍️ 证券从业考试学习 | [quiz.html](quiz.html) | 两科完整备考系统（见下方详细功能） |
| 📜 MCP 博客 | [blog-kotlin-mcp.html](blog-kotlin-mcp.html) | 《我给 AI 写了两个 Kotlin MCP 服务器》——kline-mcp + android-mcp 架构与踩坑 |
| 🤖 Harness 博客 | [blog-harness-engineering.html](blog-harness-engineering.html) | 企业级多 Agent 协同实战：OODA、fail-closed 沙箱、自进化 Skill |
| 📈 K线视觉博客 | [blog-kline-vision.html](blog-kline-vision.html) | 多模态 AI 判读 K线形态：头肩顶/W底/旗形 3/3 盲测全对 |
| 🎉 27 周年庆 | [cfzx2027.html](cfzx2027.html) | 财富在线 27 周年专题：视频、历程、留影墙 |
| 📲 APP 下载 | [index.html](index.html) | UA 识别跳转蒲公英（Android/iOS 分发） |

## 证券从业考试学习系统

两场考试（证券市场基本法律法规 + 金融市场基础知识）的完整备考闭环：

- **知识点学习**：24 篇 PDF 全量提取文档（考点精讲×8、备考100条、口诀、章节讲义×8、应试笔记 2 部共 52 万字、新旧法条对照表、2021/2025 考试大纲），3156 个小节，按科目懒加载
- **历年真题**：2021.12 两场机考真题 + 考前冲刺卷×3，按套刷题
- **重点速记**：370 张考点卡片（备考100条 98 / 记忆口诀 12 / 数字考点 260），三级智能高亮（数字红显 / 执法术语金线 / 口诀荧光），两科分栏展示
- **题库练习**：137 题（真题 + 考前练习含解析 + 章节例题），顺序 / 随机 / 专项
- **模拟考试**：随机抽 50 题限时作答，答题卡跳题，交卷评分 + 错题回顾
- **艾宾浩斯间隔复习**：错题按 1/3/7/14 天调度，首页「今日待复习」提醒
- **薄弱章节雷达**：按模块统计正确率热力条（红<60% 金60-80% 绿≥80%），一键专项补强
- **答题内联知识点**：答完即在解析下方自动展示最相关考点小节
- **错题本 + 正确率统计**：localStorage 持久化，离线可用

## 技术要点

- **纯静态**：HTML + CSS + 原生 JS（ES5 风格），无框架、无构建、无外部 JS 依赖
- **SPA 路由**：知识库与学习系统使用 hash 路由（`#/learn/law/...`）
- **3D 效果**：Fibonacci 球面分布 + 旋转矩阵投影的 Logo/关键词星球（纯 CSS transform）
- **题库管线**：pypdf 提取 → 正则解析三种题源格式 → 去噪去重 → 生成 `js/quiz-data.js` 等数据文件
- **缓存策略**：静态资源引用带 `?v=` 版本号，发布时递增强制刷新
- **主题体系**：知识库系浅色（深蓝 #1a2b4a + 金 #d4a644 + 红涨绿跌）；个人主页深夜蓝编辑风 + 二进制数字雨

## 目录结构

```
GYZApp/
├── easin.html / knowledge.html / quiz.html     # 三大主站
├── blog-*.html / cfzx2027.html / index.html    # 博客 / 专题 / 下载跳转
├── css/      # easin / knowledge / quiz / blog / anniversary 样式
├── js/
│   ├── knowledge-{data,links,app}.js           # 知识库数据与路由
│   ├── quiz-data.js / quiz-app.js              # 137 题题库 + 学习系统引擎
│   ├── learn-data-{law,basics}.js              # 知识点库（懒加载，按科目拆分）
│   └── exam-extra.js                           # 真题归档 + 370 张速记卡
├── image/    # 截图与配图
├── assets/   # 周年庆照片视频
└── 证券从业考试/   # 原始备考 PDF 材料（题目/知识点提取来源）
```

## 本地开发

```bash
cd GYZApp
python3 -m http.server 8923
# 打开 http://localhost:8923/easin.html（或 quiz.html / knowledge.html）
```

## 部署

推送到 `main` 分支即自动发布到 GitHub Pages（等待约 1 分钟生效）。

## 历史

本仓库最初（2017）是一个二维码自动识别手机系统的下载跳转页教程（autodownload），`index.html` 保留了该职责并沿用至今；其余站点为 2026 年陆续新增。

---

作者：[Easin](https://github.com/bayshier) · Built with ❤️ & AI
