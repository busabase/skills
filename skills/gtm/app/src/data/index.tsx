"use client";

export * from "gtm-data/i18n";
export * from "gtm-data/types";
export * from "./app-store-matrix";
export * from "./constants";
export { LocalizedText, useLocalizedString } from "./localized-text";
export { gtmUiText, tGtm } from "./ui-text";
export { GtmLocaleProvider, useGtmLocale, useGtmLocaleContext } from "./use-gtm-locale";

import type { DistributionItem, EmailTemplateId, EmailTemplateMeta, GTMData } from "gtm-data/types";
import { createContext, type ReactNode, useContext } from "react";

export interface GtmTriggeredEmail {
  id: string;
  name: string;
  description: string;
  event: string;
  recipient: "user" | "admin" | "inviter" | "invitee";
  status: "active" | "draft" | "disabled";
  subject: string;
  previewText?: string;
  templateId?: EmailTemplateId | null;
  createsNotification?: string;
  implementedIn?: string;
  notes?: string;
}

export interface GtmEmailSequenceStep {
  id: string;
  day: number;
  templateId: EmailTemplateId;
  subject: string;
  previewText?: string;
  purpose: string;
  templateProps?: {
    type?: string;
    preheader?: string;
    title?: string;
    message?: string;
    actionText?: string;
    actionUrl?: string;
    releaseVersion?: string;
    releaseDate?: string;
    highlights?: string[];
    blogPosts?: Array<{
      title: string;
      description?: string;
      href: string;
    }>;
    hero?: {
      title: string;
      subtitle?: string;
      youtubeVideoId?: string;
    };
    intro?: string;
    primaryCta?: { text: string; url: string };
    releaseNotesUrl?: string;
    [key: string]:
      | string
      | string[]
      | Array<{ title: string; description?: string; href: string }>
      | { title: string; subtitle?: string; youtubeVideoId?: string }
      | { text: string; url: string }
      | undefined;
  };
  eventName: string;
}

export interface GtmEmailSequence {
  id: string;
  name: string;
  description: string;
  trigger: "registration" | "activation" | "inactivity" | "upgrade" | "manual";
  targetIcpId?: string;
  status: "active" | "draft" | "paused";
  steps: GtmEmailSequenceStep[];
}

export interface GtmEmailConfig {
  sequences: readonly GtmEmailSequence[];
  triggeredEmails: readonly GtmTriggeredEmail[];
  templates: readonly EmailTemplateMeta[];
  getUsersOfTemplate: (
    id: EmailTemplateId,
    sequences: readonly GtmEmailSequence[],
    triggeredEmails: readonly GtmTriggeredEmail[],
  ) => {
    sequences: Array<{ seqName: string; stepId: string }>;
    triggered: Array<{ name: string; triggeredId: string }>;
  };
  previewUrl: (templateId: EmailTemplateId) => string;
}

export interface GtmDataContextValue {
  data: GTMData;
  distributionItems: DistributionItem[];
  emails?: GtmEmailConfig;
}

const GtmDataContext = createContext<GtmDataContextValue | null>(null);

export function GtmDataProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: GtmDataContextValue;
}) {
  return <GtmDataContext.Provider value={value}>{children}</GtmDataContext.Provider>;
}

export function useGtmDataContext(): GtmDataContextValue {
  const context = useContext(GtmDataContext);
  if (!context) {
    throw new Error("useGtmDataContext must be used inside <GtmDataProvider>");
  }
  return context;
}

export function useGtmData(): GTMData {
  return useGtmDataContext().data;
}
