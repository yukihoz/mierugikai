import csv
import sys
import os
import glob

csv.field_size_limit(sys.maxsize)

MASTER_PATH = '/Users/yuki/Documents/Antigravity/GIJIMIE2/data/combined_master_20260131.csv'
SABUN_DIR = '/Users/yuki/Documents/Antigravity/GIJIMIE2'

def main():
    print("Building category lookup from source sabun files...")
    lookup = {}
    
    # Read all sabun*.csv files in the directory
    sabun_files = glob.glob(os.path.join(SABUN_DIR, 'sabun*.csv'))
    
    for sf in sabun_files:
        try:
            with open(sf, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    meeting = row.get('会議の名称', '').strip()
                    speaker = row.get('発言者', '').strip()
                    body = row.get('発言内容', '').strip()
                    category = row.get('人分類', '').strip()
                    
                    if category:
                        # Key matches the deduplication/merge logic
                        key = (meeting, speaker, body)
                        lookup[key] = category
        except Exception as e:
            print(f"Error reading {sf}: {e}")
            
    print(f"Lookup dictionary built with {len(lookup)} entries.")
    
    print(f"Reading master file: {MASTER_PATH}")
    if not os.path.exists(MASTER_PATH):
        print("Master file not found.")
        sys.exit(1)
        
    master_rows = []
    restored_count = 0
    
    with open(MASTER_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        for row in reader:
            if not row.get('人分類'):
                meeting = row.get('会議の名称', '').strip()
                speaker = row.get('発言者', '').strip()
                body = row.get('発言内容', '').strip()
                
                key = (meeting, speaker, body)
                if key in lookup:
                    row['人分類'] = lookup[key]
                    restored_count += 1
            master_rows.append(row)
            
    print(f"Restored '人分類' for {restored_count} records.")
    
    if restored_count > 0:
        back_path = MASTER_PATH + '.restore.bak'
        os.rename(MASTER_PATH, back_path)
        print(f"Backed up original master to {back_path}")
        
        with open(MASTER_PATH, 'w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(master_rows)
        print("Successfully wrote updated master data.")

if __name__ == '__main__':
    main()
