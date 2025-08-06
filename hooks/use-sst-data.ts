import { useState, useEffect, useMemo } from 'react'
import { HeatmapLayer } from '@deck.gl/aggregation-layers'
import { supabase } from '@/lib/supabase'

interface Bounds {
  minLat: number
  minLng: number
  maxLat: number
  maxLng: number
}

interface SSTPoint {
  id: number
  latitude: number
  longitude: number
  temperature: number
  depth: number
  timestamp: string
}

export function useSSTData(enabled: boolean = true, bounds?: Bounds) {
  const [data, setData] = useState<SSTPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) {
      setData([])
      return
    }
    const handler = setTimeout(() => {
      if (!enabled || loading || !bounds) return
      fetchData()
    }, 500) // debounce: wait 500ms to avoid too many requests

    async function fetchData() {
      setLoading(true)
      setError(null)
      
      try {
        // Query the raster data from Supabase
        const query = await supabase
          .rpc('get_sst_points', {
            bounds_min_lat: bounds?.minLat || 40.0,
            bounds_max_lat: bounds?.maxLat || 65.0,
            bounds_min_lng: bounds?.minLng || -20.0,
            bounds_max_lng: bounds?.maxLng || 13.0,
            band: 1 
          })

        if (query.error) {
          throw query.error
        }

        // Process the data to clean invalid coordinates and temperatures
        const processedData = (query.data || [])
          .filter((item: any) => {
            const lat = Number(item.latitude)
            const lng = Number(item.longitude)
            const temp = Number(item.temperature)
            
            return !isNaN(lat) && !isNaN(lng) && !isNaN(temp) && 
                   lat >= -90 && lat <= 90 && 
                   lng >= -180 && lng <= 180 &&
                   temp > -32768 // Filter out NoData values
          })
          .map((item: any) => ({
            id: item.id,
            latitude: Number(item.latitude),
            longitude: Number(item.longitude),
            temperature: Number(item.temperature),
            depth: Number(item.depth) || 0,
            timestamp: item.timestamp || new Date().toISOString()
          }))

        console.log(`Loaded ${processedData.length} valid SST data points`)
        setData(processedData)
      } catch (err) {
        console.error('Error fetching SST data:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        setData([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [enabled, bounds])

  return { data, loading, error }
}

export function createSSTLayer(enabled: boolean, bounds?: Bounds) {
  const { data, loading, error } = useSSTData(enabled, bounds)

  const layer = useMemo(() => {
    if (!enabled || loading || error || !data || !Array.isArray(data) || data.length === 0) {
      return null
    }

    // Validate data points
    const validData = data.filter(d => {
      if (!d || typeof d !== 'object') return false
      
      const lat = Number(d.latitude)
      const lng = Number(d.longitude)
      const temp = Number(d.temperature)
      
      return !isNaN(lat) && !isNaN(lng) && !isNaN(temp) && 
             lat >= -90 && lat <= 90 && 
             lng >= -180 && lng <= 180 &&
             temp > -32768 // Filter out NoData values
    })

    if (validData.length === 0) {
      console.warn('No valid SST data for layer creation')
      return null
    }

    // Temperature color scale (blue to red)
    const getColor = (temperature: number): [number, number, number, number] => {
      // Normalize temperature to 0-1 range (assuming -2°C to 30°C range)
      const minTemp = -2
      const maxTemp = 30
      const normalized = Math.max(0, Math.min(1, (temperature - minTemp) / (maxTemp - minTemp)))
      
      // Blue (cold) to Red (warm) color scale
      if (normalized < 0.5) {
        // Blue to Cyan
        const t = normalized * 2
        return [0, Math.round(255 * t), Math.round(255 * (1 - t)), 200]
      } else {
        // Cyan to Red
        const t = (normalized - 0.5) * 2
        return [Math.round(255 * t), Math.round(255 * (1 - t)), 0, 200]
      }
    }

    try {
      return new HeatmapLayer({
        id: 'sst-heatmap',
        data: validData,
        pickable: true,
        opacity: 0.8,
        intensity: 1,
        threshold: 0.05,
        radiusPixels: 50,
        getPosition: (d: SSTPoint): [number, number] => {
          if (!d || typeof d !== 'object') {
            console.warn('Invalid SST data object:', d)
            return [0, 0]
          }
          
          const lng = Number(d.longitude)
          const lat = Number(d.latitude)
          
          if (isNaN(lng) || isNaN(lat)) {
            console.warn('Invalid SST position:', d)
            return [0, 0]
          }
          
          return [lng, lat]
        },
        getWeight: (d: SSTPoint) => {
          const temp = Number(d.temperature)
          if (isNaN(temp) || temp <= -32768) return 0
          return Math.max(0, temp + 2) // Ensure positive weight, normalize from -2°C
        },
        colorRange: [
          [0, 0, 255, 200],    // Blue (cold)
          [0, 255, 255, 200],   // Cyan
          [0, 255, 0, 200],     // Green
          [255, 255, 0, 200],   // Yellow
          [255, 165, 0, 200],   // Orange
          [255, 0, 0, 200]      // Red (warm)
        ],
        updateTriggers: {
          getPosition: [validData.length],
          getWeight: [validData.length]
        }
      })
    } catch (layerError) {
      console.error('Error creating SST HeatmapLayer:', layerError)
      return null
    }
  }, [data, loading, error, enabled])

  return { layer, data, loading, error }
} 