export function getURL(): string {
  // Get the site URL from environment variables
  let url =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_VERCEL_URL ??
    'https://app.bandpracticecrm.com'; // Default to production URL instead of localhost
  
  // Ensure URL has proper protocol
  url = url.startsWith('http') ? url : `https://${url}`;
  
  // Remove trailing slashes
  url = url.replace(/\/+$/, '');
  
  return url;
} 