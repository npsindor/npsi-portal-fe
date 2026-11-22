import { useBloodCopy } from "@/lib/blood-help";

// WhatsApp glyph (the brand mark is not in lucide).
export function WhatsAppIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.4.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3zM12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z" />
    </svg>
  );
}

// A WhatsApp contact button. Without a link (a completed request) it is grey and can't be clicked.
export default function WhatsAppButton({ href, label, name, size = "md" }) {
  const { t } = useBloodCopy();
  const text = label || t.contact;
  const pad = size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm";
  if (!href)
    return (
      <span role="button" aria-disabled="true" title={t.contactDisabled} className={`inline-flex cursor-not-allowed items-center gap-1.5 whitespace-nowrap rounded-lg border border-border bg-muted font-semibold text-muted-foreground opacity-70 ${pad}`}>
        <WhatsAppIcon />
        {text}
      </span>
    );
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={name ? t.whatsappTo(name) : text} className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-green-600 bg-white font-semibold text-green-700 transition hover:bg-green-50 dark:bg-transparent dark:text-green-400 dark:hover:bg-green-950/40 ${pad}`}>
      <WhatsAppIcon />
      {text}
    </a>
  );
}
