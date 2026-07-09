"use client";

import { Button } from "kui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "kui/dialog";
import { Separator } from "kui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "kui/sidebar";
import { ChevronRight, HelpCircle } from "lucide-react";
import type { ReactNode } from "react";
import { useLocation } from "wouter";
import { GtmLocaleSwitcher } from "./components/gtm-locale-switcher";
import { pickLocale, useGtmData, useGtmLocale } from "./data";
import { getGtmNav } from "./nav";
import { computeIcpPillars } from "./pillar-scoring";

interface GtmLayoutProps {
  children: ReactNode;
  title?: string;
}

export function GtmLayout({ children, title }: GtmLayoutProps) {
  const locale = useGtmLocale();
  const data = useGtmData();
  const nav = getGtmNav(locale);
  const [location, navigate] = useLocation();
  const activePath = location === "" ? "/" : location;
  const activeMatch = nav
    .flatMap((group) =>
      group.items
        .filter((item) =>
          item.url === "/"
            ? activePath === "/"
            : activePath === item.url || activePath.startsWith(`${item.url}/`),
        )
        .map((item) => ({ group, item })),
    )
    .sort((a, b) => b.item.url.length - a.item.url.length)[0];
  const activeGroup = activeMatch?.group;
  const activeItem = activeMatch?.item;
  const pillarRows = data.icps.map((icp) => ({ icp, pillars: computeIcpPillars(icp, data) }));
  const needsAttention = pillarRows.filter((row) => row.pillars.overallHealth !== "green");
  const criticalCount = pillarRows.filter((row) => row.pillars.overallHealth === "red").length;
  const readyCount = pillarRows.filter((row) => row.pillars.overallHealth === "green").length;
  const topAttention = needsAttention.sort(
    (a, b) => a.pillars.overallPct - b.pillars.overallPct,
  )[0];
  const topAttentionName = topAttention
    ? pickLocale(topAttention.icp.name, locale)
    : "GTM loop is healthy";

  return (
    <SidebarProvider>
      <Sidebar className="gtm-sidebar" collapsible="icon">
        <SidebarHeader>
          <div className="gtm-brand">
            <div className="gtm-brand-icon" aria-hidden="true">
              GT
            </div>
            <span className="gtm-brand-copy">GTM War Room</span>
            <SidebarTrigger className="gtm-sidebar-trigger ml-auto" title="Toggle sidebar" />
          </div>
        </SidebarHeader>

        <SidebarContent>
          <section className="gtm-human-work">
            <span>Need attention</span>
            <strong>{topAttentionName}</strong>
            <button
              type="button"
              title="Open ICPs needing attention"
              onClick={() => navigate("/icps")}
            >
              <b>{needsAttention.length}</b>
              <small>ICP loops need a decision</small>
            </button>
            <div>
              <span>
                <b>{readyCount}</b>
                <small>Ready</small>
              </span>
              <span>
                <b>{criticalCount}</b>
                <small>Blocked</small>
              </span>
            </div>
          </section>
          {nav.map((group) => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = activeItem?.url === item.url;
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={() => navigate(item.url)}
                        className={
                          isActive
                            ? "gtm-nav-active cursor-pointer"
                            : "cursor-pointer hover:bg-sidebar-accent/70"
                        }
                        title={item.title}
                      >
                        {item.icon && <item.icon className="h-4 w-4" />}
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter>
          <div className="gtm-sidebar-footer">
            <GtmLocaleSwitcher />
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gtm-help-button"
                  title="Help & Settings"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  <span>Help & Settings</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Help & Settings</DialogTitle>
                  <DialogDescription>
                    Local GTM data source, route state, and app-in-skill workflow summary.
                  </DialogDescription>
                </DialogHeader>
                <div className="gtm-help-grid">
                  <span>
                    <small>Data source</small>
                    <b>packages/gtm-data/src</b>
                  </span>
                  <span>
                    <small>Current route</small>
                    <b>{activePath}</b>
                  </span>
                  <span>
                    <small>ICPs</small>
                    <b>{data.icps.length}</b>
                  </span>
                  <span>
                    <small>Needs attention</small>
                    <b>{needsAttention.length}</b>
                  </span>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="gtm-topbar">
          <SidebarTrigger className="gtm-mobile-trigger" title="Open sidebar" />
          <Separator orientation="vertical" className="h-4" />
          <button
            type="button"
            onClick={() => navigate("/")}
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            GTM War Room
          </button>
          {activeGroup && (
            <>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{activeGroup.label}</span>
            </>
          )}
          {activeItem && (
            <>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <button
                type="button"
                onClick={() => navigate(activeItem.url)}
                className="text-sm font-semibold text-foreground hover:text-primary"
              >
                {title ?? activeItem.title}
              </button>
            </>
          )}
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
