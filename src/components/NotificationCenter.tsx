import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, Heart, MessageCircle, UserPlus, X, Check } from "lucide-react";
import socket from "@/src/lib/socket";

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
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="fixed inset-0 bg-white z-[100] p-6 flex flex-col"
    >
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tighter">Alerts</h1>
          <p className="text-[10px] uppercase tracking-[0.2em] opacity-40">Activity Stream</p>
        </div>
        <div className="flex gap-2">
          <button onClick={markAsRead} className="p-2 hover:bg-black/5 rounded-full transition-colors">
            <Check size={20} />
          </button>
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar">
        {notifications.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-20 space-y-4">
            <Bell size={48} strokeWidth={1} />
            <p className="text-xs uppercase tracking-widest font-bold">No activity yet</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div 
              key={n.id} 
              className={`flex items-center gap-4 p-4 rounded-2xl transition-colors ${n.is_read ? 'opacity-50' : 'bg-black/5'}`}
            >
              <div className="w-10 h-10 rounded-full bg-white border border-black/10 flex items-center justify-center flex-shrink-0">
                {getIcon(n.type)}
              </div>
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-bold">{n.from_name}</span>
                  {n.type === 'like' && " liked your post"}
                  {n.type === 'comment' && " commented on your post"}
                  {n.type === 'follow' && " started following you"}
                </p>
                <p className="text-[8px] uppercase tracking-widest opacity-40 mt-1">
                  {new Date(n.timestamp).toLocaleTimeString()}
                </p>
              </div>
              {!n.is_read && <div className="w-2 h-2 bg-black rounded-full" />}
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
};
