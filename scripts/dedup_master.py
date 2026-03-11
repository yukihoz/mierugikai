import csv
import sys
import collections
import os

# Increase CSV field size limit
csv.field_size_limit(sys.maxsize)

MASTER_PATH = '/Users/yuki/Documents/Antigravity/GIJIMIE2/data/combined_master_20260131.csv'
BACKUP_PATH = '/Users/yuki/Documents/Antigravity/GIJIMIE2/data/combined_master_20260131.csv.dup_backup'
OUTPUT_PATH = '/Users/yuki/Documents/Antigravity/GIJIMIE2/data/combined_master_20260131.csv'

def main():
    print(f"Reading master file from: {MASTER_PATH}")
    
    if not os.path.exists(MASTER_PATH):
        print(f"Error: Master file not found at {MASTER_PATH}")
        return

    # Create a backup just in case
    import shutil
    print(f"Creating backup at: {BACKUP_PATH}")
    shutil.copy2(MASTER_PATH, BACKUP_PATH)

    # 1. Read all rows and group by composite key
    seen = collections.defaultdict(list)
    master_fieldnames = []
    
    try:
        with open(MASTER_PATH, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            master_fieldnames = list(reader.fieldnames)
            for row in reader:
                # Key: Meeting Name, Speaker, Content
                key = (row.get('会議の名称', ''), row.get('発言者', ''), row.get('発言内容', ''))
                seen[key].append(row)
    except Exception as e:
        print(f"Error reading master file: {e}")
        return

    # 2. Extract deduplicated rows
    deduped_rows = []
    removed_count = 0
    
    for key, rows in seen.items():
        if len(rows) == 1:
            deduped_rows.append(rows[0])
        else:
            # We have duplicates. Keep the one with the smallest ID structurally.
            # Usually H-IDs come before T-IDs, but we can sort by 'ID' conceptually or extract the number.
            # To be safe and deterministic, let's sort purely by the ID string.
            rows.sort(key=lambda r: r.get('ID', ''))
            
            # Keep the first, discard the rest
            deduped_rows.append(rows[0])
            removed_count += (len(rows) - 1)

    print(f"Total rows before: {sum(len(v) for v in seen.values())}")
    print(f"Total unique rows after: {len(deduped_rows)}")
    print(f"Removed duplicates: {removed_count}")

    # 3. Write deduplicated rows back to master
    # We should restore original order conceptually, but dictionary iteration preserves insertion order (to the first seen).
    # This is fine as 'seen' dict keeps insertion order of the first occurrence in Python 3.7+
    
    # Sort them back by ID to roughly maintain chronological/original order
    deduped_rows.sort(key=lambda r: r.get('ID', ''))

    print(f"Writing deduplicated master to: {OUTPUT_PATH}")
    try:
        with open(OUTPUT_PATH, 'w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=master_fieldnames)
            writer.writeheader()
            writer.writerows(deduped_rows)
        print("Deduplication complete.")
    except Exception as e:
        print(f"Error writing deduplicated file: {e}")

if __name__ == "__main__":
    main()
