import React from "react";
import SuggestSearchInput from "@/components/SuggestSearchInput";

// Admin table search; `suggestions` (from useTableControls or suggestValues) adds auto-suggest from the loaded rows.
export default function SearchBox({ value, onChange, placeholder, className = "", suggestions = [] }) {
  return <SuggestSearchInput value={value} onChange={onChange} placeholder={placeholder} className={className} suggestions={suggestions} />;
}
