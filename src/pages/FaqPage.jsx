import { useEffect, useRef, useState } from 'react';

export default function FaqPage() {
  const [questions, setQuestions] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const resultsRef = useRef(null);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch('faqs.json', {
          signal: controller.signal,
        });
        if (!response.ok)
          throw new Error(
            'Unable to load FAQs. Please refresh the page to retry.',
          );
        const data = await response.json();
        if (
          !Array.isArray(data) ||
          data.some(
            (item) =>
              typeof item.question !== 'string' ||
              typeof item.answer !== 'string',
          )
        )
          throw new Error('FAQ data has an invalid format.');
        if (!controller.signal.aborted) setQuestions(data);
      } catch (failure) {
        if (!controller.signal.aborted) setError(failure.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, []);
  const terms = search.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const matches = questions.filter((item) =>
    terms.every((term) =>
      `${item.question} ${item.answer}`.toLowerCase().includes(term),
    ),
  );
  return (
    <div className="faq-main">
      <form
        className="faq-search-form"
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          resultsRef.current?.focus();
        }}
      >
        <label className="visually-hidden" htmlFor="faq-search">
          Search questions and answers
        </label>
        <input
          id="faq-search"
          type="search"
          className="form-control"
          placeholder="Search questions and answers"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <button className="btn faq-search-button" type="submit">
          Search
        </button>
      </form>
      <p
        className="faq-result-status"
        ref={resultsRef}
        tabIndex={-1}
        role="status"
        aria-live="polite"
      >
        {loading
          ? 'Loading questions…'
          : error ||
            (matches.length
              ? `${matches.length} question(s) found.`
              : 'No matching questions. Try another keyword.')}
      </p>
      {matches.map((item) => (
        <article className="faq-item" key={item.question}>
          <h2>{item.question}</h2>
          <p>{item.answer}</p>
        </article>
      ))}
      <a className="faq-back-link" href="index.html">
        ← Back to repair booking
      </a>
    </div>
  );
}
