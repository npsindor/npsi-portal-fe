// Header navigation: top-level pages plus two small dropdowns (Services, Contact), so the bar stays uncluttered.
// Every entry is a public page; admin-only pages never appear here.
export const publicNavigation = [
  { label: 'Home', to: '/' },
  { label: 'About Us', to: '/about' },
  { label: 'Events & Programs', to: '/events' },
  { label: 'Sandesh', to: '/news' },
  { label: 'Services', items: [['Shagun Bandhan', '/sagun'], ['Transportation', '/transportation'], ['Room Hunting', '/room-hunting'], ['Health Support', '/medical']] },
  { label: 'Blood Donor', to: '/community-services' },
  { label: 'Career & Business', to: '/career-business' },
  { label: 'Contact', items: [['Contact Us', '/contact'], ['Feedback', '/public-feedback']] },
];

// Every page in menu order ({ label, to }), for the footer, the home page service cards and tests.
export const flatNavigation = publicNavigation.flatMap((item) => (item.items ? item.items.map(([label, to]) => ({ label, to })) : [item]));
