import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { CalendarDays, ArrowRight, Eye, EyeOff } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import { DEMO } from '../utils/constants';
import { errorMessage } from '../api/axios';
import './LoginPage.css';
export default function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await auth.login({ email, password });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  if (auth.loading) return <Loader />;
  if (auth.isAuthenticated) return <Navigate to="/dashboard" replace />;
  return (
    <div className="login-page">
      <section className="login-story">
        <div className="brand">
          <span className="brand-mark">
            <CalendarDays />
          </span>
          eventhub.
        </div>
        <div>
          <span className="eyebrow">YOUR EVENTS. ONE WORKSPACE.</span>
          <h1>
            Plan better.
            <br />
            Bring people together.
            <br />
            Make it memorable.
          </h1>
          <p>
            From the first invitation to the final guest list, manage your events,
            participants and registrations in one place.
          </p>
          <span className="login-story-line" aria-hidden="true" />
        </div>
        <small>EVENTHUB — EVERY DETAIL. EVERY GUEST.</small>
      </section>
      <section className="login-form">
        <div>
          <span className="eyebrow">YOUR EVENT WORKSPACE</span>
          <h1>Welcome back!</h1>
          <p>Sign in to plan your next event and keep every registration in view.</p>
          <form onSubmit={submit}>
            <Input
              label="Email address"
              type="email"
              autoComplete="username"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div className="login-password">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button className="login-password-toggle" type="button"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            </div>
            {error && (
              <p className="alert" role="alert">
                {error}
              </p>
            )}
            <Button disabled={busy} type="submit">
              {busy ? 'Signing in…' : 'Sign in'}
              <ArrowRight size={18} />
            </Button>
          </form>
          {DEMO && (
            <div className="demo-hint">
              <strong>Explore the demo</strong>
              <p>admin@eventhub.demo · EventHub2026!</p>
              <button
                onClick={() => {
                  setEmail('admin@eventhub.demo');
                  setPassword('EventHub2026!');
                }}
              >
                Use demo credentials
              </button>
            </div>
          )}
          <small className="login-footnote">Need access? Contact your EventHub administrator.</small>
          <Link className="login-public-link" to="/">Browse events — no account needed →</Link>
        </div>
      </section>
    </div>
  );
}
