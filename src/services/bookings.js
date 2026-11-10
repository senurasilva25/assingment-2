export async function fetchBookings(client) {
  const { data, error } = await client
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

// Keep the same ID on retries so a lost response cannot create a second job.
export async function saveBooking(client, id, payload) {
  const { data, error } = await client
    .from('bookings')
    .insert({ id, ...payload })
    .select()
    .single();
  if (!error) return data;
  if (error.code !== '23505') throw error;
  const result = await client
    .from('bookings')
    .select('*')
    .eq('id', id)
    .single();
  if (result.error) throw result.error;
  return result.data;
}
