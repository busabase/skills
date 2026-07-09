"use client";

import {
  Background,
  Controls,
  Handle,
  type Node,
  type NodeProps,
  Position,
  ReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Badge } from "kui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "kui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "kui/tabs";
import {
  AlertTriangle,
  BookOpen,
  GitBranch,
  HelpCircle,
  ListChecks,
  Network,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import { useMemo } from "react";
import {
  type ICP,
  type ICPAsset,
  type PipelineDeal,
  pickLocale,
  type RevenueRoleId,
  type RevenueRolePlaybook,
  type SalesPipelineStageId,
  type SalesStagePlaybook,
  useGtmData,
  useGtmLocale,
} from "../data";

const roleColor: Record<string, string> = {
  mdr: "bg-sky-100 text-sky-700 border-sky-200",
  sdr: "bg-cyan-100 text-cyan-700 border-cyan-200",
  ae: "bg-emerald-100 text-emerald-700 border-emerald-200",
  se: "bg-indigo-100 text-indigo-700 border-indigo-200",
  sa: "bg-violet-100 text-violet-700 border-violet-200",
  csm: "bg-amber-100 text-amber-700 border-amber-200",
};

const dealStageMap: Record<PipelineDeal["stage"], SalesPipelineStageId> = {
  lead: "lead",
  demo: "demo",
  negotiation: "negotiation",
  "closed-won": "closed-won",
  "closed-lost": "negotiation",
};

type RequiredSalesAsset = ICPAsset["category"] | "customer-story" | "proposal" | "roi-model";

const assetLabel: Record<RequiredSalesAsset, string> = {
  video: "介绍视频",
  "landing-page": "落地页",
  messaging: "信息架构",
  template: "模板",
  skill: "Skill",
  agent: "Agent",
  "ad-creative": "广告素材",
  "email-sequence": "邮件序列",
  "sales-pitch": "销售材料 PPT",
  "influencer-product-brief": "达人产品简介",
  "influencer-campaign-script": "达人 campaign 文案",
  "influencer-thread-script": "Twitter/X thread",
  "influencer-outreach-playbook": "达人触达 SOP",
  "influencer-asset-pack": "达人素材包",
  onboarding: "客户启动材料",
  "customer-story": "客户案例",
  proposal: "方案/报价书",
  "roi-model": "ROI 模型",
};

interface GapItem {
  icp: ICP;
  stageId: SalesPipelineStageId;
  stageName: string;
  missingAsset: RequiredSalesAsset;
  owner: string;
  severity: "red" | "yellow";
  action: string;
}

interface SalesFlowNodeData extends Record<string, unknown> {
  title: string;
  shortName: string;
  ownerRole: RevenueRoleId;
  aiOperator?: string;
  goal: string;
  dealCount: number;
  gapCount: number;
  adminCount: number;
  missingOpsCount: number;
}

interface RevenueRoleNodeData extends Record<string, unknown> {
  name: string;
  title: string;
  mission: string;
  stageLabels: string[];
  metrics: string[];
}

function hasRequiredAsset(icp: ICP, asset: RequiredSalesAsset) {
  if (asset === "customer-story") {
    return icp.customerStories?.some(
      (story) => story.status === "approved" || story.status === "published",
    );
  }
  if (asset === "proposal" || asset === "roi-model") {
    return false;
  }
  return icp.assets.some((item) => item.category === asset && item.status === "live");
}

function getRoleStageLabels(role: RevenueRolePlaybook, stages: SalesStagePlaybook[]) {
  return role.ownsStageIds
    .map((stageId) => stages?.find((stage) => stage.id === stageId)?.shortName)
    .filter((name): name is string => Boolean(name));
}

function buildSalesFlow(stages: SalesStagePlaybook[], pipeline: PipelineDeal[], gaps: GapItem[]) {
  const flowNodes: Node<SalesFlowNodeData>[] = stages.map((stage, index) => ({
    id: stage.id,
    type: "salesStage",
    position: {
      x: (index % 4) * 300,
      y: Math.floor(index / 4) * 250,
    },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    data: {
      title: stage.name,
      shortName: stage.shortName,
      ownerRole: stage.ownerRole,
      aiOperator: stage.aiOperator,
      goal: stage.goal,
      dealCount: pipeline.filter((deal) => dealStageMap[deal.stage] === stage.id).length,
      gapCount: gaps.filter((gap) => gap.stageId === stage.id).length,
      adminCount: stage.systemAdmin?.filter((item) => item.status !== "missing").length ?? 0,
      missingOpsCount:
        (stage.systemAdmin?.filter((item) => item.status === "missing").length ?? 0) +
        (stage.gaps?.length ?? 0),
    },
  }));

  const flowEdges = stages.slice(0, -1).map((stage, index) => ({
    id: `${stage.id}-${stages[index + 1].id}`,
    source: stage.id,
    target: stages[index + 1].id,
    type: "smoothstep",
    animated: true,
  }));

  return { nodes: flowNodes, edges: flowEdges };
}

function buildRoleFlow(roles: RevenueRolePlaybook[], stages: SalesStagePlaybook[]) {
  const flowNodes: Node<RevenueRoleNodeData>[] = roles.map((role, index) => ({
    id: role.id,
    type: "revenueRole",
    position: {
      x: index * 265,
      y: index % 2 === 0 ? 0 : 175,
    },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    data: {
      name: role.name,
      title: role.title,
      mission: role.mission,
      stageLabels: getRoleStageLabels(role, stages),
      metrics: role.successMetrics,
    },
  }));

  const edgePairs: Array<[RevenueRoleId, RevenueRoleId]> = [
    ["mdr", "sdr"],
    ["sdr", "ae"],
    ["ae", "se"],
    ["se", "sa"],
    ["sa", "ae"],
    ["ae", "csm"],
    ["csm", "ae"],
  ];

  const flowEdges = edgePairs.map(([source, target]) => ({
    id: `${source}-${target}`,
    source,
    target,
    type: "smoothstep",
    animated: source !== "csm",
  }));

  return { nodes: flowNodes, edges: flowEdges };
}

export function GtmSalesMethodologyPage() {
  const data = useGtmData();
  const locale = useGtmLocale();
  const methodology = data.salesMethodology;

  const gaps = useMemo<GapItem[]>(() => {
    if (!methodology) return [];

    return data.icps.flatMap((icp) =>
      methodology.stages.flatMap((stage) =>
        stage.requiredAssets
          .filter((asset) => !hasRequiredAsset(icp, asset))
          .map((asset) => ({
            icp,
            stageId: stage.id,
            stageName: stage.name,
            missingAsset: asset,
            owner: stage.ownerRole.toUpperCase(),
            severity:
              asset === "sales-pitch" || asset === "proposal" || asset === "customer-story"
                ? "red"
                : "yellow",
            action: stage.nextAction,
          })),
      ),
    );
  }, [data.icps, methodology]);

  const salesFlow = useMemo(() => {
    if (!methodology) return { nodes: [], edges: [] };
    return buildSalesFlow(methodology.stages, data.pipeline, gaps);
  }, [data.pipeline, gaps, methodology]);

  const roleFlow = useMemo(() => {
    if (!methodology) return { nodes: [], edges: [] };
    return buildRoleFlow(methodology.roles, methodology.stages);
  }, [methodology]);

  if (!methodology) {
    return (
      <div className="p-6 max-w-4xl">
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            还没有配置销售方法论数据。
          </CardContent>
        </Card>
      </div>
    );
  }

  const criticalGaps = gaps.filter((gap) => gap.severity === "red").length;
  const activeDeals = data.pipeline.filter((deal) => deal.stage !== "closed-lost").length;

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GitBranch className="h-6 w-6 text-primary" />
            销售流程指南
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            方法论、Revenue Team 分工、当前 pipeline 和缺口清单放在同一张作战图里。
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <MetricPill label="方法论" value={methodology.methods.length.toString()} />
          <MetricPill label="活跃商机" value={activeDeals.toString()} />
          <MetricPill label="关键缺口" value={criticalGaps.toString()} tone="red" />
        </div>
      </div>

      <Tabs defaultValue="guide" className="space-y-5">
        <TabsList className="h-auto !inline-flex flex-wrap justify-start">
          <TabsTrigger value="guide">销售指南</TabsTrigger>
          <TabsTrigger value="flow">流程节点图</TabsTrigger>
          <TabsTrigger value="roles">角色协作图</TabsTrigger>
          <TabsTrigger value="gaps">缺口清单</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline 诊断</TabsTrigger>
          <TabsTrigger value="sop">阶段 SOP</TabsTrigger>
        </TabsList>

        <TabsContent value="guide" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                销售流程指南
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  这一页放在 References，专门沉淀 Buda 的销售方法论、流程图、角色协作图和 GTM
                  缺口诊断。它不是普通内容 Playbook，而是销售团队每天可以打开看的作战参考页。
                </p>
                <div className="grid gap-3">
                  {methodology.methods.map((method) => (
                    <div key={method.id} className="rounded-md border border-border p-3">
                      <div className="font-medium text-sm">{method.name}</div>
                      <p className="text-xs text-muted-foreground mt-1">{method.summary}</p>
                      <div className="mt-3 space-y-1">
                        {method.principles.map((principle) => (
                          <div key={principle} className="flex gap-2 text-xs text-muted-foreground">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary/70 shrink-0" />
                            <span>{principle}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-md border border-border bg-muted/30 p-4">
                <div className="text-sm font-medium">怎么用这一页</div>
                <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                  <div>1. 先看“流程节点图”：客户现在在哪个阶段，AI 和哪个角色接手。</div>
                  <div>
                    2. 看节点里的后台入口：Contacts、Outreach、Journeys、Spaces 等能直接实操。
                  </div>
                  <div>
                    3. 再看“缺口清单”：优先补红色缺口，例如销售 PPT、方案书、客户案例、ROI 模型。
                  </div>
                  <div>4. 再看“Pipeline 诊断”：针对当前商机，把下一步动作写进销售跟进。</div>
                  <div>5. 最后看“阶段 SOP”：沟通前确认目标、退出标准、关键问题和风险信号。</div>
                </div>
                <div className="mt-5 text-sm font-medium">当前优先级</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    "销售材料 PPT",
                    "客户案例",
                    "方案书模板",
                    "ROI 模型",
                    "Demo 脚本",
                    "客户启动材料",
                  ].map((item) => (
                    <Badge key={item} variant="outline" className="text-[10px]">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Network className="h-4 w-4 text-primary" />
                从线索到客户成功
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SalesReactFlow nodes={salesFlow.nodes} edges={salesFlow.edges} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Revenue Team 角色协作图
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RoleReactFlow nodes={roleFlow.nodes} edges={roleFlow.edges} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gaps" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                当前缺口清单
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="py-2 pr-3 font-medium">ICP</th>
                      <th className="py-2 pr-3 font-medium">阶段</th>
                      <th className="py-2 pr-3 font-medium">缺口</th>
                      <th className="py-2 pr-3 font-medium">Owner</th>
                      <th className="py-2 pr-3 font-medium">下一步</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gaps.slice(0, 40).map((gap) => (
                      <tr
                        key={`${gap.icp.id}-${gap.stageId}-${gap.missingAsset}`}
                        className="border-b border-border/50"
                      >
                        <td className="py-2 pr-3">
                          {gap.icp.emoji} {pickLocale(gap.icp.name, locale)}
                        </td>
                        <td className="py-2 pr-3">{gap.stageName}</td>
                        <td className="py-2 pr-3">
                          <Badge
                            className={`text-[10px] ${
                              gap.severity === "red"
                                ? "bg-red-500 text-white"
                                : "bg-yellow-500 text-white"
                            }`}
                          >
                            {assetLabel[gap.missingAsset]}
                          </Badge>
                        </td>
                        <td className="py-2 pr-3 text-xs font-semibold">{gap.owner}</td>
                        <td className="py-2 pr-3 text-xs text-muted-foreground">{gap.action}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {gaps.length > 40 && (
                <div className="text-xs text-muted-foreground mt-3">
                  还有 {gaps.length - 40} 个缺口未展示，建议优先补红色项。
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-2">
            {data.pipeline.map((deal) => {
              const stageId = dealStageMap[deal.stage];
              const stage = methodology.stages.find((item) => item.id === stageId);
              const icp = deal.icpId ? data.icps.find((item) => item.id === deal.icpId) : null;
              const sku = data.skus.find((item) => item.id === deal.skuId);
              return (
                <Card key={deal.name}>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold">{deal.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {stage?.name ?? deal.stage} · {sku?.emoji} {sku?.name}
                        </div>
                      </div>
                      {deal.value && (
                        <div className="font-mono text-sm text-green-600 dark:text-green-400">
                          {deal.value}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {icp && (
                        <Badge variant="outline" className="text-[10px]">
                          {icp.emoji} {pickLocale(icp.name, locale)}
                        </Badge>
                      )}
                      {stage && (
                        <Badge className={`text-[10px] border ${roleColor[stage.ownerRole]}`}>
                          {stage.ownerRole.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                    {deal.notes && <p className="text-xs text-muted-foreground">{deal.notes}</p>}
                    {stage && (
                      <div className="rounded-md bg-muted/40 p-3 text-xs">
                        <div className="font-medium mb-1">建议下一步</div>
                        <div className="text-muted-foreground">{stage.nextAction}</div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="sop" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {methodology.stages.map((stage) => (
              <Card key={stage.id}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between gap-2">
                    <span>{stage.name}</span>
                    <Badge className={`text-[10px] border ${roleColor[stage.ownerRole]}`}>
                      {stage.ownerRole.toUpperCase()}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <SopBlock
                    icon={<ShieldCheck className="h-4 w-4" />}
                    title="阶段目标"
                    items={[stage.goal]}
                  />
                  <SopBlock
                    icon={<ListChecks className="h-4 w-4" />}
                    title="退出标准"
                    items={stage.exitCriteria}
                  />
                  <SopBlock
                    icon={<HelpCircle className="h-4 w-4" />}
                    title="关键问题"
                    items={stage.keyQuestions}
                  />
                  {stage.aiTasks && stage.aiTasks.length > 0 && (
                    <SopBlock
                      icon={<Network className="h-4 w-4" />}
                      title={stage.aiOperator ? `${stage.aiOperator} 做什么` : "AI 做什么"}
                      items={stage.aiTasks}
                    />
                  )}
                  {stage.systemAdmin && stage.systemAdmin.length > 0 && (
                    <SystemAdminOpsBlock items={stage.systemAdmin} />
                  )}
                  <SopBlock
                    icon={<AlertTriangle className="h-4 w-4" />}
                    title="风险信号"
                    items={stage.riskSignals}
                  />
                  {stage.gaps && stage.gaps.length > 0 && (
                    <SopBlock
                      icon={<AlertTriangle className="h-4 w-4" />}
                      title="待补能力"
                      items={stage.gaps}
                    />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MetricPill({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "red";
}) {
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 min-w-20">
      <div className={`text-lg font-bold ${tone === "red" ? "text-red-500" : ""}`}>{value}</div>
      <div className="text-[10px] text-muted-foreground whitespace-nowrap">{label}</div>
    </div>
  );
}

function SalesReactFlow({
  nodes,
  edges,
}: {
  nodes: Node<SalesFlowNodeData>[];
  edges: Array<{ id: string; source: string; target: string; type: string; animated: boolean }>;
}) {
  return (
    <div className="h-[560px] overflow-hidden rounded-md border border-border bg-background">
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={{ salesStage: SalesStageNode }}
          fitView
          fitViewOptions={{ padding: 0.16 }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={18} size={1} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}

function RoleReactFlow({
  nodes,
  edges,
}: {
  nodes: Node<RevenueRoleNodeData>[];
  edges: Array<{ id: string; source: string; target: string; type: string; animated: boolean }>;
}) {
  return (
    <div className="h-[500px] overflow-hidden rounded-md border border-border bg-background">
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={{ revenueRole: RevenueRoleNode }}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={18} size={1} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}

function SalesStageNode({ data }: NodeProps<Node<SalesFlowNodeData>>) {
  return (
    <div className="w-64 rounded-md border border-border bg-card p-4 shadow-sm">
      <Handle type="target" position={Position.Left} className="h-2 w-2" />
      <div className="flex items-start justify-between gap-2">
        <div>
          <Badge variant="outline" className="text-[10px]">
            {data.shortName}
          </Badge>
          <div className="mt-2 text-sm font-semibold">{data.title}</div>
        </div>
        <Badge className={`text-[10px] border ${roleColor[data.ownerRole]}`}>
          {data.ownerRole.toUpperCase()}
        </Badge>
      </div>
      <p className="mt-3 line-clamp-3 text-xs text-muted-foreground">{data.goal}</p>
      {data.aiOperator && (
        <div className="mt-3 rounded bg-primary/10 px-2 py-1 text-[10px] text-primary">
          AI: {data.aiOperator}
        </div>
      )}
      <div className="mt-4 grid grid-cols-2 gap-2 text-[10px]">
        <div className="rounded bg-muted px-2 py-1">deals {data.dealCount}</div>
        <div
          className={`rounded px-2 py-1 ${
            data.gapCount > 0 ? "bg-yellow-500 text-white" : "bg-green-500 text-white"
          }`}
        >
          gaps {data.gapCount}
        </div>
        <div className="rounded bg-muted px-2 py-1">ops {data.adminCount}</div>
        <div
          className={`rounded px-2 py-1 ${
            data.missingOpsCount > 0 ? "bg-zinc-500 text-white" : "bg-green-500 text-white"
          }`}
        >
          todo {data.missingOpsCount}
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="h-2 w-2" />
    </div>
  );
}

function RevenueRoleNode({ data }: NodeProps<Node<RevenueRoleNodeData>>) {
  return (
    <div className="w-60 rounded-md border border-border bg-card p-4 shadow-sm">
      <Handle type="target" position={Position.Left} className="h-2 w-2" />
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-base font-bold">{data.name}</div>
          <div className="text-[10px] text-muted-foreground">{data.title}</div>
        </div>
        <Badge variant="outline" className="text-[10px]">
          {data.stageLabels.join(" / ")}
        </Badge>
      </div>
      <p className="mt-3 line-clamp-3 text-xs text-muted-foreground">{data.mission}</p>
      <div className="mt-3 flex flex-wrap gap-1">
        {data.metrics.slice(0, 2).map((metric) => (
          <Badge key={metric} variant="outline" className="text-[9px]">
            {metric}
          </Badge>
        ))}
      </div>
      <Handle type="source" position={Position.Right} className="h-2 w-2" />
    </div>
  );
}

function SopBlock({ icon, title, items }: { icon: ReactNode; title: string; items: string[] }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-sm font-medium">
        <span className="text-primary">{icon}</span>
        {title}
      </div>
      <div className="mt-2 space-y-1">
        {items.map((item) => (
          <div key={item} className="text-xs text-muted-foreground flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-muted-foreground/50 shrink-0" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SystemAdminOpsBlock({ items }: { items: NonNullable<SalesStagePlaybook["systemAdmin"]> }) {
  const statusLabel = {
    available: "已有",
    partial: "部分",
    missing: "待补",
  } as const;
  const statusClass = {
    available: "bg-green-500 text-white",
    partial: "bg-yellow-500 text-white",
    missing: "bg-zinc-500 text-white",
  } as const;

  return (
    <div>
      <div className="flex items-center gap-2 text-sm font-medium">
        <span className="text-primary">
          <ListChecks className="h-4 w-4" />
        </span>
        SystemAdmin 实操
      </div>
      <div className="mt-2 space-y-2">
        {items.map((item) => (
          <div key={`${item.label}-${item.path ?? item.status}`} className="rounded-md border p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-medium">
                {item.path ? (
                  <a href={item.path} className="text-primary hover:underline">
                    {item.label}
                  </a>
                ) : (
                  item.label
                )}
              </div>
              <Badge className={`text-[9px] ${statusClass[item.status]}`}>
                {statusLabel[item.status]}
              </Badge>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{item.action}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
