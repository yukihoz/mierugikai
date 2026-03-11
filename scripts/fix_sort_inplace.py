import csv
import sys
import os

csv.field_size_limit(sys.maxsize)

MASTER_CSV = '/Users/yuki/Documents/Antigravity/GIJIMIE2/data/combined_master_20260131.csv'
TEMPLATE_CSV = '/Users/yuki/Documents/Antigravity/SCRAPER/chuo_scraper/chuo_minutes_financial_audit_r7_formatted.csv'
OUTPUT_CSV = '/Users/yuki/Documents/Antigravity/GIJIMIE2/data/combined_master_20260131_fixed.csv'

def normalize(text):
    return text.strip() if text else ""

def main():
    print(f"Loading template order from {TEMPLATE_CSV}")
    template_order = {}
    
    # Use utf-8-sig to handle BOM which was corrupting the first column name
    with open(TEMPLATE_CSV, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            meeting = normalize(row.get('会議の名称') or row.get('\ufeff会議の名称', ''))
            speaker = normalize(row.get('発言者', ''))
            body = normalize(row.get('発言内容', ''))
            
            # Substring to 50 chars to prevent minor newline differences from breaking it
            body = body[:50]
            
            key = (meeting, speaker, body)
            if key not in template_order:
                template_order[key] = []
            template_order[key].append(i)

    print(f"Reading master from {MASTER_CSV}")
    master_rows = []
    target_indices = []
    target_rows = []
    
    with open(MASTER_CSV, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        for i, row in enumerate(reader):
            master_rows.append(row)
            meeting = normalize(row.get('会議の名称', ''))
            if '令和7年　決算特別委員会' in meeting:
                target_indices.append(i)
                target_rows.append(row)
                
    print(f"Found {len(target_rows)} target rows at indices {min(target_indices)} to {max(target_indices)}.")
    
    temp_order_copy = {k: list(v) for k, v in template_order.items()}
    unmatched = []
    
    def get_sort_key(row):
        meeting = normalize(row.get('会議の名称', ''))
        speaker = normalize(row.get('発言者', ''))
        body = normalize(row.get('発言内容', ''))
        body = body[:50]
        
        key = (meeting, speaker, body)
        
        if key in temp_order_copy and len(temp_order_copy[key]) > 0:
            return temp_order_copy[key].pop(0)
        else:
            unmatched.append(row)
            return 999999999 
            
    row_sort_keys = []
    for row in target_rows:
        row_sort_keys.append((get_sort_key(row), row))
        
    row_sort_keys.sort(key=lambda x: x[0])
    sorted_target_rows = [x[1] for x in row_sort_keys]
    
    print(f"Sorted {len(sorted_target_rows)} target rows. Unmatched: {len(unmatched)}")
    
    if unmatched:
        print("First 3 unmatched:")
        for r in unmatched[:3]:
            print(r.get('会議の名称'), r.get('発言者'), r.get('発言内容', '')[:50])
            
    for i, idx in enumerate(target_indices):
        master_rows[idx] = sorted_target_rows[i]
        
    print(f"Writing to {OUTPUT_CSV}")
    with open(OUTPUT_CSV, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(master_rows)
        
    print("Done")

if __name__ == '__main__':
    main()
