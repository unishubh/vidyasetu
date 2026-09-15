'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import {
  GraduationCap,
  ArrowRight,
  UserCheck,
  Shield,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
  Key,
  ExternalLink,
} from 'lucide-react';
import api from '@/lib/api';
import { getAuthUser, getToken, setToken } from '@/lib/auth';

const demoAccounts = [
  {
    email: 'student@vidyasetu.com',
    role: 'student',
    title: 'Student One',
    desc: 'Take mock tests, practice demo drills, and review scorecards',
    badge: 'Student',
  },
  {
    email: 'teacher1@vidyasetu.com',
    role: 'teacher',
    title: 'Teacher One',
    desc: 'Build exam packages, upload CSV question banks, and monitor CRM',
    badge: 'Faculty / Staff',
  },
  {
    email: 'admin@vidyasetu.com',
    role: 'admin',
    title: 'Platform Admin',
    desc: 'Full system oversight, student management, and access grants',
    badge: 'Administrator',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('student@vidyasetu.com');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [customClientId, setCustomClientId] = useState('');
  const [activeClientId, setActiveClientId] = useState(
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''
  );
  const [gsiReady, setGsiReady] = useState(false);
  const [showConfigHelper, setShowConfigHelper] = useState(false);
  const googleBtnContainerRef = useRef(null);

  useEffect(() => {
    if (getToken()) {
      const user = getAuthUser();
      router.replace(user?.role === 'student' ? '/dashboard' : '/admin/package-builder');
    }
  }, [router]);

  // Handle Google Credential response from GIS popup
  const handleGoogleCredentialResponse = async (response) => {
    if (!response?.credential) {
      setError('No credential received from Google');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await api.post('/auth/google', {
        credential: response.credential,
      });

      setToken(result.data.token);
      const role = result.data.user?.role;
      router.push(role === 'student' ? '/dashboard' : '/admin/package-builder');
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          'Google authentication failed. Please verify your credentials or try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Initialize GIS button whenever GIS script is ready and Client ID is available
  useEffect(() => {
    if (!gsiReady || !activeClientId) {
      return;
    }

    if (typeof window !== 'undefined' && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: activeClientId,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        if (googleBtnContainerRef.current) {
          googleBtnContainerRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
            theme: 'outline',
            size: 'large',
            width: 320,
            text: 'continue_with',
            shape: 'pill',
            logo_alignment: 'left',
          });
        }
      } catch (err) {
        console.error('Failed to initialize Google Sign-In button:', err);
      }
    }
  }, [gsiReady, activeClientId]);

  const handleApplyCustomClientId = (e) => {
    e.preventDefault();
    if (!customClientId.trim()) {
      return;
    }
    setActiveClientId(customClientId.trim());
    setError('');
  };

  const handleSimulatedLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/social', {
        provider: 'google',
        email,
      });

      setToken(response.data.token);
      const role = response.data.user?.role;
      router.push(role === 'student' ? '/dashboard' : '/admin/package-builder');
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          'Authentication failed. Please verify the email.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl py-6 sm:py-10">
      {/* Load Google Identity Services SDK script */}
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setGsiReady(true)}
      />

      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-8 shadow-panel backdrop-blur sm:p-10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="relative z-10 space-y-6">
          {/* Top Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/25">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Single Sign-On Portal
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Sign in to VidyaSetu
              </h1>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-slate-600">
            Sign in with your Google account to access your enrolled mock series, review diagnostic scorecards,
            or author test packages.
          </p>

          {/* Primary Action: Official Google Sign-In */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/90 bg-slate-50/60 p-6 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Sign In with Google Account
            </span>

            {activeClientId ? (
              <div className="flex flex-col items-center space-y-2">
                <div ref={googleBtnContainerRef} id="google-signin-container" className="min-h-[44px]" />
                {loading ? (
                  <p className="text-xs text-indigo-600 font-medium animate-pulse">
                    Verifying Google session...
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="w-full space-y-3 text-center">
                <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-left text-xs text-amber-900 space-y-1.5">
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5">
                      <Key className="h-4 w-4 text-amber-600" />
                      <span>Google OAuth Client ID Not Set</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowConfigHelper(!showConfigHelper)}
                      className="text-[11px] text-indigo-600 hover:underline font-semibold"
                    >
                      {showConfigHelper ? 'Hide Guide' : 'Setup Guide'}
                    </button>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    To enable live Google Sign-In, add <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> to your <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">.env.local</code>.
                  </p>
                </div>

                {/* Inline Quick-Test Input */}
                <form onSubmit={handleApplyCustomClientId} className="flex gap-2">
                  <input
                    type="text"
                    value={customClientId}
                    onChange={(e) => setCustomClientId(e.target.value)}
                    placeholder="Paste Client ID to test live (.apps.googleusercontent.com)"
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono text-slate-800 outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
                  >
                    Apply
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Configuration Guide Accordion / Card */}
          {showConfigHelper && (
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5 space-y-3 text-xs text-slate-700 animate-in fade-in">
              <div className="flex items-center gap-1.5 font-bold text-indigo-900">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                <span>How to Get a Free Google Client ID (2 Minutes):</span>
              </div>
              <ol className="list-decimal list-inside space-y-1.5 leading-relaxed text-[11px]">
                <li>Open <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-indigo-600 font-semibold underline inline-flex items-center gap-0.5">Google Cloud Console <ExternalLink className="h-2.5 w-2.5" /></a></li>
                <li>Configure the <strong>OAuth Consent Screen</strong> (select External, set App Name &amp; email).</li>
                <li>Go to <strong>Credentials</strong> &gt; <strong>Create Credentials</strong> &gt; <strong>OAuth client ID</strong>.</li>
                <li>Choose <strong>Web application</strong> and add <code className="bg-white px-1 py-0.5 rounded border font-mono">http://localhost:3000</code> and <code className="bg-white px-1 py-0.5 rounded border font-mono">http://localhost:3001</code> to <strong>Authorized JavaScript origins</strong>.</li>
                <li>Copy the generated <strong>Client ID</strong> and paste it above or into <code className="bg-white px-1 py-0.5 rounded border font-mono">vidyasetu-frontend/.env.local</code>.</li>
              </ol>
              <p className="text-[10px] text-slate-500">
                Full documentation available in <code className="font-mono">GOOGLE_AUTH_SETUP.md</code> at the root of the project.
              </p>
            </div>
          )}

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          {/* Quick-switch Demo Accounts Card */}
          <div className="mt-8 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                <UserCheck className="h-4 w-4 text-indigo-600" />
                <span>Instant Developer Testing Personas</span>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase">One-Click Login</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Click any role to test candidate exam-taking, faculty package creation, or administrator views:
            </p>

            <div className="grid gap-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => {
                    setEmail(account.email);
                    handleSimulatedLogin();
                  }}
                  className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-slate-200/80 bg-white p-3 text-left transition-all hover:border-indigo-300 hover:shadow-sm group"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {account.title}
                      </span>
                      <span className="rounded bg-indigo-50 px-1.5 py-0.2 text-[10px] font-semibold text-indigo-700">
                        {account.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{account.desc}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 group-hover:translate-x-0.5 transition-transform mt-1 sm:mt-0">
                    <span>Log in as {account.badge}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
