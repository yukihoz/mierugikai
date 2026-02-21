
import csv
import sys
import datetime
import json
import os

# Increase CSV field size limit
csv.field_size_limit(sys.maxsize)

MASTER_PATH = '/Users/yuki/Documents/Antigravity/GIJIMIE2/data/combined_master_20260131.csv'
# Using the new enriched sabun as input if available, or fall back to known sabun
SABUN_PATH = '/Users/yuki/Documents/Antigravity/GIJIMIE2/data/sabun_enriched.csv' 
OUTPUT_PATH = '/Users/yuki/Documents/Antigravity/GIJIMIE2/data/combined_master_20260131.csv'
JSON_OUTPUT_PATH = '/Users/yuki/Documents/Antigravity/GIJIMIE2/public/data/gijiroku.json'

def calculate_nendo(date_str):
    """
    Calculate fiscal year (Nendo) from date string YYYY/MM/DD.
    Fiscal year starts on April 1st.
    """
    try:
        dt = datetime.datetime.strptime(date_str, '%Y/%m/%d')
        year = dt.year
        if dt.month < 4:
            year -= 1
        return str(year)
    except ValueError:
        return ""

def main():
    import argparse
    parser = argparse.ArgumentParser(description='Merge sabun data into master and generate JSON.')
    parser.add_argument('--preview', action='store_true', help='Include unofficial data (is_unofficial=1) in the output JSON. Default is to exclude it.')
    args = parser.parse_args()

    print("Starting merge process...")
    if args.preview:
        print("[MODE] PREVIEW: Including all data (Official + Unofficial) in JSON output.")
    else:
        print("[MODE] PRODUCTION: Excluding unofficial data from JSON output.")

    # 1. Read Master Data and Find Max ID
    master_rows = []
    max_h_id = 0
    max_t_id = 0
    master_fieldnames = []

    print(f"Reading master file: {MASTER_PATH}")
    try:
        with open(MASTER_PATH, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            master_fieldnames = list(reader.fieldnames)
            
            # Sanitize fieldnames (remove BOM if present in list)
            if master_fieldnames and master_fieldnames[0].startswith('\ufeff'):
                 master_fieldnames[0] = master_fieldnames[0].replace('\ufeff', '')
            
            # Ensure is_unofficial exists in fieldnames
            if 'is_unofficial' not in master_fieldnames:
                master_fieldnames.append('is_unofficial')

            for row in reader:
                # Add default is_unofficial to existing rows if missing
                if 'is_unofficial' not in row:
                    row['is_unofficial'] = '0' # Default to official for existing data
                
                master_rows.append(row)
                if 'ID' in row and row['ID']:
                    if row['ID'].startswith('H'):
                        try:
                            num = int(row['ID'][1:])
                            if num > max_h_id:
                                max_h_id = num
                        except ValueError:
                            pass
                    elif row['ID'].startswith('T'):
                        try:
                            num = int(row['ID'][1:])
                            if num > max_t_id:
                                max_t_id = num
                        except ValueError:
                            pass

    except Exception as e:
        print(f"Error reading master file: {e}")
        return

    print(f"Master rows: {len(master_rows)}")
    print(f"Max H-ID found: H{max_h_id:08d}")
    print(f"Max T-ID found: T{max_t_id:08d}")

    # 2. Read Sabun and Transform
    sabun_rows = []
    next_h_id = max_h_id + 1
    next_t_id = max_t_id + 1

    if not os.path.exists(SABUN_PATH):
        print(f"Sabun file not found at {SABUN_PATH}, skipping merge.")
    else:
        print(f"Reading sabun file: {SABUN_PATH}")
        try:
            with open(SABUN_PATH, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                
                # Read all rows and sort chronologically
                rows = list(reader)
                
                def parse_date(row):
                    # Try '年月日' first, then '月日'
                    d_str = row.get('年月日', row.get('月日', ''))
                    try:
                        return datetime.datetime.strptime(d_str, '%Y/%m/%d')
                    except ValueError:
                        return datetime.datetime.min 

                # Sort rows by date (Oldest -> Newest)
                rows.sort(key=parse_date)

                for row in rows:
                    new_row = {}
                    # Initialize with empty strings for all master fields
                    for field in master_fieldnames:
                        new_row[field] = ""

                    # Determine ID prefix based on is_unofficial
                    is_unofficial = row.get('is_unofficial', '0')
                    
                    if is_unofficial == '1':
                        new_id = f"T{next_t_id:08d}"
                        next_t_id += 1
                    else:
                        new_id = f"H{next_h_id:08d}"
                        next_h_id += 1
                        
                    new_row['ID'] = new_id
                    
                    # Direct mappings
                    new_row['会議の名称'] = row.get('会議の名称', '')
                    new_row['発言者'] = row.get('発言者', '')
                    new_row['人分類'] = row.get('人分類', '')
                    new_row['発言内容'] = row.get('発言内容', '')
                    new_row['委員会/本会議名称'] = row.get('委員会/本会議名称', '')
                    
                    # Mapped mappings
                    date_str = row.get('年月日', row.get('月日', ''))
                    new_row['月日'] = date_str
                    
                    # Handle varying column names for tags
                    new_row['内容分類'] = row.get('内容分類', row.get('議事関係', ''))

                    # Derived mapping
                    if row.get('年度'):
                        new_row['年度'] = row.get('年度')
                    else:
                        new_row['年度'] = calculate_nendo(date_str)
                    
                    # Pass through is_unofficial
                    new_row['is_unofficial'] = row.get('is_unofficial', '0')

                    sabun_rows.append(new_row)

        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"Error reading sabun file: {e}")
            return

    print(f"Sabun rows processed: {len(sabun_rows)}")
    if max_h_id < next_h_id - 1:
         print(f"New H-ID range: H{(max_h_id+1):08d} - H{(next_h_id-1):08d}")
    if max_t_id < next_t_id - 1:
         print(f"New T-ID range: T{(max_t_id+1):08d} - T{(next_t_id-1):08d}")

    # 3. Write Combined File
    print(f"Writing combined file to: {OUTPUT_PATH}")
    try:
        combined_data = master_rows + sabun_rows
        with open(OUTPUT_PATH, 'w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=master_fieldnames)
            writer.writeheader()
            writer.writerows(combined_data)
        print("Write complete (CSV).")

        # 4. Write JSON for App (Both Official and Preview)
        PREVIEW_JSON_OUTPUT_PATH = JSON_OUTPUT_PATH.replace('.json', '_preview.json')
        print(f"Writing official JSON to: {JSON_OUTPUT_PATH}")
        print(f"Writing preview JSON to: {PREVIEW_JSON_OUTPUT_PATH}")
        
        json_rows_mapped_official = []
        json_rows_mapped_preview = []
        skipped_official_count = 0
        
        for row in combined_data:
            is_unofficial_bool = row.get("is_unofficial") == '1'

            # Format the body text: Replace single newlines with double newlines for better readability
            raw_body = row.get("発言内容", "")
            if raw_body:
                import re
                normalized = raw_body.replace('\r\n', '\n')
                formatted_body = re.sub(r'\n+', '\n\n', normalized)
            else:
                formatted_body = ""

            mapped_row = {
                "id": row.get("ID"),
                "title": row.get("会議の名称"),
                "speaker": row.get("発言者"),
                "category": row.get("人分類", ""),
                "body": formatted_body,
                "year": int(row.get("年度")) if row.get("年度") and row.get("年度").isdigit() else None,
                "date": row.get("月日"), # Note: CSV output uses 月日 for all
                "type": row.get("委員会/本会議名称"),
                "tags": row.get("内容分類"),
                "is_unofficial": is_unofficial_bool
            }
            
            # Preview gets everything
            json_rows_mapped_preview.append(mapped_row)
            
            # Official skips unofficial records
            if is_unofficial_bool:
                skipped_official_count += 1
            else:
                json_rows_mapped_official.append(mapped_row)

        with open(JSON_OUTPUT_PATH, 'w', encoding='utf-8') as f:
            json.dump(json_rows_mapped_official, f, ensure_ascii=False, indent=2)
        print(f"Write complete (Official JSON). Total: {len(json_rows_mapped_official)} (Skipped {skipped_official_count} unofficial records).")

        with open(PREVIEW_JSON_OUTPUT_PATH, 'w', encoding='utf-8') as f:
            json.dump(json_rows_mapped_preview, f, ensure_ascii=False, indent=2)
        print(f"Write complete (Preview JSON). Total: {len(json_rows_mapped_preview)}.")

    except Exception as e:
        print(f"Error writing output file: {e}")
        return

if __name__ == "__main__":
    main()
