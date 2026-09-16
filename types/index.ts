// types/index.ts
// Core data contracts shared between the API route, the generator UI,
// the live preview renderer, and the exported-code generator.

export interface HeroBlock {
  eyebrow: string;
  headline: string;
  subheadline: string;
  primaryCta: string;
  secondaryCta: string;
}

export interface FeatureItem {
  icon: string; // Lucide icon name, e.g. "Zap", "ShieldCheck"
  title: string;
  description: string;
}

export interface FeatureGridBlock {
  heading: string;
  subheading: string;
  features: FeatureItem[];
}

export interface PricingTier {
  name: string;
  price: string;
  billingPeriod: string;
  description: string;
  features: string[];
  ctaLabel: string;
  highlighted: boolean;
}

export interface PricingBlock {
  heading: string;
  subheading: string;
  tiers: PricingTier[];
}

export interface CtaBlock {
  headline: string;
  subheadline: string;
  buttonLabel: string;
}

export interface CopyBlock {
  toneOfVoice: string;
  valuePropositions: string[];
  headlineVariants: string[];
  ctaVariants: string[];
}

export interface LandingPageMeta {
  productName: string;
  tagline: string;
  targetAudience: string;
  industry: string;
}

export interface LandingPageBlueprint {
  meta: LandingPageMeta;
  hero: HeroBlock;
  featureGrid: FeatureGridBlock;
  pricing: PricingBlock;
  cta: CtaBlock;
  copy: CopyBlock;
}

export type SectionKey = "hero" | "featureGrid" | "pricing" | "cta" | "copy";

export interface GeneratePageRequest {
  prompt: string;
  /** When present, only this section is regenerated and merged into the existing blueprint. */
  regenerateSection?: SectionKey;
  /** The current blueprint, required when regenerateSection is set. */
  existingBlueprint?: LandingPageBlueprint;
  model?: string;
}

export interface GeneratePageResponse {
  success: boolean;
  data?: LandingPageBlueprint;
  error?: string;
  rawModelOutput?: string;
}
