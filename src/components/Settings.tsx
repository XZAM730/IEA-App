import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Download, LogOut, Shield, Bell, Moon, Smartphone, HelpCircle, ChevronRight } from "lucide-react";
import { cn } from "@/src/lib/utils";

export const Settings = ({ user }: { user: any }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVerified, setIsVerified] = useState(user.is_verified);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const toggleVerified = async () => {
    const newVal = !isVerified;
    setIsVerified(newVal);
    await fetch(`/api/users/${user.id}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isVerified: newVal }),
    });
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      alert("To install this app, use your browser's 'Add to Home Screen' option.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("iea_token");
    window.location.reload();
  };

  const settingsGroups = [
    {
      title: "Account",
      items: [
        { icon: Shield, label: "Privacy & Security", color: "bg-black/5" },
        { icon: Bell, label: "Push Notifications", color: "bg-black/5" },
        { 
          icon: Shield, 
          label: "Verified Badge", 
          color: "bg-black/5", 
          toggle: true, 
          active: isVerified,
          onClick: toggleVerified
        },
      ]
    },
    {
      title: "App",
      items: [
        { icon: Moon, label: "Dark Mode", color: "bg-black/5", badge: "System" },
        { icon: Smartphone, label: "Data Usage", color: "bg-black/5" },
      ]
    },
    {
      title: "Support",
      items: [
        { icon: HelpCircle, label: "Help Center", color: "bg-black/5" },
      ]
    }
  ];

  return (
    <div className="pb-32 pt-10 px-6 space-y-12 max-w-2xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-6xl font-black tracking-tighter">System</h1>
        <p className="text-[10px] uppercase tracking-[0.5em] font-bold opacity-30">Configuration Protocol</p>
      </div>

      <div className="space-y-12">
        {/* Install App Section */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-black text-white p-8 rounded-[2.5rem] space-y-6 shadow-2xl relative overflow-hidden group"
        >
          <div className="relative z-10 space-y-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tighter">Native Access</h2>
              <p className="text-sm text-white/60 leading-relaxed font-medium">
                Deploy IEA to your workspace for an optimized, low-latency experience.
              </p>
            </div>
            <button 
              onClick={handleInstall}
              className="bg-white text-black px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl"
            >
              <Download size={18} strokeWidth={3} />
              Initialize Deployment
            </button>
          </div>
          <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-700">
            <Smartphone size={200} />
          </div>
        </motion.div>

        <div className="space-y-10">
          {settingsGroups.map((group, idx) => (
            <div key={idx} className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 ml-4">{group.title}</p>
              <div className="bg-zinc-50 rounded-[2.5rem] overflow-hidden border border-black/5 shadow-sm">
                {group.items.map((item, i) => (
                  <button 
                    key={i}
                    onClick={item.onClick}
                    className="w-full flex items-center justify-between p-6 hover:bg-zinc-100 transition-all duration-300 group border-b border-black/5 last:border-none"
                  >
                    <div className="flex items-center gap-5">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-sm",
                        item.color,
                        "bg-white"
                      )}>
                        <item.icon size={20} className="text-black" />
                      </div>
                      <span className="text-sm font-black tracking-tight">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {item.toggle ? (
                        <div 
                          className={cn(
                            "w-12 h-6 rounded-full transition-all duration-500 relative p-1",
                            item.active ? 'bg-black' : 'bg-zinc-200'
                          )}
                        >
                          <div className={cn(
                            "w-4 h-4 bg-white rounded-full transition-all duration-500 shadow-sm",
                            item.active ? 'translate-x-6' : 'translate-x-0'
                          )} />
                        </div>
                      ) : (
                        <>
                          {item.badge && <span className="text-[9px] font-black uppercase tracking-widest opacity-30 bg-black/5 px-2 py-1 rounded-md">{item.badge}</span>}
                          <ChevronRight size={18} className="opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <button 
            onClick={handleLogout}
            className="w-full bg-red-50 text-red-500 py-6 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-red-500 hover:text-white transition-all duration-500 shadow-sm"
          >
            <LogOut size={18} strokeWidth={3} />
            Terminate Session
          </button>

          <div className="text-center space-y-2 py-8">
            <div className="flex justify-center gap-4 opacity-10">
              <div className="w-2 h-2 bg-black rounded-full" />
              <div className="w-2 h-2 bg-black rounded-full" />
              <div className="w-2 h-2 bg-black rounded-full" />
            </div>
            <p className="text-[9px] font-black uppercase tracking-[0.4em] opacity-20">IEA Digital Identity Platform</p>
            <p className="text-[8px] font-bold uppercase tracking-[0.2em] opacity-10">Build 2.0.26-PRO // End-to-End Encrypted</p>
          </div>
        </div>
      </div>
    </div>
  );
};
