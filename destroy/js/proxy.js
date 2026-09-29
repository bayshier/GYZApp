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
     * 每项是一个函数：输入原始网址，返回代理后的完整地址 */
    var PROXIES = [
        // allorigins：最常用的免费 CORS 代理
        function (u) { return 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u); },
        // corsproxy.io：备选
        function (u) { return 'https://corsproxy.io/?url=' + encodeURIComponent(u); },
        // thingproxy：再备选
        function (u) { return 'https://thingproxy.freeboard.io/fetch/' + u; }
    ];

    // 单次抓取超时（毫秒）。公共代理偶尔很慢，超时即换下一个
    var TIMEOUT = 12000;

    /**
     * 补全网址：用户可能只输入 "example.com"
     * @param {string} raw 用户输入
     * @returns {string} 带 https:// 前缀的完整网址
     */
    function normalizeUrl(raw) {
        raw = (raw || '').trim();
        if (!raw) return '';
        // 允许直接输入 "demo" 体验内置关卡
        if (/^demo$/i.test(raw)) return 'demo';
        if (!/^https?:\/\//i.test(raw)) raw = 'https://' + raw;
        return raw;
    }

    /**
     * 带超时的 fetch
     * @param {string} url 目标地址
     * @param {number} ms  超时毫秒数
     * @returns {Promise<Response>}
     */
    function fetchWithTimeout(url, ms) {
        return Promise.race([
            fetch(url),
            new Promise(function (_, reject) {
                setTimeout(function () { reject(new Error('超时')); }, ms);
            })
        ]);
    }

    /**
     * 抓取目标网页的 HTML 源码。
     * 依次尝试代理链上的每一个代理，全部失败则抛错。
     * @param {string} url 已补全的网址
     * @returns {Promise<{html: string, via: string}>}
     */
    async function fetchPageHtml(url) {
        var errors = [];
        for (var i = 0; i < PROXIES.length; i++) {
            var via = PROXIES[i](url);
            try {
                var res = await fetchWithTimeout(via, TIMEOUT);
                if (!res.ok) throw new Error('HTTP ' + res.status);
                var html = await res.text();
                // 基本校验：内容太短或不是 HTML 多半是代理报错页
                if (html && html.length > 200) {
                    return { html: html, via: via };
                }
                throw new Error('内容过短');
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
