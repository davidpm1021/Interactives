/**
 * NGPF Dictionary Audit
 *
 * Fetches the Google Doc and compares it against the generated JSON
 * to find any discrepancies: missing terms, extra terms, corrupted data.
 *
 * Uses a separate, simpler extraction method than the parser to
 * independently verify correctness.
 *
 * Usage:
 *   npm run audit-dictionary
 */

import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

const DOCUMENT_ID = '1YH07bp18mb2fLOlJqvRMpiEAJ0oodsZRzEhEHPwjEDo';

// When invoked via `npm run ...`, cwd is the package root (`angular-interactives/`).
const PROJECT_ROOT = path.resolve(process.cwd());
const JSON_PATH = path.join(
  PROJECT_ROOT,
  'public/features/ngpf-vocabulary-flashcards/data/flashcard-vocabulary.json'
);
const CREDENTIALS_PATH = path.join(PROJECT_ROOT, 'config/google-service-account.json');

// ============================================================
// Types
// ============================================================

interface DocTerm {
  englishTerm: string;
  englishDef: string;
  spanishTerm: string;
  spanishDef: string;
  unitName: string;
  elementIndex: number;
}

interface UnitComparison {
  unitName: string;
  docTerms: string[];
  jsonTerms: string[];
  missingFromJson: string[];
  extraInJson: string[];
  matched: string[];
}

interface AuditResult {
  totalDocTerms: number;
  totalJsonTerms: number;
  unitComparisons: UnitComparison[];
  unmatchedDocSections: string[];
  corruptedTerms: { term: string; unit: string; issue: string }[];
  missingDefinitions: { term: string; unit: string }[];
  missingSpanish: { term: string; unit: string; missing: string }[];
  overallPass: boolean;
}

// ============================================================
// Google Doc fetching
// ============================================================

async function authenticate() {
  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/documents.readonly'],
  });
  return auth;
}

async function fetchDocument(auth: ReturnType<typeof google.auth.GoogleAuth.prototype.fromJSON> | any) {
  const docs = google.docs({ version: 'v1', auth });
  const response = await docs.documents.get({ documentId: DOCUMENT_ID });
  return response.data;
}

// ============================================================
// Raw document extraction (independent from parser)
// ============================================================

function extractText(paragraph: any): string {
  if (!paragraph.elements) return '';
  return paragraph.elements
    .map((el: any) => el.textRun?.content || '')
    .join('')
    .trim();
}

function getStyleType(paragraph: any): string {
  return paragraph.paragraphStyle?.namedStyleType || 'NORMAL_TEXT';
}

/**
 * Raw extraction: walk every element in the doc and build
 * a flat list of {sectionHeading, terms[]} pairs.
 * This does NOT use the parser's unit-matching logic.
 */
function extractDocSections(doc: any): Map<string, DocTerm[]> {
  const sections = new Map<string, DocTerm[]>();
  const content = doc.body?.content || [];

  let currentSection = '';
  let currentTerm: Partial<DocTerm> | null = null;
  let expectingEnglishDef = false;
  let expectingSpanishDef = false;
  let reachedGlossary = false;

  for (let i = 0; i < content.length; i++) {
    const element = content[i];
    if (!element.paragraph) continue;

    const paragraph = element.paragraph;
    const styleType = getStyleType(paragraph);
    const text = extractText(paragraph);
    if (!text) continue;

    // HEADING_1 = section boundary
    if (styleType === 'HEADING_1') {
      // Stop at glossary
      if (
        text.toLowerCase().includes('glossary') ||
        text.toLowerCase().includes('appendix') ||
        text.toLowerCase().includes('index')
      ) {
        // Save pending term
        if (currentTerm?.englishTerm && currentSection) {
          saveTerm(currentSection, currentTerm as DocTerm, sections, i);
        }
        reachedGlossary = true;
        break;
      }

      // Skip HEADING_1s that start with ENGLISH/SPANISH - these are
      // malformatted term entries, not section boundaries (e.g., "ENGLISH\tLottery")
      if (text.startsWith('ENGLISH') || text.startsWith('SPANISH')) {
        // Treat as a term entry instead of a section boundary
        // Fall through to the HEADING_2 term handling below
      } else {
        // Save pending term from previous section
        if (currentTerm?.englishTerm && currentSection) {
          saveTerm(currentSection, currentTerm as DocTerm, sections, i);
          currentTerm = null;
        }

        currentSection = text;
        if (!sections.has(currentSection)) {
          sections.set(currentSection, []);
        }
        expectingEnglishDef = false;
        expectingSpanishDef = false;
        continue;
      }
    }

    if (!currentSection) continue;

    // HEADING_2 = term entry (also catches HEADING_1 that starts with ENGLISH/SPANISH)
    if (styleType === 'HEADING_2' || text.startsWith('ENGLISH') || text.startsWith('SPANISH')) {
      if (text.startsWith('ENGLISH')) {
        // Save previous term
        if (currentTerm?.englishTerm) {
          saveTerm(currentSection, currentTerm as DocTerm, sections, i);
        }

        // Split on vertical tab (\u000b) - Google Docs soft returns within a paragraph
        const rawTerm = text.replace(/^ENGLISH[\t\s]*/, '').trim();
        const vtParts = rawTerm.split('\u000b');
        const termText = vtParts[0].trim();
        const embeddedDef = vtParts.length > 1 ? vtParts.slice(1).join(' ').trim() : '';
        currentTerm = {
          englishTerm: termText,
          englishDef: embeddedDef,
          spanishTerm: '',
          spanishDef: '',
          unitName: currentSection,
          elementIndex: i,
        };
        expectingEnglishDef = !embeddedDef;
        expectingSpanishDef = false;
        continue;
      }

      if (text.startsWith('SPANISH')) {
        // Split on vertical tab (\u000b)
        const rawTerm = text.replace(/^SPANISH[\t\s]*/, '').trim();
        const vtParts = rawTerm.split('\u000b');
        if (currentTerm) {
          currentTerm.spanishTerm = vtParts[0].trim();
          if (vtParts.length > 1) {
            currentTerm.spanishDef = vtParts.slice(1).join(' ').trim();
          }
        }
        expectingEnglishDef = false;
        expectingSpanishDef = !(vtParts.length > 1);
        continue;
      }
    }

    // Definition text (NORMAL_TEXT, or HEADING_2 that isn't a new term entry)
    // Some definitions in the doc are misformatted as HEADING_2 instead of NORMAL_TEXT
    if (
      (styleType === 'NORMAL_TEXT' ||
        (styleType === 'HEADING_2' && !text.startsWith('ENGLISH') && !text.startsWith('SPANISH'))) &&
      currentTerm
    ) {
      if (expectingEnglishDef && !currentTerm.englishDef) {
        currentTerm.englishDef = text;
        expectingEnglishDef = false;
      } else if (expectingSpanishDef && !currentTerm.spanishDef) {
        currentTerm.spanishDef = text;
        expectingSpanishDef = false;
      }
    }
  }

  // Save last pending term
  if (currentTerm?.englishTerm && currentSection && !reachedGlossary) {
    saveTerm(currentSection, currentTerm as DocTerm, sections, content.length);
  }

  return sections;
}

function saveTerm(section: string, term: DocTerm, sections: Map<string, DocTerm[]>, index: number): void {
  if (!term.englishTerm) return;
  const list = sections.get(section) || [];
  // Dedup within section
  const exists = list.some((t) => t.englishTerm.toLowerCase() === term.englishTerm.toLowerCase());
  if (!exists) {
    term.elementIndex = index;
    list.push(term);
    sections.set(section, list);
  }
}

// ============================================================
// JSON loading
// ============================================================

function loadJson(): any {
  if (!fs.existsSync(JSON_PATH)) {
    console.error(`\n❌ JSON file not found at ${JSON_PATH}`);
    console.error('   Run "npm run parse-dictionary" first.');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
}

// ============================================================
// Comparison logic
// ============================================================

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\u000b\u000c\r\n]+/g, ' ') // vertical tabs, newlines
    .replace(/\s+/g, ' ')
    .replace(/[–—]/g, '-') // normalize dashes
    .trim();
}

function matchSectionToUnit(sectionName: string, jsonUnits: any[]): any | null {
  const norm = normalize(sectionName);
  for (const unit of jsonUnits) {
    if (normalize(unit.name) === norm) return unit;
    // Flexible: ignore case of articles
    const normUnit = normalize(unit.name)
      .replace(/\b(a|an|the|to|for|of|in|and)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    const normSec = norm
      .replace(/\b(a|an|the|to|for|of|in|and)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (normUnit === normSec) return unit;
  }
  return null;
}

function runComparison(docSections: Map<string, DocTerm[]>, jsonData: any): AuditResult {
  const result: AuditResult = {
    totalDocTerms: 0,
    totalJsonTerms: jsonData.metadata.totalTerms,
    unitComparisons: [],
    unmatchedDocSections: [],
    corruptedTerms: [],
    missingDefinitions: [],
    missingSpanish: [],
    overallPass: true,
  };

  // Compare each doc section against its JSON unit
  for (const [sectionName, docTerms] of docSections) {
    result.totalDocTerms += docTerms.length;

    const jsonUnit = matchSectionToUnit(sectionName, jsonData.units);
    if (!jsonUnit) {
      // Skip non-unit sections (Table of Contents, Teacher Tips, etc.)
      if (['table of contents', 'teacher tips'].includes(sectionName.toLowerCase())) continue;
      result.unmatchedDocSections.push(sectionName);
      result.overallPass = false;
      continue;
    }

    const docTermNames = docTerms.map((t) => normalize(t.englishTerm));
    const jsonTermNames = jsonUnit.terms.map((t: any) => normalize(t.term));

    const missingFromJson = docTermNames.filter((dt) => !jsonTermNames.includes(dt));
    const extraInJson = jsonTermNames.filter((jt: string) => !docTermNames.includes(jt));
    const matched = docTermNames.filter((dt) => jsonTermNames.includes(dt));

    const comparison: UnitComparison = {
      unitName: jsonUnit.name,
      docTerms: docTerms.map((t) => t.englishTerm),
      jsonTerms: jsonUnit.terms.map((t: any) => t.term),
      missingFromJson: missingFromJson.map((n) => {
        const orig = docTerms.find((t) => normalize(t.englishTerm) === n);
        return orig?.englishTerm || n;
      }),
      extraInJson: extraInJson.map((n: string) => {
        const orig = jsonUnit.terms.find((t: any) => normalize(t.term) === n);
        return orig?.term || n;
      }),
      matched: matched.map((n) => {
        const orig = docTerms.find((t) => normalize(t.englishTerm) === n);
        return orig?.englishTerm || n;
      }),
    };

    if (missingFromJson.length > 0 || extraInJson.length > 0) {
      result.overallPass = false;
    }

    result.unitComparisons.push(comparison);

    // Check for corrupted terms (contain control chars, or term+definition merged)
    for (const jt of jsonUnit.terms) {
      if (/[\u000b\u000c]/.test(jt.term)) {
        result.corruptedTerms.push({
          term: jt.term.substring(0, 60),
          unit: jsonUnit.name,
          issue: 'Contains control characters (term/def may be merged)',
        });
        result.overallPass = false;
      }
      if (jt.definition === '(No definition provided)') {
        result.missingDefinitions.push({ term: jt.term, unit: jsonUnit.name });
        result.overallPass = false;
      }
      if (!jt.spanish.term) {
        result.missingSpanish.push({ term: jt.term, unit: jsonUnit.name, missing: 'term' });
      }
      if (!jt.spanish.definition) {
        result.missingSpanish.push({ term: jt.term, unit: jsonUnit.name, missing: 'definition' });
      }
    }
  }

  // Check for JSON units that have no matching doc section
  for (const jsonUnit of jsonData.units) {
    const hasMatch = result.unitComparisons.some((c) => c.unitName === jsonUnit.name);
    if (!hasMatch && jsonUnit.terms.length > 0) {
      result.unmatchedDocSections.push(`JSON unit "${jsonUnit.name}" has no matching doc section`);
      result.overallPass = false;
    }
  }

  return result;
}

// ============================================================
// Report
// ============================================================

function printReport(audit: AuditResult): void {
  console.log('\n' + '='.repeat(70));
  console.log('  NGPF DICTIONARY AUDIT REPORT');
  console.log('='.repeat(70));

  console.log(`\n  Doc terms (raw):  ${audit.totalDocTerms}`);
  console.log(`  JSON terms:       ${audit.totalJsonTerms}`);
  console.log(`  Units audited:    ${audit.unitComparisons.length}`);

  // Per-unit comparison
  let totalMissing = 0;
  let totalExtra = 0;

  console.log('\n' + '-'.repeat(70));
  console.log('  PER-UNIT COMPARISON');
  console.log('-'.repeat(70));

  for (const comp of audit.unitComparisons) {
    const status = comp.missingFromJson.length === 0 && comp.extraInJson.length === 0 ? '✅' : '❌';
    console.log(`\n  ${status} ${comp.unitName}`);
    console.log(
      `     Doc: ${comp.docTerms.length} terms | JSON: ${comp.jsonTerms.length} terms | Matched: ${comp.matched.length}`
    );

    if (comp.missingFromJson.length > 0) {
      totalMissing += comp.missingFromJson.length;
      console.log(`     ❌ MISSING from JSON (${comp.missingFromJson.length}):`);
      comp.missingFromJson.forEach((t) => console.log(`        - "${t}"`));
    }

    if (comp.extraInJson.length > 0) {
      totalExtra += comp.extraInJson.length;
      console.log(`     ❌ EXTRA in JSON (${comp.extraInJson.length}):`);
      comp.extraInJson.forEach((t) => console.log(`        - "${t}"`));
    }
  }

  // Unmatched sections
  if (audit.unmatchedDocSections.length > 0) {
    console.log('\n' + '-'.repeat(70));
    console.log('  UNMATCHED DOC SECTIONS');
    console.log('-'.repeat(70));
    audit.unmatchedDocSections.forEach((s) => console.log(`  ❌ ${s}`));
  }

  // Corrupted terms
  if (audit.corruptedTerms.length > 0) {
    console.log('\n' + '-'.repeat(70));
    console.log('  CORRUPTED TERMS');
    console.log('-'.repeat(70));
    audit.corruptedTerms.forEach((t) => console.log(`  ❌ [${t.unit}] "${t.term}..." - ${t.issue}`));
  }

  // Missing definitions
  if (audit.missingDefinitions.length > 0) {
    console.log('\n' + '-'.repeat(70));
    console.log('  MISSING DEFINITIONS');
    console.log('-'.repeat(70));
    audit.missingDefinitions.forEach((t) => console.log(`  ⚠️  [${t.unit}] "${t.term}"`));
  }

  // Missing Spanish
  if (audit.missingSpanish.length > 0) {
    console.log('\n' + '-'.repeat(70));
    console.log(`  MISSING SPANISH TRANSLATIONS (${audit.missingSpanish.length})`);
    console.log('-'.repeat(70));
    // Group by type
    const missingTerms = audit.missingSpanish.filter((t) => t.missing === 'term');
    const missingDefs = audit.missingSpanish.filter((t) => t.missing === 'definition');
    if (missingTerms.length > 0) {
      console.log(`  Missing Spanish terms: ${missingTerms.length}`);
      missingTerms.forEach((t) => console.log(`    - [${t.unit}] "${t.term}"`));
    }
    if (missingDefs.length > 0) {
      console.log(`  Missing Spanish definitions: ${missingDefs.length}`);
      missingDefs.forEach((t) => console.log(`    - [${t.unit}] "${t.term}"`));
    }
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('  SUMMARY');
  console.log('='.repeat(70));
  console.log(`  Missing from JSON: ${totalMissing}`);
  console.log(`  Extra in JSON:     ${totalExtra}`);
  console.log(`  Corrupted terms:   ${audit.corruptedTerms.length}`);
  console.log(`  Missing defs:      ${audit.missingDefinitions.length}`);
  console.log(`  Missing Spanish:   ${audit.missingSpanish.length}`);
  console.log(`\n  Overall: ${audit.overallPass ? '✅ PASS' : '❌ FAIL'}`);
  console.log('='.repeat(70) + '\n');
}

// ============================================================
// Main
// ============================================================

async function main() {
  console.log('🔍 NGPF Dictionary Audit\n');

  try {
    // Auth & fetch doc
    const auth = await authenticate();
    console.log('✅ Authenticated');
    const doc = await fetchDocument(auth);
    console.log(`✅ Fetched document: "${doc.title}"`);

    // Raw extraction from doc
    console.log('📄 Extracting terms from document (raw)...');
    const docSections = extractDocSections(doc);
    let docTotal = 0;
    for (const [section, terms] of docSections) {
      console.log(`   ${section}: ${terms.length} terms`);
      docTotal += terms.length;
    }
    console.log(`   Total raw terms: ${docTotal}`);

    // Load JSON
    console.log('\n📦 Loading generated JSON...');
    const jsonData = loadJson();
    console.log(`   JSON total: ${jsonData.metadata.totalTerms} terms`);

    // Compare
    console.log('\n🔎 Comparing...');
    const audit = runComparison(docSections, jsonData);

    // Report
    printReport(audit);

    process.exit(audit.overallPass ? 0 : 1);
  } catch (error: any) {
    console.error('\n❌ Error:', error.message || error);
    process.exit(1);
  }
}

main();
