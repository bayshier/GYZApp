/* ============================================================
   股宇宙知识库 - 内容数据源
   五大模块：K线分时 / 均线MA / 技术指标 / 基本面盘口 / 港美股
   每篇文章：id / 分类 / 标题 / 摘要 / 正文(HTML) / 标签
   图解采用内联 SVG，零图片依赖
   ============================================================ */

/* ---------- 五大分类 ---------- */
var KB_CATEGORIES = [
    {
        id: 'kline',
        name: 'K线与分时图',
        icon: '📈',
        desc: '看懂每一根K线与分时走势的基础'
    },
    {
        id: 'ma',
        name: '均线系统 MA',
        icon: '〰️',
        desc: '趋势方向、支撑压力、金叉死叉'
    },
    {
        id: 'indicator',
        name: '技术指标',
        icon: '🎯',
        desc: 'MACD / KDJ / RSI / BOLL 等买卖信号'
    },
    {
        id: 'fundamental',
        name: '基本面与盘口',
        icon: '📊',
        desc: 'PE/PB/ROE 与盘口数据解读'
    },
    {
        id: 'hkus',
        name: '港美股市场',
        icon: '🌏',
        desc: '交易规则、市场结构与中概股'
    }
];

/* ---------- SVG 图解库 ---------- */
var KB_SVG = {
    /* K线解剖图 */
    klineAnatomy: '<svg viewBox="0 0 300 240" width="300" height="240" xmlns="http://www.w3.org/2000/svg">'
        + '<text x="150" y="18" text-anchor="middle" font-size="12" fill="#1a2b4a" font-weight="bold">阳线（红）与阴线（绿）</text>'
        /* 阳线 */
        + '<line x1="80" y1="40" x2="80" y2="80" stroke="#e74c3c" stroke-width="2"/>'   /* 上影 */
        + '<rect x="65" y="80" width="30" height="70" fill="#e74c3c" stroke="#e74c3c"/>' /* 实体 */
        + '<line x1="80" y1="150" x2="80" y2="185" stroke="#e74c3c" stroke-width="2"/>' /* 下影 */
        + '<text x="105" y="48" font-size="10" fill="#e74c3c">最高价</text>'
        + '<text x="105" y="88" font-size="10" fill="#e74c3c">收盘价(上)</text>'
        + '<text x="105" y="140" font-size="10" fill="#e74c3c">开盘价(下)</text>'
        + '<text x="105" y="185" font-size="10" fill="#e74c3c">最低价</text>'
        /* 阴线 */
        + '<line x1="210" y1="45" x2="210" y2="78" stroke="#2ecc71" stroke-width="2"/>'
        + '<rect x="195" y="78" width="30" height="68" fill="#2ecc71" fill-opacity="0.25" stroke="#2ecc71"/>' /* 空心 */
        + '<line x1="210" y1="146" x2="210" y2="190" stroke="#2ecc71" stroke-width="2"/>'
        + '<text x="150" y="218" text-anchor="middle" font-size="10" fill="#7f8c8d">影线表示最高/最低，实体表示开/收盘</text>'
        + '</svg>',

    /* 常见 K 线形态 */
    klinePatterns: '<svg viewBox="0 0 320 160" width="320" height="160" xmlns="http://www.w3.org/2000/svg">'
        + '<text x="160" y="16" text-anchor="middle" font-size="12" fill="#1a2b4a" font-weight="bold">常见单根K线形态</text>'
        /* 大阳 */
        + '<rect x="40" y="50" width="20" height="60" fill="#e74c3c"/><line x1="50" y1="42" x2="50" y2="118" stroke="#e74c3c" stroke-width="1.5"/>'
        + '<text x="50" y="138" text-anchor="middle" font-size="10" fill="#555">大阳线</text>'
        /* 大阴 */
        + '<rect x="100" y="50" width="20" height="60" fill="#fff" stroke="#2ecc71" stroke-width="1.5"/><line x1="110" y1="42" x2="110" y2="118" stroke="#2ecc71" stroke-width="1.5"/>'
        + '<text x="110" y="138" text-anchor="middle" font-size="10" fill="#555">大阴线</text>'
        /* 十字星 */
        + '<line x1="170" y1="45" x2="170" y2="115" stroke="#1a2b4a" stroke-width="1.5"/><rect x="166" y="77" width="8" height="8" fill="#1a2b4a"/>'
        + '<text x="170" y="138" text-anchor="middle" font-size="10" fill="#555">十字星</text>'
        /* 锤子线 */
        + '<rect x="226" y="50" width="12" height="25" fill="#e74c3c"/><line x1="232" y1="45" x2="232" y2="55" stroke="#e74c3c" stroke-width="1.5"/><line x1="232" y1="75" x2="232" y2="115" stroke="#e74c3c" stroke-width="1.5"/>'
        + '<text x="232" y="138" text-anchor="middle" font-size="10" fill="#555">锤子线</text>'
        /* T字线 */
        + '<line x1="290" y1="52" x2="290" y2="60" stroke="#1a2b4a" stroke-width="1.5"/><rect x="286" y="52" width="8" height="6" fill="#1a2b4a"/><line x1="290" y1="58" x2="290" y2="115" stroke="#1a2b4a" stroke-width="1.5"/>'
        + '<text x="290" y="138" text-anchor="middle" font-size="10" fill="#555">T字线</text>'
        + '</svg>',

    /* 分时图 */
    timeline: '<svg viewBox="0 0 300 160" width="300" height="160" xmlns="http://www.w3.org/2000/svg">'
        + '<text x="150" y="16" text-anchor="middle" font-size="12" fill="#1a2b4a" font-weight="bold">分时图：白线与黄线</text>'
        + '<line x1="20" y1="80" x2="280" y2="80" stroke="#ddd" stroke-width="1" stroke-dasharray="4,3"/>' /* 昨收 */
        + '<text x="282" y="83" font-size="8" fill="#aaa">昨收</text>'
        /* 白线（即时价）锯齿 */
        + '<polyline points="20,90 50,70 80,85 110,55 140,72 170,45 200,60 230,40 260,50 280,48" fill="none" stroke="#1a6ec2" stroke-width="1.8"/>'
        /* 黄线（均价）平滑 */
        + '<polyline points="20,90 50,82 80,80 110,70 140,68 170,60 200,56 230,52 260,50 280,49" fill="none" stroke="#d4a644" stroke-width="1.8"/>'
        + '<text x="120" y="120" font-size="10" fill="#1a6ec2">白线：即时成交价</text>'
        + '<text x="120" y="135" font-size="10" fill="#d4a644">黄线：当日均价</text>'
        + '<text x="120" y="150" font-size="9" fill="#aaa">白线在黄线上方→当日买入多数盈利</text>'
        + '</svg>',

    /* 均线多头排列 */
    maBullish: '<svg viewBox="0 0 300 160" width="300" height="160" xmlns="http://www.w3.org/2000/svg">'
        + '<text x="150" y="16" text-anchor="middle" font-size="12" fill="#1a2b4a" font-weight="bold">均线多头排列（上升趋势）</text>'
        + '<polyline points="20,120 80,100 140,82 200,65 280,45" fill="none" stroke="#e74c3c" stroke-width="1.8"/>' /* MA5 红 最上 */
        + '<polyline points="20,128 80,112 140,95 200,78 280,60" fill="none" stroke="#d4a644" stroke-width="1.8"/>' /* MA10 金 */
        + '<polyline points="20,135 80,122 140,108 200,92 280,78" fill="none" stroke="#1a6ec2" stroke-width="1.8"/>' /* MA20 蓝 */
        + '<polyline points="20,142 80,132 140,120 200,108 280,95" fill="none" stroke="#9b59b6" stroke-width="1.8"/>' /* MA60 紫 最下 */
        + '<text x="285" y="43" font-size="9" fill="#e74c3c">MA5</text>'
        + '<text x="285" y="58" font-size="9" fill="#d4a644">MA10</text>'
        + '<text x="285" y="76" font-size="9" fill="#1a6ec2">MA20</text>'
        + '<text x="285" y="93" font-size="9" fill="#9b59b6">MA60</text>'
        + '<text x="150" y="148" text-anchor="middle" font-size="10" fill="#7f8c8d">短期线在上、长期线在下→多头排列</text>'
        + '</svg>',

    /* 金叉死叉 */
    maCross: '<svg viewBox="0 0 300 150" width="300" height="150" xmlns="http://www.w3.org/2000/svg">'
        + '<text x="150" y="16" text-anchor="middle" font-size="12" fill="#1a2b4a" font-weight="bold">金叉与死叉</text>'
        /* 金叉 */
        + '<circle cx="80" cy="85" r="4" fill="#e74c3c"/>'
        + '<polyline points="20,100 80,85 140,60" fill="none" stroke="#e74c3c" stroke-width="1.8"/>' /* 短期上穿 */
        + '<polyline points="20,70 80,85 140,80" fill="none" stroke="#1a6ec2" stroke-width="1.8"/>' /* 长期 */
        + '<text x="80" y="110" text-anchor="middle" font-size="10" fill="#e74c3c" font-weight="bold">金叉(买入)</text>'
        /* 死叉 */
        + '<circle cx="230" cy="60" r="4" fill="#2ecc71"/>'
        + '<polyline points="170,40 230,60 280,95" fill="none" stroke="#e74c3c" stroke-width="1.8"/>' /* 短期下穿 */
        + '<polyline points="170,75 230,60 280,70" fill="none" stroke="#1a6ec2" stroke-width="1.8"/>'
        + '<text x="230" y="110" text-anchor="middle" font-size="10" fill="#2ecc71" font-weight="bold">死叉(卖出)</text>'
        + '</svg>',

    /* MACD */
    macd: '<svg viewBox="0 0 300 160" width="300" height="160" xmlns="http://www.w3.org/2000/svg">'
        + '<text x="150" y="16" text-anchor="middle" font-size="12" fill="#1a2b4a" font-weight="bold">MACD：DIF / DEA / 红绿柱</text>'
        + '<line x1="20" y1="80" x2="280" y2="80" stroke="#ccc" stroke-width="1"/>' /* 零轴 */
        + '<text x="282" y="83" font-size="8" fill="#aaa">0</text>'
        /* 红柱(零轴上) */
        + '<rect x="40" y="62" width="8" height="18" fill="#e74c3c"/><rect x="52" y="58" width="8" height="22" fill="#e74c3c"/><rect x="64" y="55" width="8" height="25" fill="#e74c3c"/><rect x="76" y="60" width="8" height="20" fill="#e74c3c"/>'
        /* 绿柱(零轴下) */
        + '<rect x="120" y="80" width="8" height="15" fill="#2ecc71"/><rect x="132" y="80" width="8" height="22" fill="#2ecc71"/><rect x="144" y="80" width="8" height="18" fill="#2ecc71"/><rect x="156" y="80" width="8" height="10" fill="#2ecc71"/>'
        /* DIF 线 */
        + '<polyline points="20,70 60,45 100,58 140,95 180,105 220,88 280,70" fill="none" stroke="#1a6ec2" stroke-width="1.8"/>'
        /* DEA 线 */
        + '<polyline points="20,78 60,60 100,55 140,80 180,98 220,95 280,78" fill="none" stroke="#d4a644" stroke-width="1.8"/>'
        + '<text x="100" y="145" font-size="9" fill="#1a6ec2">DIF(快线)</text>'
        + '<text x="170" y="145" font-size="9" fill="#d4a644">DEA(慢线)</text>'
        + '<text x="220" y="145" font-size="9" fill="#e74c3c">红柱=多头</text>'
        + '</svg>',

    /* KDJ */
    kdj: '<svg viewBox="0 0 300 160" width="300" height="160" xmlns="http://www.w3.org/2000/svg">'
        + '<text x="150" y="16" text-anchor="middle" font-size="12" fill="#1a2b4a" font-weight="bold">KDJ 超买超卖区间</text>'
        + '<line x1="20" y1="35" x2="280" y2="35" stroke="#e74c3c" stroke-width="1" stroke-dasharray="4,3"/>' /* 80线 */
        + '<text x="22" y="31" font-size="9" fill="#e74c3c">80 超买区</text>'
        + '<line x1="20" y1="125" x2="280" y2="125" stroke="#2ecc71" stroke-width="1" stroke-dasharray="4,3"/>' /* 20线 */
        + '<text x="22" y="138" font-size="9" fill="#2ecc71">20 超卖区</text>'
        + '<polyline points="20,60 60,40 100,50 140,30 180,55 220,80 280,100" fill="none" stroke="#1a6ec2" stroke-width="1.8"/>' /* K */
        + '<polyline points="20,68 60,55 100,58 140,45 180,62 220,78 280,95" fill="none" stroke="#d4a644" stroke-width="1.8"/>' /* D */
        + '<polyline points="20,50 60,20 100,60 140,15 180,80 220,95 280,110" fill="none" stroke="#9b59b6" stroke-width="1.5"/>' /* J 波动大 */
        + '<text x="250" y="55" font-size="9" fill="#1a6ec2">K</text><text x="250" y="68" font-size="9" fill="#d4a644">D</text><text x="250" y="30" font-size="9" fill="#9b59b6">J</text>'
        + '</svg>',

    /* 布林带 */
    boll: '<svg viewBox="0 0 300 160" width="300" height="160" xmlns="http://www.w3.org/2000/svg">'
        + '<text x="150" y="16" text-anchor="middle" font-size="12" fill="#1a2b4a" font-weight="bold">布林带 BOLL：上中下轨</text>'
        + '<polyline points="20,35 80,45 140,38 200,55 280,48" fill="none" stroke="#e74c3c" stroke-width="1.8"/>' /* 上轨 */
        + '<polyline points="20,80 80,82 140,78 200,85 280,80" fill="none" stroke="#1a6ec2" stroke-width="1.8"/>' /* 中轨(MA20) */
        + '<polyline points="20,125 80,118 140,122 200,112 280,118" fill="none" stroke="#2ecc71" stroke-width="1.8"/>' /* 下轨 */
        /* 价格K线 */
        + '<rect x="95" y="60" width="10" height="30" fill="#e74c3c"/><rect x="145" y="95" width="10" height="22" fill="#fff" stroke="#2ecc71"/><rect x="195" y="55" width="10" height="28" fill="#e74c3c"/>'
        + '<text x="285" y="46" font-size="9" fill="#e74c3c">上轨(压力)</text>'
        + '<text x="285" y="82" font-size="9" fill="#1a6ec2">中轨(中枢)</text>'
        + '<text x="285" y="120" font-size="9" fill="#2ecc71">下轨(支撑)</text>'
        + '<text x="150" y="150" text-anchor="middle" font-size="9" fill="#7f8c8d">通道收口→变盘临近</text>'
        + '</svg>'
};

/* ---------- 全部文章 ---------- */
var KB_ARTICLES = [
/* ====================================================================
   一、K线与分时图
   ==================================================================== */
{
    id: 'kline-basic',
    category: 'kline',
    title: 'K线的构成：阳线、阴线、实体与影线',
    summary: '一根K线记录了一段时间内的开盘、收盘、最高、最低四个价位，是技术分析的基石。',
    tags: ['K线', '阳线', '阴线', '开盘价', '收盘价'],
    body:
    '<h2>什么是K线</h2>'
    + '<p>K线（蜡烛图）由日本人本间宗久发明，是记录价格走势的最常用图形。每一根K线包含<strong>四个关键价位</strong>：开盘价、收盘价、最高价、最低价。</p>'

    + '<h2>阳线与阴线（A股惯例：红涨绿跌）</h2>'
    + '<ul>'
    + '<li><strong class="up">阳线（红色）</strong>：收盘价 <strong>高于</strong> 开盘价，表示这段时间<strong>上涨</strong>。实体的下边是开盘价，上边是收盘价。</li>'
    + '<li><strong class="down">阴线（绿色）</strong>：收盘价 <strong>低于</strong> 开盘价，表示这段时间<strong>下跌</strong>。实体的上边是开盘价，下边是收盘价。</li>'
    + '</ul>'
    + '<figure class="kb-figure">' + KB_SVG.klineAnatomy + '<figcaption>阳线与阴线对比</figcaption></figure>'

    + '<h2>实体与影线</h2>'
    + '<ul>'
    + '<li><strong>实体</strong>：开盘价与收盘价之间的矩形部分，代表主要的价格区间。实体越长，多空力量越悬殊。</li>'
    + '<li><strong>上影线</strong>：实体上方延伸到最高价的细线，表示价格曾冲高但被打回，<strong>上影越长，上方压力越大</strong>。</li>'
    + '<li><strong>下影线</strong>：实体下方延伸到最低价的细线，表示价格曾下探但被拉回，<strong>下影越长，下方支撑越强</strong>。</li>'
    + '</ul>'

    + '<h2>K线周期</h2>'
    + '<p>根据统计周期不同，K线分为<strong>分时、日K、周K、月K、分钟K</strong>等。日K反映一天走势，周K/月K用于判断中长期趋势，时间越长，信号越可靠。</p>'

    + '<div class="kb-tip"><strong>实战要点：</strong>单根K线只反映一个时间段的力量对比，必须结合<strong>位置</strong>（高位/低位）和<strong>成交量</strong>综合判断。同样是十字星，出现在高位和低位含义截然相反。</div>'
},

{
    id: 'kline-patterns',
    category: 'kline',
    title: '常见K线形态：十字星、锤子线、吞没形态',
    summary: '通过单根或多根K线的组合，判断短期多空力量转折，寻找买卖信号。',
    tags: ['K线形态', '十字星', '锤子线', '吞没', '反转'],
    body:
    '<h2>单根K线形态</h2>'
    + '<figure class="kb-figure">' + KB_SVG.klinePatterns + '<figcaption>常见单根K线</figcaption></figure>'
    + '<ul>'
    + '<li><strong>大阳线/大阴线</strong>：实体很长，几乎没有影线，表示一方力量绝对占优。低位大阳线常是<strong>启动信号</strong>，高位大阴线需警惕。</li>'
    + '<li><strong>十字星</strong>：开盘价≈收盘价，实体极小形如"十"字。表示多空势均力敌、犹豫不决。<strong>高位十字星</strong>是见顶预警，<strong>低位十字星</strong>可能是见底信号。</li>'
    + '<li><strong>锤子线</strong>：下影线很长（≥实体2倍），实体很小且位于顶部。出现在<strong>下跌末期</strong>，是潜在反转向上信号（下方有承接）。</li>'
    + '<li><strong>上吊线</strong>：形态同锤子线，但出现在<strong>上涨末期</strong>高位，是潜在反转向下预警。</li>'
    + '<li><strong>T字线 / 倒T字</strong>：T字（开盘=收盘=最高，只有下影）显示下方支撑极强；倒T字（只有上影）显示上方压力重。</li>'
    + '</ul>'

    + '<h2>两根K线组合：吞没形态</h2>'
    + '<ul>'
    + '<li><strong>看涨吞没（阳包阴）</strong>：一根大阳线<strong>完全包住</strong>前一根阴线实体。出现在下跌末期，多方强力反转。</li>'
    + '<li><strong>看跌吞没（阴包阳）</strong>：一根大阴线完全包住前一根阳线实体。出现在上涨末期，空方强力反转。</li>'
    + '</ul>'

    + '<h2>三根K线组合：早晨之星与黄昏之星</h2>'
    + '<ul>'
    + '<li><strong class="up">早晨之星</strong>（底部反转）：①大阴线 → ②小实体/十字星（跳空更佳）→ ③大阳线收回。三根组合预示见底回升。</li>'
    + '<li><strong class="down">黄昏之星</strong>（顶部反转）：①大阳线 → ②小实体/十字星 → ③大阴线回落。预示见顶下跌。</li>'
    + '</ul>'

    + '<div class="kb-warn"><strong>注意：</strong>K线形态是<strong>概率信号</strong>而非确定性信号，必须结合成交量验证。形态配合放量，有效性更高。</div>'
},

{
    id: 'timeline',
    category: 'kline',
    title: '分时图详解：白线、黄线与成交量',
    summary: '分时图反映当日实时走势，白线是即时价，黄线是均价线，是盯盘和判断当日强弱的核心。',
    tags: ['分时图', '白线', '黄线', '均价线', '成交量'],
    body:
    '<h2>分时图的两条线</h2>'
    + '<figure class="kb-figure">' + KB_SVG.timeline + '<figcaption>白线（即时价）与黄线（均价）</figcaption></figure>'
    + '<ul>'
    + '<li><strong>白色线</strong>：股票<strong>每一分钟的即时成交价</strong>连线，反映价格实时波动。A股分时图横轴是交易时间（9:30-11:30, 13:00-15:00）。</li>'
    + '<li><strong>黄色线</strong>：当日<strong>成交均价线</strong>，即从开盘到当前的总成交额÷总成交量。代表当日市场的<strong>平均持仓成本</strong>。</li>'
    + '<li><strong>参考线（虚线）</strong>：通常是<strong>昨日收盘价</strong>，白线在其上为当日上涨，在其下为下跌。</li>'
    + '</ul>'

    + '<h2>白线与黄线的关系</h2>'
    + '<ul>'
    + '<li><strong>白线在黄线上方</strong>：当前价高于均价，当日买入者<strong>多数浮盈</strong>，多头占优。</li>'
    + '<li><strong>白线在黄线下方</strong>：当前价低于均价，当日买入者<strong>多数浮亏</strong>，空头占优。</li>'
    + '<li><strong>白线向黄线回归</strong>：价格偏离均价过远时，常有向黄线靠拢的趋势（均价的"引力"作用）。</li>'
    + '</ul>'

    + '<h2>分时图下方的成交量柱</h2>'
    + '<p>分时图下方每一根竖条代表<strong>一分钟的成交量</strong>。红柱表示该分钟上涨成交，绿柱表示下跌成交。</p>'
    + '<ul>'
    + '<li><strong>放量上涨</strong>：白线上行 + 成交量柱明显放大，量价配合，涨势较真实。</li>'
    + '<li><strong>缩量上涨</strong>：白线上行但量能不足，上涨可能乏力。</li>'
    + '<li><strong>放量下跌</strong>：白线下行 + 量能放大，抛压较重，需警惕。</li>'
    + '</ul>'

    + '<div class="kb-tip"><strong>盯盘技巧：</strong>尾盘（14:30后）白线持续站在黄线上方且回踩不破黄线，往往预示次日偏强；反之尾盘跌破黄线且无力收回，次日偏弱概率增大。</div>'
},

{
    id: 'support-resistance',
    category: 'kline',
    title: '支撑位与压力位：在哪里买卖',
    summary: '支撑位是价格下跌时容易止跌的价位，压力位是上涨时容易遇阻的价位，是制定买卖计划的基础。',
    tags: ['支撑位', '压力位', '阻力位', '趋势线'],
    body:
    '<h2>什么是支撑与压力</h2>'
    + '<ul>'
    + '<li><strong>支撑位（支撑线）</strong>：价格下跌到某个价位时，买方力量增强、卖方减弱，价格<strong>容易止跌回升</strong>的位置。形象地说，像地板托住价格。</li>'
    + '<li><strong>压力位（阻力位）</strong>：价格上涨到某个价位时，卖方力量增强、买方减弱，价格<strong>容易遇阻回落</strong>的位置。形象地说，像天花板压住价格。</li>'
    + '</ul>'

    + '<h2>如何寻找支撑压力位</h2>'
    + '<ol>'
    + '<li><strong>前期高点和低点</strong>：历史的高点常成为未来上涨的压力，历史低点常成为下跌的支撑。</li>'
    + '<li><strong>均线</strong>：MA20、MA60 等均线在上升趋势中常起支撑作用，下降趋势中起压力作用。</li>'
    + '<li><strong>整数关口</strong>：如10元、50元、100元等心理价位，常有支撑压力作用。</li>'
    + '<li><strong>缺口</strong>：跳空缺口附近常形成支撑或压力。</li>'
    + '<li><strong>成交密集区</strong>：价格长时间盘整的区域，积累了大量筹码，突破后角色互换。</li>'
    + '</ol>'

    + '<h2>角色互换原则</h2>'
    + '<p>这是一个重要规律：<strong>压力位被有效突破后，会转变为新的支撑位</strong>；<strong>支撑位被有效跌破后，会转变为新的压力位</strong>。这在制定交易计划时非常实用。</p>'

    + '<div class="kb-tip"><strong>实战应用：</strong>不要在压力位正下方追高买入，不要在支撑位正上方恐慌卖出。可在<strong>支撑位附近</strong>寻找买入机会，在<strong>压力位附近</strong>考虑减仓，并设好止损。</div>'
},

{
    id: 'prepost-session',
    category: 'kline',
    title: '盘前盘后：集合竞价与交易时段',
    summary: 'A股每个交易日从9:15集合竞价开始，盘前盘后的价格发现机制影响开盘价和收盘价，是每个交易者必懂的基础。',
    tags: ['盘前', '盘后', '集合竞价', '开盘价', '收盘价', '交易时段'],
    body:
    '<h2>A股完整交易时间表</h2>'
    + '<table style="width:100%;border-collapse:collapse;font-size:13px;margin:12px 0;">'
    + '<tr style="background:#1a2b4a;color:#fff;"><th style="padding:8px;border:1px solid #ddd;">时段</th><th style="padding:8px;border:1px solid #ddd;">时间</th><th style="padding:8px;border:1px solid #ddd;">说明</th></tr>'
    + '<tr><td style="padding:8px;border:1px solid #ddd;"><strong>盘前集合竞价</strong></td><td style="padding:8px;border:1px solid #ddd;">9:15 — 9:25</td><td style="padding:8px;border:1px solid #ddd;">确定开盘价</td></tr>'
    + '<tr style="background:#f9f9f9;"><td style="padding:8px;border:1px solid #ddd;"><strong>早盘</strong></td><td style="padding:8px;border:1px solid #ddd;">9:30 — 11:30</td><td style="padding:8px;border:1px solid #ddd;">连续竞价</td></tr>'
    + '<tr><td style="padding:8px;border:1px solid #ddd;"><strong>午盘</strong></td><td style="padding:8px;border:1px solid #ddd;">13:00 — 14:57</td><td style="padding:8px;border:1px solid #ddd;">连续竞价</td></tr>'
    + '<tr style="background:#f9f9f9;"><td style="padding:8px;border:1px solid #ddd;"><strong>盘后集合竞价</strong></td><td style="padding:8px;border:1px solid #ddd;">14:57 — 15:00</td><td style="padding:8px;border:1px solid #ddd;">确定收盘价</td></tr>'
    + '</table>'

    + '<h2>盘前集合竞价（9:15—9:25）</h2>'
    + '<p>开盘前的10分钟是<strong>集合竞价</strong>阶段，所有买卖委托集中撮合，最终产生当天的<strong>开盘价</strong>。集合竞价分三个阶段：</p>'
    + '<ul>'
    + '<li><strong>9:15—9:20</strong>：可委托、可撤单。这5分钟投资者可以自由挂单和撤销，行情活跃。</li>'
    + '<li><strong>9:20—9:25</strong>：可委托、<strong class="down">不可撤单</strong>。这5分钟只能挂单不能撤销，主力常在此阶段"做盘"，开盘价即将确定。</li>'
    + '<li><strong>9:25—9:30</strong>：静默期，接受委托但暂不撮合，9:30开盘后统一进入连续竞价。</li>'
    + '</ul>'

    + '<h2>开盘价怎么产生</h2>'
    + '<p>9:25时，交易所系统汇总所有有效委托，按"<strong>最大成交量</strong>"原则计算出一个价格作为开盘价。这个价格使得成交的买单和卖单数量最多。高于开盘价的买单和低于开盘价的卖单都会成交，其余进入连续竞价排队。</p>'

    + '<h2>盘后集合竞价（14:57—15:00）</h2>'
    + '<p>收盘前最后3分钟也是集合竞价，用来确定当天的<strong>收盘价</strong>。这3分钟同样<strong>不可撤单</strong>。收盘价很重要——它是次日涨跌幅的计算基准，也是技术分析（K线、均线）使用的数据。</p>'
    + '<div class="kb-tip"><strong>为什么要盘后竞价？</strong>过去收盘价是最后1秒的最后一笔成交价，容易被人为操纵。改为集合竞价后，收盘价更<strong>真实反映全天供需</strong>，不易被操纵。</div>'

    + '<h2>盘前盘后怎么看</h2>'
    + '<ul>'
    + '<li><strong>看高开/低开</strong>：开盘价高于昨收为<strong class="up">高开</strong>（偏多），低于昨收为<strong class="down">低开</strong>（偏空）。但高开不一定高走，需结合量能观察。</li>'
    + '<li><strong>看集合竞价量</strong>：9:25的竞价成交量异常放大，说明资金关注度极高，当天可能有较大行情。</li>'
    + '<li><strong>看尾盘抢筹/砸盘</strong>：14:57后突然放量拉升（抢筹）或跳水（砸盘），往往反映主力的真实意图，因为收盘价是次日的基准。</li>'
    + '<li><strong>看收盘价位置</strong>：收盘在全天最高附近=强势，收盘在最低附近=弱势，收盘在均价附近=中性。</li>'
    + '</ul>'

    + '<div class="kb-warn"><strong>注意：</strong>9:20—9:25 和 14:57—15:00 <strong>不能撤单</strong>。这两个时段挂的单若成交无法撤销，新手切记不要随意挂单，尤其不要在临近收盘时挂"高价买"或"低价卖"的乌龙单。</div>'

    + '<div class="kb-tip"><strong>实战要点：</strong>开盘后前15分钟（9:30—9:45）波动最剧烈、最活跃，是<strong>消化隔夜消息</strong>的时段，方向尚不稳定，新手建议观察不急躁。真正可靠的走势往往在10:00之后才逐步明朗。</div>'
},

/* ====================================================================
   二、均线系统 MA
   ==================================================================== */
{
    id: 'ma-intro',
    category: 'ma',
    title: '移动平均线 MA：趋势的指南针',
    summary: 'MA是把一段时间内的收盘价平均后连成的曲线，反映价格趋势方向，是最基础的趋势指标。',
    tags: ['均线', 'MA', '趋势', 'MA5', 'MA20', 'MA60'],
    body:
    '<h2>什么是移动平均线</h2>'
    + '<p>移动平均线（Moving Average，简称MA）是将<strong>连续若干天的收盘价求平均</strong>，然后把每天的均值连成一条曲线。它平滑了日常波动，直观看清<strong>趋势方向</strong>。</p>'
    + '<p>计算公式：MA(N) = 最近 N 天收盘价之和 ÷ N</p>'

    + '<h2>常用均线周期与含义</h2>'
    + '<ul>'
    + '<li><strong>MA5（攻击线）</strong>：5日均线，反映近一周走势，最灵敏，用于<strong>判断短期强弱</strong>。</li>'
    + '<li><strong>MA10（操盘线）</strong>：10日均线，短期操作的重要参考。</li>'
    + '<li><strong>MA20（生命线/波段线）</strong>：20日均线（约一个月），中线趋势的核心参考，价格在其上多为强势。</li>'
    + '<li><strong>MA60（决策线/季线）</strong>：60日均线（约一个季度），判断中长期趋势，是<strong>牛熊分界</strong>的重要参考之一。</li>'
    + '<li><strong>MA120（半年线）</strong>、<strong>MA250（年线/牛熊线）</strong>：长期趋势分水岭。价格站上250日线，常被视为进入长期上升通道。</li>'
    + '</ul>'

    + '<h2>均线的作用</h2>'
    + '<ul>'
    + '<li><strong>揭示趋势</strong>：均线向上倾斜=上升趋势，向下=下降趋势，走平=震荡。</li>'
    + '<li><strong>支撑压力</strong>：上升途中均线是支撑，下降途中是压力。</li>'
    + '<li><strong>金叉死叉信号</strong>（见下篇）。</li>'
    + '</ul>'

    + '<figure class="kb-figure">' + KB_SVG.maBullish + '<figcaption>多头排列：短中长均线自上而下</figcaption></figure>'

    + '<div class="kb-tip"><strong>记住：</strong>均线反映的是<strong>过去</strong>的趋势，有滞后性。周期越长越稳定但越滞后，周期越短越灵敏但信号越频繁（假信号多）。实战中常短中长结合使用。</div>'
},

{
    id: 'golden-cross',
    category: 'ma',
    title: '金叉与死叉：均线的买卖信号',
    summary: '短期均线上穿长期均线为金叉（买入信号），下穿为死叉（卖出信号），是均线最经典的用法。',
    tags: ['金叉', '死叉', '均线交叉', '买卖信号'],
    body:
    '<h2>金叉（Golden Cross）</h2>'
    + '<p><strong>短期均线上穿长期均线</strong>（如MA5上穿MA20），形成"金叉"，是<strong>看多买入信号</strong>。表示短期平均成本已高于长期成本之前的弱势格局，多方开始占据主动。</p>'
    + '<ul>'
    + '<li>金叉出现时，若<strong>伴随成交量放大</strong>，信号更可靠。</li>'
    + '<li>金叉出现在<strong>低位/长期下跌后</strong>，反转意义更强；出现在高位则可能是诱多。</li>'
    + '</ul>'

    + '<h2>死叉（Death Cross）</h2>'
    + '<p><strong>短期均线下穿长期均线</strong>（如MA5下穿MA20），形成"死叉"，是<strong>看空卖出信号</strong>。表示短期走势转弱，空头开始占据主动。</p>'
    + '<ul>'
    + '<li>死叉出现在<strong>高位/长期上涨后</strong>，见顶风险更大。</li>'
    + '<li>长期均线（如MA60）出现死叉，信号级别更大、持续更久。</li>'
    + '</ul>'
    + '<figure class="kb-figure">' + KB_SVG.maCross + '<figcaption>金叉（短上穿长）与死叉（短下穿长）</figcaption></figure>'

    + '<h2>多头排列与空头排列</h2>'
    + '<ul>'
    + '<li><strong>多头排列</strong>：MA5 > MA10 > MA20 > MA60，短期线在上、长期线在下，全部向上发散。<strong>典型的强势上涨形态</strong>，持股待涨。</li>'
    + '<li><strong>空头排列</strong>：MA5 < MA10 < MA20 < MA60，短期线在下、长期线在上，全部向下发散。<strong>典型的弱势下跌形态</strong>，不宜恋战。</li>'
    + '</ul>'

    + '<div class="kb-warn"><strong>注意：</strong>均线交叉是<strong>滞后指标</strong>，金叉/死叉形成时趋势往往已走了一段。震荡市中频繁出现"假金叉假死叉"，此时应结合趋势方向和成交量过滤信号，不宜机械执行。</div>'
},

{
    id: 'granville',
    category: 'ma',
    title: '葛兰碧八大买卖法则',
    summary: '美国投资专家葛兰碧提出的均线八大法则，系统总结了均线与价格的四种买点和四种卖点。',
    tags: ['葛兰碧', '均线法则', '买点', '卖点'],
    body:
    '<h2>概述</h2>'
    + '<p>葛兰碧（Joseph Granville）根据价格与均线（通常用200日均线）的关系，总结出经典的<strong>八大法则</strong>，包含四个买点、四个卖点，至今仍是均线应用的核心。</p>'

    + '<h2>四个买点</h2>'
    + '<ol>'
    + '<li><strong>买点一</strong>：均线由下降转为走平或上升，价格<strong>从下方上穿均线</strong>。——趋势由弱转强的初期信号。</li>'
    + '<li><strong>买点二</strong>：价格虽跌破均线，但<strong>均线仍向上</strong>，价格很快回升到均线之上。——上升途中的回踩，是加仓良机。</li>'
    + '<li><strong>买点三</strong>：价格在均线之上<strong>回调，但未跌破均线即再度上涨</strong>。——均线作为支撑有效，强势特征。</li>'
    + '<li><strong>买点四</strong>：价格<strong>暴跌远离均线</strong>（乖离过大），存在反弹回归均线的动力。——抢反弹机会，但属短线。</li>'
    + '</ol>'

    + '<h2>四个卖点</h2>'
    + '<ol>'
    + '<li><strong>卖点一</strong>：均线由上升转为走平或下降，价格<strong>从上方下穿均线</strong>。——趋势由强转弱信号。</li>'
    + '<li><strong>卖点二</strong>：价格虽升破均线，但<strong>均线仍向下</strong>，很快跌回均线之下。——下跌途中的反弹，是减仓时机。</li>'
    + '<li><strong>卖点三</strong>：价格在均线之下<strong>反弹，但未突破均线即再度下跌</strong>。——均线压力有效，弱势特征。</li>'
    + '<li><strong>卖点四</strong>：价格<strong>暴涨远离均线</strong>（乖离过大），有回落风险。——获利了结时机。</li>'
    + '</ol>'

    + '<div class="kb-tip"><strong>核心思想：</strong>均线反映平均成本。价格围绕均线波动，过度偏离会回归。葛兰碧法则本质是<strong>"顺势而为 + 极端回归"</strong>。实战中买点一二三、卖点一二三胜率较高，买卖点四（乖离回归）属短线，需谨慎。</div>'
},

/* ====================================================================
   三、技术指标
   ==================================================================== */
{
    id: 'macd',
    category: 'indicator',
    title: 'MACD 指标：趋势与背离的利器',
    summary: 'MACD由DIF快线、DEA慢线和红绿柱组成，是判断趋势方向、强弱和顶底背离的经典指标。',
    tags: ['MACD', 'DIF', 'DEA', '红绿柱', '背离'],
    body:
    '<h2>MACD 的构成</h2>'
    + '<p>MACD（指数平滑异同移动平均线）由三部分组成：</p>'
    + '<figure class="kb-figure">' + KB_SVG.macd + '<figcaption>MACD：DIF、DEA 与红绿柱</figcaption></figure>'
    + '<ul>'
    + '<li><strong>DIF（快线/白线）</strong>：短期指数平均与长期指数平均之差，最敏感。</li>'
    + '<li><strong>DEA（慢线/黄线）</strong>：DIF 的移动平均，较平缓。</li>'
    + '<li><strong>MACD柱（红绿柱）</strong>=（DIF − DEA）×2。零轴上方为红柱（多头），下方为绿柱（空头）。</li>'
    + '<li><strong>零轴（0线）</strong>：多空分界线。DIF/DEA在零轴上方为多头市场，下方为空头市场。</li>'
    + '</ul>'

    + '<h2>核心用法一：金叉死叉</h2>'
    + '<ul>'
    + '<li><strong>金叉</strong>：DIF 上穿 DEA → <strong>买入信号</strong>。零轴上方的金叉（强势金叉）比零轴下方的更可靠。</li>'
    + '<li><strong>死叉</strong>：DIF 下穿 DEA → <strong>卖出信号</strong>。</li>'
    + '</ul>'

    + '<h2>核心用法二：红绿柱</h2>'
    + '<ul>'
    + '<li>红柱<strong>放大</strong>：多头力量增强，涨势加速。</li>'
    + '<li>红柱<strong>缩短</strong>：多头力量减弱，涨势可能乏力（预警）。</li>'
    + '<li>绿柱<strong>放大</strong>：空头力量增强；绿柱<strong>缩短</strong>：空头力量减弱，跌势可能见底。</li>'
    + '</ul>'

    + '<h2>核心用法三：背离（MACD 最精华）</h2>'
    + '<ul>'
    + '<li><strong class="up">底背离</strong>：价格<strong>创新低</strong>，但 MACD 的低点<strong>反而抬高</strong>。预示下跌动能衰竭，<strong>见底回升</strong>信号，是较好的买入时机。</li>'
    + '<li><strong class="down">顶背离</strong>：价格<strong>创新高</strong>，但 MACD 的高点<strong>反而降低</strong>。预示上涨动能衰竭，<strong>见顶回落</strong>风险，是卖出/减仓信号。</li>'
    + '</ul>'

    + '<div class="kb-tip"><strong>实战精华：</strong>MACD 是<strong>趋势型指标</strong>，在单边行情中表现优秀，但在<strong>震荡市中容易频繁假信号</strong>。背离信号比金叉死叉更值得重视，尤其是<strong>多次背离后的转折</strong>。</div>'
    + '<div class="kb-warn"><strong>注意：</strong>背离可能"再背离"，即背离后价格仍沿原方向走一段才真正转折。建议背离配合其他信号（如突破关键位、成交量）综合判断。</div>'
},

{
    id: 'kdj',
    category: 'indicator',
    title: 'KDJ 指标：超买超卖的短线利器',
    summary: 'KDJ由K、D、J三条线组成，通过0-100区间判断超买超卖，是短线捕捉高低点的常用指标。',
    tags: ['KDJ', '超买', '超卖', '短线', 'K线', 'D线', 'J线'],
    body:
    '<h2>KDJ 的构成</h2>'
    + '<figure class="kb-figure">' + KB_SVG.kdj + '<figcaption>KDJ 的超买(80)与超卖(20)区间</figcaption></figure>'
    + '<ul>'
    + '<li><strong>K 线（蓝）</strong>：RSV的平滑值，反应较快。</li>'
    + '<li><strong>D 线（黄）</strong>：K线的平滑值，较慢较稳，是核心参考。</li>'
    + '<li><strong>J 线（紫）</strong>：3K−2D，波动最剧烈，可超出0-100范围。J线敏感度最高。</li>'
    + '</ul>'
    + '<p>KDJ的值在0-100之间波动（J线可略超）。</p>'

    + '<h2>超买与超卖</h2>'
    + '<ul>'
    + '<li><strong class="down">超买（K、D > 80）</strong>：短期涨幅过大，有<strong>回调风险</strong>，是卖出/减仓参考。</li>'
    + '<li><strong class="up">超卖（K、D < 20）</strong>：短期跌幅过大，有<strong>反弹需求</strong>，是买入参考。</li>'
    + '<li>J线 > 100 为极度超买，< 0（甚至为负）为极度超卖，反转概率增大。</li>'
    + '</ul>'

    + '<h2>金叉死叉</h2>'
    + '<ul>'
    + '<li><strong>金叉</strong>：K线（或J线）在<strong>低位（20以下）</strong>上穿D线 → 强烈<strong>买入信号</strong>。</li>'
    + '<li><strong>死叉</strong>：K线在<strong>高位（80以上）</strong>下穿D线 → 强烈<strong>卖出信号</strong>。</li>'
    + '</ul>'

    + '<div class="kb-warn"><strong>注意"钝化"现象：</strong>KDJ在<strong>单边强趋势</strong>中会长时间停留在超买或超卖区（高位钝化/低位钝化），此时金叉死叉会失灵。<strong>切勿在强势上涨中因KDJ超买就卖出，或在暴跌中因超卖就抄底</strong>。KDJ更适合震荡市和盘整市。</div>'
    + '<div class="kb-tip"><strong>搭配建议：</strong>KDJ（震荡型）+ MACD（趋势型）配合使用：MACD判断大方向，KDJ寻找短线高低点，互补长短。</div>'
},

{
    id: 'rsi',
    category: 'indicator',
    title: 'RSI 相对强弱指标',
    summary: 'RSI衡量一段时间内上涨幅度占总波动的比例，0-100取值，判断超买超卖和强弱转折。',
    tags: ['RSI', '相对强弱', '超买', '超卖', '背离'],
    body:
    '<h2>RSI 是什么</h2>'
    + '<p>RSI（Relative Strength Index，相对强弱指标）通过计算一段时间内<strong>上涨幅度之和</strong>占<strong>总波动幅度</strong>的比例，得到0-100的数值。反映多空双方力量的相对强弱。</p>'
    + '<p>常用周期：<strong>RSI(6)</strong>短期、<strong>RSI(12)</strong>、<strong>RSI(24)</strong>长期。</p>'

    + '<h2>超买超卖判断</h2>'
    + '<ul>'
    + '<li><strong class="down">RSI > 70（或80）</strong>：超买，短期涨幅过大，回调风险增加。</li>'
    + '<li><strong class="up">RSI < 30（或20）</strong>：超卖，短期跌幅过大，反弹机会增加。</li>'
    + '<li><strong>50 为多空分界</strong>：RSI在50以上为多头占优，以下为空头占优。</li>'
    + '</ul>'

    + '<h2>背离信号</h2>'
    + '<ul>'
    + '<li><strong>底背离</strong>：价格创新低，RSI低点抬高 → 见底信号。</li>'
    + '<li><strong>顶背离</strong>：价格创新高，RSI高点降低 → 见顶预警。</li>'
    + '</ul>'

    + '<div class="kb-tip"><strong>与KDJ异同：</strong>RSI和KDJ都是震荡型超买超卖指标，用法相似。RSI相对平稳，KDJ（尤其J线）更灵敏波动更大。两者可互为印证。</div>'
    + '<div class="kb-warn"><strong>注意：</strong>强趋势中RSI同样会钝化（长期超买/超卖），此时超买卖信号失效，应结合趋势指标使用。</div>'
},

{
    id: 'boll',
    category: 'indicator',
    title: '布林带 BOLL：通道、缩口与突破',
    summary: '布林带由上中下三轨组成，中轨是MA20，上下轨基于标准差，反映价格波动范围和通道变化。',
    tags: ['布林带', 'BOLL', '上轨', '下轨', '缩口', '突破'],
    body:
    '<h2>布林带的构成</h2>'
    + '<figure class="kb-figure">' + KB_SVG.boll + '<figcaption>布林带：上轨(压力)、中轨、下轨(支撑)</figcaption></figure>'
    + '<ul>'
    + '<li><strong>中轨（MB）</strong>：20日移动平均线 MA20，是价格的中枢。</li>'
    + '<li><strong>上轨（UP）</strong>：中轨 + 2倍标准差，是<strong>压力位</strong>。</li>'
    + '<li><strong>下轨（DN）</strong>：中轨 − 2倍标准差，是<strong>支撑位</strong>。</li>'
    + '</ul>'
    + '<p>约95%的价格波动会落在上下轨之间的"通道"内。</p>'

    + '<h2>核心用法</h2>'
    + '<ul>'
    + '<li><strong>触上轨</strong>：价格触及或突破上轨，短期偏强，但有<strong>回调压力</strong>（除非强趋势开口放大）。</li>'
    + '<li><strong>触下轨</strong>：价格触及或跌破下轨，短期偏弱，但有<strong>反弹支撑</strong>。</li>'
    + '<li><strong>中轨</strong>：上升途中中轨是支撑，下降途中中轨是压力。</li>'
    + '</ul>'

    + '<h2>缩口与开口（最重要）</h2>'
    + '<ul>'
    + '<li><strong class="down">缩口（收口）</strong>：上下轨间距变小，价格波动收敛，<strong>预示变盘即将来临</strong>（方向待定，需结合其他信号判断）。</li>'
    + '<li><strong class="up">开口（张口）</strong>：缩口后价格<strong>突破上轨或下轨，上下轨张开</strong>，往往是一波<strong>新趋势启动</strong>的信号。开口方向即趋势方向。</li>'
    + '</ul>'

    + '<h2>"喇叭口"战法</h2>'
    + '<p>价格长期在中轨附近横盘（缩口），某日<strong>放量突破上轨</strong>且上轨向上、下轨向下（形成张开的喇叭）→ 看多突破信号；反之<strong>跌破下轨</strong>张口向下 → 看空信号。</p>'

    + '<div class="kb-tip"><strong>实战要点：</strong>布林带特别适合判断<strong>波动节奏的变化</strong>——缩口意味着"暴风雨前的宁静"。但缩口后突破方向需要结合成交量、K线形态、大趋势综合判断，不可仅凭开口方向就下重注。</div>'
},

{
    id: 'volume',
    category: 'indicator',
    title: '成交量 VOL：量价关系的核心',
    summary: '成交量是市场人气的温度计，价格变化需要成交量配合验证，量价关系是技术分析的基石。',
    tags: ['成交量', '量价关系', '放量', '缩量', '量比'],
    body:
    '<h2>成交量的含义</h2>'
    + '<p>成交量（VOL）指一段时间内股票的<strong>成交股数或成交金额</strong>，是衡量市场活跃度和资金参与度的核心数据。常说的"量在价先"——成交量的变化往往领先于价格。</p>'

    + '<h2>基本量价关系（最重要）</h2>'
    + '<ul>'
    + '<li><strong class="up">放量上涨</strong>：价格上涨 + 成交量放大 → 多方力量充沛，<strong>涨势健康</strong>，可持续。</li>'
    + '<li><strong>缩量上涨</strong>：价格上涨但成交量萎缩 → 跟风不足，上涨乏力，需警惕。</li>'
    + '<li><strong class="down">放量下跌</strong>：价格下跌 + 成交量放大 → 抛压沉重，<strong>跌势较强</strong>，宜观望。</li>'
    + '<li><strong>缩量下跌</strong>：价格下跌但成交量萎缩 → 抛压减轻，下跌动能减弱，可能接近底部。</li>'
    + '<li><strong>天量天价</strong>：成交量和价格同时创出历史新高 → 往往是<strong>见顶信号</strong>（主力出货）。</li>'
    + '<li><strong>地量地价</strong>：成交量和价格都极度萎缩 → 抛压枯竭，可能是<strong>阶段性底部</strong>。</li>'
    + '</ul>'

    + '<h2>成交量的特殊信号</h2>'
    + '<ul>'
    + '<li><strong>底部放量</strong>：长期下跌后低位突然放量，常是<strong>主力进场建仓</strong>信号。</li>'
    + '<li><strong>顶部放量滞涨</strong>：高位放量但价格涨不动，是<strong>主力出货</strong>的危险信号。</li>'
    + '<li><strong>突破需放量</strong>：突破重要压力位/前高，必须<strong>伴随放量</strong>才有效；缩量突破多为假突破。</li>'
    + '</ul>'

    + '<div class="kb-tip"><strong>一句话总结：</strong>上涨要量（量价齐升），下跌不怕缩量。真正的趋势行情一定有成交量配合，无量上涨是空中楼阁。把成交量作为价格信号的"验证器"。</div>'
},

{
    id: 'other-indicators',
    category: 'indicator',
    title: 'OBV、CCI、WR 等辅助指标速览',
    summary: '能量潮OBV、CCI顺势指标、威廉指标WR等辅助指标的快速入门，作为主指标的补充。',
    tags: ['OBV', 'CCI', 'WR', '威廉指标', '能量潮'],
    body:
    + '<h2>OBV 能量潮（量能累积）</h2>'
    + '<ul>'
    + '<li><strong>原理</strong>：上涨日成交量计入正值，下跌日计入负值，累加成一条线，反映<strong>资金累积进出</strong>。</li>'
    + '<li><strong>用法</strong>：OBV<strong>领先于价格</strong>。OBV稳步上升而价格盘整 → 资金暗中流入，后市看多；OBV下降而价格盘整 → 资金流出，警惕。</li>'
    + '<li>OBV创新高 → 价格有望跟创新高。</li>'
    + '</ul>'

    + '<h2>CCI 顺势指标</h2>'
    + '<ul>'
    + '<li><strong>原理</strong>：测量价格偏离其平均值的程度，可正可负，波动范围大。</li>'
    + '<li><strong>用法</strong>：<strong>+100 以上为超买</strong>（强势），<strong>−100 以下为超卖</strong>（弱势）。CCI 上穿 +100 为买入信号，下穿 +100 为卖出信号。适合捕捉<strong>极端行情的转折</strong>。</li>'
    + '</ul>'

    + '<h2>WR 威廉指标（Williams %R）</h2>'
    + '<ul>'
    + '<li><strong>原理</strong>：衡量收盘价在近期高低区间的位置，取值 0 到 -100（注意是负值）。</li>'
    + '<li><strong>用法</strong>：<strong>−20 以上（接近0）为超买</strong>，<strong>−80 以下为超卖</strong>。WR 进入超卖区后回升，是买入参考；进入超买区后回落，是卖出参考。与KDJ、RSI类似，适合震荡市。</li>'
    + '</ul>'

    + '<div class="kb-tip"><strong>使用建议：</strong>这些指标作为<strong>辅助验证</strong>，不宜单独决策。实战中选 1-2 个趋势指标（如MACD）+ 1-2 个震荡指标（如KDJ/RSI）+ 成交量，形成自己的指标组合，比堆砌指标更有效。指标多 ≠ 判断准，信号冲突时反而无所适从。</div>'
},

/* ====================================================================
   四、基本面与盘口
   ==================================================================== */
{
    id: 'pe',
    category: 'fundamental',
    title: '市盈率 PE：股价是贵还是便宜',
    summary: '市盈率=股价÷每股收益，衡量投资回本年限，是最常用的估值指标，但要分清静态、动态和TTM。',
    tags: ['市盈率', 'PE', '估值', 'TTM'],
    body:
    '<h2>什么是市盈率</h2>'
    + '<p>市盈率（Price Earnings Ratio，PE）= <strong>股价 ÷ 每股收益（EPS）</strong>，或 = <strong>总市值 ÷ 净利润</strong>。</p>'
    + '<p>通俗理解：PE代表<strong>"按当前盈利水平，多少年能回本"</strong>。PE=20，意味着假设盈利不变，约20年回本。</p>'

    + '<h2>三种市盈率的区别</h2>'
    + '<ul>'
    + '<li><strong>静态PE</strong>：用上一年度已公布的净利润计算。数据确定但<strong>滞后</strong>。</li>'
    + '<li><strong>动态PE（预测PE）</strong>：用预测的全年净利润计算。前瞻但<strong>预测有不确定性</strong>。</li>'
    + '<li><strong>TTM（滚动市盈率）</strong>：用<strong>最近12个月（四个季度）</strong>的净利润计算。<strong>最常用、最客观</strong>，兼顾时效和准确性。</li>'
    + '</ul>'

    + '<h2>怎么看 PE 高低</h2>'
    + '<ul>'
    + '<li><strong>不能孤立看绝对值</strong>。PE=50未必贵，PE=5未必便宜，要看<strong>行业平均水平</strong>和<strong>公司成长性</strong>。</li>'
    + '<li><strong>与同行比</strong>：同行业内 PE 低于平均，可能是被低估。</li>'
    + '<li><strong>与历史比</strong>：处于自身历史 PE 低位区间，相对便宜。</li>'
    + '<li><strong>成长性补偿</strong>：高成长公司（如科技股）PE 高些合理，因为盈利在快速增长会摊低未来PE。</li>'
    + '</ul>'

    + '<div class="kb-warn"><strong>PE 的陷阱：</strong></div>'
    + '<ul>'
    + '<li><strong>负PE</strong>：公司亏损（EPS为负），PE无意义，不能简单比较。</li>'
    + '<li><strong>极低PE</strong>：可能是"价值陷阱"——市场预期业绩将大幅下滑，看似便宜实则危险。</li>'
    + '<li><strong>周期股</strong>：周期股在<strong>盈利高点时PE反而低</strong>（此时应警惕），盈利低点时PE反而高（可能接近底部）。需逆向思维。</li>'
    + '</ul>'

    + '<div class="kb-tip"><strong>配合 PEG：</strong>PEG = PE ÷ 盈利增长率。PEG < 1 常被视为低估（增速高于估值），比单纯看PE更能衡量"成长性价比"。</div>'
},

{
    id: 'pb-ps',
    category: 'fundamental',
    title: '市净率 PB 与市销率 PS',
    summary: 'PB衡量股价相对每股净资产的高低，PS衡量相对每股销售收入，是PE之外的重要估值补充。',
    tags: ['市净率', 'PB', '市销率', 'PS', '估值', '净资产'],
    body:
    '<h2>市净率 PB</h2>'
    + '<p>市净率（Price to Book）= <strong>股价 ÷ 每股净资产</strong>，或 = <strong>总市值 ÷ 净资产</strong>。</p>'
    + '<p>净资产 = 总资产 − 总负债，是公司"清算价值"的近似。PB衡量<strong>股价相对于账面价值的倍数</strong>。</p>'
    + '<ul>'
    + '<li><strong>PB < 1（破净）</strong>：股价低于净资产，理论上"打折买资产"，常见于银行、钢铁等重资产行业。</li>'
    + '<li><strong>重资产行业</strong>（银行、地产、钢铁）多用 PB 估值。</li>'
    + '<li><strong>轻资产/服务业</strong>（科技、消费）净资产意义有限，PB参考价值小。</li>'
    + '</ul>'

    + '<h2>市销率 PS</h2>'
    + '<p>市销率（Price to Sales）= <strong>总市值 ÷ 年营业收入</strong>，或 = <strong>股价 ÷ 每股营业收入</strong>。</p>'
    + '<p>PS衡量<strong>股价相对于销售收入的倍数</strong>。</p>'
    + '<ul>'
    + '<li><strong>适用场景</strong>：<strong>尚未盈利的成长型公司</strong>（如互联网、生物医药初创），PE为负无法用，此时PS是重要参考。</li>'
    + '<li>PS低表示市场给予每元收入的定价低，可能被低估（前提是收入真实且有成长性）。</li>'
    + '</ul>'

    + '<h2>三个估值指标的搭配</h2>'
    + '<table style="width:100%;border-collapse:collapse;font-size:13px;margin:12px 0;">'
    + '<tr style="background:#1a2b4a;color:#fff;"><th style="padding:8px;border:1px solid #ddd;">指标</th><th style="padding:8px;border:1px solid #ddd;">公式</th><th style="padding:8px;border:1px solid #ddd;">适用</th></tr>'
    + '<tr><td style="padding:8px;border:1px solid #ddd;">PE</td><td style="padding:8px;border:1px solid #ddd;">市值÷净利润</td><td style="padding:8px;border:1px solid #ddd;">盈利稳定的成熟公司</td></tr>'
    + '<tr style="background:#f9f9f9;"><td style="padding:8px;border:1px solid #ddd;">PB</td><td style="padding:8px;border:1px solid #ddd;">市值÷净资产</td><td style="padding:8px;border:1px solid #ddd;">重资产行业（银行/地产）</td></tr>'
    + '<tr><td style="padding:8px;border:1px solid #ddd;">PS</td><td style="padding:8px;border:1px solid #ddd;">市值÷营收</td><td style="padding:8px;border:1px solid #ddd;">高成长未盈利公司</td></tr>'
    + '</table>'

    + '<div class="kb-tip"><strong>核心原则：</strong>没有万能的估值指标。不同行业、不同生命周期阶段的公司，适用不同指标。一定要<strong>同行业内横向比较</strong>，并结合成长性综合判断，单一指标的绝对值意义有限。</div>'
},

{
    id: 'roe',
    category: 'fundamental',
    title: 'ROE 净资产收益率：衡量赚钱能力',
    summary: 'ROE=净利润÷净资产，衡量公司用股东的钱创造利润的效率，是巴菲特最看重的财务指标。',
    tags: ['ROE', '净资产收益率', '盈利能力', '财务', '巴菲特'],
    body:
    '<h2>什么是 ROE</h2>'
    + '<p>净资产收益率（Return on Equity，ROE）= <strong>净利润 ÷ 净资产</strong>，以百分比表示。</p>'
    + '<p>ROE衡量<strong>公司用股东投入的每元净资产能赚回多少利润</strong>，是评价企业盈利能力的核心指标。巴菲特极为看重 ROE，认为持续高 ROE 是优秀公司的标志。</p>'

    + '<h2>ROE 高低的判断</h2>'
    + '<ul>'
    + '<li><strong>ROE > 15%</strong>：通常被认为是<strong>优秀公司</strong>的水平（巴菲特的标准之一）。</li>'
    + '<li><strong>ROE > 20%</strong>：盈利能力<strong>非常强</strong>，但需警惕是否靠高负债撑起。</li>'
    + '<li><strong>ROE < 10%</strong>：盈利能力一般。</li>'
    + '<li><strong>关键看持续性</strong>：一两年的高ROE不算什么，<strong>连续多年稳定在15%以上</strong>才是真本事。</li>'
    + '</ul>'

    + '<h2>杜邦分析：ROE 的三要素</h2>'
    + '<p>ROE 可拆解为三个驱动因素（杜邦公式）：</p>'
    + '<p style="text-align:center;background:#f5f6f8;padding:12px;border-radius:8px;margin:10px 0;"><strong>ROE = 净利率 × 资产周转率 × 权益乘数</strong></p>'
    + '<ul>'
    + '<li><strong>净利率</strong>（净利润÷营收）：产品赚钱能力，越高说明利润空间大。</li>'
    + '<li><strong>资产周转率</strong>（营收÷总资产）：资产运营效率，越高说明资产转得快。</li>'
    + '<li><strong>权益乘数</strong>（总资产÷净资产）：财务杠杆，越高说明负债越多。</li>'
    + '</ul>'
    + '<p>同样高的ROE，靠<strong>高净利率和高周转</strong>撑起的是"好生意"；靠<strong>高杠杆（高负债）</strong>撑起的风险较大。杜邦分析帮你看清ROE的<strong>质量</strong>。</p>'

    + '<div class="kb-warn"><strong>注意：</strong>高ROE若是靠<strong>大额负债</strong>（高权益乘数）实现，看似赚钱实则风险高——经济下行时利息负担和偿债压力会拖垮公司。分析ROE务必结合资产负债率。</div>'
    + '<div class="kb-tip"><strong>选股思路：</strong>"高ROE + 低负债 + 稳定增长 + 合理估值"是价值投资的经典筛选条件。ROE是"质"的指标，PE/PB是"价"的指标，质价结合才能找到好公司好价格。</div>'
},

{
    id: 'turnover',
    category: 'fundamental',
    title: '换手率：市场活跃度的温度计',
    summary: '换手率=成交量÷流通股本，反映股票交易的活跃程度和资金关注度，是判断主力动向的重要参考。',
    tags: ['换手率', '成交量', '活跃度', '主力', '资金'],
    body:
    '<h2>什么是换手率</h2>'
    + '<p>换手率 = <strong>当日成交量 ÷ 流通股本 × 100%</strong>。</p>'
    + '<p>换手率反映<strong>股票流通筹码在当日被买卖的频率</strong>，是衡量个股活跃度的直观指标。换手率越高，说明交易越活跃、资金关注度越高。</p>'

    + '<h2>换手率高低的市场含义</h2>'
    + '<ul>'
    + '<li><strong>换手率 < 1%</strong>：<strong>低迷</strong>。成交冷清，关注度低，多为冷门股或盘整期。</li>'
    + '<li><strong>换手率 1%-3%</strong>：<strong>正常</strong>。交易温和，是大部分股票的常态。</li>'
    + '<li><strong>换手率 3%-7%</strong>：<strong>活跃</strong>。资金参与度提升，常有行情启动迹象。</li>'
    + '<li><strong>换手率 7%-15%</strong>：<strong>高度活跃</strong>。多空分歧大，可能是<strong>主力大幅运作</strong>（建仓或出货），需结合位置判断。</li>'
    + '<li><strong>换手率 > 15%</strong>：<strong>异常活跃</strong>。往往是<strong>阶段性顶部或重大消息</strong>引发的剧烈换手，需高度警惕。</li>'
    + '</ul>'

    + '<h2>换手率的实战意义</h2>'
    + '<ul>'
    + '<li><strong>底部放量高换手</strong>：长期低位后突然高换手 + 上涨，可能是<strong>主力建仓</strong>，看好后市。</li>'
    + '<li><strong>高位高换手滞涨</strong>：涨幅较大后高换手但价格不涨，是<strong>主力出货</strong>的危险信号。</li>'
    + '<li><strong>持续高换手</strong>：说明筹码松动、分歧加剧，行情进入活跃期，波动加大。</li>'
    + '<li><strong>新股/次新股</strong>：上市初期换手率极高（常>50%），属正常，后续会逐步降低。</li>'
    + '</ul>'

    + '<div class="kb-tip"><strong>结合量比看：</strong>换手率看"绝对活跃度"，量比看"相对活跃度"（相对过去5日均量）。两者配合：换手率高 + 量比大 → 当日异常活跃，是重要关注信号。</div>'
},

{
    id: 'market-data',
    category: 'fundamental',
    title: '盘口数据：量比、委比、内外盘',
    summary: '盘口实时数据反映当日买卖力量对比，量比看活跃度突变，委比看挂单倾向，内外盘看主动买卖。',
    tags: ['量比', '委比', '内盘', '外盘', '盘口', '买卖五档'],
    body:
    + '<h2>量比</h2>'
    + '<p>量比 = <strong>当日开盘后平均每分钟成交量 ÷ 过去5个交易日平均每分钟成交量</strong>。</p>'
    + '<p>量比衡量<strong>今日成交活跃度相对近期的变化</strong>，是发现"放量"的利器。</p>'
    + '<ul>'
    + '<li><strong>量比 < 0.8</strong>：缩量，成交清淡。</li>'
    + '<li><strong>量比 0.8-1.5</strong>：正常水平。</li>'
    + '<li><strong>量比 1.5-2.5</strong>：温和放量，资金开始关注。</li>'
    + '<li><strong>量比 2.5-5</strong>：明显放量，可能有<strong>异动</strong>。</li>'
    + '<li><strong>量比 > 5</strong>：剧烈放量，常有重大消息或主力动作，是<strong>重点关注信号</strong>。</li>'
    + '</ul>'

    + '<h2>委比</h2>'
    + '<p>委比 = <strong>（委买手数 − 委卖手数）÷（委买手数 + 委卖手数）× 100%</strong>。</p>'
    + '<p>委买/委卖手数通常取<strong>买卖五档</strong>（即五档买盘+五档卖盘）的挂单总量。委比反映<strong>盘口挂单的买卖倾向</strong>。</p>'
    + '<ul>'
    + '<li><strong>委比为正</strong>（如+30%）：买盘挂单多于卖盘，<strong>多头气氛浓厚</strong>。</li>'
    + '<li><strong>委比为负</strong>：卖盘挂单多于买盘，<strong>空头气氛浓厚</strong>。</li>'
    + '</ul>'

    + '<h2>内盘与外盘</h2>'
    + '<ul>'
    + '<li><strong class="up">外盘</strong>：以<strong>卖方报价（卖一及更高价）成交</strong>的量。买方主动追价买入，反映<strong>主动买盘</strong>（买方急迫）。外盘大 → 买方积极，偏多。</li>'
    + '<li><strong class="down">内盘</strong>：以<strong>买方报价（买一及更低价）成交</strong>的量。卖方主动杀跌卖出，反映<strong>主动卖盘</strong>（卖方急迫）。内盘大 → 卖方积极，偏空。</li>'
    + '</ul>'
    + '<p>外盘 > 内盘，多头略占优；内盘 > 外盘，空头略占优。两者差距越大，方向倾向越明显。</p>'

    + '<div class="kb-warn"><strong>注意盘口"假象"：</strong>主力常通过挂大单（虚假委托）来影响委比、制造盘口强势/弱势假象，诱导散户跟风，随后撤单。这就是"骗线"。盘口数据是<strong>动态、瞬时</strong>的，参考价值有限，不能作为唯一依据，务必结合价格走势和成交量。</div>'
    + '<div class="kb-tip"><strong>综合判断：</strong>盘口数据适合<strong>短线盯盘</strong>参考。真正的趋势判断仍需 K线、均线、成交量等中观指标。新手不必过度纠结盘口的每个数字，把握"量价配合 + 大方向"更重要。</div>'
},

/* ====================================================================
   五、港美股市场
   ==================================================================== */
{
    id: 'hk-rules',
    category: 'hkus',
    title: '港股交易规则：无涨跌停的T+0市场',
    summary: '港股没有涨跌幅限制，支持T+0回转交易，交易单位不统一，规则与A股差异较大。',
    tags: ['港股', '交易规则', 'T+0', '涨跌停', '交易单位', '手'],
    body:
    '<h2>港股核心交易规则</h2>'
    + '<table style="width:100%;border-collapse:collapse;font-size:13px;margin:12px 0;">'
    + '<tr style="background:#1a2b4a;color:#fff;"><th style="padding:8px;border:1px solid #ddd;">项目</th><th style="padding:8px;border:1px solid #ddd;">港股</th></tr>'
    + '<tr><td style="padding:8px;border:1px solid #ddd;">交易时间</td><td style="padding:8px;border:1px solid #ddd;">9:30-12:00 / 13:00-16:00</td></tr>'
    + '<tr style="background:#f9f9f9;"><td style="padding:8px;border:1px solid #ddd;">交易制度</td><td style="padding:8px;border:1px solid #ddd;"><strong>T+0</strong>（当日买当日卖）</td></tr>'
    + '<tr><td style="padding:8px;border:1px solid #ddd;">交收制度</td><td style="padding:8px;border:1px solid #ddd;">T+2（资金T+2到账）</td></tr>'
    + '<tr style="background:#f9f9f9;"><td style="padding:8px;border:1px solid #ddd;">涨跌幅限制</td><td style="padding:8px;border:1px solid #ddd;"><strong class="down">无</strong>（可暴涨暴跌）</td></tr>'
    + '<tr><td style="padding:8px;border:1px solid #ddd;">交易单位</td><td style="padding:8px;border:1px solid #ddd;">不统一（每手股数由公司定）</td></tr>'
    + '<tr style="background:#f9f9f9;"><td style="padding:8px;border:1px solid #ddd;">报价货币</td><td style="padding:8px;border:1px solid #ddd;">港币 HKD</td></tr>'
    + '</table>'

    + '<h2>无涨跌停意味着什么</h2>'
    + '<p>港股<strong>没有10%或20%的涨跌幅限制</strong>，单日可以涨几倍，也可以跌去大半。利好消息下可能一天翻倍，利空时（如业绩暴雷、退市风险）可能单日暴跌50%以上。这是港股最大的特征，也是最大的风险。</p>'
    + '<div class="kb-warn"><strong>风险提示：</strong>无涨跌停意味着<strong>风险和收益都被放大</strong>。务必做好风控、设止损，切勿重仓单只个股，尤其是基本面不明的仙股（低价股）。</div>'

    + '<h2>T+0 回转交易</h2>'
    + '<p>港股支持<strong>T+0</strong>：当天买入的股票当天就能卖出，不限次数。相比A股的T+1，港股交易更灵活，适合做短线和日内交易。但灵活也意味着<strong>容易频繁操作、追涨杀跌</strong>，新手需克制。</p>'

    + '<h2>交易单位：每手股数不统一</h2>'
    + '<p>A股统一100股为1手，而港股<strong>每手股数由上市公司自行决定</strong>，从100股到10000股不等：</p>'
    + '<ul>'
    + '<li>腾讯：每手100股</li>'
    + '<li>汇丰：每手400股</li>'
    + '<li>部分股票：每手1000股、2000股甚至更高</li>'
    + '</ul>'
    + '<p>买入必须按<strong>整手</strong>交易，不能零买。所以同样资金，能买不同股票的"手数"差别很大。</p>'

    + '<div class="kb-tip"><strong>交易费用：</strong>港股交易费用比A股高，包括佣金、交易征费、交易费、交收费等。频繁交易成本不低，做T+0前务必算清手续费。</div>'
},

{
    id: 'us-rules',
    category: 'hkus',
    title: '美股交易规则：做空与盘前盘后',
    summary: '美股交易时段分盘前、正常、盘后三段，支持做空和T+0，最小单位1股，规则成熟灵活。',
    tags: ['美股', '交易规则', '做空', '盘前盘后', 'T+0', '1股'],
    body:
    '<h2>美股核心交易规则</h2>'
    + '<table style="width:100%;border-collapse:collapse;font-size:13px;margin:12px 0;">'
    + '<tr style="background:#1a2b4a;color:#fff;"><th style="padding:8px;border:1px solid #ddd;">项目</th><th style="padding:8px;border:1px solid #ddd;">美股</th></tr>'
    + '<tr><td style="padding:8px;border:1px solid #ddd;">交易时间（东部）</td><td style="padding:8px;border:1px solid #ddd;">9:30-16:00（北京时间晚）</td></tr>'
    + '<tr style="background:#f9f9f9;"><td style="padding:8px;border:1px solid #ddd;">交易制度</td><td style="padding:8px;border:1px solid #ddd;"><strong>T+0</strong>（融资账户可日内交易）</td></tr>'
    + '<tr><td style="padding:8px;border:1px solid #ddd;">交收制度</td><td style="padding:8px;border:1px solid #ddd;">T+1（2024年起）</td></tr>'
    + '<tr style="background:#f9f9f9;"><td style="padding:8px;border:1px solid #ddd;">涨跌幅限制</td><td style="padding:8px;border:1px solid #ddd;">有个股熔断（非每日限制）</td></tr>'
    + '<tr><td style="padding:8px;border:1px solid #ddd;">交易单位</td><td style="padding:8px;border:1px solid #ddd;"><strong>1股起</strong>（可零股交易）</td></tr>'
    + '<tr style="background:#f9f9f9;"><td style="padding:8px;border:1px solid #ddd;">报价货币</td><td style="padding:8px;border:1px solid #ddd;">美元 USD</td></tr>'
    + '</table>'

    + '<h2>交易时段（北京时间）</h2>'
    + '<p>美股分为三个时段（以美东时间计，冬令时比夏令时晚1小时）：</p>'
    + '<ul>'
    + '<li><strong>盘前</strong>：4:00-9:30（流动性低，波动大）</li>'
    + '<li><strong>正常交易</strong>：9:30-16:00</li>'
    + '<li><strong>盘后</strong>：16:00-20:00（流动性低，波动大）</li>'
    + '</ul>'
    + '<p>对应北京时间：夏令时晚上21:30开盘，冬令时晚上22:30开盘。所以美股投资者常需<strong>熬夜看盘</strong>。</p>'

    + '<h2>做空机制</h2>'
    + '<p>美股<strong>做空非常成熟</strong>——先借股票卖出，等跌了再买回归还，赚下跌的钱。机构常用做空对冲风险或表达看空观点。做空机制使美股定价更有效，但也可能引发<strong>逼空行情</strong>（如2021年游戏驿站GME事件）。</p>'

    + '<h2>个股熔断（LULD机制）</h2>'
    + '<p>美股没有A股那样的每日涨跌停板，但有<strong>个股熔断</strong>（Limit Up-Limit Down）：5分钟内涨跌超过一定幅度会触发短暂停牌，冷却后恢复交易。此外还有<strong>大盘熔断</strong>（市场下跌7%/13%/20%三级）。</p>'

    + '<h2>1股起买，可买零股</h2>'
    + '<p>美股最小交易单位是<strong>1股</strong>，甚至支持<strong>碎股（零股）</strong>交易。像伯克希尔（巴菲特公司）股价几十万美元一股，普通人买不起整手，但可以买0.1股。资金门槛很低。</p>'

    + '<div class="kb-tip"><strong>交易费用：</strong>美股主流券商已普遍<strong>零佣金</strong>（如盈透、富途、老虎等），但买卖会有微小的<strong>SEC费、交易活动费</strong>。相比港股，美股交易成本更低。</div>'
},

{
    id: 'hk-us-structure',
    category: 'hkus',
    title: '港美股市场结构：主板、创业板与板块',
    summary: '港股分主板与GEM创业板，美股有纽交所、纳斯达克等交易所，各自定位不同类型企业。',
    tags: ['港交所', '纽交所', '纳斯达克', '主板', '创业板', '市场结构'],
    body:
    '<h2>香港市场结构</h2>'
    + '<p>香港交易所（HKEX）主要分两个板块：</p>'
    + '<ul>'
    + '<li><strong>主板</strong>：成熟大型企业上市地，门槛较高（盈利、市值、现金流等要求）。绝大多数知名公司都在主板，如腾讯、美团、阿里。</li>'
    + '<li><strong>GEM（创业板）</strong>：面向中小型成长企业，门槛较低，风险较高，流动性差。过去是"跳板"，但近年来活跃度很低。</li>'
    + '</ul>'

    + '<h3>港股的特色板块</h3>'
    + '<ul>'
    + '<li><strong>蓝筹股</strong>：恒生指数成分股，市值大、流动性好、分红稳定（如汇丰、腾讯、友邦）。</li>'
    + '<li><strong>红筹股</strong>：在港注册上市、但主要业务在境内的中资公司。</li>'
    + '<li><strong>H股</strong>：在内地注册、香港上市的公司（如工商银行、中国平安）。</li>'
    + '<li><strong>仙股</strong>：股价低于1港元的低价股，风险极高，易被操控，新手慎碰。</li>'
    + '</ul>'

    + '<h2>美国市场结构</h2>'
    + '<p>美国有<strong>两大主流交易所</strong>，各具特色：</p>'

    + '<h3>1. 纽交所（NYSE）</h3>'
    + '<ul>'
    + '<li>全球市值最大的交易所。</li>'
    + '<li>上市要求严格，以<strong>传统行业大蓝筹</strong>为主：金融（摩根大通）、消费（可口可乐、沃尔玛）、工业（波音）等。</li>'
    + '<li>形象稳重，老牌巨头聚集地。</li>'
    + '</ul>'

    + '<h3>2. 纳斯达克（NASDAQ）</h3>'
    + '<ul>'
    + '<li>全球第二大，以<strong>科技股</strong>著称：苹果、微软、谷歌、亚马逊、英伟达、特斯拉。</li>'
    + '<li>上市门槛相对灵活，吸引高成长、高创新企业。</li>'
    + '<li>纳斯达克综合指数是科技股风向标；纳斯达克100指数（QQQ）是热门ETF。</li>'
    + '</ul>'

    + '<h3>美股三大指数</h3>'
    + '<ul>'
    + '<li><strong>道琼斯</strong>：30只蓝筹股，最老牌，代表性强但样本少。</li>'
    + '<li><strong>标普500</strong>：500家大公司，覆盖面广，被视作<strong>美股大盘风向标</strong>。</li>'
    + '<li><strong>纳斯达克综合</strong>：偏科技，波动大，代表创新经济。</li>'
    + '</ul>'

    + '<div class="kb-tip"><strong>选市场建议：</strong>稳健型选港股蓝筹/美股道指标普，追求成长选美股纳斯达克。投资前务必了解公司在哪个市场、什么板块，这决定了流动性和风险特征。</div>'
},

{
    id: 'adr-interconnect',
    category: 'hkus',
    title: 'ADR存托凭证与沪深港通',
    summary: '中概股通过ADR在美上市，内地资金通过沪深港通投资港股，理解这些机制才能读懂跨境投资。',
    tags: ['ADR', '中概股', '沪深港通', '互联互通', '存托凭证'],
    body:
    '<h2>什么是ADR（美国存托凭证）</h2>'
    + '<p>ADR（American Depositary Receipt）是<strong>美国存托凭证</strong>。外国公司想在美国上市、让美国投资者用美元买卖，通常不直接发行股票，而是通过<strong>存托银行</strong>发行一种代表其股票的"凭证"，这就是ADR。</p>'
    + '<p>大部分<strong>中概股</strong>（中国概念股）就是通过ADR在美股上市的，如阿里巴巴（BABA）、京东（JD）、百度（BIDU）、拼多多（PDD）。</p>'

    + '<h2>中概股的三种上市路径</h2>'
    + '<ul>'
    + '<li><strong>美股ADR</strong>：阿里、京东、百度等，以ADR形式在纽交所/纳斯达克交易。</li>'
    + '<li><strong>港股二次上市/双重主要上市</strong>：近年很多中概股<strong>回港上市</strong>，如阿里、京东、网易、B站，既在美股也在港股交易，两地股票可转换。</li>'
    + '<li><strong>A股</strong>：少数中概股回归A股（如三六零），或采用A+H股两地上市。</li>'
    + '</ul>'

    + '<div class="kb-tip"><strong>为什么中概股回港？</strong>中美监管摩擦（如PCAOB审计争议、HFCAA法案）使中概股面临<strong>退市风险</strong>。回港上市是<strong>风险对冲</strong>，保留融资渠道，也方便亚洲投资者参与。</div>'

    + '<h2>沪深港通：内地资金的出海通道</h2>'
    + '<p><strong>沪深港通</strong>（Stock Connect）是内地与香港股市的互联互通机制，让两地投资者互相买卖对方市场的股票：</p>'
    + '<ul>'
    + '<li><strong>港股通</strong>（内地→香港）：内地投资者可买符合条件的<strong>港股</strong>。包括<strong>沪港通</strong>和<strong>深港通</strong>。</li>'
    + '<li><strong>陆股通</strong>（香港→内地）：境外资金通过香港买<strong>A股</strong>，这就是常说的"北向资金"。</li>'
    + '</ul>'

    + '<h2>北向资金：外资风向标</h2>'
    + '<p>通过陆股通流入A股的境外资金被称为<strong>"北向资金"</strong>（从香港向北流入内地）。市场普遍关注北向资金的<strong>净流入/流出</strong>，将其视为<strong>外资对A股的态度风向标</strong>：</p>'
    + '<ul>'
    + '<li>北向资金大幅<strong>净流入</strong>：外资看好A股，市场情绪偏暖。</li>'
    + '<li>北向资金大幅<strong>净流出</strong>：外资撤离，需警惕。</li>'
    + '</ul>'
    + '<div class="kb-warn"><strong>注意：</strong>北向资金只是参考指标之一，不能单独决定买卖。外资也会追涨杀跌，短线波动不代表长期趋势。</div>'

    + '<h2>港股通能买什么</h2>'
    + '<p>港股通不是所有港股都能买，有<strong>成分股名单</strong>（恒生综合大型/中型/小型指数成分股等）。像腾讯、美团、阿里、汇丰都在名单内，但部分小市值或新上市公司可能不在。开通港股通还需满足<strong>50万元</strong>资产门槛。</p>'
},

{
    id: 'hk-vs-a-vs-us',
    category: 'hkus',
    title: 'A股 / 港股 / 美股：三大市场对比',
    summary: '一表看清A股、港股、美股在交易规则、涨跌停、做空、费用等核心维度的差异。',
    tags: ['对比', 'A股', '港股', '美股', '差异', 'T+1', 'T+0'],
    body:
    '<h2>三大市场核心对比</h2>'
    + '<table style="width:100%;border-collapse:collapse;font-size:12px;margin:12px 0;">'
    + '<tr style="background:#1a2b4a;color:#fff;"><th style="padding:7px;border:1px solid #ddd;">对比项</th><th style="padding:7px;border:1px solid #ddd;">A股</th><th style="padding:7px;border:1px solid #ddd;">港股</th><th style="padding:7px;border:1px solid #ddd;">美股</th></tr>'
    + '<tr><td style="padding:7px;border:1px solid #ddd;">交易制度</td><td style="padding:7px;border:1px solid #ddd;">T+1</td><td style="padding:7px;border:1px solid #ddd;">T+0</td><td style="padding:7px;border:1px solid #ddd;">T+0</td></tr>'
    + '<tr style="background:#f9f9f9;"><td style="padding:7px;border:1px solid #ddd;">涨跌停</td><td style="padding:7px;border:1px solid #ddd;">±10%/20%</td><td style="padding:7px;border:1px solid #ddd;">无</td><td style="padding:7px;border:1px solid #ddd;">个股熔断</td></tr>'
    + '<tr><td style="padding:7px;border:1px solid #ddd;">做空</td><td style="padding:7px;border:1px solid #ddd;">有限制</td><td style="padding:7px;border:1px solid #ddd;">支持</td><td style="padding:7px;border:1px solid #ddd;">成熟</td></tr>'
    + '<tr style="background:#f9f9f9;"><td style="padding:7px;border:1px solid #ddd;">交易单位</td><td style="padding:7px;border:1px solid #ddd;">100股/手</td><td style="padding:7px;border:1px solid #ddd;">不统一</td><td style="padding:7px;border:1px solid #ddd;">1股起</td></tr>'
    + '<tr><td style="padding:7px;border:1px solid #ddd;">货币</td><td style="padding:7px;border:1px solid #ddd;">人民币</td><td style="padding:7px;border:1px solid #ddd;">港币</td><td style="padding:7px;border:1px solid #ddd;">美元</td></tr>'
    + '<tr style="background:#f9f9f9;"><td style="padding:7px;border:1px solid #ddd;">交易时间</td><td style="padding:7px;border:1px solid #ddd;">9:30-15:00</td><td style="padding:7px;border:1px solid #ddd;">9:30-16:00</td><td style="padding:7px;border:1px solid #ddd;">21:30-次4:00</td></tr>'
    + '<tr><td style="padding:7px;border:1px solid #ddd;">佣金</td><td style="padding:7px;border:1px solid #ddd;">较低</td><td style="padding:7px;border:1px solid #ddd;">较高</td><td style="padding:7px;border:1px solid #ddd;">零佣金为主</td></tr>'
    + '<tr style="background:#f9f9f9;"><td style="padding:7px;border:1px solid #ddd;">分红</td><td style="padding:7px;border:1px solid #ddd;">不稳定</td><td style="padding:7px;border:1px solid #ddd;">较高（蓝筹）</td><td style="padding:7px;border:1px solid #ddd;">多回购少分红</td></tr>'
    + '</table>'

    + '<h2>A股特点：政策市 + 散户多</h2>'
    + '<p>A股<strong>散户占比高</strong>，情绪化明显，受政策影响大（俗称"政策市"）。涨跌停板和T+1限制了短期波动，但也限制了流动性。适合偏好稳健、能承受政策博弈的投资者。</p>'

    + '<h2>港股特点：低估值 + 高股息</h2>'
    + '<p>港股<strong>估值普遍偏低</strong>（PE/PB低于A股和美股），蓝筹股<strong>股息率高</strong>（汇丰、中海油常达5%以上），适合价值投资和收息策略。但<strong>流动性分化严重</strong>——少数龙头成交活跃，大量中小盘股流动性极差。</p>'

    + '<h2>美股特点：长牛 + 科技龙头</h2>'
    + '<p>美股是全球<strong>最成熟、流动性最好</strong>的市场，长期呈慢牛走势。以科技巨头（FAANG+英伟达）为代表的成长股是核心驱动力。美股公司<strong>更爱回购</strong>（buyback）而非分红，回购推高每股收益和股价。适合长期配置、追求成长收益。</p>'

    + '<div class="kb-tip"><strong>汇率影响：</strong>投资港美股涉及<strong>汇率波动</strong>。人民币升值时，港美股的收益会被汇率抵消一部分；贬值时反而增厚收益。这是跨境投资不可忽视的隐性成本/收益。</div>'

    + '<div class="kb-warn"><strong>风险提示：</strong>港美股无涨跌停，单日波动可能极大；美股需熬夜看盘；港股流动性风险（想卖卖不掉）；中概股的政策与退市风险。跨市场投资务必分散、控仓、设止损。</div>'
}
];

/* 让文章能通过 category 反向查找同分类文章（router 使用） */
if (typeof window !== 'undefined') {
    window.KB_CATEGORIES = KB_CATEGORIES;
    window.KB_ARTICLES = KB_ARTICLES;
}
