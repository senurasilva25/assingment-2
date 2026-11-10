import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchBookings, saveBooking } from '../services/bookings';

export default function useBookings(client, configurationError) {
  const [session, setSession] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [status, setStatus] = useState(
    configurationError || 'Checking employee session…',
  );
  const [loading, setLoading] = useState(false);
  const requestId = useRef(0);
  const activeUser = useRef(null);

  useEffect(() => {
    if (!client) return;
    let active = true;
    let authChanged = false;
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, next) => {
      if (!active) return;
      authChanged = true;
      activeUser.current = next?.user.id ?? null;
      requestId.current += 1;
      setSession(next);
    });
    client.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active || authChanged) return;
        if (error) {
          setStatus(`Session unavailable: ${error.message}`);
          return;
        }
        activeUser.current = data.session?.user.id ?? null;
        setSession(data.session);
      })
      .catch((error) => {
        if (active) setStatus(`Session unavailable: ${error.message}`);
      });
    return () => {
      active = false;
      requestId.current += 1;
      subscription.unsubscribe();
    };
  }, [client]);

  const refresh = useCallback(async () => {
    if (!client || !session) return;
    const current = ++requestId.current;
    setLoading(true);
    setStatus('Loading bookings…');
    try {
      const data = await fetchBookings(client);
      if (current !== requestId.current) return;
      setBookings(data);
      setStatus(
        data.length
          ? `${data.length} booking(s) loaded.`
          : 'No bookings yet. Create your first repair booking above.',
      );
    } catch (error) {
      if (current === requestId.current) {
        setBookings([]);
        setStatus(`Unable to load bookings: ${error.message}`);
      }
    } finally {
      if (current === requestId.current) setLoading(false);
    }
  }, [client, session]);

  useEffect(() => {
    setBookings([]);
    if (session) {
      void refresh();
    } else if (client) {
      setLoading(false);
      setStatus(
        'Sign in with an authorized employee account to save and view bookings.',
      );
    }
  }, [client, session, refresh]);

  async function signIn(email, password) {
    setStatus('Signing in…');
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
      setStatus(`Sign-in failed: ${error.message}`);
      throw error;
    }
  }

  async function signOut() {
    const { error } = await client.auth.signOut();
    if (error) setStatus(`Sign-out failed: ${error.message}`);
  }

  async function save(id, payload) {
    if (!client)
      throw new Error(
        'Configure Supabase in public/config.js or .env.local to enable submission.',
      );
    if (!session)
      throw new Error(
        'Sign in as an employee in the Repair bookings section before submitting.',
      );
    const userId = session.user.id;
    const booking = await saveBooking(client, id, payload);
    if (activeUser.current === userId) await refresh();
    return booking;
  }

  return {
    session,
    bookings,
    status,
    loading,
    refresh,
    signIn,
    signOut,
    save,
    configured: Boolean(client),
  };
}
