// A signed-in account whose family or student registration is approved (or an administrator). Such a member uses
// every public feature directly and is never asked to register or join again.
export const isRegisteredMember = (user) =>
  Boolean(user) && user.account?.status === 'ACTIVE' && ['FAMILY', 'STUDENT', 'ADMIN'].includes(user.account?.type);
