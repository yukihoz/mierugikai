import csv
import sys
import os

input_file = 'data/combined_master_20260131.csv'
output_file = 'data/combined_master_20260131_deduped.csv'

def deduplicate():
    print(f"Reading {input_file}...")
    
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)
        
    print(f"Total rows before: {len(rows)}")
    
    # We want to deduplicate ONLY T-series records based on (会議の名称, 発言者, 発言内容)
    # H-series records are kept as-is (they might have intentional duplicates or we trust them).
    # But usually, it's safer to deduplicate all, or just T-series if specified.
    # The prompt says "T系のデータで、同じレコードがいくつか入ってない？確認したうえで一旦削除してIDを振り直して"
    # So we will separate H-series and T-series.
    
    h_rows = [r for r in rows if r['ID'].startswith('H')]
    t_rows = [r for r in rows if r['ID'].startswith('T')]
    
    seen = set()
    deduped_t_rows = []
    
    for r in t_rows:
        key = (r.get('会議の名称', ''), r.get('発言者', ''), r.get('発言内容', ''))
        if key not in seen:
            seen.add(key)
            deduped_t_rows.append(r)
            
    print(f"T-series rows before: {len(t_rows)}, after: {len(deduped_t_rows)}")
    
    # Re-assign IDs for deduplicated T-series
    for i, r in enumerate(deduped_t_rows):
        r['ID'] = f"T{(i+1):08d}"
        
    final_rows = h_rows + deduped_t_rows
    
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(final_rows)
        
    print(f"Total rows after: {len(final_rows)}")
    print(f"Saved to {output_file}")
    
    # Rename files to make output the new master
    os.rename(input_file, input_file + '.bak')
    os.rename(output_file, input_file)
    print("Replaced master CSV file. Original backed up.")

if __name__ == '__main__':
    deduplicate()
