import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { LogIn, UserPlus } from "lucide-react";

interface AuthProps {
  onLogin: (user: any) => void;
}

export const Auth = ({ onLogin }: AuthProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
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
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="space-y-2">
          <h1 className="text-5xl font-bold tracking-tighter">IEA</h1>
          <p className="text-black/40 uppercase tracking-[0.3em] text-xs">
            {isLogin ? "Welcome Back" : "Create Identity"}
          </p>
        </div>

        {error && <p className="text-red-500 text-xs font-bold uppercase tracking-widest">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest font-semibold text-black/50">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border-b-2 border-black py-3 focus:outline-none text-lg font-medium"
                placeholder="John Doe"
                required
              />
            </div>
          )}
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest font-semibold text-black/50">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-b-2 border-black py-3 focus:outline-none text-lg font-medium"
              placeholder="name@example.com"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest font-semibold text-black/50">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-b-2 border-black py-3 focus:outline-none text-lg font-medium"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-black text-white py-4 rounded-full font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black/90 transition-colors mt-8"
          >
            {isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
            {isLogin ? "Sign In" : "Register"}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-xs uppercase tracking-widest font-bold text-black/40 hover:text-black transition-colors"
          >
            {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
