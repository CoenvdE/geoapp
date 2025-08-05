import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function useHaedatCount() {
  const [count, setCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCount() {
      setLoading(true)
      setError(null)
      
      try {
        const { count: totalCount, error } = await supabase
          .from('haedat_events')
          .select('*', { count: 'exact', head: true })

        if (error) {
          throw error
        }

        setCount(totalCount)
      } catch (err) {
        console.error('Error fetching HAEDAT count:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchCount()
  }, [])

  return { count, loading, error }
} 