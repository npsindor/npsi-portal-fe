import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLang } from '@/lib/i18n';

export default function ContactLocationSelect({ id, label, options, value, other, onChange, onOtherChange, otherLabel, disabled }) {
  const [open, setOpen] = useState(false);
  const { lang, t } = useLang();
  const labelIndex = lang === 'hi' ? 1 : 0;
  const sortedOptions = [...options].sort((a, b) => a[labelIndex].localeCompare(b[labelIndex], lang === 'hi' ? 'hi-IN' : 'en-IN'));
  const selected = options.find(([key]) => key === value);
  const caption = value === '__other__' ? t('contact.other') : selected?.[lang === 'hi' ? 1 : 0];
  return <div className="space-y-1">
    <Label id={`${id}-label`} htmlFor={id}>{label} *</Label>
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button id={id} type="button" variant="outline" role="combobox" aria-labelledby={`${id}-label`} aria-expanded={open} aria-required="true" disabled={disabled} className="h-11 w-full justify-between font-normal">
          <span className="min-w-0 truncate">{caption || t('contact.choose')}</span><ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput className="text-base" placeholder={t('contact.search')} aria-label={`${label}: ${t('contact.search')}`} />
          <CommandList className="max-h-[min(240px,40dvh)]">
            <CommandEmpty>{t('contact.empty')}</CommandEmpty>
            <CommandGroup>
              {sortedOptions.map(([key, hi]) => <CommandItem className="min-h-11" key={key} value={`${key} ${hi}`} onSelect={() => { onChange(key); setOpen(false); }}>
                <Check className={`mr-2 h-4 w-4 ${key === value ? 'opacity-100' : 'opacity-0'}`} />{lang === 'hi' ? hi : key}
              </CommandItem>)}
            </CommandGroup>
          </CommandList>
          <Button variant="ghost" type="button" className="w-full justify-start border-t" onClick={() => { onChange('__other__'); setOpen(false); }}>{t('contact.other')}</Button>
        </Command>
      </PopoverContent>
    </Popover>
    {value === '__other__' && <div className="space-y-1">
      <Label htmlFor={`${id}-other`}>{otherLabel} *</Label>
      <Input className="h-11 text-base" id={`${id}-other`} required maxLength={150} value={other} onChange={e => onOtherChange(e.target.value)} disabled={disabled} />
    </div>}
  </div>;
}
