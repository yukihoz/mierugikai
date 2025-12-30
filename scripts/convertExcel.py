
import pandas as pd
import os

# Define paths relative to script location or absolute
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INPUT_XLSX = os.path.join(BASE_DIR, 'data', 'gijiroku_export_utf820251229-2.xlsx')
OUTPUT_CSV = os.path.join(BASE_DIR, 'data', 'gijiroku_export_converted.csv')

def convert():
    print(f"Reading from: {INPUT_XLSX}")
    try:
        # Read the first sheet (default)
        df = pd.read_excel(INPUT_XLSX)
        
        # Ensure ID column exists, maybe? Data should have it if it's the newer file.
        # But let's just dump it as is for now.
        
        print(f"Columns found: {df.columns.tolist()}")
        print(f"Rows: {len(df)}")
        
        # Check specific ID if possible
        target_id = 'H00152025'
        if 'ID' in df.columns:
            target_row = df[df['ID'] == target_id]
            if not target_row.empty:
                content = target_row.iloc[0]['発言内容']
                print(f"Content for {target_id}: {str(content)[:50]}... (Len: {len(str(content))})")
            else:
                print(f"Warning: ID {target_id} not found in Excel.")
        
        # Write to CSV
        # utf-8-sig for Excel compatibility (BOM)
        df.to_csv(OUTPUT_CSV, index=False, encoding='utf-8-sig', quoting=1) # quoting=1 means quote all non-numeric? Or minimal? Default is quote minimal. 1 is All? No, import csv.QUOTE_ALL is 1.
        # pandas quoting: 
        # csv.QUOTE_MINIMAL (0), QUOTE_ALL (1), QUOTE_NONNUMERIC (2), QUOTE_NONE (3)
        # Default is usually fine, but to be safe for newlines, let's trust pandas default (QUOTE_MINIMAL) but ensuring text handling.
        
        print(f"Exported to: {OUTPUT_CSV}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    convert()
