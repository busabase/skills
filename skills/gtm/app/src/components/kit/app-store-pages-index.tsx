import { AppWindow, ExternalLink, Smartphone } from "lucide-react";
import Link from "../../next-link-shim";

interface KitEntry {
  app: string;
  appLabel: string;
  description: string;
  pages: { label: string; url: string; type: "producthunt" | "appstore" }[];
}

const KITS: KitEntry[] = [
  {
    app: "buda",
    appLabel: "Buda",
    description:
      "AI agent workspace — Product Hunt launch materials, API Claws launch page, App Store listing, and AWS Marketplace mock.",
    pages: [
      { label: "Product Hunt Kit", url: "/launch-pages/buda/producthunt", type: "producthunt" },
      {
        label: "API Claws Product Hunt",
        url: "/launch-pages/buda/apiclaws/producthunt",
        type: "producthunt",
      },
      { label: "App Store Kit", url: "/launch-pages/buda/appstore", type: "appstore" },
      { label: "AWS Marketplace", url: "/launch-pages/buda/aws-marketplace", type: "appstore" },
    ],
  },
  {
    app: "inpomo",
    appLabel: "Inpomo",
    description: "Focus & task manager — Product Hunt and App Store launch kits.",
    pages: [
      {
        label: "Product Hunt Kit",
        url: "/launch-pages/inpomo/producthunt",
        type: "producthunt",
      },
      { label: "App Store Kit", url: "/launch-pages/inpomo/appstore", type: "appstore" },
    ],
  },
  {
    app: "busabase",
    appLabel: "Busabase",
    description:
      "Approval-first, auditable database for AI agents — Product Hunt and App Store kits.",
    pages: [
      {
        label: "Product Hunt Kit",
        url: "/launch-pages/busabase/producthunt",
        type: "producthunt",
      },
      { label: "App Store Kit", url: "/launch-pages/busabase/appstore", type: "appstore" },
    ],
  },
  {
    app: "sandock",
    appLabel: "Sandock",
    description:
      "Cloud sandboxes for AI coding agents — Product Hunt kit and AWS Marketplace mock.",
    pages: [
      {
        label: "Product Hunt Kit",
        url: "/launch-pages/sandock/producthunt",
        type: "producthunt",
      },
      {
        label: "AWS Marketplace",
        url: "/launch-pages/sandock/aws-marketplace",
        type: "appstore",
      },
    ],
  },
];

const typeIcon = {
  producthunt: "🚀",
  appstore: "🍎",
};

export function AppStorePagesIndex() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <AppWindow className="w-6 h-6" />
          Launch & Store Pages
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Product Hunt launch kits, store listings, and marketplace materials for each product.
        </p>
      </div>

      <div className="grid gap-4">
        {KITS.map((kit) => (
          <div key={kit.app} className="border border-border rounded-xl p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-semibold text-base">{kit.appLabel}</h2>
                <p className="text-sm text-muted-foreground">{kit.description}</p>
              </div>
              <Smartphone className="w-5 h-5 text-muted-foreground shrink-0" />
            </div>
            <div className="flex flex-wrap gap-2">
              {kit.pages.map((page) => (
                <Link
                  key={page.url}
                  href={page.url}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-accent transition-colors"
                >
                  <span>{typeIcon[page.type]}</span>
                  {page.label}
                  <ExternalLink className="w-3 h-3 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
