/**
 * auto-gen.js — transitions.dev ui-generation 的全站自动接入器
 * （原库 by Jakub Antalík；本文件是接入层，MIT，见仓库 README）
 *
 * 页面无需写任何脚本：引一行 <script src=".../auto-gen.js" defer></script> 即可。
 * 目标选择规则（取第一个命中的）：
 *   1. <main> 里第一个 .article-wrap（博文页）
 *   2. #resume / #works（个人主页——由页面内嵌脚本处理，这里跳过）
 *   3. .page 容器（知识库等）
 * 全局开关：<html> 上加 data-uigen="off" 可整页禁用。
 */
(function () {
    'use strict';
    if (document.documentElement.getAttribute('data-uigen') === 'off') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // 个人主页有自己的串行编排，避免重复播放
    if (location.pathname.endsWith('easin.html')) return;

    const pickTargets = () => {
        const wrap = document.querySelector('main .article-wrap, .article-wrap');
        if (wrap) return [wrap];
        const page = document.querySelector('.page');
        if (page) return [page];
        const kb = document.getElementById('kb-view');
        if (kb) return [kb];
        return [];
    };

    const play = async () => {
        try {
            const { generate } = await import('./ui-generation.js');
            await document.fonts.ready;
            // 再等一帧，让首屏脚本（数字雨等）先完成各自布局
            await new Promise((r) => requestAnimationFrame(() => r()));
            const targets = pickTargets().slice(0, 2); // 最多两个区块，别让等待变煎熬
            for (const el of targets) {
                if (!el || el.offsetParent === null) continue; // 不可见就跳过
                await generate(el, { mode: 'skeleton' }).finished;
            }
        } catch (e) { /* 锦上添花：任何失败安静回退 */ }
    };

    if (document.readyState === 'complete') play();
    else window.addEventListener('load', play);
})();
