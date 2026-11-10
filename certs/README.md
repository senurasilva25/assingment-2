# Supabase database certificate

`supabase-ca.crt` is the public Supabase Root 2021 CA certificate, downloaded over HTTPS from:

https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt

This download URL is specified by Supabase's [dashboard configuration](https://github.com/supabase/supabase/blob/master/apps/studio/hooks/custom-content/custom-content.json) under `ssl:certificate_url` with environment `prod`.

The Node.js database setup/check scripts use it for certificate and hostname verification. It contains no private key or project credentials. To use a replacement certificate downloaded from your project's Database settings, set `DATABASE_SSL_CA_PATH` in `.env` to its local path.
