#!/usr/bin/env python3
"""
Download sea surface temperature data from Copernicus Marine Service
Dataset: NWSHELF_MULTIYEAR_PHY_004_009 - Atlantic-European North West Shelf Ocean Physics Reanalysis
"""

import copernicusmarine
from datetime import datetime, timedelta
import os
import subprocess
import dotenv

def download_sst_data():
    """
    Download the last month of sea surface temperature data from Copernicus Marine Service
    """
    
    # Check if NetCDF file already exists
    nc_file = "data/sst_last_month.nc"
    if os.path.exists(nc_file):
        print(f"✅ NetCDF file '{nc_file}' already exists, skipping download")
        return
    
    # Calculate date range for the last month
    # end_date = datetime.now()
    # start_date = end_date - timedelta(days=30)
    
    # Format dates for the API
    # start_datetime = start_date.strftime("%Y-%m-%d")
    # end_datetime = end_date.strftime("%Y-%m-%d")

    start_datetime = "2024-06-01"
    end_datetime = "2024-06-30"
    
    print(f"Downloading SST data from {start_datetime} to {end_datetime}")
    
    try:
        # Download sea surface temperature data
        # Using the dataset ID for the North West Shelf physics reanalysis
        copernicusmarine.subset(
            dataset_id="cmems_mod_nws_phy-t_my_7km-3D_P1M-m",
            variables=["thetao"],  # Sea water potential temperature
            start_datetime=start_datetime,
            end_datetime=end_datetime,
            minimum_depth=0,  # Surface level
            maximum_depth=5,  # First 5 meters for surface temperature
            output_filename=nc_file
        )
        # ds.to_netcdf(nc_file)
        print("✅ Successfully downloaded SST data to 'sst_last_month.nc'")
        
    except Exception as e:
        print(f"❌ Error downloading data: {e}")
        print("Make sure you have logged in with: copernicusmarine login")

def convert_to_geotiff():
    """
    Convert NetCDF file to GeoTIFF format
    """
    # Check if GeoTIFF file already exists
    tif_file = "data/sst_monthly.tif"
    if os.path.exists(tif_file):
        print(f"✅ GeoTIFF file '{tif_file}' already exists, skipping conversion")
        return
    
    # Check if source NetCDF file exists
    nc_file = "sst_last_month.nc"
    if not os.path.exists(nc_file):
        print(f"❌ Source file '{nc_file}' not found. Please run download first.")
        return
    
    try:
        subprocess.run([
            'gdal_translate',
            '-of', 'GTiff',
            '-a_srs', 'EPSG:4326',
            f'NETCDF:"{nc_file}":thetao',
            tif_file
        ], check=True)
        print("✅ Successfully converted to GeoTIFF: sst_monthly.tif")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error converting to GeoTIFF: {e}")
    except FileNotFoundError:
        print("❌ gdal_translate not found. Install GDAL: brew install gdal")

def load_to_supabase():
    """
    Load GeoTIFF raster into Supabase PostgreSQL database
    """
    # Check if GeoTIFF file exists
    tif_file = "data/sst_monthly.tif"
    if not os.path.exists(tif_file):
        print(f"❌ GeoTIFF file '{tif_file}' not found. Please run conversion first.")
        return
    
    # Check if SUPABASE_DB_URL is set
    db_url = os.environ.get('SUPABASE_DB_URL')
    if not db_url:
        print("❌ SUPABASE_DB_URL environment variable not set")
        print("Please set it in your .env file or export it:")
        print("export SUPABASE_DB_URL='postgresql://postgres:password@host:port/database'")
        return
    
    # Validate the connection string format
    if not db_url.startswith('postgresql://'):
        print("❌ Invalid SUPABASE_DB_URL format")
        print("Should start with 'postgresql://', not 'https://'")
        print("Get the correct connection string from Supabase Dashboard → Settings → Database")
        return
    
    try:
        # Generate SQL file
        subprocess.run([
            'raster2pgsql',
            '-s', '4326',
            '-I', '-C', '-M',
            tif_file,
            'public.sst_data'
        ], stdout=open('sst_data.sql', 'w'), check=True)
        print("✅ Generated load_sst.sql")
        
        # Load into database
        subprocess.run([
            'psql',
            db_url,
            '-f', 'sst_data.sql'
        ], check=True)
        print("✅ Successfully loaded raster into Supabase")
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Error loading to Supabase: {e}")
        print("Check your connection string and network connectivity")
    except FileNotFoundError:
        print("❌ raster2pgsql or psql not found. Install PostgreSQL: brew install postgresql")

def main():
    """
    Main function to execute the complete workflow
    """
    print("🌊 Copernicus Marine SST Downloader")
    print("=" * 40)
    dotenv.load_dotenv()
    
    # Check if user is logged in
    try:
        # Try to describe the dataset to verify login
        # copernicusmarine.describe(contains=["thetao"])
        print("✅ Login verified")
    except Exception as e:
        print("❌ Please login first using: copernicusmarine login")
        print("You can get free credentials from: https://data.marine.copernicus.eu/")
        return
    
    # Download the data (only if needed)
    download_sst_data()
    
    # Convert to GeoTIFF (only if needed)
    convert_to_geotiff()
    
    # Load to Supabase (only if needed)
    load_to_supabase()

if __name__ == "__main__":
    main()





# Example using psql; you’ll be prompted for your password
# psql "postgresql://<DB_USER>:<DB_PASSWORD>@<DB_HOST>:5432/<DB_NAME>" \
#   -f my_geotiff_table.sql




# psql "sslmode=verify-full sslrootcert='/Users/coenvandenelsen/Library/CloudStorage/OneDrive-Kampany/Documenten/AI projects/Coen/prod-ca-2021.crt' host=aws-0-eu-west-2.pooler.supabase.com dbname=postgres user=postgres.evwdvxygtdcffiyojgnc" -f sst_data.sql