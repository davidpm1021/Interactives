# NgpfInteractives

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.0.4.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Creating New Features

This project includes an automated script to quickly scaffold new feature modules based on the `template-example`. This ensures consistency across all features and saves time.

### Usage

To create a new feature, run:

```bash
npm run feature <feature-name>
```

### Examples

```bash
npm run feature my-new-interactive
npm run feature BudgetCalculator
npm run feature savings_planner
```

The feature name can be provided in any format (kebab-case, PascalCase, snake_case, etc.) and will be automatically converted to the appropriate format for each use case.

### What the Script Does

1. **Creates Feature Folder Structure**
   - Copies the `template-example` structure
   - Renames files to match your feature name (kebab-case)
   - Creates `.ts`, `.html`, and `.scss` files

2. **Updates Component References**
   - Converts class names to PascalCase (e.g., `MyNewInteractive`)
   - Converts selectors to kebab-case (e.g., `app-my-new-interactive`)
   - Updates display titles to Title Case (e.g., "My New Interactive")

3. **Configures Routing**
   - Adds import statement to `app.routes.ts`
   - Adds route configuration
   - Creates route path (e.g., `/my-new-interactive`)

4. **Updates Navigation**
   - Adds a link card to the home page automatically
   - Maintains consistent styling with existing features

### File Structure Created

```
src/app/features/<feature-name>/
  ├── <feature-name>.ts        # Component TypeScript file
  ├── <feature-name>.html      # Component template
  └── <feature-name>.scss      # Component styles
```

### After Creation

1. Review the generated files in `src/app/features/<feature-name>/`
2. Customize the component content, title, and description
3. Add your interactive functionality
4. Run `npm start` and navigate to `http://localhost:4200/<feature-name>`

### Shared Components Available

All features automatically include imports for shared components:
- `TopHeader` - Consistent header across all features
- `BottomHeader` - Consistent footer across all features
- `ExampleComponent` - Example reusable component

You can remove these imports if not needed or add additional shared components as required.

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
