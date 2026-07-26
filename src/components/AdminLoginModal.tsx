import React, { useState, useEffect } from 'react';
import { ShieldCheck, X, AlertCircle, Fingerprint, Smartphone, Loader2, CheckCircle2 } from 'lucide-react';
import {
  verifyTOTPCode,
  isWebAuthnSupported,
  authenticateWithPasskey,
  createAdminSessionToken,
  getLockoutInfo,
  getAdminSecurityConfig,
} from '../utils/auth';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  if (!isOpen) return null;

  const [totpCode, setTotpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passkeySupported, setPasskeySupported] = useState(false);
  const [hasRegisteredPasskey, setHasRegisteredPasskey] = useState(false);
  const [lockoutSecs, setLockoutSecs] = useState<number>(0);

  // Check Passkey and lockout state
  useEffect(() => {
    isWebAuthnSupported().then(setPasskeySupported);

    getAdminSecurityConfig().then((cfg) => {
      setHasRegisteredPasskey(cfg.passkeyRegistered);
    });

    const info = getLockoutInfo();
    if (info.lockedUntil > Date.now()) {
      setLockoutSecs(Math.ceil((info.lockedUntil - Date.now()) / 1000));
    }
  }, [isOpen]);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutSecs <= 0) return;
    const timer = setInterval(() => {
      setLockoutSecs((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setError(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSecs]);

  const handleTOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSecs > 0) return;

    setError(null);
    setIsLoading(true);

    try {
      const config = await getAdminSecurityConfig();
      const isValid = await verifyTOTPCode(config.totpSecret, totpCode);

      if (isValid) {
        createAdminSessionToken();
        onLoginSuccess();
        resetForm();
      } else {
        setError('Invalid passcode. Please try again.');
      }
    } catch (err) {
      setError('Verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasskeyLogin = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const success = await authenticateWithPasskey();
      if (success) {
        createAdminSessionToken();
        onLoginSuccess();
        resetForm();
      } else {
        setError('Passkey verification failed or cancelled by user.');
      }
    } catch (err) {
      setError('Biometric passkey error.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTotpCode('');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-500 text-white shadow-lg shadow-cyan-950/50">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Subsea Admin Access</h3>
              <p className="text-xs text-slate-400">Curator Portal</p>
            </div>
          </div>

          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Passkey Badge */}
        {hasRegisteredPasskey && (
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
            <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-800/50 flex items-center gap-1">
              <Fingerprint className="w-3 h-3 text-emerald-400" /> Passkey Ready
            </span>
          </div>
        )}

        {/* Lockout Warning */}
        {lockoutSecs > 0 && (
          <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 flex items-center gap-2 text-xs">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <p className="font-semibold text-rose-200">Security Lockout Active</p>
              <p className="text-[11px] text-rose-300/80">
                Too many failed attempts. Try again in <span className="font-mono font-bold text-rose-100">{lockoutSecs}s</span>.
              </p>
            </div>
          </div>
        )}

        {/* Errors */}
        {error && lockoutSecs === 0 && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-2 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Direct Passcode Login Form */}
        <form onSubmit={handleTOTPSubmit} className="space-y-5 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Enter Passcode</span>
            </label>
            <input
              type="password"
              required
              disabled={isLoading || lockoutSecs > 0}
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter passcode"
              className="w-full tracking-widest text-center font-mono text-xl font-bold px-3.5 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-700 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
              autoFocus
            />
          </div>

          {/* Passkey Biometric Login Button */}
          {passkeySupported && (
            <div className="pt-1">
              <button
                type="button"
                disabled={isLoading || lockoutSecs > 0}
                onClick={handlePasskeyLogin}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <Fingerprint className="w-4 h-4 text-emerald-400" />
                <span>Authenticate with Passkey / Biometrics</span>
              </button>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || totpCode.trim().length === 0 || lockoutSecs > 0}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-950/50 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Authenticate Access</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
