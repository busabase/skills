/**
 * GTM Sidebar Navigation
 *
 * Used by the GTM War Room at /systemadmin/gtm/*.
 * URLs are relative to the GTM base path.
 *
 * Grouping follows the 4-pillar mental model defined in `pillar-scoring.ts`:
 *   🏗️ Foundation · 📝 Content · 📢 Paid · 💬 Retention · 📊 Measure
 * Plus a "Strategy" layer above the pillars and a "References" layer for docs.
 *
 * Top-level entries are cross-ICP aggregated views.
 * Per-ICP slices live inside ICP Detail (/icps/:id) tabs.
 */

import {
  Activity,
  AppWindow,
  BookOpen,
  Compass,
  Container,
  Flag,
  FlaskConical,
  GitFork,
  Globe,
  Heart,
  Images,
  Layers,
  Layout,
  ListChecks,
  type LucideIcon,
  Mail,
  Megaphone,
  MessageSquare,
  Milestone,
  Network,
  Package,
  PackageCheck,
  Rocket,
  ShoppingBag,
  Sparkles,
  Store,
  Swords,
  Target,
  UserCheck,
  Users,
  UsersRound,
} from "lucide-react";
import type { GTMLocale } from "./data";
import { gtmUiText, tGtm } from "./data";

export interface GtmNavItem {
  title: string;
  url: string;
  icon?: LucideIcon;
}

export interface GtmNavGroup {
  label: string;
  icon?: LucideIcon;
  items: GtmNavItem[];
}

export function getGtmNav(locale: GTMLocale): GtmNavGroup[] {
  const group = gtmUiText.nav.groups;
  const item = gtmUiText.nav.items;

  return [
    {
      label: `🧭 ${tGtm(group.warRoom, locale)}`,
      icon: Compass,
      items: [{ title: tGtm(item.overview, locale), url: "/", icon: Compass }],
    },
    {
      label: `🎯 ${tGtm(group.strategy, locale)}`,
      icon: Target,
      items: [
        { title: tGtm(item.businessLines, locale), url: "/business-lines", icon: Layers },
        { title: tGtm(item.icps, locale), url: "/icps", icon: Users },
        { title: tGtm(item.messaging, locale), url: "/messaging", icon: MessageSquare },
        { title: tGtm(item.competitors, locale), url: "/competitors", icon: Swords },
        { title: tGtm(item.milestones, locale), url: "/milestones", icon: Milestone },
      ],
    },
    {
      label: `📦 ${tGtm(group.products, locale)}`,
      icon: Package,
      items: [
        { title: tGtm(item.products, locale), url: "/products", icon: Package },
        { title: tGtm(item.skus, locale), url: "/skus", icon: Container },
        { title: tGtm(item.offers, locale), url: "/offers", icon: ShoppingBag },
        { title: tGtm(item.storefronts, locale), url: "/storefronts", icon: Store },
        { title: tGtm(item.listings, locale), url: "/listings", icon: PackageCheck },
        { title: tGtm(item.directories, locale), url: "/directories", icon: ListChecks },
      ],
    },
    {
      label: "🚀 Launch & Store Pages",
      icon: AppWindow,
      items: [
        { title: "All Pages", url: "/launch-pages", icon: AppWindow },
        { title: "Buda · Product Hunt", url: "/launch-pages/buda/producthunt", icon: Rocket },
        {
          title: "Buda API Claws · Product Hunt",
          url: "/launch-pages/buda/apiclaws/producthunt",
          icon: Rocket,
        },
        { title: "Buda · App Store", url: "/launch-pages/buda/appstore", icon: Store },
        {
          title: "Inpomo · Product Hunt",
          url: "/launch-pages/inpomo/producthunt",
          icon: Rocket,
        },
        { title: "Inpomo · App Store", url: "/launch-pages/inpomo/appstore", icon: Store },
        {
          title: "Busabase · Product Hunt",
          url: "/launch-pages/busabase/producthunt",
          icon: Rocket,
        },
        { title: "Busabase · App Store", url: "/launch-pages/busabase/appstore", icon: Store },
        {
          title: "Sandock · Product Hunt",
          url: "/launch-pages/sandock/producthunt",
          icon: Rocket,
        },
        {
          title: "Sandock · AWS Marketplace",
          url: "/launch-pages/sandock/aws-marketplace",
          icon: Store,
        },
      ],
    },
    {
      label: `🏗️ ${tGtm(group.foundation, locale)}`,
      icon: Layout,
      items: [
        { title: tGtm(item.landingPages, locale), url: "/landing-pages", icon: Globe },
        { title: tGtm(item.salesPitch, locale), url: "/sales-pitch", icon: Rocket },
        { title: tGtm(item.influencerKit, locale), url: "/influencer-kit", icon: Sparkles },
      ],
    },
    // {
    //   label: `📝 ${tGtm(group.content, locale)}`,
    //   icon: Library,
    //   items: [
    //     { title: tGtm(item.calendar, locale), url: "/calendar", icon: CalendarClock },
    //     { title: tGtm(item.library, locale), url: "/library", icon: Library },
    //     { title: tGtm(item.channels, locale), url: "/channels", icon: Radio },
    //     { title: tGtm(item.accounts, locale), url: "/accounts", icon: AtSign },
    //   ],
    // },
    // {
    //   label: `📢 ${tGtm(group.paid, locale)}`,
    //   icon: Megaphone,
    //   items: [
    //     { title: tGtm(item.campaigns, locale), url: "/campaigns", icon: Megaphone },
    //     { title: tGtm(item.budget, locale), url: "/budget", icon: DollarSign },
    //     { title: tGtm(item.distribute, locale), url: "/distribute", icon: Send },
    //   ],
    // },
    {
      label: `💬 ${tGtm(group.retention, locale)}`,
      icon: Heart,
      items: [
        { title: tGtm(item.emailSequences, locale), url: "/emails", icon: Mail },
        { title: tGtm(item.community, locale), url: "/community", icon: UsersRound },
        { title: tGtm(item.retros, locale), url: "/retros", icon: Activity },
      ],
    },
    {
      label: `📊 ${tGtm(group.measure, locale)}`,
      icon: Flag,
      items: [
        { title: tGtm(item.goals, locale), url: "/goals", icon: Flag },
        { title: tGtm(item.pipeline, locale), url: "/pipeline", icon: GitFork },
        { title: tGtm(item.experiments, locale), url: "/experiments", icon: FlaskConical },
        { title: tGtm(item.opsStreams, locale), url: "/streams", icon: Activity },
      ],
    },
    {
      label: "🚀 Release Management",
      icon: PackageCheck,
      items: [{ title: "All Releases", url: "/releases", icon: PackageCheck }],
    },
    {
      label: "📸 Screenshots",
      icon: Images,
      items: [{ title: "All Screenshots", url: "/screenshots", icon: Images }],
    },
    {
      label: `📚 ${tGtm(group.references, locale)}`,
      icon: BookOpen,
      items: [
        { title: tGtm(item.salesMethodology, locale), url: "/sales-methodology", icon: Network },
        { title: tGtm(item.marketingFlow, locale), url: "/marketing-flow", icon: Megaphone },
        { title: tGtm(item.selfServeFlow, locale), url: "/self-serve-flow", icon: UserCheck },
        { title: tGtm(item.playbooks, locale), url: "/playbooks", icon: BookOpen },
        { title: tGtm(item.backToAdmin, locale), url: "/systemadmin", icon: Target },
      ],
    },
  ];
}
