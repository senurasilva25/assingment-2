import { createClient } from '@supabase/supabase-js';

const runtime = window.APP_CONFIG ?? {};
const url = import.meta.env.VITE_SUPABASE_URL || runtime.supabaseUrl;
const key =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || runtime.supabaseKey;

export const business = {
  companyName: 'Phone Fix',
  phone: 'Not configured',
  email: 'Not configured',
  physicalAddress: 'Not configured',
  businessCard: 'Not configured',
  ...runtime.business,
};

function initializeClient() {
  if (!url || !key)
    return {
      client: null,
      error:
        'Database setup required: configure Supabase in public/config.js or .env.local and run supabase.sql.',
    };
  try {
    const parsedUrl = new URL(url);
    if (
      !['https:', 'http:'].includes(parsedUrl.protocol) ||
      parsedUrl.username ||
      parsedUrl.password
    ) {
      throw new Error(
        'Use the public Supabase HTTPS project URL here. Keep PostgreSQL credentials in DATABASE_URL.',
      );
    }
    if (key.startsWith('sb_secret_')) {
      throw new Error(
        'Use a publishable key, not a secret key, in browser configuration.',
      );
    }
    return { client: createClient(url, key), error: '' };
  } catch (error) {
    return {
      client: null,
      error: `Database configuration is invalid: ${error.message}`,
    };
  }
}

export const { client: supabase, error: configurationError } =
  initializeClient();
