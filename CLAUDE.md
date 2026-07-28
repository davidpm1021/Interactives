# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## CRITICAL: Isolation Rules

**DO NOT modify files outside of the specific feature or infographic folder without explicit user permission.**

The project has two content categories, each with its own isolation rule:

### Feature Isolation Rule

Each interactive feature must be self-contained within its folder under `src/app/features/<feature-name>/`. This includes:
- All components, services, and models specific to the feature
- Feature-specific scripts (e.g., data parsers) in a `scripts/` subfolder
- Feature-specific assets in `public/features/<feature-name>/`

### Infographic Isolation Rule

Each infographic must be self-contained within its folder under `src/app/infographics/<name>/`. Infographics are static print-ready posters with **their own visual system** — they may freely deviate from the global styling used by features, but must NOT touch `src/styles.scss` or `src/app/shared/`.

- Infographics use the **NGPF token superset** in `src/app/infographics/_infographic-tokens.scss` (all vars are aliases of the same brand colors used in the global sheet, so nothing renders inconsistently).
- Shared infographic helpers (coverage bars, tradeoff arrows, etc.) live in `src/app/infographics/_infographic-base.scss`.
- Full-bleed page — no `TopHeader` or `BottomHeader`.
- Assets in `public/infographics/<name>/`.
- 800-px fixed poster width per the design spec; page background frames the poster.

**NEW infographics: co-locate images in `src/app/infographics/<name>/images/`, not `public/`.** The first infographic (`premiums-deductibles-limits`) puts backgrounds in `public/` and works around it with a hardcoded `/interactives/` prefix in SCSS. From the next infographic on, put component-rendered images (hero photos, pattern tiles, logos referenced from SCSS `background-image` or template `<img>`) *inside* the component folder under an `images/` subfolder. Reference them with relative paths like `url('./images/hero.jpg')`. This lets esbuild hash them for cache-busting, works identically in dev and prod, and avoids the `<base href>` / route-collision issues that bit the first one. Reserve `public/infographics/<name>/` only for fetched data or downloadable files (e.g. a print-ready PDF).

### What belongs IN the feature folder:
- Components, services, models, pipes specific to this feature
- Feature-specific scripts and utilities
- Feature-specific data files (via `public/features/<feature-name>/`)

### What belongs OUTSIDE (shared locations):
- `src/app/shared/` - Components used by ALL features (TopHeader, BottomHeader)
- `src/styles.scss` - Global styles, CSS variables, reusable classes
- `public/` root - Assets used by ALL features (logo, favicon)
- `config/` - Credentials and configuration (git-ignored)

### When changes outside features are allowed:
1. Adding a new route in `app.routes.ts` (required for new features)
2. Modifying shared components that ALL features use (requires permission)
3. Adding global styles that benefit ALL features (requires permission)
4. Initial project setup or architectural changes (requires permission)

**Always ask before modifying:** `src/app/shared/`, `src/styles.scss`, `angular.json`, `package.json`

---

## Project Overview

NGPF Interactives is an Angular 21 web application for hosting interactive educational tools for financial literacy. Built with standalone components (no NgModules).

## Commands

```bash
npm start                    # Dev server at http://localhost:4200
npm test                     # Run Vitest tests
npm run build                # Production build
npm run production           # Production build with ngpf.org base-href
npm run feature <name>       # Scaffold new feature (see below)
```

## Creating New Features

Use the automated feature script:
```bash
npm run feature my-budget-calculator
```

This copies `template-example/`, renames files to kebab-case, updates class names to PascalCase, adds the route to `app.routes.ts`, and adds a navigation link to the home page.

Reserved names that cannot be used: test, app, core, shared, common, node_modules

## Architecture

### Directory Structure
```
src/
├── app/
│   ├── features/                        # Interactive features, self-contained
│   │   └── <feature-name>/
│   │       ├── components/              # Feature-specific components
│   │       ├── services/                # Feature-specific services
│   │       ├── models/                  # Feature-specific interfaces/types
│   │       ├── scripts/                 # Feature-specific build/data scripts
│   │       ├── <feature-name>.ts        # Main feature component
│   │       ├── <feature-name>.html
│   │       └── <feature-name>.scss
│   ├── infographics/                    # Static print-ready posters
│   │   ├── _infographic-tokens.scss     # Full NGPF token superset
│   │   ├── _infographic-base.scss       # Shared poster helpers
│   │   └── <name>/
│   │       ├── <name>.ts
│   │       ├── <name>.html
│   │       └── <name>.scss
│   ├── shared/                          # Components used by ALL features
│   └── app.routes.ts                    # Route definitions
├── styles.scss                          # Global styles (CSS variables, reusable classes)
public/
├── features/                            # Feature-specific static assets
│   └── <feature-name>/
│       └── data/                        # Feature-specific data files
├── infographics/                        # Infographic-specific static assets
│   └── <name>/                          # (photos, logos, pattern tiles)
├── ngpf-logo.svg                        # Shared assets
└── favicon.ico
config/                                  # Credentials (git-ignored)
```

### Component Pattern
All components are standalone. Import dependencies directly in the component:

```typescript
@Component({
  selector: 'app-feature-name',
  standalone: true,
  imports: [TopHeader, BottomHeader],
  templateUrl: './feature-name.html',
  styleUrl: './feature-name.scss'
})
export class FeatureName {
  protected readonly title = 'Feature Title';
}
```

### Template Pattern
Features wrap content in a div matching the component name, with TopHeader and BottomHeader:

```html
<app-top-header></app-top-header>
<div class="feature-name">
  <div class="content">
    <h2>{{ title }}</h2>
    <!-- content -->
  </div>
</div>
<app-bottom-header></app-bottom-header>
```

### SCSS Pattern
```scss
.feature-name {
  min-height: calc(100vh - 80px);
  padding: 2rem;

  .content {
    max-width: 1200px;
    margin: 0 auto;
  }
}
```

## Code Style

- SCSS is mandatory for all components (configured in angular.json)
- Strict TypeScript enabled - no `any` types, strict null checks
- Use `protected` or `private` for component properties
- Kebab-case for files/selectors, PascalCase for classes
- Single quotes, 100 char line width (Prettier config in package.json)

## Styling: Use Global Tokens & Classes By Default

Every new component MUST reuse the global design system before rolling anything
custom. The global tokens and classes live in `src/styles.scss` and are listed
in the memory file at
`.claude/projects/D--Cursor-Projects-NGPFInteractives/memory/MEMORY.md`.
Deviate only when the design genuinely calls for it, and leave a comment
explaining why.

**Buttons — always use global classes:**
- Primary CTA (Next / Show me / Finish): `class="ngpf-btn ngpf-btn-primary"`
- Secondary/back/cancel: `class="ngpf-btn ngpf-btn-secondary"`
- Outline / success / danger variants: `.ngpf-btn-outline`, `.ngpf-btn-success`,
  `.ngpf-btn-danger`.
- Do NOT redefine button padding, border-radius, font-size, background, or
  hover color in a component's SCSS. If a button needs to be smaller or a
  different shape, that's usually a sign it isn't a button — reach for a
  chip / toggle / icon-control pattern instead, and if the design still calls
  for it, use a distinct class name (e.g. `.play-btn`, `.wait-toggle`).
- If you DO create a specialized control that looks button-like (icon button,
  segmented toggle, chip), reuse the CTA blues: base = `--ngpf-bright-blue`,
  hover = `--ngpf-royal-blue`. Two different "action blues" in one flow reads
  as a mistake to users.
- If a global class doesn't apply visually against the page background (e.g.
  `.ngpf-btn-secondary` blends into `--ngpf-soft-blue-tint`), override
  LOCALLY in the feature's SCSS with a scoped `::ng-deep` rule, not by
  replacing the class.

**Colors — use design tokens:**
- Always use `var(--ngpf-*)` custom properties (see MEMORY.md for the full
  list). Never hardcode hex colors like `#333`, `#555`, `#ddd`, `#eee` in
  component SCSS. If a shade you need doesn't exist as a token, ask before
  adding one to `styles.scss`.
- Never use raw `rgba(31, 59, 155, 0.08)` etc. — use the tinted tokens
  (`--ngpf-soft-blue-tint`, `--ngpf-ice-blue`).

**Spacing, radii, shadows — use the token scales:**
- `--ngpf-spacing-{xs,sm,md,lg,xl,xxl}`, `--ngpf-radius-{sm,md,lg}`,
  `--ngpf-shadow-{sm,md,lg}`. Ad-hoc pixel values are fine only for
  chart-internal geometry (SVG coordinates, d3 dimensions, etc.).

When touching an existing component that violates these rules, prefer fixing
the violations over adding new ones on top.

## Git Workflow

- **Never commit directly to main.** Always use a feature branch.
- Each feature has its own branch (e.g., `compound-interest`, `check-writing`, `your-first-year`).
- Changes to the home page tiles (`src/app/features/home/home.html`) go on the `home-cleanup` branch.

## Build Configuration

- Production output: `../dev.ngpf.org/public_html/interactives`
- Build budgets: 500KB initial warning, 4KB per component style warning
