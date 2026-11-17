import CreatableCombobox from '@/components/CreatableCombobox';
import { useLang } from '@/lib/i18n';
import { addMissingVillages, useVillageOptions } from '@/lib/villages';

const COPY = {
  en: { village: 'Village', searchOrType: 'Select or type a village…', useTyped: 'Use “{value}”', noMatch: 'Not in the list — what you type will be saved' },
  hi: { village: 'गाँव', searchOrType: 'गाँव चुनें या टाइप करें…', useTyped: '“{value}” चुनें', noMatch: 'सूची में नहीं है — जो लिखेंगे वही सहेजा जाएगा' },
};

// The village field used across the portal: pick one of the community's villages or type one that isn't listed.
// `options` replaces the default list (for forms that save their own values, like Sagun); `extra` adds names
// (e.g. villages from an uploaded sheet) after the list.
export default function VillageCombobox({ id, label, value, onChange, required = false, options, extra, lang: langProp, ...rest }) {
  const { lang: appLang } = useLang();
  const lang = langProp || appLang;
  const villages = useVillageOptions();
  const t = COPY[lang === 'hi' ? 'hi' : 'en'];
  const base = options || villages;
  const names = [...new Set((extra || []).map((name) => String(name || '').trim()).filter(Boolean))];
  const list = names.length ? addMissingVillages(base, names.map((name) => ({ value: name, en: name, hi: name }))) : base;
  return (
    <CreatableCombobox
      id={id}
      label={label ?? t.village}
      value={value || ''}
      onChange={onChange}
      options={list}
      lang={lang}
      t={t}
      required={required}
      maxLength={150}
      {...rest}
    />
  );
}
