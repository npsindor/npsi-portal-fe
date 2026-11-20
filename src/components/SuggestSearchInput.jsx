import React, { useEffect, useId, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { useLang } from '@/lib/i18n';

// A search box with auto-suggest from the page's own data (see lib/search-suggestions.js). Typing filters as before;
// the list offers matching names / IDs / titles, picked with the mouse or ↑ ↓ Enter, closed with Escape. Without
// suggestions it is a plain search box.
export default function SuggestSearchInput({ value, onChange, suggestions = [], placeholder, ariaLabel, id, className = '', inputClassName, icon = true, autoFocus = false, maxLength }) {
  const { lang } = useLang();
  const listId = useId();
  const box = useRef(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const list = String(value || '').trim() ? suggestions : [];
  const showing = open && list.length > 0;

  useEffect(() => {
    const close = (event) => { if (!box.current?.contains(event.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  useEffect(() => { setActive(-1); }, [value]);

  const pick = (text) => { onChange(text); setOpen(false); setActive(-1); };
  const onKeyDown = (event) => {
    if (!showing) { if (event.key === 'ArrowDown' && list.length) setOpen(true); return; }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((current) => (current + (event.key === 'ArrowDown' ? 1 : -1) + list.length) % list.length);
    } else if (event.key === 'Enter' && active >= 0) {
      event.preventDefault();
      pick(list[active]);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={box} className={`relative ${className}`}>
      {icon && <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />}
      <input
        id={id}
        type="search"
        role="combobox"
        aria-label={ariaLabel || placeholder}
        aria-expanded={showing}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showing && active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        autoFocus={autoFocus}
        maxLength={maxLength}
        value={value}
        placeholder={placeholder}
        onChange={(event) => { onChange(event.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        className={inputClassName || `w-full rounded-full border border-gold/40 bg-card py-2.5 ${icon ? 'pl-10' : 'pl-4'} pr-4 text-sm outline-none focus:border-maroon`}
      />
      {showing && (
        <ul id={listId} role="listbox" aria-label={lang === 'hi' ? 'सुझाव' : 'Suggestions'} className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-xl border border-border bg-card p-1 text-sm shadow-xl">
          {list.map((text, index) => (
            <li
              key={text}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === active}
              onMouseDown={(event) => { event.preventDefault(); pick(text); }}
              onMouseEnter={() => setActive(index)}
              className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 ${index === active ? 'bg-muted' : 'hover:bg-muted'}`}
            >
              <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span className="truncate">{text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
