import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Users, ShieldCheck, ArrowRight, Check } from "lucide-react";
import socket from "@/src/lib/socket";

export const CommunityHub = ({ user }: { user: any }) => {
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
  };

  return (
    <div className="pb-24 pt-8 px-6 space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tighter">Hub</h1>
        <p className="text-[10px] uppercase tracking-[0.2em] opacity-40">Verified Communities</p>
      </div>

      <div className="bg-black text-white p-6 rounded-3xl space-y-4 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-white" />
            <h2 className="text-lg font-bold tracking-tight">ID Verification Required</h2>
          </div>
          <p className="text-xs text-white/60 leading-relaxed">
            To maintain community integrity, you must link your Digital ID Card to join official IEA spaces.
          </p>
        </div>
        <div className="absolute -right-4 -bottom-4 opacity-10">
          <Users size={120} />
        </div>
      </div>

      <div className="space-y-4">
        {communities.map((comm) => (
          <motion.div
            key={comm.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-black/5 p-6 rounded-2xl bg-white shadow-sm flex justify-between items-center"
          >
            <div className="space-y-1 flex-1 pr-4">
              <h3 className="font-bold tracking-tight">{comm.name}</h3>
              <p className="text-xs text-black/40 line-clamp-1">{comm.description}</p>
              <p className="text-[8px] uppercase tracking-widest font-bold opacity-40">
                {comm.member_count} Members
              </p>
            </div>
            <button
              onClick={() => handleJoin(comm.id)}
              disabled={joined.includes(comm.id)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                joined.includes(comm.id) ? "bg-black text-white" : "bg-black/5 text-black hover:bg-black hover:text-white"
              }`}
            >
              {joined.includes(comm.id) ? <Check size={18} /> : <ArrowRight size={18} />}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
