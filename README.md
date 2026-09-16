# PageCraft AI

AI landing page & UI blueprint generator. Describe a product idea in one
sentence and get a live interactive preview, conversion copywriting, and
copy-paste React + Tailwind code — generated through OpenRouter (default
model: `openrouter/auto`, so it works with free-tier models).

## Setup

```bash
npm install
cp .env.local.example .env.local
# add your OPENROUTER_API_KEY (free tier available at https://openrouter.ai/keys)
npm run dev
```

Open http://localhost:3000.

## Project structure

```
app/
  page.tsx                  # Main generator UI (prompt studio + output hub)
  layout.tsx                # Root layout, dark theme
  globals.css                # Tailwind layers
  api/generate-page/route.ts # OpenRouter fetch + JSON repair + validation
components/
  ui/button.tsx              # Shadcn-style Button primitive
  ui/tabs.tsx                # Shadcn-style Tabs primitive (Radix-based)
  preview/LandingPreview.tsx # Live interactive rendered preview
lib/
  utils.ts                   # cn() class merge helper
  json-repair.ts             # Fence stripping + JSON repair for flaky model output
  codegen.ts                 # Blueprint -> exportable .tsx string
types/
  index.ts                   # LandingPageBlueprint and API contract types
```

## How generation works

1. The user's one-line prompt is sent to `POST /api/generate-page`.
2. The route builds a strict system prompt describing the exact JSON schema
   (see `types/index.ts`) and calls OpenRouter's `/v1/chat/completions`
   with `model: "openrouter/auto"`.
3. Free-tier models frequently don't perfectly follow "JSON only"
   instructions — they add ```json fences, a sentence of preamble, or drop a
   trailing brace. `lib/json-repair.ts` tries five increasingly aggressive
   recovery strategies (fence stripping, outer-brace extraction, trailing
   comma / unquoted key repair) before giving up.
4. The parsed result is shape-checked with `isValidBlueprint()` before being
   returned, so the frontend never renders a half-formed object.
5. "Regenerate section" sends the existing blueprint back to the model and
   asks it to rewrite just one section, merging the result.

## Swapping in real Shadcn components

`components/ui/button.tsx` and `components/ui/tabs.tsx` are hand-written to
match Shadcn's generated output exactly, so this repo runs standalone
without the Shadcn CLI. To pull in the full Shadcn set instead, run:

```bash
npx shadcn@latest init
npx shadcn@latest add button tabs
```

and it will overwrite these two files with the CLI-generated versions
(same API, so nothing else needs to change).
