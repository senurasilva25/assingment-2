import { act, renderHook, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import useBookings from '../hooks/useBookings';

function createClient(session = null) {
  let authListener;
  const unsubscribe = vi.fn();
  const order = vi.fn().mockResolvedValue({ data: [], error: null });
  const query = { select: vi.fn(() => query), order };
  const client = {
    from: vi.fn(() => query),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session }, error: null }),
      onAuthStateChange: vi.fn((listener) => {
        authListener = listener;
        return { data: { subscription: { unsubscribe } } };
      }),
      signInWithPassword: vi.fn(async () => {
        authListener('SIGNED_IN', { user: { id: 'employee' } });
        return { error: null };
      }),
      signOut: vi.fn(async () => {
        authListener('SIGNED_OUT', null);
        return { error: null };
      }),
    },
  };
  return { client, order, unsubscribe };
}

it('requires configuration and authentication before saving', async () => {
  const { result } = renderHook(() => useBookings(null, 'Setup required'));
  expect(result.current.status).toBe('Setup required');
  await expect(result.current.save('id', {})).rejects.toThrow(
    'Configure Supabase',
  );
  const { client } = createClient();
  const signedOut = renderHook(() => useBookings(client, ''));
  await waitFor(() => expect(client.auth.getSession).toHaveBeenCalled());
  await expect(signedOut.result.current.save('id', {})).rejects.toThrow(
    'Sign in',
  );
});

it('signs in, refreshes bookings, signs out, and cleans up subscriptions', async () => {
  const { client, order, unsubscribe } = createClient();
  order.mockResolvedValue({ data: [{ id: 'job-1' }], error: null });
  const { result, unmount } = renderHook(() => useBookings(client, ''));
  await act(async () => {
    await result.current.signIn('employee@example.com', 'password');
  });
  await waitFor(() =>
    expect(result.current.bookings).toEqual([{ id: 'job-1' }]),
  );
  expect(client.auth.signInWithPassword).toHaveBeenCalledWith({
    email: 'employee@example.com',
    password: 'password',
  });
  await act(async () => {
    await result.current.refresh();
  });
  expect(order).toHaveBeenCalledTimes(2);
  await act(async () => {
    await result.current.signOut();
  });
  expect(result.current.session).toBeNull();
  expect(result.current.bookings).toEqual([]);
  unmount();
  expect(unsubscribe).toHaveBeenCalledOnce();
});

it('ignores an in-flight booking response after sign-out', async () => {
  const { client, order } = createClient({ user: { id: 'employee' } });
  let finish;
  order.mockReturnValue(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  const { result } = renderHook(() => useBookings(client, ''));
  await waitFor(() => expect(order).toHaveBeenCalled());
  await act(async () => {
    await result.current.signOut();
  });
  await act(async () => {
    finish({ data: [{ id: 'private-job' }], error: null });
  });
  expect(result.current.bookings).toEqual([]);
  expect(result.current.session).toBeNull();
});
