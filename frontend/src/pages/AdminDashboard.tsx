import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { supabase } from '../lib/supabaseClient';
import { 
  Users, TrendingUp, Activity, Search, Zap, LayoutGrid, ArrowUpRight, 
  BrainCircuit, GitBranch, Cpu, AlertTriangle, 
  Download, CheckCircle2, MessageSquare, X, Send, BarChart2, PieChart, Settings, LogOut, Database, Layers,
  MoreHorizontal // <--- ADDED THIS MISSING IMPORT
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Pie, Cell 
} from 'recharts';

// --- UTILS ---
const getObjection = (data: any) => {
  try {
    if (!data) return "Standard Follow-up";
    if (Array.isArray(data)) return data[0] || "Price";
    if (typeof data === 'string') return data.replace(/[\[\]"']/g, "").split(',')[0];
    return "Standard Follow-up";
  } catch (e) { return "Price"; }
};

const formatCurrency = (val: number) => {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
  return `₹${val.toLocaleString()}`;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState({ revenue: 0, activeLeads: 0, conversionRate: 0 });
  const [revenueChart, setRevenueChart] = useState<any[]>([]);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [dispatchLogs, setDispatchLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDecision, setExpandedDecision] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState(true);
  
  // CHAT STATE
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [chatQuery, setChatQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatHistory, isTyping]);

  const fetchData = async () => {
    try {
      // 1. Stats from Backend
      const statsRes = await axios.get('http://localhost:8000/admin/stats/dashboard');
      setStats({
          revenue: statsRes.data.revenue,
          activeLeads: statsRes.data.active_agents,
          conversionRate: statsRes.data.conversion_rate
      });
      setRevenueChart(statsRes.data.chart_data);

      // 2. Recent Sales
      const { data: activity } = await supabase.from('interactions').select('*, investors(name)').eq('outcome', 'Converted').order('date', { ascending: false }).limit(5);
      setRecentSales(activity || []);

      // 3. Dispatch Logs
      try {
          const res = await axios.get('http://localhost:8000/admin/dispatch-feed');
          setDispatchLogs(res.data);
          setBackendStatus(true);
      } catch (e) { setBackendStatus(false); }

    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const runAIDispatcher = async () => {
    setLoading(true);
    try {
      await axios.post('http://localhost:8000/admin/trigger-assignment');
      setTimeout(async () => {
         const res = await axios.get('http://localhost:8000/admin/dispatch-feed');
         setDispatchLogs(res.data);
         setLoading(false);
      }, 1000);
    } catch (e) { setLoading(false); alert("AI Offline"); }
  };

  const handleOverride = async (logId: string) => {
    const newAgent = prompt("Enter new agent name:");
    if (!newAgent) return;
    setDispatchLogs(prev => prev.map(log => log.id === logId ? { ...log, assigned_agent: newAgent, admin_corrected: true, reasoning: `👨‍💼 ADMIN OVERRIDE: Re-assigned to ${newAgent}.` } : log));
    await axios.post('http://localhost:8000/admin/override-assignment', { log_id: logId, new_agent_name: newAgent });
  };

  const handleChatSubmit = async (e: any) => {
    if ((e.key === 'Enter' || e.type === 'click') && chatQuery.trim()) {
      const userMsg = { type: 'user', text: chatQuery };
      setChatHistory(prev => [...prev, userMsg]);
      setChatQuery("");
      setIsTyping(true);

      try {
        const res = await axios.post('http://localhost:8000/admin/chat', { question: userMsg.text });
        const aiMsg = { type: 'ai', text: res.data.answer, chart: res.data.chart_data, chartType: res.data.chart_type };
        setChatHistory(prev => [...prev, aiMsg]);
      } catch (err) {
        setChatHistory(prev => [...prev, { type: 'ai', text: "Connection Error." }]);
      }
      setIsTyping(false);
    }
  };

  if (loading) return <LightLoader />;

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans text-slate-900 overflow-hidden selection:bg-indigo-100">
      
      {/* 1. SIDEBAR */}
      <nav className="w-18 bg-white border-r border-slate-200 flex flex-col items-center py-6 z-30 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
         <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center text-white font-bold mb-8 shadow-lg shadow-indigo-500/20">S</div>
         <div className="flex flex-col gap-4 w-full px-2">
            <NavItem icon={<LayoutGrid size={20} />} active />
            <NavItem icon={<Users size={20} />} />
            <NavItem icon={<PieChart size={20} />} />
            <NavItem icon={<Layers size={20} />} />
         </div>
         <div className="mt-auto flex flex-col gap-4 px-2">
            <NavItem icon={<Settings size={20} />} />
            <NavItem icon={<LogOut size={20} />} />
         </div>
      </nav>

      {/* 2. MAIN AREA */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-slate-50/50">
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none opacity-40" />
        
        {/* HEADER */}
        <header className="h-20 px-8 flex items-center justify-between sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
           <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-800">Command Center</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{backendStatus ? 'Neural Core Online' : 'System Offline'}</span>
              </div>
           </div>

           <div className="flex gap-3">
              <button onClick={runAIDispatcher} className="group flex items-center gap-2 px-4 py-2 bg-slate-900 text-white font-bold rounded-xl shadow-lg shadow-slate-900/10 hover:shadow-slate-900/20 hover:-translate-y-0.5 transition-all text-sm">
                 <BrainCircuit size={16} className="text-violet-400 group-hover:animate-pulse"/> Run Dispatcher
              </button>
              
              <button onClick={() => window.open('http://localhost:8000/admin/download-report')} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all text-sm shadow-sm">
                 <Download size={16} /> Export
              </button>

              <button onClick={() => setIsChatOpen(!isChatOpen)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 hover:-translate-y-0.5 transition-all text-sm">
                 <MessageSquare size={16} /> Ask AI
              </button>
           </div>
        </header>

        {/* DASHBOARD CONTENT */}
        <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-slate-300">
           <div className="max-w-[1600px] mx-auto space-y-8">
              
              {/* STATS */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                 <StatCard title="Total AUM" value={formatCurrency(stats.revenue)} trend="+12.5%" icon={<TrendingUp className="text-white"/>} bg="bg-blue-600" colSpan={1} />
                 <StatCard title="Active Agents" value={stats.activeLeads} trend="100% Online" icon={<Users className="text-white"/>} bg="bg-indigo-600" colSpan={1} />
                 <StatCard title="Win Rate" value={`${stats.conversionRate}%`} trend="+4.2%" icon={<Zap className="text-white"/>} bg="bg-amber-500" colSpan={1} />
                 <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col justify-center items-center text-center">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">System Health</p>
                    <div className="text-emerald-500 font-bold text-lg flex items-center gap-2"><CheckCircle2 size={18} /> 99.9% Uptime</div>
                 </div>
              </div>

              {/* MAIN SPLIT */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                 
                 {/* LEFT: LIVE DISPATCH */}
                 <div className="xl:col-span-2 space-y-6">
                    <div className="flex justify-between items-end px-1">
                       <div>
                          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Cpu size={18} className="text-violet-600"/> Live AI Decisions</h2>
                          <p className="text-sm text-slate-500 mt-1">Real-time inference logs from the matching engine.</p>
                       </div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden min-h-[400px]">
                       <div className="grid grid-cols-12 px-6 py-3.5 bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          <div className="col-span-4">Lead Context</div>
                          <div className="col-span-3">Math Score</div>
                          <div className="col-span-3">Assignment</div>
                          <div className="col-span-2 text-right">Reasoning</div>
                       </div>
                       <div className="divide-y divide-slate-100">
                          {dispatchLogs.map(log => (
                             <DispatchRow key={log.id} log={log} expanded={expandedDecision === log.id} onToggle={() => setExpandedDecision(expandedDecision === log.id ? null : log.id)} onOverride={handleOverride} />
                          ))}
                       </div>
                    </div>
                 </div>

                 {/* RIGHT: ANALYTICS & FEED */}
                 <div className="space-y-6">
                    {/* CHART CARD (Fixed Height for Recharts) */}
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col h-80">
                        <div className="flex justify-between items-center mb-6">
                           <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Revenue Trend (7 Days)</h3>
                           <BarChart2 size={16} className="text-slate-400"/>
                        </div>
                        {/* Wrapper for Recharts to handle size */}
                        <div className="flex-1 w-full min-h-0"> 
                           <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={revenueChart.length > 0 ? revenueChart : []}>
                                 <defs><linearGradient id="c" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/><stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/></linearGradient></defs>
                                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize:10, fill:'#94a3b8'}} dy={10} />
                                 <Tooltip contentStyle={{borderRadius:'8px', border:'none', boxShadow:'0 4px 12px rgba(0,0,0,0.1)'}} />
                                 <Area type="monotone" dataKey="uv" stroke="#4f46e5" strokeWidth={2} fill="url(#c)" />
                              </AreaChart>
                           </ResponsiveContainer>
                        </div>
                    </div>

                    {/* RECENT ACTIVITY CARD */}
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col h-auto">
                       <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Recent Conversions</h3>
                       <div className="space-y-4">
                          {recentSales.map((sale: any) => (
                             <div key={sale.interaction_id} className="flex gap-4 items-start group">
                                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-[10px] border border-emerald-100 group-hover:scale-110 transition-transform">
                                   SIP
                                </div>
                                <div>
                                   <p className="text-sm font-bold text-slate-700">{sale.investors?.name}</p>
                                   <p className="text-xs text-slate-500 line-clamp-1">Obj: <span className="italic">{getObjection(sale.objections_raised)}</span></p>
                                </div>
                                <span className="ml-auto text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">{sale.date}</span>
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>

              </div>
           </div>
        </div>
      </main>

      {/* 3. CHAT DRAWER */}
      <AnimatePresence>
        {isChatOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40" onClick={() => setIsChatOpen(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed inset-y-0 right-0 w-[450px] bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col">
               
               <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 backdrop-blur">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-500/20"><BrainCircuit size={20}/></div>
                     <div><h3 className="font-bold text-slate-800">Analyst AI</h3><p className="text-xs text-slate-500 font-medium">Connected to 3.5M Records</p></div>
                  </div>
                  <button onClick={() => setIsChatOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={18}/></button>
               </div>

               <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30" ref={chatScrollRef}>
                  {chatHistory.length === 0 && (
                     <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                        <Database size={40} className="mb-4 text-slate-300"/>
                        <p className="text-sm font-medium">Ask natural questions like:</p>
                        <p className="text-xs mt-1">"Who is the best agent?"</p>
                        <p className="text-xs">"Show revenue trend"</p>
                     </div>
                  )}
                  {chatHistory.map((msg, i) => <ChatMessage key={i} msg={msg} />)}
                  {isTyping && <ThinkingBubble />}
               </div>

               <div className="p-5 border-t border-slate-200 bg-white">
                  <div className="relative">
                     <input type="text" value={chatQuery} onChange={(e) => setChatQuery(e.target.value)} onKeyDown={handleChatSubmit} placeholder="Ask about data..." className="w-full pl-4 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"/>
                     <button onClick={handleChatSubmit} className="absolute right-2 top-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"><Send size={16}/></button>
                  </div>
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// --- SUB COMPONENTS ---

function NavItem({ icon, active }: any) {
   return (
      <div className={`p-3 rounded-xl cursor-pointer transition-all ${active ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>
         {icon}
      </div>
   )
}

function StatCard({ title, value, trend, icon, bg }: any) {
  return (
    <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
       <div className={`absolute top-0 right-0 p-10 opacity-5 ${bg} rounded-bl-full pointer-events-none transition-transform group-hover:scale-150`}></div>
       <div className="flex justify-between items-start mb-4">
          <div className={`p-2.5 rounded-xl ${bg} shadow-lg shadow-indigo-900/5 text-white`}>{icon}</div>
          <MoreHorizontal className="w-5 h-5 text-slate-300 cursor-pointer hover:text-slate-600" />
       </div>
       <div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
          <div className="flex items-baseline gap-3">
             <h2 className="text-3xl font-extrabold text-slate-900">{value}</h2>
             <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">{trend}</span>
          </div>
       </div>
    </div>
  )
}

function DispatchRow({ log, expanded, onToggle, onOverride }: any) {
   return (
      <div className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
         <div className="grid grid-cols-12 px-6 py-4 items-center cursor-pointer" onClick={onToggle}>
            <div className="col-span-4">
               <div className="font-bold text-slate-700 text-sm group-hover:text-indigo-600 transition-colors">{log.lead_name}</div>
               <div className="text-xs text-slate-500">{log.lead_persona}</div>
            </div>
            <div className="col-span-3">
               <div className="text-xs font-mono text-slate-600 mb-0.5">{log.top_candidate}</div>
               <div className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded w-fit">{log.math_score}% Fit</div>
            </div>
            <div className="col-span-3 flex items-center gap-2">
               <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${log.is_override ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-white text-slate-700 border-slate-200 shadow-sm'}`}>
                  {log.assigned_agent}
               </span>
               {log.is_override && <AlertTriangle size={14} className="text-amber-500" />}
            </div>
            <div className="col-span-2 text-right">
               <span className={`text-[10px] font-bold uppercase tracking-wider ${expanded ? 'text-indigo-600' : 'text-slate-300 group-hover:text-indigo-400'}`}>
                  {expanded ? 'Close' : 'Analyze'}
               </span>
            </div>
         </div>
         <AnimatePresence>
            {expanded && (
               <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-slate-50/60 px-6 py-4 border-t border-slate-100 overflow-hidden">
                  <div className="flex gap-4">
                     <div className="flex-1 bg-white border border-slate-200 p-4 rounded-xl shadow-sm relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-violet-500"/>
                        <div className="flex justify-between mb-3">
                           <div className="flex items-center gap-2 text-xs font-bold text-violet-600 uppercase tracking-wider"><BrainCircuit size={14}/> AI Reasoning</div>
                           {!log.admin_corrected && <button onClick={(e) => {e.stopPropagation(); onOverride(log.id)}} className="text-[10px] font-bold bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-3 py-1.5 rounded-lg transition-colors shadow-sm">Override Decision</button>}
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed font-medium">"{log.reasoning}"</p>
                        {log.admin_corrected && <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 font-bold bg-amber-50 p-2 rounded border border-amber-100 w-fit"><CheckCircle2 size={14}/> Corrected by Admin</div>}
                     </div>
                  </div>
               </motion.div>
            )}
         </AnimatePresence>
      </div>
   )
}

function ThinkingBubble() {
   const [text, setText] = useState("Reading Database...");
   const steps = ["Reading Database...", "Generating SQL...", "Optimizing Query...", "Rendering Visualization..."];
   
   useEffect(() => {
      let i = 0;
      const interval = setInterval(() => {
         i = (i + 1) % steps.length;
         setText(steps[i]);
      }, 800);
      return () => clearInterval(interval);
   }, []);

   return (
      <div className="flex flex-col gap-2">
         <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-bl-none shadow-sm w-fit">
            <div className="flex items-center gap-3">
               <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"/>
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-100"/>
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-200"/>
               </div>
               <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider animate-pulse">{text}</span>
            </div>
         </div>
      </div>
   )
}

function ChatMessage({ msg }: any) {
   const isUser = msg.type === 'user';
   const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

   return (
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
         <div className={`max-w-[90%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${isUser ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none'}`}>
            <p>{msg.text}</p>
            {msg.chart && (
               <div className="mt-4 h-48 w-full bg-slate-50 rounded-xl border border-slate-100 pt-4 pr-4 pb-2">
                  <ResponsiveContainer width="100%" height="100%">
                     {msg.chartType === 'bar' ? (
                        <BarChart data={msg.chart}><XAxis dataKey="name" hide /><Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius:'8px', border:'none'}}/><Bar dataKey="value" fill="#4f46e5" radius={[4,4,0,0]} /></BarChart>
                     ) : msg.chartType === 'pie' ? (
                        <PieChart>
                           <Pie data={msg.chart} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                              {msg.chart.map((entry: any, index: number) => (
                                 <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                           </Pie>
                           <Tooltip />
                        </PieChart>
                     ) : (
                        <AreaChart data={msg.chart}><defs><linearGradient id="chatC" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/><stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/></linearGradient></defs><Tooltip cursor={{stroke: '#cbd5e1'}} contentStyle={{borderRadius:'8px', border:'none'}} /><Area type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={3} fill="url(#chatC)" /></AreaChart>
                     )}
                  </ResponsiveContainer>
               </div>
            )}
         </div>
      </div>
   )
}

function LightLoader() { return <div className="h-screen w-full flex items-center justify-center bg-[#f8fafc]"><div className="flex flex-col items-center"><div className="w-10 h-10 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-4" /><p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Initializing Command Center</p></div></div> }