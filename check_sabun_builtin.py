import csv
import sys
import datetime

def check_csv(file_path):
    print(f"Checking file: {file_path}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        
    print(f"Total rows: {len(rows)}")
    if len(rows) == 0:
        return
        
    columns = reader.fieldnames
    print(f"Columns: {columns}")
    
    required_cols = ['会議の名称', '発言者', '発言内容', '年度', '年月日']
    
    for col in required_cols:
        if col not in columns:
            print(f"ERROR: Missing required column '{col}'")
            continue
            
        missing = [r for r in rows if not r.get(col) or r.get(col).strip() == '']
        if missing:
            print(f"WARNING: Column '{col}' has {len(missing)} missing/empty values.")
            
    whitespace_issues = 0
    for i, r in enumerate(rows):
        for col in columns:
            val = r.get(col, '')
            if type(val) == str and (val.startswith(' ') or val.endswith(' ') or val.startswith('　') or val.endswith('　')):
                whitespace_issues += 1
    if whitespace_issues > 0:
        print(f"WARNING: Found {whitespace_issues} cells with leading/trailing spaces.")
        
    if '年月日' in columns:
        invalid_dates = set()
        for r in rows:
            date_str = r.get('年月日')
            if not date_str: continue
            try:
                datetime.datetime.strptime(date_str, '%Y/%m/%d')
            except ValueError:
                try:
                    datetime.datetime.strptime(date_str, '%Y-%m-%d')
                except ValueError:
                    invalid_dates.add(date_str)
        if invalid_dates:
            print(f"WARNING: Invalid date formats found: {invalid_dates}")
        else:
            print("All dates are in valid format ('YYYY/MM/DD' or 'YYYY-MM-DD').")

if __name__ == '__main__':
    check_csv(sys.argv[1])
