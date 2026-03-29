# Nuclear AI — Frontend Dashboard

A production-ready Next.js (App Router) frontend for a nuclear reactor simulation dashboard platform.

## Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS** with dark/light theme
- **shadcn/ui** component patterns (Radix UI primitives)
- **TanStack Query** for server state management
- **React Hook Form + Zod** for forms & validation
- **Recharts** for data visualization

## Getting Started

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The app redirects to `/dashboard`.

## Project Structure

```
src/
├── app/
│   ├── globals.css         # CSS variables, theme tokens
│   ├── layout.tsx          # Root layout (theme + query providers)
│   ├── page.tsx            # Redirects → /dashboard
│   ├── auth/login/         # Login page
│   └── (app)/              # Shell-wrapped route group
│       ├── layout.tsx      # AppShell wrapper
│       ├── dashboard/      # Overview stats & recent runs
│       ├── projects/       # Project list & detail
│       │   └── [projectId]/
│       │       ├── simulation/  # 3-panel simulation workspace
│       │       └── results/[runId]/  # Full results view
│       ├── knowledge/      # Doc library & reader
│       │   └── [docId]/
│       └── settings/       # Profile & preferences
├── components/
│   ├── ui/                 # shadcn-style primitives (17 components)
│   ├── app-shell.tsx       # Sidebar + Topbar + content area
│   ├── sidebar-nav.tsx     # Collapsible left navigation
│   ├── topbar.tsx          # Breadcrumbs, search, theme toggle
│   ├── theme-provider.tsx  # Dark / light / system theme
│   └── query-provider.tsx  # TanStack Query client
├── features/
│   └── simulation/         # Parameter form, results charts, AI insights
├── lib/
│   ├── api.ts              # Typed API client (mock delays)
│   ├── hooks.ts            # TanStack Query hooks
│   ├── mock-data.ts        # All mock data (edit here to customize)
│   └── utils.ts            # cn(), formatters
└── types/
    └── index.ts            # All TypeScript interfaces
```

## Mock Data

All data lives in `src/lib/mock-data.ts`. To customize:

- **Projects**: `mockProjects` — array of 5 reactor projects (PWR, BWR, SMR, HTGR, SFR)
- **Simulations**: `mockRuns` — 6 runs with varied statuses
- **Parameters**: `defaultSimulationParameters` and `parameterPresets`
- **AI Insights**: `mockAIInsights` with predictions and anomalies
- **Knowledge Base**: `mockKnowledgeDocs` and `mockKnowledgeDocDetail`

## Connecting to a Real API

Replace the functions in `src/lib/api.ts` with actual fetch calls. The TanStack Query hooks in `src/lib/hooks.ts` will work unchanged — they consume the same return types.

## License

MIT
