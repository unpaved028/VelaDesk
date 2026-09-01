/**
 * Cookie names for HMAC sessions. Edge-safe (no Node crypto).
 * Keep in sync with portalSession.ts / staffSession.ts signing code.
 */
export const PORTAL_SESSION_COOKIE_NAME = 'VELADESK_portal_session';
export const STAFF_SESSION_COOKIE_NAME = 'VELADESK_staff_session';
