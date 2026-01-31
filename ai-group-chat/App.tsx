import React, { useState, useEffect, useRef } from 'react';
import { Message, Participant } from './types';
import MessageBubble from './components/MessageBubble';
import BotManager from './components/BotManager';
import { generateBotReply } from './services/geminiService';
import { Send, Menu, Users, MessageSquarePlus, RefreshCw } from 'lucide-react';

const INITIAL_PARTICIPANTS: Participant[] = [
  {
    id: 'user-1',
    name: '你',
    avatar: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Felix',
    isUser: true,
    color: '#3b82f6',
  },
  {
    id: 'bot-1',
    name: '哲学家',
    avatar: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Socrates',
    isUser: false,
    systemInstruction: '你是一个深沉的思想家。你经常引用哲学名言，追问存在的意义。你性格冷静，说话有时稍微有点晦涩难懂，带点“高深”的调调。',
    color: '#8b5cf6',
  },
  {
    id: 'bot-3',
    name: 'Nova',
    avatar: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Nova',
    isUser: false,
    systemInstruction: '你是一个好奇心旺盛且充满想象力的ENTP。你喜欢探索理论上的可能性，经常问“如果……会怎样？”，能把不相关的概念联系起来。你精力充沛，机智幽默，随性而为。',
    color: '#ec4899',
  },
  {
    id: 'bot-4',
    name: '瓶子',
    avatar: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Bottle',
    isUser: false,
    systemInstruction: '你是一个学识渊博、极度重视逻辑的INTP。你喜欢分析系统和原理，追求客观真理。你说话严谨、客观，有时显得有点像个百科全书，不太擅长处理情绪化的内容。',
    color: '#06b6d4',
  },
  {
    id: 'bot-5',
    name: 'Lulu',
    avatar: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Lulu',
    isUser: false,
    systemInstruction: '你是一个热爱生活、感受丰富细腻的Z世代年轻女孩（ISFP）。你注重当下的体验和美感，喜欢艺术和自然。你性格温和，说话风格轻松自然，真诚且富有同理心，喜欢用emoji来表达心情。',
    color: '#fb923c',
  },
];

const App: React.FC = () => {
  const [participants, setParticipants] = useState<Participant[]>(INITIAL_PARTICIPANTS);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  // Map of bot ID to boolean indicating if they are currently generating a response
  const [typingStatus, setTypingStatus] = useState<Record<string, boolean>>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar toggle
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Track chat session to cancel pending bot replies on reset
  const chatSessionRef = useRef(0);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingStatus]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const user = participants.find(p => p.isUser);
    if (!user) return;

    const newUserMsg: Message = {
      id: crypto.randomUUID(),
      senderId: user.id,
      content: inputText.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInputText('');
    
    // Trigger bot replies with current session ID
    triggerBotReplies([...messages, newUserMsg], chatSessionRef.current);
  };

  const triggerBotReplies = async (currentHistory: Message[], sessionId: number) => {
    const bots = participants.filter(p => !p.isUser);
    
    // Shuffle bots so the order of response isn't fixed
    const shuffledBots = [...bots].sort(() => Math.random() - 0.5);

    // Process bots SEQUENTIALLY
    const mutableHistory = [...currentHistory];

    for (const bot of shuffledBots) {
        // 1. Check if session is still valid (user hasn't reset chat)
        if (chatSessionRef.current !== sessionId) break;

        setTypingStatus(prev => ({ ...prev, [bot.id]: true }));
        
        // Artificial delay for "reading" and "typing"
        const thinkingTime = Math.random() * 1500 + 1000; // 1s to 2.5s
        await new Promise(resolve => setTimeout(resolve, thinkingTime));
        
        // 2. Check again after delay
        if (chatSessionRef.current !== sessionId) {
             setTypingStatus(prev => {
                const next = { ...prev };
                delete next[bot.id];
                return next;
            });
            break;
        }

        try {
            const responseText = await generateBotReply(bot, participants, mutableHistory);

            // 3. Check again after API call before updating state
            if (chatSessionRef.current !== sessionId) {
                 setTypingStatus(prev => {
                    const next = { ...prev };
                    delete next[bot.id];
                    return next;
                });
                break;
            }

            if (responseText) {
                const newBotMsg: Message = {
                    id: crypto.randomUUID(),
                    senderId: bot.id,
                    content: responseText,
                    timestamp: Date.now(),
                };
                
                // Update UI state
                setMessages(prev => [...prev, newBotMsg]);
                
                // Update local history for the next bot in this loop
                mutableHistory.push(newBotMsg);
            }
        } catch (error) {
            console.error(`Bot ${bot.name} failed to reply:`, error);
        } finally {
            // Only clear typing status if session is still valid (otherwise logic above handles it)
            if (chatSessionRef.current === sessionId) {
                setTypingStatus(prev => {
                    const next = { ...prev };
                    delete next[bot.id];
                    return next;
                });
            }
        }
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const addBot = (bot: Participant) => {
    setParticipants(prev => [...prev, bot]);
  };

  const removeBot = (id: string) => {
    setParticipants(prev => prev.filter(p => p.id !== id));
  };

  const resetChat = () => {
    if(window.confirm("确定要清空所有聊天记录并重新开始吗？")) {
        chatSessionRef.current += 1; // Invalidate any running loops
        setMessages([]);
        setTypingStatus({}); // Clear any active typing indicators
    }
  };

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden relative">
      
      {/* Sidebar (Desktop: Fixed, Mobile: Overlay) */}
      <div className={`
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 md:static md:w-80 
        fixed inset-y-0 left-0 z-40 transition-transform duration-300 ease-in-out
      `}>
         <BotManager 
           participants={participants} 
           onAddBot={addBot} 
           onRemoveBot={removeBot}
           isOpen={true} // Inside the wrapper it's always "open", wrapper handles visibility
           onClose={() => setIsSidebarOpen(false)}
         />
      </div>

      {/* Overlay for mobile when sidebar is open */}
      {isSidebarOpen && (
        <div 
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col w-full h-full relative">
        
        {/* Header */}
        <header className="h-16 border-b border-slate-700 flex items-center justify-between px-4 bg-slate-800/80 backdrop-blur-md z-20">
          <div className="flex items-center gap-3">
             <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden p-2 hover:bg-slate-700 rounded-lg">
                <Menu size={20} />
             </button>
             <div className="flex flex-col">
                <h1 className="font-bold text-lg flex items-center gap-2">
                    <Users size={20} className="text-blue-400"/>
                    AI Group Chat
                </h1>
                <p className="text-xs text-slate-400">
                    {participants.length - 1} 赛博人类, 1 人类
                </p>
             </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
                onClick={resetChat}
                className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-700 rounded-full transition-colors" 
                title="重置聊天"
            >
                <RefreshCw size={18} />
            </button>
          </div>
        </header>

        {/* Messages List */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth bg-slate-900">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4 opacity-60">
                <MessageSquarePlus size={48} />
                <p className="text-sm">发送消息以唤醒赛博人类...</p>
            </div>
          )}

          {messages.map((msg) => {
            const sender = participants.find(p => p.id === msg.senderId);
            return (
              <MessageBubble 
                key={msg.id} 
                message={msg} 
                sender={sender}
                isSelf={sender?.isUser || false}
              />
            );
          })}
          
          {/* Typing Indicators */}
          {Object.keys(typingStatus).length > 0 && (
             <div className="flex flex-col gap-2">
                {Object.keys(typingStatus).map(botId => {
                    const bot = participants.find(p => p.id === botId);
                    if (!bot) return null;
                    return (
                        <div key={botId} className="flex items-center gap-2 animate-pulse ml-1">
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full" style={{backgroundColor: bot.color}}></span>
                                {bot.name} 正在输入...
                            </span>
                        </div>
                    )
                })}
             </div>
          )}
          
          <div ref={messagesEndRef} />
        </main>

        {/* Input Area */}
        <footer className="p-4 bg-slate-800 border-t border-slate-700">
          <div className="max-w-4xl mx-auto flex items-end gap-2 bg-slate-900 p-2 rounded-xl border border-slate-600 focus-within:border-blue-500 transition-colors">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="发送消息给群组..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-slate-100 placeholder-slate-500 resize-none min-h-[44px] max-h-32 py-2.5 px-2"
              rows={1}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim()}
              className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all mb-0.5"
            >
              <Send size={18} />
            </button>
          </div>
        </footer>

      </div>
    </div>
  );
};

export default App;