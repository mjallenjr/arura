# Contributing to arura

First off — **thank you** for wanting to contribute. arura is built on the idea that social media can be better, and every contribution moves us closer to that vision.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style Guide](#code-style-guide)
- [Commit Conventions](#commit-conventions)
- [Pull Request Process](#pull-request-process)
- [Project Architecture](#project-architecture)
- [Good First Issues](#good-first-issues)

---

## Code of Conduct

Be kind. Be respectful. We're all here to build something meaningful. Harassment, discrimination, or toxic behavior of any kind will not be tolerated.

---

## Getting Started

### Prerequisites

- **Node.js** 18+ and **npm** (or **bun**)
- A **Supabase** project (free tier works)
- Git

### Setup

```bash
# 1. Fork & clone
git clone https://github.com/YOUR_USERNAME/arura.git
cd arura

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY

# 4. Start dev server
npm run dev

# 5. Run tests
npm test
```

---

## Development Workflow

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. **Make your changes** — keep them focused and atomic
3. **Test locally** — ensure `npm run build` succeeds and tests pass
4. **Commit** using our [commit conventions](#commit-conventions)
5. **Push** and open a Pull Request

---

## Code Style Guide

### TypeScript

- **Strict mode** is enabled — no `any` types unless absolutely necessary (and add a comment explaining why)
- Use **functional components** with hooks — no class components
- Prefer **named exports** for components, **default exports** for pages
- Use **`const`** by default; only use `let` when reassignment is needed

```tsx
// ✅ Good
const SignalCard = ({ signal }: { signal: Signal }) => {
  const [isVisible, setIsVisible] = useState(true);
  return <div className="rounded-2xl bg-card p-4">...</div>;
};

// ❌ Bad
var SignalCard = function(props) {
  let visible = true;
  return <div style={{background: 'black'}}>...</div>;
};
```

### React Patterns

- **Custom hooks** go in `src/hooks/` — prefix with `use`
- **Keep components small** — if a component exceeds ~150 lines, split it
- **Colocate** related components in feature folders (e.g., `src/components/feed/`)
- Use **early returns** for loading/error states

```tsx
// ✅ Good
const FeedView = () => {
  const { data, isLoading, error } = useFeedData();

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorState />;

  return <FeedList data={data} />;
};
```

### Styling (Tailwind CSS)

- **Always use semantic design tokens** — never hardcode colors
- Use the design system defined in `src/index.css` and `tailwind.config.ts`
- Prefer Tailwind utility classes over custom CSS

```tsx
// ✅ Good — uses design tokens
<div className="bg-card text-foreground border-border rounded-2xl">

// ❌ Bad — hardcoded colors
<div className="bg-gray-900 text-white border-gray-700 rounded-2xl">
```

| Token | Usage |
|---|---|
| `bg-background` | Page backgrounds |
| `bg-card` | Cards, surfaces |
| `text-foreground` | Primary text |
| `text-muted-foreground` | Secondary text |
| `bg-primary` | Accent buttons, highlights |
| `text-primary` | Accent text |
| `border-border` | Borders, dividers |
| `bg-destructive` | Error states |

### Animations

- Use **Framer Motion** for all animations
- Keep transitions under **700ms** for UI interactions
- Use the project's easing curve: `[0.2, 0.8, 0.2, 1]`

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
>
```

### File Naming

| Type | Convention | Example |
|---|---|---|
| Components | PascalCase | `FeedPlayer.tsx` |
| Hooks | camelCase with `use` prefix | `useCamera.ts` |
| Utilities | camelCase | `feed-types.ts` |
| Pages | PascalCase | `Discover.tsx` |
| Tests | `.test.ts` / `.test.tsx` suffix | `useAuth.test.ts` |

---

## Commit Conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <short description>

[optional body]
```

### Types

| Type | When to use |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `style` | Formatting, missing semicolons, etc. (no code change) |
| `docs` | Documentation only |
| `test` | Adding or updating tests |
| `chore` | Build process, tooling, dependencies |
| `perf` | Performance improvement |

### Examples

```
feat: add haptic feedback to signal interactions
fix: resolve media fallback not showing on expired signals
docs: update README with new contributor guide
refactor: extract heat badge into standalone component
```

---

## Pull Request Process

1. **Title** should follow commit conventions (e.g., `feat: add voice signal support`)
2. **Description** should include:
   - What changed and why
   - Screenshots or screen recordings for UI changes
   - Any breaking changes
3. **Keep PRs small** — under 400 lines changed is ideal
4. **All checks must pass** — build, lint, and tests
5. A maintainer will review within 48 hours

### PR Template

```markdown
## What

Brief description of changes.

## Why

Context and motivation.

## Screenshots

(if applicable)

## Checklist

- [ ] Tests pass (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] No hardcoded colors — uses design tokens
- [ ] Components are under 150 lines
- [ ] Commit messages follow conventions
```

---

## Project Architecture

```
src/
├── components/          # Shared UI components
│   ├── feed/            # Feed-specific (FeedPlayer, HeatBadge, etc.)
│   ├── onboarding/      # Onboarding demos & flows
│   └── ui/              # shadcn/ui primitives (don't edit directly)
├── hooks/               # Custom hooks (useAuth, useCamera, etc.)
├── pages/               # Top-level route pages
├── lib/                 # Utilities, constants, type definitions
│   ├── feed-types.ts    # Signal & feed type definitions
│   ├── vibes.ts         # Vibe/interest data & search
│   ├── sounds.ts        # Audio utilities
│   └── utils.ts         # General helpers
└── integrations/        # Auto-generated — DO NOT EDIT
    └── supabase/        # Client & types (managed by Lovable Cloud)

supabase/
├── functions/           # Deno edge functions
└── config.toml          # Project config (auto-managed)
```

### Key Principles

- **`src/integrations/`** is auto-generated — never edit these files manually
- **Edge functions** in `supabase/functions/` are Deno TypeScript
- **shadcn/ui** components in `src/components/ui/` should only be customized via variants, not direct edits
- **State management** uses React Query (`@tanstack/react-query`) + Supabase realtime subscriptions

---

## Good First Issues

Looking for a place to start? Try one of these:

- 🎨 **Improve accessibility** — add ARIA labels to the signal player controls
- 🌍 **Add i18n support** — extract hardcoded strings into a translation system
- 📱 **Better offline UX** — improve the offline banner with retry logic
- 🧪 **Write tests** — increase coverage for hooks like `useFeedData` and `useCamera`
- ✨ **Micro-interactions** — add subtle animations to the heat badge tier transitions

---

## Questions?

Open a [Discussion](https://github.com/YOUR_USERNAME/arura/discussions) or reach out in Issues. No question is too small.

**Let's build something that matters. 🔥**
