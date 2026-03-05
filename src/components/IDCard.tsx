import React from "react";
import { motion } from "motion/react";
import { QrCode, BadgeCheck } from "lucide-react";
import { cn } from "@/src/lib/utils";

interface IDCardProps {
  name: string;
  idNumber: string;
  joinedDate: string;
  isVerified?: boolean;
  theme?: 'classic' | 'mesh' | 'geometric' | 'glass' | 'neon';
  avatarUrl?: string | null;
  className?: string;
}

export const IDCard = ({ name, idNumber, joinedDate, isVerified, theme = 'classic', avatarUrl, className }: IDCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, rotateY: 5, rotateX: -2 }}
      style={{ perspective: "1200px", transformStyle: "preserve-3d" }}
      className={cn(
        "relative w-full aspect-[1.586/1] rounded-2xl p-6 overflow-hidden shadow-2xl flex flex-col justify-between transition-all duration-700",
        theme === 'glass' ? "bg-white/10 backdrop-blur-xl border border-white/20 text-black" : "bg-black text-white border border-white/10",
        theme === 'neon' ? "shadow-[0_0_30px_rgba(16,185,129,0.2)] border-emerald-500/30" : "",
        className
      )}
    >
      {/* Background Patterns based on Theme */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {theme === 'classic' && (
          <div className="grid grid-cols-12 gap-1 h-full w-full opacity-10">
            {Array.from({ length: 144 }).map((_, i) => (
              <div key={i} className="border-[0.5px] border-white/5" />
            ))}
          </div>
        )}
        {theme === 'mesh' && (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(255,255,255,0.15)_0%,_transparent_70%)] animate-pulse" />
        )}
        {theme === 'geometric' && (
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        )}
        {theme === 'glass' && (
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/5" />
        )}
        {theme === 'neon' && (
          <>
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(to right, #10b981 1px, transparent 1px), linear-gradient(to bottom, #10b981 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          </>
        )}
      </div>

      {/* Header */}
      <div className="flex justify-between items-start relative z-10" style={{ transform: "translateZ(40px)" }}>
        <div className="flex items-center gap-2">
          <div>
            <h2 className={cn("text-2xl font-black tracking-tighter", theme === 'glass' ? "text-black" : "text-white")}>IEA</h2>
            <p className={cn("text-[8px] uppercase tracking-[0.3em] font-bold", theme === 'glass' ? "text-black/40" : "text-white/40")}>Digital Identity</p>
          </div>
          {isVerified && <BadgeCheck size={18} className={cn("animate-pulse", theme === 'neon' ? "text-emerald-400" : "text-white")} />}
        </div>
        <div className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center border overflow-hidden shadow-inner transform rotate-3",
          theme === 'glass' ? "bg-black/5 border-black/10" : "bg-white/10 border-white/20"
        )}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className={cn("w-10 h-10 rounded-full", theme === 'glass' ? "bg-black" : "bg-white")} />
          )}
        </div>
      </div>

      {/* Body */}
      <div className="relative z-10" style={{ transform: "translateZ(30px)" }}>
        <p className={cn("text-[8px] uppercase tracking-[0.2em] font-bold mb-1", theme === 'glass' ? "text-black/30" : "text-white/30")}>Identity Holder</p>
        <p className={cn("text-2xl font-black tracking-tight uppercase", theme === 'glass' ? "text-black" : "text-white")}>{name}</p>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-end relative z-10" style={{ transform: "translateZ(20px)" }}>
        <div className="space-y-4">
          <div>
            <p className={cn("text-[8px] uppercase tracking-[0.2em] font-bold mb-0.5", theme === 'glass' ? "text-black/30" : "text-white/30")}>System ID</p>
            <p className={cn("font-mono text-xs tracking-widest font-medium", theme === 'glass' ? "text-black/60" : "text-white/60")}>{idNumber}</p>
          </div>
          <div className="flex gap-6">
            <div>
              <p className={cn("text-[8px] uppercase tracking-[0.2em] font-bold mb-0.5", theme === 'glass' ? "text-black/30" : "text-white/30")}>Issued</p>
              <p className={cn("text-[10px] font-bold", theme === 'glass' ? "text-black/80" : "text-white/80")}>{joinedDate}</p>
            </div>
            <div>
              <p className={cn("text-[8px] uppercase tracking-[0.2em] font-bold mb-0.5", theme === 'glass' ? "text-black/30" : "text-white/30")}>Status</p>
              <p className={cn("text-[10px] font-bold flex items-center gap-1", theme === 'neon' ? "text-emerald-400" : (theme === 'glass' ? "text-black" : "text-white"))}>
                <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", theme === 'neon' ? "bg-emerald-400" : (theme === 'glass' ? "bg-black" : "bg-white"))} />
                ACTIVE
              </p>
            </div>
          </div>
        </div>
        <div className={cn(
          "p-2.5 rounded-xl shadow-lg transform -rotate-3 transition-transform hover:rotate-0",
          theme === 'glass' ? "bg-black text-white" : "bg-white text-black"
        )}>
          <QrCode className="w-10 h-10" />
        </div>
      </div>

      {/* Glossy Overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
      
      {/* Shimmer Effect */}
      <motion.div
        animate={{
          x: ["-100%", "200%"],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 pointer-events-none"
      />

      {/* Holographic Tint (Subtle) */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none bg-gradient-to-br from-purple-500/20 via-cyan-500/20 to-emerald-500/20 mix-blend-overlay" />
      
      {theme === 'neon' && <div className="absolute inset-0 border border-emerald-500/20 rounded-2xl pointer-events-none" />}
    </motion.div>
  );
};
