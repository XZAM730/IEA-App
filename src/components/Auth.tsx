import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LogIn, UserPlus, ShieldCheck, Fingerprint } from "lucide-react";
import { cn } from "@/src/lib/utils";

interface AuthProps {
  onLogin: (user: any) => void;
}

export const Auth = ({ onLogin }: AuthProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
    const body = isLogin ? { email, password } : { name, email, password };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      localStorage.setItem("iea_token", data.token);
      onLogin(data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white flex flex-col">
      <div className="flex-1 flex flex-col justify-center px-8 py-12 max-w-md mx-auto w-full space-y-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 text-center"
        >
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-black rounded-3xl flex items-center justify-center text-white shadow-2xl transform -rotate-6">
              <Fingerprint size={32} />
            </div>
          </div>
          <h1 className="text-7xl font-black tracking-tighter">IEA</h1>
          <p className="text-[10px] uppercase tracking-[0.5em] font-bold opacity-30">Digital Sovereignty</p>
        </motion.div>

        <div className="space-y-8">
          <div className="flex bg-zinc-100 p-1.5 rounded-2xl">
            <button 
              onClick={() => setIsLogin(true)}
              className={cn(
                "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                isLogin ? "bg-white text-black shadow-sm" : "text-black/30 hover:text-black"
              )}
            >
              Access
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={cn(
                "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                !isLogin ? "bg-white text-black shadow-sm" : "text-black/30 hover:text-black"
              )}
            >
              Initialize
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  key="name"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1.5"
                >
                  <label className="text-[9px] font-black uppercase tracking-widest opacity-30 ml-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-zinc-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-black transition-all"
                    placeholder="John Doe"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest opacity-30 ml-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-black transition-all"
                placeholder="name@domain.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest opacity-30 ml-1">Security Key</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-black transition-all"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[10px] font-bold text-red-500 text-center uppercase tracking-widest"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? <LogIn size={16} /> : <UserPlus size={16} />}
                  <span>{isLogin ? "Authenticate" : "Create Identity"}</span>
                </>
              )}
            </button>
          </form>
        </div>

        <div className="pt-8 text-center space-y-8">
          <div className="flex items-center justify-center gap-2 text-black/20">
            <ShieldCheck size={14} />
            <p className="text-[8px] font-black uppercase tracking-widest">End-to-End Encrypted Protocol</p>
          </div>
          
          <p className="text-[9px] font-bold opacity-20 uppercase tracking-widest leading-relaxed">
            By accessing IEA, you agree to our<br />
            <span className="underline cursor-pointer hover:opacity-100 transition-opacity">Terms of Sovereignty</span> & <span className="underline cursor-pointer hover:opacity-100 transition-opacity">Privacy Protocol</span>
          </p>
        </div>
      </div>
      
      {/* Decorative Background Element */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] z-[-1]">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>
    </div>
  );
};
