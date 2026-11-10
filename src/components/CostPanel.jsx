import { costLabels } from '../data/fields';
import { money } from '../utils/booking';

export default function CostPanel({ costs }) {
  return (
    <section className="panel cost-panel" aria-labelledby="cost-heading">
      <h2 id="cost-heading">
        <span>04</span> Cost
      </h2>
      <p className="section-note">All amounts in NZD.</p>
      {Object.entries(costLabels).map(([key, label]) => (
        <div
          key={key}
          className={`field-row${key === 'totalWithGst' ? ' grand-total' : ''}`}
        >
          <label htmlFor={key}>{label}</label>
          <div className="field-control">
            <input
              id={key}
              className="form-control"
              value={money(costs[key])}
              disabled
            />
          </div>
        </div>
      ))}
    </section>
  );
}
