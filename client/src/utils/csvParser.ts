export interface CsvRow {
  date: string;
  account: string;
  label: string;
  amount: number;
}

export function parseCsv(text: string): CsvRow[] {
  const lines = text.trim().split('\n');
  const rows: CsvRow[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    // Try semicolon first, then comma
    const sep = line.includes(';') ? ';' : ',';
    const cols = line.split(sep).map(c => c.trim().replace(/^["']|["']$/g, ''));

    // Expected: date, compte, libelle, debit, credit
    if (cols.length < 4) continue;

    const [date, account, label, debitRaw, creditRaw] = cols;

    // Parse date (dd/mm/yyyy or yyyy-mm-dd)
    let parsedDate = date;
    if (date.includes('/')) {
      const [d, m, y] = date.split('/');
      parsedDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }

    const debit = parseFloat((debitRaw || '0').replace(',', '.')) || 0;
    const credit = parseFloat((creditRaw || '0').replace(',', '.')) || 0;

    // Skip header rows
    if (isNaN(new Date(parsedDate).getTime())) continue;

    const amount = credit > 0 ? credit : -debit;
    if (amount === 0) continue;

    rows.push({ date: parsedDate, account: account || '', label, amount });
  }

  return rows;
}
