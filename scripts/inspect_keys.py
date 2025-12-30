import json

try:
    with open('public/data/gijiroku.json', 'r') as f:
        # Load only a bit or stream it
        # But standard json.load loads all. 200MB is fine for python usually.
        data = json.load(f)
        if isinstance(data, list) and len(data) > 0:
            print("Keys:", list(data[0].keys()))
            print("Sample:", data[0])
except Exception as e:
    print(e)
