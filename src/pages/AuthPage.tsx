import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Eye, EyeOff, KeyRound, LoaderCircle, RefreshCw } from 'lucide-react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import supabase from '../lib/supabase';
import { signInWithGoogle } from '../lib/googleAuth';
import { useAuth } from '../contexts/AuthContext';
import { useSEOMeta } from '../hooks/useSEOMeta';

// ─── EmailJS config ────────────────────────────────────────────────────────────
const EJS_SERVICE  = 'service_orlhxwb';
const EJS_TEMPLATE = 'template_k4i8h2k';
const EJS_KEY      = 'e5M9SA35EKG2IHgzd';

// ─── Helpers ───────────────────────────────────────────────────────────────────
const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const formatTime = (date: Date) =>
  date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

export default function AuthPage() {
  const [signUp, setSignUp]           = useState(false);
  const [showOtpScreen, setShowOtpScreen] = useState(false);

  useSEOMeta({
    title      : showOtpScreen ? 'Verify Email | SOLEVAULT' : signUp ? 'Create Account | SOLEVAULT' : 'Sign In | SOLEVAULT',
    description: 'Sign in or create your SOLEVAULT account to buy authentic sneakers, access drop notifications, and track orders.',
    url        : '/login',
  });

  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [name,         setName]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpInput,     setOtpInput]     = useState('');
  const [error,        setError]        = useState('');
  const [message,      setMessage]      = useState('');
  const [busy,         setBusy]         = useState(false);
  const [cooldown,     setCooldown]     = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);

  // OTP stored in ref so it never triggers re-render and is not in the DOM
  const otpRef    = useRef('');
  const expiryRef = useRef<Date | null>(null);

  const { user }   = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from || '/account';

  // Reset on tab switch
  useEffect(() => {
    setError('');
    setMessage('');
    setShowOtpScreen(false);
    setOtpInput('');
    otpRef.current    = '';
    expiryRef.current = null;
  }, [signUp]);

  // Countdown timers
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown(p => Math.max(0, p - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown(p => Math.max(0, p - 1)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  if (user) return <Navigate to={redirectTo} replace />;

  // ── Send OTP email via EmailJS ────────────────────────────────────────────
  const sendOtp = async (otp: string, expiry: Date) => {
    await emailjs.send(
      EJS_SERVICE,
      EJS_TEMPLATE,
      {
        to_email   : email,
        user_name  : name.trim() || email,
        otp_code   : otp,
        expiry_time: formatTime(expiry),
      },
      EJS_KEY,
    );
  };

  // ── Signup: validate → send OTP → show OTP screen ────────────────────────
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || cooldown > 0) return;

    setError('');
    setMessage('');

    if (!/^\S+@\S+\.\S+$/.test(email))    return setError('Enter a valid email address');
    if (password.length < 6)               return setError('Password must be at least 6 characters');
    if (name.trim().length < 2)            return setError('Enter your full name');

    setBusy(true);
    try {
      const otp    = generateOtp();
      const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

      await sendOtp(otp, expiry);

      otpRef.current    = otp;
      expiryRef.current = expiry;

      setShowOtpScreen(true);
      setResendCooldown(60);
      setMessage(`A 6-digit verification code was sent to ${email}.`);
    } catch (err: any) {
      setError(err?.text || err?.message || 'Failed to send verification email. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  // ── Sign-in ───────────────────────────────────────────────────────────────
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;

    setError('');
    setMessage('');

    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid email address');
    if (password.length < 6)            return setError('Password must be at least 6 characters');

    setBusy(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) return setError(signInError.message);
      navigate(redirectTo);
    } finally {
      setBusy(false);
    }
  };

  // ── Verify OTP → create account ───────────────────────────────────────────
  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;

    const entered = otpInput.trim();
    if (entered.length !== 6) return setError('Please enter the complete 6-digit code');

    setError('');
    setMessage('');

    // Check expiry
    if (!expiryRef.current || new Date() > expiryRef.current) {
      return setError('Code has expired. Click "Resend code" to get a new one.');
    }

    // Check match
    if (entered !== otpRef.current) {
      return setError('Incorrect code. Please try again.');
    }

    setBusy(true);
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name.trim() } },
      });

      if (signUpError) return setError(signUpError.message);

      // Sign in immediately (email confirmation is disabled in Supabase)
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) return setError(signInError.message);

      navigate(redirectTo);
    } finally {
      setBusy(false);
    }
  };

  // ── Resend OTP ────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (resendCooldown > 0 || busy) return;
    setError('');
    setMessage('');
    setBusy(true);
    try {
      const otp    = generateOtp();
      const expiry = new Date(Date.now() + 10 * 60 * 1000);

      await sendOtp(otp, expiry);

      otpRef.current    = otp;
      expiryRef.current = expiry;

      setResendCooldown(60);
      setOtpInput('');
      setMessage('A fresh verification code was sent to your email.');
    } catch (err: any) {
      setError(err?.text || err?.message || 'Failed to resend. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      await signInWithGoogle('SOLEVAULT');
    } catch (err: any) {
      setError(err?.message || 'Unable to connect to Google. Please try again.');
      setBusy(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="auth-page">
      <div className="auth-visual">
        <img src="/images/solevault-hero.webp" alt="Premium sneaker in the SOLEVAULT studio" />
        <div>
          <p>MEMBERS GET MORE</p>
          <h1>YOUR VAULT.<br />YOUR PAIRS.</h1>
          <span>Save favourites, check out faster and track every order.</span>
        </div>
      </div>

      <section className="auth-form-wrap">
        {busy && <div className="auth-loading-bar" aria-hidden="true" />}
        <div className="auth-form">
          <p className="eyebrow accent">SOLEVAULT MEMBERSHIP</p>

          {/* ── OTP Screen ── */}
          {showOtpScreen ? (
            <div>
              <h2>VERIFY YOUR EMAIL</h2>
              <p>Enter the 6-digit code sent to <strong>{email}</strong></p>

              <form onSubmit={verifyOtp} style={{ marginTop: '1.25rem' }}>
                <label>
                  Verification Code
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={otpInput}
                    onChange={e => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    autoFocus
                    required
                    disabled={busy}
                    style={{ letterSpacing: '8px', fontSize: '1.4rem', fontWeight: 700, textAlign: 'center', marginTop: '0.45rem' }}
                  />
                </label>

                {error   && <p className="form-error" role="alert" style={{ marginTop: '0.75rem' }}>{error}</p>}
                {message && <p className="form-message success"   style={{ marginTop: '0.75rem' }}>{message}</p>}

                <button className="button dark full" disabled={busy || otpInput.length !== 6} style={{ marginTop: '1rem' }}>
                  {busy ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                      <LoaderCircle className="spin" size={16} /> Verifying…
                    </span>
                  ) : (
                    <>
                      Verify & Enter Vault
                      <KeyRound size={16} />
                    </>
                  )}
                </button>
              </form>

              <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || busy}
                  style={{
                    background: 'none', border: 'none', fontSize: '0.82rem',
                    color: resendCooldown > 0 ? 'var(--muted)' : 'var(--accent)',
                    cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                    fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem',
                  }}
                >
                  <RefreshCw size={13} className={busy ? 'spin' : ''} />
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowOtpScreen(false)}
                  disabled={busy}
                  style={{ background: 'none', border: 'none', fontSize: '0.78rem', color: 'var(--muted)', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Change email address
                </button>
              </div>
            </div>

          ) : (
            /* ── Login / Signup Screen ── */
            <div>
              <h2>{signUp ? 'CREATE ACCOUNT' : 'WELCOME BACK'}</h2>
              <p>{signUp ? 'One account. Every great find.' : 'Sign in to access your vault.'}</p>

              <form onSubmit={signUp ? handleSignup : handleSignIn}>
                {signUp && (
                  <label>
                    Full name
                    <input value={name} onChange={e => setName(e.target.value)} autoComplete="name" required disabled={busy} />
                  </label>
                )}
                <label>
                  Email address
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required disabled={busy} />
                </label>
                <label>
                  Password
                  <div className="password-input">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      autoComplete={signUp ? 'new-password' : 'current-password'}
                      required
                      minLength={6}
                      disabled={busy}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} disabled={busy}>
                      {showPassword ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                </label>

                {error   && <p className="form-error" role="alert">{error}</p>}
                {message && <p className="form-message success">{message}</p>}

                <button className="button dark full" disabled={busy || cooldown > 0}>
                  {busy ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                      <LoaderCircle className="spin" size={16} /> {signUp ? 'Sending code…' : 'Signing in…'}
                    </span>
                  ) : cooldown > 0 ? (
                    `Try again in ${cooldown}s`
                  ) : (
                    <>
                      {signUp ? 'Send verification code' : 'Sign in'}
                      <ArrowRight />
                    </>
                  )}
                </button>
              </form>

              <div className="or"><span>or</span></div>

              <button type="button" className="google-button" onClick={handleGoogle} disabled={busy}>
                {busy ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
                    <LoaderCircle className="spin" size={16} /> Connecting to Google…
                  </span>
                ) : (
                  <>
                    G <span>Continue with Google</span>
                  </>
                )}
              </button>

              <p className="auth-switch">
                {signUp ? 'Already a member?' : 'New to SOLEVAULT?'}{' '}
                <button onClick={() => setSignUp(!signUp)} disabled={busy}>
                  {signUp ? 'Sign in' : 'Create an account'}
                </button>
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
