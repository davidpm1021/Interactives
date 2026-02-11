# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## CRITICAL: Feature Isolation Rule

**DO NOT modify files outside of the specific feature folder without explicit user permission.**

Each interactive feature must be self-contained within its folder under `src/app/features/<feature-name>/`. This includes:
- All components, services, and models specific to the feature
- Feature-specific scripts (e.g., data parsers) in a `scripts/` subfolder
- Feature-specific assets in `public/features/<feature-name>/`

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
│   ├── features/                    # Each interactive is self-contained here
│   │   └── <feature-name>/
│   │       ├── components/          # Feature-specific components
│   │       ├── services/            # Feature-specific services
│   │       ├── models/              # Feature-specific interfaces/types
│   │       ├── scripts/             # Feature-specific build/data scripts
│   │       ├── <feature-name>.ts    # Main feature component
│   │       ├── <feature-name>.html
│   │       └── <feature-name>.scss
│   ├── shared/                      # Components used by ALL features
│   └── app.routes.ts                # Route definitions
├── styles.scss                      # Global styles (CSS variables, reusable classes)
public/
├── features/                        # Feature-specific static assets
│   └── <feature-name>/
│       └── data/                    # Feature-specific data files
├── ngpf-logo.svg                    # Shared assets
└── favicon.ico
config/                              # Credentials (git-ignored)
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

## Build Configuration

- Production output: `../dev.ngpf.org/public_html/interactives`
- Build budgets: 500KB initial warning, 4KB per component style warning
