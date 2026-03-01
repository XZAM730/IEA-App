import { motion } from "motion/react";
import { HelpCircle, Mail, Users, ChevronRight, LogOut, Shield, Bell } from "lucide-react";

const settingsGroups = [
  {
    title: "Support",
    items: [
      { icon: HelpCircle, label: "Help Center", description: "FAQs and guides" },
      { icon: Mail, label: "Contact Us", description: "Get in touch with support" },
    ],
  },
  {
    title: "Community",
    items: [
      { icon: Users, label: "Community Hub", description: "Join official IEA Discord" },
      { icon: Shield, label: "Verification", description: "Manage your ID Card links" },
    ],
  },
  {
    title: "App Settings",
    items: [
      { icon: Bell, label: "Notifications", description: "Manage your alerts" },
    ],
  },
];

export const Settings = () => {
  return (
    <div className="pb-24 pt-8 px-6 space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tighter">Settings</h1>
        <p className="text-[10px] uppercase tracking-[0.2em] opacity-40">Preferences & Support</p>
      </div>

      <div className="space-y-8">
        {settingsGroups.map((group) => (
          <div key={group.title} className="space-y-4">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/30 px-2">
              {group.title}
            </h2>
            <div className="space-y-1">
              {group.items.map((item) => (
                <motion.button
                  key={item.label}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-black/5 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center">
                    <item.icon size={20} className="text-black" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm tracking-tight">{item.label}</p>
                    <p className="text-[10px] text-black/40 uppercase tracking-widest">
                      {item.description}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-black/20" />
                </motion.button>
              ))}
            </div>
          </div>
        ))}

        <button className="w-full flex items-center gap-4 p-4 rounded-2xl text-red-500 hover:bg-red-50 transition-colors text-left mt-8">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
            <LogOut size={20} />
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm tracking-tight">Sign Out</p>
            <p className="text-[10px] uppercase tracking-widest opacity-60">Terminate Session</p>
          </div>
        </button>
      </div>
    </div>
  );
};
