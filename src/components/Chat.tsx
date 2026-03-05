import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Send, MessageSquare } from "lucide-react";
import socket from "@/src/lib/socket";
import { cn } from "@/src/lib/utils";

export const Chat = ({ user }: { user: any }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    fetch("/api/users/online")
      .then(res => res.json())
      .then(data => setOnlineCount(data.onlineCount));

    socket.on("message:new", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("chat:typing_update", ({ userId, isTyping }) => {
      if (isTyping) {
        setTypingUsers(prev => prev.includes(userId) ? prev : [...prev, userId]);
      } else {
        setTypingUsers(prev => prev.filter(id => id !== userId));
      }
    });

    socket.on("user:status_change", ({ onlineCount }) => {
      setOnlineCount(onlineCount);
    });

    return () => {
      socket.off("message:new");
      socket.off("chat:typing_update");
      socket.off("user:status_change");
    };
  }, []);

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    socket.emit("chat:typing", { userId: user.id, isTyping: e.target.value.length > 0 });
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    socket.emit("message:send", {
      senderId: user.id,
      receiverId: "global", // For demo purposes, everyone is in one global chat
      text: inputText
    });
    
    setInputText("");
  };

  return (
    <div className="pb-32 pt-10 px-6 flex flex-col h-screen max-w-2xl mx-auto">
      <div className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-black tracking-tighter">Messages</h1>
          <p className="text-[10px] uppercase tracking-[0.4em] font-bold opacity-30">Global Community Protocol</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-full">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">{onlineCount} Online</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 no-scrollbar pb-10">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-20">
            <MessageSquare size={48} strokeWidth={1} />
            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Secure Channel Established</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.senderId === user.id;
            const showAvatar = idx === 0 || messages[idx - 1].senderId !== msg.senderId;
            
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: isMe ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "flex gap-3 items-end group",
                  isMe ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-xl overflow-hidden border border-black/5 flex-shrink-0 transition-all duration-500",
                  showAvatar ? "opacity-100 scale-100" : "opacity-0 scale-0",
                  isMe ? "bg-zinc-800" : "bg-zinc-100"
                )}>
                  {msg.senderAvatar ? (
                    <img src={msg.senderAvatar} alt={msg.senderName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-black text-[10px]">
                      {msg.senderName[0]}
                    </div>
                  )}
                </div>
                
                <div className={cn(
                  "max-w-[80%] space-y-1",
                  isMe ? "items-end" : "items-start"
                )}>
                  {showAvatar && !isMe && (
                    <p className="text-[9px] font-black opacity-30 ml-2 uppercase tracking-widest">{msg.senderName}</p>
                  )}
                  <div className={cn(
                    "px-5 py-4 shadow-sm transition-all duration-300",
                    isMe 
                      ? "bg-black text-white rounded-[2rem] rounded-br-none hover:bg-zinc-900" 
                      : "bg-zinc-100 text-black rounded-[2rem] rounded-bl-none hover:bg-zinc-200"
                  )}>
                    <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                  </div>
                  <p className={cn(
                    "text-[8px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-30 transition-opacity px-2",
                    isMe ? "text-right" : "text-left"
                  )}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            );
          })
        )}
        {typingUsers.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-12"
          >
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-black/20 rounded-full animate-bounce" />
              <div className="w-1 h-1 bg-black/20 rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-1 h-1 bg-black/20 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest opacity-20">Transmission in progress...</span>
          </motion.div>
        )}
      </div>

      <div className="fixed bottom-28 left-6 right-6 max-w-2xl mx-auto">
        <form onSubmit={handleSend} className="relative group">
          <div className="absolute inset-0 bg-black/5 rounded-[2.5rem] blur-xl group-focus-within:bg-black/10 transition-all duration-500" />
          <input
            type="text"
            value={inputText}
            onChange={handleTyping}
            placeholder="Secure message..."
            className="relative w-full bg-white/80 backdrop-blur-xl border border-black/5 rounded-[2rem] pl-8 pr-20 py-6 text-sm font-bold focus:ring-2 focus:ring-black shadow-2xl transition-all placeholder:opacity-20"
          />
          <button 
            type="submit" 
            className="absolute right-3 top-1/2 -translate-y-1/2 w-14 h-14 bg-black text-white rounded-[1.5rem] flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all group/btn"
          >
            <Send size={22} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </button>
        </form>
      </div>
    </div>
  );
};
