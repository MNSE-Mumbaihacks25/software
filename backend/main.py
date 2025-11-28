import os
import json
import random
import asyncio
from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from groq import Groq
import google.generativeai as genai
from dotenv import load_dotenv
from admin import router as admin_router 

load_dotenv()

app = FastAPI()

# 1. ROBUST CORS SETUP (The Fix)
# We explicitly allow both localhost and 127.0.0.1 to prevent browser blocking
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(admin_router)

# 2. CLIENTS
url = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
key = os.getenv("SUPABASE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
gemini_model = genai.GenerativeModel('gemini-2.5-flash')

# =================================================================
# 🕵️ AGENT ENDPOINTS (Field App)
# =================================================================

@app.get("/agent/{agent_id}/leads")
async def get_my_leads(agent_id: str):
    """
    Fetches leads assigned to a specific agent. 
    """
    # Fetch from DB
    res = supabase.table("investors").select("*").eq("assigned_agent_id", agent_id).execute()
    leads = res.data
    
    # Enrich with AI Hooks
    enriched = []
    for lead in leads:
        hook = "General Follow-up"
        if lead['age'] > 50: hook = "🛡️ Capital Protection Strategy"
        elif "Gig" in lead['occupation']: hook = "💧 High Liquidity Pitch"
        elif "High" in lead['risk_appetite']: hook = "🚀 Small Cap Multiplier Pitch"
        elif "Business" in lead['occupation']: hook = "💼 Tax Saver (Section 54EC)"
        
        enriched.append({
            **lead,
            "ai_strategy_tag": hook,
            "match_score": 95 
        })
        
    return enriched

# --- THE MISSING ENDPOINT (Restored) ---
# ... (Keep existing imports and setup) ...

# =================================================================
# 🕵️ DEEP DIVE ANALYSIS (Cached & Robust)
# =================================================================

@app.get("/agent/analyze-lead/{investor_id}")
async def analyze_lead_strategy(investor_id: str):
    # 1. Fetch Investor Profile
    lead = supabase.table("investors").select("*").eq("investor_id", investor_id).single().execute().data
    if not lead: raise HTTPException(status_code=404, detail="Lead not found")

    # 2. Fetch Transactions (For Deep Dive UI)
    tx_res = supabase.table("transactions").select("*").eq("investor_id", investor_id).order("transaction_date", desc=True).limit(20).execute()
    transactions = tx_res.data

    # 3. CHECK CACHE (Consistency Fix)
    if lead.get('ai_analysis_cache'):
        print(f"⚡ Returning Cached Analysis for {lead['name']}")
        return {
            "lead_details": lead,
            "transactions": transactions, # Sending real data now
            "analysis": lead['ai_analysis_cache']
        }

    # 4. GENERATE NEW ANALYSIS (If not cached)
    history_str = json.dumps(transactions[:5], indent=2) if transactions else "No recent history."
    
    prompt = f"""
    Analyze Lead: {lead['name']} ({lead['occupation']}, Risk: {lead['risk_appetite']}, City: {lead['city']}).
    History: {history_str}
    
    Task:
    1. Create a "Financial Persona" tag (e.g. "Cautious Saver").
    2. Write a "Key Insight" (2 sentences max).
    3. Recommend TOP 3 Products.
       - Product 1 (The Winner): Best fit.
       - Product 2 (Alternative): Safer option.
       - Product 3 (Wildcard): Growth option.
    4. Write a "Golden Opening Script" for Product 1.
    
    Output JSON:
    {{
        "personality_tag": "String",
        "key_insight": "String",
        "top_recommendations": [
            {{ "name": "Fund Name", "type": "Equity/Debt", "reason": "Why?" }},
            {{ "name": "Fund Name", "type": "Equity/Debt", "reason": "Why?" }},
            {{ "name": "Fund Name", "type": "Equity/Debt", "reason": "Why?" }}
        ],
        "opening_pitch": "String"
    }}
    """
    
    try:
        # Simulating "Thinking"
        await asyncio.sleep(2) 
        
        ai_res = gemini_model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
        analysis = json.loads(ai_res.text)
        
        # 5. SAVE TO DB (Cache it)
        supabase.table("investors").update({"ai_analysis_cache": analysis}).eq("investor_id", investor_id).execute()
        
        return {
            "lead_details": lead,
            "transactions": transactions,
            "analysis": analysis
        }
    except Exception as e:
        print(f"Analysis Failed: {e}")
        return {"error": "AI Service Unavailable"}
# =================================================================
# ⚡ COCKPIT SOCKET
# =================================================================

SYSTEM_PROMPT = """
Analyze the text. Return JSON:
{ "type": "objection" | "fact" | "none", "title": "...", "content": "...", "data": {} }
"""

@app.websocket("/ws/cockpit")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            
            # Fast Trigger
            if "fd" in data.lower() or "fixed deposit" in data.lower():
                await websocket.send_json({
                    "id": str(random.randint(1000,9999)),
                    "type": "fact",
                    "title": "FD vs Mutual Fund",
                    "content": "FDs are taxed. MFs are efficient.",
                    "data": {"table": {"FD Post-Tax": "4.8%", "Hybrid": "11.2%"}}
                })
                continue

            # Smart Trigger
            if len(data) > 15:
                completion = groq_client.chat.completions.create(
                    messages=[{"role": "system", "content": SYSTEM_PROMPT}, {"role": "user", "content": data}],
                    model="meta-llama/llama-4-maverick-17b-128e-instruct",
                    response_format={"type": "json_object"}
                )
                ai_resp = json.loads(completion.choices[0].message.content)
                if ai_resp['type'] != 'none':
                    await websocket.send_json({ "id": str(random.randint(1000,9999)), **ai_resp })

    except Exception as e:
        print(f"WS Error: {e}")

@app.get("/")
def home():
    return {"status": "SIPBrain Neural Core Online"}