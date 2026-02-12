/**
 * NGPF Dictionary Sync Orchestrator
 *
 * Runs the full sync pipeline in sequence, stopping at first failure:
 *   1. Save baseline copy of current JSON (for drift comparison)
 *   2. Run parse-dictionary → generate new JSON from Google Doc
 *   3. Run validate-dictionary → structural + content + drift checks
 *   4. Run audit-dictionary → independent cross-reference of doc vs JSON
 *   5. Report result
 *
 * Exit codes:
 *   0 = all steps passed (JSON may or may not have changed)
 *   1 = a step failed
 *
 * Usage:
 *   npm run sync-dictionary
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = process.cwd();
const JSON_PATH = path.join(
  PROJECT_ROOT,
  'public/features/ngpf-vocabulary-flashcards/data/flashcard-vocabulary.json'
);
const BASELINE_PATH = path.join(
  PROJECT_ROOT,
  'public/features/ngpf-vocabulary-flashcards/data/.flashcard-vocabulary-baseline.json'
);

// ============================================================
// Helpers
// ============================================================

function runStep(label: string, command: string): boolean {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  Step: ${label}`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    execSync(command, {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
      env: { ...process.env },
    });
    console.log(`\n✅ ${label} — passed`);
    return true;
  } catch (error: unknown) {
    const exitCode =
      error instanceof Error && 'status' in error ? (error as { status: number }).status : 1;
    console.error(`\n❌ ${label} — failed (exit code ${exitCode})`);
    return false;
  }
}

function jsonChanged(): boolean {
  if (!fs.existsSync(BASELINE_PATH)) return true;
  if (!fs.existsSync(JSON_PATH)) return false;

  const baseline = fs.readFileSync(BASELINE_PATH, 'utf-8');
  const current = fs.readFileSync(JSON_PATH, 'utf-8');
  return baseline !== current;
}

// ============================================================
// Main
// ============================================================

function main(): void {
  console.log('🚀 NGPF Dictionary Sync Pipeline\n');
  const startTime = Date.now();

  // Step 1: Save baseline
  console.log('📋 Saving baseline copy...');
  if (fs.existsSync(JSON_PATH)) {
    fs.copyFileSync(JSON_PATH, BASELINE_PATH);
    console.log(`   Baseline saved to ${path.basename(BASELINE_PATH)}`);
  } else {
    console.log('   No existing JSON — skipping baseline (first run)');
  }

  // Step 2: Parse dictionary
  const parseOk = runStep(
    'Parse Dictionary',
    'npx ts-node --project tsconfig.scripts.json --esm scripts/ngpf-vocabulary-flashcards/parse-dictionary.ts'
  );
  if (!parseOk) {
    cleanup();
    console.error('\n❌ Sync failed at: Parse Dictionary');
    process.exit(1);
  }

  // Step 3: Validate dictionary (with baseline for drift detection)
  const baselineArg = fs.existsSync(BASELINE_PATH) ? ` -- --baseline "${BASELINE_PATH}"` : '';
  const validateOk = runStep(
    'Validate Dictionary',
    `npx ts-node --project tsconfig.scripts.json --esm scripts/ngpf-vocabulary-flashcards/validate-dictionary.ts${baselineArg}`
  );
  if (!validateOk) {
    cleanup();
    console.error('\n❌ Sync failed at: Validate Dictionary');
    process.exit(1);
  }

  // Step 4: Audit dictionary
  const auditOk = runStep(
    'Audit Dictionary',
    'npx ts-node --project tsconfig.scripts.json --esm scripts/ngpf-vocabulary-flashcards/audit-dictionary.ts'
  );
  if (!auditOk) {
    cleanup();
    console.error('\n❌ Sync failed at: Audit Dictionary');
    process.exit(1);
  }

  // Step 5: Report result
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const changed = jsonChanged();

  cleanup();

  console.log(`\n${'='.repeat(60)}`);
  console.log('  SYNC RESULT');
  console.log(`${'='.repeat(60)}`);

  if (changed) {
    console.log(`\n✅ Sync completed — dictionary updated (${elapsed}s)`);
  } else {
    console.log(`\n✅ Sync completed — no changes detected (${elapsed}s)`);
  }

  process.exit(0);
}

function cleanup(): void {
  // Remove baseline temp file
  if (fs.existsSync(BASELINE_PATH)) {
    try {
      fs.unlinkSync(BASELINE_PATH);
    } catch {
      // Non-critical
    }
  }
}

main();
