/* ============================================================
   股宇宙知识库 - 路由与渲染逻辑
   基于 hash 路由的轻量 SPA，无需框架
   路由格式：
     #/                  → 首页（分类导航）
     #/cat/kline         → 某分类下的文章列表
     #/article/macd      → 某篇文章详情
     #/search?q=均线      → 搜索结果
   ============================================================ */

(function () {
    'use strict';

    var cats = window.KB_CATEGORIES || [];
    var articles = window.KB_ARTICLES || [];

    /* ---------- 工具函数 ---------- */

    // HTML 转义（防注入）
    function esc(str) {
        if (!str) return '';
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // 根据 id 获取分类
    function getCat(id) {
        for (var i = 0; i < cats.length; i++) {
            if (cats[i].id === id) return cats[i];
        }
        return null;
    }

    // 根据 id 获取文章
    function getArticle(id) {
        for (var i = 0; i < articles.length; i++) {
            if (articles[i].id === id) return articles[i];
        }
        return null;
    }

    // 获取某分类下的全部文章
    function getArticlesByCat(catId) {
        return articles.filter(function (a) { return a.category === catId; });
    }

    // 获取同分类的其它文章（用于"相关推荐"）
    function getRelated(article) {
        return articles.filter(function (a) {
            return a.category === article.category && a.id !== article.id;
        });
    }

    /* ---------- 视图渲染 ---------- */

    /* 首页：分类导航 */
    function renderHome() {
        var html = '<div class="kb-search-wrap">'
            + '<input type="text" class="kb-search" id="kb-search-input" '
            + 'placeholder="搜索知识库（如：MACD、市盈率、金叉）..." /></div>';

        // 小白入口：学习路线
        html += '<div class="kb-newbie-banner" onclick="location.hash=\'#/guide\'">'
            + '<div class="kb-newbie-icon">🌱</div>'
            + '<div class="kb-newbie-text">'
            + '<div class="kb-newbie-title">股票小白？从这里开始</div>'
            + '<div class="kb-newbie-desc">完全不懂也没关系，6 步带你从零入门 →</div>'
            + '</div></div>';

        // 财经黄页入口
        html += '<div class="kb-newbie-banner kb-links-banner" onclick="location.hash=\'#/links\'">'
            + '<div class="kb-newbie-icon">🔗</div>'
            + '<div class="kb-newbie-text">'
            + '<div class="kb-newbie-title">财经网址导航</div>'
            + '<div class="kb-newbie-desc">25 个国内外财经网站，一键直达 →</div>'
            + '</div></div>';

        html += '<div class="kb-home-title">选择分类开始学习</div>';
        html += '<div class="kb-cats">';

        cats.forEach(function (cat) {
            var count = getArticlesByCat(cat.id).length;
            html += '<a class="kb-cat-card" href="#/cat/' + cat.id + '">'
                + '<div class="kb-cat-icon">' + cat.icon + '</div>'
                + '<div class="kb-cat-name">' + cat.name + '</div>'
                + '<div class="kb-cat-desc">' + cat.desc + '</div>'
                + '<div class="kb-cat-count">' + count + ' 篇文章</div>'
                + '</a>';
        });

        html += '</div>';

        // 关键词星球（内嵌，分类下、入门推荐上）
        html += buildKeywordSphereHTML();

        // 推荐入门
        html += '<div class="kb-home-title" style="margin-top:24px;">入门推荐</div>';
        var beginners = ['kline-basic', 'ma-intro', 'macd', 'pe'];
        html += '<ul class="kb-list">';
        beginners.forEach(function (id) {
            var a = getArticle(id);
            if (a) {
                html += renderListItem(a);
            }
        });
        html += '</ul>';

        document.getElementById('kb-view').innerHTML = html;
        bindSearch();
        initSphereDrag();
    }

    /* 分类列表页 */
    function renderCatList(catId) {
        var cat = getCat(catId);
        if (!cat) {
            renderNotFound();
            return;
        }
        var list = getArticlesByCat(catId);

        var html = '<div class="kb-section-title">'
            + '<span class="icon">' + cat.icon + '</span>'
            + '<span>' + cat.name + '</span>'
            + '</div>';

        html += '<div class="kb-search-wrap">'
            + '<input type="text" class="kb-search" id="kb-search-input" '
            + 'placeholder="在本知识库中搜索..." /></div>';

        if (list.length === 0) {
            html += '<div class="kb-empty"><div class="icon">📝</div><p>该分类暂无文章</p></div>';
        } else {
            html += '<ul class="kb-list">';
            list.forEach(function (a) {
                html += renderListItem(a);
            });
            html += '</ul>';
        }

        document.getElementById('kb-view').innerHTML = html;
        bindSearch();
    }

    /* 文章列表项（公共片段） */
    function renderListItem(a) {
        return '<li class="kb-list-item" onclick="location.hash=\'#/article/' + a.id + '\'">'
            + '<h3>' + a.title + '<span class="arrow">›</span></h3>'
            + '<p>' + a.summary + '</p>'
            + '</li>';
    }

    /* 文章详情页 */
    function renderArticle(articleId) {
        var a = getArticle(articleId);
        if (!a) {
            renderNotFound();
            return;
        }
        var cat = getCat(a.category);
        var related = getRelated(a);

        var html = '<article class="kb-article">';
        html += '<h1>' + a.title + '</h1>';
        html += '<div class="kb-meta">' + cat.icon + ' ' + cat.name
            + ' · 股宇宙知识库</div>';
        html += '<div class="kb-article-body">' + a.body + '</div>';

        // 标签
        if (a.tags && a.tags.length) {
            html += '<div class="kb-tags">';
            html += '<div class="kb-tags-label">关键词</div>';
            a.tags.forEach(function (tag) {
                html += '<a class="kb-tag" href="#/search/' + encodeURIComponent(tag) + '">#' + tag + '</a>';
            });
            html += '</div>';
        }

        html += '</article>';

        // 同类推荐
        if (related.length) {
            html += '<div class="kb-home-title" style="margin-top:20px;">' + cat.icon + ' 继续学习：' + cat.name + '</div>';
            html += '<ul class="kb-list">';
            related.forEach(function (r) {
                html += renderListItem(r);
            });
            html += '</ul>';
        }

        document.getElementById('kb-view').innerHTML = html;
        // 滚动到顶部
        window.scrollTo(0, 0);
    }

    /* 搜索结果页 */
    function renderSearch(query) {
        query = decodeURIComponent(query || '');
        var html = '<div class="kb-section-title">'
            + '<span class="icon">🔍</span>'
            + '<span>搜索：' + esc(query) + '</span>'
            + '</div>';

        if (!query.trim()) {
            html += '<div class="kb-empty"><div class="icon">⌨️</div><p>请输入搜索关键词</p></div>';
            document.getElementById('kb-view').innerHTML = html;
            return;
        }

        var q = query.toLowerCase();
        var results = articles.filter(function (a) {
            return (a.title && a.title.toLowerCase().indexOf(q) > -1) ||
                (a.summary && a.summary.toLowerCase().indexOf(q) > -1) ||
                (a.tags && a.tags.some(function (t) { return t.toLowerCase().indexOf(q) > -1; }));
        });

        if (results.length === 0) {
            html += '<div class="kb-empty"><div class="icon">🔍</div>'
                + '<p>未找到与「' + esc(query) + '」相关的内容</p>'
                + '<p style="margin-top:8px;">试试：K线、均线、MACD、市盈率、换手率</p></div>';
        } else {
            html += '<p style="color:#7f8c8d;font-size:13px;margin-bottom:12px;">找到 ' + results.length + ' 篇相关文章</p>';
            html += '<ul class="kb-list">';
            results.forEach(function (a) {
                html += renderListItem(a);
            });
            html += '</ul>';
        }

        document.getElementById('kb-view').innerHTML = html;
    }

    /* 小白学习路线 */
    function renderGuide() {
        var steps = [
            { num: '01', icon: '📘', title: '认识股票是什么',
              desc: '先搞懂股票的本质——买股票就是买公司的一部分，分享公司的成长。',
              articleId: 'pe' },
            { num: '02', icon: '📈', title: '看懂K线图',
              desc: 'K线是技术分析的基石，一根线记录了开盘、收盘、最高、最低四个价位。',
              articleId: 'kline-basic' },
            { num: '03', icon: '🕐', title: '搞清交易时间和规则',
              desc: '集合竞价、开盘收盘、T+1交易——这些规则决定你什么时候能买卖。',
              articleId: 'prepost-session' },
            { num: '04', icon: '〰️', title: '学会看趋势：均线',
              desc: '均线帮你判断大方向，顺势而为是投资的第一课。',
              articleId: 'ma-intro' },
            { num: '05', icon: '🎯', title: '掌握一两个核心指标',
              desc: 'MACD看趋势和背离，KDJ找超买超卖——不用学多，够用就好。',
              articleId: 'macd' },
            { num: '06', icon: '🌏', title: '了解不同市场',
              desc: 'A股、港股、美股规则不同，了解差异才能选择适合自己的市场。',
              articleId: 'hk-vs-a-vs-us' }
        ];

        var html = '<div class="kb-guide">';
        html += '<div class="kb-guide-header">'
            + '<div class="kb-guide-emoji">🌱</div>'
            + '<h1>股票小白学习路线</h1>'
            + '<p>完全不懂也没关系，按这个顺序一步步来，6 步建立基础认知。</p>'
            + '</div>';

        html += '<div class="kb-guide-tip">'
            + '<strong>💡 学习建议：</strong>不要着急，每篇花 10 分钟读完。'
            + '先理解概念，再看实战要点。投资是长跑，基础扎实比急着操作重要得多。'
            + '</div>';

        html += '<div class="kb-guide-steps">';
        steps.forEach(function (s, i) {
            var a = getArticle(s.articleId);
            var cat = a ? getCat(a.category) : null;
            html += '<div class="kb-guide-step">'
                + '<div class="kb-guide-step-num">' + s.num + '</div>'
                + '<div class="kb-guide-step-body">'
                + '<div class="kb-guide-step-head">'
                + '<span class="kb-guide-step-icon">' + s.icon + '</span>'
                + '<span class="kb-guide-step-title">' + s.title + '</span>'
                + '</div>'
                + '<p class="kb-guide-step-desc">' + s.desc + '</p>';
            if (a) {
                html += '<a class="kb-guide-step-link" href="#/article/' + a.id + '">'
                    + '开始学习 →</a>';
            }
            html += '</div>';
            if (i < steps.length - 1) {
                html += '<div class="kb-guide-step-arrow">↓</div>';
            }
            html += '</div>';
        });
        html += '</div>';

        html += '<div class="kb-guide-end">'
            + '<div class="kb-guide-end-emoji">🎉</div>'
            + '<h3>恭喜！基础认知已建立</h3>'
            + '<p>完成以上 6 步，你已经超过了大部分散户。<br>接下来可以从首页选择感兴趣的分类，深入学习。</p>'
            + '<a class="kb-guide-end-btn" href="#/">去探索更多知识 →</a>'
            + '</div>';

        html += '</div>';

        document.getElementById('kb-view').innerHTML = html;
        window.scrollTo(0, 0);
    }

    /* 财经网址导航（黄页） */
    function renderLinks() {
        var groups = window.KB_LINKS || [];
        var html = '<div class="kb-section-title"><h2>🔗 财经网址导航</h2>'
            + '<p>精选 25 个国内外财经网站，一键直达</p></div>';

        var total = 0;
        groups.forEach(function (g) {
            total += g.sites.length;
            html += '<div class="kb-links-cat">'
                + '<div class="kb-links-cat-head">'
                + '<span class="kb-links-cat-icon">' + g.catIcon + '</span>'
                + '<span class="kb-links-cat-name">' + g.catName + '</span>'
                + '<span class="kb-links-cat-count">' + g.sites.length + ' 个</span>'
                + '</div>'
                + '<div class="kb-links-cat-desc">' + g.catDesc + '</div>'
                + '<div class="kb-links-grid">';

            g.sites.forEach(function (s) {
                var host = s.url.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
                html += '<div class="kb-link-card" onclick="window.open(\'' + s.url + '\', \'_blank\')">'
                    + '<div class="kb-link-card-head">'
                    + '<span class="kb-link-name">' + s.name + '</span>'
                    + '<span class="kb-link-tag">' + s.tag + '</span>'
                    + '</div>'
                    + '<p class="kb-link-desc">' + s.desc + '</p>'
                    + '<span class="kb-link-host">' + host + ' ↗</span>'
                    + '</div>';
            });

            html += '</div></div>';
        });

        html += '<div class="kb-links-footer">'
            + '共收录 ' + total + ' 个财经网站 · 持续更新中<br>'
            + '<span class="kb-links-note">提示：点击卡片在新标签页打开对方官网</span>'
            + '</div>';

        document.getElementById('kb-view').innerHTML = html;
    }

    /* 关键词星球：生成球体 HTML（首页内嵌 & 星球页共用） */
    // 缓存关键词数据，供每帧计算 z 坐标用
    var KW_SPHERE_DATA = null;

    function buildKeywordSphereHTML() {
        var tagCount = {};
        articles.forEach(function (a) {
            (a.tags || []).forEach(function (t) {
                tagCount[t] = (tagCount[t] || 0) + 1;
            });
        });
        var keywords = Object.keys(tagCount).map(function (k) {
            return { word: k, count: tagCount[k] };
        }).sort(function (a, b) { return b.count - a.count; });

        // 缓存：每个词的初始球面坐标，供每帧旋转计算用
        KW_SPHERE_DATA = keywords.map(function (kw, i) {
            var n = keywords.length;
            var phi = Math.acos(-1 + (2 * i) / n);
            var theta = Math.sqrt(n * Math.PI) * phi;
            var r = 38;
            return {
                word: kw.word,
                count: kw.count,
                // 统一用 vmin 单位，保证球体在任何宽高比下都是正圆（不压扁）
                x: (r * Math.cos(theta) * Math.sin(phi)),   // 存数值，渲染时拼 vmin
                y: (r * Math.sin(theta) * Math.sin(phi)),
                z: (r * Math.cos(phi))
            };
        });

        var html = '<div class="kb-kw-section-title">🔮 关键词星球</div>';
        html += '<div class="kb-kw-scene" id="kb-kw-scene">'
            + '<div class="kb-kw-sphere" id="kb-kw-sphere">';

        var colors = ['#00d4ff', '#7b61ff', '#f0c75e', '#2ecc71', '#e94560'];
        KW_SPHERE_DATA.forEach(function (kw, i) {
            var size = 13 + kw.count * 4;
            var color = colors[kw.count % colors.length] || colors[0];
            html += '<a class="kb-kw-item" '
                + 'data-i="' + i + '" '
                + 'style="color:' + color + ';font-size:' + size + 'px" '
                + 'href="#/search/' + encodeURIComponent(kw.word) + '" '
                + 'title="' + kw.word + '（' + kw.count + '篇）">'
                + kw.word
                + '</a>';
        });

        html += '</div></div>';
        html += '<div class="kb-kw-hint">💡 拖动旋转 · 点击关键词探索 · 共 ' + keywords.length + ' 个知识点</div>';
        return html;
    }

    /* 关键词星球页（独立全屏版，保留路由） */
    function renderKeywordWall() {
        var html = '<div class="kb-kw-header">'
            + '<h1>🔮 关键词星球</h1>'
            + '<p>点击任意关键词探索相关知识 · 拖动星球可旋转</p>'
            + '</div>';

        html += buildKeywordSphereHTML();

        html += '<div class="kb-kw-back"><a href="#/">← 返回知识库首页</a></div>';

        document.getElementById('kb-view').innerHTML = html;
        initSphereDrag();
    }

    /* 球体拖拽旋转（性能优化版） */
    function initSphereDrag() {
        var scene = document.getElementById('kb-kw-scene');
        var sphere = document.getElementById('kb-kw-sphere');
        if (!scene || !sphere || !KW_SPHERE_DATA) return;

        var items = sphere.querySelectorAll('.kb-kw-item');
        var rotX = -15, rotY = 0;
        var autoSpeed = 0.12;
        var dragging = false;
        var lastX = 0, lastY = 0;
        var velocityX = 0, velocityY = 0;
        var rafId = null;
        var inViewport = true;

        // 预计算 sin/cos，每帧复用
        // 纯 2D 投影方案：文字永远不旋转（只用 translate 定位），从根本上杜绝镜像
        // z 坐标用于控制字号缩放和透明度，模拟前后层次立体感
        function updatePositions() {
            var radX = rotX * Math.PI / 180;
            var radY = rotY * Math.PI / 180;
            var sx = Math.sin(radX), cx = Math.cos(radX);
            var sy = Math.sin(radY), cy = Math.cos(radY);

            for (var i = 0; i < KW_SPHERE_DATA.length; i++) {
                var d = KW_SPHERE_DATA[i];
                // 绕 Y 轴旋转
                var x1 = d.x * cy + d.z * sy;
                var z1 = -d.x * sy + d.z * cy;
                // 绕 X 轴旋转
                var y1 = d.y * cx - z1 * sx;
                var z2 = d.y * sx + z1 * cx;

                var el = items[i];
                // z 归一化到 0~1（用于缩放和透明度），r=38
                var depth = (z2 + 38) / 76;  // z范围-38~38
                // 越靠前（z大）字越大越清晰，越靠后字越小越淡
                var scale = 0.6 + depth * 0.5;       // 0.6 ~ 1.1
                var opacity = 0.3 + depth * 0.7;      // 0.3 ~ 1.0
                // 纯 2D 定位：只 translate，不 rotate，文字方向永远不变
                // x/y 统一用 vmin，保证球体在任意宽高比下都是正圆
                el.style.transform =
                    'translate(' + x1.toFixed(1) + 'vmin,' + y1.toFixed(1) + 'vmin)' +
                    ' translate(-50%,-50%)' +
                    ' scale(' + scale.toFixed(2) + ')';
                el.style.opacity = opacity.toFixed(2);
                el.style.zIndex = Math.round(depth * 100);
            }
        }

        function tick() {
            if (!inViewport) { rafId = null; return; }
            if (!dragging) {
                rotY += autoSpeed + velocityY;
                rotX += velocityX;
                velocityY *= 0.92;
                velocityX *= 0.92;
                if (rotX > 30) rotX = 30;
                if (rotX < -60) rotX = -60;
            }
            // 父容器不再旋转（改为子元素各自旋转定位），保持原点稳定
            updatePositions();
            rafId = requestAnimationFrame(tick);
        }

        // 可视区域检测：离开视口暂停旋转，节省性能
        if (window.IntersectionObserver) {
            var io = new IntersectionObserver(function (entries) {
                inViewport = entries[0].isIntersecting;
                if (inViewport && !rafId) tick();
            }, { threshold: 0 });
            io.observe(scene);
        }

        // 鼠标/触摸处理：拖拽时才绑定 move，松手即解绑（避免常驻全局监听拖累滚动）
        function onMove(e) {
            if (!dragging) return;
            var x = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0].clientX);
            var y = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0].clientY);
            var dx = x - lastX, dy = y - lastY;
            rotY += dx * 0.5;
            rotX -= dy * 0.5;
            if (rotX > 30) rotX = 30;
            if (rotX < -60) rotX = -60;
            velocityY = dx * 0.5;
            velocityX = -dy * 0.5;
            lastX = x; lastY = y;
            if (e.cancelable) e.preventDefault();
        }
        function onUp() {
            dragging = false;
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('mouseup', onUp);
            document.removeEventListener('touchend', onUp);
        }
        function onDown(e) {
            dragging = true;
            var x = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0].clientX);
            var y = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0].clientY);
            lastX = x; lastY = y; velocityX = 0; velocityY = 0;
            document.addEventListener('mousemove', onMove);
            document.addEventListener('touchmove', onMove, { passive: false });
            document.addEventListener('mouseup', onUp);
            document.addEventListener('touchend', onUp);
            if (e.cancelable) e.preventDefault();
        }

        scene.addEventListener('mousedown', onDown);
        scene.addEventListener('touchstart', onDown, { passive: false });

        // 初始定位 + 启动
        updatePositions();
        tick();
    }

    /* 404 */
    function renderNotFound() {
        document.getElementById('kb-view').innerHTML =
            '<div class="kb-empty"><div class="icon">🤔</div>'
            + '<p>找不到该内容</p>'
            + '<p style="margin-top:8px;"><a href="#/" style="color:#d4a644;">返回首页</a></p></div>';
    }

    /* ---------- 搜索绑定 ---------- */
    function bindSearch() {
        var input = document.getElementById('kb-search-input');
        if (!input) return;
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.keyCode === 13) {
                var val = input.value.trim();
                if (val) {
                    location.hash = '#/search/' + encodeURIComponent(val);
                }
            }
        });
    }

    /* ---------- 返回按钮显隐 ---------- */
    function updateBackBtn() {
        var btn = document.getElementById('kb-back-btn');
        if (!btn) return;
        var hash = location.hash;
        // 首页隐藏，其余页面显示
        btn.style.display = (hash === '' || hash === '#/' || hash === '#') ? 'none' : 'inline-block';
    }

    /* ---------- 路由分发 ---------- */
    function router() {
        var hash = location.hash.replace(/^#\/?/, ''); // 去掉 #/ 前缀
        updateBackBtn();

        if (hash === '' || hash === '/') {
            renderHome();
        } else if (hash === 'guide') {
            renderGuide();
        } else if (hash === 'links') {
            renderLinks();
        } else if (hash === 'keywords') {
            renderKeywordWall();
        } else if (hash.indexOf('cat/') === 0) {
            var catId = hash.substring(4);
            renderCatList(catId);
        } else if (hash.indexOf('article/') === 0) {
            var articleId = hash.substring(8);
            renderArticle(articleId);
        } else if (hash.indexOf('search/') === 0) {
            var query = hash.substring(7);
            renderSearch(query);
        } else {
            renderNotFound();
        }
    }

    /* ---------- 初始化 ---------- */
    function init() {
        var btn = document.getElementById('kb-back-btn');
        if (btn) {
            btn.addEventListener('click', function () {
                // 优先返回上一页，无历史则回首页
                if (window.history.length > 1) {
                    window.history.back();
                } else {
                    location.hash = '#/';
                }
            });
        }
        window.addEventListener('hashchange', router);
        router();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
