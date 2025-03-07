/**
 * Development-only utility to monitor Supabase requests
 * This helps track request frequency and prevent rate limiting
 */

// Store request history with timestamps
interface RequestRecord {
  url: string;
  method: string;
  timestamp: number;
}

class RequestMonitor {
  private static instance: RequestMonitor | null = null;
  private requests: RequestRecord[] = [];
  private listeners: Array<() => void> = [];

  private constructor() {
    // Private constructor for singleton
    console.log('Request monitor initialized');
  }

  public static getInstance(): RequestMonitor {
    if (!RequestMonitor.instance) {
      RequestMonitor.instance = new RequestMonitor();
    }
    return RequestMonitor.instance;
  }

  /**
   * Record a new request
   */
  public recordRequest(url: string, method: string): void {
    this.requests.push({
      url,
      method,
      timestamp: Date.now()
    });
    
    // Notify listeners
    this.listeners.forEach(listener => listener());
    
    // Clean up old requests (older than 5 minutes)
    this.cleanupOldRequests();
  }

  /**
   * Get all requests in the last X milliseconds
   */
  public getRecentRequests(timeWindowMs: number = 60000): RequestRecord[] {
    const now = Date.now();
    return this.requests.filter(req => now - req.timestamp < timeWindowMs);
  }

  /**
   * Get total request count
   */
  public getTotalCount(): number {
    return this.requests.length;
  }

  /**
   * Get count of requests in the last X milliseconds
   */
  public getRecentCount(timeWindowMs: number = 60000): number {
    return this.getRecentRequests(timeWindowMs).length;
  }

  /**
   * Subscribe to request updates
   */
  public subscribe(callback: () => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  /**
   * Clean up old requests to prevent memory leaks
   */
  private cleanupOldRequests(): void {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    this.requests = this.requests.filter(req => req.timestamp >= fiveMinutesAgo);
  }
}

// Create a type-safe export
let requestMonitor: RequestMonitor | null = null;

// Only initialize in browser environment and development mode
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  try {
    requestMonitor = RequestMonitor.getInstance();
  } catch (error) {
    console.error('Failed to initialize request monitor:', error);
  }
}

export default requestMonitor; 