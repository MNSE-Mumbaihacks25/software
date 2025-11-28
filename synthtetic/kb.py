import pandas as pd
import google.generativeai as genai
import json
import os
import time
from tqdm import tqdm # pip install tqdm
from dotenv import load_dotenv

load_dotenv()

# Use Gemini 1.5 Pro (Best for reasoning/writing)
# Note: If you have access to a newer beta model, change the model name here.
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-2.5-pro')

# ============================================================================
# CONFIG: The Products (Must match your Synthetic Data)
# ============================================================================
FUNDS_LIST = [
    "Parag Parikh Flexi Cap", "HDFC Flexi Cap", "SBI Small Cap", 
    "Axis Bluechip", "Nippon India Small Cap", "HDFC Balanced Advantage",
    "ICICI Pru Equity & Debt", "HDFC ELSS Tax Saver", "Kotak Liquid Fund"
]

# ============================================================================
# CORE FUNCTIONS
# ============================================================================

def generate_objection_entry(concept):
    """
    Creates a complete Markdown section for a single objection concept.
    Includes: Variations, The 'Why', and The Perfect Script.
    """
    prompt = f"""
    You are the World's Best Mutual Fund Sales Trainer for the Indian Market.
    
    Target Concept: "{concept}"
    
    Task 1: Generate 8 distinct "User Queries/Variations" in mixed Hinglish (Hindi+English).
    - Include casual phrasing (e.g., "Yaar market gir raha hai")
    - Include aggressive phrasing (e.g., "Returns are pathetic")
    - Include hesitant phrasing (e.g., "I am not sure...")
    - Include edge cases (e.g., unrelated reasons masking this objection)
    
    Task 2: Write the "Golden Response Script".
    - This is what the agent should say.
    - Use the "Feel, Felt, Found" technique or data-backed logic.
    - Keep it punchy and empathetic.
    
    Task 3: List 3 "Key Facts/Counters" to support the argument (e.g., historical data).

    Output strictly in this JSON format:
    {{
        "variations": ["string", "string", ...],
        "script": "string",
        "facts": ["string", "string", ...]
    }}
    """
    
    try:
        response = model.generate_content(prompt)
        clean_text = response.text.replace('```json', '').replace('```', '').strip()
        return json.loads(clean_text)
    except Exception as e:
        print(f"Error generating for {concept}: {e}")
        return None

def generate_fund_profile(fund_name):
    """
    Creates a 'Fact Sheet' for a specific fund for the RAG to reference.
    """
    prompt = f"""
    Create a concise Fact Sheet for "{fund_name}" (Indian Mutual Fund).
    Focus on: Risk Level, Ideal Investor Profile, and 1 USP (Unique Selling Point).
    Output strictly in JSON: {{ "risk": "string", "profile": "string", "usp": "string" }}
    """
    try:
        response = model.generate_content(prompt)
        clean_text = response.text.replace('```json', '').replace('```', '').strip()
        return json.loads(clean_text)
    except Exception as e:
        print(f"Error generating for {fund_name}: {e}")
        return None

# ============================================================================
# MAIN EXECUTION
# ============================================================================

def main():
    print("🚀 Starting Knowledge Base Generation...")
    
    # 1. Load Data & Extract Unique Objections
    df = pd.read_csv("sipbrain_data/interactions.csv")
    
    all_objs = []
    # Handle potential string representation of lists from CSV
    for item in df['objections_raised']:
        try:
            # If it's already a list, use it; if string, parse it
            if isinstance(item, list):
                all_objs.extend(item)
            else:
                all_objs.extend(json.loads(item.replace("'", '"'))) # Fix single quotes if present
        except:
            continue

    unique_objections = list(set(all_objs))
    print(f"Found {len(unique_objections)} unique objection concepts to process.")

    # 2. Initialize Markdown Content
    md_content = "# SIPBrain™ Master Knowledge Base\n\n"
    md_content += "This document contains objection handling strategies and product knowledge for the RAG Agent.\n\n"
    
    # 3. Process Objections (The Strategy Section)
    print("\n🧠 Phase 1: Generating Objection Strategies...")
    md_content += "## PART 1: OBJECTION HANDLING STRATEGIES\n\n"
    
    for obj in tqdm(unique_objections):
        data = generate_objection_entry(obj)
        if data:
            md_content += f"### Concept: {obj}\n\n"
            
            md_content += "**User Variations (Hinglish/Edge Cases):**\n"
            for v in data['variations']:
                md_content += f"- {v}\n"
            
            md_content += "\n**✅ Recommended Agent Script:**\n"
            md_content += f"> {data['script']}\n\n"
            
            md_content += "**💡 Key Counters & Facts:**\n"
            for f in data['facts']:
                md_content += f"- {f}\n"
            
            md_content += "\n---\n\n"
        
        time.sleep(1.5) # Avoid Rate Limits

    # 4. Process Funds (The Product Section)
    print("\n📈 Phase 2: Generating Fund Fact Sheets...")
    md_content += "## PART 2: FUND SPECIFIC KNOWLEDGE\n\n"
    
    for fund in tqdm(FUNDS_LIST):
        data = generate_fund_profile(fund)
        if data:
            md_content += f"### Product: {fund}\n"
            md_content += f"**Risk Profile:** {data['risk']}\n\n"
            md_content += f"**Ideal For:** {data['profile']}\n\n"
            md_content += f"**USP:** {data['usp']}\n\n"
            md_content += "---\n\n"
        time.sleep(1)

    # 5. Save to Markdown
    output_file = "sipbrain_data/knowledge_base.md"
    with open(output_file, "w", encoding="utf-8") as f:
        f.write(md_content)
    
    print(f"\n✅ Success! Knowledge Base saved to {output_file}")
    print("Next Step: Upload this .md file to Supabase or your Vector Store.")

if __name__ == "__main__":
    main()