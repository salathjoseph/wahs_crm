'use client';

import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../src/context/AuthContext';
import { Mail, Lock, Sparkles, AlertCircle } from 'lucide-react';

export default function Login() {
  const { signIn, isDemoMode, enableDemoMode } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Validation
  const [emailError, setEmailError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');

  const validateForm = (): boolean => {
    let valid = true;
    setEmailError('');
    setPasswordError('');

    if (!email) {
      setEmailError('Email address is required');
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email');
      valid = false;
    }

    if (!password) {
      setPasswordError('Password is required');
      valid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      valid = false;
    }

    return valid;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      await signIn(email, password);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string) => {
    setLoading(true);
    setError(null);
    enableDemoMode(true);

    try {
      await signIn(demoEmail, 'password');
      router.push('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5F2] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="w-full max-w-md z-10 flex flex-col items-center">
        {/* Logo / Header */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-11 h-11 rounded-lg bg-[#101010] flex items-center justify-center font-bold text-white text-xl tracking-wider">
            W
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#101010] tracking-tight leading-none">WAHS Technologies</h1>
            <p className="text-[10px] text-[#6E6E73] font-semibold tracking-widest uppercase mt-1">CRM Operations Portal</p>
          </div>
        </div>

        {/* Form Card */}
        <div className="w-full bg-white border border-[#E8E5DF] rounded-xl p-8 shadow-premium relative">
          <h2 className="text-base font-semibold text-[#101010] mb-6">Sign in to your account</h2>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-[#D14343]/5 border border-[#D14343]/10 text-[#D14343] text-xs flex gap-3 items-start">
              <AlertCircle className="shrink-0 mt-0.5" size={14} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6E6E73] mb-2">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#6E6E73]">
                  <Mail size={14} />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#F7F5F2] border border-[#E8E5DF] text-xs font-medium placeholder-[#6E6E73] focus:outline-none focus:bg-white focus:border-[#B89C63] transition-all ${
                    emailError ? 'border-[#D14343]/50 focus:border-[#D14343]' : ''
                  }`}
                  placeholder="name@company.com"
                />
              </div>
              {emailError && <p className="text-xs text-[#D14343] mt-1.5">{emailError}</p>}
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6E6E73] mb-2">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#6E6E73]">
                  <Lock size={14} />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#F7F5F2] border border-[#E8E5DF] text-xs font-medium placeholder-[#6E6E73] focus:outline-none focus:bg-white focus:border-[#B89C63] transition-all ${
                    passwordError ? 'border-[#D14343]/50 focus:border-[#D14343]' : ''
                  }`}
                  placeholder="••••••••"
                />
              </div>
              {passwordError && <p className="text-xs text-[#D14343] mt-1.5">{passwordError}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#101010] text-[#FFFFFF] text-xs font-bold rounded-lg hover:bg-[#101010]/90 transition-all duration-150 mt-2 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Quick Demo Mode Panel */}
          <div className="mt-8 border-t border-[#EFECE7] pt-6">
            <div className="flex items-center gap-2 text-[10px] font-bold text-[#B89C63] tracking-wider uppercase mb-4">
              <Sparkles size={12} className="animate-pulse" />
              <span>Quick Access Roles (Demo Mode)</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleQuickLogin('admin@wahs.co')}
                className="px-3.5 py-2.5 bg-[#F7F5F2] hover:bg-[#F3EFE8] rounded-lg text-left border border-[#E8E5DF] transition-all"
              >
                <div className="font-semibold text-xs text-[#101010]">Admin View</div>
                <div className="text-[10px] text-[#6E6E73] mt-0.5">Full operations</div>
              </button>
              <button
                onClick={() => handleQuickLogin('acq@wahs.co')}
                className="px-3.5 py-2.5 bg-[#F7F5F2] hover:bg-[#F3EFE8] rounded-lg text-left border border-[#E8E5DF] transition-all"
              >
                <div className="font-semibold text-xs text-[#101010]">Acquisition</div>
                <div className="text-[10px] text-[#6E6E73] mt-0.5">Leads Focus</div>
              </button>
              <button
                onClick={() => handleQuickLogin('sales@wahs.co')}
                className="px-3.5 py-2.5 bg-[#F7F5F2] hover:bg-[#F3EFE8] rounded-lg text-left border border-[#E8E5DF] transition-all"
              >
                <div className="font-semibold text-xs text-[#101010]">Sales Rep</div>
                <div className="text-[10px] text-[#6E6E73] mt-0.5">Commissions</div>
              </button>
              <button
                onClick={() => handleQuickLogin('accounting@wahs.co')}
                className="px-3.5 py-2.5 bg-[#F7F5F2] hover:bg-[#F3EFE8] rounded-lg text-left border border-[#E8E5DF] transition-all"
              >
                <div className="font-semibold text-xs text-[#101010]">Accounting</div>
                <div className="text-[10px] text-[#6E6E73] mt-0.5">Billing & Invoices</div>
              </button>
            </div>
            
            <button
              onClick={() => handleQuickLogin('richard@hooli.xyz')}
              className="w-full mt-2.5 px-3.5 py-2.5 bg-[#F7F5F2] hover:bg-[#F3EFE8] rounded-lg text-xs font-semibold text-[#101010] text-center border border-[#E8E5DF] transition-all block"
            >
              Log in as Client (Richard Hendricks)
            </button>

            {isDemoMode && (
              <button
                onClick={() => {
                  enableDemoMode(false);
                  setError("Switched back to live Supabase Auth. Enter credentials below.");
                }}
                className="w-full mt-4 text-[9px] text-center text-[#6E6E73] hover:text-[#101010] underline transition-all font-semibold uppercase tracking-wider block"
              >
                Switch back to Live Supabase Connection
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-[10px] text-[#6E6E73] mt-8">
          WAHS CRM &copy; 2026. All rights reserved.
        </p>
      </div>
    </div>
  );
}
