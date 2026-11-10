import { useEffect, useRef, useState } from 'react';

const greeting = {
  role: 'assistant',
  text: 'Hello! Ask me about bonds, warranty, chargers, service fees or the repair booking process.',
};

export default function RepairAIChat() {
  const [messages, setMessages] = useState([greeting]);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const requestRef = useRef(null);
  const logRef = useRef(null);
  useEffect(() => () => requestRef.current?.abort(), []);
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages, busy]);
  async function send(question) {
    const text = question.trim();
    if (!text || requestRef.current) return;
    const controller = new AbortController();
    requestRef.current = controller;
    const history = [...messages.slice(1), { role: 'user', text }].slice(-7);
    if (history[0]?.role === 'assistant') history.shift();
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
        signal: controller.signal,
      });
      const result = await response.json().catch(() => ({
        error:
          'The chat server is unavailable. Start the Node/Vite server and try again.',
      }));
      if (!response.ok || typeof result.answer !== 'string')
        throw new Error(
          result.error || 'No answer was returned. Please try again.',
        );
      if (!controller.signal.aborted) {
        setMessages((previous) => [
          ...previous,
          { role: 'user', text },
          { role: 'assistant', text: result.answer },
        ]);
        setInput('');
      }
    } catch (failure) {
      if (!controller.signal.aborted) {
        setError(failure.message);
        setInput(text);
      }
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null;
        setBusy(false);
      }
    }
  }
  function clear() {
    requestRef.current?.abort();
    requestRef.current = null;
    setBusy(false);
    setMessages([greeting]);
    setInput('');
    setError('');
  }
  return (
    <section>
      <h2>Repair help chat</h2>
      <p>
        Powered by Google Gemini, with Phone Fix FAQs as reference. AI answers
        can be mistaken; confirm repair decisions with an employee.
      </p>
      
        
      
      {error && (
        <p role="alert">
          {error}{' '}
          <a href="faq.html" target="_blank" rel="noopener">
            Open FAQs
          </a>
        </p>
      )}
      <div
        className="repair-chat"
        ref={logRef}
        role="log"
        aria-label="Repair help conversation"
        aria-live="polite"
      >
        {messages.map((message, index) => (
          <div key={index} className={`chat-message chat-${message.role}`}>
            <strong>
              {message.role === 'user' ? 'You' : 'Phone Fix AI helper'}
            </strong>
            <p style={{ whiteSpace: 'pre-wrap' }}>{message.text}</p>
          </div>
        ))}
        {busy && <p role="status">Thinking…</p>}
      </div>
      <div className="chat-prompts">
        {[
          'What is the bond for?',
          'Why do I pay a service fee?',
          'Is my phone under warranty?',
        ].map((question) => (
          <button
            key={question}
            className="btn btn-outline-dark"
            disabled={busy}
            onClick={() => send(question)}
          >
            {question}
          </button>
        ))}
      </div>
      <form
        className="chat-input"
        onSubmit={(event) => {
          event.preventDefault();
          send(input);
        }}
      >
        <label className="visually-hidden" htmlFor="repair-question">
          Ask a repair question
        </label>
        <input
          id="repair-question"
          className="form-control"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          maxLength={500}
          placeholder="Ask about a repair…"
          disabled={busy}
        />
        <button className="btn btn-dark" disabled={busy || !input.trim()}>
          Send
        </button>
      </form>
      <button className="btn btn-link" onClick={clear}>
        Clear conversation
      </button>
    </section>
  );
}
