import { useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Label } from "@/components/ui/label";

const norm = (text) => String(text || "").toLowerCase().replace(/\s+/g, " ").trim();

// A text field with a searchable list (WAI-ARIA combobox): pick a listed option or keep typing a value that
// isn't listed. `options` are { value, en, hi }; the saved value is `value`, the label follows the language.
// `hideLabel` is for forms that render their own <label htmlFor={id}>; `inputClassName` restyles the field to match them.
export default function CreatableCombobox({ id, label, value, onChange, options, lang, t, required = true, maxLength = 150, autoComplete = "off", hideLabel = false, inputClassName }) {
  const listId = useId();
  const inputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  // The list filters only while the user types; opening it on a saved value (listed or not) shows every option.
  const [typing, setTyping] = useState(false);
  const labelOf = (option) => (lang === "hi" ? option.hi : option.en) || option.value;
  const selected = options.find((option) => option.value === value);
  const text = selected ? labelOf(selected) : value;

  const matches = useMemo(() => {
    const query = norm(text);
    if (!query || selected || !typing) return options;
    return options.filter((option) => [option.value, option.en, option.hi].some((name) => norm(name).includes(query)));
  }, [options, text, selected, typing]);

  // Typing the exact name of an option (in either language) selects it; anything else is kept as typed.
  const type = (typed) => {
    const exact = options.find((option) => [option.value, option.en, option.hi].some((name) => norm(name) === norm(typed)));
    onChange(exact ? exact.value : typed);
    setTyping(true);
    setOpen(true);
    setActive(-1);
  };
  const pick = (option) => {
    onChange(option.value);
    setOpen(false);
    setActive(-1);
  };
  const onKeyDown = (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActive((current) => (matches.length ? (current + step + matches.length) % matches.length : -1));
    } else if (event.key === "Enter" && open) {
      // Enter takes the highlighted option, or keeps what was typed; either way the list closes (and the form is not
      // submitted while the list is open).
      event.preventDefault();
      if (active >= 0 && matches[active]) pick(matches[active]);
      else setOpen(false);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="relative space-y-2">
      {!hideLabel && (
        <Label htmlFor={id}>
          {label}
          {required ? " *" : ""}
        </Label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          role="combobox"
          aria-expanded={open && matches.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
          className={inputClassName ? `${inputClassName} pr-10` : "h-11 w-full rounded-xl border border-border bg-background px-3 pr-10 text-sm outline-none focus:border-primary"}
          placeholder={t.searchOrType}
          autoComplete={autoComplete}
          maxLength={maxLength}
          value={text}
          required={required}
          onChange={(event) => type(event.target.value)}
          onFocus={() => { setTyping(false); setOpen(true); }}
          onClick={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKeyDown}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground"
          onMouseDown={(event) => {
            event.preventDefault();
            setOpen((current) => !current);
            inputRef.current?.focus();
          }}
        >
          <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
        </button>
      </div>
      {open && matches.length > 0 && (
        <ul id={listId} role="listbox" aria-label={label} className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-border bg-popover p-1 text-sm shadow-lg">
          {matches.map((option, index) => (
            <li
              key={option.value}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={option.value === value}
              className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 ${index === active ? "bg-muted" : "hover:bg-muted"}`}
              onMouseDown={(event) => {
                event.preventDefault();
                pick(option);
              }}
            >
              <span>{labelOf(option)}</span>
              {option.value === value && <Check className="h-4 w-4 text-primary" aria-hidden="true" />}
            </li>
          ))}
          {text && !selected && (
            <li role="presentation" className="px-3 py-2 text-xs text-muted-foreground">
              {t.useTyped.replace("{value}", text)}
            </li>
          )}
        </ul>
      )}
      {/* A value that isn't listed is kept as typed; the note sits in the flow, never over the buttons below. */}
      {text && !selected && matches.length === 0 && <p className="text-xs text-muted-foreground">{t.noMatch}</p>}
    </div>
  );
}
