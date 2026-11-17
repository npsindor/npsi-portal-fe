// Sandesh (news) categories: stored value → [English, Hindi]. Must match ANNOUNCEMENT_CATEGORIES in the API.
export const SANDESH_CATEGORIES = {
  ORGANIZATION: ['Organization News', 'संगठन समाचार'],
  COMMUNITY: ['Community Updates', 'सामुदायिक अपडेट'],
  SOCIAL: ['Social Activities', 'सामाजिक गतिविधियाँ'],
  EDUCATION: ['Education', 'शिक्षा'],
  EVENTS: ['Events', 'कार्यक्रम'],
  IMPORTANT: ['Important Announcements', 'महत्वपूर्ण घोषणाएँ'],
  PUBLIC_NOTICE: ['Public Notices', 'सार्वजनिक सूचनाएँ'],
};
export const categoryLabel = (value, lang) => SANDESH_CATEGORIES[value]?.[lang === 'hi' ? 1 : 0] || '';
