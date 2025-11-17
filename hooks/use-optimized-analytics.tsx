import { useState, useEffect, useCallback } from 'react'

/**
 * Optimized Analytics Hook
 * Uses materialized view for instant dashboard metrics
 * 
 * Features:
 * - Instant loading from pre-calculated view
 * - Manual refresh capability
 * - Last update timestamp tracking
 * - Error handling
 * 
 * @example
 * ```tsx
 * const { analytics, isLoading, lastUpdated, refresh } = useOptimizedAnalytics()
 * ```
 */
export function useOptimizedAnalytics() {
  const [analytics, setAnalytics] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const fetchAnalytics = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/dashboard/analytics', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }

      const data = await response.json()
      setAnalytics(data)
      setLastUpdated(data.lastUpdated || new Date().toISOString())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('Error fetching analytics:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refresh = useCallback(async () => {
    try {
      // Trigger materialized view refresh
      const refreshResponse = await fetch('/api/dashboard/analytics/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!refreshResponse.ok) {
        console.warn('Failed to refresh analytics view')
      }

      // Re-fetch analytics
      await fetchAnalytics()
    } catch (err) {
      console.error('Error refreshing analytics:', err)
    }
  }, [fetchAnalytics])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  return {
    analytics,
    isLoading,
    error,
    lastUpdated,
    refresh,
    refetch: fetchAnalytics,
  }
}

/**
 * Pipeline Metrics Hook
 * Uses pipeline_stage_metrics view for pre-aggregated pipeline analytics
 * 
 * @example
 * ```tsx
 * const { metrics, isLoading } = usePipelineMetrics()
 * // Returns: contacts count, avg deal value, conversion rates per stage
 * ```
 */
export function usePipelineMetrics() {
  const [metrics, setMetrics] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/dashboard/analytics/pipeline-metrics', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch pipeline metrics')
      }

      const data = await response.json()
      setMetrics(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('Error fetching pipeline metrics:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  return {
    metrics,
    isLoading,
    error,
    refetch: fetchMetrics,
  }
}

/**
 * Performance Monitor Hook
 * Tracks API response times and provides performance insights
 * 
 * @example
 * ```tsx
 * const { logRequest, getAverageTime, getSlowRequests } = usePerformanceMonitor()
 * 
 * // Log a request
 * const start = performance.now()
 * await fetch('/api/...')
 * logRequest('analytics', performance.now() - start)
 * ```
 */
export function usePerformanceMonitor() {
  const [requests, setRequests] = useState<Map<string, number[]>>(new Map())

  const logRequest = useCallback((endpoint: string, duration: number) => {
    setRequests((prev) => {
      const newMap = new Map(prev)
      const times = newMap.get(endpoint) || []
      times.push(duration)
      // Keep only last 50 requests per endpoint
      if (times.length > 50) times.shift()
      newMap.set(endpoint, times)
      return newMap
    })
  }, [])

  const getAverageTime = useCallback((endpoint: string): number => {
    const times = requests.get(endpoint)
    if (!times || times.length === 0) return 0
    return times.reduce((sum, t) => sum + t, 0) / times.length
  }, [requests])

  const getSlowRequests = useCallback((threshold: number = 1000): string[] => {
    const slow: string[] = []
    requests.forEach((times, endpoint) => {
      const avg = times.reduce((sum, t) => sum + t, 0) / times.length
      if (avg > threshold) {
        slow.push(`${endpoint}: ${avg.toFixed(0)}ms`)
      }
    })
    return slow
  }, [requests])

  const getAllMetrics = useCallback(() => {
    const metrics: Record<string, {avg: number, min: number, max: number, count: number}> = {}
    requests.forEach((times, endpoint) => {
      if (times.length === 0) return
      metrics[endpoint] = {
        avg: times.reduce((sum, t) => sum + t, 0) / times.length,
        min: Math.min(...times),
        max: Math.max(...times),
        count: times.length,
      }
    })
    return metrics
  }, [requests])

  return {
    logRequest,
    getAverageTime,
    getSlowRequests,
    getAllMetrics,
  }
}
