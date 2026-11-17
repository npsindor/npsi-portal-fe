// One village list for every form: the villages added in Admin → Address options first, then the 62 built-in
// native villages they don't already cover. Loaded once per page visit and shared by every picker.
import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { mergeOptions, NATIVE_VILLAGES } from '@/lib/native-places';

let managedVillages = null;
const loadManaged = () => {
  if (!managedVillages) {
    managedVillages = base44.addressOptions.list('VILLAGE').catch(() => {
      managedVillages = null; // try again next time instead of keeping the failure
      return [];
    });
  }
  return managedVillages;
};

export function useVillageOptions() {
  const [options, setOptions] = useState(NATIVE_VILLAGES);
  useEffect(() => {
    let live = true;
    loadManaged().then((rows) => live && setOptions(mergeOptions(rows, NATIVE_VILLAGES)));
    return () => { live = false; };
  }, []);
  return options;
}

// For lists that save other values (e.g. Sagun saves Hindi names): keep `own` as they are and add the villages
// it doesn't cover yet, matched on the English or Hindi name.
const key = (text) => String(text || '').toLowerCase().replace(/\s+/g, '');
export const addMissingVillages = (own, villages) => {
  const seen = new Set(own.flatMap((option) => [key(option.value), key(option.en), key(option.hi)]));
  return [...own, ...villages.filter((option) => !seen.has(key(option.en)) && !seen.has(key(option.hi)))];
};
