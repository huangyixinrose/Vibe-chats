import React from 'react';
import { Message, Participant } from '../types';
import Avatar from './Avatar';

interface MessageBubbleProps {
  message: Message;
  sender?: Participant;
  isSelf: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, sender, isSelf }) => {
  return (
    <div className={`flex w-full mb-4 ${isSelf ? 'justify-end' : 'justify-start'} group`}>
      {/* Avatar for others */}
      {!isSelf && (
        <div className="mr-3 flex flex-col items-center justify-end">
           <Avatar 
             src={sender?.avatar || ''} 
             alt={sender?.name || '?'} 
             color={sender?.color}
             size="sm"
           />
        </div>
      )}

      <div className={`flex flex-col max-w-[75%] md:max-w-[60%] ${isSelf ? 'items-end' : 'items-start'}`}>
        {!isSelf && sender && (
          <span className="text-xs text-slate-400 mb-1 ml-1" style={{ color: sender.color }}>
            {sender.name}
          </span>
        )}
        
        <div
          className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm leading-relaxed break-words whitespace-pre-wrap ${
            isSelf
              ? 'bg-blue-600 text-white rounded-tr-sm'
              : 'bg-slate-700 text-slate-100 rounded-tl-sm border border-slate-600'
          } ${message.isError ? 'border-red-500 bg-red-900/20' : ''}`}
        >
          {message.content}
        </div>
        
        {/* Timestamp - visible on hover */}
        <span className="text-[10px] text-slate-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};

export default MessageBubble;