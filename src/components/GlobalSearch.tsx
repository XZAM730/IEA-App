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
          const commRes = await fetch("/api/communities");
          const allComms = await commRes.json();
          const communities = allComms.filter((c: any) => 
            c.name.toLowerCase().includes(query.toLowerCase()) || 
            c.description.toLowerCase().includes(query.toLowerCase())
          );

          // Search News
          const newsRes = await fetch("/api/news");
          const allNews = await newsRes.json();
          const news = allNews.filter((n: any) => 
            n.title.toLowerCase().includes(query.toLowerCase()) || 
            n.summary.toLowerCase().includes(query.toLowerCase())
          );

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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-white z-[100] p-6 flex flex-col"
    >
      <div className="flex items-center gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20" size={20} />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search IEA network..."
            className="w-full bg-black/5 border-none rounded-2xl pl-12 pr-4 py-4 text-lg focus:ring-1 focus:ring-black"
          />
        </div>
        <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-8 no-scrollbar">
        {query.length <= 2 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-20 space-y-4">
            <Search size={48} strokeWidth={1} />
            <p className="text-xs uppercase tracking-widest font-bold">Type to search everything</p>
          </div>
        ) : isSearching ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-black/10 border-t-black rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {results.users.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2 opacity-40">
                  <User size={14} />
                  <p className="text-[10px] font-bold uppercase tracking-widest">People</p>
                </div>
                <div className="space-y-2">
                  {results.users.map(u => (
                    <Link key={u.id} to="/profile" onClick={onClose} className="flex items-center gap-4 bg-black/5 p-4 rounded-2xl hover:bg-black/10 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-black/10 overflow-hidden border border-black/5 flex-shrink-0">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt={u.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full bg-black" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm">{u.name}</p>
                        <p className="text-[10px] font-mono opacity-40">{u.id_number}</p>
                      </div>
                      <ArrowRight size={16} className="opacity-20" />
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {results.communities.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2 opacity-40">
                  <Users size={14} />
                  <p className="text-[10px] font-bold uppercase tracking-widest">Communities</p>
                </div>
                <div className="space-y-2">
                  {results.communities.map(c => (
                    <Link key={c.id} to="/hub" onClick={onClose} className="flex items-center justify-between bg-black/5 p-4 rounded-2xl hover:bg-black/10 transition-colors">
                      <div>
                        <p className="font-bold text-sm">{c.name}</p>
                        <p className="text-[10px] opacity-40 line-clamp-1">{c.description}</p>
                      </div>
                      <ArrowRight size={16} className="opacity-20" />
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {results.news.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2 opacity-40">
                  <Newspaper size={14} />
                  <p className="text-[10px] font-bold uppercase tracking-widest">News</p>
                </div>
                <div className="space-y-2">
                  {results.news.map(n => (
                    <Link key={n.id} to="/news" onClick={onClose} className="flex items-center justify-between bg-black/5 p-4 rounded-2xl hover:bg-black/10 transition-colors">
                      <div className="flex-1 pr-4">
                        <p className="font-bold text-sm line-clamp-1">{n.title}</p>
                        <p className="text-[10px] opacity-40">{n.category}</p>
                      </div>
                      <ArrowRight size={16} className="opacity-20" />
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {results.users.length === 0 && results.communities.length === 0 && results.news.length === 0 && (
              <div className="py-12 text-center opacity-20">
                <p className="text-xs uppercase tracking-widest font-bold">No results found for "{query}"</p>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};
