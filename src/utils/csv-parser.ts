/**
 * Shared CSV parsing utility.
 * Used by both the column-mapper preview and the import pipeline
 * to ensure identical parsing behavior.
 */

/**
 * Parse a single CSV row into an array of field values.
 * - Preserves empty fields as empty strings (critical for positional mapping)
 * - Handles quoted fields containing commas
 * - Unescapes doubled quotes ("" -> ")
 */
export function parseCSVRow(row: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  let i = 0;

  while (i < row.length) {
    const char = row[i];

    if (inQuotes) {
      if (char === '"') {
        // Check for escaped quote ("")
        if (i + 1 < row.length && row[i + 1] === '"') {
          current += '"';
          i += 2;
          continue;
        }
        // End of quoted field
        inQuotes = false;
        i++;
        continue;
      }
      current += char;
      i++;
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
      } else if (char === ",") {
        result.push(current.trim());
        current = "";
        i++;
      } else {
        current += char;
        i++;
      }
    }
  }

  // Push the last field
  result.push(current.trim());

  return result;
}

/**
 * Parse full CSV content into a 2D array of rows and fields.
 * Filters out completely empty rows.
 */
export function parseCSV(
  content: string,
  hasHeaders: boolean,
): { headers: string[]; dataRows: string[][] } {
  const rows = content.split(/\r?\n/).filter((row) => row.trim());

  if (rows.length === 0) {
    return { headers: [], dataRows: [] };
  }

  const parsedRows = rows.map(parseCSVRow);

  const headers = hasHeaders
    ? parsedRows[0]
    : parsedRows[0].map((_, i) => `Column ${i + 1}`);

  const dataRows = hasHeaders ? parsedRows.slice(1) : parsedRows;

  return { headers, dataRows };
}
