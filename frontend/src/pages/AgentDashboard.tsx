import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
    Phone, ChevronRight, Zap, RefreshCw, Briefcase, MapPin, Shield, BrainCircuit,
    Target, ArrowRight, LogOut, LayoutGrid, PieChart, Settings, X, Fingerprint,
    CheckCircle2, Search, History, TrendingUp, DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- MAIN DASHBOARD ---
export default function AgentDashboard() {
    const [leads, setLeads] = useState<any[]>([]);
    const [loadingPhase, setLoadingPhase] = useState(0);
    const [selectedLead, setSelectedLead] = useState<any>(null);
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('sb_user') || '{}');
    const agentId = user.email?.includes('rahul') ? 'agt_hero_001' : user.id;

    useEffect(() => {
        if (!user.id) { navigate('/login'); return; }

        const sequence = async () => {
            setLoadingPhase(1);
            await new Promise(r => setTimeout(r, 2000));
            setLoadingPhase(2);
        };
        sequence();

        const fetchMyLeads = async () => {
            try {
                const res = await axios.get(`http://localhost:8000/agent/${agentId}/leads`);
                setLeads(res.data);
            } catch (e) { console.error("Backend offline"); }
        };
        fetchMyLeads();
        const interval = setInterval(fetchMyLeads, 5000);
        return () => clearInterval(interval);
    }, [user.id, navigate]);

    const handleLogout = () => {
        localStorage.removeItem('sb_user');
        navigate('/login');
    };

    if (loadingPhase < 2) return <NeuralLoader user={user.name} />;

    return (
        <div className="flex h-screen bg-[#f8fafc] font-sans text-slate-900 overflow-hidden selection:bg-indigo-100">
            <nav className="w-20 bg-white border-r border-slate-200 flex flex-col items-center py-6 z-30 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold mb-8 shadow-lg shadow-blue-500/20">A</div>
                <div className="flex flex-col gap-6 w-full px-2">
                    <NavItem icon={<LayoutGrid size={20} />} active />
                    <NavItem icon={<Phone size={20} />} />
                    <NavItem icon={<PieChart size={20} />} />
                </div>
                <div className="mt-auto flex flex-col gap-6 px-2">
                    <button onClick={handleLogout} className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><LogOut size={20} /></button>
                </div>
            </nav>

            <main className="flex-1 flex flex-col relative overflow-hidden bg-slate-50/50">
                <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none opacity-40" />
                <header className="h-20 px-8 flex items-center justify-between sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-800">Sales Cockpit</h1>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Neural Link Active</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden md:block">
                            <div className="text-xs font-medium text-slate-400">Logged in as</div>
                            <div className="text-sm font-bold text-slate-800">{user.name}</div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center text-slate-600 font-bold">{user.name?.[0]}</div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8 md:p-12 scrollbar-thin scrollbar-thumb-slate-300">
                    <div className="max-w-5xl mx-auto space-y-10">
                        <div className="flex justify-between items-end">
                            <div><h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Your Mission Today</h2><p className="text-slate-500">AI has prioritized <span className="font-bold text-blue-600">{leads.length} high-value leads</span>.</p></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <DashboardCard title="Revenue Target" value="₹1,00,000" trend="+12%" trendGood={true} icon={<Target className="w-5 h-5 text-white" />} bg="bg-blue-600" />
                            <DashboardCard title="Win Rate" value="72%" trend="+4.5%" trendGood={true} icon={<Zap className="w-5 h-5 text-white" />} bg="bg-amber-500" />
                            <DashboardCard title="Assigned Leads" value={leads.length.toString()} trend="Live" trendGood={true} icon={<Phone className="w-5 h-5 text-white" />} bg="bg-indigo-600" />
                        </div>
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden min-h-[400px]">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2"><BrainCircuit size={16} className="text-violet-600" /> Smart Queue</h3>
                                <button onClick={() => window.location.reload()} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"><RefreshCw size={14} /></button>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {leads.length === 0 ? (
                                    <div className="p-12 flex flex-col items-center justify-center text-center opacity-60">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4"><BrainCircuit size={32} className="text-slate-300" /></div>
                                        <h3 className="text-lg font-medium text-slate-600">Neural Queue Empty</h3>
                                        <p className="text-sm text-slate-400 mt-1">Waiting for Admin Dispatcher...</p>
                                    </div>
                                ) : (
                                    leads.map((lead, i) => <LeadRow key={lead.investor_id} lead={lead} index={i} onClick={() => setSelectedLead(lead)} />)
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <AnimatePresence>
                {selectedLead && <LeadAnalysisModal lead={selectedLead} agentId={agentId} onClose={() => setSelectedLead(null)} />}
            </AnimatePresence>
        </div>
    );
}

// --- UPGRADED ANALYSIS MODAL ---
function LeadAnalysisModal({ lead, agentId, onClose }: any) {

    const [analysis, setAnalysis] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [viewMode, setViewMode] = useState<'strategy' | 'deep-dive'>('strategy');
    const [step, setStep] = useState(0);

    useEffect(() => {
        setStep(1);
        const runAnalysis = async () => {
            try {
                const res = await axios.get(`http://localhost:8000/agent/analyze-lead/${lead.investor_id}`);
                setTimeout(() => {
                    setAnalysis(res.data.analysis);
                    setTransactions(res.data.transactions);
                    setStep(2);
                }, 2500);
            } catch (e) { console.error(e); setStep(2); }
        };
        runAnalysis();
    }, [lead]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-5xl h-[650px] bg-white/95 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden relative flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-5 right-5 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 z-20 transition-colors"><X size={20} /></button>

                {/* LOADING ANIMATION */}
                {step === 1 && (
                    <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-white">
                        <div className="relative w-32 h-32 mb-8">
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="absolute inset-0 rounded-full border-t-2 border-l-2 border-blue-500" />
                            <div className="absolute inset-0 flex items-center justify-center"><BrainCircuit size={40} className="text-slate-400 animate-pulse" /></div>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 tracking-tight mb-2">Analyzing History</h3>
                        <p className="text-slate-500 text-sm font-mono">Detecting Patterns...</p>
                    </div>
                )}

                {/* CONTENT */}
                {step === 2 && analysis && (
                    <div className="flex flex-col md:flex-row h-full">

                        {/* LEFT: PROFILE & TOP 3 RECS */}
                        <div className="w-full md:w-[340px] bg-slate-50/80 border-r border-slate-200 p-6 flex flex-col overflow-y-auto">
                            <div className="mb-6">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-xl font-bold text-slate-700 border border-slate-100">{lead.name[0]}</div>
                                    <div><h2 className="text-lg font-bold text-slate-900 leading-none mb-1">{lead.name}</h2><p className="text-xs text-slate-500">{lead.occupation} • {lead.city}</p></div>
                                </div>
                                <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
                                    <div className="flex items-center gap-2 mb-1 text-[10px] font-bold text-violet-600 uppercase tracking-wider"><Fingerprint size={12} /> Persona</div>
                                    <p className="text-sm font-bold text-slate-800">{analysis.personality_tag}</p>
                                </div>
                            </div>

                            <div className="mb-4">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Top 3 Recommendations</h4>
                                <div className="space-y-2">
                                    {analysis.top_recommendations?.map((rec: any, i: number) => (
                                        <div key={i} className={`p-3 rounded-lg border ${i === 0 ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200'} transition-all`}>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className={`text-xs font-bold ${i === 0 ? 'text-indigo-700' : 'text-slate-700'}`}>{rec.name}</span>
                                                {i === 0 && <Zap size={12} className="text-indigo-500 fill-current" />}
                                            </div>
                                            <p className="text-[10px] text-slate-500 leading-snug">{rec.reason}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-auto pt-4">
                                <button onClick={() => setViewMode(viewMode === 'strategy' ? 'deep-dive' : 'strategy')} className={`w-full py-2.5 border font-bold rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all text-xs ${viewMode === 'deep-dive' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}>
                                    {viewMode === 'strategy' ? <><Search size={14} /> Deep Dive Data</> : <><Zap size={14} /> View Strategy</>}
                                </button>
                            </div>
                        </div>

                        {/* RIGHT: DYNAMIC CONTENT AREA */}
                        <div className="flex-1 p-8 flex flex-col bg-white relative overflow-hidden">
                            {viewMode === 'strategy' ? (
                                <>
                                    <div className="relative z-10 mb-6">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-lg shadow-blue-500/20 mb-4">
                                            <Zap size={12} className="fill-current" /> Recommended Pitch
                                        </span>
                                        <h3 className="text-2xl font-bold text-slate-900 leading-tight max-w-md">
                                            {analysis.top_recommendations?.[0]?.name}
                                        </h3>
                                        <p className="text-sm text-slate-500 mt-2 max-w-lg">{analysis.key_insight}</p>
                                    </div>

                                    <div className="flex-1 bg-slate-50 border-l-4 border-blue-600 p-6 rounded-r-xl mb-8">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Opening Script</p>
                                        <p className="text-lg text-slate-700 font-medium italic leading-relaxed">"{analysis.opening_pitch}"</p>
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 overflow-hidden flex flex-col">
                                    <div className="flex items-center gap-2 mb-6">
                                        <History className="text-slate-400 w-5 h-5" />
                                        <h3 className="text-lg font-bold text-slate-800">Transaction History</h3>
                                    </div>
                                    <div className="flex-1 overflow-y-auto border border-slate-100 rounded-xl">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                                                <tr>
                                                    <th className="px-4 py-3">Date</th>
                                                    <th className="px-4 py-3">Type</th>
                                                    <th className="px-4 py-3">Fund</th>
                                                    <th className="px-4 py-3 text-right">Amount</th>
                                                    <th className="px-4 py-3">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {transactions.length > 0 ? transactions.map((tx: any) => (
                                                    <tr key={tx.txn_id} className="hover:bg-slate-50/50">
                                                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{tx.transaction_date}</td>
                                                        <td className="px-4 py-3 font-medium text-slate-700">{tx.transaction_type}</td>
                                                        <td className="px-4 py-3 text-slate-600 truncate max-w-[150px]">{tx.fund_name}</td>
                                                        <td className="px-4 py-3 text-right font-bold text-slate-800">₹{tx.amount}</td>
                                                        <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${tx.status === 'Success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{tx.status}</span></td>
                                                    </tr>
                                                )) : (
                                                    <tr><td colSpan={5} className="p-8 text-center text-slate-400">No history available.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-4 mt-4 pt-4 border-t border-slate-100">
                                <button onClick={onClose} className="px-6 py-3 text-slate-500 font-bold text-sm hover:text-slate-800">Close</button>
                                <button onClick={() => window.location.href = `http://localhost:5174/chat?agent_id=${agentId}&lead_id=${lead.investor_id}&lead_name=${encodeURIComponent(lead.name)}`} className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl shadow-xl shadow-slate-900/20 hover:bg-slate-800 hover:scale-[1.02] transition-all flex items-center gap-3">
                                    <Phone size={18} className="fill-current" /> Start Call
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    )
}

// --- HELPERS ---
function NeuralLoader({ user }: { user: string }) { return <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0, filter: 'blur(10px)' }} transition={{ duration: 0.8 }} className="fixed inset-0 z-50 bg-[#f8fafc] flex flex-col items-center justify-center"><div className="relative w-24 h-24 mb-8"><motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="absolute inset-0 rounded-full border-2 border-blue-500/30" /><div className="absolute inset-2 bg-white rounded-full shadow-xl flex items-center justify-center"><BrainCircuit size={40} className="text-blue-600" /></div></div><h2 className="text-2xl font-bold text-slate-800 tracking-tight mb-2">Welcome, {user?.split(' ')[0]}</h2><div className="flex items-center gap-2 text-sm text-slate-500 font-medium uppercase tracking-widest"><span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />Initializing Neural Link...</div></motion.div> }
function DashboardCard({ title, value, trend, trendGood, icon, bg }: any) { return <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all group"><div className="flex justify-between items-start mb-4"><span className="text-slate-500 text-xs font-bold uppercase tracking-wider">{title}</span><div className={`p-2.5 rounded-xl ${bg} shadow-lg shadow-indigo-900/5 text-white group-hover:scale-110 transition-transform`}>{icon}</div></div><div className="flex items-baseline gap-3"><div className="text-3xl font-extrabold text-slate-900 tracking-tight">{value}</div><div className={`text-xs font-bold px-2 py-0.5 rounded-full border ${trendGood ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-slate-400 bg-slate-50 border-slate-100'}`}>{trend}</div></div></div> }
function NavItem({ icon, active }: any) { return <div className={`p-3 rounded-xl cursor-pointer transition-all ${active ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>{icon}</div> }
function LeadRow({ lead, index, onClick }: any) { return <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} onClick={onClick} className="group grid grid-cols-12 items-center px-6 py-4 hover:bg-slate-50 cursor-pointer transition-colors"><div className="col-span-5 flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600 border border-slate-200 group-hover:border-blue-200 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">{lead.name[0]}</div><div><h4 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{lead.name}</h4><p className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={10} /> {lead.city} • {lead.occupation}</p></div></div><div className="col-span-4"><div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Strategy</div><div className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded w-fit border border-indigo-100">{lead.ai_strategy_tag}</div></div><div className="col-span-3 flex items-center justify-end gap-6"><div className="text-right"><div className="text-sm font-bold text-slate-800 font-mono">{lead.match_score}%</div><div className="text-[10px] text-slate-400 uppercase font-bold">Match</div></div><ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" /></div></motion.div>; }