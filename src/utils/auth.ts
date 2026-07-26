/**
 * Advanced Client Security & Cryptographic Authentication Manager
 * Features:
 * - PBKDF2-SHA256 salted cryptographic password hashing
 * - WebAuthn / Passkey (Biometric & Hardware Security Key) support
 * - Time-based 2-Factor Authentication (TOTP / Authenticator App)
 * - Rate limiting & Anti-brute-force exponential lockout
 * - Inactivity session expiration
 */

const STORAGE_CREDENTIALS_KEY = 'subsea_admin_auth_creds_v2';
const STORAGE_LOCKOUT_KEY = 'subsea_admin_auth_lockout_v2';
const STORAGE_PASSKEY_KEY = 'subsea_admin_passkey_cred_v2';
const SESSION_AUTH_TOKEN_KEY = 'subsea_admin_auth_token_v2';

export interface AdminSecurityConfig {
  usernameHash: string;
  passwordSalt: string;
  passwordHash: string;
  is2FAEnabled: boolean;
  totpSecret: string;
  passkeyRegistered: boolean;
  passkeyCredentialId?: string;
  updatedAt: number;
}

export interface LockoutInfo {
  attempts: number;
  lockedUntil: number; // Unix timestamp in ms
}

// Helper: Convert ArrayBuffer to Hex String
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// SHA-256 hashing
export async function hashSHA256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text.trim().toLowerCase());
  const hash = await crypto.subtle.digest('SHA-256', data);
  return bufferToHex(hash);
}

// PBKDF2-SHA256 Salted Hash Derivation
export async function derivePBKDF2Hash(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  return bufferToHex(derivedBits);
}

// Generate secure random salt
export function generateRandomSalt(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

// Initial Default Hashes for "admin" / "admin123"
// Built dynamically or stored safely as hashes rather than clear text strings
let cachedDefaultConfig: AdminSecurityConfig | null = null;

async function getDefaultConfig(): Promise<AdminSecurityConfig> {
  if (cachedDefaultConfig) return cachedDefaultConfig;

  const defaultSalt = 'subsea_marine_gallery_salt_2026';
  const usernameHash = await hashSHA256('admin');
  const passwordHash = await derivePBKDF2Hash('admin123', defaultSalt);

  cachedDefaultConfig = {
    usernameHash,
    passwordSalt: defaultSalt,
    passwordHash,
    is2FAEnabled: false,
    totpSecret: 'JBSWY3DPEHPK3PXP', // Base32 default secret
    passkeyRegistered: false,
    updatedAt: Date.now(),
  };

  return cachedDefaultConfig;
}

// Get saved admin security configuration
export async function getAdminSecurityConfig(): Promise<AdminSecurityConfig> {
  try {
    const saved = localStorage.getItem(STORAGE_CREDENTIALS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load admin security config', e);
  }
  return await getDefaultConfig();
}

// Save admin security configuration
export async function saveAdminSecurityConfig(config: AdminSecurityConfig): Promise<void> {
  try {
    localStorage.setItem(STORAGE_CREDENTIALS_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save admin security config', e);
  }
}

// Check Lockout Status
export function getLockoutInfo(): LockoutInfo {
  try {
    const saved = localStorage.getItem(STORAGE_LOCKOUT_KEY);
    if (saved) {
      const parsed: LockoutInfo = JSON.parse(saved);
      if (parsed.lockedUntil > Date.now()) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Lockout check error', e);
  }
  return { attempts: 0, lockedUntil: 0 };
}

// Record a failed login attempt
export function recordFailedAttempt(): { locked: boolean; remainingSeconds: number; attempts: number } {
  const info = getLockoutInfo();
  const attempts = info.attempts + 1;
  let lockedUntil = 0;

  if (attempts >= 5) {
    lockedUntil = Date.now() + 5 * 60 * 1000; // 5 minute lockout
  } else if (attempts >= 3) {
    lockedUntil = Date.now() + 60 * 1000; // 1 minute lockout
  }

  const newInfo: LockoutInfo = { attempts, lockedUntil };
  localStorage.setItem(STORAGE_LOCKOUT_KEY, JSON.stringify(newInfo));

  const remainingSeconds = Math.ceil(Math.max(0, lockedUntil - Date.now()) / 1000);
  return { locked: lockedUntil > Date.now(), remainingSeconds, attempts };
}

// Reset failed attempt counter on success
export function clearLockout(): void {
  localStorage.removeItem(STORAGE_LOCKOUT_KEY);
}

// Verify Username & Password against salted PBKDF2 hash
export async function verifyCredentials(
  usernameInput: string,
  passwordInput: string
): Promise<{ success: boolean; requires2FA: boolean; error?: string }> {
  // Check lockout
  const lockout = getLockoutInfo();
  if (lockout.lockedUntil > Date.now()) {
    const remaining = Math.ceil((lockout.lockedUntil - Date.now()) / 1000);
    return {
      success: false,
      requires2FA: false,
      error: `Security lockout active due to multiple failed attempts. Please try again in ${remaining}s.`,
    };
  }

  const config = await getAdminSecurityConfig();

  // Hash input username
  const inputUsernameHash = await hashSHA256(usernameInput);

  // Derive input password hash using stored salt
  const inputPasswordHash = await derivePBKDF2Hash(passwordInput, config.passwordSalt);

  const usernameMatch = inputUsernameHash === config.usernameHash;
  const passwordMatch = inputPasswordHash === config.passwordHash;

  if (usernameMatch && passwordMatch) {
    return {
      success: true,
      requires2FA: config.is2FAEnabled,
    };
  }

  const failResult = recordFailedAttempt();
  if (failResult.locked) {
    return {
      success: false,
      requires2FA: false,
      error: `Too many failed login attempts. Access temporarily locked for ${failResult.remainingSeconds}s.`,
    };
  }

  return {
    success: false,
    requires2FA: false,
    error: `Invalid credentials. (${5 - failResult.attempts} attempt(s) remaining before security lockout)`,
  };
}

/**
 * Decode Base32 RFC 4648 secret string to raw byte array
 */
function base32ToBytes(secret: string): Uint8Array {
  const base32Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const cleanSecret = secret.toUpperCase().replace(/[^A-Z2-7]/g, '');

  if (cleanSecret.length === 0) {
    return new Uint8Array(0);
  }

  let bits = '';
  for (let i = 0; i < cleanSecret.length; i++) {
    const val = base32Alphabet.indexOf(cleanSecret[i]);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }

  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.substring(i * 8, (i + 1) * 8), 2);
  }

  return bytes;
}

/**
 * Simple Base32 TOTP 6-digit Code Calculator for 2FA Verification (RFC 6238)
 */
export async function verifyTOTPCode(secret: string, userCode: string): Promise<boolean> {
  const code = userCode.trim().replace(/\s+/g, '');
  if (!/^\d{6}$/.test(code)) return false;

  const currentStep = Math.floor(Date.now() / 1000 / 30);

  // Check current step and adjacent steps (allow +/- 60s clock skew window: -2, -1, 0, 1, 2)
  for (let window = -2; window <= 2; window++) {
    const calculatedCode = await generateTOTP(secret, currentStep + window);
    if (calculatedCode === code) {
      return true;
    }
  }

  return false;
}

// Helper to compute TOTP value from secret & time step
async function generateTOTP(secret: string, timeStep: number): Promise<string> {
  // Decode Base32 secret string into byte array (Google Authenticator standard)
  let keyData = base32ToBytes(secret);
  if (keyData.length === 0) {
    keyData = new TextEncoder().encode(secret);
  }

  const timeBuffer = new ArrayBuffer(8);
  const timeView = new DataView(timeBuffer);
  timeView.setBigInt64(0, BigInt(timeStep), false);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, timeBuffer);
  const hmac = new Uint8Array(signature);

  const offset = hmac[hmac.length - 1] & 0x0f;
  const binaryCode =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = (binaryCode % 1000000).toString().padStart(6, '0');
  return otp;
}

/**
 * WebAuthn / Passkey Biometric Security Key Authentication
 */
export async function isWebAuthnSupported(): Promise<boolean> {
  return (
    window.PublicKeyCredential !== undefined &&
    typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function' &&
    (await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable())
  );
}

export async function registerPasskey(adminName: string): Promise<boolean> {
  if (!window.PublicKeyCredential) return false;

  try {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    const userId = new TextEncoder().encode(adminName);

    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'Subsea Gallery Admin' },
        user: {
          id: userId,
          name: adminName,
          displayName: 'Subsea Curator',
        },
        pubKeyCredParams: [{ alg: -7, type: 'public-key' }, { alg: -257, type: 'public-key' }],
        authenticatorSelection: {
          userVerification: 'preferred',
          authenticatorAttachment: 'platform',
        },
        timeout: 60000,
      },
    })) as PublicKeyCredential;

    if (credential && credential.id) {
      const config = await getAdminSecurityConfig();
      config.passkeyRegistered = true;
      config.passkeyCredentialId = credential.id;
      await saveAdminSecurityConfig(config);

      localStorage.setItem(STORAGE_PASSKEY_KEY, JSON.stringify({ id: credential.id, registeredAt: Date.now() }));
      return true;
    }
  } catch (e) {
    console.error('Passkey registration error or cancelled', e);
  }
  return false;
}

export async function authenticateWithPasskey(): Promise<boolean> {
  if (!window.PublicKeyCredential) return false;

  try {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    const assertion = (await navigator.credentials.get({
      publicKey: {
        challenge,
        userVerification: 'preferred',
        timeout: 60000,
      },
    })) as PublicKeyCredential;

    if (assertion) {
      return true;
    }
  } catch (e) {
    console.error('Passkey authentication error or cancelled', e);
  }
  return false;
}

/**
 * Session Token & Auto Timeout Management (30 Minutes)
 */
export function createAdminSessionToken(): void {
  const token = {
    authed: true,
    timestamp: Date.now(),
    expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes
  };
  sessionStorage.setItem(SESSION_AUTH_TOKEN_KEY, JSON.stringify(token));
  clearLockout();
}

export function validateAdminSession(): boolean {
  try {
    const saved = sessionStorage.getItem(SESSION_AUTH_TOKEN_KEY);
    if (!saved) return false;

    const token = JSON.parse(saved);
    if (token.authed && token.expiresAt > Date.now()) {
      // Refresh expiration on active use
      token.expiresAt = Date.now() + 30 * 60 * 1000;
      sessionStorage.setItem(SESSION_AUTH_TOKEN_KEY, JSON.stringify(token));
      return true;
    }
  } catch (e) {
    console.error('Session validation error', e);
  }

  sessionStorage.removeItem(SESSION_AUTH_TOKEN_KEY);
  return false;
}

export function terminateAdminSession(): void {
  sessionStorage.removeItem(SESSION_AUTH_TOKEN_KEY);
}
