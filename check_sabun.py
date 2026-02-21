import pandas as pd
import sys

def check_csv(file_path):
    print(f"Checking file: {file_path}")
    try:
        df = pd.read_csv(file_path)
    except Exception as e:
        print(f"Failed to read CSV: {e}")
        return

    print(f"Total rows: {len(df)}")
    
    # Check for missing values in required columns
    required_cols = ['会議の名称', '発言者', '発言内容', '年度', '年月日']
    for col in required_cols:
        if col in df.columns:
            missing_count = df[col].isnull().sum()
            if missing_count > 0:
                print(f"WARNING: Column '{col}' has {missing_count} missing values.")
                # Print first few rows with missing values
                print(df[df[col].isnull()].head(3))
        else:
            print(f"ERROR: Missing required column '{col}'")

    # Check for data types or anomalies
    if '年度' in df.columns:
        print(f"Unique years: {df['年度'].unique()}")
    
    if '年月日' in df.columns:
        # Check invalid dates
        try:
            pd.to_datetime(df['年月日'])
            print("All dates are in valid format.")
        except Exception as e:
            print("WARNING: Some dates are in invalid format.")
            # Find which ones
            invalid_dates = pd.to_datetime(df['年月日'], errors='coerce')
            print(df[invalid_dates.isnull()]['年月日'].unique())

    # Check for empty strings in Utterance
    if '発言内容' in df.columns:
        empty_strings = df[df['発言内容'].astype(str).str.strip() == '']
        if len(empty_strings) > 0:
            print(f"WARNING: Column '発言内容' has {len(empty_strings)} empty string values.")

if __name__ == '__main__':
    check_csv('/Users/yuki/Documents/Antigravity/GIJIMIE2/sabun20260220.csv')
