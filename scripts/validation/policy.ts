export const EXPECTED_STATIC_OUTPUT_DIRECTORY = 'dist' as const;
export const PUBLIC_CLIENT_KEY_PREFIX = 'VITE_' as const;

export type ClientEnvironmentMode = 'development' | 'production';
export type PublicClientKey = `${typeof PUBLIC_CLIENT_KEY_PREFIX}${string}`;

export interface PublicClientConfigurationRule {
  readonly key: PublicClientKey;
  readonly requiredIn: readonly ClientEnvironmentMode[];
  readonly validateValue: (value: string) => boolean;
}

// The portfolio currently has a zero-required-variable baseline. A future
// public browser value must be added here deliberately, with its environments
// and format validator, before production validation will accept it.
export const PUBLIC_CLIENT_CONFIGURATION: readonly PublicClientConfigurationRule[] =
  [];

const forbiddenClientKeyParts = [
  'ACCESS_KEY',
  'API_KEY',
  'CLIENT_SECRET',
  'CREDENTIAL',
  'PASSWORD',
  'PASSWD',
  'PRIVATE_KEY',
  'SECRET',
  'SIGNING_KEY',
  'TOKEN',
] as const;

export function isPublicClientKey(value: string): value is PublicClientKey {
  return /^VITE_[A-Z][A-Z0-9_]*$/.test(value);
}

export function isForbiddenPublicClientKey(value: string): boolean {
  if (!value.startsWith(PUBLIC_CLIENT_KEY_PREFIX)) {
    return false;
  }

  const suffix = value.slice(PUBLIC_CLIENT_KEY_PREFIX.length).toUpperCase();
  return forbiddenClientKeyParts.some((part) => suffix.includes(part));
}

export function environmentFileNamesForMode(
  mode: ClientEnvironmentMode,
): readonly string[] {
  return ['.env', '.env.local', `.env.${mode}`, `.env.${mode}.local`];
}
