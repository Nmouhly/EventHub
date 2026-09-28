import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { CalendarDays, ArrowRight, Sparkles } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import { DEMO } from '../utils/constants';
import { errorMessage } from '../api/axios';
export default function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
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
          <span className="eyebrow">LESS ADMIN. MORE CONNECTION.</span>
          <h1>
            Bring people
            <br />
            together.
            <br />
            <em>Beautifully.</em>
          </h1>
          <p>
            One thoughtful workspace for your events,
            <br />
            your people, and everything in between.
          </p>
          <div className="story-orbit">
            <Sparkles size={55} />
            <span>Experiences worth showing up for.</span>
          </div>
        </div>
        <small>YOUR NEXT GREAT EVENT STARTS HERE</small>
      </section>
      <section className="login-form">
        <div>
          <span className="eyebrow">EVENT MANAGEMENT PLATFORM</span>
          <h1>Welcome back.</h1>
          <p>Sign in to your EventHub workspace.</p>
          <form onSubmit={submit}>
            <Input
              label="Email address"
              type="email"
              autoComplete="username"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
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
          <small className="login-footnote">A workspace for meaningful experiences.</small>
        </div>
      </section>
    </div>
  );
}
