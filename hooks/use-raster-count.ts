import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function useRasterCount() {
  const [count, setCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRasterCount() {
      setLoading(true)
      setError(null)
      
      try {
        // Check if sst_data table exists and has data
        const { count: sstCount, error } = await supabase
          .from('sst_data')
          .select('*', { count: 'exact', head: true })

        if (error) {
          // If table doesn't exist or other error, assume 0 raster layers
          setCount(0)
        } else {
          // If sst_data exists and has data, we have 1 raster layer
          setCount(sstCount || 0)
        }
      } catch (err) {
        console.error('Error fetching raster count:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        setCount(0)
      } finally {
        setLoading(false)
      }
    }

    fetchRasterCount()
  }, [])

  return { count, loading, error }
} 