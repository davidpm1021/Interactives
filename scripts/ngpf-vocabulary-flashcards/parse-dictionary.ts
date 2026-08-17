/**
 * NGPF Personal Finance Dictionary Parser
 *
 * Feature-specific script for the Vocabulary Flashcards interactive.
 * Fetches the NGPF dictionary Google Doc and converts it to flashcard-vocabulary.json
 *
 * Usage:
 *   npm run parse-dictionary
 *
 * Output:
 *   public/features/ngpf-vocabulary-flashcards/data/flashcard-vocabulary.json
 *
 * Setup:
 *   1. Place Google Service Account credentials at config/google-service-account.json
 *   2. Share the Google Doc with the service account email (read-only)
 */

import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

// Document configuration
const DOCUMENT_ID = '1YH07bp18mb2fLOlJqvRMpiEAJ0oodsZRzEhEHPwjEDo';

// When invoked via `npm run ...`, cwd is the package root (`angular-interactives/`).
const PROJECT_ROOT = path.resolve(process.cwd());
const OUTPUT_PATH = path.join(
  PROJECT_ROOT,
  'public/features/ngpf-vocabulary-flashcards/data/flashcard-vocabulary.json'
);
const CREDENTIALS_PATH = path.join(PROJECT_ROOT, 'config/google-service-account.json');

// Unit definitions - 11 main units + 8 mini units
const UNITS = [
  // Main units
  { id: 1, name: 'Behavioral Economics', slug: 'behavioral-economics' },
  { id: 2, name: 'Banking', slug: 'banking' },
  { id: 3, name: 'Investing', slug: 'investing' },
  { id: 4, name: 'Types of Credit', slug: 'types-of-credit' },
  { id: 5, name: 'Managing Credit', slug: 'managing-credit' },
  { id: 6, name: 'Paying for College', slug: 'paying-for-college' },
  { id: 7, name: 'Career', slug: 'career' },
  { id: 8, name: 'Insurance', slug: 'insurance' },
  { id: 9, name: 'Taxes', slug: 'taxes' },
  { id: 10, name: 'Budgeting', slug: 'budgeting' },
  { id: 11, name: 'Consumer Skills', slug: 'consumer-skills' },
  // Mini units
  { id: 12, name: 'Alternatives to a 4-Year Colleges', slug: 'alternatives-to-4-year-colleges' },
  { id: 13, name: 'Buying A Car', slug: 'buying-a-car' },
  { id: 14, name: 'Buying a House', slug: 'buying-a-house' },
  { id: 15, name: 'Cryptocurrency', slug: 'cryptocurrency' },
  { id: 16, name: 'Entrepreneurship', slug: 'entrepreneurship' },
  { id: 17, name: 'Gambling and Sports Betting', slug: 'gambling-and-sports-betting' },
  { id: 18, name: 'Philanthropy', slug: 'philanthropy' },
  { id: 19, name: 'Racial Discrimination in Finance', slug: 'racial-discrimination-in-finance' },
];

// TypeScript interfaces matching the app's models
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

/**
 * Authenticate with Google using service account credentials
 */
async function authenticate() {
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    console.error(`\n❌ Error: Service account credentials not found at ${CREDENTIALS_PATH}`);
    console.error('\nSetup instructions:');
    console.error('  1. Create a Google Cloud project and enable the Google Docs API');
    console.error('  2. Create a service account and download the credentials JSON');
    console.error('  3. Place the credentials at config/google-service-account.json');
    console.error('  4. Share the NGPF dictionary doc with the service account email');
    process.exit(1);
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/documents.readonly'],
  });

  return auth;
}

/**
 * Fetch the Google Doc content
 */
async function fetchDocument(auth: any) {
  const docs = google.docs({ version: 'v1', auth });

  console.log('📄 Fetching Google Doc...');
  const response = await docs.documents.get({
    documentId: DOCUMENT_ID,
  });

  return response.data;
}

/**
 * Extract text content from a paragraph element
 */
function extractText(paragraph: any): string {
  if (!paragraph.elements) return '';

  return paragraph.elements
    .map((element: any) => {
      if (element.textRun && element.textRun.content) {
        return element.textRun.content;
      }
      return '';
    })
    .join('')
    .trim();
}

/**
 * Get the paragraph style type
 */
function getStyleType(paragraph: any): string {
  return paragraph.paragraphStyle?.namedStyleType || 'NORMAL_TEXT';
}

/**
 * Find matching unit by name (flexible matching)
 */
function findUnit(text: string): (typeof UNITS)[0] | null {
  const normalizedText = text.toLowerCase().trim();

  for (const unit of UNITS) {
    const unitNameLower = unit.name.toLowerCase();
    // Exact match
    if (normalizedText === unitNameLower) {
      return unit;
    }
    // Flexible match for variations (e.g., "Paying For College" vs "Paying for College")
    if (normalizedText.replace(/\s+/g, ' ') === unitNameLower.replace(/\s+/g, ' ')) {
      return unit;
    }
    // Match ignoring case differences in articles/prepositions
    const normalizeForCompare = (s: string) =>
      s
        .toLowerCase()
        .replace(/\s+(a|an|the|to|for|of|in|and)\s+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    if (normalizeForCompare(normalizedText) === normalizeForCompare(unitNameLower)) {
      return unit;
    }
  }

  return null;
}

/**
 * Check if heading indicates end of vocabulary content (glossary, appendix, etc.)
 */
function isEndOfVocabulary(text: string): boolean {
  const normalizedText = text.toLowerCase().trim();
  const endMarkers = ['glossary', 'translation glossary', 'appendix', 'index', 'references', 'additional resources'];

  return endMarkers.some((marker) => normalizedText.includes(marker));
}

/**
 * Parse the document content to extract vocabulary entries
 */
function parseDocumentContent(doc: any): Map<string, Term[]> {
  const unitTerms = new Map<string, Term[]>();

  // Initialize all units
  for (const unit of UNITS) {
    unitTerms.set(unit.slug, []);
  }

  const content = doc.body?.content || [];
  console.log('🔍 Parsing document structure...');

  let currentUnit: (typeof UNITS)[0] | null = null;
  let currentEnglishTerm = '';
  let currentEnglishDef = '';
  let currentSpanishTerm = '';
  let currentSpanishDef = '';
  let expectingEnglishDef = false;
  let expectingSpanishDef = false;
  const termCounter = new Map<string, number>();

  for (const element of content) {
    if (!element.paragraph) continue;

    const paragraph = element.paragraph;
    const styleType = getStyleType(paragraph);
    const text = extractText(paragraph);

    if (!text) continue;

    // Check for unit heading (HEADING_1)
    if (styleType === 'HEADING_1') {
      // Check if we've hit the glossary/appendix section - stop parsing
      if (isEndOfVocabulary(text)) {
        console.log(`   🛑 Reached end marker: "${text}" - stopping parse`);
        if (currentUnit && currentEnglishTerm) {
          saveTerm();
        }
        break;
      }

      // Save any pending term before switching units
      if (currentUnit && currentEnglishTerm) {
        saveTerm();
      }

      // Check if this HEADING_1 is actually a term entry (starts with ENGLISH/SPANISH)
      // Some entries in the doc are misformatted as HEADING_1 instead of HEADING_2
      if (text.startsWith('ENGLISH') || text.startsWith('SPANISH')) {
        // Fall through to the HEADING_2 term handling below
      } else {
        const unit = findUnit(text);
        if (unit) {
          currentUnit = unit;
          console.log(`   📁 Found unit: ${unit.name}`);
        } else {
          console.log(
            `   ⚠️  Unmatched HEADING_1: "${text}" (staying in ${currentUnit?.name || 'none'})`
          );
        }
        continue;
      }
    }

    // Check for term entries (HEADING_2, or HEADING_1 that starts with ENGLISH/SPANISH)
    if ((styleType === 'HEADING_2' || text.startsWith('ENGLISH') || text.startsWith('SPANISH')) && currentUnit) {
      // Check if it's an English term
      if (text.startsWith('ENGLISH')) {
        // Save previous term if exists
        if (currentEnglishTerm) {
          saveTerm();
        }

        // Extract English term (after "ENGLISH" and tab/space)
        // Split on vertical tab (\u000b) - Google Docs soft returns within a paragraph
        const rawTerm = text.replace(/^ENGLISH[\t\s]*/, '').trim();
        const vtParts = rawTerm.split('\u000b');
        const termPart = vtParts[0].trim();
        currentEnglishTerm = termPart;
        // If definition is embedded after a vertical tab, capture it
        currentEnglishDef = vtParts.length > 1 ? vtParts.slice(1).join(' ').trim() : '';
        currentSpanishTerm = '';
        currentSpanishDef = '';
        expectingEnglishDef = !currentEnglishDef;
        expectingSpanishDef = false;
        continue;
      }

      // Check if it's a Spanish term
      if (text.startsWith('SPANISH')) {
        // Extract Spanish term (after "SPANISH" and tab/space)
        // Split on vertical tab (\u000b) - Google Docs soft returns within a paragraph
        const rawTerm = text.replace(/^SPANISH[\t\s]*/, '').trim();
        const vtParts = rawTerm.split('\u000b');
        currentSpanishTerm = vtParts[0].trim();
        // If definition is embedded after a vertical tab, capture it
        currentSpanishDef = vtParts.length > 1 ? vtParts.slice(1).join(' ').trim() : '';
        expectingEnglishDef = false;
        expectingSpanishDef = !currentSpanishDef;
        continue;
      }
    }

    // Collect the definition paragraph that follows a term header.
    //
    // Style-agnostic on purpose. This used to accept only NORMAL_TEXT and
    // HEADING_2, and silently dropped anything else: the Investing unit's
    // "Investing" definition is styled SUBTITLE in the doc, so that term
    // shipped with "(No definition provided)" while its Spanish translation,
    // one paragraph later and NORMAL_TEXT, came through fine. Editors restyle
    // paragraphs by hand, so enumerating the allowed styles just queues up the
    // next silent drop.
    //
    // Nothing else needs excluding here. Unit headings (HEADING_1) and term
    // headings (ENGLISH / SPANISH) are both handled above and continue before
    // reaching this point, and the flags below only allow the first paragraph
    // after a term header to be taken.
    if (currentUnit && (expectingEnglishDef || expectingSpanishDef)) {
      if (expectingEnglishDef && !currentEnglishDef) {
        currentEnglishDef = text;
        expectingEnglishDef = false;
      } else if (expectingSpanishDef && !currentSpanishDef) {
        currentSpanishDef = text;
        expectingSpanishDef = false;
      }
    }
  }

  // Don't forget the last term
  if (currentUnit && currentEnglishTerm) {
    saveTerm();
  }

  function saveTerm() {
    if (!currentUnit || !currentEnglishTerm) return;

    const slug = currentUnit.slug;
    const count = (termCounter.get(slug) || 0) + 1;
    termCounter.set(slug, count);

    const terms = unitTerms.get(slug) || [];

    // Check for duplicates
    const isDuplicate = terms.some((t) => t.term.toLowerCase() === currentEnglishTerm.toLowerCase());

    if (!isDuplicate) {
      terms.push({
        id: `${slug}-${String(count).padStart(3, '0')}`,
        term: currentEnglishTerm,
        definition: currentEnglishDef || '(No definition provided)',
        spanish: {
          term: currentSpanishTerm || '',
          definition: currentSpanishDef || '',
        },
      });
      unitTerms.set(slug, terms);
    }

    // Reset for next term
    currentEnglishTerm = '';
    currentEnglishDef = '';
    currentSpanishTerm = '';
    currentSpanishDef = '';
  }

  return unitTerms;
}

/**
 * Build the final units array
 */
function buildUnits(unitTerms: Map<string, Term[]>): Unit[] {
  return UNITS.map((unit) => ({
    id: unit.id,
    name: unit.name,
    slug: unit.slug,
    terms: unitTerms.get(unit.slug) || [],
  }));
}

/**
 * Validate the output data
 */
function validateOutput(data: VocabularyData): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  let totalTerms = 0;
  let missingSpanishTerm = 0;
  let missingSpanishDef = 0;

  for (const unit of data.units) {
    if (unit.terms.length === 0) {
      warnings.push(`⚠️  Unit "${unit.name}" has no terms`);
    }

    for (const term of unit.terms) {
      totalTerms++;

      if (!term.spanish.term) {
        missingSpanishTerm++;
      }
      if (!term.spanish.definition) {
        missingSpanishDef++;
      }
    }
  }

  console.log(`\n📊 Validation Summary:`);
  console.log(`   Total terms: ${totalTerms}`);
  console.log(`   Missing Spanish terms: ${missingSpanishTerm}`);
  console.log(`   Missing Spanish definitions: ${missingSpanishDef}`);

  return { valid: totalTerms > 0, warnings };
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 NGPF Dictionary Parser\n');

  try {
    // Authenticate
    const auth = await authenticate();
    console.log('✅ Authenticated with Google');

    // Fetch document
    const doc = await fetchDocument(auth);
    console.log(`✅ Fetched document: "${doc.title}"`);

    // Parse content
    const unitTerms = parseDocumentContent(doc);

    // Build units
    const units = buildUnits(unitTerms);

    // Calculate total terms
    const totalTerms = units.reduce((sum, unit) => sum + unit.terms.length, 0);
    console.log(`\n✅ Parsed ${totalTerms} vocabulary entries`);

    // Build output structure
    const output: VocabularyData = {
      metadata: {
        version: '1.0.0',
        generatedAt: new Date().toISOString(),
        sourceDocument: 'NGPF Personal Finance Dictionary',
        totalTerms,
      },
      units,
    };

    // Validate
    const validation = validateOutput(output);

    if (validation.warnings.length > 0 && validation.warnings.length <= 10) {
      console.log('\n⚠️  Warnings:');
      validation.warnings.forEach((w) => console.log(`   ${w}`));
    } else if (validation.warnings.length > 10) {
      console.log(`\n⚠️  ${validation.warnings.length} warnings (showing first 10):`);
      validation.warnings.slice(0, 10).forEach((w) => console.log(`   ${w}`));
    }

    // Write output
    const outputDir = path.dirname(OUTPUT_PATH);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf-8');

    console.log(`\n✅ Output written to ${OUTPUT_PATH}`);
    console.log(`\n📈 Summary:`);
    console.log(`   Units: ${units.length}`);
    console.log(`   Total terms: ${totalTerms}`);
    units.forEach((u) => {
      console.log(`   - ${u.name}: ${u.terms.length} terms`);
    });
  } catch (error: any) {
    if (error.code === 'ENOENT' && error.path?.includes('google-service-account')) {
      console.error('\n❌ Service account credentials not found.');
      console.error('   Please place your credentials at: config/google-service-account.json');
    } else if (error.code === 403) {
      console.error(
        '\n❌ Permission denied. Make sure the Google Doc is shared with your service account.'
      );
    } else if (error.code === 404) {
      console.error('\n❌ Document not found. Check the document ID.');
    } else {
      console.error('\n❌ Error:', error.message || error);
    }
    process.exit(1);
  }
}

main();
