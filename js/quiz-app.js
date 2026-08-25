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

    /* 知识点库统计（数据懒加载，首页用静态摘要） */
    /* 题目模块分类：法律法规按关键词，基础知识按章 */
    var LAW_MODULES = [
        ['期货交易管理条例', ['期货']],
        ['基金法', ['基金', '私募', '募集', '托管']],
        ['证券公司监督管理', ['证券公司', '自营', '经纪', '资产管理', '融资融券', '两融', 'IB', '保荐', '承销', '合规']],
        ['从业资格与执业行为', ['从业', '执业', '诚信', '职业道德', '从业人员', '胜任能力', '后续培训']],
        ['公司法', ['股东', '董事', '监事', '有限责任', '股份有限', '注册资本', '清算', '破产', '合伙', '公司债券', '股东大会', '公司治理']],
        ['证券法', ['证券发行', '上市', '交易', '信息披露', '内幕', '操纵市场', '虚假陈述', '收购', '退市', '注册制', '欺诈', '证券']]
    ];
    var BAS_MODULE_NAMES = {
        1: '金融市场体系', 2: '金融体系与多层次资本市场', 3: '证券市场主体',
        4: '股票', 5: '债券', 6: '证券投资基金', 7: '金融衍生工具', 8: '金融风险管理'
    };
    function moduleOf(q) {
        if (q.subject === 'basics') {
            return BAS_MODULE_NAMES[q.chapter] || '其他';
        }
        for (var i = 0; i < LAW_MODULES.length; i++) {
            var kws = LAW_MODULES[i][1];
            for (var k = 0; k < kws.length; k++) {
                if (q.q.indexOf(kws[k]) !== -1) return LAW_MODULES[i][0];
            }
        }
        return '法律法规综合';
    }

    /* 模块 → 知识点文档直达 */
    var LAW_MODULE_DOC = {
        '公司法': 'law-2', '证券法': 'law-3', '基金法': 'law-4',
        '期货交易管理条例': 'law-5', '证券公司监督管理': 'law-6',
        '从业资格与执业行为': 'law-7', '法律法规综合': 'law-0'
    };
    function docIdOf(q) {
        if (q.subject === 'basics') return 'basics-' + (q.chapter - 1);
        var m = moduleOf(q);
        return LAW_MODULE_DOC[m] || 'law-0';
    }

    var LEARN_SUMMARY = {
        law:    { docs: 14, sections: 1088, chars: 34.9 },
        basics: { docs: 10, sections: 2068, chars: 55.4 }
    };

    function bySubject(s) { return BANK.filter(function (q) { return q.subject === s; }); }

    /* ---------- localStorage ---------- */
    var STORE_KEY = 'sec-exam-quiz-v1';
    var store;
    try { store = JSON.parse(localStorage.getItem(STORE_KEY)) || {}; }
    catch (e) { store = {}; }
    store.done   = store.done   || {};  // id -> {pick, right, ts}
    store.wrong  = store.wrong  || {};  // id -> {wrongCount, stage, nextReview}
    store.exams  = store.exams  || [];  // 模拟考试记录

    /* 旧格式迁移：wrong[id] === true → 调度对象（立即到期） */
    Object.keys(store.wrong).forEach(function (id) {
        if (store.wrong[id] === true) {
            store.wrong[id] = { wrongCount: 1, stage: 0, nextReview: 0 };
        }
    });

    function save() {
        try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (e) {}
    }

    /* 艾宾浩斯间隔：1天 → 3天 → 7天 → 14天 → 移出错题本 */
    var REVIEW_INTERVALS = [1, 3, 7, 14];
    var DAY_MS = 24 * 60 * 60 * 1000;

    function recordResult(q, isRight) {
        store.done[q.id] = { pick: store.done[q.id] && store.done[q.id].pick, right: isRight, ts: Date.now() };
        var w = store.wrong[q.id];
        if (!isRight) {
            var wc = w ? w.wrongCount + 1 : 1;
            // 答错：重置到第一阶段（1 天后复习）
            store.wrong[q.id] = { wrongCount: wc, stage: 0, nextReview: Date.now() + REVIEW_INTERVALS[0] * DAY_MS };
        } else if (w) {
            // 复习答对：进入下一阶段
            if (w.stage + 1 >= REVIEW_INTERVALS.length) {
                delete store.wrong[q.id]; // 四个阶段全过 → 已巩固
            } else {
                store.wrong[q.id] = { wrongCount: w.wrongCount, stage: w.stage + 1, nextReview: Date.now() + REVIEW_INTERVALS[w.stage + 1] * DAY_MS };
            }
        }
        save();
    }

    function dueReviews(subject) {
        var now = Date.now();
        return BANK.filter(function (q) {
            if (q.subject !== subject) return false;
            var w = store.wrong[q.id];
            return w && w.nextReview <= now;
        });
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

    /* 重点高亮：数字考点红显 · 执法术语金底线 · 口诀荧光笔（作用于已转义文本） */
    function hl(escaped) {
        var s = escaped;
        // 数字 + 单位（考试最易丢分的记忆点）
        s = s.replace(/(\d+(?:\.\d+)?(?:%|‰|万元|元|亿|万|个?月|日|周年|年|人|倍|次|个|份|家|只|条|笔|个工作日))/g,
                      '<span class="hl-num">$1</span>');
        // 高频执法/监管术语
        s = s.replace(/(罚款|处以|罚没|取消从业资格|责令改正|责令|警告|暂停.{0,3}业务|吊销|终身.{0,4}禁入|市场禁入|刑事责任|行政监管措施|纪律处分|撤销任职资格)/g,
                      '<span class="hl-term">$1</span>');
        // 口诀整句荧光
        s = s.replace(/(口诀[:：][^　]+)/g, '<span class="hl-kj">$1</span>');
        return s;
    }

    /* ---------- 视图容器 ---------- */
    var view = document.getElementById('q-view');
    var timerEl = document.getElementById('q-timer');

    /* ============================================================
       路由：#/  #/practice/...  #/exam/...  #/learn/{subject}[/{docId}]
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
        } else if (parts[0] === 'learn' && parts[1]) {
            renderLearn(parts[1], parts[2] || null);
        } else if (parts[0] === 'papers') {
            renderPapers(parts[1] || null);
        } else if (parts[0] === 'memento') {
            renderMemento();
        } else if (parts[0] === 'review' && parts[1]) {
            renderReview(parts[1]);
        } else if (parts[0] === 'radar' && parts[1]) {
            renderRadar(parts[1]);
        } else if (parts[0] === 'drill' && parts[1]) {
            var drillIds = parts[1].split(',').map(Number).filter(function (i) { return BANK[i]; });
            practice.list = drillIds.map(function (i) { return BANK[i]; });
            practice.idx = 0; practice.picks = {}; practice.mode = 'order';
            practice.title = '薄弱专项 · ' + drillIds.length + ' 题';
            practice.backHash = '#/';
            renderPracticeQuestion();
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
        var nPapers = (window.EXAM_PAPERS || []).length;
        var nPaperQ = (window.EXAM_PAPERS || []).reduce(function (a, p) { return a + p.count; }, 0);
        var nCards = (window.MEMENTO_CARDS || []).length;
        var html = '<section class="q-promo">'
            + '<div class="promo-badges">'
            +   '<span class="pb pb-fire">🔥 六年真题 2019-2024</span>'
            +   '<span class="pb pb-clock">⏰ 智能间隔复习</span>'
            +   '<span class="pb pb-radar">📊 薄弱雷达定位</span>'
            + '</div>'
            + '<h1 class="promo-title">证券从业考试<span class="pt-hot">一次通过</span></h1>'
            + '<p class="promo-sub">完整备考闭环 · 真题 → 练习 → 复习 → 补强</p>'
            + '<div class="promo-stats">'
            +   '<div class="ps"><b class="count" data-n="' + BANK.length + '">0</b><i>精选题库</i></div>'
            +   '<div class="ps"><b class="count" data-n="' + nPaperQ + '">0</b><i>历年真题</i></div>'
            +   '<div class="ps"><b class="count" data-n="' + nPapers + '">0</b><i>套真题卷</i></div>'
            +   '<div class="ps"><b class="count" data-n="90">0</b><i>万字知识点</i></div>'
            + '</div></section>';

        /* 醒目的知识点学习入口（含各科知识点/章节统计） */
        html += '<section class="q-learn-strip">'
            + '<div class="qls-head">📖 知识点学习 <span>· PDF 全量收录 24 篇 · 3156 个小节 · 90 万字</span></div>'
            + '<div class="qls-cards">';
        ['law', 'basics'].forEach(function (s) {
            var sum = LEARN_SUMMARY[s];
            html += '<a class="qls-card" href="#/learn/' + s + '">'
                + '<div class="qls-title">' + esc(SUBJECTS[s].name) + '</div>'
                + '<div class="qls-meta"><b>' + sum.docs + '</b> 篇文档 · <b>' + sum.sections + '</b> 个小节 · <b>' + sum.chars + '</b> 万字</div>'
                + '<span class="qls-go">进入学习 →</span></a>';
        });
        html += '</div></section>';

        /* 历年真题 + 重点速记 快捷入口 */
        html += '<section class="q-quick-strip">'
            + '<a class="qq-card" href="#/papers"><span class="qq-ico">📜</span>'
            + '<span class="qq-txt"><b>历年真题</b><i>' + nPapers + ' 套 · ' + nPaperQ + ' 题 · 按套刷</i></span></a>'
            + '<a class="qq-card" href="#/memento"><span class="qq-ico">⚡</span>'
            + '<span class="qq-txt"><b>重点速记</b><i>' + nCards + ' 张卡片 · 百条/口诀/数字考点</i></span></a>'
            + '</section>';

        html += '<div class="q-subjects">';

        ['law', 'basics'].forEach(function (s) {
            var st = stats(s);
            var pct = st.total ? Math.round(st.done / st.total * 100) : 0;
            var acc = st.done ? Math.round(st.right / st.done * 100) : 0;
            var due = dueReviews(s).length;
            if (due) {
                html += '<a class="q-review-banner" href="#/review/' + s + '">⏰ '
                    + esc(SUBJECTS[s].short) + '：今日待复习 <b>' + due + '</b> 题'
                    + '<span>按遗忘曲线到期 · 点击开刷 →</span></a>';
            }
            html += '<div class="q-subject-card" data-subject="' + s + '">'
                + '<div class="qsc-head"><h2>' + esc(SUBJECTS[s].name) + '</h2>'
                + '<span class="qsc-count">' + st.total + ' 题</span></div>'
                + '<div class="qsc-stats">'
                +   '<div class="qsc-stat"><b>' + pct + '%</b><i>已练</i></div>'
                +   '<div class="qsc-stat"><b>' + acc + '%</b><i>正确率</i></div>'
                +   '<div class="qsc-stat"><b>' + st.wrong + '</b><i>错题</i></div>'
                + '</div>'
                + '<div class="qsc-bar"><i style="width:' + pct + '%"></i></div>'
                + '<div class="qsc-actions">'
                +   '<a href="#/practice/' + s + '/order">顺序练习</a>'
                +   '<a href="#/practice/' + s + '/random">随机</a>'
                +   '<a href="#/practice/' + s + '/wrong">错题本' + (st.wrong ? ' (' + st.wrong + ')' : '') + '</a>'
                +   '<a href="#/radar/' + s + '">📊 薄弱分析</a>'
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

        /* 数字滚动动画 */
        view.querySelectorAll('.count').forEach(function (el) {
            var target = +el.dataset.n, start = null, dur = 1100;
            function step(ts) {
                if (!start) start = ts;
                var p = Math.min(1, (ts - start) / dur);
                var eased = 1 - Math.pow(1 - p, 3);
                el.textContent = Math.round(target * eased).toLocaleString();
                if (p < 1) requestAnimationFrame(step);
            }
            requestAnimationFrame(step);
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

        var backH = practice.backHash || '#/';
        var html = '<div class="q-topbar">'
            + '<a class="btn ghost" href="' + backH + '">← 退出</a>'
            + '<span class="q-meta">' + (practice.title ? esc(practice.title) : esc(subName) + ' · ' + esc(q.source)) + '</span>'
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
            html += '<div class="q-knowledge-inline" id="q-ki"></div>';
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
                recordResult(q, L === q.answer);
                renderPracticeQuestion();
            });
        });

        if (pick !== undefined) fillKnowledge(q);

        document.getElementById('q-prev').addEventListener('click', function () {
            if (practice.idx > 0) { practice.idx--; renderPracticeQuestion(); }
        });
        document.getElementById('q-next').addEventListener('click', function () {
            if (practice.idx < practice.list.length - 1) {
                practice.idx++; renderPracticeQuestion();
            } else {
                location.hash = practice.backHash || '#/';
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
            if (pick !== undefined) recordResult(q, isRight);
            if (isRight) { right++; }
            else { wrongIds.push(q.id); }
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

    /* ============================================================
       今日复习（艾宾浩斯到期错题）
       ============================================================ */
    function renderReview(subject) {
        var due = dueReviews(subject);
        if (!due.length) {
            view.innerHTML = '<div class="q-empty-box"><div class="icon">🎉</div>'
                + '<h3>当前没有到期复习题</h3>'
                + '<p>错题会按 1 / 3 / 7 / 14 天间隔自动安排复习，到点出现在这里</p>'
                + '<a class="btn" href="#/">返回首页</a></div>';
            return;
        }
        practice.list = due;
        practice.idx = 0;
        practice.picks = {};
        practice.mode = 'review';
        practice.title = '今日复习 · ' + SUBJECTS[subject].short + '（' + due.length + ' 题到期）';
        practice.backHash = '#/';
        renderPracticeQuestion();
    }

    /* ============================================================
       薄弱章节雷达（模块正确率热力条）
       ============================================================ */
    function renderRadar(subject) {
        var mods = {};
        bySubject(subject).forEach(function (q) {
            var m = moduleOf(q);
            mods[m] = mods[m] || { total: 0, done: 0, right: 0, qIds: [] };
            mods[m].total++;
            mods[m].qIds.push(q.id);
            var d = store.done[q.id];
            if (d) { mods[m].done++; if (d.right) mods[m].right++; }
        });
        var arr = Object.keys(mods).map(function (k) {
            var m = mods[k];
            m.name = k;
            m.acc = m.done ? Math.round(m.right / m.done * 100) : -1;
            return m;
        }).sort(function (a, b) { return (a.acc === -1 ? 999 : a.acc) - (b.acc === -1 ? 999 : b.acc); });

        var html = '<div class="q-topbar">'
            + '<a class="btn ghost" href="#/">← 退出</a>'
            + '<span class="q-meta">薄弱分析 · ' + esc(SUBJECTS[subject].name) + '（正确率升序，红=短板）</span>'
            + '<span class="q-progress-text">' + arr.length + ' 个模块</span></div>'
            + '<div class="q-radar">';

        arr.forEach(function (m) {
            var cls = m.acc === -1 ? 'na' : (m.acc >= 80 ? 'good' : (m.acc >= 60 ? 'mid' : 'bad'));
            var accTxt = m.acc === -1 ? '未刷' : m.acc + '%';
            var idsParam = m.qIds.join(',');
            html += '<div class="qr-row ' + cls + '">'
                + '<div class="qr-info"><b>' + esc(m.name) + '</b>'
                + '<span>已练 ' + m.done + ' / ' + m.total + ' 题</span></div>'
                + '<div class="qr-bar"><i style="width:' + (m.acc === -1 ? 0 : m.acc) + '%"></i></div>'
                + '<span class="qr-acc">' + accTxt + '</span>'
                + '<a class="btn ghost" href="#/drill/' + idsParam + '">练这块 →</a>'
                + '</div>';
        });
        html += '</div>'
            + '<div class="q-note">※ 按模块正确率升序排列：<b style="color:var(--up)">红 &lt;60%</b> 为重点补强，<b style="color:var(--accent)">金 60-80%</b> 需巩固，绿 ≥80% 已掌握。练完在对应模块的题目里刷新正确率。</div>';
        view.innerHTML = html;
    }

    /* ============================================================
       历年真题（试卷归档 · 复用练习引擎）
       ============================================================ */
    function renderPapers(pid) {
        var PAPERS = window.EXAM_PAPERS || [];
        if (pid) {
            var p = null;
            PAPERS.forEach(function (x) { if (x.id === pid) p = x; });
            if (!p) { renderPapers(null); return; }
            practice.list = p.qIds.map(function (i) { return BANK[i]; });
            practice.idx = 0;
            practice.picks = {};
            practice.mode = 'order';
            practice.title = '历年真题 · ' + p.name;
            practice.backHash = '#/papers';
            renderPracticeQuestion();
            return;
        }
        var types = [['真题', '📜'], ['冲刺卷', '⚡']];
        var html = '<div class="q-topbar">'
            + '<a class="btn ghost" href="#/">← 退出</a>'
            + '<span class="q-meta">历年真题归档 · 按套练习</span>'
            + '<span class="q-progress-text">' + PAPERS.length + ' 套</span></div>';
        types.forEach(function (tp) {
            var list = PAPERS.filter(function (p) { return p.type === tp[0]; });
            if (!list.length) return;
            html += '<div class="q-learn-cat"><h3>' + tp[1] + ' ' + tp[0] + '</h3>';
            list.forEach(function (p) {
                html += '<a class="q-doc-card" href="#/papers/' + p.id + '">'
                    + '<div class="qd-main"><div class="qd-title">' + esc(p.name) + '</div>'
                    + '<div class="qd-meta">' + esc(SUBJECTS[p.subject].short) + ' · ' + p.count + ' 题 · 即时对错反馈</div></div>'
                    + '<span class="qd-arrow">→</span></a>';
            });
            html += '</div>';
        });
        html += '<div class="q-note">※ 2021.12 两场机考真题原文归档；冲刺卷为考前精选套题。后续拿到新真题 PDF，放入「证券从业考试」文件夹即可自动入库。</div>';
        view.innerHTML = html;
    }

    /* ============================================================
       重点速记（考点卡片墙）
       ============================================================ */
    var memoFilter = { subject: 'law', cat: 'all' };

    function renderMemento() {
        var CARDS = window.MEMENTO_CARDS || [];
        var cats = [];
        CARDS.forEach(function (c) {
            if (cats.indexOf(c.cat) === -1) cats.push(c.cat);
        });
        var order = ['百条考点', '记忆口诀', '数字考点·罚款金额', '数字考点·时间期限', '数字考点·比例阈值', '数字考点·数字规定'];
        cats = order.filter(function (c) { return cats.indexOf(c) !== -1; });

        var list = CARDS.filter(function (c) {
            return (memoFilter.subject === 'all' || c.subject === memoFilter.subject)
                && (memoFilter.cat === 'all' || c.cat === memoFilter.cat);
        });

        var html = '<div class="q-topbar">'
            + '<a class="btn ghost" href="#/">← 退出</a>'
            + '<span class="q-meta">重点速记 · 备考100条 + 口诀 + 数字考点</span>'
            + '<span class="q-progress-text">' + list.length + ' 张</span></div>'
            + '<div class="q-sub-tabs">'
            + '<button class="q-sub-tab' + (memoFilter.subject === 'law' ? ' on' : '') + '" data-sub="law">📜 证券市场基本法律法规</button>'
            + '<button class="q-sub-tab' + (memoFilter.subject === 'basics' ? ' on' : '') + '" data-sub="basics">📈 金融市场基础知识</button>'
            + '</div>'
            + '<div class="q-memo-filters">'
            + '<select id="mf-cat"><option value="all">全部类型</option>';
        cats.forEach(function (c) {
            html += '<option value="' + esc(c) + '"' + (memoFilter.cat === c ? ' selected' : '') + '>' + esc(c) + '</option>';
        });
        html += '</select></div>'
            + '<div class="q-hl-legend"><span class="hl-num">数字考点</span>必背数值 · '
            + '<span class="hl-term">执法术语</span>高频考点 · '
            + '<span class="hl-kj">口诀</span>速记锚点</div>'
            + '<div class="q-memo-grid">';

        list.slice(0, 400).forEach(function (c) {
            html += '<div class="q-memo-card cat-' + (c.cat.indexOf('数字') === 0 ? 'num' : (c.cat === '百条考点' ? 'bai' : 'kou')) + '">'
                + '<div class="qm-tag">' + esc(c.cat) + ' · ' + (c.subject === 'law' ? '法规' : '基础') + '</div>'
                + (c.cat === '百条考点'
                    ? '<div class="qm-body">' + hl(esc(c.content)) + '</div>'
                    : '<div class="qm-title">' + hl(esc(c.title)) + '</div><div class="qm-body">' + hl(esc(c.content)) + '</div>')
                + '</div>';
        });
        html += '</div>';
        view.innerHTML = html;

        view.querySelectorAll('.q-sub-tab').forEach(function (btn) {
            btn.addEventListener('click', function () {
                if (memoFilter.subject === btn.dataset.sub) return;
                memoFilter.subject = btn.dataset.sub;
                memoFilter.cat = 'all'; // 切科目时重置类型，避免选项不存在
                renderMemento();
            });
        });
        document.getElementById('mf-cat').addEventListener('change', function () {
            memoFilter.cat = this.value; renderMemento();
        });
    }

    /* ============================================================
       知识点学习（懒加载 js/learn-data-{subject}.js）
       ============================================================ */
    var LEARN = { law: null, basics: null };

    function loadLearn(subject, cb, silent) {
        if (LEARN[subject]) { cb(LEARN[subject]); return; }
        var varName = subject === 'law' ? 'LEARN_DATA_LAW' : 'LEARN_DATA_BASICS';
        if (window[varName]) {
            LEARN[subject] = window[varName];
            cb(LEARN[subject]);
            return;
        }
        if (!silent) {
            view.innerHTML = '<div class="q-empty"><div class="icon">⏳</div><p>知识点库加载中...</p></div>';
        }
        var s = document.createElement('script');
        s.src = 'js/learn-data-' + subject + '.js';
        s.onload = function () {
            LEARN[subject] = window[varName] || [];
            cb(LEARN[subject]);
        };
        s.onerror = function () {
            if (!silent) {
                view.innerHTML = '<div class="q-empty"><div class="icon">📦</div><p>知识点库加载失败，请刷新重试</p></div>';
            }
        };
        document.head.appendChild(s);
    }

    /* 按题干 2-gram 关键词匹配最相关小节（内联知识点展示） */
    function relevantSection(doc, q) {
        var stem = q.q + q.options.join('');
        var grams = {};
        for (var i = 0; i + 2 <= stem.length; i++) {
            var g = stem.substr(i, 2);
            if (/^[\u4e00-\u9fa5]{2}$/.test(g)) grams[g] = 1;
        }
        var keys = Object.keys(grams);
        var best = null, bestScore = 0;
        doc.sections.forEach(function (sArr) {
            var text = sArr[0] + sArr[1];
            var score = 0;
            keys.forEach(function (g) { if (text.indexOf(g) !== -1) score++; });
            if (score > bestScore) { bestScore = score; best = sArr; }
        });
        return bestScore >= 3 ? best : null;
    }

    /* 异步填充内联知识点块 */
    function fillKnowledge(q) {
        var box = document.getElementById('q-ki');
        if (!box) return;
        loadLearn(q.subject, function (docs) {
            var el = document.getElementById('q-ki');
            if (!el) return;
            var docId = docIdOf(q);
            var doc = null;
            docs.forEach(function (d) { if (d.id === docId) doc = d; });
            if (!doc) return;
            var sec = relevantSection(doc, q);
            var body = sec ? sec[1] : (doc.sections[0] && doc.sections[0][1] || '');
            if (!body) return;
            var text = body.slice(0, 700);
            el.innerHTML = '<div class="qki-head">📖 相关知识点 · ' + esc(doc.title)
                + (sec ? ' / ' + esc(sec[0]) : '') + '</div>'
                + '<div class="qki-body">' + esc(text) + (body.length > 700 ? ' ……' : '') + '</div>'
                + '<a class="qki-more" href="#/learn/' + q.subject + '/' + docId + '">查看全文 →</a>';
        }, true);
    }

    var LEARN_CAT_ORDER = ['章节讲义', '考点精讲', '考点速记', '应试笔记', '对照表', '大纲'];

    function renderLearn(subject, docId) {
        if (!SUBJECTS[subject]) { location.hash = '#/'; return; }
        loadLearn(subject, function (docs) {
            if (docId) renderReader(subject, docs, docId);
            else renderDocList(subject, docs);
        });
    }

    function renderDocList(subject, docs) {
        var byCat = {};
        docs.forEach(function (d) { (byCat[d.cat] = byCat[d.cat] || []).push(d); });

        var html = '<div class="q-topbar">'
            + '<a class="btn ghost" href="#/">← 退出</a>'
            + '<span class="q-meta">知识点学习 · ' + esc(SUBJECTS[subject].name) + '</span>'
            + '<span class="q-progress-text">' + docs.length + ' 篇</span></div>';

        LEARN_CAT_ORDER.forEach(function (cat) {
            var list = byCat[cat];
            if (!list) return;
            html += '<div class="q-learn-cat"><h3>' + esc(cat) + '</h3>';
            list.forEach(function (d) {
                html += '<a class="q-doc-card" href="#/learn/' + subject + '/' + d.id + '">'
                    + '<div class="qd-main"><div class="qd-title">' + esc(d.title) + '</div>'
                    + '<div class="qd-meta">' + d.sections.length + ' 节 · ' + (d.chars / 10000).toFixed(1) + ' 万字</div></div>'
                    + '<span class="qd-arrow">→</span></a>';
            });
            html += '</div>';
        });
        view.innerHTML = html;
    }

    function renderReader(subject, docs, docId) {
        var doc = null, idx = -1;
        docs.forEach(function (d, i) { if (d.id === docId) { doc = d; idx = i; } });
        if (!doc) { renderDocList(subject, docs); return; }

        var prev = docs[idx - 1], next = docs[idx + 1];
        var LIMIT = 80; // 超长文档先渲染前 80 节
        var shown = doc.sections.length > LIMIT;
        var secs = shown ? doc.sections.slice(0, LIMIT) : doc.sections;

        var html = '<div class="q-topbar">'
            + '<a class="btn ghost" href="#/learn/' + subject + '">← 目录</a>'
            + '<span class="q-meta">' + esc(doc.cat) + ' · ' + esc(SUBJECTS[subject].short) + '</span>'
            + '<span class="q-progress-text">' + doc.sections.length + ' 节</span></div>'
            + '<article class="q-reader"><h1>' + esc(doc.title) + '</h1>'
            + '<nav class="q-toc"><select id="q-toc-sel">';
        secs.forEach(function (sArr, i) {
            html += '<option value="' + i + '">' + esc(sArr[0]) + '</option>';
        });
        html += '</select></nav><div class="q-reader-body">';

        secs.forEach(function (sArr, i) {
            var paras = sArr[1].split('\n').filter(function (l) { return l.trim(); });
            html += '<section class="q-sec" id="sec-' + i + '"><h3>' + esc(sArr[0]) + '</h3>';
            paras.forEach(function (p) {
                html += '<p>' + esc(p) + '</p>';
            });
            html += '</section>';
        });

        if (shown) {
            html += '<div class="q-more" id="q-more"><button class="btn primary">显示全部 ' + doc.sections.length + ' 节 ↓</button></div>';
        }

        html += '</div></article><div class="q-nav">'
            + (prev ? '<a class="btn" href="#/learn/' + subject + '/' + prev.id + '">← ' + esc(prev.title.slice(0, 12)) + '</a>' : '<span></span>')
            + (next ? '<a class="btn" href="#/learn/' + subject + '/' + next.id + '">' + esc(next.title.slice(0, 12)) + ' →</a>' : '<span></span>')
            + '</div>';

        view.innerHTML = html;

        var tocSel = document.getElementById('q-toc-sel');
        tocSel.addEventListener('change', function () {
            var el = document.getElementById('sec-' + tocSel.value);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });

        var more = document.getElementById('q-more');
        if (more) {
            more.querySelector('button').addEventListener('click', function () {
                renderReaderFull(subject, doc);
            });
        }
    }

    function renderReaderFull(subject, doc) {
        var html = '<div class="q-topbar">'
            + '<a class="btn ghost" href="#/learn/' + subject + '">← 目录</a>'
            + '<span class="q-meta">' + esc(doc.cat) + ' · ' + esc(SUBJECTS[subject].short) + '</span>'
            + '<span class="q-progress-text">' + doc.sections.length + ' 节</span></div>'
            + '<article class="q-reader"><h1>' + esc(doc.title) + '</h1><div class="q-reader-body">';
        doc.sections.forEach(function (sArr, i) {
            var paras = sArr[1].split('\n').filter(function (l) { return l.trim(); });
            html += '<section class="q-sec"><h3>' + esc(sArr[0]) + '</h3>';
            paras.forEach(function (p) { html += '<p>' + esc(p) + '</p>'; });
            html += '</section>';
        });
        html += '</div></article>';
        view.innerHTML = html;
    }

    /* ---------- 启动 ---------- */
    if (!BANK.length) {
        view.innerHTML = '<div class="q-empty"><div class="icon">📦</div><p>题库为空</p></div>';
        return;
    }
    route();
})();
