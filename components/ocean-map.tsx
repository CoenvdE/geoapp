"use client"

import { useState, useCallback, useEffect } from 'react'
import DeckGL from '@deck.gl/react'
import { Map } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import { MAP_CONFIG, MAPBOX_TOKEN, MAP_STYLES } from '@/lib/map-config'
import { LayerToggle } from '@/components/layer-toggle'

interface OceanMapProps {
  className?: string
  children?: React.ReactNode
  layers?: any[]
  showLayerControls?: boolean
  onLayerToggle?: (layerId: string, enabled: boolean) => void
  layerStates?: Record<string, boolean>
  onViewportChange?: (bounds: { minLat: number, minLng: number, maxLat: number, maxLng: number }) => void
  title?: string
}

// Enhanced Legend Component
function MapLegend({ visible, layers }: { visible: boolean; layers: any[] }) {
  if (!visible) return null
  
  const hasFungalData = layers.some(layer => layer.id?.includes('fungal'))
  const hasHaedatData = layers.some(layer => layer.id?.includes('haedat'))
  const hasPersonData = layers.some(layer => layer.id?.includes('person'))
  
  return (
    <div className="absolute bottom-4 left-4 z-10 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border max-w-xs">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">🗺️ Map Legend</h3>
      
      {/* Fungal Data Legend */}
      {hasFungalData && (
        <div className="mb-3">
          <h4 className="text-xs font-semibold text-green-700 mb-2">🍄 Fungal Observations</h4>
          <div className="flex items-center gap-2 text-xs mb-1">
            <div className="w-3 h-3 rounded-full bg-green-500 border border-white"></div>
            <span className="text-gray-700">GBIF fungal species data</span>
          </div>
        </div>
      )}
      
      {/* HAEDAT Events Legend */}
      {hasHaedatData && (
        <div className="mb-3">
          <h4 className="text-xs font-semibold text-blue-700 mb-2">🌊 Algal Events (HAEDAT)</h4>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-red-600 border border-white"></div>
              <span className="text-gray-700">Critical - Human health threat</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-orange-500 border border-white"></div>
              <span className="text-gray-700">High - Food safety risk</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-yellow-500 border border-white"></div>
              <span className="text-gray-700">Medium - Environmental impact</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-green-500 border border-white"></div>
              <span className="text-gray-700">Low - Minor/monitoring</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Person Data Legend */}
      {hasPersonData && (
        <div className="mb-3">
          <h4 className="text-xs font-semibold text-purple-700 mb-2">👤 People Data</h4>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-purple-500 border border-white"></div>
            <span className="text-gray-700">Person locations</span>
          </div>
        </div>
      )}
      
      <div className="mt-3 pt-2 border-t border-gray-200 text-xs text-gray-500">
        💡 Click on markers for detailed information
      </div>
    </div>
  )
}

// Map Control Buttons Component
function MapControls({ 
  onResetView, 
  isFullscreen 
}: { 
  onResetView: () => void
  isFullscreen: boolean
}) {
  return (
    <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
      <button
        onClick={onResetView}
        className="bg-white/90 backdrop-blur-sm hover:bg-white/95 p-2 rounded-lg shadow-lg border transition-all duration-200"
        title="Reset to default view"
      >
        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
      
    </div>
  )
}

export function OceanMap({ 
  className = '', 
  children, 
  layers = [], 
  showLayerControls = false,
  onLayerToggle,
  layerStates = {},
  onViewportChange,
  title = "🌍 Interactive Ocean Data Map"
}: OceanMapProps) {
  const [viewState, setViewState] = useState(MAP_CONFIG.initialViewState)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const handleViewStateChange = useCallback(({ viewState: newViewState }: { viewState: any }) => {
    setViewState(newViewState)
    
    // Calculate bounds when viewport changes
    if (onViewportChange) {
      const { longitude, latitude, zoom } = newViewState
      
      // Calculate approximate bounds based on zoom level
      const latRange = 180 / Math.pow(2, zoom)
      const lngRange = 360 / Math.pow(2, zoom)
      
      const bounds = {
        minLat: latitude - latRange / 2,
        maxLat: latitude + latRange / 2,
        minLng: longitude - lngRange / 2,
        maxLng: longitude + lngRange / 2
      }
      
      onViewportChange(bounds)
    }
  }, [onViewportChange])

  const handleResetView = useCallback(() => {
    setViewState(MAP_CONFIG.initialViewState)
  }, [])

  const handleToggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen)
  }, [isFullscreen])

  // Filter out null layers to prevent deck.gl errors
  const validLayers = layers.filter(layer => layer !== null && layer !== undefined)

  return (
    <div className={`relative w-full h-full ${className} ${isFullscreen ? 'fixed inset-0 z-50' : ''}`} style={{ minHeight: '400px' }}>
      {/* Map Title */}
      <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border">
        <h2 className="text-lg font-bold text-gray-800">{title}</h2>
        <p className="text-xs text-gray-600">Interactive geospatial data visualization</p>
      </div>

      {/* Layer Controls Overlay */}
      {showLayerControls && (
        <div className="absolute top-20 left-4 z-10 flex flex-col gap-2">
          <LayerToggle
            label="Fungal Species"
            enabled={layerStates.fungal ?? true}
            onToggle={(enabled) => onLayerToggle?.('fungal', enabled)}
            icon={<span>🍄</span>}
          />
          <LayerToggle
            label="People"
            enabled={layerStates.people ?? true}
            onToggle={(enabled) => onLayerToggle?.('people', enabled)}
            icon={<span>👤</span>}
          />
          <LayerToggle
            label="Algal Events"
            enabled={layerStates.haedat ?? true}
            onToggle={(enabled) => onLayerToggle?.('haedat', enabled)}
            icon={<span>🌊</span>}
          />
        </div>
      )}

      {/* Map Controls */}
      <MapControls 
        onResetView={handleResetView}
        isFullscreen={isFullscreen}
      />

      {/* Enhanced Map Legend */}
      <MapLegend visible={validLayers.length > 0} layers={validLayers} />

      <DeckGL
        viewState={viewState}
        onViewStateChange={handleViewStateChange}
        controller={true}
        layers={validLayers}
        getTooltip={({ object }) => {
          if (object) {
            // Enhanced tooltip for HAEDAT events
            if (object.event_name) {
              const effects = Array.isArray(object.effects) && object.effects.length > 0
                ? object.effects.join(', ')
                : 'None reported'
              const affected = Array.isArray(object.affected_organisms) && object.affected_organisms.length > 0
                ? object.affected_organisms.join(', ')
                : 'None reported'
              const severityColorMap: Record<string, string> = {
                critical: 'text-red-800',
                high: 'text-orange-800',
                medium: 'text-yellow-800',
                low: 'text-green-800'
              }
              const severityColor: string = severityColorMap[object.severity_level as keyof typeof severityColorMap] || 'text-gray-800'

              return {
                html: `
                  <div class="bg-white p-3 rounded-lg shadow-lg border max-w-xs">
                    <div class="font-bold ${severityColor} text-sm mb-1">🌊 ${object.event_name}</div>
                    <div class="text-xs text-gray-600 mb-1">${object.causative_species_name || 'Unknown species'}</div>
                    <div class="text-xs text-gray-500 mb-1">📍 ${object.location_text}</div>
                    <div class="text-xs text-gray-500 mb-1">📅 ${object.event_year}</div>
                    <div class="text-xs text-gray-500 mb-1">⚠️ Severity: <span class="${severityColor}">${object.severity_level.toUpperCase()}</span></div>
                    <div class="text-xs text-gray-500 mb-1">Effects: ${effects}</div>
                    <div class="text-xs text-gray-500">Affected: ${affected}</div>
                  </div>
                `,
                style: {
                  backgroundColor: 'transparent',
                  fontSize: '0.8em'
                }
              }
            }
            
            // Tooltip for person information
            if (object.first_name && object.last_name) {
              const location = `${object.latitude?.toFixed(4)}, ${object.longitude?.toFixed(4)}`
              const date = object.created_at ? new Date(object.created_at).toLocaleDateString() : 'Unknown date'
              
              return {
                html: `
                  <div class="bg-white p-3 rounded-lg shadow-lg border max-w-xs">
                    <div class="font-bold text-blue-800 text-sm mb-1">👤 ${object.first_name} ${object.last_name}</div>
                    <div class="text-xs text-gray-500 mb-1">📍 ${location}</div>
                    <div class="text-xs text-gray-500">📅 Added: ${date}</div>
                  </div>
                `,
                style: {
                  backgroundColor: 'transparent',
                  fontSize: '0.8em'
                }
              }
            }
            
            // Enhanced tooltip for fungal observations
            if (object.scientific_name) {
              const species = object.species || 'Unknown species'
              const family = object.family || 'Unknown family'
              const location = `${object.decimal_latitude?.toFixed(4)}, ${object.decimal_longitude?.toFixed(4)}`
              const date = object.event_date ? new Date(object.event_date).toLocaleDateString() : 'Unknown date'
              
              return {
                html: `
                  <div class="bg-white p-3 rounded-lg shadow-lg border max-w-xs">
                    <div class="font-bold text-green-800 text-sm mb-1">🍄 ${species}</div>
                    <div class="text-xs text-gray-600 mb-1"><em>${object.scientific_name}</em></div>
                    <div class="text-xs text-gray-500 mb-1">Family: ${family}</div>
                    <div class="text-xs text-gray-500 mb-1">📍 ${location}</div>
                    <div class="text-xs text-gray-500">📅 ${date}</div>
                  </div>
                `,
                style: {
                  backgroundColor: 'transparent',
                  fontSize: '0.8em'
                }
              }
            }
            
            // Fallback for other objects
            return {
              html: `<div class="bg-white p-2 rounded shadow">${object.name || 'Unknown'}</div>`,
              style: {
                backgroundColor: 'white',
                fontSize: '0.8em'
              }
            }
          }
          return null
        }}
      >
        <Map
          mapboxAccessToken={MAPBOX_TOKEN}
          mapStyle={MAP_STYLES.dark}  
          attributionControl={false}
          reuseMaps
        />
        {children}
      </DeckGL>
    </div>
  )
}