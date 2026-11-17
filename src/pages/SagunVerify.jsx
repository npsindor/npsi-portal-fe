import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BadgeCheck, Loader2, ShieldAlert } from 'lucide-react';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';
import { sagunCardsApi } from '@/api/sagunCardsApi';
import { useLang } from '@/lib/i18n';

const words = {
  en: { title: 'Shagun Bandhan card verification', checking: 'Checking the card…', valid: 'Genuine and active card', invalid: 'This card is not active', invalidNote: 'The profile is not approved any more, was withdrawn, or the card is not valid. Please contact the Sangathan.', unknown: 'Card not found', unknownNote: 'This QR code does not belong to a Shagun Bandhan card issued by the Sangathan.', id: 'Shagun profile ID', name: 'Name', category: 'Category', place: 'Village / area', issued: 'Issued by', note: 'Contact details are never shown here. To connect with the family, log in to Shagun Bandhan and send a request.', open: 'Open Shagun Bandhan', boy: 'Boy (Groom)', girl: 'Girl (Bride)' },
  hi: { title: 'शगुन बंधन कार्ड सत्यापन', checking: 'कार्ड जाँच रहे हैं…', valid: 'वास्तविक और सक्रिय कार्ड', invalid: 'यह कार्ड सक्रिय नहीं है', invalidNote: 'परिचय अब स्वीकृत नहीं है, वापस ले लिया गया है, या कार्ड मान्य नहीं है। कृपया संगठन से संपर्क करें।', unknown: 'कार्ड नहीं मिला', unknownNote: 'यह QR कोड संगठन द्वारा जारी किसी शगुन बंधन कार्ड का नहीं है।', id: 'शगुन प्रोफ़ाइल आईडी', name: 'नाम', category: 'श्रेणी', place: 'ग्राम / क्षेत्र', issued: 'जारीकर्ता', note: 'यहाँ संपर्क विवरण कभी नहीं दिखाया जाता। परिवार से जुड़ने के लिए शगुन बंधन में लॉगिन करके अनुरोध भेजें।', open: 'शगुन बंधन खोलें', boy: 'युवक', girl: 'युवती' },
};

// Public page behind the QR code on a printed Sagun Bandhan card: genuine / active or not, and nothing private.
export default function SagunVerify() {
  const { token } = useParams();
  const { lang } = useLang();
  const t = words[lang] || words.en;
  const [state, setState] = useState({ loading: true });
  useEffect(() => { document.title = `${t.title} | ${lang === 'hi' ? 'निमाड़ पाटीदार संगठन, इंदौर' : 'Nimar Patidar Sangathan, Indore'}`; }, [t, lang]);
  useEffect(() => {
    let alive = true;
    sagunCardsApi.verify(token).then((result) => { if (alive) setState({ loading: false, result }); }).catch(() => { if (alive) setState({ loading: false, result: null }); });
    return () => { alive = false; };
  }, [token]);
  const result = state.result;
  const ok = result?.valid;
  return <div className="min-h-screen bg-background"><PublicNav />
    <main className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <h1 className="text-center font-display text-2xl font-semibold text-maroon sm:text-3xl">{t.title}</h1>
      <div className="mt-8 rounded-3xl border border-gold/40 bg-card p-6 shadow-sm sm:p-8">
        {state.loading ? <p role="status" className="flex items-center justify-center gap-2 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />{t.checking}</p> : <>
          <div className={`flex items-center gap-3 rounded-2xl p-4 ${ok ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100' : 'bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-100'}`} role="status">
            {ok ? <BadgeCheck className="h-8 w-8 shrink-0" /> : <ShieldAlert className="h-8 w-8 shrink-0" />}
            <div><p className="text-lg font-bold">{ok ? t.valid : result ? t.invalid : t.unknown}</p>{!ok && <p className="text-sm">{result ? t.invalidNote : t.unknownNote}</p>}</div>
          </div>
          {result && <dl className="mt-5 grid gap-3 text-sm">
            {[[t.id, result.profileCode], ...(ok ? [[t.name, result.name], [t.category, result.category === 'BRIDE' ? t.girl : t.boy], [t.place, result.place]] : []), [t.issued, result.issuedBy]].filter(([, value]) => value).map(([label, value]) => <div key={label} className="flex justify-between gap-4 border-b border-border pb-2"><dt className="text-muted-foreground">{label}</dt><dd className="text-right font-semibold">{value}</dd></div>)}
          </dl>}
          <p className="mt-5 text-xs text-muted-foreground">{t.note}</p>
          <Link to="/sagun" className="mt-5 inline-flex min-h-11 items-center rounded-full bg-maroon px-5 text-sm font-semibold text-cream">{t.open}</Link>
        </>}
      </div>
    </main>
    <PublicFooter /></div>;
}
