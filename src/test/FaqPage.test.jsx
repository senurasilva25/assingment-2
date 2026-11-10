import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import FaqPage from '../pages/FaqPage';

it('loads JSON and searches both question and answer keywords', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          question: 'What is the bond?',
          answer: 'A courtesy deposit for a consumer.',
        },
        { question: 'What is the service fee?', answer: 'An $85 charge.' },
      ],
    }),
  );
  render(<FaqPage />);
  const user = userEvent.setup();
  await screen.findByText('2 question(s) found.');
  await user.type(screen.getByRole('searchbox'), 'BOND consumer');
  expect(screen.getByText('1 question(s) found.')).toBeInTheDocument();
  expect(
    screen.queryByRole('heading', { name: 'What is the service fee?' }),
  ).not.toBeInTheDocument();
  await user.clear(screen.getByRole('searchbox'));
  await user.type(screen.getByRole('searchbox'), 'unmatched');
  expect(screen.getByText(/No matching questions/)).toBeInTheDocument();
});

it('reports FAQ failures', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
  render(<FaqPage />);
  expect(await screen.findByText(/Unable to load FAQs/)).toBeInTheDocument();
});
