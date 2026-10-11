import { useEffect, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/i18n';
import { indoreAreas, nimadVillages } from '@/lib/contact-info-text';
import { Button } from '@/components/ui/button';
import TablePagination from '@/components/admin/TablePagination';

export default function AdminContactInfo() {
  const { lang, t } = useLang();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [refresh, setRefresh] = useState(0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    setResult(null);
    base44.contactInfo.list({ limit: pageSize, offset: (page - 1) * pageSize }).then(data => {
      if (!active) return;
      const lastPage = Math.max(1, Math.ceil(data.total / pageSize));
      if (page > lastPage) { setPage(lastPage); return; }
      setResult(data);
    }).catch(() => { if (active) setError(true); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, pageSize, refresh]);
  const location = (value, options) => lang === 'hi' ? options.find(([en]) => en === value)?.[1] || value : value;
  const labels = ['contact.fullName', 'contact.phone', 'contacts.email', 'contacts.area', 'contacts.village', 'contacts.student', 'contacts.date'];
  const values = item => [item.fullName, item.contactNumber, item.email || '—', location(item.indoreArea, indoreAreas), location(item.nativeVillage, nimadVillages), t(item.isStudent ? 'contacts.yes' : 'contacts.no'), new Date(item.createdAt).toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN')];
  return <section className="space-y-5 text-foreground">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h1 className="text-2xl font-bold tracking-tight">{t('contacts.title')}</h1><p className="mt-1 text-sm text-muted-foreground">{t('contacts.description')}</p></div>
      <Button variant="outline" onClick={() => setRefresh(n => n + 1)} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" />{t('contacts.refresh')}</Button>
    </div>
    <div className="overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm" aria-busy={loading}>
      <div className="flex items-center justify-between gap-3 border-b border-border p-4">
        <p className="text-sm text-muted-foreground">{result ? t('contacts.total', { total: result.total }) : t('contacts.title')}</p>
        <label className="flex items-center gap-2 text-sm">{t('contacts.pageSize')}
          <select aria-label={t('contacts.pageSize')} className="h-10 rounded-md border border-input bg-background px-2 text-foreground" disabled={loading} value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}>
            {[10, 25, 50].map(size => <option key={size} value={size}>{size}</option>)}
          </select>
        </label>
      </div>
      {loading ? <div role="status" className="flex items-center justify-center gap-2 p-10 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />{t('contacts.loading')}</div>
        : error ? <div role="alert" className="p-6 text-destructive">{t('contacts.error')} <Button variant="outline" onClick={() => setRefresh(n => n + 1)}>{t('contacts.retry')}</Button></div>
        : !result?.items.length ? <p className="p-10 text-center text-muted-foreground">{t('contacts.empty')}</p>
        : <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground"><tr>{labels.map(label => <th scope="col" key={label} className="px-4 py-3 font-medium">{t(label)}</th>)}</tr></thead>
              <tbody>{result.items.map(item => <tr key={item.id} className="border-t border-border hover:bg-muted/30">{values(item).map((value, index) => <td key={labels[index]} className="max-w-xs break-words px-4 py-3 align-top">{value}</td>)}</tr>)}</tbody>
            </table>
          </div>
          <div className="divide-y divide-border md:hidden">{result.items.map(item => <article key={item.id} className="p-4">
            <h2 className="mb-3 font-semibold">{item.fullName}</h2>
            <dl className="space-y-2">{values(item).slice(1).map((value, index) => <div key={labels[index + 1]} className="grid grid-cols-2 gap-3 text-sm"><dt className="text-muted-foreground">{t(labels[index + 1])}</dt><dd className="break-words">{value}</dd></div>)}</dl>
          </article>)}</div>
        </>}
      {!loading && !error && result && <TablePagination page={page} totalPages={Math.max(1, Math.ceil(result.total / pageSize))} totalItems={result.total} pageSize={pageSize} onPageChange={setPage} />}
    </div>
  </section>;
}
