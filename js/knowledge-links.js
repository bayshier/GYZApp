/* ============================================================
   股宇宙知识库 - 财经网址导航（黄页）
   四大类：国内财经/行情 · 交易所与监管 · 国际财经 · 数据与研报
   ============================================================ */

var KB_LINKS = [
    {
        catId: 'cn',
        catName: '国内财经 / 行情',
        catIcon: '🇨🇳',
        catDesc: '行情、资讯、社区',
        sites: [
            { name: '东方财富网', url: 'https://www.eastmoney.com/', desc: '国内最大的财经门户，行情+资讯+数据+社区', tag: '综合' },
            { name: '同花顺', url: 'https://www.10jqka.com.cn/', desc: '老牌行情软件，资讯与数据服务', tag: '行情' },
            { name: '新浪财经', url: 'https://finance.sina.com.cn/', desc: '7×24小时财经快讯，新闻覆盖全', tag: '资讯' },
            { name: '雪球', url: 'https://xueqiu.com/', desc: '投资者社区，大V观点与组合跟踪', tag: '社区' },
            { name: '第一财经', url: 'https://www.yicai.com/', desc: '专业财经媒体，深度报道', tag: '媒体' },
            { name: '财联社', url: 'https://www.cls.cn/', desc: '电报式快讯，消息最快', tag: '快讯' },
            { name: '和讯网', url: 'http://www.hexun.com/', desc: '老牌财经门户，覆盖面广', tag: '综合' },
            { name: '36氪', url: 'https://36kr.com/', desc: '科技创投与商业资讯', tag: '创投' }
        ]
    },
    {
        catId: 'exchange',
        catName: '交易所与监管',
        catIcon: '🏛️',
        catDesc: '官方权威数据来源',
        sites: [
            { name: '中国证监会', url: 'http://www.csrc.gov.cn/', desc: '最高监管机构，政策法规发布地', tag: '监管' },
            { name: '上海证券交易所', url: 'http://www.sse.com.cn/', desc: '沪市主板、科创板官方平台', tag: '交易所' },
            { name: '深圳证券交易所', url: 'https://www.szse.cn/', desc: '深市主板、创业板官方平台', tag: '交易所' },
            { name: '北京证券交易所', url: 'http://www.bse.cn/', desc: '服务创新型中小企业', tag: '交易所' },
            { name: '香港交易所', url: 'https://www.hkex.com.hk/', desc: '港股官方平台，互联互通', tag: '交易所' }
        ]
    },
    {
        catId: 'global',
        catName: '国际财经',
        catIcon: '🌍',
        catDesc: '全球市场风向标',
        sites: [
            { name: 'Bloomberg 彭博', url: 'https://www.bloomberg.com/', desc: '全球顶级财经资讯与终端', tag: '综合' },
            { name: 'Reuters 路透', url: 'https://www.reuters.com/', desc: '国际通讯社，新闻最快', tag: '资讯' },
            { name: 'Yahoo Finance', url: 'https://finance.yahoo.com/', desc: '免费全球行情与财务数据', tag: '行情' },
            { name: 'Investing.com', url: 'https://www.investing.com/', desc: '全球品种最全的行情平台', tag: '行情' },
            { name: 'MarketWatch', url: 'https://www.marketwatch.com/', desc: '道琼斯旗下，市场数据新闻', tag: '资讯' },
            { name: 'CNBC', url: 'https://www.cnbc.com/', desc: '美国财经电视台官网', tag: '媒体' }
        ]
    },
    {
        catId: 'data',
        catName: '数据与研报',
        catIcon: '📊',
        catDesc: '宏观数据、公告与研报',
        sites: [
            { name: '巨潮资讯网', url: 'http://www.cninfo.com.cn/', desc: '证监会指定信息披露平台，查公告', tag: '公告' },
            { name: '中国人民银行', url: 'http://www.pbc.gov.cn/', desc: '货币政策、利率、汇率官方发布', tag: '宏观' },
            { name: '国家统计局', url: 'http://www.stats.gov.cn/', desc: 'GDP、CPI等宏观经济数据', tag: '宏观数据' },
            { name: '东方财富Choice', url: 'https://choice.eastmoney.com/', desc: '专业金融数据终端', tag: '数据终端' },
            { name: 'Wind 万得', url: 'https://www.wind.com.cn/', desc: '机构首选的金融数据服务', tag: '数据终端' },
            { name: 'TradingView', url: 'https://www.tradingview.com/', desc: '全球热门图表分析与交易社区', tag: '图表工具' }
        ]
    }
];

if (typeof window !== 'undefined') {
    window.KB_LINKS = KB_LINKS;
}
