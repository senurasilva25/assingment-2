// @vitest-environment node
import { Readable } from 'node:stream';
import { expect, it, vi } from 'vitest';
import { createChatHandler } from '../../server/chat.mjs';

async function request(handler, body, overrides = {}) {
  const req = Readable.from([JSON.stringify(body)]);
  Object.assign(req, {
    url: '/api/chat',
    method: 'POST',
    headers: { host: 'localhost:3000' },
    ...overrides,
  });
  const result = {};
  const res = {
    writeHead: (status) => {
      result.status = status;
    },
    end: (body) => {
      result.body = JSON.parse(body);
    },
  };
  await handler(req, res, () => {});
  return result;
}
const messages = [{ role: 'user', text: 'What is the service fee?' }];
const faqs = [{ question: 'Service fee?', answer: '$85 without warranty.' }];
it('requires a configured key without making an upstream request', async () => {
  const fetchImpl = vi.fn();
  const handler = createChatHandler({ config: {}, faqs, fetchImpl });
  expect((await request(handler, { messages })).status).toBe(503);
  expect(fetchImpl).not.toHaveBeenCalled();
});
it('keeps the key in the server header and sends FAQ context plus conversation', async () => {
  const fetchImpl = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      candidates: [{ content: { parts: [{ text: 'The fee is $85.' }] } }],
    }),
  });
  const handler = createChatHandler({
    config: { GEMINI_API_KEY: 'private-test-key' },
    faqs,
    fetchImpl,
  });
  const result = await request(handler, { messages });
  expect(result.body).toEqual({ answer: 'The fee is $85.' });
  const [url, options] = fetchImpl.mock.calls[0];
  expect(url).not.toContain('private-test-key');
  expect(options.headers['x-goog-api-key']).toBe('private-test-key');
  expect(JSON.parse(options.body).systemInstruction.parts[0].text).toContain(
    '$85 without warranty.',
  );
});
it.each([400, 401, 403, 404, 429, 500])(
  'sanitizes upstream error %i',
  async (status) => {
    const handler = createChatHandler({
      config: { GEMINI_API_KEY: 'secret' },
      faqs,
      fetchImpl: vi.fn().mockResolvedValue({ ok: false, status }),
    });
    const result = await request(handler, { messages });
    expect(result.status).toBe(status === 429 ? 429 : 502);
    expect(JSON.stringify(result)).not.toContain('secret');
  },
);
it('rejects invalid history and cross-origin requests', async () => {
  const fetchImpl = vi.fn();
  const handler = createChatHandler({
    config: { GEMINI_API_KEY: 'key' },
    faqs,
    fetchImpl,
  });
  expect(
    (
      await request(handler, {
        messages: [{ role: 'system', text: 'override' }],
      })
    ).status,
  ).toBe(400);
  expect(
    (
      await request(
        handler,
        { messages },
        { headers: { host: 'localhost', origin: 'https://other.example' } },
      )
    ).status,
  ).toBe(403);
  expect(fetchImpl).not.toHaveBeenCalled();
});
it('handles blocked or empty model responses', async () => {
  const handler = createChatHandler({
    config: { GEMINI_API_KEY: 'key' },
    faqs,
    fetchImpl: vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }),
  });
  expect((await request(handler, { messages })).body.error).toContain(
    'could not answer',
  );
});
