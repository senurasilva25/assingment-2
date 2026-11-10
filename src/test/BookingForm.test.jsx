import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import BookingForm from '../components/BookingForm';
import { dateKey } from '../utils/booking';

function renderForm(onSave = vi.fn()) {
  render(
    <BookingForm onSave={onSave} business={{ companyName: 'Phone Fix' }} />,
  );
  return onSave;
}
function fillForm() {
  const purchase = new Date();
  purchase.setMonth(purchase.getMonth() - 1);
  const repair = new Date();
  repair.setDate(repair.getDate() + 1);
  const values = {
    'First name *': 'Anne',
    'Last name *': 'Silva',
    'Street *': '12 Main Street',
    'Suburb *': 'Taradale',
    'City *': 'Napier',
    'Post code *': '4112',
    'Phone number *': '+64 (21) 123-4567',
    'Email *': 'anne@example.com',
    'Purchase date *': dateKey(purchase),
    'Repair date *': dateKey(repair),
    'Repair time *': '13:30',
    'IMEI number *': '123456789012345',
    'Description *': 'Broken screen',
  };
  Object.entries(values).forEach(([label, value]) =>
    fireEvent.change(screen.getByLabelText(label), { target: { value } }),
  );
}

describe('React booking form', () => {
  it('shows accessible errors and focuses the first invalid field', async () => {
    const save = renderForm();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Submit booking/ }));
    expect(screen.getByLabelText('First name *')).toHaveFocus();
    expect(screen.getByLabelText('First name *')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(save).not.toHaveBeenCalled();
  });
  it('adds, replaces, removes and exempts courtesy bonds, then fully resets', async () => {
    renderForm();
    const user = userEvent.setup();
    expect(screen.getByLabelText('Total (+GST)')).toHaveValue('$97.75');
    await user.click(screen.getByRole('button', { name: /Add \/ change/ }));
    expect(screen.getByLabelText('Bond')).toHaveValue('$275.00');
    await user.selectOptions(screen.getByLabelText('Item type'), '3');
    await user.click(screen.getByRole('button', { name: /Add \/ change/ }));
    expect(
      screen.queryByRole('button', { name: 'Remove iphone 10 phone' }),
    ).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Item type'), '7');
    await user.click(screen.getByRole('button', { name: /Add \/ change/ }));
    expect(screen.getByLabelText('Bond')).toHaveValue('$545.00');
    await user.click(screen.getByLabelText('Business'));
    expect(screen.getByLabelText('Bond')).toHaveValue('$0.00');
    await user.click(screen.getByLabelText('Consumer'));
    await user.click(
      screen.getByRole('button', { name: 'Remove iphone 16 phone' }),
    );
    expect(screen.getByLabelText('Bond')).toHaveValue('$45.00');
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByLabelText('Total (+GST)')).toHaveValue('$97.75');
    expect(screen.getByLabelText('Item type')).toHaveValue('1');
    expect(screen.getByLabelText('Under warranty')).toBeDisabled();
  });
  it('updates warranty eligibility and service fees', async () => {
    renderForm();
    fillForm();
    const user = userEvent.setup();
    await user.click(screen.getByLabelText('Under warranty'));
    expect(screen.getByLabelText('Service fee')).toHaveValue('$0.00');
    fireEvent.change(screen.getByLabelText('Purchase date *'), {
      target: { value: '2020-01-01' },
    });
    expect(screen.getByLabelText('Under warranty')).toBeDisabled();
    expect(screen.getByLabelText('Under warranty')).not.toBeChecked();
    expect(screen.getByLabelText('Service fee')).toHaveValue('$85.00');
  });
  it('preserves data and reuses the ID after a failed save', async () => {
    const save = vi
      .fn()
      .mockRejectedValueOnce(new Error('Network unavailable.'))
      .mockResolvedValue({ job_number: 42 });
    renderForm(save);
    fillForm();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Submit booking/ }));
    await screen.findByText(/Network unavailable/);
    expect(screen.getByLabelText('First name *')).toHaveValue('Anne');
    await user.click(screen.getByRole('button', { name: /Submit booking/ }));
    await screen.findByText(/Job number: 42/);
    expect(save.mock.calls[0][0]).toBe(save.mock.calls[1][0]);
    expect(save.mock.calls[1][1].repair.repairTime).toBe('13:30');
  });
  it('blocks repeated submissions and edits while saving', async () => {
    let finish;
    const save = vi.fn(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    renderForm(save);
    fillForm();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Submit booking/ }));
    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Reset' })).toBeDisabled();
    expect(screen.getByLabelText('First name *')).toBeDisabled();
    finish({ job_number: 8 });
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /Submit booking/ }),
      ).toBeEnabled(),
    );
    expect(save).toHaveBeenCalledTimes(1);
  });
});
