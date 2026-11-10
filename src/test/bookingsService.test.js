import { expect, it, vi } from 'vitest';
import { fetchBookings, saveBooking } from '../services/bookings';

function mockClient(responses) {
  const query = {};
  for (const method of ['select', 'insert', 'eq'])
    query[method] = vi.fn(() => query);
  query.single = vi.fn();
  responses.forEach((response) => query.single.mockResolvedValueOnce(response));
  query.order = vi.fn().mockResolvedValue({ data: [{ id: 'a' }], error: null });
  return { client: { from: vi.fn(() => query) }, query };
}

it('inserts the compatible payload and returns its database-generated job number', async () => {
  const { client, query } = mockClient([
    { data: { job_number: 12 }, error: null },
  ]);
  expect(await saveBooking(client, 'id-1', { customer: {} })).toEqual({
    job_number: 12,
  });
  expect(query.insert).toHaveBeenCalledWith({ id: 'id-1', customer: {} });
  expect(client.from).toHaveBeenCalledWith('bookings');
});
it('recovers a previously saved booking after a duplicate retry', async () => {
  const { client, query } = mockClient([
    { error: { code: '23505' } },
    { data: { job_number: 12 }, error: null },
  ]);
  expect(await saveBooking(client, 'id-1', {})).toEqual({ job_number: 12 });
  expect(query.eq).toHaveBeenCalledWith('id', 'id-1');
});
it('surfaces database failures', async () => {
  const { client } = mockClient([
    { error: { code: '42501', message: 'Access denied' } },
  ]);
  await expect(saveBooking(client, 'id-1', {})).rejects.toMatchObject({
    message: 'Access denied',
  });
});
it('retrieves bookings newest first', async () => {
  const { client, query } = mockClient([]);
  expect(await fetchBookings(client)).toEqual([{ id: 'a' }]);
  expect(query.order).toHaveBeenCalledWith('created_at', { ascending: false });
});
