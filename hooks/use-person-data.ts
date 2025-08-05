import { useState, useEffect, useMemo } from 'react'
import { ScatterplotLayer } from '@deck.gl/layers'
import { supabase, PersonInformation } from '@/lib/supabase'

export function usePersonData() {
  const [data, setData] = useState<PersonInformation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPersonData() {
      try {
        setLoading(true)
        setError(null)

        const { data: people, error: fetchError } = await supabase
          .from('person_information')
          .select('*')
          .not('latitude', 'is', null)
          .not('longitude', 'is', null)
          .order('created_at', { ascending: false })

        if (fetchError) {
          throw fetchError
        }

        setData(people || [])
      } catch (err) {
        console.error('Error fetching person data:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch data')
      } finally {
        setLoading(false)
      }
    }

    fetchPersonData()
  }, [])

  return { data, loading, error, refetch: () => setLoading(true) }
}

// Hook to create the person layer
export function createPersonLayer(visible = true) {
  const { data, loading, error } = usePersonData()

  const layer = useMemo(() => {
    if (loading || error || !data || !Array.isArray(data) || data.length === 0 || !visible) {
      return null
    }

    // Validate that data has required fields and convert to numbers
    const validData = data.filter(d => {
      if (!d || typeof d !== 'object') return false
      
      const lat = Number(d.latitude)
      const lng = Number(d.longitude)
      
      return (
        !isNaN(lat) && 
        !isNaN(lng) &&
        lat >= -90 && lat <= 90 &&
        lng >= -180 && lng <= 180
      )
    })

    if (validData.length === 0) {
      console.warn('No valid person data points found')
      return null
    }

    try {
      return new ScatterplotLayer({
        id: `person-information-${Date.now()}`,
        data: validData,
        pickable: true,
        opacity: 0.8,
        stroked: true,
        filled: true,
        radiusScale: 100,
        radiusMinPixels: 6,
        radiusMaxPixels: 15,
        lineWidthMinPixels: 2,
        getPosition: (d: any) => {
          // Add safety checks
          if (!d || typeof d !== 'object') {
            console.warn('Invalid person data object:', d)
            return [0, 0] // Fallback position
          }
          
          const lng = Number(d.longitude)
          const lat = Number(d.latitude)
          
          if (isNaN(lng) || isNaN(lat)) {
            console.warn('Invalid person position data:', d)
            return [0, 0] // Fallback position
          }
          
          return [lng, lat]
        },
        getRadius: 60,
        getFillColor: [255, 99, 132], // Pink/red color for people
        getLineColor: [255, 255, 255, 150], // White outline
        getLineWidth: 2,
      })
    } catch (err) {
      console.error('Error creating person ScatterplotLayer:', err)
      return null
    }
  }, [data, loading, error, visible])

  return { layer, data, loading, error }
} 