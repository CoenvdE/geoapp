"use client"
// runs in browser, needed for interactive map elements

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { OceanMap } from "@/components/ocean-map"
import { useFungalData, createFungalLayer } from "@/hooks/use-fungal-data"
import { usePersonData, createPersonLayer } from "@/hooks/use-person-data"
import { useHaedatCount } from "@/hooks/use-haedat-count"
import { useRasterCount } from "@/hooks/use-raster-count"

export default function Dashboard() {
  const [peopleLayerEnabled, setPeopleLayerEnabled] = useState(true)
  const { data: fungalData, loading: fungalLoading } = useFungalData()
  const { data: peopleData, loading: peopleLoading } = usePersonData()
  const { count: haedatCount, loading: haedatCountLoading } = useHaedatCount()
  const { count: rasterCount, loading: rasterCountLoading } = useRasterCount()
  const { layer: peopleLayer } = createPersonLayer(peopleLayerEnabled)
  
  const Haedat = haedatCountLoading ? '...' : haedatCount || 0;
  const People = peopleLoading ? '...' : peopleData.length;
  const GBIF_data = fungalLoading ? '...' : fungalData.length;
  const climate_data_layers = rasterCountLoading ? '...' : rasterCount || 0;

  // Simplify this since the layer is already null when disabled
  const activeLayers = peopleLayer ? [peopleLayer] : []

  return (
    <>
      {/* Main Content */}
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        </div>
        
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Number of Climate Data Layers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{climate_data_layers}</div>
              <p className="text-xs text-muted-foreground">
                Total number of climate data layers in the database
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Number of People
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{People}</div>
              <p className="text-xs text-muted-foreground">
                Total number of people in the database
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Number of Haedat events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Haedat}</div>
              <p className="text-xs text-muted-foreground">
                Total number of Haedat events in the database
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Number of GBIF Data Points
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{GBIF_data}</div>
              <p className="text-xs text-muted-foreground">
                Total number of GBIF data points in the database
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 h-full w-full">
          <Card className="col-span-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle></CardTitle>
                  <CardDescription>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="relative">
                <OceanMap 
                  className="h-[80vh] rounded-md"
                  layers={activeLayers}
                  title="Ocean Map"
                />  
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
