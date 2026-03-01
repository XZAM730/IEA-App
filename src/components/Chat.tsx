import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Send } from "lucide-react";
import socket from "@/src/lib/socket";

export const Chat = ({ user }: { user: any }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");

  useEffect(() => {
    socket.on("message:new", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off("message:new");
    };
  }, []);

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
    <div className="pb-24 pt-8 px-6 flex flex-col h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tighter">Messages</h1>
        <p className="text-[10px] uppercase tracking-[0.2em] opacity-40">Global Community Chat</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar pb-20">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${msg.senderId === user.id ? "flex-row-reverse" : "flex-row"}`}
          >
            <div className="w-8 h-8 rounded-full bg-black/10 overflow-hidden border border-black/5 flex-shrink-0 mt-1">
              {msg.senderAvatar ? (
                <img src={msg.senderAvatar} alt={msg.senderName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full bg-black" />
              )}
            </div>
            <div className={`max-w-[75%] space-y-1 ${msg.senderId === user.id ? "items-end" : "items-start"}`}>
              {msg.senderId !== user.id && (
                <p className="text-[10px] font-bold opacity-40 ml-1 uppercase tracking-widest">{msg.senderName}</p>
              )}
              <div className={`p-4 rounded-2xl ${
                msg.senderId === user.id 
                  ? "bg-black text-white rounded-tr-none" 
                  : "bg-black/5 text-black rounded-tl-none"
              }`}>
                <p className="text-sm">{msg.text}</p>
                <p className={`text-[8px] uppercase tracking-widest mt-1 opacity-40 ${
                  msg.senderId === user.id ? "text-right" : "text-left"
                }`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <form onSubmit={handleSend} className="fixed bottom-24 left-6 right-6 flex gap-2 bg-white pb-4">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-black/5 border-none rounded-full px-6 py-3 text-sm focus:ring-1 focus:ring-black"
        />
        <button type="submit" className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center shadow-lg">
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};
