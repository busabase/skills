/**
 * GTM routes for the standalone skill app.
 * Mirrors packages/share-domains/gtm/routes.tsx but uses React.lazy
 * instead of next/dynamic so it works in a Vite/React context.
 */
import { Loader2 } from "lucide-react";
import { lazy, type ReactNode, Suspense } from "react";
import type { GTMLocale } from "./data";
import { gtmUiText, tGtm } from "./data";

const Spinner = () => (
  <div className="flex items-center justify-center h-64">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
);

function wrap(factory: () => Promise<{ [key: string]: React.ComponentType }>, key: string) {
  const Comp = lazy(() => factory().then((m) => ({ default: m[key] })));
  return (
    <Suspense fallback={<Spinner />}>
      <Comp />
    </Suspense>
  );
}

const warRoomPage = () => wrap(() => import("./components/gtm-warroom-page"), "GtmWarRoomPage");
const businessLinesPage = () =>
  wrap(() => import("./components/gtm-business-lines-page"), "GtmBusinessLinesPage");
const productsPage = () => wrap(() => import("./components/gtm-products-page"), "GtmProductsPage");
const offersPage = () => wrap(() => import("./components/gtm-offers-page"), "GtmOffersPage");
const storefrontsPage = () =>
  wrap(() => import("./components/gtm-storefronts-page"), "GtmStorefrontsPage");
const storefrontDetailPage = () =>
  wrap(() => import("./components/gtm-storefront-detail-page"), "GtmStorefrontDetailPage");
const listingsPage = () => wrap(() => import("./components/gtm-listings-page"), "GtmListingsPage");
const listingDetailPage = () =>
  wrap(() => import("./components/gtm-listing-detail-page"), "GtmListingDetailPage");
const icpsPage = () => wrap(() => import("./components/gtm-icps-page"), "GtmIcpsPage");
const icpDetailPage = () =>
  wrap(() => import("./components/gtm-icp-detail-page"), "GtmIcpDetailPage");
const skusPage = () => wrap(() => import("./components/gtm-skus-page"), "GtmSkusPage");
const skuDetailPage = () =>
  wrap(() => import("./components/gtm-sku-detail-page"), "GtmSkuDetailPage");
const messagingPage = () =>
  wrap(() => import("./components/gtm-messaging-page"), "GtmMessagingPage");
const competitorsPage = () =>
  wrap(() => import("./components/gtm-competitors-page"), "GtmCompetitorsPage");
const landingPagesPage = () =>
  wrap(() => import("./components/gtm-landing-pages-page"), "GtmLandingPagesPage");
const salesPitchPage = () => wrap(() => import("./components/gtm-misc-pages"), "GtmSalesPitchPage");
const salesMethodologyPage = () =>
  wrap(() => import("./components/gtm-sales-methodology-page"), "GtmSalesMethodologyPage");
const marketingFlowPage = () =>
  wrap(() => import("./components/gtm-marketing-flow-page"), "GtmMarketingFlowPage");
const selfServeFlowPage = () =>
  wrap(() => import("./components/gtm-self-serve-flow-page"), "GtmSelfServeFlowPage");
const influencerKitPage = () =>
  wrap(() => import("./components/gtm-misc-pages"), "GtmInfluencerKitPage");
const contentLibraryPage = () =>
  wrap(() => import("./components/gtm-content-library-page"), "GtmContentLibraryPage");
const calendarPage = () => wrap(() => import("./components/gtm-calendar-page"), "GtmCalendarPage");
const channelsPage = () => wrap(() => import("./components/gtm-channels-page"), "GtmChannelsPage");
const accountsPage = () => wrap(() => import("./components/gtm-accounts-page"), "GtmAccountsPage");
const directoriesPage = () =>
  wrap(() => import("./components/gtm-directories-page"), "GtmDirectoriesPage");
const campaignsPage = () =>
  wrap(() => import("./components/gtm-campaigns-page"), "GtmCampaignsPage");
const distributePage = () =>
  wrap(() => import("./components/gtm-distribute-page"), "GtmDistributePage");
const budgetPage = () => wrap(() => import("./components/gtm-misc-pages"), "GtmBudgetPage");
const emailsPage = () => wrap(() => import("./components/gtm-emails-page"), "GtmEmailsPage");
const communityPage = () => wrap(() => import("./components/gtm-misc-pages"), "GtmCommunityPage");
const retrosPage = () => wrap(() => import("./components/gtm-misc-pages"), "GtmRetrosPage");
const goalsPage = () => wrap(() => import("./components/gtm-goals-page"), "GtmGoalsPage");
const milestonesPage = () =>
  wrap(() => import("./components/gtm-milestones-page"), "GtmMilestonesPage");
const pipelinePage = () => wrap(() => import("./components/gtm-misc-pages"), "GtmPipelinePage");
const experimentsPage = () =>
  wrap(() => import("./components/gtm-misc-pages"), "GtmExperimentsPage");
const streamsPage = () => wrap(() => import("./components/gtm-streams-page"), "GtmStreamsPage");
const playbooksPage = () => wrap(() => import("./components/gtm-misc-pages"), "GtmPlaybooksPage");
const playbookDetailPage = () =>
  wrap(() => import("./components/gtm-playbook-detail-page"), "GtmPlaybookDetailPage");

const releasesPage = () => wrap(() => import("./components/gtm-releases-page"), "GtmReleasesPage");
const screenshotsPage = () =>
  wrap(() => import("./components/gtm-screenshots-page"), "GtmScreenshotsPage");

// Launch & Store Pages
const appStorePagesIndex = () =>
  wrap(() => import("./components/kit/app-store-pages-index"), "AppStorePagesIndex");
const budaProductHunt = () => wrap(() => import("./components/kit/buda-producthunt"), "default");
const budaApiClawsProductHunt = () =>
  wrap(() => import("./components/kit/buda-apiclaws-producthunt"), "default");
const budaAppStore = () => wrap(() => import("./components/kit/buda-appstore"), "default");
const budaAwsMarketplace = () =>
  wrap(() => import("./components/kit/buda-aws-marketplace"), "default");
const inpomoProductHunt = () =>
  wrap(() => import("./components/kit/inpomo-producthunt"), "default");
const inpomoAppStore = () => {
  const Comp = lazy(async () => {
    const { InpomoAppStore } = await import("./components/kit/inpomo-appstore");
    return { default: InpomoAppStore };
  });
  return (
    <Suspense fallback={<Spinner />}>
      <Comp />
    </Suspense>
  );
};
const busabaseProductHunt = () =>
  wrap(() => import("./components/kit/busabase-producthunt"), "default");
const busabaseAppStore = () => wrap(() => import("./components/kit/busabase-appstore"), "default");
const sandockProductHunt = () =>
  wrap(() => import("./components/kit/sandock-producthunt"), "default");
const sandockAwsMarketplace = () =>
  wrap(() => import("./components/kit/sandock-aws-marketplace"), "default");

export interface GtmRouteConfig {
  path: string;
  element: () => ReactNode;
  title: string;
}

export function getSkillGtmRoutes(locale: GTMLocale): GtmRouteConfig[] {
  const item = gtmUiText.nav.items;
  const t = (s: Parameters<typeof tGtm>[0]) => tGtm(s, locale);

  return [
    { path: "/", element: warRoomPage, title: t(item.warRoom) },
    { path: "/icps/:id", element: icpDetailPage, title: t(item.icpDetail) },
    { path: "/icps", element: icpsPage, title: t(item.icps) },
    { path: "/messaging", element: messagingPage, title: t(item.messaging) },
    { path: "/competitors", element: competitorsPage, title: t(item.competitors) },
    { path: "/business-lines", element: businessLinesPage, title: t(item.businessLines) },
    { path: "/products", element: productsPage, title: t(item.products) },
    { path: "/skus/:id", element: skuDetailPage, title: t(item.skuDetail) },
    { path: "/skus", element: skusPage, title: t(item.skus) },
    { path: "/offers", element: offersPage, title: t(item.offers) },
    { path: "/storefronts/:id", element: storefrontDetailPage, title: t(item.storefrontDetail) },
    { path: "/storefronts", element: storefrontsPage, title: t(item.storefronts) },
    { path: "/listings/:id", element: listingDetailPage, title: t(item.listingDetail) },
    { path: "/listings", element: listingsPage, title: t(item.listings) },
    { path: "/directories", element: directoriesPage, title: t(item.appDirectories) },
    { path: "/landing-pages", element: landingPagesPage, title: t(item.landingPages) },
    { path: "/sales-pitch", element: salesPitchPage, title: t(item.salesPitch) },
    { path: "/influencer-kit", element: influencerKitPage, title: t(item.influencerKit) },
    { path: "/calendar", element: calendarPage, title: t(item.contentCalendar) },
    { path: "/library", element: contentLibraryPage, title: t(item.contentLibrary) },
    { path: "/channels", element: channelsPage, title: t(item.channels) },
    { path: "/accounts", element: accountsPage, title: t(item.accounts) },
    { path: "/campaigns", element: campaignsPage, title: t(item.campaigns) },
    { path: "/distribute", element: distributePage, title: t(item.distribute) },
    { path: "/budget", element: budgetPage, title: t(item.budget) },
    { path: "/emails", element: emailsPage, title: t(item.emailSequences) },
    { path: "/community", element: communityPage, title: t(item.community) },
    { path: "/retros", element: retrosPage, title: t(item.retros) },
    { path: "/milestones", element: milestonesPage, title: t(item.milestones) },
    { path: "/goals", element: goalsPage, title: t(item.goals) },
    { path: "/pipeline", element: pipelinePage, title: t(item.pipeline) },
    { path: "/experiments", element: experimentsPage, title: t(item.experiments) },
    { path: "/streams", element: streamsPage, title: t(item.streams) },
    { path: "/sales-methodology", element: salesMethodologyPage, title: t(item.salesMethodology) },
    { path: "/marketing-flow", element: marketingFlowPage, title: t(item.marketingFlow) },
    { path: "/self-serve-flow", element: selfServeFlowPage, title: t(item.selfServeFlow) },
    { path: "/playbooks/:slug", element: playbookDetailPage, title: "Playbook Detail" },
    { path: "/playbooks", element: playbooksPage, title: t(item.playbooks) },
    // Launch & Store Pages
    {
      path: "/launch-pages/buda/producthunt",
      element: budaProductHunt,
      title: "Buda · Product Hunt",
    },
    {
      path: "/launch-pages/buda/apiclaws/producthunt",
      element: budaApiClawsProductHunt,
      title: "Buda API Claws · Product Hunt",
    },
    {
      path: "/launch-pages/buda/appstore",
      element: budaAppStore,
      title: "Buda · App Store",
    },
    {
      path: "/launch-pages/inpomo/producthunt",
      element: inpomoProductHunt,
      title: "Inpomo · Product Hunt",
    },
    {
      path: "/launch-pages/inpomo/appstore",
      element: inpomoAppStore,
      title: "Inpomo · App Store",
    },
    {
      path: "/launch-pages/buda/aws-marketplace",
      element: budaAwsMarketplace,
      title: "Buda · AWS Marketplace",
    },
    {
      path: "/launch-pages/busabase/producthunt",
      element: busabaseProductHunt,
      title: "Busabase · Product Hunt",
    },
    {
      path: "/launch-pages/busabase/appstore",
      element: busabaseAppStore,
      title: "Busabase · App Store",
    },
    {
      path: "/launch-pages/sandock/producthunt",
      element: sandockProductHunt,
      title: "Sandock · Product Hunt",
    },
    {
      path: "/launch-pages/sandock/aws-marketplace",
      element: sandockAwsMarketplace,
      title: "Sandock · AWS Marketplace",
    },
    { path: "/launch-pages", element: appStorePagesIndex, title: "Launch & Store Pages" },
    {
      path: "/app-store-pages/buda/producthunt",
      element: budaProductHunt,
      title: "Buda · Product Hunt",
    },
    {
      path: "/app-store-pages/buda/apiclaws/producthunt",
      element: budaApiClawsProductHunt,
      title: "Buda API Claws · Product Hunt",
    },
    { path: "/app-store-pages/buda/appstore", element: budaAppStore, title: "Buda · App Store" },
    {
      path: "/app-store-pages/inpomo/producthunt",
      element: inpomoProductHunt,
      title: "Inpomo · Product Hunt",
    },
    {
      path: "/app-store-pages/inpomo/appstore",
      element: inpomoAppStore,
      title: "Inpomo · App Store",
    },
    {
      path: "/app-store-pages/buda/aws-marketplace",
      element: budaAwsMarketplace,
      title: "Buda · AWS Marketplace",
    },
    {
      path: "/app-store-pages/busabase/producthunt",
      element: busabaseProductHunt,
      title: "Busabase · Product Hunt",
    },
    {
      path: "/app-store-pages/busabase/appstore",
      element: busabaseAppStore,
      title: "Busabase · App Store",
    },
    {
      path: "/app-store-pages/sandock/producthunt",
      element: sandockProductHunt,
      title: "Sandock · Product Hunt",
    },
    {
      path: "/app-store-pages/sandock/aws-marketplace",
      element: sandockAwsMarketplace,
      title: "Sandock · AWS Marketplace",
    },
    { path: "/app-store-pages", element: appStorePagesIndex, title: "Launch & Store Pages" },
    { path: "/releases", element: releasesPage, title: "Release Management" },
    { path: "/screenshots", element: screenshotsPage, title: "Screenshots" },
  ];
}
