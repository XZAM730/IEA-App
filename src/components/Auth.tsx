import React, { useState, useEffect } from "react";
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

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) return;
      
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const token = event.data.token;
        localStorage.setItem("iea_token", token);
        
        try {
          const res = await fetch("/api/auth/me", {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (res.ok) {
            onLogin(data.user);
          }
        } catch (e) {
          console.error("Failed to fetch user after OAuth");
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onLogin]);

  const handleGoogleLogin = async () => {
    try {
      const response = await fetch('/api/auth/google/url');
      if (!response.ok) throw new Error('Failed to get auth URL');
      const { url } = await response.json();
      
      window.open(url, 'oauth_popup', 'width=600,height=700');
    } catch (error) {
      console.error('OAuth error:', error);
      setError("Google login failed to initialize");
    }
  };

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
            
            <div className="relative py-4 flex items-center">
              <div className="flex-grow border-t border-black/10"></div>
              <span className="flex-shrink-0 mx-4 text-[10px] font-black uppercase tracking-widest text-black/30">OR</span>
              <div className="flex-grow border-t border-black/10"></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full bg-white border border-black/10 text-black py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm hover:bg-zinc-50 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                  <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                  <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                  <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                  <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                </g>
              </svg>
              <span>Continue with Google</span>
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
