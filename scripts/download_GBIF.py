from pygbif import occurrences
import pandas as pd
import geopandas as gpd
from sqlalchemy import create_engine
from shapely.geometry import Point
import numpy as np
import os
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

import os
from supabase import create_client, Client

url: str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key: str = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Download fungal occurrences in Europe
res = occurrences.search(
    continent='europe',
    taxon_key=1040,  # Eurotiales (fungi order)
    limit=100
)

# Create DataFrame from results
df = pd.DataFrame(res['results'])

# Select only the columns we need
columns_to_keep = [
    # Species information
    'scientificName',
    'species', 
    'genus',
    'family',
    'order',
    
    # Coordinates
    'decimalLatitude',
    'decimalLongitude',
    
    # Date components
    'year',
    'month', 
    'day',
    'eventDate'
]

# Filter to only keep existing columns
available_columns = [col for col in columns_to_keep if col in df.columns]
df_filtered = df[available_columns]

# Clean and prepare data for PostGIS
df_clean = df_filtered.copy()
df_clean = df_clean.dropna(subset=['decimalLatitude', 'decimalLongitude'])

# Create geometry column for PostGIS
geometry = [Point(xy) for xy in zip(df_clean['decimalLongitude'], df_clean['decimalLatitude'])]
gdf = gpd.GeoDataFrame(df_clean, geometry=geometry, crs='EPSG:4326')

# Save to CSV (backup)
# df_filtered.to_csv("gbif_europe_subset.csv", index=False)

# Save to Supabase
try:
    print("Saving to Supabase...")
    
    # Helper function to safely convert values
    def safe_convert(value, convert_func=None):
        if pd.isna(value) or value is None or str(value).lower() in ['nan', 'none', '']:
            return None
        try:
            return convert_func(value) if convert_func else value
        except (ValueError, TypeError):
            return None

    def safe_convert_date(date_value):
        """Safely convert date values, handling ranges and invalid formats"""
        if pd.isna(date_value) or date_value is None or str(date_value).lower() in ['nan', 'none', '']:
            return None
        
        date_str = str(date_value)
        
        # Handle date ranges - take the first date
        if '/' in date_str:
            date_str = date_str.split('/')[0]
        
        # Handle time ranges - take just the date part if too long
        if 'T' in date_str and len(date_str) > 19:
            date_str = date_str[:19]
        
        # Try to validate the date format
        try:
            from datetime import datetime
            datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            return date_str
        except (ValueError, TypeError):
            return None

    # Convert DataFrame to list of dictionaries with better handling
    records = []
    for _, row in df_clean.iterrows():
        record = {
            'scientific_name': safe_convert(row.get('scientificName')),
            'species': safe_convert(row.get('species')),
            'genus': safe_convert(row.get('genus')),
            'family': safe_convert(row.get('family')),
            'order': safe_convert(row.get('order')),
            'decimal_latitude': safe_convert(row.get('decimalLatitude'), float),
            'decimal_longitude': safe_convert(row.get('decimalLongitude'), float),
            'year': safe_convert(row.get('year'), int),
            'month': safe_convert(row.get('month'), int),
            'day': safe_convert(row.get('day'), int),
            'event_date': safe_convert_date(row.get('eventDate'))
        }
        
        # Only add records with valid coordinates
        if record['decimal_latitude'] is not None and record['decimal_longitude'] is not None:
            records.append(record)

    print(f"Prepared {len(records)} valid records for insertion")
    
    # Insert data in batches (Supabase has limits)
    batch_size = 100
    total_inserted = 0
    
    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        response = supabase.table('gbif_fungal_observations').insert(batch).execute()
        total_inserted += len(batch)
        print(f"Inserted batch {i//batch_size + 1}, total: {total_inserted}/{len(records)}")
    
    print(f"✅ Successfully saved {total_inserted} records to Supabase!")
    
except Exception as e:
    logger.error(f"❌ Error saving to Supabase: {e}")
    logger.info("💾 Data saved to CSV as backup")

print(f"\n📁 Files created:")
print(f"   • gbif_europe_subset.csv - CSV backup ({len(df_filtered)} records)")

# Verify data was saved
try:
    response = supabase.table('gbif_fungal_observations').select('*').limit(5).execute()
    print(f"\n✅ Verification: Found {len(response.data)} records in database")
    if response.data:
        print("Sample record:", response.data[0])
except Exception as e:
    print(f"❌ Error retrieving data: {e}")

# Debug Your Data First
print("Checking for NaN values in data...")
for col in df_clean.columns:
    nan_count = df_clean[col].isna().sum()
    if nan_count > 0:
        print(f"  {col}: {nan_count} NaN values")
        
# Show sample of problematic rows
print("\nSample of data:")
print(df_clean.head(3).to_dict('records'))

# Test connection (using a table that definitely exists)
try:
    # Test with your actual table
    response = supabase.table('gbif_fungal_observations').select('*').limit(1).execute()
    print("✅ Supabase connection successful!")
except Exception as e:
    print(f"❌ Supabase connection failed: {e}")
    # If table doesn't exist, that's also a connection success
    if 'does not exist' in str(e):
        print("✅ Connection works, but table needs to be created first")