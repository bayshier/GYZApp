/* ============================================================
 * proxy.js · 网页抓取层
 * ------------------------------------------------------------
 * 原理：浏览器直接 fetch 别人的网页会被 CORS 拦截（跨域资源共享
 * 限制）。原版 Destroy Any Website 用自己的服务器做代理抓取；
 * 本复刻版部署在 GitHub Pages（纯静态）上，没有后端，所以改用
 * 「公共 CORS 代理链」：依次尝试多个免费代理，谁先用谁。
 *
 * 如果你有自己的服务器，把下面 PROXIES 数组第一项换成你的
 * 自建代理（README 里有 10 行 Node 版代理服务器代码），会更稳定。
 * ============================================================ */

(function () {
    'use strict';

    /* ---------- 公共 CORS 代理链（按顺序尝试） ----------
     * 实测结论（2026.09，国内直连网络）：
     *   · cors.lol   —— 国内可直连，但限流较紧（429 时稍等重试即可）
     *   · codetabs   —— 时好时坏，作二线
     *   · allorigins —— 海外主流，国内直连常超时（挂代理的浏览器可用）
     *   · cors.eu.org—— 兜底，响应不稳定
     * 每项是一个函数：输入原始网址，返回代理后的完整地址 */
    var PROXIES = [
        function (u) { return 'https://api.cors.lol/?url=' + encodeURIComponent(u); },
        function (u) { return 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(u); },
        function (u) { return 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u); },
        function (u) { return 'https://cors.eu.org/' + u; }
    ];

    // 单次抓取超时（毫秒）。失败/超时自动换下一个
    var TIMEOUT = 9000;

    /**
     * 组装最终代理链：若用户在界面里保存过自定义代理，则插到最前。
     * 自定义代理写法用 {url} 作占位符，兼容路径式和查询式：
     *   https://我的服务器:3000/?url={url}
     *   https://我的域名/代理/{url}
     */
    function getProxies() {
        var list = PROXIES.slice();
        var custom = null;
        try { custom = localStorage.getItem('destroy_custom_proxy'); } catch (e) { }
        if (custom && custom.indexOf('{url}') > -1) {
            list.unshift(function (u) { return custom.replace('{url}', encodeURIComponent(u)); });
        }
        return list;
    }

    /** 补全网址：用户可能只输入 "example.com" */
    function normalizeUrl(raw) {
        raw = (raw || '').trim();
        if (!raw) return '';
        if (/^demo$/i.test(raw)) return 'demo';
        if (!/^https?:\/\//i.test(raw)) raw = 'https://' + raw;
        return raw;
    }

    /** 带超时的 fetch */
    function fetchWithTimeout(url, ms) {
        return Promise.race([
            fetch(url),
            new Promise(function (_, reject) {
                setTimeout(function () { reject(new Error('超时')); }, ms);
            })
        ]);
    }

    /** 单个代理抓取：429（限流）自动等 1.5 秒重试一次 */
    async function tryProxy(via) {
        var res = await fetchWithTimeout(via, TIMEOUT);
        if (res.status === 429) {
            await new Promise(function (r) { setTimeout(r, 1500); });
            res = await fetchWithTimeout(via, TIMEOUT);
        }
        if (!res.ok) throw new Error('HTTP ' + res.status);
        var html = await res.text();
        /* 基本校验：内容太短多半是代理报错页 */
        if (!html || html.length < 200) throw new Error('内容过短');
        return html;
    }

    /**
     * 抓取目标网页的 HTML 源码。依次尝试代理链，全部失败则抛错。
     * @returns {Promise<{html: string, via: string}>}
     */
    async function fetchPageHtml(url) {
        var proxies = getProxies();
        var errors = [];
        for (var i = 0; i < proxies.length; i++) {
            var via = proxies[i](url);
            try {
                var html = await tryProxy(via);
                return { html: html, via: via };
            } catch (e) {
                errors.push((i + 1) + '号代理失败: ' + e.message);
            }
        }
        throw new Error('所有代理都抓取失败（' + errors.length + ' 个已尝试）。\n'
            + '公共代理有时限流，稍后再试，或改玩内置演示关卡。');
    }

    /* 挂到全局，供 level.js / game.js 使用 */
    window.DProxy = {
        normalizeUrl: normalizeUrl,
        fetchPageHtml: fetchPageHtml
    };
})();
