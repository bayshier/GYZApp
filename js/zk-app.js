/* ============================================================
   自考 080901 学习系统 — 路由 / 仪表盘 / 笔记 / 练习
   复用 quiz.css 组件体系（浅色知识库主题）
   ============================================================ */
(function () {
    'use strict';

    var D = window.ZK_DATA || { courses: [], notes: [], bank: [], examDates: {} };
    var COURSES = D.courses.map(function (c, i) {
        return { idx: i, code: c[0], name: c[1], type: c[2], status: c[3], score: c[4], date: c[5], term: c[6], note: c[7] };
    });
    var NOTES = D.notes || [];
    var BANK = D.bank || [];
    var MEMO = D.memo || [];
    var EXAM_DATES = D.examDates || {};

    function byCode(code) { return COURSES.filter(function (c) { return c.code === code; })[0]; }
    function notesOf(code) { return NOTES.map(function (n, i) { n.i = i; return n; }).filter(function (n) { return n.course === code; }); }
    function bankOf(code) { return BANK.map(function (q, i) { q.id = i; return q; }).filter(function (q) { return q.course === code; }); }
    function memoOf(code) { return MEMO.map(function (m, i) { m.i = i; return m; }).filter(function (m) { return m.course === code; }); }

    /* ---------- localStorage ---------- */
    var KEY = 'zk-080901-v1';
    var store;
    try { store = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { store = {}; }
    store.done = store.done || {};
    store.wrong = store.wrong || {};
    store.passedOverride = store.passedOverride || {};
    store.memo = store.memo || {};   // { course: { 卡片下标: 1 } }
    function save() { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {} }

    function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

    var view = document.getElementById('zk-view');
    var cdTimer = null;

    /* ---------- 路由 ---------- */
    function route() {
        if (cdTimer) { clearInterval(cdTimer); cdTimer = null; }
        var parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
        if (parts[0] === 'course' && parts[1]) renderCourse(parts[1]);
        else if (parts[0] === 'read' && parts[1]) renderReader(+parts[1]);
        else if (parts[0] === 'practice' && parts[1]) renderPractice(parts[1]);
        else if (parts[0] === 'memo') renderMemo(parts[1] || '');
        else renderHome();
    }
    window.addEventListener('hashchange', route);

    /* ---------- 有效通过态（线上记录 + 本地标记） ---------- */
    function isPassed(c) { return c.status === 'passed' || store.passedOverride[c.code]; }
    function passedCount() { return COURSES.filter(isPassed).length; }

    /* ============================================================
       首页：倒计时 + 概览 + 按考期分组
       ============================================================ */
    var STATUS_TXT = { passed: '已通过', planned: '本期报考', todo: '待考', practice: '实践', thesis: '论文' };

    function renderHome() {
        var nTotal = COURSES.length;
        var nPassed = passedCount();
        var remain = nTotal - nPassed;
        var nextDate = EXAM_DATES['2026.10'] || '2026-10-24';
        var oct = COURSES.filter(function (c) { return !isPassed(c) && c.term === '2026.10'; });

        var html = '<div class="zk-countdown" id="zk-cd">'
            + '<div><div class="zkc-label">⏳ 距 2026.10 考期还有</div>'
            + '<div class="zkc-days" id="zk-cd-days">--<i>天</i></div>'
            + '<div class="zkc-date">' + nextDate.replace(/-/g, '.') + ' 开考（周六首考）</div></div>'
            + '<div class="zkc-next">本期报考 <b>' + oct.length + '</b> 门（时段已排，无冲突）<br>'
            + oct.map(function (c) { return c.code + ' ' + c.name; }).join('<br>')
            + '</div>'
            + '</div>'
            + '<div class="zk-overview">'
            + '<div class="zko ok"><b>' + nPassed + '</b><i>已通过</i></div>'
            + '<div class="zko"><b>' + remain + '</b><i>待完成</i></div>'
            + '<div class="zko"><b>' + Math.round(nPassed / nTotal * 100) + '%</b><i>总进度</i></div>'
            + '<div class="zko"><b>' + BANK.length + '</b><i>真题入库</i></div>'
            + '<div class="zko gold"><b>' + MEMO.length + '</b><i>速记卡片</i></div>'
            + '</div>';

        /* 考试安排（202610 真实开考表，来自广东省自学考试管理系统） */
        if (D.schedule2610 && D.schedule2610.sessions) {
            html += '<div class="zk-sched"><div class="zk-sched-head"><h3>🗓 2026.10 考试安排</h3>'
                + '<span>' + esc(D.schedule2610.source || '') + '</span></div>';
            D.schedule2610.sessions.forEach(function (s) {
                html += '<div class="zk-sess' + (s.off ? ' off' : '') + '"><div class="zk-sess-time"><b>' + esc(s.d) + '</b>'
                    + '<i>' + esc(s.w || '') + ' ' + esc(s.t) + '</i>'
                    + (s.off ? '<em>🚫 本人无法应考</em>' : '') + '</div>'
                    + '<div class="zk-sess-items">';
                s.items.forEach(function (it) {
                    var c = byCode(it.c);
                    var passed = c && isPassed(c);
                    var cls = it.pick ? ' pick' : (it.defer ? ' defer' : (it.conflict ? ' conflict' : (passed ? ' done' : (s.off ? ' dim' : ''))));
                    html += '<span class="zk-sitem' + cls + '">'
                        + (it.pick ? '✓ 报考 ' : it.defer ? '⏳ 顺延 ' : it.conflict ? '⚠ 冲突 ' : '')
                        + esc(it.c) + ' ' + esc(c ? c.name : '')
                        + (passed ? '（已过）' : it.conflict ? '（与15040同时段）' : it.defer ? '（仅此时段开考）' : '')
                        + '</span>';
                });
                html += '</div></div>';
            });
            html += '<div class="zk-sched-note">📌 十月报 3 门：02324 离散数学（周六上午）+ 15040 习思想（周六下午）+ 13180 操作系统（周日上午），零冲突。<br>'
                + '⏳ 13005 软件工程仅开考于周日下午、本人无法应考 → 顺延 2027.04；13003 与 15040 同时段冲突、13011 本期不开考，均顺延。<br>'
                + '⚠ 2027.04 候选已积 5 门（13003/13005/13011/13015/03344），超出单期 4 门上限——待 2027.04 开考表公布后再按时段裁一门到 2027.10。</div></div>';
        }

        var terms = [['已通过', ''], ['2026.10', '本期主攻'], ['2027.04', '原理+数学'], ['2027.10', '数学+英语+实践'], ['2028.04', '实践收尾'], ['最后', '毕业环节']];
        terms.forEach(function (tp) {
            var key = tp[0];
            var list = COURSES.filter(function (c) { return key === '已通过' ? isPassed(c) : (!isPassed(c) && c.term === key); });
            if (!list.length) return;
            var dateTxt = EXAM_DATES[key] ? '预计 ' + EXAM_DATES[key].replace(/-/g, '.') : (key === '已通过' ? nPassed + ' 门在手' : '');
            html += '<div class="zk-term"><div class="zk-term-head"><h3>'
                + (key === '已通过' ? '✅ ' : key === '最后' ? '🎓 ' : '📅 ') + esc(key) + '</h3><span>' + esc(tp[1]) + '</span>'
                + '<span class="zk-term-date">' + esc(dateTxt) + '</span></div><div class="zk-courses">';
            list.forEach(function (c) {
                html += '<div class="zk-course" data-code="' + c.code + '">'
                    + '<span class="zkc-code">' + c.code + '</span>'
                    + '<div class="zkc-info"><div class="zkc-name">' + esc(c.name) + '</div>'
                    + '<div class="zkc-sub">' + esc(c.type) + (c.note ? ' · ' + esc(c.note) : '') + '</div></div>'
                    + (isPassed(c) ? '<span class="zkc-score">' + (c.score || store.passedOverride[c.code] || '✓') + '</span>' : '')
                    + '<span class="zkc-status st-' + (isPassed(c) ? 'passed' : c.status) + '">' + (isPassed(c) ? '已通过' : STATUS_TXT[c.status]) + '</span>'
                    + '</div>';
            });
            html += '</div></div>';
        });

        html += '<div class="zk-mini-note">💡 考前冲刺：每门课都整理了「高频考点速记卡」（⚡ 课程页进入，翻卡背诵、标记会/不会）；碎片时间优先刷 3 星必背卡。数据说明：通过状态按成绩单预置，考后可在课程页标记（本地保存）。</div>';
        view.innerHTML = html;

        document.querySelectorAll('.zk-course').forEach(function (el) {
            el.addEventListener('click', function () { location.hash = '#/course/' + el.dataset.code; });
        });
        startCountdown(nextDate);
    }

    function startCountdown(dateStr) {
        var el = document.getElementById('zk-cd-days');
        if (!el) return;
        function tick() {
            var diff = new Date(dateStr + 'T09:00:00') - Date.now();
            if (diff < 0) diff = 0;
            var days = Math.floor(diff / 86400000);
            var hrs = Math.floor(diff % 86400000 / 3600000);
            el.innerHTML = days + '<i>天</i> ' + (hrs < 10 ? '0' : '') + hrs + '<i>时</i>';
        }
        tick();
        cdTimer = setInterval(tick, 60000);
    }

    /* ============================================================
       课程详情
       ============================================================ */
    function renderCourse(code) {
        var c = byCode(code);
        if (!c) { location.hash = '#/'; return; }
        var passed = isPassed(c);
        var notes = notesOf(code);
        var qs = bankOf(code);
        var memo = memoOf(code);

        var html = '<div class="q-topbar"><a class="btn ghost" href="#/">← 返回</a>'
            + '<span class="q-meta">课程详情</span><span class="q-progress-text">' + esc(c.code) + '</span></div>'
            + '<div class="zk-course-head">'
            + '<div class="zkc-title-row"><h2>' + esc(c.name) + '</h2>'
            + '<span class="zkc-status st-' + (passed ? 'passed' : c.status) + '">' + (passed ? '已通过' : STATUS_TXT[c.status]) + '</span></div>'
            + '<div class="zkc-meta">'
            + '<span>类型 <b>' + esc(c.type) + '</b></span>'
            + (passed ? '<span>成绩 <b>' + esc(c.score || store.passedOverride[c.code]) + '</b></span><span>通过 <b>' + esc(c.date || '本期') + '</b></span>' : '<span>计划考期 <b>' + esc(c.term) + '</b></span>')
            + (c.note ? '<span>备注 <b>' + esc(c.note) + '</b></span>' : '')
            + '</div>'
            + '<div class="zk-course-actions">'
            + (memo.length ? '<a class="btn gold" href="#/memo/' + code + '">⚡ 高频速记（' + memo.length + ' 张）</a>' : '')
            + (qs.length ? '<a class="btn primary" href="#/practice/' + code + '">📝 真题练习（' + qs.length + ' 题）</a>' : '<span class="btn" style="opacity:.5;cursor:default">📝 真题收集中</span>')
            + (!passed
                ? '<button class="btn" id="zk-mark">✓ 标记已通过</button>'
                : (store.passedOverride[code]
                    ? '<span class="zk-mini-note" style="margin:0">本地标记 · </span><button class="btn ghost" id="zk-unmark">↩ 取消通过标记</button>'
                    : ''))
            + '</div></div>';

        if (notes.length) {
            html += '<div class="q-learn-cat"><h3>📖 学习资料（' + notes.length + '）</h3>';
            notes.forEach(function (n) {
                html += '<a class="q-doc-card" href="#/read/' + n.i + '">'
                    + '<div class="qd-main"><div class="qd-title">' + esc(n.title) + '</div>'
                    + '<div class="qd-meta">' + n.sections.length + ' 节 · ' + (n.chars / 10000).toFixed(1) + ' 万字</div></div>'
                    + '<span class="qd-arrow">→</span></a>';
            });
            html += '</div>';
        } else {
            html += '<div class="zk-mini-note">📦 该课程资料尚未收集——当前来源以开源笔记为主，建议先用官方教材 + 刷题 App 复习，后续有资料会自动入库。</div>';
        }
        view.innerHTML = html;

        var mark = document.getElementById('zk-mark');
        if (mark) {
            mark.addEventListener('click', function () {
                store.passedOverride[code] = prompt('输入成绩（可留空）') || '✓';
                save();
                renderCourse(code);
            });
        }
        var unmark = document.getElementById('zk-unmark');
        if (unmark) {
            unmark.addEventListener('click', function () {
                delete store.passedOverride[code];
                save();
                renderCourse(code);
            });
        }
    }

    /* ============================================================
       笔记阅读（复用 q-reader 样式）
       ============================================================ */
    function renderReader(idx) {
        var n = NOTES[idx];
        if (!n) { location.hash = '#/'; return; }
        var LIMIT = 80;
        var secs = n.sections.length > LIMIT ? n.sections.slice(0, LIMIT) : n.sections;
        var html = '<div class="q-topbar zk-reader-bar">'
            + '<a class="btn ghost" href="#/course/' + n.course + '">← 课程</a>'
            + '<select class="zk-toc-sel" id="zk-toc" aria-label="跳转章节">';
        secs.forEach(function (s, i) { html += '<option value="' + i + '">' + esc(s[0]) + '</option>'; });
        html += '</select>'
            + '<span class="q-progress-text">' + n.sections.length + ' 节</span></div>'
            + '<article class="q-reader"><h1>' + esc(n.title) + '</h1><div class="q-reader-body">';
        secs.forEach(function (s, i) {
            html += '<section class="q-sec" id="zsec-' + i + '"><h3>' + esc(s[0]) + '</h3>';
            s[1].split('\n').forEach(function (p) {
                if (p.trim()) html += '<p>' + esc(p) + '</p>';
            });
            html += '</section>';
        });
        html += '</div></article>';
        view.innerHTML = html;
        document.getElementById('zk-toc').addEventListener('change', function () {
            var el = document.getElementById('zsec-' + this.value);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        });
    }

    /* ============================================================
       真题练习（单题即时反馈 + 错题本）
       ============================================================ */
    function renderPractice(code) {
        var qs = bankOf(code);
        var c = byCode(code);
        if (!qs.length || !c) { location.hash = '#/course/' + code; return; }
        var i = 0, picks = {};

        function draw() {
            var q = qs[i];
            var pick = picks[q.id];
            var letters = ['A', 'B', 'C', 'D'];
            var html = '<div class="q-topbar"><a class="btn ghost" href="#/course/' + code + '">← 课程</a>'
                + '<span class="q-meta">' + esc(c.name) + ' · 真题练习</span>'
                + '<span class="q-progress-text">' + (i + 1) + ' / ' + qs.length + '</span></div>'
                + '<div class="q-progress"><i style="width:' + ((i + 1) / qs.length * 100) + '%"></i></div>'
                + '<article class="q-card">'
                + '<div class="q-stem"><b>' + (i + 1) + '.</b> ' + esc(q.q) + '</div><div class="q-options">';
            q.options.forEach(function (opt, j) {
                var L = letters[j];
                var cls = 'q-opt';
                if (pick) {
                    if (L === q.answer) cls += ' correct';
                    else if (L === pick) cls += ' wrong';
                }
                html += '<button class="' + cls + '" data-l="' + L + '"' + (pick ? ' disabled' : '') + '>'
                    + '<i>' + L + '</i><span>' + esc(opt) + '</span></button>';
            });
            html += '</div>';
            if (pick) {
                var right = pick === q.answer;
                html += '<div class="q-feedback ' + (right ? 'ok' : 'no') + '">'
                    + (right ? '✓ 正确' : '✗ 错误 · 答案 ' + q.answer) + ' · ' + esc(q.source || '') + '</div>';
            }
            html += '</article><div class="q-nav">'
                + '<button class="btn" id="zk-prev"' + (i === 0 ? ' disabled' : '') + '>← 上一题</button>'
                + '<span class="q-nav-jump"></span>'
                + '<button class="btn primary" id="zk-next">' + (i === qs.length - 1 ? '完成 ✓' : '下一题 →') + '</button></div>';
            view.innerHTML = html;

            view.querySelectorAll('.q-opt').forEach(function (b) {
                b.addEventListener('click', function () {
                    if (picks[q.id]) return;
                    var L = b.dataset.l;
                    picks[q.id] = L;
                    var ok = L === q.answer;
                    store.done[q.id] = { pick: L, right: ok };
                    if (ok) delete store.wrong[q.id]; else store.wrong[q.id] = 1;
                    save();
                    draw();
                });
            });
            document.getElementById('zk-prev').addEventListener('click', function () { if (i > 0) { i--; draw(); } });
            document.getElementById('zk-next').addEventListener('click', function () {
                if (i < qs.length - 1) { i++; draw(); } else location.hash = '#/course/' + code;
            });
        }
        draw();
    }

    /* ============================================================
       高频考点速记（问题+答案直出，关键词高亮）
       ============================================================ */
    var STAR_TXT = { 3: '★★★ 必背', 2: '★★ 常考', 1: '★ 了解' };
    var MEMO_KEYS = D.memoKeys || {};

    function regEsc(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
    function hlMemo(course, text) {
        var keys = (MEMO_KEYS[course] || []).slice().sort(function (a, b) { return b.length - a.length; });
        if (!keys.length) return esc(text);
        var re = new RegExp('(' + keys.map(regEsc).join('|') + ')', 'g');
        return esc(text).replace(re, '<i class="zm-k">$1</i>');
    }

    function renderMemo(code) {
        if (!code) { renderMemoHome(); return; }
        var c = byCode(code);
        var cards = memoOf(code);
        if (!c || !cards.length) { location.hash = '#/'; return; }
        var known = store.memo[code] = store.memo[code] || {};

        var filter = 'all';           // all | weak | s3
        var queue = [];               // 本轮卡片队列（下标）
        var pos = 0, roundKnown = 0, roundWeak = 0;

        function buildQueue() {
            queue = [];
            cards.forEach(function (m) {
                if (filter === 's3' && m.star !== 3) return;
                if (filter === 'weak' && known[m.i]) return;
                queue.push(m.i);
            });
            pos = 0; roundKnown = 0; roundWeak = 0;
        }

        function knownCount() { return cards.filter(function (m) { return known[m.i]; }).length; }

        function draw() {
            if (pos >= queue.length) { drawDone(); return; }
            var m = MEMO[queue[pos]];
            var knownTotal = knownCount();
            var html = '<div class="q-topbar"><a class="btn ghost" href="#/course/' + code + '">← 课程</a>'
                + '<span class="q-meta">' + esc(c.name) + ' · 高频速记</span>'
                + '<span class="q-progress-text">' + (pos + 1) + ' / ' + queue.length + ' · 已掌握 ' + knownTotal + '/' + cards.length + '</span></div>'
                + '<div class="zk-memo-filters">'
                + '<button class="zm-chip' + (filter === 'all' ? ' on' : '') + '" data-f="all">全部 ' + cards.length + '</button>'
                + '<button class="zm-chip' + (filter === 'weak' ? ' on' : '') + '" data-f="weak">只看未掌握 ' + (cards.length - knownTotal) + '</button>'
                + '<button class="zm-chip zm-s3' + (filter === 's3' ? ' on' : '') + '" data-f="s3">⭐ 必背 ' + cards.filter(function (x) { return x.star === 3; }).length + '</button>'
                + '</div>'
                + '<div class="q-progress"><i style="width:' + (queue.length ? (pos / queue.length * 100) : 0) + '%"></i></div>'
                + '<article class="zk-memo-card">'
                + '<div class="zm-tags"><span class="zm-star s' + m.star + '">' + STAR_TXT[m.star] + '</span><span class="zm-tag">' + esc(m.tag) + '</span></div>'
                + '<div class="zm-q">' + esc(m.front) + '</div>'
                + '<div class="zm-sep">答案</div>'
                + '<div class="zm-a">' + hlMemo(code, m.back) + '</div>'
                + '</article>'
                + '<div class="q-nav">'
                + '<button class="btn ghost" id="zk-memo-weak">😵 还不会</button>'
                + '<span class="q-nav-jump"></span>'
                + '<button class="btn primary" id="zk-memo-know">😊 会了，下一张</button>'
                + '<button class="btn" id="zk-memo-skip">跳过 →</button>'
                + '</div>';
            view.innerHTML = html;

            view.querySelectorAll('.zm-chip').forEach(function (b) {
                b.addEventListener('click', function () { filter = b.dataset.f; buildQueue(); draw(); });
            });
            document.getElementById('zk-memo-know').addEventListener('click', function () {
                known[queue[pos]] = 1; roundKnown++; save(); pos++; draw();
            });
            document.getElementById('zk-memo-weak').addEventListener('click', function () {
                delete known[queue[pos]]; roundWeak++; save(); pos++; draw();
            });
            document.getElementById('zk-memo-skip').addEventListener('click', function () { pos++; draw(); });
        }

        function drawDone() {
            var knownTotal = knownCount();
            var html = '<div class="q-topbar"><a class="btn ghost" href="#/course/' + code + '">← 课程</a>'
                + '<span class="q-meta">' + esc(c.name) + ' · 速记完成</span></div>'
                + '<article class="q-card" style="text-align:center">'
                + '<div style="font-size:44px">🎉</div>'
                + '<h3 style="margin:10px 0 6px">本轮完成</h3>'
                + '<p class="q-meta">本轮标记：会了 ' + roundKnown + ' 张 · 还不会 ' + roundWeak + ' 张</p>'
                + '<p class="q-meta">总掌握：<b>' + knownTotal + ' / ' + cards.length + '</b>（'
                + Math.round(knownTotal / cards.length * 100) + '%）</p>'
                + '<div class="zk-course-actions" style="justify-content:center;margin-top:16px">'
                + '<button class="btn primary" id="zk-memo-again">🔄 再来一轮（只看未掌握）</button>'
                + '<a class="btn" href="#/course/' + code + '">返回课程</a>'
                + '</div></article>';
            view.innerHTML = html;
            document.getElementById('zk-memo-again').addEventListener('click', function () {
                filter = 'weak'; buildQueue();
                if (!queue.length) filter = 'all', buildQueue();
                draw();
            });
        }

        buildQueue();
        if (!queue.length) { filter = 'all'; buildQueue(); }
        draw();
    }

    function renderMemoHome() {
        var html = '<div class="q-topbar"><a class="btn ghost" href="#/">← 返回</a>'
            + '<span class="q-meta">高频考点速记</span>'
            + '<span class="q-progress-text">' + MEMO.length + ' 张</span></div>'
            + '<div class="q-learn-cat"><h3>⚡ 选择课程开始背诵</h3>';
        COURSES.forEach(function (c) {
            if (isPassed(c)) return;
            var cards = memoOf(c.code);
            if (!cards.length) return;
            var kn = cards.filter(function (m) { return (store.memo[c.code] || {})[m.i]; }).length;
            html += '<a class="q-doc-card" href="#/memo/' + c.code + '">'
                + '<div class="qd-main"><div class="qd-title">' + esc(c.name) + '</div>'
                + '<div class="qd-meta">⚡ ' + cards.length + ' 张 · 已掌握 ' + kn + '</div></div>'
                + '<span class="qd-arrow">→</span></a>';
        });
        html += '</div>';
        view.innerHTML = html;
    }

    if (!COURSES.length) {
        view.innerHTML = '<div class="q-empty"><div class="icon">📦</div><p>数据加载失败</p></div>';
        return;
    }
    route();
})();
