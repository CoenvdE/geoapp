import pandas as pd
import numpy as np

def process_haedat_file():
    """
    Load xlsx file, filter rows with complete coordinate data, and save as CSV with essential columns only.
    """
    # Load the Excel file
    print("Loading haedat_geocoded.xlsx...")
    df = pd.read_excel('haedat_geocoded.xlsx')
    
    print(f"Original dataset shape: {df.shape}")
    print(f"Original columns: {len(df.columns)}")
    
    # Define essential columns to keep
    essential_columns = [
        # Core identification
        'eventName',
        'eventYear',
        'eventDate',
        
        # Geographic data
        'latitude',
        'longitude',
        'countryName',
        'region',
        'locationText',
        
        # Primary causative species (keep only the main one)
        'causativeSpeciesName0',
        'cellsPerLitre0',
        
        # Key environmental effects
        'waterDiscoloration',
        'highPhyto',
        'seafoodToxin',
        'massMortal',
        'toxicityDetected',
        'toxinType',
        'toxin',
        
        # Impact on organisms (most important ones)
        'humansAffected',
        'fishAffected',
        'shellfishAffected',
        'birdsAffected',
        
        # Additional context
        'syndromeName',
        'effectsComments'
    ]
    
    # Check which essential columns exist in the dataset
    existing_essential_columns = [col for col in essential_columns if col in df.columns]
    missing_essential_columns = [col for col in essential_columns if col not in df.columns]
    
    if missing_essential_columns:
        print(f"Warning: Missing essential columns: {missing_essential_columns}")
    
    print(f"Keeping {len(existing_essential_columns)} essential columns:")
    for i, col in enumerate(existing_essential_columns, 1):
        print(f"  {i:2d}. {col}")
    
    # Filter to only essential columns
    df_essential = df[existing_essential_columns].copy()
    
    print(f"\nBefore coordinate filtering: {df_essential.shape}")
    
    # STRICT coordinate filtering - only keep rows with VALID lat/lng
    coord_mask = (
        # Latitude must be valid number between -90 and 90
        df_essential['latitude'].notna() & 
        (df_essential['latitude'] != '') & 
        (df_essential['latitude'] != ' ') &
        (df_essential['latitude'] >= -90) &
        (df_essential['latitude'] <= 90) &
        
        # Longitude must be valid number between -180 and 180
        df_essential['longitude'].notna() & 
        (df_essential['longitude'] != '') & 
        (df_essential['longitude'] != ' ') &
        (df_essential['longitude'] >= -180) &
        (df_essential['longitude'] <= 180)
    )
    
    # Apply the coordinate filter
    filtered_df = df_essential[coord_mask].copy()
    
    print(f"After coordinate filtering: {filtered_df.shape}")
    print(f"Removed {len(df_essential) - len(filtered_df)} rows with invalid coordinates")
    
    # Show some coordinate statistics
    print(f"\nCoordinate ranges in filtered data:")
    print(f"- Latitude: {filtered_df['latitude'].min():.3f} to {filtered_df['latitude'].max():.3f}")
    print(f"- Longitude: {filtered_df['longitude'].min():.3f} to {filtered_df['longitude'].max():.3f}")
    
    # Save as CSV (overwriting the existing file)
    output_file = 'Haedat_essential.csv'
    filtered_df.to_csv(output_file, index=False)
    print(f"Saved filtered data to {output_file}")
    
    # Show final statistics
    print(f"\nFinal Summary:")
    print(f"- Original rows: {len(df)}")
    print(f"- Original columns: {len(df.columns)}")
    print(f"- Essential columns: {len(existing_essential_columns)}")
    print(f"- Valid coordinate rows: {len(filtered_df)}")
    print(f"- Data reduction: {(1 - (len(filtered_df) * len(existing_essential_columns)) / (len(df) * len(df.columns))) * 100:.1f}%")
    
    return filtered_df

if __name__ == "__main__":
    try:
        result = process_haedat_file()
        print("Processing completed successfully!")
    except Exception as e:
        print(f"Error: {e}")
        print("Make sure pandas and openpyxl are installed: pip install pandas openpyxl") 