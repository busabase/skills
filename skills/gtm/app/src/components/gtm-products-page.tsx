"use client";

import { type ProductRelease, releases } from "gtm-data/releases";
import type {
  AdCampaign,
  ChannelListing,
  CommerceOffer,
  CommerceStorefront,
  ContentCalendarItem,
  Experiment,
  GTMData,
  GTMProduct,
  ICP,
  ProductPromotionAction,
  ProductPromotionActionCadence,
  ProductPromotionActionStatus,
  ProductPromotionAssetStatus,
  SKU,
} from "gtm-data/types";
import { Badge } from "kui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "kui/card";
import Link from "next/link";
import {
  type AppStoreMatrixRow,
  deriveAppStoreMatrix,
  PRODUCT_PLATFORM_LABEL,
  pickLocale,
  tGtm,
  useGtmData,
  useGtmLocale,
} from "../data";

type HealthStatus = "healthy" | "watch" | "blocked" | "planned";
type ProductRiskKey =
  | "preLaunch"
  | "sunset"
  | "noActiveSku"
  | "noActiveOffer"
  | "noDatedRelease"
  | "missingStoreTarget"
  | "noActiveStorefront"
  | "noActivePromotion";
type ProductActionKey =
  | "lockLaunchChecklist"
  | "archiveListings"
  | "createActiveSku"
  | "packagePrimarySku"
  | "updateReleaseManifest"
  | "prepareListingAssets"
  | "assignStorefront"
  | "createPromotionAction"
  | "keepCadence";

interface ProductRisk {
  key: ProductRiskKey;
  target?: string;
}

interface ProductAction {
  key: ProductActionKey;
  target?: string;
}

interface ProductOperatingRow {
  product: GTMProduct;
  businessLine?: GTMData["businessLines"][number];
  skus: SKU[];
  listings: ChannelListing[];
  offers: CommerceOffer[];
  targetIcps: ICP[];
  storefronts: CommerceStorefront[];
  campaigns: AdCampaign[];
  contentItems: ContentCalendarItem[];
  experiments: Experiment[];
  promotionActions: ProductPromotionAction[];
  release?: ProductRelease;
  latest: ReturnType<typeof latestRelease>;
  nextRelease: ReturnType<typeof nextRelease>;
  stage: string;
  health: HealthStatus;
  owner: string;
  risks: ProductRisk[];
  actions: ProductAction[];
  pricing: string;
  matrix?: AppStoreMatrixRow;
  missingStoreTargets: string[];
}

const text = {
  productsTitle: {
    en: "Products",
    "zh-CN": "商品",
    "zh-TW": "商品",
    ja: "商品",
    pt: "Produtos",
  },
  productsSummary: {
    en: "{products} products · {operating} operating · {watch} need attention · {missing} store gaps",
    "zh-CN": "{products} 个商品 · {operating} 个运营中 · {watch} 个需关注 · {missing} 个商店缺口",
    "zh-TW": "{products} 個商品 · {operating} 個營運中 · {watch} 個需關注 · {missing} 個商店缺口",
    ja: "{products} 商品 · {operating} 稼働中 · {watch} 要確認 · {missing} ストア不足",
    pt: "{products} produtos · {operating} operando · {watch} exigem atenção · {missing} lacunas",
  },
  operatingSnapshot: {
    en: "Operating Snapshot",
    "zh-CN": "经营状态一览",
    "zh-TW": "經營狀態一覽",
    ja: "運用状況",
    pt: "Snapshot operacional",
  },
  productHealth: {
    en: "Product health",
    "zh-CN": "商品健康度",
    "zh-TW": "商品健康度",
    ja: "商品ヘルス",
    pt: "Saúde do produto",
  },
  product: { en: "Product", "zh-CN": "商品", "zh-TW": "商品", ja: "商品", pt: "Produto" },
  status: { en: "Status", "zh-CN": "状态", "zh-TW": "狀態", ja: "状態", pt: "Status" },
  commerce: { en: "Commerce", "zh-CN": "售卖", "zh-TW": "售賣", ja: "販売", pt: "Comércio" },
  promotion: { en: "Promotion", "zh-CN": "推广", "zh-TW": "推廣", ja: "施策", pt: "Promoção" },
  risk: { en: "Risk", "zh-CN": "风险", "zh-TW": "風險", ja: "リスク", pt: "Risco" },
  moreRisks: {
    en: "View {count} more risks",
    "zh-CN": "查看另外 {count} 项风险",
    "zh-TW": "查看另外 {count} 項風險",
    ja: "他 {count} 件のリスクを見る",
    pt: "Ver mais {count} riscos",
  },
  nextAction: {
    en: "Next action",
    "zh-CN": "下一步",
    "zh-TW": "下一步",
    ja: "次のアクション",
    pt: "Próxima ação",
  },
  owner: { en: "Owner", "zh-CN": "Owner", "zh-TW": "Owner", ja: "Owner", pt: "Owner" },
  skus: { en: "SKUs", "zh-CN": "SKU", "zh-TW": "SKU", ja: "SKU", pt: "SKUs" },
  listings: {
    en: "Listings",
    "zh-CN": "上架",
    "zh-TW": "上架",
    ja: "掲載",
    pt: "Listagens",
  },
  offers: { en: "Offers", "zh-CN": "Offer", "zh-TW": "Offer", ja: "オファー", pt: "Ofertas" },
  targetIcps: {
    en: "Target ICPs",
    "zh-CN": "目标 ICP",
    "zh-TW": "目標 ICP",
    ja: "対象 ICP",
    pt: "ICPs-alvo",
  },
  stage: { en: "Stage", "zh-CN": "阶段", "zh-TW": "階段", ja: "段階", pt: "Estágio" },
  release: {
    en: "Latest release",
    "zh-CN": "最近版本",
    "zh-TW": "最近版本",
    ja: "最新リリース",
    pt: "Último release",
  },
  nextRelease: {
    en: "Next release",
    "zh-CN": "下个版本",
    "zh-TW": "下個版本",
    ja: "次リリース",
    pt: "Próximo release",
  },
  storefronts: {
    en: "Storefronts",
    "zh-CN": "商店",
    "zh-TW": "商店",
    ja: "ストア",
    pt: "Lojas",
  },
  storeCoverage: {
    en: "Store coverage",
    "zh-CN": "商店覆盖",
    "zh-TW": "商店覆蓋",
    ja: "ストア対応",
    pt: "Cobertura de loja",
  },
  noStorefronts: {
    en: "No storefronts yet",
    "zh-CN": "暂无商店",
    "zh-TW": "暫無商店",
    ja: "ストア未設定",
    pt: "Sem lojas ainda",
  },
  noListings: {
    en: "No listings yet",
    "zh-CN": "暂无上架记录",
    "zh-TW": "暫無上架記錄",
    ja: "掲載記録なし",
    pt: "Sem listagens ainda",
  },
  pricing: {
    en: "Pricing",
    "zh-CN": "定价",
    "zh-TW": "定價",
    ja: "価格",
    pt: "Preço",
  },
  skuDetails: {
    en: "SKU details",
    "zh-CN": "SKU 明细",
    "zh-TW": "SKU 明細",
    ja: "SKU 詳細",
    pt: "Detalhes de SKU",
  },
  promotionPlan: {
    en: "Promotion Plan",
    "zh-CN": "推广动作计划",
    "zh-TW": "推廣動作計畫",
    ja: "プロモーション計画",
    pt: "Plano de promoção",
  },
  promotionPlanSummary: {
    en: "Connect every product to launch actions, daily routines, required assets, and experiments.",
    "zh-CN": "把每个产品的推广动作、日常节奏、要做的物料和实验串起来。",
    "zh-TW": "把每個產品的推廣動作、日常節奏、要做的素材和實驗串起來。",
    ja: "各プロダクトの施策、日常運用、必要アセット、実験をつなげます。",
    pt: "Conecta ações, rotina, materiais necessários e experimentos por produto.",
  },
  objective: {
    en: "Objective",
    "zh-CN": "目标",
    "zh-TW": "目標",
    ja: "目的",
    pt: "Objetivo",
  },
  materials: {
    en: "Materials",
    "zh-CN": "物料",
    "zh-TW": "素材",
    ja: "素材",
    pt: "Materiais",
  },
  experiments: {
    en: "Experiments",
    "zh-CN": "实验",
    "zh-TW": "實驗",
    ja: "実験",
    pt: "Experimentos",
  },
  routine: {
    en: "Routine",
    "zh-CN": "日常化",
    "zh-TW": "日常化",
    ja: "運用頻度",
    pt: "Rotina",
  },
  noPromotionPlan: {
    en: "No explicit promotion action yet.",
    "zh-CN": "还没有明确的推广动作。",
    "zh-TW": "還沒有明確的推廣動作。",
    ja: "明確な施策はまだありません。",
    pt: "Ainda sem ação explícita.",
  },
  noLinkedExperiment: {
    en: "No linked experiment yet.",
    "zh-CN": "还没有挂到具体实验。",
    "zh-TW": "還沒有掛到具體實驗。",
    ja: "紐づく実験はまだありません。",
    pt: "Ainda sem experimento vinculado.",
  },
  readyActionsRunningTests: {
    en: "ready actions / running tests",
    "zh-CN": "已就绪动作 / 运行中实验",
    "zh-TW": "已就緒動作 / 執行中實驗",
    ja: "準備済み施策 / 実行中テスト",
    pt: "ações prontas / testes rodando",
  },
  actionsContentExperiments: {
    en: "{actions} actions · {content} content · {experiments} experiments",
    "zh-CN": "{actions} 个动作 · {content} 个内容 · {experiments} 个实验",
    "zh-TW": "{actions} 個動作 · {content} 個內容 · {experiments} 個實驗",
    ja: "{actions} 施策 · {content} コンテンツ · {experiments} 実験",
    pt: "{actions} ações · {content} conteúdos · {experiments} experimentos",
  },
  operatingProducts: {
    en: "operating products",
    "zh-CN": "运营中商品",
    "zh-TW": "營運中商品",
    ja: "稼働中の商品",
    pt: "produtos operando",
  },
  watchBlocked: {
    en: "watch / blocked",
    "zh-CN": "需关注 / 阻塞",
    "zh-TW": "需關注 / 阻塞",
    ja: "要確認 / ブロック",
    pt: "atenção / bloqueado",
  },
  liveListingsGaps: {
    en: "{live} live listings · {missing} gaps",
    "zh-CN": "{live} 个已上线商品 · {missing} 个缺口",
    "zh-TW": "{live} 個已上線商品 · {missing} 個缺口",
    ja: "{live} 件公開中 · {missing} 件不足",
    pt: "{live} listagens ativas · {missing} lacunas",
  },
  commerceCount: {
    en: "{skus} SKU · {offers} offer · {listings} listing",
    "zh-CN": "{skus} 个 SKU · {offers} 个 offer · {listings} 个上架商品",
    "zh-TW": "{skus} 個 SKU · {offers} 個 offer · {listings} 個上架商品",
    ja: "{skus} SKU · {offers} オファー · {listings} 掲載",
    pt: "{skus} SKUs · {offers} ofertas · {listings} listagens",
  },
  storeCount: {
    en: "{stores} stores · {summary}",
    "zh-CN": "{stores} 个商店 · {summary}",
    "zh-TW": "{stores} 個商店 · {summary}",
    ja: "{stores} ストア · {summary}",
    pt: "{stores} lojas · {summary}",
  },
  promotionCount: {
    en: "{campaigns} campaigns · {content} content",
    "zh-CN": "{campaigns} 个活动 · {content} 个内容",
    "zh-TW": "{campaigns} 個活動 · {content} 個內容",
    ja: "{campaigns} キャンペーン · {content} コンテンツ",
    pt: "{campaigns} campanhas · {content} conteúdos",
  },
  experimentsRunning: {
    en: "{experiments} experiments · {running} running",
    "zh-CN": "{experiments} 个实验 · {running} 个运行中",
    "zh-TW": "{experiments} 個實驗 · {running} 個執行中",
    ja: "{experiments} 実験 · {running} 実行中",
    pt: "{experiments} experimentos · {running} rodando",
  },
  latestReleaseMissing: {
    en: "No release manifest",
    "zh-CN": "暂无版本记录",
    "zh-TW": "暫無版本記錄",
    ja: "リリース記録なし",
    pt: "Sem manifesto de release",
  },
  covered: {
    en: "{covered}/{total} covered",
    "zh-CN": "已覆盖 {covered}/{total}",
    "zh-TW": "已覆蓋 {covered}/{total}",
    ja: "{covered}/{total} 対応済み",
    pt: "{covered}/{total} cobertos",
  },
  noPlatformStoreTarget: {
    en: "No platform store target",
    "zh-CN": "暂无平台商店目标",
    "zh-TW": "暫無平台商店目標",
    ja: "ストア目標なし",
    pt: "Sem alvo de loja",
  },
  missing: {
    en: "Missing",
    "zh-CN": "缺少",
    "zh-TW": "缺少",
    ja: "不足",
    pt: "Faltando",
  },
  onTrack: {
    en: "On track",
    "zh-CN": "正常推进",
    "zh-TW": "正常推進",
    ja: "順調",
    pt: "No caminho",
  },
  riskMessages: {
    preLaunch: {
      en: "Launch checklist not locked",
      "zh-CN": "发布前准备未完成",
      "zh-TW": "發布前準備未完成",
      ja: "ローンチ準備が未完了",
      pt: "Checklist de lançamento pendente",
    },
    sunset: {
      en: "Sunset path needs cleanup",
      "zh-CN": "下线路径需要清理",
      "zh-TW": "下線路徑需要清理",
      ja: "終了導線の整理が必要",
      pt: "Caminho de encerramento precisa limpeza",
    },
    noActiveSku: {
      en: "No active SKU",
      "zh-CN": "没有活跃 SKU",
      "zh-TW": "沒有活躍 SKU",
      ja: "有効な SKU なし",
      pt: "Sem SKU ativo",
    },
    noActiveOffer: {
      en: "No active offer",
      "zh-CN": "没有活跃 offer",
      "zh-TW": "沒有活躍 offer",
      ja: "有効なオファーなし",
      pt: "Sem oferta ativa",
    },
    noDatedRelease: {
      en: "No dated release",
      "zh-CN": "没有带日期的版本记录",
      "zh-TW": "沒有帶日期的版本記錄",
      ja: "日付付きリリースなし",
      pt: "Sem release datado",
    },
    missingStoreTarget: {
      en: "Missing {target}",
      "zh-CN": "缺少 {target}",
      "zh-TW": "缺少 {target}",
      ja: "{target} 不足",
      pt: "Faltando {target}",
    },
    noActiveStorefront: {
      en: "No active storefront",
      "zh-CN": "没有活跃商店",
      "zh-TW": "沒有活躍商店",
      ja: "有効なストアなし",
      pt: "Sem loja ativa",
    },
    noActivePromotion: {
      en: "No active promotion",
      "zh-CN": "没有活跃推广",
      "zh-TW": "沒有活躍推廣",
      ja: "有効な施策なし",
      pt: "Sem promoção ativa",
    },
  },
  actionMessages: {
    lockLaunchChecklist: {
      en: "Lock launch SKU, offer, and store checklist",
      "zh-CN": "确认发布 SKU、offer 和商店清单",
      "zh-TW": "確認發布 SKU、offer 和商店清單",
      ja: "ローンチ SKU、オファー、ストア確認リストを固める",
      pt: "Fechar checklist de SKU, oferta e loja",
    },
    archiveListings: {
      en: "Archive listings and clarify migration path",
      "zh-CN": "归档上架页并说明迁移路径",
      "zh-TW": "歸檔上架頁並說明遷移路徑",
      ja: "掲載をアーカイブし移行導線を明確にする",
      pt: "Arquivar listagens e esclarecer migração",
    },
    createActiveSku: {
      en: "Create or reactivate at least one sellable SKU",
      "zh-CN": "创建或恢复至少一个可售 SKU",
      "zh-TW": "建立或恢復至少一個可售 SKU",
      ja: "販売可能な SKU を少なくとも 1 つ作る",
      pt: "Criar ou reativar ao menos um SKU vendável",
    },
    packagePrimarySku: {
      en: "Package the primary SKU into an active offer",
      "zh-CN": "把主 SKU 打包成活跃 offer",
      "zh-TW": "把主 SKU 打包成活躍 offer",
      ja: "主要 SKU を有効なオファーにまとめる",
      pt: "Empacotar o SKU principal em uma oferta ativa",
    },
    updateReleaseManifest: {
      en: "Update release manifest with latest shipped version",
      "zh-CN": "把最近发布版本补进 release 记录",
      "zh-TW": "把最近發布版本補進 release 記錄",
      ja: "最新リリースを記録に反映する",
      pt: "Atualizar manifesto com a última versão lançada",
    },
    prepareListingAssets: {
      en: "Prepare {target} listing assets",
      "zh-CN": "准备 {target} 上架物料",
      "zh-TW": "準備 {target} 上架素材",
      ja: "{target} 掲載素材を準備する",
      pt: "Preparar materiais de listagem para {target}",
    },
    assignStorefront: {
      en: "Assign a storefront or publish the first listing",
      "zh-CN": "分配商店，或先发布第一个上架商品",
      "zh-TW": "分配商店，或先發布第一個上架商品",
      ja: "ストアを割り当てるか最初の掲載を公開する",
      pt: "Atribuir loja ou publicar a primeira listagem",
    },
    createPromotionAction: {
      en: "Create one promotion action with assets and an experiment",
      "zh-CN": "创建一个带物料和实验的推广动作",
      "zh-TW": "建立一個帶素材和實驗的推廣動作",
      ja: "素材と実験付きの施策を 1 つ作る",
      pt: "Criar uma ação de promoção com materiais e experimento",
    },
    keepCadence: {
      en: "Keep weekly release, listing, and promotion cadence",
      "zh-CN": "保持每周版本、上架和推广节奏",
      "zh-TW": "保持每週版本、上架和推廣節奏",
      ja: "毎週のリリース、掲載、施策リズムを維持",
      pt: "Manter cadência semanal de release, listagem e promoção",
    },
  },
};

const statusText = {
  active: { en: "Active", "zh-CN": "活跃", "zh-TW": "活躍", ja: "有効", pt: "Ativo" },
  beta: { en: "Beta", "zh-CN": "Beta", "zh-TW": "Beta", ja: "Beta", pt: "Beta" },
  blocked: { en: "Blocked", "zh-CN": "阻塞", "zh-TW": "阻塞", ja: "ブロック", pt: "Bloqueado" },
  building: {
    en: "Building",
    "zh-CN": "建设中",
    "zh-TW": "建設中",
    ja: "構築中",
    pt: "Em construção",
  },
  done: { en: "Done", "zh-CN": "已完成", "zh-TW": "已完成", ja: "完了", pt: "Concluído" },
  draft: { en: "Draft", "zh-CN": "草稿", "zh-TW": "草稿", ja: "下書き", pt: "Rascunho" },
  healthy: { en: "Healthy", "zh-CN": "健康", "zh-TW": "健康", ja: "正常", pt: "Saudável" },
  live: { en: "Live", "zh-CN": "已上线", "zh-TW": "已上線", ja: "公開中", pt: "No ar" },
  paused: { en: "Paused", "zh-CN": "已暂停", "zh-TW": "已暫停", ja: "一時停止", pt: "Pausado" },
  planned: { en: "Planned", "zh-CN": "规划中", "zh-TW": "規劃中", ja: "予定", pt: "Planejado" },
  published: {
    en: "Published",
    "zh-CN": "已发布",
    "zh-TW": "已發布",
    ja: "公開済み",
    pt: "Publicado",
  },
  ready: { en: "Ready", "zh-CN": "已就绪", "zh-TW": "已就緒", ja: "準備完了", pt: "Pronto" },
  running: { en: "Running", "zh-CN": "运行中", "zh-TW": "執行中", ja: "実行中", pt: "Rodando" },
  scheduled: {
    en: "Scheduled",
    "zh-CN": "已排期",
    "zh-TW": "已排期",
    ja: "予約済み",
    pt: "Agendado",
  },
  sunset: { en: "Sunset", "zh-CN": "下线中", "zh-TW": "下線中", ja: "終了予定", pt: "Encerrando" },
  todo: { en: "Todo", "zh-CN": "待办", "zh-TW": "待辦", ja: "未着手", pt: "A fazer" },
  watch: { en: "Watch", "zh-CN": "需关注", "zh-TW": "需關注", ja: "要確認", pt: "Atenção" },
  wip: { en: "WIP", "zh-CN": "进行中", "zh-TW": "進行中", ja: "進行中", pt: "Em andamento" },
  operating: {
    en: "Operating",
    "zh-CN": "运营中",
    "zh-TW": "營運中",
    ja: "稼働中",
    pt: "Operando",
  },
} as const;

function getReleaseForProduct(productId: string, businessLineId: string) {
  return releases.find((release) => release.id === productId || release.id === businessLineId);
}

function latestRelease(release: ProductRelease | undefined) {
  if (!release) return null;
  return Object.entries(release.platforms)
    .map(([platform, item]) =>
      item?.date
        ? {
            platform,
            version: item.version,
            date: item.date,
            status: item.status,
            notes: item.notes,
            url: item.url,
          }
        : null,
    )
    .filter((item): item is NonNullable<typeof item> => Boolean(item?.date))
    .sort((a, b) => (a.date < b.date ? 1 : -1))[0];
}

function nextRelease(release: ProductRelease | undefined) {
  if (!release) return null;
  return Object.entries(release.platforms)
    .map(([platform, item]) =>
      item && ["planned", "wip", "beta"].includes(item.status)
        ? {
            platform,
            version: item.version,
            date: item.date,
            status: item.status,
            notes: item.notes,
            url: item.url,
          }
        : null,
    )
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return a.date < b.date ? 1 : -1;
    })[0];
}

function productStage(productStatus: GTMProduct["status"], release: ProductRelease | undefined) {
  const platformStatuses = Object.values(release?.platforms ?? {}).map((item) => item?.status);
  if (productStatus === "sunset") return "sunset";
  if (productStatus === "planned") return "planned";
  if (platformStatuses.includes("live")) return "operating";
  if (platformStatuses.includes("beta")) return "beta";
  if (platformStatuses.includes("wip")) return "building";
  return "operating";
}

function statusSummary(items: Array<{ status: string }>) {
  if (items.length === 0) return [];
  const counts = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.status] = (acc[item.status] ?? 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts);
}

function compactList(items: string[], empty = "-", limit = 2) {
  if (items.length === 0) return empty;
  const visible = items.slice(0, limit).join(" / ");
  return items.length > limit ? `${visible} / +${items.length - limit}` : visible;
}

function priceSummary(skus: SKU[]) {
  if (skus.length === 0) return "No SKU";
  const cycles = new Set(
    skus.map((sku) => sku.pricing?.billingCycle ?? sku.type).filter((cycle) => Boolean(cycle)),
  );
  const samples = skus
    .map((sku) => sku.pricing?.display ?? sku.price)
    .filter(Boolean)
    .slice(0, 2);
  return `${cycles.size ? Array.from(cycles).join(" / ") : "custom"} · ${
    samples.length ? samples.join(" / ") : `${skus.length} SKU`
  }`;
}

function statusChipClassName(
  status:
    | HealthStatus
    | ProductPromotionActionStatus
    | ProductPromotionAssetStatus
    | Experiment["status"],
) {
  if (status === "blocked") {
    return "border-transparent bg-destructive/10 text-destructive";
  }
  if (status === "healthy" || status === "ready" || status === "live" || status === "done") {
    return "border-transparent bg-emerald-50 text-emerald-700";
  }
  if (status === "running") {
    return "border-transparent bg-sky-50 text-sky-700";
  }
  if (status === "watch" || status === "draft" || status === "paused") {
    return "border-transparent bg-amber-50 text-amber-700";
  }
  return "border-transparent bg-muted text-muted-foreground";
}

function cadenceLabel(cadence: ProductPromotionActionCadence, locale?: string) {
  const zhLabels: Record<ProductPromotionActionCadence, string> = {
    launch: "Launch",
    daily: "每日",
    weekly: "每周",
    monthly: "每月",
    "one-off": "一次性",
  };
  const labels: Record<ProductPromotionActionCadence, string> = {
    launch: "Launch",
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
    "one-off": "One-off",
  };
  return locale?.startsWith("zh") ? zhLabels[cadence] : labels[cadence];
}

function statusLabel(status: string, locale: Parameters<typeof tGtm>[1]) {
  const knownStatus = statusText[status as keyof typeof statusText];
  return knownStatus ? tGtm(knownStatus, locale) : status;
}

function promotionCountSummary(row: ProductOperatingRow, locale: Parameters<typeof tGtm>[1]) {
  return tGtm(text.actionsContentExperiments, locale)
    .replace("{actions}", row.promotionActions.length.toString())
    .replace("{content}", row.contentItems.length.toString())
    .replace("{experiments}", row.experiments.length.toString());
}

function commerceCount(row: ProductOperatingRow, locale: Parameters<typeof tGtm>[1]) {
  return tGtm(text.commerceCount, locale)
    .replace("{skus}", row.skus.length.toString())
    .replace("{offers}", row.offers.length.toString())
    .replace("{listings}", row.listings.length.toString());
}

function storeStatusSummary(items: Array<{ status: string }>, locale: Parameters<typeof tGtm>[1]) {
  const summary = statusSummary(items)
    .map(([status, count]) => `${count} ${statusLabel(status, locale)}`)
    .join(" / ");
  return tGtm(text.storeCount, locale)
    .replace("{stores}", items.length.toString())
    .replace("{summary}", summary || "0");
}

function promotionCount(row: ProductOperatingRow, locale: Parameters<typeof tGtm>[1]) {
  return tGtm(text.promotionCount, locale)
    .replace("{campaigns}", row.campaigns.length.toString())
    .replace("{content}", row.contentItems.length.toString());
}

function experimentsRunningCount(row: ProductOperatingRow, locale: Parameters<typeof tGtm>[1]) {
  const running = row.campaigns.filter((campaign) => campaign.status === "running").length;
  return tGtm(text.experimentsRunning, locale)
    .replace("{experiments}", row.experiments.length.toString())
    .replace("{running}", running.toString());
}

function renderRisk(risk: ProductRisk, locale: Parameters<typeof tGtm>[1]) {
  const message = tGtm(text.riskMessages[risk.key], locale);
  return risk.target ? message.replace("{target}", risk.target) : message;
}

function renderAction(action: ProductAction, locale: Parameters<typeof tGtm>[1]) {
  const message = tGtm(text.actionMessages[action.key], locale);
  return action.target ? message.replace("{target}", action.target) : message;
}

function nextActionSummary(row: ProductOperatingRow, locale: Parameters<typeof tGtm>[1]) {
  return renderAction(row.actions[0] ?? { key: "keepCadence" }, locale);
}

function RiskSummary({
  row,
  locale,
}: {
  row: ProductOperatingRow;
  locale: Parameters<typeof tGtm>[1];
}) {
  const riskItems = row.risks.map((risk) => renderRisk(risk, locale));

  if (riskItems.length === 0) {
    return <span>{tGtm(text.onTrack, locale)}</span>;
  }

  const visible = riskItems.slice(0, 2);
  const hiddenCount = riskItems.length - visible.length;

  if (hiddenCount === 0) {
    return <span>{visible.join(" / ")}</span>;
  }

  return (
    <details className="group max-w-[260px]">
      <summary className="cursor-pointer list-none space-y-1 [&::-webkit-details-marker]:hidden">
        <span className="block">{visible.join(" / ")}</span>
        <span className="block text-xs font-medium text-primary underline-offset-2 group-open:underline">
          {tGtm(text.moreRisks, locale).replace("{count}", hiddenCount.toString())}
        </span>
      </summary>
      <ul className="mt-2 space-y-1 rounded-md bg-muted/45 px-2.5 py-2 text-xs leading-5 text-muted-foreground">
        {riskItems.map((item) => (
          <li key={item}>- {item}</li>
        ))}
      </ul>
    </details>
  );
}

function deriveProductRows(data: GTMData): ProductOperatingRow[] {
  const matrixRows = deriveAppStoreMatrix(data.products, data.channelListings, data.directories);
  const matrixByProductId = new Map(matrixRows.map((row) => [row.product.id, row]));

  return data.products.map((product) => {
    const businessLine = data.businessLines.find((line) => line.id === product.businessLineId);
    const skus = data.skus.filter((sku) => sku.productId === product.id);
    const skuIds = new Set(skus.map((sku) => sku.id));
    const listings = data.channelListings.filter((listing) => listing.productId === product.id);
    const offers = data.offers.filter((offer) => offer.productIds.includes(product.id));
    const targetIcps = data.icps.filter((icp) =>
      icp.offers.some((offer) => offer.productId === product.id),
    );
    const targetIcpIds = new Set(targetIcps.map((icp) => icp.id));
    const storefronts = data.storefronts.filter((storefront) =>
      storefront.productIds?.includes(product.id),
    );
    const campaigns = data.adCampaigns.filter(
      (campaign) =>
        (campaign.targetSkuId && skuIds.has(campaign.targetSkuId)) ||
        targetIcpIds.has(campaign.targetIcpId),
    );
    const contentItems = data.contentCalendar.filter(
      (item) =>
        (item.skuId && skuIds.has(item.skuId)) || (item.icpId && targetIcpIds.has(item.icpId)),
    );
    const experiments = data.experiments.filter(
      (experiment) => experiment.icpId && targetIcpIds.has(experiment.icpId),
    );
    const promotionActions = data.promotionActions.filter(
      (action) => action.productId === product.id,
    );
    const release = getReleaseForProduct(product.id, product.businessLineId);
    const latest = latestRelease(release);
    const plannedRelease = nextRelease(release);
    const stage = productStage(product.status, release);
    const matrix = matrixByProductId.get(product.id);
    const missingStoreTargets =
      matrix?.targets
        .filter((target) => target.status === "missing" && target.meta)
        .map((target) => target.meta?.label ?? PRODUCT_PLATFORM_LABEL[target.platform]) ?? [];

    const activeSkus = skus.filter((sku) => sku.status !== "sunset");
    const activeOffers = offers.filter((offer) => offer.status === "active");
    const activeStorefronts = storefronts.filter((storefront) => storefront.status === "active");
    const liveListings = listings.filter((listing) => listing.status === "live");
    const runningCampaigns = campaigns.filter((campaign) => campaign.status === "running");
    const readyContent = contentItems.filter((item) =>
      ["scheduled", "published"].includes(item.status),
    );
    const runningExperiments = experiments.filter((experiment) => experiment.status === "running");
    const activePromotionActions = promotionActions.filter((action) =>
      ["draft", "ready", "running"].includes(action.status),
    );

    const risks: ProductRisk[] = [];
    const actions: ProductAction[] = [];

    if (product.status === "planned") {
      risks.push({ key: "preLaunch" });
      actions.push({ key: "lockLaunchChecklist" });
    } else if (product.status === "sunset") {
      risks.push({ key: "sunset" });
      actions.push({ key: "archiveListings" });
    } else {
      if (activeSkus.length === 0) {
        risks.push({ key: "noActiveSku" });
        actions.push({ key: "createActiveSku" });
      }
      if (activeOffers.length === 0) {
        risks.push({ key: "noActiveOffer" });
        actions.push({ key: "packagePrimarySku" });
      }
      if (product.platforms?.length && !latest) {
        risks.push({ key: "noDatedRelease" });
        actions.push({ key: "updateReleaseManifest" });
      }
      if (missingStoreTargets.length > 0) {
        risks.push({
          key: "missingStoreTarget",
          target: compactList(missingStoreTargets, "store target", 2),
        });
        actions.push({ key: "prepareListingAssets", target: missingStoreTargets[0] });
      }
      if (
        product.kind !== "service" &&
        activeStorefronts.length === 0 &&
        liveListings.length === 0
      ) {
        risks.push({ key: "noActiveStorefront" });
        actions.push({ key: "assignStorefront" });
      }
      if (
        runningCampaigns.length === 0 &&
        readyContent.length === 0 &&
        runningExperiments.length === 0 &&
        activePromotionActions.length === 0
      ) {
        risks.push({ key: "noActivePromotion" });
        actions.push({ key: "createPromotionAction" });
      }
    }

    const health: HealthStatus =
      product.status === "planned"
        ? "planned"
        : risks.some(
              (risk) =>
                risk.key === "noActiveSku" ||
                risk.key === "noActiveOffer" ||
                risk.key === "noActiveStorefront",
            )
          ? "blocked"
          : risks.length > 0
            ? "watch"
            : "healthy";

    return {
      product,
      businessLine,
      skus,
      listings,
      offers,
      targetIcps,
      storefronts,
      campaigns,
      contentItems,
      experiments,
      promotionActions,
      release,
      latest,
      nextRelease: plannedRelease,
      stage,
      health,
      owner:
        offers.find((offer) => offer.owner)?.owner ??
        listings.find((listing) => listing.owner)?.owner ??
        storefronts.find((storefront) => storefront.owner)?.owner ??
        campaigns.find((campaign) => campaign.owner)?.owner ??
        "Unassigned",
      risks,
      actions,
      pricing: priceSummary(skus),
      matrix,
      missingStoreTargets,
    };
  });
}

export function GtmProductsPage() {
  const locale = useGtmLocale();
  const data = useGtmData();
  const rows = deriveProductRows(data);
  const operatingCount = rows.filter((row) => row.stage === "operating").length;
  const watchCount = rows.filter(
    (row) => row.health === "watch" || row.health === "blocked",
  ).length;
  const activeSkuCount = rows.reduce((sum, row) => sum + row.skus.length, 0);
  const liveListingCount = data.channelListings.filter(
    (listing) => listing.status === "live",
  ).length;
  const missingStoreCount = rows.reduce((sum, row) => sum + row.missingStoreTargets.length, 0);
  const runningPromotionCount =
    data.adCampaigns.filter((campaign) => campaign.status === "running").length +
    data.experiments.filter((experiment) => experiment.status === "running").length +
    data.promotionActions.filter((action) => ["ready", "running"].includes(action.status)).length;
  const experimentById = new Map(data.experiments.map((experiment) => [experiment.id, experiment]));
  const rowsWithPromotionActions = rows.filter((row) => row.promotionActions.length > 0);
  const rowsWithoutPromotionActions = rows.filter((row) => row.promotionActions.length === 0);

  return (
    <div className="space-y-5 p-6">
      <div>
        <h1 className="text-2xl font-bold">{tGtm(text.productsTitle, locale)}</h1>
        <p className="text-sm text-muted-foreground">
          {tGtm(text.productsSummary, locale)
            .replace("{products}", data.products.length.toString())
            .replace("{operating}", operatingCount.toString())
            .replace("{watch}", watchCount.toString())
            .replace("{missing}", missingStoreCount.toString())}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-medium uppercase text-muted-foreground">
              {tGtm(text.operatingSnapshot, locale)}
            </div>
            <div className="mt-2 text-2xl font-bold">{operatingCount}</div>
            <div className="text-xs text-muted-foreground">
              {tGtm(text.operatingProducts, locale)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-medium uppercase text-muted-foreground">
              {tGtm(text.productHealth, locale)}
            </div>
            <div className="mt-2 text-2xl font-bold">{watchCount}</div>
            <div className="text-xs text-muted-foreground">{tGtm(text.watchBlocked, locale)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-medium uppercase text-muted-foreground">
              {tGtm(text.commerce, locale)}
            </div>
            <div className="mt-2 text-2xl font-bold">{activeSkuCount}</div>
            <div className="text-xs text-muted-foreground">
              {tGtm(text.liveListingsGaps, locale)
                .replace("{live}", liveListingCount.toString())
                .replace("{missing}", missingStoreCount.toString())}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-medium uppercase text-muted-foreground">
              {tGtm(text.promotion, locale)}
            </div>
            <div className="mt-2 text-2xl font-bold">{runningPromotionCount}</div>
            <div className="text-xs text-muted-foreground">
              {tGtm(text.readyActionsRunningTests, locale)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{tGtm(text.operatingSnapshot, locale)}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="w-[230px] py-2 pr-4 font-medium">{tGtm(text.product, locale)}</th>
                  <th className="w-[150px] py-2 pr-4 font-medium">{tGtm(text.status, locale)}</th>
                  <th className="w-[180px] py-2 pr-4 font-medium">{tGtm(text.release, locale)}</th>
                  <th className="w-[190px] py-2 pr-4 font-medium">{tGtm(text.commerce, locale)}</th>
                  <th className="w-[180px] py-2 pr-4 font-medium">
                    {tGtm(text.promotion, locale)}
                  </th>
                  <th className="w-[180px] py-2 pr-4 font-medium">{tGtm(text.risk, locale)}</th>
                  <th className="py-2 font-medium">{tGtm(text.nextAction, locale)}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row) => (
                  <tr key={row.product.id} className="align-top">
                    <td className="py-3 pr-4">
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5">{row.product.emoji}</span>
                        <div className="min-w-0">
                          <div className="font-medium">{row.product.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {row.businessLine
                              ? `${row.businessLine.emoji} ${row.businessLine.name}`
                              : row.product.businessLineId}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {tGtm(text.owner, locale)} · {row.owner}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-col items-start gap-1">
                        <Badge variant="outline" className={statusChipClassName(row.health)}>
                          {statusLabel(row.health, locale)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {statusLabel(row.stage, locale)} ·{" "}
                          {statusLabel(row.product.status, locale)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="font-mono text-xs font-semibold">
                        {row.latest ? `${row.latest.version} · ${row.latest.platform}` : "-"}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {row.latest
                          ? `${statusLabel(row.latest.status, locale)} · ${row.latest.date}`
                          : tGtm(text.latestReleaseMissing, locale)}
                      </div>
                      {row.nextRelease && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          {tGtm(text.nextRelease, locale)} ·{" "}
                          {statusLabel(row.nextRelease.status, locale)} · {row.nextRelease.platform}
                        </div>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="text-xs">{commerceCount(row, locale)}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{row.pricing}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {storeStatusSummary(row.storefronts, locale)}
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="text-xs">{promotionCount(row, locale)}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {experimentsRunningCount(row, locale)}
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-xs">
                      <RiskSummary row={row} locale={locale} />
                    </td>
                    <td className="py-3 text-xs">{nextActionSummary(row, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{tGtm(text.promotionPlan, locale)}</CardTitle>
          <p className="max-w-3xl text-sm text-muted-foreground">
            {tGtm(text.promotionPlanSummary, locale)}
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2">
            {rowsWithPromotionActions.map((row) => (
              <article key={row.product.id} className="rounded-lg bg-muted/55 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-base font-semibold">
                      <span>{row.product.emoji}</span>
                      <span className="truncate">{row.product.name}</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {promotionCountSummary(row, locale)}
                    </div>
                  </div>
                  <Badge variant="outline" className={statusChipClassName(row.health)}>
                    {statusLabel(row.health, locale)}
                  </Badge>
                </div>

                <div className="mt-4 space-y-3">
                  {row.promotionActions.map((action) => {
                    const linkedExperiments = (action.experimentIds ?? [])
                      .map((experimentId) => experimentById.get(experimentId))
                      .filter((experiment): experiment is Experiment => Boolean(experiment));
                    return (
                      <section
                        key={action.id}
                        className="grid gap-4 rounded-md bg-background/80 p-3 shadow-sm md:grid-cols-[minmax(220px,0.8fr)_1.2fr]"
                      >
                        <div>
                          <div className="font-medium leading-6">
                            {pickLocale(action.name, locale)}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            <Badge variant="outline">{pickLocale(action.channel, locale)}</Badge>
                            <Badge variant="secondary">
                              {cadenceLabel(action.cadence, locale)}
                            </Badge>
                            <Badge variant="outline" className={statusChipClassName(action.status)}>
                              {statusLabel(action.status, locale)}
                            </Badge>
                          </div>
                          <div className="mt-4">
                            <div className="text-[11px] font-medium uppercase text-muted-foreground">
                              {tGtm(text.objective, locale)}
                            </div>
                            <p className="mt-1 text-sm leading-6 text-foreground/85">
                              {pickLocale(action.objective, locale)}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                              <Badge variant="outline">
                                {tGtm(text.routine, locale)} ·{" "}
                                {cadenceLabel(action.cadence, locale)}
                              </Badge>
                              {action.nextDate && (
                                <Badge variant="outline">next · {action.nextDate}</Badge>
                              )}
                              {action.owner && <Badge variant="outline">{action.owner}</Badge>}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <div className="text-[11px] font-medium uppercase text-muted-foreground">
                              {tGtm(text.materials, locale)}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {action.assets.map((asset) => {
                                const assetKey = `${action.id}-${asset.label}`;
                                const itemClassName = `inline-flex min-h-8 items-center gap-2 rounded-md bg-muted/65 px-2.5 py-1.5 text-xs ${
                                  asset.url ? "hover:bg-muted" : ""
                                }`;
                                return asset.url ? (
                                  <Link key={assetKey} href={asset.url} className={itemClassName}>
                                    <span className="max-w-40 leading-4">
                                      {pickLocale(asset.label, locale)}
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className={`shrink-0 ${statusChipClassName(asset.status)}`}
                                    >
                                      {statusLabel(asset.status, locale)}
                                    </Badge>
                                  </Link>
                                ) : (
                                  <span key={assetKey} className={itemClassName}>
                                    <span className="max-w-40 leading-4">
                                      {pickLocale(asset.label, locale)}
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className={`shrink-0 ${statusChipClassName(asset.status)}`}
                                    >
                                      {statusLabel(asset.status, locale)}
                                    </Badge>
                                  </span>
                                );
                              })}
                            </div>
                          </div>

                          <div>
                            <div className="text-[11px] font-medium uppercase text-muted-foreground">
                              {tGtm(text.experiments, locale)}
                            </div>
                            {linkedExperiments.length > 0 ? (
                              <div className="mt-2 space-y-2">
                                {linkedExperiments.map((experiment) => (
                                  <div
                                    key={experiment.id}
                                    className="rounded-md bg-muted/65 p-2.5 text-xs leading-5"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Badge
                                        variant="outline"
                                        className={`shrink-0 ${statusChipClassName(experiment.status)}`}
                                      >
                                        {statusLabel(experiment.status, locale)}
                                      </Badge>
                                      <span className="font-medium">{experiment.hypothesis}</span>
                                    </div>
                                    <div className="mt-1 text-muted-foreground">
                                      {experiment.test}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="mt-2 text-xs text-muted-foreground">
                                {tGtm(text.noLinkedExperiment, locale)}
                              </p>
                            )}
                          </div>
                        </div>
                      </section>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>

          {rowsWithoutPromotionActions.length > 0 && (
            <div className="rounded-lg border border-dashed border-border p-4">
              <div className="text-xs font-medium uppercase text-muted-foreground">
                {tGtm(text.noPromotionPlan, locale)}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {rowsWithoutPromotionActions.map((row) => (
                  <Badge key={row.product.id} variant="outline">
                    {row.product.emoji} {row.product.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {rows.map((row) => (
          <Card key={row.product.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <span>{row.product.emoji}</span>
                    <span className="truncate">{row.product.name}</span>
                  </CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {pickLocale(row.product.tagline ?? row.product.description, locale)}
                  </p>
                </div>
                <Badge variant="outline" className={statusChipClassName(row.health)}>
                  {statusLabel(row.health, locale)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
                <div className="rounded border border-border p-2">
                  <div className="text-xs text-muted-foreground">{tGtm(text.stage, locale)}</div>
                  <div className="font-semibold">{statusLabel(row.stage, locale)}</div>
                </div>
                <div className="rounded border border-border p-2">
                  <div className="text-xs text-muted-foreground">{tGtm(text.release, locale)}</div>
                  <div className="font-mono text-xs font-semibold">
                    {row.latest ? row.latest.version : "-"}
                  </div>
                </div>
                <div className="rounded border border-border p-2">
                  <div className="text-xs text-muted-foreground">{tGtm(text.skus, locale)}</div>
                  <div className="font-mono font-semibold">{row.skus.length}</div>
                </div>
                <div className="rounded border border-border p-2">
                  <div className="text-xs text-muted-foreground">{tGtm(text.listings, locale)}</div>
                  <div className="font-mono font-semibold">{row.listings.length}</div>
                </div>
              </div>

              <div className="grid gap-3 text-xs md:grid-cols-2">
                <div>
                  <div className="mb-2 font-medium uppercase text-muted-foreground">
                    {tGtm(text.risk, locale)}
                  </div>
                  <div className="rounded-md bg-muted/35 p-3">
                    <RiskSummary row={row} locale={locale} />
                  </div>
                </div>
                <div>
                  <div className="mb-2 font-medium uppercase text-muted-foreground">
                    {tGtm(text.nextAction, locale)}
                  </div>
                  <div className="rounded border border-border p-3">
                    {nextActionSummary(row, locale)}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 text-xs md:grid-cols-2">
                <div>
                  <div className="mb-2 font-medium uppercase text-muted-foreground">
                    {tGtm(text.pricing, locale)}
                  </div>
                  <div className="rounded border border-border p-3">{row.pricing}</div>
                </div>
                <div>
                  <div className="mb-2 font-medium uppercase text-muted-foreground">
                    {tGtm(text.storeCoverage, locale)}
                  </div>
                  <div className="rounded border border-border p-3">
                    {row.matrix
                      ? tGtm(text.covered, locale)
                          .replace("{covered}", row.matrix.coverage.covered.toString())
                          .replace("{total}", row.matrix.coverage.total.toString())
                      : tGtm(text.noPlatformStoreTarget, locale)}
                    {row.missingStoreTargets.length > 0 && (
                      <div className="mt-1 text-muted-foreground">
                        {tGtm(text.missing, locale)} ·{" "}
                        {compactList(row.missingStoreTargets, "-", 3)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {(row.storefronts.length > 0 || row.listings.length > 0) && (
                <div className="grid gap-3 text-xs md:grid-cols-2">
                  <div>
                    <div className="mb-2 font-medium uppercase text-muted-foreground">
                      {tGtm(text.storefronts, locale)}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {row.storefronts.length > 0 ? (
                        row.storefronts.map((storefront) => (
                          <Link key={storefront.id} href={`/storefronts/${storefront.id}`}>
                            <Badge variant="secondary" className="hover:bg-muted">
                              {storefront.name} · {statusLabel(storefront.status, locale)}
                            </Badge>
                          </Link>
                        ))
                      ) : (
                        <span className="text-muted-foreground">
                          {tGtm(text.noStorefronts, locale)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 font-medium uppercase text-muted-foreground">
                      {tGtm(text.listings, locale)}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {row.listings.length > 0 ? (
                        <>
                          {row.listings.slice(0, 8).map((listing) => (
                            <Link key={listing.id} href={`/listings/${listing.id}`}>
                              <Badge variant="outline" className="hover:bg-muted">
                                {listing.channel} · {statusLabel(listing.status, locale)}
                              </Badge>
                            </Link>
                          ))}
                          {row.listings.length > 8 && (
                            <Badge variant="outline">+{row.listings.length - 8}</Badge>
                          )}
                        </>
                      ) : (
                        <span className="text-muted-foreground">
                          {tGtm(text.noListings, locale)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {row.targetIcps.length > 0 && (
                <div>
                  <div className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                    {tGtm(text.targetIcps, locale)}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {row.targetIcps.map((icp) => (
                      <Badge key={icp.id} variant="secondary">
                        {icp.emoji} {pickLocale(icp.name, locale)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {row.skus.length > 0 && (
                <div>
                  <div className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                    {tGtm(text.skuDetails, locale)}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {row.skus.map((sku) => (
                      <Link key={sku.id} href={`/skus/${sku.id}`}>
                        <Badge variant="outline" className="hover:bg-muted">
                          {sku.name}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
