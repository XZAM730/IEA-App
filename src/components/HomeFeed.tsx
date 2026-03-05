import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Plus, 
  Send, 
  MoreHorizontal, 
  Trash2, 
  Edit3,
  TrendingUp,
  Zap,
  Globe,
  BarChart3,
  Palette
} from "lucide-react";
import socket from "@/src/lib/socket";
import { cn } from "@/src/lib/utils";
import { useToast } from "./Toast";

export const HomeFeed = ({ user }: { user: any }) => {
  const { showToast } = useToast();
  const [posts, setPosts] = useState<any[]>([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [activeComments, setActiveComments] = useState<string | null>(null);
  const [comments, setComments] = useState<{ [key: string]: any[] }>({});
  const [newComment, setNewComment] = useState("");
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    fetch("/api/posts")
      .then((res) => res.json())
      .then(setPosts);

    socket.on("post:new", (post) => {
      setPosts((prev) => [post, ...prev]);
    });

    socket.on("post:deleted", (postId) => {
      setPosts((prev) => prev.filter(p => p.id !== postId));
    });

    socket.on("post:updated", (updatedPost) => {
      setPosts((prev) => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
    });

    socket.on("post:like_update", ({ postId, likes }) => {
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, likes } : p))
      );
    });

    socket.on("post:comment_new", ({ postId, comment }) => {
      setComments((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), comment],
      }));
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, comments: (p.comments || 0) + 1 } : p))
      );
    });

    return () => {
      socket.off("post:new");
      socket.off("post:deleted");
      socket.off("post:updated");
      socket.off("post:like_update");
      socket.off("post:comment_new");
    };
  }, []);

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;
    socket.emit("post:create", { userId: user.id, content: newPostContent });
    setNewPostContent("");
    setShowCreate(false);
    showToast("Broadcast Transmitted", "success");
  };

  const handleLike = (postId: string) => {
    socket.emit("post:like", { userId: user.id, postId });
  };

  const handleDelete = (postId: string) => {
    if (confirm("Are you sure you want to delete this post?")) {
      socket.emit("post:delete", { userId: user.id, postId });
      showToast("Broadcast Terminated", "info");
    }
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editContent.trim() || !editingPostId) return;
    socket.emit("post:update", { userId: user.id, postId: editingPostId, content: editContent });
    setEditingPostId(null);
    setEditContent("");
  };

  const toggleComments = (postId: string) => {
    if (activeComments === postId) {
      setActiveComments(null);
    } else {
      setActiveComments(postId);
      if (!comments[postId]) {
        fetch(`/api/posts/${postId}/comments`)
          .then((res) => res.json())
          .then((data) => setComments((prev) => ({ ...prev, [postId]: data })));
      }
    }
  };

  const handleSendComment = (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    socket.emit("post:comment", { userId: user.id, postId, content: newComment });
    setNewComment("");
  };

  return (
    <div className="pb-24 pt-10 px-6 space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-black tracking-tighter">Feed</h1>
          <p className="text-[10px] uppercase tracking-[0.4em] font-bold opacity-30">Global Pulse</p>
        </div>
        <button 
          onClick={() => setShowCreate(!showCreate)}
          className="w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300"
        >
          <Plus size={28} className={cn("transition-transform duration-500", showCreate && "rotate-45")} />
        </button>
      </div>

      {/* Trending Bento */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-zinc-900 text-white p-5 rounded-[2rem] space-y-3 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 transition-opacity">
            <BarChart3 size={20} />
          </div>
          <p className="text-[8px] font-black uppercase tracking-widest opacity-40">Trending Now</p>
          <p className="text-lg font-black tracking-tight leading-none">#DigitalSovereignty</p>
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {[1, 2, 3].map(i => <div key={i} className="w-5 h-5 rounded-full border border-black bg-zinc-700" />)}
            </div>
            <p className="text-[8px] font-bold opacity-40">+1.2k active</p>
          </div>
        </div>
        <div className="grid grid-rows-2 gap-3">
          <div className="bg-zinc-100 p-4 rounded-2xl flex items-center justify-between">
            <p className="text-[10px] font-black tracking-tight">#IEA2026</p>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="bg-zinc-100 p-4 rounded-2xl flex items-center justify-between">
            <p className="text-[10px] font-black tracking-tight">#Minimalism</p>
            <p className="text-[8px] font-bold opacity-30">Hot</p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.form 
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            onSubmit={handleCreatePost} 
            className="space-y-4 bg-zinc-50 p-6 rounded-[2.5rem] border border-black/5 shadow-xl overflow-hidden"
          >
            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="Broadcast your thoughts..."
              className="w-full bg-transparent border-none focus:ring-0 text-sm font-medium resize-none min-h-[100px]"
            />
            <div className="flex justify-between items-center pt-2">
              <div className="flex gap-2">
                <button 
                  type="button" 
                  onClick={() => {
                    const themes = ['classic', 'mesh', 'geometric', 'glass', 'neon'];
                    const randomTheme = themes[Math.floor(Math.random() * themes.length)];
                    fetch(`/api/users/${user.id}/theme`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ theme: randomTheme }),
                    });
                    showToast(`Theme changed to ${randomTheme}`, "success");
                  }}
                  className="p-2 hover:bg-black/5 rounded-xl transition-colors"
                >
                  <Palette size={16} className="opacity-30" />
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    if (newPostContent) {
                      navigator.clipboard.writeText(newPostContent);
                      showToast("Transmission copied to clipboard", "info");
                    }
                  }}
                  className="p-2 hover:bg-black/5 rounded-xl transition-colors"
                >
                  <Share2 size={16} className="opacity-30" />
                </button>
              </div>
              <button type="submit" className="bg-black text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all">
                Broadcast
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="space-y-8">
        {posts.length === 0 ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-zinc-100" />
                <div className="space-y-2">
                  <div className="w-24 h-3 bg-zinc-100 rounded-full" />
                  <div className="w-16 h-2 bg-zinc-100 rounded-full" />
                </div>
              </div>
              <div className="w-full h-24 bg-zinc-100 rounded-3xl" />
            </div>
          ))
        ) : (
          posts.map((post) => (
            <motion.div
              key={post.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group relative space-y-4 p-6 rounded-[2.5rem] bg-white border border-black/5 hover:border-black/10 hover:shadow-2xl transition-all duration-500"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.5rem] pointer-events-none" />
              <div className="relative z-10 space-y-4">
                <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-100 overflow-hidden border border-black/5 shadow-sm transition-transform group-hover:scale-105">
                    {post.authorAvatar ? (
                      <img src={post.authorAvatar} alt={post.author} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full bg-black flex items-center justify-center text-white font-black text-xs">
                        {post.author[0]}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-black text-sm tracking-tight">{post.author}</p>
                    <p className="text-[9px] font-bold opacity-30 uppercase tracking-widest">
                      {new Date(post.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Global
                    </p>
                  </div>
                </div>
                {post.user_id === user.id && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => { setEditingPostId(post.id); setEditContent(post.content); }}
                      className="p-2 hover:bg-black/5 rounded-xl transition-colors"
                    >
                      <Edit3 size={16} className="text-black/30" />
                    </button>
                    <button 
                      onClick={() => handleDelete(post.id)}
                      className="p-2 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <Trash2 size={16} className="text-red-400/50" />
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-zinc-50 p-6 rounded-[2.5rem] border border-black/5 hover:border-black/10 transition-colors shadow-sm">
                {editingPostId === post.id ? (
                  <form onSubmit={handleUpdate} className="space-y-3">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full bg-white border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-black resize-none"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button type="submit" className="flex-1 bg-black text-white py-3 rounded-xl text-[9px] font-black uppercase tracking-widest">Save Changes</button>
                      <button type="button" onClick={() => setEditingPostId(null)} className="flex-1 bg-white border border-black/5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest">Cancel</button>
                    </div>
                  </form>
                ) : (
                  <p className="text-sm font-medium text-black/80 leading-relaxed">{post.content}</p>
                )}
              </div>

              <div className="flex items-center gap-8 px-2">
                <button 
                  onClick={() => handleLike(post.id)}
                  className="flex items-center gap-2 text-black/30 hover:text-black transition-all group/btn"
                >
                  <div className="p-2 rounded-xl group-hover/btn:bg-red-50 transition-colors">
                    <Heart size={20} className={cn("transition-transform", post.likes > 0 && "fill-red-500 text-red-500 scale-110")} />
                  </div>
                  <span className="text-xs font-black">{post.likes}</span>
                </button>
                <button 
                  onClick={() => toggleComments(post.id)}
                  className="flex items-center gap-2 text-black/30 hover:text-black transition-all group/btn"
                >
                  <div className="p-2 rounded-xl group-hover/btn:bg-blue-50 transition-colors">
                    <MessageCircle size={20} />
                  </div>
                  <span className="text-xs font-black">{post.comments || 0}</span>
                </button>
                <button 
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: 'IEA Post', text: post.content, url: window.location.href });
                    }
                  }}
                  className="ml-auto p-2 text-black/20 hover:text-black hover:bg-zinc-100 rounded-xl transition-all"
                >
                  <Share2 size={20} />
                </button>
              </div>

              <AnimatePresence>
                {activeComments === post.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden space-y-4 bg-zinc-50/50 p-6 rounded-[2rem] border border-black/5"
                  >
                    <div className="space-y-4 max-h-60 overflow-y-auto no-scrollbar">
                      {(comments[post.id] || []).length === 0 ? (
                        <p className="text-[10px] font-bold text-black/30 text-center py-4 uppercase tracking-widest">No comments yet</p>
                      ) : (
                        (comments[post.id] || []).map((c) => (
                          <div key={c.id} className="flex gap-3">
                            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white font-black text-[8px] flex-shrink-0">
                              {c.author[0]}
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] font-black tracking-tight">{c.author}</p>
                              <p className="text-xs text-black/60 font-medium">{c.content}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <form onSubmit={(e) => handleSendComment(e, post.id)} className="flex gap-2 pt-2">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add to the conversation..."
                        className="flex-1 bg-white border-none rounded-2xl px-5 py-3 text-xs font-bold focus:ring-2 focus:ring-black shadow-sm"
                      />
                      <button type="submit" className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all">
                        <Send size={18} />
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
