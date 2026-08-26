import csv
import json
import os
import sys

# Increase CSV field size limit
csv.field_size_limit(sys.maxsize)

MASTER_CSV = "data/master_chuo_20260427.csv"
PUBLIC_JSON = "public/data/gijiroku.json"
PREVIEW_JSON = "public/data/gijiroku_preview.json"
OUTPUT_DIR = "public/data"
CHUNK_SIZE = 10000

FIELDS = ["id", "title", "speaker", "category", "body", "year", "date", "type", "tags", "is_unofficial"]

def format_body(raw_body):
    if not raw_body:
        return ""
    normalized = raw_body.replace("\r\n", "\n")
    return "\n\n".join([line for line in normalized.split("\n") if line.strip()] or [normalized])

def main():
    print(f"Processing data from: {MASTER_CSV}")
    if not os.path.exists(MASTER_CSV):
        print(f"Error: {MASTER_CSV} does not exist.")
        return

    records = []
    with open(MASTER_CSV, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for idx, row in enumerate(reader):
            # Parse Year
            year_val = row.get("year") or row.get("年度")
            year = None
            if year_val:
                try:
                    year = int(year_val)
                except ValueError:
                    pass

            title = (row.get("title") or row.get("会議の名称") or "").strip()
            speaker = (row.get("speaker") or row.get("発言者") or "").strip()
            category = (row.get("category") or row.get("人分類") or "その他").strip()
            if not category or category == "0":
                category = "その他"

            body = format_body(row.get("body") or row.get("発言内容") or "")
            date_str = (row.get("date") or row.get("年月日") or row.get("月日") or "").strip()
            item_type = (row.get("type") or row.get("委員会/本会議名称") or row.get("委員会名称") or "").strip()
            tags = (row.get("tags") or "").strip()
            
            is_unofficial_val = row.get("is_unofficial", "")
            is_unofficial = is_unofficial_val in ["1", "true", "True", True]

            item_id = row.get("id") or f"C{idx+1:08d}"

            records.append({
                "id": item_id,
                "title": title,
                "speaker": speaker,
                "category": category,
                "body": body,
                "year": year,
                "date": date_str,
                "type": item_type,
                "tags": tags,
                "is_unofficial": is_unofficial
            })

    print(f"Loaded and normalized {len(records):,} records.")

    # 1. Write full Preview & Public JSONs
    print("Writing preview and public JSONs...")
    with open(PREVIEW_JSON, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False)
    print(f"Preview JSON size: {os.path.getsize(PREVIEW_JSON)/(1024*1024):.2f} MB")

    public_records = [r for r in records if not r["is_unofficial"]]
    with open(PUBLIC_JSON, "w", encoding="utf-8") as f:
        json.dump(public_records, f, ensure_ascii=False)
    print(f"Public JSON size: {os.path.getsize(PUBLIC_JSON)/(1024*1024):.2f} MB")

    # 2. Write optimized chunk files
    def write_chunks(data_list, prefix):
        # Clean existing chunks
        for old_f in os.listdir(OUTPUT_DIR):
            if old_f.startswith(f"{prefix}_part_") and old_f.endswith(".json"):
                os.remove(os.path.join(OUTPUT_DIR, old_f))

        total_chunks = (len(data_list) + CHUNK_SIZE - 1) // CHUNK_SIZE
        print(f"Writing {total_chunks} compact chunk files for '{prefix}' (chunk size: {CHUNK_SIZE})...")

        for i in range(total_chunks):
            start = i * CHUNK_SIZE
            end = start + CHUNK_SIZE
            chunk_records = data_list[start:end]

            # Convert to compact tuple format: [ [id, title, speaker, category, body, year, date, type, tags, is_unofficial], ... ]
            compact_data = {
                "fields": FIELDS,
                "rows": [
                    [
                        r["id"],
                        r["title"],
                        r["speaker"],
                        r["category"],
                        r["body"],
                        r["year"],
                        r["date"],
                        r["type"],
                        r["tags"],
                        r["is_unofficial"]
                    ]
                    for r in chunk_records
                ]
            }

            out_filename = os.path.join(OUTPUT_DIR, f"{prefix}_part_{i}.json")
            with open(out_filename, "w", encoding="utf-8") as f:
                json.dump(compact_data, f, ensure_ascii=False, separators=(',', ':'))
            
            size_mb = os.path.getsize(out_filename) / (1024 * 1024)
            print(f"  {prefix}_part_{i}.json ({len(chunk_records)} rows): {size_mb:.2f} MB")

    write_chunks(public_records, "gijiroku")
    write_chunks(records, "gijiroku_preview")

    print("\nData processing and chunk generation completed successfully!")

if __name__ == "__main__":
    main()
