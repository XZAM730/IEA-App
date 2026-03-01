import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Heart, MessageCircle, Share2, Plus, Send, MoreHorizontal, Trash2, Edit3 } from "lucide-react";
import socket from "@/src/lib/socket";

export const HomeFeed = ({ user }: { user: any }) => {
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
  };

  const handleLike = (postId: string) => {
    socket.emit("post:like", { userId: user.id, postId });
  };

  const handleDelete = (postId: string) => {
    if (confirm("Are you sure you want to delete this post?")) {
      socket.emit("post:delete", { userId: user.id, postId });
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
    <div className="pb-24 pt-8 px-6 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter">Feed</h1>
          <p className="text-[10px] uppercase tracking-[0.2em] opacity-40">Community Updates</p>
        </div>
        <button 
          onClick={() => setShowCreate(!showCreate)}
          className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center shadow-lg"
        >
          <Plus size={24} className={showCreate ? "rotate-45 transition-transform" : "transition-transform"} />
        </button>
      </div>

      {/* Trending Section */}
      <div className="overflow-x-auto no-scrollbar flex gap-4 pb-2">
        {['#DigitalIdentity', '#IEA2026', '#Minimalism', '#Web3', '#Privacy'].map((tag) => (
          <div key={tag} className="flex-shrink-0 bg-black/5 px-4 py-2 rounded-full border border-black/5">
            <p className="text-[10px] font-bold tracking-tight">{tag}</p>
          </div>
        ))}
      </div>

      {showCreate && (
        <motion.form 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleCreatePost} 
          className="space-y-4 bg-black/5 p-4 rounded-2xl"
        >
          <textarea
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full bg-transparent border-none focus:ring-0 text-sm resize-none"
            rows={3}
          />
          <button type="submit" className="w-full bg-black text-white py-2 rounded-xl text-xs font-bold uppercase tracking-widest">
            Post
          </button>
        </motion.form>
      )}

      <div className="space-y-6">
        {posts.map((post) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="border border-black/5 rounded-2xl p-6 space-y-4 bg-white shadow-sm relative group"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-black" />
                <div>
                  <p className="font-bold text-sm tracking-tight">{post.author}</p>
                  <p className="text-[10px] opacity-40 uppercase tracking-widest">
                    {new Date(post.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              {post.user_id === user.id && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setEditingPostId(post.id); setEditContent(post.content); }}
                    className="p-2 hover:bg-black/5 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Edit3 size={16} className="text-black/40" />
                  </button>
                  <button 
                    onClick={() => handleDelete(post.id)}
                    className="p-2 hover:bg-black/5 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} className="text-black/40" />
                  </button>
                </div>
              )}
            </div>

            {editingPostId === post.id ? (
              <form onSubmit={handleUpdate} className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full bg-black/5 border-none rounded-xl p-3 text-sm focus:ring-1 focus:ring-black"
                  rows={2}
                />
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 bg-black text-white py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest">Save</button>
                  <button type="button" onClick={() => setEditingPostId(null)} className="flex-1 border border-black/10 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest">Cancel</button>
                </div>
              </form>
            ) : (
              <p className="text-black/80 leading-relaxed">{post.content}</p>
            )}

            <div className="flex items-center gap-6 pt-2">
              <button 
                onClick={() => handleLike(post.id)}
                className="flex items-center gap-1.5 text-black/40 hover:text-black transition-colors"
              >
                <Heart size={18} />
                <span className="text-xs font-bold">{post.likes}</span>
              </button>
              <button 
                onClick={() => toggleComments(post.id)}
                className="flex items-center gap-1.5 text-black/40 hover:text-black transition-colors"
              >
                <MessageCircle size={18} />
                <span className="text-xs font-bold">{post.comments || 0}</span>
              </button>
              <button 
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: 'IEA Post',
                      text: post.content,
                      url: window.location.href,
                    });
                  }
                }}
                className="flex items-center gap-1.5 text-black/40 hover:text-black transition-colors ml-auto"
              >
                <Share2 size={18} />
              </button>
            </div>

            <AnimatePresence>
              {activeComments === post.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden pt-4 space-y-4 border-t border-black/5"
                >
                  <div className="space-y-3 max-h-48 overflow-y-auto no-scrollbar">
                    {(comments[post.id] || []).map((c) => (
                      <div key={c.id} className="text-xs">
                        <span className="font-bold mr-2">{c.author}</span>
                        <span className="text-black/60">{c.content}</span>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={(e) => handleSendComment(e, post.id)} className="flex gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write a comment..."
                      className="flex-1 bg-black/5 border-none rounded-full px-4 py-2 text-xs focus:ring-1 focus:ring-black"
                    />
                    <button type="submit" className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center">
                      <Send size={14} />
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
