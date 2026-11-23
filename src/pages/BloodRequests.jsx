import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Loader2, UserRound, UsersRound } from "lucide-react";
import { bloodApi } from "@/api/bloodHelpApi";
import BloodLayout from "@/components/blood/BloodLayout";
import DonorSuggestions from "@/components/blood/DonorSuggestions";
import MembersOnly from "@/components/blood/MembersOnly";
import PageHeading from "@/components/blood/PageHeading";
import Pagination from "@/components/blood/Pagination";
import RequestFilters from "@/components/blood/RequestFilters";
import RequestsTable from "@/components/blood/RequestsTable";
import { bloodError, useBloodCopy } from "@/lib/blood-help";

const PAGE_SIZE = 10;
const NO_FILTERS = { bloodGroup: "", city: "", status: "", q: "" };

// Page 4: My Requests and Community Requests (counts in the tab titles), with filters, search, sorting and pages.
// A requester can reopen the donor suggestions for their own request while it is in progress.
export default function BloodRequests() {
  const { t, lang } = useBloodCopy();
  const [scope, setScope] = useState("community");
  const [filters, setFilters] = useState(NO_FILTERS);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("-createdAt");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ state: "loading", rows: [], total: 0, counts: { mine: 0, community: 0 }, cities: [] });
  const [open, setOpen] = useState(null); // { request, suggestions } shown under the table
  const [opening, setOpening] = useState("");

  // The search box waits for a pause in typing.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(filters.q), 300);
    return () => clearTimeout(timer);
  }, [filters.q]);

  const load = useCallback(() => {
    setData((current) => ({ ...current, state: "loading" }));
    bloodApi
      .requests({ scope, bloodGroup: filters.bloodGroup, city: filters.city, status: filters.status, q: search, sort, page, pageSize: PAGE_SIZE, lang })
      .then((result) => setData({ state: "ready", ...result }))
      .catch((error) => setData((current) => ({ ...current, state: error.status === 403 ? "members" : "error", error: bloodError(error, t) })));
  }, [scope, filters.bloodGroup, filters.city, filters.status, search, sort, page, lang, t]);
  useEffect(load, [load]);

  const changeFilters = (next) => {
    setFilters(next);
    setPage(1);
  };
  const changeScope = (next) => {
    setScope(next);
    setFilters(NO_FILTERS);
    setSearch("");
    setPage(1);
    setOpen(null);
  };
  const showSuggestions = async (row) => {
    setOpening(row.id);
    try {
      setOpen({ request: row, suggestions: await bloodApi.suggestions(row.id, lang) });
    } catch (error) {
      setOpen({ request: row, error: bloodError(error, t) });
    } finally {
      setOpening("");
    }
  };
  const ownAction = (row) =>
    scope === "mine" && row.status === "IN_PROGRESS" ? (
      <button type="button" onClick={() => showSuggestions(row)} disabled={opening === row.id} className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#C8102E] px-2.5 py-1 text-xs font-semibold text-[#C8102E] hover:bg-[#C8102E]/10 disabled:opacity-60">
        {opening === row.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <UsersRound className="h-3.5 w-3.5" aria-hidden="true" />}
        {t.suggestionsFor}
      </button>
    ) : undefined;

  const tab = (key, label, count, Icon) => (
    <button
      type="button"
      role="tab"
      id={`tab-${key}`}
      aria-selected={scope === key}
      aria-controls="blood-requests-panel"
      onClick={() => changeScope(key)}
      className={`flex flex-1 items-center justify-center gap-2 rounded-t-xl px-4 py-3 text-sm font-semibold transition sm:text-base ${scope === key ? "bg-[#C8102E] text-white shadow" : "bg-muted text-foreground hover:bg-muted/70"}`}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
      {label} ({count})
    </button>
  );

  return (
    <BloodLayout title={t.requestsTitle}>
      <PageHeading icon={CalendarDays} title={t.requestsTitle} subtitle={t.requestsSub} />
      <div className="mt-6">
        {data.state === "members" ? (
          <MembersOnly />
        ) : (
          <div className="rounded-2xl border border-border bg-card shadow-sm">
            <div role="tablist" aria-label={t.requestsTitle} className="flex gap-2 px-2 pt-2">
              {tab("mine", t.myRequests, data.counts.mine, UserRound)}
              {tab("community", t.communityRequests, data.counts.community, UsersRound)}
            </div>
            <div id="blood-requests-panel" role="tabpanel" aria-labelledby={`tab-${scope}`} className="space-y-4 border-t-2 border-[#C8102E] p-4 sm:p-5">
              <RequestFilters value={filters} onChange={changeFilters} cities={data.cities} />
              {data.state === "error" && (
                <p role="alert" className="flex flex-wrap items-center justify-center gap-3 py-6 text-sm text-destructive">
                  {data.error || t.failed}
                  <button type="button" onClick={load} className="rounded-lg border border-destructive px-3 py-1 font-semibold">
                    {t.retry}
                  </button>
                </p>
              )}
              <div className="relative" aria-busy={data.state === "loading"}>
                {data.state === "loading" && data.rows.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">{t.loading}</p>
                ) : (
                  <div className={data.state === "loading" ? "opacity-60" : undefined}>
                    <RequestsTable
                      rows={data.rows}
                      variant="full"
                      sort={sort}
                      onSort={(next) => {
                        setSort(next);
                        setPage(1);
                      }}
                      emptyText={scope === "mine" ? t.emptyMine : t.emptyCommunity}
                      caption={scope === "mine" ? t.myRequests : t.communityRequests}
                      renderAction={ownAction}
                    />
                  </div>
                )}
              </div>
              <Pagination page={page} total={data.total} pageSize={PAGE_SIZE} onChange={setPage} />
            </div>
          </div>
        )}
        {open && (
          <div className="mt-5">
            {open.error ? (
              <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {open.error}
              </p>
            ) : (
              <>
                <p className="mb-2 text-sm text-muted-foreground">
                  {t.yourRequest}: <strong className="text-foreground">{open.request.reference}</strong> · {open.request.patientName} · {open.request.bloodGroup}
                </p>
                <DonorSuggestions key={open.request.id} requestId={open.request.id} suggestions={open.suggestions} />
              </>
            )}
          </div>
        )}
      </div>
    </BloodLayout>
  );
}
