import { useMemo, useState } from 'react';
import { calendarDays } from '../../utils/extension';
import { dateKey, formatRepairDate } from '../../utils/booking';

export default function RepairCalendar({ jobs }) {
  const [month, setMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [selected, setSelected] = useState(dateKey());
  const byDay = useMemo(
    () =>
      jobs.reduce((map, job) => {
        (map[job.repair.repairDate] ??= []).push(job);
        return map;
      }, {}),
    [jobs],
  );
  function move(offset) {
    setMonth(new Date(month.getFullYear(), month.getMonth() + offset, 1));
    setSelected('');
  }
  return (
    <section>
      <h2>Repair appointment calendar</h2>
      <p>
        Select a date to see its jobs. Dates use the browser’s local calendar.
      </p>
      <div className="calendar-toolbar">
        <button
          className="btn btn-outline-dark"
          onClick={() => move(-1)}
          aria-label="Previous month"
        >
          ←
        </button>
        <h3 aria-live="polite">
          {month.toLocaleDateString('en-NZ', {
            month: 'long',
            year: 'numeric',
          })}
        </h3>
        <button
          className="btn btn-outline-dark"
          onClick={() => move(1)}
          aria-label="Next month"
        >
          →
        </button>
        <button
          className="btn btn-outline-dark"
          onClick={() => {
            const now = new Date();
            setMonth(new Date(now.getFullYear(), now.getMonth(), 1));
            setSelected(dateKey(now));
          }}
        >
          Today
        </button>
      </div>
      <div className="repair-calendar">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <strong key={day}>{day}</strong>
        ))}
        {calendarDays(month).map((day) => (
          <button
            key={day.key}
            className={`calendar-day${day.current ? '' : ' outside-month'}${selected === day.key ? ' selected-day' : ''}`}
            aria-label={`${day.key}, ${byDay[day.key]?.length || 0} jobs`}
            aria-pressed={selected === day.key}
            onClick={() => setSelected(day.key)}
          >
            <span>{day.day}</span>
            {byDay[day.key]?.length > 0 && (
              <small>
                {byDay[day.key].length} job
                {byDay[day.key].length === 1 ? '' : 's'}
              </small>
            )}
          </button>
        ))}
      </div>
      <div className="calendar-agenda" aria-live="polite">
        <h3>{selected ? `Jobs on ${selected}` : 'Select a date'}</h3>
        {selected && !byDay[selected]?.length && (
          <p>No repair appointments on this date.</p>
        )}
        {[...(byDay[selected] || [])]
          .sort((a, b) =>
            a.repair.repairTime.localeCompare(b.repair.repairTime),
          )
          .map((job) => (
            <p key={job.id}>
              <strong>#{job.job_number}</strong> · {job.customer.firstName}{' '}
              {job.customer.lastName} · {job.repair.make} / {job.repair.fault}
              <br />
              {formatRepairDate(job.repair)}
            </p>
          ))}
      </div>
    </section>
  );
}
