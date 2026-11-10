import BookingForm from '../components/BookingForm';
import BookingsPanel from '../components/BookingsPanel';
import useBookings from '../hooks/useBookings';
import { supabase, configurationError, business } from '../services/supabase';

export default function BookingPage() {
  const controller = useBookings(supabase, configurationError);
  return (
    <>
      <div className="page-intro">
        <div>
          <p className="eyebrow">LET’S GET IT FIXED</p>
          <h1>Book a phone repair</h1>
          <p>
            Customer details, repair information, and a little help while you
            wait.
          </p>
        </div>
        <span className="required-note">* Required fields</span>
      </div>
      <BookingForm onSave={controller.save} business={business} />
      <BookingsPanel controller={controller} />
    </>
  );
}
