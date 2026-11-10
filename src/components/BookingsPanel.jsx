import { useState } from 'react';
import BookingCard from './BookingCard';

export default function BookingsPanel({ controller, showBookings = true }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const {
    session,
    bookings,
    status,
    loading,
    refresh,
    signIn,
    signOut,
    configured,
  } = controller;

  async function login(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await signIn(email.trim(), password);
      setPassword('');
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    setBusy(true);
    setError('');
    try {
      await signOut();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="bookings-section" id="bookings">
      <div className="section-header">
        <div>
          <p className="eyebrow">REPAIR DESK</p>
          <h2>Repair bookings</h2>
        </div>
        <button
          type="button"
          className="btn btn-outline-dark"
          disabled={!session || loading}
          onClick={refresh}
        >
          Refresh
        </button>
      </div>
      <div id="connection-status" role="status">
        {status}
      </div>
      {configured && !session && (
        <form className="login-form" onSubmit={login}>
          <label>
            Employee email
            <input
              className="form-control"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="username"
              disabled={busy}
            />
          </label>
          <label>
            Password
            <input
              className="form-control"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
              disabled={busy}
            />
          </label>
          <button className="btn btn-dark" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      )}
      {session && (
        <button
          className="btn btn-outline-dark"
          type="button"
          onClick={logout}
          disabled={busy}
        >
          Sign out
        </button>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {showBookings &&
        session &&
        bookings.map((booking) => (
          <BookingCard key={booking.id} booking={booking} />
        ))}
    </section>
  );
}
