import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { IDCard } from "./IDCard";
import { MapPin, Search, UserPlus, UserCheck } from "lucide-react";
import socket from "@/src/lib/socket";

interface ProfileProps {
  user: any;
}

export const Profile = ({ user }: ProfileProps) => {
  const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState<{ [key: string]: boolean }>({});

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

  return (
    <div className="pb-24 pt-8 px-6 space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter">Profile</h1>
          <p className="text-[10px] uppercase tracking-[0.2em] opacity-40">Your Identity</p>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest opacity-40">
          <MapPin size={12} /> Global
        </div>
      </div>

      <IDCard
        name={user.name}
        idNumber={user.idNumber}
        joinedDate={user.joinedDate}
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
          <button className="flex-1 bg-black text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest">
            Edit Profile
          </button>
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
