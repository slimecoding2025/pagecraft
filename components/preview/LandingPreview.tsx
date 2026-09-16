// components/preview/LandingPreview.tsx
"use client";

import * as LucideIcons from "lucide-react";
import { Check, ArrowRight } from "lucide-react";
import type { LandingPageBlueprint } from "@/types";
import { motion } from "framer-motion";

function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const IconComponent = (LucideIcons as unknown as Record<
    string,
    React.ComponentType<{ className?: string }>
  >)[name];

  if (!IconComponent) {
    return <LucideIcons.Sparkles className={className} />;
  }

  return <IconComponent className={className} />;
}

export function LandingPreview({
  blueprint,
}: {
  blueprint: LandingPageBlueprint;
}) {
  const { hero, featureGrid, pricing, cta } = blueprint;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-900 px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-red-500/70" />
        <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
        <span className="h-3 w-3 rounded-full bg-green-500/70" />
        <span className="ml-3 text-xs text-zinc-500 truncate">
          {blueprint.meta.productName.toLowerCase().replace(/\s+/g, "-") ||
            "your-landing-page"}
          .com
        </span>
      </div>

      <div className="max-h-[70vh] overflow-y-auto">
        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mx-auto max-w-3xl px-6 pt-16 pb-14 text-center"
        >
          <span className="inline-block rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-400">
            {hero.eyebrow}
          </span>
          <h1 className="mt-5 text-3xl md:text-4xl font-semibold tracking-tight text-zinc-50">
            {hero.headline}
          </h1>
          <p className="mt-4 text-zinc-400 max-w-xl mx-auto">
            {hero.subheadline}
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <button className="rounded-lg bg-white text-zinc-950 px-5 py-2.5 text-sm font-medium hover:bg-zinc-200 transition-colors">
              {hero.primaryCta}
            </button>
            <button className="rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-200 hover:bg-zinc-900 transition-colors">
              {hero.secondaryCta}
            </button>
          </div>
        </motion.section>

        {/* Feature Grid */}
        <section className="mx-auto max-w-4xl px-6 py-14 border-t border-zinc-900">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-xl font-semibold text-zinc-50">
              {featureGrid.heading}
            </h2>
            <p className="mt-2 text-sm text-zinc-400">{featureGrid.subheading}</p>
          </div>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
            {featureGrid.features.map((feature, i) => (
              <div
                key={i}
                className="rounded-lg border border-zinc-800 p-5 hover:border-zinc-700 transition-colors"
              >
                <DynamicIcon name={feature.icon} className="h-5 w-5 text-zinc-300" />
                <h3 className="mt-3 text-sm font-medium text-zinc-100">
                  {feature.title}
                </h3>
                <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section className="mx-auto max-w-4xl px-6 py-14 border-t border-zinc-900">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-xl font-semibold text-zinc-50">
              {pricing.heading}
            </h2>
            <p className="mt-2 text-sm text-zinc-400">{pricing.subheading}</p>
          </div>
          <div
            className="mt-10 grid grid-cols-1 gap-4"
            style={{
              gridTemplateColumns: `repeat(${Math.min(
                pricing.tiers.length,
                3
              )}, minmax(0, 1fr))`,
            }}
          >
            {pricing.tiers.map((tier, i) => (
              <div
                key={i}
                className={`rounded-lg border p-5 ${
                  tier.highlighted
                    ? "border-zinc-100"
                    : "border-zinc-800"
                }`}
              >
                <h3 className="text-sm font-medium text-zinc-100">{tier.name}</h3>
                <p className="mt-3 text-2xl font-semibold text-zinc-50">
                  {tier.price}
                  <span className="text-xs font-normal text-zinc-500">
                    /{tier.billingPeriod}
                  </span>
                </p>
                <p className="mt-1.5 text-xs text-zinc-400">{tier.description}</p>
                <ul className="mt-4 space-y-2">
                  {tier.features.map((f, j) => (
                    <li
                      key={j}
                      className="flex items-center gap-2 text-xs text-zinc-300"
                    >
                      <Check className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  className={`mt-5 w-full rounded-md px-4 py-2 text-xs font-medium transition-colors ${
                    tier.highlighted
                      ? "bg-white text-zinc-950 hover:bg-zinc-200"
                      : "border border-zinc-700 text-zinc-200 hover:bg-zinc-900"
                  }`}
                >
                  {tier.ctaLabel}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-3xl px-6 py-16 border-t border-zinc-900 text-center">
          <h2 className="text-2xl font-semibold text-zinc-50">{cta.headline}</h2>
          <p className="mt-3 text-sm text-zinc-400">{cta.subheadline}</p>
          <button className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white text-zinc-950 px-5 py-2.5 text-sm font-medium hover:bg-zinc-200 transition-colors">
            {cta.buttonLabel}
            <ArrowRight className="h-4 w-4" />
          </button>
        </section>
      </div>
    </div>
  );
}
