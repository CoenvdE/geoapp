#!/usr/bin/env python3
"""
Quick inspection tool for NetCDF files downloaded from Copernicus Marine Service
"""

import xarray as xr
import numpy as np
import os
from pathlib import Path

def inspect_nc_file(file_path="sst_last_month.nc"):
    """
    Inspect a NetCDF file and display key information
    """
    
    if not os.path.exists(file_path):
        print(f"❌ File '{file_path}' not found!")
        print("Make sure to run the download script first.")
        return
    
    print(f"🔍 Inspecting: {file_path}")
    print("=" * 50)
    
    try:
        # Open the NetCDF file
        ds = xr.open_dataset(file_path)
        
        # Basic file info
        print(f"📁 File size: {os.path.getsize(file_path) / (1024*1024):.2f} MB")
        print()
        
        # Dataset info
        print("📊 Dataset Information:")
        print(f"  • Title: {ds.attrs.get('title', 'N/A')}")
        print(f"  • Description: {ds.attrs.get('description', 'N/A')}")
        print(f"  • Creation date: {ds.attrs.get('creation_date', 'N/A')}")
        print()
        
        # Dimensions - use sizes instead of dims to avoid deprecation warning
        print("📏 Dimensions:")
        for dim_name, dim_size in ds.sizes.items():
            print(f"  • {dim_name}: {dim_size}")
        print()
        
        # Variables
        print("🔢 Variables:")
        for var_name, var in ds.data_vars.items():
            print(f"  • {var_name}:")
            print(f"    - Shape: {var.shape}")
            print(f"    - Data type: {var.dtype}")
            print(f"    - Units: {var.attrs.get('units', 'N/A')}")
            print(f"    - Long name: {var.attrs.get('long_name', 'N/A')}")
            print()
        
        # Coordinates
        print("📍 Coordinates:")
        for coord_name, coord in ds.coords.items():
            print(f"  • {coord_name}:")
            print(f"    - Shape: {coord.shape}")
            print(f"    - Data type: {coord.dtype}")
            if hasattr(coord, 'values') and len(coord.values) > 0:
                # Handle different data types properly
                if coord.dtype.kind in ['f', 'i']:  # float or integer
                    print(f"    - Range: {coord.values.min():.4f} to {coord.values.max():.4f}")
                else:
                    print(f"    - Range: {coord.values.min()} to {coord.values.max()}")
            print()
        
        # Data statistics for main variable (thetao)
        if 'thetao' in ds.data_vars:
            thetao = ds['thetao']
            print("🌡️ Sea Surface Temperature Statistics:")
            print(f"  • Min temperature: {float(thetao.min().values):.2f}°C")
            print(f"  • Max temperature: {float(thetao.max().values):.2f}°C")
            print(f"  • Mean temperature: {float(thetao.mean().values):.2f}°C")
            print(f"  • Standard deviation: {float(thetao.std().values):.2f}°C")
            print()
            
            # Check for missing values
            missing_count = int(thetao.isnull().sum().values)
            total_count = thetao.size
            print(f"  • Missing values: {missing_count} out of {total_count} ({missing_count/total_count*100:.2f}%)")
            print()
        
        # Time information
        if 'time' in ds.coords:
            time_coord = ds['time']
            print("⏰ Time Information:")
            # Convert numpy datetime64 to string for display
            start_time = str(time_coord.min().values)
            end_time = str(time_coord.max().values)
            print(f"  • Start date: {start_time}")
            print(f"  • End date: {end_time}")
            print(f"  • Number of time steps: {len(time_coord)}")
            print()
        
        # Spatial extent
        if 'longitude' in ds.coords and 'latitude' in ds.coords:
            lon = ds['longitude']
            lat = ds['latitude']
            print("🗺️ Spatial Extent:")
            print(f"  • Longitude: {float(lon.min().values):.2f}° to {float(lon.max().values):.2f}°")
            print(f"  • Latitude: {float(lat.min().values):.2f}° to {float(lat.max().values):.2f}°")
            print(f"  • Grid size: {len(lon)} x {len(lat)}")
            print()
        
        # Additional info about the data
        print("📈 Data Summary:")
        print(f"  • Total data points: {ds['thetao'].size:,}")
        print(f"  • Spatial resolution: ~7km (as per dataset description)")
        print(f"  • Coverage: North West European Shelf")
        print(f"  • Depth levels: {len(ds['depth'])} (surface to {float(ds['depth'].max().values):.1f}m)")
        print()
        
        # Close the dataset
        ds.close()
        
        print("✅ Inspection complete!")
        
    except Exception as e:
        print(f"❌ Error inspecting file: {e}")
        import traceback
        traceback.print_exc()

def quick_preview(file_path="sst_last_month.nc"):
    """
    Quick preview of the data structure
    """
    if not os.path.exists(file_path):
        print(f"❌ File '{file_path}' not found!")
        return
    
    try:
        ds = xr.open_dataset(file_path)
        
        print("🚀 Quick Preview:")
        print("=" * 30)
        print(ds.info())
        
        ds.close()
        
    except Exception as e:
        print(f"❌ Error in quick preview: {e}")

def main():
    """
    Main function
    """
    print("🔍 NetCDF File Inspector")
    print("=" * 30)
    
    # Check if file exists
    file_path = "sst_last_month.nc"
    
    if os.path.exists(file_path):
        print(f"Found file: {file_path}")
        print()
        
        # Full inspection
        inspect_nc_file(file_path)
        
        print("\n" + "="*50)
        print("Quick preview:")
        quick_preview(file_path)
        
    else:
        print(f"❌ File '{file_path}' not found!")
        print("Please run the download script first:")
        print("python scripts/download_copernicus.py")

if __name__ == "__main__":
    main() 