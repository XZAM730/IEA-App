import { Home, Newspaper, MessageSquare, User, Settings, Users } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/src/lib/utils";
import { motion } from "motion/react";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Newspaper, label: "News", path: "/news" },
  { icon: Users, label: "Hub", path: "/hub" },
  { icon: MessageSquare, label: "Chat", path: "/chat" },
  { icon: User, label: "Profile", path: "/profile" },
];

export const BottomNav = () => {
  const location = useLocation();

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-48px)] max-w-md z-50">
      <nav className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-[2.5rem] px-4 py-3 shadow-2xl flex justify-between items-center">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "relative flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-500",
                isActive ? "text-white bg-white/10 scale-110" : "text-white/40 hover:text-white/60"
              )}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              {isActive && (
                <motion.div 
                  layoutId="nav-active"
                  className="absolute -bottom-1 w-1 h-1 bg-white rounded-full shadow-[0_0_8px_white]"
                />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
