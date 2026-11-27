// Sections of every public menu page whose content admins manage (Admin → Page Content).
// "intro" sections take a heading/text/media override only; "items" sections also take entries (cards).
export const PAGE_CONTENT = {
  home: {
    label: ['Home', 'मुख्य पृष्ठ'], path: '/#gallery',
    sections: { events: ['Upcoming Events', 'आगामी कार्यक्रम', 'intro'], gallery: ['Photo Gallery', 'फोटो गैलरी', 'items'] },
  },
  about: {
    label: ['About Us', 'हमारे बारे में'], path: '/about',
    sections: {
      hero: ['Page banner', 'पेज बैनर', 'intro'],
      organization: ['About the Organization', 'संगठन के बारे में', 'items'],
      'vision-mission': ['Vision & Mission', 'दृष्टि और लक्ष्य', 'items'],
      objectives: ['Our Objectives', 'हमारे उद्देश्य', 'items'],
      committee: ['Committee Members', 'समिति सदस्य', 'items'],
      rules: ['Rules & Principles', 'नियम और सिद्धांत', 'intro'],
      principles: ['Guiding Principles', 'मार्गदर्शक सिद्धांत', 'intro'],
    },
  },
  careers: {
    label: ['Career & Business', 'करियर और व्यवसाय'], path: '/career-business',
    sections: {
      hero: ['Page banner', 'पेज बैनर', 'intro'],
      'job-opportunities': ['Job Opportunities', 'नौकरी के अवसर', 'items'],
      'post-a-vacancy': ['Post a Vacancy', 'नौकरी की सूचना दें', 'items'],
      'business-directory': ['Business Directory', 'व्यवसाय निर्देशिका', 'items'],
      'career-guidance': ['Career Guidance', 'करियर मार्गदर्शन', 'items'],
      'business-promotion': ['Business Promotion', 'व्यवसाय प्रचार', 'items'],
    },
  },
  events: { label: ['Events & Programs', 'कार्यक्रम और आयोजन'], path: '/events', sections: { hero: ['Page banner', 'पेज बैनर', 'intro'], upcoming: ['Current & Upcoming Events', 'वर्तमान एवं आगामी कार्यक्रम', 'intro'], calendar: ['Event Calendar', 'कार्यक्रम कैलेंडर', 'intro'], past: ['Past Events', 'पिछले कार्यक्रम', 'intro'] } },
  'community-services': { label: ['Community Services', 'सामुदायिक सेवाएँ'], path: '/community-services', sections: { hero: ['Page banner', 'पेज बैनर', 'intro'], 'blood-donation': ['Blood Donation', 'रक्तदान', 'intro'], 'emergency-help': ['Emergency Help', 'आपातकालीन सहायता', 'intro'], 'social-welfare': ['Social Welfare', 'समाज कल्याण', 'intro'] } },
  news: { label: ['Sandesh', 'संदेश'], path: '/news', sections: { hero: ['Page banner', 'पेज बैनर', 'intro'], notices: ['Important Notices', 'महत्वपूर्ण सूचनाएँ', 'intro'], community: ['Community News', 'सामुदायिक समाचार', 'intro'], greetings: ['Festival Greetings', 'त्योहार शुभकामनाएँ', 'intro'] } },
  sagun: { label: ['Shagun Bandhan', 'शगुन बंधन'], path: '/sagun', sections: { hero: ['Page banner', 'पेज बैनर', 'intro'] } },
  transportation: { label: ['Travel & Assistance', 'यात्रा एवं सहायता'], path: '/travel-assistance', sections: { hero: ['Page banner', 'पेज बैनर', 'intro'] } },
  medical: { label: ['Health Support', 'स्वास्थ्य सहयोग'], path: '/medical', sections: { hero: ['Page banner', 'पेज बैनर', 'intro'] } },
  'room-hunting': { label: ['Room Hunting', 'आवास सहयोग'], path: '/room-hunting', sections: { hero: ['Page banner', 'पेज बैनर', 'intro'] } },
  feedback: { label: ['Feedback', 'सुझाव'], path: '/public-feedback', sections: { hero: ['Page banner', 'पेज बैनर', 'intro'], main: ['Page content', 'पेज सामग्री', 'items'] } },
  contact: { label: ['Contact Us', 'संपर्क करें'], path: '/contact', sections: { hero: ['Page banner', 'पेज बैनर', 'intro'], main: ['Contact details', 'संपर्क विवरण', 'items'] } },
  // Entries in "Page content" replace the built-in text (lib/legal-copy.js), one entry per numbered section.
  terms: { label: ['Terms & Conditions', 'नियम और शर्तें'], path: '/terms', sections: { hero: ['Page banner', 'पेज बैनर', 'intro'], main: ['Page content', 'पेज सामग्री', 'items'] } },
  privacy: { label: ['Privacy Policy', 'गोपनीयता नीति'], path: '/privacy', sections: { hero: ['Page banner', 'पेज बैनर', 'intro'], main: ['Page content', 'पेज सामग्री', 'items'] } },
};

export const youtubeId = (url) => String(url || '').match(/^https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/i)?.[1] || null;
// Admin text in the current language, falling back to English.
export const blockText = (block, key, lang) => (block ? (lang === 'hi' && block[`${key}Hi`]) || block[key] || '' : '');
