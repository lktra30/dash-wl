/**
 * Simple in-memory cache for API responses
 * Helps reduce unnecessary API calls during navigation
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresIn: number // milliseconds
}

class ApiCache {
  private cache = new Map<string, CacheEntry<any>>()
  private defaultTTL = 2 * 60 * 1000 // 2 minutes default

  /**
   * Get cached data if it exists and hasn't expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) return null
    
    const now = Date.now()
    const age = now - entry.timestamp
    
    if (age > entry.expiresIn) {
      // Cache expired, remove it
      this.cache.delete(key)
      return null
    }
    
    return entry.data as T
  }

  /**
   * Set cache data with optional TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn: ttl || this.defaultTTL,
    })
  }

  /**
   * Check if cache has valid entry
   */
  has(key: string): boolean {
    return this.get(key) !== null
  }

  /**
   * Clear specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Clear all cache entries matching a pattern
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern)
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache stats for debugging
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }
}

// Singleton instance
export const apiCache = new ApiCache()

/**
 * Helper function to fetch with cache
 */
export async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: {
    ttl?: number
    forceRefresh?: boolean
  }
): Promise<T> {
  const { ttl, forceRefresh = false } = options || {}

  // Check cache first unless force refresh
  if (!forceRefresh) {
    const cached = apiCache.get<T>(key)
    if (cached !== null) {
      return cached
    }
  }

  
  // Fetch fresh data
  const data = await fetcher()
  
  // Store in cache
  apiCache.set(key, data, ttl)
  
  return data
}
