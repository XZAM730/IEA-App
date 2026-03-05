import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Users, ShieldCheck, ArrowRight, Check } from "lucide-react";
import socket from "@/src/lib/socket";
import { cn } from "@/src/lib/utils";
import { useToast } from "./Toast";

export const CommunityHub = ({ user }: { user: any }) => {
  const { showToast } = useToast();
  const [communities, setCommunities] = useState<any[]>([]);
  const [joined, setJoined] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/communities")
      .then(res => res.json())
      .then(setCommunities);

    socket.on("community:update", (updatedComm) => {
      setCommunities(prev => prev.map(c => c.id === updatedComm.id ? updatedComm : c));
    });

    return () => { socket.off("community:update"); };
  }, []);

  const handleJoin = (communityId: string) => {
    socket.emit("community:join", { userId: user.id, communityId });
    setJoined(prev => [...prev, communityId]);
    showToast("Nexus Connection Established", "success");
  };

  return (
    <div className="pb-32 pt-10 px-6 space-y-12 max-w-2xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-6xl font-black tracking-tighter">Nexus</h1>
        <p className="text-[10px] uppercase tracking-[0.5em] font-bold opacity-30">Verified Collectives</p>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-black text-white p-8 rounded-[2.5rem] space-y-6 shadow-2xl relative overflow-hidden group"
      >
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
              <ShieldCheck size={24} className="text-white" />
            </div>
            <h2 className="text-2xl font-black tracking-tighter">Identity Protocol</h2>
          </div>
          <p className="text-sm text-white/60 leading-relaxed font-medium">
            Official IEA spaces require a verified Digital ID. Your sovereignty is protected by end-to-end encryption.
          </p>
          <button 
            onClick={() => {
              fetch(`/api/users/${user.id}/verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isVerified: true }),
              });
              showToast("Identity Verified", "success");
            }}
            className="bg-white text-black px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
          >
            Verify Identity
          </button>
        </div>
        <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-700">
          <Users size={200} />
        </div>
      </motion.div>

      <div className="grid gap-6">
        {communities.length === 0 ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-zinc-100 rounded-[2rem] animate-pulse" />
          ))
        ) : (
          communities.map((comm) => (
            <motion.div
              key={comm.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="group border border-black/5 p-8 rounded-[2.5rem] bg-white shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-700 flex justify-between items-center relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <div className="relative z-10 space-y-4 flex-1 pr-6">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black tracking-tighter">{comm.name}</h3>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <p className="text-sm text-zinc-500 font-medium line-clamp-2 leading-relaxed">
                  {comm.description}
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-zinc-200" />
                    ))}
                  </div>
                  <p className="text-[9px] uppercase tracking-[0.2em] font-black opacity-30">
                    {comm.member_count} Sovereign Members
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleJoin(comm.id)}
                disabled={joined.includes(comm.id)}
                className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg",
                  joined.includes(comm.id) 
                    ? "bg-emerald-500 text-white" 
                    : "bg-black text-white hover:scale-110 active:scale-90"
                )}
              >
                {joined.includes(comm.id) ? <Check size={24} strokeWidth={3} /> : <ArrowRight size={24} strokeWidth={3} />}
              </button>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
