const legacyApiUrl = process.env.REACT_APP_API_URL;
const legacyIsApiBase = Boolean(legacyApiUrl && /\/api\/?$/.test(legacyApiUrl));

const serverUrlFromLegacy = legacyApiUrl
  ? legacyIsApiBase
    ? legacyApiUrl.replace(/\/api\/?$/, '')
    : legacyApiUrl
  : undefined;

export const SERVER_URL = process.env.REACT_APP_SERVER_URL || serverUrlFromLegacy || 'http://localhost:5055';
export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  (legacyIsApiBase ? legacyApiUrl : undefined) ||
  `${SERVER_URL}/api`;
