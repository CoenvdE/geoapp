#!/usr/bin/env python3
"""
Quick inspection tool for TIFF files downloaded from Copernicus Marine Service
"""

import numpy as np
import os
from pathlib import Path
import rasterio
from rasterio.transform import Affine
import matplotlib.pyplot as plt

def inspect_tiff_file(file_path="data/sst_monthly.tif"):
    """
    Inspect a TIFF file and display key information
    """
    
    if not os.path.exists(file_path):
        print(f"❌ File '{file_path}' not found!")
        print("Make sure to run the download script first.")
        return
    
    print(f"🔍 Inspecting: {file_path}")
    print("=" * 50)
    
    try:
        # Open the tiff file
        with rasterio.open(file_path) as ds:
            
            # Basic file info
            print(f"📁 File size: {os.path.getsize(file_path) / (1024*1024):.2f} MB")
            print()
            
            # Dataset info
            print("📊 Dataset Information:")
            print(f"  • Driver: {ds.driver}")
            print(f"  • Width: {ds.width}")
            print(f"  • Height: {ds.height}")
            print(f"  • Number of bands: {ds.count}")
            print(f"  • Data type: {ds.dtypes[0]}")
            print(f"  • Coordinate reference system: {ds.crs}")
            print()
            
            # Transform information
            print("📍 Transform Information:")
            print(f"  • Transform: {ds.transform}")
            print(f"  • Bounds: {ds.bounds}")
            print()
            
            # Read all bands for comparison
            all_bands = ds.read()
            print(f"📊 All bands shape: {all_bands.shape}")
            print()
            
            # Compare bands
            print("🔍 Band Comparison:")
            for i in range(ds.count):
                band_data = all_bands[i]
                print(f"  • Band {i+1}:")
                print(f"    - Min: {np.nanmin(band_data):.4f}")
                print(f"    - Max: {np.nanmax(band_data):.4f}")
                print(f"    - Mean: {np.nanmean(band_data):.4f}")
                print(f"    - Std: {np.nanstd(band_data):.4f}")
                
                # Check if bands are identical
                if i > 0:
                    is_identical = np.array_equal(all_bands[0], band_data)
                    print(f"    - Identical to Band 1: {is_identical}")
                print()
            
            # Check for differences between bands
            if ds.count > 1:
                print("🔍 Band Differences:")
                band1 = all_bands[0]
                band2 = all_bands[1]
                
                # Find where bands differ
                diff_mask = band1 != band2
                diff_count = np.sum(diff_mask)
                total_pixels = band1.size
                
                print(f"  • Different pixels: {diff_count} out of {total_pixels} ({diff_count/total_pixels*100:.2f}%)")
                
                if diff_count > 0:
                    # Show some examples of differences
                    diff_indices = np.where(diff_mask)
                    print(f"  • Sample differences (first 5):")
                    for j in range(min(5, diff_count)):
                        row, col = diff_indices[0][j], diff_indices[1][j]
                        print(f"    Pixel ({row}, {col}): Band1={band1[row, col]:.2f}, Band2={band2[row, col]:.2f}")
                print()
            
            # Data statistics for first band
            data = all_bands[0]
            print("📈 Data Statistics (Band 1):")
            print(f"  • Min value: {np.nanmin(data):.4f}")
            print(f"  • Max value: {np.nanmax(data):.4f}")
            print(f"  • Mean value: {np.nanmean(data):.4f}")
            print(f"  • Standard deviation: {np.nanstd(data):.4f}")
            print()
            
            # Check for missing values
            missing_count = np.sum(data == -32768)  # Using the NoData value
            total_count = data.size
            print(f"  • Missing values: {missing_count} out of {total_count} ({missing_count/total_count*100:.2f}%)")
            print()
            
            # Tags and metadata
            print("️ Tags and Metadata:")
            for tag in ds.tags():
                print(f"  • {tag}: {ds.tags()[tag]}")
            print()
            
            # Band information
            print("🎨 Band Information:")
            for i in range(1, ds.count + 1):
                print(f"  • Band {i}:")
                print(f"    - Data type: {ds.dtypes[i-1]}")
                print(f"    - NoData value: {ds.nodatavals[i-1]}")
                if ds.descriptions[i-1]:
                    print(f"    - Description: {ds.descriptions[i-1]}")
                if ds.units[i-1]:
                    print(f"    - Units: {ds.units[i-1]}")
                print()
            
            # Spatial extent
            bounds = ds.bounds
            print("🗺️ Spatial Extent:")
            print(f"  • Left: {bounds.left:.4f}")
            print(f"  • Right: {bounds.right:.4f}")
            print(f"  • Bottom: {bounds.bottom:.4f}")
            print(f"  • Top: {bounds.top:.4f}")
            print(f"  • Grid size: {ds.width} x {ds.height}")
            print()
            
            # Additional info about the data
            print("📈 Data Summary:")
            print(f"  • Total data points: {data.size:,}")
            print(f"  • Spatial resolution: {ds.res[0]:.2f} x {ds.res[1]:.2f} units")
            print(f"  • Coverage: Based on bounds")
            print()
            
        print("✅ Inspection complete!")
        
    except Exception as e:
        print(f"❌ Error inspecting file: {e}")
        import traceback
        traceback.print_exc()

def quick_preview(file_path="data/sst_monthly.tif"):
    """
    Quick preview of the data structure
    """
    if not os.path.exists(file_path):
        print(f"❌ File '{file_path}' not found!")
        return
    
    try:
        with rasterio.open(file_path) as ds:
            print("🚀 Quick Preview:")
            print("=" * 30)
            print(f"File: {file_path}")
            print(f"Size: {ds.width} x {ds.height}")
            print(f"Bands: {ds.count}")
            print(f"Data type: {ds.dtypes[0]}")
            print(f"CRS: {ds.crs}")
            print(f"Bounds: {ds.bounds}")
            
            # Show data from all bands
            all_bands = ds.read()
            for i in range(ds.count):
                data = all_bands[i]
                print(f"Band {i+1} sample (first 5x5 pixels):")
                print(data[:5, :5])
                print()
            
    except Exception as e:
        print(f"❌ Error in quick preview: {e}")

def main():
    """
    Main function
    """
    print("🔍 TIFF File Inspector")
    print("=" * 30)
    
    # Check if file exists
    file_path = "data/sst_monthly.tif"
    
    if os.path.exists(file_path):
        print(f"Found file: {file_path}")
        print()
        
        # Full inspection
        inspect_tiff_file(file_path)
        
        print("\n" + "="*50)
        print("Quick preview:")
        quick_preview(file_path)
        
    else:
        print(f"❌ File '{file_path}' not found!")
        print("Please run the download script first:")
        print("python scripts/download_copernicus.py")

if __name__ == "__main__":
    main() 