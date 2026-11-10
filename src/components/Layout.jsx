export default function Layout({
  children,
  isFaq = false,
  isExtension = false,
}) {
  if (isFaq) {
    return (
      <div className="site-shell faq-shell">
        <header className="faq-header">
          <h1>Phone Fix Phone Booking FAQs</h1>
        </header>
        <main>{children}</main>
        <footer className="faq-footer">
          Advanced Web Design, Copyright © {new Date().getFullYear()}
        </footer>
      </div>
    );
  }
  return (
    <div className={`site-shell${isExtension ? ' extension-shell' : ''}`}>
      <header className="site-header">
        <a className="brand" href="index.html">
          <span className="brand-icon" aria-hidden="true">
            ▯
          </span>
          <span>
            {isExtension ? 'JavaScript Extension' : 'Phone Fix'}
            <span className="brand-caption">BOOKING SYSTEM</span>
          </span>
        </a>
        <nav aria-label="Main navigation">
          <a
            className={!isExtension ? 'active' : undefined}
            aria-current={!isExtension ? 'page' : undefined}
            href="index.html"
          >
            Home
          </a>
          <a
            href="extension.html"
            className={isExtension ? 'active' : undefined}
            aria-current={isExtension ? 'page' : undefined}
          >
            Extension
          </a>
          <a href="index.html#bookings">Bookings</a>
          <a
            className={isFaq ? 'active' : undefined}
            aria-current={isFaq ? 'page' : undefined}
            href="faq.html"
            target={isFaq ? undefined : '_blank'}
            rel="noopener"
          >
            FAQs ↗
          </a>
        </nav>
      </header>
      <main>{children}</main>
      <footer>
        <span>Phone Fix Booking System</span>
        <span>Care for your phone. Get on with your day.</span>
      </footer>
    </div>
  );
}
