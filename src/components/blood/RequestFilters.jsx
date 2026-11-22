import { Search } from "lucide-react";
import BloodGroupSelect from "@/components/blood/BloodGroupSelect";
import { useBloodCopy } from "@/lib/blood-help";

const field = "h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-[#C8102E] focus:ring-2 focus:ring-[#C8102E]/20";

// Blood group, city, status and a patient / hospital search.
export default function RequestFilters({ value, onChange, cities = [] }) {
  const { t } = useBloodCopy();
  const set = (key) => (next) => onChange({ ...value, [key]: next });
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <BloodGroupSelect aria-label={t.cols.group} value={value.bloodGroup} onChange={set("bloodGroup")} placeholder={t.allGroups} />
      <select aria-label={t.city} value={value.city} onChange={(event) => set("city")(event.target.value)} className={field}>
        <option value="">{t.allCities}</option>
        {cities.map((city) => (
          <option key={city} value={city}>
            {city}
          </option>
        ))}
      </select>
      <select aria-label={t.cols.status} value={value.status} onChange={(event) => set("status")(event.target.value)} className={field}>
        <option value="">{t.allStatus}</option>
        <option value="IN_PROGRESS">{t.status.IN_PROGRESS}</option>
        <option value="COMPLETED">{t.status.COMPLETED}</option>
      </select>
      <label className="relative block">
        <span className="sr-only">{t.search}</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input type="search" value={value.q} onChange={(event) => set("q")(event.target.value)} placeholder={t.search} className={`${field} pl-9`} />
      </label>
    </div>
  );
}
