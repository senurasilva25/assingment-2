import { useState } from 'react';
import { courtesyItems, replaceCourtesyItem } from '../../data/courtesyItems';
import { calculateCosts, money } from '../../utils/booking';

export default function CourtesyDragDrop() {
  const [items, setItems] = useState([]);
  const [type, setType] = useState('consumer');
  const [message, setMessage] = useState(
    'Drag an item into the selection area, or use its Add button.',
  );
  function add(id) {
    const item = courtesyItems.find((item) => item.id === Number(id));
    if (!item) {
      setMessage('Choose an item from this catalogue.');
      return;
    }
    setItems((previous) => replaceCourtesyItem(previous, item));
    setMessage(`${item.name} added. One item per type is retained.`);
  }
  function drop(event) {
    event.preventDefault();
    add(event.dataTransfer.getData('application/x-phonefix-item'));
  }
  return (
    <section>
      <h2>Drag-and-drop courtesy desk</h2>
      <p>
        Try a phone and charger combination. This demonstration calculates a
        bond; it does not submit a repair booking.
      </p>
      <label>
        Bond customer type
        <select
          className="form-select"
          value={type}
          onChange={(event) => setType(event.target.value)}
        >
          <option value="consumer">Consumer</option>
          <option value="business">Business</option>
        </select>
      </label>
      <div className="courtesy-demo">
        <div className="courtesy-catalogue">
          {courtesyItems.map((item) => (
            <article
              key={item.id}
              className="draggable-item"
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData(
                  'application/x-phonefix-item',
                  String(item.id),
                );
                event.dataTransfer.effectAllowed = 'copy';
              }}
            >
              <strong>
                {item.name}
                {item.id === 10 ? ' charger' : ''}
              </strong>
              <span>
                {item.type} · {money(item.bond)}
              </span>
              <button
                className="btn btn-outline-dark"
                onClick={() => add(item.id)}
                aria-label={`Add ${item.name} ${item.type}`}
              >
                Add
              </button>
            </article>
          ))}
        </div>
        <div
          className="courtesy-dropzone"
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'copy';
          }}
          onDrop={drop}
          role="region"
          aria-label="Courtesy selection drop zone"
        >
          <h3>Your selection</h3>
          {!items.length && <p>Drop a courtesy item here.</p>}
          {items.map((item) => (
            <div className="selected-courtesy" key={item.id}>
              <strong>{item.name}</strong>
              <span>{money(item.bond)}</span>
              <button
                className="btn btn-outline-dark"
                onClick={() => {
                  setItems(items.filter((current) => current.id !== item.id));
                  setMessage(`${item.name} removed.`);
                }}
                aria-label={`Remove ${item.name}`}
              >
                Remove
              </button>
            </div>
          ))}
          <p className="bond-total">
            Bond:{' '}
            <strong>{money(calculateCosts(items, type, false).bond)}</strong>
          </p>
          {type === 'business' && <p>Business customers pay no bond.</p>}
          <button
            className="btn btn-outline-dark"
            onClick={() => {
              setItems([]);
              setMessage('Selection cleared.');
            }}
          >
            Clear selection
          </button>
        </div>
      </div>
      <p role="status">{message}</p>
    </section>
  );
}
