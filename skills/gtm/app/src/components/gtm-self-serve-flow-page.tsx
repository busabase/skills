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
import { CreditCard, GitBranch, ListChecks, Route, Sparkles, UserCheck } from "lucide-react";
import { useMemo } from "react";
import type { SelfServeFlowStage, SelfServeFlowStageId, SelfServeHandoffRule } from "../data";
import { useGtmData } from "../data";

const stageColor: Record<SelfServeFlowStageId, string> = {
  contact: "bg-emerald-100 text-emerald-700 border-emerald-200",
  signup: "bg-sky-100 text-sky-700 border-sky-200",
  workspace: "bg-blue-100 text-blue-700 border-blue-200",
  activation: "bg-purple-100 text-purple-700 border-purple-200",
  offer: "bg-amber-100 text-amber-700 border-amber-200",
  checkout: "bg-rose-100 text-rose-700 border-rose-200",
  fulfillment: "bg-cyan-100 text-cyan-700 border-cyan-200",
  expand: "bg-lime-100 text-lime-700 border-lime-200",
};

const routeColor: Record<SelfServeHandoffRule["route"], string> = {
  "self-serve": "bg-green-500 text-white",
  "sales-assisted": "bg-blue-500 text-white",
  "customer-success": "bg-violet-500 text-white",
};

interface StageNodeData extends Record<string, unknown> {
  stage: SelfServeFlowStage;
}

interface RouteNodeData extends Record<string, unknown> {
  rule: SelfServeHandoffRule;
}

function buildSelfServeFlow(stages: SelfServeFlowStage[], handoffRules: SelfServeHandoffRule[]) {
  const stageNodes: Node<StageNodeData>[] = stages.map((stage, index) => ({
    id: `stage-${stage.id}`,
    type: "stage",
    position: { x: index * 285, y: index % 2 === 0 ? 70 : 275 },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    data: { stage },
  }));

  const routeNodes: Node<RouteNodeData>[] = handoffRules.map((rule, index) => ({
    id: `route-${rule.route}`,
    type: "route",
    position: { x: 640 + index * 315, y: 520 },
    sourcePosition: Position.Right,
    targetPosition: Position.Top,
    data: { rule },
  }));

  const stageEdges = stages.slice(0, -1).map((stage, index) => ({
    id: `${stage.id}-${stages[index + 1].id}`,
    source: `stage-${stage.id}`,
    target: `stage-${stages[index + 1].id}`,
    type: "smoothstep",
    animated: true,
  }));

  const activationStage = stages.find((stage) => stage.id === "activation");
  const routeEdges = activationStage
    ? handoffRules.map((rule) => ({
        id: `${activationStage.id}-${rule.route}`,
        source: `stage-${activationStage.id}`,
        target: `route-${rule.route}`,
        type: "smoothstep",
        animated: rule.route !== "self-serve",
      }))
    : [];

  const salesRoute = handoffRules.find((rule) => rule.route === "sales-assisted");
  const expandStage = stages.find((stage) => stage.id === "expand");
  const salesEdge =
    salesRoute && expandStage
      ? [
          {
            id: "sales-assisted-expand",
            source: `route-${salesRoute.route}`,
            target: `stage-${expandStage.id}`,
            type: "smoothstep",
            animated: true,
          },
        ]
      : [];

  return {
    nodes: [...stageNodes, ...routeNodes],
    edges: [...stageEdges, ...routeEdges, ...salesEdge],
  };
}

export function GtmSelfServeFlowPage() {
  const data = useGtmData();
  const selfServeFlow = data.selfServeFlow;

  const flow = useMemo(() => {
    if (!selfServeFlow) return { nodes: [], edges: [] };
    return buildSelfServeFlow(selfServeFlow.stages, selfServeFlow.handoffRules);
  }, [selfServeFlow]);

  if (!selfServeFlow) {
    return (
      <div className="p-6 max-w-4xl">
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            还没有配置 Self-Serve Flow 数据。
          </CardContent>
        </Card>
      </div>
    );
  }

  const availableOps = selfServeFlow.stages.reduce(
    (sum, stage) => sum + stage.systemAdmin.filter((item) => item.status !== "missing").length,
    0,
  );
  const missingOps = selfServeFlow.stages.reduce(
    (sum, stage) =>
      sum +
      stage.systemAdmin.filter((item) => item.status === "missing").length +
      (stage.gaps?.length ?? 0),
    0,
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-primary" />
            自助成交流程图
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Leads / Contacts 进入后，如何注册、激活、付款、自动履约，并在必要时交给销售或 CSM。
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <MetricPill label="自助阶段" value={selfServeFlow.stages.length.toString()} />
          <MetricPill label="后台入口" value={availableOps.toString()} />
          <MetricPill label="待补能力" value={missingOps.toString()} tone="red" />
        </div>
      </div>

      <Tabs defaultValue="flow" className="space-y-5">
        <TabsList className="h-auto !inline-flex flex-wrap justify-start">
          <TabsTrigger value="flow">流程图</TabsTrigger>
          <TabsTrigger value="practices">最佳实践</TabsTrigger>
          <TabsTrigger value="stages">阶段 SOP</TabsTrigger>
          <TabsTrigger value="handoff">分流规则</TabsTrigger>
          <TabsTrigger value="ops">后台实操</TabsTrigger>
        </TabsList>

        <TabsContent value="flow">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-primary" />从 Lead / Contact 到自助成交
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SelfServeReactFlow nodes={flow.nodes} edges={flow.edges} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="practices" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            {selfServeFlow.bestPractices.map((practice) => (
              <Card key={practice.title}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    {practice.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{practice.summary}</p>
                  {practice.sourceLabel && (
                    <Badge variant="outline" className="text-[10px]">
                      {practice.sourceLabel}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="stages" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {selfServeFlow.stages.map((stage) => (
              <Card key={stage.id}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between gap-2">
                    <span>{stage.name}</span>
                    <Badge className={`text-[10px] border ${stageColor[stage.id]}`}>
                      {stage.id}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{stage.goal}</p>
                  <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
                    {stage.bestPractice}
                  </div>
                  <ChipGroup title="AI 做什么" items={stage.aiTasks} />
                  <ChipGroup title="指标" items={stage.metrics} tone="muted" />
                  {stage.gaps && stage.gaps.length > 0 && (
                    <ChipGroup title="待补" items={stage.gaps} tone="muted" />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="handoff" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            {selfServeFlow.handoffRules.map((rule) => (
              <Card key={rule.route}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between gap-2">
                    <span>{rule.route}</span>
                    <Badge className={`text-[10px] ${routeColor[rule.route]}`}>route</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{rule.condition}</p>
                  <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
                    {rule.nextStep}
                  </div>
                  <OpsList items={rule.systemAdmin} />
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
              {selfServeFlow.stages.map((stage) => (
                <div key={stage.id} className="rounded-md border p-4">
                  <div className="font-medium text-sm">{stage.name}</div>
                  <OpsList items={stage.systemAdmin} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SelfServeReactFlow({
  nodes,
  edges,
}: {
  nodes: Array<Node<StageNodeData> | Node<RouteNodeData>>;
  edges: Array<{ id: string; source: string; target: string; type: string; animated: boolean }>;
}) {
  return (
    <div className="h-[720px] overflow-hidden rounded-md border border-border bg-background">
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={{ stage: StageNode, route: RouteNode }}
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

function StageNode({ data }: NodeProps<Node<StageNodeData>>) {
  const stage = data.stage;
  const missing =
    stage.systemAdmin.filter((item) => item.status === "missing").length +
    (stage.gaps?.length ?? 0);
  return (
    <div className="w-64 rounded-md border border-border bg-card p-4 shadow-sm">
      <Handle type="target" position={Position.Left} className="h-2 w-2" />
      <div className="flex items-start justify-between gap-2">
        <div>
          <Badge className={`text-[10px] border ${stageColor[stage.id]}`}>{stage.id}</Badge>
          <div className="mt-2 text-sm font-semibold">{stage.name}</div>
        </div>
        <CreditCard className="h-4 w-4 text-primary" />
      </div>
      <p className="mt-3 line-clamp-3 text-xs text-muted-foreground">{stage.goal}</p>
      <div className="mt-4 grid grid-cols-2 gap-2 text-[10px]">
        <div className="rounded bg-muted px-2 py-1">metrics {stage.metrics.length}</div>
        <div
          className={`rounded px-2 py-1 ${missing > 0 ? "bg-zinc-500 text-white" : "bg-green-500 text-white"}`}
        >
          todo {missing}
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="h-2 w-2" />
    </div>
  );
}

function RouteNode({ data }: NodeProps<Node<RouteNodeData>>) {
  const rule = data.rule;
  return (
    <div className="w-72 rounded-md border border-border bg-card p-4 shadow-sm">
      <Handle type="target" position={Position.Top} className="h-2 w-2" />
      <div className="flex items-start justify-between gap-2">
        <div>
          <Badge className={`text-[10px] ${routeColor[rule.route]}`}>{rule.route}</Badge>
          <div className="mt-2 text-sm font-semibold">分流规则</div>
        </div>
        <Route className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="mt-3 line-clamp-3 text-xs text-muted-foreground">{rule.condition}</p>
      <div className="mt-3 rounded bg-primary/10 px-2 py-1 text-[10px] text-primary">
        {rule.nextStep}
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
