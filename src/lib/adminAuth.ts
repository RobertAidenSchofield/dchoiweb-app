import { createHmac } from 'crypto';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'dchoi_admin_token';
const DEFAULT_FALLBACK_PIN = 'dchoi2026';
const AUTH_SECRET = process.env.ADMIN_AUTH_SECRET || 'dchoi-designs-chicago-artisan-woodcraft-salt-2026';

/**
 * Validates the admin password against environment variable or studio fallback.
 */
export function validateAdminPassword(password: string): boolean {
  const masterPassword = process.env.ADMIN_PASSWORD || DEFAULT_FALLBACK_PIN;
  return password === masterPassword;
}

/**
 * Returns whether the current request holds a valid admin session cookie.
 */
export async function isAuthenticatedAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;

  const expectedToken = getExpectedToken();
  return token === expectedToken;
}

export function getExpectedToken(): string {
  const masterPassword = process.env.ADMIN_PASSWORD || DEFAULT_FALLBACK_PIN;
  return createHmac('sha256', AUTH_SECRET)
    .update(`dchoi-auth-session-${masterPassword}`)
    .digest('hex');
}

export { COOKIE_NAME };

