/* ============================================================
   回到顶部 · 长页面快捷返回（zk 学习资料/真题、知识库文章等）
   滚动超过 400px 淡入；与 quiz 页 💬 反馈浮窗自动错位
   ============================================================ */
(function () {
    'use strict';

    var css = ''
        + '.bt-top{position:fixed;right:18px;bottom:32px;z-index:890;width:44px;height:44px;border-radius:50%;'
        + 'border:none;cursor:pointer;font-size:18px;line-height:1;color:#fff;'
        + 'background:linear-gradient(135deg,var(--brand-light,#2d4a7a),var(--brand,#1a2b4a));'
        + 'box-shadow:0 4px 14px rgba(26,43,74,.3);'
        + 'display:flex;align-items:center;justify-content:center;'
        + 'opacity:0;visibility:hidden;transform:translateY(8px);'
        + 'transition:opacity .25s,transform .25s,visibility .25s;}'
        + '.bt-top.on{opacity:1;visibility:visible;transform:translateY(0);}'
        + '.bt-top:active{transform:scale(.92);}'
        + '@media (max-width:480px){.bt-top{right:12px;width:40px;height:40px;font-size:16px;}}';
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    var btn = document.createElement('button');
    btn.className = 'bt-top';
    btn.title = '回到顶部';
    btn.setAttribute('aria-label', '回到顶部');
    btn.innerHTML = '↑';

    /* quiz 页右下角已有 💬 反馈浮窗（52px 高，bottom:32px），错开往上放 */
    function place() {
        var fab = document.querySelector('.qfb-btn');
        btn.style.bottom = fab ? '96px' : '32px';
    }

    btn.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    function ready() {
        document.body.appendChild(btn);
        place();
        /* 反馈浮窗是后加载的，稍后再校一次位置 */
        setTimeout(place, 800);

        var ticking = false;
        window.addEventListener('scroll', function () {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(function () {
                btn.classList.toggle('on', (window.pageYOffset || document.documentElement.scrollTop) > 400);
                ticking = false;
            });
        }, { passive: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ready);
    } else {
        ready();
    }
})();
