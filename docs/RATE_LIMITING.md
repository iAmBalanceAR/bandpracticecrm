# Supabase Rate Limiting Guide

This document provides information about Supabase rate limits and how to handle them in your application.

## Understanding Supabase Rate Limits

Supabase implements rate limiting to prevent abuse and ensure fair usage of their services. Rate limits apply to various endpoints, with authentication endpoints having stricter limits.

### Common Rate Limit Scenarios

1. **Authentication Requests**: Frequent login attempts, token refreshes, or session checks
2. **Database Queries**: Executing too many queries in a short period
3. **Storage Operations**: Uploading or downloading too many files quickly

### Rate Limit Reset Times

- **Standard API Rate Limits**: Reset after 60 seconds
- **Authentication Rate Limits**: Reset after 5-15 minutes
- **Project-Wide Rate Limits**: Reset after 1 hour (especially for free/hobby tier)

## Preventing Rate Limits

### 1. Implement Debouncing

We've added a 30-second cooldown between auth checks in our application:

```typescript
const AUTH_CHECK_COOLDOWN = 30000; // 30 seconds between checks
let lastAuthCheck = 0;

// Don't check more than once per cooldown period
const now = Date.now();
if (now - lastAuthCheck < AUTH_CHECK_COOLDOWN) {
  console.log(`Skipping auth check - last check was ${Math.round((now - lastAuthCheck) / 1000)}s ago`);
  return;
}
```

### 2. Implement Proper Error Handling

Handle rate limit errors (429 status code) gracefully:

```typescript
if (error.status === 429) {
  console.warn('Rate limit hit during auth check. Will retry later.');
  // Don't update state on rate limit, just wait for next attempt
  return;
}
```

### 3. Use Caching

Cache authentication results to reduce the need for frequent checks:

```typescript
// Store successful auth results in memory
const authCache = {
  user: null,
  session: null,
  timestamp: 0,
  TTL: 5 * 60 * 1000 // 5 minutes
};

// Use cached results if available and not expired
const now = Date.now();
if (authCache.timestamp > 0 && now - authCache.timestamp < authCache.TTL) {
  return authCache;
}
```

### 4. Monitor Request Frequency

We've added a request monitor to track Supabase requests:

- The `AuthDebugger` component shows total requests and requests in the last minute
- Use this to identify potential issues before hitting rate limits

## Recovering from Rate Limits

If you hit a rate limit:

1. **Clear Local Storage and Cookies**: Use the Auth Debug button or manually clear browser storage
2. **Wait for Reset**: Wait at least 15 minutes before trying again
3. **Use a Different IP**: If possible, switch to a different network
4. **Restart Development Server**: Sometimes a clean restart helps

## Development Tools

### Auth Debugger

The `AuthDebugger` component provides:

- Current auth state information
- Request monitoring
- A button to clear auth state

### Rate Limit Reset Script

Run the reset script to check rate limit status and get recovery instructions:

```bash
node scripts/reset-rate-limit.js
```

## Production Considerations

Rate limits are less likely to be an issue in production because:

1. Users are distributed across different IP addresses
2. Individual users make fewer requests than developers testing features
3. Production code typically has better error handling and retry logic

However, it's still important to implement proper rate limit handling in production code to ensure a good user experience.

## Additional Resources

- [Supabase Rate Limits Documentation](https://supabase.com/docs/guides/api/api-rate-limits)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
  