import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Shield, Briefcase, ChevronRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
  const [activeTab, setActiveTab] = useState<'agent' | 'admin'>('agent');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (activeTab === 'admin') {
      // Hardcoded Admin for Demo
      if (email === 'admin@sipbrain.com' && password === 'admin') {
        localStorage.setItem('sb_user', JSON.stringify({ id: 'ADMIN', name: 'Headquarters', role: 'admin' }));
        navigate('/admin');
      } else {
        setError('Invalid Admin Credentials');
      }
    } else {
      // Real Agent Lookup in DB
      try {
        const { data, error } = await supabase
          .from('agents')
          .select('*')
          .eq('email', email.toLowerCase()) // Case insensitive
          .single();

        if (error || !data) {
          setError('Agent not found. Try "rahul.sharma@sipbrain.com"');
        } else {
          // In a hackathon, we ignore the password check or check simple equality
          // if (data.password !== password) { setError('Wrong password'); return; }
          
          localStorage.setItem('sb_user', JSON.stringify({ 
            id: data.agent_id, 
            name: data.name, 
            role: 'agent' 
          }));
          navigate('/');
        }
      } catch (err) {
        setError('Login failed. Check connection.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Art */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#1e1b4b_0%,transparent_50%)] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-10"
      >
        {/* Header */}
        <div className="p-8 border-b border-slate-800 bg-slate-900/80 text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl mx-auto flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">SIPBrain™</h1>
          <p className="text-slate-400 text-sm mt-2">Enterprise Sales Intelligence</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800">
          <button 
            onClick={() => setActiveTab('agent')}
            className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === 'agent' ? 'bg-blue-600/10 text-blue-400 border-b-2 border-blue-500' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}
          >
            Agent Portal
          </button>
          <button 
            onClick={() => setActiveTab('admin')}
            className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === 'admin' ? 'bg-purple-600/10 text-purple-400 border-b-2 border-purple-500' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}
          >
            Admin HQ
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={activeTab === 'agent' ? "agent.name@sipbrain.com" : "admin@sipbrain.com"}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-600"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-600"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs font-bold text-center">
              {error}
            </div>
          )}

          <button 
            disabled={loading}
            type="submit"
            className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed ${activeTab === 'agent' ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20' : 'bg-purple-600 hover:bg-purple-500 shadow-purple-900/20'}`}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Login <ChevronRight className="w-4 h-4" /></>}
          </button>

          <p className="text-center text-xs text-slate-600 mt-4">
            For demo, try: <span className="text-slate-400 font-mono">rahul.sharma@sipbrain.com</span>
          </p>
        </form>
      </motion.div>
    </div>
  );
}