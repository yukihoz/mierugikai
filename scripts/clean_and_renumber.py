import json
import csv
import os
import collections
from datetime import datetime

INPUT_CSV = "data/master_chuo_20260427.csv"
CLEANED_CSV = "data/master_chuo_cleaned.csv"
FINAL_MASTER_CSV = "data/master_chuo_20260427.csv"
PREVIEW_JSON = "public/data/gijiroku_preview.json"
PUBLIC_JSON = "public/data/gijiroku.json"

def normalize_text(text):
    if not text:
        return ""
    return "".join(text.split())

def main():
    print(f"Loading master CSV from: {INPUT_CSV}")
    if not os.path.exists(INPUT_CSV):
        print(f"Error: {INPUT_CSV} not found.")
        return

    records = []
    fieldnames = []
    with open(INPUT_CSV, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        fieldnames = list(reader.fieldnames)
        for idx, row in enumerate(reader):
            row["_orig_idx"] = idx
            records.append(row)

    print(f"Total raw records loaded: {len(records):,}")

    # Group by meeting (title) to preserve meeting structure
    meetings = collections.defaultdict(list)
    for r in records:
        title = r.get("title", "").strip()
        meetings[title].append(r)

    print(f"Total unique meetings: {len(meetings):,}")

    consecutive_dup_count = 0
    block_dup_count = 0
    cleaned_records = []

    # Deduplicate within each meeting
    for title, m_records in meetings.items():
        # Pass 1: consecutive identical duplicates
        pass1 = []
        for r in m_records:
            if pass1:
                prev = pass1[-1]
                if (prev.get("speaker") == r.get("speaker") and 
                    (prev.get("body") or "").strip() == (r.get("body") or "").strip()):
                    consecutive_dup_count += 1
                    continue
            pass1.append(r)

        # Pass 2: duplicate statements (> 30 characters) within the same meeting (scraping/merge duplicate blocks)
        pass2 = []
        seen_long_statements = set()
        for r in pass1:
            speaker = (r.get("speaker") or "").strip()
            body = (r.get("body") or "").strip()

            if len(body) > 30:
                key = (speaker, body)
                if key in seen_long_statements:
                    block_dup_count += 1
                    continue
                seen_long_statements.add(key)

            pass2.append(r)

        cleaned_records.extend(pass2)

    print("\n--- Deduplication Summary ---")
    print(f"Consecutive identical duplicates removed: {consecutive_dup_count:,}")
    print(f"Duplicate blocks/statements (>30 chars) removed: {block_dup_count:,}")
    print(f"Total records remaining: {len(cleaned_records):,} (Reduced by {len(records) - len(cleaned_records):,})")

    # Sort records:
    # 1. Date descending (newest meetings first), or by year/date
    # 2. Within the same meeting/date, preserve original sequence (_orig_idx)
    def parse_date_sort_key(r):
        date_str = r.get("date", "").strip()
        year_str = r.get("year", "").strip()
        # Parse date if possible
        try:
            if date_str:
                parts = [int(p) for p in date_str.replace("-", "/").split("/") if p.isdigit()]
                if len(parts) == 3:
                    return (-parts[0], -parts[1], -parts[2], r["_orig_idx"])
        except Exception:
            pass
        
        try:
            y = int(year_str) if year_str.isdigit() else 2000
            return (-y, 0, 0, r["_orig_idx"])
        except Exception:
            return (0, 0, 0, r["_orig_idx"])

    print("\nSorting records chronologically...")
    cleaned_records.sort(key=parse_date_sort_key)

    # Renumber IDs cleanly: C00000001, C00000002, ...
    print("Renumbering IDs sequentially...")
    clean_fieldnames = [fn for fn in fieldnames if fn != "_orig_idx"]
    if "id" not in clean_fieldnames and "\ufeffid" in clean_fieldnames:
        clean_fieldnames[clean_fieldnames.index("\ufeffid")] = "id"

    final_rows = []
    for idx, r in enumerate(cleaned_records, 1):
        new_id = f"C{idx:08d}"
        r["id"] = new_id
        if "\ufeffid" in r:
            del r["\ufeffid"]
        if "_orig_idx" in r:
            del r["_orig_idx"]
        final_rows.append(r)

    # Write cleaned CSV
    print(f"Writing cleaned master CSV to: {CLEANED_CSV}...")
    with open(CLEANED_CSV, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=clean_fieldnames)
        writer.writeheader()
        writer.writerows(final_rows)

    # Overwrite master CSV with cleaned version
    print(f"Overwriting {FINAL_MASTER_CSV} with clean dataset...")
    import shutil
    shutil.copy2(CLEANED_CSV, FINAL_MASTER_CSV)

    print(f"Successfully processed {len(final_rows):,} records with IDs C00000001 - C{len(final_rows):08d}")

if __name__ == "__main__":
    main()
