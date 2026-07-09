"use client";

import { Badge } from "kui/badge";
import { Button } from "kui/button";
import { Card, CardContent } from "kui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "kui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "kui/tabs";
import { Eye } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { EmailSequenceCard } from "share-domains/crm/components";
import {
  type EmailTemplateId,
  type EmailTemplateMeta,
  type GtmTriggeredEmail,
  pickLocale,
  tGtm,
  useGtmData,
  useGtmDataContext,
  useGtmLocale,
} from "../data";

// ─── Preview modal ──────────────────────────────────────────────────────

function PreviewDialog({
  templateId,
  onClose,
}: {
  templateId: EmailTemplateId | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={templateId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl h-[80vh] p-0 flex flex-col">
        <DialogHeader className="p-4 border-b border-border shrink-0">
          <DialogTitle className="text-sm font-mono">{templateId}</DialogTitle>
        </DialogHeader>
        {templateId && (
          <iframe
            src={templateId}
            title={`Preview: ${templateId}`}
            className="flex-1 w-full bg-white"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Triggered Emails tab ───────────────────────────────────────────────

const eventGroups: Array<{ label: string; emoji: string; prefix: string }> = [
  { label: "User Lifecycle", emoji: "👤", prefix: "user." },
  { label: "Billing", emoji: "💰", prefix: "billing." },
  { label: "Waitlist", emoji: "⏳", prefix: "waitlist." },
];

const emailsText = {
  preview: { en: "Preview", "zh-CN": "预览", "zh-TW": "預覽", ja: "プレビュー", pt: "Prévia" },
  triggeredIntro: {
    en: "Event-driven emails — sent automatically when a system event occurs (different from time-driven Sequences)",
    "zh-CN": "事件驱动邮件 — 当系统发生某个事件时自动发送（不同于时间驱动的 Sequences）",
    "zh-TW": "事件驅動郵件 — 當系統發生某個事件時自動發送（不同於時間驅動的 Sequences）",
    ja: "イベント駆動メール — システムイベント発生時に自動送信（時間駆動の Sequences とは別）",
    pt: "Emails por evento — enviados automaticamente quando um evento do sistema ocorre (diferente de Sequences por tempo)",
  },
  notificationHint: {
    en: "Label means this email also creates an in-app notification record via {path}.",
    "zh-CN": "标签表示该邮件同时会在应用内创建通知记录（via {path}）。",
    "zh-TW": "標籤表示該郵件同時會在應用內建立通知記錄（via {path}）。",
    ja: "このラベルは、このメールがアプリ内通知も作成することを示します via {path}.",
    pt: "O rótulo indica que este email também cria uma notificação in-app via {path}.",
  },
  user: { en: "User", "zh-CN": "用户", "zh-TW": "使用者", ja: "ユーザー", pt: "Usuário" },
  admin: { en: "Admin", "zh-CN": "管理员", "zh-TW": "管理員", ja: "管理者", pt: "Admin" },
  inviter: { en: "Inviter", "zh-CN": "邀请人", "zh-TW": "邀請人", ja: "招待者", pt: "Convidador" },
  invitee: {
    en: "Invitee",
    "zh-CN": "被邀请人",
    "zh-TW": "被邀請人",
    ja: "招待された人",
    pt: "Convidado",
  },
  subject: { en: "Subject", "zh-CN": "Subject", "zh-TW": "Subject", ja: "件名", pt: "Assunto" },
  templateIntro: {
    en: "React Email template library · Config:",
    "zh-CN": "React Email 模板库 · 配置:",
    "zh-TW": "React Email 模板庫 · 配置:",
    ja: "React Email テンプレートライブラリ · 設定:",
    pt: "Biblioteca React Email · Config:",
  },
  clickPreview: {
    en: "Click Preview to see the rendered email",
    "zh-CN": "点击「预览」查看渲染后的邮件",
    "zh-TW": "點擊「預覽」查看渲染後的郵件",
    ja: "「プレビュー」でレンダリング済みメールを確認",
    pt: "Clique em Prévia para ver o email renderizado",
  },
  transactional: {
    en: "Transactional",
    "zh-CN": "交易型",
    "zh-TW": "交易型",
    ja: "トランザクション",
    pt: "Transacional",
  },
  marketing: {
    en: "Marketing",
    "zh-CN": "营销",
    "zh-TW": "行銷",
    ja: "マーケティング",
    pt: "Marketing",
  },
  notification: {
    en: "Notification",
    "zh-CN": "通知",
    "zh-TW": "通知",
    ja: "通知",
    pt: "Notificação",
  },
  invoice: { en: "Invoice", "zh-CN": "账单", "zh-TW": "帳單", ja: "請求書", pt: "Fatura" },
  waitlist: {
    en: "Waitlist",
    "zh-CN": "等待列表",
    "zh-TW": "等待列表",
    ja: "ウェイトリスト",
    pt: "Lista de espera",
  },
  usedIn: {
    en: "Used in {count} places",
    "zh-CN": "使用 {count} 处",
    "zh-TW": "使用 {count} 處",
    ja: "{count} 箇所で使用",
    pt: "Usado em {count} lugares",
  },
  sequence: {
    en: "Sequence",
    "zh-CN": "Sequence",
    "zh-TW": "Sequence",
    ja: "Sequence",
    pt: "Sequence",
  },
  triggered: {
    en: "Triggered",
    "zh-CN": "Triggered",
    "zh-TW": "Triggered",
    ja: "Triggered",
    pt: "Triggered",
  },
  title: {
    en: "📧 Emails",
    "zh-CN": "📧 邮件",
    "zh-TW": "📧 郵件",
    ja: "📧 メール",
    pt: "📧 Emails",
  },
  summary: {
    en: "Overview of every email in the system — {sequences} sequences ({steps} steps) · {triggered} triggered · {templates} templates",
    "zh-CN":
      "系统里所有邮件的总览 — {sequences} sequences ({steps} steps) · {triggered} triggered · {templates} templates",
    "zh-TW":
      "系統裡所有郵件的總覽 — {sequences} sequences ({steps} steps) · {triggered} triggered · {templates} templates",
    ja: "システム内の全メール概要 — {sequences} sequences ({steps} steps) · {triggered} triggered · {templates} templates",
    pt: "Visão de todos os emails do sistema — {sequences} sequences ({steps} steps) · {triggered} triggered · {templates} templates",
  },
  sequenceIntro: {
    en: "Time-driven automation sequences — Config:",
    "zh-CN": "时间驱动的自动化序列 — 配置:",
    "zh-TW": "時間驅動的自動化序列 — 配置:",
    ja: "時間駆動の自動化シーケンス — 設定:",
    pt: "Sequências automatizadas por tempo — Config:",
  },
  noInApp: {
    en: "Sequence emails do not create in-app notifications",
    "zh-CN": "Sequence 邮件不创建 in-app notification",
    "zh-TW": "Sequence 郵件不建立 in-app notification",
    ja: "Sequence メールはアプリ内通知を作成しません",
    pt: "Emails de Sequence não criam notificações in-app",
  },
  global: {
    en: "🌐 Global",
    "zh-CN": "🌐 全局",
    "zh-TW": "🌐 全域",
    ja: "🌐 グローバル",
    pt: "🌐 Global",
  },
};

const statusColor = {
  active: "bg-green-500",
  draft: "bg-yellow-500",
  disabled: "bg-zinc-400",
};

function TriggeredEmailsTab({
  onPreview,
  triggeredEmails,
}: {
  onPreview: (id: EmailTemplateId) => void;
  triggeredEmails: readonly GtmTriggeredEmail[];
}) {
  const locale = useGtmLocale();
  const [notificationHintBefore, notificationHintAfter = ""] = tGtm(
    emailsText.notificationHint,
    locale,
  ).split("{path}");
  const recipientLabel: Record<GtmTriggeredEmail["recipient"], string> = {
    user: tGtm(emailsText.user, locale),
    admin: tGtm(emailsText.admin, locale),
    inviter: tGtm(emailsText.inviter, locale),
    invitee: tGtm(emailsText.invitee, locale),
  };
  return (
    <div className="space-y-6">
      <div className="text-xs text-muted-foreground space-y-1">
        <div>{tGtm(emailsText.triggeredIntro, locale)}</div>
        <div>
          <Badge variant="outline" className="text-[9px] border-purple-500/40 text-purple-500 mr-1">
            📬 + in-app
          </Badge>
          {notificationHintBefore}
          <code className="bg-muted px-1 rounded mx-1">domains/notifications</code>
          {notificationHintAfter}
        </div>
      </div>
      {eventGroups.map((group) => {
        const emails = triggeredEmails.filter((e) => e.event.startsWith(group.prefix));
        if (emails.length === 0) return null;
        return (
          <div key={group.prefix}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">{group.emoji}</span>
              <span className="font-bold text-sm">{group.label}</span>
              <span className="text-xs text-muted-foreground">({emails.length})</span>
            </div>
            <div className="space-y-2">
              {emails.map((e) => (
                <Card key={e.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${statusColor[e.status]}`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{e.name}</span>
                          <Badge variant="outline" className="text-[9px] font-mono">
                            {e.event}
                          </Badge>
                          <Badge variant="secondary" className="text-[9px]">
                            → {recipientLabel[e.recipient]}
                          </Badge>
                          {e.createsNotification && (
                            <Badge
                              variant="outline"
                              className="text-[9px] border-purple-500/40 text-purple-500"
                              title={`Also creates in-app notification via ${e.createsNotification}`}
                            >
                              📬 + in-app
                            </Badge>
                          )}
                          {e.templateId && (
                            <>
                              <Link
                                href={`#template-${e.templateId}`}
                                className="text-[10px] text-primary font-mono hover:underline ml-auto"
                              >
                                {e.templateId}
                              </Link>
                              <button
                                type="button"
                                onClick={() => e.templateId && onPreview(e.templateId)}
                                className="text-[10px] text-primary hover:underline flex items-center gap-1"
                              >
                                <Eye className="w-3 h-3" /> {tGtm(emailsText.preview, locale)}
                              </button>
                            </>
                          )}
                          {!e.templateId && (
                            <span className="text-[10px] text-muted-foreground ml-auto italic">
                              plain text
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">{e.description}</div>
                        <div className="text-xs mt-2 space-y-0.5">
                          <div>
                            <span className="text-muted-foreground">
                              {tGtm(emailsText.subject, locale)}:{" "}
                            </span>
                            <span className="font-medium">{e.subject}</span>
                          </div>
                          {e.previewText && (
                            <div className="text-muted-foreground italic">{e.previewText}</div>
                          )}
                          {e.implementedIn && (
                            <div className="text-[10px] text-muted-foreground font-mono">
                              📍 {e.implementedIn}
                            </div>
                          )}
                          {e.notes && (
                            <div className="text-[10px] text-yellow-600 dark:text-yellow-400 mt-1">
                              ⚠ {e.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Templates tab ───────────────────────────────────────────────────────

function TemplatesTab({ onPreview }: { onPreview: (id: EmailTemplateId) => void }) {
  const locale = useGtmLocale();
  const { emails } = useGtmDataContext();
  if (!emails) return null;
  const categoryLabel = {
    transactional: tGtm(emailsText.transactional, locale),
    marketing: tGtm(emailsText.marketing, locale),
    notification: tGtm(emailsText.notification, locale),
    invoice: tGtm(emailsText.invoice, locale),
    waitlist: tGtm(emailsText.waitlist, locale),
  };
  const byCategory = emails.templates.reduce<Record<string, EmailTemplateMeta[]>>((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category]?.push(t);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="text-xs text-muted-foreground">
        {tGtm(emailsText.templateIntro, locale)}{" "}
        <code className="bg-muted px-1 rounded">packages/transactional/emails/</code>
        {" · "}
        {tGtm(emailsText.clickPreview, locale)}
      </div>

      {Object.entries(byCategory).map(([cat, tpls]) => (
        <div key={cat}>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
            {categoryLabel[cat as keyof typeof categoryLabel] ?? cat} ({tpls.length})
          </div>
          <div className="space-y-2">
            {tpls.map((t) => {
              const users = emails.getUsersOfTemplate(
                t.id,
                emails.sequences,
                emails.triggeredEmails,
              );
              const usageCount = users.sequences.length + users.triggered.length;
              return (
                <Card key={t.id} id={`template-${t.id}`} className="scroll-mt-4">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{t.name}</span>
                          <code className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                            {t.id}
                          </code>
                          <Badge variant="outline" className="text-[9px]">
                            {tGtm(emailsText.usedIn, locale).replace(
                              "{count}",
                              usageCount.toString(),
                            )}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">{t.description}</div>
                        {t.requiredProps && t.requiredProps.length > 0 && (
                          <div className="text-[10px] text-muted-foreground mt-1.5 font-mono">
                            props:{" "}
                            {t.requiredProps.map((p) => (
                              <span key={p} className="inline-block bg-muted px-1 rounded mr-1">
                                {p}
                              </span>
                            ))}
                          </div>
                        )}
                        {usageCount > 0 && (
                          <div className="text-[10px] mt-2 space-y-0.5">
                            {users.sequences.map((u) => (
                              <div
                                key={u.stepId}
                                className="flex items-center gap-1 text-muted-foreground"
                              >
                                <span>🔄</span>
                                <span>{tGtm(emailsText.sequence, locale)}:</span>
                                <span className="font-mono">{u.seqName}</span>
                              </div>
                            ))}
                            {users.triggered.map((u) => (
                              <div
                                key={u.triggeredId}
                                className="flex items-center gap-1 text-muted-foreground"
                              >
                                <span>⚡</span>
                                <span>{tGtm(emailsText.triggered, locale)}:</span>
                                <span className="font-mono">{u.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onPreview(t.id as EmailTemplateId)}
                        className="shrink-0 h-7 text-[10px] gap-1"
                      >
                        <Eye className="w-3 h-3" /> {tGtm(emailsText.preview, locale)}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────

export function GtmEmailsPage() {
  const locale = useGtmLocale();
  const data = useGtmData();
  const { emails } = useGtmDataContext();
  const [previewId, setPreviewId] = useState<EmailTemplateId | null>(null);
  if (!emails) {
    return (
      <div className="p-6 space-y-4 max-w-4xl">
        <h1 className="text-2xl font-bold">{tGtm(emailsText.title, locale)}</h1>
        <p className="text-sm text-muted-foreground">Email config is not available.</p>
      </div>
    );
  }
  const totalSequences = emails.sequences.length;
  const totalSequenceSteps = emails.sequences.reduce((s, x) => s + x.steps.length, 0);
  const totalTriggered = emails.triggeredEmails.length;
  const totalTemplates = emails.templates.length;

  return (
    <div className="p-6 space-y-4 max-w-4xl">
      <PreviewDialog
        templateId={previewId ? emails.previewUrl(previewId) : null}
        onClose={() => setPreviewId(null)}
      />
      <div>
        <h1 className="text-2xl font-bold">{tGtm(emailsText.title, locale)}</h1>
        <p className="text-sm text-muted-foreground">
          {tGtm(emailsText.summary, locale)
            .replace("{sequences}", totalSequences.toString())
            .replace("{steps}", totalSequenceSteps.toString())
            .replace("{triggered}", totalTriggered.toString())
            .replace("{templates}", totalTemplates.toString())}
        </p>
      </div>

      <Tabs defaultValue="sequences" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sequences">
            🔄 Sequences <span className="ml-1 text-xs opacity-60">{totalSequences}</span>
          </TabsTrigger>
          <TabsTrigger value="triggered">
            ⚡ Triggered <span className="ml-1 text-xs opacity-60">{totalTriggered}</span>
          </TabsTrigger>
          <TabsTrigger value="templates">
            📋 Templates <span className="ml-1 text-xs opacity-60">{totalTemplates}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sequences" className="space-y-4">
          <div className="text-xs text-muted-foreground">
            {tGtm(emailsText.sequenceIntro, locale)}{" "}
            <code className="bg-muted px-1 rounded">src/domains/crm/sequences.ts</code>
            {" · "}
            <span className="italic">{tGtm(emailsText.noInApp, locale)}</span>
          </div>
          {(() => {
            const global = emails.sequences.filter((s) => !s.targetIcpId);
            const byIcp = data.icps
              .map((icp) => ({
                icp,
                sequences: emails.sequences.filter((s) => s.targetIcpId === icp.id),
              }))
              .filter((g) => g.sequences.length > 0);

            return (
              <div className="space-y-6">
                {global.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline">{tGtm(emailsText.global, locale)}</Badge>
                    </div>
                    <div className="space-y-3">
                      {global.map((seq) => (
                        <EmailSequenceCard key={seq.id} sequence={seq} />
                      ))}
                    </div>
                  </div>
                )}
                {byIcp.map(({ icp, sequences }) => (
                  <div key={icp.id}>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline">
                        {icp.emoji} {pickLocale(icp.name, locale)}
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      {sequences.map((seq) => (
                        <EmailSequenceCard
                          key={seq.id}
                          sequence={seq}
                          icpName={pickLocale(icp.name, locale)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </TabsContent>

        <TabsContent value="triggered" className="space-y-4">
          <TriggeredEmailsTab onPreview={setPreviewId} triggeredEmails={emails.triggeredEmails} />
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <TemplatesTab onPreview={setPreviewId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
