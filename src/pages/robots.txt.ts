import type { APIRoute } from 'astro';
import { url } from '../lib/mods';
export const GET: APIRoute = ({ site }) => new Response(`User-agent: *\nAllow: /\n${site ? `Sitemap: ${new URL(url('sitemap.xml'), site).href}\n` : ''}`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
