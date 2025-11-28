import json
import os

print("🚀 Generating GUARANTEED Master Fund Data...")

# This dictionary contains the PERFECT data for your demo.
# No API calls. No errors. No N/A.
MASTER_DATA = {
    "Parag Parikh Flexi Cap": {
        "Risk Profile": "High",
        "Ideal Investor": "Patient investors wanting global diversification (US Stocks) + Indian Growth.",
        "USP": "Only fund that lets you own Apple/Microsoft along with Indian stocks.",
        "One-Liner Pitch": "Buy global tech giants and Indian leaders in one fund.",
        "Key Stats": {"CAGR_3Yr": "19.2%", "Min_SIP": "₹1,000"}
    },
    "HDFC Flexi Cap": {
        "Risk Profile": "Very High",
        "Ideal Investor": "Investors who trust a value-investing philosophy over long cycles.",
        "USP": "Managed by Roshi Jain, focuses on undervalued sectors before they boom.",
        "One-Liner Pitch": "Invest in undervalued giants before the market discovers them.",
        "Key Stats": {"CAGR_3Yr": "18.5%", "Min_SIP": "₹500"}
    },
    "Axis Bluechip": {
        "Risk Profile": "Moderate",
        "Ideal Investor": "Conservative equity investors wanting stability over explosive growth.",
        "USP": "Focuses on 'Quality' companies with zero debt and high cash flow.",
        "One-Liner Pitch": "The safest way to enter the stock market with top 50 companies.",
        "Key Stats": {"CAGR_3Yr": "12.8%", "Min_SIP": "₹500"}
    },
    "SBI Small Cap": {
        "Risk Profile": "Very High",
        "Ideal Investor": "Aggressive investors with 7+ year horizon looking for multi-baggers.",
        "USP": "Strict capacity constraints to protect returns; stops intake when market is hot.",
        "One-Liner Pitch": "High risk, huge reward. Finds the next Reliance while it's still small.",
        "Key Stats": {"CAGR_3Yr": "24.5%", "Min_SIP": "₹500"}
    },
    "Mirae Asset Large Cap": {
        "Risk Profile": "Moderate-High",
        "Ideal Investor": "Core portfolio builder for steady wealth creation.",
        "USP": "Consistent top-quartile performance for over a decade.",
        "One-Liner Pitch": "The 'Fill It Shut It Forget It' fund for your core portfolio.",
        "Key Stats": {"CAGR_3Yr": "14.2%", "Min_SIP": "₹1,000"}
    },
    "ICICI Pru Bluechip": {
        "Risk Profile": "Moderate",
        "Ideal Investor": "Retirees or low-risk seekers wanting equity taxation benefits.",
        "USP": "Low volatility strategy that falls less when the market crashes.",
        "One-Liner Pitch": "Market-beating returns with fixed-deposit like stability.",
        "Key Stats": {"CAGR_3Yr": "13.5%", "Min_SIP": "₹100"}
    },
    "Nippon India Small Cap": {
        "Risk Profile": "Very High",
        "Ideal Investor": "Risk-takers who want maximum possible alpha.",
        "USP": "Highest AUM in category but still generates massive alpha due to huge diversification.",
        "One-Liner Pitch": "India's #1 Small Cap fund for aggressive wealth multiplication.",
        "Key Stats": {"CAGR_3Yr": "26.1%", "Min_SIP": "₹1,000"}
    },
    "Kotak Emerging Equity": {
        "Risk Profile": "High",
        "Ideal Investor": "Investors who missed the small-cap rally but find large-caps too slow.",
        "USP": "Mid-cap focus that balances growth potential with liquidity.",
        "One-Liner Pitch": "The perfect middle ground between safety and explosion.",
        "Key Stats": {"CAGR_3Yr": "20.4%", "Min_SIP": "₹1,000"}
    },
    "HDFC Balanced Advantage": {
        "Risk Profile": "Moderate",
        "Ideal Investor": "First-time investors afraid of market crashes.",
        "USP": "Dynamically shifts between Equity and Debt based on market valuation.",
        "One-Liner Pitch": "It automatically books profits when market is high and buys when low.",
        "Key Stats": {"CAGR_3Yr": "14.5%", "Min_SIP": "₹500"}
    },
    "SBI Equity Hybrid": {
        "Risk Profile": "Moderate",
        "Ideal Investor": "Investors needing monthly income (SWP) potential.",
        "USP": "A conservative mix that has never given negative returns over 5 years.",
        "One-Liner Pitch": "Get equity growth with the safety cushion of debt.",
        "Key Stats": {"CAGR_3Yr": "13.8%", "Min_SIP": "₹500"}
    },
    "HDFC ELSS Tax Saver": {
        "Risk Profile": "High",
        "Ideal Investor": "Salaried employees needing Section 80C tax deductions.",
        "USP": "3-year lock-in forces disciplined investing, resulting in higher returns.",
        "One-Liner Pitch": "Save ₹46,800 in tax and grow your wealth simultaneously.",
        "Key Stats": {"CAGR_3Yr": "16.5%", "Min_SIP": "₹500"}
    },
    "Kotak Liquid Fund": {
        "Risk Profile": "Low",
        "Ideal Investor": "Business owners or Gig workers needing to park idle cash.",
        "USP": "Instant Redemption facility (money in bank in 30 mins).",
        "One-Liner Pitch": "Better than a Savings Account, accessible anytime.",
        "Key Stats": {"CAGR_3Yr": "6.8%", "Min_SIP": "₹1,000"}
    },
    "SBI Magnum Gilt": {
        "Risk Profile": "Low-Moderate",
        "Ideal Investor": "Investors who fear bank defaults and want Sovereign guarantee.",
        "USP": "Zero Credit Risk because it lends to the Government of India.",
        "One-Liner Pitch": "Lend to the Government of India for 100% safety.",
        "Key Stats": {"CAGR_3Yr": "7.5%", "Min_SIP": "₹1,000"}
    },
    "Nippon India Index Nifty 50": {
        "Risk Profile": "Moderate",
        "Ideal Investor": "Believers in the India Growth Story who hate fund manager fees.",
        "USP": "Lowest expense ratio in the industry (0.05%).",
        "One-Liner Pitch": "Buy the top 50 companies of India at the lowest possible cost.",
        "Key Stats": {"CAGR_3Yr": "14.1%", "Min_SIP": "₹500"}
    }
}

# ==========================================
# FILE GENERATION
# ==========================================

# 1. JSON for the UI (Instant Speed)
os.makedirs("sipbrain_data", exist_ok=True)
with open("sipbrain_data/funds_fast_lookup.json", "w") as f:
    json.dump(MASTER_DATA, f, indent=2)

# 2. Markdown for RAG (Context)
markdown_content = "## PART 2: FUND SPECIFIC KNOWLEDGE\n\n"
for fund, data in MASTER_DATA.items():
    markdown_content += f"### Product: {fund}\n"
    markdown_content += f"**Pitch:** {data['One-Liner Pitch']}\n\n"
    markdown_content += f"**Risk:** {data['Risk Profile']}\n"
    markdown_content += f"**Ideal For:** {data['Ideal Investor']}\n"
    markdown_content += f"**USP:** {data['USP']}\n"
    markdown_content += f"**Stats:** 3Yr Return: {data['Key Stats']['CAGR_3Yr']}\n"
    markdown_content += "---\n\n"

with open("sipbrain_data/knowledge_base_part2.md", "w") as f:
    f.write(markdown_content)

print(f"\n✅ SUCCESS! Fixed data generated.")
print(f"1. sipbrain_data/funds_fast_lookup.json (Frontend ready)")
print(f"2. sipbrain_data/knowledge_base_part2.md (RAG ready)")