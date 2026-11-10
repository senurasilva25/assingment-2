import { useState } from 'react';
import useBookings from '../hooks/useBookings';
import { supabase, configurationError } from '../services/supabase';
import { createDemoBookings } from '../data/demoBookings';
import BookingsPanel from '../components/BookingsPanel';
import JobDashboard from '../components/extension/JobDashboard';
import RepairCalendar from '../components/extension/RepairCalendar';
import RepairCharts from '../components/extension/RepairCharts';
import CourtesyDragDrop from '../components/extension/CourtesyDragDrop';
import RepairChat from '../components/extension/RepairAIChat';
import '../extension.css';

const demos = [
  [
    'Dashboard',
    'Async Supabase queries, deferred searching, array filtering, sorting and memoisation.',
  ],
  [
    'Calendar',
    'Date arithmetic, memoised appointment indexing and interactive calendar state.',
  ],
  [
    'Charts',
    'Array reduction and data-driven SVG chart rendering with an accessible data table.',
  ],
  [
    'Drag & drop',
    'Native HTML Drag and Drop API, DataTransfer and immutable state updates.',
  ],
  [
    'Help chat',
    'Gemini AI API, a server-side key, Fetch API, AbortController and conversation context.',
  ],
];

export default function ExtensionPage() {
  const controller = useBookings(supabase, configurationError);
  const [sampleJobs] = useState(createDemoBookings);
  const [source, setSource] = useState('sample');
  const [active, setActive] = useState(0);
  const jobs =
    source === 'sample'
      ? sampleJobs
      : controller.session
        ? controller.bookings
        : [];
  return (
    <>
      <section
        className="extension-statement"
        aria-labelledby="statement-heading"
      >
        <h2 id="statement-heading">Statement of authenticity</h2>
        <p className="statement-text">
          I confirm that: • This is an original assessment and is entirely my
          own work. • It contains no material previously published or written by
          another person or myself except where due acknowledgement is made in
          the text. • No material which to a substantial extent, has been
          submitted for any other academic course, is included without
          acknowledgement.
        </p>
      </section>
      <div className="extension-workspace">
        <aside
          className="demo-navigation"
          aria-label="JavaScript demonstrations"
        >
          {demos.map(([title], index) => (
            <button
              key={title}
              className={active === index ? 'selected-demo' : ''}
              aria-pressed={active === index}
              onClick={() => setActive(index)}
            >
              Demo {index + 1}
              <small>{title}</small>
            </button>
          ))}
        </aside>
        <div className="demo-content">
          <div className="demo-heading">
            <p className="eyebrow">ADVANCED JAVASCRIPT · DEMO {active + 1}</p>
            <p>{demos[active][1]}</p>
          </div>
          {active < 3 && (
            <div className="data-source">
              <label>
                Booking data
                <select
                  className="form-select"
                  value={source}
                  onChange={(event) => setSource(event.target.value)}
                >
                  <option value="sample">Sample data (fictional)</option>
                  <option value="live">Live Supabase bookings</option>
                </select>
              </label>
              <p role="status">
                {source === 'sample'
                  ? 'Showing 8 fictional jobs for demonstration. These are not saved to Supabase.'
                  : controller.session
                    ? controller.status
                    : 'Sign in below to query live bookings. No sample records are mixed into live data.'}
              </p>
              {source === 'live' && (
                <BookingsPanel controller={controller} showBookings={false} />
              )}
            </div>
          )}
          {active === 0 && <JobDashboard jobs={jobs} />}{' '}
          {active === 1 && <RepairCalendar jobs={jobs} />}{' '}
          {active === 2 && <RepairCharts jobs={jobs} />}{' '}
          {active === 3 && <CourtesyDragDrop />}{' '}
          {active === 4 && <RepairChat />}
          <details className="technique-notes">
            <summary>About the JavaScript technique</summary>
            <p>{demos[active][1]}</p>
            <p>
              Full implementation notes are in ADVANCED_JS.md in the project
              folder.
            </p>
          </details>
        </div>
      </div>
    </>
  );
}
