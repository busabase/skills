import { ChevronLeft, ChevronRight, Images, Search, X } from "lucide-react";
import { useState } from "react";
import {
  type Screenshot,
  type ScreenshotApp,
  screenshotApps,
} from "~/domains/gtm/data/screenshots";

// ─── Lightbox ────────────────────────────────────────────────────────────────

function Lightbox({
  shot,
  all,
  onClose,
  onPrev,
  onNext,
}: {
  shot: Screenshot;
  all: Screenshot[];
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const idx = all.findIndex((s) => s.id === shot.id);
  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
      role="button"
      tabIndex={0}
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <button
        type="button"
        className="absolute top-4 right-4 text-white/70 hover:text-white"
        onClick={onClose}
      >
        <X className="w-6 h-6" />
      </button>
      <button
        type="button"
        className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white disabled:opacity-20"
        onClick={(e) => {
          e.stopPropagation();
          onPrev();
        }}
        disabled={idx === 0}
      >
        <ChevronLeft className="w-8 h-8" />
      </button>
      <div
        className="max-w-5xl max-h-[90vh] flex flex-col items-center gap-3 px-16"
        role="dialog"
        aria-modal="true"
        aria-label="Screenshot lightbox"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={shot.src}
          alt={shot.title}
          className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
        />
        <div className="text-center">
          <div className="text-white font-medium">{shot.title}</div>
          {shot.caption && <div className="text-white/60 text-sm mt-0.5">{shot.caption}</div>}
          <div className="text-white/40 text-xs mt-1">
            {idx + 1} / {all.length}
          </div>
        </div>
      </div>
      <button
        type="button"
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white disabled:opacity-20"
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
        disabled={idx === all.length - 1}
      >
        <ChevronRight className="w-8 h-8" />
      </button>
    </div>
  );
}

// ─── Grid ────────────────────────────────────────────────────────────────────

function ScreenshotGrid({
  shots,
  onSelect,
}: {
  shots: Screenshot[];
  onSelect: (s: Screenshot) => void;
}) {
  if (shots.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">No screenshots found.</p>;
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {shots.map((shot) => (
        <button
          key={shot.id}
          type="button"
          className="group relative aspect-video rounded-lg overflow-hidden border border-border bg-muted hover:border-primary/50 transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary"
          onClick={() => onSelect(shot)}
          title={shot.title}
        >
          <img
            src={shot.src}
            alt={shot.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
              (e.target as HTMLImageElement).parentElement?.classList.add("bg-muted/50");
            }}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
          <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="text-white text-[10px] font-medium truncate">{shot.title}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function GtmScreenshotsPage() {
  const [activeApp, setActiveApp] = useState<string>("all");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [lightbox, setLightbox] = useState<Screenshot | null>(null);

  const currentApp: ScreenshotApp | undefined = screenshotApps.find((a) => a.id === activeApp);

  const allShots = screenshotApps.flatMap((a) => a.categories.flatMap((c) => c.screenshots));

  const filtered = allShots.filter((s) => {
    if (activeApp !== "all" && s.app !== activeApp) return false;
    if (activeCategory !== "all" && s.category !== activeCategory) return false;
    if (query) {
      const q = query.toLowerCase();
      return (
        s.title.toLowerCase().includes(q) ||
        s.caption?.toLowerCase().includes(q) ||
        s.tags?.some((t) => t.includes(q))
      );
    }
    return true;
  });

  const lightboxAll = filtered;
  const lightboxIdx = lightbox ? lightboxAll.findIndex((s) => s.id === lightbox.id) : -1;

  function openLightbox(shot: Screenshot) {
    setLightbox(shot);
  }
  function closeLightbox() {
    setLightbox(null);
  }
  function prevShot() {
    if (lightboxIdx > 0) setLightbox(lightboxAll[lightboxIdx - 1]);
  }
  function nextShot() {
    if (lightboxIdx < lightboxAll.length - 1) setLightbox(lightboxAll[lightboxIdx + 1]);
  }

  function selectApp(id: string) {
    setActiveApp(id);
    setActiveCategory("all");
  }

  return (
    <>
      {lightbox && (
        <Lightbox
          shot={lightbox}
          all={lightboxAll}
          onClose={closeLightbox}
          onPrev={prevShot}
          onNext={nextShot}
        />
      )}

      <div className="p-6 space-y-5 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Images className="w-6 h-6" />
            <div>
              <h1 className="text-2xl font-bold">Screenshots</h1>
              <p className="text-sm text-muted-foreground">
                {allShots.length} screenshots across {screenshotApps.length} products
              </p>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search screenshots…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary w-52"
            />
          </div>
        </div>

        {/* App filter */}
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => selectApp("all")}
            className={`px-3 py-1 rounded-full text-sm border transition-colors ${
              activeApp === "all"
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border hover:bg-muted"
            }`}
          >
            All ({allShots.length})
          </button>
          {screenshotApps.map((app) => {
            const count = app.categories.flatMap((c) => c.screenshots).length;
            return (
              <button
                key={app.id}
                type="button"
                onClick={() => selectApp(app.id)}
                className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                  activeApp === app.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:bg-muted"
                }`}
              >
                {app.emoji} {app.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Category filter (only when an app is selected) */}
        {currentApp && (
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveCategory("all")}
              className={`px-2.5 py-0.5 rounded text-xs border transition-colors ${
                activeCategory === "all"
                  ? "bg-secondary text-secondary-foreground border-secondary"
                  : "border-border hover:bg-muted"
              }`}
            >
              All categories
            </button>
            {currentApp.categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-2.5 py-0.5 rounded text-xs border transition-colors ${
                  activeCategory === cat.id
                    ? "bg-secondary text-secondary-foreground border-secondary"
                    : "border-border hover:bg-muted"
                }`}
              >
                {cat.label} ({cat.screenshots.length})
              </button>
            ))}
          </div>
        )}

        {/* Results count */}
        {(query || activeApp !== "all" || activeCategory !== "all") && (
          <p className="text-xs text-muted-foreground">
            Showing {filtered.length} screenshot{filtered.length !== 1 ? "s" : ""}
          </p>
        )}

        {/* Grid */}
        <ScreenshotGrid shots={filtered} onSelect={openLightbox} />

        <p className="text-xs text-muted-foreground pt-2">
          Assets symlinked from each app's <code className="bg-muted px-1 rounded">public/</code>{" "}
          directory. Add new screenshots by generating them with the demo mode script in each app.
        </p>
      </div>
    </>
  );
}
