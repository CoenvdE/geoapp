export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

// North Atlantic region initial view
export const MAP_CONFIG = {
  initialViewState: {
    longitude: -4.389, // Center of your coordinate range
    latitude: 52.534,  // Center of your coordinate range
    zoom: 4,
    pitch: 0,
    bearing: 0
  },
  controller: true,
  attributionControl: false
};

// Data bounds for North Atlantic region
export const DATA_BOUNDS = {
  north: 64.334549,
  south: 40.733372,
  east: 9.999700,
  west: -18.777790
};

export type MapStyle = 'positron' | 'dark' | 'outdoors' | 'satellite' | 'marine' | 'nautical' | 'bathymetry';

export const MAP_STYLES: Record<MapStyle, string> = {
  positron: 'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json',
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json',
  outdoors: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  satellite: 'https://basemaps.cartocdn.com/gl/voyager-nolabels-gl-style/style.json',
  marine: 'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json', // Clean for ocean data
  nautical: 'https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json', // Dark for contrast
  bathymetry: 'mapbox://styles/mapbox-public/ckngin2db09as17p84ejhe24y', // Dedicated bathymetry style
}; 