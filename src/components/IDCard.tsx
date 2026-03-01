import { motion } from "motion/react";
import { QrCode } from "lucide-react";
import { cn } from "@/src/lib/utils";

interface IDCardProps {
  name: string;
  idNumber: string;
  joinedDate: string;
  className?: string;
}

export const IDCard = ({ name, idNumber, joinedDate, className }: IDCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative w-full aspect-[1.586/1] bg-black text-white rounded-2xl p-6 overflow-hidden border border-white/20 shadow-2xl flex flex-col justify-between",
        className
      )}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent" />
        <div className="grid grid-cols-12 gap-1 h-full w-full">
          {Array.from({ length: 144 }).map((_, i) => (
            <div key={i} className="border-[0.5px] border-white/5" />
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="flex justify-between items-start relative z-10">
        <div>
          <h2 className="text-2xl font-bold tracking-tighter">IEA</h2>
          <p className="text-[10px] uppercase tracking-[0.2em] opacity-50">Digital Identity</p>
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
