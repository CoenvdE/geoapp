"use client"

import { useState } from "react"
import { OceanMap } from "@/components/ocean-map"
import { createFungalLayer } from "@/hooks/use-fungal-data"
import { createPersonLayer } from "@/hooks/use-person-data"
import { createHaedatLayer } from "@/hooks/use-haedat-data"

export default function OceanMapPage() {
  const [layerStates, setLayerStates] = useState({
    fungal: false,
    people: false,
    haedat: true
  })
  
  const [mapBounds, setMapBounds] = useState<{
    minLat: number, minLng: number, maxLat: number, maxLng: number
  } | undefined>()
  
  const { layer: fungalLayer } = createFungalLayer(layerStates.fungal)
  const { layer: personLayer } = createPersonLayer(layerStates.people)
  const { layer: haedatLayer } = createHaedatLayer(layerStates.haedat, mapBounds)
  
  const handleLayerToggle = (layerId: string, enabled: boolean) => {
    setLayerStates(prev => ({
      ...prev,
      [layerId]: enabled
    }))
  }

  const handleViewportChange = (bounds: { minLat: number, minLng: number, maxLat: number, maxLng: number }) => {
    setMapBounds(bounds)
  }

  const activeLayers = []
  if (fungalLayer) activeLayers.push(fungalLayer)
  if (personLayer) activeLayers.push(personLayer)
  if (haedatLayer) activeLayers.push(haedatLayer)
  
  return (
    <div className="h-screen w-full">
      <div className="h-full w-full p-4">
        <div className="h-full w-full border border-gray-200/50 shadow-sm rounded-lg overflow-hidden">
          <OceanMap 
            className="h-full w-full" 
            layers={activeLayers}
            showLayerControls={true}
            onLayerToggle={handleLayerToggle}
            layerStates={layerStates}
            onViewportChange={handleViewportChange}
          />
        </div>
      </div>
    </div>
  )
}