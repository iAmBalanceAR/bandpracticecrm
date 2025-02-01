export function getURL(): string {
  // Force localhost for testing
  return 'http://localhost:3000';
  
  // Comment out the original logic
  /*
  let url =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_VERCEL_URL ??
    'http://localhost:3000';
  url = url.startsWith('http') ? url : `https://${url}`;
  url = url.replace(/\/+$/, '');
  return url;
  */
} 