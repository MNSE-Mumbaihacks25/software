🤝 SalesSaathi: The Agentic Sales Hive-Mind

Democratizing Financial Advice for the 95% of Bharat.

📽️ Project Demo



🚨 The Problem: India’s Fintech "Blind Spot"

Despite the fintech boom, 95% of Indians remain under-invested. The current distribution model is broken, biased, and blind to the reality of "Bharat."

🚫 The Access Crisis (Whom we Ignore):
90 Million Gig Workers are invisible to standard algorithms. Agents force "Fixed Monthly SIPs" on people with volatile incomes, leading to 90% rejection rates.

⚠️ The Trust Crisis (What we Sell):
Systemic Mis-selling. Agents prioritize commission over fit, often selling high-risk Small Cap funds to retirees. This erodes trust and invites regulatory crackdowns.

📉 The Efficiency Crisis (How we Sell):
Analog Intuition in a Digital World. Human agents cannot analyze 50+ market signals in real-time. They "spray and pray," capping industry conversion rates at a dismal 2-3%.

The Gap: We have democratized Access (Apps), but we failed to democratize Advice (Agents).

💡 The Solution: SalesSaathi

SalesSaathi is not a chatbot. It is an Autonomous Sales Orchestrator that acts as a "Neural Hive Mind" for financial distribution. It transforms average human agents into "Super-Consultants."

1. 🧠 The "Contextual Bandit" Dispatcher

Instead of random assignment, SalesSaathi uses Reinforcement Learning to match leads. It assigns the Gig Worker to the agent who specializes in Liquidity, and the Retiree to the agent who specializes in Safety.

2. 🛡️ The "Compliance Sentinel" (Real-Time Guard)

The AI listens to the live call. If an agent makes a false claim (e.g., "Guaranteed Returns"), the dashboard flashes RED and forces a correction script instantly. Zero Mis-selling.

3. ⚡ The "Auto-Closer" Workflow

The moment the call ends, the AI autonomously:

Analyses the transcript.

Generates a Hyper-Personalized PDF Proposal.

Drafts a WhatsApp message.

Action: The agent just clicks "Approve," and the deal is closed.

🏗️ Architecture: The "Neural Hub"

SalesSaathi moves beyond simple linear flows. We use a Hub-and-Spoke Agentic Architecture where specialized AI agents collaborate to solve problems.

<img width="661" height="352" alt="Screenshot 2025-11-29 122918" src="https://github.com/user-attachments/assets/0754aa74-ae51-46a6-b85f-e7c5ca01a3e1" />


Architecture Explained

Dual-Brain System:

Fast Brain (Groq Llama 3): Handles sub-second UI updates (Flash Cards, objection handling) during live calls. Latency < 400ms.

Deep Brain (Gemini 1.5 Pro): Handles complex reasoning (Lead Dispatching, Strategy Formulation, SQL Generation).

Active Memory (Supabase):

Uses pg_cron and Materialized Views to aggregate 3.5 Million transaction rows in real-time without lag.

Row Level Security (RLS) ensures agents only see their assigned data.

Agentic Loop (LangGraph):

The Dispatcher Agent doesn't just match; it reasons. It overrides mathematical scores if it detects Agent Burnout or specific Niche Mismatches (e.g., "YouTuber" -> "Gig Expert").

Vernacular Intelligence (Sarvam AI):

Specifically integrated for the Indian context to handle transcription and nuance in Hindi, Marathi, and Tamil, replacing generic global models for local accuracy.

🛠️ Tech Stack

Frontend (The Face)

React (Vite) -  Fast SPA.

Tailwind CSS - Custom "HFT White" & "Dark Cockpit" themes.

Shadcn/UI - Enterprise-grade accessible components.

Framer Motion - Physics-based layout animations.

Recharts - Data visualization.

Backend (The Nervous System)

FastAPI - Async Python server.

LangGraph - Agent orchestration and state management.

ReportLab - Programmatic PDF generation.

Database & AI (The Brains)

Supabase - Postgres, Auth, Vector Store, Realtime.

Groq (Llama 3) - Low-latency inference.

Google Gemini 2.5 - High-reasoning capability.

Sarvam AI - Indian Language Speech/Translation (Replacing ElevenLabs).

Deepgram - Real-time speech-to-text.

🚀 Getting Started

Prerequisites

Node.js 18+

Python 3.10+

Supabase Account

Groq & Gemini API Keys

Installation

Clone the Repo

git clone [https://github.com/MNSE-Mumbaihacks25/software.git](https://github.com/MNSE-Mumbaihacks25/software.git)
cd software


Backend Setup

cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt

# Setup Environment
cp .env.example .env
# (Fill in SUPABASE_URL, KEYS, etc.)

# Run Server
uvicorn main:app --reload


Frontend Setup

cd frontend
npm install

# Setup Environment
cp .env.example .env

# Run UI
npm run dev


Seed Data (Crucial for the "Big Data" feel)

cd backend
python seed_database.py


🔮 Future Roadmap

Vernacular Voice Synthesis: Agents that can speak to customers in 10+ Indian languages using Sarvam AI.

Predictive Churn: Using LSTM models on transaction history to predict SIP stoppages before they happen.

WhatsApp Commerce: End-to-end KYC and payment directly inside WhatsApp.

<p align="center">
Made with ❤️ & ☕ at Mumbai Hacks 2025
</p>
