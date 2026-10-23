export function downloadUrl(provider: string, href: string): string {
  if (provider !== 'nexus') return href;
  const target = new URL(href);
  if (['www.nexusmods.com', 'nexusmods.com'].includes(target.hostname)) target.searchParams.set('tab', 'files');
  return target.href;
}
