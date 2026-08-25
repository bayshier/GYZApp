# AGENT.md — 本仓库的 AI 协作约定

给在此仓库工作的 AI 编码助手（Claude Code / Codex / Cursor 等）阅读。人类开发者同样适用。

## 项目一句话

股宇宙纯静态站点集（个人主页 + 股票知识库 + 证券从业学习系统 + 博客 + 专题页），零构建零依赖，GitHub Pages 部署。

## 硬性架构规则

1. **纯静态**：禁止引入构建工具、npm 依赖、框架。HTML + CSS + 原生 JS（ES5 风格：`var`、IIFE、字符串拼接渲染）。
2. **主题体系**（勿混用）：
   - 知识库系页面（`quiz.html` / `knowledge.html` / `blog-*.html`）：浅色，`--brand:#1a2b4a`、`--accent:#d4a644`、红涨绿跌
   - 个人主页（`easin.html`）：深夜蓝 `#0a0e16` 编辑风 + 暖白 `#f4f1ea` + 二进制数字雨
3. **缓存版本号**：任何改动 CSS/JS 文件内容后，**必须同步递增引用处的 `?v=`**（在对应 HTML 里），否则用户浏览器会拿旧缓存（历史上已因此翻车两次）。
4. **数据即代码**：`js/quiz-data.js`、`js/learn-data-*.js`、`js/exam-extra.js` 均为脚本自动生成，**不要手改**；更新流程见下。

## 题库/知识点更新流程

原始材料放 `证券从业考试/` 文件夹（含子目录，注意去重：`证券从业-讲义/` 与外层重复）：

1. pypdf 提取文本（注意清除代理字符 surrogates 与广告水印行）
2. 三种题源格式各有解析器：真题（行内`参考答案：X`）、练习题（文末答案区**顺序配对**，题号分节重排）、讲义例题（`例题·单选题`头下**多道连排**，按`【答案】`切分）
3. 生成 `quiz-data.js`（题库）/ `learn-data-{law,basics}.js`（知识点，按科目拆分懒加载）/ `exam-extra.js`（真题归档 + 速记卡）
4. 同步更新页面上的**题数/篇数文案**与 `LEARN_SUMMARY` 静态摘要

## 验证清单（改动后必做）

- [ ] `node --check` 全部改动的 js
- [ ] 本地 `python3 -m http.server 8923`，浏览器验证渲染与交互（注意 hash 路由页面需强刷拿新 JS）
- [ ] HTML 类名与 CSS 定义交叉核对
- [ ] 递增 `?v=` 版本号

## ✅ 必守约定：同步更新 README

**每次给项目新增/修改页面、栏目、题库、知识点、功能后，必须同步更新 `README.md`**：

- 新页面 → 加入「站点矩阵」表
- 学习系统功能变化 → 更新「证券从业考试学习系统」清单与数字（题数/篇数/卡片数）
- 新数据文件 → 更新「目录结构」
- 主题/架构变化 → 更新「技术要点」

README 的数字必须与实际数据一致（可 `node -e` 统计）。

## 其他约定

- 推送：`git push origin main` 即触发 GitHub Pages 部署（约 1 分钟）。github.com 443 在本机网络下**间歇性被拦截**，推送失败时等待重试即可，切勿改 remote 协议（SSH key 未注册）。
- 页面底部统一署名「作者：Easin」链接到 `easin.html`（纯跳转页除外）。
- 入口互链：easin Works → 各站点；knowledge 首页横幅 → quiz；quiz 头部 → knowledge。
- 学习系统 hash 路由：`#/practice/{subj}/{mode}`、`#/exam/{subj}`、`#/learn/{subj}[/{docId}]`、`#/papers[/{id}]`、`#/memento`、`#/review/{subj}`、`#/radar/{subj}`、`#/drill/{ids}`。
