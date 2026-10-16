// Quotes every cell and neutralises leading =, +, - and @ so a spreadsheet
// never runs a visitor-submitted value as a formula.
function cell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function toCsv(header: string[], rows: string[][]): string {
  // The BOM makes Excel open UTF-8 accents correctly.
  return "﻿" + [header, ...rows].map((row) => row.map(cell).join(",")).join("\r\n") + "\r\n";
}
