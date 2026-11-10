import { describe, expect, it } from 'vitest';
import { createInitialValues } from '../data/fields';
import { courtesyItems, replaceCourtesyItem } from '../data/courtesyItems';
import {
  calculateCosts,
  createBookingPayload,
  isValidDate,
  isWarrantyEligible,
  formatInvoiceDate,
  formatRepairDate,
} from '../utils/booking';
import { validateBooking } from '../utils/validation';

const today = new Date(2026, 9, 16);
export const validValues = {
  ...createInitialValues(),
  firstName: 'Anne–Marie',
  lastName: 'Silva',
  street: '12 Main Street',
  suburb: 'Taradale',
  city: 'Napier',
  postCode: '4112',
  phone: '+64 (21) 123-4567',
  email: 'anne@example.com',
  purchaseDate: '2026-01-01',
  repairDate: '2026-10-17',
  repairTime: '13:30',
  imei: '123456789012345',
  description: 'Screen is cracked.',
};

describe('calendar and warranty rules', () => {
  it('rejects impossible dates and accepts leap days', () => {
    expect(isValidDate('2019-14-33')).toBe(false);
    expect(isValidDate('2025-02-29')).toBe(false);
    expect(isValidDate('2024-02-29')).toBe(true);
  });
  it('includes exactly 24 months and excludes older, today and future purchases', () => {
    expect(isWarrantyEligible('2024-10-16', today)).toBe(true);
    for (const date of ['2024-10-15', '2026-10-16', '2026-10-17', ''])
      expect(isWarrantyEligible(date, today)).toBe(false);
    expect(isWarrantyEligible('2022-02-28', new Date(2024, 1, 29))).toBe(true);
  });
  it('formats invoice hours as 24-hour and appointment as AM/PM', () => {
    expect(formatInvoiceDate(new Date(2026, 9, 16, 13, 30))).toContain('13:30');
    expect(formatRepairDate(validValues)).toContain('1:30 PM');
  });
});

describe('validation', () => {
  it('accepts a complete booking', () =>
    expect(validateBooking(validValues, today)).toEqual({}));
  it.each([
    ['firstName', 'Anne2'],
    ['lastName', "O'Neil"],
    ['postCode', '123'],
    ['postCode', '12345'],
    ['phone', 'abc123'],
    ['phone', '(+)'],
    ['email', 'invalid'],
    ['imei', '12345678901234'],
    ['imei', '12345678901234a'],
    ['purchaseDate', '2026-10-16'],
    ['purchaseDate', '2026-10-17'],
    ['repairDate', '2026-10-16'],
    ['repairDate', '2026-02-30'],
    ['repairTime', '24:00'],
    ['title', 'Other'],
    ['make', 'Invalid'],
    ['fault', 'Invalid'],
    ['description', ' '.repeat(3)],
  ])('rejects invalid %s: %s', (name, value) =>
    expect(
      validateBooking({ ...validValues, [name]: value }, today)[name],
    ).toBeTruthy(),
  );
  it('requires every mandatory field, with model optional', () => {
    const errors = validateBooking(createInitialValues(), today);
    expect(errors.firstName).toBeTruthy();
    expect(errors.repairTime).toBeTruthy();
    expect(errors.model).toBeUndefined();
  });
});

describe('courtesy items, totals and database payload', () => {
  it('replaces a phone while retaining its charger', () => {
    const items = replaceCourtesyItem(
      [courtesyItems[0], courtesyItems[6]],
      courtesyItems[2],
    );
    expect(items.map((item) => item.id)).toEqual([7, 3]);
  });
  it('calculates consumer costs and business exemption', () => {
    expect(
      calculateCosts([courtesyItems[0], courtesyItems[6]], 'consumer', false),
    ).toEqual({
      bond: 320,
      serviceFee: 85,
      total: 405,
      gst: 60.75,
      totalWithGst: 465.75,
    });
    expect(calculateCosts(courtesyItems, 'business', true).totalWithGst).toBe(
      0,
    );
    expect(calculateCosts([], 'consumer', false).totalWithGst).toBe(97.75);
  });
  it('preserves the existing JSON database shape and business snapshot', () => {
    const business = { companyName: 'Phone Fix', businessCard: 'Service desk' };
    const payload = createBookingPayload(
      { ...validValues, warranty: true },
      [courtesyItems[0]],
      business,
      today,
    );
    expect(Object.keys(payload)).toEqual([
      'customer',
      'repair',
      'courtesy_items',
      'costs',
      'business',
    ]);
    expect(payload.customer.firstName).toBe('Anne–Marie');
    expect(payload.repair.warranty).toBe(true);
    expect(payload.costs.totalWithGst).toBe(316.25);
    expect(payload.business).toEqual(business);
    expect(payload.business).not.toBe(business);
    expect(
      createBookingPayload(
        { ...validValues, purchaseDate: '2020-01-01', warranty: true },
        [],
        business,
        today,
      ).repair.warranty,
    ).toBe(false);
  });
});
