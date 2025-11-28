import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Mic, PhoneOff, Shield, TrendingUp, X, BrainCircuit, ArrowRight, LineChart, AlertTriangle, CheckCircle2, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Cockpit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState<any>(null);
  const [status, setStatus] = useState<'connecting' | 'live' | 'ended'>('connecting');
  const [transcript, setTranscript] = useState<any[]>([]);
  const [interventions, setInterventions] = useState<any[]>([]);
  const [currentScript, setCurrentScript] = useState("Connecting to Neural Core...");
  
  // WIZARD MODE (For Demo Control)
  const [manualInput, setManualInput] = useState("");
  
  const ws = useRef<WebSocket | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const cardsEndRef = useRef<HTMLDivElement>(null);

  // 1. FETCH LEAD CONTEXT
  useEffect(() => {
    const fetchLead = async () => {
      const { data } = await supabase.from('investors').select('*').eq('investor_id', id).single();
      if (data) {
        setLead(data);
        setStatus('live');
        setCurrentScript(`"Hi ${data.name.split(' ')[0]}, this is Rahul. I noticed you're eligible for a portfolio upgrade."`);
      }
    };
    fetchLead();
  }, [id]);

  // 2. CONNECT WEBSOCKET
  useEffect(() => {
    if (status !== 'live') return;

    ws.current = new WebSocket('ws://localhost:8000/ws/cockpit');

    ws.current.onopen = () => console.log('🟢 Connected to AI Brain');
    
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      // AI SENT A FLASH CARD
      if (data.type === 'objection' || data.type === 'fact') {
        setInterventions(prev => [...prev, data]);
        // Update Teleprompter
        if (data.content) setCurrentScript(data.content);
        // Scroll to new card
        setTimeout(() => cardsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    };

    return () => ws.current?.close();
  }, [status]);

  // 3. SEND INPUT (Simulate Voice)
  const handleSend = (text: string) => {
    if (!text) return;
    
    // Add to local transcript
    setTranscript(prev => [...prev, { sender: 'user', text, time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) }]);
    
    // Send to Python AI
    ws.current?.send(text);
    
    setManualInput("");
    setTimeout(() => transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  // 4. END CALL & UPDATE DB
  const endCall = async () => {
    // Log the interaction
    await supabase.from('interactions').insert({
        investor_id: id,
        agent_id: 'agt_100', // Hardcoded for demo
        date: new Date().toISOString().split('T')[0],
        outcome: 'Converted', // Assume win for demo
        objections_raised: JSON.dumps(["Price", "Risk"]),
        duration_sec: 300,
        sentiment: 'Positive'
    });
    
    navigate('/');
  };

  if (!lead) return <div className="h-screen bg-black flex items-center justify-center text-slate-500 font-mono">INITIALIZING...</div>;

  return (
    <div className="h-screen bg-[#09090b] text-slate-200 flex flex-col font-sans overflow-hidden">
      
      {/* HEADER */}
      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-[#0c0c0e]">
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-bold tracking-widest uppercase">LIVE RECORDING</span>
           </div>
           <div className="h-6 w-px bg-slate-800" />
           <h1 className="text-lg font-bold text-white">{lead.name}</h1>
           <span className="text-sm text-slate-500">{lead.city}</span>
        </div>
        <button onClick={endCall} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors"><X className="w-5 h-5" /></button>
      </header>

      {/* MAIN SPLIT */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT: TRANSCRIPT */}
        <div className="w-[400px] border-r border-slate-800 flex flex-col bg-[#0a0a0a]">
           <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="text-[10px] text-slate-600 text-center uppercase font-bold">Session Started</div>
              {transcript.map((msg, i) => (
                 <div key={i} className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-xl text-sm ${msg.sender === 'agent' ? 'bg-slate-800 text-slate-300' : 'bg-blue-900/20 text-blue-100 border border-blue-800/30'}`}>
                       {msg.text}
                    </div>
                 </div>
              ))}
              <div ref={transcriptEndRef} />
           </div>
           
           {/* WIZARD INPUT (Hidden Control) */}
           <div className="p-4 border-t border-slate-800 bg-[#0c0c0e]">
              <form onSubmit={(e) => { e.preventDefault(); handleSend(manualInput); }} className="relative">
                 <input 
                   value={manualInput}
                   onChange={(e) => setManualInput(e.target.value)}
                   placeholder="Type what customer says..."
                   className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-blue-500"
                 />
                 <button type="submit" className="absolute right-2 top-2 p-1.5 bg-blue-600 rounded-md text-white"><Send className="w-4 h-4" /></button>
              </form>
           </div>
        </div>

        {/* RIGHT: INTERVENTION DECK */}
        <div className="flex-1 flex flex-col bg-[#050505] relative">
           <div className="flex-1 overflow-y-auto p-10 space-y-6">
              {interventions.length === 0 && (
                 <div className="h-full flex flex-col items-center justify-center text-slate-700 opacity-50">
                    <BrainCircuit className="w-12 h-12 mb-4" />
                    <p className="text-sm font-medium uppercase tracking-widest">AI Listening...</p>
                 </div>
              )}
              <AnimatePresence>
                 {interventions.map((card) => (
                    <motion.div
                       key={card.id}
                       initial={{ opacity: 0, x: 50 }}
                       animate={{ opacity: 1, x: 0 }}
                       className={`p-6 rounded-xl border shadow-2xl ${card.type === 'objection' ? 'bg-orange-950/20 border-orange-500/40' : 'bg-blue-950/20 border-blue-500/40'}`}
                    >
                       <div className="flex items-center gap-3 mb-2">
                          {card.type === 'objection' ? <AlertTriangle className="text-orange-500" /> : <LineChart className="text-blue-500" />}
                          <h3 className={`text-lg font-bold ${card.type === 'objection' ? 'text-orange-400' : 'text-blue-400'}`}>{card.title}</h3>
                       </div>
                       <p className="text-slate-200 text-lg">{card.content}</p>
                       
                       {card.data?.table && (
                          <div className="mt-4 bg-black/40 rounded-lg p-4 grid grid-cols-2 gap-4 border border-white/5">
                             {Object.entries(card.data.table).map(([k, v]: any) => (
                                <div key={k} className="text-center">
                                   <div className="text-[10px] text-slate-500 uppercase">{k}</div>
                                   <div className="text-xl font-bold text-white">{v}</div>
                                </div>
                             ))}
                          </div>
                       )}
                    </motion.div>
                 ))}
              </AnimatePresence>
              <div ref={cardsEndRef} className="h-24" />
           </div>

           {/* TELEPROMPTER */}
           <div className="absolute bottom-8 left-8 right-8">
              <div className="bg-[#121214] border border-slate-700 shadow-2xl rounded-xl p-4 flex items-center gap-6">
                 <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center animate-pulse"><Mic className="text-black w-6 h-6"/></div>
                 <div>
                    <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider mb-1">Suggested Script</div>
                    <div className="text-xl text-white font-medium">{currentScript}</div>
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  )
}