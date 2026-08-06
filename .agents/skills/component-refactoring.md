# Skill: React Component Decomposition & Refactoring

## Objective
Split monolithic components (>200 lines) into small, single-responsibility sub-components, custom hooks, and isolated UI modules.

## Trigger Conditions
- Any file in `src/components/` or `src/app/` exceeding 200 lines.
- Complex state logic mixed directly with JSX rendering.

## Refactoring Protocol (Step-by-Step)

### Step 1: Extract Custom Hooks (Logic)
- Move state (`useState`, `useReducer`), side effects (`useEffect`), and event handlers into a dedicated hook file:
  `src/components/feature/use-[feature-name].ts`

### Step 2: Extract Sub-Components (UI)
Split the JSX layout into domain-specific atomic components inside a `components/` subfolder:
- Move table rows, cards, or form sections into independent `.tsx` files.
- Each sub-component MUST be under **80 lines of code**.

### Step 3: Enforce File Structure
Transform monolithic files into a modular directory:

src/components/commitments/
├── index.tsx                 # Main orchestrator (< 60 lines)
├── use-commitments.ts        # Custom hook for state & handlers
├── commitments-table.tsx     # Sub-component 1
├── commitments-header.tsx    # Sub-component 2
└── commitment-row.tsx        # Sub-component 3

## Token-Saving Rule for Execution
- DO NOT rewrite the entire component in a single output stream.
- Extract ONE sub-component or hook at a time.
- Verify TypeScript types before proceeding to the next file.