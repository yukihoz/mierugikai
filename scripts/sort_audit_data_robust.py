import csv
import sys
import os
import shutil

csv.field_size_limit(sys.maxsize)

BAK_CSV = '/Users/yuki/Documents/Antigravity/GIJIMIE2/data/combined_master_20260131.csv.bak'
MASTER_CSV = '/Users/yuki/Documents/Antigravity/GIJIMIE2/data/combined_master_20260131.csv'
TEMPLATE_CSV = '/Users/yuki/Documents/Antigravity/SCRAPER/chuo_scraper/chuo_minutes_financial_audit_r7_formatted.csv'

def normalize(text):
    return text.strip() if text else ""

def normalize_body(text):
    # Remove all whitespace/newlines for extremely strict text matching
    if not text:
        return ""
    import re
    return re.sub(r'\s+', '', text)

def main():
    print(f"Loading template order from {TEMPLATE_CSV}")
    template_order = []
    
    with open(TEMPLATE_CSV, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            meeting = normalize(row.get('会議の名称') or row.get('\ufeff会議の名称', ''))
            speaker = normalize(row.get('発言者', ''))
            body = normalize_body(row.get('発言内容', ''))
            
            key = (meeting, speaker, body)
            template_order.append(key)
            
    print(f"Loaded {len(template_order)} template rows.")

    print(f"Reading master backup from {BAK_CSV}")
    master_rows = []
    target_indices = []
    target_rows = []
    
    with open(BAK_CSV, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        for i, row in enumerate(reader):
            master_rows.append(row)
            meeting = normalize(row.get('会議の名称', ''))
            if '令和7年　決算特別委員会' in meeting:
                target_indices.append(i)
                target_rows.append(row)
                
    print(f"Found {len(target_rows)} target rows in the backup database.")
    
    # We will build a pool of available database rows
    available_rows = {}
    for row in target_rows:
        meeting = normalize(row.get('会議の名称', ''))
        speaker = normalize(row.get('発言者', ''))
        body = normalize_body(row.get('発言内容', ''))
        
        key = (meeting, speaker, body)
        if key not in available_rows:
            available_rows[key] = []
        available_rows[key].append(row)
        
    print(f"Mapped into {len(available_rows)} unique string blocks.")
    
    # Now we reconstruct the list in exact template order
    sorted_target_rows = []
    unmatched_template = []
    
    for t_key in template_order:
        if t_key in available_rows and len(available_rows[t_key]) > 0:
            # Pop the first matching DB row
            matched_row = available_rows[t_key].pop(0)
            sorted_target_rows.append(matched_row)
        else:
            unmatched_template.append(t_key)
            
    # Any leftovers in available_rows that weren't popped means the template didn't have them
    leftovers = []
    for k, vlist in available_rows.items():
        for leftover_row in vlist:
            leftovers.append(leftover_row)
            
    print(f"Successfully sorted {len(sorted_target_rows)} rows based on template.")
    print(f"Unmatched template lines: {len(unmatched_template)}")
    print(f"Leftover DB rows not in template: {len(leftovers)}")
    
    if len(leftovers) > 0:
         print("Warning: Adding leftovers to the very end of the sorted targets to not lose data.")
         sorted_target_rows.extend(leftovers)
         
    if len(sorted_target_rows) != len(target_indices):
         print(f"ERROR: Expected {len(target_indices)} sorted rows, but got {len(sorted_target_rows)}. Cannot proceed.")
         return
         
    # Place sorted target rows back into their original spatial locations in the master file
    for i, idx in enumerate(target_indices):
        master_rows[idx] = sorted_target_rows[i]
        
    print(f"Writing corrected master file to {MASTER_CSV}")
    with open(MASTER_CSV, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(master_rows)
        
    print("Database order restoration complete!")

if __name__ == '__main__':
    main()
