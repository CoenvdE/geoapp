import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables from .env.local
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing environment variables. Make sure .env.local has:')
  console.error('NEXT_PUBLIC_SUPABASE_URL=your_url')
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current.trim())
  return result
}

function parseDate(dateStr: string): string | null {
  if (!dateStr || dateStr.trim() === '') return null
  
  try {
    // Handle 2-digit years like "88-06-15"
    if (dateStr.match(/^\d{2}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateStr.split('-')
      // Assume years 00-30 are 2000s, 31-99 are 1900s
      const fullYear = parseInt(year) <= 30 ? `20${year}` : `19${year}`
      return `${fullYear}-${month}-${day}`
    }
    
    // Handle other date formats
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return null
    
    return date.toISOString().split('T')[0] // Return YYYY-MM-DD format
  } catch {
    return null
  }
}

async function uploadHaedatEssentialData() {
  try {
    // Read the essential CSV file
    const csvPath = path.join(process.cwd(), 'Haedat_essential.csv')
    const csvContent = fs.readFileSync(csvPath, 'utf-8')
    const lines = csvContent.split('\n')
    const headers = parseCSVLine(lines[0])
    
    console.log(`📊 Processing ${lines.length - 1} records...`)
    console.log(`📋 Headers: ${headers.join(', ')}`)
    
    // Parse CSV data
    const data = lines.slice(1)
      .filter(line => line.trim())
      .map((line, index) => {
        const values = parseCSVLine(line)
        const row: any = {}
        
        headers.forEach((header, headerIndex) => {
          const value = values[headerIndex]?.trim()
          
          // Map CSV headers to database column names
          switch (header) {
            case 'eventName':
              row['event_name'] = value || null
              break
            case 'eventYear':
              row['event_year'] = value ? parseInt(value) : null
              break
            case 'eventDate':
              // Use the new date parsing function
              row['event_date'] = parseDate(value)
              break
            case 'latitude':
              row['latitude'] = value ? parseFloat(value) : null
              break
            case 'longitude':
              row['longitude'] = value ? parseFloat(value) : null
              break
            case 'countryName':
              row['country_name'] = value || null
              break
            case 'region':
              row['region'] = value || null
              break
            case 'locationText':
              row['location_text'] = value || null
              break
            case 'causativeSpeciesName0':
              row['causative_species_name'] = value || null
              break
            case 'cellsPerLitre0':
              row['cells_per_litre'] = value || null
              break
            case 'waterDiscoloration':
              row['water_discoloration'] = value === '1'
              break
            case 'highPhyto':
              row['high_phyto'] = value === '1'
              break
            case 'seafoodToxin':
              row['seafood_toxin'] = value === '1'
              break
            case 'massMortal':
              row['mass_mortal'] = value === '1'
              break
            case 'toxicityDetected':
              row['toxicity_detected'] = value === '1'
              break
            case 'toxinType':
              row['toxin_type'] = value || null
              break
            case 'toxin':
              row['toxin'] = value || null
              break
            case 'humansAffected':
              row['humans_affected'] = value === '1'
              break
            case 'fishAffected':
              row['fish_affected'] = value === '1'
              break
            case 'shellfishAffected':
              row['shellfish_affected'] = value === '1'
              break
            case 'birdsAffected':
              row['birds_affected'] = value === '1'
              break
            case 'syndromeName':
              row['syndrome_name'] = value || null
              break
            case 'effectsComments':
              row['effects_comments'] = value || null
              break
          }
        })
        
        return row
      })
    
    console.log(`🔄 Uploading data in batches...`)
    
    // Upload in batches of 100 to avoid timeout
    const batchSize = 100
    const batches = []
    for (let i = 0; i < data.length; i += batchSize) {
      batches.push(data.slice(i, i + batchSize))
    }
    
    let totalUploaded = 0
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]
      console.log(`📤 Uploading batch ${i + 1}/${batches.length} (${batch.length} records)...`)
      
      const { error } = await supabase
        .from('haedat_events')
        .insert(batch)
      
      if (error) {
        console.error(`❌ Error in batch ${i + 1}:`, error)
        throw error
      }
      
      totalUploaded += batch.length
      console.log(`✅ Batch ${i + 1} uploaded successfully. Total: ${totalUploaded}`)
    }
    
    console.log(`🎉 Successfully uploaded all ${totalUploaded} HAEDAT records!`)
    
    // Verify upload
    const { count, error: verifyError } = await supabase
      .from('haedat_events')
      .select('*', { count: 'exact', head: true })
    
    if (verifyError) {
      console.error('❌ Verification error:', verifyError)
    } else {
      console.log(`✅ Verification: ${count} records in database`)
    }
    
  } catch (error) {
    console.error('❌ Upload failed:', error)
    process.exit(1)
  }
}

uploadHaedatEssentialData() 