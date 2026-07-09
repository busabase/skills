"use client";

import { Button } from "kui/button";
import { Card, CardContent } from "kui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useLocation, useParams } from "wouter";

interface PlaybookPayload {
  slug: string;
  title: string;
  description: string;
  emoji: string | null;
  content: string;
}

export function GtmPlaybookDetailPage() {
  const params = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const [data, setData] = useState<PlaybookPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.slug) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/kit/gtm/playbook?slug=${encodeURIComponent(params.slug)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json() as Promise<PlaybookPayload>;
      })
      .then((payload) => {
        if (!cancelled) setData(payload);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message || "Failed to load playbook");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [params.slug]);

  return (
    <div className="p-6 space-y-4 max-w-4xl">
      <Button variant="ghost" size="sm" onClick={() => navigate("/playbooks")} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to Playbooks
      </Button>

      {loading && (
        <Card>
          <CardContent className="pt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading playbook...
          </CardContent>
        </Card>
      )}

      {error && !loading && (
        <Card>
          <CardContent className="pt-6 text-sm text-red-500">{error}</CardContent>
        </Card>
      )}

      {data && !loading && !error && (
        <>
          <div>
            <div className="flex items-start gap-3">
              <span className="text-3xl">{data.emoji ?? "📖"}</span>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold">{data.title}</h1>
                <p className="text-sm text-muted-foreground mt-1">{data.description}</p>
                <div className="text-[10px] text-muted-foreground font-mono mt-2">
                  content/gtm/{data.slug}.md
                </div>
              </div>
            </div>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.content}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
