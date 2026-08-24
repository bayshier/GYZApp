/* ============================================================
   证券从业考试学习系统 — 路由 / 学习 / 模拟考试 / 错题本
   纯 vanilla JS · localStorage 持久化
   ============================================================ */
(function () {
    'use strict';

    /* ---------- 题库索引 ---------- */
    // QUIZ_BANK 条目: [subject, source, q, [A,B,C,D], answer, explain]
    var BANK = (window.QUIZ_BANK || []).map(function (row, i) {
        return {
            id: i,
            subject: row[0],   // 'law' | 'basics'
            source: row[1],
            q: row[2],
            options: row[3],
            answer: row[4],    // 'A'-'D'
            explain: row[5] || ''
        };
    });

    var SUBJECTS = {
        law:    { name: '证券市场基本法律法规', short: '法律法规' },
        basics: { name: '金融市场基础知识',     short: '基础知识' }
    };

    function bySubject(s) { return BANK.filter(function (q) { return q.subject === s; }); }

    /* ---------- localStorage ---------- */
    var STORE_KEY = 'sec-exam-quiz-v1';
    var store;
    try { store = JSON.parse(localStorage.getItem(STORE_KEY)) || {}; }
    catch (e) { store = {}; }
    store.done   = store.done   || {};  // id -> {pick, right, ts}
    store.wrong  = store.wrong  || {};  // id -> true（错题本）
    store.exams  = store.exams  || [];  // 模拟考试记录

    function save() {
        try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (e) {}
    }

    function stats(subject) {
        var ids = bySubject(subject).map(function (q) { return q.id; });
        var done = 0, right = 0;
        ids.forEach(function (id) {
            var d = store.done[id];
            if (d) { done++; if (d.right) right++; }
        });
        var wrong = ids.filter(function (id) { return store.wrong[id]; }).length;
        return { total: ids.length, done: done, right: right, wrong: wrong };
    }

    function shuffle(arr) {
        var a = arr.slice();
        for (var i = a.length - 1; i > 0; i--) {
            var j = (Math.random() * (i + 1)) | 0;
            var t = a[i]; a[i] = a[j]; a[j] = t;
        }
        return a;
    }

    function esc(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    /* ---------- 视图容器 ---------- */
    var view = document.getElementById('q-view');
    var timerEl = document.getElementById('q-timer');

    /* ============================================================
       路由：#/  #/practice/law/order  #/practice/law/random  #/practice/law/wrong  #/exam/law
       ============================================================ */
    function route() {
        stopTimer();
        timerEl.hidden = true;
        var h = location.hash.replace(/^#\/?/, '');
        var parts = h.split('/').filter(Boolean);
        if (parts[0] === 'practice' && parts[1]) {
            renderPractice(parts[1], parts[2] || 'order');
        } else if (parts[0] === 'exam' && parts[1]) {
            renderExam(parts[1]);
        } else if (parts[0] === 'result' && examState.lastResult) {
            renderResult(examState.lastResult);
        } else {
            renderHome();
        }
    }
    window.addEventListener('hashchange', route);

    /* ============================================================
       首页
       ============================================================ */
    function renderHome() {
        var html = '<section class="q-hero">'
            + '<h1>证券从业考试<span>学习</span></h1>'
            + '<p>法律法规 + 金融基础知识 · ' + BANK.length + ' 题 · 真题 / 练习 / 章节例题</p>'
            + '</section><div class="q-subjects">';

        ['law', 'basics'].forEach(function (s) {
            var st = stats(s);
            var pct = st.total ? Math.round(st.done / st.total * 100) : 0;
            var acc = st.done ? Math.round(st.right / st.done * 100) : 0;
            html += '<div class="q-subject-card" data-subject="' + s + '">'
                + '<div class="qsc-head"><h2>' + esc(SUBJECTS[s].name) + '</h2>'
                + '<span class="qsc-count">' + st.total + ' 题</span></div>'
                + '<div class="qsc-stats">'
                +   '<div class="qsc-stat"><b>' + pct + '%</b><i>已刷</i></div>'
                +   '<div class="qsc-stat"><b>' + acc + '%</b><i>正确率</i></div>'
                +   '<div class="qsc-stat"><b>' + st.wrong + '</b><i>错题</i></div>'
                + '</div>'
                + '<div class="qsc-bar"><i style="width:' + pct + '%"></i></div>'
                + '<div class="qsc-actions">'
                +   '<a href="#/practice/' + s + '/order">顺序学习</a>'
                +   '<a href="#/practice/' + s + '/random">随机练习</a>'
                +   '<a href="#/practice/' + s + '/wrong">错题本' + (st.wrong ? ' (' + st.wrong + ')' : '') + '</a>'
                +   '<a class="primary" href="#/exam/' + s + '">模拟考试</a>'
                + '</div></div>';
        });

        html += '</div>';

        if (store.exams.length) {
            html += '<section class="q-history"><h3>考试记录</h3>';
            store.exams.slice(-6).reverse().forEach(function (e) {
                var pass = e.score >= 60;
                html += '<div class="qh-row' + (pass ? ' pass' : ' fail') + '">'
                    + '<span class="qh-sub">' + esc(SUBJECTS[e.subject].short) + '</span>'
                    + '<span class="qh-date">' + esc(e.date) + '</span>'
                    + '<span class="qh-detail">' + e.right + '/' + e.total + ' 题</span>'
                    + '<b class="qh-score">' + e.score + ' 分</b>'
                    + '<i>' + (pass ? '及格 ✓' : '未过 ✗') + '</i></div>';
            });
            html += '</section>';
        }

        view.innerHTML = html;

        document.querySelectorAll('.q-subject-card').forEach(function (card) {
            card.addEventListener('click', function (e) {
                if (e.target.tagName === 'A') return;
                location.hash = '#/practice/' + card.dataset.subject + '/order';
            });
        });
    }

    /* ============================================================
       刷题模式（即时反馈）
       ============================================================ */
    var practice = { list: [], idx: 0, picks: {} };

    function renderPractice(subject, mode) {
        var list;
        if (mode === 'wrong') {
            list = bySubject(subject).filter(function (q) { return store.wrong[q.id]; });
            if (!list.length) {
                view.innerHTML = emptyBox('🎉', '错题本是空的', '先去学习，答错的题会自动收进来', subject);
                return;
            }
        } else {
            list = bySubject(subject);
            if (mode === 'random') list = shuffle(list);
        }
        practice.list = list;
        practice.idx = 0;
        practice.picks = {};
        practice.mode = mode;
        renderPracticeQuestion();
    }

    function emptyBox(icon, title, desc, subject) {
        return '<div class="q-empty-box"><div class="icon">' + icon + '</div>'
            + '<h3>' + title + '</h3><p>' + desc + '</p>'
            + '<a class="btn" href="#/practice/' + subject + '/order">开始刷题</a></div>';
    }

    function renderPracticeQuestion() {
        var q = practice.list[practice.idx];
        if (!q) return;
        var n = practice.idx + 1, total = practice.list.length;
        var pick = practice.picks[q.id];
        var subName = SUBJECTS[q.subject].short;

        var html = '<div class="q-topbar">'
            + '<a class="btn ghost" href="#/">← 退出</a>'
            + '<span class="q-meta">' + esc(subName) + ' · ' + esc(q.source) + '</span>'
            + '<span class="q-progress-text">' + n + ' / ' + total + '</span></div>'
            + '<div class="q-progress"><i style="width:' + (n / total * 100) + '%"></i></div>'
            + '<article class="q-card">'
            + '<div class="q-stem"><b>' + n + '.</b> ' + esc(q.q) + '</div>'
            + '<div class="q-options">';

        var letters = ['A', 'B', 'C', 'D'];
        q.options.forEach(function (opt, i) {
            var L = letters[i];
            var cls = 'q-opt';
            if (pick !== undefined) {
                if (L === q.answer) cls += ' correct';
                else if (L === pick) cls += ' wrong';
            }
            html += '<button class="' + cls + '" data-pick="' + L + '"'
                + (pick !== undefined ? ' disabled' : '') + '>'
                + '<i>' + L + '</i><span>' + esc(opt) + '</span></button>';
        });

        html += '</div>';

        if (pick !== undefined) {
            var right = pick === q.answer;
            html += '<div class="q-feedback ' + (right ? 'ok' : 'no') + '">'
                + (right ? '✓ 回答正确' : '✗ 回答错误 · 正确答案 ' + q.answer)
                + (mode_eraseWrongNote(q)) + '</div>';
            if (q.explain) {
                html += '<div class="q-explain"><b>解析</b>' + esc(q.explain) + '</div>';
            }
        }

        html += '</article><div class="q-nav">'
            + '<button class="btn" id="q-prev"' + (practice.idx === 0 ? ' disabled' : '') + '>← 上一题</button>'
            + '<span class="q-nav-jump"></span>'
            + '<button class="btn primary" id="q-next">'
            + (practice.idx === practice.list.length - 1 ? '完成 ✓' : '下一题 →') + '</button></div>';

        view.innerHTML = html;

        view.querySelectorAll('.q-opt').forEach(function (btn) {
            btn.addEventListener('click', function () {
                if (practice.picks[q.id] !== undefined) return;
                var L = btn.dataset.pick;
                practice.picks[q.id] = L;
                var isRight = L === q.answer;
                store.done[q.id] = { pick: L, right: isRight, ts: Date.now() };
                if (isRight) delete store.wrong[q.id];
                else store.wrong[q.id] = true;
                save();
                renderPracticeQuestion();
            });
        });

        document.getElementById('q-prev').addEventListener('click', function () {
            if (practice.idx > 0) { practice.idx--; renderPracticeQuestion(); }
        });
        document.getElementById('q-next').addEventListener('click', function () {
            if (practice.idx < practice.list.length - 1) {
                practice.idx++; renderPracticeQuestion();
            } else {
                location.hash = '#/';
            }
        });
    }

    function mode_eraseWrongNote(q) {
        if (practice.mode === 'wrong' && store.done[q.id] && store.done[q.id].right) {
            return ' · 已从错题本移除';
        }
        return '';
    }

    /* ============================================================
       模拟考试（计时 · 不反馈 · 交卷评分）
       ============================================================ */
    var examState = { active: false, list: [], picks: {}, timer: null, left: 0, lastResult: null };

    function renderExam(subject) {
        var all = bySubject(subject);
        var count = Math.min(50, all.length);
        var list = shuffle(all).slice(0, count);
        var minutes = Math.max(20, Math.round(count * 1.2));

        examState.active = true;
        examState.subject = subject;
        examState.list = list;
        examState.picks = {};
        examState.idx = 0;
        examState.left = minutes * 60;

        timerEl.hidden = false;
        startTimer();

        renderExamQuestion();
    }

    function startTimer() {
        stopTimer();
        examState.timer = setInterval(function () {
            examState.left--;
            paintTimer();
            if (examState.left <= 0) {
                submitExam('时间到，自动交卷');
            }
        }, 1000);
        paintTimer();
    }

    function stopTimer() {
        if (examState.timer) { clearInterval(examState.timer); examState.timer = null; }
    }

    function paintTimer() {
        var m = Math.floor(examState.left / 60), s = examState.left % 60;
        timerEl.textContent = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
        timerEl.classList.toggle('urgent', examState.left < 300);
    }

    function renderExamQuestion() {
        var q = examState.list[examState.idx];
        var n = examState.idx + 1, total = examState.list.length;
        var pick = examState.picks[q.id];

        var html = '<div class="q-topbar exam">'
            + '<button class="btn ghost" id="ex-quit">放弃</button>'
            + '<span class="q-meta">模拟考试 · ' + esc(SUBJECTS[examState.subject].name) + '</span>'
            + '<span class="q-progress-text">' + n + ' / ' + total + '</span></div>'
            + '<div class="q-sheet" id="ex-sheet">';

        examState.list.forEach(function (qq, i) {
            var on = i === examState.idx ? ' on' : '';
            var done = examState.picks[qq.id] !== undefined ? ' done' : '';
            html += '<button class="sh-cell' + on + done + '" data-i="' + i + '">' + (i + 1) + '</button>';
        });
        html += '</div>'
            + '<article class="q-card">'
            + '<div class="q-stem"><b>' + n + '.</b> ' + esc(q.q) + '</div>'
            + '<div class="q-options">';

        var letters = ['A', 'B', 'C', 'D'];
        q.options.forEach(function (opt, i) {
            var L = letters[i];
            var cls = 'q-opt' + (pick === L ? ' picked' : '');
            html += '<button class="' + cls + '" data-pick="' + L + '">'
                + '<i>' + L + '</i><span>' + esc(opt) + '</span></button>';
        });

        html += '</div></article><div class="q-nav">'
            + '<button class="btn" id="ex-prev"' + (examState.idx === 0 ? ' disabled' : '') + '>← 上一题</button>'
            + '<span class="q-nav-jump"></span>'
            + '<button class="btn primary" id="ex-submit">交卷 📝</button></div>';

        view.innerHTML = html;

        view.querySelectorAll('.q-opt').forEach(function (btn) {
            btn.addEventListener('click', function () {
                examState.picks[q.id] = btn.dataset.pick;
                renderExamQuestion();
            });
        });
        view.querySelectorAll('.sh-cell').forEach(function (btn) {
            btn.addEventListener('click', function () {
                examState.idx = +btn.dataset.i;
                renderExamQuestion();
            });
        });
        document.getElementById('ex-prev').addEventListener('click', function () {
            if (examState.idx > 0) { examState.idx--; renderExamQuestion(); }
        });
        document.getElementById('ex-quit').addEventListener('click', function () {
            if (confirm('确定放弃本次考试？')) {
                stopTimer();
                location.hash = '#/';
            }
        });
        document.getElementById('ex-submit').addEventListener('click', function () {
            var unanswered = examState.list.filter(function (qq) {
                return examState.picks[qq.id] === undefined;
            }).length;
            var msg = unanswered ? '还有 ' + unanswered + ' 题未作答，确定交卷？' : '确定交卷？';
            if (confirm(msg)) submitExam();
        });
    }

    function submitExam(note) {
        stopTimer();
        var right = 0, total = examState.list.length;
        var wrongIds = [];
        examState.list.forEach(function (q) {
            var pick = examState.picks[q.id];
            var isRight = pick === q.answer;
            if (pick !== undefined) {
                store.done[q.id] = { pick: pick, right: isRight, ts: Date.now() };
            }
            if (isRight) { right++; delete store.wrong[q.id]; }
            else { wrongIds.push(q.id); if (pick !== undefined) store.wrong[q.id] = true; }
        });
        var score = Math.round(right / total * 100);
        var d = new Date();
        var rec = {
            subject: examState.subject, date: (d.getMonth() + 1) + '/' + d.getDate(),
            right: right, total: total, score: score
        };
        store.exams.push(rec);
        save();

        examState.lastResult = {
            rec: rec, note: note || '', wrongIds: wrongIds,
            list: examState.list, picks: examState.picks
        };
        location.hash = '#/result';
    }

    /* ---------- 成绩单 ---------- */
    function renderResult(r) {
        var pass = r.rec.score >= 60;
        var html = '<section class="q-result ' + (pass ? 'pass' : 'fail') + '">'
            + '<div class="qr-ring"><b>' + r.rec.score + '</b><i>分</i></div>'
            + '<h2>' + (pass ? '🎉 恭喜及格' : '💪 再接再厉') + '</h2>'
            + '<p>' + esc(SUBJECTS[r.rec.subject].name) + ' · 答对 ' + r.rec.right + ' / ' + r.rec.total + ' 题'
            + (r.note ? ' · ' + esc(r.note) : '') + '</p>'
            + '<div class="qr-actions">'
            + '<a class="btn primary" href="#/practice/' + r.rec.subject + '/wrong">复习错题 (' + r.wrongIds.length + ')</a>'
            + '<a class="btn" href="#/exam/' + r.rec.subject + '">再考一次</a>'
            + '<a class="btn ghost" href="#/">返回首页</a></div></section>';

        if (r.wrongIds.length) {
            html += '<h3 class="q-review-title">错题回顾</h3>';
            r.list.forEach(function (q, i) {
                if (r.wrongIds.indexOf(q.id) === -1) return;
                var pick = r.picks[q.id] || '未作答';
                html += '<article class="q-card review"><div class="q-stem"><b>' + (i + 1) + '.</b> ' + esc(q.q) + '</div><div class="q-options">';
                var letters = ['A', 'B', 'C', 'D'];
                q.options.forEach(function (opt, j) {
                    var L = letters[j];
                    var cls = 'q-opt';
                    if (L === q.answer) cls += ' correct';
                    else if (L === pick) cls += ' wrong';
                    html += '<div class="' + cls + '"><i>' + L + '</i><span>' + esc(opt) + '</span></div>';
                });
                html += '</div><div class="q-feedback no">你的答案：' + (pick || '—') + ' · 正确答案：' + q.answer + '</div>';
                if (q.explain) html += '<div class="q-explain"><b>解析</b>' + esc(q.explain) + '</div>';
                html += '</article>';
            });
        }

        view.innerHTML = html;
        timerEl.hidden = true;
    }

    /* ---------- 启动 ---------- */
    if (!BANK.length) {
        view.innerHTML = '<div class="q-empty"><div class="icon">📦</div><p>题库为空</p></div>';
        return;
    }
    route();
})();
