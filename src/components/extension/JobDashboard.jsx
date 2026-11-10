import { useDeferredValue, useMemo, useState } from 'react';
import BookingCard from '../BookingCard';
import { filterJobs } from '../../utils/extension';

export default function JobDashboard({ jobs }) {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [sort, setSort] = useState('date');
  const deferredSearch = useDeferredValue(search);
  const filtered = useMemo(
    () => filterJobs(jobs, deferredSearch, type, sort),
    [jobs, deferredSearch, type, sort],
  );
  return (
    <section>
      <h2>Repair booking dashboard</h2>
      <p>
        Find a job by number, customer, make, fault or repair date. Expand a
        result to view its invoice.
      </p>
      <div className="extension-controls">
        <label htmlFor="dashboard-search">
          Search bookings
          <input
            id="dashboard-search"
            className="form-control"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label htmlFor="dashboard-customer-type">
          Customer type
          <select
            id="dashboard-customer-type"
            className="form-select"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="all">All customers</option>
            <option value="consumer">Consumer</option>
            <option value="business">Business</option>
          </select>
        </label>
        <label htmlFor="dashboard-sort">
          Sort by
          <select
            id="dashboard-sort"
            className="form-select"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="date">Repair date (earliest)</option>
            <option value="newest">Invoice date (newest)</option>
            <option value="name">Customer name</option>
            <option value="cost">Total (highest)</option>
          </select>
        </label>
      </div>
      <p role="status">{filtered.length} matching booking(s)</p>
      {filtered.map((job) => (
        <BookingCard key={job.id} booking={job} />
      ))}
      {!filtered.length && (
        <p className="extension-empty">
          No matching bookings. Change your filters or select sample data.
        </p>
      )}
    </section>
  );
}
