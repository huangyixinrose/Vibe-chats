export interface Participant {
  id: string;
  name: string;
  avatar: string; // URL to image
  isUser: boolean;
  systemInstruction?: string; // Only for bots
  color: string; // For UI distinction
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: number;
  isError?: boolean;
}

export interface ChatState {
  messages: Message[];
  isTyping: Record<string, boolean>; // map of participantId -> boolean
}
