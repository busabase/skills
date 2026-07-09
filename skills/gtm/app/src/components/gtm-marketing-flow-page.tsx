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
import { GitBranch, ListChecks, Megaphone, Network, Radio, Sparkles } from "lucide-react";
import { useMemo } from "react";
import type {
  MarketingFlowMethod,
  MarketingFlowMethodId,
  MarketingFlowStage,
  MarketingFlowStageId,
} from "../data";
import { useGtmData } from "../data";

const methodColor: Record<MarketingFlowMethodId, string> = {
  inbound: "bg-emerald-100 text-emerald-700 border-emerald-200",
  outbound: "bg-sky-100 text-sky-700 border-sky-200",
  paid: "bg-violet-100 text-violet-700 border-violet-200",
  community: "bg-amber-100 text-amber-700 border-amber-200",
  partner: "bg-cyan-100 text-cyan-700 border-cyan-200",
  "product-led": "bg-rose-100 text-rose-700 border-rose-200",
};

const stageColor: Record<MarketingFlowStageId, string> = {
  audience: "bg-zinc-100 text-zinc-700 border-zinc-200",
  touchpoint: "bg-blue-100 text-blue-700 border-blue-200",
  intent: "bg-purple-100 text-purple-700 border-purple-200",
  capture: "bg-orange-100 text-orange-700 border-orange-200",
  lead: "bg-green-100 text-green-700 border-green-200",
  nurture: "bg-yellow-100 text-yellow-700 border-yellow-200",
  conversion: "bg-red-100 text-red-700 border-red-200",
  "customer-success": "bg-lime-100 text-lime-700 border-lime-200",
};

interface MethodNodeData extends Record<string, unknown> {
  method: MarketingFlowMethod;
}

interface StageNodeData extends Record<string, unknown> {
  stage: MarketingFlowStage;
}

function buildMarketingFlow(methods: MarketingFlowMethod[], stages: MarketingFlowStage[]) {
  const methodNodes: Node<MethodNodeData>[] = methods.map((method, index) => ({
    id: `method-${method.id}`,
    type: "method",
    position: { x: 0, y: index * 155 },
    sourcePosition: Position.Right,
    data: { method },
  }));

  const stageNodes: Node<StageNodeData>[] = stages.map((stage, index) => ({
    id: `stage-${stage.id}`,
    type: "stage",
    position: { x: 390 + index * 265, y: index % 2 === 0 ? 110 : 330 },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    data: { stage },
  }));

  const firstStage = stages[0];
  const methodEdges = firstStage
    ? methods.map((method) => ({
        id: `method-${method.id}-${firstStage.id}`,
        source: `method-${method.id}`,
        target: `stage-${firstStage.id}`,
        type: "smoothstep",
        animated: true,
      }))
    : [];

  const stageEdges = stages.slice(0, -1).map((stage, index) => ({
    id: `${stage.id}-${stages[index + 1].id}`,
    source: `stage-${stage.id}`,
    target: `stage-${stages[index + 1].id}`,
    type: "smoothstep",
    animated: true,
  }));

  return { nodes: [...methodNodes, ...stageNodes], edges: [...methodEdges, ...stageEdges] };
}

export function GtmMarketingFlowPage() {
  const data = useGtmData();
  const marketingFlow = data.marketingFlow;

  const flow = useMemo(() => {
    if (!marketingFlow) return { nodes: [], edges: [] };
    return buildMarketingFlow(marketingFlow.methods, marketingFlow.stages);
  }, [marketingFlow]);

  if (!marketingFlow) {
    return (
      <div className="p-6 max-w-4xl">
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            还没有配置 Marketing Flow 数据。
          </CardContent>
        </Card>
      </div>
    );
  }

  const availableOps = marketingFlow.methods.reduce(
    (sum, method) => sum + method.systemAdmin.filter((item) => item.status !== "missing").length,
    0,
  );
  const missingOps = marketingFlow.methods.reduce(
    (sum, method) =>
      sum +
      method.systemAdmin.filter((item) => item.status === "missing").length +
      (method.gaps?.length ?? 0),
    0,
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-primary" />
            Marketing 流程图
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Inbound、Outbound、Paid、Community、Partner、Product-led 如何变成 Contacts /
            Leads，并分流到销售成交、自助成交或客户成功。
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <MetricPill label="获客方法" value={marketingFlow.methods.length.toString()} />
          <MetricPill label="后台入口" value={availableOps.toString()} />
          <MetricPill label="待补能力" value={missingOps.toString()} tone="red" />
        </div>
      </div>

      <Tabs defaultValue="flow" className="space-y-5">
        <TabsList className="h-auto !inline-flex flex-wrap justify-start">
          <TabsTrigger value="flow">流程图</TabsTrigger>
          <TabsTrigger value="methods">获客方法</TabsTrigger>
          <TabsTrigger value="stages">转化阶段</TabsTrigger>
          <TabsTrigger value="ops">后台实操</TabsTrigger>
        </TabsList>

        <TabsContent value="flow">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-primary" />从 Marketing 动作到转化分流
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MarketingReactFlow nodes={flow.nodes} edges={flow.edges} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="methods" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {marketingFlow.methods.map((method) => (
              <Card key={method.id}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between gap-2">
                    <span>{method.name}</span>
                    <Badge className={`text-[10px] border ${methodColor[method.id]}`}>
                      {method.aiOperator}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{method.summary}</p>
                  <ChipGroup title="来源例子" items={method.sourceExamples} />
                  <ChipGroup title="Lead Signal" items={[method.leadSignal]} />
                  {method.gaps && method.gaps.length > 0 && (
                    <ChipGroup title="待补" items={method.gaps} tone="muted" />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="stages" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {marketingFlow.stages.map((stage) => (
              <Card key={stage.id}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Network className="h-4 w-4 text-primary" />
                    {stage.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{stage.goal}</p>
                  <ChipGroup title="AI 做什么" items={stage.aiTasks} />
                  <OpsList items={stage.systemAdmin} />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="ops">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-primary" />
                SystemAdmin 实操入口
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-2">
              {marketingFlow.methods.map((method) => (
                <div key={method.id} className="rounded-md border p-4">
                  <div className="font-medium text-sm">{method.name}</div>
                  <OpsList items={method.systemAdmin} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MarketingReactFlow({
  nodes,
  edges,
}: {
  nodes: Array<Node<MethodNodeData> | Node<StageNodeData>>;
  edges: Array<{ id: string; source: string; target: string; type: string; animated: boolean }>;
}) {
  return (
    <div className="h-[680px] overflow-hidden rounded-md border border-border bg-background">
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={{ method: MethodNode, stage: StageNode }}
          fitView
          fitViewOptions={{ padding: 0.14 }}
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

function MethodNode({ data }: NodeProps<Node<MethodNodeData>>) {
  const method = data.method;
  return (
    <div className="w-72 rounded-md border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <Badge className={`text-[10px] border ${methodColor[method.id]}`}>{method.id}</Badge>
          <div className="mt-2 text-sm font-semibold">{method.name}</div>
        </div>
        <Radio className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="mt-3 line-clamp-3 text-xs text-muted-foreground">{method.summary}</p>
      <div className="mt-3 rounded bg-primary/10 px-2 py-1 text-[10px] text-primary">
        AI: {method.aiOperator}
      </div>
      <div className="mt-3 text-[10px] text-muted-foreground">{method.leadSignal}</div>
      <Handle type="source" position={Position.Right} className="h-2 w-2" />
    </div>
  );
}

function StageNode({ data }: NodeProps<Node<StageNodeData>>) {
  const stage = data.stage;
  const missing = stage.systemAdmin.filter((item) => item.status === "missing").length;
  return (
    <div className="w-60 rounded-md border border-border bg-card p-4 shadow-sm">
      <Handle type="target" position={Position.Left} className="h-2 w-2" />
      <div className="flex items-start justify-between gap-2">
        <div>
          <Badge className={`text-[10px] border ${stageColor[stage.id]}`}>{stage.id}</Badge>
          <div className="mt-2 text-sm font-semibold">{stage.name}</div>
        </div>
        <Sparkles className="h-4 w-4 text-primary" />
      </div>
      <p className="mt-3 line-clamp-3 text-xs text-muted-foreground">{stage.goal}</p>
      <div className="mt-4 grid grid-cols-2 gap-2 text-[10px]">
        <div className="rounded bg-muted px-2 py-1">ops {stage.systemAdmin.length}</div>
        <div
          className={`rounded px-2 py-1 ${
            missing > 0 ? "bg-zinc-500 text-white" : "bg-green-500 text-white"
          }`}
        >
          todo {missing}
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="h-2 w-2" />
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

function ChipGroup({
  title,
  items,
  tone = "default",
}: {
  title: string;
  items: string[];
  tone?: "default" | "muted";
}) {
  return (
    <div>
      <div className="text-xs font-medium mb-2">{title}</div>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Badge
            key={item}
            variant="outline"
            className={`text-[10px] ${tone === "muted" ? "text-muted-foreground" : ""}`}
          >
            {item}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function OpsList({
  items,
}: {
  items: Array<{
    label: string;
    path?: string;
    status: "available" | "partial" | "missing";
    action: string;
  }>;
}) {
  const statusLabel = { available: "已有", partial: "部分", missing: "待补" } as const;
  const statusClass = {
    available: "bg-green-500 text-white",
    partial: "bg-yellow-500 text-white",
    missing: "bg-zinc-500 text-white",
  } as const;

  return (
    <div className="mt-3 space-y-2">
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
  );
}
