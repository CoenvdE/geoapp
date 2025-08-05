import { useState, useEffect, useMemo } from 'react'
import { ScatterplotLayer } from '@deck.gl/layers'
import { supabase, FungalObservation } from '@/lib/supabase'

export function useFungalData() {
  const [data, setData] = useState<FungalObservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchFungalData() {
      try {
        setLoading(true)
        setError(null)

        const { data: observations, error: fetchError } = await supabase
          .from('gbif_fungal_observations')
          .select('*')
          .not('decimal_latitude', 'is', null)
          .not('decimal_longitude', 'is', null)
          .order('created_at', { ascending: false })

        if (fetchError) {
          throw fetchError
        }

        setData(observations || [])
      } catch (err) {
        console.error('Error fetching fungal data:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch data')
      } finally {
        setLoading(false)
      }
    }

    fetchFungalData()
  }, [])

  return { data, loading, error, refetch: () => setLoading(true) }
}

// Hook to create the fungal layer
export function createFungalLayer(visible = true) {
  const { data, loading, error } = useFungalData()

  const layer = useMemo(() => {
    // More robust checks to prevent deck.gl assertion errors
    if (loading || error || !data || !Array.isArray(data) || data.length === 0 || !visible) {
      return null
    }

    // Validate that data has required fields and filter out invalid entries
    const validData = data.filter(d => {
      if (!d || typeof d !== 'object') return false
      
      // Convert to numbers and validate
      const lat = Number(d.decimal_latitude)
      const lng = Number(d.decimal_longitude)
      
      return (
        !isNaN(lat) && 
        !isNaN(lng) &&
        lat >= -90 && lat <= 90 &&
        lng >= -180 && lng <= 180
      )
    })

    if (validData.length === 0) {
      console.warn('No valid fungal data points found')
      return null
    }

    console.log(`Creating fungal layer with ${validData.length} valid data points`)

    try {
      return new ScatterplotLayer({
        id: `fungal-observations-${Date.now()}`,
        data: validData,
        pickable: true,
        opacity: 0.8,
        stroked: true,
        filled: true,
        radiusScale: 100,
        radiusMinPixels: 4,
        radiusMaxPixels: 12,
        lineWidthMinPixels: 1,
        getPosition: (d: any) => {
          // Add additional safety checks
          if (!d || typeof d !== 'object') {
            console.warn('Invalid data object:', d)
            return [0, 0] // Fallback position
          }
          
          const lng = Number(d.decimal_longitude)
          const lat = Number(d.decimal_latitude)
          
          if (isNaN(lng) || isNaN(lat)) {
            console.warn('Invalid position data:', d)
            return [0, 0] // Fallback position
          }
          
          return [lng, lat]
        },
        getRadius: 50,
        getFillColor: (d: any) => {
          try {
            return getSpeciesColor(d?.family || null)
          } catch (err) {
            console.warn('Error getting color for data point:', d, err)
            return [128, 128, 128] // Gray fallback
          }
        },
        getLineColor: [255, 255, 255, 120],
        getLineWidth: 1,
        updateTriggers: {
          getPosition: [validData.length],
          getFillColor: [validData.length]
        }
      })
    } catch (err) {
      console.error('Error creating ScatterplotLayer:', err)
      return null
    }
  }, [data, loading, error, visible])

  return { layer, data, loading, error }
}

// Helper function to get species color based on family
export function getSpeciesColor(family: string | null): [number, number, number] {
  if (!family) return [128, 128, 128] // Gray for unknown

  // Color mapping for different fungal families
  const familyColors: Record<string, [number, number, number]> = {
    'Elaphomycetaceae': [255, 140, 0],    // Orange for truffles
    'Aspergillaceae': [34, 139, 34],      // Forest green for Aspergillus/Penicillium
    'Tricholomataceae': [138, 43, 226],   // Blue violet
    'Agaricaceae': [220, 20, 60],         // Crimson
    'Polyporaceae': [255, 165, 0],        // Orange
    'Russulaceae': [255, 69, 0],          // Red orange
  }

  return familyColors[family] || [100, 149, 237] // Cornflower blue as default
}