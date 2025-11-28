import pandas as pd
from supabase import create_client, Client
import os
import json
from dotenv import load_dotenv

# 1. SETUP
load_dotenv()
url = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL") # Try both
key = os.getenv("SUPABASE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

if not url or not key:
    raise ValueError("❌ Missing credentials. Check your .env file.")

print(f"🔌 Connecting to Supabase...")
supabase: Client = create_client(url, key)

def upload_csv(file_path, table_name):
    print(f"\n🚀 Processing {table_name} from {file_path}...")
    
    if not os.path.exists(file_path):
        print(f"   ⚠️ File not found: {file_path}")
        return

    # Chunk size prevents HTTP timeouts
    chunk_size = 5000 
    total_rows = 0
    
    for chunk in pd.read_csv(file_path, chunksize=chunk_size):
        
        # 1. Handle Missing Values (NaN -> None)
        chunk = chunk.where(pd.notnull(chunk), None)
        records = chunk.to_dict(orient='records')
        
        # 2. DATA CLEANING & TYPE CASTING (The Critical Part)
        cleaned_records = []
        for row in records:
            try:
                # --- TABLE SPECIFIC FIXES ---
                
                # AGENTS: Parse JSON strings back to Objects
                if table_name == 'agents':
                    if isinstance(row.get('languages'), str):
                        row['languages'] = json.loads(row['languages'])
                    if isinstance(row.get('performance_stats'), str):
                        row['performance_stats'] = json.loads(row['performance_stats'])

                # INTERACTIONS: Parse JSON strings
                if table_name == 'interactions':
                    if isinstance(row.get('objections_raised'), str):
                        row['objections_raised'] = json.loads(row['objections_raised'])
                    # Ensure dates are strings
                    row['date'] = str(row['date'])

                # TRANSACTIONS: Ensure types
                if table_name == 'transactions':
                    row['transaction_date'] = str(row['transaction_date'])
                    # Ensure boolean is actual boolean, not string "False"
                    if row.get('nfo_participation') == 'False': row['nfo_participation'] = False
                    if row.get('nfo_participation') == 'True': row['nfo_participation'] = True

                cleaned_records.append(row)
                
            except Exception as e:
                print(f"⚠️ Skipping bad row in {table_name}: {e}")
                continue

        # 3. UPLOAD CHUNK
        try:
            if cleaned_records:
                supabase.table(table_name).upsert(cleaned_records).execute()
                total_rows += len(cleaned_records)
                print(f"   ✅ Uploaded {total_rows} rows...", end='\r')
        except Exception as e:
            print(f"\n   ❌ Error uploading chunk: {e}")
            return # Stop on schema error so you can fix it

    print(f"\n   ✨ Finished {table_name}: {total_rows} total rows.")

# ==========================================
# EXECUTION ORDER (CRITICAL FOR FOREIGN KEYS)
# ==========================================
base_path = "sipbrain_data"

# 1. Parents (Must exist first)
upload_csv(f"{base_path}/agents.csv", "agents")
upload_csv(f"{base_path}/investors.csv", "investors")

# 2. Children (Reference parents)
upload_csv(f"{base_path}/interactions.csv", "interactions")
upload_csv(f"{base_path}/transactions.csv", "transactions")

print("\n🎉 FINAL MIGRATION SUCCESSFUL.")