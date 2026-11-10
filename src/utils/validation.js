import { allFields } from '../data/fields';
import { dateKey, isValidDate } from './booking';

export function validateField(field, values, today = new Date()) {
  const value = values[field.name].trim();
  if (!value) return field.required ? 'This field is required.' : '';
  if (field.options && !field.options.includes(value))
    return 'Select a valid option.';
  if (field.maxLength && value.length > field.maxLength)
    return `Use ${field.maxLength} characters or fewer.`;
  switch (field.name) {
    case 'firstName':
    case 'lastName':
      return /^[\p{L} \-–]+$/u.test(value)
        ? ''
        : 'Use letters, spaces, or hyphens only.';
    case 'postCode':
      return /^\d{4}$/.test(value) ? '' : 'Enter exactly 4 numbers.';
    case 'phone':
      return /^[0-9 ()+\-]+$/.test(value) && /\d/.test(value)
        ? ''
        : 'Use numbers, spaces, parentheses, + or -.';
    case 'imei':
      return /^\d{15}$/.test(value) ? '' : 'Enter exactly 15 numbers.';
    case 'email':
      return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/.test(
        value,
      )
        ? ''
        : 'Enter a valid email address.';
    case 'purchaseDate':
      if (!isValidDate(value)) return 'Enter a valid calendar date.';
      return value < dateKey(today)
        ? ''
        : 'Purchase date must be before today.';
    case 'repairDate':
      if (!isValidDate(value)) return 'Enter a valid calendar date.';
      return value > dateKey(today) && value > values.purchaseDate
        ? ''
        : 'Repair date must be after today and after purchase.';
    case 'repairTime':
      return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)
        ? ''
        : 'Enter a valid repair time.';
    default:
      return '';
  }
}

export function validateBooking(values, today = new Date()) {
  return Object.fromEntries(
    allFields
      .map((field) => [field.name, validateField(field, values, today)])
      .filter(([, error]) => error),
  );
}
