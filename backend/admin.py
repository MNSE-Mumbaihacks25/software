import os
import io
import json
import random
import datetime
from decimal import Decimal
from fastapi import APIRouter, HTTPException, Body
from fastapi.responses import Response
from supabase import create_client, Client
import google.generativeai as genai
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from langchain_groq import ChatGroq
from langchain_community.utilities import SQLDatabase
from langchain_community.agent_toolkits import create_sql_agent
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/admin", tags=["admin"])

# 1. CLIENTS
url = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
key = os.getenv("SUPABASE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
gemini_model = genai.GenerativeModel('gemini-2.5-flash')

# 2. SQL AGENT (THE BRAIN)
# Strict Schema definitions to prevent hallucinations
SCHEMA_HINTS = """
You are a Senior Data Analyst for a Fintech CRM. You have direct access to the PostgreSQL database.

--- 1. THE DATABASE SCHEMA ---
Table: 'agents'
- agent_id (PK), name, specialization, performance_score, languages (array).
- This table contains your Sales Team.

Table: 'investors'
- investor_id (PK), name, city, occupation, risk_appetite, sip_capacity, assigned_agent_id (FK to agents).
- This table contains Leads/Clients.
- RELATIONSHIP: An investor is assigned to ONE agent via 'assigned_agent_id'.

Table: 'interactions'
- interaction_id (PK), investor_id (FK), agent_id (FK), outcome ('Converted', 'Rejected', 'Follow-Up'), date.
- This logs every call made.

Table: 'transactions'
- txn_id (PK), investor_id (FK), amount (Revenue), transaction_date, status ('Success', 'Failed').
- This logs actual money received.

--- 2. CRITICAL BUSINESS LOGIC ---
1. REVENUE CALCULATION:
   - Always SUM(amount) from 'transactions'.
   - MUST filter by status = 'Success'. Ignored failed transactions.
   - To attribute revenue to an Agent: JOIN transactions -> investors -> agents.

2. AGENT PERFORMANCE:
   - "Best Agent" can be by Revenue OR Conversions. Prefer Revenue unless asked otherwise.
   - "Conversion Rate" = (Converted Interactions / Total Interactions) * 100.

3. DATE HANDLING:
   - Use PostgreSQL date functions (date_trunc, current_date).
   - "Trends" = GROUP BY transaction_date ORDER BY transaction_date.

4. CHARTING INSTRUCTIONS:
   - If the user asks for a chart/trend/comparison, ensure the SQL selects TWO columns: (Label, Value).
   - Example: SELECT agent_name, sum_revenue ...
"""

try:
    db = SQLDatabase.from_uri(os.getenv("SUPABASE_DB_URL"))
    llm_sql = ChatGroq(model="llama-3.3-70b-versatile", api_key=os.getenv("GROQ_API_KEY"), temperature=0)
    sql_agent = create_sql_agent(
        llm=llm_sql,
        db=db,
        agent_type="openai-tools",
        verbose=True,
        handle_parsing_errors=True,
        prefix=SCHEMA_HINTS
    )
    print("✅ Admin SQL Brain Online")
except Exception as e:
    print(f"⚠️ SQL Agent Failed: {e}")
    sql_agent = None
# =================================================================
# 🧠 AI DISPATCHER (WITH LANGUAGE LOGIC)
# =================================================================

@router.post("/trigger-assignment")
async def trigger_assignment():
    # 1. GET WORKLOAD
    assigned_res = supabase.table("investors").select("assigned_agent_id").not_.is_("assigned_agent_id", "null").execute()
    global_workload = {}
    for row in assigned_res.data:
        aid = row['assigned_agent_id']
        global_workload[aid] = global_workload.get(aid, 0) + 1

    # 2. FETCH UNASSIGNED LEADS
    leads = supabase.table("investors").select("*").is_("assigned_agent_id", "null").limit(15).execute().data
    
    if not leads: return {"status": "All leads assigned."}

    agents = supabase.table("agents").select("*").limit(20).execute().data
    logs = []
    batch_workload = {}

    for lead in leads:
        candidates = []
        
        for agent in agents:
            score = 60
            strengths = [] # Collect reasons for AI Context
            
            # --- A. LANGUAGE MATCH (CRITICAL) ---
            # Check if lead's language is in agent's language list
            # Handle potential string/list formats safely
            agent_langs = agent.get('languages', [])
            if isinstance(agent_langs, str):
                 try: agent_langs = json.loads(agent_langs.replace("'", '"'))
                 except: agent_langs = []
            
            # Normalize for comparison
            lead_lang = lead.get('preferred_language', 'English')
            
            if lead_lang in agent_langs or 'English' in agent_langs: # English is universal fallback
                score += 15
                strengths.append(f"Speaks {lead_lang}")
            else:
                score -= 50 # Huge penalty if language mismatch
            
            # --- B. SPECIALIZATION ---
            if agent.get('specialization') in lead.get('occupation', ''): 
                score += 25
                strengths.append(f"Expert in {agent['specialization']}")
            
            # --- C. PERFORMANCE ---
            perf = agent.get('performance_score', 0) or 0
            score += int(perf * 5)
            
            # --- D. WORKLOAD ---
            current_db_load = global_workload.get(agent['agent_id'], 0)
            current_batch_load = batch_workload.get(agent['name'], 0)
            total_load = current_db_load + current_batch_load
            
            if total_load >= 4: 
                score -= 100 # Burnout prevention
            else: 
                score -= (total_load * 15)

            if total_load == 0: 
                score += 10
                strengths.append("Available Now")

            candidates.append({
                "id": agent['agent_id'], 
                "name": agent['name'], 
                "score": max(5, min(99, score)), 
                "load": total_load,
                "context": ", ".join(strengths)
            })
        
        # Sort
        candidates.sort(key=lambda x: x['score'], reverse=True)
        top_match = candidates[0]
        runner_up = candidates[1] if len(candidates) > 1 else top_match
        
        # --- GENAI DECISION ---
        prompt = f"""
        Act as Sales Manager. Assign Lead.
        
        LEAD: {lead['name']} 
        - Language: {lead.get('preferred_language')}
        - Job: {lead['occupation']}
        - Capacity: ₹{lead.get('sip_capacity')}
        
        TOP CANDIDATES:
        1. {top_match['name']} (Score: {top_match['score']}%)
           - Strengths: {top_match['context']}
           - Load: {top_match['load']}
           
        2. {runner_up['name']} (Score: {runner_up['score']}%)
           - Strengths: {runner_up['context']}
           - Load: {runner_up['load']}
        
        RULES:
        - Language Match is PRIORITY. Do not assign if language missing.
        - If #1 is overloaded (>3 leads), pick #2.
        - Write a short, professional reason, like language matching, professional qualification expertise.
        - Output JSON: {{ "assigned_name": "Name", "assigned_id": "ID", "reasoning": "Reason" }}
        """
        
        try:
            import time; time.sleep(1.5)
            ai_res = gemini_model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
            decision = json.loads(ai_res.text)
            assigned_obj = next((c for c in candidates if c['name'] == decision['assigned_name']), top_match)
            decision['assigned_id'] = assigned_obj['id']
        except:
            decision = {"assigned_name": top_match['name'], "assigned_id": top_match['id'], "reasoning": "Math optimal."}

        batch_workload[decision['assigned_name']] = batch_workload.get(decision['assigned_name'], 0) + 1
        
        log_entry = {
            "lead_name": lead['name'],
            "lead_persona": f"{lead['occupation']} ({lead['preferred_language']})",
            "top_candidate": top_match['name'],
            "assigned_agent": decision['assigned_name'],
            "math_score": top_match['score'],
            "second_score": runner_up['score'],
            "is_override": decision['assigned_name'] != top_match['name'],
            "reasoning": decision['reasoning']
        }
        
        supabase.table("ai_dispatch_logs").insert(log_entry).execute()
        supabase.table("investors").update({"assigned_agent_id": decision['assigned_id']}).eq("investor_id", lead['investor_id']).execute()
        logs.append(log_entry)

    return logs
    
@router.get("/dispatch-feed")
async def get_feed():
    res = supabase.table("ai_dispatch_logs").select("*").order("created_at", desc=True).limit(50).execute()
    return res.data


@router.post("/override-assignment")
async def override_assignment(payload: dict = Body(...)):
    supabase.table("ai_dispatch_logs").update({
        "assigned_agent": payload.get("new_agent_name"),
        "admin_corrected": True,
        "reasoning": f"👨‍💼 ADMIN OVERRIDE: Re-assigned to {payload.get('new_agent_name')} manually."
    }).eq("id", payload.get("log_id")).execute()
    return {"status": "success"}

# =================================================================
# 💬 ROBUST CHATBOT
# =================================================================

@router.post("/chat")
async def admin_chat(payload: dict = Body(...)):
    question = payload.get("question")
    if not sql_agent: return {"answer": "Database Agent offline."}
    
    try:
        # 1. Enhance Question for Visuals
        enhanced_q = question
        if any(w in question.lower() for w in ["chart", "graph", "trend", "growth", "over time", "vs", "compare", "breakdown", "distribution"]):
            enhanced_q += " Select exactly two columns: a Label (string/date) and a Value (number)."

        # 2. Run SQL Agent
        result = sql_agent.invoke(enhanced_q)
        answer_text = result['output']
        
        # 3. Dynamic Chart Detection
        chart_data = None
        chart_type = None

        # TYPE A: TRENDS (Area Chart)
        if "trend" in question.lower() or "revenue" in question.lower() or "growth" in question.lower():
             sql = "SELECT to_char(transaction_date, 'Mon DD'), SUM(amount) FROM transactions WHERE status='Success' GROUP BY transaction_date ORDER BY transaction_date DESC LIMIT 14"
             try:
                 res = eval(db.run(sql))
                 chart_data = [{"name": row[0], "value": row[1]} for row in res][::-1]
                 chart_type = "area"
             except: pass

        # TYPE B: RANKINGS (Bar Chart)
        elif "top" in question.lower() or "best" in question.lower() or "agent" in question.lower():
             sql = "SELECT agents.name, count(*) as val FROM interactions JOIN agents ON interactions.agent_id = agents.agent_id WHERE outcome='Converted' GROUP BY agents.name ORDER BY val DESC LIMIT 5"
             try:
                 res = eval(db.run(sql))
                 chart_data = [{"name": row[0], "value": row[1]} for row in res]
                 chart_type = "bar"
             except: pass

        # TYPE C: DISTRIBUTION (Pie Chart)
        elif "breakdown" in question.lower() or "distribution" in question.lower() or "share" in question.lower():
             if "risk" in question.lower():
                 sql = "SELECT risk_appetite, count(*) FROM investors GROUP BY risk_appetite"
             elif "occupation" in question.lower():
                 sql = "SELECT occupation, count(*) FROM investors GROUP BY occupation"
             else: sql = None
             
             if sql:
                 try:
                     res = eval(db.run(sql))
                     chart_data = [{"name": row[0], "value": row[1]} for row in res]
                     chart_type = "pie"
                 except: pass

        return {
            "answer": answer_text,
            "chart_data": chart_data,
            "chart_type": chart_type
        }
    except Exception as e:
        return {"answer": f"Analysis failed: {str(e)}", "chart_data": None}

# =================================================================
# 📊 REAL ANALYTICS (FIXED SYNTAX)
# =================================================================

@router.get("/stats/dashboard")
async def get_dashboard_stats():
    if not db: return {"error": "DB Connection Failed"}
    
    # Using SQL directly for speed aggregation
    # 1. Total Revenue
    rev = db.run("SELECT SUM(amount) FROM transactions WHERE status = 'Success';")
    total_revenue = eval(rev)[0][0] or 0

    # 2. Active Agents
    agents_res = db.run("SELECT COUNT(DISTINCT agent_id) FROM interactions WHERE outcome = 'Converted';")
    active_agents = eval(agents_res)[0][0] or 0

    # 3. Conversion Rate
    rate_res = db.run("SELECT (COUNT(*) FILTER (WHERE outcome = 'Converted') * 100.0 / COUNT(*)) FROM interactions;")
    win_rate = eval(rate_res)[0][0] or 0

    # 4. Chart Data
    chart_res = eval(db.run("SELECT to_char(transaction_date, 'Mon DD'), SUM(amount) FROM transactions WHERE status = 'Success' GROUP BY transaction_date ORDER BY transaction_date DESC LIMIT 7;"))
    chart_data = [{"name": row[0], "uv": row[1]} for row in chart_res][::-1]

    return {
        "revenue": total_revenue,
        "active_agents": active_agents,
        "conversion_rate": round(float(win_rate), 1),
        "chart_data": chart_data
    }

@router.get("/download-report")
async def download_report():
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=18)
    elements = []
    styles = getSampleStyleSheet()

    # Fetch Data using .table() (CORRECT SYNTAX)
    rev_res = supabase.table('transactions').select('amount').eq('status', 'Success').execute()
    total_revenue = sum(r['amount'] for r in rev_res.data)
    
    agent_count = len(supabase.table('agents').select('agent_id').execute().data)
    
    logs_res = supabase.table('ai_dispatch_logs').select('*').order('created_at', desc=True).limit(15).execute()

    # --- PDF GENERATION ---
    elements.append(Paragraph("SIPBrain™ Executive Report", styles['Heading1']))
    elements.append(Spacer(1, 12))
    
    # KPI Table
    kpi_data = [['Total Revenue', 'Active Agents'], [f"Rs {total_revenue:,}", str(agent_count)]]
    t = Table(kpi_data, colWidths=[200, 200])
    t.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f1f5f9")), ('ALIGN', (0, 0), (-1, -1), 'CENTER'), ('GRID', (0, 0), (-1, -1), 1, colors.HexColor("#e2e8f0"))]))
    elements.append(t)
    elements.append(Spacer(1, 20))

    # Logs Table
    elements.append(Paragraph("Recent AI Dispatch Decisions", styles['Heading2']))
    log_data = [['Lead', 'Assigned To', 'Score', 'Override?']]
    for log in logs_res.data:
        override = "YES" if log.get('is_override') or log.get('admin_corrected') else "-"
        log_data.append([log.get('lead_name'), log.get('assigned_agent'), str(log.get('math_score')), override])

    t_logs = Table(log_data)
    t_logs.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0f172a")), ('TEXTCOLOR', (0, 0), (-1, 0), colors.white), ('GRID', (0, 0), (-1, -1), 1, colors.black)]))
    elements.append(t_logs)

    doc.build(elements)
    buffer.seek(0)
    return Response(content=buffer.getvalue(), media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=SIPBrain_Report.pdf"})