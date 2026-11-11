# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

- `npm run dev` — start the dev server at http://localhost:3000 (Turbopack)
- `npm run build` — production build (also runs type checking)
- `npm run start` — serve the production build
- `npm run lint` — ESLint (flat config in `eslint.config.mjs`, Next core-web-vitals + TypeScript rules)
- `npx tsc --noEmit` — type-check without building

No test runner is configured yet.

## Stack and architecture

- **Next.js 16 (App Router)** with React 19. Routes live in `src/app/`. `next.config.ts` enables `cacheComponents` and `partialPrefetching`, so caching and prefetch behaviour differs from older Next.js versions. Check `node_modules/next/dist/docs/` before using Next APIs (see AGENTS.md above).
- **Tailwind CSS v4**, configured CSS-first in `src/app/globals.css` (`@import "tailwindcss"` + `@theme inline`). There is no `tailwind.config.js`. Styles are loaded through the `@tailwindcss/turbopack` loader set in `next.config.ts`.
- **Gemini** via `@google/genai`. The API key and model name come from `GEMINI_API_KEY` and `GEMINI_MODEL` (default `gemini-2.5-flash`) in `.env.local`.
- **Zod** (v4) for runtime validation.
- Import alias `@/*` → `src/*`.

## Project rules

- This is an AI Job Analyzer + Tracker built with Next.js App Router, TypeScript strict mode and Tailwind CSS.
- All AI calls happen server-side in API routes or server actions; never call Gemini from the browser.
- Validate all request bodies and all AI output with Zod.
- Components live in `src/components` and stay small and focused.
- Every form field has a visible label, and every async action has loading and error states.
- Never commit `.env` files or API keys.
- Explain non-obvious code with short comments.
