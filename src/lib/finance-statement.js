// Bilingual text, money format and print-ready reports for an event's finance statement (FinanceStatement.jsx).
import logoImage from '@/images/logo.png';
import { localizedText } from '@/lib/utils';

export const inr = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: Number.isInteger(Number(value || 0)) ? 0 : 2 }).format(Number(value || 0));

export const FINANCE_COPY = {
  en: {
    summary: 'Financial summary', totalReceived: 'Total contributions received', totalExpenses: 'Total expenses', balance: 'Remaining balance',
    formula: 'Remaining balance = total contributions received − total expenses. Totals are calculated from approved records.',
    pendingNote: '{n} contributions ({amount}) are waiting for review and are not included in the totals.',
    contributionsTab: 'Contributions received (Aavak)', expensesTab: 'Event expenses (Jaavak)',
    groups: { GENERAL: 'Sahyog Rashi', BHOG_PRASAD: "Mataji's Bhog & Prasad Sahyog", EVENT: 'Maa Na Garba Mahotsav expenses', ORGANIZATION: 'Swajan Samaroh – Nimar Patidar Sangathan, Indore' },
    serial: 'S.No.', name: 'Contributor name', village: 'Village / location', amount: 'Amount', status: 'Status', actions: 'Actions', section: 'Section',
    expenseHeading: 'Expense heading', description: 'Description', reviewNote: 'Review note', check: 'Check',
    search: 'Search', searchPlaceholder: 'Search name, village or S.No.', searchExpenses: 'Search expenses', allVillages: 'All villages', allSections: 'All sections', allStatuses: 'All statuses',
    minAmount: 'Min ₹', maxAmount: 'Max ₹', sortBy: 'Sort by', sorts: { serial: 'S.No. (as in the statement)', amountDesc: 'Amount: high to low', amountAsc: 'Amount: low to high', name: 'Name (A–Z)', village: 'Village (A–Z)' },
    showing: 'Showing {n} of {total} entries · approved amount shown: {amount}', clearFilters: 'Clear filters', downloadExcel: 'Download Excel',
    subtotal: 'Subtotal', previous: 'Previous', next: 'Next', page: 'Page {page} of {pages}', pagination: 'Pages',
    noContributions: 'No contributions recorded yet.', noExpenses: 'No expenses recorded yet.', noMatches: 'No entries match the filters.',
    memberNote: 'Only approved contributions are listed. Names, villages and amounts are as given in the statement.',
    memberExpenseNote: 'Expense headings and descriptions are as given in the statement.',
    adminTotalsNote: 'Totals count approved records only; pending and rejected entries are listed but not added.',
    reportContributions: 'Contributions report', reportExpenses: 'Expenses report', reportSummary: 'Full financial summary',
    reportTitle: { contributions: 'Contributions Received Report', expenses: 'Event Expenses Report', summary: 'Complete Financial Summary' },
    org: 'Nimar Patidar Sangathan, Indore', generated: 'Generated on', pageLabel: 'Page', item: 'Item', total: 'Total',
  },
  hi: {
    summary: 'वित्तीय सारांश', totalReceived: 'कुल सहयोग राशि (आवक)', totalExpenses: 'कुल खर्च (जावक)', balance: 'शेष राशि',
    formula: 'शेष राशि = कुल सहयोग राशि (आवक) − कुल खर्च (जावक)। योग स्वीकृत प्रविष्टियों से अपने-आप बनता है।',
    pendingNote: '{n} सहयोग प्रविष्टियाँ ({amount}) समीक्षा के लिए लंबित हैं और योग में शामिल नहीं हैं।',
    contributionsTab: 'सहयोग राशि (आवक)', expensesTab: 'आयोजन व्यय (जावक)',
    groups: { GENERAL: 'सहयोग राशि', BHOG_PRASAD: 'माताजी का भोग एवं प्रसाद सहयोग', EVENT: 'माँ ना गरबा महोत्सव का व्यय', ORGANIZATION: 'स्वजन समारोह – निमाड़ पाटीदार संगठन, इंदौर' },
    serial: 'क्र.', name: 'सहयोगकर्ता का नाम', village: 'ग्राम / स्थान', amount: 'राशि', status: 'स्थिति', actions: 'कार्रवाई', section: 'भाग',
    expenseHeading: 'व्यय का शीर्षक', description: 'विवरण', reviewNote: 'समीक्षा टिप्पणी', check: 'जाँचें',
    search: 'खोजें', searchPlaceholder: 'नाम, ग्राम या क्रमांक खोजें', searchExpenses: 'व्यय खोजें', allVillages: 'सभी ग्राम', allSections: 'सभी भाग', allStatuses: 'सभी स्थितियाँ',
    minAmount: 'न्यूनतम ₹', maxAmount: 'अधिकतम ₹', sortBy: 'क्रम', sorts: { serial: 'क्रमांक (सूची के अनुसार)', amountDesc: 'राशि: अधिक से कम', amountAsc: 'राशि: कम से अधिक', name: 'नाम (A–Z)', village: 'ग्राम (A–Z)' },
    showing: '{total} में से {n} प्रविष्टियाँ · दिखाई गई स्वीकृत राशि: {amount}', clearFilters: 'फ़िल्टर हटाएँ', downloadExcel: 'Excel डाउनलोड करें',
    subtotal: 'उप-योग', previous: 'पिछला', next: 'अगला', page: 'पृष्ठ {page} / {pages}', pagination: 'पृष्ठ',
    noContributions: 'अभी कोई सहयोग दर्ज नहीं है।', noExpenses: 'अभी कोई व्यय दर्ज नहीं है।', noMatches: 'फ़िल्टर से कोई प्रविष्टि मेल नहीं खाती।',
    memberNote: 'केवल स्वीकृत सहयोग दिखाए गए हैं। नाम, ग्राम एवं राशि सूची के अनुसार हैं।',
    memberExpenseNote: 'व्यय के शीर्षक एवं विवरण सूची के अनुसार हैं।',
    adminTotalsNote: 'योग में केवल स्वीकृत प्रविष्टियाँ जुड़ती हैं; लंबित एवं अस्वीकृत प्रविष्टियाँ दिखती हैं पर जुड़ती नहीं।',
    reportContributions: 'सहयोग राशि रिपोर्ट', reportExpenses: 'व्यय रिपोर्ट', reportSummary: 'संपूर्ण वित्तीय सारांश',
    reportTitle: { contributions: 'सहयोग राशि (आवक) रिपोर्ट', expenses: 'आयोजन व्यय (जावक) रिपोर्ट', summary: 'संपूर्ण वित्तीय सारांश' },
    org: 'निमाड़ पाटीदार संगठन, इंदौर', generated: 'रिपोर्ट तिथि', pageLabel: 'पृष्ठ', item: 'मद', total: 'योग',
  },
};

export const groupLabel = (group, lang) => (FINANCE_COPY[lang] || FINANCE_COPY.en).groups[group] || group || '';

const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

// A print-ready report in its own window, in the chosen language: browsers lay out Hindi correctly and "Save as PDF"
// keeps it as text. kind: 'contributions' | 'expenses' | 'summary'. Only approved records are reported.
export function openFinanceReport(kind, detail, lang) {
  const t = FINANCE_COPY[lang] || FINANCE_COPY.en;
  const { summary } = detail;
  const eventName = localizedText(detail.event, 'title', lang);
  const contributions = (detail.contributions || []).filter((row) => row.status === 'APPROVED');
  const expenses = (detail.expenses || []).filter((row) => row.status === 'APPROVED');
  const bySerial = (a, b) => (a.serialNo ?? 1e9) - (b.serialNo ?? 1e9);
  const contributionTable = (group) => {
    const list = contributions.filter((row) => row.contributionGroup === group).sort(bySerial);
    if (!list.length) return '';
    return `<h2>${escape(t.groups[group])}</h2><table><thead><tr><th class="n">${t.serial}</th><th>${t.name}</th><th>${t.village}</th><th class="r">${t.amount}</th></tr></thead><tbody>${list
      .map((row) => `<tr><td class="n">${escape(row.serialNo ?? '')}</td><td>${escape(row.memberName)}</td><td>${escape(row.village || '—')}</td><td class="r">${inr(row.amount)}</td></tr>`)
      .join('')}</tbody><tfoot><tr><td colspan="3" class="r">${t.subtotal}: ${escape(t.groups[group])}</td><td class="r">${inr(summary.contributionGroups?.[group])}</td></tr></tfoot></table>`;
  };
  const expenseTable = (group) => {
    const list = expenses.filter((row) => (row.expenseGroup || 'EVENT') === group).sort(bySerial);
    if (!list.length) return '';
    return `<h2>${escape(t.groups[group])}</h2><table><thead><tr><th class="n">${t.serial}</th><th>${t.expenseHeading}</th><th>${t.description}</th><th class="r">${t.amount}</th></tr></thead><tbody>${list
      .map((row) => `<tr><td class="n">${escape(row.serialNo ?? '')}</td><td><b>${escape(localizedText(row, 'title', lang))}</b></td><td>${escape(localizedText(row, 'description', lang) || '—')}</td><td class="r">${inr(row.amount)}</td></tr>`)
      .join('')}</tbody><tfoot><tr><td colspan="3" class="r">${t.subtotal}: ${escape(t.groups[group])}</td><td class="r">${inr(summary.expenseGroups?.[group])}</td></tr></tfoot></table>`;
  };
  const totals = `<table class="totals"><tbody>
    <tr><td>${escape(t.groups.GENERAL)}</td><td class="r">${inr(summary.contributionGroups?.GENERAL)}</td></tr>
    <tr><td>${escape(t.groups.BHOG_PRASAD)}</td><td class="r">${inr(summary.contributionGroups?.BHOG_PRASAD)}</td></tr>
    <tr class="strong"><td>${t.totalReceived}</td><td class="r">${inr(summary.totalCollection)}</td></tr>
    <tr><td>${escape(t.groups.EVENT)}</td><td class="r">${inr(summary.expenseGroups?.EVENT)}</td></tr>
    <tr><td>${escape(t.groups.ORGANIZATION)}</td><td class="r">${inr(summary.expenseGroups?.ORGANIZATION)}</td></tr>
    <tr class="strong"><td>${t.totalExpenses}</td><td class="r">${inr(summary.totalExpenses)}</td></tr>
    <tr class="balance"><td>${t.balance}</td><td class="r">${inr(summary.remainingBalance)}</td></tr></tbody></table><p class="note">${escape(t.formula)}</p>`;
  const body = kind === 'contributions'
    ? `${contributionTable('GENERAL')}${contributionTable('BHOG_PRASAD')}<table class="totals"><tbody><tr class="strong"><td>${t.totalReceived}</td><td class="r">${inr(summary.totalCollection)}</td></tr></tbody></table>`
    : kind === 'expenses'
      ? `${expenseTable('EVENT')}${expenseTable('ORGANIZATION')}<table class="totals"><tbody><tr class="strong"><td>${t.totalExpenses}</td><td class="r">${inr(summary.totalExpenses)}</td></tr></tbody></table>`
      : `${totals}${expenseTable('EVENT')}${expenseTable('ORGANIZATION')}`;
  const generated = new Date().toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN', { dateStyle: 'long', timeStyle: 'short' });
  const logo = new URL(logoImage, window.location.href).href;
  const html = `<!doctype html><html lang="${lang === 'hi' ? 'hi' : 'en'}"><head><meta charset="utf-8"><title>${escape(t.reportTitle[kind])} – ${escape(eventName)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700&family=Noto+Sans:wght@400;600;700&display=swap" rel="stylesheet">
<style>
@page { size: A4; margin: 14mm 12mm 18mm; @bottom-left { content: "${escape(t.org)} · ${escape(t.generated)}: ${escape(generated)}"; font: 8pt 'Noto Sans', 'Noto Sans Devanagari', sans-serif; color: #555; } @bottom-right { content: "${t.pageLabel} " counter(page) " / " counter(pages); font: 8pt 'Noto Sans', sans-serif; color: #555; } }
* { box-sizing: border-box; } body { margin: 0; font: 10pt/1.45 'Noto Sans', 'Noto Sans Devanagari', sans-serif; color: #1b1b1b; }
header { display: flex; align-items: center; gap: 12px; border-bottom: 2px solid #7a1f2b; padding-bottom: 10px; margin-bottom: 14px; }
header img { width: 56px; height: 56px; border-radius: 10px; } header .org { font-weight: 700; font-size: 13pt; color: #7a1f2b; }
header .event { font-weight: 600; } header .title { font-size: 11pt; color: #8a6d1f; font-weight: 700; } header .meta { margin-left: auto; text-align: right; font-size: 8.5pt; color: #555; }
h2 { font-size: 11pt; color: #7a1f2b; margin: 16px 0 6px; } table { width: 100%; border-collapse: collapse; margin-bottom: 6px; page-break-inside: auto; }
th, td { border: 1px solid #c9c2b4; padding: 4px 6px; vertical-align: top; } thead th { background: #f3eee2; text-align: left; } thead { display: table-header-group; } tr { page-break-inside: avoid; }
.n { width: 42px; text-align: center; } .r { text-align: right; white-space: nowrap; } tfoot td { font-weight: 700; background: #faf7f0; }
.totals { width: 70%; margin: 10px 0 4px auto; } .totals .strong td { font-weight: 700; background: #faf7f0; } .totals .balance td { font-weight: 700; background: #fff4cc; font-size: 11pt; }
.note { font-size: 8.5pt; color: #555; } .actions { margin: 12px 0; } @media print { .actions { display: none; } }
</style></head><body>
<div class="actions"><button onclick="window.print()">${lang === 'hi' ? 'प्रिंट / PDF सहेजें' : 'Print / Save as PDF'}</button></div>
<header><img src="${logo}" alt=""><div><div class="org">${escape(t.org)}</div><div class="event">${escape(eventName)}</div><div class="title">${escape(t.reportTitle[kind])}</div></div><div class="meta">${escape(t.generated)}: ${escape(generated)}</div></header>
${body}
</body></html>`;
  const win = window.open('', '_blank');
  if (!win) return false;
  win.document.open();
  win.document.write(html);
  win.document.close();
  const print = () => win.print();
  if (win.document.fonts?.ready) win.document.fonts.ready.then(() => setTimeout(print, 300));
  else setTimeout(print, 800);
  return true;
}
