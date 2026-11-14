import React from 'react';
import { base44 } from '@/api/base44Client';
import { ArrowLeft } from 'lucide-react';
import { exportToExcel, exportToPDF } from '@/lib/exportTable';

const money = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(n || 0));
const dt = value => value ? new Date(value).toLocaleDateString('en-IN') : '—';

export default function MemberEventKharcha() {
  const [events, setEvents] = React.useState([]);
  const [selected, setSelected] = React.useState(null);
  const [detail, setDetail] = React.useState(null);
  const [tab, setTab] = React.useState('contributions');
  const [query, setQuery] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const refresh = React.useCallback(async () => {
    setLoading(true); setError('');
    try { const rows = await base44.eventFinance.list(); setEvents(rows); if (selected) setDetail(await base44.eventFinance.detail(selected)); }
    catch (e) { setError(e.message || 'कार्यक्रम वित्त लोड नहीं हो सका।'); }
    finally { setLoading(false); }
  }, [selected]);
  React.useEffect(() => { refresh(); }, [refresh]);
  const open = async id => { setSelected(id); setLoading(true); setError(''); try { setDetail(await base44.eventFinance.detail(id)); } catch (e) { setError(e.message); } finally { setLoading(false); } };
  const shown = events.filter(e => `${e.title} ${e.titleHi || ''} ${e.venue || ''}`.toLowerCase().includes(query.toLowerCase()));
  if (loading && !events.length && !detail) return <div className="p-8 text-center">लोड हो रहा है…</div>;
  return <main className="space-y-5">
    <header><h1 className="font-display text-3xl font-semibold text-maroon">Event Kharcha / कार्यक्रम खर्च</h1><p className="mt-1 text-sm text-muted-foreground">स्वीकृत सहयोग राशि और खर्च की पारदर्शी जानकारी</p></header>
    {error && <div role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{error}</div>}
    {!selected ? <>
      <input aria-label="Search events" value={query} onChange={e => setQuery(e.target.value)} placeholder="कार्यक्रम खोजें / Search events" className="w-full rounded-xl border bg-card px-4 py-3 md:max-w-sm" />
      {loading ? <p>लोड हो रहा है…</p> : <div className="overflow-x-auto rounded-2xl border bg-card"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-muted/60"><tr>{['कार्यक्रम / Event','कुल सहयोग','कुल खर्च','शेष राशि','कार्रवाई'].map(x=><th key={x} className="p-3">{x}</th>)}</tr></thead><tbody>{shown.map((e,i)=><tr className="border-t" key={e.id}><td className="p-3"><span className="mr-2 text-muted-foreground">{i+1}.</span><b>{e.title}</b><div className="text-xs text-muted-foreground">{dt(e.date)} · {e.venue || '—'}</div></td><td className="p-3">{money(e.totalCollection)}</td><td className="p-3">{money(e.totalExpenses)}</td><td className="p-3 font-semibold">{money(e.remainingBalance)}</td><td className="p-3"><button onClick={()=>open(e.id)} className="rounded-lg bg-maroon px-4 py-2 text-white">देखें / View</button></td></tr>)}{!shown.length&&<tr><td className="p-8 text-center text-muted-foreground" colSpan="5">कोई प्रकाशित कार्यक्रम नहीं मिला।</td></tr>}</tbody></table></div>}
    </> : <>
      <button onClick={()=>{setSelected(null);setDetail(null)}} className="inline-flex items-center gap-2 text-sm font-medium text-maroon"><ArrowLeft size={16}/> सभी कार्यक्रम</button>
      {detail && <>
        <div className="overflow-hidden rounded-2xl border bg-card">{detail.event.bannerUrl&&<img src={detail.event.bannerUrl} alt="" className="h-44 w-full object-cover"/>}<div className="p-5"><h2 className="font-display text-2xl font-semibold text-maroon">{detail.event.title}</h2><p className="mt-1 text-sm text-muted-foreground">{dt(detail.event.date)} · {detail.event.venue || '—'}</p><p className="mt-3 text-sm">{detail.event.description}</p></div></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{[['कुल सहयोग',detail.summary.totalCollection],['कुल खर्च',detail.summary.totalExpenses],['शेष राशि',detail.summary.remainingBalance],['सहयोगदाता',detail.summary.contributorCount],['गाँव',detail.summary.villageCount]].map(([label,value])=><div key={label} className="rounded-xl border bg-card p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold text-maroon">{typeof value==='number'&&label!=='सहयोगदाता'&&label!=='गाँव'?money(value):value}</p></div>)}</div>
        <div className="flex flex-wrap gap-2 border-b">{[['contributions','Sahyog Rashi / सहयोग राशि'],['expenses','Event Kharcha / कार्यक्रम खर्च']].map(([key,label])=><button key={key} onClick={()=>setTab(key)} className={`border-b-2 px-4 py-3 text-sm ${tab===key?'border-maroon font-semibold text-maroon':'border-transparent text-muted-foreground'}`}>{label}</button>)}</div>
        {tab==='contributions' ? <div className="space-y-3"><div className="flex gap-2"><button className="rounded-lg border px-3 py-2 text-xs" onClick={()=>exportToExcel('sahyog-rashi',[{key:'memberName',label:'Member'},{key:'village',label:'Village'},{key:'mobile',label:'Mobile'},{key:'amount',label:'Amount'},{key:'paymentMode',label:'Mode'},{key:'contributedAt',label:'Date'}],detail.contributions)}>Excel</button><button className="rounded-lg border px-3 py-2 text-xs" onClick={()=>exportToPDF('sahyog-rashi','Sahyog Rashi',[{key:'memberName',label:'Member'},{key:'village',label:'Village'},{key:'mobile',label:'Mobile'},{key:'amount',label:'Amount'},{key:'paymentMode',label:'Mode'},{key:'contributedAt',label:'Date'}],detail.contributions)}>PDF</button></div><div className="overflow-x-auto rounded-xl border bg-card"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-muted/60"><tr>{['नाम','गाँव','मोबाइल','राशि','भुगतान','तिथि'].map(x=><th className="p-3" key={x}>{x}</th>)}</tr></thead><tbody>{detail.contributions.map(row=><tr key={row.id} className="border-t"><td className="p-3">{row.memberName}</td><td className="p-3">{row.village||'—'}</td><td className="p-3">{row.mobile||'—'}</td><td className="p-3">{money(row.amount)}</td><td className="p-3">{row.paymentMode}</td><td className="p-3">{dt(row.contributedAt)}</td></tr>)}{!detail.contributions.length&&<tr><td colSpan="6" className="p-6 text-center text-muted-foreground">अभी स्वीकृत सहयोग प्रविष्टियाँ नहीं हैं।</td></tr>}</tbody></table></div></div> : <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{detail.categoryTotals.map(row=><div key={row.categoryId} className="rounded-xl border bg-card p-4"><div className="text-sm">{row.category}</div><div className="mt-1 font-semibold">{money(row.amount)}</div></div>)}</div><div className="overflow-x-auto rounded-xl border bg-card"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-muted/60"><tr>{['श्रेणी','विवरण','राशि','विक्रेता','तिथि','रसीद'].map(x=><th className="p-3" key={x}>{x}</th>)}</tr></thead><tbody>{detail.expenses.filter(row=>row.status==='APPROVED').map(row=><tr key={row.id} className="border-t"><td className="p-3">{row.category?.name||'—'}</td><td className="p-3">{row.title}{row.description&&<div className="text-xs text-muted-foreground">{row.description}</div>}</td><td className="p-3">{money(row.amount)}</td><td className="p-3">{row.vendorName||'—'}</td><td className="p-3">{dt(row.expenseDate)}</td><td className="p-3">{row.receiptUrl?<a className="text-maroon underline" href={row.receiptUrl} target="_blank" rel="noreferrer">रसीद देखें</a>:'—'}</td></tr>)}{!detail.expenses.some(row=>row.status==='APPROVED')&&<tr><td colSpan="6" className="p-6 text-center text-muted-foreground">अभी स्वीकृत खर्च प्रविष्टियाँ नहीं हैं।</td></tr>}</tbody></table></div></div>}
        <p className="text-xs text-muted-foreground">सहयोग राशि में केवल स्वीकृत प्रविष्टियाँ शामिल हैं। रोस्टर केवल अधिकृत व्यवस्थापक देख सकते हैं।</p>
      </>}
    </>}
  </main>;
}
