import { useRef, useState } from 'react';
import {
  allFields,
  createInitialValues,
  customerFields,
  repairFields,
  deviceFields,
} from '../data/fields';
import {
  calculateCosts,
  createBookingPayload,
  dateLimits,
  isWarrantyEligible,
} from '../utils/booking';
import { validateBooking, validateField } from '../utils/validation';
import FormField from './FormField';
import CourtesyPanel from './CourtesyPanel';
import CostPanel from './CostPanel';

export default function BookingForm({ onSave, business }) {
  const [values, setValues] = useState(createInitialValues);
  const [items, setItems] = useState([]);
  const [choice, setChoice] = useState('1');
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('Ready when you are.');
  const [saving, setSaving] = useState(false);
  const pending = useRef(null);
  const savingRef = useRef(false);
  const formRef = useRef(null);
  const eligible = isWarrantyEligible(values.purchaseDate);
  const costs = calculateCosts(
    items,
    values.customerType,
    eligible && values.warranty,
  );
  const limits = dateLimits();

  function changeField(name, value) {
    const next = { ...values, [name]: value };
    if (!isWarrantyEligible(next.purchaseDate)) next.warranty = false;
    setValues(next);
    setErrors((previous) =>
      Object.fromEntries(
        Object.keys(previous)
          .map((key) => {
            const field = allFields.find((entry) => entry.name === key);
            return [key, validateField(field, next)];
          })
          .filter(([, error]) => error),
      ),
    );
  }

  function blurField(name) {
    const field = allFields.find((entry) => entry.name === name);
    setErrors((previous) => ({
      ...previous,
      [name]: validateField(field, values),
    }));
  }

  function resetForm(event) {
    event.preventDefault();
    if (savingRef.current) return;
    setValues(createInitialValues());
    setItems([]);
    setChoice('1');
    setErrors({});
    pending.current = null;
    setStatus('Form reset. Ready for a new booking.');
  }

  async function submitForm(event) {
    event.preventDefault();
    if (savingRef.current) return;
    const nextErrors = validateBooking(values);
    setErrors(nextErrors);
    const invalidNames = Object.keys(nextErrors);
    if (invalidNames.length) {
      setStatus(`Please correct ${invalidNames.length} highlighted field(s).`);
      formRef.current.elements.namedItem(invalidNames[0])?.focus();
      return;
    }
    const payload = createBookingPayload(values, items, business);
    const signature = JSON.stringify(payload);
    if (pending.current?.signature !== signature)
      pending.current = { signature, id: crypto.randomUUID() };
    savingRef.current = true;
    setSaving(true);
    setStatus('Saving repair booking…');
    try {
      const booking = await onSave(pending.current.id, payload);
      setStatus(
        `Booking saved successfully. Job number: ${booking.job_number}.`,
      );
    } catch (error) {
      setStatus(
        `Booking could not be confirmed: ${error.message} Your form is preserved; you can retry.`,
      );
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  function fields(definitions) {
    return definitions.map((field) => (
      <FormField
        key={field.name}
        field={field}
        value={values[field.name]}
        error={errors[field.name]}
        onChange={changeField}
        onBlur={blurField}
        limits={limits[field.name]}
      />
    ));
  }

  return (
    <form
      ref={formRef}
      id="booking-form"
      noValidate
      onSubmit={submitForm}
      onReset={resetForm}
    >
      <fieldset disabled={saving} className="booking-fieldset">
        <legend className="visually-hidden">Phone repair booking</legend>
        <div className="booking-layout">
          <section
            className="panel customer-panel"
            aria-labelledby="customer-heading"
          >
            <h2 id="customer-heading">
              <span>01</span> Customer details
            </h2>
            <fieldset className="customer-type">
              <legend>Customer type *</legend>
              {['consumer', 'business'].map((type) => (
                <label key={type}>
                  <input
                    type="radio"
                    name="customerType"
                    value={type}
                    checked={values.customerType === type}
                    onChange={() => changeField('customerType', type)}
                    required
                  />{' '}
                  {type === 'consumer' ? 'Consumer' : 'Business'}
                </label>
              ))}
            </fieldset>
            {fields(customerFields)}
          </section>
          <section
            className="panel repair-panel"
            aria-labelledby="repair-heading"
          >
            <h2 id="repair-heading">
              <span>02</span> Repair details
            </h2>
            {fields(repairFields)}
            <div className="warranty-box">
              <label>
                <input
                  name="warranty"
                  type="checkbox"
                  disabled={!eligible}
                  checked={eligible && values.warranty}
                  onChange={(event) =>
                    changeField('warranty', event.target.checked)
                  }
                  aria-describedby="warranty-help"
                />{' '}
                Under warranty
              </label>
              <small id="warranty-help">
                {!values.purchaseDate
                  ? 'Enter a purchase date to check eligibility.'
                  : eligible
                    ? 'Within 24 months. Check if warranty coverage applies.'
                    : 'Not eligible: purchase must be before today and within 24 months.'}
              </small>
            </div>
            {fields(deviceFields)}
          </section>
          <div className="side-panels">
            <CourtesyPanel
              items={items}
              onChange={setItems}
              choice={choice}
              onChoiceChange={setChoice}
              customerType={values.customerType}
            />
            <CostPanel costs={costs} />
          </div>
        </div>
        <div className="form-actions">
          <p role="status" aria-live="polite">
            {status}
          </p>
          <div>
            <button type="reset" className="btn btn-outline-dark">
              Reset
            </button>
            <a
              className="btn btn-outline-dark"
              href="faq.html"
              target="_blank"
              rel="noopener"
            >
              FAQs ↗
            </a>
            <button type="submit" className="btn btn-dark">
              {saving ? 'Saving…' : 'Submit booking →'}
            </button>
          </div>
        </div>
      </fieldset>
    </form>
  );
}
