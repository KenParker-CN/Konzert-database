#!/usr/bin/env node

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync, readdirSync } from 'fs';
import { join, dirname, basename, isAbsolute } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';
import xlsx from 'xlsx';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Clamp a worksheet's declared range to the cells that actually hold data.
 * Excel frequently reports a bloated !ref (e.g. A1:XFB1046 after a
 * Ctrl+Shift+Right), which sheet_to_csv would turn into thousands of
 * empty trailing columns.
 * @param {object} worksheet - Worksheet to trim in place
 * @returns {object} The same worksheet
 */
function trimToUsedRange(worksheet) {
  if (!worksheet || !worksheet['!ref']) return worksheet;

  const range = xlsx.utils.decode_range(worksheet['!ref']);
  let maxCol = range.s.c;
  let maxRow = range.s.r;

  for (const address of Object.keys(worksheet)) {
    if (address[0] === '!') continue;
    const cell = worksheet[address];
    if (!cell || cell.v === undefined || cell.v === null || cell.v === '') continue;
    const { c, r } = xlsx.utils.decode_cell(address);
    if (c > maxCol) maxCol = c;
    if (r > maxRow) maxRow = r;
  }

  range.e.c = maxCol;
  range.e.r = maxRow;
  worksheet['!ref'] = xlsx.utils.encode_range(range);
  return worksheet;
}

/**
 * Convert XLSX file to CSV
 * @param {string} xlsxPath - Path to XLSX file
 * @param {string} csvPath - Path to output CSV file
 */
async function convertXlsxToCsv(xlsxPath, csvPath) {
  try {
    console.log(`Reading XLSX file: ${xlsxPath}`);
    const workbook = xlsx.readFile(xlsxPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = trimToUsedRange(workbook.Sheets[sheetName]);
    const csv = xlsx.utils.sheet_to_csv(worksheet);

    // Ensure output directory exists
    const outputDir = dirname(csvPath);
    if (!existsSync(outputDir)) {
      await mkdir(outputDir, { recursive: true });
    }

    await writeFile(csvPath, csv, 'utf-8');
    console.log(`✓ Converted to CSV: ${csvPath}`);
  } catch (error) {
    console.error(`✗ Error converting ${xlsxPath}:`, error.message);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  const dataDir = join(__dirname, '..');
  const xlsxDir = join(dataDir, 'xlsx');
  const args = process.argv.slice(2);
  let csvDir = join(dataDir, 'csv');
  let metaCsvDir;
  const changedOnlyIndex = args.indexOf('--changed-only');
  const changedOnly = changedOnlyIndex !== -1;
  if (changedOnly) args.splice(changedOnlyIndex, 1);

  const outputDirIndex = args.indexOf('--output-dir');
  if (outputDirIndex !== -1) {
    const outputDir = args[outputDirIndex + 1];
    if (!outputDir) {
      throw new Error('--output-dir requires a directory path');
    }
    csvDir = isAbsolute(outputDir) ? outputDir : join(dataDir, outputDir);
    args.splice(outputDirIndex, 2);
  }

  const metaOutputDirIndex = args.indexOf('--meta-output-dir');
  if (metaOutputDirIndex !== -1) {
    const outputDir = args[metaOutputDirIndex + 1];
    if (!outputDir) {
      throw new Error('--meta-output-dir requires a directory path');
    }
    metaCsvDir = isAbsolute(outputDir) ? outputDir : join(dataDir, outputDir);
    args.splice(metaOutputDirIndex, 2);
  }

  // Get all XLSX files
  const xlsxFiles = args;

  if (xlsxFiles.length === 0) {
    console.log('Usage: node convert-xlsx-to-csv.mjs <xlsx-file> [<xlsx-file> ...]');
    console.log('Or convert all XLSX files in xlsx directory');
    console.log('Optional: --output-dir <directory> (defaults to ../csv)');
    console.log('Optional: --meta-output-dir <directory> (routes composers, instruments, and genres there)');
    console.log('Optional: --changed-only converts only new or changed workbooks');
  }

  const filesToConvert = xlsxFiles.length > 0
    ? xlsxFiles
    : existsSync(xlsxDir)
      ? readdirSync(xlsxDir).filter(file => file.toLowerCase().endsWith('.xlsx') && !basename(file).startsWith('~$'))
      : [];

  if (filesToConvert.length === 0) {
    console.log('No XLSX files found to convert.');
    return;
  }

  const manifestPath = join(csvDir, '.xlsx-sync-manifest.json');
  let manifest = {};
  if (changedOnly && existsSync(manifestPath)) {
    try {
      const parsedManifest = JSON.parse(await readFile(manifestPath, 'utf-8'));
      if (parsedManifest && typeof parsedManifest === 'object' && !Array.isArray(parsedManifest)) {
        manifest = parsedManifest;
      } else {
        console.warn('CSV sync manifest is invalid; converting all workbooks once.');
      }
    } catch {
      console.warn('Could not read CSV sync manifest; converting all workbooks once.');
    }
  }

  let convertedCount = 0;
  const nextManifest = {...manifest};

  for (const xlsxFile of filesToConvert) {
    if (basename(xlsxFile).startsWith('~$')) {
      console.log(`↷ Skipping Excel lock file: ${xlsxFile}`);
      continue;
    }

    const xlsxPath = isAbsolute(xlsxFile) ? xlsxFile : join(xlsxDir, xlsxFile);
    const fileName = basename(xlsxFile).replace(/\.xlsx$/i, '');
    const outputDir = metaCsvDir && ['composers', 'instruments', 'genres'].includes(fileName.toLowerCase())
      ? metaCsvDir
      : csvDir;
    const csvPath = join(outputDir, `${fileName}.csv`);
    const sourceHash = changedOnly
      ? createHash('sha256').update(await readFile(xlsxPath)).digest('hex')
      : undefined;

    if (changedOnly && sourceHash === manifest[fileName] && existsSync(csvPath)) {
      console.log(`↷ Skipping unchanged workbook: ${xlsxFile}`);
      continue;
    }

    await convertXlsxToCsv(xlsxPath, csvPath);
    convertedCount += 1;
    if (sourceHash) nextManifest[fileName] = sourceHash;
  }

  if (changedOnly) {
    await mkdir(csvDir, {recursive: true});
    await writeFile(manifestPath, `${JSON.stringify(nextManifest, null, 2)}\n`, 'utf-8');
  }

  console.log(`\n✓ Conversion complete. Updated ${convertedCount} CSV file(s).`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
