import { useMemo, useState } from 'react';
import { AlertTriangle, Download, FileText, Printer } from 'lucide-react';
import { exportToExcel } from '@/lib/exportTable';
import { localizedText } from '@/lib/utils';
import { statusLabel } from '@/components/StatusBadge';
import { FINANCE_COPY, groupLabel, inr, openFinanceReport } from '@/lib/finance-statement';
import SuggestSearchInput from '@/components/SuggestSearchInput';
import { suggestValues } from '@/lib/search-suggestions';

const PAGE_SIZE = 50;
const field = 'h-10 rounded-lg border border-border bg-background px-3 text-sm';
const SORTS = ['serial', 'amountDesc', 'amountAsc', 'name', 'village'];
const GROUP_ORDER = { GENERAL: 0, BHOG_PRASAD: 1, EVENT: 0, ORGANIZATION: 1 };

// One event's finance statement (contributions received and expenses), shared by the member page and the admin page.
// `show`: 'all' (summary + both tabs), 'summary', 'contributions' or 'expenses'. Admins also get status, review notes and
// a per-row `actions` render prop ({ contribution(row), expense(row) }).
export default function FinanceStatement({ detail, lang, admin = false, show = 'all', actions = {} }) {
  const t = FINANCE_COPY[lang] || FINANCE_COPY.en;
  const [tab, setTab] = useState('contributions');
  const view = show === 'contributions' || show === 'expenses' ? show : tab;
  if (!detail) return null;
  const { summary } = detail;
  const report = (kind) => openFinanceReport(kind, detail, lang);
  return (
    <div className="space-y-5">
      {(show === 'all' || show === 'summary') && <SummaryCards summary={summary} t={t} admin={admin} />}
      {show === 'all' && (
        <div className="flex flex-wrap items-end justify-between gap-3 border-b">
          <div role="tablist" className="flex flex-wrap gap-1">
            {[['contributions', t.contributionsTab], ['expenses', t.expensesTab]].map(([key, label]) => (
              <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)} className={`border-b-2 px-4 py-3 text-sm ${tab === key ? 'border-maroon font-semibold text-maroon' : 'border-transparent text-muted-foreground'}`}>{label}</button>
            ))}
          </div>
          <ReportButtons t={t} report={report} />
        </div>
      )}
      {show === 'summary' && <ReportButtons t={t} report={report} />}
      {view === 'contributions' && show !== 'summary' && <Contributions detail={detail} lang={lang} t={t} admin={admin} action={actions.contribution} />}
      {view === 'expenses' && show !== 'summary' && <Expenses detail={detail} lang={lang} t={t} admin={admin} action={actions.expense} />}
    </div>
  );
}

function ReportButtons({ t, report }) {
  return (
    <div className="flex flex-wrap gap-2 pb-2">
      {[['contributions', t.reportContributions], ['expenses', t.reportExpenses], ['summary', t.reportSummary]].map(([kind, label]) => (
        <button key={kind} type="button" onClick={() => report(kind)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-semibold hover:border-gold">
          <Printer className="h-3.5 w-3.5" aria-hidden="true" />{label}
        </button>
      ))}
    </div>
  );
}

function SummaryCards({ summary, t, admin }) {
  const main = [[t.totalReceived, summary.totalCollection, 'text-emerald-700 dark:text-emerald-400'], [t.totalExpenses, summary.totalExpenses, 'text-maroon'], [t.balance, summary.remainingBalance, 'text-gold-dark']];
  const parts = [
    [t.groups.GENERAL, summary.contributionGroups?.GENERAL],
    [t.groups.BHOG_PRASAD, summary.contributionGroups?.BHOG_PRASAD],
    [t.groups.EVENT, summary.expenseGroups?.EVENT],
    [t.groups.ORGANIZATION, summary.expenseGroups?.ORGANIZATION],
  ];
  return (
    <section aria-label={t.summary} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        {main.map(([label, value, tone]) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className={`mt-1 font-display text-2xl font-semibold sm:text-3xl ${tone}`}>{inr(value)}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {parts.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-sm">
            <span className="text-muted-foreground">{label}</span><b>{inr(value)}</b>
          </div>
        ))}
      </div>
      {admin && summary.pendingContributionCount > 0 && (
        <p className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {t.pendingNote.replace('{n}', summary.pendingContributionCount).replace('{amount}', inr(summary.pendingContributions))}
        </p>
      )}
      <p className="text-xs text-muted-foreground">{t.formula}</p>
    </section>
  );
}

function Contributions({ detail, lang, t, admin, action }) {
  const rows = detail.contributions || [];
  const [q, setQ] = useState('');
  const [village, setVillage] = useState('');
  const [group, setGroup] = useState('');
  const [status, setStatus] = useState('');
  const [min, setMin] = useState('');
  const [max, setMax] = useState('');
  const [sort, setSort] = useState('serial');
  const [page, setPage] = useState(1);
  const villages = useMemo(() => [...new Set(rows.map((row) => row.village).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' })), [rows]);
  const shown = useMemo(() => {
    const text = q.trim().toLowerCase();
    const list = rows.filter((row) =>
      (!text || `${row.memberName} ${row.village || ''} ${row.serialNo || ''}`.toLowerCase().includes(text))
      && (!village || row.village === village)
      && (!group || row.contributionGroup === group)
      && (!status || row.status === status)
      && (min === '' || row.amount >= Number(min))
      && (max === '' || row.amount <= Number(max)));
    const by = {
      serial: (a, b) => (GROUP_ORDER[a.contributionGroup] ?? 9) - (GROUP_ORDER[b.contributionGroup] ?? 9) || (a.serialNo ?? 1e9) - (b.serialNo ?? 1e9),
      amountDesc: (a, b) => b.amount - a.amount,
      amountAsc: (a, b) => a.amount - b.amount,
      name: (a, b) => a.memberName.localeCompare(b.memberName, 'en', { sensitivity: 'base' }),
      village: (a, b) => (a.village || '').localeCompare(b.village || '', 'en', { sensitivity: 'base' }),
    }[sort];
    return [...list].sort(by);
  }, [rows, q, village, group, status, min, max, sort]);
  const pages = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const pageRows = shown.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const filtered = Boolean(q || village || group || status || min !== '' || max !== '');
  const reset = (setter) => (event) => { setter(event.target.value); setPage(1); };
  const columns = admin ? 6 : 4;
  const exportRows = () => exportToExcel('contributions', [
    { key: 'serialNo', label: t.serial }, { key: 'section', label: t.section }, { key: 'memberName', label: t.name }, { key: 'village', label: t.village }, { key: 'amount', label: t.amount }, ...(admin ? [{ key: 'statusText', label: t.status }, { key: 'reviewNote', label: t.reviewNote }] : []),
  ], shown.map((row) => ({ ...row, section: groupLabel(row.contributionGroup, lang), statusText: statusLabel(row.status, lang) })));

  return (
    <section aria-label={t.contributionsTab} className="space-y-3">
      <div className="grid gap-2 rounded-xl border border-border bg-card p-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <div className="sm:col-span-2"><SuggestSearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder={t.searchPlaceholder} ariaLabel={t.search} suggestions={suggestValues(rows, ['memberName', 'village'], q)} inputClassName={`${field} w-full pl-9`} /></div>
        <select aria-label={t.village} value={village} onChange={reset(setVillage)} className={field}><option value="">{t.allVillages}</option>{villages.map((name) => <option key={name} value={name}>{name}</option>)}</select>
        <select aria-label={t.section} value={group} onChange={reset(setGroup)} className={field}><option value="">{t.allSections}</option>{['GENERAL', 'BHOG_PRASAD'].map((key) => <option key={key} value={key}>{t.groups[key]}</option>)}</select>
        {admin && <select aria-label={t.status} value={status} onChange={reset(setStatus)} className={field}><option value="">{t.allStatuses}</option>{['APPROVED', 'PENDING', 'REJECTED'].map((key) => <option key={key} value={key}>{statusLabel(key, lang)}</option>)}</select>}
        <input aria-label={t.minAmount} type="number" min="0" inputMode="numeric" placeholder={t.minAmount} value={min} onChange={reset(setMin)} className={field} />
        <input aria-label={t.maxAmount} type="number" min="0" inputMode="numeric" placeholder={t.maxAmount} value={max} onChange={reset(setMax)} className={field} />
        <select aria-label={t.sortBy} value={sort} onChange={reset(setSort)} className={field}>{SORTS.map((key) => <option key={key} value={key}>{t.sorts[key]}</option>)}</select>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p role="status" className="text-muted-foreground">{t.showing.replace('{n}', shown.length).replace('{total}', rows.length).replace('{amount}', inr(shown.reduce((s, row) => s + (row.status === 'APPROVED' ? row.amount : 0), 0)))}</p>
        <div className="flex gap-2">
          {filtered && <button type="button" onClick={() => { setQ(''); setVillage(''); setGroup(''); setStatus(''); setMin(''); setMax(''); setPage(1); }} className="rounded-lg border px-3 py-1.5 text-xs">{t.clearFilters}</button>}
          <button type="button" onClick={exportRows} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs"><Download className="h-3.5 w-3.5" aria-hidden="true" />{t.downloadExcel}</button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr><th className="w-16 p-3">{t.serial}</th><th className="p-3">{t.name}</th><th className="p-3">{t.village}</th><th className="p-3 text-right">{t.amount}</th>{admin && <th className="p-3">{t.status}</th>}{admin && <th className="p-3">{t.actions}</th>}</tr>
          </thead>
          <tbody>
            {pageRows.map((row, index) => {
              const previous = pageRows[index - 1];
              const heading = sort === 'serial' && !group && (!previous || previous.contributionGroup !== row.contributionGroup);
              return [
                heading && <tr key={`h-${row.contributionGroup}`} className="bg-gold/10"><th colSpan={columns} scope="colgroup" className="p-3 text-left font-semibold text-maroon">{t.groups[row.contributionGroup] || row.contributionGroup}</th></tr>,
                <tr key={row.id} className="border-t border-border align-top">
                  <td className="p-3 tabular-nums text-muted-foreground">{row.serialNo ?? '—'}</td>
                  <td className="p-3 font-medium">{row.memberName}{admin && row.reviewNote && <span title={row.reviewNote} className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[0.7rem] font-semibold text-amber-900 dark:bg-amber-900/50 dark:text-amber-200"><AlertTriangle className="h-3 w-3" aria-hidden="true" />{t.check}</span>}{admin && row.reviewNote && <p className="mt-1 text-xs font-normal text-amber-800 dark:text-amber-300">{row.reviewNote}</p>}</td>
                  <td className="p-3">{row.village || '—'}</td>
                  <td className="p-3 text-right font-semibold tabular-nums">{inr(row.amount)}</td>
                  {admin && <td className="p-3 text-xs">{statusLabel(row.status, lang)}</td>}
                  {admin && <td className="p-3 text-xs">{action?.(row)}</td>}
                </tr>,
              ];
            })}
            {!pageRows.length && <tr><td colSpan={columns} className="p-8 text-center text-muted-foreground">{rows.length ? t.noMatches : t.noContributions}</td></tr>}
          </tbody>
          <tfoot className="border-t-2 border-border bg-muted/40 text-sm">
            {['GENERAL', 'BHOG_PRASAD'].map((key) => <tr key={key}><td colSpan={3} className="p-3 text-right text-muted-foreground">{t.subtotal}: {t.groups[key]}</td><td className="p-3 text-right font-semibold tabular-nums">{inr(detail.summary.contributionGroups?.[key])}</td>{admin && <td colSpan={2} />}</tr>)}
            <tr className="text-base"><td colSpan={3} className="p-3 text-right font-semibold">{t.totalReceived}</td><td className="p-3 text-right font-bold tabular-nums text-emerald-700 dark:text-emerald-400">{inr(detail.summary.totalCollection)}</td>{admin && <td colSpan={2} />}</tr>
          </tfoot>
        </table>
      </div>
      {pages > 1 && (
        <nav aria-label={t.pagination} className="flex items-center justify-between gap-2 text-sm">
          <button type="button" disabled={current <= 1} onClick={() => setPage(current - 1)} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">{t.previous}</button>
          <span>{t.page.replace('{page}', current).replace('{pages}', pages)}</span>
          <button type="button" disabled={current >= pages} onClick={() => setPage(current + 1)} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">{t.next}</button>
        </nav>
      )}
      <p className="text-xs text-muted-foreground">{admin ? t.adminTotalsNote : t.memberNote}</p>
    </section>
  );
}

function Expenses({ detail, lang, t, admin, action }) {
  const rows = useMemo(() => [...(detail.expenses || [])].sort((a, b) => (GROUP_ORDER[a.expenseGroup] ?? 9) - (GROUP_ORDER[b.expenseGroup] ?? 9) || (a.serialNo ?? 1e9) - (b.serialNo ?? 1e9)), [detail.expenses]);
  const [q, setQ] = useState('');
  const text = q.trim().toLowerCase();
  const shown = rows.filter((row) => !text || [row.title, row.titleHi, row.description, row.descriptionHi, row.category?.name, row.category?.nameHi].some((value) => (value || '').toLowerCase().includes(text)));
  const columns = admin ? 6 : 4;
  const exportRows = () => exportToExcel('expenses', [
    { key: 'serialNo', label: t.serial }, { key: 'section', label: t.section }, { key: 'heading', label: t.expenseHeading }, { key: 'details', label: t.description }, { key: 'amount', label: t.amount }, ...(admin ? [{ key: 'statusText', label: t.status }] : []),
  ], shown.map((row) => ({ ...row, section: groupLabel(row.expenseGroup, lang), heading: localizedText(row, 'title', lang), details: localizedText(row, 'description', lang), statusText: statusLabel(row.status, lang) })));
  return (
    <section aria-label={t.expensesTab} className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="w-full sm:max-w-sm"><SuggestSearchInput value={q} onChange={setQ} placeholder={t.searchExpenses} ariaLabel={t.search} suggestions={suggestValues(rows, lang === 'hi' ? ['titleHi', 'title', (row) => row.category?.nameHi] : ['title', (row) => row.category?.name], q)} inputClassName={`${field} w-full pl-9`} /></div>
        <button type="button" onClick={exportRows} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs"><Download className="h-3.5 w-3.5" aria-hidden="true" />{t.downloadExcel}</button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr><th className="w-16 p-3">{t.serial}</th><th className="p-3">{t.expenseHeading}</th><th className="p-3">{t.description}</th><th className="p-3 text-right">{t.amount}</th>{admin && <th className="p-3">{t.status}</th>}{admin && <th className="p-3">{t.actions}</th>}</tr>
          </thead>
          {['EVENT', 'ORGANIZATION'].map((key) => {
            const list = shown.filter((row) => (row.expenseGroup || 'EVENT') === key);
            if (!list.length) return null;
            return (
              <tbody key={key}>
                <tr className="bg-gold/10"><th colSpan={columns} scope="colgroup" className="p-3 text-left font-semibold text-maroon">{t.groups[key]}</th></tr>
                {list.map((row) => (
                  <tr key={row.id} className="border-t border-border align-top">
                    <td className="p-3 tabular-nums text-muted-foreground">{row.serialNo ?? '—'}</td>
                    <td className="p-3 font-medium">{localizedText(row, 'title', lang)}<span className="block text-xs font-normal text-muted-foreground">{(lang === 'hi' && row.category?.nameHi) || row.category?.name}</span></td>
                    <td className="p-3 text-muted-foreground">{localizedText(row, 'description', lang) || '—'}</td>
                    <td className="p-3 text-right font-semibold tabular-nums">{inr(row.amount)}</td>
                    {admin && <td className="p-3 text-xs">{statusLabel(row.status, lang)}</td>}
                    {admin && <td className="p-3 text-xs">{action?.(row)}</td>}
                  </tr>
                ))}
                <tr className="border-t border-border bg-muted/40"><td colSpan={3} className="p-3 text-right text-muted-foreground">{t.subtotal}: {t.groups[key]}</td><td className="p-3 text-right font-semibold tabular-nums">{inr(detail.summary.expenseGroups?.[key])}</td>{admin && <td colSpan={2} />}</tr>
              </tbody>
            );
          })}
          {!shown.length && <tbody><tr><td colSpan={columns} className="p-8 text-center text-muted-foreground">{rows.length ? t.noMatches : t.noExpenses}</td></tr></tbody>}
          <tfoot className="border-t-2 border-border bg-muted/40">
            <tr className="text-base"><td colSpan={3} className="p-3 text-right font-semibold">{t.totalExpenses}</td><td className="p-3 text-right font-bold tabular-nums text-maroon">{inr(detail.summary.totalExpenses)}</td>{admin && <td colSpan={2} />}</tr>
            <tr><td colSpan={3} className="p-3 text-right font-semibold">{t.balance}</td><td className="p-3 text-right font-bold tabular-nums text-gold-dark">{inr(detail.summary.remainingBalance)}</td>{admin && <td colSpan={2} />}</tr>
          </tfoot>
        </table>
      </div>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><FileText className="h-3.5 w-3.5" aria-hidden="true" />{admin ? t.adminTotalsNote : t.memberExpenseNote}</p>
    </section>
  );
}
