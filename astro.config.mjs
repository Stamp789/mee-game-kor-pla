import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  base: process.env.SITE_BASE || '/',
  ...(process.env.SITE_URL ? { site: process.env.SITE_URL } : {}),
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  build: { inlineStylesheets: 'never' },
});
