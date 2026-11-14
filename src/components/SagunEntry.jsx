import { Link } from 'react-router-dom';
import { useHeroText } from '@/components/PageContent';
import { BadgeCheck, Camera, ChevronRight, CreditCard, Lock, Mars, Users, Venus } from 'lucide-react';

const copy = {
  en: {
    kicker: 'Nimar Patidar Sangathan, Indore',
    title: 'Sagun Registration',
    subtitle: 'Register a matrimonial profile for a member of your family. Choose a category to begin.',
    trust: ['Private by default', 'Verified by the committee', 'Shared only with your consent'],
    choose: 'Choose a registration category',
    bride: 'Bride Registration',
    brideHi: 'वधू पंजीकरण',
    brideNote: 'For a daughter or sister of the family, aged 18 or above.',
    groom: 'Groom Registration',
    groomHi: 'वर पंजीकरण',
    groomNote: 'For a son or brother of the family, aged 21 or above.',
    howTitle: 'How it works',
    how: ['Choose bride or groom', 'Complete the short 6-step form', 'Submit for committee approval'],
    readyTitle: 'Keep these ready',
    ready: ['A recent photograph', 'Aadhaar card copy', 'Your Family ID from portal registration'],
    member: 'Registered family member?',
    login: 'Log in to load your family details',
  },
  hi: {
    kicker: 'निमाड़ पाटीदार संगठन, इंदौर',
    title: 'सगुन पंजीकरण',
    subtitle: 'अपने परिवार के सदस्य का वैवाहिक परिचय पंजीकृत करें। शुरू करने के लिए एक विकल्प चुनें।',
    trust: ['डिफ़ॉल्ट रूप से निजी', 'समिति द्वारा सत्यापित', 'केवल आपकी सहमति से साझा'],
    choose: 'पंजीकरण का प्रकार चुनें',
    bride: 'वधू पंजीकरण',
    brideHi: 'Bride Registration',
    brideNote: 'परिवार की बेटी या बहन के लिए, आयु 18 वर्ष या अधिक।',
    groom: 'वर पंजीकरण',
    groomHi: 'Groom Registration',
    groomNote: 'परिवार के बेटे या भाई के लिए, आयु 21 वर्ष या अधिक।',
    howTitle: 'प्रक्रिया',
    how: ['वधू या वर चुनें', '6 चरणों का छोटा फ़ॉर्म भरें', 'समिति की स्वीकृति के लिए जमा करें'],
    readyTitle: 'ये तैयार रखें',
    ready: ['हाल की फोटो', 'आधार कार्ड की कॉपी', 'पोर्टल पंजीकरण की परिवार आईडी'],
    member: 'पंजीकृत परिवार सदस्य हैं?',
    login: 'परिवार का विवरण लाने के लिए लॉग इन करें',
  },
};

// Landing page of /sagun: pick Bride or Groom, then the registration form opens.
export default function SagunEntry({ lang, selection, onSelect, isAuthenticated }) {
  const c = copy[lang] || copy.en;
  const hero = useHeroText('sagun', lang);
  const choices = [
    { key: 'bride', Icon: Venus, title: c.bride, alt: c.brideHi, note: c.brideNote },
    { key: 'groom', Icon: Mars, title: c.groom, alt: c.groomHi, note: c.groomNote },
  ];
  const trustIcons = [Lock, BadgeCheck, Users];
  const readyIcons = [Camera, CreditCard, Users];
  return (
    <main className="sagun-entry">
      <section className="sagun-entry-hero">
        <div className="sagun-entry-wrap">
          <p className="sagun-entry-kicker">{c.kicker} · सगुन</p>
          <h1>{hero.title || c.title}</h1>
          <p className="sagun-entry-subtitle">{hero.intro || c.subtitle}</p>
          <ul className="sagun-entry-trust">
            {c.trust.map((text, index) => {
              const Icon = trustIcons[index];
              return (
                <li key={text}>
                  <Icon aria-hidden="true" />
                  {text}
                </li>
              );
            })}
          </ul>
        </div>
      </section>
      <div className="sagun-entry-wrap sagun-entry-body">
        <fieldset className="sagun-choice-grid">
          <legend className="sagun-entry-legend">{c.choose}</legend>
          {choices.map(({ key, Icon, title, alt, note }) => (
            <label key={key} className={`sagun-choice sagun-choice-${key} ${selection === key ? 'selected' : ''}`}>
              <input type="radio" name="sagun-category" value={key} checked={selection === key} onChange={() => onSelect(key)} />
              <span className="sagun-choice-icon" aria-hidden="true">
                <Icon />
              </span>
              <span className="sagun-choice-text">
                <strong>{title}</strong>
                <span className="sagun-choice-alt">{alt}</span>
                <span className="sagun-choice-note">{note}</span>
              </span>
              <ChevronRight className="sagun-choice-arrow" aria-hidden="true" />
            </label>
          ))}
        </fieldset>
        <div className="sagun-entry-info">
          <section aria-labelledby="sagun-how">
            <h2 id="sagun-how">{c.howTitle}</h2>
            <ol className="sagun-how-list">
              {c.how.map((text) => (
                <li key={text}>{text}</li>
              ))}
            </ol>
          </section>
          <section aria-labelledby="sagun-ready">
            <h2 id="sagun-ready">{c.readyTitle}</h2>
            <ul className="sagun-ready-list">
              {c.ready.map((text, index) => {
                const Icon = readyIcons[index];
                return (
                  <li key={text}>
                    <Icon aria-hidden="true" />
                    {text}
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
        {!isAuthenticated && (
          <p className="sagun-login-note">
            {c.member}{' '}
            <Link to={`/login?returnTo=${encodeURIComponent('/sagun')}`}>{c.login}</Link>
          </p>
        )}
      </div>
    </main>
  );
}
