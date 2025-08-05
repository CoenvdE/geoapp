import { useState, useEffect } from 'react'
import { ScatterplotLayer } from '@deck.gl/layers'
import { supabase } from '@/lib/supabase'

interface Bounds {
  minLat: number
  minLng: number
  maxLat: number
  maxLng: number
}

interface HaedatEvent {
  id: number
  event_name: string
  latitude: number
  longitude: number
  severity_level: 'critical' | 'high' | 'medium' | 'low'
  effects: string[]
  affected_organisms: string[]
  causative_species_name?: string
  location_text?: string
  event_year?: number
}

export function useHaedatData(enabled: boolean = true, bounds?: Bounds) {
  const [data, setData] = useState<HaedatEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) {
      setData([])
      return
    }

    async function fetchData() {
      setLoading(true)
      setError(null)
      
      try {
        // For now, query the main table directly since view might not exist yet
        const query = await supabase
          .from('haedat_events')
          .select(`
            id,
            event_name,
            latitude,
            longitude,
            causative_species_name,
            location_text,
            event_year,
            water_discoloration,
            high_phyto,
            seafood_toxin,
            mass_mortal,
            toxicity_detected,
            humans_affected,
            fish_affected,
            shellfish_affected,
            birds_affected
          `)
          .not('latitude', 'is', null)
          .not('longitude', 'is', null)
          .limit(1000)

        if (query.error) {
          throw query.error
        }

        // Process the data to add severity levels and clean invalid coordinates
        const processedData = (query.data || [])
          .filter(item => {
            // Strict validation - ensure coordinates are valid numbers
            const lat = Number(item.latitude)
            const lng = Number(item.longitude)
            return !isNaN(lat) && !isNaN(lng) && 
                   lat >= -90 && lat <= 90 && 
                   lng >= -180 && lng <= 180
          })
          .map(item => {
            // Calculate severity level
            let severity_level: 'critical' | 'high' | 'medium' | 'low' = 'low'
            
            if (item.toxicity_detected && item.humans_affected) {
              severity_level = 'critical'
            } else if (item.toxicity_detected && (item.seafood_toxin || item.shellfish_affected)) {
              severity_level = 'high'
            } else if (item.mass_mortal || (item.water_discoloration && item.high_phyto)) {
              severity_level = 'medium'
            }

            // Build effects array
            const effects: string[] = []
            if (item.water_discoloration) effects.push('Water Discoloration')
            if (item.high_phyto) effects.push('High Phytoplankton')
            if (item.seafood_toxin) effects.push('Seafood Toxin')
            if (item.mass_mortal) effects.push('Mass Mortality')
            if (item.toxicity_detected) effects.push('Toxicity Detected')

            // Build affected organisms array
            const affected_organisms: string[] = []
            if (item.humans_affected) affected_organisms.push('Humans')
            if (item.fish_affected) affected_organisms.push('Fish')
            if (item.shellfish_affected) affected_organisms.push('Shellfish')
            if (item.birds_affected) affected_organisms.push('Birds')

            return {
              id: item.id,
              event_name: item.event_name || 'Unknown Event',
              latitude: Number(item.latitude),
              longitude: Number(item.longitude),
              severity_level,
              effects,
              affected_organisms,
              causative_species_name: item.causative_species_name,
              location_text: item.location_text,
              event_year: item.event_year
            }
          })

        console.log(`Loaded ${processedData.length} valid HAEDAT events`)
        setData(processedData)
      } catch (err) {
        console.error('Error fetching HAEDAT data:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        setData([]) // Clear data on error
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [enabled, bounds])

  return { data, loading, error }
}

export function createHaedatLayer(enabled: boolean, bounds?: Bounds) {
  const { data, loading, error } = useHaedatData(enabled, bounds)

  // More defensive checks
  if (!enabled || loading || error || !data || !Array.isArray(data) || data.length === 0) {
    return { layer: null, data: data || [], loading, error }
  }

  // Additional data validation before creating layer
  const validData = data.filter(d => {
    if (!d || typeof d !== 'object') return false
    
    const lat = Number(d.latitude)
    const lng = Number(d.longitude)
    return !isNaN(lat) && !isNaN(lng) && 
           lat >= -90 && lat <= 90 && 
           lng >= -180 && lng <= 180
  })

  if (validData.length === 0) {
    console.warn('No valid HAEDAT data for layer creation')
    return { layer: null, data: [], loading, error: 'No valid coordinate data' }
  }

  // Color mapping based on severity
  const getColor = (severity: string): [number, number, number, number] => {
    switch (severity) {
      case 'critical': return [220, 20, 60, 200]    // Red
      case 'high': return [255, 140, 0, 200]       // Orange  
      case 'medium': return [255, 215, 0, 200]     // Yellow
      case 'low': return [50, 205, 50, 200]        // Green
      default: return [128, 128, 128, 200]         // Gray
    }
  }

  try {
    const layer = new ScatterplotLayer({
      id: 'haedat-events',
      data: validData,
      pickable: true,
      opacity: 0.8,
      stroked: true,
      filled: true,
      radiusScale: 6,
      radiusMinPixels: 3,
      radiusMaxPixels: 15,
      lineWidthMinPixels: 1,
      getPosition: (d: HaedatEvent): [number, number] => {
        if (!d || typeof d !== 'object') {
          console.warn('Invalid HAEDAT data object:', d)
          return [0, 0] // Fallback position
        }
        
        const lng = Number(d.longitude)
        const lat = Number(d.latitude)
        
        // Final validation
        if (isNaN(lng) || isNaN(lat)) {
          console.warn('Invalid position for event:', d.event_name, [lng, lat])
          return [0, 0] // Fallback to avoid crash
        }
        
        return [lng, lat]
      },
      getRadius: (d: HaedatEvent) => {
        // Size based on severity
        switch (d.severity_level) {
          case 'critical': return 8
          case 'high': return 6
          case 'medium': return 4
          default: return 3
        }
      },
      getFillColor: (d: HaedatEvent) => getColor(d.severity_level),
      getLineColor: [255, 255, 255, 100]
    })

    return { layer, data: validData, loading, error }
  } catch (layerError) {
    console.error('Error creating HAEDAT layer:', layerError)
    return { layer: null, data: validData, loading, error: 'Failed to create layer' }
  }
} 