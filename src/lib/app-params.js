const isNode = typeof window === 'undefined';

const isClearAccessTokenRequested = () =>
  !isNode && new URLSearchParams(window.location.search).get('clear_access_token') === 'true';

const clearStoredAccessToken = () => {
  if (isNode) return;
  window.localStorage.removeItem('base44_access_token');
  window.localStorage.removeItem('token');
};

const getAppParams = () => {
  if (isClearAccessTokenRequested()) {
    clearStoredAccessToken();
  }

  return {
    appId: import.meta.env.VITE_BASE44_APP_ID || 'local-app',
    token: isNode ? '' : localStorage.getItem('base44_access_token') || '',
    functionsVersion: import.meta.env.VITE_BASE44_FUNCTIONS_VERSION || 'local',
    appBaseUrl: import.meta.env.VITE_BASE44_APP_BASE_URL || (isNode ? '' : window.location.origin),
  };
};

export const appParams = {
  ...getAppParams(),
};
