import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { IDCard } from "./IDCard";
import { MapPin, Search, UserPlus, UserCheck, BarChart3, Palette, Settings as SettingsIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import socket from "@/src/lib/socket";
import { cn } from "@/src/lib/utils";

const mockActivityData = [
  { day: 'Mon', activity: 4 },
  { day: 'Tue', activity: 7 },
  { day: 'Wed', activity: 5 },
  { day: 'Thu', activity: 12 },
  { day: 'Fri', activity: 8 },
  { day: 'Sat', activity: 15 },
  { day: 'Sun', activity: 10 },
];

interface ProfileProps {
  user: any;
}

export const Profile = ({ user }: ProfileProps) => {
  const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState<{ [key: string]: boolean }>({});
  const [cardTheme, setCardTheme] = useState(user.card_theme || 'classic');

  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(user.name);

  useEffect(() => {
    fetch(`/api/users/${user.id}/stats`)
      .then((res) => res.json())
      .then(setStats);

    socket.on("user:follow_update", ({ followerId, followingId }) => {
      if (followingId === user.id || followerId === user.id) {
        fetch(`/api/users/${user.id}/stats`)
          .then((res) => res.json())
          .then(setStats);
      }
    });

    return () => {
      socket.off("user:follow_update");
    };
  }, [user.id]);

  const handleUpdateProfile = () => {
    socket.emit("user:update_profile", { userId: user.id, name: newName });
    setIsEditing(false);
  };

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.length > 2) {
      const res = await fetch(`/api/users/search?q=${q}`);
      const data = await res.json();
      setSearchResults(data.filter((u: any) => u.id !== user.id));
    } else {
      setSearchResults([]);
    }
  };

  const handleFollow = (targetId: string) => {
    socket.emit("user:follow", { followerId: user.id, followingId: targetId });
    setIsFollowing(prev => ({ ...prev, [targetId]: !prev[targetId] }));
  };

  const updateTheme = (theme: string) => {
    setCardTheme(theme);
    fetch(`/api/users/${user.id}/theme`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme }),
    });
  };

  return (
    <div className="pb-24 pt-8 px-6 space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter">Profile</h1>
          <p className="text-[10px] uppercase tracking-[0.2em] opacity-40">Your Identity</p>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/settings" className="p-2 hover:bg-black/5 rounded-full transition-colors opacity-40 hover:opacity-100">
            <SettingsIcon size={20} />
          </Link>
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest opacity-40">
            <MapPin size={12} /> Global
          </div>
        </div>
      </div>

      <IDCard
        name={user.name}
        idNumber={user.idNumber}
        joinedDate={user.joinedDate}
        isVerified={user.is_verified}
        theme={cardTheme}
      />

      <div className="space-y-6">
        <div className="flex justify-between items-center border-b border-black/5 pb-4">
          <div className="text-center flex-1">
            <p className="text-xl font-bold tracking-tighter">{stats.posts}</p>
            <p className="text-[10px] uppercase tracking-widest opacity-40">Posts</p>
          </div>
          <div className="w-px h-8 bg-black/5" />
          <div className="text-center flex-1">
            <p className="text-xl font-bold tracking-tighter">{stats.followers}</p>
            <p className="text-[10px] uppercase tracking-widest opacity-40">Followers</p>
          </div>
          <div className="w-px h-8 bg-black/5" />
          <div className="text-center flex-1">
            <p className="text-xl font-bold tracking-tighter">{stats.following}</p>
            <p className="text-[10px] uppercase tracking-widest opacity-40">Following</p>
          </div>
        </div>

        {/* Activity Chart */}
        <div className="bg-black/5 p-6 rounded-3xl space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="opacity-40" />
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Activity Graph</p>
          </div>
          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockActivityData}>
                <defs>
                  <linearGradient id="colorAct" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#000" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#000" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="activity" stroke="#000" fillOpacity={1} fill="url(#colorAct)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Theme Selection */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Palette size={16} className="opacity-40" />
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Card Theme</p>
          </div>
          <div className="flex gap-2">
            {['classic', 'mesh', 'geometric'].map((t) => (
              <button
                key={t}
                onClick={() => updateTheme(t)}
                className={cn(
                  "flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all",
                  cardTheme === t ? "bg-black text-white border-black" : "bg-transparent text-black/40 border-black/10"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search users by name or ID..."
              className="w-full bg-black/5 border-none rounded-2xl pl-12 pr-4 py-3 text-sm focus:ring-1 focus:ring-black"
            />
          </div>
          
          {/* ... search results ... */}

          {searchResults.length > 0 && (
            <div className="space-y-2 bg-black/5 p-4 rounded-2xl">
              <p className="text-[8px] font-bold uppercase tracking-widest opacity-40 mb-2">Search Results</p>
              {searchResults.map((u) => (
                <div key={u.id} className="flex items-center justify-between bg-white p-3 rounded-xl shadow-sm">
                  <div>
                    <p className="font-bold text-sm tracking-tight">{u.name}</p>
                    <p className="text-[10px] font-mono opacity-40">{u.id_number}</p>
                  </div>
                  <button 
                    onClick={() => handleFollow(u.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      isFollowing[u.id] ? "bg-black text-white" : "bg-black/5 text-black"
                    }`}
                  >
                    {isFollowing[u.id] ? <UserCheck size={16} /> : <UserPlus size={16} />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-4">
          {isEditing ? (
            <div className="flex-1 flex gap-2">
              <input 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)}
                className="flex-1 bg-black/5 border-none rounded-xl px-4 text-xs font-bold"
              />
              <button 
                onClick={handleUpdateProfile}
                className="bg-black text-white px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest"
              >
                Save
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsEditing(true)}
              className="flex-1 bg-black text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest"
            >
              Edit Profile
            </button>
          )}
          <button className="flex-1 border border-black/10 py-3 rounded-xl text-xs font-bold uppercase tracking-widest">
            Share ID
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="aspect-square bg-black/5 rounded-sm" />
          ))}
        </div>
      </div>
    </div>
  );
};
