import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Auth } from "./components/Auth";
import { BottomNav } from "./components/BottomNav";
import { HomeFeed } from "./components/HomeFeed";
import { News } from "./components/News";
import { Chat } from "./components/Chat";
import { Profile } from "./components/Profile";
import { Settings } from "./components/Settings";

/**
 * IEA - Digital Identity & Community App
 * 
 * This application follows a strict monochromatic (Black & White) theme.
 * It features a mobile-first design with a bottom navigation bar.
 * 
 * Core Features:
 * - Authentication (Mocked)
 * - Digital ID Card Generation
 * - Community Feed
 * - Global News
 * - Private Messaging
 * - Profile Management
 */

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate initial loading/auth check
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

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
        {/* Main Content Area */}
        <main className="max-w-md mx-auto min-h-screen relative">
          <Routes>
            <Route path="/" element={<HomeFeed user={user} />} />
            <Route path="/news" element={<News user={user} />} />
            <Route path="/chat" element={<Chat user={user} />} />
            <Route path="/profile" element={<Profile user={user} />} />
            <Route path="/settings" element={<Settings />} />
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
