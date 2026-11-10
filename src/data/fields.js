const field = (name, label, type = 'text', options = {}) => ({
  name,
  label,
  type,
  required: true,
  ...options,
});

export const customerFields = [
  field('title', 'Title', 'select', {
    options: ['Mr', 'Mrs', 'Ms', 'Miss', 'Dr'],
  }),
  field('firstName', 'First name', 'text', { autoComplete: 'given-name' }),
  field('lastName', 'Last name', 'text', { autoComplete: 'family-name' }),
  field('street', 'Street', 'text', { autoComplete: 'address-line1' }),
  field('suburb', 'Suburb', 'text', { autoComplete: 'address-line2' }),
  field('city', 'City', 'text', { autoComplete: 'address-level2' }),
  field('postCode', 'Post code', 'text', {
    inputMode: 'numeric',
    autoComplete: 'postal-code',
  }),
  field('phone', 'Phone number', 'tel', { autoComplete: 'tel' }),
  field('email', 'Email', 'email', { autoComplete: 'email' }),
];
export const repairFields = [
  field('purchaseDate', 'Purchase date', 'date'),
  field('repairDate', 'Repair date', 'date'),
  field('repairTime', 'Repair time', 'time'),
];
export const deviceFields = [
  field('imei', 'IMEI number', 'text', { inputMode: 'numeric' }),
  field('make', 'Make', 'select', {
    options: ['Apple', 'LG', 'Motorola', 'Nokia', 'Samsung', 'Sony', 'Other'],
  }),
  field('model', 'Model number', 'text', { required: false }),
  field('fault', 'Fault category', 'select', {
    options: [
      'Battery',
      'Charging',
      'Screen',
      'SD-storage',
      'Software',
      'Other',
    ],
  }),
  field('description', 'Description', 'textarea', { maxLength: 3000 }),
];
export const allFields = [...customerFields, ...repairFields, ...deviceFields];
export const costLabels = {
  bond: 'Bond',
  serviceFee: 'Service fee',
  total: 'Total',
  gst: 'GST (15%)',
  totalWithGst: 'Total (+GST)',
};

export function createInitialValues() {
  return {
    ...Object.fromEntries(
      allFields.map(({ name, options }) => [name, options?.[0] ?? '']),
    ),
    customerType: 'consumer',
    warranty: false,
  };
}
