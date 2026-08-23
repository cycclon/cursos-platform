/**
 * Minimal RFC-4180 CSV building + download, shared by the admin export buttons.
 * Extracted from SalesDetail so the promo-code reports produce byte-identical
 * files (same quoting rules, same Excel-friendly BOM).
 */

/** Quotes a field only when it actually needs it. */
export function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Builds a CSV document from a header row plus already-stringified rows. */
export function buildCsv(header: string[], rows: string[][]): string {
  const lines = rows.map((cells) => cells.map(escapeCsv).join(','));
  return [header.map(escapeCsv).join(','), ...lines].join('\n');
}

/**
 * Triggers a browser download. The leading BOM is what makes Excel read the
 * file as UTF-8 instead of mangling every accented character.
 */
export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** `ventas-2026-08-02.csv` — the naming the admin exports already use. */
export function datedFilename(prefix: string): string {
  return `${prefix}-${new Date().toISOString().slice(0, 10)}.csv`;
}
