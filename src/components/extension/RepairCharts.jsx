import { useMemo, useState } from 'react';
import { groupCounts } from '../../utils/extension';
import { money } from '../../utils/booking';

export default function RepairCharts({ jobs }) {
  const [group, setGroup] = useState('make');
  const counts = useMemo(
    () =>
      groupCounts(jobs, (job) =>
        group === 'customerType'
          ? job.customer.customerType
          : job.repair[group],
      ),
    [jobs, group],
  );
  const maximum = Math.max(1, ...counts.map(([, count]) => count));
  return (
    <section>
      <h2>Repair statistics</h2>
      <p>
        Charts are calculated from the selected booking data, not fixed images.
      </p>
      <div className="stat-cards">
        <div>
          <strong>{jobs.length}</strong>
          <span>Repair jobs</span>
        </div>
        <div>
          <strong>
            {
              jobs.filter((job) => job.customer.customerType === 'business')
                .length
            }
          </strong>
          <span>Business customers</span>
        </div>
        <div>
          <strong>
            {money(
              jobs.reduce((total, job) => total + job.costs.totalWithGst, 0),
            )}
          </strong>
          <span>Quoted total incl. GST</span>
        </div>
      </div>
      <label>
        Group chart by
        <select
          className="form-select"
          value={group}
          onChange={(event) => setGroup(event.target.value)}
        >
          <option value="make">Phone make</option>
          <option value="fault">Fault category</option>
          <option value="customerType">Customer type</option>
        </select>
      </label>
      <figure className="repair-chart">
        <figcaption>
          Number of bookings by{' '}
          {group === 'customerType' ? 'customer type' : group}
        </figcaption>
        {counts.length ? (
          <svg
            viewBox={`0 0 640 ${counts.length * 52 + 15}`}
            role="img"
            aria-label={`Bar chart: ${counts.map(([name, count]) => `${name} ${count}`).join(', ')}`}
          >
            {counts.map(([name, count], index) => (
              <g key={name}>
                <text x="0" y={index * 52 + 30}>
                  {name}
                </text>
                <rect
                  x="150"
                  y={index * 52 + 10}
                  width={(count / maximum) * 420}
                  height="28"
                  rx="3"
                  fill={index % 2 ? '#619596' : '#4b789f'}
                >
                  <title>
                    {name}: {count} bookings
                  </title>
                </rect>
                <text x={160 + (count / maximum) * 420} y={index * 52 + 30}>
                  {count}
                </text>
              </g>
            ))}
          </svg>
        ) : (
          <p>No bookings to chart.</p>
        )}
      </figure>
      <table className="statistics-table">
        <caption>Accessible chart data</caption>
        <thead>
          <tr>
            <th>Category</th>
            <th>Bookings</th>
            <th>Share</th>
          </tr>
        </thead>
        <tbody>
          {counts.map(([name, count]) => (
            <tr key={name}>
              <td>{name}</td>
              <td>{count}</td>
              <td>{Math.round((count / jobs.length) * 100)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
