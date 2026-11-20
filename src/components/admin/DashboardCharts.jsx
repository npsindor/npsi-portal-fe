import React, { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BarChart3, Loader2, ShieldCheck, UserCheck, Users } from 'lucide-react';
import { adminApi } from '@/api/adminApi';

const COPY = {
  en: {
    money: 'Transactions per month (₹)',
    moneySub: 'Last 12 months: received, still pending, and failed / rejected / refunded.',
    received: 'Received',
    pending: 'Pending',
    other: 'Failed / refunded',
    people: 'New users and registrations per month',
    peopleSub: 'New login accounts, family registrations and student registrations.',
    users: 'New users',
    families: 'Family registrations',
    students: 'Student registrations',
    types: 'Received by type (₹)',
    typesSub: 'All time, payments received.',
    totalUsers: 'User accounts',
    activeUsers: 'Active accounts',
    verifiedUsers: 'Verified accounts',
    admins: 'Super admins',
    none: 'No data yet.',
    failed: 'Charts could not be loaded.',
  },
  hi: {
    money: 'हर महीने के ट्रांज़ैक्शन (₹)',
    moneySub: 'पिछले 12 महीने: प्राप्त, लंबित, और असफल / अस्वीकृत / रिफंड।',
    received: 'प्राप्त',
    pending: 'लंबित',
    other: 'असफल / रिफंड',
    people: 'हर महीने नए उपयोगकर्ता और पंजीकरण',
    peopleSub: 'नए लॉगिन खाते, परिवार पंजीकरण और विद्यार्थी पंजीकरण।',
    users: 'नए उपयोगकर्ता',
    families: 'परिवार पंजीकरण',
    students: 'विद्यार्थी पंजीकरण',
    types: 'प्रकार अनुसार प्राप्त राशि (₹)',
    typesSub: 'अब तक प्राप्त सभी भुगतान।',
    totalUsers: 'उपयोगकर्ता खाते',
    activeUsers: 'सक्रिय खाते',
    verifiedUsers: 'सत्यापित खाते',
    admins: 'सुपर एडमिन',
    none: 'अभी कोई डेटा नहीं।',
    failed: 'चार्ट लोड नहीं हो सके।',
  },
};
const PIE = ['#0f766e', '#7c3aed', '#c2410c', '#0369a1', '#be185d', '#4d7c0f', '#a16207'];

// Super admin dashboard charts: money in per month, new users and registrations, and received amount by type.
export default function DashboardCharts({ lang }) {
  const t = COPY[lang] || COPY.en;
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  // An unexpected answer (e.g. an older API) shows the error note instead of breaking the dashboard.
  useEffect(() => {
    adminApi.charts().then((body) => (Array.isArray(body?.transactions) && Array.isArray(body?.users) ? setData(body) : setError(true))).catch(() => setError(true));
  }, []);
  const locale = lang === 'hi' ? 'hi-IN' : 'en-IN';
  const month = (value) => new Date(`${value}-01T00:00:00Z`).toLocaleDateString(locale, { month: 'short', year: '2-digit', timeZone: 'UTC' });
  const rupees = (value) => `₹${Number(value || 0).toLocaleString(locale)}`;

  if (error) return <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{t.failed}</p>;
  if (!data) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-maroon" /></div>;

  const people = data.users.map((point, index) => ({ month: month(point.month), users: point.count, families: data.familyRegistrations[index]?.count ?? 0, students: data.studentRegistrations[index]?.count ?? 0 }));
  const money = data.transactions.map((point) => ({ ...point, month: month(point.month) }));
  const totals = [
    [t.totalUsers, data.userTotals.total, Users],
    [t.activeUsers, data.userTotals.active, UserCheck],
    [t.verifiedUsers, data.userTotals.verified, ShieldCheck],
    [t.admins, data.userTotals.admins, BarChart3],
  ];
  const card = 'rounded-2xl border border-gold/30 bg-card p-5 shadow-sm';
  return (
    <section aria-label={lang === 'hi' ? 'डैशबोर्ड चार्ट' : 'Dashboard charts'} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {totals.map(([label, value, Icon]) => (
          <div key={label} className={card}>
            <Icon className="h-5 w-5 text-gold" aria-hidden="true" />
            <div className="mt-2 font-display text-2xl font-bold">{Number(value).toLocaleString(locale)}</div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <figure className={card}>
          <figcaption><h2 className="font-display text-lg font-semibold text-maroon">{t.money}</h2><p className="text-xs text-muted-foreground">{t.moneySub}</p></figcaption>
          <div className="mt-4 h-72" data-testid="chart-transactions">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={money} margin={{ left: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(value) => (value >= 1000 ? `${Math.round(value / 1000)}k` : value)} />
                <Tooltip formatter={(value, name) => [rupees(value), name]} />
                <Legend />
                <Bar dataKey="received" name={t.received} stackId="money" fill="#059669" />
                <Bar dataKey="pending" name={t.pending} stackId="money" fill="#d97706" />
                <Bar dataKey="other" name={t.other} stackId="money" fill="#e11d48" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </figure>
        <figure className={card}>
          <figcaption><h2 className="font-display text-lg font-semibold text-maroon">{t.people}</h2><p className="text-xs text-muted-foreground">{t.peopleSub}</p></figcaption>
          <div className="mt-4 h-72" data-testid="chart-users">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={people} margin={{ left: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="users" name={t.users} stroke="#7c3aed" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="families" name={t.families} stroke="#0f766e" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="students" name={t.students} stroke="#c2410c" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </figure>
      </div>
      <figure className={card}>
        <figcaption><h2 className="font-display text-lg font-semibold text-maroon">{t.types}</h2><p className="text-xs text-muted-foreground">{t.typesSub}</p></figcaption>
        {data.transactionTypes.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">{t.none}</p> : (
          <div className="mt-4 grid items-center gap-4 md:grid-cols-2">
            <div className="h-64" data-testid="chart-types">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.transactionTypes} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="85%" paddingAngle={2}>
                    {data.transactionTypes.map((slice, index) => <Cell key={slice.name} fill={PIE[index % PIE.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value, name) => [rupees(value), name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="space-y-2 text-sm">{data.transactionTypes.map((slice, index) => (
              <li key={slice.name} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm" style={{ background: PIE[index % PIE.length] }} aria-hidden="true" />{slice.name}</span>
                <span className="font-semibold">{rupees(slice.value)} <span className="text-xs font-normal text-muted-foreground">({slice.count})</span></span>
              </li>
            ))}</ul>
          </div>
        )}
      </figure>
    </section>
  );
}
