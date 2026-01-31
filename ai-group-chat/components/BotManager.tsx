import React, { useState } from 'react';
import { Participant } from '../types';
import Avatar from './Avatar';
import { Plus, X, Settings2, Trash2 } from 'lucide-react';

interface BotManagerProps {
  participants: Participant[];
  onAddBot: (bot: Participant) => void;
  onRemoveBot: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

// Consistent art style using DiceBear Adventurer collection
const PRESET_AVATARS = [
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Alex",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Sarah",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Max",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Luna",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Oliver",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Zoe",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Milo",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Chloe",
];

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#8b5cf6', '#d946ef'
];

const BotManager: React.FC<BotManagerProps> = ({ participants, onAddBot, onRemoveBot, isOpen, onClose }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newBotName, setNewBotName] = useState('');
  const [newBotPrompt, setNewBotPrompt] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(PRESET_AVATARS[0]);

  const handleCreateBot = () => {
    if (!newBotName.trim() || !newBotPrompt.trim()) return;

    const newBot: Participant = {
      id: crypto.randomUUID(),
      name: newBotName.trim(),
      avatar: selectedAvatar,
      isUser: false,
      systemInstruction: newBotPrompt.trim(),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    };

    onAddBot(newBot);
    setNewBotName('');
    setNewBotPrompt('');
    setIsAdding(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 left-0 w-80 bg-slate-800 border-r border-slate-700 shadow-2xl transform transition-transform z-50 flex flex-col">
      <div className="p-4 border-b border-slate-700 flex justify-between items-center">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <Settings2 size={18} /> Group Members
        </h2>
        <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded-md md:hidden">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* User Self */}
        <div className="flex items-center gap-3 p-2 bg-slate-700/50 rounded-lg opacity-75">
          {participants.find(p => p.isUser) && (
            <>
              <Avatar 
                src={participants.find(p => p.isUser)!.avatar} 
                alt="Me" 
                size="sm"
                className="border-blue-500"
              />
              <div className="flex-1">
                <p className="font-medium text-sm">You</p>
                <p className="text-xs text-slate-400">Human User</p>
              </div>
            </>
          )}
        </div>

        {/* Bot List */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">赛博人类 (Cyber Humans)</h3>
          {participants.filter(p => !p.isUser).map(bot => (
            <div key={bot.id} className="flex items-center gap-3 p-2 bg-slate-700/30 rounded-lg border border-slate-700/50 hover:border-slate-600 group">
              <Avatar src={bot.avatar} alt={bot.name} size="sm" color={bot.color} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate" style={{color: bot.color}}>{bot.name}</p>
                <p className="text-xs text-slate-400 truncate">{bot.systemInstruction}</p>
              </div>
              <button 
                onClick={() => onRemoveBot(bot.id)}
                className="p-1.5 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove Bot"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Add Bot Form */}
        {isAdding ? (
          <div className="bg-slate-700/50 p-3 rounded-lg border border-slate-600 space-y-3 animate-in fade-in slide-in-from-left-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">New Persona</span>
              <button onClick={() => setIsAdding(false)}><X size={14}/></button>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Name</label>
              <input 
                value={newBotName}
                onChange={e => setNewBotName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
                placeholder="e.g. Yoda"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400">Persona / System Prompt</label>
              <textarea 
                value={newBotPrompt}
                onChange={e => setNewBotPrompt(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500 min-h-[60px]"
                placeholder="e.g. Speaks in riddles, wise..."
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400">Avatar</label>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {PRESET_AVATARS.map((url, i) => (
                  <button 
                    key={i}
                    onClick={() => setSelectedAvatar(url)}
                    className={`rounded-full p-0.5 border-2 transition-all ${selectedAvatar === url ? 'border-blue-500 scale-110' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <img src={url} className="w-6 h-6 rounded-full" />
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={handleCreateBot}
              disabled={!newBotName || !newBotPrompt}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium py-2 rounded transition-colors"
            >
              Create Bot
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setIsAdding(true)}
            className="w-full py-2 border-2 border-dashed border-slate-700 hover:border-slate-500 text-slate-500 hover:text-slate-300 rounded-lg flex items-center justify-center gap-2 text-sm transition-all"
          >
            <Plus size={16} /> Add New Bot
          </button>
        )}
      </div>

      <div className="p-4 border-t border-slate-700 text-xs text-slate-500 text-center">
        Powered by Gemini 3 Flash
      </div>
    </div>
  );
};

export default BotManager;