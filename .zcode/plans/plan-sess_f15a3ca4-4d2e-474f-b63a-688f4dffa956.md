# easin.html 轻量 3D 简历改造方案

借鉴 sen-3d-resume 的核心视觉手法，但**保持单 HTML 文件零依赖**（符合项目静态站惯例），用原生 CSS+JS 实现。

## 改造目标
让终端极客风主页获得「3D 简历」的纵深感与交互趣味，不引入任何外部库/构建工具。

## 改动文件
- `easin.html`（结构 + 内联 `<script>`）
- `css/easin.css`（新增特效样式，不破坏现有终端美学）

---

## 一、noko 吉祥物：固定角落 + 眼神追踪（标志性效果）
借鉴 sen-3d-resume 的眼球追踪——这是它最抓人的交互。

- **位置**：noko 从 Hero 区移到**页面右下角固定定位**（`position: fixed`），尺寸缩小（约 72px），常驻可见。
- **眼神/头部追踪**：noko 整体随鼠标位置轻微转动（`transform: rotate/scale`，限幅 ±8°），模拟"看着你"的效果。原生 JS 监听 `mousemove`，用 `requestAnimationFrame` 节流。
- **悬停反应**：鼠标移到 noko 上时放大 + 边框高亮。
- **移动端**：窄屏（<600px）隐藏固定 noko，避免遮挡内容（Hero 区原有的静态展示框保留）。
- Hero 区原有 `.hero-mascot` 展示框**保留**，作为"大图介绍"；角落的是"常驻陪伴"小版。两者用不同 class 区分。

## 二、滚动驱动的 3D 相机感
借鉴 sen-3d-resume 滚动驱动相机——用纯 CSS 视差 + JS 入场动画模拟。

### 2.1 区块入场动画（IntersectionObserver）
- 各 `.section`（数据成就/技术栈/项目/时间线/联系我）进入视口时：从 `opacity:0 + translateY(40px) scale(0.96)` 渐显到正常，制造"镜头推近"的空间感。
- 用 `IntersectionObserver`（零依赖）监听，触发后加 `.in-view` class，CSS transition 过渡。一次性触发，不重复。
- 子元素（如 `.stat`/`.project`/`.tl-item`）错开延迟（`transition-delay` 按 index 递增），形成"逐个浮现"的层次感。

### 2.2 背景视差（相机感核心）
- 现有 `body::before` 的网格+光晕背景，改为随滚动产生**纵向位移**（`background-position-y` 跟随 `scrollY`），制造"背景比前景动得慢"的视差，强化深度。
- Hero 区的 `.hero-avatar` 和 `.hero-mascot` 加轻微 `translateY` 视差（滚动时上移幅度小于内容），模拟 3D 层次。

## 三、胶片噪点 overlay（氛围感）
借鉴 sen-3d-resume 的 NoiseOverlay。
- 新增一个 `position: fixed; inset: 0; pointer-events: none; z-index: 9999` 的全屏遮罩，用 CSS 生成的 SVG 噪点（`feTurbulence`）做轻微胶片颗粒，`opacity: 0.04`，不干扰阅读但增加质感。
- 纯 CSS 实现，无外部资源。

## 四、性能与降级保障
- 鼠标追踪用 RAF 节流，移动端（无鼠标）不绑定。
- `prefers-reduced-motion: reduce` 媒体查询下，关闭所有动画/视差，仅保留静态布局（无障碍）。
- 噪点 overlay 用 `mix-blend-mode` 确保不挡点击。
- 不新增任何外部 JS/CSS 依赖，保持可直接 `open` 打开。

## 不做的事（明确边界）
- ❌ 不引入 Three.js / React / 构建工具（保持静态站一致性）
- ❌ 不加 .glb 3D 模型（noko 是 2D 图，用 transform 模拟立体感即可）
- ❌ 不改现有内容结构（文案/链接/时间线不变），只增强表现层

---

## 实现步骤
1. `easin.html`：新增角落 noko 元素（fixed 定位）+ 噪点 overlay div + 末尾内联 `<script>`（鼠标追踪 + IntersectionObserver + 背景视差）。
2. `css/easin.css`：新增 `.noko-float`（固定角落 noko）、`.section` 入场动画 class、`.in-view` 状态、背景视差 keyframes、`.noise-overlay`、`prefers-reduced-motion` 降级、移动端隐藏角落 noko 的媒体查询。
3. 浏览器打开验证效果。