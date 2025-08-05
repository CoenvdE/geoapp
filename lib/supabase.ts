import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Type definitions for our fungal observation data
export interface FungalObservation {
  id: number
  scientific_name: string | null
  species: string | null
  genus: string | null
  family: string | null
  order: string | null
  decimal_latitude: number
  decimal_longitude: number
  year: number | null
  month: number | null
  day: number | null
  event_date: string | null
  created_at: string
}

// Type definitions for person information
export interface PersonInformation {
  id: number
  first_name: string
  last_name: string
  latitude: number
  longitude: number
  created_at: string
}

// Type definitions for HAEDAT event data
export interface HaedatEvent {
  id: number
  index_original?: number
  event_name?: string
  
  // Coordinates
  original_latitude?: number
  original_longitude?: number
  latitude?: number
  longitude?: number
  location_point?: string // PostGIS geography as string
  
  // Location
  country_name?: string
  region?: string
  location_text?: string
  additional_location_info?: string
  location?: any // JSONB
  location_match_type?: string
  location_result_type?: string
  
  // Dates
  event_year?: number
  event_date?: string
  initial_date?: string
  final_date?: string
  days?: number
  months?: number
  occurred_before?: number
  occurred_before_text?: string
  quarantine_start_date?: string
  quarantine_end_date?: string
  additional_date_info?: string
  
  // Effects
  water_discoloration?: boolean
  high_phyto?: boolean
  seafood_toxin?: boolean
  mass_mortal?: boolean
  foam_mucil?: boolean
  other_effect?: boolean
  other_effect_text?: string
  effects_comments?: string
  
  // Affected organisms
  humans_affected?: boolean
  fish_affected?: boolean
  natural_fish_affected?: boolean
  aquaculture_fish_affected?: boolean
  planktonic_affected?: boolean
  benthic_affected?: boolean
  shellfish_affected?: boolean
  birds_affected?: boolean
  other_terrestrial_affected?: boolean
  aquatic_mammals_affected?: boolean
  seaweed_affected?: boolean
  freshwater?: boolean
  
  // Causative information
  causative_known?: boolean
  causative_species_name_0?: string
  cells_per_litre_0?: string
  comments_0?: string
  
  // Toxicity
  toxicity_detected?: boolean
  toxicity_range?: string
  toxin_type?: string
  toxin?: string
  concentration?: string
  
  // Metadata
  active?: boolean
  created_at: string
  updated_at?: string
  checked_at?: string
}
