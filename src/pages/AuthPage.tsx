import { useEffect, useRef, useState } from 'react';
import { ArrowRight, CheckCircle2, Eye, EyeOff, KeyRound, LoaderCircle, RefreshCw } from 'lucide-react';
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

// Supabase password-recovery emails link back to /login?mode=recovery (see handleForgotPassword).
const isRecoveryLink = () => new URLSearchParams(window.location.search).get('mode') === 'recovery';

// Expired or already-used recovery links come back with an error in the URL hash or query.
const recoveryLinkError = () => {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const query = new URLSearchParams(window.location.search);
  return hash.get('error_description') || query.get('error_description') || '';
};

type AuthMode = 'signin' | 'signup' | 'verify_signup_otp' | 'forgot' | 'new_password';

export default function AuthPage() {
  const [linkError, setLinkError] = useState(recoveryLinkError);
  const [mode, setMode] = useState<AuthMode>(() => {
    if (!isRecoveryLink()) return 'signin';
    return linkError ? 'forgot' : 'new_password';
  });

  useSEOMeta({
    title:
      mode === 'verify_signup_otp'
        ? 'Verify Code | SOLEVAULT'
        : mode === 'forgot'
        ? 'Forgot Password | SOLEVAULT'
        : mode === 'new_password'
        ? 'Create New Password | SOLEVAULT'
        : mode === 'signup'
        ? 'Create Account | SOLEVAULT'
        : 'Sign In | SOLEVAULT',
    description: 'Sign in or manage your SOLEVAULT account to buy authentic sneakers, access drop notifications, and track orders.',
    url: '/login',
  });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);

  // OTP stored in ref so it never triggers re-render and is not in the DOM
  const otpRef = useRef('');
  const expiryRef = useRef<Date | null>(null);

  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from || '/account';

  // Reset errors/messages when mode switches
  useEffect(() => {
    setError('');
    setMessage('');
    setOtpInput('');
  }, [mode]);

  // Countdown timers
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((p) => Math.max(0, p - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((p) => Math.max(0, p - 1)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  // A recovery link signs the user in; keep them here until the new password is set.
  if (user && mode !== 'new_password') return <Navigate to={redirectTo} replace />;

  // ── Send OTP email via EmailJS ────────────────────────────────────────────
  const sendOtp = async (targetEmail: string, userName: string, otp: string, expiry: Date) => {
    await emailjs.send(
      EJS_SERVICE,
      EJS_TEMPLATE,
      {
        to_email: targetEmail,
        user_name: userName.trim() || targetEmail,
        otp_code: otp,
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

    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid email address');
    if (password.length < 6) return setError('Password must be at least 6 characters');
    if (name.trim().length < 2) return setError('Enter your full name');

    setBusy(true);
    try {
      const otp = generateOtp();
      const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

      await sendOtp(email, name, otp, expiry);

      otpRef.current = otp;
      expiryRef.current = expiry;

      setMode('verify_signup_otp');
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
    if (password.length < 6) return setError('Password must be at least 6 characters');

    setBusy(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) return setError(signInError.message);
      navigate(redirectTo);
    } finally {
      setBusy(false);
    }
  };

  // ── Verify Signup OTP → create account ───────────────────────────────────
  const verifySignupOtp = async (e: React.FormEvent) => {
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

      // Sign in immediately
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) return setError(signInError.message);

      navigate(redirectTo);
    } finally {
      setBusy(false);
    }
  };

  // ── Forgot Password: email a Supabase recovery link ───────────────────────
  // The reply is identical whether or not the account exists, so this form
  // cannot be used to discover registered emails.
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || cooldown > 0) return;

    setError('');
    setMessage('');
    setLinkError('');

    const cleanEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) return setError('Enter a valid email address');

    setBusy(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/login?mode=recovery`,
      });
      if (resetError?.status === 429) {
        return setError('Too many reset requests. Please wait a few minutes and try again.');
      }
      setCooldown(60);
      setMessage(`If an account exists for ${cleanEmail}, a password reset link is on its way. Check your inbox and spam folder.`);
    } catch {
      setError('Unable to send the reset email right now. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  // ── Submit New Password (session comes from the recovery link) ───────────
  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;

    setError('');
    setMessage('');

    if (password.length < 6) return setError('Password must be at least 6 characters');
    if (password !== confirmPassword) return setError('Passwords do not match');

    setBusy(true);
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setMode('forgot');
        setLinkError('This reset link is invalid or has expired. Request a new one below.');
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) return setError(updateError.message);

      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update password. Please try again.');
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
      const otp = generateOtp();
      const expiry = new Date(Date.now() + 10 * 60 * 1000);

      await sendOtp(email, name || 'Member', otp, expiry);

      otpRef.current = otp;
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

          {/* ── 1. SIGN IN SCREEN ── */}
          {mode === 'signin' && (
            <div>
              <h2>WELCOME BACK</h2>
              <p>Sign in to access your vault.</p>

              <form onSubmit={handleSignIn}>
                <label>
                  Email address
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    disabled={busy}
                    placeholder="name@domain.com"
                  />
                </label>

                <label>
                  <div className="label-row">
                    <span>Password</span>
                    <button
                      type="button"
                      className="forgot-link"
                      onClick={() => setMode('forgot')}
                      disabled={busy}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="password-input">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                      minLength={6}
                      disabled={busy}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      disabled={busy}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </label>

                {error && <p className="form-error" role="alert">{error}</p>}
                {message && <p className="form-message success">{message}</p>}

                <button className="button dark full" disabled={busy || cooldown > 0}>
                  {busy ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                      <LoaderCircle className="spin" size={16} /> Signing in…
                    </span>
                  ) : cooldown > 0 ? (
                    `Try again in ${cooldown}s`
                  ) : (
                    <>
                      Sign in
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
                New to SOLEVAULT?{' '}
                <button onClick={() => setMode('signup')} disabled={busy}>
                  Create an account
                </button>
              </p>
            </div>
          )}

          {/* ── 2. SIGN UP SCREEN ── */}
          {mode === 'signup' && (
            <div>
              <h2>CREATE ACCOUNT</h2>
              <p>One account. Every great find.</p>

              <form onSubmit={handleSignup}>
                <label>
                  Full name
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    required
                    disabled={busy}
                    placeholder="First and last name"
                  />
                </label>
                <label>
                  Email address
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    disabled={busy}
                    placeholder="name@domain.com"
                  />
                </label>
                <label>
                  Password
                  <div className="password-input">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                      minLength={6}
                      disabled={busy}
                      placeholder="Minimum 6 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      disabled={busy}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </label>

                {error && <p className="form-error" role="alert">{error}</p>}
                {message && <p className="form-message success">{message}</p>}

                <button className="button dark full" disabled={busy || cooldown > 0}>
                  {busy ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                      <LoaderCircle className="spin" size={16} /> Sending code…
                    </span>
                  ) : cooldown > 0 ? (
                    `Try again in ${cooldown}s`
                  ) : (
                    <>
                      Send verification code
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
                Already a member?{' '}
                <button onClick={() => setMode('signin')} disabled={busy}>
                  Sign in
                </button>
              </p>
            </div>
          )}

          {/* ── 3. VERIFY SIGNUP OTP SCREEN ── */}
          {mode === 'verify_signup_otp' && (
            <div>
              <h2>VERIFY YOUR EMAIL</h2>
              <p>Enter the 6-digit code sent to <strong>{email}</strong></p>

              <form onSubmit={verifySignupOtp} style={{ marginTop: '1.25rem' }}>
                <label>
                  Verification Code
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    autoFocus
                    required
                    disabled={busy}
                    style={{ letterSpacing: '8px', fontSize: '1.4rem', fontWeight: 700, textAlign: 'center', marginTop: '0.45rem' }}
                  />
                </label>

                {error && <p className="form-error" role="alert" style={{ marginTop: '0.75rem' }}>{error}</p>}
                {message && <p className="form-message success" style={{ marginTop: '0.75rem' }}>{message}</p>}

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
                  onClick={() => setMode('signup')}
                  disabled={busy}
                  style={{ background: 'none', border: 'none', fontSize: '0.78rem', color: 'var(--muted)', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Change email address
                </button>
              </div>
            </div>
          )}

          {/* ── 4. FORGOT PASSWORD SCREEN ── */}
          {mode === 'forgot' && (
            <div>
              <h2>RESET PASSWORD</h2>
              <p>Enter your account email and we will send you a link to reset your password.</p>

              <form onSubmit={handleForgotPassword}>
                <label>
                  Registered Email Address
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    disabled={busy}
                    placeholder="name@domain.com"
                    autoFocus
                  />
                </label>

                {(error || linkError) && <p className="form-error" role="alert">{error || linkError}</p>}
                {message && <p className="form-message success">{message}</p>}

                <button className="button dark full" disabled={busy || cooldown > 0}>
                  {busy ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                      <LoaderCircle className="spin" size={16} /> Sending link…
                    </span>
                  ) : cooldown > 0 ? (
                    `Resend in ${cooldown}s`
                  ) : (
                    <>
                      Send reset link
                      <ArrowRight />
                    </>
                  )}
                </button>
              </form>

              <p className="auth-switch" style={{ marginTop: '1.5rem' }}>
                Remember your password?{' '}
                <button onClick={() => setMode('signin')} disabled={busy}>
                  Sign in
                </button>
              </p>
            </div>
          )}

          {/* ── 5. CREATE NEW PASSWORD SCREEN (opened from the emailed recovery link) ── */}
          {mode === 'new_password' && (
            <div>
              <h2>CREATE NEW PASSWORD</h2>
              <p>Set a secure new password for <strong>{user?.email || 'your account'}</strong></p>

              <form onSubmit={handleSetNewPassword}>
                <label>
                  New Password
                  <div className="password-input">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                      minLength={6}
                      disabled={busy}
                      placeholder="Minimum 6 characters"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      disabled={busy}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </label>

                <label>
                  Confirm New Password
                  <div className="password-input">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                      minLength={6}
                      disabled={busy}
                      placeholder="Re-enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      disabled={busy}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </label>

                {error && <p className="form-error" role="alert">{error}</p>}
                {message && <p className="form-message success">{message}</p>}

                <button className="button dark full" disabled={busy}>
                  {busy ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                      <LoaderCircle className="spin" size={16} /> Updating Password…
                    </span>
                  ) : (
                    <>
                      Update Password
                      <CheckCircle2 size={16} />
                    </>
                  )}
                </button>
              </form>

              <p className="auth-switch" style={{ marginTop: '1.5rem' }}>
                <button onClick={() => setMode('signin')} disabled={busy}>
                  Cancel & Return to Sign in
                </button>
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
