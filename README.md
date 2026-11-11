# AI Job Match Analyzer

Paste a job description and your resume to get an AI match score, your matching and missing skills, and resume bullets you can copy.

**Live demo:** [Coming soon](#) <!-- TODO: replace with deployed URL -->

![Screenshot of the AI Job Match Analyzer](docs/screenshot.png)
<!-- TODO: add a screenshot at docs/screenshot.png -->

## Features

- **Match score badge.** Shows Strong (75+), Partial (55–74) or Weak (under 55) in words as well as colour.
- **Skill gap analysis.** Matching skills appear as green chips and missing skills as red chips.
- **Suggested resume bullets.** Each has a one-click Copy button. Bullets only rephrase experience that is already in your resume.
- **Validation on both ends.** Character counters and the same Zod rules (50–15,000 characters) run in the browser and on the server.
- **Accessible UI.** Every field has a label, errors are announced to screen readers, results appear in a live region, and keyboard focus is always visible.
- **Responsive layout.** Two columns on desktop and one on mobile.
- **Rate limiting.** 10 analyses per IP per hour. Further requests get a friendly message.
- **Demo mode.** Works without an API key by returning a sample result.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router) with React 19
- TypeScript (strict mode)
- [Tailwind CSS v4](https://tailwindcss.com)
- [Groq API](https://groq.com) (`llama-3.3-70b-versatile` by default)
- [Zod](https://zod.dev) for request and AI output validation
- [Vitest](https://vitest.dev) and [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

## How it works

- **You submit** a job description and resume from the form. They're checked in the browser and sent to the `/api/analyze` route.
- **The server** checks the per-IP rate limit, validates the request with Zod and asks Groq for a JSON analysis. The Groq API key never reaches the browser.
- **The AI response** is checked against a Zod schema, and a skill can't be listed as both matching and missing. The result is then shown with the score, skills and suggested bullets.

## Run locally

Requires Node.js 22 or later.

```bash
git clone <your-repo-url>
cd ai-job-tracker
npm install
```

Create a `.env.local` file in the project root (see [Environment variables](#environment-variables)), then start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Other scripts:

```bash
npm run build   # production build (includes type checking)
npm run start   # serve the production build
npm run lint    # ESLint
```

## Environment variables

Put these in `.env.local`, which git ignores. Never commit API keys.

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | No* | Your Groq API key from [console.groq.com](https://console.groq.com/keys). |
| `GROQ_MODEL` | No | Groq model to use. Defaults to `llama-3.3-70b-versatile`. |
| `DEMO_MODE` | No | Set to `true` to return a sample result instead of calling Groq. |

\*Without `GROQ_API_KEY` the app runs in demo mode automatically.

```bash
# .env.local
GROQ_API_KEY=your_key_here
GROQ_MODEL=llama-3.3-70b-versatile
DEMO_MODE=false
```

## Tests

```bash
npm test             # run all tests once
npm run test:watch   # re-run tests on file changes
```

The test suite covers:

- the Zod schemas
- the analyze form's validation, loading and error states
- the score badge thresholds
- the API route, with the AI call mocked: 400, 200, 502 and 429 responses
- the rate limiter

> **Note:** the rate limit is kept in memory, so on serverless hosting it applies per instance. A production version would use a shared store such as Redis.

## How I built it

I built this project with [Claude Code](https://claude.com/claude-code), using plan mode to agree on a plan and layout before any code was written. I reviewed every change before accepting it. Project rules live in [`CLAUDE.md`](CLAUDE.md): server-side AI calls only, Zod validation everywhere, labelled form fields, and loading and error states for every async action. That kept the generated code consistent from one session to the next.

While testing, I noticed the AI was inventing claims in the suggested resume bullets, adding skills and results my resume never mentioned. I tightened the prompt so bullets may only rephrase what the resume actually says, and added a check in code so a skill can't appear as both matching and missing.
