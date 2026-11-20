import React, { useEffect, useId, useRef, useState } from 'react';
import { Loader2, UserCheck } from 'lucide-react';
import { eventMembersApi } from '@/api/eventMembersApi';
import { useLang } from '@/lib/i18n';

const COPY = {
  en: { registered: 'Registered on the portal', searching: 'Searching…', hint: 'Type a name, Family ID, member ID or mobile to fill in a registered person’s details.', member: 'Member', student: 'Student' },
  hi: { registered: 'पोर्टल पर पंजीकृत', searching: 'खोज रहे हैं…', hint: 'पंजीकृत व्यक्ति की जानकारी भरने के लिए नाम, फैमिली आईडी, सदस्य आईडी या मोबाइल लिखें।', member: 'सदस्य', student: 'विद्यार्थी' },
};

// Admin forms: a name field that suggests people already registered on the portal (active family members and
// students, searched by name, Family ID, member / student ID or mobile). Picking one calls onPick(person) with
// { kind, id, name, village, mobile, email, photoUrl, familyId, membershipId, studentId } so the form can fill in the
// rest; typing a new name works as before. The search is admin-only on the API.
export default function RegisteredPersonInput({ id, value, onChange, onPick, className, required, maxLength, placeholder, ariaLabel, list, showHint = true }) {
  const { lang } = useLang();
  const t = COPY[lang] || COPY.en;
  const listId = useId();
  const [matches, setMatches] = useState([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState(-1);
  const typed = useRef(false);
  const box = useRef(null);

  useEffect(() => {
    const q = String(value || '').trim();
    if (!typed.current || q.length < 2) { setMatches([]); return undefined; }
    let live = true;
    setBusy(true);
    const timer = setTimeout(() => {
      eventMembersApi.admin.people(q)
        .then((rows) => { if (live) { setMatches(rows.slice(0, 8)); setOpen(true); setActive(-1); } })
        .catch(() => live && setMatches([]))
        .finally(() => live && setBusy(false));
    }, 300);
    return () => { live = false; clearTimeout(timer); };
  }, [value]);
  useEffect(() => {
    const close = (event) => { if (!box.current?.contains(event.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const pick = (person) => {
    typed.current = false;
    setOpen(false);
    setMatches([]);
    onPick?.(person);
  };
  const onKeyDown = (event) => {
    if (!open || !matches.length) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((current) => (current + (event.key === 'ArrowDown' ? 1 : -1) + matches.length) % matches.length);
    } else if (event.key === 'Enter' && active >= 0) {
      event.preventDefault();
      pick(matches[active]);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={box} className="relative">
      <input
        id={id}
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded={open && matches.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        className={className}
        required={required}
        maxLength={maxLength}
        placeholder={placeholder}
        list={list}
        value={value}
        onChange={(event) => { typed.current = true; onChange(event.target.value); }}
        onFocus={() => matches.length && setOpen(true)}
        onKeyDown={onKeyDown}
      />
      {busy && <Loader2 aria-label={t.searching} className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
      {open && matches.length > 0 && (
        <ul id={listId} role="listbox" className="absolute left-0 right-0 z-50 mt-1 max-h-72 overflow-y-auto rounded-xl border border-border bg-card p-1 text-sm shadow-xl">
          {matches.map((person, index) => (
            <li
              key={`${person.kind}:${person.id}`}
              role="option"
              aria-selected={index === active}
              onMouseDown={(event) => { event.preventDefault(); pick(person); }}
              className={`flex cursor-pointer items-start gap-2 rounded-lg px-3 py-2 ${index === active ? 'bg-muted' : 'hover:bg-muted'}`}
            >
              <UserCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
              <span className="min-w-0">
                <span className="block font-semibold text-foreground">{person.name}</span>
                <span className="block text-xs text-muted-foreground">
                  {[person.kind === 'STUDENT' ? t.student : t.member, person.membershipId || person.studentId, person.village, person.mobile].filter(Boolean).join(' · ')}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
      {showHint && <p className="mt-1 text-[0.7rem] font-normal text-muted-foreground">{t.hint}</p>}
    </div>
  );
}
