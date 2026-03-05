import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Bookmark, Share2, ExternalLink, BookmarkCheck } from "lucide-react";
import socket from "@/src/lib/socket";
import { cn } from "@/src/lib/utils";
import { useToast } from "./Toast";

export const News = ({ user }: { user: any }) => {
  const { showToast } = useToast();
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
    const isBookmarked = bookmarks.includes(newsId);
    setBookmarks(prev => 
      prev.includes(newsId) ? prev.filter(id => id !== newsId) : [...prev, newsId]
    );
    showToast(isBookmarked ? "Brief Removed from Archives" : "Brief Archived", "info");
  };

  return (
    <div className="pb-32 pt-10 px-6 space-y-12 max-w-2xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-6xl font-black tracking-tighter">Journal</h1>
        <p className="text-[10px] uppercase tracking-[0.5em] font-bold opacity-30">Curated Intelligence</p>
      </div>

      <div className="space-y-16">
        {news.length === 0 ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-4 animate-pulse">
              <div className="flex justify-between">
                <div className="w-20 h-4 bg-zinc-100 rounded" />
                <div className="w-24 h-4 bg-zinc-100 rounded" />
              </div>
              <div className="w-full h-8 bg-zinc-100 rounded" />
              <div className="w-full h-20 bg-zinc-100 rounded" />
            </div>
          ))
        ) : (
          news.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="group relative"
            >
              <div className="flex justify-between items-center mb-6">
                <span className="text-[9px] font-black tracking-[0.2em] text-white bg-black px-3 py-1.5 rounded-full uppercase">
                  {item.category}
                </span>
                <span className="text-[10px] font-bold opacity-30 uppercase tracking-widest">
                  {new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              
              <h2 className="text-3xl font-black tracking-tighter leading-[0.9] mb-4 group-hover:text-zinc-600 transition-colors duration-500">
                {item.title}
              </h2>
              
              <p className="text-sm text-zinc-500 font-medium leading-relaxed mb-8 max-w-prose italic">
                {item.summary}
              </p>
              
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => handleBookmark(item.id)}
                  className={cn(
                    "p-3 rounded-2xl transition-all duration-300",
                    bookmarks.includes(item.id) 
                      ? "bg-black text-white scale-110 shadow-lg" 
                      : "bg-zinc-100 text-black/40 hover:bg-black hover:text-white"
                  )}
                >
                  {bookmarks.includes(item.id) ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
                </button>
                <button 
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: item.title, text: item.summary, url: window.location.href });
                    } else {
                      showToast("Sharing protocol not supported", "error");
                    }
                  }}
                  className="p-3 bg-zinc-100 text-black/40 hover:bg-black hover:text-white rounded-2xl transition-all duration-300"
                >
                  <Share2 size={20} />
                </button>
                <button 
                  onClick={() => {
                    showToast("Accessing encrypted brief...", "info");
                    setTimeout(() => {
                      window.open("https://news.google.com", "_blank");
                    }, 1000);
                  }}
                  className="ml-auto flex items-center gap-2 text-[10px] font-black uppercase tracking-widest group/more"
                >
                  Full Access 
                  <div className="p-2 bg-zinc-100 group-hover/more:bg-black group-hover/more:text-white rounded-xl transition-all">
                    <ExternalLink size={14} />
                  </div>
                </button>
              </div>
              
              <div className="h-px bg-zinc-100 mt-16 group-last:hidden" />
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
