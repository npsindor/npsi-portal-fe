import * as XLSX from 'xlsx';

const normalize = value => String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

export const parseEventFinanceSuggestions = workbookData => {
  const workbook = XLSX.read(workbookData, { type: 'array' });
  const sheets = workbook.SheetNames.map(name => ({
    name,
    rows: XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1, defval: null, raw: false }),
  }));
  const donorSheet = sheets.find(({ rows }) =>
    rows.some(row => row.some((value, index) => normalize(value) === 'name' && row.some((header, headerIndex) => headerIndex !== index && normalize(header) === 'village'))),
  );
  if (!donorSheet) throw new Error('The workbook must include a contributor list with Name and Village columns.');

  const headerIndex = donorSheet.rows.findIndex(row => row.some((value, index) =>
    normalize(value) === 'name' && row.some((header, headerIndex) => headerIndex !== index && normalize(header) === 'village'),
  ));
  const headers = donorSheet.rows[headerIndex].map(normalize);
  const nameIndex = headers.indexOf('name');
  const villageIndex = headers.indexOf('village');
  const contributors = donorSheet.rows.slice(headerIndex + 1)
    .map(row => ({ name: String(row[nameIndex] ?? '').trim(), village: String(row[villageIndex] ?? '').trim() }))
    .filter(row => row.name && normalize(row.name) !== 'name');
  const uniqueContributors = [...new Map(contributors.map(row => [`${normalize(row.name)}|${normalize(row.village)}`, row])).values()];

  const ledger = sheets.find(({ name }) => /hisab|expense/i.test(name)) || sheets[0];
  const expenseTitles = [...new Set(ledger.rows
    .map(row => typeof row[1] === 'string' ? row[1].trim() : '')
    .filter(value => value && normalize(value) !== 'description'))];
  if (!uniqueContributors.length) throw new Error('No contributor suggestions were found in the workbook.');
  if (!expenseTitles.length) throw new Error('No expense title suggestions were found in the workbook.');

  return { contributors: uniqueContributors, expenseTitles };
};
