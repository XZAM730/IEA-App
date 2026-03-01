import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
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
import { Bell, Search as SearchIcon } from "lucide-react";
import { AnimatePresence } from "motion/react";
import socket from "./lib/socket";

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Simulate initial loading/auth check
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("iea_token");
      if (token) {
        try {
          // In a real app, we'd verify the token with the server
          // For now, we'll assume it's valid if present and fetch user data
          // We can add a /api/auth/me endpoint for this
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
      socket.on("user:profile_updated", (updatedUser) => {
        if (updatedUser.id === user.id) {
          setUser(updatedUser);
        }
      });
      return () => { socket.off("user:profile_updated"); };
    }
  }, [user]);

  const handleLogin = (userData: any) => {
    setUser(userData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="space-y-4 text-center">
          <h1 className="text-6xl font-bold tracking-tighter animate-pulse">IEA</h1>
          <div className="w-12 h-1 bg-black mx-auto animate-scale-x" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white">
        {/* Header Bar */}
        <header className="max-w-md mx-auto px-6 pt-6 flex justify-between items-center bg-white sticky top-0 z-40">
          <h1 className="text-2xl font-black tracking-tighter">IEA</h1>
          <div className="flex gap-4">
            <button 
              onClick={() => setShowSearch(true)}
              className="p-2 hover:bg-black/5 rounded-full transition-colors"
            >
              <SearchIcon size={20} />
            </button>
            <button 
              onClick={() => setShowNotifications(true)}
              className="p-2 hover:bg-black/5 rounded-full transition-colors relative"
            >
              <Bell size={20} />
              <div className="absolute top-2 right-2 w-2 h-2 bg-black rounded-full border-2 border-white" />
            </button>
          </div>
        </header>

        <AnimatePresence>
          {showNotifications && (
            <NotificationCenter user={user} onClose={() => setShowNotifications(false)} />
          )}
          {showSearch && (
            <GlobalSearch onClose={() => setShowSearch(false)} />
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <main className="max-w-md mx-auto min-h-screen relative">
          <Routes>
            <Route path="/" element={<HomeFeed user={user} />} />
            <Route path="/news" element={<News user={user} />} />
            <Route path="/chat" element={<Chat user={user} />} />
            <Route path="/profile" element={<Profile user={user} />} />
            <Route path="/hub" element={<CommunityHub user={user} />} />
            <Route path="/settings" element={<Settings user={user} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Persistent Bottom Navigation */}
        <div className="max-w-md mx-auto">
          <BottomNav />
        </div>
      </div>
    </Router>
  );
}
