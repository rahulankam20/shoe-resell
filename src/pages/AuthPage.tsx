import { useEffect, useState } from 'react';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import supabase from '../lib/supabase';
import { signInWithGoogle } from '../lib/googleAuth';
import { useAuth } from '../contexts/AuthContext';

export default function AuthPage() {
  const [signUp, setSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => { setError(''); setMessage(''); }, [signUp]);
  if (user) return <Navigate to={(location.state as { from?: string } | null)?.from || '/account'} replace />;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setMessage('');
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid email address');
    if (password.length < 6) return setError('Password must be at least 6 characters');
    if (signUp && name.trim().length < 2) return setError('Enter your full name');
    setBusy(true);
    const result = signUp ? await supabase.auth.signUp({ email, password, options: { data: { full_name: name.trim() } } }) : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (result.error) return setError(result.error.message);
    if (signUp && !result.data.session) return setMessage('Check your email to confirm your account.');
    navigate((location.state as { from?: string } | null)?.from || '/account');
  };

  return <div className="auth-page"><div className="auth-visual"><img src="/images/solevault-hero.webp" alt="Premium sneaker in the SOLEVAULT studio" /><div><p>MEMBERS GET MORE</p><h1>YOUR VAULT.<br />YOUR PAIRS.</h1><span>Save favourites, check out faster and track every order.</span></div></div><section className="auth-form-wrap"><div className="auth-form"><p className="eyebrow accent">SOLEVAULT MEMBERSHIP</p><h2>{signUp ? 'CREATE ACCOUNT' : 'WELCOME BACK'}</h2><p>{signUp ? 'One account. Every great find.' : 'Sign in to access your vault.'}</p><form onSubmit={submit}>{signUp && <label>Full name<input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required /></label>}<label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label><label>Password<div className="password-input"><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={signUp ? 'new-password' : 'current-password'} required minLength={6} /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff /> : <Eye />}</button></div></label>{error && <p className="form-error" role="alert">{error}</p>}{message && <p className="form-message success">{message}</p>}<button className="button dark full" disabled={busy}>{busy ? 'Please wait…' : signUp ? 'Create account' : 'Sign in'}<ArrowRight /></button></form><div className="or"><span>or</span></div><button className="google-button" onClick={() => signInWithGoogle('SOLEVAULT')}>G <span>Continue with Google</span></button><p className="auth-switch">{signUp ? 'Already a member?' : 'New to SOLEVAULT?'} <button onClick={() => setSignUp(!signUp)}>{signUp ? 'Sign in' : 'Create an account'}</button></p></div></section></div>;
}
