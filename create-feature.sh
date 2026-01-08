#!/bin/bash

# Script to create a new feature from the template-example
# Usage: npm run feature <feature-name>

set -e  # Exit on error

if [ -z "$1" ]; then
  echo "Error: Feature name is required"
  echo "Usage: npm run feature <feature-name>"
  echo ""
  echo "Examples:"
  echo "  npm run feature my-new-feature"
  echo "  npm run feature BudgetCalculator"
  echo "  npm run feature savings_planner"
  exit 1
fi

FEATURE_NAME="$1"
FEATURES_DIR="src/app/features"
TEMPLATE_DIR="$FEATURES_DIR/template-example"

# Convert feature name to kebab-case and sanitize
# 1. Convert to lowercase
# 2. Replace spaces and underscores with hyphens
# 3. Remove all non-alphanumeric characters except hyphens
# 4. Remove leading/trailing hyphens
# 5. Replace multiple consecutive hyphens with single hyphen
FEATURE_KEBAB=$(echo "$FEATURE_NAME" | \
  tr '[:upper:]' '[:lower:]' | \
  tr '_ ' '-' | \
  sed 's/[^a-z0-9-]//g' | \
  sed 's/^-*//' | \
  sed 's/-*$//' | \
  sed 's/-\+/-/g')

# Validate the resulting kebab-case name
if [ -z "$FEATURE_KEBAB" ]; then
  echo "Error: Feature name '$FEATURE_NAME' resulted in an empty name after sanitization"
  echo "Please use only alphanumeric characters, spaces, underscores, or hyphens"
  exit 1
fi

# Check if name starts with a number (invalid for TypeScript class names)
if [[ "$FEATURE_KEBAB" =~ ^[0-9] ]]; then
  echo "Error: Feature name '$FEATURE_KEBAB' starts with a number"
  echo "TypeScript class names cannot start with numbers. Please use a letter instead."
  exit 1
fi

# Check for reserved names
RESERVED_NAMES=("test" "app" "core" "shared" "common" "node_modules")
for reserved in "${RESERVED_NAMES[@]}"; do
  if [ "$FEATURE_KEBAB" = "$reserved" ]; then
    echo "Error: '$FEATURE_KEBAB' is a reserved name. Please choose a different name."
    exit 1
  fi
done

NEW_FEATURE_DIR="$FEATURES_DIR/$FEATURE_KEBAB"

# Convert to PascalCase for class name
# Split by hyphens, capitalize first letter of each word, join
to_pascal_case() {
  echo "$1" | awk -F'-' '{
    for(i=1; i<=NF; i++) {
      printf("%s%s", toupper(substr($i,1,1)), substr($i,2))
    }
    printf("\n")
  }'
}

# Convert to Title Case for display
to_title_case() {
  echo "$1" | awk -F'-' '{
    for(i=1; i<=NF; i++) {
      printf("%s%s", toupper(substr($i,1,1)), substr($i,2))
      if(i < NF) printf(" ")
    }
    printf("\n")
  }'
}

FEATURE_PASCAL=$(to_pascal_case "$FEATURE_KEBAB")
FEATURE_TITLE=$(to_title_case "$FEATURE_KEBAB")

# Check if feature already exists
if [ -d "$NEW_FEATURE_DIR" ]; then
  echo "Error: Feature '$FEATURE_KEBAB' already exists at $NEW_FEATURE_DIR"
  exit 1
fi

# Check if template exists
if [ ! -d "$TEMPLATE_DIR" ]; then
  echo "Error: Template directory not found at $TEMPLATE_DIR"
  echo "Please ensure the template-example feature exists in src/app/features/"
  exit 1
fi

echo "Creating new feature: $FEATURE_NAME"
if [ "$FEATURE_NAME" != "$FEATURE_KEBAB" ]; then
  echo "  Sanitized to: $FEATURE_KEBAB"
fi
echo "  Kebab-case: $FEATURE_KEBAB"
echo "  PascalCase: $FEATURE_PASCAL"
echo "  Title Case: $FEATURE_TITLE"
echo ""

# Copy template directory
cp -r "$TEMPLATE_DIR" "$NEW_FEATURE_DIR"

# Rename files
cd "$NEW_FEATURE_DIR" || exit 1
mv template-example.ts "$FEATURE_KEBAB.ts"
mv template-example.html "$FEATURE_KEBAB.html"
mv template-example.scss "$FEATURE_KEBAB.scss"

# Detect OS for sed compatibility
if [[ "$OSTYPE" == "darwin"* ]]; then
  SED_INPLACE=(-i '')
else
  SED_INPLACE=(-i)
fi

# Replace content in TypeScript file
sed "${SED_INPLACE[@]}" "s/template-example/$FEATURE_KEBAB/g" "$FEATURE_KEBAB.ts"
sed "${SED_INPLACE[@]}" "s/TemplateExample/$FEATURE_PASCAL/g" "$FEATURE_KEBAB.ts"
sed "${SED_INPLACE[@]}" "s/Template Example/$FEATURE_TITLE/g" "$FEATURE_KEBAB.ts"
sed "${SED_INPLACE[@]}" "s/app-template-example/app-$FEATURE_KEBAB/g" "$FEATURE_KEBAB.ts"

# Replace content in HTML file
sed "${SED_INPLACE[@]}" "s/template-example/$FEATURE_KEBAB/g" "$FEATURE_KEBAB.html"
sed "${SED_INPLACE[@]}" "s/Template Example/$FEATURE_TITLE/g" "$FEATURE_KEBAB.html"

# Replace content in SCSS file
sed "${SED_INPLACE[@]}" "s/template-example/$FEATURE_KEBAB/g" "$FEATURE_KEBAB.scss"

cd - > /dev/null || exit 1

echo "  ✓ Created feature files in $NEW_FEATURE_DIR"

# Add route to app.routes.ts
ROUTES_FILE="src/app/app.routes.ts"

# Check if route already exists
if grep -q "path: '$FEATURE_KEBAB'" "$ROUTES_FILE"; then
  echo "  ⚠ Route for '$FEATURE_KEBAB' already exists in $ROUTES_FILE"
else
  # Use awk for precise insertion
  awk -v feature_kebab="$FEATURE_KEBAB" -v feature_pascal="$FEATURE_PASCAL" '
  /import { TemplateExample }/ {
    print
    if (!import_added) {
      print "import { " feature_pascal " } from '\''./features/" feature_kebab "/" feature_kebab "'\'';"
      import_added = 1
    }
    next
  }
  /path: .*\*\*.*/ {
    if (!route_added) {
      print "  { path: '\''" feature_kebab "'\'', component: " feature_pascal " },"
      route_added = 1
    }
    print
    next
  }
  { print }
  ' "$ROUTES_FILE" > "$ROUTES_FILE.tmp"
  
  mv "$ROUTES_FILE.tmp" "$ROUTES_FILE"
  echo "  ✓ Added route to $ROUTES_FILE"
fi

# Add link to home page
HOME_FILE="src/app/features/home/home.html"

# Check if link already exists
if grep -q "routerLink=\"/$FEATURE_KEBAB\"" "$HOME_FILE"; then
  echo "  ⚠ Link for '$FEATURE_KEBAB' already exists in $HOME_FILE"
else
  # Use awk for precise multi-line insertion
  awk -v feature_kebab="$FEATURE_KEBAB" -v feature_title="$FEATURE_TITLE" '
  /routerLink="\/template-example"/ {
    # Print current line and the following lines until we find </a>
    print
    getline
    while ($0 !~ /<\/a>/) {
      print
      getline
    }
    print  # Print the </a> line
    
    # Now add the new link card
    if (!link_added) {
      print "      <a routerLink=\"/" feature_kebab "\" class=\"link-card\">"
      print "        <h2>" feature_title "</h2>"
      print "        <p>Explore the " feature_title " feature</p>"
      print "      </a>"
      link_added = 1
    }
    next
  }
  { print }
  ' "$HOME_FILE" > "$HOME_FILE.tmp"
  
  mv "$HOME_FILE.tmp" "$HOME_FILE"
  echo "  ✓ Added link to $HOME_FILE"
fi

echo ""
echo "✓ Feature '$FEATURE_KEBAB' created successfully!"
echo ""
echo "Files created:"
echo "  - $NEW_FEATURE_DIR/$FEATURE_KEBAB.ts"
echo "  - $NEW_FEATURE_DIR/$FEATURE_KEBAB.html"
echo "  - $NEW_FEATURE_DIR/$FEATURE_KEBAB.scss"
echo ""
echo "Route: /$FEATURE_KEBAB"
echo "Component: $FEATURE_PASCAL"
echo ""
echo "Next steps:"
echo "  1. Review the generated files in $NEW_FEATURE_DIR"
echo "  2. Customize the component content and styling"
echo "  3. Run 'npm start' to test your new feature"
echo "  4. Navigate to http://localhost:4200/$FEATURE_KEBAB"
