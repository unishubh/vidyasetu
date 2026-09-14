'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, ArrowRight, UserCheck, Shield, Sparkles } from 'lucide-react';
import api from '@/lib/api';
import { getAuthUser, getToken, setToken } from '@/lib/auth';

const demoAccounts = [
  { email: 'student@vidyasetu.com', role: 'student', title: 'Demo Student' },
  { email: 'another.student@vidyasetu.com', role: 'student', title: 'Student Two' },
  { email: 'teacher1@vidyasetu.com', role: 'teacher', title: 'Teacher One' },
  { email: 'admin@vidyasetu.com', role: 'admin', title: 'Platform Admin' },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('student@vidyasetu.com');
  const [provider, setProvider] = useState('google');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (getToken()) {
      const user = getAuthUser();
      router.replace(user?.role === 'student' ? '/dashboard' : '/admin/package-builder');
    }
  }, [router]);

  const handleSocialLogin = async (selectedProvider) => {
    setLoading(true);
    setProvider(selectedProvider);
    setError('');

    try {
      const response = await api.post('/auth/social', {
        provider: selectedProvider,
        email,
      });

      setToken(response.data.token);
      const role = response.data.user?.role;
      router.push(role === 'student' ? '/dashboard' : '/admin/package-builder');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Social login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl py-6 sm:py-12">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-8 shadow-panel backdrop-blur sm:p-10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="relative z-10 space-y-6">
          {/* Top Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/25">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Single Sign-On
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Welcome to VidyaSetu
              </h1>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-slate-600">
            Sign in to unlock full-length test series, review your performance mistakes,
            and practice with free demo drills.
          </p>

          {/* Email input field */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700">
              Account Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
              placeholder="e.g. student@vidyasetu.com"
            />
          </div>

          {/* Social Provider Buttons */}
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => handleSocialLogin('google')}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2.5 rounded-full border border-slate-200/90 bg-white px-5 py-3 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] disabled:opacity-50"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{loading && provider === 'google' ? 'Signing in...' : 'Google Login'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSocialLogin('facebook')}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2.5 rounded-full bg-[#1877F2] px-5 py-3 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#166fe5] active:scale-[0.98] disabled:opacity-50"
            >
              <svg className="h-4 w-4 fill-white" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span>{loading && provider === 'facebook' ? 'Signing in...' : 'Facebook Login'}</span>
            </button>
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
              {error}
            </div>
          ) : null}

          {/* Seeded Quick Account Picker */}
          <div className="border-t border-slate-100 pt-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Quick Demo Accounts
              </span>
              <span className="text-xs text-slate-400">Click to autofill</span>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {demoAccounts.map((account) => {
                const isSelected = email === account.email;
                return (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => setEmail(account.email)}
                    className={`flex flex-col rounded-2xl border p-3 text-left transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/50 shadow-sm'
                        : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xs font-semibold text-slate-900 truncate">
                      {account.title}
                    </span>
                    <span className="text-[11px] text-slate-500 truncate">
                      {account.email}
                    </span>
                    <span className="mt-1.5 self-start rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      {account.role}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

