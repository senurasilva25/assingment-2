import { customerFields, repairFields, deviceFields } from '../data/fields';

export function dateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime()) && dateKey(date) === value;
}

export function isWarrantyEligible(purchase, today = new Date()) {
  if (!isValidDate(purchase) || purchase >= dateKey(today)) return false;
  const cutoff = new Date(today.getFullYear() - 2, today.getMonth(), 1);
  const lastDay = new Date(
    cutoff.getFullYear(),
    cutoff.getMonth() + 1,
    0,
  ).getDate();
  cutoff.setDate(Math.min(today.getDate(), lastDay));
  return purchase >= dateKey(cutoff);
}

export function calculateCosts(items, customerType, warranty) {
  const bond =
    customerType === 'business'
      ? 0
      : items.reduce((sum, item) => sum + item.bond, 0);
  const serviceFee = warranty ? 0 : 85;
  const total = bond + serviceFee;
  const gst = Math.round(total * 15) / 100;
  return {
    bond,
    serviceFee,
    total,
    gst,
    totalWithGst: Math.round((total + gst) * 100) / 100,
  };
}

export const money = (value) => `$${Number(value).toFixed(2)}`;

export function dateLimits(today = new Date()) {
  const yesterday = new Date(today);
  const tomorrow = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  tomorrow.setDate(today.getDate() + 1);
  return {
    purchaseDate: { max: dateKey(yesterday) },
    repairDate: { min: dateKey(tomorrow) },
  };
}

export function createBookingPayload(
  values,
  items,
  business,
  today = new Date(),
) {
  const pick = (fields) =>
    Object.fromEntries(fields.map(({ name }) => [name, values[name].trim()]));
  const warranty =
    values.warranty && isWarrantyEligible(values.purchaseDate, today);
  return {
    customer: { customerType: values.customerType, ...pick(customerFields) },
    repair: { ...pick([...repairFields, ...deviceFields]), warranty },
    courtesy_items: items.map((item) => ({ ...item })),
    costs: calculateCosts(items, values.customerType, warranty),
    business: { ...business },
  };
}

export function formatInvoiceDate(value) {
  return new Intl.DateTimeFormat('en-NZ', {
    dateStyle: 'medium',
    timeStyle: 'short',
    hourCycle: 'h23',
  }).format(new Date(value));
}

export function formatRepairDate(repair) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(`${repair.repairDate}T${repair.repairTime}`));
}
