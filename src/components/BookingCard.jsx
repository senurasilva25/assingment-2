import { customerFields, deviceFields, costLabels } from '../data/fields';
import { formatInvoiceDate, formatRepairDate, money } from '../utils/booking';

function Detail({ label, value }) {
  return (
    <p>
      <strong>{label}:</strong>
      {String(value ?? '—')}
    </p>
  );
}

const businessLabels = {
  companyName: 'Company',
  phone: 'Phone',
  email: 'Email',
  physicalAddress: 'Address',
  businessCard: 'Business card',
};

export default function BookingCard({ booking }) {
  return (
    <details className="booking-card">
      <summary>
        {booking.job_number} · {booking.customer.firstName}{' '}
        {booking.customer.lastName} · {money(booking.costs.totalWithGst)}
      </summary>
      <div className="invoice-columns">
        <section>
          <h3>Repair Booking Job</h3>
          <Detail label="Job number" value={booking.job_number} />
          <Detail
            label="Invoice date"
            value={formatInvoiceDate(booking.created_at)}
          />
          {Object.entries(booking.business).map(([key, value]) => (
            <Detail
              key={key}
              label={businessLabels[key] ?? key}
              value={value}
            />
          ))}
        </section>
        <section>
          <h3>Customer details</h3>
          <Detail label="Customer type" value={booking.customer.customerType} />
          {customerFields.map(({ name, label }) => (
            <Detail key={name} label={label} value={booking.customer[name]} />
          ))}
        </section>
        <section>
          <h3>Repair details</h3>
          <Detail label="Purchase date" value={booking.repair.purchaseDate} />
          <Detail
            label="Repair date/time"
            value={formatRepairDate(booking.repair)}
          />
          <Detail
            label="Under warranty"
            value={booking.repair.warranty ? 'Yes' : 'No'}
          />
          {deviceFields.map(({ name, label }) => (
            <Detail key={name} label={label} value={booking.repair[name]} />
          ))}
        </section>
        <section>
          <h3>Courtesy items &amp; cost</h3>
          {booking.courtesy_items.length ? (
            booking.courtesy_items.map((item) => (
              <Detail
                key={item.id}
                label={`${item.name} (${item.type})`}
                value={money(item.bond)}
              />
            ))
          ) : (
            <Detail label="Courtesy items" value="None" />
          )}
          {Object.entries(costLabels).map(([key, label]) => (
            <Detail key={key} label={label} value={money(booking.costs[key])} />
          ))}
        </section>
      </div>
    </details>
  );
}
