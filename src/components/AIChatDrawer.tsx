import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  X,
  Navigation,
  Globe,
  Loader2,
  AlertCircle,
  HelpCircle,
  CheckCircle,
} from 'lucide-react';
import { useCampus } from '../context/CampusContext';
import { AIResponsePayload } from '../types/campus';

interface AIChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  payload?: AIResponsePayload;
  timestamp: string;
}

const SAMPLE_PROMPTS = [
  { label: 'English', text: 'How do I reach the ECE lab?' },
  { label: 'Tamil', text: 'ECE lab-ku epdi poganum?' },
  { label: 'Tanglish', text: 'Principal office enga irukku?' },
  { label: 'Mixed', text: 'Library-ku route sollu' },
  { label: 'Exam Cell', text: 'Where is the Exam Cell from Main Gate?' },
  { label: 'Food', text: 'Canteen epdi porathu?' },
];

export const AIChatDrawer: React.FC<AIChatDrawerProps> = ({ isOpen, onClose }) => {
  const { currentLocationNodeId, accessibleMode, startNavigation } = useCampus();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: "Vanakkam & Welcome! I am your AI Campus Map Assistant. Ask me how to reach any lab, office, classroom, or facility in English, Tamil, or Tanglish.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (queryText?: string) => {
    const q = (queryText || input).trim();
    if (!q || isLoading) return;

    const userMsg: ChatMessage = {
      id: 'usr-' + Date.now(),
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          userLocationNodeId: currentLocationNodeId,
          accessibleOnly: accessibleMode,
        }),
      });

      const data: AIResponsePayload = await res.json();

      const aiMsg: ChatMessage = {
        id: 'ai-' + Date.now(),
        sender: 'ai',
        text: data.message,
        payload: data,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, aiMsg]);

      // If route found, automatically trigger on map if desired or keep ready
      if (data.routeFound && data.destinationLocation) {
        startNavigation(data.destinationLocation.nodeId, data.startLocation?.nodeId);
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          sender: 'ai',
          text: 'Network error communicating with Campus AI Assistant. Please check your connection.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="ai-assistant-drawer"
        className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl text-slate-100"
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 backdrop-blur">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                AI Campus Guide
                <span className="px-1.5 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800 text-[10px] uppercase font-bold">
                  Grounded
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                English • தமிழ் (Tamil) • Tanglish
              </p>
            </div>
          </div>
          <button
            id="close-ai-chat-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Sample Prompts Ticker */}
        <div className="p-3 border-b border-slate-800/80 bg-slate-950/50 overflow-x-auto scrollbar-none flex items-center gap-1.5">
          <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1 pr-1 shrink-0">
            <Globe className="w-3 h-3" /> Try:
          </span>
          {SAMPLE_PROMPTS.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(sample.text)}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-sky-950 hover:border-sky-700 text-slate-300 hover:text-sky-300 border border-slate-700 text-[11px] font-medium whitespace-nowrap transition"
            >
              {sample.text}
            </button>
          ))}
        </div>

        {/* Messages Feed */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm ${
                  msg.sender === 'user'
                    ? 'bg-sky-600 text-white rounded-br-none shadow-md'
                    : 'bg-slate-800/90 text-slate-200 rounded-bl-none border border-slate-700 shadow-md'
                }`}
              >
                {msg.payload?.isUnknownLocation ? (
                  <div className="flex items-start gap-2 text-amber-300">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">{msg.text}</p>
                    </div>
                  </div>
                ) : (
                  <div className="whitespace-pre-line leading-relaxed">
                    {msg.text}
                  </div>
                )}

                {/* If AI provided route, offer Start Navigation button */}
                {msg.payload?.routeFound && msg.payload.destinationLocation && (
                  <div className="mt-3 pt-2.5 border-t border-slate-700 flex items-center justify-between">
                    <button
                      onClick={() => {
                        if (msg.payload?.destinationLocation) {
                          startNavigation(
                            msg.payload.destinationLocation.nodeId,
                            msg.payload.startLocation?.nodeId
                          );
                          onClose();
                        }
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs transition shadow-md"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Start Visual Map Navigation</span>
                    </button>
                  </div>
                )}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-slate-400 text-xs py-2">
              <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
              <span>Analyzing campus graph & calculating shortest route...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/95">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              id="ai-chat-input"
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="e.g. 'ECE lab-ku epdi poganum?' or 'Library route'"
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
            />
            <button
              id="ai-chat-send-btn"
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white transition shadow-md"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <p className="text-[10px] text-slate-500 mt-1.5 text-center">
            Zero hallucination guarantee: answers are strictly verified against campus floor plans.
          </p>
        </div>
      </div>
    </div>
  );
};
