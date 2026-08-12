/**
 * NGPF Dictionary Validator
 *
 * Runs three layers of checks on the generated flashcard-vocabulary.json:
 *   Layer 1 — Structural: JSON shape, required fields, correct types
 *   Layer 2 — Content heuristics: detect merged fields, truncation, header leaks
 *   Layer 3 — Drift detection: compare against previous JSON baseline
 *
 * Exit codes:
 *   0 = all checks pass
 *   1 = structural failure
 *   2 = content heuristic failure
 *   3 = drift detection failure
 *
 * Usage:
 *   npm run validate-dictionary
 *   npm run validate-dictionary -- --baseline path/to/previous.json
 */

import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = process.cwd();
const JSON_PATH = path.join(
  PROJECT_ROOT,
  'public/features/ngpf-vocabulary-flashcards/data/flashcard-vocabulary.json'
);

// Thresholds calibrated against real data (614 terms, 19 units)
const EXPECTED_UNIT_COUNT = 19;
const MAX_TERM_LENGTH = 80; // real max ~55, flag anything beyond 80
const MIN_DEFINITION_LENGTH = 15; // real min ~27, flag anything under 15
const MIN_TERMS_PER_UNIT = 5; // real min ~12, flag anything under 5
const DRIFT_TOTAL_DROP_THRESHOLD = 0.1; // flag if total terms drop > 10%
const DRIFT_UNIT_DROP_THRESHOLD = 0.3; // flag if any unit loses > 30% of terms

// ============================================================
// Types (local copies to avoid import issues with Angular tsconfig)
// ============================================================

interface SpanishTranslation {
  term: string;
  definition: string;
}

interface Term {
  id: string;
  term: string;
  definition: string;
  spanish: SpanishTranslation;
}

interface Unit {
  id: number;
  name: string;
  slug: string;
  terms: Term[];
}

interface VocabularyMetadata {
  version: string;
  generatedAt: string;
  sourceDocument: string;
  totalTerms: number;
}

interface VocabularyData {
  metadata: VocabularyMetadata;
  units: Unit[];
}

interface ValidationError {
  layer: 'structural' | 'content' | 'drift';
  message: string;
}

// ============================================================
// Helpers
// ============================================================

function parseArgs(): { baselinePath: string | null } {
  const args = process.argv.slice(2);
  const baselineIdx = args.indexOf('--baseline');
  if (baselineIdx !== -1 && args[baselineIdx + 1]) {
    return { baselinePath: args[baselineIdx + 1] };
  }
  return { baselinePath: null };
}

function loadJsonFile(filePath: string): unknown {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

// ============================================================
// Layer 1 — Structural Validation
// ============================================================

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateStructural(data: unknown): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!isRecord(data)) {
    errors.push({ layer: 'structural', message: 'Root must be a non-null object' });
    return errors;
  }

  // metadata
  const metadata = data['metadata'];
  if (!isRecord(metadata)) {
    errors.push({ layer: 'structural', message: 'Missing or invalid "metadata" object' });
  } else {
    if (typeof metadata['version'] !== 'string') {
      errors.push({ layer: 'structural', message: 'metadata.version must be a string' });
    }
    if (typeof metadata['totalTerms'] !== 'number') {
      errors.push({ layer: 'structural', message: 'metadata.totalTerms must be a number' });
    }
  }

  // units
  const units = data['units'];
  if (!Array.isArray(units)) {
    errors.push({ layer: 'structural', message: 'Missing or invalid "units" array' });
    return errors;
  }

  if (units.length !== EXPECTED_UNIT_COUNT) {
    errors.push({
      layer: 'structural',
      message: `Expected ${EXPECTED_UNIT_COUNT} units, found ${units.length}`,
    });
  }

  const allTermIds = new Set<string>();
  let actualTotalTerms = 0;

  for (let i = 0; i < units.length; i++) {
    const unit = units[i] as unknown;
    if (!isRecord(unit)) {
      errors.push({ layer: 'structural', message: `units[${i}] must be an object` });
      continue;
    }

    if (typeof unit['id'] !== 'number') {
      errors.push({ layer: 'structural', message: `units[${i}].id must be a number` });
    }
    if (typeof unit['name'] !== 'string') {
      errors.push({ layer: 'structural', message: `units[${i}].name must be a string` });
    }
    if (typeof unit['slug'] !== 'string') {
      errors.push({ layer: 'structural', message: `units[${i}].slug must be a string` });
    }

    const terms = unit['terms'];
    if (!Array.isArray(terms)) {
      errors.push({ layer: 'structural', message: `units[${i}].terms must be an array` });
      continue;
    }

    actualTotalTerms += terms.length;

    for (let j = 0; j < terms.length; j++) {
      const term = terms[j] as unknown;
      const loc = `units[${i}].terms[${j}]`;

      if (!isRecord(term)) {
        errors.push({ layer: 'structural', message: `${loc} must be an object` });
        continue;
      }

      if (typeof term['id'] !== 'string') {
        errors.push({ layer: 'structural', message: `${loc}.id must be a string` });
      } else {
        if (allTermIds.has(term['id'])) {
          errors.push({ layer: 'structural', message: `Duplicate term ID: "${term['id']}"` });
        }
        allTermIds.add(term['id']);
      }

      if (typeof term['term'] !== 'string') {
        errors.push({ layer: 'structural', message: `${loc}.term must be a string` });
      }
      if (typeof term['definition'] !== 'string') {
        errors.push({ layer: 'structural', message: `${loc}.definition must be a string` });
      }

      const spanish = term['spanish'];
      if (!isRecord(spanish)) {
        errors.push({ layer: 'structural', message: `${loc}.spanish must be an object` });
      } else {
        if (typeof spanish['term'] !== 'string') {
          errors.push({ layer: 'structural', message: `${loc}.spanish.term must be a string` });
        }
        if (typeof spanish['definition'] !== 'string') {
          errors.push({
            layer: 'structural',
            message: `${loc}.spanish.definition must be a string`,
          });
        }
      }
    }
  }

  // totalTerms cross-check
  if (isRecord(metadata) && typeof metadata['totalTerms'] === 'number') {
    if (metadata['totalTerms'] !== actualTotalTerms) {
      errors.push({
        layer: 'structural',
        message: `metadata.totalTerms (${metadata['totalTerms']}) does not match actual term count (${actualTotalTerms})`,
      });
    }
  }

  return errors;
}

// ============================================================
// Layer 2 — Content Heuristics
// ============================================================

function validateContent(data: VocabularyData): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const unit of data.units) {
    // Unit with too few terms
    if (unit.terms.length < MIN_TERMS_PER_UNIT) {
      errors.push({
        layer: 'content',
        message: `Unit "${unit.name}" has only ${unit.terms.length} terms (min: ${MIN_TERMS_PER_UNIT}) — parser may have lost a section`,
      });
    }

    for (const term of unit.terms) {
      // Term too long → likely merged with definition
      if (term.term.length > MAX_TERM_LENGTH) {
        errors.push({
          layer: 'content',
          message: `[${unit.name}] Term too long (${term.term.length} chars, max ${MAX_TERM_LENGTH}): "${term.term.substring(0, 60)}..."`,
        });
      }

      // Definition too short → likely truncated
      if (
        term.definition.length < MIN_DEFINITION_LENGTH &&
        term.definition !== '(No definition provided)'
      ) {
        errors.push({
          layer: 'content',
          message: `[${unit.name}] Definition too short (${term.definition.length} chars, min ${MIN_DEFINITION_LENGTH}): "${term.term}" → "${term.definition}"`,
        });
      }

      // Header leak: term or definition starts with ENGLISH or SPANISH
      const allFields = [
        term.term,
        term.definition,
        term.spanish.term,
        term.spanish.definition,
      ];
      for (const field of allFields) {
        // Case-sensitive on purpose. The headers this guards against are the
        // doc's literal uppercase "ENGLISH" / "SPANISH" labels, which is also
        // how parse-dictionary recognizes them. Matching case-insensitively
        // caught ordinary prose instead: the doc marks untranslated entries
        // "Spanish translation coming soon!", and every one of those was
        // reported as a leak.
        if (field && /^(ENGLISH|SPANISH)\b/.test(field)) {
          errors.push({
            layer: 'content',
            message: `[${unit.name}] Header leak detected in "${term.term}": field starts with "${field.substring(0, 20)}"`,
          });
        }
      }

      // Control character artifacts
      for (const field of allFields) {
        if (field && /[\u000b\u000c]/.test(field)) {
          errors.push({
            layer: 'content',
            message: `[${unit.name}] Control character artifact in "${term.term}": field contains \\u000b or \\u000c`,
          });
        }
      }

      // Term ends with period → probably a sentence in the wrong field
      if (term.term.endsWith('.')) {
        errors.push({
          layer: 'content',
          message: `[${unit.name}] Term ends with period (likely a sentence): "${term.term}"`,
        });
      }
    }
  }

  return errors;
}

// ============================================================
// Layer 3 — Drift Detection
// ============================================================

function validateDrift(current: VocabularyData, baseline: VocabularyData): ValidationError[] {
  const errors: ValidationError[] = [];

  const currentTotal = current.metadata.totalTerms;
  const baselineTotal = baseline.metadata.totalTerms;

  // Total term count drop
  if (baselineTotal > 0 && currentTotal < baselineTotal) {
    const dropPct = (baselineTotal - currentTotal) / baselineTotal;
    if (dropPct > DRIFT_TOTAL_DROP_THRESHOLD) {
      errors.push({
        layer: 'drift',
        message: `Total terms dropped ${(dropPct * 100).toFixed(1)}% (${baselineTotal} → ${currentTotal}), threshold: ${DRIFT_TOTAL_DROP_THRESHOLD * 100}%`,
      });
    }
  }

  // Per-unit term count drop
  const baselineMap = new Map<string, number>();
  for (const unit of baseline.units) {
    baselineMap.set(unit.slug, unit.terms.length);
  }

  for (const unit of current.units) {
    const baselineCount = baselineMap.get(unit.slug);
    const currentCount = unit.terms.length;

    if (baselineCount !== undefined && baselineCount > 0 && currentCount < baselineCount) {
      const dropPct = (baselineCount - currentCount) / baselineCount;
      if (dropPct > DRIFT_UNIT_DROP_THRESHOLD) {
        errors.push({
          layer: 'drift',
          message: `Unit "${unit.name}" lost ${(dropPct * 100).toFixed(1)}% of terms (${baselineCount} → ${currentCount}), threshold: ${DRIFT_UNIT_DROP_THRESHOLD * 100}%`,
        });
      }
    }
  }

  // Summary: added/removed/unchanged
  const baselineTermIds = new Set<string>();
  for (const unit of baseline.units) {
    for (const term of unit.terms) {
      baselineTermIds.add(term.id);
    }
  }

  const currentTermIds = new Set<string>();
  for (const unit of current.units) {
    for (const term of unit.terms) {
      currentTermIds.add(term.id);
    }
  }

  let added = 0;
  let removed = 0;
  let unchanged = 0;

  for (const id of currentTermIds) {
    if (baselineTermIds.has(id)) {
      unchanged++;
    } else {
      added++;
    }
  }
  for (const id of baselineTermIds) {
    if (!currentTermIds.has(id)) {
      removed++;
    }
  }

  console.log(`\n   Drift summary: +${added} added, -${removed} removed, ${unchanged} unchanged`);

  return errors;
}

// ============================================================
// Main
// ============================================================

function main(): void {
  console.log('🔍 NGPF Dictionary Validator\n');

  const { baselinePath } = parseArgs();

  // Load current JSON
  if (!fs.existsSync(JSON_PATH)) {
    console.error(`❌ JSON file not found: ${JSON_PATH}`);
    console.error('   Run "npm run parse-dictionary" first.');
    process.exit(1);
  }

  let data: unknown;
  try {
    data = loadJsonFile(JSON_PATH);
    console.log('✅ JSON parsed successfully');
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`❌ JSON parse error: ${msg}`);
    process.exit(1);
  }

  // Layer 1 — Structural
  console.log('\n--- Layer 1: Structural Validation ---');
  const structuralErrors = validateStructural(data);
  if (structuralErrors.length > 0) {
    console.error(`\n❌ ${structuralErrors.length} structural error(s):`);
    structuralErrors.forEach((e) => console.error(`   - ${e.message}`));
    process.exit(1);
  }
  console.log('✅ All structural checks passed');

  // After structural validation passes, we know the shape is correct
  const validData = data as VocabularyData;

  // Layer 2 — Content heuristics
  console.log('\n--- Layer 2: Content Heuristics ---');
  const contentErrors = validateContent(validData);
  if (contentErrors.length > 0) {
    console.error(`\n❌ ${contentErrors.length} content issue(s):`);
    contentErrors.forEach((e) => console.error(`   - ${e.message}`));
    process.exit(2);
  }
  console.log('✅ All content heuristic checks passed');

  // Layer 3 — Drift detection (only if baseline provided)
  if (baselinePath) {
    console.log('\n--- Layer 3: Drift Detection ---');
    if (!fs.existsSync(baselinePath)) {
      console.log('   No baseline file found — skipping drift detection');
    } else {
      let baseline: unknown;
      try {
        baseline = loadJsonFile(baselinePath);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`❌ Could not parse baseline JSON: ${msg}`);
        process.exit(3);
      }

      const driftErrors = validateDrift(validData, baseline as VocabularyData);
      if (driftErrors.length > 0) {
        console.error(`\n❌ ${driftErrors.length} drift issue(s):`);
        driftErrors.forEach((e) => console.error(`   - ${e.message}`));
        process.exit(3);
      }
      console.log('✅ Drift detection passed');
    }
  } else {
    console.log('\n--- Layer 3: Drift Detection ---');
    console.log('   No --baseline provided — skipping drift detection');
  }

  console.log('\n✅ All validation checks passed\n');
  process.exit(0);
}

main();
