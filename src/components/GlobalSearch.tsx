import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, X, User, Users, Newspaper, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export const GlobalSearch = ({ onClose }: { onClose: () => void }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ users: any[], communities: any[], news: any[] }>({ users: [], communities: [], news: [] });
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.length > 2) {
        setIsSearching(true);
        try {
          // Search Users
          const userRes = await fetch(`/api/users/search?q=${query}`);
          const users = await userRes.json();

          // Search Communities
          const commRes = await fetch(`/api/communities/search?q=${query}`);
          const communities = await commRes.json();

          // Search News
          const newsRes = await fetch(`/api/news/search?q=${query}`);
          const news = await newsRes.json();

          setResults({ users, communities, news });
        } catch (e) {
          console.error("Search failed", e);
        } finally {
          setIsSearching(false);
        }
      } else {
        setResults({ users: [], communities: [], news: [] });
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <motion.div
      initial={{ opacity: 0, y: "10%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "10%" }}
      className="fixed inset-0 bg-white z-[100] flex flex-col"
    >
      <div className="px-8 pt-12 pb-8 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-5xl font-black tracking-tighter">Search</h1>
            <p className="text-[10px] uppercase tracking-[0.4em] font-bold opacity-30">Network Discovery</p>
          </div>
          <button 
            onClick={onClose} 
            className="w-12 h-12 flex items-center justify-center bg-zinc-100 hover:bg-black hover:text-white rounded-2xl transition-all duration-300 group"
          >
            <X size={20} className="group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        <div className="relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-black/20 group-focus-within:text-black transition-colors" size={24} />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the collective..."
            className="w-full bg-zinc-50 border-none rounded-[2rem] pl-16 pr-6 py-6 text-xl font-bold focus:ring-2 focus:ring-black shadow-sm transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 space-y-12 no-scrollbar pb-24">
        {query.length <= 2 ? (
          <div className="h-full flex flex-col items-center justify-center space-y-6 opacity-20">
            <div className="w-24 h-24 bg-zinc-100 rounded-[2.5rem] flex items-center justify-center">
              <Search size={48} strokeWidth={1} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Awaiting Input Protocol</p>
          </div>
        ) : isSearching ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-8 h-8 border-4 border-zinc-100 border-t-black rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest opacity-20">Scanning Network...</p>
          </div>
        ) : (
          <div className="space-y-12">
            {results.users.length > 0 && (
              <section className="space-y-6">
                <div className="flex items-center gap-3 opacity-30">
                  <User size={16} />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em]">Sovereign Identities</p>
                </div>
                <div className="grid gap-4">
                  {results.users.map(u => (
                    <Link 
                      key={u.id} 
                      to="/profile" 
                      onClick={onClose} 
                      className="flex items-center gap-5 bg-zinc-50 p-6 rounded-[2rem] hover:bg-zinc-100 hover:scale-[1.02] transition-all duration-300 group shadow-sm"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-white border border-black/5 overflow-hidden shadow-md group-hover:rotate-3 transition-transform">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt={u.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full bg-black flex items-center justify-center text-white font-black text-xs">
                            {u.name[0]}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-lg tracking-tight">{u.name}</p>
                        <p className="text-[10px] font-mono opacity-30 uppercase tracking-widest">{u.id_number}</p>
                      </div>
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                        <ArrowRight size={18} />
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {results.communities.length > 0 && (
              <section className="space-y-6">
                <div className="flex items-center gap-3 opacity-30">
                  <Users size={16} />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em]">Active Collectives</p>
                </div>
                <div className="grid gap-4">
                  {results.communities.map(c => (
                    <Link 
                      key={c.id} 
                      to="/hub" 
                      onClick={onClose} 
                      className="flex items-center justify-between bg-zinc-50 p-6 rounded-[2rem] hover:bg-zinc-100 hover:scale-[1.02] transition-all duration-300 group shadow-sm"
                    >
                      <div className="flex-1 pr-6">
                        <p className="font-black text-lg tracking-tight">{c.name}</p>
                        <p className="text-sm text-zinc-500 font-medium line-clamp-1">{c.description}</p>
                      </div>
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                        <ArrowRight size={18} />
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {results.news.length > 0 && (
              <section className="space-y-6">
                <div className="flex items-center gap-3 opacity-30">
                  <Newspaper size={16} />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em]">Intelligence Briefs</p>
                </div>
                <div className="grid gap-4">
                  {results.news.map(n => (
                    <Link 
                      key={n.id} 
                      to="/news" 
                      onClick={onClose} 
                      className="flex items-center justify-between bg-zinc-50 p-6 rounded-[2rem] hover:bg-zinc-100 hover:scale-[1.02] transition-all duration-300 group shadow-sm"
                    >
                      <div className="flex-1 pr-6">
                        <p className="font-black text-lg tracking-tight line-clamp-1">{n.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[8px] font-black uppercase tracking-widest bg-black text-white px-2 py-0.5 rounded-full">{n.category}</span>
                        </div>
                      </div>
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                        <ArrowRight size={18} />
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {results.users.length === 0 && results.communities.length === 0 && results.news.length === 0 && (
              <div className="py-20 text-center space-y-4">
                <p className="text-sm font-black uppercase tracking-[0.2em] opacity-20">No matches found in the collective</p>
                <p className="text-[10px] font-medium text-zinc-400 italic">Try a different search parameter</p>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};
