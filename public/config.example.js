// Copy to config.js for runtime configuration, or use .env.local for Supabase.
// Only public publishable/anon keys belong in browser code.
window.APP_CONFIG = {
  supabaseUrl: '',
  supabaseKey: '',
  business: {
    companyName: 'Phone Fix',
    phone: 'Not configured',
    email: 'Not configured',
    physicalAddress: 'Not configured',
    businessCard: 'Not configured',
  },
};
