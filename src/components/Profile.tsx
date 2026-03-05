import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { IDCard } from "./IDCard";
import { 
  MapPin, 
  Search, 
  UserPlus, 
  UserCheck, 
  BarChart3, 
  Palette, 
  Settings as SettingsIcon, 
  Heart, 
  MessageCircle,
  Edit3,
  Link as LinkIcon,
  Calendar,
  Grid,
  Bookmark,
  Activity,
  Check
} from "lucide-react";
import { Link } from "react-router-dom";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import socket from "@/src/lib/socket";
import { cn } from "@/src/lib/utils";
import { useToast } from "./Toast";

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
  const { showToast } = useToast();
  const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState<{ [key: string]: boolean }>({});
  const [cardTheme, setCardTheme] = useState(user.card_theme || 'classic');

  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(user.name);
  const [newBio, setNewBio] = useState(user.bio || "");
  const [newAvatar, setNewAvatar] = useState(user.avatar_url || "");
  const [userPosts, setUserPosts] = useState<any[]>([]);

  useEffect(() => {
    fetch(`/api/users/${user.id}/stats`)
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setNewBio(data.bio || "");
        setNewAvatar(data.avatar_url || "");
      });

    fetch(`/api/users/${user.id}/posts`)
      .then((res) => res.json())
      .then(setUserPosts);

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

  const handleUpdateProfile = async () => {
    const token = localStorage.getItem("iea_token");
    try {
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          name: newName, 
          bio: newBio, 
          avatar_url: newAvatar,
          card_theme: cardTheme
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        socket.emit("user:update_profile", data.user);
        setIsEditing(false);
        showToast("Identity Updated", "success");
      } else {
        showToast("Update Failed", "error");
      }
    } catch (e) {
      showToast("Network Error", "error");
    }
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
    <div className="pb-24 pt-8 px-6 space-y-10">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-5xl font-black tracking-tighter">Identity</h1>
          <p className="text-[10px] uppercase tracking-[0.4em] font-bold opacity-30">Digital Sovereignty</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/settings" className="p-2.5 bg-black/5 hover:bg-black text-black hover:text-white rounded-2xl transition-all duration-300">
            <SettingsIcon size={20} />
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        <IDCard
          name={user.name}
          idNumber={user.idNumber}
          joinedDate={user.joinedDate}
          isVerified={user.is_verified}
          theme={cardTheme}
          avatarUrl={user.avatar_url}
        />

        {/* Theme Selection - Bento Style */}
        <div className="grid grid-cols-5 gap-2">
          {['classic', 'mesh', 'geometric', 'glass', 'neon'].map((t) => (
            <button
              key={t}
              onClick={() => updateTheme(t)}
              className={cn(
                "py-3 rounded-2xl text-[8px] font-black uppercase tracking-widest border transition-all duration-300",
                cardTheme === t 
                  ? "bg-black text-white border-black shadow-lg scale-105" 
                  : "bg-white text-black/40 border-black/5 hover:border-black/20"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 bg-black text-white p-6 rounded-[2rem] flex justify-between items-center shadow-xl overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10">
            <p className="text-4xl font-black tracking-tighter">{stats.posts}</p>
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-50">Total Contributions</p>
          </div>
          <div className="relative z-10 flex -space-x-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-10 h-10 rounded-full border-2 border-black bg-zinc-800 flex items-center justify-center text-[10px] font-bold">
                {i === 3 ? '+' : ''}
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-zinc-100 p-6 rounded-[2rem] space-y-1">
          <p className="text-3xl font-black tracking-tighter">{stats.followers}</p>
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-40">Followers</p>
        </div>
        
        <div className="bg-zinc-100 p-6 rounded-[2rem] space-y-1">
          <p className="text-3xl font-black tracking-tighter">{stats.following}</p>
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-40">Following</p>
        </div>
      </div>

      {/* Bio & Edit Section */}
      <div className="space-y-4">
        {isEditing ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4 bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-2xl"
          >
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest opacity-30 ml-1">Full Name</label>
                <input 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-zinc-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-black transition-all"
                  placeholder="Your Name"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest opacity-30 ml-1">Bio</label>
                <textarea 
                  value={newBio} 
                  onChange={(e) => setNewBio(e.target.value)}
                  className="w-full bg-zinc-50 border-none rounded-2xl px-5 py-4 text-sm min-h-[100px] focus:ring-2 focus:ring-black transition-all resize-none"
                  placeholder="Tell us about yourself..."
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest opacity-30 ml-1">Avatar URL</label>
                <input 
                  value={newAvatar} 
                  onChange={(e) => setNewAvatar(e.target.value)}
                  className="w-full bg-zinc-50 border-none rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-black transition-all"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button 
                onClick={() => setIsEditing(false)}
                className="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-black/5 hover:bg-black/5 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdateProfile}
                className="flex-1 bg-black text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
              >
                Save Changes
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {user.bio && (
              <div className="bg-zinc-50 p-6 rounded-[2rem] border border-black/5">
                <p className="text-sm leading-relaxed text-black/60 font-medium italic">"{user.bio}"</p>
              </div>
            )}
            <div className="flex gap-3">
              <button 
                onClick={() => setIsEditing(true)}
                className="flex-1 bg-black text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
              >
                Edit Profile
              </button>
              <button className="flex-1 bg-zinc-100 text-black py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all">
                Share ID
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Activity Chart Section */}
      <div className="bg-zinc-50 p-8 rounded-[2.5rem] border border-black/5 space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="opacity-30" />
            <p className="text-[10px] font-black uppercase tracking-widest opacity-30">Contribution Graph</p>
          </div>
          <p className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">+12% vs last week</p>
        </div>
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockActivityData}>
              <defs>
                <linearGradient id="colorAct" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#000" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#000" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="activity" stroke="#000" fillOpacity={1} fill="url(#colorAct)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* User Discovery */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 ml-1">
          <Search size={14} className="opacity-30" />
          <p className="text-[10px] font-black uppercase tracking-widest opacity-30">Network Discovery</p>
        </div>
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-black/20 group-focus-within:text-black transition-colors" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search the IEA network..."
            className="w-full bg-zinc-100 border-none rounded-[1.5rem] pl-14 pr-6 py-4 text-sm font-bold focus:ring-2 focus:ring-black transition-all"
          />
        </div>
        
        <AnimatePresence>
          {searchResults.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="space-y-2 bg-zinc-50 p-4 rounded-[2rem] border border-black/5"
            >
              {searchResults.map((u) => (
                <div key={u.id} className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-black/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-white font-black text-xs">
                      {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover rounded-xl" /> : u.name[0]}
                    </div>
                    <div>
                      <p className="font-black text-sm tracking-tight">{u.name}</p>
                      <p className="text-[9px] font-mono font-bold opacity-30 tracking-tighter">{u.id_number}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleFollow(u.id)}
                    className={cn(
                      "p-3 rounded-xl transition-all duration-300",
                      isFollowing[u.id] ? "bg-black text-white scale-110" : "bg-zinc-100 text-black hover:bg-black hover:text-white"
                    )}
                  >
                    {isFollowing[u.id] ? <UserCheck size={16} /> : <UserPlus size={16} />}
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Post Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between ml-1">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-30">Contribution Archive</p>
          <p className="text-[10px] font-black opacity-30">{userPosts.length} Items</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {userPosts.length > 0 ? (
            userPosts.map((post) => (
              <motion.div 
                key={post.id} 
                whileHover={{ scale: 0.98 }}
                className="aspect-square bg-zinc-100 rounded-2xl overflow-hidden relative group border border-black/5"
              >
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-4 text-white backdrop-blur-[2px]">
                  <div className="flex flex-col items-center gap-1">
                    <Heart size={14} fill="white" />
                    <span className="text-[10px] font-black">{post.likes}</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <MessageCircle size={14} fill="white" />
                    <span className="text-[10px] font-black">{post.comments}</span>
                  </div>
                </div>
                <div className="w-full h-full flex items-center justify-center p-4">
                  <p className="text-[9px] line-clamp-4 opacity-40 font-bold leading-tight">{post.content}</p>
                </div>
              </motion.div>
            ))
          ) : (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-square bg-zinc-50 rounded-2xl border border-black/5 animate-pulse" />
            ))
          )}
        </div>
      </div>
    </div>
  );
};
