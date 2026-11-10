import { dateKey } from '../utils/booking';
import {
  createInitialValues,
  customerFields,
  repairFields,
  deviceFields,
} from './fields';

export function createDemoBookings(today = new Date()) {
  return ['Aroha', 'James', 'Mia', 'Liam', 'Ana', 'Noah', 'Isla', 'Leo'].map(
    (name, index) => {
      const date = new Date(
        today.getFullYear(),
        today.getMonth(),
        3 + index * 3,
      );
      const values = {
        ...createInitialValues(),
        firstName: name,
        lastName: 'Sample',
        street: '24 Demo Lane',
        suburb: 'Napier South',
        city: 'Napier',
        postCode: '4110',
        email: 'sample@example.invalid',
        phone: '06 555 0142',
        imei: '123456789012345',
        purchaseDate: '2025-01-01',
        repairDate: dateKey(date),
        repairTime: index % 2 ? '14:30' : '09:00',
        make: ['Apple', 'Samsung', 'Nokia'][index % 3],
        fault: ['Screen', 'Battery', 'Charging', 'Software'][index % 4],
        description: 'Fictional demonstration booking.',
      };
      const pick = (fields) =>
        Object.fromEntries(fields.map(({ name: key }) => [key, values[key]]));
      return {
        id: `sample-${index}`,
        job_number: `DEMO-${index + 1}`,
        created_at: new Date(
          today.getFullYear(),
          today.getMonth(),
          index + 1,
          10,
        ).toISOString(),
        customer: {
          ...pick(customerFields),
          customerType: index % 3 ? 'consumer' : 'business',
        },
        repair: {
          ...pick([...repairFields, ...deviceFields]),
          warranty: false,
        },
        courtesy_items: [],
        costs: {
          bond: 0,
          serviceFee: 85,
          total: 85,
          gst: 12.75,
          totalWithGst: 97.75,
        },
        business: {
          companyName: 'Phone Fix Napier (Demo)',
          businessCard: 'Fictional sample only',
        },
      };
    },
  );
}
