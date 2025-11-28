import pandas as pd
import numpy as np
import uuid
import json
import random
from datetime import datetime, timedelta
from pathlib import Path

# CONFIGURATION
NUM_INVESTORS = 5000
NUM_AGENTS = 20
OUTPUT_DIR = Path("sipbrain_data")
OUTPUT_DIR.mkdir(exist_ok=True)

print("🚀 Generating ROBUST + REAL NAMED Data...")

# --- MASTER DATA ---
FUNDS_MASTER = ['Parag Parikh Flexi Cap', 'HDFC Flexi Cap', 'SBI Small Cap', 'Axis Bluechip', 'Nippon India Small Cap', 'HDFC Balanced Advantage', 'Kotak Liquid Fund', 'SBI Magnum Gilt']
CITIES = ['Mumbai', 'Pune', 'Nashik', 'Nagpur', 'Thane', 'Bangalore', 'Delhi', 'Chennai', 'Hyderabad']

OCCUPATION_CONFIG = {
    'Student': {'income_range': (5000, 15000), 'risk': 'High', 'sip_cap': 500},
    'Gig Worker': {'income_range': (15000, 40000), 'risk': 'Moderate', 'sip_cap': 1000},
    'Salaried': {'income_range': (40000, 150000), 'risk': 'Moderate', 'sip_cap': 5000},
    'Business': {'income_range': (100000, 500000), 'risk': 'High', 'sip_cap': 15000},
    'Retired': {'income_range': (30000, 80000), 'risk': 'Conservative', 'sip_cap': 5000}
}

# --- REAL NAMES (SEPARATED BY GENDER) ---
FIRST_NAMES_MALE = ['Ramesh', 'Suresh', 'Rahul', 'Amit', 'Vijay', 'Raj', 'Sanjay', 'Manoj', 'Deepak', 'Anil', 'Sunil', 'Ganesh', 'Raju', 'Vikram', 'Arjun', 'Aditya', 'Karan', 'Varun']
FIRST_NAMES_FEMALE = ['Priya', 'Sneha', 'Anita', 'Sunita', 'Pooja', 'Neha', 'Riya', 'Anjali', 'Kavita', 'Meena', 'Swati', 'Divya', 'Aditi', 'Nisha', 'Krutika']
LAST_NAMES = ['Patil', 'Deshmukh', 'Kulkarni', 'Joshi', 'Pawar', 'Shinde', 'Kale', 'Sharma', 'Singh', 'Gupta', 'Mehta', 'Verma', 'Reddy', 'Nair', 'Das']

def get_uuid(): return uuid.uuid4().hex[:8]

def generate_name(gender):
    """Generates a real name based on gender"""
    if gender == 'Male':
        return f"{random.choice(FIRST_NAMES_MALE)} {random.choice(LAST_NAMES)}"
    else:
        return f"{random.choice(FIRST_NAMES_FEMALE)} {random.choice(LAST_NAMES)}"

# ============================================================================
# 1. GENERATE AGENTS (REAL NAMES + SKILLS)
# ============================================================================
print("👥 Generating Agents...")
agents = []
for i in range(NUM_AGENTS):
    gender = np.random.choice(['Male', 'Female'])
    
    # Logic: Assign diverse languages based on ID
    if i < 5: langs = ['Marathi', 'Hindi', 'English'] # Mumbai expert
    elif i < 10: langs = ['Hindi', 'English', 'Punjabi'] # Delhi expert
    elif i < 15: langs = ['Tamil', 'English'] # Chennai expert
    else: langs = ['Hindi', 'English'] # Generalist

    # Create realistic performance stats
    perf_stats = {
        "Gig Worker": {"wins": np.random.randint(5, 30), "losses": np.random.randint(5, 20)},
        "Retired": {"wins": np.random.randint(5, 30), "losses": np.random.randint(5, 20)},
        "Student": {"wins": np.random.randint(5, 30), "losses": np.random.randint(5, 20)}
    }

    agents.append({
        'agent_id': f"agt_{i+100}",
        'name': generate_name(gender), # <--- REAL NAME GENERATION
        'languages': json.dumps(langs),
        'specialization': np.random.choice(['Equity', 'Debt', 'Tax Saver']),
        'performance_score': round(np.random.uniform(3.2, 4.9), 1),
        'performance_stats': json.dumps(perf_stats)
    })
df_agents = pd.DataFrame(agents)
df_agents.to_csv(OUTPUT_DIR / 'agents.csv', index=False)

# ============================================================================
# 2. GENERATE INVESTORS (REAL NAMES + PROFILES)
# ============================================================================
print("📊 Generating Investors...")
investors = []
for i in range(NUM_INVESTORS):
    gender = np.random.choice(['Male', 'Female'])
    city = np.random.choice(CITIES)
    occ_type = np.random.choice(list(OCCUPATION_CONFIG.keys()), p=[0.1, 0.2, 0.4, 0.2, 0.1])
    config = OCCUPATION_CONFIG[occ_type]
    
    # Logic: Age should match Occupation
    if occ_type == 'Student': age = np.random.randint(18, 24)
    elif occ_type == 'Retired': age = np.random.randint(60, 80)
    else: age = np.random.randint(24, 58)

    # Logic: Language matches City (mostly)
    if city in ['Mumbai', 'Pune', 'Nashik']: lang = np.random.choice(['Marathi', 'Hindi', 'English'], p=[0.5, 0.3, 0.2])
    elif city in ['Chennai']: lang = 'Tamil'
    elif city in ['Delhi']: lang = 'Hindi'
    else: lang = 'English'

    investors.append({
        'investor_id': f"inv_{get_uuid()}",
        'name': generate_name(gender), # <--- REAL NAME GENERATION
        'age': age,
        'city': city,
        'occupation': occ_type,
        'risk_appetite': config['risk'],
        'sip_capacity': config['sip_cap'] * np.random.randint(1, 3),
        'preferred_language': lang,
        'created_at': '2024-01-01',
        'gender': gender,
        'tier': 'Tier 1' if city in ['Mumbai', 'Delhi', 'Bangalore'] else 'Tier 2',
        'monthly_income_est': np.random.randint(config['income_range'][0], config['income_range'][1]),
        'last_activity_date': '2025-10-01'
    })
df_investors = pd.DataFrame(investors)
df_investors.to_csv(OUTPUT_DIR / 'investors.csv', index=False)

# ============================================================================
# 3. GENERATE INTERACTIONS (SMART LOGIC)
# ============================================================================
print("📞 Generating Context-Aware Interactions...")
interactions = []
# Only 40% of investors have interaction history
sample_investors = df_investors.sample(frac=0.4)

for _, inv in sample_investors.iterrows():
    # Pick a random agent
    agent = df_agents.sample(1).iloc[0]
    agent_langs = json.loads(agent['languages'])
    
    # --- LOGIC LAYER 1: LANGUAGE MISMATCH ---
    if inv['preferred_language'] not in agent_langs and inv['preferred_language'] != 'English':
        outcome = 'Rejected'
        objections = ["Language Barrier (Agent didn't speak local lang)"]
        sentiment = "Frustrated"
        duration = np.random.randint(20, 60)
    else:
        # --- LOGIC LAYER 2: STANDARD SALES FLOW ---
        outcome = np.random.choice(['Converted', 'Rejected', 'Follow-Up'], p=[0.2, 0.45, 0.35])
        
        base_objections = []
        
        # Age/Occupation Constraints
        if inv['age'] > 60: base_objections.append("Too risky for my age")
        if inv['occupation'] == 'Student': base_objections.append("Pocket money issue")
        if inv['occupation'] == 'Gig Worker': base_objections.append("Income is irregular")
        if inv['occupation'] == 'Business': base_objections.append("Need liquidity for business")
        if inv['occupation'] == 'Salaried': base_objections.append("EMI pressure")
        
        # General
        base_objections.extend(["Market is high", "Competitor has zero commission", "Need to ask family"])
        
        objections = [np.random.choice(base_objections)]
        if np.random.random() > 0.7: objections.append("Past returns negative")

        if outcome == 'Converted':
            sentiment = np.random.choice(['Enthusiastic', 'Trusting', 'Relieved'])
            duration = np.random.randint(400, 1200)
            if np.random.random() > 0.5: objections = ["Initial hesitation resolved"]
            
        elif outcome == 'Rejected':
            sentiment = np.random.choice(['Skeptical', 'Annoyed', 'Firm'])
            duration = np.random.randint(60, 240)
            
        else: # Follow-Up
            sentiment = np.random.choice(['Curious', 'Busy', 'Confused'])
            duration = np.random.randint(180, 600)
            objections.append("Send details on WhatsApp")

    interactions.append({
        'interaction_id': f"int_{get_uuid()}",
        'investor_id': inv['investor_id'],
        'agent_id': agent['agent_id'],
        'date': '2025-10-15',
        'outcome': outcome,
        'objections_raised': json.dumps(objections),
        'duration_sec': duration,
        'sentiment': sentiment
    })

pd.DataFrame(interactions).to_csv(OUTPUT_DIR / 'interactions.csv', index=False)

# ============================================================================
# 4. GENERATE TRANSACTIONS (ALIGNED COLUMNS)
# ============================================================================
print("💳 Generating Transactions...")
transactions = []
# Only converted investors have transactions
active_investors = df_investors.sample(frac=0.5) 

for _, inv in active_investors.iterrows():
    num_txns = np.random.randint(1, 6)
    for _ in range(num_txns):
        # Logic: Amount matches Capacity
        amt = int(inv['sip_capacity'])
        
        transactions.append({
            'txn_id': f"txn_{get_uuid()}",
            'investor_id': inv['investor_id'],
            'amount': amt,
            'transaction_type': 'SIP',
            'transaction_date': '2025-11-01',
            'fund_name': np.random.choice(FUNDS_MASTER),
            'trigger': 'Auto',
            'nfo_participation': False,
            'status': 'Success' if np.random.random() > 0.05 else 'Failed'
        })

pd.DataFrame(transactions).to_csv(OUTPUT_DIR / 'transactions.csv', index=False)

print("\n✅ DATA READY. Real Names & Robust Logic Enforced.")