// Role-based admin access (Admin → Assign roles). The super admin (role "admin") sees the whole admin portal; a
// registered member given access ("sub-admin") sees only the pages of their areas, for their villages. The API
// enforces the same (npsi-portal-be/src/common/admin-access); this only shapes the menu.
export const ADMIN_AREAS = [
  {
    key: 'REGISTRATIONS',
    path: '/admin/applications',
    en: 'Family registration approval',
    hi: 'परिवार पंजीकरण स्वीकृति',
    descEn: 'See and approve / reject family registration requests.',
    descHi: 'परिवार पंजीकरण अनुरोध देखें और स्वीकृत / अस्वीकृत करें।',
  },
  {
    key: 'STUDENT_REGISTRATIONS',
    path: '/admin/students',
    en: 'Student registration approval',
    hi: 'विद्यार्थी पंजीकरण स्वीकृति',
    descEn: 'See and approve student registration requests. Needs "All villages" (student requests have no village).',
    descHi: 'विद्यार्थी पंजीकरण अनुरोध देखें और स्वीकृत करें। इसके लिए "सभी गाँव" ज़रूरी है (विद्यार्थी अनुरोध में गाँव नहीं होता)।',
  },
  {
    key: 'PAYMENTS',
    path: '/admin/registration-payments',
    en: 'Registration payment (transaction) approval',
    hi: 'पंजीकरण भुगतान (ट्रांज़ैक्शन) स्वीकृति',
    descEn: 'Verify, reject or refund registration fee payments.',
    descHi: 'पंजीकरण शुल्क के भुगतान सत्यापित, अस्वीकृत या रिफंड करें।',
  },
  {
    key: 'FAMILIES',
    path: '/admin/families',
    en: 'Families & new member approval',
    hi: 'परिवार और नए सदस्यों की स्वीकृति',
    descEn: 'See families and approve the members a family head added.',
    descHi: 'परिवार देखें और परिवार प्रमुख द्वारा जोड़े गए सदस्यों को स्वीकृत करें।',
  },
];

export const isSuperAdmin = (user) => user?.role === 'admin';
export const hasAdminAccess = (user) => isSuperAdmin(user) || Boolean(user?.adminAccess?.areas?.length);
export const allowedAdminPaths = (user) =>
  isSuperAdmin(user) ? null : ADMIN_AREAS.filter((area) => user?.adminAccess?.areas?.includes(area.key)).map((area) => area.path);
// Whether this account may open an admin page (null list = everything).
export const canOpenAdminPath = (user, pathname) => {
  const allowed = allowedAdminPaths(user);
  return allowed === null || allowed.some((path) => pathname === path || pathname.startsWith(`${path}/`));
};
export const areaLabel = (key, lang) => {
  const area = ADMIN_AREAS.find((item) => item.key === key);
  return area ? (lang === 'hi' ? area.hi : area.en) : key;
};
