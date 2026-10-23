import type { APIRoute } from 'astro';
import { getMods, modUrl, url } from '../lib/mods';
export const GET: APIRoute = async ({ site, url: requestUrl }) => {
  const origin = site || requestUrl.origin;
  const paths = [url(), url('mods/'), ...(await getMods()).map(modUrl)];
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(path => `<url><loc>${new URL(path, origin).href.replaceAll('&', '&amp;')}</loc></url>`).join('')}</urlset>`, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
