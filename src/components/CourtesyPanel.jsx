import { courtesyItems, replaceCourtesyItem } from '../data/courtesyItems';
import { money } from '../utils/booking';

export default function CourtesyPanel({
  items,
  onChange,
  choice,
  onChoiceChange,
  customerType,
}) {
  function addItem() {
    const item = courtesyItems.find((entry) => entry.id === Number(choice));
    onChange(replaceCourtesyItem(items, item));
  }
  return (
    <section
      className="panel courtesy-panel"
      aria-labelledby="courtesy-heading"
    >
      <h2 id="courtesy-heading">
        <span>03</span> Courtesy phone
      </h2>
      <p className="section-note">Stay connected while we repair your phone.</p>
      <label htmlFor="courtesy-item">Item type</label>
      <select
        id="courtesy-item"
        className="form-select"
        value={choice}
        onChange={(event) => onChoiceChange(event.target.value)}
      >
        {['phone', 'charger'].map((type) => (
          <optgroup key={type} label={type === 'phone' ? 'Phones' : 'Chargers'}>
            {courtesyItems
              .filter((item) => item.type === type)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} — {money(item.bond)}
                </option>
              ))}
          </optgroup>
        ))}
      </select>
      <button
        className="btn btn-dark add-button"
        type="button"
        onClick={addItem}
      >
        + Add / change item
      </button>
      <p className="section-note">
        Choose up to one phone and one charger. Adding another replaces that
        type.
      </p>
      <div className="table-wrap">
        <table>
          <caption className="visually-hidden">Selected courtesy items</caption>
          <thead>
            <tr>
              <th scope="col">Item</th>
              <th scope="col">Bond</th>
              <th scope="col">
                <span className="visually-hidden">Action</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {items.length ? (
              items.map((item) => (
                <tr key={item.id}>
                  <td>
                    {item.name}
                    {item.id === 10 && ' charger'}
                  </td>
                  <td>{money(item.bond)}</td>
                  <td>
                    <button
                      type="button"
                      className="remove-item"
                      aria-label={`Remove ${item.name} ${item.type}`}
                      onClick={() =>
                        onChange(items.filter((entry) => entry.id !== item.id))
                      }
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3}>No courtesy items selected.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p role="status">
        {customerType === 'business'
          ? 'Business customer: courtesy bond waived.'
          : 'The selected items’ bond is included below.'}
      </p>
    </section>
  );
}
