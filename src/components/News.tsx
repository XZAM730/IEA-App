import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Bookmark, Share2, ExternalLink, BookmarkCheck } from "lucide-react";
import socket from "@/src/lib/socket";

export const News = ({ user }: { user: any }) => {
  const [news, setNews] = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/news")
      .then((res) => res.json())
      .then(setNews);

    socket.on("news:new", (newItem) => {
      setNews(prev => [newItem, ...prev]);
    });

    fetch(`/api/users/${user.id}/bookmarks`)
      .then((res) => res.json())
      .then((data) => setBookmarks(data.map((b: any) => b.id)));

    return () => { socket.off("news:new"); };
  }, [user.id]);

  const handleBookmark = (newsId: string) => {
    socket.emit("news:bookmark", { userId: user.id, newsId });
    setBookmarks(prev => 
      prev.includes(newsId) ? prev.filter(id => id !== newsId) : [...prev, newsId]
    );
  };

  return (
    <div className="pb-24 pt-8 px-6 space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tighter">News</h1>
        <p className="text-[10px] uppercase tracking-[0.2em] opacity-40">Trending Stories</p>
      </div>

      <div className="space-y-8">
        {news.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="group cursor-pointer"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold tracking-widest text-black/40 border border-black/10 px-2 py-0.5 rounded">
                {item.category}
              </span>
              <span className="text-[10px] opacity-40 uppercase tracking-widest">
                {new Date(item.timestamp).toLocaleDateString()}
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight group-hover:underline decoration-2 underline-offset-4 mb-2">
              {item.title}
            </h2>
            <p className="text-sm text-black/60 leading-relaxed mb-4">
              {item.summary}
            </p>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => handleBookmark(item.id)}
                className={`transition-colors ${bookmarks.includes(item.id) ? "text-black" : "text-black/40 hover:text-black"}`}
              >
                {bookmarks.includes(item.id) ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
              </button>
              <button className="text-black/40 hover:text-black transition-colors">
                <Share2 size={18} />
              </button>
              <button className="ml-auto text-black/40 hover:text-black transition-colors flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest">
                Read More <ExternalLink size={12} />
              </button>
            </div>
            <div className="h-px bg-black/5 mt-8" />
          </motion.div>
        ))}
      </div>
    </div>
  );
};
