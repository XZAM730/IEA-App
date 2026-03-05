import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Auth } from "./components/Auth";
import { BottomNav } from "./components/BottomNav";
import { HomeFeed } from "./components/HomeFeed";
import { News } from "./components/News";
import { Chat } from "./components/Chat";
import { Profile } from "./components/Profile";
import { Settings } from "./components/Settings";
import { CommunityHub } from "./components/CommunityHub";
import { NotificationCenter } from "./components/NotificationCenter";
import { GlobalSearch } from "./components/GlobalSearch";
import { Live } from "./components/Live";
import { Bell, Search as SearchIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useToast } from "./components/Toast";
import socket from "./lib/socket";

export default function App() {
  const { showToast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const location = useLocation();

  // Simulate initial loading/auth check
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("iea_token");
      if (token) {
        try {
          const res = await fetch("/api/auth/me", {
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
          } else {
            localStorage.removeItem("iea_token");
          }
        } catch (e) {
          console.error("Auth check failed", e);
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      socket.emit("user:online", user.id);
      socket.on("user:profile_updated", (updatedUser) => {
        if (updatedUser.id === user.id) {
          setUser(updatedUser);
        }
      });

      socket.on("notification:new", (notif) => {
        if (notif.user_id === user.id) {
          const message = notif.type === 'like' ? `${notif.from_name} endorsed your broadcast` :
                          notif.type === 'comment' ? `${notif.from_name} transmitted a response` :
                          notif.type === 'follow' ? `${notif.from_name} established a connection` :
                          "New transmission received";
          showToast(message, "info");
        }
      });

      return () => { 
        socket.off("user:profile_updated");
        socket.off("notification:new");
      };
    }
  }, [user]);

  const handleLogin = (userData: any) => {
    setUser(userData);
    socket.emit("user:online", userData.id);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center space-y-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative"
        >
          <h1 className="text-8xl font-black tracking-tighter">IEA</h1>
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity }}
            className="absolute -bottom-2 left-0 h-1 bg-black"
          />
        </motion.div>
        <div className="space-y-2 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] opacity-20">Initializing Sovereignty</p>
          <div className="flex justify-center gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                className="w-1 h-1 bg-black rounded-full"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white flex flex-col items-center">
      <div className="w-full max-w-2xl relative min-h-screen flex flex-col">
        {/* Header Bar */}
        <header className="px-6 pt-8 pb-4 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-40">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white shadow-lg transform -rotate-3">
              <span className="font-black text-lg">I</span>
            </div>
            <h1 className="text-2xl font-black tracking-tighter">IEA</h1>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex gap-3"
          >
            <button 
              onClick={() => setShowSearch(true)}
              className="w-10 h-10 flex items-center justify-center bg-zinc-100 hover:bg-black hover:text-white rounded-xl transition-all duration-300 group"
            >
              <SearchIcon size={18} className="group-hover:scale-110 transition-transform" />
            </button>
            <button 
              onClick={() => setShowNotifications(true)}
              className="w-10 h-10 flex items-center justify-center bg-zinc-100 hover:bg-black hover:text-white rounded-xl transition-all duration-300 relative group"
            >
              <Bell size={18} className="group-hover:rotate-12 transition-transform" />
              <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white" />
            </button>
          </motion.div>
        </header>

        <AnimatePresence mode="wait">
          {showNotifications && (
            <NotificationCenter user={user} onClose={() => setShowNotifications(false)} />
          )}
          {showSearch && (
            <GlobalSearch onClose={() => setShowSearch(false)} />
          )}
        </AnimatePresence>

        {/* Main Content Area with Page Transitions */}
        <main className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="min-h-full"
            >
              <Routes location={location}>
                <Route path="/" element={<HomeFeed user={user} />} />
                <Route path="/news" element={<News user={user} />} />
                <Route path="/chat" element={<Chat user={user} />} />
                <Route path="/live" element={<Live user={user} />} />
                <Route path="/profile" element={<Profile user={user} />} />
                <Route path="/hub" element={<CommunityHub user={user} />} />
                <Route path="/settings" element={<Settings user={user} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Persistent Bottom Navigation */}
        <BottomNav />
      </div>
      
      {/* Background Grid Accent */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.01] z-[-1]">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>
    </div>
  );
}
