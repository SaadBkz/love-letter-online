import { randomBytes } from 'node:crypto';

export function generateSessionToken(): string {
  return randomBytes(24).toString('base64url');
}

export function generatePlayerId(): string {
  // 12 chars alphanum
  return randomBytes(9).toString('base64url').slice(0, 12);
}
