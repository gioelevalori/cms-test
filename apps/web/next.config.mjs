import { ADMIN_ORIGINS } from './lib/admin-origins.mjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@cms/shared'],
  async headers() {
    // La pagina in modifica si apre solo dentro il pannello.
    return [{ source: '/:site/modifica', headers: [{ key: 'Content-Security-Policy', value: `frame-ancestors 'self' ${ADMIN_ORIGINS.join(' ')}` }] }];
  },
};
export default nextConfig;
