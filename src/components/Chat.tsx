import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, MessageSquare, Search, UserCheck, Camera, Mic, Square } from "lucide-react";
import socket from "@/src/lib/socket";
import { cn } from "@/src/lib/utils";

export const Chat = ({ user }: { user: any }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    fetch("/api/users/online")
      .then(res => res.json())
      .then(data => setOnlineCount(data.onlineCount));

    fetch("/api/users")
      .then(res => res.json())
      .then(data => setUsers(data.filter((u: any) => u.id !== user.id)));

    socket.on("message:new", (msg) => {
      setMessages((prev) => [...prev, msg]);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
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
  }, [user.id]);

  useEffect(() => {
    if (selectedUser) {
      const token = localStorage.getItem("iea_token");
      fetch(`/api/messages/${selectedUser.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          setMessages(data);
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        });
    } else {
      setMessages([]);
    }
  }, [selectedUser]);

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    socket.emit("chat:typing", { userId: user.id, isTyping: e.target.value.length > 0 });
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedUser) return;
    
    socket.emit("message:send", {
      senderId: user.id,
      receiverId: selectedUser.id,
      text: inputText
    });
    
    setInputText("");
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          socket.emit("message:send", {
            senderId: user.id,
            receiverId: selectedUser.id,
            text: "🎤 Voice Note",
            media_url: base64Audio,
            media_type: "audio"
          });
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleCamera = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => {
          socket.emit("message:send", {
            senderId: user.id,
            receiverId: selectedUser.id,
            text: "📷 Photo",
            media_url: reader.result as string,
            media_type: "image"
          });
        };
      }
    };
    input.click();
  };

  return (
    <div className="pb-24 pt-8 px-6 flex h-screen max-w-6xl mx-auto gap-6">
      {/* Sidebar */}
      <div className="w-1/3 flex flex-col gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter">Messages</h1>
          <p className="text-[10px] uppercase tracking-[0.4em] font-bold opacity-30">Direct Protocol</p>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar">
          {users.map(u => (
            <button
              key={u.id}
              onClick={() => setSelectedUser(u)}
              className={cn(
                "w-full flex items-center gap-3 p-4 rounded-2xl transition-all text-left",
                selectedUser?.id === u.id ? "bg-black text-white shadow-lg scale-[1.02]" : "bg-zinc-50 hover:bg-zinc-100 text-black"
              )}
            >
              <div className="w-10 h-10 rounded-xl bg-zinc-200 overflow-hidden flex-shrink-0">
                {u.avatar_url ? (
                  <img src={u.avatar_url} alt={u.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-black/20"><UserCheck size={16} /></div>
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-black truncate">{u.name}</p>
                <p className={cn("text-[9px] font-bold uppercase tracking-widest truncate", selectedUser?.id === u.id ? "opacity-50" : "opacity-30")}>{u.id_number}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-zinc-50 rounded-[2.5rem] border border-black/5 overflow-hidden relative">
        {selectedUser ? (
          <>
            <div className="p-6 border-b border-black/5 flex justify-between items-center bg-white/50 backdrop-blur-md z-10 absolute top-0 left-0 right-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-100 overflow-hidden">
                  {selectedUser.avatar_url ? (
                    <img src={selectedUser.avatar_url} alt={selectedUser.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-black/20"><UserCheck size={16} /></div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-black">{selectedUser.name}</p>
                  <p className="text-[9px] font-bold uppercase tracking-widest opacity-30">Encrypted Channel</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 pt-24 space-y-6 no-scrollbar">
              {messages.filter(m => (m.senderId === user.id && m.receiverId === selectedUser.id) || (m.senderId === selectedUser.id && m.receiverId === user.id)).length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-20">
                  <MessageSquare size={48} strokeWidth={1} />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">Start Transmission</p>
                </div>
              ) : (
                messages.filter(m => (m.senderId === user.id && m.receiverId === selectedUser.id) || (m.senderId === selectedUser.id && m.receiverId === user.id)).map((msg, idx, arr) => {
                  const isMe = msg.senderId === user.id;
                  const showAvatar = idx === 0 || arr[idx - 1].senderId !== msg.senderId;
                  
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
                            {msg.senderName?.[0]}
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
                            : "bg-white text-black rounded-[2rem] rounded-bl-none hover:bg-zinc-100 border border-black/5"
                        )}>
                          {msg.media_type === 'image' && msg.media_url && (
                            <img src={msg.media_url} alt="Photo" className="w-full max-w-[200px] rounded-xl mb-2" />
                          )}
                          {msg.media_type === 'audio' && msg.media_url && (
                            <audio src={msg.media_url} controls className="w-full max-w-[200px] mb-2 h-8" />
                          )}
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
              {typingUsers.includes(selectedUser.id) && (
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
              <div ref={messagesEndRef} />
            </div>

            <div className="p-6 bg-white/50 backdrop-blur-md border-t border-black/5 absolute bottom-0 left-0 right-0 z-10">
              <form onSubmit={handleSend} className="relative flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCamera}
                  className="w-12 h-12 bg-white border border-black/10 rounded-2xl flex items-center justify-center hover:bg-zinc-50 transition-colors flex-shrink-0"
                >
                  <Camera size={20} className="opacity-50" />
                </button>
                <button
                  type="button"
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onMouseLeave={stopRecording}
                  onTouchStart={startRecording}
                  onTouchEnd={stopRecording}
                  className={cn(
                    "w-12 h-12 border border-black/10 rounded-2xl flex items-center justify-center transition-all flex-shrink-0",
                    isRecording ? "bg-red-500 text-white border-red-500 animate-pulse" : "bg-white hover:bg-zinc-50 text-black opacity-50"
                  )}
                >
                  {isRecording ? <Square size={20} className="fill-current" /> : <Mic size={20} />}
                </button>
                <div className="relative flex-1 group">
                  <div className="absolute inset-0 bg-gradient-to-r from-black/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  <input
                    type="text"
                    value={inputText}
                    onChange={handleTyping}
                    placeholder={isRecording ? "Recording..." : "Type your message..."}
                    disabled={isRecording}
                    className="w-full bg-white border border-black/10 rounded-2xl pl-6 pr-16 py-4 text-sm font-medium focus:ring-2 focus:ring-black transition-all shadow-sm disabled:opacity-50"
                  />
                  <button 
                    type="submit"
                    disabled={!inputText.trim() || isRecording}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
                  >
                    <Send size={16} className="ml-1" />
                  </button>
                </div>
              </form>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-20">
            <MessageSquare size={48} strokeWidth={1} />
            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Select a user to start</p>
          </div>
        )}
      </div>
    </div>
  );
};
