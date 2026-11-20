/**
 * CSV helpers. Cells starting with = + - @ (or tab/CR) are prefixed with a
 * quote so spreadsheet apps show them as text instead of running them as
 * formulas (CSV injection).
 */
const FORMULA = /^[=+\-@\t\r]/;
const BOM = String.fromCharCode(0xfeff);
const CRLF = '\r\n';

export function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  let text = String(value);
  if (typeof value === 'string' && FORMULA.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv<T>(
  rows: T[],
  columns: { header: string; value: (row: T) => unknown }[],
): string {
  const lines = [columns.map((c) => csvCell(c.header)).join(',')];
  for (const row of rows) lines.push(columns.map((c) => csvCell(c.value(row))).join(','));
  // CRLF and a BOM so Excel opens UTF-8 names correctly.
  return BOM + lines.join(CRLF) + CRLF;
}

export function downloadFile(name: string, content: string, type = 'text/csv;charset=utf-8'): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
