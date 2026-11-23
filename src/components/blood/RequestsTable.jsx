import { ArrowDown, ArrowUp, ArrowUpDown, User } from "lucide-react";
import StatusBadge from "@/components/blood/StatusBadge";
import WhatsAppButton from "@/components/blood/WhatsAppButton";
import { formatDay, useBloodCopy } from "@/lib/blood-help";

const groupChip = "inline-flex min-w-12 justify-center rounded-md bg-[#C8102E]/10 px-2 py-1 text-sm font-bold text-[#C8102E]";

// Blood requests as a table (a stack of cards on phones).
// variant "recent": Patient, Blood Group, Units, Hospital, City, Contact (home page; no status).
// variant "full": Patient, Blood Group, Units, Hospital / City, Requested On, Status, Action (sortable).
// The contact is a WhatsApp button, active only while the request is in progress; on the requester's own requests the
// contact person's number is shown instead.
export default function RequestsTable({ rows, variant = "full", sort, onSort, emptyText, caption, renderAction }) {
  const { t, lang } = useBloodCopy();
  const full = variant === "full";
  const sortable = (key, label) => {
    if (!full || !onSort) return label;
    const active = sort === key || sort === `-${key}`;
    const Icon = !active ? ArrowUpDown : sort.startsWith("-") ? ArrowDown : ArrowUp;
    return (
      <button type="button" onClick={() => onSort(sort === key ? `-${key}` : key)} aria-label={t.sortBy(label)} className="inline-flex items-center gap-1 font-semibold hover:text-[#C8102E]">
        {label}
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    );
  };
  const contact = (row) =>
    renderAction?.(row) ??
    (row.mine && row.contactPhone ? (
      <span className="text-xs text-muted-foreground">
        {row.contactName} · {row.contactPhone}
      </span>
    ) : (
      <WhatsAppButton href={row.whatsapp} name={row.contactName} size={full ? "sm" : "md"} />
    ));
  if (!rows.length) return <p className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">{emptyText}</p>;
  const headers = full
    ? [sortable("patientName", t.cols.patient), sortable("bloodGroup", t.cols.group), sortable("units", t.cols.units), t.cols.hospitalCity, sortable("createdAt", t.cols.requestedOn), sortable("status", t.cols.status), t.cols.action]
    : [t.cols.patient, t.cols.group, t.cols.units, t.cols.hospital, t.cols.city, t.cols.contact];
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead className="border-b border-border text-xs font-semibold text-foreground">
            <tr>
              {headers.map((header, index) => (
                <th key={index} scope="col" className="whitespace-nowrap px-3 py-3">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border/70 last:border-0">
                <td className="px-3 py-3">
                  <span className="inline-flex items-center gap-2 font-medium">
                    <User className="h-4 w-4 shrink-0 text-[#C8102E]" aria-hidden="true" />
                    {row.patientName}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <span className={groupChip}>{row.bloodGroup}</span>
                </td>
                <td className="whitespace-nowrap px-3 py-3">{full ? row.units : t.unitsN(row.units)}</td>
                {full ? (
                  <td className="px-3 py-3">
                    {row.hospital}, {row.city}
                  </td>
                ) : (
                  <>
                    <td className="px-3 py-3">{row.hospital}</td>
                    <td className="px-3 py-3">{row.city}</td>
                  </>
                )}
                {full && <td className="whitespace-nowrap px-3 py-3">{formatDay(row.requestedOn, lang)}</td>}
                {full && (
                  <td className="px-3 py-3">
                    <StatusBadge status={row.status} />
                  </td>
                )}
                <td className="px-3 py-3">{contact(row)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="space-y-3 md:hidden">
        {rows.map((row) => (
          <li key={row.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 font-semibold">
                  <User className="h-4 w-4 shrink-0 text-[#C8102E]" aria-hidden="true" />
                  {row.patientName}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {row.hospital}, {row.city}
                </div>
              </div>
              <span className={groupChip}>{row.bloodGroup}</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              <span>{t.unitsN(row.units)}</span>
              {full && <span className="text-muted-foreground">{formatDay(row.requestedOn, lang)}</span>}
              {full && <StatusBadge status={row.status} />}
              <span className="ml-auto">{contact(row)}</span>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
