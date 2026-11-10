# Advanced JavaScript — Phone Fix extension

Open `extension.html` using `npm run dev`, or click **Extension**. The page follows the reference's dark header/footer, blue demo buttons with yellow active state, and peach content area.

## Statement container

**My statement** is a hard-coded paragraph in a styled card. Edit the paragraph in `src/pages/ExtensionPage.jsx` to replace it with your own reflection. It has no input controls or browser storage.

## Demo 1 — Booking dashboard

`src/components/extension/JobDashboard.jsx` adds keyword search, consumer/business filtering, and sorting by appointment date, invoice date, name or total. It uses `useDeferredValue` for responsive input, `useMemo` for derived results, and immutable `filter`, `every`, and `sort` operations. Expand any result for the complete invoice.

Selecting **Live Supabase bookings** uses the existing asynchronous `useBookings` hook and employee authentication. Request IDs discard stale responses; effect cleanup unsubscribes auth listeners. Existing row-level security protects the live records. Filtering happens locally after retrieval.

## Demo 2 — Repair calendar

`RepairCalendar.jsx` uses JavaScript Date arithmetic to generate a Monday-first six-week calendar, including leap years and year boundaries. A memoised `reduce` indexes jobs by repair date. Previous/next month, Today, job counts and a selected-day agenda are controlled by React state. Appointment times display AM/PM. Dates are accessible keyboard-operable buttons.

## Demo 3 — Dynamic statistics

`RepairCharts.jsx` aggregates bookings using higher-order array functions and renders SVG bars, labels and tooltips from the results. Choose phone make, fault category or customer type. Bars scale to the largest count; an accessible table includes counts and percentages. Summary cards calculate jobs, business customers and quoted totals including GST. Empty datasets are supported. Totals include bonds and are not labelled as revenue.

## Demo 4 — Native drag-and-drop courtesy selector

`CourtesyDragDrop.jsx` uses `dragstart`, `dragover`, `drop` and `DataTransfer` with a custom data type. IDs are validated against the catalogue before immutable state updates. Selection allows one phone and one charger with replacement/removal, clear selection and consumer/business bond calculations. Equivalent Add/Remove buttons support touch and keyboard users. This standalone demonstration does not submit or change a booking.

## Demo 5 — FAQ chat assistant

`RepairAIChat.jsx` uses the Fetch API and AbortController to call a server-side Gemini proxy. `server/chat.mjs` keeps the API key private, validates requests, supplies the FAQ JSON as context and handles timeouts, provider errors and quotas. React state holds recent conversation history; Clear conversation cancels pending work. This is a generative AI assistant with no access to private booking records. See `CHATBOT_SETUP.md` for the API-key placeholder, free-tier limits and production server instructions.

## Sample and live data

The first three demos share a data-source selector. Initially they show eight explicitly labelled fictional jobs in the current month. These rows are never written to Supabase. Live mode requires an authorized employee and never substitutes sample records for missing data or failed requests. No database migration is needed.

## Checks

Run `npm test`, `npm run test:e2e` (Chrome required), `npm run lint`, `npm run format:check` and `npm run build`. Tests cover pure transformations, calendar boundaries, the Gemini proxy, all five browser demos, statement display, mobile layout and the original booking workflow. Browser mocks test UI integration; live bookings require an employee account and real AI replies require a Gemini API key.
