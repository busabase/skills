import { Card, CardContent, CardHeader, CardTitle } from "kui/card";
import { ExternalLink, PackageCheck } from "lucide-react";
import { type PlatformRelease, type ProductRelease, releases } from "~/domains/gtm/data/releases";

const PLATFORMS: { key: keyof ProductRelease["platforms"]; label: string; icon: string }[] = [
  { key: "web", label: "Web", icon: "🌐" },
  { key: "ios", label: "iOS", icon: "🍎" },
  { key: "android", label: "Android", icon: "🤖" },
  { key: "desktop", label: "Desktop", icon: "🖥️" },
  { key: "github", label: "GitHub", icon: "🐙" },
  { key: "npm", label: "npm", icon: "📦" },
];

const STATUS_STYLE: Record<PlatformRelease["status"], string> = {
  live: "bg-green-500/10 text-green-700 border-green-200",
  beta: "bg-blue-500/10 text-blue-700 border-blue-200",
  wip: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
  planned: "bg-zinc-100 text-zinc-500 border-zinc-200",
  "n/a": "bg-zinc-50 text-zinc-400 border-zinc-100",
};

const STATUS_DOT: Record<PlatformRelease["status"], string> = {
  live: "bg-green-500",
  beta: "bg-blue-400",
  wip: "bg-yellow-400",
  planned: "bg-zinc-300",
  "n/a": "bg-zinc-200",
};

function formatDate(date: string) {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "today";
  if (diff === 1) return "yesterday";
  if (diff < 7) return `${diff}d ago`;
  if (diff < 30) return `${Math.floor(diff / 7)}wk ago`;
  if (diff < 365) return `${Math.floor(diff / 30)}mo ago`;
  return `${Math.floor(diff / 365)}yr ago`;
}

function PlatformCell({ p }: { p: PlatformRelease | undefined }) {
  if (!p) return <span className="text-xs text-muted-foreground/40">—</span>;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[p.status]}`} />
        <span className="text-xs font-mono font-medium">{p.version}</span>
        {p.url && (
          <a
            href={p.url}
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
      <div className="flex flex-wrap gap-1">
        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${STATUS_STYLE[p.status]}`}>
          {p.status}
        </span>
        {p.date && <span className="text-[10px] text-muted-foreground">{formatDate(p.date)}</span>}
      </div>
      {p.notes && <p className="text-[10px] text-muted-foreground italic">{p.notes}</p>}
    </div>
  );
}

function SummaryDot({ product }: { product: ProductRelease }) {
  const platforms = Object.values(product.platforms);
  const hasLive = platforms.some((p) => p?.status === "live");
  const hasBeta = platforms.some((p) => p?.status === "beta");
  const hasWip = platforms.some((p) => p?.status === "wip");
  if (hasLive) return <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />;
  if (hasBeta) return <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />;
  if (hasWip) return <span className="w-2 h-2 rounded-full bg-yellow-400 shrink-0" />;
  return <span className="w-2 h-2 rounded-full bg-zinc-300 shrink-0" />;
}

export function GtmReleasesPage() {
  const activePlatforms = PLATFORMS.filter((pl) => releases.some((r) => r.platforms[pl.key]));

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <PackageCheck className="w-6 h-6" />
        <div>
          <h1 className="text-2xl font-bold">Release Management</h1>
          <p className="text-sm text-muted-foreground">
            Latest versions across all products and platforms
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {(["live", "beta", "wip", "planned"] as const).map((s) => (
          <span
            key={s}
            className={`flex items-center gap-1 px-2 py-0.5 rounded border ${STATUS_STYLE[s]}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[s]}`} />
            {s}
          </span>
        ))}
      </div>

      {/* Table — desktop */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 pr-4 font-medium text-muted-foreground w-40">
                Product
              </th>
              {activePlatforms.map((pl) => (
                <th
                  key={pl.key}
                  className="text-left py-2 px-3 font-medium text-muted-foreground min-w-[130px]"
                >
                  {pl.icon} {pl.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {releases.map((product) => (
              <tr
                key={product.id}
                className="border-b border-border/50 hover:bg-muted/30 transition-colors"
              >
                <td className="py-3 pr-4 align-top">
                  <div className="flex items-center gap-2">
                    <SummaryDot product={product} />
                    <div>
                      <div className="font-medium">
                        {product.emoji} {product.name}
                      </div>
                      <div className="text-xs text-muted-foreground">{product.description}</div>
                    </div>
                  </div>
                </td>
                {activePlatforms.map((pl) => (
                  <td key={pl.key} className="py-3 px-3 align-top">
                    <PlatformCell p={product.platforms[pl.key]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards — mobile */}
      <div className="md:hidden space-y-4">
        {releases.map((product) => (
          <Card key={product.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <SummaryDot product={product} />
                {product.emoji} {product.name}
              </CardTitle>
              <p className="text-xs text-muted-foreground">{product.description}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {activePlatforms.map((pl) => {
                const p = product.platforms[pl.key];
                if (!p) return null;
                return (
                  <div key={pl.key} className="flex gap-3">
                    <span className="text-xs text-muted-foreground w-16 shrink-0 pt-0.5">
                      {pl.icon} {pl.label}
                    </span>
                    <PlatformCell p={p} />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Static data — update{" "}
        <code className="bg-muted px-1 rounded">packages/gtm-data/src/releases.ts</code> after each
        release.
      </p>
    </div>
  );
}
