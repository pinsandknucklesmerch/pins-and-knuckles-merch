<!-- headroom:rtk-instructions -->
# RTK (Rust Token Killer) - Token-Optimized Commands

When running shell commands, **always prefix with `rtk`**. This reduces context
usage by 60-90% with zero behavior change. If rtk has no filter for a command,
it passes through unchanged — so it is always safe to use.

## Key Commands
```bash
# Git (59-80% savings)
rtk git status          rtk git diff            rtk git log

# Files & Search (60-75% savings)
rtk ls <path>           rtk read <file>         rtk grep <pattern>
rtk find <pattern>      rtk diff <file>

# Test (90-99% savings) — shows failures only
rtk pytest tests/       rtk cargo test          rtk test <cmd>

# Build & Lint (80-90% savings) — shows errors only
rtk tsc                 rtk lint                rtk cargo build
rtk prettier --check    rtk mypy                rtk ruff check

# Analysis (70-90% savings)
rtk err <cmd>           rtk log <file>          rtk json <file>
rtk summary <cmd>       rtk deps                rtk env

# GitHub (26-87% savings)
rtk gh pr view <n>      rtk gh run list         rtk gh issue list

# Infrastructure (85% savings)
rtk docker ps           rtk kubectl get         rtk docker logs <c>

# Package managers (70-90% savings)
rtk pip list            rtk pnpm install        rtk npm run <script>
```

## Rules
- In command chains, prefix each segment: `rtk git add . && rtk git commit -m "msg"`
- For debugging, use raw command without rtk prefix
- `rtk proxy <cmd>` runs command without filtering but tracks usage
<!-- /headroom:rtk-instructions -->

## Pins Hub Project Rules

- Use Next.js App Router, TypeScript, Tailwind CSS, and Supabase.
- Do not add Prisma or expose service-role credentials in application code.
- Keep external API credentials server-only. Never use `NEXT_PUBLIC_` for tokens, Monday API keys, or other secrets.
- Preserve existing Supabase Auth, SSR cookie handling, migrations, and Pins Hub access control unless the user explicitly approves a change.
- Place feature work under `src/features/<feature-name>/` with `components/`, `data/`, `lib/`, and `types.ts` as needed.
- Keep business logic, API clients, data mapping, and KPI calculations out of page files and presentational UI components.
- Prefer server components for initial data loading where practical; keep client components for forms and interactive controls.
- Reuse shared components from `src/components/ui`, `src/components/layout`, and feature component folders instead of repeating JSX and Tailwind classes.
- Every data surface must handle loading, empty, and error states with existing shared state components where practical.
- Keep UI compact, dark, and operational. Do not add descriptions, subtitles, helper paragraphs, decorative badges, hero sections, or marketing copy unless explicitly requested.
- Before handing off code changes, run `npm run lint`, `npx tsc --noEmit`, and `npm run build`.
