export const MAX_TARGET_URL_LENGTH = 2048;
export const MIN_CUSTOM_ALIAS_LENGTH = 3;
export const MAX_CUSTOM_ALIAS_LENGTH = 32;

export const RESERVED_ALIASES = new Set([
  'api',
  'docs',
  'health',
  'ready',
  'login',
  'logout',
  'register',
  'verify-email',
  'assets',
  'admin',
]);

const CUSTOM_ALIAS_PATTERN = /^[a-z0-9][a-z0-9_-]*$/;

export function validateTargetUrl(value: string): string {
  if (value.length === 0 || value.length > MAX_TARGET_URL_LENGTH) {
    throw new Error('Target URL must be between 1 and 2048 characters');
  }

  let parsed: URL;

  try {
    parsed = new URL(value);
  } catch {
    throw new Error('Target URL must be an absolute HTTP or HTTPS URL');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Target URL must use HTTP or HTTPS');
  }

  if (!parsed.hostname) {
    throw new Error('Target URL must include a hostname');
  }

  if (parsed.username || parsed.password) {
    throw new Error('Target URL must not include embedded credentials');
  }

  return value;
}

export function normalizeCustomAlias(value: string): string {
  const alias = value.toLowerCase();

  if (
    alias.length < MIN_CUSTOM_ALIAS_LENGTH ||
    alias.length > MAX_CUSTOM_ALIAS_LENGTH
  ) {
    throw new Error('Custom alias must be between 3 and 32 characters');
  }

  if (!CUSTOM_ALIAS_PATTERN.test(alias)) {
    throw new Error(
      'Custom alias must start with an alphanumeric character and contain only a-z, 0-9, _ or -',
    );
  }

  if (RESERVED_ALIASES.has(alias)) {
    throw new Error('Custom alias is reserved');
  }

  return alias;
}

export function normalizeExpiration(
  value: Date | string | null | undefined,
  now = new Date(),
): Date | null {
  if (value == null) {
    return null;
  }

  const expiration =
    value instanceof Date ? new Date(value.getTime()) : new Date(value);

  if (Number.isNaN(expiration.getTime())) {
    throw new Error('Expiration must be a valid date/time');
  }

  if (expiration.getTime() <= now.getTime()) {
    throw new Error('Expiration must be strictly in the future');
  }

  return expiration;
}
