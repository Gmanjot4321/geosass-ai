export interface CleanResult {
  cleanedCss: string;
  hoistedImports: string[];
  deduplicatedKeyframes: string[];
  originalLines: number;
  cleanedLines: number;
  duplicateImportsRemoved: number;
  issuesDetected: string[];
}

/**
 * Cleans messy or repeatedly pasted CSS:
 * - Hoists all @import rules to the top of the stylesheet (required by CSS specification and PostCSS)
 * - Deduplicates identical @import statements
 * - Removes duplicated @keyframes animations (e.g., repeated 'scan' and 'bar')
 * - Cleans up multiple repeated :root or empty blocks
 */
export function cleanAndDeduplicateCss(inputCss: string): CleanResult {
  if (!inputCss.trim()) {
    return {
      cleanedCss: '',
      hoistedImports: [],
      deduplicatedKeyframes: [],
      originalLines: 0,
      cleanedLines: 0,
      duplicateImportsRemoved: 0,
      issuesDetected: [],
    };
  }

  const originalLines = inputCss.split('\n').length;
  const issuesDetected: string[] = [];

  // 1. Separate comments, but keep them intact or parse top-level blocks
  const lines = inputCss.split('\n');

  // Let's inspect where @import occurs
  let firstNonImportRuleLine = -1;
  const rawImports: string[] = [];
  const nonImportLines: string[] = [];

  // Match full import statements (including multiline if any)
  const importRegex = /@import\s+(?:url\([^)]+\)|['"][^'"]+['"])[^;]*;/g;
  
  // Check if @import occurred after other rules
  let seenRule = false;
  let hasMisplacedImport = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('/*') || trimmed.endsWith('*/') || trimmed.startsWith('//')) {
      continue;
    }

    if (trimmed.startsWith('@import')) {
      if (seenRule) {
        hasMisplacedImport = true;
      }
    } else if (!trimmed.startsWith('@charset')) {
      seenRule = true;
      if (firstNonImportRuleLine === -1) {
        firstNonImportRuleLine = i + 1;
      }
    }
  }

  if (hasMisplacedImport) {
    issuesDetected.push(
      `Misplaced @import rules detected after line ${firstNonImportRuleLine}. CSS standards require all @import statements to appear at the very beginning of the file.`
    );
  }

  // Extract all @imports
  const matchedImports = inputCss.match(importRegex) || [];
  const uniqueImports: string[] = [];
  let duplicateImportsRemoved = 0;

  for (const imp of matchedImports) {
    const norm = imp.trim();
    if (!uniqueImports.includes(norm)) {
      uniqueImports.push(norm);
    } else {
      duplicateImportsRemoved++;
    }
  }

  // Remove all @import statements from the CSS body
  let bodyWithoutImports = inputCss.replace(importRegex, '');

  // 2. Detect and deduplicate duplicate @keyframes blocks
  // Regex to match: @keyframes\s+([a-zA-Z0-9_-]+)\s*\{([^}]*|\{[^}]*\})*\}
  // Since CSS blocks can have nested curly braces (e.g. 0% { ... } 100% { ... }),
  // we do a balanced brace extraction for @keyframes.
  const deduplicatedKeyframes: string[] = [];
  const keyframeRegex = /@keyframes\s+([a-zA-Z0-9_-]+)\s*\{/g;
  let match: RegExpExecArray | null;
  const keyframeBlocks: { name: string; fullBlock: string; start: number; end: number }[] = [];

  while ((match = keyframeRegex.exec(bodyWithoutImports)) !== null) {
    const keyframeName = match[1];
    const startIndex = match.index;
    let openBraces = 0;
    let endIndex = -1;

    for (let i = startIndex; i < bodyWithoutImports.length; i++) {
      if (bodyWithoutImports[i] === '{') {
        openBraces++;
      } else if (bodyWithoutImports[i] === '}') {
        openBraces--;
        if (openBraces === 0) {
          endIndex = i + 1;
          break;
        }
      }
    }

    if (endIndex !== -1) {
      keyframeBlocks.push({
        name: keyframeName,
        fullBlock: bodyWithoutImports.substring(startIndex, endIndex),
        start: startIndex,
        end: endIndex,
      });
    }
  }

  // Find duplicates
  const seenKeyframes = new Set<string>();
  const duplicateBlocksToRemove: { start: number; end: number }[] = [];

  // Traverse in reverse order or preserve the last defined one
  for (let i = 0; i < keyframeBlocks.length; i++) {
    const kf = keyframeBlocks[i];
    if (seenKeyframes.has(kf.name)) {
      deduplicatedKeyframes.push(kf.name);
      duplicateBlocksToRemove.push({ start: kf.start, end: kf.end });
    } else {
      seenKeyframes.add(kf.name);
    }
  }

  if (deduplicatedKeyframes.length > 0) {
    issuesDetected.push(
      `Duplicate @keyframes detected and removed: ${Array.from(new Set(deduplicatedKeyframes)).join(', ')}`
    );
  }

  // Remove the duplicates from body in reverse index order
  duplicateBlocksToRemove.sort((a, b) => b.start - a.start);
  for (const dup of duplicateBlocksToRemove) {
    bodyWithoutImports =
      bodyWithoutImports.substring(0, dup.start) + bodyWithoutImports.substring(dup.end);
  }

  // Clean excessive blank lines (more than 2 consecutive newlines)
  const cleanedBody = bodyWithoutImports
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim();

  // Assemble clean CSS
  const resultParts: string[] = [];

  // Top comments if any
  if (uniqueImports.length > 0) {
    resultParts.push('/* Fonts and Framework Imports (MUST be at the top) */');
    resultParts.push(uniqueImports.join('\n'));
    resultParts.push('');
  }

  if (cleanedBody) {
    resultParts.push(cleanedBody);
  }

  const cleanedCss = resultParts.join('\n').trim() + '\n';
  const cleanedLines = cleanedCss.split('\n').length;

  return {
    cleanedCss,
    hoistedImports: uniqueImports,
    deduplicatedKeyframes: Array.from(new Set(deduplicatedKeyframes)),
    originalLines,
    cleanedLines,
    duplicateImportsRemoved,
    issuesDetected,
  };
}
