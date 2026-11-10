import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import BookingCard from '../components/BookingCard';
import { createInitialValues } from '../data/fields';
import { createBookingPayload } from '../utils/booking';

it('displays submitted details, business contact information and both time formats safely', () => {
  const payload = createBookingPayload(
    {
      ...createInitialValues(),
      firstName: 'Anne',
      lastName: 'Silva',
      purchaseDate: '2026-01-01',
      repairDate: '2026-10-17',
      repairTime: '13:30',
      description: '<script>alert(1)</script>',
    },
    [],
    {
      companyName: 'Phone Fix',
      phone: '0212345678',
      email: 'desk@example.com',
      physicalAddress: '12 Main Street',
      businessCard: 'Repair desk',
    },
    new Date(2026, 9, 16),
  );
  render(
    <BookingCard
      booking={{
        id: 'job-42',
        job_number: 42,
        created_at: new Date(2026, 9, 16, 13, 30).toISOString(),
        ...payload,
      }}
    />,
  );
  expect(screen.getByText(/42 · Anne Silva/)).toBeInTheDocument();
  expect(screen.getByText('Phone Fix')).toBeInTheDocument();
  expect(screen.getByText('desk@example.com')).toBeInTheDocument();
  expect(screen.getByText('12 Main Street')).toBeInTheDocument();
  expect(screen.getByText('Repair desk')).toBeInTheDocument();
  expect(screen.getByText(/13:30/)).toBeInTheDocument();
  expect(screen.getByText(/1:30 PM/)).toBeInTheDocument();
  expect(screen.getByText('<script>alert(1)</script>')).toBeInTheDocument();
  expect(document.querySelector('script')).toBeNull();
});
