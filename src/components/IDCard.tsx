import React from "react";
import { motion } from "motion/react";
import { QrCode, BadgeCheck } from "lucide-react";
import { cn } from "@/src/lib/utils";

interface IDCardProps {
  name: string;
  idNumber: string;
  joinedDate: string;
  isVerified?: boolean;
  theme?: 'classic' | 'mesh' | 'geometric';
  className?: string;
}

export const IDCard = ({ name, idNumber, joinedDate, isVerified, theme = 'classic', className }: IDCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, rotateY: 5 }}
      style={{ perspective: "1000px" }}
      className={cn(
        "relative w-full aspect-[1.586/1] bg-black text-white rounded-2xl p-6 overflow-hidden border border-white/20 shadow-2xl flex flex-col justify-between transition-all duration-500",
        className
      )}
    >
      {/* Background Patterns based on Theme */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        {theme === 'classic' && (
          <div className="grid grid-cols-12 gap-1 h-full w-full">
            {Array.from({ length: 144 }).map((_, i) => (
              <div key={i} className="border-[0.5px] border-white/5" />
            ))}
          </div>
        )}
        {theme === 'mesh' && (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(255,255,255,0.2)_0%,_transparent_50%)] animate-pulse" />
        )}
        {theme === 'geometric' && (
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        )}
      </div>

      {/* Header */}
      <div className="flex justify-between items-start relative z-10">
        <div className="flex items-center gap-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tighter">IEA</h2>
            <p className="text-[10px] uppercase tracking-[0.2em] opacity-50">Digital Identity</p>
          </div>
          {isVerified && <BadgeCheck size={20} className="text-white animate-pulse" />}
        </div>
        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
          <div className="w-6 h-6 rounded-full bg-white" />
        </div>
      </div>

      {/* Body */}
      <div className="relative z-10">
        <p className="text-[10px] uppercase tracking-widest opacity-40 mb-1">Card Holder</p>
        <p className="text-xl font-medium tracking-tight uppercase">{name}</p>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-end relative z-10">
        <div className="space-y-3">
          <div>
            <p className="text-[8px] uppercase tracking-widest opacity-40">ID Number</p>
            <p className="font-mono text-sm tracking-wider">{idNumber}</p>
          </div>
          <div>
            <p className="text-[8px] uppercase tracking-widest opacity-40">Member Since</p>
            <p className="text-xs">{joinedDate}</p>
          </div>
        </div>
        <div className="bg-white p-2 rounded-lg">
          <QrCode className="w-12 h-12 text-black" />
        </div>
      </div>

      {/* Glossy Overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
    </motion.div>
  );
};
