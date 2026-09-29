/* ============================================================
 * level.js · 网页 → 像素关卡 生成器
 * ------------------------------------------------------------
 * 核心思想：把网页当成一张「纸」，把上面所有可见内容
 * （标题/正文/图片/代码块…）当作画在纸上的「墨水」。
 * 每一粒墨水像素都是可破坏的地形——打掉的像素越多，
 * 破坏率越高。玩家则踩在这些文字图片上向下推进。
 *
 * 产出四样东西给游戏引擎（game.js）：
 *   1. canvas   —— 整页像素画（渲染用）
 *   2. mask     —— Uint8Array 实心掩码（碰撞用，1=实心 0=空）
 *   3. enemies  —— 敌人出生点列表（取自 <a> 链接的位置）
 *   4. totalInk —— 初始墨水像素总数（算破坏率用）
 *
 * 布局采用最朴素的「文档流」：按 DOM 顺序从上往下排，
 * 标题大字、正文小字、图片成块、链接下划线——一眼就能认出
 * 这是谁家的网页。
 * ============================================================ */

(function () {
    'use strict';

    /* ---------- 可调参数 ---------- */
    var W = 480;                 // 关卡逻辑宽度（像素）
    var MAX_H = 6000;            // 关卡最大高度（超出截断）
    var PAD = 16;                // 左右边距
    var MAX_IMGS = 30;           // 最多嵌入的真实图片数
    var MAX_ENEMIES = 24;        // 最多敌人数
    var BG = '#f4f1ea';          // 纸面底色（米白，像旧网页）
    var INK = '#24292f';         // 正文墨色
    var INK_HEAD = '#111418';    // 标题墨色
    var INK_LINK = '#1a5fb4';    // 链接色（蓝）
    var INK_FADE = '#6a737d';    // 次要文字

    /* 标题字号表：h1 最大，h6 最小 */
    var H_SIZE = { H1: 26, H2: 21, H3: 18, H4: 16, H5: 15, H6: 14 };

    /* ---------- 工具：把外链图片经代理取回 ----------
     * 不能直接 <img> 画到画布上——外部图片会「污染」画布，
     * 之后 getImageData 读像素会直接抛安全异常，破坏系统就废了。
     * 所以图片也走 CORS 代理取回 blob 再解码，画布保持干净。 */
    function loadViaProxy(src) {
        var proxies = [
            function (u) { return 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u); },
            function (u) { return 'https://corsproxy.io/?url=' + encodeURIComponent(u); }
        ];
        var i = 0;
        function attempt() {
            if (i >= proxies.length) return Promise.reject(new Error('图片全部失败'));
            return fetch(proxies[i](src), { mode: 'cors' })
                .then(function (r) { if (!r.ok) throw 0; return r.blob(); })
                .then(function (b) { return createImageBitmap(b); })
                .catch(function () { i++; return attempt(); });
        }
        return attempt();
    }

    /* ---------- 关卡构建器 ---------- */
    function Builder() {
        this.H = 1200;                       // 先给个初始高度，内容多了再扩
        this.cv = document.createElement('canvas');
        this.cv.width = W; this.cv.height = this.H;
        this.ctx = this.cv.getContext('2d', { willReadFrequently: true });

        this.y = 24;                         // 当前排版游标（从顶部往下）
        this.imgCount = 0;                   // 已嵌入的真实图片数
        this.enemies = [];                   // 敌人出生点
        this.truncated = false;              // 是否因超高被截断
        this.title = '';

        /* 纸面底色 */
        this.ctx.fillStyle = BG;
        this.ctx.fillRect(0, 0, W, this.H);
    }

    /** 高度不够时扩容画布（保留已有内容） */
    Builder.prototype.ensure = function (need) {
        if (need <= this.H) return;
        var nh = Math.min(MAX_H + 400, Math.ceil(need * 1.2 / 400) * 400);
        var old = this.ctx.getImageData(0, 0, W, this.H);
        this.cv.height = nh; this.H = nh;
        this.ctx.putImageData(old, 0, 0);
        this.ctx.fillStyle = BG;
        this.ctx.fillRect(0, this.y, W, nh - this.y);
    };

    /** 空间不足则标记截断 */
    Builder.prototype.full = function () {
        return this.y >= MAX_H;
    };

    /** 自动换行绘制一段文字；返回占用高度。isLink 时给链接色+下划线并记敌人 */
    Builder.prototype.drawText = function (text, size, color, bold, isLink) {
        text = (text || '').replace(/\s+/g, ' ').trim();
        if (!text) return 0;
        var ctx = this.ctx;
        /* 画笔状态封装成函数：ensure 扩容画布会重置全部画笔状态，
           扩容后必须重设字号，否则文字会变成默认 10px */
        var setFont = function () {
            ctx.font = (bold ? 'bold ' : '') + size + 'px "PingFang SC","Microsoft YaHei",monospace';
        };
        setFont();
        var maxW = W - PAD * 2;
        var lineHeight = Math.ceil(size * 1.5);

        /* 手动按宽度断行 */
        var lines = [], line = '';
        for (var i = 0; i < text.length; i++) {
            var test = line + text[i];
            if (ctx.measureText(test).width > maxW && line) {
                lines.push(line); line = text[i];
            } else line = test;
        }
        if (line) lines.push(line);

        this.ensure(this.y + lines.length * lineHeight + 12);
        setFont();                                       // ⚠️ 扩容后重设
        ctx.fillStyle = color;
        var bx = isLink ? PAD : PAD;
        for (var j = 0; j < lines.length; j++) {
            var ty = this.y + size;
            ctx.fillText(lines[j], bx, ty);
            if (isLink) {
                /* 链接下划线 + 记录敌人出生点（每隔几个链接取一个，别太密） */
                var w = Math.min(ctx.measureText(lines[j]).width, maxW);
                ctx.fillRect(bx, ty + 3, w, 1);
                if (this.enemies.length < MAX_ENEMIES && (this.enemies.length === 0 || this.y - this.enemies[this.enemies.length - 1].y > 120)) {
                    this.enemies.push({ x: bx + 8, y: ty - size });
                }
            }
            this.y += lineHeight;
        }
        return lines.length * lineHeight;
    };

    /** 图片占位框（真实图片加载失败时） */
    Builder.prototype.drawPlaceholder = function (w, h) {
        w = Math.min(w || 180, W - PAD * 2); h = Math.min(h || 110, 140);
        this.ensure(this.y + h + 16);
        var ctx = this.ctx, x = PAD, y = this.y;
        ctx.fillStyle = '#e8e4da'; ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = '#b9b2a4'; ctx.lineWidth = 1;
        ctx.strokeRect(x + .5, y + .5, w - 1, h - 1);
        /* 画一座小山 + 太阳，经典的「图片加载失败」既视感 */
        ctx.fillStyle = '#a8c686';
        ctx.beginPath(); ctx.moveTo(x + 12, y + h - 12);
        ctx.lineTo(x + w * .42, y + 22); ctx.lineTo(x + w - 30, y + h - 12); ctx.fill();
        ctx.fillStyle = '#f0c75e';
        ctx.beginPath(); ctx.arc(x + w - 26, y + 20, 9, 0, 7); ctx.fill();
        this.y += h + 14;
    };

    /** 图片盖章：把抓回来的真实图片画进预留的占位区。
     *  走代理取回 blob 再解码，画布不会被「污染」，
     *  之后 buildMask 的全画布扫描能正常读到像素。 */
    function stampImage(b, bm, t) {
        var maxW = t.w, maxH = Math.min(t.h, 140);
        var s = Math.min(maxW / bm.width, maxH / bm.height, 1);
        var dw = Math.max(8, Math.floor(bm.width * s));
        var dh = Math.max(8, Math.floor(bm.height * s));
        var dx = PAD + Math.floor(Math.max(0, maxW - dw) / 2);
        var dy = t.y;
        var ctx = b.ctx;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(dx - 2, dy - 2, dw + 4, dh + 4);
        try { ctx.drawImage(bm, dx, dy, dw, dh); } catch (e) { /* 个别坏图忽略 */ }
    }

    /** 分隔线 */
    Builder.prototype.drawHr = function () {
        this.ensure(this.y + 18);
        this.ctx.fillStyle = '#c4bdb0';
        this.ctx.fillRect(PAD, this.y + 8, W - PAD * 2, 2);
        this.y += 18;
    };

    /** 代码块：等宽字 + 灰底框 */
    Builder.prototype.drawCode = function (text) {
        text = (text || '').replace(/\s+/g, ' ').trim().slice(0, 400);
        if (!text) return;
        var ctx = this.ctx, size = 10;
        var setFont = function () { ctx.font = size + 'px "SF Mono",monospace'; };
        setFont();
        var maxW = W - PAD * 2 - 16;
        var lines = [], line = '';
        for (var i = 0; i < text.length; i++) {
            var test = line + text[i];
            if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = text[i]; }
            else line = test;
            if (lines.length >= 12) break;   // 代码块最多 12 行
        }
        if (line && lines.length < 12) lines.push(line);
        var h = lines.length * 14 + 16;
        this.ensure(this.y + h + 12);
        setFont();                                       // ⚠️ 扩容后重设
        ctx.fillStyle = '#ece9e2'; ctx.fillRect(PAD, this.y, W - PAD * 2, h);
        ctx.strokeStyle = '#d0c9bc'; ctx.strokeRect(PAD + .5, this.y + .5, W - PAD * 2 - 1, h - 1);
        ctx.fillStyle = '#4a5568';
        for (var j = 0; j < lines.length; j++) ctx.fillText(lines[j], PAD + 8, this.y + 14 + j * 14);
        this.y += h + 12;
    };

    /* ---------- DOM 遍历 ----------
     * 只挑「看得见」的元素渲染，其余（script/style 等）直接跳过。
     * 这份映射规则表决定了网页最后长什么样。 */
    var SKIP = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, HEAD: 1, META: 1, LINK: 1, SVG: 1, IFRAME: 1, CANVAS: 1, VIDEO: 1, AUDIO: 1, TEMPLATE: 1 };
    var TEXT_TAGS = { P: 13, LI: 12, BLOCKQUOTE: 12, FIGCAPTION: 11, TD: 12, TH: 12, DD: 12, DT: 12 };

    Builder.prototype.walk = function (node, inLink) {
        if (this.full() || this.truncated) return;
        if (node.nodeType === 3) {                       // 文本节点：裸文字（少见于现代页面）
            var t = node.textContent;
            if (t && t.trim().length > 2 && !/^\s+$/.test(t)) this.drawText(t, 11, INK_FADE, false, inLink);
            return;
        }
        if (node.nodeType !== 1) return;
        var tag = node.tagName;
        if (SKIP[tag]) return;

        /* 标题族 */
        if (H_SIZE[tag]) {
            this.y += 6;
            this.drawText(node.textContent, H_SIZE[tag], INK_HEAD, true, false);
            this.y += 4;
            return;
        }
        /* 链接：递归内部文本，标记 inLink */
        if (tag === 'A') { this.walkChildren(node, true); this.y += 2; return; }
        /* 图片：排版阶段只「预留位置」画占位框并登记任务；
           真实图片在整页排版完成后统一异步抓取再盖章，
           这样既不阻塞排版节奏，也不会污染画布 */
        if (tag === 'IMG') {
            var src = node.getAttribute('src') || node.getAttribute('data-src') || '';
            if (src && /^https?:/.test(src) && this.imgCount < MAX_IMGS) {
                this.imgCount++;
                this.imgTasks = this.imgTasks || [];
                this.imgTasks.push({
                    src: src,
                    y: this.y,
                    w: Math.min(parseInt(node.getAttribute('width')) || 200, W - PAD * 2),
                    h: Math.min(parseInt(node.getAttribute('height')) || 120, 140)
                });
            }
            this.drawPlaceholder(
                Math.min(parseInt(node.getAttribute('width')) || 180, W - PAD * 2),
                Math.min(parseInt(node.getAttribute('height')) || 110, 140)
            );
            return;
        }
        /* 水平线 */
        if (tag === 'HR') { this.drawHr(); return; }
        /* 代码块 */
        if (tag === 'PRE' || tag === 'CODE') { this.drawCode(node.textContent); return; }
        /* 表格：逐格当文本画 */
        if (tag === 'TABLE') {
            var cells = node.querySelectorAll('td,th');
            for (var c = 0; c < cells.length && c < 60; c++) this.drawText(cells[c].textContent, 11, INK, false, false);
            this.y += 6;
            return;
        }
        /* 普通文本块 */
        if (TEXT_TAGS[tag]) {
            var txt = node.textContent;
            if (txt && txt.trim()) this.drawText(txt, TEXT_TAGS[tag], INK, false, inLink);
            this.y += 4;
            return;
        }
        /* 其余容器（div/section/ul/…）：继续深入 */
        this.walkChildren(node, inLink);
    };

    Builder.prototype.walkChildren = function (node, inLink) {
        var kids = node.childNodes;
        for (var i = 0; i < kids.length; i++) {
            if (this.full()) { this.truncated = true; return; }
            this.walk(kids[i], inLink);
        }
    };

    /* ---------- 生成实心掩码 ----------
     * 一次性读全画布像素：alpha>0 即视为「实心墨水」。
     * 之后游戏里的破坏只需小范围读写，性能无压力。 */
    function buildMask(builder) {
        var h = builder.H;
        var data = builder.ctx.getImageData(0, 0, W, h).data;
        var mask = new Uint8Array(W * h);
        var total = 0;
        for (var i = 0, p = 0; i < mask.length; i++, p += 4) {
            if (data[p + 3] > 40) { mask[i] = 1; total++; }
        }
        return { mask: mask, totalInk: total };
    }

    /* ============================================================
     * 对外接口
     * ============================================================ */
    var DLevel = {};

    /**
     * 从 HTML 源码构建关卡
     * @param {string} html 网页源码
     * @param {string} url  网址（用于标题兜底）
     * @param {function} onStep 加载进度回调（文字）
     * @returns {Promise<object>} level 对象
     */
    DLevel.build = async function (html, url, onStep) {
        onStep = onStep || function () {};

        var doc = new DOMParser().parseFromString(html, 'text/html');
        var b = new Builder();
        b.title = (doc.title || url || '未知网页').slice(0, 40);

        onStep('解析 DOM，规划像素排版…');
        /* 去掉所有图片标签的懒加载属性干扰，交给 walk 统一处理 */
        b.drawText('▍ ' + b.title, 20, INK_HEAD, true, false);
        b.walkChildren(doc.body || doc.documentElement, false);

        /* 兜底：内容太少（比如纯 SPA 空壳）就补说明文字 */
        if (b.y < 200) {
            b.y += 20;
            b.drawText('（这个页面几乎没什么可见内容——大概是纯脚本渲染的 SPA。', 13, INK_FADE, false, false);
            b.drawText('　 试试内容更丰富的站点，比如百科或新闻站。）', 13, INK_FADE, false, false);
            b.y += 30;
            for (var d = 0; d < 5; d++) {
                b.drawText('占位盒子 #' + (d + 1) + ' —— 也别放过它，一样能打碎。', 14, INK, false, false);
                b.drawPlaceholder(220, 90);
            }
        }

        /* 图片盖章：排版时预留的占位框，现在把真实图片抓回来画上去。
           顺序执行（不并发），避免同时打满代理被限流 */
        if (b.imgTasks && b.imgTasks.length) {
            var n = b.imgTasks.length;
            for (var ti = 0; ti < n; ti++) {
                var task = b.imgTasks[ti];
                onStep('抓取页面图片（' + (ti + 1) + '/' + n + '）…');
                try {
                    var bm = await loadViaProxy(task.src);
                    stampImage(b, bm, task);
                } catch (e) { /* 抓不到就保留占位框，不影响可玩 */ }
            }
        }

        /* ===== 出生龛：保证任何页面都有确定可站的出生点 =====
           密集文字页里找不到天然净空（13px 身体净空 + 双脚同时踩实
           的位置几乎不存在），所以在版心中部强行：
           ① clearRect 清空一条竖井（身体区 + 上方跳跃空间）
           ② 铺一根绿色出生平台
           之后 buildMask 扫描画布，自动把平台记为实心、竖井记为空 */
        var sx0 = Math.floor(W / 2), sy0 = 120;
        b.ctx.clearRect(sx0 - 10, sy0 - 80, 20, 94);     // 竖井：身体 + 跳跃空间
        b.ctx.fillStyle = '#3ddc84';                     // 出生平台（品牌绿）
        b.ctx.fillRect(sx0 - 26, sy0 + 14, 52, 5);

        onStep('生成实心掩码（碰撞数据）…');
        var m = buildMask(b);
        /* 底部通关区标记：最后 120px 是「页脚」，冲进去即胜利 */
        onStep('完成！关卡高度 ' + b.H + 'px · 墨水 ' + m.totalInk + ' 粒');

        return {
            canvas: b.cv, W: W, H: b.H,
            mask: m.mask, totalInk: m.totalInk,
            enemies: b.enemies, title: b.title,
            truncated: b.truncated
        };
    };

    /** 判断某像素是否实心（越界视为实心=墙） */
    DLevel.solidAt = function (lv, x, y) {
        if (x < 0 || x >= lv.W) return true;          // 左右是墙
        if (y < 0) return false;                       // 头顶开放
        if (y >= lv.H) return true;                    // 底部是地板
        return lv.mask[y * lv.W + x] === 1;
    };

    /**
     * 圆形破坏：在 (cx,cy) 半径 r 内抹掉墨水像素
     * @returns {number} 本次毁掉的像素数
     */
    DLevel.erase = function (lv, cx, cy, r) {
        var ctx = lv.canvas.getContext('2d', { willReadFrequently: true });
        var x0 = Math.max(0, Math.floor(cx - r)), x1 = Math.min(lv.W - 1, Math.ceil(cx + r));
        var y0 = Math.max(0, Math.floor(cy - r)), y1 = Math.min(lv.H - 1, Math.ceil(cy + r));
        if (x1 < x0 || y1 < y0) return 0;
        var img = ctx.getImageData(x0, y0, x1 - x0 + 1, y1 - y0 + 1);
        var d = img.data, removed = 0, r2 = r * r;
        for (var py = y0; py <= y1; py++) {
            for (var px = x0; px <= x1; px++) {
                var dx = px - cx, dy = py - cy;
                if (dx * dx + dy * dy > r2) continue;
                var idx = (py - y0) * (x1 - x0 + 1) + (px - x0);
                var mi = py * lv.W + px;
                if (lv.mask[mi] === 1 && d[idx * 4 + 3] > 0) {
                    d[idx * 4 + 3] = 0;              // 画布上抹掉
                    lv.mask[mi] = 0;                 // 掩码上抹掉
                    removed++;
                }
            }
        }
        if (removed) ctx.putImageData(img, x0, y0);
        return removed;
    };

    /** 统计剩余墨水（算破坏率） */
    DLevel.remaining = function (lv) {
        var n = 0;
        for (var i = 0; i < lv.mask.length; i++) if (lv.mask[i]) n++;
        return n;
    };

    /* ============================================================
     * 内置演示关卡：完全离线可玩，不依赖任何网络与代理
     * ============================================================ */
    DLevel.buildDemo = async function (onStep) {
        onStep = onStep || function () {};
        onStep('生成内置演示关卡…');
        var b = new Builder();
        b.title = '演示网页 · 欢迎来到像素互联网';
        b.drawText('▍ 演示网页：欢迎来到像素互联网', 20, INK_HEAD, true, false);
        b.y += 8;
        b.drawText('这是一个内置的演示页面——因为你输入的网址抓取失败了。', 13, INK, false, false);
        b.drawText('公共跨域代理有时会限流，但破坏的快乐不该被限流。', 13, INK, false, false);
        b.y += 10;
        b.drawText('玩法提示', 17, INK_HEAD, true, false);
        b.drawText('左右移动，跳上文字平台，用子弹把整个页面轰成渣。', 13, INK, false, false);
        b.drawText('标题是大块头，打碎特别解压；图片也不要放过。', 13, INK, false, false);
        b.drawText('一路向下推进，冲到底部的「页脚区」即通关！', 13, INK, false, false);
        b.y += 10;
        var chapters = ['第一章 · 超文本的历史', '第二章 · 链接如何编织世界', '第三章 · 404 与它的浪漫', '第四章 · 论盒子的自我修养', '第五章 · 页脚才是灵魂'];
        for (var i = 0; i < chapters.length; i++) {
            b.drawText(chapters[i], 18, INK_HEAD, true, false);
            b.drawText('这里本来应该有一段关于「' + chapters[i].slice(4) + '」的精彩论述，但为了演示效果，我们决定用一堆可以被打碎的文字来填充版面。像素时代的网页不该只有浏览——它还可以被摧毁。', 12, INK, false, false);
            b.drawPlaceholder(240, 100);
            b.drawText('相关阅读：像素美学 / 破坏的艺术 / 页脚哲学 / 论 div 的百种死法', 12, INK_LINK, false, true);
            b.drawHr();
        }
        /* 出生龛：与 DLevel.build 同款，保证演示关也有确定出生点 */
        var dsx = Math.floor(W / 2), dsy = 120;
        b.ctx.clearRect(dsx - 10, dsy - 80, 20, 94);
        b.ctx.fillStyle = '#3ddc84';
        b.ctx.fillRect(dsx - 26, dsy + 14, 52, 5);
        var m = buildMask(b);
        return {
            canvas: b.cv, W: W, H: b.H,
            mask: m.mask, totalInk: m.totalInk,
            enemies: b.enemies, title: b.title, truncated: false
        };
    };

    window.DLevel = DLevel;
})();
