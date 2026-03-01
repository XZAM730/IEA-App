import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Download, LogOut, Shield, Bell, Moon, Smartphone, HelpCircle, ChevronRight } from "lucide-react";

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
    <div className="pb-24 pt-8 px-6 space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tighter">Settings</h1>
        <p className="text-[10px] uppercase tracking-[0.2em] opacity-40">Preferences & System</p>
      </div>

      <div className="space-y-8">
        {/* Install App Section */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black text-white p-6 rounded-3xl space-y-4 shadow-xl"
        >
          <div className="space-y-1">
            <h2 className="text-lg font-bold tracking-tight">Download IEA App</h2>
            <p className="text-xs text-white/60 leading-relaxed">
              Install IEA on your home screen for a faster, more immersive experience.
            </p>
          </div>
          <button 
            onClick={handleInstall}
            className="w-full bg-white text-black py-3 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <Download size={16} />
            Install Now
          </button>
        </motion.div>

        {settingsGroups.map((group, idx) => (
          <div key={idx} className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-2">{group.title}</p>
            <div className="bg-black/5 rounded-3xl overflow-hidden">
              {group.items.map((item, i) => (
                <button 
                  key={i}
                  onClick={item.onClick}
                  className="w-full flex items-center justify-between p-5 hover:bg-black/5 transition-colors border-b border-black/5 last:border-none"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 ${item.color} rounded-full flex items-center justify-center`}>
                      <item.icon size={18} />
                    </div>
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.toggle ? (
                      <div className={`w-20 h-5 flex items-center justify-end pr-1 rounded-full transition-colors relative ${item.active ? 'bg-black' : 'bg-black/10'}`}>
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${item.active ? 'left-6' : 'left-1'}`} />
                      </div>
                    ) : (
                      <>
                        {item.badge && <span className="text-[8px] font-bold uppercase tracking-widest opacity-40">{item.badge}</span>}
                        <ChevronRight size={16} className="opacity-20" />
                      </>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}

        <button 
          onClick={handleLogout}
          className="w-full border border-black/10 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest text-red-500 flex items-center justify-center gap-2 hover:bg-red-50 transition-colors"
        >
          <LogOut size={16} />
          Sign Out
        </button>

        <div className="text-center space-y-1 opacity-20 py-4">
          <p className="text-[8px] font-bold uppercase tracking-widest">IEA Digital Identity Platform</p>
          <p className="text-[8px] uppercase tracking-widest">Version 2.0.26-PRO</p>
        </div>
      </div>
    </div>
  );
};
