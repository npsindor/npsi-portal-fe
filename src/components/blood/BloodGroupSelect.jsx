import { BLOOD_GROUPS } from "@/lib/blood-help";

// The eight blood groups as a dropdown; `placeholder` adds an empty first choice ("All Blood Groups", "Select…").
export default function BloodGroupSelect({ id, value, onChange, placeholder, required, className = "", ...rest }) {
  return (
    <select
      id={id}
      value={value}
      required={required}
      onChange={(event) => onChange(event.target.value)}
      className={`h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-[#C8102E] focus:ring-2 focus:ring-[#C8102E]/20 ${className}`}
      {...rest}
    >
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {BLOOD_GROUPS.map((group) => (
        <option key={group} value={group}>
          {group}
        </option>
      ))}
    </select>
  );
}
