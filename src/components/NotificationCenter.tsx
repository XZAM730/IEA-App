import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, Heart, MessageCircle, UserPlus, X, Check } from "lucide-react";
import socket from "@/src/lib/socket";
import { cn } from "@/src/lib/utils";

export const NotificationCenter = ({ user, onClose }: { user: any, onClose: () => void }) => {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    fetch(`/api/notifications/${user.id}`)
      .then(res => res.json())
      .then(setNotifications);

    const handleNewNotification = (notif: any) => {
      if (notif.user_id === user.id) {
        setNotifications(prev => [notif, ...prev]);
      }
    };

    socket.on("notification:new", handleNewNotification);
    return () => { socket.off("notification:new"); };
  }, [user.id]);

  const markAsRead = () => {
    fetch(`/api/notifications/${user.id}/read`, { method: "POST" });
    setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart size={14} className="text-black" />;
      case 'comment': return <MessageCircle size={14} className="text-black" />;
      case 'follow': return <UserPlus size={14} className="text-black" />;
      default: return <Bell size={14} className="text-black" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: "100%" }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 bg-white z-[100] flex flex-col"
    >
      <div className="flex justify-between items-center px-8 pt-12 pb-8">
        <div>
          <h1 className="text-5xl font-black tracking-tighter">Activity</h1>
          <p className="text-[10px] uppercase tracking-[0.4em] font-bold opacity-30">Real-time Protocol</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={markAsRead} 
            className="w-12 h-12 flex items-center justify-center bg-zinc-100 hover:bg-black hover:text-white rounded-2xl transition-all duration-300 group"
            title="Mark all as read"
          >
            <Check size={20} className="group-hover:scale-110 transition-transform" />
          </button>
          <button 
            onClick={onClose} 
            className="w-12 h-12 flex items-center justify-center bg-zinc-100 hover:bg-black hover:text-white rounded-2xl transition-all duration-300 group"
          >
            <X size={20} className="group-hover:rotate-90 transition-transform" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 space-y-4 no-scrollbar pb-12">
        {notifications.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center space-y-6 opacity-20">
            <div className="w-24 h-24 bg-zinc-100 rounded-[2.5rem] flex items-center justify-center">
              <Bell size={48} strokeWidth={1} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em]">System State: Clear</p>
          </div>
        ) : (
          notifications.map((n, idx) => (
            <motion.div 
              key={n.id} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={cn(
                "flex items-center gap-5 p-6 rounded-[2rem] transition-all duration-500 group relative overflow-hidden",
                n.is_read ? 'opacity-40 grayscale' : 'bg-zinc-50 hover:bg-zinc-100 shadow-sm'
              )}
            >
              <div className="w-14 h-14 rounded-2xl bg-white border border-black/5 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-md group-hover:scale-110 transition-transform duration-500">
                {n.from_avatar_url ? (
                  <img src={n.from_avatar_url} alt={n.from_name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full bg-black flex items-center justify-center text-white font-black text-xs">
                    {n.from_name[0]}
                  </div>
                )}
              </div>
              
              <div className="flex-1 space-y-1">
                <p className="text-sm font-bold leading-tight">
                  <span className="font-black text-black">{n.from_name}</span>
                  <span className="text-zinc-500 font-medium">
                    {n.type === 'like' && " endorsed your broadcast"}
                    {n.type === 'comment' && " transmitted a response"}
                    {n.type === 'follow' && " established a connection"}
                  </span>
                </p>
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-black/5 rounded-md">
                    {getIcon(n.type)}
                  </div>
                  <p className="text-[8px] font-black uppercase tracking-widest opacity-30">
                    {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              {!n.is_read && (
                <div className="w-2 h-2 bg-black rounded-full shadow-[0_0_10px_rgba(0,0,0,0.3)]" />
              )}
              
              {/* Subtle background accent */}
              <div className="absolute -right-4 -bottom-4 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 pointer-events-none">
                {getIcon(n.type)}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
};
