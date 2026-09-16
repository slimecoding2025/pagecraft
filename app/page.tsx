// app/page.tsx
"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Wand2,
  Copy,
  Check,
  Download,
  RefreshCw,
  LayoutTemplate,
  PenLine,
  Code2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LandingPreview } from "@/components/preview/LandingPreview";
import { generateComponentCode } from "@/lib/codegen";
import type {
  GeneratePageResponse,
  LandingPageBlueprint,
  SectionKey,
} from "@/types";

const EXAMPLE_PROMPTS = [
  "An AI-powered meal planner for busy parents",
  "A freelance invoicing tool for designers",
  "A carbon-footprint tracker for small businesses",
];

export default function PageCraftAI() {
  const [prompt, setPrompt] = useState("");
  const [blueprint, setBlueprint] = useState<LandingPageBlueprint | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [regeneratingSection, setRegeneratingSection] =
    useState<SectionKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const runGenerate = useCallback(
    async (opts?: { regenerateSection?: SectionKey }) => {
      if (!prompt.trim()) {
        setError("Describe your product idea first.");
        return;
      }

      setError(null);
      if (opts?.regenerateSection) {
        setRegeneratingSection(opts.regenerateSection);
      } else {
        setIsLoading(true);
      }

      try {
        const res = await fetch("/api/generate-page", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            regenerateSection: opts?.regenerateSection,
            existingBlueprint: opts?.regenerateSection ? blueprint : undefined,
          }),
        });

        const json = (await res.json()) as GeneratePageResponse;

        if (!json.success || !json.data) {
          setError(json.error || "Something went wrong generating the blueprint.");
          return;
        }

        setBlueprint(json.data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Network error while contacting the generator."
        );
      } finally {
        setIsLoading(false);
        setRegeneratingSection(null);
      }
    },
    [prompt, blueprint]
  );

  const handleCopyCode = async () => {
    if (!blueprint) return;
    const code = generateComponentCode(blueprint);
    await navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleExportJson = () => {
    if (!blueprint) return;
    const blob = new Blob([JSON.stringify(blueprint, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${blueprint.meta.productName
      .toLowerCase()
      .replace(/\s+/g, "-")}-blueprint.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Top bar */}
      <header className="border-b border-zinc-900">
        <div className="mx-auto max-w-6xl px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
              <Sparkles className="h-4 w-4 text-zinc-950" />
            </div>
            <span className="font-semibold tracking-tight">PageCraft AI</span>
          </div>
          <span className="text-xs text-zinc-500">
            Landing Page &amp; UI Blueprint Generator powered by mouhamed salim bousmina
          </span>
        </div>
      </header>

      {/* Prompt studio */}
      <section className="mx-auto max-w-6xl px-6 pt-14 pb-10">
        <div className="max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Describe your product. Get a full landing page blueprint.
          </h1>
          <p className="mt-3 text-zinc-400">
            One sentence in — a live preview, conversion copy, and exportable
            React + Tailwind code out.
          </p>
        </div>

        <div className="mt-8 max-w-2xl">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-2 focus-within:border-zinc-600 transition-colors">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. An AI-powered meal planner for busy parents"
              rows={2}
              className="w-full resize-none bg-transparent px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
            />
            <div className="flex items-center justify-between px-2 pb-1">
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_PROMPTS.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => setPrompt(ex)}
                    className="rounded-full border border-zinc-800 px-2.5 py-1 text-xs text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 transition-colors"
                  >
                    {ex}
                  </button>
                ))}
              </div>
              <Button
                onClick={() => runGenerate()}
                disabled={isLoading}
                size="sm"
                className="shrink-0"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    Generate blueprint
                  </>
                )}
              </Button>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 flex items-start gap-2 rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2.5 text-sm text-red-300"
              >
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Output hub */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        {isLoading && !blueprint && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-zinc-900 py-24 text-zinc-500">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm">Drafting your blueprint…</p>
          </div>
        )}

        {!isLoading && !blueprint && (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-900 py-24 text-zinc-600">
            <LayoutTemplate className="h-6 w-6" />
            <p className="text-sm">Your generated blueprint will appear here.</p>
          </div>
        )}

        {blueprint && (
          <div>
            {/* Quick actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="font-medium">{blueprint.meta.productName}</h2>
                <p className="text-xs text-zinc-500">{blueprint.meta.tagline}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleExportJson}>
                  <Download className="h-3.5 w-3.5" />
                  Export JSON
                </Button>
                <Button variant="outline" size="sm" onClick={handleCopyCode}>
                  {copiedCode ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copiedCode ? "Copied" : "Copy code"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => runGenerate()}
                  disabled={isLoading}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Regenerate all
                </Button>
              </div>
            </div>

            <Tabs defaultValue="preview">
              <TabsList>
                <TabsTrigger value="preview">
                  <LayoutTemplate className="h-4 w-4" />
                  Live Preview
                </TabsTrigger>
                <TabsTrigger value="copy">
                  <PenLine className="h-4 w-4" />
                  Copywriting
                </TabsTrigger>
                <TabsTrigger value="code">
                  <Code2 className="h-4 w-4" />
                  Exportable Code
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Live Preview */}
              <TabsContent value="preview">
                <div className="flex justify-end mb-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={regeneratingSection === "hero"}
                    onClick={() => runGenerate({ regenerateSection: "hero" })}
                  >
                    {regeneratingSection ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5" />
                    )}
                    Regenerate section
                  </Button>
                </div>
                <LandingPreview blueprint={blueprint} />
              </TabsContent>

              {/* Tab 2: Copywriting */}
              <TabsContent value="copy">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="rounded-xl border border-zinc-800 p-5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-zinc-200">
                        Value propositions
                      </h3>
                    </div>
                    <ul className="mt-4 space-y-2.5">
                      {blueprint.copy.valuePropositions.map((v, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-zinc-400"
                        >
                          <Check className="h-4 w-4 mt-0.5 text-zinc-600 shrink-0" />
                          {v}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-xl border border-zinc-800 p-5">
                    <h3 className="text-sm font-medium text-zinc-200">
                      Headline variants
                    </h3>
                    <ul className="mt-4 space-y-3">
                      {blueprint.copy.headlineVariants.map((h, i) => (
                        <li
                          key={i}
                          className="text-sm text-zinc-300 border-l-2 border-zinc-800 pl-3"
                        >
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-xl border border-zinc-800 p-5">
                    <h3 className="text-sm font-medium text-zinc-200">
                      CTA button variants
                    </h3>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {blueprint.copy.ctaVariants.map((c, i) => (
                        <span
                          key={i}
                          className="rounded-md bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-xs text-zinc-300"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-zinc-800 p-5">
                    <h3 className="text-sm font-medium text-zinc-200">
                      Tone of voice
                    </h3>
                    <p className="mt-4 text-sm text-zinc-400">
                      {blueprint.copy.toneOfVoice}
                    </p>
                  </div>
                </div>
              </TabsContent>

              {/* Tab 3: Exportable Code */}
              <TabsContent value="code">
                <div className="rounded-xl border border-zinc-800 overflow-hidden">
                  <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4 py-2.5">
                    <span className="text-xs text-zinc-500">
                      {blueprint.meta.productName.replace(/\s+/g, "")}.tsx
                    </span>
                    <Button variant="ghost" size="sm" onClick={handleCopyCode}>
                      {copiedCode ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      {copiedCode ? "Copied" : "Copy"}
                    </Button>
                  </div>
                  <pre className="max-h-[60vh] overflow-auto p-4 text-xs leading-relaxed text-zinc-300">
                    <code>{generateComponentCode(blueprint)}</code>
                  </pre>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </section>
    </main>
  );
}
