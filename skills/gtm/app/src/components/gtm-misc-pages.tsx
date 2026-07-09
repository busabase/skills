"use client";

import { Badge } from "kui/badge";
import { Card, CardContent } from "kui/card";
import { useLocation } from "wouter";
import {
  COMMUNITY_PLATFORMS,
  INFLUENCER_KIT_CATEGORIES,
  pickLocale,
  tGtm,
  useGtmData,
  useGtmLocale,
} from "../data";

const text = {
  planned: { en: "Planned", "zh-CN": "计划中", "zh-TW": "計劃中", ja: "予定", pt: "Planejado" },
  running: { en: "Running", "zh-CN": "进行中", "zh-TW": "進行中", ja: "進行中", pt: "Rodando" },
  done: { en: "Done", "zh-CN": "已完成", "zh-TW": "已完成", ja: "完了", pt: "Concluído" },
  hypothesis: { en: "Hypothesis", "zh-CN": "假设", "zh-TW": "假設", ja: "仮説", pt: "Hipótese" },
  test: { en: "Test", "zh-CN": "测试", "zh-TW": "測試", ja: "テスト", pt: "Teste" },
  result: { en: "Result", "zh-CN": "结果", "zh-TW": "結果", ja: "結果", pt: "Resultado" },
  experimentsTitle: {
    en: "Experiments / Hypotheses",
    "zh-CN": "实验 / 假设",
    "zh-TW": "實驗 / 假設",
    ja: "実験 / 仮説",
    pt: "Experimentos / Hipóteses",
  },
  experimentsSummary: {
    en: "{count} experiment hypotheses",
    "zh-CN": "共 {count} 个实验假设",
    "zh-TW": "共 {count} 個實驗假設",
    ja: "{count} 件の実験仮説",
    pt: "{count} hipóteses de experimento",
  },
  budgetTitle: { en: "Budget", "zh-CN": "预算", "zh-TW": "預算", ja: "予算", pt: "Orçamento" },
  budgetSummary: {
    en: "Budget ¥{allocated} · spent ¥{spent} ({pct}%)",
    "zh-CN": "预算 ¥{allocated} · 已花 ¥{spent} ({pct}%)",
    "zh-TW": "預算 ¥{allocated} · 已花 ¥{spent} ({pct}%)",
    ja: "予算 ¥{allocated} · 消化 ¥{spent} ({pct}%)",
    pt: "Orçamento ¥{allocated} · gasto ¥{spent} ({pct}%)",
  },
  negotiation: {
    en: "Negotiation",
    "zh-CN": "谈单",
    "zh-TW": "談單",
    ja: "交渉",
    pt: "Negociação",
  },
  closedWon: {
    en: "Closed won",
    "zh-CN": "成交",
    "zh-TW": "成交",
    ja: "受注",
    pt: "Fechado ganho",
  },
  closedLost: {
    en: "Closed lost",
    "zh-CN": "失败",
    "zh-TW": "失敗",
    ja: "失注",
    pt: "Fechado perdido",
  },
  pipelineTitle: {
    en: "Sales Pipeline",
    "zh-CN": "销售管线",
    "zh-TW": "銷售管線",
    ja: "営業パイプライン",
    pt: "Pipeline de vendas",
  },
  pipelineSummary: {
    en: "{count} deals in pipeline",
    "zh-CN": "共 {count} 个 deal 在流水线",
    "zh-TW": "共 {count} 個 deal 在流水線",
    ja: "{count} 件の商談がパイプラインにあります",
    pt: "{count} deals no pipeline",
  },
  noDeals: {
    en: "No deals yet",
    "zh-CN": "暂无 deal",
    "zh-TW": "暫無 deal",
    ja: "商談はまだありません",
    pt: "Nenhum deal ainda",
  },
  salesPitchTitle: {
    en: "🎤 Sales Pitch",
    "zh-CN": "🎤 销售话术",
    "zh-TW": "🎤 銷售話術",
    ja: "🎤 営業ピッチ",
    pt: "🎤 Pitch de vendas",
  },
  salesPitchSummary: {
    en: "Sales Pitch assets for every ICP (PPT + script) · {count} items",
    "zh-CN": "所有 ICP 的 Sales Pitch 资产（PPT + 演讲稿）· {count} 份",
    "zh-TW": "所有 ICP 的 Sales Pitch 資產（PPT + 講稿）· {count} 份",
    ja: "全 ICP の営業ピッチ資産（PPT + スクリプト）· {count} 件",
    pt: "Assets de Sales Pitch por ICP (PPT + roteiro) · {count} itens",
  },
  noSalesPitch: {
    en: "No Sales Pitch assets yet. Prepare one PPT + script for every core ICP.",
    "zh-CN": "还没有 Sales Pitch 资产。为每个核心 ICP 准备一份 PPT + 演讲稿。",
    "zh-TW": "還沒有 Sales Pitch 資產。為每個核心 ICP 準備一份 PPT + 講稿。",
    ja: "営業ピッチ資産はまだありません。各主要 ICP に PPT + スクリプトを用意してください。",
    pt: "Ainda não há assets de Sales Pitch. Prepare um PPT + roteiro para cada ICP principal.",
  },
  open: { en: "Open ↗", "zh-CN": "打开 ↗", "zh-TW": "打開 ↗", ja: "開く ↗", pt: "Abrir ↗" },
  influencerTitle: {
    en: "🌟 Influencer Kit",
    "zh-CN": "🌟 达人素材包",
    "zh-TW": "🌟 達人素材包",
    ja: "🌟 インフルエンサーキット",
    pt: "🌟 Kit de influenciadores",
  },
  influencerSummary: {
    en: "KOL outreach kit · canonical material completeness for each ICP",
    "zh-CN": "KOL 触达套件 · 每个 ICP 的 canonical 物料完整度",
    "zh-TW": "KOL 觸達套件 · 每個 ICP 的 canonical 物料完整度",
    ja: "KOL アウトリーチキット · 各 ICP の標準素材完成度",
    pt: "Kit de outreach para KOL · completude dos materiais canônicos por ICP",
  },
  icp: { en: "ICP", "zh-CN": "ICP", "zh-TW": "ICP", ja: "ICP", pt: "ICP" },
  progress: { en: "Progress", "zh-CN": "进度", "zh-TW": "進度", ja: "進捗", pt: "Progresso" },
  communityTitle: {
    en: "👥 Community",
    "zh-CN": "👥 社区",
    "zh-TW": "👥 社群",
    ja: "👥 コミュニティ",
    pt: "👥 Comunidade",
  },
  communitySummary: {
    en: "Community channels · Discord / Telegram / WeChat · {count} accounts",
    "zh-CN": "社群渠道 · Discord / Telegram / 公众号 · {count} 个账号",
    "zh-TW": "社群渠道 · Discord / Telegram / 公眾號 · {count} 個帳號",
    ja: "コミュニティチャネル · Discord / Telegram / WeChat · {count} アカウント",
    pt: "Canais de comunidade · Discord / Telegram / WeChat · {count} contas",
  },
  noCommunity: {
    en: "No community channels yet. Configure at least one community entry for the main ICP.",
    "zh-CN": "还没有社群渠道。至少为主 ICP 配置一个社群入口（Discord / Telegram / 公众号）。",
    "zh-TW": "還沒有社群渠道。至少為主 ICP 配置一個社群入口（Discord / Telegram / 公眾號）。",
    ja: "コミュニティチャネルはまだありません。主 ICP に少なくとも 1 つ設定してください。",
    pt: "Ainda não há canais de comunidade. Configure pelo menos uma entrada para o ICP principal.",
  },
  retrosTitle: {
    en: "🔄 Retros",
    "zh-CN": "🔄 复盘",
    "zh-TW": "🔄 復盤",
    ja: "🔄 振り返り",
    pt: "🔄 Retros",
  },
  retrosSummary: {
    en: "Retrospective records across all ICPs · reverse chronological · {count} entries",
    "zh-CN": "所有 ICP 的复盘记录 · 按时间倒序 · {count} 条",
    "zh-TW": "所有 ICP 的復盤記錄 · 按時間倒序 · {count} 條",
    ja: "全 ICP の振り返り記録 · 新しい順 · {count} 件",
    pt: "Retros de todos os ICPs · ordem cronológica reversa · {count} entradas",
  },
  noRetros: {
    en: "No retros yet. After each campaign or experiment, add one record here.",
    "zh-CN": "还没有复盘记录。每做完一次 campaign / 实验，回来写一条。",
    "zh-TW": "還沒有復盤記錄。每做完一次 campaign / 實驗，回來寫一條。",
    ja: "振り返りはまだありません。キャンペーン / 実験の後に記録してください。",
    pt: "Ainda não há retros. Após cada campanha / experimento, registre uma entrada.",
  },
  playbooksTitle: {
    en: "📘 Playbooks",
    "zh-CN": "📘 Playbooks",
    "zh-TW": "📘 Playbooks",
    ja: "📘 Playbooks",
    pt: "📘 Playbooks",
  },
  playbooksSummary: {
    en: "Strategic execution manuals · stored in",
    "zh-CN": "战略执行手册 · 存储于",
    "zh-TW": "戰略執行手冊 · 儲存於",
    ja: "戦略実行マニュアル · 保存先",
    pt: "Manuais de execução estratégica · armazenados em",
  },
  playbooksFuture: {
    en: "Future improvement: list automatically from the filesystem and render MDX in a side drawer.",
    "zh-CN": "未来改进：自动从文件系统列出，并支持点击在右侧抽屉渲染 MDX 内容。",
    "zh-TW": "未來改進：自動從檔案系統列出，並支援點擊在右側抽屜渲染 MDX 內容。",
    ja: "今後の改善：ファイルシステムから自動列挙し、右側ドロワーで MDX を表示。",
    pt: "Melhoria futura: listar automaticamente do filesystem e renderizar MDX em uma gaveta lateral.",
  },
};

const expStatusColor = {
  planned: "text-muted-foreground",
  running: "text-blue-500",
  done: "text-green-500",
} as const;

const stageColor = {
  lead: "text-muted-foreground",
  demo: "text-blue-500",
  negotiation: "text-yellow-500",
  "closed-won": "text-green-500",
  "closed-lost": "text-red-500",
} as const;

const assetStatusColor = {
  live: "bg-green-500 text-white",
  draft: "bg-yellow-500 text-white",
  todo: "bg-zinc-400 text-white",
} as const;

export function GtmExperimentsPage() {
  const locale = useGtmLocale();
  const data = useGtmData();
  const expStatusLabel = {
    planned: tGtm(text.planned, locale),
    running: tGtm(text.running, locale),
    done: tGtm(text.done, locale),
  } as const;

  return (
    <div className="p-6 space-y-4 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">{tGtm(text.experimentsTitle, locale)}</h1>
        <p className="text-sm text-muted-foreground">
          {tGtm(text.experimentsSummary, locale).replace(
            "{count}",
            data.experiments.length.toString(),
          )}
        </p>
      </div>

      <div className="space-y-2">
        {data.experiments.map((experiment) => {
          const icp = experiment.icpId
            ? data.icps.find((item) => item.id === experiment.icpId)
            : null;
          return (
            <Card key={experiment.id}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className={`text-xs font-bold ${expStatusColor[experiment.status]}`}>
                    ● {expStatusLabel[experiment.status]}
                  </span>
                  {icp && (
                    <Badge variant="outline" className="text-xs">
                      {icp.emoji} {pickLocale(icp.name, locale)}
                    </Badge>
                  )}
                </div>
                <div className="text-sm font-medium">
                  {tGtm(text.hypothesis, locale)}: {experiment.hypothesis}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {tGtm(text.test, locale)}: {experiment.test}
                </div>
                {experiment.result && (
                  <div className="text-sm text-green-600 dark:text-green-400 mt-1">
                    {tGtm(text.result, locale)}: {experiment.result}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export function GtmBudgetPage() {
  const locale = useGtmLocale();
  const data = useGtmData();
  const totalAllocated = data.budget.reduce((sum, item) => sum + item.allocated, 0);
  const totalSpent = data.budget.reduce((sum, item) => sum + item.spent, 0);
  const totalPct = totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0;

  return (
    <div className="p-6 space-y-4 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">{tGtm(text.budgetTitle, locale)}</h1>
        <p className="text-sm text-muted-foreground">
          {tGtm(text.budgetSummary, locale)
            .replace("{allocated}", totalAllocated.toLocaleString())
            .replace("{spent}", totalSpent.toLocaleString())
            .replace("{pct}", totalPct.toString())}
        </p>
      </div>

      <Card>
        <CardContent className="pt-4 space-y-3">
          {data.budget.map((budget) => {
            const pct =
              budget.allocated > 0 ? Math.min(100, (budget.spent / budget.allocated) * 100) : 0;
            const icp = budget.icpId ? data.icps.find((item) => item.id === budget.icpId) : null;
            return (
              <div key={budget.category}>
                <div className="flex justify-between text-sm mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{budget.category}</span>
                    {icp && (
                      <Badge variant="outline" className="text-[9px]">
                        {icp.emoji} {pickLocale(icp.name, locale)}
                      </Badge>
                    )}
                  </div>
                  <span className="font-mono text-muted-foreground text-xs">
                    ¥{budget.spent.toLocaleString()} / ¥{budget.allocated.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

export function GtmPipelinePage() {
  const locale = useGtmLocale();
  const data = useGtmData();
  const stageLabel = {
    lead: "Lead",
    demo: "Demo",
    negotiation: tGtm(text.negotiation, locale),
    "closed-won": tGtm(text.closedWon, locale),
    "closed-lost": tGtm(text.closedLost, locale),
  } as const;

  return (
    <div className="p-6 space-y-4 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">{tGtm(text.pipelineTitle, locale)}</h1>
        <p className="text-sm text-muted-foreground">
          {tGtm(text.pipelineSummary, locale).replace("{count}", data.pipeline.length.toString())}
        </p>
      </div>

      {data.pipeline.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-sm text-muted-foreground italic">
            {tGtm(text.noDeals, locale)}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {data.pipeline.map((deal) => {
            const sku = data.skus.find((item) => item.id === deal.skuId);
            const icp = deal.icpId ? data.icps.find((item) => item.id === deal.icpId) : null;
            return (
              <Card key={deal.name}>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-bold ${stageColor[deal.stage]}`}>
                      ● {stageLabel[deal.stage]}
                    </span>
                    <span className="text-sm font-medium">{deal.name}</span>
                    {deal.value && (
                      <span className="text-sm font-mono text-green-600 dark:text-green-400 ml-auto">
                        {deal.value}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                    {sku && (
                      <Badge variant="outline" className="text-[9px]">
                        {sku.emoji} {sku.name}
                      </Badge>
                    )}
                    {icp && (
                      <Badge variant="outline" className="text-[9px]">
                        {icp.emoji} {pickLocale(icp.name, locale)}
                      </Badge>
                    )}
                  </div>
                  {deal.notes && (
                    <div className="text-xs text-muted-foreground mt-2">{deal.notes}</div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function GtmSalesPitchPage() {
  const locale = useGtmLocale();
  const data = useGtmData();
  const rows = data.icps.flatMap((icp) =>
    icp.assets.filter((asset) => asset.category === "sales-pitch").map((asset) => ({ icp, asset })),
  );

  return (
    <div className="p-6 space-y-4 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">{tGtm(text.salesPitchTitle, locale)}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {tGtm(text.salesPitchSummary, locale).replace("{count}", rows.length.toString())}
        </p>
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-sm text-muted-foreground italic">
            {tGtm(text.noSalesPitch, locale)}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {rows.map(({ icp, asset }) => (
            <Card key={`${icp.id}-${asset.name}`}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-lg">{icp.emoji}</span>
                  <span className="text-xs text-muted-foreground">
                    {pickLocale(icp.name, locale)}
                  </span>
                  <span className="text-sm font-medium ml-2 flex-1">{asset.name}</span>
                  <Badge className={`text-[10px] ${assetStatusColor[asset.status]}`}>
                    {asset.status}
                  </Badge>
                  {asset.url && (
                    <a
                      href={asset.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      {tGtm(text.open, locale)}
                    </a>
                  )}
                </div>
                {asset.notes && (
                  <div className="text-xs text-muted-foreground mt-2">{asset.notes}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function GtmInfluencerKitPage() {
  const locale = useGtmLocale();
  const data = useGtmData();
  return (
    <div className="p-6 space-y-4 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">{tGtm(text.influencerTitle, locale)}</h1>
        <p className="text-sm text-muted-foreground mt-1">{tGtm(text.influencerSummary, locale)}</p>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2 pr-3 font-medium w-48">{tGtm(text.icp, locale)}</th>
                  {INFLUENCER_KIT_CATEGORIES.map((category) => (
                    <th key={category.category} className="py-2 pr-3 font-medium text-xs">
                      {category.label}
                    </th>
                  ))}
                  <th className="py-2 pr-3 font-medium text-xs">{tGtm(text.progress, locale)}</th>
                </tr>
              </thead>
              <tbody>
                {data.icps.map((icp) => {
                  const live = INFLUENCER_KIT_CATEGORIES.filter((category) =>
                    icp.assets.some(
                      (asset) => asset.category === category.category && asset.status === "live",
                    ),
                  ).length;
                  return (
                    <tr key={icp.id} className="border-b border-border/50">
                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{icp.emoji}</span>
                          <span className="text-xs font-medium">
                            {pickLocale(icp.name, locale)}
                          </span>
                        </div>
                      </td>
                      {INFLUENCER_KIT_CATEGORIES.map((category) => {
                        const asset = icp.assets.find(
                          (item) => item.category === category.category,
                        );
                        const status = asset?.status ?? "todo";
                        return (
                          <td key={category.category} className="py-2 pr-3">
                            <Badge className={`text-[9px] ${assetStatusColor[status]}`}>
                              {status}
                            </Badge>
                          </td>
                        );
                      })}
                      <td className="py-2 pr-3 font-mono text-xs">
                        {live} / {INFLUENCER_KIT_CATEGORIES.length}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function GtmCommunityPage() {
  const locale = useGtmLocale();
  const data = useGtmData();
  const accounts = data.accounts.filter((account) =>
    (COMMUNITY_PLATFORMS as readonly string[]).includes(account.platform),
  );

  return (
    <div className="p-6 space-y-4 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">{tGtm(text.communityTitle, locale)}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {tGtm(text.communitySummary, locale).replace("{count}", accounts.length.toString())}
        </p>
      </div>

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-sm text-muted-foreground italic">
            {tGtm(text.noCommunity, locale)}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {accounts.map((account) => (
            <Card key={account.id}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-[10px]">
                    {account.platform}
                  </Badge>
                  <span className="text-sm font-medium">
                    {account.displayName ?? account.handle}
                  </span>
                  <span className="text-xs text-muted-foreground">{account.handle}</span>
                  <Badge
                    className={`text-[10px] ml-auto ${
                      account.status === "active"
                        ? "bg-green-500 text-white"
                        : "bg-zinc-400 text-white"
                    }`}
                  >
                    {account.status}
                  </Badge>
                  {account.url && (
                    <a
                      href={account.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      ↗
                    </a>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-2">{account.purpose}</div>
                <div className="flex gap-1 mt-2 flex-wrap">
                  {account.targetIcpIds.map((icpId) => {
                    const icp = data.icps.find((item) => item.id === icpId);
                    return icp ? (
                      <Badge key={icpId} variant="outline" className="text-[9px]">
                        {icp.emoji} {pickLocale(icp.name, locale)}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function GtmRetrosPage() {
  const locale = useGtmLocale();
  const data = useGtmData();
  const entries = data.icps
    .flatMap((icp) => icp.retro.map((entry) => ({ icp, entry })))
    .sort((a, b) => (a.entry.date < b.entry.date ? 1 : -1));

  return (
    <div className="p-6 space-y-4 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">{tGtm(text.retrosTitle, locale)}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {tGtm(text.retrosSummary, locale).replace("{count}", entries.length.toString())}
        </p>
      </div>

      {entries.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-sm text-muted-foreground italic">
            {tGtm(text.noRetros, locale)}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {entries.map(({ icp, entry }) => (
            <Card key={`${icp.id}-${entry.date}-${entry.action}`}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-[10px] font-mono text-muted-foreground">{entry.date}</span>
                  <Badge variant="outline" className="text-[9px]">
                    {icp.emoji} {pickLocale(icp.name, locale)}
                  </Badge>
                </div>
                <div className="text-sm">
                  <span className="font-medium">{entry.action}</span>
                  <span className="text-muted-foreground"> → </span>
                  <span>{entry.result}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function GtmPlaybooksPage() {
  const locale = useGtmLocale();
  const data = useGtmData();
  const [, navigate] = useLocation();
  return (
    <div className="p-6 space-y-4 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">{tGtm(text.playbooksTitle, locale)}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {tGtm(text.playbooksSummary, locale)}{" "}
          <code className="px-1 bg-muted rounded">content/gtm/</code>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {data.playbooks.map((playbook) => (
          <Card
            key={playbook.slug}
            className="cursor-pointer transition-colors hover:bg-muted/50"
            onClick={() => navigate(`/playbooks/${playbook.slug}`)}
          >
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{playbook.emoji ?? "📖"}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{playbook.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">{playbook.description}</div>
                  <div className="text-[10px] text-muted-foreground font-mono mt-2">
                    content/gtm/{playbook.slug}.md
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
