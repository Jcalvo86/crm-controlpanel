# Agent Context & System Router

## 1. Executive Summary
- **Project:** Alexandria Control Panel
- **Architecture:** Next.js 14+ (App Router), TypeScript, Supabase, Tailwind CSS.
- **Goal:** Manage Control Panel.

---

## 2. Agent Roles & File Scopes

| Agent Role | Primary Responsibility | Allowed Paths | Context Specs |
| :--- | :--- | :--- | :--- |
| `@ui-agent` | Layouts, UI Components, Tailwind, Design System | `src/app/`, `src/components/`, `public/` | Read `.agents/DESIGN.md`, `.agents/skills/rules.md` |
| `@db-agent` | Schemas, Migrations, API Routes, RLS Policies | `supabase/`, `src/lib/`, `src/app/api/` | Read `.agents/skills/supabase-crud.md` |
| `@qa-agent` | Linting, Type Checking, E2E & Unit Tests | `tests/`, `*.test.ts`, `*.config.*` | Read `.agents/ANTIGRAVITY.md` |

---

## 3. Global System Rules (STRICT)

### Core Directives
- **ALWAYS:** Enforce TypeScript Strict Mode. No `any` types allowed.
- **ALWAYS:** Align numeric/financial amounts to the right using `tabular-nums` class.
- **ALWAYS:** Default to React Server Components unless client state (`useState`, `useEffect`) is mandatory.
- **NEVER:** Hardcode inline styles or use arbitrary Tailwind values (e.g., `w-[234px]`).
- **NEVER:** Import `@supabase/supabase-js` directly in UI components; use SSR client wrapper `@/lib/supabase/client`.

### Component & File Constraints
- **MAX COMPONENT SIZE:** No component or file in `src/` should exceed **150-200 lines of code**.
- **DECOMPOSITION RULE:** If a component reaches >150 lines, STOP writing feature code immediately and trigger the Refactoring Skill (`.agents/skills/component-refactoring.md`).

---

## 4. Pre-Flight Protocol: "Check Before Write" (MANDATORY)

Before generating, editing, or refactoring ANY file, every agent MUST execute these steps silently:

1. **Check File Metrics:** Measure lines of code (`wc -l`). If target file > 150 lines, trigger `component-refactoring.md`.
2. **Scan Skills Index:** Check Section 5 below to identify if a recipe/skill matches the task intent.
3. **Declare Applied Skill:** State in 1 line which skill is being loaded before printing code output (e.g., *"Using skill: component-refactoring.md"*).

---

## 5. Automatic Skill Triggers & Auto-Routing

Inspect the user prompt and file target to auto-load modules **only on demand**:

| Condition / Symptom | Action / Required Skill | Scope |
| :--- | :--- | :--- |
| Target file is > 150 LOC or JSX is overly complex | ➔ ALWAYS read `.agents/skills/component-refactoring.md` | `src/components/` |
| Creating, styling, or tokenizing UI components | ➔ Read `.agents/DESIGN.md` | `src/app/`, `src/components/` |
| Writing DB queries, Supabase actions, or migrations | ➔ Read `.agents/skills/supabase-crud.md` | `supabase/`, `src/lib/` |
| Building, testing, linting, or executing CLI commands | ➔ Read `.agents/ANTIGRAVITY.md` | Root / Terminal |
| Reviewing or recording system architecture shifts | ➔ Read/Write `.agents/decisions/` | `.agents/decisions/` |

---

## 6. Skills Quick-Index Library

- `component-refactoring.md`: Rules for decomposing large files (>150 LOC) into custom hooks and atomic sub-components.
- `supabase-crud.md`: Safe SSR data fetching, Zod schema validations, and RLS policy setup.
- `DESIGN.md`: Color tokens, typography scales, card layouts, and status pill badges for AntEater UI.

---

## 7. Task Completion Protocol (Definition of Done)

Before marking any task as resolved, every agent MUST execute this checklist:

1. **Verify Types:** Ensure zero TypeScript errors (`npm run type-check`).[cite: 2]
2. **Verify Formatting:** Ensure zero ESLint warnings on modified files.[cite: 2]
3. **Audit File Sizes:** Verify no newly created/edited file exceeds 150 LOC.
4. **Audit Context Drift:**[cite: 2]
   - Did you add/modify UI tokens or component guidelines? ➔ Update `.agents/DESIGN.md`.[cite: 2]
   - Did you change an architectural decision or schema convention? ➔ Append a 5-line summary ADR in `.agents/decisions/`.[cite: 2]