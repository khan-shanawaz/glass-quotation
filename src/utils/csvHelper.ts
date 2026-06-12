/**
 * Pure JavaScript CSV Export & Import Helper utilities
 */

/**
 * Escapes a single CSV field if it contains commas, double quotes, or new lines.
 */
function escapeCSVField(field: any): string {
  if (field === null || field === undefined) return '';
  const str = String(field);
  
  // If the field has double quotes, escape them by doubling them
  // e.g. "Patel "Glass" Traders" -> "Patel ""Glass"" Traders"
  const needsEscaping = str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r');
  
  if (needsEscaping) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Converts data rows to a CSV string and triggers a browser file download prompt.
 */
export function exportToCSV<T>(
  data: T[],
  headers: string[],
  rowMapper: (item: T) => any[],
  fileName: string
): void {
  const csvRows: string[] = [];
  
  // 1. Add headers
  csvRows.push(headers.map(escapeCSVField).join(','));
  
  // 2. Add data rows
  data.forEach((item) => {
    const rowValues = rowMapper(item);
    csvRows.push(rowValues.map(escapeCSVField).join(','));
  });
  
  // 3. Create file blob and click download link
  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Standard CSV Parser that correctly handles fields wrapped in quotes and escaped double quotes.
 */
export function parseCSV(text: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    
    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          field += '"';
          i++; // skip next quote
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(field);
        field = '';
      } else if (char === '\n' || char === '\r') {
        row.push(field);
        field = '';
        if (row.length > 0 || char === '\n') {
          lines.push(row);
          row = [];
        }
        if (char === '\r' && nextChar === '\n') {
          i++; // skip the \n character
        }
      } else {
        field += char;
      }
    }
  }
  
  // Append any final fields
  if (field || row.length > 0) {
    row.push(field);
    lines.push(row);
  }
  
  // Filter out completely empty lines
  return lines.filter(r => r.some(f => f.trim() !== ''));
}
