"use client";

import { Badge } from "kui/badge";
import { Button } from "kui/button";
import { Card, CardContent, CardHeader, CardTitle } from "kui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "kui/tabs";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { pickLocale, tGtm, useGtmData, useGtmLocale } from "../data";
import { computeIcpPillars, PILLAR_LABELS } from "../pillar-scoring";

// Map anchor (#xxx) → tab value so clicking an anchor can switch tabs first
const ANCHOR_TO_TAB: Record<string, string> = {
  messaging: "messaging",
  competitors: "messaging", // competitors now lives inside messaging tab
  "landing-copy": "landing",
};

function scrollToAnchor(anchor: string) {
  // Give tab content time to mount before scrolling
  setTimeout(() => {
    const el = document.getElementById(anchor);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 80);
}

const statusColor = {
  live: "bg-green-500",
  published: "bg-green-500",
  draft: "bg-yellow-500",
  scheduled: "bg-blue-500",
  todo: "bg-zinc-400",
  planned: "bg-zinc-400",
} as const;

const detailText = {
  notFound: {
    en: "ICP not found.",
    "zh-CN": "未找到 ICP。",
    "zh-TW": "未找到 ICP。",
    ja: "ICP が見つかりません。",
    pt: "ICP não encontrado.",
  },
  backToList: {
    en: "Back to list",
    "zh-CN": "返回列表",
    "zh-TW": "返回列表",
    ja: "一覧に戻る",
    pt: "Voltar à lista",
  },
  back: { en: "Back", "zh-CN": "返回", "zh-TW": "返回", ja: "戻る", pt: "Voltar" },
  share: { en: "share", "zh-CN": "占比", "zh-TW": "占比", ja: "シェア", pt: "participação" },
  tabs: {
    overview: {
      en: "🎯 Overview",
      "zh-CN": "🎯 总览",
      "zh-TW": "🎯 總覽",
      ja: "🎯 概要",
      pt: "🎯 Visão geral",
    },
    messaging: {
      en: "💬 Messaging",
      "zh-CN": "💬 信息架构",
      "zh-TW": "💬 訊息架構",
      ja: "💬 メッセージング",
      pt: "💬 Mensagens",
    },
    seo: { en: "🔍 SEO", "zh-CN": "🔍 SEO", "zh-TW": "🔍 SEO", ja: "🔍 SEO", pt: "🔍 SEO" },
    landing: {
      en: "📄 Landing",
      "zh-CN": "📄 落地页",
      "zh-TW": "📄 落地頁",
      ja: "📄 LP",
      pt: "📄 Landing",
    },
    paid: { en: "📢 Paid", "zh-CN": "📢 付费", "zh-TW": "📢 付費", ja: "📢 有料", pt: "📢 Pago" },
    salesOps: {
      en: "💼 Sales & Ops",
      "zh-CN": "💼 销售与运营",
      "zh-TW": "💼 銷售與營運",
      ja: "💼 営業と運用",
      pt: "💼 Vendas e Ops",
    },
  },
  gtmHealth: {
    en: "🚦 Commercial Loop Index",
    "zh-CN": "🚦 商业闭环指数",
    "zh-TW": "🚦 商業閉環指數",
    ja: "🚦 商業ループ指数",
    pt: "🚦 Índice de loop comercial",
  },
  score: { en: "Loop", "zh-CN": "闭环", "zh-TW": "閉環", ja: "ループ", pt: "Loop" },
  pillarWeights: {
    en: "Offer → acquisition → conversion → delivery → retention",
    "zh-CN": "商品 → 获客 → 成交 → 交付 → 留存",
    "zh-TW": "商品 → 獲客 → 成交 → 交付 → 留存",
    ja: "商品 → 獲得 → 成約 → 提供 → 継続",
    pt: "Oferta → aquisição → conversão → entrega → retenção",
  },
  done: { en: "done", "zh-CN": "完成", "zh-TW": "完成", ja: "完了", pt: "concluído" },
  pillars: {
    foundation: {
      en: "Sellable",
      "zh-CN": "能不能卖",
      "zh-TW": "能不能賣",
      ja: "販売可能性",
      pt: "Vendável",
    },
    content: {
      en: "Organic",
      "zh-CN": "自然获客",
      "zh-TW": "自然獲客",
      ja: "オーガニック",
      pt: "Orgânico",
    },
    paid: { en: "Paid", "zh-CN": "付费", "zh-TW": "付費", ja: "有料", pt: "Pago" },
    retention: {
      en: "Delivery",
      "zh-CN": "交付留存",
      "zh-TW": "交付留存",
      ja: "提供と継続",
      pt: "Entrega",
    },
  },
  persona: {
    ageUnit: { en: "years old", "zh-CN": "岁", "zh-TW": "歲", ja: "歳", pt: "anos" },
    dailyLife: {
      en: "⏰ Daily life",
      "zh-CN": "⏰ 一天日常",
      "zh-TW": "⏰ 一天日常",
      ja: "⏰ 1日の流れ",
      pt: "⏰ Dia a dia",
    },
    goals: {
      en: "🎯 Goals",
      "zh-CN": "🎯 目标",
      "zh-TW": "🎯 目標",
      ja: "🎯 目標",
      pt: "🎯 Metas",
    },
    frustrations: {
      en: "😤 Frustrations",
      "zh-CN": "😤 挫败点",
      "zh-TW": "😤 挫敗點",
      ja: "😤 不満",
      pt: "😤 Frustrações",
    },
    buyingTriggers: {
      en: "💡 Buying triggers",
      "zh-CN": "💡 购买触发点",
      "zh-TW": "💡 購買觸發點",
      ja: "💡 購入トリガー",
      pt: "💡 Gatilhos de compra",
    },
    techStack: {
      en: "🛠 Tech stack",
      "zh-CN": "🛠 技术栈",
      "zh-TW": "🛠 技術棧",
      ja: "🛠 技術スタック",
      pt: "🛠 Stack técnica",
    },
    mediaDiet: {
      en: "📺 Media diet",
      "zh-CN": "📺 媒体偏好",
      "zh-TW": "📺 媒體偏好",
      ja: "📺 メディア接触",
      pt: "📺 Dieta de mídia",
    },
  },
  demographics: {
    en: "👤 Demographics",
    "zh-CN": "👤 人群画像",
    "zh-TW": "👤 人群輪廓",
    ja: "👤 デモグラフィック",
    pt: "👤 Demografia",
  },
  painPoints: {
    en: "🔥 Pain points",
    "zh-CN": "🔥 痛点",
    "zh-TW": "🔥 痛點",
    ja: "🔥 課題",
    pt: "🔥 Dores",
  },
  desires: {
    en: "✨ Desires",
    "zh-CN": "✨ 诉求",
    "zh-TW": "✨ 訴求",
    ja: "✨ 欲求",
    pt: "✨ Desejos",
  },
  activation: {
    en: "⚡ Activation — Aha moment",
    "zh-CN": "⚡ 激活 — Aha Moment",
    "zh-TW": "⚡ 啟用 — Aha Moment",
    ja: "⚡ アクティベーション — Aha Moment",
    pt: "⚡ Ativação — Aha moment",
  },
  ahaMoment: {
    en: "Aha moment",
    "zh-CN": "Aha Moment",
    "zh-TW": "Aha Moment",
    ja: "Aha Moment",
    pt: "Aha moment",
  },
  targetDuration: {
    en: "Target duration:",
    "zh-CN": "目标时长:",
    "zh-TW": "目標時長:",
    ja: "目標時間:",
    pt: "Duração alvo:",
  },
  firstFiveMin: {
    en: "⏱ First 5 minutes",
    "zh-CN": "⏱ 前 5 分钟",
    "zh-TW": "⏱ 前 5 分鐘",
    ja: "⏱ 最初の5分",
    pt: "⏱ Primeiros 5 minutos",
  },
  firstDay: {
    en: "📅 Day 1",
    "zh-CN": "📅 第 1 天",
    "zh-TW": "📅 第 1 天",
    ja: "📅 1日目",
    pt: "📅 Dia 1",
  },
  firstWeek: {
    en: "📆 Week 1",
    "zh-CN": "📆 第 1 周",
    "zh-TW": "📆 第 1 週",
    ja: "📆 1週目",
    pt: "📆 Semana 1",
  },
  activationSignal: {
    en: "Activation signal:",
    "zh-CN": "激活信号:",
    "zh-TW": "啟用信號:",
    ja: "アクティベーション指標:",
    pt: "Sinal de ativação:",
  },
  journey: {
    en: "🗺️ Customer journey map",
    "zh-CN": "🗺️ 客户旅程地图",
    "zh-TW": "🗺️ 客戶旅程地圖",
    ja: "🗺️ カスタマージャーニー",
    pt: "🗺️ Mapa da jornada",
  },
  stages: {
    awareness: {
      en: "Awareness",
      "zh-CN": "认知",
      "zh-TW": "認知",
      ja: "認知",
      pt: "Conhecimento",
    },
    consideration: {
      en: "Consideration",
      "zh-CN": "考虑",
      "zh-TW": "考慮",
      ja: "検討",
      pt: "Consideração",
    },
    decision: { en: "Decision", "zh-CN": "决策", "zh-TW": "決策", ja: "決定", pt: "Decisão" },
    activation: {
      en: "Activation",
      "zh-CN": "激活",
      "zh-TW": "啟用",
      ja: "利用開始",
      pt: "Ativação",
    },
    retention: { en: "Retention", "zh-CN": "留存", "zh-TW": "留存", ja: "継続", pt: "Retenção" },
    advocacy: { en: "Advocacy", "zh-CN": "推荐", "zh-TW": "推薦", ja: "推奨", pt: "Defesa" },
  },
  positioningCategory: {
    en: "📐 Positioning & category",
    "zh-CN": "📐 定位与品类",
    "zh-TW": "📐 定位與品類",
    ja: "📐 ポジショニングとカテゴリ",
    pt: "📐 Posicionamento e categoria",
  },
  categoryLabel: {
    en: "Category — what category we own",
    "zh-CN": "Category — 我们是什么品类",
    "zh-TW": "Category — 我們是什麼品類",
    ja: "Category — 所属カテゴリ",
    pt: "Categoria — o que somos",
  },
  positioningStatement: {
    en: "Positioning statement — Moore 6-line positioning",
    "zh-CN": "Positioning Statement — Moore 6 行定位",
    "zh-TW": "Positioning Statement — Moore 6 行定位",
    ja: "Positioning Statement — Moore 6行",
    pt: "Declaração de posicionamento — Moore em 6 linhas",
  },
  categoryPositioning: {
    creator: {
      en: "🆕 Category creator",
      "zh-CN": "🆕 品类开创者",
      "zh-TW": "🆕 品類開創者",
      ja: "🆕 カテゴリ創造者",
      pt: "🆕 Criador de categoria",
    },
    challenger: {
      en: "⚔️ Challenger",
      "zh-CN": "⚔️ 挑战者",
      "zh-TW": "⚔️ 挑戰者",
      ja: "⚔️ チャレンジャー",
      pt: "⚔️ Desafiante",
    },
    alternative: {
      en: "🔄 Alternative",
      "zh-CN": "🔄 替代方案",
      "zh-TW": "🔄 替代方案",
      ja: "🔄 代替案",
      pt: "🔄 Alternativa",
    },
  },
  positioningLines: {
    for: { en: "For ", "zh-CN": "For ", "zh-TW": "For ", ja: "対象: ", pt: "Para " },
    who: { en: "Who ", "zh-CN": "Who ", "zh-TW": "Who ", ja: "課題: ", pt: "Que " },
    productIs: {
      en: "Our product is a ",
      "zh-CN": "Our product is a ",
      "zh-TW": "Our product is a ",
      ja: "プロダクトは ",
      pt: "Nosso produto é um ",
    },
    that: { en: "That ", "zh-CN": "That ", "zh-TW": "That ", ja: "提供価値: ", pt: "Que " },
    unlike: {
      en: "Unlike ",
      "zh-CN": "Unlike ",
      "zh-TW": "Unlike ",
      ja: "異なり: ",
      pt: "Diferente de ",
    },
    product: {
      en: "Our product ",
      "zh-CN": "Our product ",
      "zh-TW": "Our product ",
      ja: "私たちは ",
      pt: "Nosso produto ",
    },
  },
  messaging: {
    en: "💬 Messaging",
    "zh-CN": "💬 信息架构",
    "zh-TW": "💬 訊息架構",
    ja: "💬 メッセージング",
    pt: "💬 Mensagens",
  },
  valueProposition: {
    en: "Value proposition",
    "zh-CN": "价值主张",
    "zh-TW": "價值主張",
    ja: "価値提案",
    pt: "Proposta de valor",
  },
  tagline: { en: "Tagline", "zh-CN": "标语", "zh-TW": "標語", ja: "タグライン", pt: "Tagline" },
  keyMessages: {
    en: "Key messages",
    "zh-CN": "核心信息",
    "zh-TW": "核心訊息",
    ja: "主要メッセージ",
    pt: "Mensagens-chave",
  },
  beforeAfter: {
    en: "Before / after narrative",
    "zh-CN": "Before / After 叙事",
    "zh-TW": "Before / After 敘事",
    ja: "Before / After ナラティブ",
    pt: "Narrativa antes/depois",
  },
  before: {
    en: "😤 Before",
    "zh-CN": "😤 Before",
    "zh-TW": "😤 Before",
    ja: "😤 Before",
    pt: "😤 Antes",
  },
  after: {
    en: "✨ After",
    "zh-CN": "✨ After",
    "zh-TW": "✨ After",
    ja: "✨ After",
    pt: "✨ Depois",
  },
  proofPoints: {
    en: "📊 Proof points",
    "zh-CN": "📊 证明点",
    "zh-TW": "📊 證明點",
    ja: "📊 証拠",
    pt: "📊 Provas",
  },
  customerStories: {
    en: "🧾 Customer stories",
    "zh-CN": "🧾 客户案例",
    "zh-TW": "🧾 客戶案例",
    ja: "🧾 顧客事例",
    pt: "🧾 Histórias de clientes",
  },
  customerStoryLabels: {
    customer: {
      en: "Customer",
      "zh-CN": "客户",
      "zh-TW": "客戶",
      ja: "顧客",
      pt: "Cliente",
    },
    problem: {
      en: "Problem",
      "zh-CN": "问题",
      "zh-TW": "問題",
      ja: "課題",
      pt: "Problema",
    },
    solution: {
      en: "Solution",
      "zh-CN": "方案",
      "zh-TW": "方案",
      ja: "解決策",
      pt: "Solução",
    },
    outcome: {
      en: "Outcome",
      "zh-CN": "结果",
      "zh-TW": "結果",
      ja: "成果",
      pt: "Resultado",
    },
    assets: {
      en: "Assets",
      "zh-CN": "素材",
      "zh-TW": "素材",
      ja: "アセット",
      pt: "Ativos",
    },
  },
  differentiators: {
    en: "⭐ Differentiators — unique edge",
    "zh-CN": "⭐ 差异化 — 独特优势",
    "zh-TW": "⭐ 差異化 — 獨特優勢",
    ja: "⭐ 差別化 — 独自性",
    pt: "⭐ Diferenciais — vantagem única",
  },
  competitors: {
    en: "⚔️ Competitors",
    "zh-CN": "⚔️ 竞品",
    "zh-TW": "⚔️ 競品",
    ja: "⚔️ 競合",
    pt: "⚔️ Concorrentes",
  },
  compare: {
    en: "Compare:",
    "zh-CN": "Compare:",
    "zh-TW": "Compare:",
    ja: "比較:",
    pt: "Comparar:",
  },
  their: { en: "Them:", "zh-CN": "他们:", "zh-TW": "他們:", ja: "競合:", pt: "Eles:" },
  ours: { en: "Us:", "zh-CN": "我们:", "zh-TW": "我們:", ja: "私たち:", pt: "Nós:" },
  compareStatus: {
    live: { en: "Live", "zh-CN": "已上线", "zh-TW": "已上線", ja: "公開中", pt: "Publicado" },
    draft: { en: "Draft", "zh-CN": "草稿", "zh-TW": "草稿", ja: "下書き", pt: "Rascunho" },
    todo: { en: "Todo", "zh-CN": "待做", "zh-TW": "待做", ja: "未対応", pt: "A fazer" },
  },
  objectionHandling: {
    en: "🛡️ Objection handling",
    "zh-CN": "🛡️ 异议处理",
    "zh-TW": "🛡️ 異議處理",
    ja: "🛡️ 反論対応",
    pt: "🛡️ Tratamento de objeções",
  },
  contentPillars: {
    en: "📌 Content pillars — long-term content strategy",
    "zh-CN": "📌 内容支柱 — 长期内容战略",
    "zh-TW": "📌 內容支柱 — 長期內容策略",
    ja: "📌 コンテンツピラー — 長期戦略",
    pt: "📌 Pilares de conteúdo — estratégia de longo prazo",
  },
  hook: { en: "Hook:", "zh-CN": "Hook:", "zh-TW": "Hook:", ja: "Hook:", pt: "Gancho:" },
  voiceTone: {
    en: "🎙️ Voice & tone",
    "zh-CN": "🎙️ 语气与风格",
    "zh-TW": "🎙️ 語氣與風格",
    ja: "🎙️ ボイスとトーン",
    pt: "🎙️ Voz e tom",
  },
  traits: {
    en: "Traits — speaking style",
    "zh-CN": "Traits — 说话风格",
    "zh-TW": "Traits — 說話風格",
    ja: "Traits — 話し方",
    pt: "Traços — estilo de fala",
  },
  do: { en: "✅ Do", "zh-CN": "✅ Do", "zh-TW": "✅ Do", ja: "✅ Do", pt: "✅ Fazer" },
  dont: {
    en: "❌ Don't",
    "zh-CN": "❌ Don't",
    "zh-TW": "❌ Don't",
    ja: "❌ Don't",
    pt: "❌ Evitar",
  },
  seoMessaging: {
    en: "🔍 SEO / GEO messaging",
    "zh-CN": "🔍 SEO / GEO 信息",
    "zh-TW": "🔍 SEO / GEO 訊息",
    ja: "🔍 SEO / GEO メッセージ",
    pt: "🔍 Mensagens SEO / GEO",
  },
  primaryKeywords: {
    en: "Primary keywords — must-win terms",
    "zh-CN": "Primary Keywords — 必争关键词",
    "zh-TW": "Primary Keywords — 必爭關鍵詞",
    ja: "Primary Keywords — 重点キーワード",
    pt: "Palavras-chave primárias",
  },
  longTailKeywords: {
    en: "Long-tail keywords",
    "zh-CN": "Long-Tail Keywords — 长尾词",
    "zh-TW": "Long-Tail Keywords — 長尾詞",
    ja: "Long-tail Keywords",
    pt: "Palavras-chave long-tail",
  },
  competitorSearchTerms: {
    en: "Competitor search terms",
    "zh-CN": "Competitor Search Terms — 竞品拦截词",
    "zh-TW": "Competitor Search Terms — 競品攔截詞",
    ja: "競合検索語句",
    pt: "Termos de concorrentes",
  },
  titleTemplates: {
    en: "Title templates",
    "zh-CN": "Title Templates — 标题模板",
    "zh-TW": "Title Templates — 標題模板",
    ja: "タイトルテンプレート",
    pt: "Modelos de título",
  },
  metaDescriptions: {
    en: "Meta descriptions",
    "zh-CN": "Meta Descriptions — 描述变体",
    "zh-TW": "Meta Descriptions — 描述變體",
    ja: "メタディスクリプション",
    pt: "Meta descriptions",
  },
  narrativeAngles: {
    en: "Narrative angles",
    "zh-CN": "Narrative Angles — 内容切入角度",
    "zh-TW": "Narrative Angles — 內容切入角度",
    ja: "ナラティブ角度",
    pt: "Ângulos narrativos",
  },
  serpPreview: {
    en: "SERP preview — controlled by page title + meta description",
    "zh-CN": "SERP Preview — Google 搜索结果预览（通过 page title + meta description 控制）",
    "zh-TW": "SERP Preview — Google 搜尋結果預覽（透過 page title + meta description 控制）",
    ja: "SERP Preview — page title + meta description で制御",
    pt: "Prévia SERP — controlada por title + meta description",
  },
  titleLength: { en: "Title", "zh-CN": "Title", "zh-TW": "Title", ja: "Title", pt: "Título" },
  descriptionLength: {
    en: "Description",
    "zh-CN": "Description",
    "zh-TW": "Description",
    ja: "Description",
    pt: "Descrição",
  },
  landingCopy: {
    en: "📄 Landing page copy",
    "zh-CN": "📄 落地页文案",
    "zh-TW": "📄 落地頁文案",
    ja: "📄 LP コピー",
    pt: "📄 Copy da landing page",
  },
  hero: {
    en: "Hero — first viewport",
    "zh-CN": "Hero — 首屏",
    "zh-TW": "Hero — 首屏",
    ja: "Hero — ファーストビュー",
    pt: "Hero — primeira dobra",
  },
  problem: {
    en: "Problem — pain amplification",
    "zh-CN": "Problem — 痛点放大",
    "zh-TW": "Problem — 痛點放大",
    ja: "Problem — 課題訴求",
    pt: "Problema — amplificação da dor",
  },
  messagingBlocks: {
    en: "Messaging — 3 core message blocks",
    "zh-CN": "Messaging — 3 核心信息块",
    "zh-TW": "Messaging — 3 核心訊息塊",
    ja: "Messaging — 3つの主要ブロック",
    pt: "Mensagens — 3 blocos centrais",
  },
  features: {
    en: "Features — product capabilities",
    "zh-CN": "Features — 产品能力",
    "zh-TW": "Features — 產品能力",
    ja: "Features — プロダクト機能",
    pt: "Features — capacidades do produto",
  },
  useCases: {
    en: "Use cases — scenarios",
    "zh-CN": "Use Cases — 场景",
    "zh-TW": "Use Cases — 場景",
    ja: "Use Cases — 利用シーン",
    pt: "Use cases — cenários",
  },
  socialProof: {
    en: "Social proof",
    "zh-CN": "社会证明",
    "zh-TW": "社會證明",
    ja: "ソーシャルプルーフ",
    pt: "Prova social",
  },
  faq: { en: "FAQ", "zh-CN": "FAQ", "zh-TW": "FAQ", ja: "FAQ", pt: "FAQ" },
  finalCta: {
    en: "Final CTA",
    "zh-CN": "最终 CTA",
    "zh-TW": "最終 CTA",
    ja: "最終 CTA",
    pt: "CTA final",
  },
  sem: {
    en: "📢 SEM — paid ads messaging",
    "zh-CN": "📢 SEM — 付费广告信息",
    "zh-TW": "📢 SEM — 付費廣告訊息",
    ja: "📢 SEM — 有料広告メッセージ",
    pt: "📢 SEM — mensagens de anúncios pagos",
  },
  keywordsBids: {
    en: "Keywords — terms + bids",
    "zh-CN": "Keywords — 关键词 + 出价",
    "zh-TW": "Keywords — 關鍵詞 + 出價",
    ja: "Keywords — キーワード + 入札",
    pt: "Keywords — termos + lances",
  },
  negativeKeywords: {
    en: "Negative keywords",
    "zh-CN": "Negative Keywords — 排除词",
    "zh-TW": "Negative Keywords — 排除詞",
    ja: "Negative Keywords",
    pt: "Palavras-chave negativas",
  },
  adCopy: {
    en: "Ad copy — Google RSA assets",
    "zh-CN": "Ad Copy — Google RSA 素材",
    "zh-TW": "Ad Copy — Google RSA 素材",
    ja: "Ad Copy — Google RSA 素材",
    pt: "Ad copy — assets Google RSA",
  },
  headlines: {
    en: "Headlines",
    "zh-CN": "Headlines",
    "zh-TW": "Headlines",
    ja: "Headlines",
    pt: "Headlines",
  },
  descriptions: {
    en: "Descriptions",
    "zh-CN": "Descriptions",
    "zh-TW": "Descriptions",
    ja: "Descriptions",
    pt: "Descriptions",
  },
  ctas: { en: "CTAs", "zh-CN": "CTA", "zh-TW": "CTA", ja: "CTA", pt: "CTAs" },
  variants: {
    en: "variants",
    "zh-CN": "个变体",
    "zh-TW": "個變體",
    ja: "件のバリアント",
    pt: "variantes",
  },
  youtubeScenarios: {
    en: "YouTube ad scenarios — creative by format",
    "zh-CN": "YouTube Ad 场景 — 不同格式对应不同创意",
    "zh-TW": "YouTube Ad 場景 — 不同格式對應不同創意",
    ja: "YouTube Ad シナリオ — フォーマット別クリエイティブ",
    pt: "Cenários YouTube Ad — criativos por formato",
  },
  viewVideo: {
    en: "View video →",
    "zh-CN": "查看视频 →",
    "zh-TW": "查看影片 →",
    ja: "動画を見る →",
    pt: "Ver vídeo →",
  },
  offers: {
    en: "🛒 What we sell them",
    "zh-CN": "🛒 卖给他们什么",
    "zh-TW": "🛒 賣給他們什麼",
    ja: "🛒 提供するもの",
    pt: "🛒 O que vendemos",
  },
  primary: { en: "Primary", "zh-CN": "主推", "zh-TW": "主推", ja: "主力", pt: "Principal" },
  channels: {
    en: "📡 Channels",
    "zh-CN": "📡 渠道",
    "zh-TW": "📡 渠道",
    ja: "📡 チャネル",
    pt: "📡 Canais",
  },
  producedContent: {
    en: "📦 Content produced",
    "zh-CN": "📦 已产出内容",
    "zh-TW": "📦 已產出內容",
    ja: "📦 制作済みコンテンツ",
    pt: "📦 Conteúdo produzido",
  },
  funnel: {
    en: "🔻 Funnel",
    "zh-CN": "🔻 漏斗",
    "zh-TW": "🔻 漏斗",
    ja: "🔻 ファネル",
    pt: "🔻 Funil",
  },
  nextActions: {
    en: "🎯 Next actions",
    "zh-CN": "🎯 下一步行动",
    "zh-TW": "🎯 下一步行動",
    ja: "🎯 次のアクション",
    pt: "🎯 Próximas ações",
  },
  retrospective: {
    en: "📋 Retrospective",
    "zh-CN": "📋 复盘",
    "zh-TW": "📋 復盤",
    ja: "📋 振り返り",
    pt: "📋 Retrospectiva",
  },
  noEntries: {
    en: "No entries yet",
    "zh-CN": "暂无记录",
    "zh-TW": "暫無記錄",
    ja: "まだ記録がありません",
    pt: "Ainda sem registros",
  },
};

function Section({
  title,
  id,
  children,
}: {
  title: string;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <Card id={id} className={id ? "scroll-mt-4" : undefined}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function GtmIcpDetailPage() {
  const locale = useGtmLocale();
  const data = useGtmData();
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const icp = data.icps.find((i) => i.id === params.id);

  // Tab state (controlled) — syncs with URL hash
  const [activeTab, setActiveTab] = useState("overview");

  // On mount (and when hash changes), pick initial tab from URL hash
  useEffect(() => {
    const hash = window.location.hash.slice(1); // strip "#"
    if (hash && ANCHOR_TO_TAB[hash]) {
      setActiveTab(ANCHOR_TO_TAB[hash]);
      scrollToAnchor(hash);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!icp) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">{tGtm(detailText.notFound, locale)}</p>
        <Button variant="ghost" onClick={() => navigate("/icps")}>
          {tGtm(detailText.backToList, locale)}
        </Button>
      </div>
    );
  }

  const pillars = computeIcpPillars(icp, data);

  return (
    <div className="p-6 space-y-4 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/icps")}
            className="-ml-2 mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> {tGtm(detailText.back, locale)}
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span className="text-3xl">{icp.emoji}</span>
            {pickLocale(icp.name, locale)}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {pickLocale(icp.description, locale)}
          </p>
        </div>
        <div className="text-right shrink-0">
          <Badge>
            {icp.share}% {tGtm(detailText.share, locale)}
          </Badge>
          <div className="flex gap-1 mt-2">
            {icp.businessLineIds.map((id) => (
              <Badge key={id} variant="outline" className="text-xs">
                {id}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="h-auto !inline-flex flex-wrap justify-start">
          <TabsTrigger value="overview" className="data-[state=active]:bg-white">
            {tGtm(detailText.tabs.overview, locale)}
          </TabsTrigger>
          <TabsTrigger value="messaging" className="data-[state=active]:bg-white">
            {tGtm(detailText.tabs.messaging, locale)}
          </TabsTrigger>
          <TabsTrigger value="seo" className="data-[state=active]:bg-white">
            {tGtm(detailText.tabs.seo, locale)}
          </TabsTrigger>
          <TabsTrigger value="landing" className="data-[state=active]:bg-white">
            {tGtm(detailText.tabs.landing, locale)}
          </TabsTrigger>
          <TabsTrigger value="paid" className="data-[state=active]:bg-white">
            {tGtm(detailText.tabs.paid, locale)}
          </TabsTrigger>
          <TabsTrigger value="sales-ops" className="data-[state=active]:bg-white">
            {tGtm(detailText.tabs.salesOps, locale)}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* GTM Health — Pillar view */}
          <Card className="border-primary/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                {tGtm(detailText.gtmHealth, locale)}
                <Badge
                  className={
                    pillars.overallHealth === "green"
                      ? "bg-green-500 text-white"
                      : pillars.overallHealth === "yellow"
                        ? "bg-yellow-500 text-white"
                        : "bg-red-500 text-white"
                  }
                >
                  {tGtm(detailText.score, locale)} {pillars.overallPct}%
                </Badge>
                <span className="text-xs text-muted-foreground font-normal ml-auto">
                  {tGtm(detailText.pillarWeights, locale)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Top row: 4 pillar cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {(["foundation", "content", "paid", "retention"] as const).map((key) => {
                  const p = pillars[key];
                  const label = PILLAR_LABELS[key];
                  const localizedLabel = detailText.pillars[key];
                  const bg =
                    p.health === "green"
                      ? "bg-green-500/10 border-green-500/40"
                      : p.health === "yellow"
                        ? "bg-yellow-500/10 border-yellow-500/40"
                        : "bg-red-500/10 border-red-500/40";
                  return (
                    <div key={key} className={`rounded-lg border p-4 ${bg}`}>
                      <div>
                        <div className="text-sm flex items-center gap-1.5">
                          <span>{label.emoji}</span>
                          <span className="font-bold">{tGtm(localizedLabel, locale)}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">{label.desc}</div>
                      </div>
                      <div className="text-3xl font-bold font-mono mt-2">
                        {p.pct}
                        <span className="text-base text-muted-foreground">%</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {p.doneCount}/{p.totalCount} {tGtm(detailText.done, locale)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom: 4 checklists */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {(["foundation", "content", "paid", "retention"] as const).map((key) => {
                  const p = pillars[key];
                  const label = PILLAR_LABELS[key];
                  const localizedLabel = detailText.pillars[key];
                  return (
                    <div key={key}>
                      <div className="text-sm font-bold mb-3 flex items-center gap-1.5 border-b pb-2">
                        <span>{label.emoji}</span>
                        <span>{tGtm(localizedLabel, locale)}</span>
                        <span className="text-muted-foreground font-normal ml-auto text-xs">
                          {p.doneCount}/{p.totalCount}
                        </span>
                      </div>
                      <div className="space-y-3">
                        {p.items.map((item) => {
                          const itemUrl = item.url;
                          const labelBlock = (
                            <div className="flex-1 min-w-0">
                              <div
                                className={`text-sm leading-snug ${item.done ? "" : "text-muted-foreground"}`}
                              >
                                {item.label}
                              </div>
                              {item.hintLines && (
                                <div className="mt-2 space-y-1 pl-1">
                                  {item.hintLines.map((line) => (
                                    <div
                                      key={line.text}
                                      className="flex items-center gap-1.5 text-sm text-muted-foreground/70"
                                    >
                                      {line.done === undefined ? (
                                        <span className="text-muted-foreground/50 w-3 text-center shrink-0">
                                          ·
                                        </span>
                                      ) : (
                                        <span
                                          className={`w-3 text-center shrink-0 ${line.done ? "text-green-500" : "text-red-400"}`}
                                        >
                                          {line.done ? "✓" : "✗"}
                                        </span>
                                      )}
                                      <span>{line.text}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {item.hint && (
                                <div className="text-sm text-muted-foreground/70 mt-2 leading-snug whitespace-pre-line pl-1">
                                  {item.hint}
                                </div>
                              )}
                            </div>
                          );
                          return (
                            <div key={item.label} className="flex items-start gap-2">
                              <span
                                className={`mt-0.5 text-sm ${item.done ? "text-green-500" : "text-muted-foreground"}`}
                              >
                                {item.done ? "✓" : "○"}
                              </span>
                              {itemUrl ? (
                                itemUrl.startsWith("#") ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      const anchor = itemUrl.slice(1);
                                      const targetTab =
                                        ANCHOR_TO_TAB[anchor as keyof typeof ANCHOR_TO_TAB];
                                      if (targetTab) {
                                        setActiveTab(targetTab);
                                      }
                                      scrollToAnchor(anchor);
                                      // Also update URL hash for deep-linking
                                      if (history.replaceState) {
                                        history.replaceState(null, "", itemUrl);
                                      }
                                    }}
                                    className="flex-1 min-w-0 hover:text-primary text-left"
                                  >
                                    {labelBlock}
                                  </button>
                                ) : itemUrl.startsWith("/") && !itemUrl.startsWith("/kit/") ? (
                                  <a
                                    href={itemUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 min-w-0 hover:text-primary"
                                  >
                                    {labelBlock}
                                  </a>
                                ) : (
                                  <Link
                                    href={itemUrl}
                                    className="flex-1 min-w-0 hover:text-primary"
                                  >
                                    {labelBlock}
                                  </Link>
                                )
                              ) : (
                                labelBlock
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Persona Card — representative customer profile */}
          {icp.persona && (
            <Card className="bg-gradient-to-br from-primary/5 via-background to-background border-primary/30">
              <CardContent className="pt-6">
                <div className="flex gap-5">
                  {/* Avatar */}
                  <div className="shrink-0">
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-4xl border-2 border-primary/40">
                      {icp.persona.avatarUrl ?? "👤"}
                    </div>
                  </div>

                  {/* Identity */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <h2 className="text-2xl font-bold">
                        {icp.persona.firstName} {icp.persona.lastName ?? ""}
                      </h2>
                      <span className="text-base text-muted-foreground">
                        {icp.persona.age}
                        {tGtm(detailText.persona.ageUnit, locale)}
                        {icp.persona.gender ? ` · ${icp.persona.gender}` : ""}
                        {icp.persona.location ? ` · ${icp.persona.location}` : ""}
                      </span>
                    </div>
                    <div className="text-base mt-1">
                      <span className="font-medium">{icp.persona.jobTitle}</span>
                      {icp.persona.company && (
                        <span className="text-muted-foreground"> @ {icp.persona.company}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {icp.persona.industry && (
                        <Badge variant="outline" className="text-xs">
                          {icp.persona.industry}
                        </Badge>
                      )}
                      {icp.persona.companySize && (
                        <Badge variant="outline" className="text-xs">
                          {icp.persona.companySize}
                        </Badge>
                      )}
                      {icp.persona.income && (
                        <Badge variant="outline" className="text-xs">
                          {icp.persona.income}
                        </Badge>
                      )}
                      {icp.persona.education && (
                        <Badge variant="outline" className="text-xs">
                          {icp.persona.education}
                        </Badge>
                      )}
                      {icp.demographics.map((d) => (
                        <Badge key={d} variant="secondary" className="text-xs">
                          {d}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {icp.persona.quote && (
                  <div className="mt-4 border-l-2 border-primary/40 pl-3 italic text-base">
                    "{icp.persona.quote}"
                  </div>
                )}
                {icp.persona.bio && (
                  <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                    {icp.persona.bio}
                  </p>
                )}

                {/* Persona detail grid */}
                <div className="border-t border-border/50 mt-6 pt-6">
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                    {icp.persona.dailyLife && icp.persona.dailyLife.length > 0 && (
                      <div>
                        <div className="text-sm font-semibold text-muted-foreground mb-3">
                          {tGtm(detailText.persona.dailyLife, locale)}
                        </div>
                        <ul className="space-y-2 text-sm">
                          {icp.persona.dailyLife.map((d) => (
                            <li key={d} className="flex gap-2 text-foreground/80">
                              <span className="shrink-0 text-muted-foreground">·</span>
                              <span>{d}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {icp.persona.goals && icp.persona.goals.length > 0 && (
                      <div>
                        <div className="text-sm font-semibold text-green-600 dark:text-green-400 mb-3">
                          {tGtm(detailText.persona.goals, locale)}
                        </div>
                        <ul className="space-y-2 text-sm">
                          {icp.persona.goals.map((g) => (
                            <li key={g} className="flex gap-2 text-foreground/80">
                              <span className="shrink-0 text-muted-foreground">·</span>
                              <span>{g}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {icp.persona.frustrations && icp.persona.frustrations.length > 0 && (
                      <div>
                        <div className="text-sm font-semibold text-red-500 mb-3">
                          {tGtm(detailText.persona.frustrations, locale)}
                        </div>
                        <ul className="space-y-2 text-sm">
                          {icp.persona.frustrations.map((f) => (
                            <li key={f} className="flex gap-2 text-foreground/80">
                              <span className="shrink-0 text-muted-foreground">·</span>
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {icp.persona.buyingTriggers && icp.persona.buyingTriggers.length > 0 && (
                      <div>
                        <div className="text-sm font-semibold text-blue-500 mb-3">
                          {tGtm(detailText.persona.buyingTriggers, locale)}
                        </div>
                        <ul className="space-y-2 text-sm">
                          {icp.persona.buyingTriggers.map((b) => (
                            <li key={b} className="flex gap-2 text-foreground/80">
                              <span className="shrink-0 text-muted-foreground">·</span>
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {icp.persona.techStack && icp.persona.techStack.length > 0 && (
                      <div>
                        <div className="text-sm font-semibold text-muted-foreground mb-3">
                          {tGtm(detailText.persona.techStack, locale)}
                        </div>
                        <ul className="space-y-2 text-sm">
                          {icp.persona.techStack.map((t) => (
                            <li key={t} className="flex gap-2 text-foreground/80">
                              <span className="shrink-0 text-muted-foreground">·</span>
                              <span>{t}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {icp.persona.mediaDiet && icp.persona.mediaDiet.length > 0 && (
                      <div>
                        <div className="text-sm font-semibold text-muted-foreground mb-3">
                          {tGtm(detailText.persona.mediaDiet, locale)}
                        </div>
                        <ul className="space-y-2 text-sm">
                          {icp.persona.mediaDiet.map((m) => (
                            <li key={m} className="flex gap-2 text-foreground/80">
                              <span className="shrink-0 text-muted-foreground">·</span>
                              <span>{m}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Demographics fallback (only when no persona) */}
          {!icp.persona && icp.demographics.length > 0 && (
            <Section title={tGtm(detailText.demographics, locale)}>
              <div className="flex flex-wrap gap-2">
                {icp.demographics.map((d) => (
                  <Badge key={d} variant="secondary">
                    {d}
                  </Badge>
                ))}
              </div>
            </Section>
          )}

          {/* Pain & Desire (2-col) */}
          <div className="grid md:grid-cols-2 gap-4">
            <Section title={tGtm(detailText.painPoints, locale)}>
              <ul className="space-y-1.5 text-sm">
                {icp.painPoints.map((p) => (
                  <li key={p} className="text-foreground/80">
                    • {p}
                  </li>
                ))}
              </ul>
            </Section>
            <Section title={tGtm(detailText.desires, locale)}>
              <ul className="space-y-1.5 text-sm">
                {icp.desires.map((d) => (
                  <li key={d} className="text-foreground/80">
                    • {d}
                  </li>
                ))}
              </ul>
            </Section>
          </div>

          {/* Activation / Aha Moment */}
          {icp.activation && (
            <Section title={tGtm(detailText.activation, locale)}>
              <div className="space-y-3">
                <div className="border-l-4 border-primary pl-3">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                    {tGtm(detailText.ahaMoment, locale)}
                  </div>
                  <div className="text-sm font-medium">{icp.activation.ahaMoment}</div>
                  {icp.activation.timeToAha && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {tGtm(detailText.targetDuration, locale)}{" "}
                      <span className="font-mono text-primary">{icp.activation.timeToAha}</span>
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-3 gap-3">
                  {icp.activation.firstFiveMin && icp.activation.firstFiveMin.length > 0 && (
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                        {tGtm(detailText.firstFiveMin, locale)}
                      </div>
                      <ol className="space-y-0.5 text-xs list-decimal list-inside">
                        {icp.activation.firstFiveMin.map((s) => (
                          <li key={s} className="text-foreground/80">
                            {s}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                  {icp.activation.firstDay && icp.activation.firstDay.length > 0 && (
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                        {tGtm(detailText.firstDay, locale)}
                      </div>
                      <ul className="space-y-0.5 text-xs">
                        {icp.activation.firstDay.map((s) => (
                          <li key={s} className="text-foreground/80">
                            · {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {icp.activation.firstWeek && icp.activation.firstWeek.length > 0 && (
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                        {tGtm(detailText.firstWeek, locale)}
                      </div>
                      <ul className="space-y-0.5 text-xs">
                        {icp.activation.firstWeek.map((s) => (
                          <li key={s} className="text-foreground/80">
                            · {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {icp.activation.successSignal && (
                  <div className="text-xs bg-green-500/10 border border-green-500/30 rounded p-2">
                    <span className="text-green-500 font-bold">
                      ✓ {tGtm(detailText.activationSignal, locale)}{" "}
                    </span>
                    {icp.activation.successSignal}
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Customer Journey Map */}
          {icp.journey && icp.journey.stages.length > 0 && (
            <Section title={tGtm(detailText.journey, locale)}>
              <div className="space-y-3">
                {icp.journey.stages.map((s) => {
                  const stageEmoji: Record<string, string> = {
                    awareness: "👀",
                    consideration: "🤔",
                    decision: "💡",
                    activation: "⚡",
                    retention: "🔄",
                    advocacy: "📣",
                  };
                  const stageLabel = detailText.stages[s.stage];
                  return (
                    <div key={s.stage} className="border border-border rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{stageEmoji[s.stage]}</span>
                        <span className="font-bold text-sm">
                          {stageLabel ? tGtm(stageLabel, locale) : s.stage}
                        </span>
                        {s.successMetric && (
                          <span className="text-[10px] text-green-500 ml-auto">
                            ✓ {s.successMetric}
                          </span>
                        )}
                      </div>
                      {s.mentalState && (
                        <div className="text-xs italic text-muted-foreground mb-2">
                          "{s.mentalState}"
                        </div>
                      )}
                      {s.touchpoints && s.touchpoints.length > 0 && (
                        <div className="space-y-1">
                          {s.touchpoints.map((t) => (
                            <div key={t.channel} className="flex items-start gap-2 text-xs">
                              <Badge variant="outline" className="text-[9px] shrink-0">
                                {t.channel}
                              </Badge>
                              <div className="flex-1 min-w-0">
                                {t.asset && (
                                  <span className="text-muted-foreground">{t.asset} · </span>
                                )}
                                {t.message && <span>{t.message}</span>}
                                {t.cta && <span className="text-primary ml-1">→ {t.cta}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {s.blockers && s.blockers.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {s.blockers.map((b) => (
                            <Badge
                              key={b}
                              variant="outline"
                              className="text-[9px] text-red-500 border-red-500/40"
                            >
                              ⚠ {b}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Section>
          )}
        </TabsContent>

        <TabsContent value="messaging" className="space-y-4">
          {/* Category + Positioning (Strategy Layer) */}
          {(icp.category || icp.positioningStatement) && (
            <Section title={tGtm(detailText.positioningCategory, locale)}>
              <div className="space-y-4">
                {icp.category && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                      {tGtm(detailText.categoryLabel, locale)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="text-sm">
                        {icp.category}
                      </Badge>
                      {icp.categoryPositioning && (
                        <Badge variant="outline" className="text-[10px]">
                          {icp.categoryPositioning === "creator"
                            ? tGtm(detailText.categoryPositioning.creator, locale)
                            : icp.categoryPositioning === "challenger"
                              ? tGtm(detailText.categoryPositioning.challenger, locale)
                              : tGtm(detailText.categoryPositioning.alternative, locale)}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
                {icp.positioningStatement && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                      {tGtm(detailText.positioningStatement, locale)}
                    </div>
                    <div className="border-l-2 border-primary/40 pl-3 text-sm leading-relaxed font-mono bg-muted/30 rounded-r p-3">
                      <div>
                        <span className="text-muted-foreground">
                          {tGtm(detailText.positioningLines.for, locale)}
                        </span>
                        {icp.positioningStatement.forCustomer}
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          {tGtm(detailText.positioningLines.who, locale)}
                        </span>
                        {icp.positioningStatement.need}
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          {tGtm(detailText.positioningLines.productIs, locale)}
                        </span>
                        {icp.positioningStatement.category}
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          {tGtm(detailText.positioningLines.that, locale)}
                        </span>
                        {icp.positioningStatement.keyBenefit}
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          {tGtm(detailText.positioningLines.unlike, locale)}
                        </span>
                        {icp.positioningStatement.primaryAlternative}
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          {tGtm(detailText.positioningLines.product, locale)}
                        </span>
                        {icp.positioningStatement.differentiator}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Messaging (Copy Layer) */}
          <Section title={tGtm(detailText.messaging, locale)} id="messaging">
            <div className="space-y-4">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {tGtm(detailText.valueProposition, locale)}
                </div>
                <div className="text-lg font-bold mt-0.5">{pickLocale(icp.valueProp, locale)}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {tGtm(detailText.tagline, locale)}
                </div>
                <div className="text-base italic mt-0.5">"{pickLocale(icp.tagline, locale)}"</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                  {tGtm(detailText.keyMessages, locale)}
                </div>
                <ul className="space-y-1">
                  {icp.keyMessages.map((m, i) => {
                    const text = pickLocale(m, locale) ?? "";
                    return (
                      <li key={`${i}-${text}`} className="text-sm bg-muted/50 rounded px-2 py-1">
                        → {text}
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Before / After */}
              {icp.beforeAfter && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                    {tGtm(detailText.beforeAfter, locale)}
                  </div>
                  <div className="grid md:grid-cols-2 gap-2">
                    <div className="border border-red-500/30 bg-red-500/5 rounded-lg p-3">
                      <div className="text-[10px] text-red-500 uppercase tracking-wider mb-1">
                        {tGtm(detailText.before, locale)}
                      </div>
                      <div className="text-sm">{icp.beforeAfter.before}</div>
                    </div>
                    <div className="border border-green-500/30 bg-green-500/5 rounded-lg p-3">
                      <div className="text-[10px] text-green-500 uppercase tracking-wider mb-1">
                        {tGtm(detailText.after, locale)}
                      </div>
                      <div className="text-sm">{icp.beforeAfter.after}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Section>

          {/* Proof Points */}
          {icp.proofPoints && icp.proofPoints.length > 0 && (
            <Section title={tGtm(detailText.proofPoints, locale)}>
              <div className="space-y-2">
                {icp.proofPoints.map((p) => (
                  <div key={p.claim} className="border border-border rounded-lg p-3">
                    <div className="text-sm font-bold">{p.claim}</div>
                    <ul className="space-y-0.5 mt-1.5">
                      {p.evidence.map((e) => (
                        <li key={e} className="text-xs text-muted-foreground">
                          • {e}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Customer Stories */}
          {icp.customerStories && icp.customerStories.length > 0 && (
            <Section title={tGtm(detailText.customerStories, locale)}>
              <div className="space-y-3">
                {icp.customerStories.map((story) => {
                  const labels = detailText.customerStoryLabels;
                  return (
                    <div key={story.title} className="border border-border rounded-lg p-3">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="min-w-0">
                          <div className="text-sm font-bold">{story.title}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {tGtm(labels.customer, locale)}: {story.customer}
                            {story.segment ? ` · ${story.segment}` : ""}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {story.status}
                        </Badge>
                      </div>

                      {story.metrics && story.metrics.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                          {story.metrics.map((metric) => (
                            <div
                              key={`${metric.value}-${metric.label}`}
                              className="rounded-lg bg-muted/40 p-2"
                            >
                              <div className="text-sm font-bold">{metric.value}</div>
                              <div className="text-[10px] text-muted-foreground">
                                {metric.label}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="grid md:grid-cols-3 gap-2 mt-3">
                        {[
                          [tGtm(labels.problem, locale), story.problem],
                          [tGtm(labels.solution, locale), story.solution],
                          [tGtm(labels.outcome, locale), story.outcome],
                        ].map(([label, body]) => (
                          <div key={label} className="rounded-lg border border-border/60 p-2">
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                              {label}
                            </div>
                            <div className="text-xs">{body}</div>
                          </div>
                        ))}
                      </div>

                      {story.quote && (
                        <blockquote className="mt-3 border-l-2 border-primary/60 pl-3 text-xs text-muted-foreground">
                          “{story.quote.text}”
                          {(story.quote.author || story.quote.role) && (
                            <footer className="mt-1 text-[10px]">
                              {story.quote.author}
                              {story.quote.author && story.quote.role ? ", " : ""}
                              {story.quote.role}
                            </footer>
                          )}
                        </blockquote>
                      )}

                      {story.assets && story.assets.length > 0 && (
                        <div className="mt-3">
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                            {tGtm(labels.assets, locale)}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {story.assets.map((asset) => (
                              <Badge key={asset.label} variant="secondary" className="text-[10px]">
                                {asset.label} · {asset.status}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {/* Differentiators */}
          {icp.differentiators && icp.differentiators.length > 0 && (
            <Section title={tGtm(detailText.differentiators, locale)}>
              <div className="space-y-2">
                {icp.differentiators.map((d) => (
                  <div key={d.attribute} className="border border-border rounded-lg p-3">
                    <div className="flex items-start gap-2 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold">{d.attribute}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">→ {d.valueTheme}</div>
                      </div>
                      {d.vsAlternative && (
                        <Badge variant="outline" className="text-[10px]">
                          vs {d.vsAlternative}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Competitors (moved from its own tab) */}
          <Section title={tGtm(detailText.competitors, locale)} id="competitors">
            <div className="space-y-2">
              {icp.competitors.map((c) => {
                const cpStatus = c.comparePageStatus;
                const cpStatusColor =
                  cpStatus === "live"
                    ? "bg-green-500"
                    : cpStatus === "draft"
                      ? "bg-yellow-500"
                      : "bg-zinc-400";
                const cpLabel = detailText.compareStatus;
                return (
                  <div key={c.name} className="border border-border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge
                        variant={
                          c.category === "direct"
                            ? "destructive"
                            : c.category === "indirect"
                              ? "default"
                              : "secondary"
                        }
                        className="text-[9px]"
                      >
                        {c.category}
                      </Badge>
                      {c.url ? (
                        <Link href={c.url} className="font-bold hover:text-primary">
                          {c.name}
                        </Link>
                      ) : (
                        <span className="font-bold">{c.name}</span>
                      )}
                      {(c.comparePageUrl || cpStatus) && (
                        <span className="flex items-center gap-1 ml-auto text-[10px]">
                          <span className={`w-1.5 h-1.5 rounded-full ${cpStatusColor}`} />
                          <span className="text-muted-foreground">
                            {tGtm(detailText.compare, locale)}
                          </span>
                          {c.comparePageUrl && cpStatus === "live" ? (
                            <Link
                              href={c.comparePageUrl}
                              className="text-primary hover:underline font-mono"
                            >
                              {c.comparePageUrl}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground font-mono">
                              {c.comparePageUrl ?? `/compare/${c.name.toLowerCase()}`} ·{" "}
                              {tGtm(cpLabel[cpStatus ?? "todo"], locale)}
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                    {c.their_strength && (
                      <div className="text-xs text-muted-foreground">
                        {tGtm(detailText.their, locale)} {c.their_strength}
                      </div>
                    )}
                    <div className="text-xs text-green-600 dark:text-green-400">
                      {tGtm(detailText.ours, locale)} {c.our_advantage}
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>

          {/* Objection Handling */}
          <Section title={tGtm(detailText.objectionHandling, locale)}>
            <ul className="space-y-1">
              {icp.objections.map((o, i) => {
                const text = pickLocale(o, locale) ?? "";
                return (
                  <li key={`${i}-${text}`} className="text-sm text-muted-foreground italic">
                    {text}
                  </li>
                );
              })}
            </ul>
          </Section>

          {/* Content Pillars */}
          {icp.contentPillars && icp.contentPillars.length > 0 && (
            <Section title={tGtm(detailText.contentPillars, locale)}>
              <div className="space-y-3">
                {icp.contentPillars.map((p) => (
                  <div key={p.name} className="border border-border rounded-lg p-3">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {p.emoji && <span className="text-xl">{p.emoji}</span>}
                      <span className="font-bold">{p.name}</span>
                      {p.targetCoverage && (
                        <Badge variant="secondary" className="text-[10px] ml-auto">
                          {p.targetCoverage}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mb-1.5">{p.description}</div>
                    <div className="text-xs">
                      <span className="text-muted-foreground">
                        {tGtm(detailText.hook, locale)}{" "}
                      </span>
                      <span className="italic">{p.hookTheme}</span>
                    </div>
                    {p.exampleTitles && p.exampleTitles.length > 0 && (
                      <div className="mt-2 space-y-0.5">
                        {p.exampleTitles.map((t) => (
                          <div key={t} className="text-[11px] text-muted-foreground">
                            · {t}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Voice & Tone */}
          {icp.voiceTone && (
            <Section title={tGtm(detailText.voiceTone, locale)}>
              <div className="space-y-3">
                {icp.voiceTone.traits && icp.voiceTone.traits.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                      {tGtm(detailText.traits, locale)}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {icp.voiceTone.traits.map((t) => (
                        <Badge key={t} variant="outline" className="text-xs">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid md:grid-cols-2 gap-3">
                  {icp.voiceTone.dos && icp.voiceTone.dos.length > 0 && (
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-green-500 mb-1">
                        {tGtm(detailText.do, locale)}
                      </div>
                      <ul className="space-y-0.5">
                        {icp.voiceTone.dos.map((d) => (
                          <li key={d} className="text-xs">
                            · {d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {icp.voiceTone.donts && icp.voiceTone.donts.length > 0 && (
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-red-500 mb-1">
                        {tGtm(detailText.dont, locale)}
                      </div>
                      <ul className="space-y-0.5">
                        {icp.voiceTone.donts.map((d) => (
                          <li key={d} className="text-xs">
                            · {d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </Section>
          )}
        </TabsContent>

        <TabsContent value="seo" className="space-y-4">
          {/* SEO / GEO Messaging */}
          {icp.seo && (
            <Section title={tGtm(detailText.seoMessaging, locale)}>
              <div className="space-y-4">
                {icp.seo.primaryKeywords && icp.seo.primaryKeywords.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                      {tGtm(detailText.primaryKeywords, locale)}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {icp.seo.primaryKeywords.map((k) => (
                        <Badge key={k} variant="default" className="text-xs font-mono">
                          {k}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {icp.seo.longTailKeywords && icp.seo.longTailKeywords.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                      {tGtm(detailText.longTailKeywords, locale)}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {icp.seo.longTailKeywords.map((k) => (
                        <Badge key={k} variant="outline" className="text-xs">
                          {k}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {icp.seo.competitorSearchTerms && icp.seo.competitorSearchTerms.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                      {tGtm(detailText.competitorSearchTerms, locale)}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {icp.seo.competitorSearchTerms.map((k) => (
                        <Badge key={k} variant="secondary" className="text-xs">
                          {k}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {icp.seo.titleTemplates && icp.seo.titleTemplates.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                      {tGtm(detailText.titleTemplates, locale)}
                    </div>
                    <ul className="space-y-1">
                      {icp.seo.titleTemplates.map((t) => (
                        <li key={t} className="text-sm bg-muted/50 rounded px-2 py-1 font-medium">
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {icp.seo.metaDescriptions && icp.seo.metaDescriptions.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                      {tGtm(detailText.metaDescriptions, locale)}
                    </div>
                    <ul className="space-y-1">
                      {icp.seo.metaDescriptions.map((m) => (
                        <li
                          key={m}
                          className="text-xs bg-muted/50 rounded px-2 py-1.5 text-muted-foreground"
                        >
                          {m}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {icp.seo.narrativeAngles && icp.seo.narrativeAngles.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                      {tGtm(detailText.narrativeAngles, locale)}
                    </div>
                    <ul className="space-y-1">
                      {icp.seo.narrativeAngles.map((a) => (
                        <li key={a} className="text-sm">
                          → {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {icp.seo.serpPreviews && icp.seo.serpPreviews.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                      {tGtm(detailText.serpPreview, locale)}
                    </div>
                    <div className="space-y-3">
                      {icp.seo.serpPreviews.map((s) => (
                        <div
                          key={s.targetUrl}
                          className="border border-border rounded-lg p-3 bg-muted/30 font-sans"
                        >
                          <div className="text-[11px] text-green-700 dark:text-green-400 truncate mb-1">
                            buda.app{s.targetUrl}
                          </div>
                          <Link
                            href={s.targetUrl}
                            className="text-lg text-blue-700 dark:text-blue-400 hover:underline font-medium block leading-tight"
                          >
                            {s.title}
                          </Link>
                          <p className="text-sm text-muted-foreground mt-1 leading-snug">
                            {s.description}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2 text-[10px] text-muted-foreground">
                            {s.keyword && (
                              <Badge variant="outline" className="text-[9px]">
                                KW: {s.keyword}
                              </Badge>
                            )}
                            <span>
                              {tGtm(detailText.titleLength, locale)} {s.title.length}/60
                            </span>
                            <span>
                              {tGtm(detailText.descriptionLength, locale)} {s.description.length}
                              /160
                            </span>
                            {s.notes && <span>· {s.notes}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Section>
          )}
        </TabsContent>

        <TabsContent value="landing" className="space-y-4">
          {/* Landing Page Copy */}
          {icp.landingCopy && (
            <Section title={tGtm(detailText.landingCopy, locale)} id="landing-copy">
              <div className="space-y-5">
                {/* Hero */}
                {icp.landingCopy.hero && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                      {tGtm(detailText.hero, locale)}
                    </div>
                    <div className="border border-border rounded-lg p-4 bg-gradient-to-br from-primary/5 to-background">
                      {icp.landingCopy.hero.eyebrow && (
                        <div className="text-xs text-primary font-mono uppercase tracking-wider mb-2">
                          {icp.landingCopy.hero.eyebrow}
                        </div>
                      )}
                      <h3 className="text-2xl font-bold leading-tight">
                        {icp.landingCopy.hero.headline}
                      </h3>
                      {icp.landingCopy.hero.subheadline && (
                        <p className="text-muted-foreground mt-2">
                          {icp.landingCopy.hero.subheadline}
                        </p>
                      )}
                      <div className="flex gap-2 mt-3">
                        {icp.landingCopy.hero.primaryCta && (
                          <Badge className="text-xs">
                            🟢 {icp.landingCopy.hero.primaryCta.label}
                          </Badge>
                        )}
                        {icp.landingCopy.hero.secondaryCta && (
                          <Badge variant="outline" className="text-xs">
                            {icp.landingCopy.hero.secondaryCta.label}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Problem */}
                {icp.landingCopy.problem && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                      {tGtm(detailText.problem, locale)}
                    </div>
                    <div className="border border-border rounded-lg p-3">
                      {icp.landingCopy.problem.title && (
                        <div className="font-bold mb-2">{icp.landingCopy.problem.title}</div>
                      )}
                      {icp.landingCopy.problem.bullets && (
                        <ul className="space-y-1 text-sm">
                          {icp.landingCopy.problem.bullets.map((b) => (
                            <li key={b} className="text-muted-foreground">
                              • {b}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}

                {/* Messaging blocks */}
                {icp.landingCopy.messaging && icp.landingCopy.messaging.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                      {tGtm(detailText.messagingBlocks, locale)}
                    </div>
                    <div className="grid md:grid-cols-3 gap-2">
                      {icp.landingCopy.messaging.map((m) => (
                        <div key={m.title} className="border border-border rounded-lg p-3">
                          {m.icon && <div className="text-2xl mb-1">{m.icon}</div>}
                          <div className="font-bold text-sm">{m.title}</div>
                          <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            {m.body}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Features */}
                {icp.landingCopy.features && icp.landingCopy.features.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                      {tGtm(detailText.features, locale)}（{icp.landingCopy.features.length}）
                    </div>
                    <div className="grid md:grid-cols-2 gap-2">
                      {icp.landingCopy.features.map((f) => (
                        <div
                          key={f.title}
                          className="border border-border rounded-lg p-2.5 flex gap-2"
                        >
                          {f.icon && <span className="text-xl shrink-0">{f.icon}</span>}
                          <div>
                            <div className="font-medium text-sm">{f.title}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {f.description}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Use Cases */}
                {icp.landingCopy.useCases && icp.landingCopy.useCases.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                      {tGtm(detailText.useCases, locale)}（{icp.landingCopy.useCases.length}）
                    </div>
                    <div className="space-y-2">
                      {icp.landingCopy.useCases.map((u) => (
                        <div
                          key={u.title}
                          className="border border-border rounded-lg p-3 flex gap-3"
                        >
                          {u.icon && <span className="text-2xl shrink-0">{u.icon}</span>}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm">{u.title}</span>
                              {u.who && (
                                <Badge variant="outline" className="text-[10px]">
                                  {u.who}
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {u.description}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Social Proof */}
                {icp.landingCopy.socialProof && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                      {tGtm(detailText.socialProof, locale)}
                    </div>
                    {icp.landingCopy.socialProof.stats &&
                      icp.landingCopy.socialProof.stats.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                          {icp.landingCopy.socialProof.stats.map((s) => (
                            <div
                              key={s.label}
                              className="border border-border rounded-lg p-3 text-center"
                            >
                              <div className="text-2xl font-bold font-mono">{s.value}</div>
                              <div className="text-[10px] text-muted-foreground mt-0.5">
                                {s.label}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    {icp.landingCopy.socialProof.testimonials &&
                      icp.landingCopy.socialProof.testimonials.length > 0 && (
                        <div className="grid md:grid-cols-2 gap-2">
                          {icp.landingCopy.socialProof.testimonials.map((t) => (
                            <div key={t.author} className="border border-border rounded-lg p-3">
                              <div className="text-xs italic text-foreground/80">"{t.quote}"</div>
                              <div className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1.5">
                                {t.avatarUrl && <span>{t.avatarUrl}</span>}
                                <span className="font-bold">{t.author}</span>
                                {t.role && <span>· {t.role}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                )}

                {/* FAQs */}
                {icp.landingCopy.faqs && icp.landingCopy.faqs.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                      {tGtm(detailText.faq, locale)}（{icp.landingCopy.faqs.length}）
                    </div>
                    <div className="space-y-2">
                      {icp.landingCopy.faqs.map((f) => (
                        <details key={f.q} className="border border-border rounded-lg px-3 py-2">
                          <summary className="font-medium text-sm cursor-pointer">{f.q}</summary>
                          <div className="text-xs text-muted-foreground mt-2 leading-relaxed">
                            {f.a}
                          </div>
                        </details>
                      ))}
                    </div>
                  </div>
                )}

                {/* Final CTA */}
                {icp.landingCopy.finalCta && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                      {tGtm(detailText.finalCta, locale)}
                    </div>
                    <div className="border-2 border-primary/40 rounded-lg p-4 bg-primary/5 text-center">
                      {icp.landingCopy.finalCta.headline && (
                        <div className="text-lg font-bold">{icp.landingCopy.finalCta.headline}</div>
                      )}
                      {icp.landingCopy.finalCta.subheadline && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {icp.landingCopy.finalCta.subheadline}
                        </div>
                      )}
                      {icp.landingCopy.finalCta.cta && (
                        <Badge className="mt-3 text-sm px-4 py-1">
                          🟢 {icp.landingCopy.finalCta.cta.label}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Section>
          )}
        </TabsContent>

        <TabsContent value="paid" className="space-y-4">
          {/* SEM / Paid Ads Messaging */}
          {icp.sem && (
            <Section title={tGtm(detailText.sem, locale)}>
              <div className="space-y-4">
                {/* Keywords with bids */}
                {icp.sem.keywords && icp.sem.keywords.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                      {tGtm(detailText.keywordsBids, locale)}
                    </div>
                    <div className="space-y-1">
                      {icp.sem.keywords.map((k) => (
                        <div key={k.keyword} className="flex items-center gap-2 text-xs">
                          <Badge
                            variant={
                              k.matchType === "exact"
                                ? "default"
                                : k.matchType === "phrase"
                                  ? "secondary"
                                  : "outline"
                            }
                            className="text-[9px] w-16 justify-center"
                          >
                            {k.matchType}
                          </Badge>
                          <span className="font-mono flex-1">{k.keyword}</span>
                          {k.maxCpc != null && (
                            <span className="text-muted-foreground font-mono">max ${k.maxCpc}</span>
                          )}
                          {k.notes && (
                            <span className="text-muted-foreground italic text-[10px]">
                              {k.notes}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Negative keywords */}
                {icp.sem.negativeKeywords && icp.sem.negativeKeywords.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                      {tGtm(detailText.negativeKeywords, locale)}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {icp.sem.negativeKeywords.map((k) => (
                        <Badge
                          key={k}
                          variant="outline"
                          className="text-xs text-red-500 border-red-500/40"
                        >
                          −{k}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ad Copy */}
                {icp.sem.adCopy && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                      {tGtm(detailText.adCopy, locale)}
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                      {icp.sem.adCopy.headlines && icp.sem.adCopy.headlines.length > 0 && (
                        <div>
                          <div className="text-[10px] text-muted-foreground mb-1">
                            {tGtm(detailText.headlines, locale)}（≤30 ·{" "}
                            {icp.sem.adCopy.headlines.length} {tGtm(detailText.variants, locale)}）
                          </div>
                          <ul className="space-y-0.5 text-xs">
                            {icp.sem.adCopy.headlines.map((h) => (
                              <li key={h} className="flex gap-2 items-baseline">
                                <span className="font-mono text-foreground/60 w-6 text-right">
                                  {h.length}
                                </span>
                                <span className="bg-muted/50 rounded px-2 py-0.5 flex-1">{h}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {icp.sem.adCopy.descriptions && icp.sem.adCopy.descriptions.length > 0 && (
                        <div>
                          <div className="text-[10px] text-muted-foreground mb-1">
                            {tGtm(detailText.descriptions, locale)}（≤90）
                          </div>
                          <ul className="space-y-0.5 text-xs">
                            {icp.sem.adCopy.descriptions.map((d) => (
                              <li key={d} className="flex gap-2 items-baseline">
                                <span className="font-mono text-foreground/60 w-6 text-right">
                                  {d.length}
                                </span>
                                <span className="bg-muted/50 rounded px-2 py-0.5 flex-1">{d}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    {icp.sem.adCopy.callToActions && icp.sem.adCopy.callToActions.length > 0 && (
                      <div className="mt-2">
                        <div className="text-[10px] text-muted-foreground mb-1">
                          {tGtm(detailText.ctas, locale)}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {icp.sem.adCopy.callToActions.map((c) => (
                            <Badge key={c} variant="default" className="text-xs">
                              {c}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* YouTube Ad Scenarios */}
                {icp.sem.youtubeAdScenarios && icp.sem.youtubeAdScenarios.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                      {tGtm(detailText.youtubeScenarios, locale)}
                    </div>
                    <div className="space-y-2">
                      {icp.sem.youtubeAdScenarios.map((s) => (
                        <div key={s.name} className="border border-border rounded-lg p-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="default" className="text-[9px]">
                              {s.format}
                            </Badge>
                            <span className="font-medium text-sm">{s.name}</span>
                            {s.videoUrl && (
                              <Link
                                href={s.videoUrl}
                                className="text-[10px] text-primary hover:underline ml-auto"
                              >
                                {tGtm(detailText.viewVideo, locale)}
                              </Link>
                            )}
                          </div>
                          {s.hook && (
                            <div className="text-sm mt-1.5">
                              <span className="text-[10px] text-muted-foreground uppercase">
                                Hook:{" "}
                              </span>
                              <span className="italic">"{s.hook}"</span>
                            </div>
                          )}
                          {s.cta && (
                            <div className="text-xs mt-0.5">
                              <span className="text-[10px] text-muted-foreground uppercase">
                                CTA:{" "}
                              </span>
                              <span>{s.cta}</span>
                            </div>
                          )}
                          {s.notes && (
                            <div className="text-[10px] text-muted-foreground mt-1">
                              💡 {s.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Section>
          )}
        </TabsContent>

        <TabsContent value="sales-ops" className="space-y-4">
          {/* Offers */}
          <Section title={tGtm(detailText.offers, locale)}>
            <div className="space-y-2">
              {icp.offers.map((offer, index) => {
                const product = data.products.find((s) => s.id === offer.productId);
                if (!product) return null;
                return (
                  <div
                    key={`${offer.productId}-${offer.priority}-${index}`}
                    className={`flex items-start gap-3 rounded-lg p-3 border ${
                      offer.priority === "primary"
                        ? "border-primary/40 bg-primary/5"
                        : "border-border"
                    }`}
                  >
                    <span className="text-xl">{product.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {product.canonicalUrl ? (
                          <Link
                            href={product.canonicalUrl}
                            className="font-bold hover:text-primary"
                          >
                            {product.name}
                          </Link>
                        ) : (
                          <span className="font-bold">{product.name}</span>
                        )}
                        <span className="text-xs text-muted-foreground font-mono">
                          {product.kind}
                        </span>
                        {offer.priority === "primary" && (
                          <Badge className="text-[9px]">{tGtm(detailText.primary, locale)}</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-0.5">
                        {offer.positioning}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>

          {/* Channels + Content */}
          <div className="grid md:grid-cols-2 gap-4">
            <Section title={tGtm(detailText.channels, locale)}>
              <div className="space-y-2">
                {icp.channels.map((ch) => {
                  const channel = data.channels.find((item) => item.id === ch.channelId);
                  const channelName = channel
                    ? (pickLocale(channel.name, locale) ?? ch.channelId)
                    : ch.channelId;
                  return (
                    <div key={ch.channelId} className="flex items-start gap-2 text-sm">
                      <span>{channel?.emoji ?? "📌"}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {ch.link ? (
                            <Link href={ch.link} className="font-medium hover:text-primary">
                              {channelName}
                            </Link>
                          ) : (
                            <span className="font-medium">{channelName}</span>
                          )}
                          {ch.frequency && (
                            <Badge variant="outline" className="text-[9px]">
                              {ch.frequency}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {pickLocale(ch.hook, locale)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>

            <Section title={tGtm(detailText.producedContent, locale)}>
              <div className="space-y-1.5">
                {icp.content.map((c) => (
                  <div key={c.title} className="flex items-center gap-2 text-sm">
                    <span className={`w-2 h-2 rounded-full ${statusColor[c.status]}`} />
                    {c.url ? (
                      <Link href={c.url} className="text-foreground hover:text-primary truncate">
                        {c.title}
                      </Link>
                    ) : (
                      <span className="text-foreground/80 truncate">{c.title}</span>
                    )}
                    <Badge variant="outline" className="text-[9px] ml-auto">
                      {c.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </Section>
          </div>

          {/* Funnel */}
          <Section title={tGtm(detailText.funnel, locale)}>
            <div className="flex flex-wrap items-center gap-2">
              {icp.funnels.map((f, i) => (
                <span key={f.name} className="flex items-center gap-2">
                  {f.url ? (
                    <Link href={f.url}>
                      <Badge variant="outline" className="hover:border-primary transition-colors">
                        {f.name}
                      </Badge>
                    </Link>
                  ) : (
                    <Badge variant="outline">{f.name}</Badge>
                  )}
                  {i < icp.funnels.length - 1 && <span className="text-muted-foreground">→</span>}
                </span>
              ))}
            </div>
          </Section>

          {/* Next Actions + Retro */}
          <div className="grid md:grid-cols-2 gap-4">
            <Section title={tGtm(detailText.nextActions, locale)}>
              <div className="space-y-1.5">
                {icp.actions.map((a) => (
                  <div key={a.text} className="flex items-start gap-2 text-sm">
                    <span
                      className={`mt-0.5 ${a.done ? "text-green-500" : "text-muted-foreground"}`}
                    >
                      {a.done ? "✓" : "○"}
                    </span>
                    <span
                      className={`flex-1 ${a.done ? "line-through text-muted-foreground" : ""}`}
                    >
                      {a.text}
                    </span>
                    {a.deadline && (
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {a.deadline}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </Section>

            <Section title={tGtm(detailText.retrospective, locale)}>
              {icp.retro.length === 0 ? (
                <div className="text-sm text-muted-foreground italic">
                  {tGtm(detailText.noEntries, locale)}
                </div>
              ) : (
                <div className="space-y-2">
                  {icp.retro.map((r) => (
                    <div key={r.date + r.action} className="text-xs">
                      <span className="font-mono text-muted-foreground">{r.date}</span>
                      <span className="text-muted-foreground mx-1.5">·</span>
                      <span>{r.action}</span>
                      <span className="text-muted-foreground mx-1.5">→</span>
                      <span className="text-green-600 dark:text-green-400">{r.result}</span>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
