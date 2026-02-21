
import csv
import sys
import datetime
import os

# Increase CSV field size limit
csv.field_size_limit(sys.maxsize)

INPUT_PATH = '/Users/yuki/Documents/Antigravity/GIJIMIE2/parsed_gijiroku.csv'
OUTPUT_PATH = '/Users/yuki/Documents/Antigravity/GIJIMIE2/data/enriched_sabun.csv'

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
    print(f"Reading input file: {INPUT_PATH}")
    
    if not os.path.exists(INPUT_PATH):
        print(f"Error: Input file not found at {INPUT_PATH}")
        return

    processed_rows = []
    
    try:
        with open(INPUT_PATH, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            # Input columns: 発言者,発言内容,年月日,会議の名称
            
            for i, row in enumerate(reader):
                new_row = {}
                
                # Basic mapping
                new_row['会議の名称'] = row.get('会議の名称', '')
                new_row['発言者'] = row.get('発言者', '')
                new_row['発言内容'] = row.get('発言内容', '')
                new_row['月日'] = row.get('年月日', '')
                
                # Enriched fields
                new_row['年度'] = calculate_nendo(new_row['月日'])
                
                # Infer type from title
                title = new_row['会議の名称']
                if '委員会' in title:
                     new_row['委員会/本会議名称'] = title # Simple heuristic for now
                elif '本会議' in title:
                     new_row['委員会/本会議名称'] = '本会議'
                else:
                     new_row['委員会/本会議名称'] = 'その他'

                # Defaults
                new_row['人分類'] = '' # Needs manual review or better heuristic later
                new_row['内容分類'] = ''
                
                # Unofficial flag
                new_row['is_unofficial'] = '1'
                
                # Temp ID (will be overwritten by merge script mostly, but good to have)
                # merge_sabun.py generates IDs based on max ID in master, so this might be ignored, 
                # but let's properly leave it empty or give a temp one? 
                # merge_sabun.py line 101: generates new ID.
                # So we can leave it empty.
                new_row['ID'] = ''

                processed_rows.append(new_row)
                
    except Exception as e:
        print(f"Error reading input file: {e}")
        return

    print(f"Processed {len(processed_rows)} rows.")
    
    # Target columns based on combined_master + is_unofficial
    fieldnames = ['ID', '会議の名称', '発言者', '人分類', '発言内容', '年度', '月日', '委員会/本会議名称', '内容分類', 'is_unofficial']
    
    print(f"Writing parsed sabun data to: {OUTPUT_PATH}")
    try:
        with open(OUTPUT_PATH, 'w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(processed_rows)
        print("Write complete.")
    except Exception as e:
        print(f"Error writing output file: {e}")

if __name__ == "__main__":
    main()
