import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Video, Mic, MicOff, VideoOff, Users, MessageSquare, Send } from "lucide-react";
import socket from "@/src/lib/socket";
import { cn } from "@/src/lib/utils";

export const Live = ({ user }: { user: any }) => {
  const [isLive, setIsLive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [viewers, setViewers] = useState(0);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socket.on("live:message", (msg) => {
      setMessages(prev => [...prev, msg]);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });

    socket.on("live:viewers", (count) => {
      setViewers(count);
    });

    return () => {
      socket.off("live:message");
      socket.off("live:viewers");
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startLive = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsLive(true);
      socket.emit("live:start", { userId: user.id });
    } catch (err) {
      console.error("Error accessing media devices:", err);
      alert("Could not access camera or microphone");
    }
  };

  const endLive = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsLive(false);
    socket.emit("live:end", { userId: user.id });
  };

  const toggleMute = () => {
    if (stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    socket.emit("live:message_send", {
      senderId: user.id,
      senderName: user.name,
      text: inputText
    });
    
    setInputText("");
  };

  return (
    <div className="pb-24 pt-8 px-4 md:px-6 flex flex-col md:flex-row h-screen max-w-6xl mx-auto gap-6">
      {/* Main Live Area */}
      <div className="flex-1 flex flex-col gap-4 min-h-[50vh] md:min-h-0">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black tracking-tighter">Live Broadcast</h1>
            <p className="text-[10px] uppercase tracking-[0.4em] font-bold opacity-30">Global Transmission</p>
          </div>
          {isLive && (
            <div className="flex items-center gap-2 bg-red-500/10 px-3 py-1.5 rounded-full">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              <span className="text-[9px] font-black text-red-600 uppercase tracking-widest">LIVE</span>
            </div>
          )}
        </div>

        <div className="flex-1 bg-black rounded-[2.5rem] overflow-hidden relative group">
          {isLive ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={cn("w-full h-full object-cover transition-opacity duration-500", isVideoOff ? "opacity-0" : "opacity-100")}
              />
              {isVideoOff && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center text-white text-3xl font-black">
                    {user.name[0]}
                  </div>
                </div>
              )}
              
              <div className="absolute top-6 left-6 flex gap-2">
                <div className="bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 text-white">
                  <Users size={12} />
                  <span className="text-[10px] font-bold">{viewers}</span>
                </div>
              </div>

              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={toggleMute}
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md transition-all",
                    isMuted ? "bg-red-500 text-white" : "bg-white/20 text-white hover:bg-white/30"
                  )}
                >
                  {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
                <button
                  onClick={endLive}
                  className="px-6 h-12 rounded-full bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors"
                >
                  End Stream
                </button>
                <button
                  onClick={toggleVideo}
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md transition-all",
                    isVideoOff ? "bg-red-500 text-white" : "bg-white/20 text-white hover:bg-white/30"
                  )}
                >
                  {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
                </button>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-6">
              <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center text-white">
                <Video size={32} />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-white font-bold text-xl">Start your broadcast</h3>
                <p className="text-white/50 text-sm max-w-xs">Share your thoughts, skills, and experiences with the global community in real-time.</p>
              </div>
              <button
                onClick={startLive}
                className="px-8 py-4 bg-white text-black rounded-full font-bold hover:scale-105 active:scale-95 transition-all"
              >
                Go Live Now
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Live Chat Sidebar */}
      <div className="w-full md:w-80 flex flex-col bg-zinc-50 rounded-[2.5rem] border border-black/5 overflow-hidden flex-1 md:flex-none">
        <div className="p-4 md:p-6 border-b border-black/5 bg-white/50 backdrop-blur-md">
          <h2 className="font-black flex items-center gap-2">
            <MessageSquare size={16} />
            Live Chat
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white p-3 rounded-2xl shadow-sm border border-black/5"
            >
              <p className="text-[10px] font-black opacity-30 uppercase tracking-widest mb-1">{msg.senderName}</p>
              <p className="text-sm font-medium">{msg.text}</p>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-white/50 backdrop-blur-md border-t border-black/5">
          <form onSubmit={handleSend} className="relative">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Say something..."
              disabled={!isLive}
              className="w-full bg-white border border-black/10 rounded-xl pl-4 pr-12 py-3 text-sm font-medium focus:ring-2 focus:ring-black transition-all shadow-sm disabled:opacity-50"
            />
            <button 
              type="submit"
              disabled={!inputText.trim() || !isLive}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
            >
              <Send size={14} className="ml-0.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
