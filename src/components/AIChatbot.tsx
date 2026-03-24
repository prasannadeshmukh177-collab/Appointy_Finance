import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  X, 
  Send, 
  Sparkles, 
  Bot, 
  User as UserIcon,
  Loader2,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";
import { cn } from '../lib/utils';
import { format, addDays, startOfToday } from 'date-fns';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  status?: 'loading' | 'success' | 'error';
}

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your Compliance Assistant. You can tell me things like 'Need to file Singapore GST by next Friday' and I'll set it up for you."
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const model = "gemini-3-flash-preview";
      
      const today = format(new Date(), 'yyyy-MM-dd');
      const dayOfWeek = format(new Date(), 'EEEE');

      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [{ text: input }]
          }
        ],
        config: {
          systemInstruction: `You are a helpful Compliance Assistant. Your job is to extract task details from user input and create tasks.
          Today is ${today} (${dayOfWeek}).
          When a user wants to create a task, use the 'create_task' tool.
          If the user is vague, ask for more details.
          Always respond politely in an iOS-style friendly tone.`,
          tools: [{
            functionDeclarations: [{
              name: "create_task",
              description: "Create a new compliance task in the database",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "The title of the task" },
                  description: { type: Type.STRING, description: "A detailed description" },
                  due_date: { type: Type.STRING, description: "The due date in YYYY-MM-DD format" },
                  assignee: { type: Type.STRING, description: "The person assigned to the task" },
                  priority: { 
                    type: Type.STRING, 
                    enum: ["low", "medium", "high", "critical"],
                    description: "The priority level"
                  },
                  category: { 
                    type: Type.STRING, 
                    description: "The compliance category (e.g., Finance, Payroll, Singapore compliance, etc.)" 
                  },
                  recurrence_frequency: {
                    type: Type.STRING,
                    enum: ["none", "daily", "weekly", "monthly", "quarterly", "yearly"],
                    description: "How often the task should repeat"
                  }
                },
                required: ["title", "due_date"]
              }
            }]
          }]
        }
      });

      const functionCalls = response.functionCalls;
      
      if (functionCalls && functionCalls.length > 0) {
        const call = functionCalls[0];
        if (call.name === 'create_task') {
          const args = call.args as any;
          
          // Call the actual API
          const apiResponse = await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...args,
              date: args.due_date, // Use due_date as the calendar date
              status: 'pending',
              subtasks: []
            })
          });

          if (apiResponse.ok) {
            setMessages(prev => [...prev, {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content: `✅ Done! I've created the task "${args.title}" due on ${args.due_date}${args.assignee ? ` assigned to ${args.assignee}` : ''}.`,
              status: 'success'
            }]);
            // Trigger a global event to refresh views if needed
            window.dispatchEvent(new CustomEvent('task-created'));
          } else {
            throw new Error('Failed to save task to database');
          }
        }
      } else {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.text || "I'm sorry, I couldn't process that. Could you be more specific?"
        }]);
      }
    } catch (error) {
      console.error('AI Error:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I ran into an issue while processing your request. Please try again.",
        status: 'error'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-20 right-0 w-[380px] h-[520px] bg-white rounded-[28px] shadow-2xl border border-[#E5E5EA] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-4 bg-white border-b border-[#F2F2F7] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#007AFF] rounded-full flex items-center justify-center shadow-lg shadow-[#007AFF]/20">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-black">Compliance AI</h3>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[11px] text-[#8E8E93] font-medium">Online</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-[#F2F2F7] rounded-full transition-colors text-[#8E8E93]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-[#F9F9F9]/50"
            >
              {messages.map((msg) => (
                <div 
                  key={msg.id}
                  className={cn(
                    "flex flex-col max-w-[85%]",
                    msg.role === 'user' ? "ml-auto items-end" : "items-start"
                  )}
                >
                  <div className={cn(
                    "px-4 py-3 rounded-[20px] text-[14px] leading-relaxed shadow-sm",
                    msg.role === 'user' 
                      ? "bg-[#007AFF] text-white rounded-tr-none" 
                      : "bg-white text-black border border-[#F2F2F7] rounded-tl-none"
                  )}>
                    {msg.content}
                  </div>
                  {msg.status === 'success' && (
                    <div className="flex items-center gap-1 mt-1 text-[11px] text-emerald-600 font-bold uppercase tracking-wider">
                      <CheckCircle2 className="w-3 h-3" />
                      Task Created
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start gap-2">
                  <div className="bg-white border border-[#F2F2F7] px-4 py-3 rounded-[20px] rounded-tl-none shadow-sm">
                    <Loader2 className="w-4 h-4 text-[#007AFF] animate-spin" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-[#F2F2F7]">
              <div className="relative flex items-center">
                <input 
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Ask AI to create a task..."
                  className="w-full pl-4 pr-12 py-3 bg-[#F2F2F7] rounded-full text-[14px] outline-none focus:ring-2 ring-[#007AFF]/10 transition-all placeholder:text-[#8E8E93]"
                />
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-1.5 p-2 bg-[#007AFF] text-white rounded-full disabled:opacity-30 transition-all hover:bg-[#0062CC]"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90",
          isOpen ? "bg-white text-black border border-[#E5E5EA]" : "bg-[#007AFF] text-white"
        )}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
        {!isOpen && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF3B30] rounded-full border-2 border-white" />
        )}
      </button>
    </div>
  );
}
