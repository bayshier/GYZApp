/* ============================================================
   学习系统 · 意见反馈（静态站方案：mailto 企业邮箱 + 复制邮箱）
   ============================================================ */
(function () {
    'use strict';

    var FEEDBACK_MAIL = 'lanchenyixin@cncfzx.com';
    var TYPES = ['题目有误', '答案争议', '内容建议', '功能异常', '考试资讯', '其他'];
    var picked = '内容建议';

    var css = ''
        + '.qfb-btn{position:fixed;right:18px;bottom:32px;z-index:900;width:52px;height:52px;border-radius:50%;'
        + 'border:none;cursor:pointer;font-size:22px;line-height:1;color:#fff;'
        + 'background:linear-gradient(135deg,var(--brand-light),var(--brand));box-shadow:0 4px 16px rgba(26,43,74,.35);'
        + 'display:flex;align-items:center;justify-content:center;transition:transform .2s,box-shadow .2s;}'
        + '.qfb-btn:active{transform:scale(.92);}'
        + '.qfb-btn span{position:absolute;top:-6px;right:-2px;font-size:10px;background:var(--accent);'
        + 'color:#5a4310;font-weight:800;padding:1px 6px;border-radius:8px;white-space:nowrap;}'
        + '.qfb-mask{position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:1000;'
        + 'display:none;align-items:center;justify-content:center;padding:20px;}'
        + '.qfb-mask.on{display:flex;}'
        + '.qfb-modal{background:var(--card);border-radius:var(--radius);box-shadow:0 12px 48px rgba(15,23,42,.28);'
        + 'width:100%;max-width:420px;padding:24px 22px;max-height:86vh;overflow-y:auto;}'
        + '.qfb-modal h3{font-size:17px;color:var(--brand);margin-bottom:4px;}'
        + '.qfb-sub{font-size:12px;color:var(--text-light);margin-bottom:14px;}'
        + '.qfb-types{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;}'
        + '.qfb-type{font-size:12.5px;font-weight:600;padding:5px 13px;border-radius:14px;cursor:pointer;'
        + 'background:var(--bg);color:var(--text-light);border:1px solid var(--border);transition:all .15s;}'
        + '.qfb-type.on{background:var(--brand);color:#fff;border-color:var(--brand);}'
        + '.qfb-modal textarea{width:100%;min-height:110px;resize:vertical;font-family:inherit;font-size:14px;'
        + 'padding:10px 12px;border:1px solid var(--border);border-radius:8px;color:var(--text);background:#fff;}'
        + '.qfb-modal textarea:focus{outline:none;border-color:var(--brand-light);}'
        + '.qfb-mail{display:flex;align-items:center;gap:8px;margin:12px 0 16px;font-size:12.5px;color:var(--text-light);}'
        + '.qfb-mail b{color:var(--brand);font-family:Menlo,monospace;font-size:12px;}'
        + '.qfb-copy{font-size:11.5px;color:var(--accent);font-weight:700;background:none;border:none;'
        + 'cursor:pointer;text-decoration:underline;padding:0;}'
        + '.qfb-actions{display:flex;gap:10px;}'
        + '.qfb-actions .btn{flex:1;text-align:center;}'
        + '@media (max-width:480px){.qfb-btn{right:12px;bottom:24px;width:46px;height:46px;font-size:19px;}}';

    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    var btn = document.createElement('button');
    btn.className = 'qfb-btn';
    btn.title = '意见反馈';
    btn.innerHTML = '💬<span>反馈</span>';

    var mask = document.createElement('div');
    mask.className = 'qfb-mask';
    mask.innerHTML = ''
        + '<div class="qfb-modal" role="dialog" aria-label="意见反馈">'
        + '<h3>💬 意见反馈</h3>'
        + '<div class="qfb-sub">题目有误、答案争议、功能建议……欢迎指出，我们一起完善学习系统</div>'
        + '<div class="qfb-types">'
        + TYPES.map(function (t) {
            return '<span class="qfb-type' + (t === picked ? ' on' : '') + '" data-t="' + t + '">' + t + '</span>';
        }).join('')
        + '</div>'
        + '<textarea id="qfb-text" placeholder="请描述你遇到的问题或建议（可选，如：第X题答案应为B，因为……）"></textarea>'
        + '<div class="qfb-mail">📮 反馈邮箱 <b>' + FEEDBACK_MAIL + '</b>'
        + '<button class="qfb-copy" id="qfb-copy">复制</button></div>'
        + '<div class="qfb-actions">'
        + '<button class="btn" id="qfb-cancel">取消</button>'
        + '<button class="btn primary" id="qfb-send">📧 打开邮件发送</button>'
        + '</div></div>';

    document.body.appendChild(btn);
    document.body.appendChild(mask);

    function open() { mask.classList.add('on'); }
    function close() { mask.classList.remove('on'); }

    btn.addEventListener('click', open);
    mask.addEventListener('click', function (e) { if (e.target === mask) close(); });
    document.getElementById('qfb-cancel').addEventListener('click', close);

    mask.querySelectorAll('.qfb-type').forEach(function (el) {
        el.addEventListener('click', function () {
            picked = el.dataset.t;
            mask.querySelectorAll('.qfb-type').forEach(function (x) { x.classList.remove('on'); });
            el.classList.add('on');
        });
    });

    document.getElementById('qfb-copy').addEventListener('click', function () {
        var self = this;
        function ok() { self.textContent = '已复制 ✓'; setTimeout(function () { self.textContent = '复制'; }, 1600); }
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(FEEDBACK_MAIL).then(ok, function () { fallback(); });
        } else { fallback(); }
        function fallback() {
            var ta = document.createElement('textarea');
            ta.value = FEEDBACK_MAIL;
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand('copy'); ok(); } catch (e) {}
            document.body.removeChild(ta);
        }
    });

    document.getElementById('qfb-send').addEventListener('click', function () {
        var text = (document.getElementById('qfb-text').value || '').trim();
        var subject = '[股宇宙学习系统·反馈] ' + picked;
        var body = (text ? text + '\n\n' : '')
            + '——\n反馈类型：' + picked + '\n'
            + '页面位置：' + location.href + '\n'
            + '时间：' + new Date().toLocaleString();
        location.href = 'mailto:' + FEEDBACK_MAIL
            + '?subject=' + encodeURIComponent(subject)
            + '&body=' + encodeURIComponent(body);
        close();
    });
})();
