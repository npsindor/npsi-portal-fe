import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, History, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { auditLogsApi } from "@/api/auditLogsApi";
import ExportMenu from "@/components/ExportMenu";
import { Button } from "@/components/ui/button";
import { isSuperAdmin } from "@/lib/admin-access";
import { useAuth } from "@/lib/AuthContext";
import { useLang } from "@/lib/i18n";

const PAGE = 50;
const L = {
  en: {
    title: "Audit Log",
    sub: "Every deletion made on the website or app — who deleted what, and when. Entries can't be changed or removed.",
    only: "Only the super admin can see the audit log.",
    search: "Search name, ID, person or address",
    allModules: "All modules",
    allPeople: "Everyone",
    roles: { SUPER_ADMIN: "Super admin", ADMIN_STAFF: "Admin staff", MEMBER: "Member" },
    from: "From",
    to: "To",
    refresh: "Refresh",
    when: "When",
    who: "Deleted by",
    what: "What was deleted",
    details: "Deleted record",
    noCopy: "No copy of this record type is kept (the deletion itself is logged).",
    empty: "No deletions match these filters.",
    loading: "Loading…",
    failed: "Could not load the audit log.",
    entries: (n) => `${n} entr${n === 1 ? "y" : "ies"}`,
    prev: "Previous page",
    next: "Next page",
    unknown: "Unknown",
  },
  hi: {
    title: "ऑडिट लॉग",
    sub: "वेबसाइट या ऐप पर की गई हर डिलीट — किसने क्या और कब डिलीट किया। एंट्री बदली या हटाई नहीं जा सकती।",
    only: "ऑडिट लॉग केवल सुपर एडमिन देख सकते हैं।",
    search: "नाम, आईडी, व्यक्ति या पता खोजें",
    allModules: "सभी मॉड्यूल",
    allPeople: "सभी",
    roles: { SUPER_ADMIN: "सुपर एडमिन", ADMIN_STAFF: "एडमिन स्टाफ़", MEMBER: "सदस्य" },
    from: "से",
    to: "तक",
    refresh: "रीफ्रेश",
    when: "कब",
    who: "किसने डिलीट किया",
    what: "क्या डिलीट हुआ",
    details: "डिलीट हुआ रिकॉर्ड",
    noCopy: "इस प्रकार के रिकॉर्ड की प्रति नहीं रखी जाती (डिलीट दर्ज है)।",
    empty: "इन फ़िल्टर से कोई डिलीट नहीं मिली।",
    loading: "लोड हो रहा है…",
    failed: "ऑडिट लॉग लोड नहीं हो सका।",
    entries: (n) => `${n} एंट्री`,
    prev: "पिछला पेज",
    next: "अगला पेज",
    unknown: "अज्ञात",
  },
};
const ROLE_TONE = { SUPER_ADMIN: "bg-maroon text-cream", ADMIN_STAFF: "bg-amber-100 text-amber-900", MEMBER: "bg-muted text-foreground" };
const field = "h-10 rounded-lg border border-border bg-background px-3 text-sm";
const show = (value) => (value === null || value === undefined || value === "" ? "—" : typeof value === "object" ? JSON.stringify(value) : String(value));

// Admin → Audit Log (super admin only): every deletion, newest first, with the deleted record's details.
export default function AdminAuditLog() {
  const { user } = useAuth();
  const { lang } = useLang();
  const t = L[lang] || L.en;
  const [filters, setFilters] = useState({ q: "", resource: "", role: "", from: "", to: "" });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [data, setData] = useState({ state: "loading", rows: [], total: 0, resources: [] });
  const [open, setOpen] = useState(null);
  const allowed = isSuperAdmin(user);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(filters.q), 300);
    return () => clearTimeout(timer);
  }, [filters.q]);
  const load = useCallback(() => {
    if (!allowed) return;
    setData((current) => ({ ...current, state: "loading" }));
    auditLogsApi
      .list({ q: search, resource: filters.resource, role: filters.role, from: filters.from, to: filters.to, limit: PAGE, offset: page * PAGE })
      .then((result) => setData({ state: "ready", ...result }))
      .catch((error) => setData((current) => ({ ...current, state: "error", error: error.message })));
  }, [allowed, search, filters.resource, filters.role, filters.from, filters.to, page]);
  useEffect(load, [load]);

  if (!allowed)
    return (
      <p role="alert" className="flex items-center gap-2 rounded-xl border p-6 text-sm text-muted-foreground">
        <ShieldCheck className="h-5 w-5" aria-hidden="true" />
        {t.only}
      </p>
    );

  const set = (key) => (event) => {
    setFilters((current) => ({ ...current, [key]: event.target.value }));
    setPage(0);
  };
  const when = (value) => new Date(value).toLocaleString(lang === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const pages = Math.max(1, Math.ceil(data.total / PAGE));
  const exportColumns = [
    { key: "when", label: t.when },
    { key: "who", label: t.who },
    { key: "role", label: "Role" },
    { key: "module", label: "Module" },
    { key: "label", label: t.what },
    { key: "recordId", label: "ID" },
    { key: "path", label: "Path" },
  ];
  const exportRows = data.rows.map((row) => ({
    when: when(row.createdAt),
    who: [row.actorName, row.actorEmail].filter(Boolean).join(" · ") || t.unknown,
    role: t.roles[row.actorRole] || row.actorRole || "",
    module: row.resource,
    label: row.label || "",
    recordId: row.recordId || "",
    path: row.path,
  }));

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <History className="h-6 w-6 text-maroon" aria-hidden="true" />
            {t.title}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t.sub}</p>
        </div>
        <div className="flex items-center gap-2">
          {data.state === "ready" && (
            <span role="status" className="rounded-full border bg-muted/40 px-3 py-1.5 text-sm font-semibold">
              {t.entries(data.total)}
            </span>
          )}
          <ExportMenu filename="audit-log" title={t.title} columns={exportColumns} rows={exportRows} />
          <Button variant="outline" onClick={load}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {t.refresh}
          </Button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <label className="relative block lg:col-span-2">
          <span className="sr-only">{t.search}</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input type="search" value={filters.q} onChange={set("q")} placeholder={t.search} className={`${field} w-full pl-9`} />
        </label>
        <select aria-label="Module" value={filters.resource} onChange={set("resource")} className={field}>
          <option value="">{t.allModules}</option>
          {data.resources.map((resource) => (
            <option key={resource} value={resource}>
              {resource}
            </option>
          ))}
        </select>
        <select aria-label={t.who} value={filters.role} onChange={set("role")} className={field}>
          <option value="">{t.allPeople}</option>
          {Object.entries(t.roles).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <input type="date" aria-label={t.from} value={filters.from} onChange={set("from")} className={`${field} w-full`} />
          <input type="date" aria-label={t.to} value={filters.to} onChange={set("to")} className={`${field} w-full`} />
        </div>
      </div>

      {data.state === "error" && (
        <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {t.failed} {data.error}
        </p>
      )}
      {data.state === "loading" && data.rows.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">{t.loading}</p>
      ) : data.rows.length === 0 ? (
        <p className="rounded-xl border p-10 text-center text-muted-foreground">{t.empty}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[760px] text-left text-sm">
            <caption className="sr-only">{t.title}</caption>
            <thead className="bg-muted/50">
              <tr>
                {[t.when, t.who, t.what, ""].map((label, index) => (
                  <th key={index} scope="col" className="whitespace-nowrap px-4 py-3 font-semibold">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <FragmentRow key={row.id} row={row} t={t} when={when} open={open === row.id} onToggle={() => setOpen(open === row.id ? null : row.id)} />
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pages > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)} aria-label={t.prev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold">
            {page + 1} / {pages}
          </span>
          <Button variant="outline" size="sm" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)} aria-label={t.next}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </nav>
      )}
    </section>
  );
}

function FragmentRow({ row, t, when, open, onToggle }) {
  const snapshot = row.snapshot && typeof row.snapshot === "object" ? Object.entries(row.snapshot) : [];
  return (
    <>
      <tr className="border-t align-top">
        <td className="whitespace-nowrap px-4 py-3">{when(row.createdAt)}</td>
        <td className="px-4 py-3">
          <div className="font-medium">{row.actorName || row.actorEmail || t.unknown}</div>
          {row.actorName && row.actorEmail && <div className="text-xs text-muted-foreground">{row.actorEmail}</div>}
          {row.actorRole && <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${ROLE_TONE[row.actorRole] || ROLE_TONE.MEMBER}`}>{t.roles[row.actorRole] || row.actorRole}</span>}
        </td>
        <td className="px-4 py-3">
          <div className="font-medium">{row.label || row.recordId || "—"}</div>
          <div className="text-xs text-muted-foreground">
            {row.resource}
            {row.recordId && row.label ? ` · ${row.recordId}` : ""}
          </div>
        </td>
        <td className="px-4 py-3 text-right">
          <Button variant="ghost" size="sm" onClick={onToggle} aria-expanded={open} aria-label={`${t.details}: ${row.label || row.recordId || row.resource}`}>
            {t.details}
            <ChevronDown className={`ml-1 h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
          </Button>
        </td>
      </tr>
      {open && (
        <tr className="bg-muted/20">
          <td colSpan={4} className="px-4 py-3">
            <div className="text-xs text-muted-foreground">{row.path}</div>
            {snapshot.length ? (
              <dl className="mt-2 grid gap-x-6 gap-y-1 text-xs sm:grid-cols-2 lg:grid-cols-3">
                {snapshot.map(([key, value]) => (
                  <div key={key} className="flex min-w-0 gap-2">
                    <dt className="shrink-0 font-semibold">{key}</dt>
                    <dd className="min-w-0 break-words text-muted-foreground">{show(value)}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">{t.noCopy}</p>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
