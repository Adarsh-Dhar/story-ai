export interface Message {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  model: 'deepseek' | 'gemini';
}

export interface ChatResponse {
  id: string;
  model: string;
  message: {
    role: string;
    content: string;
  };
  finish_reason: string;
}
