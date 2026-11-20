import { useLang } from '@/lib/i18n';

// Texts for "Become an NPSI Event Member" (form, team sections, dashboard and admin), English and Hindi.
export const eventMemberCopy = {
  en: {
    quickTitle: 'Do you want to become a member?', applyingAs: 'Applying as', quickNote: 'Your name, mobile, village and photo are taken from your registration. You will be shown on the team page after approval; your mobile number stays hidden.', quickSubmit: 'Submit',
    become: 'Become a Member', becomeEvent: 'Become an NPSI Event Member', title: 'Become an NPSI Event Member',
    intro: 'Choose the team you want to join and check your details. The Sangathan reviews every request.',
    section: 'Area / interested event', choose: 'Select…', other: 'Other', otherName: 'Enter Event / Team Name',
    who: 'Applying for', someoneElse: 'Someone else (enter details)', filled: 'Filled from your registration — you can correct them for the team card; your registration stays unchanged.',
    photo: 'Photo', photoHelp: 'JPG, PNG or WebP, up to 5 MB', change: 'Change photo', upload: 'Upload photo',
    name: 'Name', mobile: 'Mobile number', email: 'Email ID', village: 'Village', area: 'Indore area / locality',
    mobilePublic: 'Show my mobile number on the team card', emailPublic: 'Show my email on the team card',
    consent: 'I agree that my name, photo, village and area are shown on the team page after approval.',
    submit: 'Submit Request', sending: 'Sending…', sent: 'Request submitted. You will appear on the team page once the Sangathan approves it.', close: 'Close', another: 'Submit another request',
    useTyped: 'Use', noMatch: 'No match — your text will be used', required: 'Required',
    myTitle: 'My event memberships', myNone: 'No requests yet.', withdraw: 'Withdraw', reason: 'Reason',
    status: { PENDING: 'Pending', APPROVED: 'Approved', REJECTED: 'Rejected', REMOVED: 'Removed', WITHDRAWN: 'Withdrawn' },
    teamEmpty: 'Approved members will appear here.', village_: 'Village', area_: 'Area', mobile_: 'Mobile', email_: 'Email',
    errors: {
      EM_SECTION: 'Choose the team / event.', EM_OTHER_NAME: 'Enter the event or team name.', EM_NAME: 'Enter the name (at least 2 letters).',
      EM_MOBILE: 'Enter a valid 10-digit mobile number.', EM_EMAIL: 'Enter a valid email ID.', EM_VILLAGE: 'Enter the village.', EM_AREA: 'Enter the Indore area / locality.',
      EM_CONSENT: 'Please agree to show the details on the team page.', EM_PHOTO: 'Please upload the photo again (JPG, PNG or WebP up to 5 MB).',
      EM_DUPLICATE: 'A request for this person and team is already pending or approved.', EM_ORDER: 'The team changed meanwhile. Close and open Arrange order again.', EM_PERSON: 'You can only apply for yourself or your own family members.',
      EM_NOT_PENDING: 'This request is no longer pending.', EM_REASON: 'Please give a reason.', EM_SECTION_REQUIRED: 'Choose the team section before approving.',
      EM_CONSENT_OWNER: 'Only the member can choose to show their mobile number or email.', EM_NOT_FOUND: 'Request not found.', EM_SECTION_FIELDS: 'Name and heading are required.',
      'reCAPTCHA verification failed. Please try again.': 'Security check failed. Please try again.',
    },
    error: 'Something went wrong. Please try again.',
  },
  hi: {
    quickTitle: 'क्या आप सदस्य बनना चाहते हैं?', applyingAs: 'आवेदक', quickNote: 'आपका नाम, मोबाइल, गाँव और फोटो आपके पंजीकरण से लिया जाएगा। स्वीकृति के बाद आप टीम पेज पर दिखेंगे; आपका मोबाइल नंबर छिपा रहेगा।', quickSubmit: 'सबमिट करें',
    become: 'सदस्य बनें', becomeEvent: 'एनपीएसआई इवेंट सदस्य बनें', title: 'एनपीएसआई इवेंट सदस्य बनें',
    intro: 'जिस टीम से जुड़ना चाहते हैं उसे चुनें और अपना विवरण जाँचें। हर अनुरोध की समीक्षा संगठन करता है।',
    section: 'क्षेत्र / रुचि का कार्यक्रम', choose: 'चुनें…', other: 'अन्य', otherName: 'कार्यक्रम / टीम का नाम लिखें',
    who: 'किसके लिए आवेदन', someoneElse: 'कोई और (विवरण भरें)', filled: 'आपके पंजीकरण से भरा गया — टीम कार्ड के लिए सुधार सकते हैं; आपका पंजीकरण नहीं बदलेगा।',
    photo: 'फोटो', photoHelp: 'JPG, PNG या WebP, 5 MB तक', change: 'फोटो बदलें', upload: 'फोटो अपलोड करें',
    name: 'नाम', mobile: 'मोबाइल नंबर', email: 'ईमेल आईडी', village: 'गाँव', area: 'इंदौर क्षेत्र / कॉलोनी',
    mobilePublic: 'टीम कार्ड पर मेरा मोबाइल नंबर दिखाएँ', emailPublic: 'टीम कार्ड पर मेरा ईमेल दिखाएँ',
    consent: 'मैं सहमत हूँ कि स्वीकृति के बाद मेरा नाम, फोटो, गाँव और क्षेत्र टीम पेज पर दिखाया जाए।',
    submit: 'अनुरोध भेजें', sending: 'भेजा जा रहा है…', sent: 'अनुरोध भेज दिया गया। संगठन की स्वीकृति के बाद आप टीम पेज पर दिखेंगे।', close: 'बंद करें', another: 'एक और अनुरोध भेजें',
    useTyped: 'उपयोग करें', noMatch: 'मेल नहीं मिला — आपका लिखा उपयोग होगा', required: 'आवश्यक',
    myTitle: 'मेरी इवेंट सदस्यता', myNone: 'अभी कोई अनुरोध नहीं।', withdraw: 'वापस लें', reason: 'कारण',
    status: { PENDING: 'लंबित', APPROVED: 'स्वीकृत', REJECTED: 'अस्वीकृत', REMOVED: 'हटाया गया', WITHDRAWN: 'वापस लिया गया' },
    teamEmpty: 'स्वीकृत सदस्य यहाँ दिखेंगे।', village_: 'गाँव', area_: 'क्षेत्र', mobile_: 'मोबाइल', email_: 'ईमेल',
    errors: {
      EM_SECTION: 'टीम / कार्यक्रम चुनें।', EM_OTHER_NAME: 'कार्यक्रम या टीम का नाम लिखें।', EM_NAME: 'नाम लिखें (कम से कम 2 अक्षर)।',
      EM_MOBILE: 'सही 10 अंकों का मोबाइल नंबर लिखें।', EM_EMAIL: 'सही ईमेल आईडी लिखें।', EM_VILLAGE: 'गाँव लिखें।', EM_AREA: 'इंदौर क्षेत्र / कॉलोनी लिखें।',
      EM_CONSENT: 'कृपया टीम पेज पर विवरण दिखाने की सहमति दें।', EM_PHOTO: 'कृपया फोटो दोबारा अपलोड करें (JPG, PNG या WebP, 5 MB तक)।',
      EM_DUPLICATE: 'इस व्यक्ति और टीम का अनुरोध पहले से लंबित या स्वीकृत है।', EM_ORDER: 'इस बीच टीम बदल गई है। क्रम तय करें को बंद करके फिर खोलें।', EM_PERSON: 'आप केवल स्वयं या अपने परिवार के सदस्यों के लिए आवेदन कर सकते हैं।',
      EM_NOT_PENDING: 'यह अनुरोध अब लंबित नहीं है।', EM_REASON: 'कृपया कारण लिखें।', EM_SECTION_REQUIRED: 'स्वीकृति से पहले टीम सेक्शन चुनें।',
      EM_CONSENT_OWNER: 'मोबाइल नंबर या ईमेल दिखाने का निर्णय केवल सदस्य ले सकते हैं।', EM_NOT_FOUND: 'अनुरोध नहीं मिला।', EM_SECTION_FIELDS: 'नाम और शीर्षक आवश्यक हैं।',
      'reCAPTCHA verification failed. Please try again.': 'सुरक्षा जाँच विफल रही। कृपया फिर प्रयास करें।',
    },
    error: 'कुछ गलत हुआ। कृपया फिर प्रयास करें।',
  },
};
export const useEventMemberCopy = () => {
  const { lang } = useLang();
  return { lang, t: eventMemberCopy[lang] || eventMemberCopy.en };
};
export const errorText = (t, cause) => t.errors[cause?.message] || cause?.message || t.error;
// The section's label / heading in the current language.
export const sectionLabel = (section, lang) => (lang === 'hi' && section?.labelHi) || section?.label || '';
export const sectionHeading = (section, lang) => (lang === 'hi' && section?.headingHi) || section?.heading || '';
