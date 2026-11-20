// Room Hunting texts (English / Hindi).
const en = {
  title: 'Room Hunting', intro: 'Find or offer a rental room or house within the community — Indore, Rau and Pithampur.',
  heroTagline: 'Aavas Sahyog · a home within the samaj', heroHeadline: 'Find a home among your own people',
  heroWays: 'How can we help?', heroFind: 'Find a room', heroFindNote: 'Rooms and houses listed by registered members.',
  heroPostNote: 'Tell us your budget and area; we match it with listings.', heroListNote: 'Have a room or house to rent? List it for the samaj.',
  heroChips: ['Indore · Rau · Pithampur', 'Listings checked by the Sangathan', 'Contact only with your consent'],
  tabListings: 'Available Listings', tabRequirements: 'People Looking for Rooms',
  type: 'Property Type', area: 'Area / Location', maxRent: 'Max rent (₹ / month)', search: 'Search', clear: 'Clear filters', anyType: 'Any type', anyArea: 'Any area',
  results: 'results', noListings: 'No listings match your search yet.', noRequirements: 'No open requirements match your search.',
  perMonth: '/ month', availableFrom: 'Available from', posted: 'Posted', for: 'Suitable for', FAMILY: 'Family', STUDENT: 'Student', ANY: 'Anyone',
  contact: 'Contact', hiddenContact: 'The owner has hidden contact details. Registered members and students can send an enquiry.', call: 'Call', email: 'Email',
  enquire: 'Send enquiry', enquiryTitle: 'Send an enquiry', enquiryMessage: 'Message to the owner', enquiryConsent: 'Share my name and registered mobile number with the owner.', enquirySent: 'Enquiry sent. The owner can now see your name and mobile number.',
  loginToEnquire: 'Log in as a registered member or student to send an enquiry.',
  addProperty: 'Add Rental Property', addPropertyHint: 'Registered family members and students can list a room or house. Listings are checked by the Sangathan before they are public.',
  postRequirement: 'Post Your Room Requirement', postRequirementHint: 'Tell us what you need. We match it with listings and let suitable owners know.',
  myDashboard: 'My Room Hunting', login: 'Log in', register: 'Register',
  membersOnly: 'Adding a rental property is available to registered NPS family members and registered students. Please complete Family or Student Registration first.',
  // Requirement form
  name: 'Your name', mobile: 'Mobile number', emailOptional: 'Email (optional)', budget: 'Monthly budget', budgetMin: 'Minimum (optional)', budgetMax: 'Maximum',
  budgetPresets: 'Quick budget', custom: 'Custom', moveIn: 'Preferred move-in date (optional)', note: 'Short note (optional)', tenantType: 'I am looking as',
  showMobile: 'Show my mobile number publicly', showEmail: 'Show my email publicly', visibility: 'Contact visibility',
  consent: 'I agree that my requirement is stored and shared with matching property owners.', submit: 'Submit requirement', submitting: 'Submitting…',
  requirementPublished: 'Your requirement is published. Matching listings are shown below.', requirementPending: 'Thank you. Your requirement will appear after a quick check by the Sangathan.',
  reference: 'Reference', matchesFound: 'Matching listings', noMatches: 'No matching listings right now. We will let owners of new matching listings know.',
  // Listing form
  rent: 'Monthly rent (₹)', availableFor: 'Available for', address: 'Full address (optional)', showAddress: 'Show the address publicly', description: 'Short description (optional)',
  photo: 'Property photographs (optional, up to 6)', photoHint: 'JPG, PNG or WebP, up to 5 MB each. The first photo is the cover.', addPhoto: 'Add photo', photoLimit: 'At most 6 photographs.', prevPhoto: 'Previous photo', nextPhoto: 'Next photo', photoOf: (n, total) => `Photo ${n} of ${total}`, makeCover: 'Make cover', uploadPhoto: 'Upload photo', replacePhoto: 'Replace photo', removePhoto: 'Remove photo', uploading: 'Uploading…',
  contactName: 'Contact name', contactMobile: 'Contact mobile', contactEmail: 'Contact email (optional)', visibilityHint: 'Choose what the public can see. If both are hidden, people send you an enquiry instead.',
  ownerConfirmed: 'I own this property or have the owner’s permission to list it.', saveListing: 'Submit listing', updateListing: 'Save changes', cancel: 'Cancel',
  listingSubmitted: 'Listing submitted. It will be public once approved.', listingUpdated: 'Listing updated and sent for review.',
  // Dashboard
  myListings: 'My Property Listings', myRequirements: 'My Room Requirements', matchingRequests: 'Matching requests', enquiries: 'Enquiries received', sentEnquiries: 'Enquiries I sent',
  edit: 'Edit', markRented: 'Mark rented', deactivate: 'Deactivate', relist: 'Re-list', remove: 'Delete', closeRequirement: 'Close requirement', confirmDelete: 'Delete this listing? It will no longer be visible.',
  confirmClose: 'Close this requirement?', none: 'Nothing here yet.', expires: 'Expires', remarks: 'Remarks',
  status: { PENDING: 'Pending approval', APPROVED: 'Live', AVAILABLE: 'Available', REJECTED: 'Rejected', RENTED: 'Rented', INACTIVE: 'Inactive', EXPIRED: 'Expired', CLOSED: 'Closed', ARCHIVED: 'Deleted', OPEN: 'Open' },
  required: 'Please fill the required fields marked *.', tooMany: 'Too many attempts. Please try again later.',
  errors: {
    ROOM_MEMBERSHIP_REQUIRED: 'This is available to registered NPS family members and registered students. Please complete Family or Student Registration first.',
    ROOM_MOBILE: 'Enter a valid 10-digit Indian mobile number.', ROOM_BUDGET: 'The minimum budget cannot be more than the maximum.', ROOM_MOVE_IN_DATE: 'The move-in date cannot be in the past.',
    ROOM_DUPLICATE_REQUIREMENT: 'You already have an open requirement for this property type and area.', ROOM_DUPLICATE_LISTING: 'This listing is already posted.',
    ROOM_EMAIL_REQUIRED: 'Enter an email address to show it publicly.', ROOM_ENQUIRY_EXISTS: 'You have already sent an enquiry for this listing.', ROOM_OWN_LISTING: 'This is your own listing.',
    ROOM_MOBILE_REQUIRED: 'Add a mobile number to your account first.', ROOM_NOT_FOUND: 'This record is no longer available.', ROOM_STATE: 'This action is not possible in the current status.',
    ROOM_REMARKS_REQUIRED: 'Enter remarks for a rejection.', fallback: 'Something went wrong. Please try again.',
  },
};
const hi = {
  title: 'आवास सहयोग', intro: 'समाज के भीतर किराए का कमरा या मकान खोजें या दें — इंदौर, राऊ और पीथमपुर।',
  heroTagline: 'आवास सहयोग · समाज के बीच अपना घर', heroHeadline: 'अपनों के बीच अपना घर खोजें',
  heroWays: 'हम कैसे मदद करें?', heroFind: 'कमरा खोजें', heroFindNote: 'पंजीकृत सदस्यों द्वारा दिए गए कमरे और मकान।',
  heroPostNote: 'अपना बजट और क्षेत्र बताएँ; हम उपयुक्त लिस्टिंग से मिलाते हैं।', heroListNote: 'किराए के लिए कमरा या मकान है? समाज के लिए सूची में जोड़ें।',
  heroChips: ['इंदौर · राऊ · पीथमपुर', 'लिस्टिंग संगठन द्वारा जाँची जाती है', 'संपर्क केवल आपकी सहमति से'],
  tabListings: 'उपलब्ध लिस्टिंग', tabRequirements: 'कमरा खोज रहे लोग',
  type: 'संपत्ति का प्रकार', area: 'क्षेत्र / स्थान', maxRent: 'अधिकतम किराया (₹ / माह)', search: 'खोजें', clear: 'फ़िल्टर हटाएँ', anyType: 'कोई भी प्रकार', anyArea: 'कोई भी क्षेत्र',
  results: 'परिणाम', noListings: 'आपकी खोज से मेल खाने वाली कोई लिस्टिंग अभी नहीं है।', noRequirements: 'आपकी खोज से मेल खाती कोई खुली आवश्यकता नहीं है।',
  perMonth: '/ माह', availableFrom: 'उपलब्ध तिथि', posted: 'पोस्ट', for: 'किसके लिए', FAMILY: 'परिवार', STUDENT: 'विद्यार्थी', ANY: 'कोई भी',
  contact: 'संपर्क', hiddenContact: 'मालिक ने संपर्क विवरण छिपाया है। पंजीकृत सदस्य और विद्यार्थी पूछताछ भेज सकते हैं।', call: 'कॉल करें', email: 'ईमेल',
  enquire: 'पूछताछ भेजें', enquiryTitle: 'पूछताछ भेजें', enquiryMessage: 'मालिक के लिए संदेश', enquiryConsent: 'मेरा नाम और पंजीकृत मोबाइल नंबर मालिक के साथ साझा करें।', enquirySent: 'पूछताछ भेज दी गई। मालिक अब आपका नाम और मोबाइल नंबर देख सकते हैं।',
  loginToEnquire: 'पूछताछ भेजने के लिए पंजीकृत सदस्य या विद्यार्थी के रूप में लॉगिन करें।',
  addProperty: 'किराए की संपत्ति जोड़ें', addPropertyHint: 'पंजीकृत परिवार सदस्य और विद्यार्थी कमरा या मकान सूचीबद्ध कर सकते हैं। सार्वजनिक होने से पहले संगठन लिस्टिंग की जाँच करता है।',
  postRequirement: 'अपनी कमरे की आवश्यकता बताएं', postRequirementHint: 'बताइए आपको क्या चाहिए। हम इसे लिस्टिंग से मिलाते हैं और उपयुक्त मालिकों को सूचित करते हैं।',
  myDashboard: 'मेरा आवास सहयोग', login: 'लॉगिन', register: 'पंजीकरण',
  membersOnly: 'किराए की संपत्ति जोड़ना पंजीकृत परिवार सदस्यों और पंजीकृत विद्यार्थियों के लिए उपलब्ध है। कृपया पहले परिवार या विद्यार्थी पंजीकरण करें।',
  name: 'आपका नाम', mobile: 'मोबाइल नंबर', emailOptional: 'ईमेल (वैकल्पिक)', budget: 'मासिक बजट', budgetMin: 'न्यूनतम (वैकल्पिक)', budgetMax: 'अधिकतम',
  budgetPresets: 'त्वरित बजट', custom: 'अन्य', moveIn: 'पसंदीदा शिफ्ट होने की तिथि (वैकल्पिक)', note: 'संक्षिप्त टिप्पणी (वैकल्पिक)', tenantType: 'मैं खोज रहा/रही हूँ',
  showMobile: 'मेरा मोबाइल नंबर सार्वजनिक रूप से दिखाएं', showEmail: 'मेरा ईमेल सार्वजनिक रूप से दिखाएं', visibility: 'संपर्क दृश्यता',
  consent: 'मैं सहमत हूँ कि मेरी आवश्यकता सहेजी जाए और मेल खाने वाले संपत्ति मालिकों के साथ साझा की जाए।', submit: 'आवश्यकता जमा करें', submitting: 'जमा हो रहा है…',
  requirementPublished: 'आपकी आवश्यकता प्रकाशित हो गई है। मेल खाने वाली लिस्टिंग नीचे दी गई हैं।', requirementPending: 'धन्यवाद। संगठन की संक्षिप्त जाँच के बाद आपकी आवश्यकता दिखाई देगी।',
  reference: 'संदर्भ', matchesFound: 'मेल खाने वाली लिस्टिंग', noMatches: 'अभी कोई मेल खाने वाली लिस्टिंग नहीं है। नई मेल खाने वाली लिस्टिंग के मालिकों को सूचित किया जाएगा।',
  rent: 'मासिक किराया (₹)', availableFor: 'किसके लिए उपलब्ध', address: 'पूरा पता (वैकल्पिक)', showAddress: 'पता सार्वजनिक रूप से दिखाएं', description: 'संक्षिप्त विवरण (वैकल्पिक)',
  photo: 'संपत्ति की फोटो (वैकल्पिक, अधिकतम 6)', photoHint: 'जेपीजी, पीएनजी या वेबपी, हर फोटो अधिकतम 5 एमबी। पहली फोटो कवर होगी।', addPhoto: 'फोटो जोड़ें', photoLimit: 'अधिकतम 6 फोटो।', prevPhoto: 'पिछली फोटो', nextPhoto: 'अगली फोटो', photoOf: (n, total) => `फोटो ${n} / ${total}`, makeCover: 'कवर बनाएँ', uploadPhoto: 'फोटो अपलोड करें', replacePhoto: 'फोटो बदलें', removePhoto: 'फोटो हटाएँ', uploading: 'अपलोड हो रहा है…',
  contactName: 'संपर्क नाम', contactMobile: 'संपर्क मोबाइल', contactEmail: 'संपर्क ईमेल (वैकल्पिक)', visibilityHint: 'चुनें कि जनता क्या देख सकती है। दोनों छिपे हों तो लोग आपको पूछताछ भेजेंगे।',
  ownerConfirmed: 'मैं इस संपत्ति का मालिक हूँ या इसे सूचीबद्ध करने के लिए मालिक की अनुमति मेरे पास है।', saveListing: 'लिस्टिंग जमा करें', updateListing: 'बदलाव सहेजें', cancel: 'रद्द करें',
  listingSubmitted: 'लिस्टिंग जमा हो गई। स्वीकृति के बाद यह सार्वजनिक होगी।', listingUpdated: 'लिस्टिंग अपडेट हुई और जाँच के लिए भेजी गई।',
  myListings: 'मेरी संपत्ति लिस्टिंग', myRequirements: 'मेरी कमरे की आवश्यकताएँ', matchingRequests: 'मेल खाने वाले अनुरोध', enquiries: 'प्राप्त पूछताछ', sentEnquiries: 'मेरी भेजी पूछताछ',
  edit: 'संपादित करें', markRented: 'किराए पर दिया', deactivate: 'निष्क्रिय करें', relist: 'फिर से सूचीबद्ध करें', remove: 'हटाएँ', closeRequirement: 'आवश्यकता बंद करें', confirmDelete: 'यह लिस्टिंग हटाएँ? यह अब दिखाई नहीं देगी।',
  confirmClose: 'यह आवश्यकता बंद करें?', none: 'अभी कुछ नहीं।', expires: 'समाप्ति', remarks: 'टिप्पणी',
  status: { PENDING: 'स्वीकृति लंबित', APPROVED: 'सक्रिय', AVAILABLE: 'उपलब्ध', REJECTED: 'अस्वीकृत', RENTED: 'किराए पर', INACTIVE: 'निष्क्रिय', EXPIRED: 'समाप्त', CLOSED: 'बंद', ARCHIVED: 'हटाई गई', OPEN: 'खुली' },
  required: 'कृपया * से चिह्नित आवश्यक जानकारी भरें।', tooMany: 'बहुत अधिक प्रयास। कुछ देर बाद फिर प्रयास करें।',
  errors: {
    ROOM_MEMBERSHIP_REQUIRED: 'यह सुविधा पंजीकृत परिवार सदस्यों और पंजीकृत विद्यार्थियों के लिए है। कृपया पहले परिवार या विद्यार्थी पंजीकरण करें।',
    ROOM_MOBILE: 'मान्य 10 अंकों का भारतीय मोबाइल नंबर भरें।', ROOM_BUDGET: 'न्यूनतम बजट अधिकतम से अधिक नहीं हो सकता।', ROOM_MOVE_IN_DATE: 'शिफ्ट होने की तिथि बीती हुई नहीं हो सकती।',
    ROOM_DUPLICATE_REQUIREMENT: 'इस प्रकार और क्षेत्र के लिए आपकी एक आवश्यकता पहले से खुली है।', ROOM_DUPLICATE_LISTING: 'यह लिस्टिंग पहले से पोस्ट है।',
    ROOM_EMAIL_REQUIRED: 'ईमेल सार्वजनिक दिखाने के लिए ईमेल भरें।', ROOM_ENQUIRY_EXISTS: 'आप इस लिस्टिंग के लिए पहले ही पूछताछ भेज चुके हैं।', ROOM_OWN_LISTING: 'यह आपकी अपनी लिस्टिंग है।',
    ROOM_MOBILE_REQUIRED: 'पहले अपने खाते में मोबाइल नंबर जोड़ें।', ROOM_NOT_FOUND: 'यह रिकॉर्ड अब उपलब्ध नहीं है।', ROOM_STATE: 'वर्तमान स्थिति में यह कार्य संभव नहीं है।',
    ROOM_REMARKS_REQUIRED: 'अस्वीकृति के लिए टिप्पणी लिखें।', fallback: 'कुछ गलत हो गया। कृपया फिर से प्रयास करें।',
  },
};
export const roomCopy = { en, hi };
// Known error codes get a translated message; server validation messages are shown as they are.
export const roomError = (t, error) => {
  const message = error?.message || '';
  if (t.errors[message]) return t.errors[message];
  if (error?.status === 429) return t.tooMany;
  return message && !/^ROOM_/.test(message) ? message : t.errors.fallback;
};
export const BUDGETS = [[3000, 5000], [5000, 8000], [8000, 12000], [12000, 20000], [20000, null]];
export const rupees = (value, lang) => (value == null ? '' : new Intl.NumberFormat(lang === 'hi' ? 'hi-IN' : 'en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value));
export const optionList = (rows) => (rows || []).map((row) => ({ value: row.value, en: row.value, hi: row.hi || row.value }));
export const comboCopy = (lang) => (lang === 'hi' ? { searchOrType: 'खोजें या लिखें', noMatch: 'सूची में नहीं है — लिखा हुआ मान रखा जाएगा', useTyped: 'लिखा हुआ उपयोग करें' } : { searchOrType: 'Search or type', noMatch: 'Not in the list — your typed value will be used', useTyped: 'Use typed value' });
