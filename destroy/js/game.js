/* ============================================================
 * game.js · 游戏引擎
 * ------------------------------------------------------------
 * 可破坏地形（Destructible Terrain）是这个引擎的灵魂。
 * 经典实现思路来自《百战 worms / Liero》这类游戏：
 *
 *   · 关卡是一张巨大的像素画（level.canvas），
 *     每一粒「墨水像素」都是实心地形；
 *   · 另有一张同尺寸的 Uint8Array 掩码（level.mask）
 *     记录每个像素是否实心，碰撞检测就是查表；
 *   · 子弹命中时，以命中点为圆心把圆内像素同时从
 *     画布和掩码上抹掉——地形就真的被打出一个洞。
 *
 * 玩法：从页面顶部向下推进，文字图片都是平台也是靶子，
 * 冲到底部的「页脚通关区」即胜利。
 * ============================================================ */

(function () {
    'use strict';

    /* ============================================================
     * 一、常量与全局状态
     * ============================================================ */
    var VIEW_W = 480;            // 视口逻辑宽度（与关卡同宽，只纵向卷动）
    var GRAVITY = 0.34;          // 重力加速度
    var MOVE_SPD = 1.7;          // 水平移速
    var JUMP_V = -6.4;           // 起跳速度
    var BULLET_SPD = 7;          // 子弹速度
    var BULLET_R = 5;            // 子弹破坏半径
    var MAX_HP = 100;            // 玩家生命
    var FOOTEER_H = 140;         // 底部「页脚通关区」高度

    var $ = function (id) { return document.getElementById(id); };
    var ui = {
        screenTitle: $('screen-title'), screenLoad: $('screen-load'), screenGame: $('screen-game'),
        inUrl: $('in-url'), btnGo: $('btn-go'), loadText: $('load-text'), loadErr: $('load-err'), btnDemo: $('btn-demo'),
        cv: $('cv'), hudScore: $('hud-score'), hudDestroy: $('hud-destroy'),
        hudEnemy: $('hud-enemy'), hudDepth: $('hud-depth'), hpfill: $('hpfill'),
        toast: $('center-toast'), panelEnd: $('panel-end'), endTitle: $('end-title'),
        endDetail: $('end-detail'), btnAgain: $('btn-again'), btnQuit: $('btn-quit')
    };
    var ctx = ui.cv.getContext('2d');

    /* 游戏运行时状态（G = game） */
    var G = {
        state: 'title',          // title | load | play | end
        lv: null,                // 关卡对象 {canvas, W, H, mask, totalInk, enemies, title}
        url: '',                 // 本局网址
        player: null,            // 玩家
        bullets: [],             // 存活子弹
        enemies: [],             // 存活敌人
        parts: [],               // 粒子（墨水飞溅）
        camY: 0,                 // 摄像机纵向位置
        scale: 2,                // 像素放大倍数
        viewH: 400,              // 视口逻辑高度
        score: 0, destroyed: 0, kills: 0,
        startTime: 0, milestone: 0,
        fireCd: 0, shake: 0,     // 射击冷却 / 屏幕震动
        toastT: 0
    };

    /* 输入状态 */
    var input = { left: false, right: false, jump: false, fire: false };
    var keys = {};

    /* 调试钩子：console 里可用 __DBG 查看实时状态（不影响游戏） */
    window.__DBG = G;
    window.__IN = input;

    /* ============================================================
     * 二、极简音效：WebAudio 现场合成，零音频文件
     * ============================================================ */
    var audio = null;
    function beep(freq, dur, type, vol) {
        try {
            if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
            var o = audio.createOscillator(), g = audio.createGain();
            o.type = type || 'square'; o.frequency.value = freq;
            g.gain.setValueAtTime(vol || 0.08, audio.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + dur);
            o.connect(g); g.connect(audio.destination);
            o.start(); o.stop(audio.currentTime + dur);
        } catch (e) { /* 无声环境忽略 */ }
    }
    var sfx = {
        shoot: function () { beep(760, 0.06, 'square', 0.05); },
        crumble: function () { beep(160, 0.08, 'sawtooth', 0.06); },
        hurt: function () { beep(140, 0.18, 'sawtooth', 0.12); },
        kill: function () { beep(520, 0.1, 'triangle', 0.1); },
        win: function () { [523, 659, 784, 1047].forEach(function (f, i) { setTimeout(function () { beep(f, 0.18, 'triangle', 0.12); }, i * 130); }); },
        lose: function () { [330, 247, 165].forEach(function (f, i) { setTimeout(function () { beep(f, 0.25, 'sawtooth', 0.1); }, i * 160); }); }
    };

    /* ============================================================
     * 三、实体：玩家 / 敌人 / 子弹 / 粒子
     * ============================================================ */

    /** 玩家：一个拿枪的像素小人 */
    function makePlayer(x, y) {
        return { x: x, y: y, w: 8, h: 13, vx: 0, vy: 0, dir: 1, hp: MAX_HP, onGround: false, iframe: 0, animT: 0 };
    }

    /** 敌人「链接虫」：从网页的 <a> 链接里孵出来的小虫 */
    function makeEnemy(x, y) {
        return { x: x, y: y, w: 9, h: 7, vx: (Math.random() < 0.5 ? -0.5 : 0.5), vy: 0, hp: 2, hurtT: 0 };
    }

    /** 碰撞：检测实体矩形是否踩到实心掩码（只采样边缘关键点，性能好） */
    function hitMask(px, py, w, h) {
        var lv = G.lv;
        var xs = [px + 1, px + w / 2, px + w - 1];
        var ys = [py, py + h / 2, py + h - 1];
        for (var i = 0; i < ys.length; i++) {
            for (var j = 0; j < xs.length; j++) {
                if (window.DLevel.solidAt(lv, Math.floor(xs[j]), Math.floor(ys[i]))) return true;
            }
        }
        return false;
    }

    /** 通用位移 + 碰撞解算：分轴移动，撞到就贴住 */
    function moveBody(b) {
        /* X 轴 */
        b.x += b.vx;
        if (hitMask(b.x, b.y, b.w, b.h)) {
            b.x -= b.vx; b.vx = 0; b.blocked = true;
        } else b.blocked = false;
        /* Y 轴 */
        b.y += b.vy;
        b.onGround = false;
        if (hitMask(b.x, b.y, b.w, b.h)) {
            if (b.vy > 0) b.onGround = true;
            /* 一格一格回退，直到离开实心区（避免高速穿墙）。
               上限 40 步兜底：万一出生点卡进厚墙里也不会死循环 */
            var step = b.vy > 0 ? -1 : 1;
            var guard = 0;
            while (hitMask(b.x, b.y, b.w, b.h) && guard++ < 40) b.y += step;
            b.vy = 0;
        }
    }

    /** 溅射墨水粒子：破坏时飞出的小方块 */
    function spawnParts(cx, cy, n, color) {
        for (var i = 0; i < n; i++) {
            G.parts.push({
                x: cx, y: cy,
                vx: (Math.random() - 0.5) * 3.4,
                vy: -Math.random() * 3 - 0.5,
                life: 24 + Math.random() * 18,
                c: color || (Math.random() < 0.7 ? '#24292f' : (Math.random() < 0.5 ? '#1a5fb4' : '#6a737d'))
            });
        }
        if (G.parts.length > 400) G.parts.splice(0, G.parts.length - 400);
    }

    /* ============================================================
     * 四、破坏统计与里程碑
     * ============================================================ */
    function addDestroyed(n) {
        G.destroyed += n;
        G.score += Math.round(n / 10);
        var pct = G.destroyed / G.lv.totalInk;
        /* 每 25% 弹一次里程碑，最多庆祝三次 */
        var stage = Math.floor(pct * 4);
        if (stage > G.milestone && stage <= 3 && G.state === 'play') {
            G.milestone = stage;
            showToast('粉碎进度 ' + (stage * 25) + '% ！');
            sfx.kill();
        }
    }

    function showToast(msg) {
        ui.toast.textContent = msg;
        ui.toast.style.display = 'block';
        G.toastT = 100;      // 约 1.6 秒后由主循环隐藏
    }

    /* ============================================================
     * 五、开火：子弹命中 → 抹掉圆形像素
     * ============================================================ */
    function fire() {
        if (G.fireCd > 0) return;
        G.fireCd = 9;
        var p = G.player;
        G.bullets.push({
            x: p.x + p.w / 2 + p.dir * 7, y: p.y + 5,
            vx: p.dir * BULLET_SPD, vy: 0
        });
        sfx.shoot();
    }

    function stepBullets() {
        var lv = G.lv;
        for (var i = G.bullets.length - 1; i >= 0; i--) {
            var b = G.bullets[i];
            var steps = 3;                                  // 分三小步推进，防高速穿墙
            var dead = false;
            for (var s = 0; s < steps && !dead; s++) {
                b.x += b.vx / steps; b.y += b.vy / steps;
                if (b.x < 0 || b.x >= lv.W || b.y < 0 || b.y >= lv.H) { dead = true; break; }
                /* 打到地形：破坏像素 */
                if (window.DLevel.solidAt(lv, Math.floor(b.x), Math.floor(b.y))) {
                    var removed = window.DLevel.erase(lv, b.x, b.y, BULLET_R);
                    addDestroyed(removed);
                    spawnParts(b.x, b.y, 7);
                    if (removed > 6) sfx.crumble();
                    G.shake = 3;
                    dead = true;
                }
                /* 打到敌人 */
                for (var e = 0; e < G.enemies.length; e++) {
                    var en = G.enemies[e];
                    if (b.x > en.x - 2 && b.x < en.x + en.w + 2 && b.y > en.y - 2 && b.y < en.y + en.h + 2) {
                        en.hp--; en.hurtT = 6;
                        spawnParts(b.x, b.y, 5, '#e94560');
                        if (en.hp <= 0) {
                            G.enemies.splice(e, 1); e--;
                            G.score += 100; G.kills++;
                            spawnParts(en.x + en.w / 2, en.y + en.h / 2, 16, '#e94560');
                            sfx.kill();
                        }
                        dead = true; break;
                    }
                }
            }
            if (dead) G.bullets.splice(i, 1);
        }
    }

    /* ============================================================
     * 六、敌人 AI：沿地表巡逻，碰到玩家就咬
     * ============================================================ */
    function stepEnemies() {
        var p = G.player;
        for (var i = 0; i < G.enemies.length; i++) {
            var en = G.enemies[i];
            if (en.hurtT > 0) en.hurtT--;
            en.vy = Math.min(en.vy + GRAVITY, 7);
            en.vx = en.vx || 0.5;
            moveBody(en);
            /* 撞墙或走到悬崖边 → 掉头 */
            if (en.blocked) en.vx = -en.vx;
            else if (en.onGround) {
                var aheadX = en.vx > 0 ? en.x + en.w + 1 : en.x - 1;
                if (!window.DLevel.solidAt(G.lv, Math.floor(aheadX), Math.floor(en.y + en.h + 2))) en.vx = -en.vx;
            }
            /* 掉出关卡底部则移除 */
            if (en.y > G.lv.H + 40) { G.enemies.splice(i, 1); i--; continue; }
            /* 咬到玩家 */
            if (p.iframe <= 0 &&
                p.x < en.x + en.w && p.x + p.w > en.x &&
                p.y < en.y + en.h && p.y + p.h > en.y) {
                damagePlayer(12, en.x < p.x ? 1 : -1);
            }
        }
    }

    function damagePlayer(n, knockDir) {
        var p = G.player;
        p.hp -= n; p.iframe = 50;
        p.vx = 0; p.vy = -3;
        p.x += knockDir * 6;
        G.shake = 6;
        ui.hpfill.style.width = Math.max(0, p.hp / MAX_HP * 100) + '%';
        sfx.hurt();
        if (p.hp <= 0) endGame(false);
    }

    /* ============================================================
     * 七、玩家控制
     * ============================================================ */
    function stepPlayer() {
        var p = G.player;
        if (p.iframe > 0) p.iframe--;

        /* 水平输入 */
        var mv = 0;
        if (input.left) mv -= 1;
        if (input.right) mv += 1;
        if (mv !== 0) p.dir = mv;
        p.vx = mv * MOVE_SPD;
        p.vy = Math.min(p.vy + GRAVITY, 8);
        if (input.jump && p.onGround) { p.vy = JUMP_V; input.jump = false; beep(300, 0.05, 'sine', 0.04); }
        moveBody(p);
        p.animT += Math.abs(p.vx);

        /* 防止顶出世界 & 卡进墙的兜底 */
        if (p.x < 2) p.x = 2;
        if (p.x > G.lv.W - p.w - 2) p.x = G.lv.W - p.w - 2;

        /* 冲到底部页脚区 → 通关 */
        if (p.y + p.h >= G.lv.H - FOOTEER_H) { endGame(true); return; }

        /* 射击 */
        if (G.fireCd > 0) G.fireCd--;
        if (input.fire) fire();
    }

    /* ============================================================
     * 八、渲染
     * ============================================================ */
    function resize() {
        var w = window.innerWidth, h = window.innerHeight;
        /* 选整数倍缩放，保证像素棱角 */
        G.scale = Math.max(2, Math.round(w / VIEW_W));
        G.viewH = Math.ceil(h / G.scale);
        ui.cv.width = VIEW_W * G.scale;
        ui.cv.height = G.viewH * G.scale;
        ui.cv.style.width = w + 'px';
        ui.cv.style.height = h + 'px';
        ctx.imageSmoothingEnabled = false;
    }
    window.addEventListener('resize', resize, { passive: true });

    function render() {
        var lv = G.lv, p = G.player;
        /* 摄像机跟随：玩家保持在屏幕 55% 高度附近 */
        var targetCam = Math.max(0, Math.min(lv.H - G.viewH, p.y - G.viewH * 0.55));
        G.camY += (targetCam - G.camY) * 0.18;
        var cam = Math.round(G.camY);

        /* 屏幕震动 */
        var sx = 0, sy = 0;
        if (G.shake > 0) { G.shake--; sx = (Math.random() - 0.5) * G.shake; sy = (Math.random() - 0.5) * G.shake; }

        ctx.setTransform(G.scale, 0, 0, G.scale, sx * G.scale, sy * G.scale);
        ctx.imageSmoothingEnabled = false;

        /* 天幕（关卡外的虚空） */
        ctx.fillStyle = '#05070c';
        ctx.fillRect(-2, -2, VIEW_W + 4, G.viewH + 4);

        /* 关卡像素画：只画视口内的那一片 */
        var vh = Math.min(G.viewH, lv.H);
        ctx.drawImage(lv.canvas, 0, cam, VIEW_W, vh, 0, 0, VIEW_W, vh);

        /* 页脚通关区：绿色虚线 + 提示 */
        var footY = lv.H - FOOTEER_H - cam;
        if (footY < G.viewH + 20 && footY > -20) {
            ctx.strokeStyle = 'rgba(61,220,132,0.9)';
            ctx.setLineDash([4, 3]);
            ctx.strokeRect(0.5, footY, VIEW_W - 1, FOOTEER_H);
            ctx.setLineDash([]);
            ctx.fillStyle = 'rgba(61,220,132,0.9)';
            ctx.font = 'bold 10px monospace';
            ctx.fillText('▼ 页脚通关区 · 冲进来！', 8, footY + 14);
        }

        /* 敌人：红色小虫（受击闪白） */
        for (var i = 0; i < G.enemies.length; i++) {
            var en = G.enemies[i];
            var ey = en.y - cam;
            if (ey < -10 || ey > G.viewH + 10) continue;
            ctx.fillStyle = en.hurtT > 0 ? '#ffffff' : '#e94560';
            ctx.fillRect(en.x, ey, en.w, en.h - 2);
            ctx.fillStyle = en.hurtT > 0 ? '#ffffff' : '#b03050';
            /* 三条小短腿，随时间摆动 */
            var leg = Math.floor(Date.now() / 120 + i) % 2 ? 1 : 0;
            ctx.fillRect(en.x + 1, ey + en.h - 2, 2, 2 + leg);
            ctx.fillRect(en.x + en.w / 2 - 1, ey + en.h - 2, 2, 2);
            ctx.fillRect(en.x + en.w - 3, ey + en.h - 2, 2, 2 + (1 - leg));
            /* 眼睛 */
            ctx.fillStyle = '#fff';
            ctx.fillRect(en.x + (en.vx > 0 ? en.w - 4 : 2), ey + 2, 2, 2);
        }

        /* 子弹：亮黄色小方块 */
        ctx.fillStyle = '#ffd56b';
        for (var b = 0; b < G.bullets.length; b++) {
            ctx.fillRect(G.bullets[b].x - 1, G.bullets[b].y - 1, 3, 2);
        }

        /* 粒子 */
        for (var pi = 0; pi < G.parts.length; pi++) {
            var pt = G.parts[pi];
            ctx.globalAlpha = Math.min(1, pt.life / 20);
            ctx.fillStyle = pt.c;
            ctx.fillRect(pt.x, pt.y - cam, 2, 2);
        }
        ctx.globalAlpha = 1;

        /* 玩家：像素小人（无敌帧闪烁）。
           白色描边打底，保证在深浅不一的网页内容上都看得清 */
        var px = p.x, py = p.y - cam;
        if (!(p.iframe > 0 && Math.floor(p.iframe / 4) % 2 === 0)) {
            ctx.fillStyle = '#ffffff';                       // 描边层（大一圈）
            ctx.fillRect(px - 1, py - 1, 10, 15);
            ctx.fillStyle = '#1c2540';                       // 身体
            ctx.fillRect(px + 1, py + 4, 6, 8);
            ctx.fillStyle = '#f0c75e';                       // 头
            ctx.fillRect(px + 1, py, 6, 4);
            ctx.fillStyle = '#e0364a';                       // 帽子（红，更醒目）
            ctx.fillRect(px, py - 2, 8, 3);
            ctx.fillStyle = '#1c2540';                       // 眼睛
            ctx.fillRect(px + (p.dir > 0 ? 5 : 2), py + 1, 1, 1);
            ctx.fillStyle = '#3ddc84';                       // 枪
            ctx.fillRect(px + (p.dir > 0 ? p.w : -4), py + 5, 4, 2);
            /* 走路摆腿 */
            if (p.onGround && Math.abs(p.vx) > 0.1) {
                var legPhase = Math.floor(p.animT / 6) % 2;
                ctx.fillStyle = '#1c2540';
                ctx.fillRect(px + 1 + legPhase, py + 12, 2, 2);
                ctx.fillRect(px + 5 - legPhase, py + 12, 2, 2);
            } else {
                ctx.fillStyle = '#1c2540';
                ctx.fillRect(px + 1, py + 12, 2, 2);
                ctx.fillRect(px + 5, py + 12, 2, 2);
            }
        }
    }

    /* ============================================================
     * 九、主循环（固定步长逻辑 + rAF 渲染）
     * ============================================================ */
    var lastT = 0, acc = 0, STEP = 1000 / 60;
    function loop(t) {
        requestAnimationFrame(loop);
        if (G.state !== 'play') return;
        acc += Math.min(100, t - lastT); lastT = t;
        while (acc >= STEP) {
            acc -= STEP;
            stepPlayer();
            if (G.state !== 'play') break;                   // 本步内可能已结束
            stepEnemies();
            stepBullets();
            /* 粒子 */
            for (var i = G.parts.length - 1; i >= 0; i--) {
                var pt = G.parts[i];
                pt.vy += 0.16; pt.x += pt.vx; pt.y += pt.vy; pt.life--;
                if (pt.life <= 0) G.parts.splice(i, 1);
            }
            if (G.toastT > 0) { G.toastT--; if (G.toastT === 0) ui.toast.style.display = 'none'; }
        }
        updateHUD();
        render();
    }

    function updateHUD() {
        ui.hudScore.textContent = G.score;
        var pct = Math.min(100, Math.round(G.destroyed / G.lv.totalInk * 100));
        ui.hudDestroy.textContent = pct + '%';
        ui.hudEnemy.textContent = G.enemies.length;
        ui.hudDepth.textContent = '深度 ' + Math.max(0, Math.min(100, Math.round(G.player.y / (G.lv.H - FOOTEER_H) * 100))) + '%';
    }

    /* ============================================================
     * 十、开局与结算
     * ============================================================ */
    function startPlay(lv) {
        G.lv = lv; G.state = 'play';
        G.bullets = []; G.enemies = []; G.parts = [];
        G.score = 0; G.destroyed = 0; G.kills = 0;
        G.milestone = 0; G.camY = 0; G.fireCd = 0; G.shake = 0;
        G.startTime = Date.now();
        ui.hpfill.style.width = '100%';
        ui.panelEnd.classList.remove('on');

        /* 出生点：关卡生成时已在版心中部（x=240）清出竖井并铺好
           绿色出生平台（y=134），这里直接落到平台上，稳定可靠 */
        var sx = Math.floor(VIEW_W / 2) - 4;                 // 236，角色宽8居中
        var sy = 116;                                        // 脚底 129，落在平台 134 上方
        G.player = makePlayer(sx, sy);

        /* 敌人出生：跳过离玩家太近的（开局别被咬） */
        for (var i = 0; i < lv.enemies.length; i++) {
            var e = lv.enemies[i];
            if (e.y > sy + 120) G.enemies.push(makeEnemy(e.x, e.y - 10));
        }

        resize();
        ui.screenTitle.style.display = 'none';
        ui.screenLoad.style.display = 'none';
        ui.screenGame.style.display = 'flex';
        showToast('目标：' + lv.title);
        lastT = performance.now(); acc = 0;
    }

    function endGame(win) {
        if (G.state !== 'play') return;
        G.state = 'end';
        var secs = Math.round((Date.now() - G.startTime) / 1000);
        var pct = Math.min(100, Math.round(G.destroyed / G.lv.totalInk * 100));
        ui.endTitle.textContent = win ? '★ 网页粉碎完毕！' : '你被网页打败了…';
        ui.endTitle.className = win ? 'win' : 'lose';
        ui.endDetail.innerHTML =
            '目标页面：<b>' + G.lv.title + '</b><br>' +
            '破坏率 <b>' + pct + '%</b> · 击杀链接虫 <b>' + G.kills + '</b> 只<br>' +
            '总得分 <b>' + G.score + '</b> · 用时 <b>' + secs + '</b> 秒';
        ui.panelEnd.classList.add('on');
        if (win) sfx.win(); else sfx.lose();
    }

    /* ============================================================
     * 十一、加载流程：网址 → HTML → 关卡
     * ============================================================ */
    async function loadAndStart(rawUrl) {
        var url = window.DProxy.normalizeUrl(rawUrl);
        if (!url) { ui.inUrl.focus(); return; }
        G.url = url;
        G.state = 'load';
        ui.screenTitle.style.display = 'none';
        ui.screenGame.style.display = 'none';
        ui.screenLoad.style.display = 'flex';
        ui.loadErr.style.display = 'none';
        ui.btnDemo.style.display = 'none';

        try {
            var html, via = '';
            if (url === 'demo') {
                html = null;
            } else {
                ui.loadText.textContent = '正在通过跨域代理抓取 ' + url + ' …';
                var r = await window.DProxy.fetchPageHtml(url);
                html = r.html;
            }
            var lv = html === null
                ? await window.DLevel.buildDemo(function (s) { ui.loadText.textContent = s; })
                : await window.DLevel.build(html, url, function (s) { ui.loadText.textContent = s; });
            startPlay(lv);
        } catch (e) {
            /* 失败：给原因 + 演示关卡出口 */
            G.state = 'title';
            ui.screenLoad.style.display = 'flex';
            ui.screenTitle.style.display = 'none';
            ui.loadErr.textContent = '✗ ' + (e.message || '抓取失败');
            ui.loadErr.style.display = 'block';
            ui.btnDemo.style.display = 'inline-block';
        }
    }

    /* ============================================================
     * 十二、输入绑定
     * ============================================================ */
    function bindInput() {
        /* 桌面键盘 */
        window.addEventListener('keydown', function (e) {
            keys[e.code] = true;
            if (G.state !== 'play') return;
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') input.left = true;
            if (e.code === 'ArrowRight' || e.code === 'KeyD') input.right = true;
            if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') { input.jump = true; e.preventDefault(); }
            if (e.code === 'KeyJ' || e.code === 'KeyX') input.fire = true;
        });
        window.addEventListener('keyup', function (e) {
            keys[e.code] = false;
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') input.left = false;
            if (e.code === 'ArrowRight' || e.code === 'KeyD') input.right = false;
            if (e.code === 'KeyJ' || e.code === 'KeyX') input.fire = false;
        });

        /* 鼠标：点画布开火，位置决定朝向 */
        ui.cv.addEventListener('mousedown', function (e) {
            if (G.state !== 'play') return;
            var rect = ui.cv.getBoundingClientRect();
            var mx = (e.clientX - rect.left) / G.scale;
            G.player.dir = mx > G.player.x ? 1 : -1;
            input.fire = true;
            setTimeout(function () { input.fire = false; }, 120);
        });

        /* 移动端虚拟按键（仅触屏设备显示） */
        if ('ontouchstart' in window) {
            var mk = function (label, x, y, on, off) {
                var b = document.createElement('div');
                b.textContent = label;
                b.style.cssText = 'position:fixed;bottom:' + y + 'px;' + x + ':18px;width:58px;height:58px;'
                    + 'background:rgba(20,27,40,.7);border:1px solid #26324a;border-radius:50%;color:#e6edf3;'
                    + 'display:flex;align-items:center;justify-content:center;font-size:22px;z-index:25;'
                    + 'user-select:none;-webkit-user-select:none;touch-action:none;';
                b.addEventListener('touchstart', function (e) { e.preventDefault(); on(); }, { passive: false });
                b.addEventListener('touchend', function (e) { e.preventDefault(); off(); }, { passive: false });
                document.body.appendChild(b);
            };
            mk('◀', 'left', 24, function () { input.left = true; }, function () { input.left = false; });
            mk('▶', 'left', 96, function () { input.right = true; }, function () { input.right = false; });
            mk('⤴', 'right', 24, function () { input.jump = true; }, function () { input.jump = false; });
            mk('🔫', 'right', 96, function () { input.fire = true; }, function () { input.fire = false; });
        }
    }

    function bindUI() {
        /* 示例网址快捷填入 */
        document.querySelectorAll('.samples span').forEach(function (s) {
            s.addEventListener('click', function () {
                ui.inUrl.value = s.dataset.url;
                loadAndStart(s.dataset.url);
            });
        });
        ui.btnGo.addEventListener('click', function () { loadAndStart(ui.inUrl.value); });
        ui.inUrl.addEventListener('keydown', function (e) { if (e.key === 'Enter') loadAndStart(ui.inUrl.value); });
        ui.btnDemo.addEventListener('click', function () { loadAndStart('demo'); });
        /* 标题页的内置关卡主按钮 */
        var demoMain = document.getElementById('btn-demo-main');
        if (demoMain) demoMain.addEventListener('click', function () { loadAndStart('demo'); });

        /* 自定义代理：保存到 localStorage，proxy.js 会自动插到链首 */
        var inProxy = document.getElementById('in-proxy');
        var proxyHint = document.getElementById('proxy-hint');
        try { inProxy.value = localStorage.getItem('destroy_custom_proxy') || ''; } catch (e) { }
        document.getElementById('btn-proxy').addEventListener('click', function () {
            var v = inProxy.value.trim();
            try {
                if (v && v.indexOf('{url}') === -1) {
                    proxyHint.textContent = '需包含 {url} 占位符';
                    setTimeout(function () { proxyHint.textContent = ''; }, 2500);
                    return;
                }
                localStorage.setItem('destroy_custom_proxy', v);
                proxyHint.textContent = v ? '✓ 已保存，优先使用' : '✓ 已清除';
                setTimeout(function () { proxyHint.textContent = ''; }, 2500);
            } catch (e) { /* 隐私模式下忽略 */ }
        });

        ui.btnQuit.addEventListener('click', function () {
            G.state = 'title';
            ui.screenGame.style.display = 'none';
            ui.panelEnd.classList.remove('on');
            ui.screenTitle.style.display = 'flex';
        });
        ui.btnAgain.addEventListener('click', function () { loadAndStart(G.url || 'demo'); });
    }

    /* ---------- 启动 ---------- */
    bindUI();
    bindInput();
    resize();
    requestAnimationFrame(loop);
})();
