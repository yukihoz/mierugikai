import csv
import sys
import datetime

MASTER_CSV = '/Users/yuki/Documents/Antigravity/GIJIMIE2/data/combined_master_20260131.csv'
BACKUP_CSV = '/Users/yuki/Documents/Antigravity/GIJIMIE2/data/combined_master_20260131_backup_delete.csv'

def clean_data():
    # 1. Read existing data
    rows = []
    with open(MASTER_CSV, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        for row in reader:
            rows.append(row)
            
    print(f"Original row count: {len(rows)}")
    
    # 2. Backup original data
    with open(BACKUP_CSV, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    print(f"Created backup at: {BACKUP_CSV}")

    # 3. Filter rows (Remove H-series where speaker is empty or completely missing)
    cleaned_rows = []
    removed_count = 0
    removed_ids = []
    
    for row in rows:
        is_h_series = row.get('ID', '').startswith('H')
        speaker = row.get('発言者', '').strip()
        
        # Condition: If it's an official record (H-series) AND the speaker is empty/missing -> Remove it
        if is_h_series and not speaker:
            removed_count += 1
            removed_ids.append(row.get('ID', 'Unknown'))
        else:
            cleaned_rows.append(row)
            
    print(f"Removed {removed_count} problematic H-series records.")
    if removed_count > 0:
        print(f"Examples of removed IDs: {removed_ids[:5]} ... {removed_ids[-5:]}")
        
    # 4. Save cleaned data
    with open(MASTER_CSV, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(cleaned_rows)
        
    print(f"New row count: {len(cleaned_rows)}")
    print("Done. Please run merge_sabun.py again to update the JSON.")

if __name__ == '__main__':
    clean_data()
